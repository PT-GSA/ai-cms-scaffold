import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Slug is required'
      }, { status: 400 })
    }

    // Get content entry by slug
    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .select(`
        *,
        content_types (
          id,
          name,
          display_name,
          icon
        )
      `)
      .eq('slug', slug)
      .single()

    if (entryError) {
      console.error('Error fetching entry:', entryError)
      return NextResponse.json({
        success: false,
        error: 'Content entry tidak ditemukan'
      }, { status: 404 })
    }

    // Handle fields - check if using data column or content_entry_values table
    let fieldsObject: Record<string, unknown> = {}
    
    if (entry.data) {
      // Use data column (legacy structure)
      fieldsObject = entry.data
    } else {
      // Try to get fields from content_entry_values table
      const { data: fields, error: fieldsError } = await supabase
        .from('content_entry_values')
        .select(`
          text_value,
          number_value,
          boolean_value,
          date_value,
          datetime_value,
          json_value,
          content_type_fields (
            field_name,
            field_type
          )
        `)
        .eq('content_entry_id', entry.id)

      if (fieldsError) {
        console.error('Error fetching fields:', fieldsError)
        // Don't fail if fields table doesn't exist, just use empty object
        fieldsObject = {}
      } else {
        // Transform fields into object
        fields.forEach(field => {
          // Get the actual value based on field type
          let value = null
          if (field.text_value !== null) value = field.text_value
          else if (field.number_value !== null) value = field.number_value
          else if (field.boolean_value !== null) value = field.boolean_value
          else if (field.date_value !== null) value = field.date_value
          else if (field.datetime_value !== null) value = field.datetime_value
          else if (field.json_value !== null) value = field.json_value
          
          // Type assertion untuk mengatasi error TypeScript - content_type_fields adalah object, bukan array
          const contentTypeField = field.content_type_fields as unknown as { field_name: string; field_type: string } | null
          if (contentTypeField?.field_name) {
            fieldsObject[contentTypeField.field_name] = value
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...entry,
        fields: fieldsObject
      }
    })

  } catch (error) {
    console.error('Error in GET /api/content-entries/slug/[slug]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
