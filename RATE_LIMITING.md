# Rate Limiting Documentation

## Overview

Aplikasi ini menggunakan Redis-based rate limiting untuk melindungi API endpoints dari abuse dan memastikan performa yang stabil. Rate limiting diimplementasikan menggunakan middleware yang dapat dikonfigurasi untuk berbagai jenis endpoint.

## Konfigurasi Redis

Rate limiting menggunakan Redis VPS dengan konfigurasi berikut:

```typescript
// lib/redis.ts
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});
```

### Environment Variables

Pastikan variabel environment berikut sudah dikonfigurasi:

```bash
# .env.local (development)
REDIS_HOST=your-redis-host
REDIS_PORT=5432
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# .env (production)
REDIS_HOST=your-production-redis-host
REDIS_PORT=5432
REDIS_PASSWORD=your-production-redis-password
REDIS_TLS=true
```

## Jenis Rate Limiters

### 1. Default Rate Limiter
- **Limit**: 100 requests per 15 menit
- **Penggunaan**: API endpoints umum
- **Key**: IP address

```typescript
export const apiRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 menit
  maxRequests: 100,
  message: 'Too many API requests, please try again later.',
  rateLimiter: defaultRateLimiter,
});
```

### 2. Authentication Rate Limiter
- **Limit**: 5 requests per 15 menit
- **Penggunaan**: Authentication endpoints
- **Key**: IP address

```typescript
export const authRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 menit
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
  rateLimiter: authRateLimiter,
});
```

### 3. Strict Rate Limiter
- **Limit**: 10 requests per 1 menit
- **Penggunaan**: Sensitive endpoints (webhooks, schema generation)
- **Key**: IP address

```typescript
export const strictRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 menit
  maxRequests: 10,
  message: 'Rate limit exceeded for this sensitive endpoint.',
  rateLimiter: strictRateLimiter,
});
```

### 4. Upload Rate Limiter
- **Limit**: 20 requests per 1 jam
- **Penggunaan**: File upload endpoints
- **Key**: IP address

```typescript
export const uploadRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 jam
  maxRequests: 20,
  message: 'Too many file uploads, please try again later.',
  rateLimiter: new RateLimiter(60 * 60 * 1000, 20),
});
```

## Implementasi pada Endpoints

### Menggunakan withRateLimit Wrapper

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit-middleware';

/**
 * Handler function untuk endpoint
 */
async function handleRequest(request: NextRequest) {
  // Logic endpoint di sini
  return NextResponse.json({ message: 'Success' });
}

// Export dengan rate limiting
export const GET = withRateLimit(handleRequest, apiRateLimit);
```

### Endpoints yang Sudah Diimplementasikan

#### 1. Authentication Callback
- **Endpoint**: `/auth/callback`
- **Rate Limiter**: `authRateLimit` (5 requests/15 menit)
- **File**: `app/auth/callback/route.ts`

#### 2. Webhooks
- **Endpoint**: `/api/webhooks`
- **Rate Limiter**: `strictRateLimit` (10 requests/1 menit)
- **File**: `app/api/webhooks/route.ts`

#### 3. Schema Generation
- **Endpoint**: `/api/schema/generate`
- **Rate Limiter**: `strictRateLimit` (10 requests/1 menit)
- **File**: `app/api/schema/generate/route.ts`

#### 4. Revalidation
- **Endpoint**: `/api/revalidate`
- **Rate Limiter**: `strictRateLimit` (10 requests/1 menit)
- **File**: `app/api/revalidate/route.ts`

#### 5. Content Entries
- **Endpoint**: `/api/content-entries`
- **Rate Limiter**: `apiRateLimit` (100 requests/15 menit)
- **File**: `app/api/content-entries/route.ts`

## Response Headers

Setiap request yang melalui rate limiting akan mendapat headers berikut:

```
x-ratelimit-limit: 100          // Maksimum requests per window
x-ratelimit-remaining: 95       // Sisa requests yang bisa dilakukan
x-ratelimit-reset: 1640995200   // Timestamp reset window (Unix)
```

## Error Response

Ketika rate limit terlampaui, endpoint akan mengembalikan:

```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

- **Status Code**: 429 (Too Many Requests)
- **retryAfter**: Waktu dalam detik sebelum bisa mencoba lagi

