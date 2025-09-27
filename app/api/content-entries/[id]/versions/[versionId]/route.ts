import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit-middleware'

// Types for version operations
interface VersionDiff {
  field: string
  old_value: unknown
  new_value: unknown
  change_type: 'added' | 'modified' | 'deleted'
}

/**
 * GET /api/content-entries/[id]/versions/[versionId]
 * Get specific version details or compare with another version
 */
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
): Promise<NextResponse> {
  try {
    const { id, versionId } = await params
    const { searchParams } = new URL(request.url)
    const compareWith = searchParams.get('compare_with') // version number or 'current'
    
    const supabase = createAdminSupabaseClient()

    // Get the specified version
    const { data: version, error: versionError } = await supabase
      .from('content_entry_versions')
      .select('*')
      .eq('content_entry_id', id)
      .eq('version_number', parseInt(versionId))
      .single()

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // If no comparison requested, just return the version
    if (!compareWith) {
      return NextResponse.json({
        success: true,
        data: version
      })
    }

    // Get comparison data
    let compareData: Record<string, unknown> = {}
    
    if (compareWith === 'current') {
      // Compare with current content entry data
      const { data: currentEntry, error: currentError } = await supabase
        .from('content_entries')
        .select('data')
        .eq('id', id)
        .single()

      if (currentError) {
        return NextResponse.json(
          { error: 'Failed to fetch current version' },
          { status: 500 }
        )
      }

      compareData = currentEntry.data || {}
    } else {
      // Compare with another version
      const compareVersionNum = parseInt(compareWith)
      const { data: compareVersion, error: compareError } = await supabase
        .from('content_entry_versions')
        .select('field_values')
        .eq('content_entry_id', id)
        .eq('version_number', compareVersionNum)
        .single()

      if (compareError) {
        return NextResponse.json(
          { error: 'Comparison version not found' },
          { status: 404 }
        )
      }

      compareData = compareVersion.field_values || {}
    }

    // Generate diff
    const diff = generateVersionDiff(version.field_values || {}, compareData)

    return NextResponse.json({
      success: true,
      data: {
        version,
        comparison: {
          type: compareWith === 'current' ? 'current' : 'version',
          target: compareWith,
          diff
        }
      }
    })

  } catch (error) {
    console.error('Error in GET version details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/content-entries/[id]/versions/[versionId]
 * Rollback to specific version
 */
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
): Promise<NextResponse> {
  try {
    const { id, versionId } = await params
    const body = await request.json()
    const { create_backup = true, comment } = body

    const supabase = createAdminSupabaseClient()

    // Get the version to rollback to
    const { data: targetVersion, error: versionError } = await supabase
      .from('content_entry_versions')
      .select('*')
      .eq('content_entry_id', id)
      .eq('version_number', parseInt(versionId))
      .single()

    if (versionError || !targetVersion) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Get current content entry
    const { data: currentEntry, error: currentError } = await supabase
      .from('content_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (currentError || !currentEntry) {
      return NextResponse.json(
        { error: 'Content entry not found' },
        { status: 404 }
      )
    }

    // Create backup version if requested
    if (create_backup) {
      const { data: latestVersion } = await supabase
        .from('content_entry_versions')
        .select('version_number')
        .eq('content_entry_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const nextVersion = (latestVersion?.version_number || 0) + 1

      await supabase
        .from('content_entry_versions')
        .insert({
          content_entry_id: id,
          version_number: nextVersion,
          title: currentEntry.data?.title || currentEntry.slug,
          slug: currentEntry.slug,
          status: currentEntry.status,
          field_values: currentEntry.data || {},
          created_by: null, // TODO: Get from auth context
          comment: `Backup before rollback to v${versionId}`
        })
    }

    // Update content entry with version data
    const { data: updatedEntry, error: updateError } = await supabase
      .from('content_entries')
      .update({
        slug: targetVersion.slug,
        status: targetVersion.status,
        data: targetVersion.field_values,
        updated_at: new Date().toISOString()
        // TODO: Add updated_by from auth context
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error rolling back to version:', updateError)
      return NextResponse.json(
        { error: 'Failed to rollback to version' },
        { status: 500 }
      )
    }

    // Create rollback log version
    const { data: latestVersion } = await supabase
      .from('content_entry_versions')
      .select('version_number')
      .eq('content_entry_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const rollbackVersionNum = (latestVersion?.version_number || 0) + 1

    await supabase
      .from('content_entry_versions')
      .insert({
        content_entry_id: id,
        version_number: rollbackVersionNum,
        title: targetVersion.title,
        slug: targetVersion.slug,
        status: targetVersion.status,
        field_values: targetVersion.field_values,
        created_by: null, // TODO: Get from auth context
        comment: comment || `Rolled back to version ${versionId}`
      })

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: `Successfully rolled back to version ${versionId}`
    })

  } catch (error) {
    console.error('Error in POST rollback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/content-entries/[id]/versions/[versionId]
 * Delete a specific version (with protection for important versions)
 */
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
): Promise<NextResponse> {
  try {
    const { id, versionId } = await params
    const supabase = createAdminSupabaseClient()

    const versionNumber = parseInt(versionId)

    // Protect version 1 and recent versions
    if (versionNumber === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the first version' },
        { status: 400 }
      )
    }

    // Get latest version number
    const { data: latestVersion } = await supabase
      .from('content_entry_versions')
      .select('version_number')
      .eq('content_entry_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    // Protect latest 3 versions
    if (latestVersion && versionNumber > (latestVersion.version_number - 3)) {
      return NextResponse.json(
        { error: 'Cannot delete recent versions (last 3 versions are protected)' },
        { status: 400 }
      )
    }

    // Delete the version
    const { error: deleteError } = await supabase
      .from('content_entry_versions')
      .delete()
      .eq('content_entry_id', id)
      .eq('version_number', versionNumber)

    if (deleteError) {
      console.error('Error deleting version:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete version' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Version ${versionId} deleted successfully`
    })

  } catch (error) {
    console.error('Error in DELETE version:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate diff between two versions
 */
function generateVersionDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): VersionDiff[] {
  const diff: VersionDiff[] = []
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])

  for (const key of allKeys) {
    const oldValue = oldData[key]
    const newValue = newData[key]

    if (oldValue === undefined && newValue !== undefined) {
      diff.push({
        field: key,
        old_value: null,
        new_value: newValue,
        change_type: 'added'
      })
    } else if (oldValue !== undefined && newValue === undefined) {
      diff.push({
        field: key,
        old_value: oldValue,
        new_value: null,
        change_type: 'deleted'
      })
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diff.push({
        field: key,
        old_value: oldValue,
        new_value: newValue,
        change_type: 'modified'
      })
    }
  }

  return diff
}

// Wrapper functions to match withRateLimit signature
async function wrappedGetHandler(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 3]
  const versionId = pathParts[pathParts.length - 1]
  
  return getHandler(request, { params: Promise.resolve({ id, versionId }) })
}

async function wrappedPostHandler(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 3]
  const versionId = pathParts[pathParts.length - 1]
  
  return postHandler(request, { params: Promise.resolve({ id, versionId }) })
}

async function wrappedDeleteHandler(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 3]
  const versionId = pathParts[pathParts.length - 1]
  
  return deleteHandler(request, { params: Promise.resolve({ id, versionId }) })
}

// Export rate-limited handlers
export const GET = withRateLimit(wrappedGetHandler, apiRateLimit)
export const POST = withRateLimit(wrappedPostHandler, apiRateLimit)
export const DELETE = withRateLimit(wrappedDeleteHandler, apiRateLimit)
