import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'
import { withRBAC, Permission, UserRole, getUserProfileFromRequest } from '@/lib/rbac-middleware'
import { withInputSanitization, getSanitizedBody } from '@/lib/input-sanitizer-middleware'

// Supabase client untuk team management
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * PUT /api/team/members/[id]
 * Update role atau status member
 */
async function updateMemberHandler(
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
    const sanitizedBody = getSanitizedBody(request)
    const body = sanitizedBody || await request.json()
    const { role, status } = body

    // Validasi input
    if (!role && !status) {
      return NextResponse.json(
        { error: 'Role or status is required' },
        { status: 400 }
      )
    }

    // Cek apakah member ada
    const { data: member, error: memberError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cek apakah user tidak bisa mengubah role super admin
    if (member.role === UserRole.SUPER_ADMIN && userProfile.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Cannot modify super admin role' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: { role?: UserRole; status?: 'active' | 'inactive' | 'suspended' } = {}
    if (role) {
      const validRoles = Object.values(UserRole)
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
      updateData.role = role
    }
    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    // Update member
    const { data: updatedMember, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating member:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: userProfile.user_id,
      p_action: 'member_updated',
      p_resource_type: 'user_profile',
      p_resource_id: id,
      p_details: {
        updated_fields: updateData,
        previous_data: member
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: 'Member updated successfully'
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
 * DELETE /api/team/members/[id]
 * Hapus member dari tim
 */
async function deleteMemberHandler(
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

    // Cek apakah member ada
    const { data: member, error: memberError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cek apakah user tidak bisa menghapus super admin
    if (member.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Cannot delete super admin' },
        { status: 403 }
      )
    }

    // Cek apakah user tidak bisa menghapus dirinya sendiri
    if (member.user_id === userProfile.user_id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      )
    }

    // Update status menjadi inactive (soft delete)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (updateError) {
      console.error('Error deleting member:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete member' },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: userProfile.user_id,
      p_action: 'member_deleted',
      p_resource_type: 'user_profile',
      p_resource_id: id,
      p_details: {
        deleted_member: member
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export dengan CORS dan RBAC protection - menggunakan wrapper function untuk dynamic routes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req: NextRequest) => {
    const rbacHandler = withRBAC(Permission.USER_UPDATE, updateMemberHandler);
    const sanitizedHandler = withInputSanitization(async (sanitizedReq: NextRequest) => {
      return rbacHandler(sanitizedReq, { params });
    });
    return sanitizedHandler(req);
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async (req: NextRequest) => {
    const rbacHandler = withRBAC(Permission.USER_DELETE, deleteMemberHandler);
    return rbacHandler(req, { params });
  })(request);
}
