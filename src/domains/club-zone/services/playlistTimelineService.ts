/**
 * Playlist Timeline Service
 * إدارة جدولة المحتوى للبث العام المستمر
 */

import { supabase } from '@/lib/supabase';
import { RadioContent } from './radioContentService';

export type PlayRule = 'every_30_minutes' | 'hourly' | 'daily' | 'once' | 'continuous';
export type TimelinePriority = 'low' | 'medium' | 'high';

export interface PlaylistTimelineItem {
  id: string;
  content_id: string;
  play_order: number;
  scheduled_time?: string; // TIME format (HH:MM:SS)
  play_rule?: PlayRule;
  priority: TimelinePriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  content?: RadioContent;
}

export interface PlaylistTimelineFormData {
  content_id: string;
  play_order: number;
  scheduled_time?: string;
  play_rule?: PlayRule;
  priority?: TimelinePriority;
}

export interface CurrentPlaylistItem {
  content: RadioContent;
  play_order: number;
  scheduled_time?: string;
  play_rule?: PlayRule;
  priority: TimelinePriority;
  estimated_play_time?: Date;
}

export const playlistTimelineService = {
  /**
   * إنشاء عنصر جديد في Timeline
   */
  async createTimelineItem(
    itemData: PlaylistTimelineFormData
  ): Promise<PlaylistTimelineItem> {
    const { data, error } = await supabase
      .from('playlist_timeline')
      .insert([
        {
          ...itemData,
          priority: itemData.priority || 'medium',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Playlist Timeline] Error creating item:', error);
      throw error;
    }

    return data;
  },

  /**
   * جلب جميع عناصر Timeline
   */
  async getAllTimelineItems(includeInactive: boolean = false): Promise<PlaylistTimelineItem[]> {
    let query = supabase
      .from('playlist_timeline')
      .select(`
        *,
        content:radio_content(*)
      `)
      .order('play_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Playlist Timeline] Error fetching items:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * جلب Playlist الحالي (Active items only)
   */
  async getCurrentPlaylist(): Promise<CurrentPlaylistItem[]> {
    const items = await this.getAllTimelineItems(false);

    // ترتيب حسب play_order
    const sortedItems = items.sort((a, b) => a.play_order - b.play_order);

    return sortedItems
      .filter(item => item.content && item.content.is_active)
      .map(item => ({
        content: item.content!,
        play_order: item.play_order,
        scheduled_time: item.scheduled_time || undefined,
        play_rule: item.play_rule || undefined,
        priority: item.priority,
      }));
  },

  /**
   * الحصول على المحتوى التالي حسب القواعد
   */
  async getNextContent(currentTime?: Date): Promise<RadioContent | null> {
    const now = currentTime || new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

    // جلب جميع العناصر النشطة
    const items = await this.getAllTimelineItems(false);

    // فلترة حسب القواعد
    const eligibleItems = items.filter(item => {
      if (!item.content || !item.content.is_active) return false;

      // إذا كان play_rule = 'continuous'، يعتبر دائماً مؤهلاً
      if (item.play_rule === 'continuous') return true;

      // إذا كان play_rule = 'once'، نتحقق من scheduled_time
      if (item.play_rule === 'once' && item.scheduled_time) {
        return item.scheduled_time === currentTimeString;
      }

      // إذا كان play_rule = 'hourly'، نتحقق من الدقيقة
      if (item.play_rule === 'hourly') {
        return currentMinute === 0; // في بداية كل ساعة
      }

      // إذا كان play_rule = 'every_30_minutes'، نتحقق من الدقيقة
      if (item.play_rule === 'every_30_minutes') {
        return currentMinute === 0 || currentMinute === 30;
      }

      // إذا كان play_rule = 'daily'، نتحقق من الوقت المحدد
      if (item.play_rule === 'daily' && item.scheduled_time) {
        return item.scheduled_time === currentTimeString;
      }

      return false;
    });

    if (eligibleItems.length === 0) {
      // إذا لم يكن هناك عناصر مؤهلة، نرجع العنصر الأول حسب play_order
      const firstItem = items
        .filter(item => item.content && item.content.is_active)
        .sort((a, b) => a.play_order - b.play_order)[0];

      return firstItem?.content || null;
    }

    // ترتيب حسب priority ثم play_order
    eligibleItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.play_order - b.play_order;
    });

    return eligibleItems[0]?.content || null;
  },

  /**
   * تحديث ترتيب العناصر
   */
  async updatePlaylistOrder(
    updates: { id: string; play_order: number }[]
  ): Promise<void> {
    // تحديث كل عنصر
    const promises = updates.map(update =>
      supabase
        .from('playlist_timeline')
        .update({ play_order: update.play_order })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);

    // التحقق من الأخطاء
    for (const result of results) {
      if (result.error) {
        console.error('[Playlist Timeline] Error updating order:', result.error);
        throw result.error;
      }
    }
  },

  /**
   * تحديث عنصر Timeline
   */
  async updateTimelineItem(
    id: string,
    updates: Partial<PlaylistTimelineFormData>
  ): Promise<PlaylistTimelineItem> {
    const { data, error } = await supabase
      .from('playlist_timeline')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        content:radio_content(*)
      `)
      .single();

    if (error) {
      console.error('[Playlist Timeline] Error updating item:', error);
      throw error;
    }

    return data;
  },

  /**
   * حذف عنصر من Timeline
   */
  async deleteTimelineItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('playlist_timeline')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Playlist Timeline] Error deleting item:', error);
      throw error;
    }
  },

  /**
   * تعطيل/تفعيل عنصر
   */
  async toggleTimelineItemActive(
    id: string,
    is_active: boolean
  ): Promise<PlaylistTimelineItem> {
    return await this.updateTimelineItem(id, { is_active } as any);
  },

  /**
   * إعادة ترتيب Timeline بالكامل
   */
  async reorderTimeline(items: PlaylistTimelineItem[]): Promise<void> {
    const updates = items.map((item, index) => ({
      id: item.id,
      play_order: index + 1,
    }));

    await this.updatePlaylistOrder(updates);
  },

  /**
   * توليد Playlist من Timeline
   */
  async generatePlaylist(durationMinutes: number = 60): Promise<CurrentPlaylistItem[]> {
    const playlist: CurrentPlaylistItem[] = [];
    const startTime = new Date();
    let currentTime = new Date(startTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const allItems = await this.getAllTimelineItems(false);
    const sortedItems = allItems
      .filter(item => item.content && item.content.is_active)
      .sort((a, b) => a.play_order - b.play_order);

    if (sortedItems.length === 0) {
      return playlist;
    }

    let itemIndex = 0;

    while (currentTime < endTime && sortedItems.length > 0) {
      const item = sortedItems[itemIndex % sortedItems.length];
      const content = item.content!;

      playlist.push({
        content,
        play_order: item.play_order,
        scheduled_time: item.scheduled_time || undefined,
        play_rule: item.play_rule || undefined,
        priority: item.priority,
        estimated_play_time: new Date(currentTime),
      });

      // الانتقال للعنصر التالي
      currentTime = new Date(
        currentTime.getTime() + content.file_duration_seconds * 1000
      );
      itemIndex++;
    }

    return playlist;
  },
};
