import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public API untuk frontend consumer - tidak memerlukan autentikasi
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/public/content-types
 * Mengambil semua content types yang tersedia untuk frontend consumer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    let query = supabase
      .from('content_types')
      .select(`
        id,
        name,
        slug,
        description,
        schema,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('name');

    // Filter berdasarkan slug jika diberikan
    if (slug) {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching content types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content types' },
        { status: 500 }
      );
    }

    // Jika mencari berdasarkan slug dan tidak ditemukan
    if (slug && (!data || data.length === 0)) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    // Return single object jika mencari berdasarkan slug
    if (slug && data && data.length > 0) {
      return NextResponse.json(data[0]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}