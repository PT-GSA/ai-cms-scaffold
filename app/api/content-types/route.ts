import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

/**
 * GET /api/content-types
 * Mengambil daftar content types dengan opsi untuk include fields
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const includeFields = searchParams.get('include_fields') === 'true'

    const query = supabase
      .from('content_types')
      .select(` 
        id,
        name,
        display_name,
        description,
        icon,
        is_active,
        created_at,
        updated_at
        ${includeFields ? ', content_type_fields(*)' : ''}
      `)
      .eq('is_active', true)
      .order('display_name')

    const { data, error } = await query

    if (error) {
      console.error('Error fetching content types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch content types' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/content-types
 * Membuat content type baru
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Validasi input
    const { name, display_name, description, icon, fields } = body

    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'Name and display_name are required' },
        { status: 400 }
      )
    }

    // Validasi nama content type (harus lowercase, no spaces)
    const validName = /^[a-z][a-z0-9_]*$/.test(name)
    if (!validName) {
      return NextResponse.json(
        { error: 'Name must be lowercase, start with letter, and contain only letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Cek apakah nama sudah ada
    const { data: existing } = await supabase
      .from('content_types')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Content type with this name already exists' },
        { status: 409 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Insert content type
    const { data: contentType, error: contentTypeError } = await supabase
      .from('content_types')
      .insert({
        name,
        display_name,
        description: description || null,
        icon: icon || 'File',
        created_by: user.id
      })
      .select()
      .single()

    if (contentTypeError) {
      console.error('Error creating content type:', contentTypeError)
      return NextResponse.json(
        { error: 'Failed to create content type' },
        { status: 500 }
      )
    }

    // Insert fields jika ada
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const fieldsToInsert = fields.map((field, index) => ({
        content_type_id: contentType.id,
        field_name: field.field_name,
        display_name: field.display_name,
        field_type: field.field_type,
        is_required: field.is_required || false,
        is_unique: field.is_unique || false,
        default_value: field.default_value || null,
        validation_rules: field.validation_rules || null,
        field_options: field.field_options || null,
        help_text: field.help_text || null,
        sort_order: field.sort_order || index
      }))

      const { error: fieldsError } = await supabase
        .from('content_type_fields')
        .insert(fieldsToInsert)

      if (fieldsError) {
        console.error('Error creating fields:', fieldsError)
        // Rollback content type jika fields gagal
        await supabase
          .from('content_types')
          .delete()
          .eq('id', contentType.id)

        return NextResponse.json(
          { error: 'Failed to create content type fields' },
          { status: 500 }
        )
      }
    }

    // Fetch complete content type dengan fields
    const { data: completeContentType } = await supabase
      .from('content_types')
      .select(`
        *,
        content_type_fields(*)
      `)
      .eq('id', contentType.id)
      .single()

    return NextResponse.json({
      success: true,
      data: completeContentType,
      message: 'Content type created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}