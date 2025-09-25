import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

interface ContentEntryField {
  field_name: string
  field_type: string
  value: string | number | boolean | Date | null
}

interface CreateContentEntryRequest {
  content_type_id: number
  title: string
  slug?: string
  status?: 'draft' | 'published' | 'archived'
  fields: ContentEntryField[]
  published_at?: string
}

/**
 * GET /api/content-entries
 * Fetch content entries dengan filtering dan pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const contentTypeId = searchParams.get('content_type_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const includeFields = searchParams.get('include_fields') === 'true'
    
    const offset = (page - 1) * limit

    // Base query - menggunakan struktur database yang ada (dengan kolom data JSONB)
    let baseSelect = `
      id,
      content_type_id,
      slug,
      status,
      data,
      meta_data,
      published_at,
      created_by,
      updated_by,
      created_at,
      updated_at,
      content_types!inner (
        id,
        name,
        display_name,
        icon
      )
    `

    if (includeFields) {
      baseSelect += `,
      content_type_fields (
        id,
        field_name,
        display_name,
        field_type,
        is_required,
        is_unique,
        field_options
      )`
    }

    let query = supabase
      .from('content_entries')
      .select(baseSelect)

    // Apply filters
    if (contentTypeId) {
      query = query.eq('content_type_id', contentTypeId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      // Search dalam kolom data JSONB untuk title atau dalam slug
      query = query.or(`data->>title.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    // Apply pagination dan ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Fetch data dengan type assertion yang lebih aman
    const { data: entries, error, count } = await query

    if (error) {
      console.error('Error fetching content entries:', error)
      return NextResponse.json(
        { error: 'Gagal mengambil data content entries' },
        { status: 500 }
      )
    }

    // Transform data untuk response
    const transformedEntries = entries?.map((entry: any) => {
      const baseEntry = {
        id: entry.id,
        content_type_id: entry.content_type_id,
        title: entry.data?.title || 'Untitled', // Ambil title dari data JSONB
        slug: entry.slug,
        status: entry.status,
        data: entry.data,
        meta_data: entry.meta_data,
        published_at: entry.published_at,
        created_by: entry.created_by,
        updated_by: entry.updated_by,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        content_type: entry.content_types
      }

      if (includeFields && entry.content_entry_values) {
        const fieldValues: Record<string, any> = {}
        entry.content_entry_values.forEach((value: any) => {
          const field = value.content_type_fields
          if (field) {
            fieldValues[field.field_name] = {
              value: value.text_value || value.number_value || value.boolean_value || 
                     value.date_value || value.datetime_value || value.json_value,
              field_type: field.field_type,
              display_name: field.display_name
            }
          }
        })
        return { ...baseEntry, field_values: fieldValues }
      }

      return baseEntry
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedEntries,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/content-entries:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/content-entries
 * Create new content entry
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    const body: CreateContentEntryRequest = await request.json()

    const { 
      content_type_id, 
      title, 
      slug, 
      status = 'draft', 
      fields = [],
      published_at 
    } = body

    // Validasi input
    if (!content_type_id || !title) {
      return NextResponse.json(
        { success: false, error: 'content_type_id and title are required' },
        { status: 400 }
      )
    }

    // Verify content type exists
    const { data: contentType, error: contentTypeError } = await supabase
      .from('content_types')
      .select('id, name')
      .eq('id', content_type_id)
      .eq('is_active', true)
      .single()

    if (contentTypeError || !contentType) {
      return NextResponse.json(
        { success: false, error: 'Content type not found or inactive' },
        { status: 404 }
      )
    }

    // Generate slug jika tidak disediakan
    let finalSlug = slug
    if (!finalSlug) {
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_slug', {
          title: title,
          content_type_id: content_type_id
        })

      if (slugError) {
        console.error('Error generating slug:', slugError)
        return NextResponse.json(
          { success: false, error: 'Failed to generate slug' },
          { status: 500 }
        )
      }

      finalSlug = slugData
    }

    // Create content entry - menggunakan struktur database yang ada (tanpa kolom title)
    const entryData = {
      content_type_id,
      slug: finalSlug,
      status,
      published_at: status === 'published' && published_at ? published_at : null,
      data: { title, ...Object.fromEntries(fields.map(f => [f.field_name, f.value])) } // Store title dan fields dalam JSONB data
      // Tidak menggunakan created_by dan updated_by untuk sementara karena belum ada user auth
    }

    const { data: entry, error: entryError } = await supabase
      .from('content_entries')
      .insert(entryData)
      .select()
      .single()

    if (entryError) {
      console.error('Error creating content entry:', entryError)
      return NextResponse.json(
        { success: false, error: 'Failed to create content entry' },
        { status: 500 }
      )
    }

    // Return success response dengan entry yang dibuat
    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Content entry created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/content-entries:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}