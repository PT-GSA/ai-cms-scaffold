import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withInputSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'

/**
 * GET /api/user-profile
 * Mengambil profil user
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

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: user.created_at,
        updated_at: user.updated_at
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

// Export handlers with sanitization
export const PUT = withInputSanitization(putHandler);

/**
 * PUT /api/user-profile
 * Update profil user
 */
async function putHandler(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Gunakan sanitized body jika tersedia
    const sanitizedBody = getSanitizedBody(request);
    const body = sanitizedBody || await request.json()

    const { full_name, email } = body

    // Validasi input
    if (!full_name && !email) {
      return NextResponse.json(
        { error: 'At least one field (full_name or email) is required' },
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

    // Update user metadata
    const updateData: any = {}
    if (full_name) {
      updateData.full_name = full_name
    }
    if (email) {
      updateData.email = email
    }

    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      data: updateData
    })

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        full_name: updatedUser.user.user_metadata?.full_name || '',
        avatar_url: updatedUser.user.user_metadata?.avatar_url || null,
        created_at: updatedUser.user.created_at,
        updated_at: updatedUser.user.updated_at
      },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
