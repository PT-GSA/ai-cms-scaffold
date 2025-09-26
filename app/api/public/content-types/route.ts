import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors } from '@/lib/cors';

// Public API untuk frontend consumer - menggunakan service role untuk bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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