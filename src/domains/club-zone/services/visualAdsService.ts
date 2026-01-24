/**
 * Visual Ads Service
 * إدارة الإعلانات المرئية (صور وفيديوهات)
 */

import { supabase } from '@/lib/supabase';
import {
  VisualAd,
  VisualAdFormData,
  VisualAdLog,
  UserVisualAdInteraction,
  ContentPriority
} from './radioContentService';
import { generateVideoThumbnail } from './radioContentService';

export type VisualAdContentType = 'image' | 'video';
export type PlayRule = 'every_30_minutes' | 'hourly' | 'daily' | 'once' | 'continuous';

export const visualAdsService = {
  /**
   * رفع ملف مرئي إلى Supabase Storage
   */
  async uploadFile(file: File, bucket: string = 'visual-ads'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase!.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Visual Ads] Error uploading file:', error);
      throw error;
    }

    // الحصول على رابط عام للملف
    const { data: { publicUrl } } = supabase!.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * إنشاء إعلان مرئي جديد
   */
  async createVisualAd(adData: VisualAdFormData): Promise<VisualAd> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('visual_ads')
      .insert([
        {
          ...adData,
          metadata: adData.metadata || {},
          created_by: user?.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Visual Ads] Error creating visual ad:', error);
      throw error;
    }

    return data;
  },

  /**
   * رفع ملف وإنشاء إعلان مرئي في خطوة واحدة
   */
  async uploadVisualAd(
    file: File,
    title: string,
    mediaType: VisualAdContentType,
    options: {
      description?: string;
      playRule?: PlayRule;
      scheduledTime?: string;
      priority?: ContentPriority;
      displayDurationSeconds?: number;
      metadata?: VisualAdFormData['metadata'];
    } = {}
  ): Promise<VisualAd> {
    // 1. حساب المدة وحفظ thumbnail إذا كان فيديو
    let fileDurationSeconds: number | undefined;
    let thumbnailUrl: string | undefined;

    if (mediaType === 'video') {
      // حساب مدة الفيديو
      fileDurationSeconds = await calculateVideoDuration(file);

      // إنشاء thumbnail
      try {
        const thumbnailDataUrl = await generateVideoThumbnail(file);
        // رفع thumbnail كملف منفصل
        const thumbnailFile = dataURLToFile(thumbnailDataUrl, 'thumbnail.jpg');
        thumbnailUrl = await this.uploadFile(thumbnailFile);
      } catch (error) {
        console.warn('[Visual Ads] Could not generate thumbnail:', error);
      }
    }

    // 2. رفع الملف الرئيسي
    const fileUrl = await this.uploadFile(file);

    // 3. إنشاء الإعلان
    return await this.createVisualAd({
      title,
      description: options.description,
      media_type: mediaType,
      file_url: fileUrl,
      file_duration_seconds: fileDurationSeconds,
      display_duration_seconds: options.displayDurationSeconds || 10,
      thumbnail_url: thumbnailUrl,
      play_rule: options.playRule,
      scheduled_time: options.scheduledTime,
      priority: options.priority || 'medium',
      metadata: options.metadata,
    });
  },

  /**
   * جلب جميع الإعلانات المرئية مع فلترة
   */
  async getAllVisualAds(filters?: {
    media_type?: VisualAdContentType;
    is_active?: boolean;
    play_rule?: PlayRule;
    search?: string;
    limit?: number;
  }): Promise<VisualAd[]> {
    let query = supabase
      .from('visual_ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.media_type) {
      query = query.eq('media_type', filters.media_type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.play_rule) {
      query = query.eq('play_rule', filters.play_rule);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Visual Ads] Error fetching visual ads:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * جلب إعلان مرئي محدد
   */
  async getVisualAdById(id: string): Promise<VisualAd | null> {
    const { data, error } = await supabase
      .from('visual_ads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[Visual Ads] Error fetching visual ad:', error);
      throw error;
    }

    return data;
  },

  /**
   * تحديث إعلان مرئي
   */
  async updateVisualAd(
    id: string,
    updates: Partial<VisualAdFormData>
  ): Promise<VisualAd> {
    const { data, error } = await supabase
      .from('visual_ads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Visual Ads] Error updating visual ad:', error);
      throw error;
    }

    return data;
  },

  /**
   * حذف إعلان مرئي (Soft delete)
   */
  async deleteVisualAd(id: string): Promise<void> {
    // 1. الحصول على معلومات الإعلان
    const ad = await this.getVisualAdById(id);
    if (!ad) {
      throw new Error('Visual ad not found');
    }

    // 2. تعطيل الإعلان بدلاً من الحذف
    const { error } = await supabase
      .from('visual_ads')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[Visual Ads] Error deleting visual ad:', error);
      throw error;
    }
  },

  /**
   * حذف إعلان مرئي نهائياً (Hard delete)
   */
  async hardDeleteVisualAd(id: string): Promise<void> {
    // 1. الحصول على معلومات الإعلان
    const ad = await this.getVisualAdById(id);
    if (!ad) {
      throw new Error('Visual ad not found');
    }

    // 2. حذف الملفات من Storage
    try {
      // حذف الملف الرئيسي
      const mainFilePath = ad.file_url.split('/').pop() || '';
      await supabase.storage
        .from('visual-ads')
        .remove([mainFilePath]);

      // حذف thumbnail إذا كان موجود
      if (ad.thumbnail_url) {
        const thumbnailPath = ad.thumbnail_url.split('/').pop() || '';
        await supabase.storage
          .from('visual-ads')
          .remove([thumbnailPath]);
      }
    } catch (err) {
      console.warn('[Visual Ads] Error deleting files from storage:', err);
    }

    // 3. حذف السجل من قاعدة البيانات
    const { error } = await supabase
      .from('visual_ads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Visual Ads] Error hard deleting visual ad:', error);
      throw error;
    }
  },

  /**
   * جلب الإعلانات المجدولة لوقت محدد
   */
  async getScheduledVisualAds(targetTime: Date = new Date()): Promise<VisualAd[]> {
    const currentHour = targetTime.getHours();
    const currentMinute = targetTime.getMinutes();
    const currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

    // استخدام RPC function من قاعدة البيانات
    const { data, error } = await supabase
      .rpc('get_scheduled_visual_ads', {
        target_time: currentTimeString
      });

    if (error) {
      console.error('[Visual Ads] Error fetching scheduled ads:', error);
      throw error;
    }

    return data || [];
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
  ): Promise<VisualAdLog> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('visual_ad_logs')
      .insert([
        {
          visual_ad_id: visualAdId,
          display_duration_seconds: displayDurationSeconds,
          user_agent: userAgent,
          device_info: deviceInfo,
          location_data: locationData,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Visual Ads] Error logging display:', error);
      throw error;
    }

    return data;
  },

  /**
   * تسجيل تفاعل المستخدم مع إعلان مرئي
   */
  async logUserInteraction(
    visualAdId: string,
    interactionType: 'view' | 'click' | 'skip' | 'like' | 'share',
    interactionData?: any
  ): Promise<UserVisualAdInteraction> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_visual_ad_interactions')
      .insert([
        {
          visual_ad_id: visualAdId,
          user_id: user.id,
          interaction_type: interactionType,
          interaction_data: interactionData || {},
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Visual Ads] Error logging interaction:', error);
      throw error;
    }

    return data;
  },

  /**
   * جلب إحصائيات الإعلانات المرئية
   */
  async getVisualAdsStats(
    startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 يوم
    endDate: Date = new Date()
  ): Promise<any[]> {
    // استخدام RPC function من قاعدة البيانات
    const { data, error } = await supabase
      .rpc('get_visual_ads_stats', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

    if (error) {
      console.error('[Visual Ads] Error fetching stats:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * جلب تفاعلات مستخدم محدد
   */
  async getUserInteractions(userId: string, limit: number = 50): Promise<UserVisualAdInteraction[]> {
    const { data, error } = await supabase
      .from('user_visual_ad_interactions')
      .select(`
        *,
        visual_ad:visual_ads(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Visual Ads] Error fetching user interactions:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * جلب سجلات عرض إعلان محدد
   */
  async getVisualAdLogs(visualAdId: string, limit: number = 100): Promise<VisualAdLog[]> {
    const { data, error } = await supabase
      .from('visual_ad_logs')
      .select('*')
      .eq('visual_ad_id', visualAdId)
      .order('displayed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Visual Ads] Error fetching ad logs:', error);
      throw error;
    }

    return data || [];
  },
};

/**
 * دالة مساعدة لحساب مدة الفيديو
 */
async function calculateVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      video.addEventListener('loadedmetadata', () => {
        const duration = Math.round(video.duration);
        URL.revokeObjectURL(objectUrl);
        resolve(duration);
      });

      video.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      });

      video.src = objectUrl;
      video.load();

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      }, 30000);
    } catch (error) {
      resolve(0);
    }
  });
}

/**
 * دالة مساعدة لتحويل data URL إلى File object
 */
function dataURLToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}