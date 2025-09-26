# AI CMS Scaffold

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 🚀 Overview

AI CMS Scaffold adalah sistem manajemen konten (CMS) modern yang dibangun dengan teknologi terdepan. Proyek ini menyediakan platform headless CMS yang fleksibel dengan fitur-fitur canggih untuk mengelola konten digital secara efisien.

### ✨ Fitur Utama yang Sudah Diimplementasi

#### 🎯 Content Management System (CMS Core)
- ✅ **Dynamic Content Types**: Buat dan kelola tipe konten secara dinamis
- ✅ **Field Types**: Mendukung berbagai jenis field (Text, Number, Boolean, Date, Rich Text, dll)
- ✅ **Content CRUD**: Operasi Create, Read, Update, Delete untuk semua konten
- ✅ **Draft/Published States**: Sistem status konten (Draft, Published, Archived)
- ✅ **Slug Generation**: Auto-generate URL-friendly slugs

#### 🔌 API Layer (Headless CMS)
- ✅ **RESTful API**: Endpoint lengkap untuk content types dan entries
- ✅ **Authentication**: Sistem autentikasi terintegrasi dengan Supabase
- ✅ **Data Validation**: Validasi data menggunakan Zod schemas
- ✅ **Rate Limiting**: Implementasi rate limiting untuk semua API endpoints dengan Redis
- ✅ **Error Handling**: Comprehensive error handling dan response formatting

#### 📁 Media Management System
- ✅ **File Upload & Storage**: Upload file ke Supabase Storage
- ✅ **Media Library**: Galeri media dengan preview dan metadata
- ✅ **Storage Quota**: Sistem kuota penyimpanan 2GB per user
- ✅ **File Validation**: Validasi tipe dan ukuran file
- ✅ **Folder Organization**: Organisasi file dalam folder

#### 🎨 Admin Dashboard
- ✅ **Modern UI**: Interface yang clean dan responsive
- ✅ **Content Management**: Dashboard untuk mengelola semua konten
- ✅ **Media Gallery**: Interface untuk mengelola file media
- ✅ **Real-time Updates**: Update data secara real-time

#### 🔐 Security & Performance (Prioritas Tinggi)
- ✅ **Rate Limiting**: Redis-based rate limiting untuk semua endpoints
- ✅ **Authentication Rate Limiting**: Khusus rate limiting untuk auth endpoints
- ✅ **Strict Rate Limiting**: Rate limiting ketat untuk sensitive endpoints
- ✅ **Type Safety**: Full TypeScript implementation tanpa `any` types
- ✅ **Input Validation**: Comprehensive input validation dengan Zod
- ✅ **Input Sanitization**: XSS protection dan injection attack prevention dengan DOMPurify

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI, Tailwind CSS
- **Form Handling**: React Hook Form, Zod
- **Icons**: Lucide React
- **Package Manager**: Bun
- **Security**: DOMPurify (XSS Protection), Validator.js (Input Validation)
- **Performance**: Redis (Rate Limiting & Caching)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ atau Bun
- Supabase account
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-username/ai-cms-scaffold.git
cd ai-cms-scaffold
```

### 2. Install Dependencies
```bash
# Menggunakan Bun (recommended)
bun install

# Atau menggunakan npm
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` untuk development:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Buat file `.env` untuk production:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### 4. Setup Database
Jalankan SQL scripts di Supabase SQL Editor:
```bash
# 1. Initial schema
scripts/001_initial_schema.sql

# 2. Content types schema
scripts/002_content_types_schema.sql

# 3. Content entries schema
scripts/003_content_entries_schema.sql

# 4. Media schema
scripts/004_media_schema.sql

# 5. Setup storage bucket
scripts/setup-supabase-storage.sql
```

### 5. Run Development Server
```bash
# Menggunakan Bun
bun dev

# Atau menggunakan npm
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🔧 Available Scripts

```bash
# Development
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
```

## 🔒 Security Features

### 🛡️ Input Sanitization & XSS Protection
AI CMS Scaffold mengimplementasikan sistem sanitasi input yang komprehensif untuk melindungi dari serangan XSS dan injection:

#### 🧹 Sanitization Functions
- **HTML Sanitization**: Menggunakan DOMPurify dengan konfigurasi berbeda:
  - `RICH_TEXT`: Untuk content editor dengan HTML tags yang aman
  - `PLAIN_TEXT`: Untuk input text biasa, menghapus semua HTML
  - `ADMIN_CONTENT`: Untuk admin dengan HTML tags lebih lengkap
