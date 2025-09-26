import { NextRequest, NextResponse } from 'next/server'

/**
 * Konfigurasi CORS yang aman untuk production
 * Mendukung multiple origins dan environment-specific settings
 */
export interface CorsOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

/**
 * Default CORS configuration
 */
const DEFAULT_CORS_OPTIONS: CorsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}

/**
 * Mendapatkan allowed origins berdasarkan environment
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = []
  
  // Development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    )
  }
  
  // Production origins dari environment variables
  if (process.env.CORS_ALLOWED_ORIGINS) {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0)
    origins.push(...envOrigins)
  }
  
  // Default production domain jika ada
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL)
  }
  
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }
  
  return origins
}

/**
 * Mengecek apakah origin diizinkan
 */
function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false
  
  // Exact match
  if (allowedOrigins.includes(origin)) return true
  
  // Pattern matching untuk subdomain
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(origin)
    }
    return false
  })
}

/**
 * Menambahkan CORS headers ke response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  options: CorsOptions = {}
): NextResponse {
  const corsOptions = { ...DEFAULT_CORS_OPTIONS, ...options }
  const allowedOrigins = getAllowedOrigins()
  const origin = request.headers.get('origin')
  
  // Set Access-Control-Allow-Origin
  if (corsOptions.origin === true) {
    response.headers.set('Access-Control-Allow-Origin', '*')
  } else if (corsOptions.origin === false) {
    // No CORS
  } else if (typeof corsOptions.origin === 'string') {
    response.headers.set('Access-Control-Allow-Origin', corsOptions.origin)
  } else if (Array.isArray(corsOptions.origin)) {
    if (origin && corsOptions.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
  } else {
    // Default behavior: check against allowed origins
    if (origin && isOriginAllowed(origin, allowedOrigins)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
  }
  
  // Set other CORS headers
  if (corsOptions.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  if (corsOptions.methods) {
    response.headers.set('Access-Control-Allow-Methods', corsOptions.methods.join(', '))
  }
  
  if (corsOptions.allowedHeaders) {
    response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '))
  }
  
  if (corsOptions.maxAge) {
    response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString())
  }
  
  // Vary header untuk caching
  response.headers.set('Vary', 'Origin')
  
  return response
}

/**
 * Middleware helper untuk menangani preflight requests
 */
export function handleCorsPreflightRequest(
  request: NextRequest,
  options: CorsOptions = {}
): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    return addCorsHeaders(response, request, options)
  }
  return null
}

/**
 * Higher-order function untuk API routes dengan CORS
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  options: CorsOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight request
    const preflightResponse = handleCorsPreflightRequest(request, options)
    if (preflightResponse) {
      return preflightResponse
    }
    
    // Execute the actual handler
    const response = await handler(request)
    
    // Add CORS headers to the response
    return addCorsHeaders(response, request, options)
  }
}