// 🚦 نظام Rate Limiting متطور لمشروع بيكب

export interface RateLimitConfig {
  windowMs: number; // النافذة الزمنية بالميلي ثانية
  maxRequests: number; // الحد الأقصى للطلبات
  message?: string; // رسالة الخطأ
  keyGenerator?: (req: Request) => string; // مولد المفاتيح
  skipSuccessfulRequests?: boolean; // تجاهل الطلبات الناجحة
  skipFailedRequests?: boolean; // تجاهل الطلبات الفاشلة
  headers?: boolean; // إضافة headers للاستجابة
  limit?: number; // للحد من الطلبات حسب user
  skip?: (req: Request) => boolean; // دالة لتخطي التحقق
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  totalHits: number;
}

class RateLimiter {
  private store: Map<string, { count: number; resetTime: number; totalHits: number }> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    // التحقق من صحة الإعدادات
    if (!config || typeof config !== 'object') {
      throw new Error('RateLimiter config must be a valid object');
    }

    // خلط الإعدادات الافتراضية مع المخصصة - المخصصة تتجاوز الافتراضية
    this.config = {
      ...{
        windowMs: 60000, // دقيقة واحدة افتراضياً
        maxRequests: 60,
        message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        headers: true,
      },
      ...config,
    };

    // التحقق من صحة القيم
    if (this.config.windowMs <= 0 || this.config.maxRequests <= 0) {
      throw new Error('windowMs and maxRequests must be positive numbers');
    }

    // تنظيف السجلات المنتهية الصلاحية كل 5 دقائق
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // تنظيف الموارد عند تدمير الكائن
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  // 🧹 تنظيف السجلات المنتهية الصلاحية
  private cleanup(): void {
    const now = Date.now();
    // استخدام طريقة متوافقة مع ES2017
    this.store.forEach((value, key) => {
      if (value.resetTime <= now) {
        this.store.delete(key);
      }
    });
  }

  // 🔑 إنشاء مفتاح فريد للطلب
  private generateKey(req: Request): string {
    try {
      if (this.config.keyGenerator) {
        return this.config.keyGenerator(req);
      }

      // إنشاء مفتاح بناءً على IP و User-Agent
      const ip = req.headers.get('x-forwarded-for') ||
                  req.headers.get('x-real-ip') ||
                  '127.0.0.1';
      
      const userAgent = req.headers.get('user-agent') || 'unknown';
      const path = new URL(req.url).pathname;
      
      return `${ip}:${userAgent}:${path}`;
    } catch (error) {
      // في حالة خطأ، استخدم مفتاح احتياطي
      return `error:${Date.now()}:${Math.random()}`;
    }
  }

  // 🎯 التحقق من الحد المسموح
  async checkLimit(req: Request): Promise<{ allowed: boolean; info?: RateLimitInfo; remainingTime?: number }> {
    try {
      // التحقق من صحة الطلب
      if (!req || typeof req !== 'object' || !req.url) {
        throw new Error('Invalid request object');
      }

      // التحقق من التخطي
      if (this.config.skip && this.config.skip(req)) {
        return { allowed: true };
      }

      const key = this.generateKey(req);
      const now = Date.now();
      
      // الحصول على البيانات الحالية
      const current = this.store.get(key) || { count: 0, resetTime: now + this.config.windowMs, totalHits: 0 };
      
      // تحديث النافذة الزمنية
      if (now > current.resetTime) {
        current.count = 0;
        current.resetTime = now + this.config.windowMs;
      }

      // زيادة العداد
      current.count++;
      current.totalHits++;
      
      // حفظ البيانات
      this.store.set(key, current);

      // التحقق من الحد المسموح
      const allowed = current.count <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - current.count);

      const info: RateLimitInfo = {
        limit: this.config.maxRequests,
        remaining,
        reset: current.resetTime,
        totalHits: current.totalHits,
      };

      const remainingTime = current.resetTime - now;

      return { allowed, info, remainingTime };
    } catch (error) {
      // في حالة خطأ، اعرض الطلب
      console.error('RateLimit check failed:', error);
      return { allowed: true };
    }
  }

  // 📊 الحصول على معلومات الحالة
  getStatus(key: string): RateLimitInfo | null {
    const data = this.store.get(key);
    if (!data) return null;

    return {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - data.count),
      reset: data.resetTime,
      totalHits: data.totalHits,
    };
  }

  // 🗑️ مسح بيانات مفاتيح معينة
  clearKey(key: string): void {
    this.store.delete(key);
  }

  // 🔄 إعادة تعيين جميع الحدود
  reset(): void {
    this.store.clear();
  }
}

