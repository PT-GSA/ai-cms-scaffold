import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { 
  ContentRelationDefinition,
  UpdateRelationDefinitionRequest,
  ApiResponse 
} from '@/types/relations';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/relations/definitions/[id] - Get single relation definition
export async function GET(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ContentRelationDefinition>>> {
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

    const { data: definition, error } = await supabase
      .from('content_relation_definitions')
      .select(`
        *,
        source_content_type:content_types!source_content_type_id(id, name, display_name),
        target_content_type:content_types!target_content_type_id(id, name, display_name)
      `)
      .eq('id', (await params).id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Relation definition not found'
        }, { status: 404 });
      }

      console.error('Error fetching relation definition:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch relation definition'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: definition
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/relations/definitions/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/relations/definitions/[id] - Update relation definition
export async function PUT(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ContentRelationDefinition>>> {
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

    // Check if user has permission to update relation definitions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to update relation definitions'
      }, { status: 403 });
    }

    // Check if definition exists
    const { data: existingDefinition, error: fetchError } = await supabase
      .from('content_relation_definitions')
      .select('id, created_by')
      .eq('id', (await params).id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Relation definition not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch relation definition'
      }, { status: 500 });
    }

    const body: UpdateRelationDefinitionRequest = await request.json();

    // Validate content types if they are being updated
    if (body.source_content_type_id || body.target_content_type_id) {
      const contentTypeIds = [];
      if (body.source_content_type_id) contentTypeIds.push(body.source_content_type_id);
      if (body.target_content_type_id) contentTypeIds.push(body.target_content_type_id);

      const { data: contentTypes, error: contentTypeError } = await supabase
        .from('content_types')
        .select('id')
        .in('id', contentTypeIds);

      if (contentTypeError || !contentTypes || contentTypes.length !== contentTypeIds.length) {
        return NextResponse.json({
          success: false,
          error: 'One or more content types do not exist'
        }, { status: 400 });
      }
    }

    // Build update object
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    // Only include fields that are provided
    if (body.display_name !== undefined) updateData.display_name = body.display_name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.source_content_type_id !== undefined) updateData.source_content_type_id = body.source_content_type_id;
    if (body.source_field_name !== undefined) updateData.source_field_name = body.source_field_name;
    if (body.target_content_type_id !== undefined) updateData.target_content_type_id = body.target_content_type_id;
    if (body.target_field_name !== undefined) updateData.target_field_name = body.target_field_name;
    if (body.relation_type !== undefined) updateData.relation_type = body.relation_type;
    if (body.is_bidirectional !== undefined) updateData.is_bidirectional = body.is_bidirectional;
    if (body.is_required !== undefined) updateData.is_required = body.is_required;
    if (body.on_source_delete !== undefined) updateData.on_source_delete = body.on_source_delete;
    if (body.on_target_delete !== undefined) updateData.on_target_delete = body.on_target_delete;
    if (body.max_relations !== undefined) updateData.max_relations = body.max_relations;
    if (body.min_relations !== undefined) updateData.min_relations = body.min_relations;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Update the definition
    const { data: updatedDefinition, error: updateError } = await supabase
      .from('content_relation_definitions')
      .update(updateData)
      .eq('id', (await params).id)
      .select(`
        *,
        source_content_type:content_types!source_content_type_id(id, name, display_name),
        target_content_type:content_types!target_content_type_id(id, name, display_name)
      `)
      .single();

    if (updateError) {
      console.error('Error updating relation definition:', updateError);
      
      // Handle specific errors
      if (updateError.code === '23505') {
        return NextResponse.json({
          success: false,
          error: 'Relation definition name already exists'
        }, { status: 409 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to update relation definition'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedDefinition,
      message: 'Relation definition updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/relations/definitions/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/relations/definitions/[id] - Delete relation definition
export async function DELETE(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<null>>> {
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

    // Check if user has permission to delete relation definitions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to delete relation definitions'
      }, { status: 403 });
    }

    // Check if definition exists and get relation count
    const { data: definitionInfo, error: fetchError } = await supabase
      .from('content_relation_definitions')
      .select(`
        id,
        name,
        display_name,
        content_relations(count)
      `)
      .eq('id', (await params).id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Relation definition not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch relation definition'
      }, { status: 500 });
    }

    // Check if there are existing relations
    const relationCount = (definitionInfo as any).content_relations?.[0]?.count || 0;
    if (relationCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete relation definition "${definitionInfo.display_name}" because it has ${relationCount} existing relations. Delete the relations first.`
      }, { status: 409 });
    }

    // Delete the definition
    const { error: deleteError } = await supabase
      .from('content_relation_definitions')
      .delete()
      .eq('id', (await params).id);

    if (deleteError) {
      console.error('Error deleting relation definition:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete relation definition'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: `Relation definition "${definitionInfo.display_name}" deleted successfully`
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/relations/definitions/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}