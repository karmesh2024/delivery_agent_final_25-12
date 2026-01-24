/**
 * API Route: Scheduled Ads M3U
 * توليد ملف M3U للإعلانات المجدولة
 * 
 * يفصل الإعلانات عن المحتوى العادي لتمكين Liquidsoap
 * من التعامل معها بشكل منفصل مع أولوية أعلى
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types
interface RadioContent {
  id: string;
  title: string;
  content_type: 'clip' | 'music' | 'ad' | 'announcement';
  file_url: string;
  file_duration_seconds: number;
  metadata: {
    tags?: string[];
    allow_music_overlay?: boolean;
    priority?: 'low' | 'medium' | 'high';
  };
  is_active: boolean;
}

interface PlaylistTimelineItem {
  id: string;
  content_id: string;
  play_order: number;
  scheduled_time?: string;
  play_rule?: 'every_30_minutes' | 'hourly' | 'daily' | 'once' | 'continuous';
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  content?: RadioContent;
}

// Create Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

/**
 * توليد محتوى M3U للإعلانات
 */
function generateAdsM3UContent(items: PlaylistTimelineItem[]): string {
  const lines: string[] = ['#EXTM3U'];
  
  for (const item of items) {
    if (!item.content || !item.content.is_active) continue;
    
    const content = item.content;
    const duration = content.file_duration_seconds || -1;
    const title = content.title || 'Ad';
    
    // M3U Extended Format
    lines.push(`#EXTINF:${duration},${title}`);
    lines.push(content.file_url);
  }
  
  return lines.join('\n');
}

/**
 * جلب الإعلانات المجدولة للوقت الحالي
 */
function getScheduledAds(items: PlaylistTimelineItem[], currentTime: Date): PlaylistTimelineItem[] {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

  const scheduledAds: PlaylistTimelineItem[] = [];

  for (const item of items) {
    // تصفية الإعلانات فقط
    if (!item.content || !item.content.is_active) continue;
    if (item.content.content_type !== 'ad') continue;

    let shouldInclude = false;

    switch (item.play_rule) {
      case 'every_30_minutes':
        shouldInclude = currentMinute === 0 || currentMinute === 30;
        break;

      case 'hourly':
        shouldInclude = currentMinute === 0;
        break;

      case 'daily':
        shouldInclude = item.scheduled_time === currentTimeString;
        break;

      case 'once':
        shouldInclude = item.scheduled_time === currentTimeString;
        break;

      case 'continuous':
        // الإعلانات المستمرة تدخل في التدوير العادي
        shouldInclude = false;
        break;

      default:
        shouldInclude = false;
    }

    if (shouldInclude) {
      scheduledAds.push(item);
    }
  }

  // ترتيب حسب الأولوية
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  scheduledAds.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.play_order - b.play_order;
  });

  return scheduledAds;
}

/**
 * GET: جلب M3U للإعلانات المجدولة
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // جلب Timeline مع المحتوى (الإعلانات فقط)
    const { data: items, error } = await supabase
      .from('playlist_timeline')
      .select(`
        *,
        content:radio_content(*)
      `)
      .eq('is_active', true)
      .order('play_order', { ascending: true });

    if (error) {
      console.error('[Scheduled Ads] Error fetching timeline:', error);
      return NextResponse.json(
        { error: 'Failed to fetch timeline', details: error.message },
        { status: 500 }
      );
    }

    // جلب الإعلانات المجدولة
    const currentTime = new Date();
    const scheduledAds = items ? getScheduledAds(items as PlaylistTimelineItem[], currentTime) : [];

    // توليد M3U
    const m3uContent = generateAdsM3UContent(scheduledAds);

    // إرجاع كملف M3U
    return new NextResponse(m3uContent, {
      headers: {
        'Content-Type': 'audio/x-mpegurl',
        'Content-Disposition': 'attachment; filename="scheduled_ads.m3u"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Scheduled Ads] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST: توليد M3U للإعلانات وحفظه في Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // جلب Timeline
    const { data: items, error } = await supabase
      .from('playlist_timeline')
      .select(`
        *,
        content:radio_content(*)
      `)
      .eq('is_active', true)
      .order('play_order', { ascending: true });

    if (error) {
      console.error('[Scheduled Ads] Error fetching timeline:', error);
      return NextResponse.json(
        { error: 'Failed to fetch timeline', details: error.message },
        { status: 500 }
      );
    }

    // جلب الإعلانات المجدولة
    const currentTime = new Date();
    const scheduledAds = items ? getScheduledAds(items as PlaylistTimelineItem[], currentTime) : [];

    // توليد M3U
    const m3uContent = generateAdsM3UContent(scheduledAds);

    // حفظ في Supabase Storage
    const bucket = 'radio-playlists';
    const fileName = 'scheduled_ads.m3u';
    
    // محاولة إنشاء bucket إذا لم يكن موجوداً
    await supabase.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: ['audio/x-mpegurl', 'text/plain'],
    });

    // رفع الملف
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, m3uContent, {
        contentType: 'audio/x-mpegurl',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Scheduled Ads] Error uploading M3U:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload M3U file', details: uploadError.message },
        { status: 500 }
      );
    }

    // الحصول على URL العام
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`[Scheduled Ads] Updated at ${currentTime.toISOString()}`);
    console.log(`[Scheduled Ads] Ads count: ${scheduledAds.length}`);

    return NextResponse.json({
      success: true,
      message: 'Scheduled ads M3U generated successfully',
      data: {
        ads_count: scheduledAds.length,
        generated_at: currentTime.toISOString(),
        public_url: publicUrl,
        storage_path: uploadData?.path,
        ads: scheduledAds.map(ad => ({
          id: ad.content?.id,
          title: ad.content?.title,
          play_rule: ad.play_rule,
          priority: ad.priority,
        })),
      }
    });
  } catch (error) {
    console.error('[Scheduled Ads] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
