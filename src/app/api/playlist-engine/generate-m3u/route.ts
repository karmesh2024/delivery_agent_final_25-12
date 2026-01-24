/**
 * API Route: Generate M3U Playlist
 * توليد ملف M3U من playlist_timeline
 * 
 * يستخدم بواسطة Cron Job لتحديث قائمة التشغيل كل دقيقة
 * Liquidsoap يقرأ من هذا الملف مع reload_mode="rounds"
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
 * توليد محتوى M3U من Timeline
 */
function generateM3UContent(items: PlaylistTimelineItem[]): string {
  const lines: string[] = ['#EXTM3U'];
  
  for (const item of items) {
    if (!item.content || !item.content.is_active) continue;
    
    const content = item.content;
    const duration = content.file_duration_seconds || -1;
    const title = content.title || 'Unknown';
    
    // M3U Extended Format
    lines.push(`#EXTINF:${duration},${title}`);
    lines.push(content.file_url);
  }
  
  return lines.join('\n');
}

/**
 * فلترة العناصر حسب قواعد التشغيل
 */
function filterItemsByPlayRule(items: PlaylistTimelineItem[], currentTime: Date): PlaylistTimelineItem[] {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

  // فصل العناصر حسب النوع
  const continuousItems: PlaylistTimelineItem[] = [];
  const scheduledItems: PlaylistTimelineItem[] = [];

  for (const item of items) {
    if (!item.content || !item.content.is_active) continue;

    switch (item.play_rule) {
      case 'continuous':
        continuousItems.push(item);
        break;

      case 'every_30_minutes':
        if (currentMinute === 0 || currentMinute === 30) {
          scheduledItems.push(item);
        }
        break;

      case 'hourly':
        if (currentMinute === 0) {
          scheduledItems.push(item);
        }
        break;

      case 'daily':
        if (item.scheduled_time === currentTimeString) {
          scheduledItems.push(item);
        }
        break;

      case 'once':
        // Once items are handled differently - check if they should play now
        if (item.scheduled_time === currentTimeString) {
          scheduledItems.push(item);
        }
        break;

      default:
        // No rule = continuous
        continuousItems.push(item);
    }
  }

  // ترتيب حسب الأولوية
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  
  scheduledItems.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.play_order - b.play_order;
  });

  continuousItems.sort((a, b) => a.play_order - b.play_order);

  // الإعلانات المجدولة تأتي أولاً، ثم المحتوى المستمر
  return [...scheduledItems, ...continuousItems];
}

/**
 * GET: جلب M3U كـ response
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // جلب Timeline مع المحتوى
    const { data: items, error } = await supabase
      .from('playlist_timeline')
      .select(`
        *,
        content:radio_content(*)
      `)
      .eq('is_active', true)
      .order('play_order', { ascending: true });

    if (error) {
      console.error('[Generate M3U] Error fetching timeline:', error);
      return NextResponse.json(
        { error: 'Failed to fetch playlist timeline', details: error.message },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      // إرجاع M3U فارغ
      return new NextResponse('#EXTM3U\n# No content available', {
        headers: {
          'Content-Type': 'audio/x-mpegurl',
          'Content-Disposition': 'attachment; filename="playlist.m3u"',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // فلترة حسب القواعد
    const currentTime = new Date();
    const filteredItems = filterItemsByPlayRule(items as PlaylistTimelineItem[], currentTime);

    // توليد M3U
    const m3uContent = generateM3UContent(filteredItems);

    // إرجاع كملف M3U
    return new NextResponse(m3uContent, {
      headers: {
        'Content-Type': 'audio/x-mpegurl',
        'Content-Disposition': 'attachment; filename="playlist.m3u"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Generate M3U] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST: توليد M3U وحفظه في Supabase Storage
 * يستخدم بواسطة Cron Job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // التحقق من Cron secret (اختياري للأمان)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Generate M3U] Unauthorized cron request');
      // لا نرفض الطلب في الوقت الحالي للسماح بالاختبار
    }

    // جلب Timeline مع المحتوى
    const { data: items, error } = await supabase
      .from('playlist_timeline')
      .select(`
        *,
        content:radio_content(*)
      `)
      .eq('is_active', true)
      .order('play_order', { ascending: true });

    if (error) {
      console.error('[Generate M3U] Error fetching timeline:', error);
      return NextResponse.json(
        { error: 'Failed to fetch playlist timeline', details: error.message },
        { status: 500 }
      );
    }

    // فلترة حسب القواعد
    const currentTime = new Date();
    const filteredItems = items ? filterItemsByPlayRule(items as PlaylistTimelineItem[], currentTime) : [];

    // توليد M3U
    const m3uContent = generateM3UContent(filteredItems);

    // حفظ في Supabase Storage
    const bucket = 'radio-playlists';
    const fileName = 'playlist.m3u';
    
    // محاولة إنشاء bucket إذا لم يكن موجوداً
    const { error: bucketError } = await supabase.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: ['audio/x-mpegurl', 'text/plain'],
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('[Generate M3U] Error creating bucket:', bucketError);
    }

    // رفع الملف (upsert)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, m3uContent, {
        contentType: 'audio/x-mpegurl',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Generate M3U] Error uploading M3U:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload M3U file', details: uploadError.message },
        { status: 500 }
      );
    }

    // الحصول على URL العام
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // تسجيل التحديث
    console.log(`[Generate M3U] Playlist updated at ${currentTime.toISOString()}`);
    console.log(`[Generate M3U] Items count: ${filteredItems.length}`);
    console.log(`[Generate M3U] Public URL: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Playlist M3U generated successfully',
      data: {
        items_count: filteredItems.length,
        generated_at: currentTime.toISOString(),
        public_url: publicUrl,
        storage_path: uploadData?.path,
      }
    });
  } catch (error) {
    console.error('[Generate M3U] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
