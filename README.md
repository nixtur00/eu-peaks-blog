# 🏔️ EU Peaks Blog

A secure, privacy-focused blog documenting climbs to the highest peaks in every EU country. Built with Astro, TypeScript, and modern web security practices.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/your-site/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)](https://astro.build/)

## ✨ Features

### 🔒 Security First
- **No login required** - Fully accessible to all visitors
- **Privacy-focused analytics** with GDPR compliance and opt-out controls
- **Content Security Policy** with strict headers
- **Input sanitization** and validation for all user data
- **Rate limiting** on API endpoints to prevent abuse
- **XSS and injection protection** throughout the application

### 🎯 User Experience
- **Mobile-first responsive design** with dark mode support
- **Accessible** (WCAG AA compliant) with keyboard navigation
- **Fast loading** with image optimization and lazy loading
- **SEO optimized** with structured data and Open Graph tags
- **Progressive enhancement** - works without JavaScript

### 📊 Privacy Analytics
- **Anonymous usage tracking** (optional, with user consent)
- **No personal data collection** - respects user privacy
- **Interactive privacy controls** - users can opt in/out anytime
- **GDPR compliant** with transparent data practices

### 🗺️ Content Management
- **Comprehensive peak data** with GPS coordinates, elevation, difficulty
- **Content Collections** powered by Astro and Zod validation
- **Search functionality** with filters by country, difficulty, tags
- **Rich metadata** for each peak including gear, seasons, accommodation

## 🚀 Tech Stack

- **[Astro](https://astro.build/)** - Static site generator with island architecture
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Zod](https://zod.dev/)** - Runtime type validation for content
- **[MDX](https://mdxjs.com/)** - Enhanced markdown for rich content

## 📋 Project Structure

```
eu-peaks-blog/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── SecureImage.astro   # Security-validated image component
│   │   ├── Navigation.astro    # Site navigation
│   │   └── Footer.astro        # Site footer
│   ├── content/             # Content collections
│   │   ├── config.ts           # Content schema definitions
│   │   └── peaks/              # Peak climb articles
│   ├── layouts/             # Page layouts
│   │   └── Layout.astro        # Main layout with SEO & security
│   ├── pages/               # File-based routing
│   │   ├── api/                # API endpoints
│   │   │   ├── search.ts       # Peak search API
│   │   │   └── analytics.ts    # Privacy analytics API
│   │   ├── peaks/              # Peak pages
│   │   ├── privacy.astro       # Privacy policy
│   │   └── about.astro         # About page
│   ├── styles/              # Global styles
│   └── utils/               # Utility functions
│       ├── security.ts         # Security utilities
│       ├── analytics.ts        # Privacy analytics
│       └── errorHandling.ts    # Error management
├── public/                  # Static assets
├── astro-summit-blog-rulebook.md  # Development guidelines
├── netlify.toml            # Netlify deployment config
└── package.json
```

## 🛠️ Setup & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nixtur00/eu-peaks-blog.git
   cd eu-peaks-blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:4321
   ```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run astro        # Run Astro CLI commands
```

## 📝 Content Management

### Adding a New Peak

1. Create a new `.md` file in `src/content/peaks/`
2. Use the following frontmatter structure:

```yaml
---
title: "Mont Blanc"
date: "2024-08-15"
country: "France"
peak_name: "Mont Blanc"
elevation_m: 4808
gps_coords: [45.8326, 6.8652]
difficulty_rating: "Expert"
ascent_type: "Mixed"
tags: ["Alps", "Mountaineering", "Technical"]
featured_image: "/images/france/mont-blanc.jpg"
description: "The highest peak in Western Europe"
duration_hours: 12
distance_km: 20
gear_required: ["Crampons", "Ice axe", "Helmet"]
best_season: ["June", "July", "August", "September"]
permits_required: false
---

# Your climb story here...
```

### Content Validation

All content is validated using Zod schemas defined in `src/content/config.ts`. This ensures:
- Required fields are present
- Data types are correct
- GPS coordinates are valid
- Elevation values are reasonable

## 🔐 Security Features

### Input Validation
- All user inputs are sanitized and validated
- Zod schemas enforce data integrity
- Rate limiting prevents API abuse

### Content Security
- Strict Content Security Policy
- Image source validation
- XSS protection throughout
- No third-party tracking scripts

### Privacy Protection
- Minimal data collection
- Anonymous analytics only
- User consent required
- Easy opt-out controls

## 🌐 Deployment

### Netlify (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy on Netlify**
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - The `netlify.toml` file handles the rest!

### Other Platforms
- **Vercel**: Works out of the box
- **GitHub Pages**: Static files only (APIs won't work)
- **Cloudflare Pages**: Full support with Workers

## 📊 Analytics & Privacy

This project implements privacy-focused analytics:

- **Anonymous data only** - No personal information collected
- **Opt-in required** - Users must consent to analytics
- **Transparent controls** - Easy to opt out anytime
- **GDPR compliant** - Respects all privacy regulations

Analytics data collected (with consent):
- Page views (anonymous)
- Performance metrics
- General location (country/region)
- Device type (for responsive design)

## 🎨 Customization

### Styling
- Built with TailwindCSS for easy customization
- Dark mode support included
- Responsive design patterns
- Custom color schemes in `tailwind.config.js`

### Content
- Easily add new countries and peaks
- Customizable difficulty ratings
- Flexible metadata fields
- Rich markdown support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Nikolay Demerdzhiev**
- Documenting the journey to summit the highest peak in every EU country
- Focus on safety, preparation, and environmental responsibility

## 🔗 Links

- [Live Site](https://your-site.netlify.app) (Add your deployed URL)
- [Privacy Policy](https://your-site.netlify.app/privacy)
- [About](https://your-site.netlify.app/about)

## 🏔️ Peak Progress

Track the journey across all 27 EU countries:

- 🇧🇬 Bulgaria - Mount Musala (2,925m) ✅
- 🇫🇷 France - Mont Blanc (4,808m) ⏳
- 🇦🇹 Austria - Grossglockner (3,798m) ⏳
- ... 24 more to go!

---

*Built with ❤️ for mountain enthusiasts and privacy advocates*