// 🎛️ إعدادات Rate Limiting المختلفة
export const rateLimitConfigs = {
  // حد عام للAPI
  general: {
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    maxRequests: 1000,
    message: 'تم تجاوز الحد المسموح من الطلبات العامة.',
  } as RateLimitConfig,

  // حد صارم للمصادقة
  auth: {
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    maxRequests: 5,
    message: 'تم تجاوز حد محاولات تسجيل الدخول.',
  } as RateLimitConfig,

  // حد متوسط للعمليات الحساسة
  sensitive: {
    windowMs: 10 * 60 * 1000, // 10 دقائق
    maxRequests: 10,
    message: 'تم تجاوز حد العمليات الحساسة.',
  } as RateLimitConfig,

  // حد للطلبات الثقيلة
  heavy: {
    windowMs: 60 * 60 * 1000, // ساعة
    maxRequests: 50,
    message: 'تم تجاوز حد الطلبات الثقيلة.',
  } as RateLimitConfig,

  // حد فوري للطلبات الفورية
  immediate: {
    windowMs: 60 * 1000, // دقيقة واحدة
    maxRequests: 1,
    message: 'الطلب السابق لم يتم معالجته بعد.',
  } as RateLimitConfig,
};

// 🌍 instances مختلفة
export const generalLimiter = new RateLimiter(rateLimitConfigs.general);
export const authLimiter = new RateLimiter(rateLimitConfigs.auth);
export const sensitiveLimiter = new RateLimiter(rateLimitConfigs.sensitive);
export const heavyLimiter = new RateLimiter(rateLimitConfigs.heavy);
export const immediateLimiter = new RateLimiter(rateLimitConfigs.immediate);

// 🔧 دوال مساعدة
export const createCustomLimiter = (config: RateLimitConfig) => {
  return new RateLimiter(config);
};

// 🚀 Middleware لـ Next.js
export const createRateLimitMiddleware = (limiter: RateLimiter) => {
  return async (req: Request): Promise<Response | null> => {
    const { allowed, info, remainingTime } = await limiter.checkLimit(req);

    if (!allowed) {
      const response = new Response(
        JSON.stringify({ 
          error: 'Too Many Requests',
          message: 'تم تجاوز الحد المسموح من الطلبات.',
          retryAfter: Math.ceil(remainingTime! / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(remainingTime! / 1000).toString(),
          },
        }
      );

      // إضافة headers معلوماتية
      if (info) {
        response.headers.set('X-RateLimit-Limit', info.limit.toString());
        response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(info.reset / 1000).toString());
      }

      return response;
    }

    return null; // متاح
  };
};

// 🔐 Rate Limiting للأمان
export const securityRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  maxRequests: 3,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `security:${ip}:${userAgent}`;
  },
});

// 📱 Rate Limiting للمستخدمين
export const userRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // دقيقة واحدة
  maxRequests: 100,
  keyGenerator: (req) => {
    const userId = req.headers.get('x-user-id') || 'anonymous';
    return `user:${userId}`;
  },
});

// 🔍 Rate Limiting للبحث
export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // دقيقة واحدة
  maxRequests: 20,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const query = new URL(req.url).searchParams.get('q') || '';
    return `search:${ip}:${query.substring(0, 50)}`;
  },
});