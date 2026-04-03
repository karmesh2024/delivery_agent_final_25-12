// 🛡️ Middleware شامل للأمان في Next.js

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './lib/logger-safe';
import { auditLogger, AuditAction, AuditEntity, AuditSeverity } from './lib/auditLogger';
import { errorHandler, ErrorCategory, ErrorSeverity } from './lib/errorHandler';
import { 
  generalLimiter, 
  authLimiter, 
  sensitiveLimiter, 
  securityRateLimiter,
  createRateLimitMiddleware 
} from './lib/rateLimiter';
import { logSecurityEvent, logUserAction } from './lib/logger-safe';

export const config = {
  matcher: [
    '/api/:path*', // جميع API routes
    '/admin/:path*', // صفحات الإدارة
    '/warehouse/:path*', // صفحات المخازن
    '/payment/:path*', // صفحات المدفوعات
  ],
};

// 🎯 دالة معدل عام
const generalRateLimit = createRateLimitMiddleware(generalLimiter);
const authRateLimit = createRateLimitMiddleware(authLimiter);
const sensitiveRateLimit = createRateLimitMiddleware(sensitiveLimiter);
const securityRateLimit = createRateLimitMiddleware(securityRateLimiter);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // 🚦 تطبيق Rate Limiting
    const rateLimitResponse = await applyRateLimit(request, path, method);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 🔒 فحص الأمان
    const securityResponse = await checkSecurity(request, clientIP, userAgent, path);
    if (securityResponse) {
      return securityResponse;
    }

    // 🔐 التحقق من المصادقة والصلاحيات
    const authResponse = await checkAuthentication(request, path, method);
    if (authResponse) {
      return authResponse;
    }

    // 🛡️ فحص البيانات المُدخلة
    const validationResponse = await validateInput(request, path, method);
    if (validationResponse) {
      return validationResponse;
    }

    // 📊 تسجيل الوصول
    await logAccess(request, clientIP, userAgent, startTime);

    return NextResponse.next();

  } catch (error) {
    // 📝 تسجيل الخطأ
    await errorHandler.handleError(
      'MIDDLEWARE_ERROR',
      'خطأ في middleware',
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      { path, method, clientIP, userAgent }
    );

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 🚦 تطبيق Rate Limiting
async function applyRateLimit(
  request: NextRequest, 
  path: string, 
  method: string
): Promise<NextResponse | null> {
  try {
    // تحديد نوع Rate Limiting حسب المسار
    let rateLimitResponse: Response | null = null;

    if (path.includes('/api/auth/') || path.includes('/login') || path.includes('/signin')) {
      rateLimitResponse = await authRateLimit(request);
    } else if (path.includes('/api/admin/') || path.includes('/api/payment/') || path.includes('/api/warehouse/')) {
      rateLimitResponse = await sensitiveRateLimit(request);
    } else if (path.includes('/api/search') || path.includes('/api/export')) {
      rateLimitResponse = await securityRateLimit(request);
    } else {
      rateLimitResponse = await generalRateLimit(request);
    }

    if (rateLimitResponse) {
      // تحويل Response إلى NextResponse
      const nextResponse = NextResponse.json(
        await rateLimitResponse.json(),
        {
          status: rateLimitResponse.status,
          headers: Object.fromEntries(rateLimitResponse.headers.entries())
        }
      );

      // تسجيل محاولة Rate Limiting
      auditLogger.log(
        AuditAction.RATE_LIMIT_EXCEEDED,
        AuditEntity.SYSTEM,
        'تم تجاوز حد الطلبات',
        undefined,
        undefined,
        undefined,
        AuditSeverity.WARNING,
        { path, method, ip: getClientIP(request) },
        false
      );

      return nextResponse;
    }

    return null;
  } catch (error) {
    console.error('خطأ في Rate Limiting:', error);
    return null;
  }
}

// 🔒 فحص الأمان
async function checkSecurity(
  request: NextRequest,
  clientIP: string,
  userAgent: string,
  path: string
): Promise<NextResponse | null> {
  try {
    // استثناء مسارات الـ Webhooks والمسارات الداخلية من فحص الـ User-Agent 
    const isWebhookPath = path.startsWith('/api/webhooks');
    const isInternalPath = path.startsWith('/api/internal/');

    // فحص User-Agent مشبوه
    if (!isWebhookPath && !isInternalPath && isSuspiciousUserAgent(userAgent)) {
      await logSecurityEvent('Suspicious User Agent', {
        ip: clientIP,
        userAgent,
        path,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        { error: 'محتوى غير مسموح' },
        { status: 403 }
      );
    }

    // فحص IP محظور
    if (isBlockedIP(clientIP)) {
      await logSecurityEvent('Blocked IP Access Attempt', {
        ip: clientIP,
        userAgent,
        path,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        { error: 'تم حجب عنوان IP هذا' },
        { status: 403 }
      );
    }

    // فحص المسارات المشبوهة
    if (isSuspiciousPath(path)) {
      await logSecurityEvent('Suspicious Path Access', {
        ip: clientIP,
        userAgent,
        path,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        { error: 'الوصول غير مسموح' },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error('خطأ في فحص الأمان:', error);
    return null;
  }
}

// 🔐 التحقق من المصادقة والصلاحيات
async function checkAuthentication(
  request: NextRequest,
  path: string,
  method: string
): Promise<NextResponse | null> {
  try {
    // طلبات الصفحات (تصفح عادي) لا نفحصها هنا — المصادقة تتم في الواجهة (RouteGuard / جلسة)
    // فقط مسارات الـ API تتطلب Bearer token في الـ middleware
    const isApiPath = path.startsWith('/api/');
    if (!isApiPath) {
      return null;
    }

    const protectedApiPaths = ['/api/admin', '/api/warehouse', '/api/payment'];
    const isProtected = protectedApiPaths.some(protectedPath => path.startsWith(protectedPath));

    if (!isProtected) {
      return null;
    }

    // فحص وجود token لطلبات API المحمية فقط
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      await auditLogger.log(
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        AuditEntity.ADMIN,
        'محاولة وصول غير مصرح به',
        undefined,
        undefined,
        undefined,
        AuditSeverity.WARNING,
        { path, method },
        false,
        'Missing authentication token'
      );

      return NextResponse.json(
        { error: 'مطلوب تسجيل الدخول' },
        { status: 401 }
      );
    }

    // فحص صحة token
    const isValidToken = await validateToken(token);
    if (!isValidToken) {
      await auditLogger.log(
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        AuditEntity.ADMIN,
        'محاولة وصول غير مصرح به - token غير صالح',
        undefined,
        undefined,
        undefined,
        AuditSeverity.WARNING,
        { path, method },
        false,
        'Invalid authentication token'
      );

      return NextResponse.json(
        { error: 'رمز المصادقة غير صالح' },
        { status: 401 }
      );
    }

    return null;
  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    return NextResponse.json(
      { error: 'خطأ في المصادقة' },
      { status: 500 }
    );
  }
}

// 🛡️ فحص البيانات المُدخلة
async function validateInput(
  request: NextRequest,
  path: string,
  method: string
): Promise<NextResponse | null> {
  try {
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return null;
    }

    const contentLength = request.headers.get('content-length');
    const hasBody = contentLength && parseInt(contentLength, 10) > 0;

    // طلبات بدون body (مثل توليد M3U، Cron، تفعيل إجراء) — لا نطبق فحص Content-Type
    if (!hasBody) {
      return null;
    }

    // فحص المحتوى عند وجود body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'نوع المحتوى غير مدعوم' },
        { status: 415 }
      );
    }

    // فحص حجم الطلب (10MB)
    if (parseInt(contentLength!, 10) > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'حجم الطلب كبير جداً' },
        { status: 413 }
      );
    }

    return null;
  } catch (error) {
    console.error('خطأ في فحص البيانات:', error);
    return null;
  }
}

