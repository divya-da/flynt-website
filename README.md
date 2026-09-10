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
├── tests/                      # node --test (npm test)
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

## Short Links

Campaign links are shortened to `tryflynt.ai/go/<slug>` — short enough for a
social bio, a video description, or reading aloud.

**These are not configured in this repo.** `/go/**` is rewritten to the
`shortLinkRedirect` Cloud Function, which lives in the app repo
(`functions/src/app_backend/shortLinks.js`) and looks the slug up in the
`channel_links` Firestore collection. Both hosting sites and that function are
in the same Firebase project, which is what makes the rewrite possible.

The only thing this repo owns is the rewrite in [firebase.json](firebase.json):

```json
{ "source": "/go/**", "function": { "functionId": "shortLinkRedirect", "region": "us-central1" } }
```

⚠️ **Never add a `/go` entry to `redirects`.** Firebase evaluates redirects
before rewrites, so a redirect would shadow the function and silently freeze
every short link at whatever that redirect said.

### Adding or changing a link

In the app's admin console → **Channel links**. Enter the partner, channel and
campaign, and the short link you want (`insta`). The console generates the
tracking URL and serves `/go/insta` immediately — no deploy, no engineer.

A slug is permanent once shared: changing it keeps the old one working forever,
and a slug is never handed to a different campaign. Retiring a link (archiving
it) stops it attributing but still lands the visitor on the site — the bio it
was printed in cannot be edited retroactively.

The parameters land on the marketing site, and
[public/utm-forwarding.js](public/utm-forwarding.js) carries them across to the
app so the sign-up is attributed to the channel rather than to Direct.

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
