# Leaving Egypt — Website

A complete, production-ready, **static** website for **Leaving Egypt**, a Christ-centered
men's organization and brotherhood. Built with semantic HTML5, modern CSS, and a small
amount of vanilla JavaScript. **No build step, no framework, no database, no server code.**

> **Important:** Several items on this site are intentionally left as clearly marked
> placeholders because they were not confirmed (see *Placeholders to Confirm* below).
> The Privacy Policy, Terms, Statement of Faith, Disclaimer, and Accessibility Statement
> are professionally written **drafts** and must be reviewed and approved by the client
> and, where appropriate, qualified legal counsel before launch.

---

## 1. Project Overview

- **Purpose:** Introduce Leaving Egypt, explain its Four-Pillar framework (Faith, Family,
  Fitness, Finance), invite men into brotherhood, and capture inquiries via web forms.
- **Type:** Multi-page static site (14 pages).
- **Forms:** Submit through [FormSubmit](https://formsubmit.co) to a temporary testing
  address (`avi1278@gmail.com`). No backend required.
- **Tracking:** None by default. No Google Analytics, no Meta Pixel, no third-party
  tracking is loaded.

## 2. File Structure

```
leaving-egypt/
├── index.html                 Home
├── about.html                 About Leaving Egypt
├── pillars.html               The Four Pillars
├── programs.html              Brotherhood & Programs
├── statement-of-faith.html    Statement of Faith (DRAFT)
├── resources.html             Resources + resource-updates form
├── faq.html                   Frequently Asked Questions
├── contact.html               Contact + interest form + contact form
├── privacy.html               Privacy Policy (DRAFT)
├── terms.html                 Terms & Conditions (DRAFT)
├── disclaimer.html            Website & Program Disclaimer (DRAFT)
├── accessibility.html         Accessibility Statement (DRAFT)
├── thank-you.html             Post-submission thank-you (noindex)
├── 404.html                   Custom not-found page (noindex)
├── robots.txt
├── sitemap.xml
├── README.md
└── assets/
    ├── css/styles.css         Full design system + components
    ├── js/site-config.js      Central configuration (edit me!)
    ├── js/main.js             Nav, accordion, reveal, form handling
    └── images/
        ├── favicon.svg        Original sunrise-over-horizon mark
        ├── favicon.ico
        ├── apple-touch-icon.png
        └── social-share.png   1200×630 Open Graph / social image
```

## 3. Preview the Site Locally

Because everything is static, you can open `index.html` directly in a browser. For the
JavaScript form handling and correct relative paths, a tiny local server is better:

```bash
# From inside the leaving-egypt/ folder:
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or use the VS Code "Live Server" extension.

## 4. Deploy It

Any static host works — no build required. Popular free/low-cost options:

- **Netlify / Vercel / Cloudflare Pages:** drag-and-drop the folder or connect a Git repo.
- **GitHub Pages:** push the folder to a repo and enable Pages.
- **Traditional hosting:** upload the folder contents via SFTP to your web root.

Always serve over **HTTPS** (all the hosts above provide free certificates).

## 5. Connect a Custom Domain

1. Point your domain's DNS to your host (follow the host's instructions).
2. Enable HTTPS / SSL on the host.
3. Update the domain everywhere the placeholder `https://leavingegypt.example.com`
   appears (see *Update Sitemap & Canonical URLs* below and `assets/js/site-config.js`).

## 6. How to Change the Form Recipient

**This is the most important launch step.** All forms currently deliver to the testing
address **`avi1278@gmail.com`**. To send submissions to the client's real inbox, update
the address in **two kinds of locations**:

### A) The `action` attribute in each form (required)

FormSubmit reads the recipient from each form's `action="https://formsubmit.co/EMAIL"`.
Search the project for `avi1278@gmail.com` and replace **every** occurrence in the HTML.
Current locations:

| File | Forms |
|------|-------|
| `contact.html` | Interest form **and** Contact form (2 occurrences) |
| `resources.html` | Resource-updates form (1 occurrence) |
| `index.html` | Organization JSON-LD `email` (1 occurrence — optional but recommended) |

Fastest method — a project-wide find & replace in your editor:

```
Find:     avi1278@gmail.com
Replace:  your-real-email@example.com
```

### B) The central config file (recommended)

`assets/js/site-config.js` holds the email in one place. When JavaScript is enabled, the
forms submit via this value and the footer/contact email links are generated from it.
Set the real address there:

```js
testRecipientEmail: "avi1278@gmail.com",   // <- test address
clientEmail: "",                            // <- put the real address here
useClientEmail: false,                      // <- set to true to use clientEmail
```

To go live: set `clientEmail` to the real address and `useClientEmail: true`.

> **Do both A and B.** The `action` attribute is what works when JavaScript is turned
> off; `site-config.js` is what the enhanced (JS-on) submission and the on-page email
> links use. Keeping them in sync avoids surprises.

## 7. Confirm the Form Recipient (FormSubmit activation)

The **first** time a form is submitted to a new address, FormSubmit sends that address a
one-time confirmation email. **Click the confirmation link** before real submissions will
be delivered. Do one test submission per form after changing the recipient, then check the
inbox (and spam folder) and confirm.

- Forms redirect to `thank-you.html` on success.
- The hidden `_subject`, `submission_source`, and `_page_url` fields make each email easy
  to identify and route.
- A honeypot field (`_honey`) and disabled captcha keep the flow smooth while filtering
  basic bots. If you receive spam, you can enable FormSubmit's captcha by changing
  `_captcha` to `true` in the forms.

## 8. How to Replace Placeholders

Placeholders are **visibly flagged** on the pages (styled pill labels) and use bracketed
tokens in the source. Search for the bracketed text or the class `placeholder-flag`.
Common tokens include:

```
[FOUNDER NAME]        [LEADERSHIP NAME/BIO]     [CONTACT EMAIL]
[PHONE NUMBER]        Add mailing address        Add phone number
Add effective date    Add governing state        Add state of formation
Add legal entity name Add business address        Add refund policy
Confirm program availability   Add program schedule   Add pricing or "free" status
Add location or online details Add downloadable file  Add full article
```

Replace the text and remove the surrounding `<span class="placeholder-flag">…</span>`
wrapper (or the whole line) once you have real content.

## 9. Update Program Information

`programs.html` is written as an adaptable framework. Each offering card shows a labeled
status flag. When offerings are confirmed:

1. Edit the offering copy in `programs.html`.
2. Replace the status flags (availability, schedule, pricing, location) with real details.
3. Update the "The practical specifics" section near the bottom.
4. Update the FAQ answers about cost / online-vs-in-person in `faq.html` to match.

## 10. Add Client-Approved Testimonials

The homepage (`index.html`) has three testimonial slots labeled
**"Client-approved testimonial needed."** Only publish testimonials you have **written
permission** to use. For each slot:

1. Replace the placeholder quote text with the approved testimonial.
2. Replace the attribution line (e.g., name / first name + last initial) as approved.
3. Remove the placeholder styling/label.

Never invent or paraphrase testimonials.

## 11. How to Replace Images

The site ships with **original inline-SVG illustrations and dividers** so nothing ever
appears as a broken image. To use photographs instead:

1. Add optimized image files to `assets/images/`.
2. Replace an inline SVG block (or add an `<img>`) where you want a photo, e.g.:
   ```html
   <img src="assets/images/your-photo.jpg" width="1200" height="750"
        alt="Descriptive alt text" loading="lazy" decoding="async">
   ```
3. Always include meaningful `alt` text (empty `alt=""` only for purely decorative images).
4. Keep dimensions set to avoid layout shift, and use `loading="lazy"` below the fold.

## 12. Image Sources & Licensing Notes

- **Current state:** All visuals are **original SVG** created for this project
  (favicon, social-share image, section dividers, and illustration tiles). No third-party
  photos are used, so there is nothing to license yet.
- **If you add photos:** use only properly licensed royalty-free sources such as
  [Unsplash](https://unsplash.com) or [Pexels](https://pexels.com), and record each
  image's source and license here:

  | File | Source | License | Photographer/Notes |
  |------|--------|---------|--------------------|
  | _(example)_ brotherhood.jpg | Unsplash | Unsplash License | _(add)_ |

- Do **not** present stock-photo subjects as actual Leaving Egypt members, staff, or
  participants. Do not use any images from other organizations.

## 13. Update Sitemap & Canonical URLs

The canonical URLs and Open Graph URLs are generated from the domain placeholder
`https://leavingegypt.example.com`. Before launch:

1. Replace that domain string across all `.html` files (find & replace).
2. Update `assets/js/site-config.js` `domain` value.
3. Edit `sitemap.xml`: update the `<loc>` domains and the `<lastmod>` date
   (currently a placeholder `2025-01-01`).
4. Edit `robots.txt`: update the `Sitemap:` URL.
5. Re-submit `sitemap.xml` in Google Search Console after launch.

## 14. Add Analytics Responsibly

None is included by default, and that is deliberate. If you add analytics later:

1. Choose a tool and add its snippet before `</head>` (prefer privacy-friendly, cookieless
   options where possible).
2. **Update the Privacy Policy** (`privacy.html`) to disclose the tool, what it collects,
   and why — see the *Cookies* and *How We Use Information* sections.
3. If the tool sets cookies or is used for advertising, add a **consent mechanism**
   (cookie banner) before it loads, as required in many jurisdictions.
4. Update the Content Security Policy (below) to allow the tool's domains.

## 15. Update Privacy & Cookie Disclosures

If site functionality changes (new forms, analytics, embedded media, payments), revise
`privacy.html` accordingly and update the effective/last-updated dates at the top. Do not
claim compliance certifications, encryption guarantees, or "no data collected" while forms
exist. Have counsel review before publishing.

## 16. Security Recommendations

- **HTTPS everywhere** (free via the recommended hosts).
- **Content Security Policy (CSP):** add a header at the host level. A reasonable starting
  point (adjust as you add services):
  ```
  Content-Security-Policy:
    default-src 'self';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src 'self' data:;
    script-src 'self';
    form-action https://formsubmit.co;
    frame-ancestors 'none';
    base-uri 'self';
  ```
  (Inline styles are used sparingly; `'unsafe-inline'` for styles keeps them working. If
  you add analytics, extend `script-src`/`connect-src` accordingly.)
- **External links** already use `rel="noopener noreferrer"` where they open new tabs; keep
  that pattern for any new outbound links.
- **No secrets** are stored in the site. FormSubmit needs no API key here.
- Add security headers where your host allows (`X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).

## 17. Accessibility Checklist (target: WCAG 2.2 AA)

- [x] Semantic landmarks (`header`, `nav`, `main`, `footer`) and one `<h1>` per page
- [x] Logical heading order
- [x] Skip-to-content link on every page
- [x] Keyboard-accessible menu, accordion, and forms
- [x] Visible focus states
- [x] Form labels tied to inputs; accessible, live-region validation errors
- [x] ARIA used only where needed (`aria-expanded`, `aria-controls`, `aria-live`)
- [x] `prefers-reduced-motion` respected
- [x] No information conveyed by color alone; no autoplaying audio
- [x] Decorative SVGs marked `aria-hidden`; meaningful ones have labels
- [ ] Re-test with a screen reader and automated tools (axe, Lighthouse) after content edits
- [ ] Re-check color contrast if you change the palette or add photos with text

## 18. SEO Launch Checklist

- [x] Unique `<title>` and meta description per page
- [x] Canonical URL on every page (update domain first)
- [x] Open Graph + Twitter/X card metadata
- [x] `robots.txt` + `sitemap.xml`
- [x] JSON-LD: Organization + WebSite (home), BreadcrumbList (interior), FAQPage (FAQ),
      ContactPage (contact)
- [x] `thank-you.html` and `404.html` set to `noindex`
- [ ] Replace domain placeholder, set real `lastmod`, submit sitemap to Search Console
- [ ] Confirm social-share image renders in a link-preview debugger

> Note: LocalBusiness, Review, Event, Person, and AggregateRating schema were intentionally
> **omitted** because no confirmed location, reviews, events, or leadership data exist.
> Add them only when you have real, verifiable data.

## 19. Legal-Review Checklist

- [ ] Privacy Policy reviewed by qualified legal counsel
- [ ] Terms & Conditions reviewed by qualified legal counsel; all `[BRACKETED]` items filled
- [ ] Disclaimer reviewed (religious, mental-health, medical/fitness, financial, results)
- [ ] Statement of Faith reviewed and formally approved by leadership
- [ ] Accessibility Statement reviewed and contact email confirmed
- [ ] Effective/last-updated dates set on all policy pages
- [ ] Organization status confirmed before using any status language
      (the site avoids calling Leaving Egypt a nonprofit/ministry/church/charity)

## 20. Final Client-Information Checklist

Please provide the following so placeholders can be replaced with confirmed information:

- [ ] Legal entity name
- [ ] Business / ministry / organization status
- [ ] Mailing address
- [ ] Primary phone number
- [ ] Permanent contact email
- [ ] Privacy-contact email
- [ ] Leadership names and biographies (and whether to publish them)
- [ ] Approved logo (if any) to replace the SVG placeholder mark
- [ ] Approved photos (with sources/licenses) if photos are desired
- [ ] Program names
- [ ] Program format (online / in person / both)
- [ ] Prices (or confirmation that programs are free)
- [ ] Refund policy (if paid programs)
- [ ] Event details (only when confirmed)
- [ ] Social media links (or confirmation there are none yet)
- [ ] Governing state (and state of formation) for Terms
- [ ] Approved Statement of Faith
- [ ] Approved testimonials (with written permission)
- [ ] Crisis and pastoral-care procedures/referrals
- [ ] Partnership and speaking-request process

---

### Quick "go-live" summary

1. Replace `avi1278@gmail.com` everywhere (§6) and update `site-config.js`.
2. Submit one test per form and click FormSubmit's confirmation email (§7).
3. Replace the domain placeholder and update `sitemap.xml` + `robots.txt` (§13).
4. Fill in or remove every visible placeholder flag (§8–§10).
5. Get the legal/faith pages reviewed and approved (§19).
6. Deploy over HTTPS and add security headers (§4, §16).

_This project was delivered as drafts and placeholders where information was not confirmed.
Nothing on the site should be treated as final until reviewed and approved by the client._