- **String Sanitization**: Escape HTML entities dan karakter berbahaya
- **Email Validation**: Validasi dan normalisasi format email
- **URL Sanitization**: Validasi URL dengan protokol yang aman (http/https)
- **File Upload Security**: Validasi nama file dan tipe MIME
- **JSON Sanitization**: Sanitasi rekursif untuk object dan array

#### 🔧 Middleware Implementation
```typescript
// Contoh penggunaan middleware sanitization
import { withContentSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'

// Untuk content dengan HTML support
export const POST = withContentSanitization(async (request) => {
  const sanitizedBody = getSanitizedBody(request)
  // Body sudah disanitasi dan aman digunakan
})
```

#### 🎯 Protected Endpoints
Semua endpoint yang menerima input user telah diproteksi:
- `/api/content-entries` (POST, PUT) - Content sanitization
- `/api/content-types` (POST) - Input sanitization
- `/api/media` (POST) - File upload sanitization

### ⚡ Rate Limiting
Implementasi rate limiting berbasis Redis untuk mencegah abuse:
- **General API**: 100 requests per 15 menit
- **Authentication**: 5 requests per 15 menit
- **Sensitive Operations**: 10 requests per 15 menit
- **File Upload**: 20 requests per 15 menit

### 🔐 Type Safety
- Zero `any` types dalam codebase
- Comprehensive TypeScript interfaces
- Runtime type validation dengan Zod schemas

## 📚 API Documentation

### Content Types Endpoints
- `GET /api/content-types` - Fetch all content types
- `POST /api/content-types` - Create new content type
- `GET /api/content-types/[id]` - Fetch single content type
- `PUT /api/content-types/[id]` - Update content type

### Content Entries Endpoints
- `GET /api/content-entries` - Fetch content entries (with filtering)
- `POST /api/content-entries` - Create new content entry
- `GET /api/content-entries/[id]` - Fetch single content entry
- `PUT /api/content-entries/[id]` - Update content entry
- `DELETE /api/content-entries/[id]` - Delete content entry

### Media Endpoints
- `POST /api/media` - Upload media file
- `PUT /api/media/[id]` - Update media metadata

### Storage Endpoints
- `GET /api/storage` - Get storage usage info
- `POST /api/storage/validate` - Validate file before upload

## 🗂️ Project Structure

```
ai-cms-scaffold/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Admin dashboard pages
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── scripts/               # Database setup scripts
└── utils/                 # Helper utilities
```

## 🎯 Fitur yang Masih Perlu Diimplementasi untuk Kesempurnaan

### 🔐 Security & Authentication (Prioritas Kritis)
- ✅ **Rate Limiting**: Implementasi rate limiting untuk API endpoints
- ✅ **Input Sanitization**: Sanitasi input untuk mencegah XSS dan injection attacks
- [ ] **CORS Configuration**: Konfigurasi CORS yang proper untuk production
- [ ] **API Key Management**: Sistem API key untuk akses eksternal
- [ ] **Audit Logging**: Log semua aktivitas user untuk security tracking

### 👥 User Management & RBAC (Prioritas Tinggi)
- [ ] **Role-Based Access Control**: Implementasi sistem role (Super Admin, Admin, Editor, Author, Viewer)
- [ ] **User Invitation System**: Sistem undangan user dengan email verification
- [ ] **Permission Management**: Granular permissions per content type dan action
- [ ] **User Profile Management**: Dashboard untuk mengelola profil dan preferensi user
- [ ] **Team Management**: Organisasi user dalam tim dengan hierarki

### 📝 Content Enhancement (Prioritas Tinggi)
- [ ] **Content Versioning**: Sistem versioning dengan history dan rollback
- [ ] **Content Relations**: Relasi antar content (One-to-One, One-to-Many, Many-to-Many)
- [ ] **Content Templates**: Template system untuk mempercepat pembuatan content
- [ ] **Bulk Operations**: Import/export content dalam format CSV/JSON
- [ ] **Content Scheduling**: Penjadwalan publikasi content
- [ ] **Content Workflow**: Approval workflow (Draft → Review → Published)

### 🔍 Search & Performance (Prioritas Tinggi)
- [ ] **Full-Text Search**: Implementasi search engine dengan indexing
- [ ] **Content Filtering**: Advanced filtering dan sorting options
- [ ] **Caching System**: Redis/Memory caching untuk performance
- [ ] **Database Optimization**: Query optimization dan indexing
- [ ] **CDN Integration**: Integrasi dengan CDN untuk media files

### 🌐 API & Integration (Prioritas Sedang)
- [ ] **GraphQL API**: Alternative GraphQL endpoint selain REST
- [ ] **Webhook System**: Webhook untuk notifikasi perubahan content
- [ ] **API Documentation**: Auto-generated API docs dengan Swagger/OpenAPI
- [ ] **SDK Development**: JavaScript/TypeScript SDK untuk developer
- [ ] **Third-party Integrations**: Integrasi dengan Zapier, Slack, dll

