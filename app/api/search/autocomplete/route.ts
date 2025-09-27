import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit-middleware'

// Types for autocomplete
interface AutocompleteResult {
  suggestion: string
  category: string
  frequency: number
  type: 'suggestion' | 'content' | 'tag' | 'category'
}

interface AutocompleteResponse {
  success: boolean
  data: {
    suggestions: AutocompleteResult[]
    query: string
    response_time_ms: number
  }
}

/**
 * GET /api/search/autocomplete
 * Autocomplete suggestions untuk search queries
 */
async function getHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
    const includeContent = searchParams.get('include_content') === 'true'

    // Validate query length
    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required'
      }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const suggestions: AutocompleteResult[] = []

    // 1. Get suggestions from search_suggestions table
    const { data: searchSuggestions, error: suggestionsError } = await supabase
      .rpc('get_search_suggestions', {
        partial_query: query,
        limit_count: Math.ceil(limit * 0.4) // 40% dari limit untuk suggestions
      })

    if (!suggestionsError && searchSuggestions) {
      suggestions.push(...searchSuggestions.map((s: any) => ({
        suggestion: s.suggestion,
        category: s.category || 'suggestion',
        frequency: s.frequency,
        type: 'suggestion' as const
      })))
    }

    // 2. Get content titles yang match (jika include_content = true)
    if (includeContent && suggestions.length < limit) {
      const remainingLimit = limit - suggestions.length
      
      const { data: contentTitles, error: contentError } = await supabase
        .from('content_entries')
        .select('id, slug, search_data')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .textSearch('search_vector', query.split(' ').join(' | '), {
          type: 'websearch',
          config: 'indonesian_english'
        })
        .limit(remainingLimit)

      if (!contentError && contentTitles) {
        contentTitles.forEach((content: any) => {
          const title = content.search_data?.title || content.slug
          if (title && title.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              suggestion: title,
              category: 'content',
              frequency: 1,
              type: 'content'
            })
          }
        })
      }
    }

    // 3. Get popular tags yang match
    if (suggestions.length < limit) {
      const remainingLimit = limit - suggestions.length
      
      // Extract tags dari content entries yang published
      const { data: tagResults, error: tagError } = await supabase
        .from('content_entries')
        .select('search_data')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .not('search_data->tags', 'is', null)
        .limit(100) // Limit untuk performance

      if (!tagError && tagResults) {
        const tagFrequency: Record<string, number> = {}
        
        // Count tag frequencies
        tagResults.forEach((entry: any) => {
          const tags = entry.search_data?.tags
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              if (typeof tag === 'string' && tag.toLowerCase().includes(query.toLowerCase())) {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
              }
            })
          }
        })

        // Sort by frequency dan ambil top results
        const sortedTags = Object.entries(tagFrequency)
          .sort(([, a], [, b]) => b - a)
          .slice(0, remainingLimit)

        sortedTags.forEach(([tag, frequency]) => {
          suggestions.push({
            suggestion: tag,
            category: 'tag',
            frequency,
            type: 'tag'
          })
        })
      }
    }

    // 4. Get categories yang match
    if (suggestions.length < limit) {
      const remainingLimit = limit - suggestions.length
      
      const { data: categoryResults, error: categoryError } = await supabase
        .from('content_entries')
        .select('search_data->category')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .not('search_data->category', 'is', null)
        .limit(100)

      if (!categoryError && categoryResults) {
        const categoryFrequency: Record<string, number> = {}
        
        categoryResults.forEach((entry: any) => {
          const category = entry.category
          if (typeof category === 'string' && category.toLowerCase().includes(query.toLowerCase())) {
            categoryFrequency[category] = (categoryFrequency[category] || 0) + 1
          }
        })

        const sortedCategories = Object.entries(categoryFrequency)
          .sort(([, a], [, b]) => b - a)
          .slice(0, remainingLimit)

        sortedCategories.forEach(([category, frequency]) => {
          suggestions.push({
            suggestion: category,
            category: 'category',
            frequency,
            type: 'category'
          })
        })
      }
    }

    // Remove duplicates dan sort by relevance
    const uniqueSuggestions = suggestions
      .filter((s, index, self) => 
        self.findIndex(x => x.suggestion.toLowerCase() === s.suggestion.toLowerCase()) === index
      )
      .sort((a, b) => {
        // Sort by relevance: exact match, starts with, frequency
        const aLower = a.suggestion.toLowerCase()
        const bLower = b.suggestion.toLowerCase()
        const queryLower = query.toLowerCase()

        if (aLower === queryLower) return -1
        if (bLower === queryLower) return 1
        if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1
        if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1
        
        return b.frequency - a.frequency
      })
      .slice(0, limit)

    const responseTime = Date.now() - startTime

    const response: AutocompleteResponse = {
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        query,
        response_time_ms: responseTime
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Autocomplete error:', error)
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: false,
      error: 'Autocomplete temporarily unavailable',
      data: {
        suggestions: [],
        query: '',
        response_time_ms: responseTime
      }
    }, { status: 500 })
  }
}

// Export rate-limited handler dengan lebih permissive rate limit untuk autocomplete
const autocompleteRateLimit = apiRateLimit // You can create a more permissive rate limit if needed

export const GET = withRateLimit(getHandler, autocompleteRateLimit)