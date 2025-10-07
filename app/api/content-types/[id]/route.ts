import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/content-types/[id]
 * Mengambil detail content type berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const includeFields = searchParams.get('include_fields') !== 'false' // default true

    let selectQuery = `
      id,
      name,
      display_name,
      description,
      icon,
      is_active,
      created_at,
      updated_at
    `

    if (includeFields) {
      selectQuery += `, content_type_fields(
        id,
        field_name,
        display_name,
        field_type,
        is_required,
        is_unique,
        default_value,
        validation_rules,
        field_options,
        help_text,
        sort_order,
        is_active
      )`
    }

    const { data, error } = await supabase
      .from('content_types')
      .select(selectQuery)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content type not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching content type:', error)
      return NextResponse.json(
        { error: 'Failed to fetch content type' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
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
 * PUT /api/content-types/[id]
 * Update content type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { display_name, description, icon, is_active, fields } = body

    if (!display_name) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // Update content type
    const { error: updateError } = await supabase
      .from('content_types')
      .update({
        display_name,
        description: description || null,
        icon: icon || 'File',
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content type not found' },
          { status: 404 }
        )
      }
      console.error('Error updating content type:', updateError)
      return NextResponse.json(
        { error: 'Failed to update content type' },
        { status: 500 }
      )
    }

    // Update fields jika disediakan
    if (fields && Array.isArray(fields)) {
      // Hapus fields yang ada
      await supabase
        .from('content_type_fields')
        .delete()
        .eq('content_type_id', id)

      // Insert fields baru
      if (fields.length > 0) {
        const fieldsToInsert = fields.map((field, index) => ({
          content_type_id: parseInt(id),
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
          console.error('Error updating fields:', fieldsError)
          return NextResponse.json(
            { error: 'Failed to update content type fields' },
            { status: 500 }
          )
        }
      }
    }

    // Fetch updated content type dengan fields
    const { data: updatedContentType } = await supabase
      .from('content_types')
      .select(`
        *,
        content_type_fields(*)
      `)
      .eq('id', id)
      .single()

    // Revalidate cache untuk content types
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paths: ['/dashboard/content-types', '/api/content-types']
        })
      })
    } catch (revalidateError) {
      console.warn('Failed to revalidate cache:', revalidateError)
    }

    return NextResponse.json({
      success: true,
      data: updatedContentType,
      message: 'Content type updated successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
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
 * DELETE /api/content-types/[id]
 * Hapus content type (soft delete dengan mengubah is_active)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const softDelete = searchParams.get('soft') === 'true'

    // Cek apakah ada content entries yang menggunakan content type ini
    const { data: entries, error: entriesError } = await supabase
      .from('content_entries')
      .select('id')
      .eq('content_type_id', id)
      .limit(1)

    if (entriesError) {
      console.error('Error checking entries:', entriesError)
      return NextResponse.json(
        { error: 'Failed to check content entries' },
        { status: 500 }
      )
    }

    if (entries && entries.length > 0 && !softDelete) {
      return NextResponse.json(
        { error: 'Cannot delete content type with existing entries. Delete entries first or use soft delete.' },
        { status: 409 }
      )
    }

    if (softDelete) {
      // Soft delete - set is_active = false
      const { data, error: updateError } = await supabase
        .from('content_types')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        if (updateError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Content type not found' },
            { status: 404 }
          )
        }
        console.error('Error deactivating content type:', updateError)
        return NextResponse.json(
          { error: 'Failed to deactivate content type' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Content type deactivated successfully'
      })
    } else {
      // Hard delete - hapus content type dan fields (default behavior)
      const { error: deleteError } = await supabase
        .from('content_types')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting content type:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete content type' },
          { status: 500 }
        )
      }

      // Revalidate cache untuk content types
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/revalidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paths: ['/dashboard/content-types', '/api/content-types']
          })
        })
      } catch (revalidateError) {
        console.warn('Failed to revalidate cache:', revalidateError)
      }

      return NextResponse.json({
        success: true,
        message: 'Content type deleted permanently'
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}