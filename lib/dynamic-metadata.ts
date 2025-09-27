/**
 * Dynamic Metadata Generation System untuk AI CMS Scaffold
 * Menggunakan Next.js Metadata API dengan SEO optimization
 */

import { Metadata } from 'next'
import { generateSchemaMarkup } from './seo-fields'

export interface ContentMetadata {
  id: string
  title: string
  slug: string
  content_type: string
  
  // SEO Fields
  meta_title?: string
  meta_description?: string
  og_title?: string
  og_description?: string
  og_image?: string
  twitter_card?: string
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  canonical_url?: string
  robots_meta?: string[]
  schema_type?: string
  focus_keyword?: string
  additional_keywords?: string

  // Content Fields
  excerpt?: string
  published_at?: string
  updated_at?: string
  author?: {
    display_name: string
    avatar_url?: string
  }
  
  // Media
  featured_image?: string
  
  // Categories/Tags
  category?: string
  tags?: string[]
}

/**
 * Generate comprehensive metadata for content pages
 */
export async function generateContentMetadata(
  content: ContentMetadata,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<Metadata> {
  const {
    title,
    slug,
    meta_title,
    meta_description,
    og_title,
    og_description,
    og_image,
    twitter_title,
    twitter_description,
    twitter_image,
    canonical_url,
    robots_meta,
    author,
    published_at,
    updated_at,
    featured_image,
    excerpt,
    focus_keyword,
    additional_keywords
  } = content

  // Generate URLs
  const contentUrl = canonical_url || `${baseUrl}/${slug}`
  const imageUrl = og_image || featured_image
  const absoluteImageUrl = imageUrl?.startsWith('http') 
    ? imageUrl 
    : imageUrl 
    ? `${baseUrl}${imageUrl}`
    : `${baseUrl}/og-default.jpg`

  // Build keywords array
  const keywords: string[] = [
    focus_keyword,
    ...(additional_keywords ? additional_keywords.split(',').map(k => k.trim()) : []),
    ...(content.tags || [])
  ].filter((keyword): keyword is string => Boolean(keyword))

  // Generate robots directive
  const robotsDirective = robots_meta?.length 
    ? robots_meta.join(', ')
    : 'index, follow'

  return {
    // Basic Meta Tags
    title: meta_title || title,
    description: meta_description || excerpt || `Read ${title} on our platform`,
    keywords: keywords.length > 0 ? keywords : undefined,
    
    // Canonical URL
    alternates: {
      canonical: contentUrl
    },

    // Robots
    robots: robotsDirective,

    // Authors
    authors: author ? [{ name: author.display_name }] : undefined,

    // Open Graph
    openGraph: {
      type: 'article',
      title: og_title || meta_title || title,
      description: og_description || meta_description || excerpt || `Read ${title}`,
      url: contentUrl,
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: og_title || meta_title || title,
        }
      ],
      publishedTime: published_at,
      modifiedTime: updated_at,
      authors: author ? [author.display_name] : undefined,
      section: content.category,
      tags: content.tags,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: twitter_title || og_title || meta_title || title,
      description: twitter_description || og_description || meta_description || excerpt || `Read ${title}`,
      images: [absoluteImageUrl],
      creator: author ? `@${author.display_name.replace(/\s+/g, '').toLowerCase()}` : undefined,
    },

    // Additional meta tags
    other: {
      // Article specific
      ...(published_at ? { 'article:published_time': published_at } : {}),
      ...(updated_at ? { 'article:modified_time': updated_at } : {}),
      ...(author?.display_name ? { 'article:author': author.display_name } : {}),
      ...(content.category ? { 'article:section': content.category } : {}),
      ...(content.tags?.length ? { 'article:tag': content.tags.join(',') } : {}),
      
      // SEO specific
      'og:locale': 'en_US',
      'og:site_name': 'Your Site Name',
      
      // Core Web Vitals hints
      'preconnect': 'https://fonts.googleapis.com',
      'dns-prefetch': 'https://fonts.gstatic.com',
    }
  }
}

/**
 * Generate metadata untuk content listing pages
 */
export async function generateListingMetadata(
  contentType: string,
  page: number = 1,
  category?: string,
  tag?: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<Metadata> {
  
  let title = `${contentType} - Page ${page}`
  let description = `Browse our collection of ${contentType.toLowerCase()}`
  let url = `${baseUrl}/${contentType.toLowerCase()}`

  if (category) {
    title = `${category} ${contentType} - Page ${page}`
    description = `Browse ${contentType.toLowerCase()} in ${category} category`
    url += `/category/${category}`
  }

  if (tag) {
    title = `${contentType} tagged with ${tag} - Page ${page}`
    description = `Browse ${contentType.toLowerCase()} tagged with ${tag}`
    url += `/tag/${tag}`
  }

  if (page > 1) {
    url += `?page=${page}`
  }

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    robots: 'index, follow',
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      images: [`${baseUrl}/og-listing-${contentType.toLowerCase()}.jpg`]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-listing-${contentType.toLowerCase()}.jpg`]
    }
  }
}

/**
 * Generate structured data untuk content
 */
export function generateContentStructuredData(content: ContentMetadata, baseUrl: string) {
  const schemaType = content.schema_type || 'Article'
  const structuredData = generateSchemaMarkup({
    ...content,
    canonical_url: content.canonical_url || `${baseUrl}/${content.slug}`,
    og_image: content.og_image || content.featured_image
  }, schemaType)

  return {
    __html: JSON.stringify(structuredData, null, 2)
  }
}

/**
 * Optimize images untuk SEO dan Core Web Vitals
 */
export function generateImageMetadata(imageUrl: string, alt: string) {
  return {
    src: imageUrl,
    alt,
    // Lazy loading untuk images yang tidak above-the-fold
    loading: 'lazy' as const,
    // Decode async untuk better performance
    decoding: 'async' as const,
    // Size hints untuk CLS prevention
    width: 1200,
    height: 630,
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQSchema(faqs: Array<{question: string, answer: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

/**
 * Performance optimization hints untuk metadata
 */
export const SEO_PERFORMANCE_HINTS = {
  // Critical resource hints
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ],
  
  // DNS prefetch untuk external resources
  dnsPrefetch: [
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com'
  ],

  // Preload critical resources
  preload: [
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
  ]
} as const

/**
 * Validate metadata untuk SEO best practices
 */
export function validateMetadata(metadata: Metadata): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []
  
  // Title validation
  if (!metadata.title) {
    errors.push('Title is required')
  } else if (typeof metadata.title === 'string') {
    if (metadata.title.length > 60) {
      warnings.push('Title is longer than 60 characters')
    }
    if (metadata.title.length < 30) {
      warnings.push('Title is shorter than 30 characters')
    }
  }

  // Description validation
  if (!metadata.description) {
    errors.push('Description is required')
  } else if (metadata.description.length > 160) {
    warnings.push('Description is longer than 160 characters')
  } else if (metadata.description.length < 120) {
    warnings.push('Description is shorter than 120 characters')
  }

  // Open Graph validation
  const ogImages = metadata.openGraph?.images
  if (!ogImages || (Array.isArray(ogImages) && ogImages.length === 0)) {
    warnings.push('Open Graph image is missing')
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  }
}