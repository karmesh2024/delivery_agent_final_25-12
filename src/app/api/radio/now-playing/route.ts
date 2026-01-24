/**
 * API Route: Now Playing
 * المحتوى الحالي الذي يتم بثه
 * 
 * يوفر معلومات للموبايل والويب عن:
 * - المحتوى الحالي
 * - المحتوى التالي
 * - حالة البث
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
 * GET: المحتوى الحالي
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // جلب البث النشط
    const { data: activity, error: activityError } = await supabase
      .from('club_activities')
      .select('*')
      .eq('activity_type', 'radio_stream')
      .eq('is_active', true)
      .eq('is_live', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activityError) {
      console.error('[Now Playing] Error fetching activity:', activityError);
    }

    // جلب آخر محتوى تم تشغيله
    const { data: lastLog, error: logError } = await supabase
      .from('playlist_logs')
      .select(`
        *,
        content:radio_content(
          id, 
          title, 
          content_type, 
          file_duration_seconds,
          metadata
        )
      `)
      .order('played_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (logError) {
      console.error('[Now Playing] Error fetching last log:', logError);
    }

    // جلب العناصر التالية من Timeline
    const { data: nextItems, error: nextError } = await supabase
      .from('playlist_timeline')
      .select(`
        *,
        content:radio_content(
          id, 
          title, 
          content_type, 
          file_duration_seconds
        )
      `)
      .eq('is_active', true)
      .order('play_order', { ascending: true })
      .limit(3);

    if (nextError) {
      console.error('[Now Playing] Error fetching next items:', nextError);
    }

    // تحديد حالة البث
    const isLive = activity?.is_live || false;
    const broadcastMode = activity?.broadcast_mode || 'always_on';

    // المحتوى الحالي
    let currentContent = null;
    if (lastLog?.content) {
      const playedAt = new Date(lastLog.played_at);
      const duration = lastLog.content.file_duration_seconds || 0;
      const endTime = new Date(playedAt.getTime() + duration * 1000);
      const now = new Date();

      // إذا كان المحتوى لا يزال يُشغل
      if (now < endTime) {
        currentContent = {
          id: lastLog.content.id,
          title: lastLog.content.title,
          content_type: lastLog.content.content_type,
          duration_seconds: lastLog.content.file_duration_seconds,
          started_at: lastLog.played_at,
          ends_at: endTime.toISOString(),
          progress_seconds: Math.floor((now.getTime() - playedAt.getTime()) / 1000),
          remaining_seconds: Math.floor((endTime.getTime() - now.getTime()) / 1000),
        };
      }
    }

    // المحتوى التالي
    const upNext = nextItems?.slice(0, 3).map(item => ({
      id: item.content?.id,
      title: item.content?.title,
      content_type: item.content?.content_type,
      duration_seconds: item.content?.file_duration_seconds,
      play_order: item.play_order,
    })).filter(item => item.id) || [];

    // رابط البث
    const streamUrl = activity?.listen_url || activity?.playlist_engine_url || null;

    return NextResponse.json({
      success: true,
      data: {
        // حالة البث
        status: {
          is_live: isLive,
          broadcast_mode: broadcastMode,
          stream_url: streamUrl,
        },
        
        // المحتوى الحالي
        now_playing: currentContent,
        
        // المحتوى التالي
        up_next: upNext,
        
        // معلومات إضافية
        info: {
          station_name: 'راديو كارمش',
          listeners_count: activity?.current_listeners || 0,
          server_time: new Date().toISOString(),
        },
      }
    });
  } catch (error) {
    console.error('[Now Playing] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST: تسجيل بدء تشغيل محتوى جديد
 * يستخدم بواسطة Playlist Engine
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { content_id, listeners_count = 0 } = body;

    if (!content_id) {
      return NextResponse.json(
        { error: 'content_id is required' },
        { status: 400 }
      );
    }

    // جلب معلومات المحتوى
    const { data: content, error: contentError } = await supabase
      .from('radio_content')
      .select('id, title, file_duration_seconds')
      .eq('id', content_id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found', details: contentError?.message },
        { status: 404 }
      );
    }

    // تسجيل في playlist_logs
    const { data: log, error: logError } = await supabase
      .from('playlist_logs')
      .insert({
        content_id,
        played_at: new Date().toISOString(),
        duration_seconds: content.file_duration_seconds,
        listeners_count,
      })
      .select()
      .single();

    if (logError) {
      console.error('[Now Playing] Error logging playback:', logError);
      return NextResponse.json(
        { error: 'Failed to log playback', details: logError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Playback logged successfully',
      data: {
        log_id: log.id,
        content_id,
        title: content.title,
        duration_seconds: content.file_duration_seconds,
        played_at: log.played_at,
      }
    });
  } catch (error) {
    console.error('[Now Playing] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
