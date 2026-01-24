/**
 * Radio Content Service
 * إدارة مكتبة المحتوى الصوتي (Clips, Music, Ads, Announcements)
 */

import { supabase } from '@/lib/supabase';

export type ContentType = 'clip' | 'music' | 'ad' | 'announcement' | 'visual_ad';
export type ContentPriority = 'low' | 'medium' | 'high';
export type MediaType = 'audio' | 'video' | 'image';

/**
 * حساب مدة الملف الصوتي باستخدام Web Audio API
 * @param file الملف الصوتي
 * @returns مدة الملف بالثواني
 */
export async function calculateAudioDuration(file: File): Promise<number> {
  return calculateMediaDuration(file, 'audio');
}

/**
 * حساب مدة الفيديو
 * @param file الملف الفيديو
 * @returns مدة الملف بالثواني
 */
export async function calculateVideoDuration(file: File): Promise<number> {
  return calculateMediaDuration(file, 'video');
}

/**
 * حساب مدة الملف الوسائطي (صوت أو فيديو)
 * @param file الملف
 * @param mediaType نوع الوسيطة
 * @returns مدة الملف بالثواني
 */
export async function calculateMediaDuration(file: File, mediaType: MediaType): Promise<number> {
  return new Promise((resolve, reject) => {
    // التحقق من نوع الملف
    const expectedPrefix = mediaType === 'audio' ? 'audio/' : 'video/';
    if (!file.type.startsWith(expectedPrefix)) {
      console.warn(`[${mediaType} Duration] File is not a ${mediaType} file:`, file.type);
      resolve(0);
      return;
    }

    try {
      // إنشاء عنصر الوسيطة المناسب
      const media = mediaType === 'audio' ? new Audio() : document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      media.addEventListener('loadedmetadata', () => {
        const duration = Math.round(media.duration);
        URL.revokeObjectURL(objectUrl);
        console.log(`[${mediaType} Duration] Calculated duration:`, duration, 'seconds');
        resolve(duration);
      });

      media.addEventListener('error', (e) => {
        URL.revokeObjectURL(objectUrl);
        console.error(`[${mediaType} Duration] Error loading ${mediaType}:`, e);
        resolve(0); // نرجع 0 بدلاً من رفض الوعد
      });

      // تحميل الملف
      media.src = objectUrl;
      media.load();

      // Timeout بعد 30 ثانية
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        console.warn(`[${mediaType} Duration] Timeout calculating duration`);
        resolve(0);
      }, 30000);
    } catch (error) {
      console.error(`[${mediaType} Duration] Error:`, error);
      resolve(0);
    }
  });
}

/**
 * حساب مدة الملف من URL
 * @param url رابط الملف الصوتي أو الفيديو
 * @returns مدة الملف بالثواني
 */
export async function calculateMediaDurationFromUrl(url: string, mediaType: MediaType): Promise<number> {
  return new Promise((resolve) => {
    try {
      const media = mediaType === 'audio' ? new Audio() : document.createElement('video');

      media.addEventListener('loadedmetadata', () => {
        const duration = Math.round(media.duration);
        console.log(`[${mediaType} Duration URL] Calculated duration:`, duration, 'seconds');
        resolve(duration);
      });

      media.addEventListener('error', (e) => {
        console.error(`[${mediaType} Duration URL] Error loading media:`, e);
        resolve(0);
      });

      media.src = url;
      media.load();

      // Timeout بعد 30 ثانية
      setTimeout(() => {
        console.warn(`[${mediaType} Duration URL] Timeout calculating duration`);
        resolve(0);
      }, 30000);
    } catch (error) {
      console.error(`[${mediaType} Duration] Error:`, error);
      resolve(0);
    }
  });
}

/**
 * حساب مدة الملف الصوتي من URL (للتوافق)
 */
export async function calculateAudioDurationFromUrl(url: string): Promise<number> {
  return calculateMediaDurationFromUrl(url, 'audio');
}

/**
 * حساب مدة الفيديو من URL
 */
export async function calculateVideoDurationFromUrl(url: string): Promise<number> {
  return calculateMediaDurationFromUrl(url, 'video');
}

