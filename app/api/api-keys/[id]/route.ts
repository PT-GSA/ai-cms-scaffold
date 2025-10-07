import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/api-keys/[id]
 * Reveal API key (nilai asli) milik user yang sedang login
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Ambil API key asli untuk id yang diminta milik user
    const { data: key, error } = await supabase
      .from('api_keys')
      .select('id, key_name, key_type, key_value, key_prefix, is_active, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching API key:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: key
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
 * DELETE /api/api-keys/[id]
 * Hapus API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Delete API key (hanya milik user yang login)
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting API key:', error)
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
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
 * PUT /api/api-keys/[id]
 * Update API key (toggle active/inactive)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params
    const body = await request.json()
    const { is_active } = body

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Update API key status
    const { data: updatedKey, error } = await supabase
      .from('api_keys')
      .update({ is_active: is_active })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating API key:', error)
      return NextResponse.json(
        { error: 'Failed to update API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedKey,
      message: 'API key updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
