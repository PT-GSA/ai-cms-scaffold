import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { withRateLimit, strictRateLimit } from '@/lib/rate-limit-middleware';

/**
 * POST /api/revalidate
 * API endpoint untuk trigger ISR revalidation
 * Digunakan untuk invalidate cache ketika content berubah
 * Rate limited untuk mencegah abuse
 */
async function handleRevalidatePost(request: NextRequest) {
  try {
    // Validasi secret token untuk keamanan
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.REVALIDATION_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid or missing token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, path, tag, content_type, slug } = body;

    switch (type) {
      case 'path':
        // Revalidate specific path
        if (!path) {
          return NextResponse.json(
            { error: 'Path is required for path revalidation' },
            { status: 400 }
          );
        }
        
        await revalidatePath(path);
        
        return NextResponse.json({
          message: `Path ${path} revalidated successfully`,
          revalidated: true,
          timestamp: new Date().toISOString()
        });

      case 'tag':
        // Revalidate by cache tag
        if (!tag) {
          return NextResponse.json(
            { error: 'Tag is required for tag revalidation' },
            { status: 400 }
          );
        }
        
        await revalidateTag(tag);
        
        return NextResponse.json({
          message: `Tag ${tag} revalidated successfully`,
          revalidated: true,
          timestamp: new Date().toISOString()
        });

      case 'content':
        // Revalidate content-specific paths
        if (!content_type) {
          return NextResponse.json(
            { error: 'content_type is required for content revalidation' },
            { status: 400 }
          );
        }

        const pathsToRevalidate = [
          `/${content_type}`, // List page
          `/api/public/content-entries?content_type=${content_type}` // API cache
        ];

        // Jika ada slug, revalidate detail page juga
        if (slug) {
          pathsToRevalidate.push(`/${content_type}/${slug}`);
        }

        // Revalidate semua paths
        await Promise.all(pathsToRevalidate.map(path => revalidatePath(path)));
        
        // Revalidate cache tags
        await revalidateTag(`content-type-${content_type}`);
        if (slug) {
          await revalidateTag(`content-entry-${content_type}-${slug}`);
        }

        return NextResponse.json({
          message: `Content ${content_type}${slug ? `/${slug}` : ''} revalidated successfully`,
          revalidated: true,
          paths: pathsToRevalidate,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid revalidation type. Use: path, tag, or content' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revalidate
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Revalidation API is working',
    timestamp: new Date().toISOString()
  });
}

/**
 * Export POST dengan rate limiting
 */
export const POST = withRateLimit(handleRevalidatePost, strictRateLimit);