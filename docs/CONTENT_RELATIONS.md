# Content Relations System

Sistem manajemen relasi content yang mendukung One-to-One, One-to-Many, dan Many-to-Many relationships untuk AI CMS Scaffold.

## Overview

Content Relations System memungkinkan pembuatan hubungan antara different content types dengan constraint validation, cascade behaviors, dan advanced querying capabilities.

## Database Schema

### Tables

#### `content_relation_definitions`
Tabel untuk mendefinisikan jenis relasi antar content types:

```sql
- id: UUID (Primary Key)
- name: VARCHAR(100) UNIQUE - nama relasi (e.g., "article_tags")
- display_name: VARCHAR(200) - nama display (e.g., "Article Tags") 
- description: TEXT - deskripsi relasi
- source_content_type_id: INTEGER - content type source
- source_field_name: VARCHAR(100) - nama field di source
- target_content_type_id: INTEGER - content type target
- target_field_name: VARCHAR(100) - nama field di target (untuk bi-directional)
- relation_type: relation_type ENUM - jenis relasi
- is_bidirectional: BOOLEAN - apakah relasi dua arah
- is_required: BOOLEAN - apakah relasi wajib
- on_source_delete: cascade_behavior - behavior ketika source dihapus
- on_target_delete: cascade_behavior - behavior ketika target dihapus
- max_relations: INTEGER - maksimal relasi per source
- min_relations: INTEGER - minimal relasi per source
- metadata: JSONB - konfigurasi tambahan
- sort_order: INTEGER - urutan di UI
- is_active: BOOLEAN - status aktif
```

#### `content_relations`
Tabel untuk menyimpan data relasi aktual:

```sql
- id: UUID (Primary Key)
- relation_definition_id: UUID - referensi ke definition
- source_entry_id: BIGINT - ID content entry source
- target_entry_id: BIGINT - ID content entry target  
- relation_data: JSONB - metadata relasi spesifik
- sort_order: INTEGER - urutan dalam relasi
```

### Enums

#### `relation_type`
```sql
'one_to_one' | 'one_to_many' | 'many_to_many'
```

#### `cascade_behavior`
```sql
'cascade' | 'set_null' | 'restrict' | 'no_action'
```

### Functions

#### `get_content_relations(p_source_entry_id, p_relation_name?, p_include_metadata?, p_max_depth?)`
Mengambil semua relasi dari content entry dengan option deep fetching.

#### `create_bulk_relations(p_relation_definition_id, p_relations)`
Membuat multiple relasi sekaligus dengan validation.

### Views

#### `content_relations_summary`
View untuk statistik relasi per definition.

## API Endpoints

### Relation Definitions

#### `GET /api/relations/definitions`
List relation definitions dengan filtering dan pagination.

**Query Parameters:**
- `source_content_type_id?: number`
- `target_content_type_id?: number` 
- `relation_type?: RelationType`
- `is_active?: boolean`
- `is_bidirectional?: boolean`
- `search?: string`
- `limit?: number` (default: 20)
- `offset?: number` (default: 0)

**Response:**
```typescript
{
  success: boolean;
  data: ContentRelationDefinitionWithCounts[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}
```

#### `POST /api/relations/definitions`
Create new relation definition.

**Request Body:**
```typescript
{
  name: string;
  display_name: string;
  description?: string;
  source_content_type_id: number;
  source_field_name: string;
  target_content_type_id: number;
  target_field_name?: string;
  relation_type: RelationType;
  is_bidirectional?: boolean;
  is_required?: boolean;
  on_source_delete?: CascadeBehavior;
  on_target_delete?: CascadeBehavior;
  max_relations?: number;
  min_relations?: number;
  metadata?: Record<string, any>;
  sort_order?: number;
}
```

#### `GET /api/relations/definitions/[id]`
Get single relation definition.

#### `PUT /api/relations/definitions/[id]`
Update relation definition.

#### `DELETE /api/relations/definitions/[id]`
Delete relation definition (hanya jika tidak ada relasi aktual).

### Content Relations

#### `GET /api/relations`
List content relations dengan filtering dan pagination.

**Query Parameters:**
- `source_entry_id?: number`
- `target_entry_id?: number`
- `relation_definition_id?: string`
- `relation_name?: string`
- `include_metadata?: boolean`
- `include_entries?: boolean`
- `limit?: number`
- `offset?: number`
- `sort_by?: 'created_at' | 'sort_order' | 'relation_name'`
- `sort_order?: 'asc' | 'desc'`

#### `POST /api/relations`
Create new relation atau bulk create relations.

**Single Relation:**
```typescript
{
  relation_definition_id: string;
  source_entry_id: number;
  target_entry_id: number;
  relation_data?: Record<string, any>;
  sort_order?: number;
}
```

**Bulk Relations:**
```typescript
{
  relation_definition_id: string;
  relations: Array<{
    source_entry_id: number;
    target_entry_id: number;
    relation_data?: Record<string, any>;
    sort_order?: number;
  }>;
}
```

