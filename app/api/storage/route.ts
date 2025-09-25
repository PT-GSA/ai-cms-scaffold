import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface MediaFile {
  file_size: number
}

/**
 * API endpoint untuk mendapatkan informasi storage usage per user
 * GET /api/storage - Mengembalikan storage usage dan quota user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Dapatkan user yang sedang login
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Hitung total storage yang digunakan user
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media_files')
      .select('file_size')
      .eq('uploaded_by', user.id)

    if (mediaError) {
      console.error('Error fetching media files:', mediaError)
      return NextResponse.json(
        { error: 'Failed to fetch storage data' },
        { status: 500 }
      )
    }

    // Hitung total size dalam bytes
    const totalUsedBytes = mediaFiles?.reduce((total: number, file: MediaFile) => {
      return total + (file.file_size || 0)
    }, 0) || 0

    // Konversi ke GB dan MB untuk display
    const totalUsedMB = totalUsedBytes / (1024 * 1024)
    const totalUsedGB = totalUsedBytes / (1024 * 1024 * 1024)
    
    // Storage quota per user (2GB)
    const quotaBytes = 2 * 1024 * 1024 * 1024 // 2GB dalam bytes
    const quotaGB = 2
    
    // Hitung persentase penggunaan
    const usagePercentage = Math.round((totalUsedBytes / quotaBytes) * 100)
    
    // Format untuk display
    const formatSize = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      } else if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      } else if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
      } else {
        return `${bytes} B`
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        used_bytes: totalUsedBytes,
        used_formatted: formatSize(totalUsedBytes),
        quota_bytes: quotaBytes,
        quota_formatted: `${quotaGB} GB`,
        usage_percentage: usagePercentage,
        remaining_bytes: quotaBytes - totalUsedBytes,
        remaining_formatted: formatSize(quotaBytes - totalUsedBytes),
        file_count: mediaFiles?.length || 0,
        is_quota_exceeded: totalUsedBytes > quotaBytes
      }
    })

  } catch (error) {
    console.error('Storage API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * API endpoint untuk validasi storage quota sebelum upload
 * POST /api/storage/validate - Validasi apakah file bisa diupload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { file_size } = await request.json()
    
    // Dapatkan user yang sedang login
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validasi input
    if (!file_size || typeof file_size !== 'number') {
      return NextResponse.json(
        { error: 'Invalid file size' },
        { status: 400 }
      )
    }

    // Dapatkan storage usage saat ini
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media_files')
      .select('file_size')
      .eq('uploaded_by', user.id)

    if (mediaError) {
      console.error('Error fetching media files:', mediaError)
      return NextResponse.json(
        { error: 'Failed to validate storage' },
        { status: 500 }
      )
    }

    const currentUsedBytes = mediaFiles?.reduce((total: number, file: MediaFile) => {
      return total + (file.file_size || 0)
    }, 0) || 0

    const quotaBytes = 2 * 1024 * 1024 * 1024 // 2GB
    const afterUploadBytes = currentUsedBytes + file_size

    // Cek apakah masih dalam quota
    const canUpload = afterUploadBytes <= quotaBytes
    const remainingBytes = quotaBytes - currentUsedBytes

    return NextResponse.json({
      success: true,
      data: {
        can_upload: canUpload,
        current_used: currentUsedBytes,
        file_size: file_size,
        after_upload: afterUploadBytes,
        quota: quotaBytes,
        remaining: remainingBytes,
        message: canUpload 
          ? 'File can be uploaded' 
          : `File too large. You have ${(remainingBytes / (1024 * 1024)).toFixed(1)} MB remaining.`
      }
    })

  } catch (error) {
    console.error('Storage validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}