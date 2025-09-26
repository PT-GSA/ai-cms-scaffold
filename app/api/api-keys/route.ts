import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withInputSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'

/**
 * GET /api/api-keys
 * Mengambil daftar API keys user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, key_name, key_type, key_value, key_prefix, is_active, last_used_at, expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    // Mask key values untuk security (hanya tampilkan prefix dan beberapa karakter)
    const maskedKeys = apiKeys?.map(key => ({
      ...key,
      key_value: key.key_value.substring(0, 8) + '****-****-****-****'
    })) || []

    return NextResponse.json({
      success: true,
      data: maskedKeys
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

/**
 * POST /api/api-keys
 * Generate API key baru
 */
async function postHandler(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Gunakan sanitized body jika tersedia
    const sanitizedBody = getSanitizedBody(request);
    const body = sanitizedBody || await request.json()

    const { key_name, key_type = 'production' } = body

    // Validasi input
    if (!key_name) {
      return NextResponse.json(
        { error: 'key_name is required' },
        { status: 400 }
      )
    }

    // Validasi key_type
    const validTypes = ['production', 'development', 'test']
    if (!validTypes.includes(key_type)) {
      return NextResponse.json(
        { error: 'Invalid key_type. Must be one of: ' + validTypes.join(', ') },
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

    console.log('Creating new API key for user:', user.id)

    // Generate API key menggunakan function
    const { data: newKey, error: generateError } = await supabase
      .rpc('generate_api_key', {
        p_user_id: user.id,
        p_key_name: key_name,
        p_key_type: key_type
      })

    if (generateError) {
      console.error('Error generating API key:', generateError)
      return NextResponse.json(
        { error: 'Failed to generate API key' },
        { status: 500 }
      )
    }

    if (!newKey || newKey.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate API key' },
        { status: 500 }
      )
    }

    const generatedKey = newKey[0]

    return NextResponse.json({
      success: true,
      data: {
        id: generatedKey.id,
        key_name: generatedKey.key_name,
        key_type: generatedKey.key_type,
        key_value: generatedKey.key_value, // Full key hanya ditampilkan saat generate
        key_prefix: generatedKey.key_prefix,
        created_at: generatedKey.created_at
      },
      message: 'API key generated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
