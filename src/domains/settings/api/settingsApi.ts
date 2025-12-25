/**
 * خدمة API للإعدادات
 */

import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { 
  UserData, 
  NotificationSettings,
  LoginRecord
} from "../types";

/**
 * التحقق من توفر اتصال Supabase
 * @throws {Error} إذا كان supabase هو null
 */
const checkSupabaseConnection = () => {
  if (!supabase) {
    throw new Error('Supabase connection is not available');
  }
};

// بيانات المستخدم الافتراضية للاستخدام في وضع عدم الاتصال
const DEFAULT_USER_DATA: UserData = {
  id: "user-001",
  name: "مستخدم افتراضي",
  email: "user@example.com",
  phone: "+201234567890",
  role: "Admin",
  profileImage: "",
  address: "شارع الرئيسي، 123",
  city: "القاهرة",
  state: "القاهرة",
  postalCode: "12345",
  language: "Arabic",
  timeZone: "GMT+2 (Egypt Standard Time)",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12-hour",
  currency: "EGP",
  notificationSettings: {
    email: true,
    push: true,
    sms: false,
    agentUpdates: true,
    orderStatusChanges: true,
    systemAnnouncements: true,
    marketingMessages: false
  }
};

// سجل تسجيل الدخول الافتراضي
const DEFAULT_LOGIN_HISTORY: LoginRecord[] = [
  {
    device: "Google Chrome على Windows",
    location: "القاهرة، مصر",
    ip: "197.55.232.111",
    time: new Date().toLocaleString(),
    status: "success"
  },
  {
    device: "تطبيق الجوال على Android",
    location: "القاهرة، مصر",
    ip: "197.55.232.112",
    time: new Date(Date.now() - 86400000).toLocaleString(),
    status: "success"
  }
];

/**
 * الحصول على بيانات المستخدم وإعداداته
 * @param userId معرف المستخدم
 */
export const getUserSettings = async (userId: string): Promise<UserData | null> => {
  try {
    console.log(`Attempting to fetch user settings for userId: ${userId}`);
    
    // التحقق من توفر الاتصال بـ Supabase
    try {
      checkSupabaseConnection();
    } catch (connectionError) {
      console.warn("Supabase connection unavailable, using offline mode:", connectionError);
      return DEFAULT_USER_DATA;
    }
    
    // الحصول على بيانات المستخدم الأساسية
    const { data: userData, error: userError } = await supabase!
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error(`Error fetching user data: ${JSON.stringify(userError)}`);
      // استخدام البيانات الافتراضية في حالة وجود خطأ
      return DEFAULT_USER_DATA;
    }
    
    if (!userData) {
      console.warn(`No user data found for ID: ${userId}`);
      return DEFAULT_USER_DATA;
    }

    // الحصول على إعدادات الإشعارات
    const { data: notificationsData, error: notificationsError } = await supabase!
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (notificationsError && notificationsError.code !== 'PGRST116') {
      console.warn(`Error fetching notification settings: ${JSON.stringify(notificationsError)}`);
    }

    // ترجمة البيانات إلى نموذج التطبيق
    const user: UserData = {
      id: userData.id,
      name: userData.full_name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'User',
      profileImage: userData.avatar_url || '',
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state_province || '',
      postalCode: userData.postal_code || '',
      language: userData.language || 'Arabic',
      timeZone: userData.timezone || 'GMT+2 (Egypt Standard Time)',
      dateFormat: userData.date_format || 'DD/MM/YYYY',
      timeFormat: userData.time_format || '12-hour',
      currency: userData.currency || 'EGP',
      notificationSettings: notificationsData ? {
        email: notificationsData.email_enabled || false,
        push: notificationsData.push_enabled || false,
        sms: notificationsData.sms_enabled || false,
        agentUpdates: notificationsData.agent_updates || false,
        orderStatusChanges: notificationsData.order_status_changes || false,
        systemAnnouncements: notificationsData.system_announcements || false,
        marketingMessages: notificationsData.marketing_messages || false
      } : {
        email: true,
        push: true,
        sms: false,
        agentUpdates: true,
        orderStatusChanges: true,
        systemAnnouncements: true,
        marketingMessages: false
      }
    };

    return user;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // استخدام البيانات الافتراضية في حالة وجود خطأ
    return DEFAULT_USER_DATA;
  }
};

/**
 * تحديث البيانات الشخصية للمستخدم
 * @param userId معرف المستخدم
 * @param profileData بيانات الملف الشخصي المحدثة
 */
