# 🚀 Deployment Guide - Vercel

Panduan lengkap untuk deploy AI CMS Scaffold ke Vercel.

## 📋 Prerequisites

1. **Akun Vercel** - [Daftar di vercel.com](https://vercel.com)
2. **Akun Supabase** - [Daftar di supabase.com](https://supabase.com)
3. **Repository GitHub** - Push kode ke GitHub repository

## 🔧 Setup Supabase

### 1. Buat Project Supabase Baru
```bash
# Login ke Supabase dashboard
# Buat project baru dengan nama "ai-cms-production"
```

### 2. Setup Database Schema
Jalankan SQL scripts berikut di Supabase SQL Editor:

```sql
-- 1. Initial schema
-- Copy paste dari scripts/001_initial_schema.sql

-- 2. Content types schema  
-- Copy paste dari scripts/002_content_types_schema.sql

-- 3. Content entries schema
-- Copy paste dari scripts/003_content_entries_schema.sql

-- 4. Media schema
-- Copy paste dari scripts/004_media_schema.sql

-- 5. Setup storage bucket
-- Copy paste dari scripts/setup-supabase-storage.sql
```

### 3. Dapatkan Credentials
Dari Supabase Dashboard > Settings > API:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Deploy ke Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy dari root directory
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy production
vercel --prod
```

### Method 2: Vercel Dashboard

1. **Import Repository**
   - Login ke [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import dari GitHub repository

2. **Configure Build Settings**
   - Framework Preset: `Next.js`
   - Build Command: `bun run build`
   - Output Directory: `.next` (default)
   - Install Command: `bun install`

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Tunggu proses build selesai

## ⚙️ Konfigurasi Vercel

File `vercel.json` sudah dikonfigurasi dengan:

### 🔧 Build Configuration
- **Build Command**: `bun run build`
- **Install Command**: `bun install`
- **Framework**: Next.js
- **Region**: Singapore (sin1) untuk performa optimal di Asia

### 🛣️ Routing & Redirects
- `/admin` → `/dashboard`
- `/cms` → `/dashboard`
- API routes dengan proper CORS headers

### ⚡ Performance Optimization
- Static assets caching (1 year)
- API response caching (60s with stale-while-revalidate)
- Function timeout: 30 seconds

### 🕐 Cron Jobs (Optional)
- Daily cleanup: `0 2 * * *` (2 AM UTC)
- Analytics report: `0 6 * * *` (6 AM UTC)

## 🔐 Environment Variables

### Required (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

### Optional (Future Features)
```env
GOOGLE_AI_API_KEY=your-google-ai-key
VERCEL_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn
```

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

### 2. API Endpoints Test
```bash
# Test content types API
curl https://your-domain.vercel.app/api/content-types

# Test storage API  
curl https://your-domain.vercel.app/api/storage
```

### 3. Dashboard Access
- Login: `https://your-domain.vercel.app/login`
- Dashboard: `https://your-domain.vercel.app/dashboard`

## 🔄 Continuous Deployment

Setiap push ke branch `main` akan otomatis trigger deployment baru.

### Branch Previews
- Push ke branch lain akan membuat preview deployment
- URL preview: `https://ai-cms-scaffold-git-branch-name-username.vercel.app`

## 🐛 Troubleshooting

### Build Errors
```bash
# Check build logs di Vercel dashboard
# Atau jalankan build lokal:
bun run build
```

### Database Connection Issues
1. Cek environment variables di Vercel dashboard
2. Pastikan Supabase project aktif
3. Cek RLS policies di Supabase

### API Timeout
- Default timeout: 30 detik
- Untuk operasi berat, pertimbangkan background jobs

### Storage Issues
1. Cek Supabase Storage bucket configuration
2. Pastikan RLS policies benar
3. Cek file size limits

## 📊 Monitoring

### Vercel Analytics
```bash
# Enable di Vercel dashboard
# Atau tambahkan ke next.config.mjs:
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
}
```

### Performance Monitoring
- Core Web Vitals tracking otomatis aktif
- Real User Monitoring (RUM) tersedia
- Function logs di Vercel dashboard

## 🔒 Security

### Headers Security
- CORS headers sudah dikonfigurasi
- CSP headers (tambahkan jika diperlukan)
- Rate limiting (pertimbangkan untuk API)

### Authentication
- Supabase Auth sudah terintegrasi
- RLS policies aktif di database
- JWT token validation otomatis

## 📈 Scaling

### Function Limits
- Hobby: 100GB-hours/month
- Pro: 1000GB-hours/month
- Enterprise: Custom

### Database Scaling
- Supabase auto-scaling
- Connection pooling aktif
- Read replicas (Pro plan)

---

## 🆘 Support

Jika mengalami masalah deployment:

1. **Check Logs**
   - Vercel dashboard > Functions tab
   - Real-time logs saat deployment

2. **Common Issues**
   - Environment variables tidak set
   - Database schema belum dijalankan
   - Supabase project tidak aktif

3. **Get Help**
   - Vercel Discord community
   - Supabase Discord community
   - GitHub Issues

---

**Happy Deploying! 🚀**