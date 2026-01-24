/**
 * Radio Content Service
 * إدارة مكتبة المحتوى الصوتي (Clips, Music, Ads, Announcements)
 */

import { supabase } from '@/lib/supabase';

export type ContentType = 'clip' | 'music' | 'ad' | 'announcement';
export type ContentPriority = 'low' | 'medium' | 'high';

/**
 * حساب مدة الملف الصوتي باستخدام Web Audio API
 * @param file الملف الصوتي
 * @returns مدة الملف بالثواني
 */
export async function calculateAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    // التحقق من أن الملف صوتي
    if (!file.type.startsWith('audio/')) {
      console.warn('[Audio Duration] File is not an audio file:', file.type);
      resolve(0);
      return;
    }

    try {
      // إنشاء عنصر Audio
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        const duration = Math.round(audio.duration);
        URL.revokeObjectURL(objectUrl);
        console.log('[Audio Duration] Calculated duration:', duration, 'seconds');
        resolve(duration);
      });

      audio.addEventListener('error', (e) => {
        URL.revokeObjectURL(objectUrl);
        console.error('[Audio Duration] Error loading audio:', e);
        resolve(0); // نرجع 0 بدلاً من رفض الوعد
      });

      // تحميل الملف
      audio.src = objectUrl;
      audio.load();

      // Timeout بعد 30 ثانية
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        console.warn('[Audio Duration] Timeout calculating duration');
        resolve(0);
      }, 30000);
    } catch (error) {
      console.error('[Audio Duration] Error:', error);
      resolve(0);
    }
  });
}

/**
 * حساب مدة الملف من URL
 * @param url رابط الملف الصوتي
 * @returns مدة الملف بالثواني
 */
export async function calculateAudioDurationFromUrl(url: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = Math.round(audio.duration);
        console.log('[Audio Duration URL] Calculated duration:', duration, 'seconds');
        resolve(duration);
      });

      audio.addEventListener('error', (e) => {
        console.error('[Audio Duration URL] Error loading audio:', e);
        resolve(0);
      });

      audio.src = url;
      audio.load();

      // Timeout بعد 30 ثانية
      setTimeout(() => {
        console.warn('[Audio Duration URL] Timeout calculating duration');
        resolve(0);
      }, 30000);
    } catch (error) {
      console.error('[Audio Duration URL] Error:', error);
      resolve(0);
    }
  });
}

export interface RadioContent {
  id: string;
  title: string;
  content_type: ContentType;
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
  file_url: string;
  file_duration_seconds: number;
  metadata?: {
    tags?: string[];
    allow_music_overlay?: boolean;
    priority?: ContentPriority;
    [key: string]: any;
  };
}

export const radioContentService = {
  /**
   * رفع ملف صوتي إلى Supabase Storage
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
    // 1. حساب مدة الملف قبل الرفع
    let fileDurationSeconds = 0;
    try {
      fileDurationSeconds = await calculateAudioDuration(file);
      console.log('[Radio Content] File duration calculated:', fileDurationSeconds, 'seconds');
    } catch (error) {
      console.warn('[Radio Content] Could not calculate duration:', error);
    }

    // 2. رفع الملف
    const fileUrl = await this.uploadFile(file);

    // 3. إنشاء المحتوى
    return await this.createContent({
      title,
      content_type,
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