// 📊 تسجيل الوصول
async function logAccess(
  request: NextRequest,
  clientIP: string,
  userAgent: string,
  startTime: number
): Promise<void> {
  try {
    const duration = Date.now() - startTime;
    const url = new URL(request.url);

    logger.info('API Access', {
      method: request.method,
      path: url.pathname,
      ip: clientIP,
      userAgent,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('خطأ في تسجيل الوصول:', error);
  }
}

// 🔍 دوال مساعدة

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /node/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

function isBlockedIP(ip: string): boolean {
  // في بيئة التطوير، نسمح بـ localhost
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    return false; // لا نحظر أي IP في بيئة التطوير
  }
  
  // في بيئة الإنتاج، نحظر IPs محددة (يمكن إضافة IPs محظورة هنا)
  const blockedIPs: string[] = [
    // يمكن إضافة IPs محظورة هنا للإنتاج
  ];
  
  return blockedIPs.includes(ip);
}

function isSuspiciousPath(path: string): boolean {
  const suspiciousPatterns = [
    /\.\./,
    /etc\/passwd/,
    /\.env/,
    /\.git/,
    /admin\/config/,
    /system\//
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(path));
}

async function validateToken(token: string): Promise<boolean> {
  try {
    // فحص وجود token في التخزين
    const storedToken = localStorage.getItem('auth_token');
    return token === storedToken;
  } catch (error) {
    console.error('خطأ في التحقق من token:', error);
    return false;
  }
}