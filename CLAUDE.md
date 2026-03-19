# Flynt Website — Claude Instructions

## Project Overview
Marketing website for **Flynt AI** (tryflynt.ai) — a client acquisition intelligence tool for recruiters, sales teams, and GTM operators. Built with **Astro** as a fully static site.

## Tech Stack
- **Framework:** Astro 4 (static output)
- **Styling:** Plain CSS in `<style>` blocks (per-page) + global styles
- **Hosting:** Firebase Hosting (two environments)
- **No build-time dependencies** beyond Astro itself

## Project Structure
```
src/
  layouts/Layout.astro     # Shared shell: nav, footer, global head
  pages/
    index.astro            # Homepage (main marketing page)
    pricing.astro
    about.astro
    faq.astro
  styles/global.css        # Global variables, resets, shared components (nav, footer, buttons, tags)
public/
  images/
    backgrounds/           # SVG/PNG background assets (World-Map.svg, purple-gradient-background2.png)
    screenshots/           # Product screenshot images
    logo-mark.svg
    logo-text.svg
    logo-with-text.svg
```

## Deployment

**Never use `vercel` or any other deployment tool.** Always use the deploy script:

```bash
# Deploy to test (flynt-website.web.app)
./deploy.sh test

# Deploy to production (tryflynt.ai)
./deploy.sh prod
```

The script runs `npm run build` then deploys via Firebase CLI.

- **Test:** `flynt-website.web.app` — Firebase project `flynt-test`
- **Prod:** `tryflynt.ai` — Firebase project `flynt-ai`

Always deploy to **test** first. Only deploy to prod when the user explicitly confirms.

## Development
```bash
npm run dev      # Local dev server (localhost:4321)
npm run build    # Build to /dist
npm run preview  # Preview built output
```

## Styling Conventions
- CSS lives either in `src/styles/global.css` (shared) or in `<style>` blocks at the bottom of each `.astro` page
- CSS custom properties are defined in `global.css` — use `var(--token)` throughout
- Key tokens: `--purple`, `--purple-bg`, `--purple-bg-2`, `--purple-200`, `--purple-300`, `--purple-900`, `--slate-50/200/500/600/700/900`, `--black`, `--white`
- Font: `--font-display` for headings, system sans for body
- Shared component classes: `.btn`, `.tag`, `.container`, `.section`, `.section-header`, `.section-header--center`

## Page Structure (index.astro sections in order)
1. **Hero** — light background, screenshot image
2. **Built for one purpose** — dark background with world map SVG + gradient (`#2B1F50`, `.positioning`)
3. **How It Works** — white background, 3-step cards
4. **Who It's For** — grey background (`var(--slate-50)`), audience cards
5. **Stats Bar** — dark gradient background, 4 stats with purple left-border on numbers
6. **Not For Everyone** — light background (`var(--slate-50)`)
7. **Final CTA** — white background

## Video Compression

To compress a video for web (e.g. hero.mp4):

```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1280:720" -movflags +faststart -acodec aac -b:a 128k output.mp4
```

- `-crf 28` — quality (lower = better, 23 is default; 28 is fine for background/hero video)
- `-preset slow` — better compression at cost of encode time
- `scale=1280:720` — downscale to 720p
- `-movflags +faststart` — move metadata to front for faster web playback
- `-acodec aac -b:a 128k` — re-encode audio to AAC 128kbps

## Design Notes
- Dark sections use `clip-path: polygon(0 120px, 100% 0, ...)` with negative `margin-top` to create diagonal transitions from the hero
- Purple accent: `var(--purple)` (`#7c3aed` range)
- Footer: flat `#25153e` (no gradient)
- Stat numbers have `border-left: 5px solid var(--purple)` — the border is on `.stat__number` only, not the label
- `-webkit-text-stroke` is used on bold headings for crispness
