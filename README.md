# TS9Designs Website

Marketing site and lead-generation tooling for TS9Designs, an MEP / structural / fire-protection
building-design firm. Live at [ts9designs.com](https://www.ts9designs.com).

## Tech stack

Static HTML/CSS/JS. No build step, no bundler, no framework, no server-side code — this is
intentional, since the site is hosted on GitHub Pages, which only serves static files.

- **Bootstrap 5** (`vendor/bootstrap/`) for grid/base utilities, plus per-page inline `<style>`
  blocks for the actual design (see [Project structure](#project-structure) below).
- **jQuery** (`vendor/jquery/`) — a dependency of Bootstrap's bundled JS on the legacy pages only.
- **[EmailJS](https://www.emailjs.com/)** for all form submissions (contact form, permit-estimate
  request, newsletter signup) — client-side only, no backend. Config: `assets/js/emailjs-config.js`.
- **Google Fonts** (Montserrat), **Meta Pixel**, **Mailchimp** (embed script), **Microsoft Clarity**
  for analytics/marketing tags — all loaded directly in each page's `<head>`.

There used to be a PHP mail backend (`process.php`, `PHPMailer`, `.htaccess` URL rewrites). It was
removed because GitHub Pages can't execute PHP; all forms now submit via EmailJS instead.

## Local development

No install, no build. Either:

```bash
open index.html          # just open the file directly, or
python -m http.server    # serve it locally if a page needs same-origin fetches
```

Then visit `http://localhost:8000`.

## Deployment

Push to `main` — GitHub Pages (configured via this repo's Settings → Pages, "Deploy from a
branch") builds and deploys automatically, usually within a minute or two. No CI, no Actions
workflow.

- **Custom domain:** `www.ts9designs.com`, set via the `CNAME` file at the repo root. The apex
  domain (`ts9designs.com`, no `www`) redirects to `www` automatically (GitHub Pages' own
  canonicalization behavior).
- **DNS / caching:** the domain is proxied through **Cloudflare** in front of GitHub Pages. This
  exists specifically to work around GitHub Pages hard-capping `Cache-Control` at 10 minutes on
  every response, with no way to override it from this repo (no custom-headers support). Cloudflare
  has a Cache Rule that gives static assets (images/CSS/JS/fonts) a much longer edge/browser TTL.
  SSL/TLS mode must stay set to **Full** in Cloudflare (GitHub Pages already serves valid HTTPS).
- **Email is hosted separately** (Afrihost/`aserv.co.za`, unrelated to GitHub Pages) — `info@ts9designs.com`
  and related DNS records (MX/SPF/DKIM/DMARC) live in the same Cloudflare-managed zone as the
  website's records, set to **DNS only** (not proxied). There are also two other subdomains with
  their own independent mail setup on this same domain, unrelated to this site's codebase:
  `contact.ts9designs.com` and `projects.ts9designs.com` (both route through AWS SES). Don't touch
  their DNS records without checking what depends on them first.

## Project structure

```text
index.html, about.html, contact.html,            Current-generation pages: fully self-contained,
residential.html, commercial.html,                each with its own inline <style> block (a
permit-estimate.html, plans.html,                 "Modern Swiss Design System" — see the :root
privacypolicy.html                                CSS variables at the top of any of these files).

case-studies/                                      One page per completed project (individually
  index.html                                       written case studies), plus an index listing
  bishop-pond.html, ...                            them all. Same design-system pattern as above.

blogs.html, blog2.html                             Legacy pages — still linked from every page's
                                                    footer, but not yet migrated off the old
                                                    Bootstrap-template design system (see below).

assets/
  css/
    Ts9DesignsStyle.css, animated.css               Legacy stylesheet, used only by blogs.html/
                                                      blog2.html. Current-gen pages style inline.
    site-header.css                                 Shared header, used by the case-studies/ pages.
  js/
    emailjs-config.js                                EmailJS public key + service/template IDs.
    newsletter.js                                    Newsletter signup form (EmailJS), used sitewide.
    site-header.js                                   Case-studies pages' shared header behavior.
    website-controller.js, animation.js,             Misc. per-page or legacy behavior.
    click-scroll.js, jquery.sticky.js,
    imagesloaded.js
  email/                                             HTML email templates referenced by EmailJS.
  images/                                            All site photography and renders, organized
                                                      per-project (Bishop/, DolceVilla/, Optometry/,
                                                      etc.) plus numbered loose files used in the
                                                      homepage hero. See Image conventions below.
  drawing-sets/                                       Raw source PDFs for the homepage "Sample
                                                        Drawings" viewer (~130MB, kept intentionally
                                                        — see index.html's drawing-viewer section).

vendor/                                             Bootstrap + jQuery, vendored (not via CDN/npm).
```

## Image conventions

Photos on the homepage (hero slideshow, portfolio grid) use a "sharp photo over its own blurred
backdrop" technique rather than cropping: two `<img>` tags per photo, a blurred/scaled copy filling
the box (`object-fit: cover`) behind a full, uncropped copy (`object-fit: contain`) — see
`.slide-bg`/`.slide-fg` and `.thumb-bg`/`.thumb-fg` in `index.html`'s `<style>` block. This was a
deliberate choice (an earlier `object-fit: cover`-only version cropped photos harshly) — don't
revert to plain cropping without checking first.

Images should be sized close to their actual rendered CSS box (roughly 2x for retina), not left at
full source-camera resolution — PageSpeed Insights' "Improve image delivery" audit is the fastest
way to check what's currently oversized.

## Forms / EmailJS

Three EmailJS templates back the site's forms, configured in `assets/js/emailjs-config.js`:

| Template | Used by |
| --- | --- |
| `TS9_EMAILJS_CONTACT_TEMPLATE_ID` | `contact.html`, homepage contact form |
| `TS9_EMAILJS_PERMIT_TEMPLATE_ID` | `permit-estimate.html` |
| `TS9_EMAILJS_NEWSLETTER_TEMPLATE_ID` | Newsletter signup, footer, sitewide |

`.env` / `.env.example` at the repo root are leftover from the old PHP/SMTP setup and are **not
used anywhere in the current codebase** (nothing references `SMTP_*` or `MAILCHIMP_API_KEY`
outside those two files) — safe to ignore, or worth deleting if you want to clean it up. Note that
`.env` (gitignored, not committed) currently holds a real, live SMTP password from that old setup.

## Known gaps

- `blogs.html` / `blog2.html` haven't been migrated to the current design system.
- No automated tests, no linting, no CI — changes go live as soon as they're pushed to `main`.
