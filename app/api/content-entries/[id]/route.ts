import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { withContentSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'

// Type definitions
interface ContentTypeField {
  id: string
  field_name: string
  field_type: string
  display_name: string
  is_required?: boolean
}

interface ContentEntryValue {
  id: string
  content_type_field_id: string
  text_value: string | null
  number_value: number | null
  boolean_value: boolean | null
  date_value: string | null
  datetime_value: string | null
  json_value: unknown | null
  content_type_fields: ContentTypeField
}



/**
 * GET /api/content-entries/[id]
 * Mengambil content entry berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const includeFields = searchParams.get('include_fields') === 'true'

    // Fetch content entry dengan atau tanpa field values
    const query = supabase
      .from('content_entries')
      .select('*, content_entry_values(*, content_type_fields(*))')
      .eq('id', id)
      .single()

    const { data, error } = await query

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content entry not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching content entry:', error)
      return NextResponse.json(
        { error: 'Failed to fetch content entry' },
        { status: 500 }
      )
    }

    // Get content type information
    const { data: contentType } = await supabase
      .from('content_types')
      .select('id, name, display_name, icon')
      .eq('id', data.content_type_id)
      .single()

    // Handle fields - check if using data column or content_entry_values table
    let fieldsObject: Record<string, unknown> = {}
    
    if (data.data) {
      // Use data column (legacy structure)
      fieldsObject = data.data as Record<string, unknown>
    } else if (includeFields && data && 'content_entry_values' in data && Array.isArray(data.content_entry_values)) {
      // Transform field values dari content_entry_values table
      data.content_entry_values.forEach((value: ContentEntryValue) => {
        const fieldName = value.content_type_fields.field_name
        const fieldType = value.content_type_fields.field_type
        
        // Ambil nilai berdasarkan tipe field
        let fieldValue: unknown = null
        switch (fieldType) {
          case 'text':
          case 'textarea':
          case 'rich_text':
          case 'select':
            fieldValue = value.text_value
            break
          case 'number':
            fieldValue = value.number_value
            break
          case 'boolean':
            fieldValue = value.boolean_value
            break
          case 'date':
            fieldValue = value.date_value
            break
          case 'datetime':
            fieldValue = value.datetime_value
            break
          case 'multi_select':
          case 'media':
          case 'relation':
            fieldValue = value.json_value
            break
          default:
            fieldValue = value.text_value
        }
        
        fieldsObject[fieldName] = fieldValue
      })
    }
    
    // Create transformed data object
    const transformedData = {
      ...data,
      title: (fieldsObject.title as string) || data.title || '', // Ambil title dari data JSONB atau fallback ke kolom title
      content_type: contentType,
      fields: fieldsObject
    }
    delete (transformedData as { content_entry_values?: unknown }).content_entry_values

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with sanitization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Buat wrapper untuk sanitization
  const sanitizedHandler = withContentSanitization(async (req: NextRequest) => {
    return putHandler(req, { params });
  });
  
  return sanitizedHandler(request);
}

/**
 * PUT /api/content-entries/[id]
 * Update content entry berdasarkan ID
 */
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabaseClient()
    
    // Gunakan sanitized body jika tersedia
    const sanitizedBody = getSanitizedBody(request);
    const body = sanitizedBody || await request.json()
    
    const { title, slug, status, field_values } = body

    // Validasi input minimal untuk update
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Update content entry dengan minimal changes untuk menghindari trigger error
    const updateData: Record<string, unknown> = {}
    
    // Hanya update field yang benar-benar diperlukan
    if (slug && slug !== '') {
      updateData.slug = slug
    }
    
    if (status) {
      updateData.status = status
    }
    
    // Update kolom data dengan field values jika ada, termasuk title
    if (field_values && Object.keys(field_values).length > 0) {
      // Ambil data yang sudah ada terlebih dahulu
      const { data: existingEntry } = await supabase
        .from('content_entries')
        .select('data')
        .eq('id', id)
        .single()
      
      const existingData = (existingEntry?.data as Record<string, unknown>) || {}
      
      // Merge dengan data baru, termasuk title jika ada
      const newData = { ...existingData, ...(field_values as Record<string, unknown>) }
      if (title && title !== '') {
        newData.title = title
      }
      
      updateData.data = newData
    } else if (title && title !== '') {
      // Jika hanya title yang diupdate tanpa field_values
      const { data: existingEntry } = await supabase
        .from('content_entries')
        .select('data')
        .eq('id', id)
        .single()
      
      const existingData = (existingEntry?.data as Record<string, unknown>) || {}
      updateData.data = { ...existingData, title }
    }
    
    // Hanya update jika ada data yang akan diupdate
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No data to update' },
        { status: 400 }
      )
    }

    // Update content entry - skip versioning untuk sementara
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (entryError) {
      if (entryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content entry not found' },
          { status: 404 }
        )
      }
      console.error('Error updating content entry:', entryError)
      return NextResponse.json(
        { error: 'Failed to update content entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content entry updated successfully',
      data: entry
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
 * DELETE /api/content-entries/[id]
 * Hapus content entry berdasarkan ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabaseClient()

    // Delete content entry (cascade akan menghapus field values)
    const { error } = await supabase
      .from('content_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting content entry:', error)
      return NextResponse.json(
        { error: 'Failed to delete content entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content entry deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
