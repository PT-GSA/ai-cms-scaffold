import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, getClientIP, defaultRateLimiter, strictRateLimiter, authRateLimiter } from './redis';

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  rateLimiter?: RateLimiter;
}

/**
 * Default rate limit configuration
 */
const DEFAULT_OPTIONS: Required<RateLimitOptions> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (request: NextRequest) => getClientIP(request),
  rateLimiter: defaultRateLimiter,
};

/**
 * Rate limiting middleware untuk Next.js API routes
 * @param options - Konfigurasi rate limiting
 * @returns Middleware function
 */
export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Generate key untuk rate limiting (biasanya IP address)
      const key = config.keyGenerator(request);
      
      // Check rate limit
      const rateLimitResult = await config.rateLimiter.checkRateLimit(key);
      
      // Jika rate limit terlampaui
      if (!rateLimitResult.allowed) {
        const response = NextResponse.json(
          {
            error: config.message,
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          },
          { status: config.statusCode }
        );

        // Tambahkan rate limit headers
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());

        return response;
      }

      // Jalankan handler asli
      const response = await handler(request);

      // Tambahkan rate limit headers ke response yang sukses
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      return response;

    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Jika error, lanjutkan tanpa rate limiting
      return await handler(request);
    }
  };
}

/**
 * Pre-configured rate limit middlewares untuk berbagai use cases
 */

/**
 * Rate limiter untuk API endpoints umum
 * 100 requests per 15 minutes
 */
export const apiRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  message: 'Too many API requests, please try again later.',
  rateLimiter: defaultRateLimiter,
});

/**
 * Rate limiter untuk authentication endpoints
 * 5 attempts per 15 minutes
 */
export const authRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
  statusCode: 429,
  rateLimiter: authRateLimiter,
});

/**
 * Rate limiter yang ketat untuk endpoints sensitif
 * 10 requests per minute
 */
export const strictRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Rate limit exceeded for this sensitive endpoint.',
  rateLimiter: strictRateLimiter,
});

/**
 * Rate limiter untuk media upload
 * 20 uploads per hour
 */
export const uploadRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  message: 'Too many file uploads, please try again later.',
  rateLimiter: new RateLimiter(60 * 60 * 1000, 20),
});

/**
 * Helper function untuk apply rate limiting ke API route
 * @param handler - API route handler
 * @param rateLimitMiddleware - Rate limit middleware to use
 * @returns Wrapped handler dengan rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimitMiddleware = apiRateLimit
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    return await rateLimitMiddleware(request, handler);
  };
}

/**
 * Rate limiter berdasarkan user ID (untuk authenticated users)
 * @param options - Rate limit options
 * @returns Middleware function
 */
export function createUserRateLimit(options: RateLimitOptions = {}) {
  return createRateLimitMiddleware({
    ...options,
    keyGenerator: (request: NextRequest) => {
      // Try to get user ID from headers atau token
      const userId = request.headers.get('x-user-id') || 
                    request.headers.get('authorization')?.split(' ')[1] || 
                    getClientIP(request);
      return `user:${userId}`;
    },
  });
}

/**
 * Rate limiter berdasarkan API key
 * @param options - Rate limit options
 * @returns Middleware function
 */
export function createApiKeyRateLimit(options: RateLimitOptions = {}) {
  return createRateLimitMiddleware({
    ...options,
    keyGenerator: (request: NextRequest) => {
      const apiKey = request.headers.get('x-api-key') || 
                    request.headers.get('authorization')?.replace('Bearer ', '') ||
                    'anonymous';
      return `apikey:${apiKey}`;
    },
  });
}