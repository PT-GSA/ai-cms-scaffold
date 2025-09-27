import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'
import { getUserProfileFromRequest } from '@/lib/rbac-middleware'

// Supabase client untuk invitations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * DELETE /api/team/invitations/[id]
 * Batalkan undangan berdasarkan ID
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

// Export dengan CORS protection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req: NextRequest) => {
    return cancelInvitationHandler(req, { params })
  })(request)
}
