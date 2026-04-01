# Flynt Website — Local Setup Guide

Marketing website for [tryflynt.ai](https://tryflynt.ai). Built with Astro 4 (static site), hosted on Firebase Hosting.

---

## Prerequisites

Install these tools before starting.

### 1. Node.js (v18+)

Check if already installed:
```bash
node -v
```

If not installed, use [nvm](https://github.com/nvm-sh/nvm) (recommended):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Restart terminal, then:
nvm install 20
nvm use 20
```

Or download directly from [nodejs.org](https://nodejs.org).

### 2. Firebase CLI (for deployment only)

```bash
npm install -g firebase-tools
firebase login
```

---

## Getting Started

### 1. Install dependencies

```bash
cd flynt-website
npm install
```

> This is the fix for the `sh: astro: command not found` error — `astro` is a local dependency that lives in `node_modules/.bin/` and must be installed first.

### 2. Run local dev server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

---

## Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server at localhost:4321 |
| `npm run build` | Build static site to `/dist` |
| `npm run preview` | Preview the built output locally |

---

## Deployment

Always deploy to **test** first. Only deploy to prod when explicitly confirmed.

```bash
# Deploy to test (flynt-website.web.app)
./deploy.sh test

# Deploy to production (tryflynt.ai)
./deploy.sh prod
```

The deploy script runs `npm run build` then deploys via the Firebase CLI.

| Environment | URL | Firebase Project |
|---|---|---|
| Test | flynt-website.web.app | `flynt-test` |
| Prod | tryflynt.ai | `flynt-ai` |

> Requires Firebase CLI to be installed and authenticated (`firebase login`).

---

## Project Structure

```
src/
  layouts/Layout.astro     # Shared nav, footer, global head
  pages/
    index.astro            # Homepage
    pricing.astro
    about.astro
    faq.astro
    blog/                  # Blog pages (powered by Sanity CMS)
  styles/global.css        # Global CSS variables and shared component styles
public/
  images/                  # SVGs, PNGs, screenshots
  videos/                  # Hero and feature videos
```

---

## Troubleshooting

### `sh: astro: command not found`
You haven't installed dependencies yet. Run:
```bash
npm install
```

### `firebase: command not found`
Install the Firebase CLI:
```bash
npm install -g firebase-tools
```

### `firebase login` issues
Make sure you're logged in with the correct Google account that has access to the `flynt-test` and `flynt-ai` Firebase projects.
