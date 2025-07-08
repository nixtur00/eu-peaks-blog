export const prerender = false;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { 
  isRateLimited, 
  getClientIp, 
  createErrorResponse, 
  searchSchema,
  logSecurityEvent 
} from '../../utils/security';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp, 50, 10 * 60 * 1000)) { // 50 requests per 10 minutes
      logSecurityEvent({
        type: 'rate_limit',
        identifier: clientIp,
        details: { endpoint: '/api/search' }
      });
      
      return createErrorResponse('Too many requests. Please try again later.', 429, 'RATE_LIMIT');
    }

    // Parse and validate query parameters
    const searchParams = url.searchParams;
    const query = searchParams.get('q');
    const country = searchParams.get('country');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    // Validate input
    let validatedInput;
    try {
      validatedInput = searchSchema.parse({
        query: query || '',
        country: country || undefined,
        difficulty: difficulty || undefined,
        tags: tags || undefined,
      });
    } catch (error) {
      logSecurityEvent({
        type: 'invalid_input',
        identifier: clientIp,
        details: { 
          endpoint: '/api/search',
          error: error instanceof Error ? error.message : 'Unknown validation error'
        }
      });
      
      return createErrorResponse('Invalid search parameters', 400, 'INVALID_INPUT');
    }

    // Get all peaks from content collection
    const peaks = await getCollection('peaks');
    
    // Filter peaks based on search criteria
    const filteredPeaks = peaks.filter((peak) => {
      const { data } = peak;
      
      // Text search in title, peak_name, country, and description
      if (validatedInput.query) {
        const searchText = validatedInput.query.toLowerCase();
        const searchableContent = [
          data.title,
          data.peak_name,
          data.country,
          data.description || '',
          ...(data.tags || [])
        ].join(' ').toLowerCase();
        
        if (!searchableContent.includes(searchText)) {
          return false;
        }
      }
      
      // Country filter
      if (validatedInput.country && data.country !== validatedInput.country) {
        return false;
      }
      
      // Difficulty filter
      if (validatedInput.difficulty && data.difficulty_rating !== validatedInput.difficulty) {
        return false;
      }
      
      // Tags filter
      if (validatedInput.tags && validatedInput.tags.length > 0) {
        const peakTags = data.tags || [];
        const hasMatchingTag = validatedInput.tags.some(tag => 
          peakTags.some(peakTag => peakTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });

    // Prepare response data (only public information)
    const results = filteredPeaks.map((peak) => ({
      slug: peak.slug,
      title: peak.data.title,
      peak_name: peak.data.peak_name,
      country: peak.data.country,
      elevation_m: peak.data.elevation_m,
      difficulty_rating: peak.data.difficulty_rating,
      ascent_type: peak.data.ascent_type,
      tags: peak.data.tags || [],
      featured_image: peak.data.featured_image,
      description: peak.data.description ? peak.data.description.slice(0, 200) + '...' : undefined,
      featured: peak.data.featured || false,
    }));

    // Sort results by relevance (featured first, then by elevation)
    results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.elevation_m - a.elevation_m;
    });

    // Limit results to prevent excessive data transfer
    const limitedResults = results.slice(0, 50);

    return new Response(
      JSON.stringify({
        success: true,
        results: limitedResults,
        total: limitedResults.length,
        query: validatedInput,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
          'Vary': 'Accept-Encoding',
        },
      }
    );

  } catch (error) {
    console.error('Search API error:', error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      identifier: getClientIp(request),
      details: { 
        endpoint: '/api/search',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return createErrorResponse(
      'An error occurred while searching. Please try again.',
      500,
      'INTERNAL_ERROR'
    );
  }
};

// Disable POST, PUT, DELETE methods for security
export const POST: APIRoute = () => {
  return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
};

export const PUT: APIRoute = () => {
  return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
};

export const DELETE: APIRoute = () => {
  return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
}; 