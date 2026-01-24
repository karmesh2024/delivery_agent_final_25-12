/**
 * API Route: Playlist Engine Status
 * حالة البث العام المستمر
 * 
 * يوفر معلومات عن:
 * - حالة البث (نشط/متوقف)
 * - المحتوى الحالي والتالي
 * - عدد المستمعين
 * - روابط M3U
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * GET: حالة البث الحالية
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // جلب Always-On Activity
    const { data: activity, error: activityError } = await supabase
      .from('club_activities')
      .select('*')
      .eq('broadcast_mode', 'always_on')
      .eq('activity_type', 'radio_stream')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activityError) {
      console.error('[Engine Status] Error fetching activity:', activityError);
      return NextResponse.json(
        { error: 'Failed to fetch activity', details: activityError.message },
        { status: 500 }
      );
    }

    // جلب Timeline للمحتوى الحالي والتالي
    const { data: timelineItems, error: timelineError } = await supabase
      .from('playlist_timeline')
      .select(`
        *,
        content:radio_content(*)
      `)
      .eq('is_active', true)
      .order('play_order', { ascending: true })
      .limit(5);

    if (timelineError) {
      console.error('[Engine Status] Error fetching timeline:', timelineError);
    }

    // جلب عدد المستمعين النشطين
    let listenersCount = 0;
    if (activity?.id) {
      const { count, error: listenersError } = await supabase
        .from('radio_listeners')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activity.id)
        .eq('is_active', true)
        .gte('last_active_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

      if (!listenersError) {
        listenersCount = count || 0;
      }
    }

    // جلب آخر سجل تشغيل
    const { data: lastLog, error: logError } = await supabase
      .from('playlist_logs')
      .select(`
        *,
        content:radio_content(id, title, content_type, file_duration_seconds)
      `)
      .order('played_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // بناء الاستجابة
    const currentItem = timelineItems?.[0]?.content || null;
    const nextItem = timelineItems?.[1]?.content || null;

    // روابط M3U
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const playlistM3UUrl = `${baseUrl}/api/playlist-engine/generate-m3u`;
    const adsM3UUrl = `${baseUrl}/api/playlist-engine/scheduled-ads`;

    // رابط Storage إذا كان موجوداً
    let storagePlaylistUrl = null;
    let storageAdsUrl = null;
    
    const { data: { publicUrl: playlistPublicUrl } } = supabase.storage
      .from('radio-playlists')
      .getPublicUrl('playlist.m3u');
    
    const { data: { publicUrl: adsPublicUrl } } = supabase.storage
      .from('radio-playlists')
      .getPublicUrl('scheduled_ads.m3u');

    storagePlaylistUrl = playlistPublicUrl;
    storageAdsUrl = adsPublicUrl;

    return NextResponse.json({
      success: true,
      data: {
        // حالة البث
        broadcast_status: {
          is_running: activity?.is_live || false,
          broadcast_mode: activity?.broadcast_mode || 'always_on',
          activity_id: activity?.id || null,
          stream_url: activity?.listen_url || activity?.playlist_engine_url || null,
          started_at: activity?.is_live ? activity?.updated_at : null,
        },
        
        // المستمعين
        listeners: {
          current_count: listenersCount,
          max_listeners: activity?.max_listeners || 1000,
        },
        
        // المحتوى
        current_item: currentItem ? {
          id: currentItem.id,
          title: currentItem.title,
          content_type: currentItem.content_type,
          duration_seconds: currentItem.file_duration_seconds,
        } : null,
        
        next_item: nextItem ? {
          id: nextItem.id,
          title: nextItem.title,
          content_type: nextItem.content_type,
          duration_seconds: nextItem.file_duration_seconds,
        } : null,
        
        // آخر تشغيل
        last_played: lastLog ? {
          content_id: lastLog.content?.id,
          title: lastLog.content?.title,
          played_at: lastLog.played_at,
          duration_seconds: lastLog.duration_seconds,
          listeners_count: lastLog.listeners_count,
        } : null,
        
        // روابط M3U
        m3u_urls: {
          playlist_api: playlistM3UUrl,
          ads_api: adsM3UUrl,
          playlist_storage: storagePlaylistUrl,
          ads_storage: storageAdsUrl,
        },
        
        // Timeline ملخص
        timeline_summary: {
          total_items: timelineItems?.length || 0,
          items: timelineItems?.slice(0, 5).map(item => ({
            id: item.id,
            title: item.content?.title,
            content_type: item.content?.content_type,
            play_order: item.play_order,
            play_rule: item.play_rule,
            priority: item.priority,
          })) || [],
        },
        
        // معلومات النظام
        system_info: {
          server_time: new Date().toISOString(),
          auto_switch_enabled: activity?.auto_switch_enabled || false,
        },
      }
    });
  } catch (error) {
    console.error('[Engine Status] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
