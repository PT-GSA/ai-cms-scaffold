import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'
import { withRBAC, Permission, UserRole, getUserProfileFromRequest } from '@/lib/rbac-middleware'
import { withInputSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'
import { emailService } from '@/lib/email-service'

// Supabase client untuk team management
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/team/members
 * Mengambil daftar anggota tim
 */
async function getTeamMembersHandler(request: NextRequest) {
  try {
    const userProfile = await getUserProfileFromRequest(request)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Ambil daftar anggota tim
    const { data: members, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        display_name,
        avatar_url,
        role,
        status,
        last_active_at,
        created_at,
        updated_at,
        auth_users:user_id (
          email
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching team members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Transform data untuk response
    const transformedMembers = members?.map(member => ({
      id: member.id,
      user_id: member.user_id,
      email: (member.auth_users as unknown as { email: string }[])?.[0]?.email,
      name: member.display_name,
      avatar: member.avatar_url,
      role: member.role,
      status: member.status,
      joined_at: member.created_at,
      last_active: member.last_active_at
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedMembers,
      count: transformedMembers.length
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
 * POST /api/team/members
 * Mengundang member baru ke tim
 */
async function inviteMemberHandler(request: NextRequest) {
  try {
    const userProfile = await getUserProfileFromRequest(request)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const sanitizedBody = getSanitizedBody(request)
    const body = sanitizedBody || await request.json()
    const { email, role = 'viewer' } = body

    // Validasi input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validasi role
    const validRoles = Object.values(UserRole)
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
      )
    }

    // Cek apakah user sudah ada
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in the system' },
        { status: 409 }
      )
    }

    // Cek apakah sudah ada undangan pending
    const { data: existingInvitation } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 409 }
      )
    }

    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invitation_token')

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Failed to generate invitation token' },
        { status: 500 }
      )
    }

    // Buat undangan
    const { data: invitation, error: createError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        role,
        invited_by: userProfile.user_id,
        token: tokenData,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating invitation:', createError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Kirim email undangan
    try {
      const emailSent = await emailService.sendInvitationEmail({
        email: invitation.email,
        token: invitation.token,
        role: invitation.role,
        inviterName: userProfile.display_name,
        inviterEmail: userProfile.user_id, // TODO: Get actual email from auth.users
        expiresAt: invitation.expires_at
      })

      if (!emailSent) {
        console.warn('Failed to send invitation email, but invitation was created')
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the request if email fails
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: userProfile.user_id,
      p_action: 'invitation_sent',
      p_resource_type: 'invitation',
      p_resource_id: invitation.id,
      p_details: {
        invited_email: email,
        role: role
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expires_at: invitation.expires_at
      },
      message: 'Invitation sent successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export dengan CORS dan RBAC protection
export const GET = withCors(withRBAC(Permission.TEAM_VIEW, getTeamMembersHandler))
export const POST = withCors(withInputSanitization(withRBAC(Permission.USER_INVITE, inviteMemberHandler)))