export const updateUserProfile = async (userId: string, profileData: Partial<UserData>): Promise<UserData> => {
  try {
    // استخراج البيانات الشخصية من البيانات المرسلة
    const userUpdate = {
      full_name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address,
      city: profileData.city,
      state_province: profileData.state,
      postal_code: profileData.postalCode
    };

    // تحديث بيانات المستخدم
    const { data, error } = await supabase!
      .from('users')
      .update(userUpdate)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from update');

    // ترجمة البيانات المحدثة إلى نموذج المستخدم
    const updatedUser = await getUserSettings(userId);
    if (!updatedUser) throw new Error('Failed to fetch updated user data');

    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * تحديث صورة الملف الشخصي
 * @param userId معرف المستخدم
 * @param file ملف الصورة
 */
export const updateProfileImage = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // رفع الصورة إلى التخزين
    const { error: uploadError } = await supabase!
      .storage
      .from('profiles')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    // الحصول على مسار URL العام
    const { data } = supabase!
      .storage
      .from('profiles')
      .getPublicUrl(filePath);

    // تحديث مسار الصورة في قاعدة البيانات
    const { error: updateError } = await supabase!
      .from('users')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return data.publicUrl;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
};

/**
 * تحديث إعدادات الإشعارات
 * @param userId معرف المستخدم
 * @param notificationSettings إعدادات الإشعارات المحدثة
 */
export const updateNotificationSettings = async (userId: string, notificationSettings: NotificationSettings): Promise<void> => {
  try {
    const settingsUpdate = {
      user_id: userId,
      email_enabled: notificationSettings.email,
      push_enabled: notificationSettings.push,
      sms_enabled: notificationSettings.sms,
      agent_updates: notificationSettings.agentUpdates,
      order_status_changes: notificationSettings.orderStatusChanges,
      system_announcements: notificationSettings.systemAnnouncements,
      marketing_messages: notificationSettings.marketingMessages
    };

    // التحقق من وجود تسجيل للإعدادات
    const { data: existingSettings } = await supabase!
      .from('user_notification_settings')
      .select()
      .eq('user_id', userId)
      .single();

    if (existingSettings) {
      // تحديث الإعدادات الموجودة
      const { error } = await supabase!
        .from('user_notification_settings')
        .update(settingsUpdate)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // إنشاء إعدادات جديدة
      const { error } = await supabase!
        .from('user_notification_settings')
        .insert(settingsUpdate);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * تحديث كلمة المرور
 * @param userId معرف المستخدم
 * @param currentPassword كلمة المرور الحالية
 * @param newPassword كلمة المرور الجديدة
 */
export const updatePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    // استخدام واجهة Supabase Auth لتحديث كلمة المرور
    const { error } = await supabase!.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * الحصول على سجل تسجيل الدخول
 * @param userId معرف المستخدم
 */
export const getLoginHistory = async (userId: string): Promise<LoginRecord[]> => {
  try {
    console.log(`Attempting to fetch login history for userId: ${userId}`);
    
    // التحقق من توفر الاتصال بـ Supabase
    try {
      checkSupabaseConnection();
    } catch (connectionError) {
      console.warn("Supabase connection unavailable, using offline mode:", connectionError);
      return DEFAULT_LOGIN_HISTORY;
    }

    const { data, error } = await supabase!
      .from('user_login_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(`Error fetching login history: ${JSON.stringify(error)}`);
      return DEFAULT_LOGIN_HISTORY;
    }

    if (!data || data.length === 0) {
      console.warn(`No login history found for user ID: ${userId}`);
      return DEFAULT_LOGIN_HISTORY;
    }

    return data.map(item => ({
      device: item.device || 'Unknown Device',
      location: item.location || 'Unknown Location',
      ip: item.ip_address || 'Unknown IP',
      time: new Date(item.created_at).toLocaleString(),
      status: item.successful ? 'success' : 'blocked'
    }));
  } catch (error) {
    console.error('Error fetching login history:', error);
    // استخدام البيانات الافتراضية في حالة وجود خطأ
    return DEFAULT_LOGIN_HISTORY;
  }
};

/**
 * تحديث الإعدادات الإقليمية (اللغة، المنطقة الزمنية، إلخ)
 * @param userId معرف المستخدم
 * @param regionalSettings الإعدادات الإقليمية المحدثة
 */
export const updateRegionalSettings = async (userId: string, regionalSettings: Partial<UserData>): Promise<void> => {
  try {
    const settingsUpdate = {
      language: regionalSettings.language,
      timezone: regionalSettings.timeZone,
      date_format: regionalSettings.dateFormat,
      time_format: regionalSettings.timeFormat,
      currency: regionalSettings.currency
    };

    const { error } = await supabase!
      .from('users')
      .update(settingsUpdate)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating regional settings:', error);
    throw error;
  }
};

/**
 * تحديث إعدادات المظهر
 * @param userId معرف المستخدم
 * @param theme السمة
 * @param colorAccent لون التمييز
 * @param layoutDensity كثافة التخطيط
 * @param fontSize حجم الخط
 */
export const updateAppearanceSettings = async (
  userId: string, 
  theme: string,
  colorAccent: string,
  layoutDensity: string,
  fontSize: number
): Promise<void> => {
  try {
    const settingsUpdate = {
      user_id: userId,
      theme,
      color_accent: colorAccent,
      layout_density: layoutDensity,
      font_size: fontSize
    };

    // التحقق من وجود تسجيل للإعدادات
    const { data: existingSettings } = await supabase!
      .from('user_appearance_settings')
      .select()
      .eq('user_id', userId)
      .single();

    if (existingSettings) {
      // تحديث الإعدادات الموجودة
      const { error } = await supabase!
        .from('user_appearance_settings')
        .update(settingsUpdate)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // إنشاء إعدادات جديدة
      const { error } = await supabase!
        .from('user_appearance_settings')
        .insert(settingsUpdate);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    throw error;
  }
};

/**
 * تحديث إعدادات الساعات الهادئة
 * @param userId معرف المستخدم
 * @param startTime وقت البدء
 * @param endTime وقت الانتهاء
 */
export const updateQuietHours = async (
  userId: string,
  startTime: string,
  endTime: string
): Promise<void> => {
  try {
    const quietHoursUpdate = {
      user_id: userId,
      start_time: startTime,
      end_time: endTime
    };

    // التحقق من وجود تسجيل للإعدادات
    const { data: existingSettings } = await supabase!
      .from('user_notification_quiet_hours')
      .select()
      .eq('user_id', userId)
      .single();

    if (existingSettings) {
      // تحديث الإعدادات الموجودة
      const { error } = await supabase!
        .from('user_notification_quiet_hours')
        .update(quietHoursUpdate)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // إنشاء إعدادات جديدة
      const { error } = await supabase!
        .from('user_notification_quiet_hours')
        .insert(quietHoursUpdate);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating quiet hours:', error);
    throw error;
  }
};