import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

/**
 * GET - Mengambil daftar media files dengan pagination dan filter
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const fileType = searchParams.get('file_type')
    const search = searchParams.get('search')
    const folderId = searchParams.get('folder_id')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('media_files')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (fileType) {
      query = query.eq('file_type', fileType)
    }

    if (search) {
      query = query.or(`original_filename.ilike.%${search}%,alt_text.ilike.%${search}%,caption.ilike.%${search}%`)
    }

    if (folderId) {
      query = query.eq('folder_id', folderId)
    } else if (folderId === null) {
      query = query.is('folder_id', null)
    }

    const { data: files, error, count } = await query

    if (error) {
      console.error('Error fetching media files:', error)
      return NextResponse.json({ error: 'Failed to fetch media files' }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: files,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error in media GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST - Upload media file
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Cek autentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folder_id') as string
    const altText = formData.get('alt_text') as string
    const caption = formData.get('caption') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validasi file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 })
    }

    // Validasi file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`
    
    // Tentukan file type category
    let fileTypeCategory = 'other'
    if (file.type.startsWith('image/')) fileTypeCategory = 'image'
    else if (file.type.startsWith('video/')) fileTypeCategory = 'video'
    else if (file.type.startsWith('audio/')) fileTypeCategory = 'audio'
    else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
      fileTypeCategory = 'document'
    }

    // Create upload directory if not exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileTypeCategory)
    await mkdir(uploadDir, { recursive: true })

    // Save file to disk
    const filePath = join(uploadDir, uniqueFilename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Get image dimensions if it's an image
    let width = null
    let height = null
    
    if (fileTypeCategory === 'image' && file.type !== 'image/svg+xml') {
      // For now, we'll skip getting dimensions. In production, you might want to use a library like 'sharp'
      // const sharp = require('sharp')
      // const metadata = await sharp(buffer).metadata()
      // width = metadata.width
      // height = metadata.height
    }

    // Save to database
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        filename: uniqueFilename,
        original_filename: file.name,
        file_path: `/uploads/${fileTypeCategory}/${uniqueFilename}`,
        file_size: file.size,
        mime_type: file.type,
        file_type: fileTypeCategory,
        width,
        height,
        alt_text: altText || null,
        caption: caption || null,
        folder_id: folderId || null,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving to database:', dbError)
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: mediaFile,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Error in media POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}