### 📱 Frontend & UX (Prioritas Sedang)
- [ ] **Mobile App**: React Native app untuk content management
- [ ] **Progressive Web App**: PWA support untuk offline access
- [ ] **Dark Mode**: Theme switching dengan preferensi user
- [ ] **Drag & Drop Interface**: Drag & drop untuk reorder content
- [ ] **Rich Text Editor**: Advanced WYSIWYG editor dengan plugin support
- [ ] **Media Editor**: Basic image editing tools (crop, resize, filters)

### 🌍 Internationalization (Prioritas Sedang)
- [ ] **Multi-language Support**: i18n untuk interface dan content
- [ ] **Content Translation**: Sistem translasi content dengan workflow
- [ ] **Locale Management**: Management locale dan regional settings
- [ ] **RTL Support**: Support untuk bahasa Right-to-Left

### 📊 Analytics & Monitoring (Prioritas Sedang)
- [ ] **Content Analytics**: Statistik views, engagement, dan performance
- [ ] **User Activity Tracking**: Tracking aktivitas user di dashboard
- [ ] **Performance Monitoring**: Monitoring response time dan error rates
- [ ] **Usage Reports**: Laporan penggunaan storage, API calls, dll
- [ ] **Dashboard Widgets**: Customizable dashboard dengan widgets

### 🚀 DevOps & Deployment (Prioritas Sedang)
- [ ] **Docker Support**: Containerization dengan Docker dan Docker Compose
- [ ] **CI/CD Pipeline**: GitHub Actions untuk automated testing dan deployment
- [ ] **Environment Management**: Multiple environment support (dev, staging, prod)
- [ ] **Database Migrations**: Automated database migration system
- [ ] **Backup & Recovery**: Automated backup dan disaster recovery plan

### 🔧 Developer Experience (Prioritas Rendah)
- [ ] **Plugin System**: Extensible plugin architecture
- [ ] **Custom Field Types**: API untuk membuat custom field types
- [ ] **Theme System**: Customizable admin theme system
- [ ] **CLI Tools**: Command-line tools untuk development dan deployment
- [ ] **Code Generation**: Auto-generate boilerplate code untuk content types

### 🎨 Advanced Features (Prioritas Rendah)
- [ ] **A/B Testing**: Built-in A/B testing untuk content
- [ ] **Content Personalization**: Personalisasi content berdasarkan user behavior
- [ ] **AI Integration**: AI-powered content suggestions dan auto-tagging
- [ ] **Advanced SEO**: Meta tags management, sitemap generation, schema markup
- [ ] **E-commerce Integration**: Basic e-commerce features untuk product catalog

## 🚧 Development Roadmap & Timeline

### 🎯 Milestone 1: Security & Stability (2-3 minggu)
**Target**: Production-ready security dan performance
- ✅ Rate limiting dan input sanitization
- CORS configuration dan API security
- Caching system implementation
- Database optimization

### 🎯 Milestone 2: User Management (3-4 minggu)
**Target**: Complete user management system
- RBAC implementation
- User invitation dan team management
- Permission management UI
- User profile dashboard

### 🎯 Milestone 3: Content Enhancement (4-5 minggu)
**Target**: Advanced content management features
- Content versioning dan relations
- Bulk operations dan templates
- Content workflow dan scheduling
- Full-text search implementation

### 🎯 Milestone 4: API & Integration (2-3 minggu)
**Target**: Complete API ecosystem
- GraphQL API implementation
- Webhook system
- API documentation
- SDK development

### 🎯 Milestone 5: Frontend & Mobile (3-4 minggu)
**Target**: Enhanced user experience
- Mobile app development
- PWA implementation
- Advanced UI components
- Rich text editor

### 🎯 Milestone 6: Production Features (2-3 minggu)
**Target**: Enterprise-ready features
- Analytics dan monitoring
- i18n support
- DevOps tooling
- Advanced integrations

## 🚀 Deployment Guide

### 📋 Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Storage bucket setup
- [ ] Domain dan SSL certificate ready
- [ ] Monitoring tools configured

### 🌐 Vercel Deployment (Recommended)

#### 1. Prepare Repository
```bash
# Pastikan semua perubahan sudah di-commit
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### 3. Configure Environment Variables di Vercel
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### 🐳 Docker Deployment

#### 1. Build Docker Image
```bash
# Build image
docker build -t ai-cms-scaffold .

# Run container
docker run -p 3000:3000 --env-file .env ai-cms-scaffold
```

#### 2. Docker Compose (dengan Database)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/cms
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: cms
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### ☁️ AWS Deployment

#### 1. AWS Amplify
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init
amplify add hosting
amplify publish
```