## Testing Rate Limiting

### Manual Testing dengan curl

```bash
# Test endpoint dengan rate limiting
curl -i "http://localhost:3000/api/content-entries?limit=1"

# Test multiple requests untuk melihat counter
for i in {1..5}; do
  curl -s -o /dev/null -w "%{http_code} - Remaining: %{header_x-ratelimit-remaining}\n" \
    "http://localhost:3000/api/content-entries?limit=1"
done
```

### Automated Testing

```typescript
// test/rate-limiting.test.ts
import { NextRequest } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit-middleware';

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    const mockHandler = jest.fn().mockResolvedValue(new Response('OK'));
    
    const response = await apiRateLimit(request, mockHandler);
    expect(response.status).toBe(200);
  });
  
  it('should block requests exceeding limit', async () => {
    // Test implementation
  });
});
```

## Monitoring dan Debugging

### Redis Keys

Rate limiting menggunakan keys dengan format:
```
rate_limit:default:{ip_address}
rate_limit:auth:{ip_address}
rate_limit:strict:{ip_address}
rate_limit:upload:{ip_address}
```

### Monitoring Commands

```bash
# Lihat semua keys rate limiting
redis-cli --scan --pattern "rate_limit:*"

# Lihat detail key tertentu
redis-cli GET "rate_limit:default:192.168.1.1"
redis-cli TTL "rate_limit:default:192.168.1.1"
```

### Logs

Rate limiting akan mencatat aktivitas di console:

```
Rate limit check for key: rate_limit:default:192.168.1.1
Current count: 5, Limit: 100, TTL: 850
```

## Best Practices

1. **Pilih Rate Limiter yang Tepat**
   - Gunakan `authRateLimit` untuk authentication
   - Gunakan `strictRateLimit` untuk sensitive endpoints
   - Gunakan `apiRateLimit` untuk endpoints umum
   - Gunakan `uploadRateLimit` untuk file uploads

2. **Custom Key Generator**
   ```typescript
   const customRateLimit = createRateLimitMiddleware({
     keyGenerator: (request) => {
       // Custom logic untuk generate key
       const userId = request.headers.get('x-user-id');
       return userId ? `user:${userId}` : getClientIP(request);
     }
   });
   ```

3. **Error Handling**
   ```typescript
   async function handleRequest(request: NextRequest) {
     try {
       // Logic endpoint
     } catch (error) {
       console.error('Endpoint error:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

4. **Environment-specific Configuration**
   ```typescript
   const isDevelopment = process.env.NODE_ENV === 'development';
   
   export const devRateLimit = createRateLimitMiddleware({
     maxRequests: isDevelopment ? 1000 : 100, // Lebih longgar di development
     windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000,
   });
   ```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Periksa environment variables
   - Pastikan Redis server berjalan
   - Cek network connectivity

2. **Rate Limit Tidak Berfungsi**
   - Pastikan middleware diimport dengan benar
   - Cek implementasi withRateLimit wrapper
   - Verify Redis keys di database

3. **Performance Issues**
   - Monitor Redis memory usage
   - Optimize key expiration
   - Consider Redis clustering untuk high traffic

### Debug Mode

```typescript
// Aktifkan debug mode
const debugRateLimit = createRateLimitMiddleware({
  ...options,
  keyGenerator: (request) => {
    const key = getClientIP(request);
    console.log(`Rate limit key: ${key}`);
    return key;
  }
});
```

## Deployment Considerations

### Production Setup

1. **Redis Configuration**
   - Gunakan Redis cluster untuk high availability
   - Set up monitoring dan alerting
   - Configure backup dan recovery

2. **Environment Variables**
   - Gunakan secrets management
   - Separate configuration untuk staging/production
   - Monitor environment variable changes

3. **Monitoring**
   - Set up dashboards untuk rate limiting metrics
   - Alert pada high rate limit violations
   - Monitor Redis performance

### Scaling

Untuk aplikasi dengan traffic tinggi:

1. **Redis Clustering**
2. **Load Balancer Configuration**
3. **CDN Integration**
4. **Geographic Rate Limiting**

---

**Note**: Dokumentasi ini akan diupdate seiring dengan perkembangan fitur rate limiting.