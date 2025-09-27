# Full-Text Search System Documentation

## 🎯 Overview

AI CMS Scaffold sekarang dilengkapi dengan **Full-Text Search System** yang powerful dan scalable, menggunakan PostgreSQL Full-Text Search dengan GIN indexes, multi-language support, dan analytics yang comprehensive.

## ✨ Features

### 🔍 **Advanced Search Capabilities**
- ✅ **Full-Text Search** dengan PostgreSQL FTS dan GIN indexes
- ✅ **Multi-language Support** (Indonesian + English stemming)
- ✅ **Fuzzy/Similarity Search** dengan trigram matching
- ✅ **Advanced Ranking** berdasarkan relevance dan recency
- ✅ **Search Highlighting** untuk results yang match
- ✅ **Filtered Search** by content type, status, date range

### 🚀 **Performance & Scalability**
- ✅ **GIN Indexes** untuk sub-second search response
- ✅ **Trigram Indexes** untuk fuzzy matching
- ✅ **Composite Indexes** untuk filtered searches
- ✅ **Search Vector Caching** dengan auto-update triggers
- ✅ **Query Optimization** dengan proper indexing strategy

### 🎯 **Smart Features**
- ✅ **Autocomplete Suggestions** dengan frequency tracking
- ✅ **Search Analytics** dan trend analysis
- ✅ **Click-through Tracking** untuk result optimization
- ✅ **Popular Queries** dan content insights
- ✅ **Search Statistics** untuk admin dashboard

### 🔧 **Developer Experience**
- ✅ **REST API** dengan comprehensive filtering
- ✅ **Pagination Support** untuk large result sets
- ✅ **TypeScript Types** untuk type safety
- ✅ **Rate Limiting** protection
- ✅ **Error Handling** dengan graceful fallbacks

## 📡 API Endpoints

### 1. **Main Search API**

#### **GET /api/search**
Comprehensive search dengan advanced filtering dan ranking.

**Parameters:**
```
q or query (required)    - Search query string (min 2 characters)
page (optional)          - Page number (default: 1)
limit (optional)         - Results per page (max: 100, default: 20)
type (optional)          - Search type: full_text, similarity, fuzzy
content_type (optional)  - Filter by content type (comma-separated)
status (optional)        - Filter by status (default: published)
date_from (optional)     - Filter by date range (ISO format)
date_to (optional)       - Filter by date range (ISO format)
author (optional)        - Filter by author
tags (optional)          - Filter by tags (comma-separated)
category (optional)      - Filter by category
include_similarity       - Include similarity scores (true/false)
```

**Example Request:**
```bash
GET /api/search?q=artificial+intelligence&content_type=article,blog&limit=10&include_similarity=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "title": "Understanding Artificial Intelligence",
        "slug": "understanding-ai",
        "excerpt": "AI is transforming industries...",
        "content_type_name": "article",
        "status": "published",
        "published_at": "2025-01-15T10:30:00Z",
        "search_rank": 0.8542,
        "similarity_score": 0.7234,
        "highlighted_title": "Understanding <b>Artificial Intelligence</b>",
        "highlighted_excerpt": "AI is transforming <b>industries</b> across the globe..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "total_pages": 5
    },
    "query_info": {
      "query": "artificial intelligence",
      "search_type": "full_text",
      "response_time_ms": 23,
      "filters_applied": {
        "content_type": ["article", "blog"],
        "status": "published"
      }
    }
  },
  "suggestions": ["artificial intelligence trends", "ai machine learning"]
}
```

#### **POST /api/search**
Track click-through untuk search result analytics.

**Request Body:**
```json
{
  "search_query": "artificial intelligence",
  "clicked_result_id": "uuid",
  "search_analytics_id": "analytics-uuid"
}
```

### 2. **Autocomplete API**

#### **GET /api/search/autocomplete**
Smart autocomplete suggestions dengan frequency tracking.

**Parameters:**
```
q or query (required)     - Partial query string (min 1 character)
limit (optional)          - Max suggestions (max: 20, default: 10)
include_content (optional) - Include content titles (true/false)
```

**Example Request:**
```bash
GET /api/search/autocomplete?q=artif&limit=5&include_content=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "suggestion": "artificial intelligence",
        "category": "suggestion",
        "frequency": 47,
        "type": "suggestion"
      },
      {
        "suggestion": "Artificial Intelligence in Healthcare",
        "category": "content",
        "frequency": 1,
        "type": "content"
      },
      {
        "suggestion": "artificial",
        "category": "tag",
        "frequency": 12,
        "type": "tag"
      }
    ],
    "query": "artif",
    "response_time_ms": 8
  }
}
```

