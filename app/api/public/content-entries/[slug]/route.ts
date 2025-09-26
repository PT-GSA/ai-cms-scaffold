import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public API untuk frontend consumer - tidak memerlukan autentikasi
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/public/content-entries/[slug]
 * Mengambil single content entry berdasarkan slug
 * Query parameters:
 * - content_type: slug dari content type (required)
 */
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

    // Ambil content type berdasarkan slug
    const { data: contentTypeData, error: contentTypeError } = await supabase
      .from('content_types')
      .select('id, name, slug, schema')
      .eq('slug', contentType)
      .eq('is_active', true)
      .single();

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
        title,
        slug,
        content,
        status,
        created_at,
        updated_at,
        published_at
      `)
      .eq('content_type_id', contentTypeData.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

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
          slug: contentTypeData.slug,
          schema: contentTypeData.schema
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