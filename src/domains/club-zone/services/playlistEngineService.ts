/**
 * Playlist Engine Service
 * توليد Playlist وإرسال Stream إلى Icecast
 * 
 * يستخدم M3U files للتواصل مع Liquidsoap
 * API Routes تولد الملفات، Liquidsoap يقرأها
 */

import { supabase } from '@/lib/supabase';
import { playlistTimelineService, CurrentPlaylistItem } from './playlistTimelineService';
import { RadioContent, VisualAd } from './radioContentService';
import { visualAdsService } from './visualAdsService';

export interface PlaylistEngineStatus {
  is_running: boolean;
  current_item?: CurrentPlaylistItem;
  next_item?: CurrentPlaylistItem;
  stream_url?: string;
  listeners_count: number;
  started_at?: string;
  m3u_urls?: {
    playlist: string;
    ads: string;
  };
}

export interface PlaylistLog {
  content_id: string;
  played_at: string;
  duration_seconds: number;
  listeners_count: number;
}

export interface M3UGenerationResult {
  success: boolean;
  items_count: number;
  public_url?: string;
  error?: string;
}

export const playlistEngineService = {
  /**
   * توليد Playlist من Timeline
   */
  async generatePlaylist(durationMinutes: number = 60): Promise<CurrentPlaylistItem[]> {
    return await playlistTimelineService.generatePlaylist(durationMinutes);
  },

  /**
   * الحصول على المحتوى التالي للبث
   */
  async getNextContent(): Promise<RadioContent | null> {
    return await playlistTimelineService.getNextContent();
  },

  /**
   * تسجيل تشغيل محتوى في playlist_logs
   */
  async logPlayback(
    contentId: string,
    durationSeconds: number,
    listenersCount: number = 0
  ): Promise<void> {
    const { error } = await supabase
      .from('playlist_logs')
      .insert([
        {
          content_id: contentId,
          played_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          listeners_count: listenersCount,
        },
      ]);

    if (error) {
      console.error('[Playlist Engine] Error logging playback:', error);
      throw error;
    }
  },

  /**
   * الحصول على حالة Playlist Engine
   * ملاحظة: هذا يحتاج إلى Backend Service منفصل للتحقق من الحالة الفعلية
   */
  async getEngineStatus(activityId: string): Promise<PlaylistEngineStatus> {
    // جلب Always-On Activity
    const { data: activity } = await supabase
      .from('club_activities')
      .select('id, is_live, playlist_engine_url, current_listeners')
      .eq('id', activityId)
      .eq('broadcast_mode', 'always_on')
      .single();

    if (!activity) {
      return {
        is_running: false,
        listeners_count: 0,
      };
    }

    // الحصول على المحتوى الحالي والتالي
    const currentItem = await this.getNextContent();
    const nextItem = await this.getNextContent();

    return {
      is_running: activity.is_live || false,
      current_item: currentItem ? {
        content: currentItem,
        play_order: 0,
        priority: 'medium',
      } : undefined,
      next_item: nextItem ? {
        content: nextItem,
        play_order: 0,
        priority: 'medium',
      } : undefined,
      stream_url: activity.playlist_engine_url || undefined,
      listeners_count: activity.current_listeners || 0,
    };
  },

  /**
   * بدء Playlist Engine
   * ملاحظة: هذا يحتاج إلى Backend Service منفصل لبدء البث الفعلي
   */
  async startEngine(activityId: string, icecastUrl: string): Promise<void> {
    // تحديث Always-On Activity
    const { error } = await supabase
      .from('club_activities')
      .update({
        is_live: true,
        playlist_engine_url: icecastUrl,
        broadcast_mode: 'always_on',
      })
      .eq('id', activityId);

    if (error) {
      console.error('[Playlist Engine] Error starting engine:', error);
      throw error;
    }

    // TODO: إرسال طلب إلى Backend Service لبدء البث الفعلي
    // await fetch('/api/playlist-engine/start', {
    //   method: 'POST',
    //   body: JSON.stringify({ activityId, icecastUrl }),
    // });
  },

  /**
   * إيقاف Playlist Engine
   */
  async stopEngine(activityId: string): Promise<void> {
    // تحديث Always-On Activity
    const { error } = await supabase
      .from('club_activities')
      .update({
        is_live: false,
      })
      .eq('id', activityId);

    if (error) {
      console.error('[Playlist Engine] Error stopping engine:', error);
      throw error;
    }

    // TODO: إرسال طلب إلى Backend Service لإيقاف البث الفعلي
    // await fetch('/api/playlist-engine/stop', {
    //   method: 'POST',
    //   body: JSON.stringify({ activityId }),
    // });
  },

  /**
   * الحصول على سجلات التشغيل
   */
  async getPlaybackLogs(filters?: {
    content_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<PlaylistLog[]> {
    let query = supabase
      .from('playlist_logs')
      .select('*')
      .order('played_at', { ascending: false });

    if (filters?.content_id) {
      query = query.eq('content_id', filters.content_id);
    }

    if (filters?.start_date) {
      query = query.gte('played_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('played_at', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Playlist Engine] Error fetching logs:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * توليد M3U Playlist عبر API Route
   */
  async generateM3UPlaylist(): Promise<M3UGenerationResult> {
    try {
      const response = await fetch('/api/playlist-engine/generate-m3u', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          items_count: 0,
          error: error.message || 'Failed to generate M3U',
        };
      }

      const result = await response.json();
      return {
        success: true,
        items_count: result.data?.items_count || 0,
        public_url: result.data?.public_url,
      };
    } catch (error) {
      console.error('[Playlist Engine] Error generating M3U:', error);
      return {
        success: false,
        items_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * توليد M3U للإعلانات المجدولة
   */
  async generateScheduledAdsM3U(): Promise<M3UGenerationResult> {
    try {
      const response = await fetch('/api/playlist-engine/scheduled-ads', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          items_count: 0,
          error: error.message || 'Failed to generate ads M3U',
        };
      }

      const result = await response.json();
      return {
        success: true,
        items_count: result.data?.ads_count || 0,
        public_url: result.data?.public_url,
      };
    } catch (error) {
      console.error('[Playlist Engine] Error generating ads M3U:', error);
      return {
        success: false,
        items_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * جلب حالة البث الكاملة من API
   */
  async getFullStatus(): Promise<PlaylistEngineStatus & { m3u_urls?: { playlist: string; ads: string } }> {
    try {
      const response = await fetch('/api/playlist-engine/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const result = await response.json();
      const data = result.data;

      return {
        is_running: data?.broadcast_status?.is_running || false,
        current_item: data?.current_item ? {
          content: data.current_item as RadioContent,
          play_order: 0,
          priority: 'medium',
        } : undefined,
        next_item: data?.next_item ? {
          content: data.next_item as RadioContent,
          play_order: 1,
          priority: 'medium',
        } : undefined,
        stream_url: data?.broadcast_status?.stream_url,
        listeners_count: data?.listeners?.current_count || 0,
        started_at: data?.broadcast_status?.started_at,
        m3u_urls: {
          playlist: data?.m3u_urls?.playlist_storage || data?.m3u_urls?.playlist_api,
          ads: data?.m3u_urls?.ads_storage || data?.m3u_urls?.ads_api,
        },
      };
    } catch (error) {
      console.error('[Playlist Engine] Error fetching full status:', error);
      return {
        is_running: false,
        listeners_count: 0,
      };
    }
  },

  /**
   * جلب المحتوى الحالي من API
   */
  async getNowPlaying(): Promise<{
    now_playing: any;
    up_next: any[];
    status: { is_live: boolean; stream_url?: string };
  } | null> {
    try {
      const response = await fetch('/api/radio/now-playing');
      
      if (!response.ok) {
        throw new Error('Failed to fetch now playing');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[Playlist Engine] Error fetching now playing:', error);
      return null;
    }
  },

  /**
   * ===== إدارة الإعلانات المرئية =====
   */

  /**
   * الحصول على الإعلانات المرئية المجدولة
   */
  async getScheduledVisualAds(): Promise<VisualAd[]> {
    return await visualAdsService.getScheduledVisualAds();
  },

  /**
   * تسجيل تفاعل مع إعلان مرئي
   */
  async logVisualAdInteraction(
    visualAdId: string,
    interactionType: 'view' | 'click' | 'skip' | 'like' | 'share',
    interactionData?: any
  ): Promise<void> {
    await visualAdsService.logUserInteraction(visualAdId, interactionType, interactionData);
  },

  /**
   * تسجيل عرض إعلان مرئي
   */
  async logVisualAdDisplay(
    visualAdId: string,
    displayDurationSeconds: number,
    userAgent?: string,
    deviceInfo?: any,
    locationData?: any
  ): Promise<void> {
    await visualAdsService.logVisualAdDisplay(
      visualAdId,
      displayDurationSeconds,
      userAgent,
      deviceInfo,
      locationData
    );
  },

  /**
   * الحصول على إحصائيات الإعلانات المرئية
   */
  async getVisualAdsStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    return await visualAdsService.getVisualAdsStats(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );
  },

  /**
   * الحصول على تفاعلات مستخدم مع الإعلانات المرئية
   */
  async getUserVisualAdInteractions(userId: string, limit: number = 50): Promise<any[]> {
    return await visualAdsService.getUserInteractions(userId, limit);
  },
};

/**
 * ملاحظات مهمة:
 * 
 * 1. النظام يستخدم M3U files للتواصل مع Liquidsoap
 * 
 * 2. API Routes:
 *    - GET/POST /api/playlist-engine/generate-m3u - توليد M3U الرئيسي
 *    - GET/POST /api/playlist-engine/scheduled-ads - توليد M3U الإعلانات
 *    - GET /api/playlist-engine/status - حالة البث
 *    - GET/POST /api/radio/now-playing - المحتوى الحالي
 * 
 * 3. Cron Jobs (vercel.json):
 *    - كل دقيقة: تحديث playlist.m3u
 *    - كل دقيقة: تحديث scheduled_ads.m3u
 * 
 * 4. Liquidsoap يقرأ من M3U files مع reload_mode="rounds"
 */
