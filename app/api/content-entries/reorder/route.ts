import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entries } = body

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid entries data'
      }, { status: 400 })
    }

    // Update order for each entry
    const updatePromises = entries.map((entry: { id: string; order: number }) => {
      return supabase
        .from('content_entries')
        .update({ 
          display_order: entry.order,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)
    })

    const results = await Promise.all(updatePromises)

    // Check if any update failed
    const failedUpdates = results.filter(result => result.error)
    if (failedUpdates.length > 0) {
      console.error('Some updates failed:', failedUpdates)
      return NextResponse.json({
        success: false,
        error: 'Failed to update some entries'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Entries reordered successfully',
      data: {
        updated_count: entries.length
      }
    })

  } catch (error) {
    console.error('Error reordering entries:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
