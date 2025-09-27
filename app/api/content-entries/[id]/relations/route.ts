import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { 
  ContentEntryWithRelations,
  ApiResponse 
} from '@/types/relations';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/content-entries/[id]/relations - Get content entry with all relations
export async function GET(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ContentEntryWithRelations>>> {
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

    const { id } = await params;
    const entryId = parseInt(id);
    if (isNaN(entryId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid entry ID'
      }, { status: 400 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const relationName = searchParams.get('relation_name');
    const includeMetadata = searchParams.get('include_metadata') === 'true';
    const maxDepth = parseInt(searchParams.get('max_depth') || '1');

    // First, get the content entry
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .select(`
        *,
        content_type:content_types(id, name, display_name)
      `)
      .eq('id', entryId)
      .single();

    if (entryError) {
      if (entryError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Content entry not found'
        }, { status: 404 });
      }

      console.error('Error fetching content entry:', entryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch content entry'
      }, { status: 500 });
    }

    // Check if user can access this entry
    const canAccess = entry.status === 'published' || 
                     entry.created_by === user.id;

    if (!canAccess) {
      return NextResponse.json({
        success: false,
        error: 'Access denied to this content entry'
      }, { status: 403 });
    }

    // Use the database function to get relations
    const { data: relationsData, error: relationsError } = await supabase.rpc('get_content_relations', {
      p_source_entry_id: entryId,
      p_relation_name: relationName,
      p_include_metadata: includeMetadata,
      p_max_depth: maxDepth
    });

    if (relationsError) {
      console.error('Error fetching content relations:', relationsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch content relations'
      }, { status: 500 });
    }

    // Build the response object
    const result: ContentEntryWithRelations = {
      id: entry.id,
      slug: entry.slug,
      title: entry.data?.title || entry.slug,
      content_type: (entry.content_type as any)?.name || 'unknown',
      status: entry.status,
      published_at: entry.published_at,
      data: entry.data,
      relations: relationsData || {}
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/content-entries/[id]/relations:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/content-entries/[id]/relations - Update relations for content entry
export async function PUT(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ updated_relations: number }>>> {
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

    const { id } = await params;
    const entryId = parseInt(id);
    if (isNaN(entryId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid entry ID'
      }, { status: 400 });
    }

    // Check if user owns this entry or has permissions
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .select('id, created_by')
      .eq('id', entryId)
      .single();

    if (entryError) {
      if (entryError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Content entry not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch content entry'
      }, { status: 500 });
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const canUpdate = entry.created_by === user.id || 
                     (profile && ['super_admin', 'admin', 'editor'].includes(profile.role));

    if (!canUpdate) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to update relations for this content entry'
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Expect body format:
    // {
    //   "relations": {
    //     "relation_name": [
    //       { "target_entry_id": 123, "relation_data": {}, "sort_order": 0 }
    //     ]
    //   },
    //   "replace": true // or false to append
    // }

    if (!body.relations || typeof body.relations !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid relations data format'
      }, { status: 400 });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Process each relation type
    for (const [relationName, relationUpdates] of Object.entries(body.relations)) {
      if (!Array.isArray(relationUpdates)) {
        errors.push(`Invalid relation updates for ${relationName}: expected array`);
        continue;
      }

      try {
        // Get relation definition
        const { data: definition, error: defError } = await supabase
          .from('content_relation_definitions')
          .select('id')
          .eq('name', relationName)
          .eq('is_active', true)
          .single();

        if (defError || !definition) {
          errors.push(`Relation definition '${relationName}' not found or inactive`);
          continue;
        }

        // If replace mode, delete existing relations
        if (body.replace) {
          await supabase
            .from('content_relations')
            .delete()
            .eq('relation_definition_id', definition.id)
            .eq('source_entry_id', entryId);
        }

        // Add new relations
        for (const update of relationUpdates as any[]) {
          if (!update.target_entry_id) {
            errors.push(`Missing target_entry_id in relation update for ${relationName}`);
            continue;
          }

          const { error: createError } = await supabase
            .from('content_relations')
            .insert({
              relation_definition_id: definition.id,
              source_entry_id: entryId,
              target_entry_id: update.target_entry_id,
              relation_data: update.relation_data || {},
              sort_order: update.sort_order || 0,
              created_by: user.id
            });

          if (createError) {
            // Skip duplicates, log other errors
            if (createError.code !== '23505') {
              errors.push(`Failed to create relation in ${relationName}: ${createError.message}`);
            }
          } else {
            updatedCount++;
          }
        }

      } catch (error) {
        errors.push(`Error processing relation ${relationName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const hasErrors = errors.length > 0;

    return NextResponse.json({
      success: !hasErrors || updatedCount > 0,
      data: { updated_relations: updatedCount },
      message: hasErrors ? 
        `Updated ${updatedCount} relations with ${errors.length} errors: ${errors.join(', ')}` :
        `Successfully updated ${updatedCount} relations`,
      ...(hasErrors && { error: errors.join('; ') })
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/content-entries/[id]/relations:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}