/**
 * إنشاء thumbnail للفيديو
 * @param videoFile ملف الفيديو
 * @param time الوقت المطلوب للـ thumbnail (بالثواني)
 * @returns base64 string للصورة
 */
export async function generateVideoThumbnail(videoFile: File, time: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const objectUrl = URL.createObjectURL(videoFile);

      video.addEventListener('loadedmetadata', () => {
        // تعيين أبعاد الـ canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // الانتقال للوقت المطلوب
        video.currentTime = Math.min(time, video.duration);
      });

      video.addEventListener('seeked', () => {
        // رسم الإطار على الـ canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // تحويل إلى base64
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

        // تنظيف
        URL.revokeObjectURL(objectUrl);

        resolve(thumbnail);
      });

      video.addEventListener('error', (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Error generating thumbnail'));
      });

      video.src = objectUrl;
      video.load();

      // Timeout بعد 30 ثانية
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Timeout generating thumbnail'));
      }, 30000);

    } catch (error) {
      reject(error);
    }
  });
}

export interface RadioContent {
  id: string;
  title: string;
  content_type: ContentType;
  media_type?: MediaType; // جديد: نوع الوسيطة
  file_url: string;
  file_duration_seconds: number;
  metadata: {
    tags?: string[];
    allow_music_overlay?: boolean;
    priority?: ContentPriority;
    [key: string]: any;
  };
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RadioContentFormData {
  title: string;
  content_type: ContentType;
  media_type?: MediaType;
  file_url: string;
  file_duration_seconds: number;
  metadata?: {
    tags?: string[];
    allow_music_overlay?: boolean;
    priority?: ContentPriority;
    [key: string]: any;
  };
}

// Visual Ads Types
export interface VisualAd {
  id: string;
  title: string;
  description?: string;
  media_type: 'image' | 'video';
  file_url: string;
  file_duration_seconds?: number; // للفيديو
  display_duration_seconds: number; // للصور (مدة العرض)
  thumbnail_url?: string; // للفيديو
  metadata: {
    tags?: string[];
    target_audience?: string[];
    call_to_action?: string;
    [key: string]: any;
  };
  play_rule?: 'every_30_minutes' | 'hourly' | 'daily' | 'once' | 'continuous';
  scheduled_time?: string;
  priority: ContentPriority;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VisualAdFormData {
  title: string;
  description?: string;
  media_type: 'image' | 'video';
  file_url: string;
  file_duration_seconds?: number;
  display_duration_seconds?: number;
  thumbnail_url?: string;
  metadata?: {
    tags?: string[];
    target_audience?: string[];
    call_to_action?: string;
    [key: string]: any;
  };
  play_rule?: 'every_30_minutes' | 'hourly' | 'daily' | 'once' | 'continuous';
  scheduled_time?: string;
  priority?: ContentPriority;
}

export interface VisualAdLog {
  id: string;
  visual_ad_id: string;
  displayed_at: string;
  display_duration_seconds: number;
  user_agent?: string;
  device_info?: any;
  location_data?: any;
}

export interface UserVisualAdInteraction {
  id: string;
  visual_ad_id: string;
  user_id: string;
  interaction_type: 'view' | 'click' | 'skip' | 'like' | 'share';
  interaction_data?: any;
  created_at: string;
}

export const radioContentService = {
  /**
   * رفع ملف (صوتي أو مرئي) إلى Supabase Storage
   */
  async uploadFile(file: File, bucket: string = 'radio-content'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    // المسار داخل الـ bucket فقط (بدون تكرار اسم الـ bucket)
    const filePath = fileName;

    const { data, error } = await supabase!.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Radio Content] Error uploading file:', error);
      throw error;
    }

    // الحصول على رابط عام للملف
    const { data: { publicUrl } } = supabase!.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * إنشاء محتوى جديد
   */
  async createContent(contentData: RadioContentFormData): Promise<RadioContent> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('radio_content')
      .insert([
        {
          ...contentData,
          metadata: contentData.metadata || {},
          created_by: user?.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Radio Content] Error creating content:', error);
      throw error;
    }

    return data;
  },

