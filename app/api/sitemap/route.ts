/**
 * Auto-Generate XML Sitemap untuk AI CMS Scaffold
 * Update otomatis saat content berubah dengan cache invalidation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { withRateLimit, createRateLimitMiddleware } from '@/lib/rate-limit-middleware'
import { getClientIP } from '@/lib/redis'

interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

/**
 * Generate XML Sitemap
 */
async function generateSitemap(): Promise<string> {
  const supabase = createRouteHandlerClient({ cookies })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
  
  // Get all published content entries
  const { data: contentEntries, error: contentError } = await supabase
    .from('content_entries')
    .select(`
      id,
      title,
      slug,
      content_type,
      status,
      updated_at,
      published_at,
      content_types!inner (
        name,
        slug
      )
    `)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  if (contentError) {
    console.error('Error fetching content entries:', contentError)
    throw new Error('Failed to fetch content entries')
  }

  // Get all content types for category pages
  const { data: contentTypes, error: typesError } = await supabase
    .from('content_types')
    .select('name, slug, updated_at')

  if (typesError) {
    console.error('Error fetching content types:', typesError)
    throw new Error('Failed to fetch content types')
  }

  // Build sitemap entries
  const entries: SitemapEntry[] = []

  // Static pages
  entries.push(
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6
    }
  )

  // Content type listing pages
  contentTypes?.forEach(contentType => {
    entries.push({
      url: `${baseUrl}/${contentType.slug}`,
      lastModified: contentType.updated_at || new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8
    })
  })

  // Individual content entries
  contentEntries?.forEach((entry: any) => {
    const contentType = entry.content_types
    const priority = getPriorityByContentType(contentType?.name || 'default')
    const changeFreq = getChangeFrequencyByContentType(contentType?.name || 'default')
    
    entries.push({
      url: `${baseUrl}/${contentType?.slug || 'content'}/${entry.slug}`,
      lastModified: entry.updated_at || entry.published_at || new Date().toISOString(),
      changeFrequency: changeFreq,
      priority: priority
    })
  })

  // Generate XML
  return generateSitemapXML(entries)
}

/**
 * Get priority based on content type
 */
function getPriorityByContentType(contentType: string): number {
  const priorityMap: Record<string, number> = {
    'homepage': 1.0,
    'blog': 0.8,
    'article': 0.8,
    'page': 0.7,
    'product': 0.9,
    'service': 0.8,
    'news': 0.7,
    'default': 0.6
  }
  
  return priorityMap[contentType.toLowerCase()] || priorityMap.default
}

/**
 * Get change frequency based on content type
 */
function getChangeFrequencyByContentType(contentType: string): SitemapEntry['changeFrequency'] {
  const frequencyMap: Record<string, SitemapEntry['changeFrequency']> = {
    'blog': 'weekly',
    'article': 'weekly', 
    'news': 'daily',
    'product': 'weekly',
    'service': 'monthly',
    'page': 'monthly',
    'default': 'weekly'
  }
  
  return frequencyMap[contentType.toLowerCase()] || frequencyMap.default
}

/**
 * Generate XML sitemap string
 */
function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return xml
}

/**
 * Handle GET request for sitemap
 */
async function handleSitemapRequest(): Promise<NextResponse> {
  try {
    const sitemap = await generateSitemap()
    
    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // 1 hour cache, 1 day stale
        'X-Robots-Tag': 'noindex' // Don't index the sitemap itself
      }
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    )
  }
}

// Rate limited sitemap endpoint
// Custom rate limiter for sitemap - 60 requests per 15 minutes
const sitemapRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 60, // 60 requests per window
  keyGenerator: (request: NextRequest) => {
    return getClientIP(request) || 'anonymous'
  },
  message: 'Too many sitemap requests, please try again later.'
})

export const GET = withRateLimit(handleSitemapRequest, sitemapRateLimit)

/**
 * Generate sitemap index for large sites
 */
async function generateSitemapIndex(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
  
  // For large sites, split sitemaps by content type or date
  const sitemaps = [
    {
      url: `${baseUrl}/api/sitemap`,
      lastModified: new Date().toISOString()
    },
    {
      url: `${baseUrl}/api/sitemap/images`,
      lastModified: new Date().toISOString()
    }
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.url}</loc>
    <lastmod>${sitemap.lastModified}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return xml
}