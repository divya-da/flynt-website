# Flynt Marketing Website

Built with **Astro** — static site generator. Deploys to **Firebase Hosting**.

## Tech Stack
- **Framework:** Astro 4
- **Styling:** Plain CSS (CSS variables, no framework)
- **Fonts:** Syne (display) + DM Sans (body) via Google Fonts
- **Hosting:** Firebase Hosting
- **Build output:** Static HTML/CSS/JS (`dist/`)
- **Blog CMS:** Sanity (project `m90jbgeh`, dataset `flynt-blog`)

## Project Structure

```
flynt-website/
├── src/
│   ├── layouts/
│   │   └── Layout.astro        # Base layout (nav, footer, SEO head)
│   ├── lib/
│   │   └── sanity.js           # Sanity client (blog content fetching)
│   ├── pages/
│   │   ├── index.astro         # Home page
│   │   ├── pricing.astro       # Pricing page
│   │   ├── about.astro         # About page
│   │   ├── faq.astro           # FAQ page
│   │   ├── blog/
│   │   │   ├── index.astro     # Blog listing page (/blog)
│   │   │   └── [slug].astro    # Individual blog post (/blog/[slug])
│   │   └── 404.astro           # 404 page
│   └── styles/
│       └── global.css          # Design tokens + global styles
├── public/
│   └── images/
│       ├── logo-mark.svg
│       └── logo-with-text.svg
├── .env                        # Sanity credentials (gitignored)
├── astro.config.mjs
├── firebase.json
└── package.json
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:
```
PUBLIC_SANITY_PROJECT_ID=m90jbgeh
PUBLIC_SANITY_DATASET=flynt-blog
```

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:4321

### 4. Build for production
```bash
npm run build
```
Outputs to `dist/`

## Deployment

Always deploy to **test first**, confirm it looks right, then deploy to prod.

```bash
./deploy.sh test   # deploys to https://flynt-website.web.app (Firebase project: flynt-test)
./deploy.sh prod   # deploys to https://tryflynt.ai (Firebase project: flynt-ai)
```

Never use Vercel or any other hosting tool — Firebase only.

## Blog

Blog content is managed in a separate Sanity Studio: [divya-da/flynt-blog](https://github.com/divya-da/flynt-blog)

**Studio URL:** https://flynt.sanity.studio/

### How to publish a new post
1. Go to https://flynt.sanity.studio/ and write/publish a post
2. Run `./deploy.sh test` — Astro fetches all posts from Sanity at build time
3. Check https://flynt-website.web.app/blog
4. Run `./deploy.sh prod` to go live

### Blog post fields
| Field | Description |
|---|---|
| `title` | Post title (also used to auto-generate slug) |
| `slug` | URL slug — click "Generate" after setting title |
| `publishedAt` | Publication date (controls ordering) |
| `excerpt` | Short summary shown on the blog index |
| `coverImage` | Optional cover image |
| `body` | Rich text body — supports headings, images, blockquotes |

## Making Changes

### Updating copy
Each page is a self-contained `.astro` file in `src/pages/`. Edit the HTML content directly.

### Updating brand colours
All colours are CSS variables in `src/styles/global.css` under `:root`. Change `--purple` to update the primary colour site-wide.

### Adding new pages
Create a new `.astro` file in `src/pages/`. The filename becomes the URL route automatically (e.g. `src/pages/contact.astro` → `/contact`).

## CTA URL
All CTAs point to: `https://app.tryflynt.ai/`

## SEO
- Meta title and description set per page via `Layout.astro` props
- Canonical URLs auto-generated from `astro.config.mjs` site URL
- OG tags included in every page

## Domain
- **Production:** tryflynt.ai → Firebase project `flynt-ai`
- **Test:** flynt-website.web.app → Firebase project `flynt-test`
