# Flynt Marketing Website

Built with **Astro** — static site generator. Deploys to **Firebase Hosting**.

## Tech Stack
- **Framework:** Astro 4
- **Styling:** Plain CSS (CSS variables, no framework)
- **Fonts:** Syne (display) + DM Sans (body) via Google Fonts
- **Hosting:** Firebase Hosting
- **Build output:** Static HTML/CSS/JS (`dist/`)

## Project Structure

```
flynt-website/
├── src/
│   ├── layouts/
│   │   └── Layout.astro        # Base layout (nav, footer, SEO head)
│   ├── pages/
│   │   ├── index.astro         # Home page
│   │   ├── pricing.astro       # Pricing page
│   │   ├── about.astro         # About page
│   │   ├── faq.astro           # FAQ page
│   │   └── 404.astro           # 404 page
│   └── styles/
│       └── global.css          # Design tokens + global styles
├── public/
│   └── images/
│       ├── logo-mark.svg
│       └── logo-with-text.svg
├── astro.config.mjs
├── firebase.json
└── package.json
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
Open http://localhost:4321

### 3. Build for production
```bash
npm run build
```
Outputs to `dist/`

### 4. Deploy to Firebase
```bash
# First time only — login and init
firebase login
firebase init hosting   # select 'dist' as public directory, single-page app: NO

# Every deploy
npm run build && firebase deploy --only hosting
```

## Making Changes

### Updating copy
Each page is a self-contained `.astro` file in `src/pages/`. Open the relevant file and edit the HTML content directly. The structure is straightforward HTML — no special syntax needed for copy changes.

### Updating brand colours
All colours are CSS variables in `src/styles/global.css` under `:root`. Change `--purple` to update the primary colour site-wide.

### Adding a blog (v2)
When ready, install a CMS adapter:
```bash
npx astro add @astrojs/content-collections  # for MDX/local content
# or integrate Sanity: npx astro add sanity
```
Blog posts will live in `src/content/blog/` as `.mdx` files. Non-technical editors use the Sanity Studio UI.

### Adding new pages
Create a new `.astro` file in `src/pages/`. The filename becomes the URL route automatically (e.g. `src/pages/contact.astro` → `/contact`).

## CTA URL
All CTAs point to: `https://tryflynt.ai/`

To update this, search for `tryflynt.ai/subscription` across all files.

## SEO
- Meta title and description set per page via `Layout.astro` props
- Canonical URLs auto-generated from `astro.config.mjs` site URL
- OG tags included in every page
- Add a sitemap: `npx astro add sitemap` then rebuild

## Domain Setup (tryflynt.ai)
1. In Firebase Console → Hosting → Add custom domain → `tryflynt.ai`
2. Update DNS at your registrar with the records Firebase provides
3. SSL is automatic
