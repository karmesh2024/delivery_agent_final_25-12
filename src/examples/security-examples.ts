/**
 * مثال عملي لاستخدام الأنظمة الأمنية الجديدة
 * يوضح كيفية استخدام Logger الآمن ونظام البيئة
 */

import { logger, authLogger, dbLogger, apiLogger, cleanForLog, validationLogger } from '../lib/logger';
import { validateEnvironment, envManager } from '../lib/environment';

// مثال على دالة تستخدم الأنظمة الآمنة
export async function exampleSecureFunction() {
  try {
    // ✅ استخدام لوجر آمن
    logger.info('Starting secure operation');
    logger.debug('Debug information for development');

    // ✅ تنظيف البيانات الحساسة قبل اللوج
    const userData = {
      id: '123',
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      password: 'secret123', // هذا سيتم إخفاؤه
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // سيتم إخفاؤه
    };
    
    logger.info('User data received', cleanForLog(userData));

    // ✅ استخدام لوجرز متخصصة
    authLogger.login('user-123');
    apiLogger.request('GET', '/api/orders/123');
    
    // ✅ فحص البيئة
    logger.info('Environment info', envManager.getSafeConfigForLogging());
    logger.info(`Is production: ${envManager.isProduction()}`);
    
    // ✅ فحص صحة البيانات
    validationLogger.success('User data validation passed');

    return { success: true };
  } catch (error) {
    // ✅ تسجيل الأخطاء بشكل آمن
    logger.error('Operation failed', cleanForLog({ error: error instanceof Error ? error.message : error }));
    return { success: false };
  }
}

// مثال على API route آمن
export async function exampleSecureApiHandler() {
  try {
    // ✅ فحص البيئة في بداية API
    validateEnvironment();
    
    // ✅ تسجيل طلب API
    apiLogger.request('POST', '/api/secure-endpoint');
    
    // ✅ عملية قاعدة بيانات آمنة
    dbLogger.query('SELECT * FROM users WHERE id = ?');
    dbLogger.connection('success');
    
    return { message: 'Success' };
  } catch (error) {
    // ✅ تسجيل أخطاء API
    apiLogger.error('/api/secure-endpoint', error instanceof Error ? error.message : 'Unknown error');
    
    // ✅ عدم تسريب تفاصيل الخطأ للعميل
    return { error: 'Internal server error' };
  }
}

// مثال على نظام المصادقة الآمن
export async function secureAuthenticationExample(email: string, password: string) {
  try {
    // ✅ التحقق من صحة المدخلات
    if (!email || !password) {
      validationLogger.error('email', email);
      validationLogger.error('password', 'missing');
      return { success: false, error: 'Invalid credentials' };
    }

    // ✅ محاولة تسجيل الدخول
    logger.info(`Login attempt for: ${email}`);
    
    // ✅ محاكاة عملية مصادقة
    // هنا يجب استخدام نظام مصادقة حقيقي مثل Supabase
    
    // ✅ تسجيل نجاح المصادقة
    authLogger.login(email);
    logger.info('Authentication successful');
    
    return { success: true, user: { email } };
  } catch (error) {
    // ✅ تسجيل أخطاء المصادقة
    authLogger.error(`Login failed for ${email}`);
    logger.security('Authentication security issue detected');
    
    return { success: false, error: 'Authentication failed' };
  }
}

// مثال على عملية قاعدة بيانات آمنة
export async function secureDatabaseOperation() {
  try {
    // ✅ فحص البيئة قبل العمليات
    validateEnvironment();
    
    // ✅ تسجيل عملية قاعدة البيانات
    dbLogger.query('INSERT INTO orders (user_id, total) VALUES (?, ?)');
    
    // محاكاة عملية قاعدة البيانات
    // await supabase.from('orders').insert({...});
    
    // ✅ تسجيل نجاح العملية
    logger.info('Database operation completed successfully');
    
    return { success: true };
  } catch (error) {
    // ✅ تسجيل أخطاء قاعدة البيانات
    dbLogger.error(`Database operation failed: ${error instanceof Error ? error.message : error}`);
    
    return { success: false, error: 'Database operation failed' };
  }
}

// مثال على فحوصات الأمان
export function runSecurityChecks() {
  try {
    // ✅ فحص إعدادات البيئة
    const securityValidation = envManager.validateSecuritySettings();
    
    if (!securityValidation.isValid) {
      securityValidation.issues.forEach(issue => {
        if (issue.type === 'CRITICAL') {
          logger.security(`Critical security issue: ${issue.message}`);
        } else {
          logger.warn(`Security warning: ${issue.message}`);
        }
      });
    } else {
      logger.info('All security checks passed');
    }
    
    // ✅ فحص إعدادات الأمان الإضافية
    if (envManager.isProduction()) {
      logger.info('Production environment detected - enhanced security enabled');
      
      // فحص إضافي لبيئة الإنتاج
      const config = envManager.getConfig();
      
      // ✅ عدم تسريب معلومات حساسة
      logger.info('Environment validation', {
        isProduction: true,
        hasDatabaseUrl: !!config.DATABASE_URL,
        hasServiceKey: !!config.SUPABASE_SERVICE_ROLE_KEY
      });
    }
    
    return securityValidation;
  } catch (error) {
    logger.error('Security check failed', error);
    return { isValid: false, issues: [{ type: 'CRITICAL', category: 'Security', message: 'Security validation failed', recommendation: 'Check environment variables' }] };
  }
}

// تصدير جميع الأمثلة
export const securityExamples = {
  exampleSecureFunction,
  exampleSecureApiHandler,
  secureAuthenticationExample,
  secureDatabaseOperation,
  runSecurityChecks
};