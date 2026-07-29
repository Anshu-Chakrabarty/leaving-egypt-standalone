# Leaving Egypt — Website (Astro + Sveltia CMS)

Christ-centered men's brotherhood site. Built with **Astro** (shared layouts) and
**Sveltia CMS** (free GitHub-backed `/admin` editor — WordPress-like editing without WordPress).

## Quick start

```bash
npm install
npm run dev
```

- Site: http://localhost:4321  
- CMS: http://localhost:4321/admin/index.html  

## How content editing works

Anyone with GitHub access to this repo can edit content at **`/admin`**:

| CMS section | What it edits |
|---|---|
| **Site Settings** | Org name, mission, domain, form email, social links |
| **Page SEO** | Browser titles + meta descriptions |
| **FAQ** | Questions & answers (updates the FAQ page automatically) |
| **Page Content** | Full page body HTML (advanced — edit carefully) |

Saving in the CMS commits to GitHub → Vercel rebuilds → the live site updates.

### First-time CMS login

Open **https://leaving-egypt-standalone.vercel.app/admin/**

**Works immediately — paste a GitHub token**

1. Create a fine-grained PAT: https://github.com/settings/personal-access-tokens  
   - Repository: `leaving-egypt-standalone`  
   - Permission: **Contents → Read and write**
2. On `/admin`, paste the token under **Or paste a GitHub token** → Sign in.

**Team password (optional)**

1. Create the same kind of PAT as above.
2. In Vercel → Project → Settings → Environment Variables:
   - `CMS_PASSWORD` = the shared password your editors will type  
   - `CMS_GITHUB_TOKEN` = the PAT  
3. Redeploy, then editors only need the password on `/admin`.

### Local CMS (no GitHub auth)

While `npm run dev` is running, Sveltia supports a [local workflow](https://sveltiacms.app/en/docs/workflows/local) so you can edit files on disk without signing in.

## Project structure

```
public/
  admin/                 Sveltia CMS UI + config.yml
  assets/images/         Images + uploads/
  assets/js/main.js      Nav, accordion, forms
src/
  components/            Header, Footer, BrandMark (shared once)
  layouts/BaseLayout.astro
  content/
    settings/site.json   CMS: site settings
    pages/*.json         CMS: SEO
    faq/items.json       CMS: FAQ
    bodies/*.md          CMS: page bodies
  pages/                 Astro routes
  styles/global.css      Single design system
```

Old standalone `.html` files are preserved under `_legacy_html/` (not deployed).

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel: **Import Project** → select the repo (Framework: Astro, or leave auto-detect).
3. Build command: `npm run build` · Output: `dist`
4. After deploy, open `https://YOUR-DOMAIN/admin/`

Update `src/content/settings/site.json` → `domain` (and `astro.config.mjs` → `site`) to your real domain before launch.

## Forms

Forms still use [FormSubmit](https://formsubmit.co). Change the recipient in **Site Settings → Form Recipient Email** (injected into JS) **and** in the form `action=` attributes inside the Contact / Resources page bodies if you want no-JS fallbacks to match.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |

## Placeholders

Several items remain marked as placeholders (social links, legal dates, leadership, pricing, etc.). Confirm with the client before launch. Legal pages are drafts pending counsel review.
