import { refreshToken, logout } from '@/domains/admins/store/authSlice';
import { store } from '@/store';

// تعريف نوع للأخطاء
interface AuthError {
  status?: number;
  message?: string;
  code?: string;
  details?: string;
  // استخدام Record بدلاً من [key: string]: any
  [key: string]: unknown;
}

/**
 * معترض للطلبات لمعالجة أخطاء المصادقة
 * يستخدم في حالة الحصول على خطأ 401 (غير مصرح)
 */
export const handleAuthError = async (error: AuthError | unknown): Promise<boolean> => {
  // التحقق مما إذا كان الخطأ هو خطأ مصادقة
  const authError = error as AuthError;
  
  if (authError?.status === 401 || 
      authError?.message?.includes('JWT expired') || 
      authError?.message?.includes('invalid JWT') ||
      authError?.message?.includes('not authenticated')) {
    console.log('تم اكتشاف خطأ مصادقة، محاولة تجديد الجلسة...');
    
    try {
      // محاولة تجديد التوكن
      const refreshResult = await store.dispatch(refreshToken()).unwrap();
      
      if (refreshResult.success) {
        console.log('تم تجديد الجلسة بنجاح');
        return true; // يمكن إعادة المحاولة
      } else {
        console.error('فشل تجديد الجلسة:', refreshResult.error);
      }
    } catch (refreshError) {
      console.error('خطأ أثناء تجديد الجلسة:', refreshError);
    }
    
    // إذا وصلنا إلى هنا، فإن تجديد الجلسة قد فشل
    console.log('تسجيل الخروج بسبب فشل تجديد الجلسة');
    store.dispatch(logout());
    
    // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return false; // لا يمكن إعادة المحاولة
  }
  
  // إذا لم يكن خطأ مصادقة، فلا نتعامل معه هنا
  return false;
};

/**
 * دالة مساعدة لتنفيذ استعلام مع معالجة أخطاء المصادقة
 */
export const executeWithAuthRetry = async <T>(
  queryFn: () => Promise<T>,
  maxRetries = 1
): Promise<T> => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      return await queryFn();
    } catch (error) {
      if (retries < maxRetries && (await handleAuthError(error))) {
        // إذا كان الخطأ هو خطأ مصادقة وتم تجديد الجلسة بنجاح، نحاول مرة أخرى
        retries++;
        continue;
      }
      
      // إذا لم يكن خطأ مصادقة أو فشل تجديد الجلسة، نرمي الخطأ
      throw error;
    }
  }
  
  throw new Error('فشل تنفيذ الاستعلام بعد محاولات متعددة');
}; 