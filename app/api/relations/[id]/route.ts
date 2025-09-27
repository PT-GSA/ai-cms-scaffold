import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { 
  ContentRelation,
  ContentRelationWithDefinition,
  UpdateRelationRequest,
  ApiResponse 
} from '@/types/relations';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/relations/[id] - Get single content relation
export async function GET(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ContentRelationWithDefinition>>> {
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

    const { data: relation, error } = await supabase
      .from('content_relations')
      .select(`
        *,
        definition:content_relation_definitions(*),
        source_entry:content_entries!source_entry_id(id, slug, data, status, published_at),
        target_entry:content_entries!target_entry_id(id, slug, data, status, published_at)
      `)
      .eq('id', (await params).id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Content relation not found'
        }, { status: 404 });
      }

      console.error('Error fetching content relation:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch content relation'
      }, { status: 500 });
    }

    // Add computed title fields
    if (relation.source_entry) {
      (relation.source_entry as any).title = relation.source_entry.data?.title || relation.source_entry.slug;
    }
    if (relation.target_entry) {
      (relation.target_entry as any).title = relation.target_entry.data?.title || relation.target_entry.slug;
    }

    return NextResponse.json({
      success: true,
      data: relation
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/relations/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/relations/[id] - Update content relation
export async function PUT(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ContentRelationWithDefinition>>> {
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

    // Check if relation exists and get permissions info
    const { data: existingRelation, error: fetchError } = await supabase
      .from('content_relations')
      .select(`
        *,
        source_entry:content_entries!source_entry_id(id, created_by)
      `)
      .eq('id', (await params).id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Content relation not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch content relation'
      }, { status: 500 });
    }

    // Check permissions - user must own the source entry or be admin/editor
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const canUpdate = (existingRelation.source_entry as any)?.created_by === user.id || 
                     (profile && ['super_admin', 'admin', 'editor'].includes(profile.role));

    if (!canUpdate) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to update this content relation'
      }, { status: 403 });
    }

    const body: UpdateRelationRequest = await request.json();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that are provided
    if (body.relation_data !== undefined) updateData.relation_data = body.relation_data;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    // Update the relation
    const { data: updatedRelation, error: updateError } = await supabase
      .from('content_relations')
      .update(updateData)
      .eq('id', (await params).id)
      .select(`
        *,
        definition:content_relation_definitions(*),
        source_entry:content_entries!source_entry_id(id, slug, data, status, published_at),
        target_entry:content_entries!target_entry_id(id, slug, data, status, published_at)
      `)
      .single();

    if (updateError) {
      console.error('Error updating content relation:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update content relation'
      }, { status: 500 });
    }

    // Add computed title fields
    if (updatedRelation.source_entry) {
      (updatedRelation.source_entry as any).title = updatedRelation.source_entry.data?.title || updatedRelation.source_entry.slug;
    }
    if (updatedRelation.target_entry) {
      (updatedRelation.target_entry as any).title = updatedRelation.target_entry.data?.title || updatedRelation.target_entry.slug;
    }

    return NextResponse.json({
      success: true,
      data: updatedRelation,
      message: 'Content relation updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/relations/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/relations/[id] - Delete content relation
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

    // Check if relation exists and get permissions info
    const { data: relationInfo, error: fetchError } = await supabase
      .from('content_relations')
      .select(`
        *,
        definition:content_relation_definitions(name, display_name, min_relations),
        source_entry:content_entries!source_entry_id(id, created_by, slug)
      `)
      .eq('id', (await params).id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Content relation not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch content relation'
      }, { status: 500 });
    }

    // Check permissions - user must own the source entry or be admin/editor
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const canDelete = (relationInfo.source_entry as any)?.created_by === user.id || 
                     (profile && ['super_admin', 'admin', 'editor'].includes(profile.role));

    if (!canDelete) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to delete this content relation'
      }, { status: 403 });
    }

    // Check minimum relations constraint
    const minRelations = (relationInfo.definition as any)?.min_relations || 0;
    if (minRelations > 0) {
      // Count existing relations for this source entry and definition
      const { count, error: countError } = await supabase
        .from('content_relations')
        .select('*', { count: 'exact', head: true })
        .eq('relation_definition_id', relationInfo.relation_definition_id)
        .eq('source_entry_id', relationInfo.source_entry_id);

      if (countError) {
        console.error('Error counting relations:', countError);
        return NextResponse.json({
          success: false,
          error: 'Failed to verify relation constraints'
        }, { status: 500 });
      }

      if ((count || 0) <= minRelations) {
        return NextResponse.json({
          success: false,
          error: `Cannot delete relation: minimum ${minRelations} relations required for this content entry`
        }, { status: 409 });
      }
    }

    // Delete the relation
    const { error: deleteError } = await supabase
      .from('content_relations')
      .delete()
      .eq('id', (await params).id);

    if (deleteError) {
      console.error('Error deleting content relation:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete content relation'
      }, { status: 500 });
    }

    const definitionName = (relationInfo.definition as any)?.display_name || 'Unknown';
    const sourceSlug = (relationInfo.source_entry as any)?.slug || 'Unknown';

    return NextResponse.json({
      success: true,
      data: null,
      message: `Relation "${definitionName}" for entry "${sourceSlug}" deleted successfully`
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/relations/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}