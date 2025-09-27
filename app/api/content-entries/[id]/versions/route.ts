import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit-middleware'

// Types for content versioning
interface ContentEntryVersion {
  id: string
  content_entry_id: string
  version_number: number
  title: string
  slug: string
  status: string
  field_values: Record<string, unknown>
  created_by: string | null
  created_at: string
}

interface VersionDiff {
  field: string
  old_value: unknown
  new_value: unknown
  change_type: 'added' | 'modified' | 'deleted'
}

/**
 * GET /api/content-entries/[id]/versions
 * Fetch all versions of a content entry
 */
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Verify content entry exists
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .select('id, slug, data')
      .eq('id', id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Content entry not found' },
        { status: 404 }
      )
    }

    // Fetch versions with pagination
    const { data: versions, error: versionsError, count } = await supabase
      .from('content_entry_versions')
      .select('*', { count: 'exact' })
      .eq('content_entry_id', id)
      .order('version_number', { ascending: false })
      .range(offset, offset + limit - 1)

    if (versionsError) {
      console.error('Error fetching versions:', versionsError)
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      )
    }

    // Get user info for created_by fields
    const userIds = versions?.map(v => v.created_by).filter(Boolean) || []
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    const usersMap = users ? Object.fromEntries(
      users.map(user => [user.id, user])
    ) : {}

    // Transform versions with user info
    const transformedVersions = versions?.map(version => ({
      ...version,
      created_by_user: version.created_by ? usersMap[version.created_by] : null
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        versions: transformedVersions,
        current_data: entry.data,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error in GET versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/content-entries/[id]/versions
 * Create a new version (manual checkpoint)
 */
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const { comment } = body

    const supabase = createAdminSupabaseClient()

    // Get current entry data
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Content entry not found' },
        { status: 404 }
      )
    }

    // Get next version number
    const { data: latestVersion } = await supabase
      .from('content_entry_versions')
      .select('version_number')
      .eq('content_entry_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (latestVersion?.version_number || 0) + 1

    // Create new version record
    const { data: newVersion, error: versionError } = await supabase
      .from('content_entry_versions')
      .insert({
        content_entry_id: id,
        version_number: nextVersion,
        title: entry.data?.title || entry.slug,
        slug: entry.slug,
        status: entry.status,
        field_values: entry.data || {},
        created_by: null, // TODO: Get from auth context
        comment: comment || `Manual checkpoint v${nextVersion}`
      })
      .select()
      .single()

    if (versionError) {
      console.error('Error creating version:', versionError)
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newVersion,
      message: `Version ${nextVersion} created successfully`
    })

  } catch (error) {
    console.error('Error in POST versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrapper functions to match withRateLimit signature
async function wrappedGetHandler(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 2]
  
  return getHandler(request, { params: Promise.resolve({ id }) })
}

async function wrappedPostHandler(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 2]
  
  return postHandler(request, { params: Promise.resolve({ id }) })
}

// Export rate-limited handlers
export const GET = withRateLimit(wrappedGetHandler, apiRateLimit)
export const POST = withRateLimit(wrappedPostHandler, apiRateLimit)
