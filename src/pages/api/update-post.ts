import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { sanitizeInput, sanitizeHtml, validateImageFile } from '../../utils/security';

export const prerender = false;

const updatePostSchema = z.object({
  originalSlug: z.string().min(1),
  title: z.string().min(1).max(200),
  country: z.string().min(1),
  elevation: z.string().regex(/^\d+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  difficulty: z.enum(['Easy', 'Moderate', 'Hard', 'Expert']),
  duration_hours: z.string().optional(),
  tags: z.string().optional(),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  featured: z.string().optional(),
  content: z.string().min(1),
  isDraft: z.string(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Read existing article to preserve gps_coords
    const originalSlug = formData.get('originalSlug') as string;
    const { getEntry } = await import('astro:content');
    const existingPeak = await getEntry('peaks', originalSlug);

    // Extract and validate form data
    const rawData = {
      originalSlug: formData.get('originalSlug') as string,
      title: formData.get('title') as string,
      country: formData.get('country') as string,
      elevation: formData.get('elevation') as string,
      date: formData.get('date') as string,
      difficulty: formData.get('difficulty') as string,
      duration_hours: (formData.get('duration_hours') as string) || undefined,
      tags: (formData.get('tags') as string) || undefined,
      youtubeUrl: (formData.get('youtubeUrl') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      featured: (formData.get('featured') as string) || undefined,
      content: formData.get('content') as string,
      isDraft: formData.get('isDraft') as string,
    };

    // Validate input
    const validatedData = updatePostSchema.parse(rawData);

    // Sanitize inputs
    const sanitizedData = {
      originalSlug: sanitizeInput(validatedData.originalSlug),
      title: sanitizeInput(validatedData.title),
      country: sanitizeInput(validatedData.country),
      elevation_m: parseInt(validatedData.elevation),
      gps_coords: existingPeak?.data.gps_coords || [0, 0], // Preserve existing coords
      date: validatedData.date,
      difficulty_rating: validatedData.difficulty,
      duration_hours: validatedData.duration_hours
        ? parseFloat(validatedData.duration_hours)
        : undefined,
      tags: validatedData.tags
        ? validatedData.tags
            .split(',')
            .map(tag => sanitizeInput(tag.trim()))
            .filter(Boolean)
        : undefined,
      youtubeUrl: validatedData.youtubeUrl || undefined,
      description: validatedData.description ? sanitizeInput(validatedData.description) : undefined,
      featured: validatedData.featured === 'on',
      content: sanitizeHtml(validatedData.content),
      isDraft: validatedData.isDraft === 'true',
    };

    // Generate slug from title
    const newSlug = generateSlug(sanitizedData.title);

    // Handle images
    const coverImage = formData.get('coverImage') as File | null;
    const thumbnailImage = formData.get('thumbnailImage') as File | null;
    const contentImages = formData.getAll('contentImages') as File[];
    
    // Handle image positions
    const coverPosition = (formData.get('cover_position') as string) || existingPeak?.data.cover_position || '50,50';
    const thumbnailPosition = (formData.get('thumbnail_position') as string) || existingPeak?.data.thumbnail_position || '50,50';

    // Debug logging
    console.log('Form data received:');
    console.log('Cover image:', coverImage?.name, coverImage?.size);
    console.log('Thumbnail image:', thumbnailImage?.name, thumbnailImage?.size);
    console.log('Content images:', contentImages.length);

    let coverImagePath: string | undefined;
    let thumbnailImagePath: string | undefined;
    const processedContent = sanitizedData.content;

    // Create image directory
    const imageDir = path.join(process.cwd(), 'public', 'images', 'peaks', newSlug);
    await fs.mkdir(imageDir, { recursive: true });

    // Process cover image
    if (coverImage && coverImage.size > 0) {
      validateImageFile(coverImage);

      const coverFileName = `cover-${Date.now()}.${coverImage.name.split('.').pop()}`;
      const coverPath = path.join(imageDir, coverFileName);

      const buffer = Buffer.from(await coverImage.arrayBuffer());
      await fs.writeFile(coverPath, buffer);

      coverImagePath = `/images/peaks/${newSlug}/${coverFileName}`;
      console.log('Cover image saved:', coverImagePath);
    }

    // Process thumbnail image
    if (thumbnailImage && thumbnailImage.size > 0) {
      validateImageFile(thumbnailImage);

      const thumbnailFileName = `thumbnail-${Date.now()}.${thumbnailImage.name.split('.').pop()}`;
      const thumbnailPath = path.join(imageDir, thumbnailFileName);

      const buffer = Buffer.from(await thumbnailImage.arrayBuffer());
      await fs.writeFile(thumbnailPath, buffer);

      thumbnailImagePath = `/images/peaks/${newSlug}/${thumbnailFileName}`;
      console.log('Thumbnail image saved:', thumbnailImagePath);
    }

    // Process content images
    let finalContent = processedContent;
    if (contentImages.length > 0) {
      for (const [index, image] of contentImages.entries()) {
        if (image.size > 0) {
          validateImageFile(image);

          const fileName = `content-${index + 1}-${Date.now()}.${image.name.split('.').pop()}`;
          const imagePath = path.join(imageDir, fileName);

          const buffer = Buffer.from(await image.arrayBuffer());
          await fs.writeFile(imagePath, buffer);

          const imageUrl = `/images/peaks/${newSlug}/${fileName}`;
          console.log('Content image saved:', imageUrl);

          // Replace data URLs with actual image paths in content
          const dataUrlRegex = new RegExp(`data:image/[^;]+;base64,[^"]+`, 'g');
          finalContent = finalContent.replace(dataUrlRegex, imageUrl);
        }
      }
    }

    // Store HTML content in frontmatter to preserve formatting
    const frontmatter = {
      title: sanitizedData.title,
      date: sanitizedData.date,
      country: sanitizedData.country,
      peak_name: sanitizedData.title, // Use title as peak name
      elevation_m: sanitizedData.elevation_m,
      gps_coords: sanitizedData.gps_coords,
      difficulty_rating: sanitizedData.difficulty_rating,
      ascent_type: 'Hike', // Default value
      tags: sanitizedData.tags || [],
      ...(sanitizedData.duration_hours && { duration_hours: sanitizedData.duration_hours }),
      ...(sanitizedData.youtubeUrl && { youtubeUrl: sanitizedData.youtubeUrl }),
      ...(sanitizedData.description && { description: sanitizedData.description }),
      ...(coverImagePath || existingPeak?.data.cover_image) && { cover_image: coverImagePath || existingPeak?.data.cover_image },
      ...(thumbnailImagePath || existingPeak?.data.thumbnail_image) && { thumbnail_image: thumbnailImagePath || existingPeak?.data.thumbnail_image },
      ...(coverImagePath || existingPeak?.data.cover_image) && { cover_position: coverPosition },
      ...(thumbnailImagePath || existingPeak?.data.thumbnail_image) && { thumbnail_position: thumbnailPosition },
      content_html: finalContent, // Store HTML content here
      featured: sanitizedData.featured,
      draft: sanitizedData.isDraft,
    };

    // Use minimal markdown content - the real content is in frontmatter
    const markdownContent = '<!-- Content is stored in frontmatter as content_html -->';

    // Generate file content
    const fileContent = `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (key === 'gps_coords' && Array.isArray(value)) {
      return `${key}: [${value.join(', ')}]`; // Numbers without quotes
    } else if (key === 'tags' && Array.isArray(value)) {
      return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`; // Strings with quotes
    } else if (Array.isArray(value)) {
      return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
    } else if (key === 'content_html' && typeof value === 'string') {
      // Use YAML literal block format for HTML content to avoid quote issues
      return `${key}: |\n  ${value.replace(/\n/g, '\n  ')}`;
    } else if (typeof value === 'string') {
      return `${key}: "${value}"`;
    } else {
      return `${key}: ${value}`;
    }
  })
  .join('\n')}
---

${markdownContent}
`;

    // Remove old file if slug changed
    if (sanitizedData.originalSlug !== newSlug) {
      const oldFilePath = path.join(
        process.cwd(),
        'src',
        'content',
        'peaks',
        `${sanitizedData.originalSlug}.md`
      );
      try {
        await fs.unlink(oldFilePath);
      } catch {
        console.warn('Could not remove old file:', oldFilePath);
      }
    }

    // Write new/updated file
    const filePath = path.join(process.cwd(), 'src', 'content', 'peaks', `${newSlug}.md`);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    return new Response(
      JSON.stringify({
        success: true,
        message: sanitizedData.isDraft
          ? 'Draft updated successfully!'
          : 'Adventure updated successfully!',
        slug: newSlug,
        filePath: filePath,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error updating post:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update adventure. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
