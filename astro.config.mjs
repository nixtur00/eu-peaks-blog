// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx()],

  // Netlify adapter for server-rendered API routes
  adapter: netlify(),

  // Security configuration
  security: {
    checkOrigin: true,
  },

  // Build configuration for security
  build: {
    inlineStylesheets: 'never', // Better CSP compliance
  },

  // Vite configuration for security headers and middleware
  vite: {
    plugins: [
      {
        name: 'security-headers',
        configureServer(server) {
          // Handle dynamically uploaded images
          server.middlewares.use('/images', async (req, res, next) => {
            // Custom handling for uploaded content images
            if (req.url && req.url.includes('/images/content/')) {
              const fs = await import('fs');
              const path = await import('path');
              
              // Extract filename from URL (remove query params)
              const urlPath = req.url.split('?')[0];
              const filename = urlPath.split('/').pop();
              
              if (!filename) {
                next();
                return;
              }
              
              const filePath = path.join(process.cwd(), 'public', 'images', 'content', filename);
              
              // Check if file exists and serve it directly
              if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath);
                const extension = path.extname(filename).toLowerCase();
                
                // Set appropriate content type
                let contentType = 'image/jpeg';
                if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg';
                else if (extension === '.png') contentType = 'image/png';
                else if (extension === '.gif') contentType = 'image/gif';
                else if (extension === '.webp') contentType = 'image/webp';
                
                res.setHeader('Content-Type', contentType);
                res.setHeader('Cache-Control', 'no-cache');
                res.end(fileContent);
                return;
              }
            }
            next();
          });
          
          server.middlewares.use((req, res, next) => {
            // Basic security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

            // Allow framing for editor pages only
            if (req.url && (req.url.includes('/edit/') || req.url.includes('/new-post'))) {
              res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            } else {
              res.setHeader('X-Frame-Options', 'DENY');
            }

            // Content Security Policy
            const csp = [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.google-analytics.com https://cdn.quilljs.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.quilljs.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https://www.youtube.com",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https://www.google-analytics.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; ');

            res.setHeader('Content-Security-Policy', csp);

            // Additional security headers
            res.setHeader(
              'Permissions-Policy',
              'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
            );

            next();
          });
        },
      },
    ],

    // Rate limiting configuration
    server: {
      middlewareMode: false,
    },
  },

  // Output configuration - static for most pages, API routes use prerender: false
  output: 'static',

  // Image optimization configuration
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
});