### 3. **Search Analytics API**

#### **GET /api/search/analytics**
Comprehensive search analytics untuk admin dashboard.

**Parameters:**
```
type (optional)   - Analytics type: overview, trends, popular_queries, popular_content
days (optional)   - Date range in days (max: 365, default: 30)
limit (optional)  - Results limit (max: 100, default: 20)
```

**Analytics Types:**

**1. Overview Statistics**
```bash
GET /api/search/analytics?type=overview&days=30
```

```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "total_searches": 1247,
    "unique_queries": 342,
    "avg_response_time_ms": 28,
    "click_through_rate": 12.45,
    "avg_results_per_search": 8.7
  }
}
```

**2. Search Trends**
```bash
GET /api/search/analytics?type=trends&days=7
```

```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2025-01-15",
        "search_count": 89,
        "unique_queries": 34,
        "avg_response_time": 25.4
      }
    ]
  }
}
```

**3. Popular Queries**
```bash
GET /api/search/analytics?type=popular_queries&limit=10
```

**4. Popular Content**
```bash
GET /api/search/analytics?type=popular_content&limit=10
```

#### **DELETE /api/search/analytics**
Cleanup old analytics data (Admin only).

```bash
DELETE /api/search/analytics?retention_days=90
```

## 🗄️ Database Schema

### **Enhanced Content Tables**
```sql
-- New columns added to content_entries
ALTER TABLE content_entries 
ADD COLUMN search_vector tsvector,        -- Full-text search vector
ADD COLUMN search_data jsonb,             -- Cached searchable data
ADD COLUMN search_updated_at timestamptz; -- Search index timestamp

-- New columns added to content_types  
ALTER TABLE content_types
ADD COLUMN search_vector tsvector;        -- Content type search vector
```

### **Search Analytics Tables**
```sql
-- Search analytics tracking
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY,
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

-- Autocomplete suggestions
CREATE TABLE search_suggestions (
  id UUID PRIMARY KEY,
  suggestion text NOT NULL UNIQUE,
  category varchar(100),
  frequency integer DEFAULT 1,
  last_used timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);
```

### **Performance Indexes**
```sql
-- Full-text search indexes
CREATE INDEX idx_content_entries_search_vector 
  ON content_entries USING GIN (search_vector);

CREATE INDEX idx_content_types_search_vector 
  ON content_types USING GIN (search_vector);

-- Trigram similarity indexes
CREATE INDEX idx_content_entries_title_trgm 
  ON content_entries USING GIN ((data->>'title') gin_trgm_ops);

CREATE INDEX idx_content_entries_slug_trgm 
  ON content_entries USING GIN (slug gin_trgm_ops);

-- Composite filter indexes
CREATE INDEX idx_content_entries_search_filter 
  ON content_entries (content_type_id, status, published_at DESC) 
  WHERE search_vector IS NOT NULL;

-- Analytics indexes
CREATE INDEX idx_search_analytics_query_trgm 
  ON search_analytics USING GIN (query gin_trgm_ops);

CREATE INDEX idx_search_suggestions_text_trgm 
  ON search_suggestions USING GIN (suggestion gin_trgm_ops);
```

### **Advanced Functions**

#### **1. Search Content Function**
```sql
SELECT * FROM search_content_entries(
  search_query := 'artificial intelligence',
  content_type_filter := ARRAY['article', 'blog'],
  status_filter := 'published',
  limit_count := 20,
  offset_count := 0,
  include_similarity := true
);
```

#### **2. Similarity Search Function**  
```sql
SELECT * FROM similarity_search_content(
  search_query := 'machine learning',
  similarity_threshold := 0.3,
  limit_count := 10
);
```

#### **3. Search Suggestions Function**
```sql
SELECT * FROM get_search_suggestions(
  partial_query := 'artif',
  limit_count := 10
);
```

## 🚀 Setup & Installation

### 1. **Apply Search Schema**
```bash
curl -X POST "http://localhost:3000/api/schema/apply-search" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Full-text search schema applied successfully",
  "features": [
    "PostgreSQL Full-Text Search dengan GIN indexes",
    "Multi-language support (Indonesian + English)",
    "Trigram similarity untuk fuzzy search",
    "Auto-generated search vectors dan highlights",
    "Search analytics dan trending queries",
    "Autocomplete suggestions system",
    "Advanced ranking dan relevance scoring",
    "Performance optimized dengan proper indexes"
  ]
}
```

