/**
 * واجهة برمجة التطبيق الخاصة بمجال المسؤولين
 * تتعامل مع عمليات إدارة المسؤولين والمصادقة
 */

import { supabase } from '@/lib/supabase';
import {
  Admin,
  AdminCredentials,
  UpdateAdminDto,
  AuthResult,
  AdminRole,
  AdminPermissions,
  CreateAdminDto
} from '@/domains/admins/types';
/**
 * واجهة برمجة التطبيق لإدارة المسؤولين
 */
export const adminsApi = {
  /**
   * تسجيل دخول المسؤول
   * @param credentials بيانات الاعتماد (البريد الإلكتروني وكلمة المرور)
   * @returns نتيجة عملية المصادقة
   */
  login: async (credentials: AdminCredentials): Promise<AuthResult> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      // محاولة تسجيل الدخول باستخدام Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) throw authError;

      // التحقق من وجود المستخدم في جدول المسؤولين
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (adminError) {
        // إذا لم يتم العثور على المستخدم في جدول المسؤولين أو غير نشط
        await supabase.auth.signOut(); // تسجيل الخروج
        throw new Error('غير مصرح لهذا المستخدم بالوصول إلى لوحة التحكم');
      }

      // تأكيد نوع الدور
      const role: AdminRole = (adminData.role && [
        'super_admin', 'admin', 'manager', 'supervisor', 'support', 'viewer'
      ].includes(adminData.role)) ? adminData.role as AdminRole : 'admin';

      // جلب بيانات المسؤول كاملة
      const admin: Admin = {
        id: adminData.id,
        user_id: adminData.user_id,
        email: adminData.email || credentials.email,
        username: adminData.username,
        full_name: adminData.full_name,
        is_active: adminData.is_active,
        role,
        role_id: adminData.role_id,
        department_id: adminData.department_id,
        manager_id: adminData.manager_id,
        job_title: adminData.job_title || null,
        phone: adminData.phone,
        profile_image_url: adminData.profile_image_url,
        permissions: adminData.permissions || {},
        last_login: adminData.last_login || null,
        created_at: adminData.created_at,
        updated_at: adminData.updated_at,
        name: adminData.full_name || adminData.username || adminData.email // Add this line to map a 'name'
      };

      return {
        success: true,
        admin,
        token: authData.session?.access_token || ''
      };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول'
      };
    }
  },

  /**
   * تسجيل خروج المسؤول
   * @returns نتيجة عملية تسجيل الخروج
   */
  logout: async (): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الخروج'
      };
    }
  },

  /**
   * التحقق من حالة المصادقة الحالية وجلب بيانات المسؤول
   * @returns نتيجة عملية التحقق من حالة المصادقة
   */
  checkAuth: async (): Promise<AuthResult> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      // التحقق من وجود جلسة حالية
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        return { success: false, error: 'لا توجد جلسة نشطة' };
      }

      // جلب بيانات المسؤول
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .eq('is_active', true)
        .single();

      if (adminError) {
        // إذا لم يتم العثور على المستخدم في جدول المسؤولين أو غير نشط
        await supabase.auth.signOut(); // تسجيل الخروج
        throw new Error('غير مصرح لهذا المستخدم بالوصول إلى لوحة التحكم');
      }

      // تأكيد نوع الدور
      const role: AdminRole = (adminData.role && [
        'super_admin', 'admin', 'manager', 'supervisor', 'support', 'viewer'
      ].includes(adminData.role)) ? adminData.role as AdminRole : 'admin';

      // تحويل البيانات إلى كائن Admin
      const admin: Admin = {
        id: adminData.id,
        user_id: adminData.user_id,
        email: adminData.email || sessionData.session.user.email || '',
        username: adminData.username,
        full_name: adminData.full_name,
        is_active: adminData.is_active,
        role,
        role_id: adminData.role_id,
        department_id: adminData.department_id,
        manager_id: adminData.manager_id,
        job_title: adminData.job_title || null,
        phone: adminData.phone,
        profile_image_url: adminData.profile_image_url,
        permissions: adminData.permissions || {},
        last_login: adminData.last_login || null,
        created_at: adminData.created_at,
        updated_at: adminData.updated_at,
        name: adminData.full_name || adminData.username || adminData.email // Add this line to map a 'name'
      };

      return {
        success: true,
        admin,
        token: sessionData.session.access_token
      };
    } catch (error) {
      console.error('خطأ في التحقق من حالة المصادقة:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق من حالة المصادقة'
      };
    }
  },

  /**
   * الحصول على قائمة المسؤولين
   * @returns قائمة بجميع المسؤولين
   */
  getAdmins: async (): Promise<Admin[]> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      console.log('[adminsApi] Fetching admins from Supabase...');
      const { data, error } = await supabase
        .from('admins')
        // طلب الأعمدة المطلوبة وتضمين اسم الدور من الجدول المرتبط
        .select(`
          *, 
          roles ( name ) 
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      console.log('[adminsApi] Raw data from Supabase:', data);

      // Define an intermediate type for the data with the nested role name
      type AdminWithRole = Admin & { roles: { name: string } | null };

      // معالجة البيانات لإضافة role_name إلى كائن admin
      const adminsWithRoleNames = (data as AdminWithRole[] || []).map((admin) => { 
        const { roles, ...restOfAdmin } = admin; 
        return {
          ...restOfAdmin,
          name: restOfAdmin.full_name || restOfAdmin.username || restOfAdmin.email || roles?.name || 'غير محدد',
          role: roles?.name || restOfAdmin.role_id || 'غير محدد' 
        };
      });

      // Ensure the final type matches Admin[], which should now be correct
      return adminsWithRoleNames as Admin[]; 
    } catch (error) {
      console.error('خطأ في جلب المسؤولين:', error);
      return [];
    }
  },

  /**
   * الحصول على مسؤول معين بواسطة المعرف
   * @param adminId معرف المسؤول
   * @returns بيانات المسؤول
   */
  getAdminById: async (adminId: string): Promise<Admin | null> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('خطأ في جلب بيانات المسؤول:', error);
      return null;
    }
  },

  /**
   * إنشاء مسؤول جديد: ينشئ حساب مستخدم في Supabase Auth ويسحب بيانات المسؤول الكاملة بعد الإنشاء بواسطة التريجر.
   * @param adminData بيانات المسؤول الجديد بما في ذلك البريد الإلكتروني وكلمة المرور
   * @returns كائن المسؤول الكامل بعد إنشائه
   */
  createAdmin: async (adminData: CreateAdminDto): Promise<Admin> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      // 1. إنشاء مستخدم جديد في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password || generateRandomPassword(), // يجب أن يكون هناك كلمة مرور
      });

      if (authError) {
        throw authError;
      }
      if (!authData.user) {
        throw new Error('فشل إنشاء مستخدم المصادقة.');
      }

      const newUserId = authData.user.id;

      // 2. انتظر حتى يتم إنشاء سجل المسؤول بواسطة التريجر (قد يتطلب مهلة أو آلية انتظار)
      // هذا هو الجزء الصعب لأنه يعتمد على وقت استجابة التريجر.
      // للتبسيط، سنحاول جلب المسؤول فورًا، وقد تحتاج إلى إضافة آلية إعادة محاولة/تأخير في بيئة الإنتاج.
      let createdAdmin: Admin | null = null;
      let retries = 0;
      const maxRetries = 5;
      const delayMs = 1000; // 1 second delay

      while (!createdAdmin && retries < maxRetries) {
        console.log(`Attempting to fetch created admin (retry ${retries + 1}/${maxRetries})...`);
        const { data: adminRecord, error: adminFetchError } = await supabase
          .from('admins')
          .select(`
            *,
            roles ( name )
          `)
          .eq('user_id', newUserId)
          .single();

        if (adminRecord) {
          createdAdmin = {
            id: adminRecord.id,
            user_id: adminRecord.user_id,
            email: adminRecord.email,
            username: adminRecord.username,
            full_name: adminRecord.full_name,
            role_id: adminRecord.role_id,
            role: adminRecord.roles?.name || adminRecord.role_id || null, // Map role name
            phone: adminRecord.phone,
            department_id: adminRecord.department_id,
            manager_id: adminRecord.manager_id,
            job_title: adminRecord.job_title,
            profile_image_url: adminRecord.profile_image_url,
            permissions: adminRecord.permissions,
            is_active: adminRecord.is_active,
            last_login: adminRecord.last_login,
            created_at: adminRecord.created_at,
            updated_at: adminRecord.updated_at,
            name: adminRecord.full_name || adminRecord.username || adminRecord.email
          };
          break;
        } else if (adminFetchError && adminFetchError.code !== 'PGRST116') { // PGRST116 is 'No rows found'
          console.error(`Error fetching created admin:`, adminFetchError);
          // If it's a real error, rethrow, otherwise continue retrying for 'no rows found'
          throw adminFetchError;
        }

        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      if (!createdAdmin) {
        throw new Error('فشل جلب سجل المسؤول بعد الإنشاء. قد يكون التريجر لم يعمل بشكل صحيح أو حدث تأخير.');
      }

      return createdAdmin;

    } catch (error) {
      console.error('خطأ في إنشاء المسؤول:', error);
      throw error instanceof Error ? error : new Error('حدث خطأ غير معروف أثناء إنشاء المسؤول');
    }
  },

  /**
   * تحديث بيانات مسؤول
   * @param adminId معرف المسؤول
   * @param adminData البيانات المراد تحديثها
   * @returns بيانات المسؤول بعد التحديث
   */
  updateAdmin: async (adminId: string, adminData: Partial<Admin>): Promise<Admin> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('admins')
        .update(adminData)
        .eq('id', adminId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('خطأ في تحديث بيانات المسؤول:', error);
      throw error;
    }
  },

  /**
   * تغيير كلمة مرور المسؤول
   * @param adminId معرف المسؤول
   * @param oldPassword كلمة المرور القديمة
   * @param newPassword كلمة المرور الجديدة
   * @returns نتيجة العملية
   */
  changePassword: async (adminId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      // جلب معرف المستخدم من جدول المسؤولين
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('id', adminId)
        .single();

      if (adminError) throw adminError;

      // تغيير كلمة المرور
      const { error } = await supabase.auth.updateUser({ // Needs authenticated user context
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تغيير كلمة المرور'
      };
    }
  },

  /**
   * تغيير حالة نشاط المسؤول
   * @param adminId معرف المسؤول
   * @param isActive الحالة الجديدة (نشط/غير نشط)
   * @returns نتيجة العملية
   */
  toggleAdminStatus: async (adminId: string, isActive: boolean): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('admins')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', adminId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('خطأ في تغيير حالة المسؤول:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تغيير حالة المسؤول'
      };
    }
  },

  /**
   * تحديث صلاحيات المسؤول (الحقل JSONB القديم - قد يكون زائدًا عن الحاجة)
   * @param adminId معرف المسؤول
   * @param permissions الصلاحيات الجديدة
   * @returns نتيجة العملية
   */
  updatePermissions: async (adminId: string, permissions: AdminPermissions): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('admins')
        .update({ 
          permissions: permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('خطأ في تحديث صلاحيات المسؤول:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث صلاحيات المسؤول'
      };
    }
  },

  /**
   * إرسال رابط إعادة تعيين كلمة المرور
   * @param email البريد الإلكتروني
   * @returns نتيجة العملية
   */
  resetPassword: async (email: string): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في إرسال رابط إعادة تعيين كلمة المرور:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور'
      };
    }
  },

  /**
   * جلب قائمة الأدوار المتاحة
   * @returns قائمة كائنات الأدوار (id, name)
   */
  getRoles: async (): Promise<{ id: string; name: string; }[]> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('خطأ في جلب قائمة الأدوار:', error);
      // إذا كان هناك خطأ، نعيد قائمة فارغة أو قيمة افتراضية
      return [];
    }
  },

  /**
   * جلب قائمة الإدارات المتاحة
   * @returns قائمة كائنات الإدارات (id, name)
   */
  getDepartments: async (): Promise<{ id: string; name: string; }[]> => {
    // تعديل لجلب البيانات من جدول departments الفعلي
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('departments') // <-- اسم الجدول الصحيح
        .select('id, name')    // <-- جلب المعرف والاسم
        .order('name');       // <-- ترتيب حسب الاسم (اختياري)

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('خطأ في جلب قائمة الأقسام:', error);
      // إعادة مصفوفة فارغة أو رمي الخطأ حسب الحاجة
      return []; 
    }
  },

  /**
   * حذف مسؤول
   * @param adminId معرف المسؤول
   * @returns نجاح العملية
   */
  deleteAdmin: async (adminId: string): Promise<string> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      // Delete admin from the 'admins' table
      const { error: adminError } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (adminError) throw adminError;

      // Optional: Delete the associated user from Supabase Auth
      // This is a sensitive operation and should ideally be handled server-side (e.g., via an Edge Function)
      // using the service_role key. It CANNOT be called securely from the client.
      const { data: adminRecord, error: fetchError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('id', adminId)
        .single();

      if (fetchError) {
        console.warn(`Could not fetch user_id for admin ${adminId} for Auth deletion:`, fetchError);
      }

      const authUserIdToDelete = adminRecord?.user_id;
      if (authUserIdToDelete) {
          console.warn(`Deletion of Auth user ${authUserIdToDelete} needs to be handled server-side (e.g., in an Edge Function or using service_role key). Skipping client-side deletion attempt.`);
      }

      return adminId; // Return adminId as expected by the Redux thunk
    } catch (error) {
      console.error(`Overall error deleting admin ${adminId}:`, error);
      throw error;
    }
  },
};

// Helper to generate a random password if not provided (for internal use, not recommended for real user signup forms)
// For a production app, the form should handle password generation or prompt the user for it.
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}