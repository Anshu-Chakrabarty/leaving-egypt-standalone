/**
 * One-shot migration: static HTML → Astro + shared layout + CMS content stubs.
 * Run: node scripts/build-astro-site.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ensure = (p) => fs.mkdirSync(p, { recursive: true });
const write = (p, c) => {
  ensure(path.dirname(p));
  fs.writeFileSync(p, c);
  console.log('write', path.relative(ROOT, p));
};

const LINK_MAP = {
  'index.html': '/',
  'about.html': '/about',
  'pillars.html': '/pillars',
  'programs.html': '/programs',
  'resources.html': '/resources',
  'faq.html': '/faq',
  'contact.html': '/contact',
  'statement-of-faith.html': '/statement-of-faith',
  'privacy.html': '/privacy',
  'terms.html': '/terms',
  'disclaimer.html': '/disclaimer',
  'accessibility.html': '/accessibility',
  'thank-you.html': '/thank-you',
  '404.html': '/404',
};

function rewriteLinks(html) {
  let out = html;
  for (const [from, to] of Object.entries(LINK_MAP)) {
    // href="file.html" and href="file.html#hash"
    const re = new RegExp(`(href=["'])${from.replace('.', '\\.')}(#[^"']*)?(["'])`, 'g');
    out = out.replace(re, (_, a, hash = '', c) => `${a}${to}${hash}${c}`);
  }
  // FormSubmit _next / data-next absolute thank-you
  out = out.replaceAll(
    'https://leavingegypt.example.com/thank-you.html',
    'https://leavingegypt.example.com/thank-you'
  );
  return out;
}

function getMeta(page) {
  const src = fs.readFileSync(path.join(ROOT, `${page}.html`), 'utf8');
  const title = (src.match(/<title>\s*([^<]*?)\s*<\/title>/) || [])[1]?.replace(/\s+/g, ' ').trim() || '';
  const desc =
    (src.match(/name="description"\s+content="([^"]*)"/) ||
      src.match(/content="([^"]*)"\s+name="description"/) ||
      [])[1] || '';
  const robots = (src.match(/name="robots"\s+content="([^"]*)"/) || [])[1] || '';
  return { title, description: desc, robots };
}

// ---------- CSS / JS / images ----------
const css = fs.readFileSync(path.join(ROOT, '_extract_style.css'), 'utf8');
write(path.join(ROOT, 'src/styles/global.css'), css);

const siteConfigJs = fs.readFileSync(path.join(ROOT, '_extract_script_0.js'), 'utf8');
const mainJs = fs.readFileSync(path.join(ROOT, '_extract_script_1.js'), 'utf8');
write(path.join(ROOT, 'public/assets/js/site-config.js'), siteConfigJs);
write(path.join(ROOT, 'public/assets/js/main.js'), mainJs);

// Copy images
ensure(path.join(ROOT, 'public/assets/images'));
for (const f of fs.readdirSync(path.join(ROOT, 'assets/images'))) {
  fs.copyFileSync(
    path.join(ROOT, 'assets/images', f),
    path.join(ROOT, 'public/assets/images', f)
  );
}

// robots
write(
  path.join(ROOT, 'public/robots.txt'),
  `User-agent: *
Allow: /

Sitemap: https://leavingegypt.example.com/sitemap-index.xml
`
);

// ---------- Config files ----------
write(
  path.join(ROOT, 'astro.config.mjs'),
  `// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://leavingegypt.example.com',
  trailingSlash: 'never',
  integrations: [sitemap()],
});
`
);

write(
  path.join(ROOT, 'package.json'),
  JSON.stringify(
    {
      name: 'leaving-egypt',
      type: 'module',
      version: '1.0.0',
      engines: { node: '>=22.12.0' },
      scripts: {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
        astro: 'astro',
      },
      dependencies: {
        '@astrojs/sitemap': '^3.7.3',
        astro: '^7.1.6',
      },
    },
    null,
    2
  ) + '\n'
);

write(
  path.join(ROOT, 'src/config/site.ts'),
  `export const siteConfig = {
  orgName: 'Leaving Egypt',
  tagline: 'Freedom · Brotherhood · Purpose',
  shortMission:
    'A Christ-centered brotherhood helping men leave what holds them back and step into the life God designed.',
  footerMission:
    'A Christ-centered brotherhood helping men leave what holds them back and step into the life God designed — growing together in Faith, Family, Fitness, and Finance.',
  domain: 'https://leavingegypt.example.com',
  formEmail: 'sunbirdsrvresortvillage@gmail.com',
  social: {
    instagram: '#SOCIAL-LINK-PLACEHOLDER',
    facebook: '#SOCIAL-LINK-PLACEHOLDER',
    youtube: '#SOCIAL-LINK-PLACEHOLDER',
  },
} as const;

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/pillars', label: 'The Four Pillars' },
  { href: '/programs', label: 'Brotherhood' },
  { href: '/resources', label: 'Resources' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;
`
);

// ---------- Components ----------
write(
  path.join(ROOT, 'src/components/BrandMark.astro'),
  `<svg class="brand__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
  <circle cx="20" cy="17" r="8" fill="currentColor" opacity="0.9"/>
  <path d="M4 28 C 11 22, 17 25, 20 25 C 23 25, 29 22, 36 28" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <path d="M2 34 H 38" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
</svg>
`
);

write(
  path.join(ROOT, 'src/components/Header.astro'),
  `---
import BrandMark from './BrandMark.astro';
import { navLinks } from '../config/site';

const pathname = Astro.url.pathname.replace(/\\/$/, '') || '/';
---

<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="brand" href="/" aria-label="Leaving Egypt — home">
      <BrandMark />
      <span class="brand__text">
        <span class="brand__name">Leaving Egypt</span>
        <span class="brand__tag">Freedom &middot; Brotherhood &middot; Purpose</span>
      </span>
    </a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu">
      <svg class="icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke-linecap="round"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
    </button>
    <nav class="nav" id="primary-nav" aria-label="Primary" data-open="false">
      <ul class="nav__list">
        {navLinks.map((link) => {
          const current = link.href === pathname;
          return (
            <li>
              <a class="nav__link" href={link.href} aria-current={current ? 'page' : undefined}>
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
      <div class="nav__cta">
        <a class="btn btn--primary" href="/contact#interest">Begin Your Journey</a>
      </div>
    </nav>
  </div>
</header>
`
);

write(
  path.join(ROOT, 'src/components/Footer.astro'),
  `---
import BrandMark from './BrandMark.astro';
---

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/" aria-label="Leaving Egypt — home">
          <BrandMark />
          <span class="brand__text"><span class="brand__name">Leaving Egypt</span></span>
        </a>
        <p class="footer-mission">A Christ-centered brotherhood helping men leave what holds them back and step into the life God designed &mdash; growing together in Faith, Family, Fitness, and Finance.</p>
        <div class="footer-social" aria-label="Social media">
          <a data-social="instagram" href="#" aria-label="Instagram (link pending)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
          <a data-social="facebook" href="#" aria-label="Facebook (link pending)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2 0-3 1.3-3 3.2V11H8v3h3v7h3v-7h2.5l.5-3H14V9.4c0-.3.2-.4.5-.4z"/></svg></a>
          <a data-social="youtube" href="#" aria-label="YouTube (link pending)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none"/></svg></a>
        </div>
      </div>
      <div class="footer-col"><h4>Explore</h4><ul><li><a href="/about">About Leaving Egypt</a></li><li><a href="/pillars">The Four Pillars</a></li><li><a href="/programs">Brotherhood & Programs</a></li><li><a href="/resources">Resources</a></li><li><a href="/faq">FAQ</a></li></ul></div>
      <div class="footer-col"><h4>Connect</h4><ul><li><a href="/contact">Contact</a></li><li><a href="/contact#interest">Begin Your Journey</a></li><li><a href="/statement-of-faith">Statement of Faith</a></li><li><a href="/resources#updates">Resource Updates</a></li></ul></div>
      <div class="footer-col"><h4>Legal</h4><ul><li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms & Conditions</a></li><li><a href="/disclaimer">Disclaimer</a></li><li><a href="/accessibility">Accessibility</a></li></ul></div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>2026</span> Leaving Egypt. All rights reserved.</p>
      <nav aria-label="Legal">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/disclaimer">Disclaimer</a>
        <a href="/accessibility">Accessibility</a>
      </nav>
    </div>
  </div>
</footer>
`
);

write(
  path.join(ROOT, 'src/layouts/BaseLayout.astro'),
  `---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { siteConfig } from '../config/site';

interface Props {
  title: string;
  description: string;
  path?: string;
  robots?: string;
  jsonLd?: object | object[];
}

const {
  title,
  description,
  path = Astro.url.pathname,
  robots,
  jsonLd,
} = Astro.props;

const canonical = new URL(path === '/' ? '/' : path.replace(/\\/$/, ''), siteConfig.domain).href;
const ogImage = new URL('/assets/images/social-share.png', siteConfig.domain).href;
const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {robots && <meta name="robots" content={robots} />}
    <meta name="theme-color" content="#2a2118" />
    <meta name="color-scheme" content="light" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={siteConfig.orgName} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:alt" content="Leaving Egypt — a Christ-centered brotherhood for men." />
    <meta property="og:locale" content="en_US" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />

    <link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/assets/images/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Libre+Franklin:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    {schemas.map((schema) => (
      <script type="application/ld+json" set:html={JSON.stringify(schema)} />
    ))}
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <Header />
    <slot />
    <Footer />
    <script src="/assets/js/site-config.js" is:inline></script>
    <script src="/assets/js/main.js" is:inline></script>
  </body>
</html>
`
);

// ---------- Astro pages from extracted mains ----------
const pages = [
  { file: 'index', route: 'index.astro', path: '/' },
  { file: 'about', route: 'about.astro', path: '/about' },
  { file: 'pillars', route: 'pillars.astro', path: '/pillars' },
  { file: 'programs', route: 'programs.astro', path: '/programs' },
  { file: 'resources', route: 'resources.astro', path: '/resources' },
  { file: 'faq', route: 'faq.astro', path: '/faq' },
  { file: 'contact', route: 'contact.astro', path: '/contact' },
  { file: 'statement-of-faith', route: 'statement-of-faith.astro', path: '/statement-of-faith' },
  { file: 'privacy', route: 'privacy.astro', path: '/privacy' },
  { file: 'terms', route: 'terms.astro', path: '/terms' },
  { file: 'disclaimer', route: 'disclaimer.astro', path: '/disclaimer' },
  { file: 'accessibility', route: 'accessibility.astro', path: '/accessibility' },
  { file: 'thank-you', route: 'thank-you.astro', path: '/thank-you' },
  { file: '404', route: '404.astro', path: '/404' },
];

for (const p of pages) {
  const mainRaw = fs.readFileSync(path.join(ROOT, `_extract_main_${p.file}.html`), 'utf8');
  const main = rewriteLinks(mainRaw.trim());
  const meta = getMeta(p.file);
  const robotsProp = meta.robots ? `\n  robots="${meta.robots}"` : '';
  const content = `---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title=${JSON.stringify(meta.title)}
  description=${JSON.stringify(meta.description)}${robotsProp}
  path="${p.path}"
>
${main}
</BaseLayout>
`;
  write(path.join(ROOT, 'src/pages', p.route), content);
}

// ---------- CMS-editable content (JSON + MD) ----------
ensure(path.join(ROOT, 'src/content/settings'));
ensure(path.join(ROOT, 'src/content/faq'));
ensure(path.join(ROOT, 'src/content/pages'));

write(
  path.join(ROOT, 'src/content/settings/site.json'),
  JSON.stringify(
    {
      orgName: 'Leaving Egypt',
      tagline: 'Freedom · Brotherhood · Purpose',
      shortMission:
        'A Christ-centered brotherhood helping men leave what holds them back and step into the life God designed.',
      footerMission:
        'A Christ-centered brotherhood helping men leave what holds them back and step into the life God designed — growing together in Faith, Family, Fitness, and Finance.',
      domain: 'https://leavingegypt.example.com',
      formEmail: 'sunbirdsrvresortvillage@gmail.com',
      phone: '[PHONE-NUMBER]',
      mailingAddress: '[MAILING-ADDRESS]',
      social: {
        instagram: '#SOCIAL-LINK-PLACEHOLDER',
        facebook: '#SOCIAL-LINK-PLACEHOLDER',
        youtube: '#SOCIAL-LINK-PLACEHOLDER',
      },
    },
    null,
    2
  ) + '\n'
);

// Extract FAQ into editable JSON for CMS
const faqMain = fs.readFileSync(path.join(ROOT, '_extract_main_faq.html'), 'utf8');
const faqItems = [];
const itemRe =
  /<button class="accordion__trigger"[^>]*>\s*([\s\S]*?)\s*<svg[\s\S]*?<\/button>[\s\S]*?<div class="accordion__panel-inner">([\s\S]*?)<\/div>/g;
let m;
while ((m = itemRe.exec(faqMain))) {
  const question = m[1].replace(/\s+/g, ' ').trim();
  const answerHtml = m[2].trim();
  faqItems.push({ question, answer: answerHtml });
}
write(
  path.join(ROOT, 'src/content/faq/items.json'),
  JSON.stringify({ items: faqItems }, null, 2) + '\n'
);
console.log('FAQ items extracted:', faqItems.length);

// Page heroes / meta as CMS-editable files
const pageMetas = pages
  .filter((p) => !['404', 'thank-you'].includes(p.file))
  .map((p) => {
    const meta = getMeta(p.file);
    return {
      slug: p.file === 'index' ? 'home' : p.file,
      title: meta.title,
      description: meta.description,
      path: p.path,
    };
  });

for (const pm of pageMetas) {
  write(
    path.join(ROOT, 'src/content/pages', `${pm.slug}.json`),
    JSON.stringify(pm, null, 2) + '\n'
  );
}

// ---------- Sveltia CMS admin ----------
write(
  path.join(ROOT, 'public/admin/index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Content Admin | Leaving Egypt</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
  </body>
</html>
`
);

write(
  path.join(ROOT, 'public/admin/config.yml'),
  `# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json
# Sveltia CMS — WordPress-like editing for this static site.
# Login: GitHub (PAT for quick start, or OAuth authenticator for the whole team).
# Docs: https://sveltiacms.app/en/docs/start

backend:
  name: github
  repo: Anshu-Chakrabarty/leaving-egypt-standalone
  branch: main
  # For team login (recommended): deploy Sveltia CMS Authenticator (Cloudflare Worker)
  # then uncomment and set:
  # base_url: https://YOUR-AUTHENTICATOR.workers.dev

media_folder: public/assets/images/uploads
public_folder: /assets/images/uploads

# Local editing without GitHub: use Sveltia's local workflow while \`npm run dev\` is running.
# See https://sveltiacms.app/en/docs/workflows/local

collections:
  - name: settings
    label: Site Settings
    files:
      - name: site
        label: Site Settings
        file: src/content/settings/site.json
        fields:
          - { label: Organization Name, name: orgName, widget: string }
          - { label: Tagline, name: tagline, widget: string }
          - { label: Short Mission, name: shortMission, widget: text }
          - { label: Footer Mission, name: footerMission, widget: text }
          - { label: Domain (https://...), name: domain, widget: string }
          - { label: Form Recipient Email, name: formEmail, widget: string }
          - { label: Phone, name: phone, widget: string, required: false }
          - { label: Mailing Address, name: mailingAddress, widget: string, required: false }
          - label: Social Links
            name: social
            widget: object
            fields:
              - { label: Instagram URL, name: instagram, widget: string }
              - { label: Facebook URL, name: facebook, widget: string }
              - { label: YouTube URL, name: youtube, widget: string }

  - name: page_meta
    label: Page SEO
    label_singular: Page
    folder: src/content/pages
    extension: json
    create: false
    slug: "{{slug}}"
    fields:
      - { label: Slug, name: slug, widget: string }
      - { label: Browser Title, name: title, widget: string }
      - { label: Meta Description, name: description, widget: text }
      - { label: Path, name: path, widget: string }

  - name: faq
    label: FAQ
    files:
      - name: faq_items
        label: FAQ Items
        file: src/content/faq/items.json
        fields:
          - label: Questions
            name: items
            widget: list
            summary: "{{fields.question}}"
            fields:
              - { label: Question, name: question, widget: string }
              - { label: Answer (HTML allowed), name: answer, widget: text }

  - name: page_bodies
    label: Page Content (HTML)
    label_singular: Page Body
    description: Full page body markup. Edit carefully — this is the visible page content.
    folder: src/content/bodies
    extension: html
    format: yaml-frontmatter
    create: false
    slug: "{{slug}}"
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Body, name: body, widget: markdown }
`
);

// Also create HTML body files that CMS + Astro can share — better CMS UX for main content
// For now page_bodies collection references files we'll create as frontmatter+html from mains
ensure(path.join(ROOT, 'src/content/bodies'));

const bodyPages = [
  'home',
  'about',
  'pillars',
  'programs',
  'resources',
  'faq',
  'contact',
  'statement-of-faith',
  'privacy',
  'terms',
  'disclaimer',
  'accessibility',
  'thank-you',
];

const fileForBody = {
  home: 'index',
  about: 'about',
  pillars: 'pillars',
  programs: 'programs',
  resources: 'resources',
  faq: 'faq',
  contact: 'contact',
  'statement-of-faith': 'statement-of-faith',
  privacy: 'privacy',
  terms: 'terms',
  disclaimer: 'disclaimer',
  accessibility: 'accessibility',
  'thank-you': 'thank-you',
};

for (const slug of bodyPages) {
  const file = fileForBody[slug];
  const mainRaw = fs.readFileSync(path.join(ROOT, `_extract_main_${file}.html`), 'utf8');
  // Strip outer <main> for body content stored as HTML fragment
  let inner = mainRaw.trim();
  inner = inner.replace(/^<main[^>]*>/, '').replace(/<\/main>\s*$/, '');
  inner = rewriteLinks(inner);
  const meta = getMeta(file);
  const bodyFile = `---
title: ${JSON.stringify(meta.title)}
---
${inner.trim()}
`;
  write(path.join(ROOT, 'src/content/bodies', `${slug}.html`), bodyFile);
}

// Update Astro pages to load from content bodies where possible — more maintainable + CMS
// Rewrite pages to use content bodies
for (const p of pages) {
  if (p.file === '404') continue; // keep 404 as static Astro
  const slug = p.file === 'index' ? 'home' : p.file;
  const meta = getMeta(p.file);
  const robotsProp = meta.robots ? `\n  robots="${meta.robots}"` : '';
  const content = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import bodyRaw from '../content/bodies/${slug}.html?raw';

function stripFrontmatter(raw: string) {
  if (!raw.startsWith('---')) return raw;
  const end = raw.indexOf('---', 3);
  if (end === -1) return raw;
  return raw.slice(end + 3).trim();
}

const body = stripFrontmatter(bodyRaw);
---

<BaseLayout
  title=${JSON.stringify(meta.title)}
  description=${JSON.stringify(meta.description)}${robotsProp}
  path="${p.path}"
>
  <main id="main" set:html={body} />
</BaseLayout>
`;
  write(path.join(ROOT, 'src/pages', p.route), content);
}

// Fix 404 to stay with embedded main (already written) — rewrite once more without body import
{
  const mainRaw = fs.readFileSync(path.join(ROOT, '_extract_main_404.html'), 'utf8');
  const main = rewriteLinks(mainRaw.trim());
  const meta = getMeta('404');
  write(
    path.join(ROOT, 'src/pages/404.astro'),
    `---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title=${JSON.stringify(meta.title)}
  description=${JSON.stringify(meta.description)}
  robots="noindex, follow"
  path="/404"
>
${main}
</BaseLayout>
`
  );
}

// vercel.json
write(
  path.join(ROOT, 'vercel.json'),
  JSON.stringify(
    {
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      framework: 'astro',
    },
    null,
    2
  ) + '\n'
);

console.log('\\nMigration scaffold complete.');
