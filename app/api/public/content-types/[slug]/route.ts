import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors } from '@/lib/cors';
import { withApiKeyValidation } from '@/lib/api-key-middleware';

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

    // Ambil fields dari tabel content_type_fields
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('content_type_fields')
      .select('field_name, display_name, field_type, is_required, validation_rules, field_options, sort_order')
      .eq('content_type_id', contentType.id)
      .order('sort_order');

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
    }

    // Transform fields data untuk response
    const transformedFields = fieldsData?.map(field => ({
      name: field.field_name,
      display_name: field.display_name,
      type: field.field_type,
      required: field.is_required,
      validation: field.validation_rules,
      options: field.field_options
    })) || [];

    return NextResponse.json({
      data: {
        ...contentType,
        fields: transformedFields
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
      
      // Update fields di tabel content_type_fields
      // Hapus fields lama terlebih dahulu
      const { error: deleteFieldsError } = await supabase
        .from('content_type_fields')
        .delete()
        .eq('content_type_id', existingType.id);
      
      if (deleteFieldsError) {
        console.error('Error deleting old fields:', deleteFieldsError);
        return NextResponse.json(
          { error: 'Failed to update fields' },
          { status: 500 }
        );
      }
      
      // Insert fields baru
      const fieldsToInsert = fields.map((field, index) => ({
        content_type_id: existingType.id,
        field_name: field.name,
        display_name: field.display_name || field.name,
        field_type: field.type,
        is_required: field.required || false,
        validation_rules: field.validation || null,
        field_options: field.options || null,
        sort_order: index + 1
      }));
      
      const { error: insertFieldsError } = await supabase
        .from('content_type_fields')
        .insert(fieldsToInsert);
      
      if (insertFieldsError) {
        console.error('Error inserting new fields:', insertFieldsError);
        return NextResponse.json(
          { error: 'Failed to update fields' },
          { status: 500 }
        );
      }
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

    // Ambil fields dari tabel content_type_fields
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('content_type_fields')
      .select('field_name, display_name, field_type, is_required, validation_rules, field_options, sort_order')
      .eq('content_type_id', updatedContentType.id)
      .order('sort_order');

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
    }

    // Transform fields data untuk response
    const transformedFields = fieldsData?.map(field => ({
      name: field.field_name,
      display_name: field.display_name,
      type: field.field_type,
      required: field.is_required,
      validation: field.validation_rules,
      options: field.field_options
    })) || [];

    return NextResponse.json({
      data: {
        ...updatedContentType,
        fields: transformedFields
      },
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
    return withApiKeyValidation(putHandler)(req, { params });
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withCors(async (req: NextRequest) => {
    return withApiKeyValidation(deleteHandler)(req, { params });
  })(request);
}