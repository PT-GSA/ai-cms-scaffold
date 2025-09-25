import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { unlink } from 'fs/promises'
import { join } from 'path'

/**
 * GET - Mengambil detail media file berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: mediaFile, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching media file:', error)
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: mediaFile
    })

  } catch (error) {
    console.error('Error in media GET by ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT - Update media file metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { alt_text, caption, folder_id } = body

    // Cek apakah file milik user yang sedang login
    const { data: existingFile, error: checkError } = await supabase
      .from('media_files')
      .select('uploaded_by')
      .eq('id', params.id)
      .single()

    if (checkError || !existingFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 })
    }

    if (existingFile.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update metadata
    const { data: updatedFile, error: updateError } = await supabase
      .from('media_files')
      .update({
        alt_text: alt_text || null,
        caption: caption || null,
        folder_id: folder_id || null
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating media file:', updateError)
      return NextResponse.json({ error: 'Failed to update media file' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedFile,
      message: 'Media file updated successfully'
    })

  } catch (error) {
    console.error('Error in media PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE - Hapus media file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil data file untuk mendapatkan path dan cek ownership
    const { data: mediaFile, error: fetchError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 })
    }

    if (mediaFile.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Hapus file dari database
    const { error: deleteError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting from database:', deleteError)
      return NextResponse.json({ error: 'Failed to delete media file' }, { status: 500 })
    }

    // Hapus file fisik dari disk
    try {
      const filePath = join(process.cwd(), 'public', mediaFile.file_path)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('Warning: Could not delete physical file:', fileError)
      // Continue even if physical file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully'
    })

  } catch (error) {
    console.error('Error in media DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}