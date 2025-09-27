import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public API untuk frontend consumer - menggunakan service role key untuk akses penuh
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('content_type');
    const { slug } = await params;

    if (!contentType) {
      return NextResponse.json(
        { error: 'content_type parameter is required' },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    // Ambil content type berdasarkan name (karena tidak ada kolom slug)
    const { data: contentTypeData, error: contentTypeError } = await supabase
      .from('content_types')
      .select('id, name, display_name')
      .eq('name', contentType)
      .eq('is_active', true)
      .single();

    console.log('Single entry - Content type requested:', contentType);
    console.log('Single entry - Content type data:', contentTypeData);
    console.log('Single entry - Content type error:', contentTypeError);

    if (contentTypeError || !contentTypeData) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    // Query content entry berdasarkan slug
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .select(`
        id,
        slug,
        data,
        status,
        created_at,
        updated_at,
        published_at
      `)
      .eq('content_type_id', contentTypeData.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    console.log('Single entry - Entry slug requested:', slug);
    console.log('Single entry - Entry data:', entry);
    console.log('Single entry - Entry error:', entryError);

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Content entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: entry,
      meta: {
        content_type: {
          id: contentTypeData.id,
          name: contentTypeData.name,
          display_name: contentTypeData.display_name
        }
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/public/content-entries/[slug]
 * Update content entry berdasarkan slug
 * Body:
 * - content_type: slug dari content type (required)
 * - data: data content yang akan diupdate (required)
 * - meta_data: metadata tambahan (optional)
 * - status: status entry (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await request.json();
    const { content_type, data, meta_data, status } = body;
    const { slug } = await params;

    if (!content_type) {
      return NextResponse.json(
        { error: 'content_type is required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      );
    }

    // Ambil content type berdasarkan name
    const { data: contentTypeData, error: contentTypeError } = await supabase
      .from('content_types')
      .select('id, name, display_name')
      .eq('name', content_type)
      .eq('is_active', true)
      .single();

    if (contentTypeError || !contentTypeData) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    // Update content entry
    const updateData: {
      data: unknown
      updated_at: string
      meta_data?: unknown
      status?: string
      published_at?: string
    } = {
      data,
      updated_at: new Date().toISOString()
    };

    if (meta_data !== undefined) {
      updateData.meta_data = meta_data;
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: updatedEntry, error: updateError } = await supabase
      .from('content_entries')
      .update(updateData)
      .eq('content_type_id', contentTypeData.id)
      .eq('slug', slug)
      .select(`
        id,
        slug,
        status,
        data,
        meta_data,
        published_at,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating content entry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update content entry' },
        { status: 500 }
      );
    }

    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Content entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updatedEntry,
      message: 'Content entry updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/public/content-entries/[slug]
 * Hapus content entry berdasarkan slug
 * Query parameters:
 * - content_type: slug dari content type (required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('content_type');
    const { slug } = await params;

    if (!contentType) {
      return NextResponse.json(
        { error: 'content_type parameter is required' },
        { status: 400 }
      );
    }

    // Ambil content type berdasarkan name
    const { data: contentTypeData, error: contentTypeError } = await supabase
      .from('content_types')
      .select('id, name, display_name')
      .eq('name', contentType)
      .eq('is_active', true)
      .single();

    if (contentTypeError || !contentTypeData) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    // Delete content entry
    const { error: deleteError } = await supabase
      .from('content_entries')
      .delete()
      .eq('content_type_id', contentTypeData.id)
      .eq('slug', slug);

    if (deleteError) {
      console.error('Error deleting content entry:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete content entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content entry deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}