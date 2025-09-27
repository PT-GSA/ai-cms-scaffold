import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { 
  ContentRelation,
  ContentRelationWithDefinition,
  CreateRelationRequest,
  BulkCreateRelationsRequest,
  BulkCreateRelationsResponse,
  GetRelationsQuery,
  PaginatedResponse,
  ApiResponse 
} from '@/types/relations';

// GET /api/relations - List content relations
export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<ContentRelationWithDefinition>>> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
          has_more: false
        }
      }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query: GetRelationsQuery = {
      source_entry_id: searchParams.get('source_entry_id') ? 
        parseInt(searchParams.get('source_entry_id')!) : undefined,
      target_entry_id: searchParams.get('target_entry_id') ? 
        parseInt(searchParams.get('target_entry_id')!) : undefined,
      relation_definition_id: searchParams.get('relation_definition_id') || undefined,
      relation_name: searchParams.get('relation_name') || undefined,
      include_metadata: searchParams.get('include_metadata') === 'true',
      include_entries: searchParams.get('include_entries') === 'true',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    };

    // Build base query
    let selectClause = `
      *,
      definition:content_relation_definitions(*)
    `;

    if (query.include_entries) {
      selectClause = `
        *,
        definition:content_relation_definitions(*),
        source_entry:content_entries!source_entry_id(id, slug, data, status, published_at),
        target_entry:content_entries!target_entry_id(id, slug, data, status, published_at)
      `;
    }

    let queryBuilder = supabase
      .from('content_relations')
      .select(selectClause, { count: 'exact' });

    // Add filters
    if (query.source_entry_id) {
      queryBuilder = queryBuilder.eq('source_entry_id', query.source_entry_id);
    }

    if (query.target_entry_id) {
      queryBuilder = queryBuilder.eq('target_entry_id', query.target_entry_id);
    }

    if (query.relation_definition_id) {
      queryBuilder = queryBuilder.eq('relation_definition_id', query.relation_definition_id);
    }

    if (query.relation_name) {
      queryBuilder = queryBuilder.eq('definition.name', query.relation_name);
    }

    // Add ordering
    const sortColumn = query.sort_by === 'relation_name' ? 'definition.name' : query.sort_by;
    queryBuilder = queryBuilder.order(sortColumn!, { ascending: query.sort_order === 'asc' });

    // Add pagination
    queryBuilder = queryBuilder.range(query.offset!, query.offset! + query.limit! - 1);

    const { data: relations, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching content relations:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch content relations',
        data: [],
        pagination: {
          page: Math.floor(query.offset! / query.limit!) + 1,
          limit: query.limit!,
          total: 0,
          total_pages: 0,
          has_more: false
        }
      }, { status: 500 });
    }

    // Process the data to add computed fields
    const processedRelations = (relations || []).map((relation: any) => {
      const processed: any = { ...relation };

      if (query.include_entries) {
        // Add computed title fields
        if (processed.source_entry) {
          processed.source_entry.title = processed.source_entry.data?.title || processed.source_entry.slug;
        }
        if (processed.target_entry) {
          processed.target_entry.title = processed.target_entry.data?.title || processed.target_entry.slug;
        }
      }

      return processed;
    });

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / query.limit!);
    const currentPage = Math.floor(query.offset! / query.limit!) + 1;

    return NextResponse.json({
      success: true,
      data: processedRelations,
      pagination: {
        page: currentPage,
        limit: query.limit!,
        total: totalCount,
        total_pages: totalPages,
        has_more: currentPage < totalPages
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/relations:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
        has_more: false
      }
    }, { status: 500 });
  }
}