### 2. **Database Configuration**

**Required PostgreSQL Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- Trigram similarity
CREATE EXTENSION IF NOT EXISTS unaccent;  -- Remove accents
```

**Text Search Configuration:**
```sql
-- Custom search config untuk Indonesian + English
CREATE TEXT SEARCH CONFIGURATION indonesian_english (COPY = english);
ALTER TEXT SEARCH CONFIGURATION indonesian_english
  ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
  WITH indonesian_stem, english_stem;
```

### 3. **Auto-Update Triggers**
Search vectors diupdate otomatis saat content berubah:

```sql
-- Trigger untuk content_entries
CREATE TRIGGER update_content_search_trigger
  BEFORE INSERT OR UPDATE ON content_entries
  FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();

-- Trigger untuk content_types  
CREATE TRIGGER update_content_type_search_trigger
  BEFORE INSERT OR UPDATE ON content_types
  FOR EACH ROW EXECUTE FUNCTION update_content_type_search_vector();
```

## 💡 Search Algorithm & Ranking

### **Relevance Scoring**
1. **Full-Text Match Score** - PostgreSQL ts_rank_cd function
2. **Field Weight Priority**:
   - Title: 2x weight (double indexed)
   - Tags/Keywords: 2x weight
   - Content/Description: 1x weight
   - Other fields: 1x weight
3. **Recency Boost** - Newer content ranked higher
4. **Similarity Score** - Trigram similarity untuk fuzzy matches

### **Search Types**

#### **1. Full-Text Search (default)**
```
Query: "artificial intelligence machine learning"
Algorithm: PostgreSQL FTS dengan custom weights
Features: Stemming, stop-words, phrase matching
```

#### **2. Similarity Search** 
```
Query: "artifical inteligence" (typos)
Algorithm: Trigram similarity dengan threshold
Features: Typo tolerance, fuzzy matching
```

#### **3. Fuzzy Search**
```
Query: "AI ML"
Algorithm: Combination FTS + similarity
Features: Abbreviation matching, partial words
```

## 🔗 Integration Examples

### **Frontend React/Next.js**
```typescript
// Search hook
const useSearch = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  
  const search = async (query: string, filters = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      })
      
      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.data.results)
        
        // Track analytics untuk clicked results
        const trackClick = (resultId: string) => {
          fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              search_query: query,
              clicked_result_id: resultId
            })
          })
        }
        
        return { results: data.data.results, trackClick }
      }
    } finally {
      setLoading(false)
    }
  }
  
  return { search, results, loading }
}

// Autocomplete hook
const useAutocomplete = () => {
  const getSuggestions = async (query: string) => {
    if (query.length < 2) return []
    
    const response = await fetch(
      `/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=8&include_content=true`
    )
    const data = await response.json()
    
    return data.success ? data.data.suggestions : []
  }
  
  return { getSuggestions }
}
```

### **Search Component Example**
```tsx
import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

