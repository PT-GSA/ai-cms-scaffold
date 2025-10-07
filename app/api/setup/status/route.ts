import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'

// Menggunakan service role untuk bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/setup/status
 * Memeriksa status database dan content types
 */
async function getHandler() {
  try {
    console.log('🔍 Memeriksa status database...')

    // 1. Cek apakah tabel content_types ada
    const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('content_types', 'content_type_fields', 'content_entries')
        ORDER BY table_name;
      `
    })

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to check database tables',
          details: tablesError.message 
        },
        { status: 500 }
      )
    }

    const existingTables = Array.isArray(tables) ? tables.map((row: any) => row.table_name) : []
    const hasContentTypesTable = existingTables.includes('content_types')
    const hasContentTypeFieldsTable = existingTables.includes('content_type_fields')
    const hasContentEntriesTable = existingTables.includes('content_entries')

    // 2. Jika tabel ada, cek data content types
    let contentTypesData = null
    let contentTypesCount = 0
    let fieldsCount = 0

    if (hasContentTypesTable) {
      const { data: contentTypes, error: contentTypesError } = await supabase
        .from('content_types')
        .select(`
          id,
          name,
          display_name,
          description,
          icon,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('name')

      if (contentTypesError) {
        console.warn('Warning: Could not fetch content types:', contentTypesError)
      } else {
        contentTypesData = contentTypes
        contentTypesCount = contentTypes?.length || 0
      }

      // Cek jumlah fields
      if (hasContentTypeFieldsTable) {
        const { data: fields, error: fieldsError } = await supabase
          .from('content_type_fields')
          .select('id')
          .eq('is_active', true)

        if (fieldsError) {
          console.warn('Warning: Could not fetch fields count:', fieldsError)
        } else {
          fieldsCount = fields?.length || 0
        }
      }
    }

    // 3. Status keseluruhan
    const isDatabaseInitialized = hasContentTypesTable && hasContentTypeFieldsTable && hasContentEntriesTable
    const hasContentTypes = contentTypesCount > 0
    const isReady = isDatabaseInitialized && hasContentTypes

    const status = {
      database: {
        initialized: isDatabaseInitialized,
        tables: {
          content_types: hasContentTypesTable,
          content_type_fields: hasContentTypeFieldsTable,
          content_entries: hasContentEntriesTable
        }
      },
      content_types: {
        exists: hasContentTypes,
        count: contentTypesCount,
        fields_count: fieldsCount,
        data: contentTypesData
      },
      overall: {
        ready: isReady,
        needs_setup: !isReady
      }
    }

    console.log('✅ Database status check completed')

    return NextResponse.json({
      success: true,
      message: 'Database status berhasil diperiksa',
      status
    })

  } catch (error) {
    console.error('Unexpected error during status check:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during status check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Export dengan CORS support
export const GET = withCors(getHandler)
