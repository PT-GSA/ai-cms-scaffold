import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'
import { withRBAC, Permission, getUserProfileFromRequest } from '@/lib/rbac-middleware'

// Supabase client untuk invitations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/team/invitations
 * Ambil daftar undangan tim
 */
async function getInvitationsHandler(request: NextRequest) {
  try {
    const userProfile = await getUserProfileFromRequest(request)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Ambil daftar undangan
    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        role,
        status,
        invited_at,
        expires_at,
        accepted_at,
        invited_by,
        inviter:invited_by (
          user_profiles!user_profiles_user_id_fkey (
            display_name,
            auth_users:user_id (
              email
            )
          )
        )
      `)
      .order('invited_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    // Transform data untuk response
    const transformedInvitations = invitations?.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      invited_by: invitation.inviter?.[0]?.user_profiles?.[0]?.auth_users?.[0]?.email,
      invited_at: invitation.invited_at,
      expires_at: invitation.expires_at,
      accepted_at: invitation.accepted_at
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedInvitations
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
 * DELETE /api/team/invitations/[id]
 * Batalkan undangan
 */
async function cancelInvitationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userProfile = await getUserProfileFromRequest(request)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Cek apakah undangan ada
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Cek apakah undangan sudah expired atau accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation is not pending' },
        { status: 400 }
      )
    }

    // Update status menjadi cancelled
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: userProfile.user_id,
      p_action: 'invitation_cancelled',
      p_resource_type: 'invitation',
      p_resource_id: id,
      p_details: {
        cancelled_invitation: invitation
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export dengan CORS dan RBAC protection
export const GET = withCors(withRBAC(Permission.TEAM_VIEW, getInvitationsHandler))