#### `GET /api/relations/[id]`
Get single content relation.

#### `PUT /api/relations/[id]`
Update content relation.

#### `DELETE /api/relations/[id]`
Delete content relation.

### Content Entries dengan Relations

#### `GET /api/content-entries/[id]/relations`
Get content entry dengan semua relations.

**Query Parameters:**
- `relation_name?: string` - filter specific relation
- `include_metadata?: boolean` - include relation metadata
- `max_depth?: number` (default: 1) - depth level untuk nested relations

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    slug: string;
    title: string;
    content_type: string;
    status: string;
    published_at?: string;
    data: Record<string, any>;
    relations: Record<string, {
      type: RelationType;
      definition_id: string;
      display_name: string;
      is_bidirectional: boolean;
      is_reverse?: boolean;
      items: Array<{
        id: number;
        slug: string;
        title: string;
        content_type: string;
        status: string;
        published_at?: string;
        data?: Record<string, any>;
        relation_data?: Record<string, any>;
        sort_order: number;
      }>;
      count: number;
    }>;
  };
}
```

#### `PUT /api/content-entries/[id]/relations`
Update relations for content entry.

**Request Body:**
```typescript
{
  relations: {
    [relation_name: string]: Array<{
      target_entry_id: number;
      relation_data?: Record<string, any>;
      sort_order?: number;
    }>;
  };
  replace?: boolean; // true = replace all, false = append
}
```

## Validation & Constraints

### Automatic Validation
1. **Content Type Matching**: Source/target entries harus match expected content types
2. **Max Relations**: Enforce maksimal relasi per source entry  
3. **Min Relations**: Prevent deletion jika akan melanggar minimum
4. **One-to-One**: Ensure uniqueness di kedua sisi
5. **One-to-Many**: Ensure target hanya belong ke satu source
6. **Self Reference**: Prevent entry relates to itself

### Cascade Behaviors
- **cascade**: Delete related records when parent deleted
- **set_null**: Set foreign key to null (tidak applicable untuk relasi ini)
- **restrict**: Prevent deletion if relations exist
- **no_action**: Do nothing (default database behavior)

## Performance

### Indexes
- GIN indexes untuk fast lookups
- Composite indexes untuk filtered queries
- Foreign key indexes untuk joins

### Query Optimization
- Database functions untuk complex queries
- Bulk operations untuk better performance  
- Selective field fetching

## Security (RLS)

### Relation Definitions
- **View**: Authenticated users can view active definitions
- **Manage**: Admin/Editor roles dapat CRUD definitions

### Content Relations  
- **View**: Users dapat view relations untuk published content atau content mereka
- **Manage**: Users dapat manage relations untuk content yang mereka own

## Usage Examples

### 1. Setup Article-Tags Relation
```typescript
// Create many-to-many relation definition
POST /api/relations/definitions
{
  "name": "article_tags",
  "display_name": "Article Tags",
  "description": "Tags associated with articles",
  "source_content_type_id": 1, // article content type
  "source_field_name": "tags",
  "target_content_type_id": 2, // tag content type  
  "target_field_name": "tagged_articles",
  "relation_type": "many_to_many",
  "is_bidirectional": true
}
```

### 2. Add Tags to Article
```typescript
// Create relations
POST /api/relations
{
  "relation_definition_id": "uuid-of-article-tags-relation",
  "source_entry_id": 123, // article id
  "target_entry_id": 456   // tag id
}
```

### 3. Get Article dengan Tags
```typescript
GET /api/content-entries/123/relations

// Response:
{
  "success": true,
  "data": {
    "id": 123,
    "title": "My Article",
    "relations": {
      "tags": {
        "type": "many_to_many",
        "items": [
          {
            "id": 456,
            "title": "JavaScript",
            "content_type": "tag"
          }
        ],
        "count": 1
      }
    }
  }
}
```

### 4. Bulk Update Article Relations
```typescript
PUT /api/content-entries/123/relations
{
  "relations": {
    "tags": [
      { "target_entry_id": 456 },
      { "target_entry_id": 789 }
    ]
  },
  "replace": true
}
```

## Best Practices

1. **Naming Conventions**: Gunakan descriptive names untuk relations
2. **Bidirectional Relations**: Set target_field_name untuk navigation
3. **Constraints**: Set appropriate min/max limits
4. **Cascade Behavior**: Choose carefully based on business logic
5. **Performance**: Use bulk operations untuk multiple changes
6. **Validation**: Validate content types sebelum create relations

## Monitoring & Analytics

Gunakan `content_relations_summary` view untuk monitoring:
- Total relations per definition
- Unique sources/targets
- Popular relation types
- Usage patterns

## Error Handling

Common errors dan solutions:
- **Constraint violations**: Check min/max limits
- **Type mismatches**: Verify content types  
- **Permission denied**: Check user ownership
- **Circular dependencies**: Avoid self-references
- **Cascade conflicts**: Review cascade behaviors