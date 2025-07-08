// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx()],
  
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
          server.middlewares.use((req, res, next) => {
            // Basic security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            
            // Content Security Policy
            const csp = [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https://www.youtube.com",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https://www.google-analytics.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ');
            
            res.setHeader('Content-Security-Policy', csp);
            
            // Additional security headers
            res.setHeader('Permissions-Policy', 
              'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
            );
            
            next();
          });
        }
      }
    ],
    
    // Rate limiting configuration
    server: {
      middlewareMode: false,
    }
  },
  
  // Output configuration for static security
  output: 'static',
  
  // Image optimization configuration
  image: {
    remotePatterns: [{
      protocol: 'https',
      hostname: '**.cdninstagram.com'
    }, {
      protocol: 'https', 
      hostname: 'images.unsplash.com'
    }]
  }
});