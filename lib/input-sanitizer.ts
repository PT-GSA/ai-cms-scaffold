import DOMPurify from 'dompurify';
import validator from 'validator';
import { JSDOM } from 'jsdom';

// Setup DOMPurify untuk server-side rendering
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Konfigurasi sanitasi untuk berbagai jenis konten
 */
export const SANITIZE_CONFIG = {
  // Untuk rich text content (HTML yang aman)
  RICH_TEXT: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  },
  // Untuk plain text (strip semua HTML)
  PLAIN_TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  },
  // Untuk konten yang lebih permisif (admin content)
  ADMIN_CONTENT: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'class', 'id'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  }
};

/**
 * Sanitasi HTML content untuk mencegah XSS attacks
 */
export function sanitizeHTML(
  input: string, 
  config: 'RICH_TEXT' | 'PLAIN_TEXT' | 'ADMIN_CONTENT' = 'RICH_TEXT'
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const sanitizeConfig = SANITIZE_CONFIG[config];
  
  const options: Record<string, unknown> = {
    ALLOWED_TAGS: sanitizeConfig.ALLOWED_TAGS,
    ALLOWED_ATTR: sanitizeConfig.ALLOWED_ATTR,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  };

  // Add ALLOWED_URI_REGEXP only if it exists in config
  if ('ALLOWED_URI_REGEXP' in sanitizeConfig) {
    options.ALLOWED_URI_REGEXP = sanitizeConfig.ALLOWED_URI_REGEXP;
  }

  return String(purify.sanitize(input, options));
}

/**
 * Sanitasi string biasa (escape HTML entities)
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return validator.escape(input);
}

/**
 * Validasi dan sanitasi email
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const normalizedEmail = validator.normalizeEmail(email);
  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    return null;
  }

  return normalizedEmail;
}

/**
 * Validasi dan sanitasi URL
 */
export function sanitizeURL(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();
  
  // Validasi URL
  if (!validator.isURL(trimmedUrl, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false
  })) {
    return null;
  }

  return trimmedUrl;
}

/**
 * Sanitasi slug (untuk URL-friendly strings)
 */
export function sanitizeSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return validator.escape(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validasi dan sanitasi nomor telepon
 */
export function sanitizePhoneNumber(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Basic validation - must start with + and have at least 10 digits
  if (!validator.isMobilePhone(cleanPhone, 'any', { strictMode: false })) {
    return null;
  }

  return cleanPhone;
}

/**
 * Sanitasi JSON input
 */
export function sanitizeJSON(input: string): Record<string, unknown> | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(input);
    
    // Recursively sanitize object values
    const sanitized = sanitizeObjectValues(parsed);
    
    // Ensure return type is correct
    if (sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)) {
      return sanitized as Record<string, unknown>;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Recursively sanitize object values
 */
function sanitizeObjectValues(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectValues);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObjectValues(value);
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Validasi panjang string
 */
export function validateStringLength(
  input: string, 
  minLength: number = 0, 
  maxLength: number = 1000
): boolean {
  if (!input || typeof input !== 'string') {
    return minLength === 0;
  }

  return validator.isLength(input, { min: minLength, max: maxLength });
}

/**
 * Sanitasi filename untuk upload
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  const baseName = filename.replace(/^.*[\\\/]/, '');
  
  // Remove dangerous characters
  return baseName
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .substring(0, 255); // Limit length
}

/**
 * Comprehensive input sanitizer untuk API endpoints
 */
export function sanitizeApiInput(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const sanitizedKey = sanitizeString(key);
    
    if (typeof value === 'string') {
      // Detect if it's HTML content
      if (value.includes('<') && value.includes('>')) {
        sanitized[sanitizedKey] = sanitizeHTML(value, 'RICH_TEXT');
      } else {
        sanitized[sanitizedKey] = sanitizeString(value);
      }
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeApiInput(value as Record<string, unknown>);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
}