import { Admin, AdminRole } from './index';

/**
 * بيانات اعتماد المسؤول لتسجيل الدخول
 */
export interface AdminCredentials {
  email: string;
  password: string;
}

/**
 * بيانات تسجيل مسؤول جديد
 */
export interface AdminRegistration {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  invitation_token?: string; // اختياري إذا كنت تستخدم نظام الدعوات
}

/**
 * حالة المصادقة في Redux
 */
export interface AuthState {
  isAuthenticated: boolean;
  currentAdmin: Admin | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  resetEmailSent: boolean;
}

/**
 * نتيجة عملية المصادقة
 */
export interface AuthResult {
  success: boolean;
  admin?: Admin;
  token?: string;
  error?: string;
  // حقول إضافية للتعامل مع تأكيد البريد الإلكتروني
  emailNotConfirmed?: boolean;
  emailConfirmationRequired?: boolean;
  email?: string;
}

/**
 * طلب إعادة تعيين كلمة المرور
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * طلب تحديث كلمة المرور
 */
export interface UpdatePasswordRequest {
  password: string;
  confirm_password: string;
}