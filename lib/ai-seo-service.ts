/**
 * AI-Powered SEO Suggestions Service untuk AI CMS Scaffold
 * Menggunakan Google Generative AI untuk SEO analysis dan recommendations
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { calculateSEOScore, AISeOSuggestions } from './seo-fields'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface ContentForSEOAnalysis {
  title: string
  content: string
  meta_title?: string
  meta_description?: string
  focus_keyword?: string
  additional_keywords?: string
  slug: string
  content_type: string
  category?: string
  tags?: string[]
}

export interface SEOAnalysisResult {
  score: number
  breakdown: Record<string, number>
  suggestions: AISeOSuggestions
  recommendations: string[]
  competitors?: {
    analysis: string
    opportunities: string[]
  }
  technical_audit: {
    issues: string[]
    fixes: string[]
    performance_tips: string[]
  }
}

/**
 * Comprehensive AI SEO Analysis dengan Google 2025 best practices
 */
export async function analyzeContentSEO(content: ContentForSEOAnalysis): Promise<SEOAnalysisResult> {
  try {
    // Basic SEO score calculation
    const basicAnalysis = calculateSEOScore(content)
    
    // AI-powered analysis
    const aiSuggestions = await generateAISEOSuggestions(content)
    const technicalAudit = await performTechnicalSEOAudit(content)
    const competitorInsights = await analyzeCompetitorOpportunities(content)

    return {
      score: basicAnalysis.score,
      breakdown: basicAnalysis.breakdown,
      suggestions: aiSuggestions,
      recommendations: basicAnalysis.recommendations,
      competitors: competitorInsights,
      technical_audit: technicalAudit
    }
  } catch (error) {
    console.error('SEO Analysis Error:', error)
    throw new Error('Failed to analyze content SEO')
  }
}

/**
 * Generate AI-powered SEO suggestions
 */
async function generateAISEOSuggestions(content: ContentForSEOAnalysis): Promise<AISeOSuggestions> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
    Analyze this content for SEO optimization according to Google 2025 best practices:

    Title: ${content.title}
    Content: ${content.content.substring(0, 2000)}...
    Current Meta Title: ${content.meta_title || 'Not set'}
    Current Meta Description: ${content.meta_description || 'Not set'}
    Focus Keyword: ${content.focus_keyword || 'Not set'}
    Content Type: ${content.content_type}
    Category: ${content.category || 'Not set'}
    Tags: ${content.tags?.join(', ') || 'Not set'}

    Please provide SEO suggestions in JSON format with these exact keys:
    {
      "title_suggestions": ["suggestion1", "suggestion2", "suggestion3"],
      "description_suggestions": ["suggestion1", "suggestion2", "suggestion3"],
      "keyword_suggestions": ["keyword1", "keyword2", "keyword3"],
      "content_improvements": ["improvement1", "improvement2", "improvement3"],
      "technical_recommendations": ["rec1", "rec2", "rec3"]
    }

    Focus on:
    1. E-A-T signals (Expertise, Authoritativeness, Trustworthiness)
    2. Core Web Vitals optimization
    3. Semantic search optimization
    4. Featured snippet optimization
    5. User intent alignment
    6. Google's helpful content update compliance
    7. AI-generated content best practices
  `

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0])
      return suggestions as AISeOSuggestions
    }
    
    // Fallback suggestions if AI fails
    return generateFallbackSuggestions(content)
  } catch (error) {
    console.error('AI SEO Suggestions Error:', error)
    return generateFallbackSuggestions(content)
  }
}

/**
 * Technical SEO Audit menggunakan AI
 */
async function performTechnicalSEOAudit(content: ContentForSEOAnalysis) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
    Perform a technical SEO audit for this content based on Google 2025 guidelines:

    Title: ${content.title}
    Slug: ${content.slug}
    Content Length: ${content.content.length} characters
    Content Type: ${content.content_type}

    Analyze for:
    1. URL structure optimization
    2. Internal linking opportunities
    3. Content structure (headings, lists, etc.)
    4. Image optimization needs
    5. Core Web Vitals factors
    6. Mobile-first indexing readiness
    7. Page Experience signals

    Return JSON with:
    {
      "issues": ["issue1", "issue2"],
      "fixes": ["fix1", "fix2"],
      "performance_tips": ["tip1", "tip2"]
    }
  `

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return generateFallbackTechnicalAudit(content)
  } catch (error) {
    console.error('Technical SEO Audit Error:', error)
    return generateFallbackTechnicalAudit(content)
  }
}

