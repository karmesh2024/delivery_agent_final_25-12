/**
 * Auto Switch Service
 * إدارة التبديل التلقائي بين Always-On Stream و Live Event
 */

import { supabase } from '@/lib/supabase';
import { clubRadioService } from './clubRadioService';

export type BroadcastMode = 'live_event' | 'always_on';

export interface BroadcastStatus {
  current_mode: BroadcastMode | null;
  is_live: boolean;
  live_event_id?: string;
  always_on_id?: string;
  auto_switch_enabled: boolean;
}

export const autoSwitchService = {
  /**
   * الحصول على حالة البث الحالية
   */
  async getBroadcastStatus(): Promise<BroadcastStatus> {
    // جلب Live Event نشط
    const liveEvent = await supabase
      .from('club_activities')
      .select('id, broadcast_mode, is_live, auto_switch_enabled')
      .eq('activity_type', 'radio_stream')
      .eq('broadcast_mode', 'live_event')
      .eq('is_active', true)
      .eq('is_live', true)
      .maybeSingle();

    // جلب Always-On نشط
    const alwaysOn = await supabase
      .from('club_activities')
      .select('id, broadcast_mode, is_live, auto_switch_enabled')
      .eq('activity_type', 'radio_stream')
      .eq('broadcast_mode', 'always_on')
      .eq('is_active', true)
      .eq('is_live', true)
      .maybeSingle();

    const liveEventData = liveEvent.data;
    const alwaysOnData = alwaysOn.data;

    let current_mode: BroadcastMode | null = null;
    if (liveEventData) {
      current_mode = 'live_event';
    } else if (alwaysOnData) {
      current_mode = 'always_on';
    }

    return {
      current_mode,
      is_live: !!liveEventData || !!alwaysOnData,
      live_event_id: liveEventData?.id,
      always_on_id: alwaysOnData?.id,
      auto_switch_enabled: liveEventData?.auto_switch_enabled ?? alwaysOnData?.auto_switch_enabled ?? true,
    };
  },

  /**
   * التحقق والتبديل التلقائي
   */
  async checkAndSwitch(): Promise<BroadcastStatus> {
    const status = await this.getBroadcastStatus();

    // إذا كان Live Event نشط و Always-On نشط أيضاً
    if (status.live_event_id && status.always_on_id && status.auto_switch_enabled) {
      // إيقاف Always-On تلقائياً
      await this.stopAlwaysOnStream(status.always_on_id);
      
      return {
        ...status,
        current_mode: 'live_event',
        always_on_id: undefined,
      };
    }

    return status;
  },

  /**
   * بدء Always-On Stream
   */
  async startAlwaysOnStream(activityId: string): Promise<void> {
    // 1. التحقق من وجود Live Event نشط
    const liveEvent = await supabase
      .from('club_activities')
      .select('id, is_live, auto_switch_enabled')
      .eq('activity_type', 'radio_stream')
      .eq('broadcast_mode', 'live_event')
      .eq('is_active', true)
      .eq('is_live', true)
      .maybeSingle();

    if (liveEvent.data && liveEvent.data.is_live) {
      // إذا كان Live Event نشط و auto_switch_enabled = true، لا نبدأ Always-On
      if (liveEvent.data.auto_switch_enabled) {
        throw new Error('لا يمكن بدء البث العام المستمر أثناء البث المباشر النشط');
      }
    }

    // 2. إيقاف أي Always-On Stream آخر نشط
    await supabase
      .from('club_activities')
      .update({ is_live: false })
      .eq('activity_type', 'radio_stream')
      .eq('broadcast_mode', 'always_on')
      .eq('is_active', true)
      .eq('is_live', true)
      .neq('id', activityId);

    // 3. بدء Always-On Stream
    await clubRadioService.startLiveStream(activityId);

    // 4. تحديث broadcast_mode
    await supabase
      .from('club_activities')
      .update({ broadcast_mode: 'always_on' })
      .eq('id', activityId);
  },

  /**
   * إيقاف Always-On Stream
   */
  async stopAlwaysOnStream(activityId?: string): Promise<void> {
    if (activityId) {
      // إيقاف Always-On Stream محدد
      await clubRadioService.stopLiveStream(activityId);
    } else {
      // إيقاف جميع Always-On Streams النشطة
      const { data } = await supabase
        .from('club_activities')
        .select('id')
        .eq('activity_type', 'radio_stream')
        .eq('broadcast_mode', 'always_on')
        .eq('is_active', true)
        .eq('is_live', true);

      if (data && data.length > 0) {
        for (const item of data) {
          await clubRadioService.stopLiveStream(item.id);
        }
      }
    }
  },

  /**
   * التبديل إلى Live Event
   */
  async switchToLiveEvent(activityId: string): Promise<void> {
    // 1. إيقاف Always-On Stream إذا كان نشط
    await this.stopAlwaysOnStream();

    // 2. بدء Live Event
    await clubRadioService.startLiveStream(activityId);

    // 3. تحديث broadcast_mode
    await supabase
      .from('club_activities')
      .update({ broadcast_mode: 'live_event' })
      .eq('id', activityId);
  },

  /**
   * التبديل إلى Always-On Stream
   */
  async switchToAlwaysOn(activityId: string): Promise<void> {
    // 1. التحقق من وجود Live Event نشط
    const liveEvent = await supabase
      .from('club_activities')
      .select('id, is_live, auto_switch_enabled')
      .eq('activity_type', 'radio_stream')
      .eq('broadcast_mode', 'live_event')
      .eq('is_active', true)
      .eq('is_live', true)
      .maybeSingle();

    if (liveEvent.data && liveEvent.data.is_live) {
      if (liveEvent.data.auto_switch_enabled) {
        throw new Error('لا يمكن التبديل إلى البث العام المستمر أثناء البث المباشر النشط');
      }
    }

    // 2. إيقاف Live Event إذا كان نشط
    if (liveEvent.data) {
      await clubRadioService.stopLiveStream(liveEvent.data.id);
    }

    // 3. بدء Always-On Stream
    await this.startAlwaysOnStream(activityId);
  },

  /**
   * تفعيل/تعطيل Auto Switch
   */
  async setAutoSwitchEnabled(activityId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('club_activities')
      .update({ auto_switch_enabled: enabled })
      .eq('id', activityId);

    if (error) {
      console.error('[Auto Switch] Error updating auto_switch_enabled:', error);
      throw error;
    }
  },

  /**
   * إنشاء Always-On Stream Activity
   */
  async createAlwaysOnActivity(data: {
    title: string;
    playlist_engine_url?: string;
    description?: string;
  }): Promise<string> {
    const { data: activity, error } = await supabase
      .from('club_activities')
      .insert([
        {
          activity_type: 'radio_stream',
          title: data.title,
          description: data.description,
          broadcast_mode: 'always_on',
          playlist_engine_url: data.playlist_engine_url,
          is_active: true,
          is_live: false,
          auto_switch_enabled: true,
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('[Auto Switch] Error creating Always-On activity:', error);
      throw error;
    }

    return activity.id;
  },
};
