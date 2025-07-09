import { defineCollection, z } from 'astro:content';

const peaks = defineCollection({
  type: 'content',
  schema: z.object({
    // Required fields
    title: z.string(),
    date: z.string(),
    country: z.string(),
    peak_name: z.string(),
    elevation_m: z.number(),
    gps_coords: z.tuple([z.number(), z.number()]),
    difficulty_rating: z.string(),
    ascent_type: z.enum(['Hike', 'Climb', 'Mixed']),
    tags: z.array(z.string()),
    slug: z.string().optional(),
    featured_image: z.string().optional(),
    cover_image: z.string().optional(),
    thumbnail_image: z.string().optional(),
    cover_position: z.string().optional(), // Format: "x,y" where x and y are 0-100
    thumbnail_position: z.string().optional(), // Format: "x,y" where x and y are 0-100

    // Optional fields for detailed peak information
    duration_hours: z.number().optional(),
    distance_km: z.number().optional(),
    ascent_gain_m: z.number().optional(),
    best_season: z.array(z.string()).optional(),
    gear_required: z.array(z.string()).optional(),
    route_description: z.string().optional(),
    weather_considerations: z.string().optional(),
    permits_required: z.boolean().optional(),
    accommodation: z.string().optional(),

    // SEO and content management
    description: z.string().optional(),
    content_html: z.string().optional(), // Store rich HTML content
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    youtubeUrl: z.string().optional(),

    // Safety and practical information
    emergency_contacts: z.string().optional(),
    trail_conditions: z.string().optional(),
    water_sources: z.array(z.string()).optional(),
    nearest_town: z.string().optional(),
  }),
});

export const collections = {
  peaks,
};