/**
 * Analyze competitor opportunities
 */
async function analyzeCompetitorOpportunities(content: ContentForSEOAnalysis) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
    Based on the content topic and keywords, suggest competitor analysis strategies:

    Topic: ${content.title}
    Keywords: ${content.focus_keyword || 'N/A'}, ${content.additional_keywords || 'N/A'}
    Content Type: ${content.content_type}
    Category: ${content.category || 'N/A'}

    Provide insights in JSON format:
    {
      "analysis": "Brief analysis of competitive landscape",
      "opportunities": ["opportunity1", "opportunity2", "opportunity3"]
    }

    Focus on:
    1. Content gap opportunities
    2. Keyword variations to target
    3. Content format opportunities (lists, guides, comparisons)
    4. User intent variations
    5. Long-tail keyword opportunities
  `

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return {
      analysis: "Competitive analysis available with premium features",
      opportunities: ["Create comprehensive guides", "Target long-tail keywords", "Optimize for voice search"]
    }
  } catch (error) {
    console.error('Competitor Analysis Error:', error)
    return null
  }
}

/**
 * Generate optimal meta tags menggunakan AI
 */
export async function generateOptimalMetaTags(content: ContentForSEOAnalysis): Promise<{
  meta_title: string
  meta_description: string
  og_title: string
  og_description: string
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
    Generate optimal meta tags for this content following Google 2025 SEO best practices:

    Title: ${content.title}
    Content Preview: ${content.content.substring(0, 500)}...
    Focus Keyword: ${content.focus_keyword || 'Not specified'}
    Content Type: ${content.content_type}

    Requirements:
    - Meta title: 50-60 characters, include focus keyword naturally
    - Meta description: 150-160 characters, compelling with CTA
    - OG title: Can be different from meta title, optimized for social sharing
    - OG description: Can be different from meta description, engaging for social

    Return JSON:
    {
      "meta_title": "SEO optimized title",
      "meta_description": "Compelling meta description with CTA",
      "og_title": "Social media optimized title",
      "og_description": "Engaging social media description"
    }
  `

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback generation
    return generateFallbackMetaTags(content)
  } catch (error) {
    console.error('Meta Tags Generation Error:', error)
    return generateFallbackMetaTags(content)
  }
}

/**
 * Content optimization suggestions untuk featured snippets
 */
