import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { withCors } from '@/lib/cors'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * POST /api/schema/apply-relations
 * Apply content relations schema to database
 */
async function postHandler() {
  try {
    const supabase = createServiceClient()

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'scripts', '006_content_relations_schema.sql')
    const relationsSchema = await fs.readFile(schemaPath, 'utf-8')

    // Execute schema using execute_sql function
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: relationsSchema
    })

    if (error) {
      console.error('Error executing content relations schema:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to execute content relations schema',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content relations schema applied successfully',
      features: [
        'Content Relations Definitions dengan One-to-One, One-to-Many, Many-to-Many support',
        'Advanced relation constraints dan validation',
        'Cascade behavior configuration (cascade, set_null, restrict, no_action)', 
        'Bidirectional relations dengan target field mapping',
        'Bulk relations creation dan management',
        'Deep relation fetching dengan metadata',
        'Auto-generated search vectors dan relation summaries',
        'Row Level Security policies untuk secure access',
        'Performance optimized dengan proper indexes dan triggers',
        'Content versioning integration dan cascade handling'
      ]
    })

  } catch (error) {
    console.error('Unexpected error applying content relations schema:', error)
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

// Export with CORS support
export const POST = withCors(postHandler)
