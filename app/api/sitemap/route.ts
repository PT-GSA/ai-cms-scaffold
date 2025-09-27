/**
 * Auto-Generate XML Sitemap untuk AI CMS Scaffold
 * Static generation compatible - no dynamic server usage
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

interface ContentEntry {
  id: string
  slug: string
  status: string
  updated_at: string | null
  published_at: string | null
  data: Record<string, unknown>
  content_types: {
    name: string
    display_name: string
  } | {
    name: string
    display_name: string
  }[]
}

/**
 * Generate XML Sitemap
 */
async function generateSitemap(): Promise<string> {
  // Use public Supabase client for static generation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
  
  // Get all published content entries using public API
  const { data: contentEntries, error: contentError } = await supabase
    .from('content_entries')
    .select(`
      id,
      slug,
      status,
      updated_at,
      published_at,
      data,
      content_types!inner (
        name,
        display_name
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
    .select('name, display_name, updated_at')
    .eq('is_active', true)

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
      url: `${baseUrl}/${contentType.name}`,
      lastModified: contentType.updated_at || new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8
    })
  })

  // Individual content entries
  contentEntries?.forEach((entry: ContentEntry) => {
    // Handle both single object and array response from Supabase
    const contentType = Array.isArray(entry.content_types) 
      ? entry.content_types[0] 
      : entry.content_types
    const priority = getPriorityByContentType(contentType?.name || 'default')
    const changeFreq = getChangeFrequencyByContentType(contentType?.name || 'default')
    
    entries.push({
      url: `${baseUrl}/${contentType?.name || 'content'}/${entry.slug}`,
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
 * Handle GET request for sitemap - Static generation compatible
 */
export async function GET(): Promise<NextResponse> {
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