export async function optimizeForFeaturedSnippets(content: ContentForSEOAnalysis): Promise<{
  structured_content: string[]
  faq_suggestions: Array<{question: string, answer: string}>
  list_optimizations: string[]
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
    Analyze this content and suggest optimizations for Google Featured Snippets:

    Title: ${content.title}
    Content: ${content.content.substring(0, 1500)}...
    Focus Keyword: ${content.focus_keyword || 'Not specified'}

    Suggest:
    1. How to structure content for paragraph snippets
    2. FAQ pairs that could trigger FAQ snippets
    3. List format optimizations

    Return JSON:
    {
      "structured_content": ["Structure suggestion 1", "Structure suggestion 2"],
      "faq_suggestions": [
        {"question": "Common question", "answer": "Concise answer"},
        {"question": "Another question", "answer": "Another answer"}
      ],
      "list_optimizations": ["List optimization 1", "List optimization 2"]
    }
  `

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return generateFallbackSnippetOptimization(content)
  } catch (error) {
    console.error('Featured Snippet Optimization Error:', error)
    return generateFallbackSnippetOptimization(content)
  }
}

/**
 * Fallback functions when AI fails
 */
function generateFallbackSuggestions(content: ContentForSEOAnalysis): AISeOSuggestions {
  return {
    title_suggestions: [
      `${content.focus_keyword ? content.focus_keyword + ': ' : ''}${content.title}`,
      `Complete Guide to ${content.title}`,
      `${content.title} - Everything You Need to Know`
    ],
    description_suggestions: [
      `Learn about ${content.title.toLowerCase()}. Comprehensive guide with expert tips and actionable insights.`,
      `Discover everything about ${content.title.toLowerCase()}. Read our detailed analysis and recommendations.`,
      `${content.title} explained. Get practical advice and proven strategies from industry experts.`
    ],
    keyword_suggestions: content.focus_keyword ? [
      content.focus_keyword,
      `${content.focus_keyword} guide`,
      `${content.focus_keyword} tips`,
      `best ${content.focus_keyword}`,
      `how to ${content.focus_keyword}`
    ] : ['guide', 'tips', 'best practices', 'how to'],
    content_improvements: [
      'Add more detailed explanations for complex concepts',
      'Include practical examples and case studies',
      'Add internal links to related content',
      'Include statistics and data to support claims',
      'Add actionable takeaways and next steps'
    ],
    technical_recommendations: [
      'Optimize images with descriptive alt text',
      'Add schema markup for better rich snippets',
      'Improve page loading speed',
      'Ensure mobile-friendly design',
      'Add internal linking structure'
    ]
  }
}

function generateFallbackMetaTags(content: ContentForSEOAnalysis) {
  const focusKeyword = content.focus_keyword || content.title.split(' ').slice(0, 2).join(' ')
  
  return {
    meta_title: content.title.length <= 60 ? content.title : content.title.substring(0, 57) + '...',
    meta_description: `Learn about ${content.title.toLowerCase()}. ${content.content.substring(0, 100)}... Get expert insights and actionable tips.`,
    og_title: content.title,
    og_description: `Discover everything about ${content.title.toLowerCase()}. Comprehensive guide with practical examples.`
  }
}

function generateFallbackTechnicalAudit(content: ContentForSEOAnalysis) {
  return {
    issues: [
      'URL could be optimized for better readability',
      'Content length may need expansion for comprehensive coverage',
      'Internal linking opportunities not fully utilized'
    ],
    fixes: [
      'Consider adding more headings for better structure',
      'Add relevant internal links to related content',
      'Include multimedia elements (images, videos) for engagement'
    ],
    performance_tips: [
      'Optimize images for faster loading',
      'Use lazy loading for non-critical resources',
      'Minimize render-blocking resources'
    ]
  }
}

function generateFallbackSnippetOptimization(content: ContentForSEOAnalysis) {
  return {
    structured_content: [
      'Use clear H2 and H3 headings to organize content',
      'Create concise paragraph answers to common questions',
      'Use bullet points and numbered lists for step-by-step processes'
    ],
    faq_suggestions: [
      {
        question: `What is ${content.title.toLowerCase()}?`,
        answer: `${content.title} is ${content.content.substring(0, 100)}...`
      },
      {
        question: `How does ${content.title.toLowerCase()} work?`,
        answer: 'This involves several key steps and considerations...'
      }
    ],
    list_optimizations: [
      'Format lists with clear numbering or bullets',
      'Keep list items concise and actionable',
      'Use descriptive list titles that include target keywords'
    ]
  }
}

/**
 * Real-time SEO score tracking
 */
export function trackSEOScoreChanges(contentId: string, newScore: number) {
  // This would integrate with your analytics system
  console.log(`SEO Score updated for content ${contentId}: ${newScore}`)
  
  // You can expand this to:
  // 1. Store score history in database
  // 2. Send notifications for significant changes
  // 3. Trigger automated optimization suggestions
  // 4. Update SEO dashboard metrics
}