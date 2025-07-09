import { z } from 'zod';

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/&lt;script/gi, '') // Remove encoded script tags
    .slice(0, 1000); // Limit length
}

// HTML sanitization for user content
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';

  // Remove dangerous HTML elements and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, '') // Remove event handlers
    .replace(/javascript:\s*[^"']*/gi, '') // Remove javascript: URLs
    .trim();
}

// Validate image sources
export function isValidImageSource(src: string): boolean {
  if (!src || typeof src !== 'string') return false;

  const allowedPatterns = [
    /^\/images\//, // Local images
    /^https:\/\/images\.unsplash\.com\//, // Unsplash
    /^https:\/\/.*\.cdninstagram\.com\//, // Instagram CDN
    /^data:image\/(jpeg|jpg|png|webp|avif);base64,/, // Base64 images
  ];

  return allowedPatterns.some(pattern => pattern.test(src));
}

// Validate uploaded image files
export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.');
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, AVIF, and GIF files are allowed.');
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !allowedExtensions.includes(`.${extension}`)) {
    throw new Error('Invalid file extension.');
  }
}

// Rate limiting storage (in-memory for now, use Redis in production)
const rateLimitStorage = new Map<string, { count: number; resetTime: number }>();

export function isRateLimited(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const record = rateLimitStorage.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStorage.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (record.count >= maxRequests) {
    return true; // Rate limited
  }

  record.count++;
  return false;
}

// Clean up old rate limit records
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStorage.entries()) {
    if (now > record.resetTime) {
      rateLimitStorage.delete(key);
    }
  }
}

// Validation schemas for user input
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment too long')
    .transform(sanitizeInput),
  author: z.string().min(1, 'Name required').max(50, 'Name too long').transform(sanitizeInput),
  email: z
    .string()
    .email('Invalid email')
    .optional()
    .transform(val => (val ? sanitizeInput(val) : val)),
  peakSlug: z.string().min(1, 'Peak reference required').transform(sanitizeInput),
});

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query required')
    .max(100, 'Search query too long')
    .transform(sanitizeInput),
  country: z
    .string()
    .max(50)
    .optional()
    .transform(val => (val ? sanitizeInput(val) : val)),
  difficulty: z.enum(['Easy', 'Moderate', 'Hard', 'Expert']).optional(),
  tags: z.array(z.string().max(30)).max(5).optional(),
});

// Security event logging
export interface SecurityEvent {
  type: 'rate_limit' | 'invalid_input' | 'suspicious_activity' | 'content_violation';
  timestamp: number;
  identifier?: string;
  details?: Record<string, unknown>;
}

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now(),
  };

  // In production, send to secure logging service
  if (import.meta.env.DEV) {
    console.warn('Security Event:', securityEvent);
  }

  // Store critical events for monitoring
  if (event.type === 'suspicious_activity') {
    // In production: alert security team
    console.error('SECURITY ALERT:', securityEvent);
  }
}

// Content validation for peak data
export function validatePeakContent(content: unknown): boolean {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      country: z.string().min(1).max(100),
      peak_name: z.string().min(1).max(200),
      elevation_m: z.number().min(0).max(10000),
      gps_coords: z.tuple([
        z.number().min(-90).max(90), // latitude
        z.number().min(-180).max(180), // longitude
      ]),
      description: z.string().max(5000).optional(),
    });

    schema.parse(content);
    return true;
  } catch {
    return false;
  }
}

// IP address extraction utility
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (remoteAddr) {
    return remoteAddr;
  }

  return 'unknown';
}

// Error response helper
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): Response {
  return new Response(
    JSON.stringify({
      error: true,
      message: sanitizeInput(message),
      code,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
