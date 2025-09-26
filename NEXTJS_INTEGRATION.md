# 🚀 Integrasi AI CMS dengan Next.js & Vercel

Panduan lengkap untuk mengintegrasikan AI CMS Scaffold dengan aplikasi Next.js dan deploy di Vercel.

## 📋 Daftar Isi

1. [Setup Awal](#setup-awal)
2. [Instalasi SDK](#instalasi-sdk)
3. [Konfigurasi Environment](#konfigurasi-environment)
4. [Penggunaan API](#penggunaan-api)
5. [ISR & Caching](#isr--caching)
6. [Webhook Integration](#webhook-integration)
7. [Deploy ke Vercel](#deploy-ke-vercel)
8. [Contoh Implementasi](#contoh-implementasi)

## 🛠️ Setup Awal

### 1. Persiapan CMS

Pastikan AI CMS Scaffold sudah running dan accessible:

```bash
# Clone dan setup CMS
git clone <cms-repo>
cd ai-cms-scaffold
bun install
bun run dev
```

### 2. Buat Project Next.js Baru

```bash
# Buat project Next.js baru
npx create-next-app@latest my-website --typescript --tailwind --eslint --app
cd my-website
```

## 📦 Instalasi SDK

### 1. Copy CMS Client SDK

Copy file `lib/cms-client.ts` dari CMS ke project Next.js Anda:

```bash
# Dari directory CMS
cp lib/cms-client.ts ../my-website/lib/
```

### 2. Install Dependencies

```bash
# Di project Next.js
npm install
```

## ⚙️ Konfigurasi Environment

### 1. Environment Variables

Buat file `.env.local` di project Next.js:

```env
# CMS Configuration
NEXT_PUBLIC_CMS_URL=http://localhost:3000
# atau untuk production: https://your-cms-domain.com

# ISR Revalidation
REVALIDATION_TOKEN=your-secret-revalidation-token

# Vercel Deploy Hook (optional)
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
```

### 2. Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'your-cms-domain.com',
      'your-supabase-project.supabase.co'
    ],
  },
  experimental: {
    // Enable ISR
    isrMemoryCacheSize: 0,
  }
}

module.exports = nextConfig
```

## 🔌 Penggunaan API

### 1. Basic Usage

```typescript
// lib/cms.ts
import { createCMSClient } from './cms-client';

export const cms = createCMSClient(
  process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3000'
);
```

### 2. Fetch Content Types

```typescript
// pages/api/content-types.ts atau app/api/content-types/route.ts
import { cms } from '@/lib/cms';

export async function GET() {
  try {
    const contentTypes = await cms.getContentTypes();
    return Response.json(contentTypes);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch content types' }, { status: 500 });
  }
}
```

### 3. Fetch Content Entries

```typescript
// app/blog/page.tsx
import { cms } from '@/lib/cms';

export default async function BlogPage() {
  const { data: posts } = await cms.getContentEntries('blog', {
    limit: 10,
    status: 'published'
  });

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

### 4. Dynamic Routes

```typescript
// app/blog/[slug]/page.tsx
import { cms } from '@/lib/cms';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return await cms.generateStaticPaths('blog');
}

export default async function BlogPost({ params }: Props) {
  try {
    const { data: post } = await cms.getContentEntry('blog', params.slug);
    
    return (
      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content.body }} />
      </article>
    );
  } catch (error) {
    notFound();
  }
}
```

## ⚡ ISR & Caching

### 1. Enable ISR

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 3600; // Revalidate every hour

// Atau gunakan on-demand revalidation
export const revalidate = false;
```

### 2. Cache Tags

```typescript
// app/blog/page.tsx
import { unstable_cache } from 'next/cache';

const getCachedPosts = unstable_cache(
  async () => {
    const { data } = await cms.getContentEntries('blog');
    return data;
  },
  ['blog-posts'],
  {
    tags: ['blog'],
    revalidate: 3600
  }
);

export default async function BlogPage() {
  const posts = await getCachedPosts();
  // ...
}
```

### 3. Manual Revalidation

```typescript
// app/api/revalidate-content/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { tag } = await request.json();
  
  revalidateTag(tag);
  
  return Response.json({ revalidated: true });
}
```

## 🔗 Webhook Integration

### 1. Setup Webhook di CMS

Tambahkan environment variables di CMS:

```env
# .env.local (CMS)
WEBHOOK_URLS=https://your-nextjs-site.vercel.app/api/webhook
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
REVALIDATION_TOKEN=your-secret-token
NEXT_PUBLIC_APP_URL=https://your-cms-domain.com
```

### 2. Webhook Handler di Next.js

```typescript
// app/api/webhook/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { event, content_type, slug } = payload;

    // Revalidate berdasarkan event
    switch (event) {
      case 'content.created':
      case 'content.updated':
      case 'content.published':
        // Revalidate list page
        revalidatePath(`/${content_type}`);
        revalidateTag(content_type);
        
        // Revalidate detail page jika ada slug
        if (slug) {
          revalidatePath(`/${content_type}/${slug}`);
          revalidateTag(`${content_type}-${slug}`);
        }
        break;
        
      case 'content.deleted':
        // Revalidate list page
        revalidatePath(`/${content_type}`);
        revalidateTag(content_type);
        break;
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

### 3. Trigger Webhooks dari CMS

Update API routes di CMS untuk trigger webhooks:

```typescript
// app/api/content-entries/route.ts (di CMS)
import { triggerContentCreated } from '@/lib/webhook-trigger';

export async function POST(request: NextRequest) {
  // ... existing code ...
  
  // Setelah berhasil create content
  if (newEntry) {
    await triggerContentCreated(
      contentType.slug,
      newEntry.id,
      newEntry.slug,
      newEntry
    );
  }
  
  // ... rest of code ...
}
```

## 🚀 Deploy ke Vercel

### 1. Deploy CMS

```bash
# Di directory CMS
vercel --prod

# Set environment variables
vercel env add WEBHOOK_URLS
vercel env add VERCEL_DEPLOY_HOOK_URL
vercel env add REVALIDATION_TOKEN
```

### 2. Deploy Next.js Site

```bash
# Di directory Next.js
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_CMS_URL
vercel env add REVALIDATION_TOKEN
```

### 3. Setup Deploy Hooks

1. Buka Vercel Dashboard
2. Pilih project Next.js
3. Go to Settings > Git
4. Copy Deploy Hook URL
5. Tambahkan ke CMS environment variables

## 💡 Contoh Implementasi

### 1. Blog dengan ISR

```typescript
// app/blog/page.tsx
import { cms } from '@/lib/cms';
import Link from 'next/link';

export const revalidate = 3600; // 1 hour

export default async function BlogPage() {
  const { data: posts, meta } = await cms.getContentEntries('blog', {
    limit: 10,
    status: 'published',
    sort: 'published_at',
    order: 'desc'
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => (
          <article key={post.id} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-blue-600">
                {post.title}
              </Link>
            </h2>
            
            {post.content.excerpt && (
              <p className="text-gray-600 mb-4">{post.content.excerpt}</p>
            )}
            
            <time className="text-sm text-gray-500">
              {new Date(post.published_at || post.created_at).toLocaleDateString()}
            </time>
          </article>
        ))}
      </div>
    </div>
  );
}
```

### 2. Dynamic Product Pages

```typescript
// app/products/[slug]/page.tsx
import { cms } from '@/lib/cms';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return await cms.generateStaticPaths('products');
}

export async function generateMetadata({ params }: Props) {
  try {
    const { data: product } = await cms.getContentEntry('products', params.slug);
    
    return {
      title: product.title,
      description: product.content.description,
      openGraph: {
        title: product.title,
        description: product.content.description,
        images: product.content.image ? [product.content.image] : [],
      },
    };
  } catch {
    return {
      title: 'Product Not Found',
    };
  }
}

export default async function ProductPage({ params }: Props) {
  try {
    const { data: product } = await cms.getContentEntry('products', params.slug);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {product.content.image && (
            <div className="relative aspect-square">
              <Image
                src={product.content.image}
                alt={product.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
          
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
            
            {product.content.price && (
              <p className="text-2xl font-semibold text-green-600 mb-4">
                ${product.content.price}
              </p>
            )}
            
            {product.content.description && (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.content.description }}
              />
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
```

### 3. Media Gallery

```typescript
// app/gallery/page.tsx
import { cms } from '@/lib/cms';
import Image from 'next/image';

export const revalidate = 1800; // 30 minutes

export default async function GalleryPage() {
  const { data: images } = await cms.getMediaFiles({
    type: 'image',
    limit: 50
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Gallery</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="relative aspect-square">
            <Image
              src={image.public_url}
              alt={image.alt_text || image.original_name}
              fill
              className="object-cover rounded-lg hover:scale-105 transition-transform"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 Tips & Best Practices

### 1. Error Handling

```typescript
// lib/cms-wrapper.ts
import { cms } from './cms';

export async function safeGetContentEntries(contentType: string, options = {}) {
  try {
    return await cms.getContentEntries(contentType, options);
  } catch (error) {
    console.error(`Failed to fetch ${contentType}:`, error);
    return { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  }
}
```

### 2. Loading States

```typescript
// app/blog/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 3. TypeScript Types

```typescript
// types/cms.ts
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: {
    excerpt: string;
    body: string;
    featured_image?: string;
    tags?: string[];
  };
  status: 'published' | 'draft' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  content: {
    description: string;
    price: number;
    image?: string;
    gallery?: string[];
    specifications?: Record<string, any>;
  };
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}
```

## 🎯 Kesimpulan

Dengan setup ini, Anda memiliki:

- ✅ **API Public** untuk akses content tanpa autentikasi
- ✅ **SDK Client** yang mudah digunakan
- ✅ **ISR Support** untuk performance optimal
- ✅ **Webhook System** untuk real-time updates
- ✅ **Vercel Integration** untuk auto-rebuild
- ✅ **Type Safety** dengan TypeScript
- ✅ **Error Handling** yang robust
- ✅ **Caching Strategy** yang efisien

CMS Anda sekarang siap terintegrasi dengan Next.js dan deploy di Vercel! 🚀