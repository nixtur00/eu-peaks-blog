export const prerender = false;

import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Extract form fields
    const title = formData.get('title') as string;
    const country = formData.get('country') as string;
    const elevation = parseInt((formData.get('elevation') as string) || '0');
    const date = formData.get('date') as string;
    const description = (formData.get('description') as string) || '';
    const difficulty = formData.get('difficulty') as string;
    const duration = formData.get('duration') as string;
    const tags = formData.get('tags') as string;
    const youtubeUrl = formData.get('youtubeUrl') as string;
    const featured = formData.has('featured');
    const content = formData.get('content') as string;
    const isDraft = formData.get('isDraft') === 'true';

    // Handle images
    const coverImage = formData.get('coverImage') as File | null;
    const thumbnailImage = formData.get('thumbnailImage') as File | null;
    const contentImages = formData.getAll('contentImages') as File[];
    
    // Handle image positions
    const coverPosition = (formData.get('coverPosition') as string) || '50,50';
    const thumbnailPosition = (formData.get('thumbnailPosition') as string) || '50,50';

    if (!title || !country || !date || !content) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: title, country, date, and content are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');

    // Create directory for images if it doesn't exist
    const imageDir = join(process.cwd(), 'public', 'images', 'peaks', slug);
    if (!existsSync(imageDir)) {
      await mkdir(imageDir, { recursive: true });
    }

    // Save images and get paths
    let coverImagePath = '';
    let thumbnailImagePath = '';
    const contentImagePaths: string[] = [];

    if (coverImage && coverImage.size > 0) {
      const coverFileName = `cover-${Date.now()}.${coverImage.name.split('.').pop()}`;
      const coverPath = join(imageDir, coverFileName);
      const buffer = new Uint8Array(await coverImage.arrayBuffer());
      await writeFile(coverPath, buffer);
      coverImagePath = `/images/peaks/${slug}/${coverFileName}`;
    }

    if (thumbnailImage && thumbnailImage.size > 0) {
      const thumbFileName = `thumb-${Date.now()}.${thumbnailImage.name.split('.').pop()}`;
      const thumbPath = join(imageDir, thumbFileName);
      const buffer = new Uint8Array(await thumbnailImage.arrayBuffer());
      await writeFile(thumbPath, buffer);
      thumbnailImagePath = `/images/peaks/${slug}/${thumbFileName}`;
    }

    // Save content images
    for (let i = 0; i < contentImages.length; i++) {
      const contentImage = contentImages[i];
      if (contentImage && contentImage.size > 0) {
        const contentFileName = `content-${i + 1}-${Date.now()}.${contentImage.name.split('.').pop()}`;
        const contentPath = join(imageDir, contentFileName);
        const buffer = new Uint8Array(await contentImage.arrayBuffer());
        await writeFile(contentPath, buffer);
        contentImagePaths.push(`/images/peaks/${slug}/${contentFileName}`);
      }
    }

    // Parse duration to hours
    let durationHours = 6; // default
    if (duration) {
      const match = duration.match(/(\d+)/);
      if (match) {
        durationHours = parseInt(match[1]);
        if (duration.toLowerCase().includes('day')) {
          durationHours *= 8; // 8 hours per day
        }
      }
    }

    // Create markdown content
    const tagsArray = tags
      ? tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
      : [];

    const frontmatter = {
      title,
      date,
      country,
      peak_name: title, // Use title as peak name for now
      elevation_m: elevation,
      gps_coords: [0, 0], // Default coords, should be filled in later
      difficulty_rating: difficulty,
      ascent_type: 'Hike', // Default type
      tags: tagsArray,
      slug,
      cover_image: coverImagePath || undefined,
      thumbnail_image: thumbnailImagePath || undefined,
      featured_image: thumbnailImagePath || undefined, // Use thumbnail as featured
      cover_position: coverImagePath ? coverPosition : undefined,
      thumbnail_position: thumbnailImagePath ? thumbnailPosition : undefined,
      duration_hours: durationHours,
      description: description || undefined,
      featured,
      youtubeUrl: youtubeUrl || undefined,
    };

    // Generate frontmatter string
    const frontmatterString = Object.entries(frontmatter)
      .filter(([key, value]) => key && value !== undefined)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (key === 'gps_coords') {
            return `${key}: [${value.join(', ')}]`;
          } else {
            return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
          }
        } else if (typeof value === 'string') {
          return `${key}: "${value}"`;
        } else {
          return `${key}: ${value}`;
        }
      })
      .join('\n');

    // Update content to use proper image paths
    let updatedContent = content;
    if (contentImagePaths.length > 0) {
      // Replace data URLs with actual image paths
      contentImagePaths.forEach((imagePath) => {
        const dataUrlPattern = /src="data:image\/[^"]+"/;
        updatedContent = updatedContent.replace(dataUrlPattern, `src="${imagePath}"`);
      });
    }

    const markdownContent = `---
${frontmatterString}
---

${updatedContent}
`;

    // Save markdown file
    const contentDir = join(process.cwd(), 'src', 'content', 'peaks');
    if (!existsSync(contentDir)) {
      await mkdir(contentDir, { recursive: true });
    }

    const fileName = isDraft ? `${slug}-draft.md` : `${slug}.md`;
    const filePath = join(contentDir, fileName);

    await writeFile(filePath, markdownContent, 'utf8');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Adventure "${title}" ${isDraft ? 'saved as draft' : 'published'} successfully!`,
        slug,
        filePath: fileName,
        images: {
          cover: coverImagePath,
          thumbnail: thumbnailImagePath,
          content: contentImagePaths,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating post:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create post. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
