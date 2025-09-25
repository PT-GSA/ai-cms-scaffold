import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface MediaFile {
  id: string
  file_size: number
}

/**
 * API endpoint untuk validasi upload file berdasarkan storage quota
 * POST /api/storage/validate
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { file_size } = body

    if (!file_size || typeof file_size !== 'number') {
      return NextResponse.json(
        { error: 'file_size is required and must be a number' },
        { status: 400 }
      )
    }

    // Storage quota per user (2GB = 2 * 1024 * 1024 * 1024 bytes)
    const STORAGE_QUOTA_BYTES = 2 * 1024 * 1024 * 1024

    // Get current user's files to calculate used storage
    const { data: files, error: filesError } = await supabase
      .from('media_files')
      .select('id, file_size')
      .eq('user_id', user.id)

    if (filesError) {
      console.error('Error fetching user files:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch user files' },
        { status: 500 }
      )
    }

    // Calculate current used storage
    const currentUsedBytes = (files || []).reduce((total: number, file: MediaFile) => {
      return total + (file.file_size || 0)
    }, 0)

    // Calculate storage after upload
    const afterUploadBytes = currentUsedBytes + file_size
    const remainingBytes = STORAGE_QUOTA_BYTES - currentUsedBytes
    const canUpload = afterUploadBytes <= STORAGE_QUOTA_BYTES

    // Format bytes to human readable
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const validationResult = {
      can_upload: canUpload,
      current_used: currentUsedBytes,
      file_size: file_size,
      after_upload: afterUploadBytes,
      quota: STORAGE_QUOTA_BYTES,
      remaining: remainingBytes,
      message: canUpload 
        ? `File can be uploaded. ${formatBytes(remainingBytes)} remaining after upload.`
        : `Upload would exceed storage quota. Need ${formatBytes(afterUploadBytes - STORAGE_QUOTA_BYTES)} more space.`
    }

    return NextResponse.json({
      success: true,
      data: validationResult
    })

  } catch (error) {
    console.error('Storage validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}