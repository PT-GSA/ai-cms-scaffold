import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withInputSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'

// Export handlers with sanitization
export const PUT = withInputSanitization(putHandler);

/**
 * PUT /api/user-password
 * Update password user
 */
async function putHandler(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Gunakan sanitized body jika tersedia
    const sanitizedBody = getSanitizedBody(request);
    const body = sanitizedBody || await request.json()

    const { current_password, new_password } = body

    // Validasi input
    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: 'current_password and new_password are required' },
        { status: 400 }
      )
    }

    // Validasi panjang password
    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
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

    // Update password
    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      password: new_password
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please check your current password.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