const SearchBox = () => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [results, setResults] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  const { search } = useSearch()
  const { getSuggestions } = useAutocomplete()
  
  // Autocomplete
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      getSuggestions(debouncedQuery).then(setSuggestions)
    }
  }, [debouncedQuery])
  
  // Search
  const handleSearch = async () => {
    if (query.length >= 2) {
      const { results } = await search(query, {
        content_type: 'article,blog',
        limit: 20
      })
      setResults(results)
      setShowSuggestions(false)
    }
  }
  
  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Search content..."
        className="search-input"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => {
                setQuery(suggestion.suggestion)
                handleSearch()
              }}
            >
              <span className="suggestion-text">{suggestion.suggestion}</span>
              <span className="suggestion-type">{suggestion.type}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="search-results">
        {results.map((result) => (
          <div key={result.id} className="result-item">
            <h3 
              dangerouslySetInnerHTML={{ 
                __html: result.highlighted_title 
              }}
            />
            <p 
              dangerouslySetInnerHTML={{ 
                __html: result.highlighted_excerpt 
              }}
            />
            <div className="result-meta">
              <span>{result.content_type_name}</span>
              <span>Relevance: {(result.search_rank * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 📊 Analytics & Monitoring

### **Search Performance Metrics**
```sql
-- Daily search volume
SELECT 
  DATE(created_at) as date,
  COUNT(*) as searches,
  COUNT(DISTINCT query) as unique_queries,
  AVG(response_time_ms) as avg_response_time
FROM search_analytics 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Top performing queries
SELECT 
  query,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results,
  COUNT(clicked_result_id) as clicks,
  (COUNT(clicked_result_id)::float / COUNT(*)::float * 100) as ctr
FROM search_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY query
HAVING COUNT(*) > 5
ORDER BY search_count DESC;

-- Content performance from search
SELECT 
  ce.slug,
  ce.search_data->>'title' as title,
  ct.name as content_type,
  COUNT(sa.clicked_result_id) as clicks_from_search
FROM search_analytics sa
JOIN content_entries ce ON sa.clicked_result_id = ce.id
JOIN content_types ct ON ce.content_type_id = ct.id
WHERE sa.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ce.id, ce.slug, ce.search_data, ct.name
ORDER BY clicks_from_search DESC
LIMIT 20;
```

### **Search Index Health**
```sql
-- Check search vector coverage
SELECT 
  COUNT(*) as total_entries,
  COUNT(search_vector) as indexed_entries,
  (COUNT(search_vector)::float / COUNT(*)::float * 100) as coverage_percent
FROM content_entries;

-- Search vector update lag
SELECT 
  COUNT(*) as entries_need_reindex
FROM content_entries 
WHERE updated_at > search_updated_at 
   OR search_vector IS NULL;

-- Index size monitoring
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE indexname LIKE '%search%' 
   OR indexname LIKE '%trgm%';
```

## 🧹 Maintenance & Optimization

### **Regular Maintenance Tasks**

#### **1. Analytics Cleanup**
```bash
# Monthly cleanup (retain 90 days)
curl -X DELETE "http://localhost:3000/api/search/analytics?retention_days=90"

# Or via SQL
SELECT cleanup_search_analytics(90);
```

#### **2. Search Index Optimization**
```sql
-- Reindex search vectors untuk semua content
UPDATE content_entries SET search_updated_at = NOW();

-- Vacuum dan analyze untuk performance
VACUUM ANALYZE content_entries;
VACUUM ANALYZE search_analytics;
VACUUM ANALYZE search_suggestions;

-- Update table statistics
ANALYZE content_entries (search_vector, search_data);
```

#### **3. Suggestion Cleanup**
```sql
-- Remove low-frequency suggestions (< 2 uses)
DELETE FROM search_suggestions 
WHERE frequency < 2 
  AND created_at < NOW() - INTERVAL '30 days';

-- Reset frequency counters (monthly)
UPDATE search_suggestions 
SET frequency = GREATEST(1, frequency / 2)
WHERE last_used < NOW() - INTERVAL '30 days';
```

### **Performance Tuning**

#### **PostgreSQL Configuration**
```sql
-- Increase shared_preload_libraries
shared_preload_libraries = 'pg_stat_statements,pg_trgm'

-- FTS-specific settings
default_text_search_config = 'indonesian_english'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

-- For better trigram performance
gin_pending_list_limit = 4MB
```

#### **Search Query Optimization**
```sql
-- Explain search query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM search_content_entries('artificial intelligence', NULL, 'published', 20, 0, false);

-- Check index usage
SELECT 
  schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexname LIKE '%search%'
ORDER BY idx_scan DESC;
```

## 🔒 Security & Best Practices

### **Rate Limiting**
- Search API: 100 requests per 15 minutes
- Autocomplete: More permissive rate limiting
- Analytics API: Admin-only access dengan stricter limits

### **Input Validation**
- Query length limits (2-500 characters)
- Parameter sanitization
- SQL injection protection via parameterized queries
- XSS protection dalam highlighted results

### **Privacy**
- IP address hashing dalam analytics
- User agent normalization
- GDPR-compliant data retention policies
- Anonymization untuk long-term storage

### **Access Control**
- Public search untuk published content only
- Admin analytics require proper permissions
- RLS policies untuk data isolation
- API key validation untuk programmatic access

---

## 🎉 Summary

Full-Text Search System memberikan:

✅ **Lightning-Fast Search** - Sub-second response dengan PostgreSQL FTS  
✅ **Smart Relevance** - Advanced ranking dengan multi-factor scoring  
✅ **Fuzzy Matching** - Handle typos dan variations  
✅ **Rich Analytics** - Comprehensive insights untuk optimization  
✅ **Auto-Complete** - Smart suggestions dengan frequency learning  
✅ **Multi-Language** - Indonesian + English support  
✅ **Scalable Architecture** - Proper indexing untuk million+ records  
✅ **Developer Friendly** - RESTful APIs dengan TypeScript support  

Search system ini siap untuk production use dan dapat handle high-traffic applications dengan performance yang excellent! 🚀