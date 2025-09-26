import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public API untuk frontend consumer - menggunakan service role key untuk bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/public/content-entries
 * Mengambil content entries untuk frontend consumer
 * Query parameters:
 * - content_type: slug dari content type (required)
 * - limit: jumlah entries (default: 10, max: 100)
 * - offset: offset untuk pagination (default: 0)
 * - status: filter berdasarkan status (published, draft, archived)
 * - sort: field untuk sorting (default: created_at)
 * - order: asc atau desc (default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('content_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'published';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    console.log('Content type requested:', contentType);

    if (!contentType) {
      return NextResponse.json(
        { error: 'content_type parameter is required' },
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

    console.log('Content type data:', contentTypeData);
    console.log('Content type error:', contentTypeError);

    if (contentTypeError || !contentTypeData) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }

    // Query content entries
    const query = supabase
      .from('content_entries')
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
      .eq('content_type_id', contentTypeData.id)
      .eq('status', status)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      console.error('Error fetching content entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch content entries' },
        { status: 500 }
      );
    }

    // Count total entries untuk pagination
    const { count, error: countError } = await supabase
      .from('content_entries')
      .select('*', { count: 'exact', head: true })
      .eq('content_type_id', contentTypeData.id)
      .eq('status', status);

    if (countError) {
      console.error('Error counting entries:', countError);
    }

    return NextResponse.json({
      data: entries || [],
      meta: {
        total: count || 0,
        limit,
        offset,
        content_type: {
          id: contentTypeData.id,
          name: contentTypeData.name,
          slug: contentTypeData.name, // Gunakan name sebagai slug
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