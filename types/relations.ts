export type RelationType = 'one_to_one' | 'one_to_many' | 'many_to_many';

export type CascadeBehavior = 'cascade' | 'set_null' | 'restrict' | 'no_action';

export interface ContentRelationDefinition {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  
  // Source content type (the "owner" of the relation)
  source_content_type_id: number;
  source_field_name: string;
  
  // Target content type (the "related" content)
  target_content_type_id: number;
  target_field_name?: string;
  
  // Relation configuration
  relation_type: RelationType;
  is_bidirectional: boolean;
  is_required: boolean;
  
  // Cascade behavior
  on_source_delete: CascadeBehavior;
  on_target_delete: CascadeBehavior;
  
  // Constraints
  max_relations?: number;
  min_relations: number;
  
  // Metadata
  metadata: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  
  // Audit
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentRelation {
  id: string;
  
  // Relation definition
  relation_definition_id: string;
  
  // Source and target content entries
  source_entry_id: number;
  target_entry_id: number;
  
  // Relation metadata
  relation_data: Record<string, any>;
  sort_order: number;
  
  // Audit
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Extended types dengan populated data
export interface ContentRelationWithDefinition extends ContentRelation {
  definition: ContentRelationDefinition;
  source_entry?: {
    id: number;
    slug: string;
    title: string;
    content_type: string;
    status: string;
    published_at?: string;
  };
  target_entry?: {
    id: number;
    slug: string;
    title: string;
    content_type: string;
    status: string;
    published_at?: string;
  };
}

export interface ContentRelationDefinitionWithCounts extends ContentRelationDefinition {
  source_content_type?: {
    id: number;
    name: string;
    display_name: string;
  };
  target_content_type?: {
    id: number;
    name: string;
    display_name: string;
  };
  total_relations: number;
  unique_sources: number;
  unique_targets: number;
}

// API Request/Response types
export interface CreateRelationDefinitionRequest {
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

export interface UpdateRelationDefinitionRequest extends Partial<CreateRelationDefinitionRequest> {
  is_active?: boolean;
}

export interface CreateRelationRequest {
  relation_definition_id: string;
  source_entry_id: number;
  target_entry_id: number;
  relation_data?: Record<string, any>;
  sort_order?: number;
}

export interface UpdateRelationRequest {
  relation_data?: Record<string, any>;
  sort_order?: number;
}

export interface BulkCreateRelationsRequest {
  relation_definition_id: string;
  relations: Array<{
    source_entry_id: number;
    target_entry_id: number;
    relation_data?: Record<string, any>;
    sort_order?: number;
  }>;
}

export interface BulkCreateRelationsResponse {
  success: boolean;
  created_count: number;
  total_requested: number;
  errors?: Array<{
    relation: {
      source_entry_id: number;
      target_entry_id: number;
    };
    error: string;
  }>;
}

// Query types untuk fetching relations
export interface GetRelationsQuery {
  source_entry_id?: number;
  target_entry_id?: number;
  relation_definition_id?: string;
  relation_name?: string;
  include_metadata?: boolean;
  include_entries?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'sort_order' | 'relation_name';
  sort_order?: 'asc' | 'desc';
}

export interface GetRelationDefinitionsQuery {
  source_content_type_id?: number;
  target_content_type_id?: number;
  relation_type?: RelationType;
  is_active?: boolean;
  is_bidirectional?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// Content Entry dengan relations
export interface ContentEntryWithRelations {
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
}

// Relations Summary dari view
export interface RelationsSummary {
  relation_name: string;
  display_name: string;
  relation_type: RelationType;
  is_bidirectional: boolean;
  source_content_type: string;
  target_content_type: string;
  total_relations: number;
  unique_sources: number;
  unique_targets: number;
  definition_created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

// Validation schemas (untuk runtime validation jika diperlukan)
export interface RelationDefinitionValidation {
  errors: Record<string, string[]>;
  is_valid: boolean;
}

// Hooks types (untuk React hooks nanti)
export interface UseRelationsOptions extends GetRelationsQuery {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseRelationDefinitionsOptions extends GetRelationDefinitionsQuery {
  enabled?: boolean;
}

// Utils types
export interface RelationFieldConfig {
  definition: ContentRelationDefinition;
  current_relations: ContentRelation[];
  available_targets: Array<{
    id: number;
    slug: string;
    title: string;
    content_type: string;
  }>;
  max_selections?: number;
  min_selections?: number;
  allow_create?: boolean;
  search_enabled?: boolean;
}