// POST /api/relations - Create new relation or bulk create relations
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ContentRelation | BulkCreateRelationsResponse>>> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();

    // Check if this is a bulk operation
    if (body.relations && Array.isArray(body.relations)) {
      return await handleBulkCreateRelations(supabase, user, body as BulkCreateRelationsRequest);
    } else {
      return await handleCreateSingleRelation(supabase, user, body as CreateRelationRequest);
    }

  } catch (error) {
    console.error('Unexpected error in POST /api/relations:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function untuk create single relation
async function handleCreateSingleRelation(
  supabase: any, 
  user: any, 
  body: CreateRelationRequest
): Promise<NextResponse<ApiResponse<ContentRelation>>> {
  // Validate required fields
  if (!body.relation_definition_id || !body.source_entry_id || !body.target_entry_id) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields: relation_definition_id, source_entry_id, target_entry_id'
    }, { status: 400 });
  }

  // Validate relation definition exists
  const { data: definition, error: definitionError } = await supabase
    .from('content_relation_definitions')
    .select('*')
    .eq('id', body.relation_definition_id)
    .eq('is_active', true)
    .single();

  if (definitionError || !definition) {
    return NextResponse.json({
      success: false,
      error: 'Relation definition not found or inactive'
    }, { status: 400 });
  }

  // Validate content entries exist and match expected content types
  const { data: entries, error: entriesError } = await supabase
    .from('content_entries')
    .select('id, content_type_id, created_by')
    .in('id', [body.source_entry_id, body.target_entry_id]);

  if (entriesError || !entries || entries.length !== 2) {
    return NextResponse.json({
      success: false,
      error: 'One or both content entries not found'
    }, { status: 400 });
  }

  const sourceEntry = entries.find((e: any) => e.id === body.source_entry_id);
  const targetEntry = entries.find((e: any) => e.id === body.target_entry_id);

  if (!sourceEntry || !targetEntry) {
    return NextResponse.json({
      success: false,
      error: 'Invalid source or target entry'
    }, { status: 400 });
  }

  // Validate content types match definition
  if (sourceEntry.content_type_id !== definition.source_content_type_id ||
      targetEntry.content_type_id !== definition.target_content_type_id) {
    return NextResponse.json({
      success: false,
      error: 'Content entries do not match the expected content types for this relation'
    }, { status: 400 });
  }

  // Check permissions - user must own the source entry or be admin/editor
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const canCreate = sourceEntry.created_by === user.id || 
                   (profile && ['super_admin', 'admin', 'editor'].includes(profile.role));

  if (!canCreate) {
    return NextResponse.json({
      success: false,
      error: 'Insufficient permissions to create relation for this content entry'
    }, { status: 403 });
  }

  // Create the relation
  const { data: relation, error: createError } = await supabase
    .from('content_relations')
    .insert({
      relation_definition_id: body.relation_definition_id,
      source_entry_id: body.source_entry_id,
      target_entry_id: body.target_entry_id,
      relation_data: body.relation_data || {},
      sort_order: body.sort_order || 0,
      created_by: user.id
    })
    .select(`
      *,
      definition:content_relation_definitions(*),
      source_entry:content_entries!source_entry_id(id, slug, data, status, published_at),
      target_entry:content_entries!target_entry_id(id, slug, data, status, published_at)
    `)
    .single();

  if (createError) {
    console.error('Error creating content relation:', createError);
    
    // Handle specific errors
    if (createError.code === '23505') {
      return NextResponse.json({
        success: false,
        error: 'This relation already exists'
      }, { status: 409 });
    }

    if (createError.message?.includes('Maximum relations limit')) {
      return NextResponse.json({
        success: false,
        error: createError.message
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create content relation'
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: relation,
    message: 'Content relation created successfully'
  }, { status: 201 });
}

// Helper function untuk bulk create relations
async function handleBulkCreateRelations(
  supabase: any, 
  user: any, 
  body: BulkCreateRelationsRequest
): Promise<NextResponse<ApiResponse<BulkCreateRelationsResponse>>> {
  if (!body.relation_definition_id || !body.relations || !Array.isArray(body.relations)) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields for bulk operation'
    }, { status: 400 });
  }

  // Use the database function for bulk creation
  const { data, error } = await supabase.rpc('create_bulk_relations', {
    p_relation_definition_id: body.relation_definition_id,
    p_relations: body.relations
  });

  if (error) {
    console.error('Error bulk creating relations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to bulk create relations'
    }, { status: 500 });
  }

  const created_count = data || 0;
  const total_requested = body.relations.length;

  return NextResponse.json({
    success: true,
    data: {
      success: true,
      created_count,
      total_requested,
      errors: created_count < total_requested ? 
        [{ relation: { source_entry_id: 0, target_entry_id: 0 }, error: 'Some relations were skipped due to duplicates or constraints' }] : 
        undefined
    },
    message: `Successfully created ${created_count} out of ${total_requested} relations`
  }, { status: 201 });
}