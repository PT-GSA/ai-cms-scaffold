import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public API untuk frontend consumer - tidak memerlukan autentikasi
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/public/media
 * Mengambil media files untuk frontend consumer
 * Query parameters:
 * - limit: jumlah files (default: 10, max: 100)
 * - offset: offset untuk pagination (default: 0)
 * - type: filter berdasarkan file type (image, video, document, etc.)
 * - folder_id: filter berdasarkan folder
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const fileType = searchParams.get('type');
    const folderId = searchParams.get('folder_id');

    let query = supabase
      .from('media_files')
      .select(`
        id,
        filename,
        original_name,
        file_path,
        file_size,
        mime_type,
        alt_text,
        created_at,
        folder_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter berdasarkan file type
    if (fileType) {
      query = query.like('mime_type', `${fileType}/%`);
    }

    // Filter berdasarkan folder
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data: files, error: filesError } = await query;

    if (filesError) {
      console.error('Error fetching media files:', filesError);
      return NextResponse.json(
        { error: 'Failed to fetch media files' },
        { status: 500 }
      );
    }

    // Count total files untuk pagination
    let countQuery = supabase
      .from('media_files')
      .select('*', { count: 'exact', head: true });

    if (fileType) {
      countQuery = countQuery.like('mime_type', `${fileType}/%`);
    }

    if (folderId) {
      countQuery = countQuery.eq('folder_id', folderId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting media files:', countError);
    }

    // Generate public URLs untuk files
    const filesWithUrls = files?.map(file => {
      const publicUrl = supabase.storage
        .from('media')
        .getPublicUrl(file.file_path).data.publicUrl;

      return {
        ...file,
        public_url: publicUrl
      };
    });

    return NextResponse.json({
      data: filesWithUrls || [],
      meta: {
        total: count || 0,
        limit,
        offset
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