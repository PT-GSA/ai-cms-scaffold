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

interface ContentType {
  id: string
  name: string
  display_name: string
  icon: string | null
  content_type_fields?: ContentTypeField[]
}

interface ContentEntryData {
  id: string
  content_type_id: string
  title: string
  slug: string
  status: string
  published_at: string | null
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  content_types: ContentType
  content_entry_values?: ContentEntryValue[]
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
      .select(`
        id,
        content_type_id,
        title,
        slug,
        status,
        published_at,
        created_by,
        updated_by,
        created_at,
        updated_at,
        content_types!inner(
          id,
          name,
          display_name,
          icon
        )
        ${includeFields ? `, content_entry_values(
          id,
          content_type_field_id,
          text_value,
          number_value,
          boolean_value,
          date_value,
          datetime_value,
          json_value,
          content_type_fields!inner(
            id,
            field_name,
            field_type,
            display_name
          )
        )` : ''}
      `)
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

    // Transform field values jika includeFields true
    if (includeFields && data && 'content_entry_values' in data && Array.isArray(data.content_entry_values)) {
      const fieldValues: Record<string, unknown> = {}

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
        
        fieldValues[fieldName] = fieldValue
      })
      
      // Create transformed data object
      const transformedData = {
        ...(data as unknown as ContentEntryData),
        field_values: fieldValues
      }
      delete transformedData.content_entry_values
      
      return NextResponse.json({
        success: true,
        data: transformedData
      })
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
    
    const { title, slug, status, published_at, field_values } = body

    // Validasi input
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Update content entry
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .update({
        title,
        slug,
        status,
        published_at: status === 'published' && !published_at ? new Date().toISOString() : published_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        content_type_id,
        title,
        slug,
        status,
        content_types!inner(
          id,
          name,
          display_name,
          content_type_fields(
            id,
            field_name,
            field_type,
            display_name,
            is_required
          )
        )
      `)
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

    // Update field values jika ada
    if (field_values && Object.keys(field_values).length > 0) {
      // Get field definitions
      const fieldMap = new Map()
      const contentType = entry.content_types as unknown as ContentType
      if (contentType && contentType.content_type_fields) {
        contentType.content_type_fields.forEach((field: ContentTypeField) => {
          fieldMap.set(field.field_name, field)
        })
      }

      // Delete existing field values
      const { error: deleteError } = await supabase
        .from('content_entry_values')
        .delete()
        .eq('content_entry_id', id)

      if (deleteError) {
        console.error('Error deleting old field values:', deleteError)
        return NextResponse.json(
          { error: 'Failed to update field values' },
          { status: 500 }
        )
      }

      // Insert new field values
      const fieldValuesToInsert = Object.entries(field_values).map(([fieldName, value]) => {
        const fieldDef = fieldMap.get(fieldName)
        if (!fieldDef) {
          throw new Error(`Field ${fieldName} not found in content type`)
        }

        const entryValue: Record<string, unknown> = {
          content_entry_id: id,
          content_type_field_id: fieldDef.id,
        }

        // Set nilai berdasarkan tipe field
        switch (fieldDef.field_type) {
          case 'text':
          case 'textarea':
          case 'rich_text':
          case 'select':
            entryValue.text_value = value
            break
          case 'number':
            entryValue.number_value = typeof value === 'string' ? parseFloat(value as string) : value
            break
          case 'boolean':
            entryValue.boolean_value = typeof value === 'string' ? value === 'true' : value
            break
          case 'date':
            entryValue.date_value = value
            break
          case 'datetime':
            entryValue.datetime_value = value
            break
          case 'multi_select':
          case 'media':
          case 'relation':
            entryValue.json_value = typeof value === 'string' ? JSON.parse(value as string) : value
            break
          default:
            entryValue.text_value = value
        }

        return entryValue
      })

      const { error: valuesError } = await supabase
        .from('content_entry_values')
        .insert(fieldValuesToInsert)

      if (valuesError) {
        console.error('Error inserting field values:', valuesError)
        return NextResponse.json(
          { error: 'Failed to update field values' },
          { status: 500 }
        )
      }
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