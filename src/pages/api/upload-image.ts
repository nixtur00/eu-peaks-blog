import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const type = formData.get('type') as string;

    console.log('Upload request:', {
      hasImage: !!image,
      imageName: image?.name,
      imageType: image?.type,
      imageSize: image?.size,
      type: type
    });

    if (!image || !image.name || image.size === 0) {
      console.log('No valid image file provided');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No image file provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // More permissive file type validation - check file extension as fallback
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileExtension = image.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    const isValidType = allowedTypes.includes(image.type) || allowedExtensions.includes(fileExtension || '');
    
    if (!isValidType) {
      console.log('Invalid file type:', image.type, 'Extension:', fileExtension);
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Invalid file type: ${image.type}. Please upload a JPEG, PNG, GIF, or WebP image.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (image.size > maxSize) {
      console.log('File too large:', image.size, 'bytes');
      return new Response(JSON.stringify({ 
        success: false, 
        message: `File too large: ${(image.size / 1024 / 1024).toFixed(2)}MB. Please upload an image smaller than 15MB.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `content-${timestamp}-${randomString}.${extension}`;

    // Determine upload directory based on type
    const uploadDir = type === 'content' 
      ? join(process.cwd(), 'public', 'images', 'content')
      : join(process.cwd(), 'public', 'images', 'peaks');

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save the file
    const filePath = join(uploadDir, filename);
    const arrayBuffer = await image.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));

    console.log('File saved successfully:', filePath);

    // Return the public URL with cache-busting parameter for dev server
    const publicUrl = type === 'content' 
      ? `/images/content/${filename}?t=${Date.now()}`
      : `/images/peaks/${filename}?t=${Date.now()}`;

    console.log('Returning URL:', publicUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      filename 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to upload image. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 