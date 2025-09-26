import { NextRequest, NextResponse } from 'next/server';
import { sanitizeApiInput, sanitizeHTML, sanitizeString } from './input-sanitizer';

/**
 * Middleware untuk sanitasi input pada API routes
 */
export function withInputSanitization(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Clone request untuk modifikasi
      const clonedRequest = request.clone();
      
      // Sanitasi query parameters
      const url = new URL(request.url);
      const sanitizedSearchParams = new URLSearchParams();
      
      for (const [key, value] of url.searchParams.entries()) {
        const sanitizedKey = sanitizeString(key);
        const sanitizedValue = sanitizeString(value);
        sanitizedSearchParams.set(sanitizedKey, sanitizedValue);
      }
      
      // Update URL dengan sanitized params
      url.search = sanitizedSearchParams.toString();
      
      // Sanitasi request body jika ada
      let sanitizedBody: Record<string, unknown> | null = null;
      
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          const contentType = request.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            const body = await clonedRequest.json();
            sanitizedBody = sanitizeApiInput(body);
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await clonedRequest.formData();
            const formObject: Record<string, unknown> = {};
            
            for (const [key, value] of formData.entries()) {
              const sanitizedKey = sanitizeString(key);
              if (typeof value === 'string') {
                formObject[sanitizedKey] = sanitizeString(value);
              } else {
                formObject[sanitizedKey] = value; // File objects
              }
            }
            
            sanitizedBody = formObject;
          }
        } catch (error) {
          // Jika gagal parse body, lanjutkan dengan request asli
          console.warn('Failed to sanitize request body:', error);
        }
      }
      
      // Buat request baru dengan data yang sudah disanitasi
      const sanitizedRequest = new NextRequest(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined,
      });
      
      // Attach sanitized data ke request untuk digunakan handler
      const requestWithSanitizedData = sanitizedRequest as unknown as {
        sanitizedBody: Record<string, unknown> | null;
        sanitizedQuery: Record<string, string>;
      };
      requestWithSanitizedData.sanitizedBody = sanitizedBody;
      requestWithSanitizedData.sanitizedQuery = Object.fromEntries(sanitizedSearchParams);
      
      return await handler(sanitizedRequest);
    } catch (error) {
      console.error('Input sanitization middleware error:', error);
      
      // Jika sanitization gagal, tetap lanjutkan dengan request asli
      return await handler(request);
    }
  };
}

/**
 * Helper untuk mengambil sanitized body dari request
 */
export function getSanitizedBody(request: NextRequest): Record<string, unknown> | null {
  return (request as unknown as { sanitizedBody?: Record<string, unknown> | null }).sanitizedBody || null;
}

/**
 * Helper untuk mengambil sanitized query dari request
 */
export function getSanitizedQuery(request: NextRequest): Record<string, string> {
  return (request as unknown as { sanitizedQuery?: Record<string, string> }).sanitizedQuery || {};
}

/**
 * Middleware khusus untuk content creation/update yang memerlukan HTML sanitization
 */
export function withContentSanitization(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const clonedRequest = request.clone();
      
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          const contentType = request.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            const body = await clonedRequest.json();
            const sanitizedBody = sanitizeContentInput(body);
            
            const sanitizedRequest = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: JSON.stringify(sanitizedBody),
            });
            
            const requestWithData = sanitizedRequest as unknown as {
              sanitizedBody: Record<string, unknown> | null;
            };
            requestWithData.sanitizedBody = sanitizedBody;
            
            return await handler(sanitizedRequest);
          }
        } catch (error) {
          console.warn('Failed to sanitize content body:', error);
        }
      }
      
      return await handler(request);
    } catch (error) {
      console.error('Content sanitization middleware error:', error);
      return await handler(request);
    }
  };
}

/**
 * Sanitasi khusus untuk content input (dengan HTML support)
 */
function sanitizeContentInput(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(input)) {
    const sanitizedKey = sanitizeString(key);
    
    if (typeof value === 'string') {
      // Fields yang diizinkan mengandung HTML
      const htmlFields = ['content', 'description', 'body', 'excerpt', 'summary'];
      
      if (htmlFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[sanitizedKey] = sanitizeHTML(value, 'RICH_TEXT');
      } else {
        sanitized[sanitizedKey] = sanitizeString(value);
      }
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        } else if (item && typeof item === 'object') {
          return sanitizeContentInput(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeContentInput(value as Record<string, unknown>);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized;
}

/**
 * Middleware untuk validasi file upload
 */
export function withFileUploadSanitization(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      if (request.method === 'POST' || request.method === 'PUT') {
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('multipart/form-data')) {
          // Validasi akan dilakukan di handler, middleware ini hanya untuk logging
          console.log('File upload detected, sanitization will be handled in route');
        }
      }
      
      return await handler(request);
    } catch (error) {
      console.error('File upload sanitization middleware error:', error);
      return await handler(request);
    }
  };
}