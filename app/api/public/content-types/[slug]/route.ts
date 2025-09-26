import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors } from '@/lib/cors';

// Public API untuk frontend consumer - menggunakan service role key untuk bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/public/content-types/[slug]
 * Mengambil single content type berdasarkan slug
 */
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    // Query content type berdasarkan name (slug)
    const { data: contentType, error: contentTypeError } = await supabase
      .from('content_types')
      .select(`
        id,
        name,
        display_name,
        description,
        fields,
        is_active,
        created_at,
        updated_at
      `)
      .eq('name', slug)
      .eq('is_active', true)
      .single();

    if (contentTypeError || !contentType) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: contentType
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
 * PUT /api/public/content-types/[slug]
 * Update content type berdasarkan slug
 * Body:
 * - display_name: nama tampilan (optional)
 * - description: deskripsi (optional)
 * - fields: array field definitions (optional)
 * - is_active: status aktif (optional)
 */
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await request.json();
    const { display_name, description, fields, is_active } = body;
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    // Cek apakah content type ada
    const { data: existingType, error: checkError } = await supabase
      .from('content_types')
      .select('id, name')
      .eq('name', slug)
      .single();

    if (checkError || !existingType) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (display_name !== undefined) {
      updateData.display_name = display_name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (fields !== undefined) {
      if (!Array.isArray(fields)) {
        return NextResponse.json(
          { error: 'fields must be an array' },
          { status: 400 }
        );
      }
      updateData.fields = fields;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    // Update content type
    const { data: updatedContentType, error: updateError } = await supabase
      .from('content_types')
      .update(updateData)
      .eq('name', slug)
      .select(`
        id,
        name,
        display_name,
        description,
        fields,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating content type:', updateError);
      return NextResponse.json(
        { error: 'Failed to update content type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedContentType,
      message: 'Content type updated successfully'
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
 * DELETE /api/public/content-types/[slug]
 * Hapus content type berdasarkan slug
 */
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    // Cek apakah ada content entries yang menggunakan content type ini
    const { data: entries, error: entriesError } = await supabase
      .from('content_entries')
      .select('id')
      .eq('content_type_id', (
        await supabase
          .from('content_types')
          .select('id')
          .eq('name', slug)
          .single()
      ).data?.id)
      .limit(1);

    if (entries && entries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete content type that has associated entries' },
        { status: 409 }
      );
    }

    // Delete content type
    const { error: deleteError } = await supabase
      .from('content_types')
      .delete()
      .eq('name', slug);

    if (deleteError) {
      console.error('Error deleting content type:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete content type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content type deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export dengan CORS support - menggunakan wrapper function untuk dynamic routes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withCors(async (req: NextRequest) => {
    return getHandler(req, { params });
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withCors(async (req: NextRequest) => {
    return putHandler(req, { params });
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withCors(async (req: NextRequest) => {
    return deleteHandler(req, { params });
  })(request);
}