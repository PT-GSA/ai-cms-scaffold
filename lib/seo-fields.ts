/**
 * SEO Field Types dan Utilities untuk AI CMS Scaffold
 * Sesuai dengan Google SEO best practices 2025
 */

export interface SEOFieldTypes {
  // Basic SEO Fields
  meta_title: {
    type: 'seo_title'
    label: 'SEO Title'
    placeholder: 'Optimal length: 50-60 characters'
    maxLength: 60
    required: true
    ai_suggestions: boolean
  }
  
  meta_description: {
    type: 'seo_description'
    label: 'Meta Description' 
    placeholder: 'Optimal length: 150-160 characters'
    maxLength: 160
    required: true
    ai_suggestions: boolean
  }

  // Open Graph Fields
  og_title: {
    type: 'og_title'
    label: 'Open Graph Title'
    placeholder: 'Social media title (can differ from SEO title)'
    maxLength: 95
    fallback: 'meta_title'
  }

  og_description: {
    type: 'og_description' 
    label: 'Open Graph Description'
    placeholder: 'Social media description'
    maxLength: 200
    fallback: 'meta_description'
  }

  og_image: {
    type: 'og_image'
    label: 'Open Graph Image'
    accept: 'image/*'
    recommended_size: '1200x630'
    ai_generation: boolean
  }

  // Twitter Card Fields
  twitter_card: {
    type: 'twitter_card_type'
    label: 'Twitter Card Type'
    options: ['summary', 'summary_large_image', 'app', 'player']
    default: 'summary_large_image'
  }

  twitter_title: {
    type: 'twitter_title'
    label: 'Twitter Title'
    maxLength: 70
    fallback: 'og_title'
  }

  twitter_description: {
    type: 'twitter_description'
    label: 'Twitter Description'  
    maxLength: 200
    fallback: 'og_description'
  }

  twitter_image: {
    type: 'twitter_image'
    label: 'Twitter Image'
    accept: 'image/*'
    recommended_size: '1200x628'
    fallback: 'og_image'
  }

  // Technical SEO Fields
  canonical_url: {
    type: 'canonical_url'
    label: 'Canonical URL'
    placeholder: 'https://example.com/canonical-path'
    validation: 'url'
    auto_generate: boolean
  }

  robots_meta: {
    type: 'robots_meta'
    label: 'Robots Meta Tags'
    options: ['index', 'noindex', 'follow', 'nofollow', 'noarchive', 'nosnippet']
    multiple: true
    default: ['index', 'follow']
  }

  // Schema.org Fields  
  schema_type: {
    type: 'schema_type'
    label: 'Schema.org Type'
    options: [
      'Article', 'BlogPosting', 'NewsArticle', 
      'Product', 'Service', 'Organization', 
      'Person', 'Event', 'Recipe', 'FAQ'
    ]
    default: 'Article'
  }

  // Advanced SEO Fields
  focus_keyword: {
    type: 'focus_keyword'
    label: 'Focus Keyword'
    placeholder: 'Primary keyword untuk halaman ini'
    ai_suggestions: boolean
    seo_analysis: boolean
  }

  additional_keywords: {
    type: 'keyword_list'
    label: 'Additional Keywords'
    placeholder: 'Secondary keywords (comma separated)'
    seo_analysis: boolean
  }

  // Core Web Vitals Related
  preload_resources: {
    type: 'resource_list'
    label: 'Preload Resources'
    placeholder: 'Critical resources untuk preload'
    types: ['image', 'font', 'style', 'script']
  }
}

/**
 * SEO Field Validation Rules
 */
export const SEO_VALIDATION_RULES = {
  meta_title: {
    min_length: 30,
    max_length: 60,
    optimal_length: [50, 60],
    required_keywords: true,
    avoid_duplicates: true
  },
  
  meta_description: {
    min_length: 120,
    max_length: 160, 
    optimal_length: [150, 160],
    required_keywords: true,
    call_to_action: true
  },

  focus_keyword: {
    density_range: [1, 3], // 1-3% keyword density
    title_inclusion: true,
    h1_inclusion: true,
    meta_inclusion: true
  }
} as const

/**
 * Google 2025 SEO Best Practices
 */
export const SEO_BEST_PRACTICES_2025 = {
  // Core Web Vitals Thresholds
  core_web_vitals: {
    LCP: 2500, // Largest Contentful Paint (ms)
    FID: 100,  // First Input Delay (ms) 
    CLS: 0.1,  // Cumulative Layout Shift
    INP: 200   // Interaction to Next Paint (ms)
  },

  // Content Quality Signals
  content_quality: {
    min_word_count: 300,
    readability_score: 60, // Flesch reading ease
    internal_links: 3,
    external_authority_links: 1,
    multimedia_elements: true
  },

  // Technical SEO Requirements
  technical_seo: {
    https_required: true,
    mobile_friendly: true,
    page_speed_score: 90,
    structured_data: true,
    xml_sitemap: true,
    robots_txt: true
  },

  // E-A-T Signals (Expertise, Authoritativeness, Trustworthiness)
  eat_signals: {
    author_byline: true,
    publication_date: true,
    last_updated: true,
    fact_checking: true,
    source_citations: true
  }
} as const

