import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit-middleware'
import { getClientIP } from '@/lib/redis'

// Types for search functionality
interface SearchFilters {
  content_type?: string[]
  status?: string
  date_from?: string
  date_to?: string
  author?: string
  tags?: string[]
  category?: string
}

interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt: string
  content_type_name: string
  status: string
  published_at: string | null
  search_rank: number
  similarity_score: number
  highlighted_title: string
  highlighted_excerpt: string
}

interface SearchResponse {
  success: boolean
  data: {
    results: SearchResult[]
    pagination: {
      page: number
      limit: number
      total: number
      total_pages: number
    }
    query_info: {
      query: string
      search_type: string
      response_time_ms: number
      filters_applied: SearchFilters
    }
  }
  suggestions?: string[]
}

/**
 * GET /api/search
 * Full-text search dengan advanced filtering dan ranking
 */
async function getHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const supabase = createAdminSupabaseClient()

    // Parse query parameters
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 results
    const search_type = searchParams.get('type') || 'full_text' // full_text, similarity, fuzzy
    const include_similarity = searchParams.get('include_similarity') === 'true'

    // Parse filters
    const filters: SearchFilters = {
      content_type: searchParams.get('content_type')?.split(',') || undefined,
      status: searchParams.get('status') || 'published',
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      author: searchParams.get('author') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      category: searchParams.get('category') || undefined
    }

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      }, { status: 400 })
    }

    const offset = (page - 1) * limit

    // Execute search based on type
    let searchResults: SearchResult[] = []
    let totalResults = 0

    if (search_type === 'similarity' || search_type === 'fuzzy') {
      // Similarity/fuzzy search
      const { data: results, error } = await supabase
        .rpc('similarity_search_content', {
          search_query: query,
          similarity_threshold: 0.3,
          limit_count: limit
        })

      if (error) {
        console.error('Similarity search error:', error)
        throw new Error('Failed to execute similarity search')
      }

      searchResults = results?.map((result: any) => ({
        id: result.id,
        title: result.title,
        slug: result.slug,
        excerpt: '',
        content_type_name: result.content_type_name,
        status: 'published',
        published_at: null,
        search_rank: 0,
        similarity_score: result.similarity_score,
        highlighted_title: result.title,
        highlighted_excerpt: ''
      })) || []

      totalResults = searchResults.length

    } else {
      // Full-text search
      const { data: results, error } = await supabase
        .rpc('search_content_entries', {
          search_query: query,
          content_type_filter: filters.content_type || null,
          status_filter: filters.status || 'published',
          limit_count: limit,
          offset_count: offset,
          include_similarity
        })

      if (error) {
        console.error('Full-text search error:', error)
        throw new Error('Failed to execute full-text search')
      }

      searchResults = results || []

      // Get total count for pagination (separate query for performance)
      const { data: countResult, error: countError } = await supabase
        .rpc('search_content_entries', {
          search_query: query,
          content_type_filter: filters.content_type || null,
          status_filter: filters.status || 'published',
          limit_count: 1000000, // Large number to get all results for count
          offset_count: 0,
          include_similarity: false
        })

      totalResults = countResult?.length || 0
    }

    // Get search suggestions untuk empty atau low-result searches
    let suggestions: string[] = []
    if (searchResults.length < 3) {
      const { data: suggestionResults } = await supabase
        .rpc('get_search_suggestions', {
          partial_query: query,
          limit_count: 5
        })

      suggestions = suggestionResults?.map((s: any) => s.suggestion) || []
    }

    // Log search analytics
    const responseTime = Date.now() - startTime
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent')

    // Async logging (don't wait for completion)
    Promise.resolve().then(async () => {
      try {
        await supabase.rpc('log_search_analytics', {
          p_query: query,
          p_query_type: search_type,
          p_filters: JSON.stringify(filters),
          p_results_count: searchResults.length,
          p_response_time_ms: responseTime,
          p_user_id: null, // TODO: Get from auth context if available
          p_ip_address: clientIP,
          p_user_agent: userAgent
        })
      } catch (err) {
        console.error('Failed to log search analytics:', err)
      }
    })

    const response: SearchResponse = {
      success: true,
      data: {
        results: searchResults,
        pagination: {
          page,
          limit,
          total: totalResults,
          total_pages: Math.ceil(totalResults / limit)
        },
        query_info: {
          query,
          search_type,
          response_time_ms: responseTime,
          filters_applied: filters
        }
      }
    }

    // Add suggestions if available
    if (suggestions.length > 0) {
      response.suggestions = suggestions
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Search error:', error)
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: false,
      error: 'Search temporarily unavailable',
      query_info: {
        response_time_ms: responseTime
      }
    }, { status: 500 })
  }
}

/**
 * POST /api/search/analytics/click
 * Track click-through untuk search results
 */
async function postHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { search_query, clicked_result_id, search_analytics_id } = body

    if (!search_query || !clicked_result_id) {
      return NextResponse.json({
        success: false,
        error: 'search_query and clicked_result_id are required'
      }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Update search analytics record with click information
    if (search_analytics_id) {
      await supabase
        .from('search_analytics')
        .update({ clicked_result_id })
        .eq('id', search_analytics_id)
    } else {
      // Create new analytics record for the click
      await supabase
        .from('search_analytics')
        .insert({
          query: search_query,
          query_type: 'click_through',
          results_count: 1,
          clicked_result_id,
          ip_address: getClientIP(request),
          user_agent: request.headers.get('user-agent')
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully'
    })

  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track click'
    }, { status: 500 })
  }
}

// Export rate-limited handlers
export const GET = withRateLimit(getHandler, apiRateLimit)
export const POST = withRateLimit(postHandler, apiRateLimit)