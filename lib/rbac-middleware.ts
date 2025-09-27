import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Extended NextRequest interface to include userProfile
interface ExtendedNextRequest extends NextRequest {
  userProfile?: UserProfile
}

// Supabase client untuk RBAC
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Enum untuk user roles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  VIEWER = 'viewer'
}

// Enum untuk permissions
export enum Permission {
  // User Management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',
  
  // Content Management
  CONTENT_VIEW = 'content:view',
  CONTENT_CREATE = 'content:create',
  CONTENT_UPDATE = 'content:update',
  CONTENT_DELETE = 'content:delete',
  CONTENT_PUBLISH = 'content:publish',
  
  // Content Types
  CONTENT_TYPE_VIEW = 'content_type:view',
  CONTENT_TYPE_CREATE = 'content_type:create',
  CONTENT_TYPE_UPDATE = 'content_type:update',
  CONTENT_TYPE_DELETE = 'content_type:delete',
  
  // Media Management
  MEDIA_VIEW = 'media:view',
  MEDIA_UPLOAD = 'media:upload',
  MEDIA_DELETE = 'media:delete',
  
  // Team Management
  TEAM_VIEW = 'team:view',
  TEAM_MANAGE = 'team:manage',
  
  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  
  // API Management
  API_KEY_VIEW = 'api_key:view',
  API_KEY_CREATE = 'api_key:create',
  API_KEY_DELETE = 'api_key:delete'
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // All permissions
  [UserRole.ADMIN]: [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_INVITE,
    Permission.CONTENT_VIEW,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.CONTENT_TYPE_VIEW,
    Permission.CONTENT_TYPE_CREATE,
    Permission.CONTENT_TYPE_UPDATE,
    Permission.CONTENT_TYPE_DELETE,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_DELETE,
    Permission.TEAM_VIEW,
    Permission.TEAM_MANAGE,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.ANALYTICS_VIEW,
    Permission.API_KEY_VIEW,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_DELETE
  ],
  [UserRole.EDITOR]: [
    Permission.CONTENT_VIEW,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.CONTENT_TYPE_VIEW,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.API_KEY_VIEW,
    Permission.API_KEY_CREATE
  ],
  [UserRole.AUTHOR]: [
    Permission.CONTENT_VIEW,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.API_KEY_VIEW,
    Permission.API_KEY_CREATE
  ],
  [UserRole.VIEWER]: [
    Permission.CONTENT_VIEW,
    Permission.CONTENT_TYPE_VIEW,
    Permission.MEDIA_VIEW,
    Permission.API_KEY_VIEW
  ]
}

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  avatar_url?: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
  permissions: Record<string, boolean>
  last_active_at?: string
  created_at: string
  updated_at: string
}

/**
 * Middleware untuk validasi RBAC permissions
 */
export async function validatePermission(
  request: NextRequest,
  requiredPermission: Permission
): Promise<{
  hasPermission: boolean
  userProfile?: UserProfile
  error?: string
}> {
  try {
    // Ambil user dari request (bisa dari session atau API key)
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return {
        hasPermission: false,
        error: 'User not authenticated'
      }
    }

    // Ambil user profile dari database
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (profileError || !userProfile) {
      return {
        hasPermission: false,
        error: 'User profile not found or inactive'
      }
    }

    // Cek apakah user memiliki permission yang diperlukan
    const userPermissions = ROLE_PERMISSIONS[userProfile.role as UserRole] || []
    const hasPermission = userPermissions.includes(requiredPermission)

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: userId,
      p_action: 'permission_check',
      p_resource_type: 'permission',
      p_details: {
        required_permission: requiredPermission,
        user_role: userProfile.role,
        has_permission: hasPermission
      },
      p_ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      p_user_agent: request.headers.get('user-agent')
    })

    return {
      hasPermission,
      userProfile: userProfile as UserProfile
    }
  } catch (error) {
    console.error('Error validating permission:', error)
    return {
      hasPermission: false,
      error: 'Internal server error during permission validation'
    }
  }
}

/**
 * Higher-order function untuk wrap API handlers dengan RBAC validation
 */
export function withRBAC<T extends unknown[]>(
  requiredPermission: Permission,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const validation = await validatePermission(request, requiredPermission)
    
    if (!validation.hasPermission) {
      return NextResponse.json(
        { 
          error: validation.error || 'Insufficient permissions',
          required_permission: requiredPermission
        },
        { status: 403 }
      )
    }

    // Tambahkan user profile ke request untuk digunakan di handler
    ;(request as ExtendedNextRequest).userProfile = validation.userProfile

    return handler(request, ...args)
  }
}

/**
 * Middleware untuk validasi multiple permissions (user harus memiliki salah satu)
 */
export function withAnyRBAC<T extends unknown[]>(
  requiredPermissions: Permission[],
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const userId = await getUserIdFromRequest(request)
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (profileError || !userProfile) {
        return NextResponse.json(
          { error: 'User profile not found or inactive' },
          { status: 403 }
        )
      }

      const userPermissions = ROLE_PERMISSIONS[userProfile.role as UserRole] || []
      const hasAnyPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      )

      if (!hasAnyPermission) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            required_permissions: requiredPermissions
          },
          { status: 403 }
        )
      }

      ;(request as ExtendedNextRequest).userProfile = userProfile as UserProfile
      return handler(request, ...args)
    } catch (error) {
      console.error('Error validating permissions:', error)
      return NextResponse.json(
        { error: 'Internal server error during permission validation' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper function untuk mendapatkan user ID dari request
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Cek apakah ada session cookie
    const sessionCookie = request.cookies.get('sb-access-token')
    if (sessionCookie) {
      // TODO: Decode session token untuk mendapatkan user ID
      // Untuk sekarang, kita akan menggunakan cara lain
    }

    // Cek apakah ada API key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey) {
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('key_value', apiKey)
        .eq('is_active', true)
        .single()

      if (!error && keyData) {
        return keyData.user_id
      }
    }

    // Cek Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Validate JWT token dan extract user ID
    }

    return null
  } catch (error) {
    console.error('Error getting user ID from request:', error)
    return null
  }
}

/**
 * Helper function untuk mendapatkan user profile dari request
 */
export async function getUserProfileFromRequest(request: NextRequest): Promise<UserProfile | null> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return null

  const { data: userProfile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !userProfile) return null
  return userProfile as UserProfile
}

/**
 * Helper function untuk cek apakah user adalah admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const userProfile = await getUserProfileFromRequest(request)
  return userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.SUPER_ADMIN
}

/**
 * Helper function untuk cek apakah user adalah super admin
 */
export async function isSuperAdmin(request: NextRequest): Promise<boolean> {
  const userProfile = await getUserProfileFromRequest(request)
  return userProfile?.role === UserRole.SUPER_ADMIN
}
