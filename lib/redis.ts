import Redis from 'ioredis';

/**
 * Redis client instance untuk rate limiting dan caching
 */
let redis: Redis | null = null;

/**
 * Inisialisasi koneksi Redis
 * @returns Redis instance atau null jika gagal
 */
export function getRedisClient(): Redis | null {
  if (!redis) {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn('REDIS_URL tidak ditemukan di environment variables');
        return null;
      }

      redis = new Redis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // TLS configuration untuk koneksi yang aman
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates untuk development
          // Untuk production, set ke true dan gunakan certificate yang valid
        },
        // Connection settings
        enableOfflineQueue: false,
        family: 4, // IPv4
        keepAlive: 30000, // Keep alive timeout in ms
      });

      redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });

    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  return redis;
}

/**
 * Rate limiting utility dengan Redis
 */
export class RateLimiter {
  private redis: Redis | null;
  private windowMs: number;
  private maxRequests: number;

  /**
   * @param windowMs - Window time dalam milliseconds (default: 15 menit)
   * @param maxRequests - Maximum requests per window (default: 100)
   */
  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.redis = getRedisClient();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check apakah request diizinkan berdasarkan rate limit
   * @param key - Unique identifier (biasanya IP address atau user ID)
   * @returns Object dengan informasi rate limit
   */
  async checkRateLimit(key: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    if (!this.redis) {
      // Jika Redis tidak tersedia, izinkan semua request
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs,
        totalHits: 0,
      };
    }

    const now = Date.now();
    const window = Math.floor(now / this.windowMs);
    const redisKey = `rate_limit:${key}:${window}`;

    try {
      // Increment counter untuk window saat ini
      const pipeline = this.redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, Math.ceil(this.windowMs / 1000));
      
      const results = await pipeline.exec();
      const totalHits = results?.[0]?.[1] as number || 0;

      const remaining = Math.max(0, this.maxRequests - totalHits);
      const resetTime = (window + 1) * this.windowMs;

      return {
        allowed: totalHits <= this.maxRequests,
        remaining,
        resetTime,
        totalHits,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Jika error, izinkan request
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs,
        totalHits: 0,
      };
    }
  }

  /**
   * Reset rate limit untuk key tertentu
   * @param key - Key yang akan di-reset
   */
  async resetRateLimit(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      const pattern = `rate_limit:${key}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Reset rate limit error:', error);
    }
  }
}

/**
 * Default rate limiter instances
 */
export const defaultRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const strictRateLimiter = new RateLimiter(60 * 1000, 10); // 10 requests per minute
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes

/**
 * Utility untuk mendapatkan client IP address
 * @param request - Next.js request object
 * @returns IP address string
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback untuk development
  return '127.0.0.1';
}

/**
 * Cleanup Redis connection saat aplikasi shutdown
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}