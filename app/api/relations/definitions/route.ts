import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { 
  ContentRelationDefinition,
  ContentRelationDefinitionWithCounts, 
  CreateRelationDefinitionRequest,
  UpdateRelationDefinitionRequest,
  GetRelationDefinitionsQuery,
  PaginatedResponse,
  ApiResponse 
} from '@/types/relations';

// GET /api/relations/definitions - List relation definitions
export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<ContentRelationDefinitionWithCounts>>> {
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
    const query: GetRelationDefinitionsQuery = {
      source_content_type_id: searchParams.get('source_content_type_id') ? 
        parseInt(searchParams.get('source_content_type_id')!) : undefined,
      target_content_type_id: searchParams.get('target_content_type_id') ? 
        parseInt(searchParams.get('target_content_type_id')!) : undefined,
      relation_type: (searchParams.get('relation_type') as any) || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true : 
                 searchParams.get('is_active') === 'false' ? false : undefined,
      is_bidirectional: searchParams.get('is_bidirectional') === 'true' ? true : 
                        searchParams.get('is_bidirectional') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Build query
    let queryBuilder = supabase
      .from('content_relations_summary')
      .select('*');

    // Add filters
    if (query.source_content_type_id) {
      // We need to join with content_relation_definitions to filter by content type ID
      queryBuilder = supabase
        .from('content_relation_definitions')
        .select(`
          *,
          source_content_type:content_types!source_content_type_id(id, name, display_name),
          target_content_type:content_types!target_content_type_id(id, name, display_name)
        `)
        .eq('source_content_type_id', query.source_content_type_id);
    }

    if (query.target_content_type_id) {
      queryBuilder = queryBuilder.eq('target_content_type_id', query.target_content_type_id);
    }

    if (query.relation_type) {
      queryBuilder = queryBuilder.eq('relation_type', query.relation_type);
    }

    if (query.is_active !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.is_active);
    }

    if (query.is_bidirectional !== undefined) {
      queryBuilder = queryBuilder.eq('is_bidirectional', query.is_bidirectional);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.search}%,display_name.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    // Add ordering and pagination
    queryBuilder = queryBuilder
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(query.offset!, query.offset! + query.limit! - 1);

    const { data: definitions, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching relation definitions:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch relation definitions',
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

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / query.limit!);
    const currentPage = Math.floor(query.offset! / query.limit!) + 1;

    return NextResponse.json({
      success: true,
      data: definitions || [],
      pagination: {
        page: currentPage,
        limit: query.limit!,
        total: totalCount,
        total_pages: totalPages,
        has_more: currentPage < totalPages
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/relations/definitions:', error);
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

// POST /api/relations/definitions - Create new relation definition
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ContentRelationDefinition>>> {
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

    // Check if user has permission to create relation definitions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to create relation definitions'
      }, { status: 403 });
    }

    const body: CreateRelationDefinitionRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.display_name || !body.source_content_type_id || 
        !body.source_field_name || !body.target_content_type_id || !body.relation_type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate content types exist
    const { data: contentTypes, error: contentTypeError } = await supabase
      .from('content_types')
      .select('id')
      .in('id', [body.source_content_type_id, body.target_content_type_id]);

    if (contentTypeError || !contentTypes || contentTypes.length !== 2) {
      return NextResponse.json({
        success: false,
        error: 'One or both content types do not exist'
      }, { status: 400 });
    }

    // Create relation definition
    const { data: definition, error: createError } = await supabase
      .from('content_relation_definitions')
      .insert({
        name: body.name,
        display_name: body.display_name,
        description: body.description,
        source_content_type_id: body.source_content_type_id,
        source_field_name: body.source_field_name,
        target_content_type_id: body.target_content_type_id,
        target_field_name: body.target_field_name,
        relation_type: body.relation_type,
        is_bidirectional: body.is_bidirectional || false,
        is_required: body.is_required || false,
        on_source_delete: body.on_source_delete || 'cascade',
        on_target_delete: body.on_target_delete || 'set_null',
        max_relations: body.max_relations,
        min_relations: body.min_relations || 0,
        metadata: body.metadata || {},
        sort_order: body.sort_order || 0,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating relation definition:', createError);
      
      // Handle specific errors
      if (createError.code === '23505') {
        return NextResponse.json({
          success: false,
          error: 'Relation definition name already exists'
        }, { status: 409 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create relation definition'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: definition,
      message: 'Relation definition created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/relations/definitions:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}