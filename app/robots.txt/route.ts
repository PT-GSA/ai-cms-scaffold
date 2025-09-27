/**
 * Dynamic robots.txt generator untuk AI CMS Scaffold
 * Mengikuti SEO best practices dan Google guidelines 2025
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
  const environment = process.env.NODE_ENV || 'development'
  
  // Different robots.txt for different environments
  let robotsContent = ''
  
  if (environment === 'production') {
    // Production robots.txt - allow all
    robotsContent = `# AI CMS Scaffold - Production
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/api/sitemap

# Disallow admin areas
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password

# Disallow private content
Disallow: /preview/
Disallow: /*?*

# Rate limit crawling
Crawl-delay: 1

# Specific bot instructions
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Block problematic bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /`
  } else {
    // Development/staging robots.txt - block all
    robotsContent = `# AI CMS Scaffold - Development/Staging
User-agent: *
Disallow: /

# This is a development/staging environment
# All crawling is blocked to prevent indexing`
  }

  return new NextResponse(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}