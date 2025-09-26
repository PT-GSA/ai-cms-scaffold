# 🚀 Cara Penggunaan: Integrasi AI CMS dengan Next.js & Vercel

Panduan lengkap untuk menggunakan AI CMS Scaffold sebagai headless CMS untuk project Next.js Anda.

## 📋 Daftar Isi

1. [Setup Awal](#setup-awal)
2. [Konfigurasi Environment](#konfigurasi-environment)
3. [Menggunakan CMS SDK](#menggunakan-cms-sdk)
4. [Setup ISR & Caching](#setup-isr--caching)
5. [Konfigurasi Webhook](#konfigurasi-webhook)
6. [Deploy ke Vercel](#deploy-ke-vercel)
7. [Contoh Implementasi](#contoh-implementasi)
8. [Troubleshooting](#troubleshooting)

## 🎯 Setup Awal

### 1. Jalankan CMS Server

```bash
# Di folder CMS
cd ai-cms-scaffold
bun install
bun run dev
```

CMS akan berjalan di `http://localhost:3000`

### 2. Buat Project Next.js Baru

```bash
# Buat project Next.js baru
npx create-next-app@latest my-blog --typescript --tailwind --eslint --app
cd my-blog

# Install dependencies tambahan
npm install @types/node
```

### 3. Copy CMS Client SDK

Copy file `lib/cms-client.ts` dari CMS ke project Next.js Anda:

```bash
# Dari folder CMS
cp lib/cms-client.ts ../my-blog/lib/cms.ts
```

## ⚙️ Konfigurasi Environment

### CMS (.env.local)

```env
# Database
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Webhook & Revalidation
REVALIDATION_TOKEN=cms-revalidation-secret-2024
WEBHOOK_URLS=http://localhost:3001/api/webhook
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/prj_YOUR_PROJECT_ID/YOUR_DEPLOY_HOOK_ID
```

### Next.js (.env.local)

```env
# CMS Connection
NEXT_PUBLIC_CMS_URL=http://localhost:3000
REVALIDATION_TOKEN=cms-revalidation-secret-2024

# Production
# NEXT_PUBLIC_CMS_URL=https://your-cms-domain.vercel.app
```

## 🔧 Menggunakan CMS SDK

### 1. Setup CMS Client

```typescript
// lib/cms.ts
import { CMSClient } from './cms-client';

export const cms = new CMSClient(
  process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3000'
);

export * from './cms-client';
```

### 2. Fetch Data di Pages

#### Blog List Page

```typescript
// app/blog/page.tsx
import { cms, ContentEntry } from '@/lib/cms';

export const revalidate = 3600; // ISR: 1 jam

export default async function BlogPage() {
  const { data: posts } = await cms.getContentEntries('blog', {
    limit: 10,
    status: 'published',
    sort: 'created_at',
    order: 'desc'
  });

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map((post: ContentEntry) => (
        <article key={post.id}>
          <h2>{post.content.title || post.title}</h2>
          <p>{post.content.excerpt}</p>
          <a href={`/blog/${post.slug}`}>Read More</a>
        </article>
      ))}
    </div>
  );
}
```

#### Blog Detail Page

```typescript
// app/blog/[slug]/page.tsx
import { cms } from '@/lib/cms';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Generate static paths
export async function generateStaticParams() {
  return await cms.generateStaticPaths('blog');
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  
  try {
    const { data: post } = await cms.getContentEntry('blog', slug);
    
    if (!post || post.status !== 'published') {
      notFound();
    }

    return (
      <article>
        <h1>{post.content.title || post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content.body }} />
      </article>
    );
  } catch (error) {
    notFound();
  }
}
```

### 3. Fetch Media Files

```typescript
// Fetch media files
const { data: images } = await cms.getMediaFiles({
  type: 'image',
  limit: 20
});

// Render images
{images.map(image => (
  <img 
    key={image.id}
    src={image.public_url} 
    alt={image.alt_text || image.filename}
  />
))}
```

## 🔄 Setup ISR & Caching

### 1. Konfigurasi Next.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-cms-domain.vercel.app'],
  },
  async rewrites() {
    return [
      {
        source: '/api/webhook',
        destination: '/api/revalidate',
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. Webhook Endpoint untuk Revalidation

```typescript
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  // Verifikasi token
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (token !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, data } = await request.json();

  switch (type) {
    case 'content.updated':
    case 'content.published':
      revalidatePath('/blog');
      if (data.slug) {
        revalidatePath(`/blog/${data.slug}`);
      }
      break;
  }

  return NextResponse.json({ success: true });
}
```

## 🔗 Konfigurasi Webhook

### 1. Setup di CMS

Webhook akan otomatis trigger ketika:
- Content dibuat/diupdate/dipublish
- Content type berubah
- Media files diupload

### 2. Vercel Deploy Hooks

1. Buka Vercel Dashboard
2. Pilih project Next.js Anda
3. Go to Settings > Git
4. Buat Deploy Hook baru
5. Copy URL dan masukkan ke `VERCEL_DEPLOY_HOOK_URL`

### 3. Test Webhook

```bash
# Test webhook endpoint
curl -X POST http://localhost:3001/api/revalidate \
  -H "Authorization: Bearer cms-revalidation-secret-2024" \
  -H "Content-Type: application/json" \
  -d '{"type":"content.updated","data":{"slug":"test-post"}}'
```

## 🚀 Deploy ke Vercel

### 1. Deploy CMS

```bash
# Di folder CMS
vercel --prod
```

### 2. Deploy Next.js Blog

```bash
# Di folder Next.js
vercel --prod
```

### 3. Update Environment Variables

Setelah deploy, update environment variables:

```env
# CMS Production
WEBHOOK_URLS=https://your-nextjs-blog.vercel.app/api/webhook
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...

# Next.js Production
NEXT_PUBLIC_CMS_URL=https://your-cms.vercel.app
```

## 💡 Contoh Implementasi

### Portfolio Website

```typescript
// app/projects/page.tsx
export default async function ProjectsPage() {
  const { data: projects } = await cms.getContentEntries('project', {
    status: 'published',
    sort: 'created_at',
    order: 'desc'
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <div key={project.id} className="bg-white rounded-lg shadow-md">
          {project.content.thumbnail && (
            <img 
              src={project.content.thumbnail} 
              alt={project.content.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">
              {project.content.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {project.content.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.content.technologies?.map((tech: string) => (
                <span 
                  key={tech}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### E-commerce Product Catalog

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const { data: products } = await cms.getContentEntries('product', {
    status: 'published',
    limit: 20
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-md">
          <img 
            src={product.content.image} 
            alt={product.content.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="p-4">
            <h3 className="font-semibold mb-2">{product.content.name}</h3>
            <p className="text-gray-600 text-sm mb-2">
              {product.content.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">
                ${product.content.price}
              </span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Module Not Found Error

```bash
# Pastikan path mapping benar di tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 2. CORS Error

```typescript
// Tambahkan di next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

#### 3. ISR Not Working

- Pastikan `revalidate` export ada di page
- Check environment variables
- Verify webhook token
- Test webhook endpoint manually

#### 4. Images Not Loading

```javascript
// next.config.js
const nextConfig = {
  images: {
    domains: ['localhost', 'your-cms-domain.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/api/storage/**',
      },
    ],
  },
};
```

### Debug Tips

1. **Check Network Tab**: Lihat API calls di browser dev tools
2. **Console Logs**: Add console.log untuk debug data flow
3. **Vercel Logs**: Check function logs di Vercel dashboard
4. **Test API Directly**: Test CMS API endpoints dengan Postman/curl

## 🎉 Selesai!

Sekarang Anda memiliki:
- ✅ CMS yang fully integrated dengan Next.js
- ✅ ISR untuk performance optimal
- ✅ Webhook untuk auto-revalidation
- ✅ Deploy automation dengan Vercel
- ✅ TypeScript support penuh

**Happy coding!** 🚀

---

Untuk pertanyaan atau bantuan lebih lanjut, silakan buka issue di repository atau hubungi tim development.