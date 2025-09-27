import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client untuk validasi API key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Middleware untuk validasi API key di public endpoints
 */
export async function validateApiKey(request: NextRequest): Promise<{
  isValid: boolean
  error?: string
  apiKeyData?: any
}> {
  try {
    // Ambil API key dari header
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return {
        isValid: false,
        error: 'API key is required. Please provide x-api-key header or Authorization Bearer token.'
      }
    }

    // Validasi API key di database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, key_name, key_type, key_value, is_active, expires_at, last_used_at')
      .eq('key_value', apiKey)
      .single()

    if (keyError || !keyData) {
      return {
        isValid: false,
        error: 'Invalid API key'
      }
    }

    // Cek apakah API key aktif
    if (!keyData.is_active) {
      return {
        isValid: false,
        error: 'API key is inactive'
      }
    }

    // Cek apakah API key expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return {
        isValid: false,
        error: 'API key has expired'
      }
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id)

    return {
      isValid: true,
      apiKeyData: keyData
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return {
      isValid: false,
      error: 'Internal server error during API key validation'
    }
  }
}

/**
 * Higher-order function untuk wrap API handlers dengan validasi API key
 */
export function withApiKeyValidation<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const validation = await validateApiKey(request)
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    // Tambahkan API key data ke request untuk digunakan di handler
    ;(request as any).apiKeyData = validation.apiKeyData

    return handler(request, ...args)
  }
}