  /**
   * رفع ملف وإنشاء محتوى في خطوة واحدة
   */
  async uploadContent(
    file: File,
    title: string,
    content_type: ContentType,
    metadata?: RadioContentFormData['metadata']
  ): Promise<RadioContent> {
    // تحديد نوع الوسيطة
    let mediaType: MediaType = 'audio';
    if (file.type.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.type.startsWith('image/')) {
      mediaType = 'image';
    }

    // تحديد bucket المناسب
    const bucket = mediaType === 'audio' ? 'radio-content' : 'visual-ads';

    // 1. حساب مدة الملف حسب النوع
    let fileDurationSeconds = 0;
    try {
      if (mediaType === 'audio') {
        fileDurationSeconds = await calculateAudioDuration(file);
      } else if (mediaType === 'video') {
        fileDurationSeconds = await calculateVideoDuration(file);
      }
      // الصور لا تحتاج مدة (تستخدم display_duration_seconds)

      console.log(`[Radio Content] ${mediaType} file duration calculated:`, fileDurationSeconds, 'seconds');
    } catch (error) {
      console.warn('[Radio Content] Could not calculate duration:', error);
    }

    // 2. رفع الملف
    const fileUrl = await this.uploadFile(file, bucket);

    // 3. إنشاء المحتوى
    return await this.createContent({
      title,
      content_type,
      media_type: mediaType,
      file_url: fileUrl,
      file_duration_seconds: fileDurationSeconds,
      metadata,
    });
  },

  /**
   * تحديث مدة المحتوى
   * يستخدم لتحديث المدة بعد الرفع إذا لم يتم حسابها
   */
  async updateContentDuration(id: string): Promise<RadioContent | null> {
    // جلب المحتوى
    const content = await this.getContentById(id);
    if (!content) return null;

    // حساب المدة من URL
    const duration = await calculateAudioDurationFromUrl(content.file_url);
    if (duration <= 0) return content;

    // تحديث المحتوى
    return await this.updateContent(id, {
      file_duration_seconds: duration,
    } as any);
  },

  /**
   * جلب جميع المحتويات مع فلترة
   */
  async getAllContent(filters?: {
    content_type?: ContentType;
    is_active?: boolean;
    search?: string;
    limit?: number;
  }): Promise<RadioContent[]> {
    let query = supabase
      .from('radio_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.content_type) {
      query = query.eq('content_type', filters.content_type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Radio Content] Error fetching content:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * جلب المحتوى حسب النوع
   */
  async getContentByType(content_type: ContentType): Promise<RadioContent[]> {
    return await this.getAllContent({ content_type, is_active: true });
  },

  /**
   * جلب محتوى محدد
   */
  async getContentById(id: string): Promise<RadioContent | null> {
    const { data, error } = await supabase
      .from('radio_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[Radio Content] Error fetching content:', error);
      throw error;
    }

    return data;
  },

  /**
   * تحديث محتوى
   */
  async updateContent(
    id: string,
    updates: Partial<RadioContentFormData>
  ): Promise<RadioContent> {
    const { data, error } = await supabase
      .from('radio_content')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Radio Content] Error updating content:', error);
      throw error;
    }

    return data;
  },

  /**
   * حذف محتوى (Soft delete - تعطيل)
   */
  async deleteContent(id: string): Promise<void> {
    const { error } = await supabase
      .from('radio_content')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[Radio Content] Error deleting content:', error);
      throw error;
    }
  },

  /**
   * حذف محتوى نهائياً (Hard delete)
   */
  async hardDeleteContent(id: string): Promise<void> {
    // 1. الحصول على معلومات الملف
    const content = await this.getContentById(id);
    if (!content) {
      throw new Error('Content not found');
    }

    // 2. حذف الملف من Storage (المسار داخل bucket = آخر مقطع من URL)
    try {
      const filePath = content.file_url.split('/').pop() || '';
      const bucket = 'radio-content';
      
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        console.warn('[Radio Content] Error deleting file from storage:', storageError);
      }
    } catch (err) {
      console.warn('[Radio Content] Error deleting file:', err);
    }

    // 3. حذف السجل من قاعدة البيانات
    const { error } = await supabase
      .from('radio_content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Radio Content] Error deleting content:', error);
      throw error;
    }
  },

  /**
   * تفعيل/تعطيل محتوى
   */
  async toggleContentActive(id: string, is_active: boolean): Promise<RadioContent> {
    return await this.updateContent(id, { is_active } as any);
  },
};