#### 2. AWS ECS dengan Fargate
```bash
# Build dan push ke ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t ai-cms-scaffold .
docker tag ai-cms-scaffold:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-cms-scaffold:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-cms-scaffold:latest
```

### 🔧 Production Configuration

#### 1. Environment Variables
```env
# Production .env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Custom domain
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
```

#### 2. Database Migration
```sql
-- Run di Supabase SQL Editor untuk production
-- 1. Schema setup
\i scripts/001_initial_schema.sql
\i scripts/002_content_types_schema.sql
\i scripts/003_content_entries_schema.sql
\i scripts/004_media_schema.sql

-- 2. Storage setup
\i scripts/setup-supabase-storage.sql

-- 3. Sample data (optional)
\i scripts/create-sample-data-direct.sql
```

#### 3. Performance Optimization
```javascript
// next.config.mjs - Production settings
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 📊 Monitoring & Analytics

#### 1. Vercel Analytics
```bash
npm install @vercel/analytics
```

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### 2. Error Monitoring dengan Sentry
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### 🔒 Security Best Practices

#### 1. Environment Security
- Gunakan secrets management (Vercel Secrets, AWS Secrets Manager)
- Rotate API keys secara berkala
- Implement rate limiting
- Enable CORS dengan domain specific

#### 2. Database Security
```sql
-- Enable RLS (Row Level Security)
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own content" ON content_entries
  FOR SELECT USING (auth.uid() = user_id);
```

### 🚨 Troubleshooting

#### Common Issues
1. **Build Errors**: Check TypeScript dan ESLint errors
2. **Database Connection**: Verify Supabase URL dan keys
3. **Storage Issues**: Check bucket permissions
4. **Performance**: Enable caching dan optimize images

#### Debug Commands
```bash
# Check build locally
bun run build
bun run start

# Check logs
vercel logs your-deployment-url

# Test API endpoints
curl https://your-domain.com/api/content-types
```

## 🔗 Integration Examples

### 📱 Next.js Frontend Integration

#### 1. Install CMS Client
```bash
npm install @your-org/ai-cms-client
```

#### 2. Setup CMS Client
```typescript
// lib/cms.ts
import { CMSClient } from '@your-org/ai-cms-client'

export const cms = new CMSClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_URL,
  apiKey: process.env.CMS_API_KEY,
})

// Usage in components
export async function getBlogPosts() {
  return await cms.getContentEntries({
    content_type: 'blog',
    status: 'published',
    limit: 10,
  })
}
```

#### 3. Static Site Generation
```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await cms.getContentEntries({
    content_type: 'blog',
    status: 'published',
  })
  
  return posts.data.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await cms.getContentEntry(params.slug, { content_type: 'blog' })
  
  return (
    <article>
      <h1>{post.data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.data.content }} />
    </article>
  )
}
```

### ⚛️ React SPA Integration

```typescript
// hooks/useCMS.ts
import { useState, useEffect } from 'react'
import { cms } from '../lib/cms'

export function useContentEntries(contentType: string) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    cms.getContentEntries({ content_type: contentType })
      .then(setData)
      .finally(() => setLoading(false))
  }, [contentType])
  
  return { data, loading }
}

// components/BlogList.tsx
export function BlogList() {
  const { data: posts, loading } = useContentEntries('blog')
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.data.title}</h2>
          <p>{post.data.excerpt}</p>
        </article>
      ))}
    </div>
  )
}
```

### 🔌 Webhook Integration

#### 1. Setup Webhook Endpoint
```typescript
// api/webhooks/content-updated.ts
export async function POST(request: Request) {
  const payload = await request.json()
  
  // Revalidate cache
  if (payload.event === 'content.updated') {
    await fetch(`${process.env.FRONTEND_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}` },
      body: JSON.stringify({ path: `/blog/${payload.data.slug}` })
    })
  }
  
  return Response.json({ success: true })
}
```

#### 2. Configure Webhook di CMS
```typescript
// Dashboard webhook settings
const webhookConfig = {
  url: 'https://your-site.com/api/webhooks/content-updated',
  events: ['content.created', 'content.updated', 'content.deleted'],
  secret: 'your-webhook-secret'
}
 ```
 
 ## 🤝 Contributing
 
 1. Fork the repository
 2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
 3. Commit your changes (`git commit -m 'Add some AmazingFeature`)
 4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:
1. Check [Issues](https://github.com/your-username/ai-cms-scaffold/issues) yang sudah ada
2. Buat issue baru jika diperlukan
3. Hubungi tim development

---

**Built with ❤️ using Next.js 15 and Supabase**