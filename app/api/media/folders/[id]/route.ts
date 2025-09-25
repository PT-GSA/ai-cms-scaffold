import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * PUT - Update folder name
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Cek apakah folder exists dan milik user
    const { data: existingFolder, error: checkError } = await supabase
      .from('media_folders')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Cek apakah folder dengan nama yang sama sudah ada di parent yang sama
    const { data: duplicateFolder, error: duplicateError } = await supabase
      .from('media_folders')
      .select('id')
      .eq('name', name.trim())
      .eq('parent_id', existingFolder.parent_id)
      .neq('id', id)
      .single()

    if (duplicateFolder) {
      return NextResponse.json({ error: 'Folder with this name already exists' }, { status: 400 })
    }

    // Update folder
    const { data: updatedFolder, error: updateError } = await supabase
      .from('media_folders')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating folder:', updateError)
      return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedFolder,
      message: 'Folder updated successfully'
    })

  } catch (error) {
    console.error('Error in folder PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE - Hapus folder (hanya jika kosong)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cek apakah folder exists
    const { data: folder, error: checkError } = await supabase
      .from('media_folders')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Cek apakah folder memiliki subfolder
    const { data: subfolders, error: subfolderError } = await supabase
      .from('media_folders')
      .select('id')
      .eq('parent_id', id)
      .limit(1)

    if (subfolderError) {
      console.error('Error checking subfolders:', subfolderError)
      return NextResponse.json({ error: 'Failed to check folder contents' }, { status: 500 })
    }

    if (subfolders && subfolders.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete folder that contains subfolders' 
      }, { status: 400 })
    }

    // Cek apakah folder memiliki files
    const { data: files, error: filesError } = await supabase
      .from('media_files')
      .select('id')
      .eq('folder_id', id)
      .limit(1)

    if (filesError) {
      console.error('Error checking files:', filesError)
      return NextResponse.json({ error: 'Failed to check folder contents' }, { status: 500 })
    }

    if (files && files.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete folder that contains files' 
      }, { status: 400 })
    }

    // Hapus folder
    const { error: deleteError } = await supabase
      .from('media_folders')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting folder:', deleteError)
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully'
    })

  } catch (error) {
    console.error('Error in folder DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}