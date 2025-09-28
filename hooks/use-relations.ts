import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ContentRelationDefinition,
  ContentRelationDefinitionWithCounts,
  ContentRelation,
  ContentRelationWithDefinition,
  ContentEntryWithRelations,
  CreateRelationRequest,
  BulkCreateRelationsRequest,
  GetRelationDefinitionsQuery,
  GetRelationsQuery,
  ApiResponse,
  PaginatedResponse
} from '@/types/relations';

/**
 * Hook untuk fetch relation definitions dengan pagination dan filtering
 * @param query - Query parameters untuk filtering dan pagination
 * @returns Object dengan definitions, loading state, error, dan CRUD functions
 */
export function useRelationDefinitions(query: GetRelationDefinitionsQuery = {}) {
  const [definitions, setDefinitions] = useState<ContentRelationDefinitionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize query parameters untuk mencegah infinite loop
  const memoizedQuery = useMemo(() => ({
    source_content_type_id: query.source_content_type_id,
    target_content_type_id: query.target_content_type_id,
    relation_type: query.relation_type,
    is_active: query.is_active,
    is_bidirectional: query.is_bidirectional,
    search: query.search,
    limit: query.limit,
    offset: query.offset
  }), [
    query.source_content_type_id,
    query.target_content_type_id,
    query.relation_type,
    query.is_active,
    query.is_bidirectional,
    query.search,
    query.limit,
    query.offset
  ]);

  const fetchDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (memoizedQuery.source_content_type_id) params.append('source_content_type_id', memoizedQuery.source_content_type_id.toString());
      if (memoizedQuery.target_content_type_id) params.append('target_content_type_id', memoizedQuery.target_content_type_id.toString());
      if (memoizedQuery.relation_type) params.append('relation_type', memoizedQuery.relation_type);
      if (memoizedQuery.is_active !== undefined) params.append('is_active', memoizedQuery.is_active.toString());
      if (memoizedQuery.is_bidirectional !== undefined) params.append('is_bidirectional', memoizedQuery.is_bidirectional.toString());
      if (memoizedQuery.search) params.append('search', memoizedQuery.search);
      if (memoizedQuery.limit) params.append('limit', memoizedQuery.limit.toString());
      if (memoizedQuery.offset) params.append('offset', memoizedQuery.offset.toString());

      const response = await fetch(`/api/relations/definitions?${params}`);
      const result: PaginatedResponse<ContentRelationDefinitionWithCounts> = await response.json();

      if (result.success) {
        setDefinitions(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch relation definitions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [memoizedQuery]);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  const createDefinition = useCallback(async (data: Omit<ContentRelationDefinition, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/relations/definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result: ApiResponse<ContentRelationDefinition> = await response.json();

      if (result.success) {
        await fetchDefinitions(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create relation definition');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchDefinitions]);

  const updateDefinition = useCallback(async (id: string, data: Partial<ContentRelationDefinition>) => {
    try {
      const response = await fetch(`/api/relations/definitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result: ApiResponse<ContentRelationDefinition> = await response.json();

      if (result.success) {
        await fetchDefinitions(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update relation definition');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchDefinitions]);

  const deleteDefinition = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/relations/definitions/${id}`, {
        method: 'DELETE'
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        await fetchDefinitions(); // Refresh list
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete relation definition');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchDefinitions]);

  return {
    definitions,
    loading,
    error,
    refetch: fetchDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinition
  };
}

// Hook untuk fetch content relations
/**
 * Hook untuk fetch content relations dengan pagination dan filtering
 * @param query - Query parameters untuk filtering dan pagination
 * @returns Object dengan relations, loading state, error, pagination, dan CRUD functions
 */
export function useContentRelations(query: GetRelationsQuery = {}) {
  const [relations, setRelations] = useState<ContentRelationWithDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_more: false
  });

  // Memoize query parameters untuk mencegah infinite loop
  const memoizedQuery = useMemo(() => ({
    source_entry_id: query.source_entry_id,
    target_entry_id: query.target_entry_id,
    relation_definition_id: query.relation_definition_id,
    relation_name: query.relation_name,
    include_metadata: query.include_metadata,
    include_entries: query.include_entries,
    limit: query.limit,
    offset: query.offset,
    sort_by: query.sort_by,
    sort_order: query.sort_order
  }), [
    query.source_entry_id,
    query.target_entry_id,
    query.relation_definition_id,
    query.relation_name,
    query.include_metadata,
    query.include_entries,
    query.limit,
    query.offset,
    query.sort_by,
    query.sort_order
  ]);

  const fetchRelations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (memoizedQuery.source_entry_id) params.append('source_entry_id', memoizedQuery.source_entry_id.toString());
      if (memoizedQuery.target_entry_id) params.append('target_entry_id', memoizedQuery.target_entry_id.toString());
      if (memoizedQuery.relation_definition_id) params.append('relation_definition_id', memoizedQuery.relation_definition_id);
      if (memoizedQuery.relation_name) params.append('relation_name', memoizedQuery.relation_name);
      if (memoizedQuery.include_metadata) params.append('include_metadata', 'true');
      if (memoizedQuery.include_entries) params.append('include_entries', 'true');
      if (memoizedQuery.limit) params.append('limit', memoizedQuery.limit.toString());
      if (memoizedQuery.offset) params.append('offset', memoizedQuery.offset.toString());
      if (memoizedQuery.sort_by) params.append('sort_by', memoizedQuery.sort_by);
      if (memoizedQuery.sort_order) params.append('sort_order', memoizedQuery.sort_order);

      const response = await fetch(`/api/relations?${params}`);
      const result: PaginatedResponse<ContentRelationWithDefinition> = await response.json();

      if (result.success) {
        setRelations(result.data || []);
        setPagination(result.pagination);
      } else {
        setError(result.error || 'Failed to fetch content relations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [memoizedQuery]);

  useEffect(() => {
    fetchRelations();
  }, [fetchRelations]);

  const createRelation = useCallback(async (data: CreateRelationRequest) => {
    try {
      const response = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result: ApiResponse<ContentRelation> = await response.json();

      if (result.success) {
        await fetchRelations(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create relation');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchRelations]);

  const createBulkRelations = useCallback(async (data: BulkCreateRelationsRequest) => {
    try {
      const response = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        await fetchRelations(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create bulk relations');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchRelations]);

  const updateRelation = useCallback(async (id: string, data: { relation_data?: any; sort_order?: number }) => {
    try {
      const response = await fetch(`/api/relations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result: ApiResponse<ContentRelationWithDefinition> = await response.json();

      if (result.success) {
        await fetchRelations(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update relation');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchRelations]);

  const deleteRelation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/relations/${id}`, {
        method: 'DELETE'
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        await fetchRelations(); // Refresh list
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete relation');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchRelations]);

  return {
    relations,
    pagination,
    loading,
    error,
    refetch: fetchRelations,
    createRelation,
    createBulkRelations,
    updateRelation,
    deleteRelation
  };
}

// Hook untuk fetch content entry dengan relations
/**
 * Hook untuk fetch content entry dengan relations
 * @param entryId - ID dari content entry
 * @param options - Options untuk filtering dan configuration
 * @returns Object dengan entry data, loading state, error, dan update function
 */
export function useContentEntryWithRelations(entryId?: number, options: {
  relationName?: string;
  includeMetadata?: boolean;
  maxDepth?: number;
} = {}) {
  const [entry, setEntry] = useState<ContentEntryWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize options untuk mencegah infinite loop
  const memoizedOptions = useMemo(() => ({
    relationName: options.relationName,
    includeMetadata: options.includeMetadata,
    maxDepth: options.maxDepth
  }), [options.relationName, options.includeMetadata, options.maxDepth]);

  const fetchEntry = useCallback(async () => {
    if (!entryId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (memoizedOptions.relationName) params.append('relation_name', memoizedOptions.relationName);
      if (memoizedOptions.includeMetadata) params.append('include_metadata', 'true');
      if (memoizedOptions.maxDepth) params.append('max_depth', memoizedOptions.maxDepth.toString());

      const response = await fetch(`/api/content-entries/${entryId}/relations?${params}`);
      const result: ApiResponse<ContentEntryWithRelations> = await response.json();

      if (result.success) {
        setEntry(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch content entry with relations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [entryId, memoizedOptions]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const updateRelations = useCallback(async (relations: Record<string, Array<{ target_entry_id: number; relation_data?: any; sort_order?: number }>>, replace = false) => {
    if (!entryId) throw new Error('Entry ID is required');

    try {
      const response = await fetch(`/api/content-entries/${entryId}/relations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relations, replace })
      });

      const result = await response.json();

      if (result.success) {
        await fetchEntry(); // Refresh entry
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update relations');
      }
    } catch (err) {
      throw err;
    }
  }, [entryId, fetchEntry]);

  return {
    entry,
    loading,
    error,
    refetch: fetchEntry,
    updateRelations
  };
}

// Hook untuk relation field management (untuk form components)
export function useRelationField(
  entryId: number,
  relationName: string,
  maxSelections?: number
) {
  const [selectedItems, setSelectedItems] = useState<Array<{ id: number; title: string; content_type: string }>>([]);
  const [loading, setLoading] = useState(false);

  const { entry } = useContentEntryWithRelations(entryId, { relationName });

  // Initialize selected items from entry relations
  useEffect(() => {
    if (entry?.relations[relationName]) {
      const items = entry.relations[relationName].items.map(item => ({
        id: item.id,
        title: item.title,
        content_type: item.content_type
      }));
      setSelectedItems(items);
    }
  }, [entry, relationName]);

  const addItem = useCallback((item: { id: number; title: string; content_type: string }) => {
    setSelectedItems(prev => {
      // Check if already exists
      if (prev.some(existing => existing.id === item.id)) {
        return prev;
      }

      // Check max selections
      if (maxSelections && prev.length >= maxSelections) {
        return prev;
      }

      return [...prev, item];
    });
  }, [maxSelections]);

  const removeItem = useCallback((itemId: number) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const reorderItems = useCallback((startIndex: number, endIndex: number) => {
    setSelectedItems(prev => {
      const items = [...prev];
      const [removed] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, removed);
      return items;
    });
  }, []);

  const canAddMore = useMemo(() => {
    return !maxSelections || selectedItems.length < maxSelections;
  }, [maxSelections, selectedItems.length]);

  const hasChanges = useMemo(() => {
    if (!entry?.relations[relationName]) return selectedItems.length > 0;
    
    const originalItems = entry.relations[relationName].items;
    if (originalItems.length !== selectedItems.length) return true;
    
    return selectedItems.some((item, index) => 
      item.id !== originalItems[index]?.id
    );
  }, [entry, relationName, selectedItems]);

  return {
    selectedItems,
    loading,
    canAddMore,
    hasChanges,
    maxSelections,
    addItem,
    removeItem,
    reorderItems,
    setSelectedItems
  };
}