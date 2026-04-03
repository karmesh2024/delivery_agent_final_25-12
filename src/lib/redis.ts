import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 0, // لا تعيد المحاولة أبداً
        retryStrategy: () => null, 
        connectTimeout: 500,
        lazyConnect: true,
        showFriendlyErrorStack: false,
        enableOfflineQueue: false, // لا تراكم الطلبات إذا كان مغلقاً
      });

      // منع خروج أي أخطاء للتيرمينال
      this.instance.on('error', () => {});
    }
    return this.instance;
  }
}

export const redis = RedisClient.getInstance();

export async function getCache<T>(key: string): Promise<T | null> {
  if (redis.status !== 'ready') return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  if (redis.status !== 'ready') return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
}

/**
 * تسجيل حدث للتحليلات (Analytics)
 */
export async function trackEvent(name: string, value: number = 1): Promise<void> {
  if (redis.status !== 'ready') return;
  try {
    const key = `zoon:analytics:${name}`;
    if (name === 'latency') {
      // الاحتفاظ بآخر 100 قياس لزمن التأخير فقط
      await redis.lpush(key, value.toString());
      await redis.ltrim(key, 0, 99);
    } else {
      await redis.incrby(key, value);
    }
  } catch {}
}

/**
 * جلب ملخص التحليلات
 */
export async function getAnalytics() {
  if (redis.status !== 'ready') return null;
  try {
    const keys = ['cache_hits', 'cache_misses', 'total_searches', 'firecrawl_calls', 'puppeteer_calls'];
    const stats: Record<string, number> = {};
    
    for (const k of keys) {
      const val = await redis.get(`zoon:analytics:${k}`);
      stats[k] = parseInt(val || '0', 10);
    }

    const latencies = await redis.lrange('zoon:analytics:latency', 0, -1);
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + parseInt(b, 10), 0) / latencies.length 
      : 0;

    return {
      ...stats,
      avg_latency_ms: Math.round(avgLatency),
      cache_hit_rate: stats.total_searches > 0 
        ? Math.round((stats.cache_hits / stats.total_searches) * 100) 
        : 0
    };
  } catch {
    return null;
  }
}
