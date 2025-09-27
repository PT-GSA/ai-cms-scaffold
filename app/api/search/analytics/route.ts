import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit-middleware'

// Types for search analytics
interface SearchAnalyticsResult {
  query: string
  search_count: number
  avg_results: number
  avg_response_time: number
  click_count: number
  click_through_rate: number
  last_searched: string
}

interface SearchTrendData {
  date: string
  search_count: number
  unique_queries: number
  avg_response_time: number
}

interface PopularContent {
  id: string
  title: string
  slug: string
  content_type: string
  click_count: number
  last_clicked: string
}

/**
 * GET /api/search/analytics
 * Get search analytics dan statistics (Admin only)
 */
async function getHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = createAdminSupabaseClient()

    // Parse parameters
    const type = searchParams.get('type') || 'overview' // overview, trends, popular_queries, popular_content
    const days = parseInt(searchParams.get('days') || '30')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json({
        success: false,
        error: 'Days parameter must be between 1 and 365'
      }, { status: 400 })
    }

    const dateFilter = `NOW() - INTERVAL '${days} days'`

    switch (type) {
      case 'overview':
        // Overall search statistics
        const { data: overviewData, error: overviewError } = await supabase
          .from('search_analytics')
          .select(`
            id,
            query,
            query_type,
            results_count,
            response_time_ms,
            clicked_result_id,
            created_at
          `)
          .gte('created_at', `NOW() - INTERVAL '${days} days'`)

        if (overviewError) {
          throw new Error('Failed to fetch overview data')
        }

        const totalSearches = overviewData?.length || 0
        const uniqueQueries = new Set(overviewData?.map(s => s.query) || []).size
        const avgResponseTime = overviewData?.reduce((sum, s) => sum + (s.response_time_ms || 0), 0) / totalSearches || 0
        const clickThroughRate = (overviewData?.filter(s => s.clicked_result_id).length || 0) / totalSearches * 100
        const avgResults = overviewData?.reduce((sum, s) => sum + (s.results_count || 0), 0) / totalSearches || 0

        return NextResponse.json({
          success: true,
          data: {
            period_days: days,
            total_searches: totalSearches,
            unique_queries: uniqueQueries,
            avg_response_time_ms: Math.round(avgResponseTime),
            click_through_rate: Math.round(clickThroughRate * 100) / 100,
            avg_results_per_search: Math.round(avgResults * 100) / 100
          }
        })

      case 'trends':
        // Daily search trends
        const { data: trendsData, error: trendsError } = await supabase
          .rpc('search_trends_by_day', {
            days_back: days
          })

        if (trendsError) {
          console.error('Trends query error:', trendsError)
          // Fallback manual query
          const { data: fallbackTrends } = await supabase
            .from('search_analytics')
            .select('created_at, query, response_time_ms')
            .gte('created_at', `NOW() - INTERVAL '${days} days'`)

          const trendsByDate: Record<string, SearchTrendData> = {}
          fallbackTrends?.forEach(row => {
            const date = new Date(row.created_at).toISOString().split('T')[0]
            if (!trendsByDate[date]) {
              trendsByDate[date] = {
                date,
                search_count: 0,
                unique_queries: 0,
                avg_response_time: 0
              }
            }
            trendsByDate[date].search_count++
          })

          return NextResponse.json({
            success: true,
            data: {
              trends: Object.values(trendsByDate).sort((a, b) => a.date.localeCompare(b.date))
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: {
            trends: trendsData || []
          }
        })

      case 'popular_queries':
        // Most popular search queries
        const { data: popularQueries, error: queriesError } = await supabase
          .from('search_statistics')
          .select('*')
          .limit(limit)

        if (queriesError) {
          // Fallback manual aggregation
          const { data: rawQueries } = await supabase
            .from('search_analytics')
            .select('query, results_count, response_time_ms, clicked_result_id, created_at')
            .gte('created_at', `NOW() - INTERVAL '${days} days'`)

          const queryStats: Record<string, SearchAnalyticsResult> = {}
          rawQueries?.forEach(row => {
            if (!queryStats[row.query]) {
              queryStats[row.query] = {
                query: row.query,
                search_count: 0,
                avg_results: 0,
                avg_response_time: 0,
                click_count: 0,
                click_through_rate: 0,
                last_searched: row.created_at
              }
            }
            
            const stats = queryStats[row.query]
            stats.search_count++
            stats.avg_results = (stats.avg_results * (stats.search_count - 1) + (row.results_count || 0)) / stats.search_count
            stats.avg_response_time = (stats.avg_response_time * (stats.search_count - 1) + (row.response_time_ms || 0)) / stats.search_count
            if (row.clicked_result_id) stats.click_count++
            stats.click_through_rate = (stats.click_count / stats.search_count) * 100
            if (row.created_at > stats.last_searched) stats.last_searched = row.created_at
          })

          const sortedQueries = Object.values(queryStats)
            .sort((a, b) => b.search_count - a.search_count)
            .slice(0, limit)

          return NextResponse.json({
            success: true,
            data: {
              popular_queries: sortedQueries
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: {
            popular_queries: popularQueries || []
          }
        })

      case 'popular_content':
        // Most clicked content from search results
        const { data: popularContent, error: contentError } = await supabase
          .from('search_analytics')
          .select(`
            clicked_result_id,
            created_at,
            content_entries!inner (
              id,
              slug,
              search_data,
              content_types!inner (
                name
              )
            )
          `)
          .not('clicked_result_id', 'is', null)
          .gte('created_at', `NOW() - INTERVAL '${days} days'`)
          .limit(limit * 3) // Get more data for grouping

        if (contentError) {
          throw new Error('Failed to fetch popular content')
        }

        // Group by content ID dan count clicks
        const contentStats: Record<string, PopularContent> = {}
        popularContent?.forEach((row: any) => {
          const contentId = row.clicked_result_id
          const content = row.content_entries
          
          if (!contentStats[contentId]) {
            contentStats[contentId] = {
              id: contentId,
              title: content.search_data?.title || content.slug,
              slug: content.slug,
              content_type: content.content_types.name,
              click_count: 0,
              last_clicked: row.created_at
            }
          }
          
          contentStats[contentId].click_count++
          if (row.created_at > contentStats[contentId].last_clicked) {
            contentStats[contentId].last_clicked = row.created_at
          }
        })

        const sortedContent = Object.values(contentStats)
          .sort((a, b) => b.click_count - a.click_count)
          .slice(0, limit)

        return NextResponse.json({
          success: true,
          data: {
            popular_content: sortedContent
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid analytics type. Use: overview, trends, popular_queries, or popular_content'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Search analytics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch search analytics'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/search/analytics
 * Cleanup old search analytics data (Admin only)
 */
async function deleteHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('retention_days') || '90')

    if (days < 7) {
      return NextResponse.json({
        success: false,
        error: 'Retention period must be at least 7 days'
      }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Call cleanup function
    const { data: cleanupResult, error } = await supabase
      .rpc('cleanup_search_analytics', {
        retention_days: days
      })

    if (error) {
      throw new Error('Failed to cleanup analytics data')
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted_records: cleanupResult || 0,
        retention_days: days
      },
      message: `Cleaned up ${cleanupResult || 0} old analytics records`
    })

  } catch (error) {
    console.error('Analytics cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup analytics data'
    }, { status: 500 })
  }
}

// Helper function untuk create search trends aggregation
async function createSearchTrendsFunction(supabase: any) {
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: `
      CREATE OR REPLACE FUNCTION search_trends_by_day(days_back integer DEFAULT 30)
      RETURNS TABLE (
        date text,
        search_count integer,
        unique_queries integer,
        avg_response_time numeric
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          DATE(sa.created_at)::text as date,
          COUNT(*)::integer as search_count,
          COUNT(DISTINCT sa.query)::integer as unique_queries,
          ROUND(AVG(sa.response_time_ms), 2) as avg_response_time
        FROM search_analytics sa
        WHERE sa.created_at >= NOW() - (days_back || ' days')::interval
        GROUP BY DATE(sa.created_at)
        ORDER BY date;
      END;
      $$ LANGUAGE plpgsql;
    `
  })
  
  if (error) {
    console.error('Failed to create search trends function:', error)
  }
}

// Export rate-limited handlers with admin-only access for some endpoints
export const GET = withRateLimit(getHandler, apiRateLimit)
export const DELETE = withRateLimit(deleteHandler, apiRateLimit)