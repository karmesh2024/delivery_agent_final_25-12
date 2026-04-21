import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { logger } from './lib/logger-safe';
import { auditLogger, AuditAction, AuditEntity, AuditSeverity } from './lib/auditLogger';
import { 
  generalLimiter, 
  authLimiter, 
  sensitiveLimiter, 
  createRateLimitMiddleware 
} from './lib/rateLimiter';

// تهيئة الـ Rate Limiters
const generalRateLimit = createRateLimitMiddleware(generalLimiter);
const authRateLimit = createRateLimitMiddleware(authLimiter);
const sensitiveRateLimit = createRateLimitMiddleware(sensitiveLimiter);

// 🎯 دالة التحقق الحقيقي من الهوية عبر Supabase
async function validateUserSession(request: NextRequest): Promise<{ userId: string | null; email: string | null }> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => request.cookies.get(name)?.value,
        }
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { userId: null, email: null };
    
    return { userId: user.id, email: user.email || null };
  } catch (e) {
    console.error('[Middleware Auth Error]:', e);
    return { userId: null, email: null };
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // 🚦 1. تطبيق Rate Limiting
    const rateLimitResponse = await applyRateLimit(request, path, method);
    if (rateLimitResponse) return rateLimitResponse;

    // 🔒 2. فحص الأمان (User-Agent, Blocked IPs, Suspicious Paths)
    const securityResponse = await checkSecurity(request, clientIP, userAgent, path);
    if (securityResponse) return securityResponse;

    // ── 3. حماية مسار الـ Pulse الرئيسي (Cron Job) ─────────────
    if (path === '/api/zoon/discovery/pulse') {
      const isVercelCron = request.headers.get('x-vercel-cron') === '1';
      const authorization = request.headers.get('authorization') ?? '';
      const secret = process.env.CRON_SECRET ?? '';
      const expectedBearer = `Bearer ${secret}`;
      const hasValidSecret = secret.length > 0 && authorization === expectedBearer;

      if (!isVercelCron && !hasValidSecret) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.next();
    }

    // 🔐 4. التحقق من المصادقة للمسارات المحمية
    const protectedPaths = ['/api/admin', '/api/warehouse', '/api/payment', '/api/zoon'];
    const isProtected = protectedPaths.some(p => path.startsWith(p));

    if (isProtected) {
      const { userId, email } = await validateUserSession(request);
      
      if (!userId) {
        await auditLogger.log(
          AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
          AuditEntity.SYSTEM,
          'محاولة وصول غير مصرح به',
          undefined, undefined, undefined,
          AuditSeverity.WARNING,
          { path, method, ip: clientIP }
        );
        return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
      }

      // ✅ تفعيل سجل الوصول للمسارات المحمية أيضاً لضمان الشمولية
      await logAccess(request, clientIP, userAgent, startTime);

      // ✅ تمرير الهوية للـ Route التالي
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userId);
      requestHeaders.set('x-user-email', email || '');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // 📊 تسجيل الوصول العادي
    await logAccess(request, clientIP, userAgent, startTime);
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 🚦 تطبيق Rate Limiting
async function applyRateLimit(request: NextRequest, path: string, method: string): Promise<NextResponse | null> {
  try {
    let rateLimitResponse: Response | null = null;
    if (path.includes('/api/auth/') || path.includes('/login')) {
      rateLimitResponse = await authRateLimit(request);
    } else if (path.includes('/api/admin/') || path.includes('/api/zoon')) {
      rateLimitResponse = await sensitiveRateLimit(request);
    } else {
      rateLimitResponse = await generalRateLimit(request);
    }

    if (rateLimitResponse) {
      return NextResponse.json(await rateLimitResponse.json(), {
        status: rateLimitResponse.status,
        headers: Object.fromEntries(rateLimitResponse.headers.entries())
      });
    }
    return null;
  } catch (error) { return null; }
}

// 🔒 فحص الأمان
async function checkSecurity(request: NextRequest, clientIP: string, userAgent: string, path: string): Promise<NextResponse | null> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // فحص السلوك المشبوه (فقط في الإنتاج لتجنب حظر أدوات التطوير)
  if (isProduction && isSuspiciousUserAgent(userAgent)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (isBlockedIP(clientIP) || isSuspiciousPath(path)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// 📊 تسجيل الوصول
async function logAccess(request: NextRequest, clientIP: string, userAgent: string, startTime: number): Promise<void> {
  const duration = Date.now() - startTime;
  logger.info('Access Log', { method: request.method, path: new URL(request.url).pathname, ip: clientIP, duration: `${duration}ms` });
}

// 🔍 Helpers
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const patterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];
  return patterns.some(p => p.test(userAgent));
}

function isBlockedIP(ip: string): boolean {
  return false; // يمكن إضافة قائمة حظر هنا في المستقبل
}

function isSuspiciousPath(path: string): boolean {
  const patterns = [/\.\./, /etc\/passwd/, /\.env/, /\.git/, /admin\/config/];
  return patterns.some(p => p.test(path));
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/warehouse/:path*',
    '/payment/:path*',
  ],
};