# 🌐 CORS Configuration Guide

Panduan lengkap untuk konfigurasi Cross-Origin Resource Sharing (CORS) pada AI CMS Scaffold.

## 📋 Daftar Isi

- [Overview](#overview)
- [Fitur CORS](#fitur-cors)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Implementasi](#implementasi)
- [Testing](#testing)
- [Production Setup](#production-setup)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

CORS (Cross-Origin Resource Sharing) adalah mekanisme keamanan yang memungkinkan atau membatasi akses ke resource dari domain yang berbeda. Konfigurasi ini penting untuk:

- **API Security**: Mengontrol akses ke API endpoints
- **Frontend Integration**: Memungkinkan frontend dari domain berbeda mengakses API
- **Production Safety**: Mencegah akses tidak sah dari domain yang tidak diizinkan

## ✨ Fitur CORS

### 🔧 Fitur Utama

- ✅ **Environment-based Origins**: Konfigurasi berbeda untuk development dan production
- ✅ **Flexible Origin Matching**: Support untuk exact match dan wildcard patterns
- ✅ **Preflight Request Handling**: Otomatis menangani OPTIONS requests
- ✅ **Secure Headers**: Konfigurasi headers yang aman untuk production
- ✅ **Middleware Integration**: Terintegrasi dengan Next.js middleware
- ✅ **API Route Wrapper**: Higher-order function untuk individual API routes

### 🛡️ Security Features

- 🔒 **Credential Support**: Mengatur Access-Control-Allow-Credentials
- 🔒 **Method Restrictions**: Membatasi HTTP methods yang diizinkan
- 🔒 **Header Validation**: Validasi headers yang diizinkan
- 🔒 **Origin Validation**: Validasi ketat untuk allowed origins

## ⚙️ Konfigurasi Environment

### Development (.env.local)

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# CORS Configuration untuk Development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
```

### Production (.env)

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# CORS Configuration untuk Production
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | URL utama aplikasi | `https://yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list origins yang diizinkan | `https://domain1.com,https://domain2.com` |
| `VERCEL_URL` | Otomatis diset oleh Vercel | `your-app.vercel.app` |

## 🚀 Implementasi

### 1. CORS Utility Library

File: `lib/cors.ts`

```typescript
import { withCors } from '@/lib/cors'

// Untuk API route
export const GET = withCors(async (request) => {
  // Handler logic
  return NextResponse.json({ data: 'success' })
})
```

### 2. Middleware Integration

File: `middleware.ts`

```typescript
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/cors"

export async function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const preflightResponse = handleCorsPreflightRequest(request)
    if (preflightResponse) {
      return preflightResponse
    }
  }

  // ... other middleware logic

  // Add CORS headers untuk API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response = addCorsHeaders(response, request)
  }

  return response
}
```

### 3. API Route Implementation

#### Contoh: Public API dengan CORS

```typescript
// app/api/public/content-types/route.ts
import { withCors } from '@/lib/cors'

async function getHandler(request: NextRequest) {
  // API logic
  return NextResponse.json(data)
}

export const GET = withCors(getHandler)
```

#### Contoh: Custom CORS Options

```typescript
import { withCors } from '@/lib/cors'

const corsOptions = {
  origin: ['https://trusted-domain.com'],
  methods: ['GET', 'POST'],
  credentials: false
}

export const GET = withCors(getHandler, corsOptions)
```

## 🧪 Testing

### 1. Manual Testing dengan cURL

#### Test Preflight Request

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v http://localhost:3000/api/public/content-types
```

#### Test Actual Request

```bash
curl -X GET \
  -H "Origin: http://localhost:3001" \
  -H "Content-Type: application/json" \
  -v http://localhost:3000/api/public/content-types
```

### 2. Browser Testing

Buka file `test-cors.html` di browser untuk testing interaktif:

```bash
# Serve file test
python3 -m http.server 8080
# Atau
npx serve .
```

Kemudian buka `http://localhost:8080/test-cors.html`

### 3. Expected Headers

Response yang benar harus mengandung headers:

```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
Vary: Origin
```

## 🌍 Production Setup

### 1. Vercel Deployment

Tambahkan environment variables di Vercel dashboard:

```bash
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Custom Domain Setup

Untuk multiple domains:

```bash
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com
```

### 3. Wildcard Patterns

Untuk subdomain patterns:

```bash
CORS_ALLOWED_ORIGINS=https://*.yourdomain.com,https://yourdomain.com
```

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Error: "Access to fetch blocked"

**Penyebab**: Origin tidak ada dalam allowed origins list

**Solusi**:
```bash
# Tambahkan origin ke CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://newdomain.com
```

#### 2. Preflight Request Failed

**Penyebab**: OPTIONS request tidak ditangani dengan benar

**Solusi**: Pastikan middleware menangani preflight requests:
```typescript
const preflightResponse = handleCorsPreflightRequest(request)
if (preflightResponse) {
  return preflightResponse
}
```

#### 3. Credentials Not Allowed

**Penyebab**: `Access-Control-Allow-Credentials` tidak diset

**Solusi**: Pastikan credentials diaktifkan:
```typescript
const corsOptions = {
  credentials: true
}
```

### Debug Mode

Untuk debugging, tambahkan logging:

```typescript
// lib/cors.ts
console.log('Origin:', origin)
console.log('Allowed Origins:', allowedOrigins)
console.log('Is Origin Allowed:', isOriginAllowed(origin, allowedOrigins))
```

### Testing Checklist

- [ ] Preflight request (OPTIONS) berhasil
- [ ] Actual request berhasil dengan CORS headers
- [ ] Origin validation bekerja
- [ ] Credentials handling benar
- [ ] Production domains terkonfigurasi

## 📚 Resources

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🤝 Contributing

Untuk menambahkan atau mengubah konfigurasi CORS:

1. Update `lib/cors.ts` untuk logic utama
2. Update `middleware.ts` untuk middleware integration
3. Update dokumentasi ini
4. Jalankan testing untuk memastikan tidak ada breaking changes

---

**⚠️ Security Note**: Selalu gunakan origins yang spesifik di production. Hindari menggunakan `*` (wildcard) untuk `Access-Control-Allow-Origin` jika `credentials: true`.