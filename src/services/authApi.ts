import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import {
  AdminCredentials,
  AdminRegistration,
  AuthState,
  AuthResult,
  ResetPasswordRequest,
  UpdatePasswordRequest
} from '@/domains/admins/types/auth';
import { Admin, AdminRole, UpdateAdminDto, AdminPermissions, CreateAdminDto } from '@/domains/admins/types/index';

// إضافة النظام الأمني الجديد
import { logger, authLogger, apiLogger, cleanForLog, validationLogger } from '@/lib/logger-safe';
import { validateEnvironment } from '@/lib/environment';

// فحص البيئة
validateEnvironment();

/**
 * واجهة برمجة التطبيق للمصادقة
 */
export const authApi = {
  /**
   * تسجيل الدخول للمسؤول
   */
  login: async (credentials: AdminCredentials): Promise<AuthResult> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // تسجيل الدخول باستخدام Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      // التحقق من نوع الخطأ لمعرفة ما إذا كان البريد الإلكتروني غير مؤكد
      if (authError) {
        if (authError.message.includes('Email not confirmed') || 
            (authError as { code?: string })?.code === 'email_not_confirmed' ||
            (authError as { status?: number })?.status === 400) {
          return {
            success: false,
            error: 'لم يتم تأكيد البريد الإلكتروني بعد. يرجى التحقق من بريدك الإلكتروني والنقر على رابط التأكيد.',
            emailNotConfirmed: true,
            email: credentials.email
          };
        }
        throw authError;
      }

      // التحقق من وجود المستخدم في جدول المسؤولين
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select(`
          *,
          roles ( name )
        `)
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle();

      // إذا لم يتم العثور على المستخدم في جدول المسؤولين
      if (!adminData) {
        // محاولة جلب المستخدم بدون شرط is_active
        const { data: inactiveAdmin, error: inactiveError } = await supabase
          .from('admins')
          .select(`*`)
          .eq('user_id', authData.user.id)
          .maybeSingle();
          
        if (inactiveAdmin) {
          // المستخدم موجود لكنه غير نشط
          await supabase.auth.signOut();
          throw new Error('حسابك غير نشط. يرجى الاتصال بالمسؤول لتفعيل حسابك.');
        }
        
        // المستخدم غير موجود في جدول المسؤولين
        await supabase.auth.signOut();
        throw new Error('غير مصرح لهذا المستخدم بالوصول إلى لوحة التحكم.');
      }

      // Define a type for admin data including the nested role name
      type AdminDataWithRole = typeof adminData & { roles: { name: string } | null };

      // التعامل مع الصلاحيات (role name is now fetched directly)
      const adminPermissions = adminData.permissions || {};

      // تحويل البيانات إلى كائن Admin
      const admin: Admin = {
        id: adminData.id,
        user_id: adminData.user_id,
        email: adminData.email,
        username: adminData.username || '',
        full_name: adminData.full_name || '', 
        is_active: adminData.is_active || true,
        // Assign the role name fetched from the join, or null/undefined
        role: (adminData as AdminDataWithRole).roles?.name || null, 
        role_id: adminData.role_id,
        department_id: adminData.department_id,
        manager_id: adminData.manager_id,
        job_title: adminData.job_title, // Make sure these exist in adminData or handle null
        phone: adminData.phone,
        profile_image_url: adminData.profile_image_url,
        permissions: adminPermissions,
        last_login: adminData.last_login, // Make sure these exist in adminData or handle null
        created_at: adminData.created_at,
        updated_at: adminData.updated_at
      };

      return {
        success: true,
        admin,
        token: authData.session?.access_token
      };
    } catch (error) {
      authLogger.security(`Login failed for user: ${cleanForLog({ email: credentials.email, error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول'
      };
    }
  },

  /**
   * تسجيل مسؤول جديد
   */
  register: async (registration: AdminRegistration): Promise<AuthResult> => {
    try {
      // التحقق من تطابق كلمتي المرور
      if (registration.password !== registration.confirm_password) {
        throw new Error('كلمتا المرور غير متطابقتين');
      }

      // التحقق من رمز الدعوة إذا كان مطلوبًا
      if (registration.invitation_token) {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { data: invitation, error: invitationError } = await supabase
          .from('admin_invitations')
          .select('*')
          .eq('token', registration.invitation_token)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (invitationError || !invitation) {
          throw new Error('رمز الدعوة غير صالح أو منتهي الصلاحية');
        }

        if (invitation.email !== registration.email) {
          throw new Error('البريد الإلكتروني لا يتطابق مع الدعوة');
        }
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // إنشاء حساب المستخدم في Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registration.email,
        password: registration.password,
        options: {
          data: {
            full_name: registration.full_name
          }
        }
      });

      if (authError) throw authError;

      // المستخدم تم إنشاؤه، لكن قد يحتاج إلى تأكيد البريد الإلكتروني
      // معالج المحفز الذي أنشأناه سيضيف المستخدم تلقائيًا إلى جدول المسؤولين

      return {
        success: true,
        token: authData.session?.access_token,
        admin: undefined, // لن يكون هناك مسؤول حتى يتم تأكيد البريد الإلكتروني
        emailConfirmationRequired: authData.user ? !authData.user.email_confirmed_at : true,
        email: registration.email
      };
    } catch (error) {
      authLogger.security(`Admin registration failed: ${cleanForLog({ email: registration.email, error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل المسؤول الجديد'
      };
    }
  },

  /**
   * إعادة إرسال رابط تأكيد البريد الإلكتروني
   */
  resendEmailConfirmation: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      authLogger.error(`Email resend failed for: ${cleanForLog({ email: email, error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء إعادة إرسال رابط التأكيد'
      };
    }
  },

  /**
   * تسجيل خروج المسؤول
   */
  logout: async (): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      authLogger.error(`Logout failed: ${cleanForLog({ error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الخروج'
      };
    }
  },

  /**
   * تجديد JWT عند انتهاء صلاحيته
   */
  refreshToken: async (): Promise<AuthResult> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (data.session) {
        // جلب بيانات المسؤول بعد تجديد الجلسة
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select(`
            *,
            roles ( name )
          `)
          .eq('user_id', data.user?.id || '')
          .eq('is_active', true)
          .maybeSingle();
          
        if (adminError || !adminData) {
          throw new Error('فشل في جلب بيانات المسؤول بعد تجديد الجلسة');
        }
        
        // تحويل البيانات إلى كائن Admin (نفس الكود الموجود في دالة login)
        type AdminDataWithRole = typeof adminData & { roles: { name: string } | null };
        const adminPermissions = adminData.permissions || {};
        
        const admin: Admin = {
          id: adminData.id,
          user_id: adminData.user_id,
          email: adminData.email,
          username: adminData.username || '',
          full_name: adminData.full_name || '', 
          is_active: adminData.is_active || true,
          role: (adminData as AdminDataWithRole).roles?.name || null, 
          role_id: adminData.role_id,
          department_id: adminData.department_id,
          manager_id: adminData.manager_id,
          job_title: adminData.job_title,
          phone: adminData.phone,
          profile_image_url: adminData.profile_image_url,
          permissions: adminPermissions,
          last_login: adminData.last_login,
          created_at: adminData.created_at,
          updated_at: adminData.updated_at
        };
        
        return {
          success: true,
          admin,
          token: data.session.access_token
        };
      }
      
      return { success: false, error: 'لا يمكن تجديد الجلسة' };
    } catch (error) {
      authLogger.error(`Token refresh failed: ${cleanForLog({ error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تجديد الجلسة'
      };
    }
  },

  /**
   * التحقق من حالة المصادقة الحالية
   */
  checkAuth: async (): Promise<AuthResult> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // التحقق من وجود جلسة حالية
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        return { success: false, error: 'لا توجد جلسة نشطة' };
      }

      // جلب بيانات المسؤول
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select(`
          *,
          roles ( name )
        `)
        .eq('user_id', sessionData.session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!adminData) {
        await supabase.auth.signOut();
        throw new Error('غير مصرح لهذا المستخدم بالوصول إلى لوحة التحكم');
      }

      // Define a type for admin data including the nested role name
      type AdminDataWithRole = typeof adminData & { roles: { name: string } | null };

      // التعامل مع الصلاحيات (role name is now fetched directly)
      const adminPermissions = adminData.permissions || {};

      // تحويل البيانات إلى كائن Admin
      const admin: Admin = {
        id: adminData.id,
        user_id: adminData.user_id,
        email: adminData.email,
        username: adminData.username || '',
        full_name: adminData.full_name || '',
        is_active: adminData.is_active || true,
        // Assign the role name fetched from the join, or null/undefined
        role: (adminData as AdminDataWithRole).roles?.name || null, 
        role_id: adminData.role_id,
        department_id: adminData.department_id,
        manager_id: adminData.manager_id,
        job_title: adminData.job_title, // Make sure these exist in adminData or handle null
        phone: adminData.phone,
        profile_image_url: adminData.profile_image_url,
        permissions: adminPermissions,
        last_login: adminData.last_login, // Make sure these exist in adminData or handle null
        created_at: adminData.created_at,
        updated_at: adminData.updated_at
      };

      return {
        success: true,
        admin,
        token: sessionData.session.access_token
      };
    } catch (error) {
      authLogger.error(`Auth check failed: ${cleanForLog({ error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق من حالة المصادقة'
      };
    }
  },

  /**
   * طلب إعادة تعيين كلمة المرور
   */
  resetPassword: async (request: ResetPasswordRequest): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(request.email);
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      authLogger.error(`Password reset failed: ${cleanForLog({ email: request.email, error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء طلب إعادة تعيين كلمة المرور'
      };
    }
  },

  /**
   * تحديث كلمة المرور
   */
  updatePassword: async (request: UpdatePasswordRequest): Promise<{ success: boolean, error?: string }> => {
    try {
      if (request.password !== request.confirm_password) {
        throw new Error('كلمتا المرور غير متطابقتين');
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.auth.updateUser({
        password: request.password
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      authLogger.security(`Password update failed: ${cleanForLog({ error: error instanceof Error ? error.message : 'Unknown' })}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث كلمة المرور'
      };
    }
  },

  /**
   * الحصول على معلومات المسؤول الحالي
   */
  getCurrentAdmin: async (): Promise<Admin | null> => {
    try {
      const result = await authApi.checkAuth();
      if (!result.success || !result.admin) {
        return null;
      }
      return result.admin;
    } catch (error) {
      authLogger.error(`Get current admin failed: ${cleanForLog({ error: error instanceof Error ? error.message : 'Unknown' })}`);
      return null;
    }
  },

  /**
   * التحقق من وجود صلاحية
   */
  hasPermission: async (adminId: string, permissionCode: string): Promise<boolean> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // تم تجنب طباعة adminId والصلاحية في اللوج للأمان
      const { data, error } = await supabase.rpc('check_admin_permission_enhanced', {
        admin_id: adminId,
        permission_code: permissionCode
      });
      
      if (error) {
        authLogger.error(`Permission check failed for admin: ${adminId}: ${cleanForLog({ error: error.message })}`);
        return false;
      }
      
      return !!data;
    } catch (error) {
      authLogger.error(`Unexpected error in permission check for admin: ${adminId}: ${cleanForLog({ error: error instanceof Error ? error.message : 'Unknown' })}`);
      return false;
    }
  }
};