import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET - Mengambil daftar folders
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')

    let query = supabase
      .from('media_folders')
      .select('*')
      .order('name', { ascending: true })

    if (parentId) {
      query = query.eq('parent_id', parentId)
    } else {
      query = query.is('parent_id', null)
    }

    const { data: folders, error } = await query

    if (error) {
      console.error('Error fetching folders:', error)
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: folders
    })

  } catch (error) {
    console.error('Error in folders GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST - Membuat folder baru
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, parent_id } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Cek apakah folder dengan nama yang sama sudah ada di parent yang sama
    const { data: existingFolder, error: checkError } = await supabase
      .from('media_folders')
      .select('id')
      .eq('name', name.trim())
      .eq('parent_id', parent_id || null)
      .single()

    if (existingFolder) {
      return NextResponse.json({ error: 'Folder with this name already exists' }, { status: 400 })
    }

    // Buat folder baru
    const { data: newFolder, error: createError } = await supabase
      .from('media_folders')
      .insert({
        name: name.trim(),
        parent_id: parent_id || null,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating folder:', createError)
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newFolder,
      message: 'Folder created successfully'
    })

  } catch (error) {
    console.error('Error in folders POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}