/**
 * AI-Powered SEO Suggestions Interface
 */
export interface AISeOSuggestions {
  title_suggestions: string[]
  description_suggestions: string[]
  keyword_suggestions: string[]
  content_improvements: string[]
  technical_recommendations: string[]
  competitor_analysis?: {
    top_competitors: string[]
    keyword_gaps: string[]
    content_opportunities: string[]
  }
}

/**
 * SEO Score Calculation
 */
interface ContentForSEO {
  meta_title?: string
  title?: string
  meta_description?: string
  excerpt?: string
  canonical_url?: string
  published_at?: string
  updated_at?: string
  author?: {
    display_name?: string
  }
  category?: string
  additional_keywords?: string
  content?: string
  og_image?: string
  brand?: string
  sku?: string
  price?: number
  currency?: string
}

export function calculateSEOScore(content: ContentForSEO): {
  score: number
  breakdown: Record<string, number>
  recommendations: string[]
} {
  const breakdown = {
    title_optimization: 0,
    meta_description: 0,  
    keyword_usage: 0,
    content_quality: 0,
    technical_seo: 0,
    user_experience: 0
  }

  const recommendations: string[] = []

  // Title Analysis
  if (content.meta_title) {
    const titleLength = content.meta_title.length
    if (titleLength >= 50 && titleLength <= 60) {
      breakdown.title_optimization = 100
    } else if (titleLength >= 30 && titleLength <= 70) {
      breakdown.title_optimization = 80
      recommendations.push('Optimize title length to 50-60 characters')
    } else {
      breakdown.title_optimization = 40
      recommendations.push('Title length is not optimal (aim for 50-60 characters)')
    }
  } else {
    breakdown.title_optimization = 0
    recommendations.push('Add SEO title')
  }

  // Meta Description Analysis
  if (content.meta_description) {
    const descLength = content.meta_description.length
    if (descLength >= 150 && descLength <= 160) {
      breakdown.meta_description = 100
    } else if (descLength >= 120 && descLength <= 180) {
      breakdown.meta_description = 80
      recommendations.push('Optimize meta description length to 150-160 characters')
    } else {
      breakdown.meta_description = 40
      recommendations.push('Meta description length needs optimization')
    }
  } else {
    breakdown.meta_description = 0
    recommendations.push('Add meta description')
  }

  // Calculate overall score
  const score = Math.round(
    Object.values(breakdown).reduce((sum, score) => sum + score, 0) / 
    Object.keys(breakdown).length
  )

  return { score, breakdown, recommendations }
}

/**
 * Generate Schema.org JSON-LD
 */
export function generateSchemaMarkup(content: ContentForSEO, type: string) {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": type,
    "headline": content.meta_title || content.title,
    "description": content.meta_description || content.excerpt,
    "url": content.canonical_url,
    "datePublished": content.published_at,
    "dateModified": content.updated_at,
    "author": {
      "@type": "Person",
      "name": content.author?.display_name || "AI CMS",
    },
    "publisher": {
      "@type": "Organization", 
      "name": "Your Organization",
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png"
      }
    }
  }

  // Add specific fields based on content type
  switch (type) {
    case 'Article':
    case 'BlogPosting':
      return {
        ...baseSchema,
        "articleSection": content.category,
        "keywords": content.additional_keywords?.split(',').map((k: string) => k.trim()),
        "wordCount": content.content?.length || 0,
        "image": content.og_image ? {
          "@type": "ImageObject",
          "url": content.og_image,
          "width": 1200,
          "height": 630
        } : undefined
      }
    
    case 'Product':
      return {
        ...baseSchema,
        "brand": content.brand,
        "sku": content.sku,
        "image": content.og_image,
        "offers": {
          "@type": "Offer",
          "price": content.price,
          "priceCurrency": content.currency || "USD",
          "availability": "https://schema.org/InStock"
        }
      }
    
    default:
      return baseSchema
  }
}

/**
 * SEO Field Component Configuration
 */
export const SEO_FIELD_COMPONENTS = {
  seo_title: 'SEOTitleField',
  seo_description: 'SEODescriptionField', 
  og_image: 'OGImageField',
  focus_keyword: 'FocusKeywordField',
  schema_type: 'SchemaTypeSelect',
  robots_meta: 'RobotsMetaSelect'
} as const