import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { withCors } from '@/lib/cors'

/**
 * POST /api/schema/apply-search
 * Apply full-text search schema to database
 */
async function postHandler() {
  try {
    const supabase = createServiceClient()

    // Full-text search schema SQL
    const searchSchema = `
      -- Full-Text Search Schema untuk AI CMS Scaffold
      -- Implementasi PostgreSQL FTS dengan GIN indexes dan ranking

      -- Enable necessary extensions
      CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- Trigram similarity untuk fuzzy search
      CREATE EXTENSION IF NOT EXISTS unaccent;  -- Remove accents untuk international support

      -- Add search vector columns ke content_entries
      ALTER TABLE content_entries 
      ADD COLUMN IF NOT EXISTS search_vector tsvector,
      ADD COLUMN IF NOT EXISTS search_data jsonb,
      ADD COLUMN IF NOT EXISTS search_updated_at timestamptz DEFAULT NOW();

      -- Add search columns ke content_types
      ALTER TABLE content_types
      ADD COLUMN IF NOT EXISTS search_vector tsvector;

      -- Create search configuration untuk bahasa Indonesia dan English
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'indonesian_english') THEN
          CREATE TEXT SEARCH CONFIGURATION indonesian_english (COPY = english);
          ALTER TEXT SEARCH CONFIGURATION indonesian_english
            ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
            WITH indonesian_stem, english_stem;
        END IF;
      END $$;

      -- Function untuk generate search vector dari content entry
      CREATE OR REPLACE FUNCTION generate_content_search_vector(entry_data jsonb, entry_slug text)
      RETURNS tsvector AS $$
      DECLARE
        search_text text := '';
        key text;
        value text;
      BEGIN
        -- Extract semua text values dari JSONB data
        FOR key, value IN SELECT * FROM jsonb_each_text(entry_data)
        LOOP
          -- Skip non-text fields
          CONTINUE WHEN key IN ('created_at', 'updated_at', 'id', 'status');
          
          -- Tambahkan weight berdasarkan field importance
          CASE key
            WHEN 'title' THEN 
              search_text := search_text || ' ' || COALESCE(value, '');
              search_text := search_text || ' ' || COALESCE(value, ''); -- Double weight untuk title
            WHEN 'content', 'body', 'description' THEN
              search_text := search_text || ' ' || COALESCE(value, '');
            WHEN 'tags', 'keywords' THEN
              search_text := search_text || ' ' || COALESCE(value, '');
              search_text := search_text || ' ' || COALESCE(value, ''); -- Double weight untuk tags
            ELSE
              search_text := search_text || ' ' || COALESCE(value, '');
          END CASE;
        END LOOP;
        
        -- Tambahkan slug untuk searchability
        search_text := search_text || ' ' || COALESCE(entry_slug, '');
        
        -- Generate tsvector dengan custom weights
        RETURN to_tsvector('indonesian_english', unaccent(search_text));
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;

      -- Function untuk update search vector pada content entries
      CREATE OR REPLACE FUNCTION update_content_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Generate search vector dari data JSONB
        NEW.search_vector := generate_content_search_vector(
          COALESCE(NEW.data, '{}'::jsonb), 
          NEW.slug
        );
        
        -- Store searchable data untuk highlight dan analytics
        NEW.search_data := jsonb_build_object(
          'title', COALESCE(NEW.data->>'title', NEW.slug),
          'excerpt', LEFT(COALESCE(NEW.data->>'content', NEW.data->>'description', ''), 300),
          'tags', NEW.data->'tags',
          'category', NEW.data->>'category'
        );
        
        NEW.search_updated_at := NOW();
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Trigger untuk auto-update search vector
      DROP TRIGGER IF EXISTS update_content_search_trigger ON content_entries;
      CREATE TRIGGER update_content_search_trigger
        BEFORE INSERT OR UPDATE ON content_entries
        FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();

      -- Function untuk update search vector pada content types
      CREATE OR REPLACE FUNCTION update_content_type_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('indonesian_english', 
          unaccent(
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.display_name, '') || ' ' ||
            COALESCE(NEW.description, '')
          )
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Trigger untuk content types search
      DROP TRIGGER IF EXISTS update_content_type_search_trigger ON content_types;
      CREATE TRIGGER update_content_type_search_trigger
        BEFORE INSERT OR UPDATE ON content_types
        FOR EACH ROW EXECUTE FUNCTION update_content_type_search_vector();

      -- Create GIN indexes untuk fast full-text search
      CREATE INDEX IF NOT EXISTS idx_content_entries_search_vector 
        ON content_entries USING GIN (search_vector);

      CREATE INDEX IF NOT EXISTS idx_content_types_search_vector 
        ON content_types USING GIN (search_vector);

      -- Create GIN index untuk JSONB search data
      CREATE INDEX IF NOT EXISTS idx_content_entries_search_data 
        ON content_entries USING GIN (search_data);

      -- Create trigram indexes untuk fuzzy/similarity search
      CREATE INDEX IF NOT EXISTS idx_content_entries_title_trgm 
        ON content_entries USING GIN ((data->>'title') gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS idx_content_entries_slug_trgm 
        ON content_entries USING GIN (slug gin_trgm_ops);

      -- Create composite index untuk filtered search
      CREATE INDEX IF NOT EXISTS idx_content_entries_search_filter 
        ON content_entries (content_type_id, status, published_at DESC) 
        WHERE search_vector IS NOT NULL;

      -- Search analytics table
      CREATE TABLE IF NOT EXISTS search_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query text NOT NULL,
        query_type varchar(50) DEFAULT 'full_text',
        filters jsonb DEFAULT '{}',
        results_count integer DEFAULT 0,
        response_time_ms integer DEFAULT 0,
        user_id uuid,
        ip_address inet,
        user_agent text,
        created_at timestamptz DEFAULT NOW(),
        clicked_result_id uuid REFERENCES content_entries(id)
      );

      -- Search suggestions table
      CREATE TABLE IF NOT EXISTS search_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        suggestion text NOT NULL UNIQUE,
        category varchar(100),
        frequency integer DEFAULT 1,
        last_used timestamptz DEFAULT NOW(),
        created_at timestamptz DEFAULT NOW()
      );

      -- Indexes untuk search analytics dan suggestions
      CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics (query);
      CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_search_analytics_query_trgm ON search_analytics USING GIN (query gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_search_suggestions_text_trgm ON search_suggestions USING GIN (suggestion gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_search_suggestions_frequency ON search_suggestions (frequency DESC, last_used DESC);

      -- Advanced search function dengan ranking
      CREATE OR REPLACE FUNCTION search_content_entries(
        search_query text,
        content_type_filter text[] DEFAULT NULL,
        status_filter text DEFAULT 'published',
        limit_count integer DEFAULT 20,
        offset_count integer DEFAULT 0,
        include_similarity boolean DEFAULT false
      )
      RETURNS TABLE (
        id uuid,
        title text,
        slug text,
        excerpt text,
        content_type_name text,
        status text,
        published_at timestamptz,
        search_rank real,
        similarity_score real,
        highlighted_title text,
        highlighted_excerpt text
      ) AS $$
      DECLARE
        ts_query tsquery;
      BEGIN
        ts_query := plainto_tsquery('indonesian_english', search_query);
        
        RETURN QUERY
        SELECT 
          ce.id,
          COALESCE(ce.search_data->>'title', ce.slug) as title,
          ce.slug,
          COALESCE(ce.search_data->>'excerpt', '') as excerpt,
          ct.name as content_type_name,
          ce.status,
          ce.published_at,
          ts_rank_cd(ce.search_vector, ts_query) as search_rank,
          CASE WHEN include_similarity THEN
            similarity(COALESCE(ce.search_data->>'title', ce.slug), search_query)
          ELSE 0.0
          END as similarity_score,
          ts_headline('indonesian_english', 
            COALESCE(ce.search_data->>'title', ce.slug), 
            ts_query,
            'MaxWords=20, MinWords=5, MaxFragments=1'
          ) as highlighted_title,
          ts_headline('indonesian_english', 
            COALESCE(ce.search_data->>'excerpt', ''), 
            ts_query,
            'MaxWords=35, MinWords=15, MaxFragments=2'
          ) as highlighted_excerpt
        FROM content_entries ce
        INNER JOIN content_types ct ON ce.content_type_id = ct.id
        WHERE 
          ce.search_vector @@ ts_query
          AND (content_type_filter IS NULL OR ct.name = ANY(content_type_filter))
          AND (status_filter IS NULL OR ce.status = status_filter)
          AND (status_filter != 'published' OR ce.published_at IS NOT NULL)
        ORDER BY 
          ts_rank_cd(ce.search_vector, ts_query) DESC,
          ce.published_at DESC NULLS LAST
        LIMIT limit_count
        OFFSET offset_count;
      END;
      $$ LANGUAGE plpgsql;

      -- Similarity search function
      CREATE OR REPLACE FUNCTION similarity_search_content(
        search_query text,
        similarity_threshold real DEFAULT 0.3,
        limit_count integer DEFAULT 10
      )
      RETURNS TABLE (
        id uuid,
        title text,
        slug text,
        similarity_score real,
        content_type_name text
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          ce.id,
          COALESCE(ce.search_data->>'title', ce.slug) as title,
          ce.slug,
          similarity(COALESCE(ce.search_data->>'title', ce.slug), search_query) as similarity_score,
          ct.name as content_type_name
        FROM content_entries ce
        INNER JOIN content_types ct ON ce.content_type_id = ct.id
        WHERE 
          ce.status = 'published'
          AND ce.published_at IS NOT NULL
          AND similarity(COALESCE(ce.search_data->>'title', ce.slug), search_query) > similarity_threshold
        ORDER BY 
          similarity(COALESCE(ce.search_data->>'title', ce.slug), search_query) DESC
        LIMIT limit_count;
      END;
      $$ LANGUAGE plpgsql;

      -- Search suggestions function
      CREATE OR REPLACE FUNCTION get_search_suggestions(
        partial_query text,
        limit_count integer DEFAULT 10
      )
      RETURNS TABLE (
        suggestion text,
        category text,
        frequency integer
      ) AS $$
      BEGIN
        INSERT INTO search_suggestions (suggestion, category)
        VALUES (partial_query, 'user_query')
        ON CONFLICT (suggestion) DO UPDATE SET
          frequency = search_suggestions.frequency + 1,
          last_used = NOW();
        
        RETURN QUERY
        SELECT 
          ss.suggestion,
          ss.category,
          ss.frequency
        FROM search_suggestions ss
        WHERE 
          ss.suggestion % partial_query
          OR ss.suggestion ILIKE partial_query || '%'
        ORDER BY 
          ss.frequency DESC,
          similarity(ss.suggestion, partial_query) DESC
        LIMIT limit_count;
      END;
      $$ LANGUAGE plpgsql;

      -- Search analytics logging function
      CREATE OR REPLACE FUNCTION log_search_analytics(
        p_query text,
        p_query_type varchar(50),
        p_filters jsonb,
        p_results_count integer,
        p_response_time_ms integer,
        p_user_id uuid DEFAULT NULL,
        p_ip_address inet DEFAULT NULL,
        p_user_agent text DEFAULT NULL
      )
      RETURNS uuid AS $$
      DECLARE
        analytics_id uuid;
      BEGIN
        INSERT INTO search_analytics (
          query, query_type, filters, results_count, response_time_ms,
          user_id, ip_address, user_agent
        ) VALUES (
          p_query, p_query_type, p_filters, p_results_count, p_response_time_ms,
          p_user_id, p_ip_address, p_user_agent
        ) RETURNING id INTO analytics_id;
        
        RETURN analytics_id;
      END;
      $$ LANGUAGE plpgsql;

      -- Search statistics view
      CREATE OR REPLACE VIEW search_statistics AS
      SELECT 
        query,
        COUNT(*) as search_count,
        AVG(results_count) as avg_results,
        AVG(response_time_ms) as avg_response_time,
        COUNT(clicked_result_id) as click_count,
        (COUNT(clicked_result_id)::float / COUNT(*)::float) * 100 as click_through_rate,
        MAX(created_at) as last_searched
      FROM search_analytics
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY query
      HAVING COUNT(*) > 1
      ORDER BY search_count DESC;

      -- Search trends function
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

      -- Cleanup function untuk old analytics
      CREATE OR REPLACE FUNCTION cleanup_search_analytics(
        retention_days integer DEFAULT 90
      )
      RETURNS integer AS $$
      DECLARE
        deleted_count integer;
      BEGIN
        DELETE FROM search_analytics 
        WHERE created_at < NOW() - (retention_days || ' days')::interval;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;

      -- RLS policies
      ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
      ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Admins can view search analytics" ON search_analytics;
      CREATE POLICY "Admins can view search analytics" ON search_analytics
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('super_admin', 'admin')
          )
        );

      DROP POLICY IF EXISTS "Anyone can read search suggestions" ON search_suggestions;
      CREATE POLICY "Anyone can read search suggestions" ON search_suggestions
        FOR SELECT TO anon, authenticated USING (true);

      -- Grant permissions
      GRANT EXECUTE ON FUNCTION search_content_entries TO anon, authenticated;
      GRANT EXECUTE ON FUNCTION similarity_search_content TO anon, authenticated;
      GRANT EXECUTE ON FUNCTION get_search_suggestions TO anon, authenticated;
      GRANT EXECUTE ON FUNCTION log_search_analytics TO anon, authenticated;
      GRANT EXECUTE ON FUNCTION search_trends_by_day TO authenticated;
      GRANT EXECUTE ON FUNCTION cleanup_search_analytics TO authenticated;

      -- Update existing data dengan search vectors
      UPDATE content_entries SET search_updated_at = NOW() WHERE search_vector IS NULL;
      UPDATE content_types SET updated_at = NOW() WHERE search_vector IS NULL;

      -- Performance tuning
      ALTER TABLE search_analytics SET (fillfactor = 80);
      ALTER TABLE search_suggestions SET (fillfactor = 90);
    `

    // Execute schema menggunakan function execute_sql
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: searchSchema
    })

    if (error) {
      console.error('Error executing search schema:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to execute search schema',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Full-text search schema applied successfully',
      features: [
        'PostgreSQL Full-Text Search dengan GIN indexes',
        'Multi-language support (Indonesian + English)',
        'Trigram similarity untuk fuzzy search',
        'Auto-generated search vectors dan highlights',
        'Search analytics dan trending queries',
        'Autocomplete suggestions system',
        'Advanced ranking dan relevance scoring',
        'Performance optimized dengan proper indexes'
      ]
    })

  } catch (error) {
    console.error('Unexpected error applying search schema:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Export dengan CORS support
export const POST = withCors(postHandler)