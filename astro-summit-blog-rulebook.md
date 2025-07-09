# 🏔️ AI Development Rulebook — Astro Summit Blog

This rulebook defines all technical, content, and quality rules an AI system
should follow when building a blog about summiting the highest peaks in EU
countries using Astro.

---

## 🧱 Structure & Architecture

### Content Organization

- Use Astro
  [Content Collections](https://docs.astro.build/en/guides/content-collections/).
- Store mountain peak data in `content/peaks/` with a Zod schema.
- Organize content by country or category using folders or frontmatter tags.

### Directory Structure

```
content/
  peaks/
  countries/
public/
  images/
src/
  components/
  layouts/
  pages/
  styles/
  utils/
  data/
```

### Routing

- Use Astro's file-based routing.
- Use dynamic routes for `/peaks/[slug].astro`.

---

## 🧼 Code Quality

### Type Safety

- Use **TypeScript** across the project.
- Enable `"strict": true` in `tsconfig.json`.
- Validate all content schemas using **Zod**.

### Linting & Formatting

- Enforce **ESLint** with Astro and TypeScript plugins.
- Use **Prettier** for consistent formatting.
- Run `astro check` regularly.

### Component Design

- Isolate UI components in `src/components/`.
- Use typed props and default fallbacks.
- Avoid global logic in presentational components.

---

## 🎨 Styling & Design System

### CSS Framework

- Use **TailwindCSS** as the primary styling framework.
- Follow mobile-first responsive design principles.
- Use semantic color names and consistent spacing scale.

### Component Styling

- Apply Tailwind classes directly to elements.
- Use `cn()` utility for conditional class merging when needed.
- Support dark mode using Tailwind's `dark:` prefix.
- Maintain consistent typography scale and color palette.

### Design Principles

- Focus on readability and accessibility.
- Use appropriate contrast ratios (WCAG AA compliance).
- Implement consistent spacing using Tailwind's spacing scale.
- Follow a mobile-first responsive approach.

---

## 📝 Content Authoring Rules

### Format

- Prefer `.md` or `.mdx` for articles.
- All articles must include frontmatter.

### Required Frontmatter Fields

```yaml
title: 'Mont Blanc'
date: '2025-06-21'
country: 'France'
peak_name: 'Mont Blanc'
elevation_m: 4808
gps_coords: [45.8326, 6.8652]
difficulty_rating: 'D'
ascent_type: 'Mixed'
tags: ['Alps', 'Mountaineering']
slug: 'mont-blanc'
featured_image: '/images/mont-blanc.jpg'
```

### Optional Frontmatter Fields

```yaml
duration_hours: 8
distance_km: 12.5
ascent_gain_m: 1200
best_season: ['June', 'July', 'August', 'September']
gear_required: ['Crampons', 'Ice axe', 'Helmet']
route_description: 'Normal route via Goûter Hut'
weather_considerations: 'High altitude weather changes rapidly'
permits_required: false
accommodation: 'Goûter Hut'
```

### Slug Handling

- Auto-generate slug if not present using file name or title.
- Use kebab-case for consistency.

### Content Quality Standards

- Write clear, engaging descriptions of the climbing experience.
- Include practical information: routes, gear, timing, safety considerations.
- Add personal insights and challenges faced during the ascent.
- Include high-quality images with proper attribution.

---

## 🗃️ Data Management

### Peak Information Standards

- Verify elevation data from official sources (national mapping agencies).
- Use precise GPS coordinates (decimal degrees, WGS84).
- Include multiple route options when available.
- Reference official trail markers and waypoints.

### Image Management

- Store images in organized folders: `public/images/[country]/[peak-name]/`.
- Use descriptive filenames: `mont-blanc-summit-view.jpg`.
- Include multiple image sizes for responsive design.
- Maintain image metadata and attribution information.

### External Data Sources

- Link to official park/trail websites.
- Reference weather stations and forecasting services.
- Include emergency contact information for each region.
- Link to relevant guidebooks and resources.

---

## 🌐 SEO & Accessibility

### SEO Metadata

- Add `<title>`, `<meta name="description">`, `<link rel="canonical">`.
- Include Open Graph and Twitter Card metadata.
- Use JSON-LD structured data (`Article`, `Place`, `Mountain` types).

### Semantic HTML

- Use semantic tags: `<article>`, `<section>`, `<main>`, `<header>`, `<figure>`.

### Accessibility

- All images must have `alt` attributes.
- Ensure full keyboard navigation.
- Maintain contrast ratios and use `aria-*` attributes properly.
- Use proper heading hierarchy (h1, h2, h3, etc.).
- Provide alternative text for maps and interactive elements.

---

## ⚡ Performance

### Static Generation

- Prefer **SSG** (Static Site Generation).
- Avoid SSR unless essential.

### Image Optimization

- Use Astro's `<Image>` component.
- Serve WebP or AVIF formats where possible.
- Lazy-load images by default.
- Generate responsive image sizes automatically.

### Scripts

- Avoid third-party scripts unless necessary.
- Use `client:only` or `client:visible` when hydration is needed.
- Minimize JavaScript bundle size.

### Caching Strategy

- Implement proper cache headers for static assets.
- Use CDN for image delivery when possible.
- Cache API responses for external data sources.

---

## 🔐 Security & Privacy

### Data Protection

- Avoid storing personal location data without consent.
- Implement proper CORS policies for API endpoints.
- Sanitize user-generated content (comments, reviews).
- Use HTTPS for all external API calls.

### Content Security

- Validate and sanitize markdown content.
- Implement proper image upload restrictions.
- Use Content Security Policy (CSP) headers.

---

## 🚨 Error Handling

### Content Errors

- Gracefully handle missing frontmatter fields.
- Provide fallback content for broken images.
- Display user-friendly messages for invalid routes.
- Log content validation errors during build.

### Runtime Errors

- Implement proper error boundaries for interactive components.
- Provide fallback UI for failed map loading.
- Handle network failures for external data sources.
- Display helpful error messages to users.

### Build-time Validation

- Validate all content schemas before deployment.
- Check for broken internal links.
- Verify image file existence and accessibility.
- Ensure all required frontmatter fields are present.

---

## 🧭 UX/UI for Peak Content

### Navigation & Discovery

- Enable sorting and filtering by country, difficulty, elevation, etc.
- Implement search functionality across peak content.
- Provide breadcrumb navigation for content hierarchy.
- Create intuitive category and tag-based browsing.

### Interactive Features

- Embed maps using Leaflet or MapLibre.
- Allow GPX upload or linking.
- Show elevation profiles and route overlays.
- Display summit guidance: gear, season, warnings.
- Include weather widget integration.

### Content Presentation

- Use card-based layouts for peak listings.
- Implement photo galleries with lightbox functionality.
- Show difficulty ratings with clear visual indicators.
- Display elevation and distance metrics prominently.

---

## 📱 Responsive Design

### Breakpoint Strategy

- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

### Mobile Considerations

- Touch-friendly navigation and interactive elements.
- Optimize images for mobile bandwidth.
- Ensure readable text sizes without zooming.
- Implement swipe gestures for image galleries.

---

## 📚 Internationalization (Optional)

### Content Localization

- Use subroutes or folders (`/en/`, `/de/`) for localized content.
- Translate metadata, labels, alt text, and date formats.
- Implement language switching functionality.
- Consider regional variations in measurement units (metric/imperial).

### Cultural Considerations

- Respect local naming conventions for peaks and regions.
- Include cultural context and local regulations.
- Provide region-specific safety and emergency information.

---

## 🔧 Tooling & Developer Experience

### Environment

- Store secrets in `.env`.
- Access via `import.meta.env`.
- Use environment-specific configurations.

### Development Workflow

- Use hot module reloading for efficient development.
- Implement pre-commit hooks for code quality.
- Use TypeScript strict mode throughout the project.

### CI/CD

- Run linting, type-checks, and builds in CI.
- Use GitHub Actions or equivalent.
- Implement automated testing and deployment.
- Include lighthouse performance audits in CI.

### Version Control

- Use conventional commits.
- Document architectural decisions in PRs.
- Maintain a changelog for major updates.
- Tag releases with semantic versioning.

---

## 🧪 Testing

### Unit Tests

- Use `Vitest` for logic and UI tests.
- Test content schema validation.
- Mock external API dependencies.

### Integration Tests

- Test page rendering with real content.
- Verify routing and navigation functionality.
- Test search and filtering features.

### Accessibility Tests

- Use `axe-core`, `pa11y`, or similar in CI.
- Test keyboard navigation paths.
- Verify screen reader compatibility.

### Performance Tests

- Monitor Core Web Vitals.
- Test image loading and optimization.
- Verify mobile performance metrics.

### Visual Testing (Optional)

- Use tools like Chromatic for regression testing.
- Test responsive design across devices.
- Verify dark mode implementation.

---

## 🗃️ Example: `content.config.ts` for Peaks

```ts
import { defineCollection, z } from 'astro:content';

const peaks = defineCollection({
  type: 'content',
  schema: z.object({
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
    // Optional fields
    duration_hours: z.number().optional(),
    distance_km: z.number().optional(),
    ascent_gain_m: z.number().optional(),
    best_season: z.array(z.string()).optional(),
    gear_required: z.array(z.string()).optional(),
    route_description: z.string().optional(),
    weather_considerations: z.string().optional(),
    permits_required: z.boolean().optional(),
    accommodation: z.string().optional(),
  }),
});

export const collections = {
  peaks,
};
```

---

## 📋 Development Checklist

### Before Starting Development

- [ ] Review project structure and existing content
- [ ] Verify TypeScript configuration
- [ ] Set up linting and formatting tools
- [ ] Configure Tailwind CSS
- [ ] Set up content collections schema

### During Development

- [ ] Follow TypeScript strict mode
- [ ] Use semantic HTML elements
- [ ] Implement responsive design
- [ ] Optimize images using Astro Image component
- [ ] Test accessibility with keyboard navigation
- [ ] Validate content schemas

### Before Deployment

- [ ] Run full build and type checking
- [ ] Test on multiple devices and browsers
- [ ] Verify all links and images work
- [ ] Check SEO metadata and Open Graph tags
- [ ] Run accessibility audit
- [ ] Test performance with Lighthouse

---

## 🏔️ Project-Specific Rules

### Content Focus

- Focus on EU country highest peaks (47 countries total).
- Include both technical climbing and hiking approaches.
- Emphasize safety, preparation, and environmental responsibility.
- Share personal experiences and practical advice.

### Brand Voice

- Authentic and adventurous tone.
- Focus on inspiring others to explore safely.
- Share both successes and challenges honestly.
- Emphasize respect for nature and local communities.

### Author Information

- Content authored by **Nikolay Demerdzhiev**.
- Include author bio and credentials where appropriate.
- Maintain consistent author voice across all content.
