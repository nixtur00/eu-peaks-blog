export const prerender = false;

import type { APIRoute } from 'astro';
import { 
  isRateLimited, 
  getClientIp, 
  createErrorResponse,
  logSecurityEvent 
} from '../../utils/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limiting for analytics endpoint
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp, 100, 15 * 60 * 1000)) { // 100 requests per 15 minutes
      return createErrorResponse('Too many analytics requests', 429, 'RATE_LIMIT');
    }

    // Parse the analytics data
    const data = await request.json();
    
    // Basic validation
    if (!data.events || !Array.isArray(data.events)) {
      return createErrorResponse('Invalid analytics data format', 400, 'INVALID_FORMAT');
    }

    // Log analytics data (in production, send to your analytics service)
    if (import.meta.env.DEV) {
      console.log('Analytics received:', {
        sessionId: data.session_id,
        eventCount: data.events.length,
        events: data.events.map((e: any) => ({
          name: e.name,
          category: e.category,
          timestamp: e.timestamp
        }))
      });
    }

    // In production, you would:
    // 1. Validate the data more thoroughly
    // 2. Send to your analytics service (e.g., PostHog, Mixpanel, etc.)
    // 3. Store in database if needed
    
    return new Response(
      JSON.stringify({
        success: true,
        received: data.events.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );

  } catch (error) {
    logSecurityEvent({
      type: 'suspicious_activity',
      identifier: getClientIp(request),
      details: { 
        endpoint: '/api/analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return createErrorResponse(
      'Analytics processing failed',
      500,
      'ANALYTICS_ERROR'
    );
  }
};

// Only allow POST requests
export const GET: APIRoute = () => {
  return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
}; 