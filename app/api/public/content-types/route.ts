import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors } from '@/lib/cors';

// Public API untuk frontend consumer - menggunakan service role untuk bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/public/content-types
 * Membuat content type baru
 * Body:
 * - name: nama content type (required, akan dijadikan slug)
 * - display_name: nama tampilan (required)
 * - description: deskripsi (optional)
 * - fields: array field definitions (required)
 * - is_active: status aktif (default: true)
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, display_name, description, fields, is_active = true } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!display_name) {
      return NextResponse.json(
        { error: 'display_name is required' },
        { status: 400 }
      );
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'fields array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validasi format name (slug-friendly)
    const slugName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Cek apakah content type dengan name yang sama sudah ada
    const { data: existingType, error: checkError } = await supabase
      .from('content_types')
      .select('id')
      .eq('name', slugName)
      .single();

    if (existingType) {
      return NextResponse.json(
        { error: 'Content type with this name already exists' },
        { status: 409 }
      );
    }

    // Insert content type baru
    const { data: newContentType, error: insertError } = await supabase
      .from('content_types')
      .insert({
        name: slugName,
        display_name,
        description: description || '',
        fields,
        is_active
      })
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

    if (insertError) {
      console.error('Error creating content type:', insertError);
      return NextResponse.json(
        { error: 'Failed to create content type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: newContentType,
      message: 'Content type created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/public/content-types
 * Mengambil semua content types yang tersedia untuk frontend consumer
 */
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    let query = supabase
      .from('content_types')
      .select(`
        id,
        name,
        display_name,
        description,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('name');

    // Filter berdasarkan name jika diberikan
    if (slug) {
      query = query.eq('name', slug);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching content types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content types' },
        { status: 500 }
      );
    }

    // Jika mencari berdasarkan name dan tidak ditemukan
    if (slug && (!data || data.length === 0)) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    // Return single object jika mencari berdasarkan slug
    if (slug && data && data.length > 0) {
      return NextResponse.json({
        ...data[0],
        slug: data[0].name // Gunakan name sebagai slug
      });
    }

    // Transform data untuk menambahkan slug dari name
    const transformedData = data?.map(item => ({
      ...item,
      slug: item.name // Gunakan name sebagai slug
    }));

    return NextResponse.json(transformedData || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export dengan CORS support
export const GET = withCors(getHandler);
export const POST = withCors(postHandler);