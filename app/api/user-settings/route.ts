import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withInputSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'

/**
 * GET /api/user-settings
 * Mengambil pengaturan user berdasarkan type
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const settingsType = searchParams.get('type') || 'all'

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('user_settings')
      .select('settings_type, settings_data, updated_at')
      .eq('user_id', user.id)

    if (settingsType !== 'all') {
      query = query.eq('settings_type', settingsType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching user settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user settings' },
        { status: 500 }
      )
    }

    // Transform data to object format
    const settings = data?.reduce((acc, item) => {
      acc[item.settings_type] = item.settings_data
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({
      success: true,
      data: settings
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
export const POST = withInputSanitization(postHandler);
export const PUT = withInputSanitization(putHandler);

/**
 * POST /api/user-settings
 * Membuat atau update pengaturan user
 */
async function postHandler(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Gunakan sanitized body jika tersedia
    const sanitizedBody = getSanitizedBody(request);
    const body = sanitizedBody || await request.json()

    const { settings_type, settings_data } = body

    // Validasi input
    if (!settings_type || !settings_data) {
      return NextResponse.json(
        { error: 'settings_type and settings_data are required' },
        { status: 400 }
      )
    }

    // Validasi settings_type
    const validTypes = ['profile', 'appearance', 'notifications', 'security']
    if (!validTypes.includes(settings_type)) {
      return NextResponse.json(
        { error: 'Invalid settings_type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
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

    // Insert or update settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings_type: settings_type,
        settings_data: settings_data
      }, {
        onConflict: 'user_id,settings_type'
      })
      .select()
      .single()

    if (settingsError) {
      console.error('Error saving user settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to save user settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings saved successfully'
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
 * PUT /api/user-settings
 * Update pengaturan user (alias untuk POST)
 */
async function putHandler(request: NextRequest) {
  return postHandler(request)
}
