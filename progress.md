# TS9Designs Website — Progress Summary

_Last updated: 2026-08-25_

## Where we are

All work below has been made to the **local files only**. Nothing has been pushed to GitHub or deployed to `ts9designs.com` yet — that's the biggest outstanding step (see Next Steps).

---

## What's been accomplished

### 1. Homepage "Sample Drawings" section (new)
- Built a full-bleed, dark "light table" viewer: large stage + prev/next nav + horizontal filmstrip, replacing an earlier small cropped-thumbnail grid that didn't do the drawings justice.
- 11 sample sheets sourced from real project PDFs (electrical, structural, fire protection, architectural), spanning ~8 different past projects for variety.
- **Privacy pass on every sheet**: title blocks (client name, address, PE stamp/license number) were cropped out of each image before publishing. Verified visually, sheet by sheet.
- Click-to-zoom lightbox retained for full-size viewing.
- Raw source PDFs (123MB, 13 files) live in `assets/drawing-sets/` — kept per your instruction since they're the source library for this section, not linked directly from any page except one (Coffman Apts, which is intentionally public and matches the live sitemap).

### 2. Pricing
- `permit-estimate.html` estimates increased by exactly 40% (single multiplier change: `competitivenessFactor` 0.94 → 1.316). Verified by hand-calculation and in-browser test across multiple input combinations.

### 3. TBAE compliance cleanup (architecture-terminology)
- Synced all local pages to match the wording you'd already manually fixed live (e.g. "Building Design" instead of "Architectural" throughout).
- Fixed the pages live hadn't gotten to yet (`commercial.html`) and two spots where an automated find-replace had visibly mangled text on the live site.
- Site-wide sweep confirms **zero** remaining matches for "architect"/"architecture" across every `.html`, `.js`, and `.css` file.
- Removed the MedVet Dallas project everywhere (portfolio card, project modal, JS references, case-studies meta description) to match its removal on the live site.

### 4. Static-hosting migration (GitHub Pages readiness)
- GitHub Pages can't run PHP, so the homepage contact form and the sitewide newsletter form were rewritten to use EmailJS (client-side), matching the pattern `contact.html`/`permit-estimate.html` already used.
- Deleted all now-dead PHP: `process.php`, `newsletter-subscribe.php`, `contact-submit.php`, `permit-estimate-submit.php`, the PHPMailer library, `.htaccess`.
- **Action needed from you**: create one EmailJS template (`template_ts9_newsletter`, needs just `{{email}}`) in your EmailJS dashboard and confirm the ID in `assets/js/emailjs-config.js` — the newsletter form won't actually send until that template exists.

### 5. File cleanup / repo organization
- Removed ~350MB+ of dead weight: the legacy duplicate site folder, a 27MB backup zip, ~30 orphaned images, dead Font Awesome/Owl Carousel/Isotope CSS+JS (and their unused font files), unused jQuery/Bootstrap variants, a stray unused `smtpjs.com` script.
- Deleted orphaned/broken pages: `i.html`, `Project-2025.html`, `blog1.html` (and its dangling link), `projects.html`, `style.css`.
- Moved the 14 raw drawing-set PDFs from a loose pile in `assets/` into `assets/drawing-sets/`.
- **Repo is now ~197MB**, down from over 500MB at the start of this work.

### 6. Performance (from a real PageSpeed audit: was 61/100, LCP 36s, 21.6MB page weight)
- Optimized 40 homepage images (resized to display size, recompressed): **19.4MB → 4.7MB** (76% reduction). Originals backed up locally in case you want to compare.
- Removed fully-dead CSS/JS (`owl-carousel`, `fontawesome`) that was still being loaded but never used.
- Deferred non-critical CSS so it no longer blocks first paint.
- Fixed a missing `<h1>` on the homepage (was jumping straight to `<h2>` — an SEO/accessibility issue).
- Added `robots.txt` (explicitly allowing GPTBot, ClaudeBot, PerplexityBot, etc.) and `llms.txt` (site content map) for AI-agent browsability, plus Organization/WebSite JSON-LD on the homepage.
- One issue flagged but **not fixable from this repo**: PageSpeed's "Agentic Browsing" audit found a malformed ARIA role on a "Get a Quote" popup that isn't in the source code at all — it's injected by something outside the codebase (likely your host or an ad platform). Worth chasing down separately.
- **Next step**: re-run PageSpeed after deploying to confirm the score improvement — all of this was measured against the *live* site, and none of it is live yet.

### 7. Footer consistency
- Found **five different footer designs** across the 20 pages (including one page — Privacy Policy — with no footer at all), several with dead `href="#"` links.
- Unified all 20 pages onto one design: same colors, same logo treatment, same social icons (Facebook/Instagram/LinkedIn), zero dead links, newsletter form wired to EmailJS everywhere it appears.

### 8. Homepage hero & portfolio grid
- Fixed photos being harshly cropped (`object-fit: cover`) by switching to a "sharp photo over its own blurred backdrop" technique — full composition always visible, no more chopped-off shots.
- "Our Work" portfolio grid: briefly tried a masonry (variable-height) layout, then reverted to **uniform-sized cards** per your feedback, while keeping the no-crop technique — so it's consistent *and* nothing gets cut off.
- Tried a "premium" hero treatment (eyebrow label, gradient mesh background, icon badges, floating stat cards) — you said it looked weird, so **all of that was fully reverted**.
- Latest change: carousel is now taller (`min(58vh, 560px)` vs a fixed 400px) and overlaps ~65px up behind the sticky header on desktop, so photos render bigger with less wasted blur margin. Verified the header nav stays clickable on top and nothing clips. Mobile is unaffected (overlap only applies at 993px+ widths).

---

## Current state

- All changes above are sitting in the local working copy at `C:\Users\USER\Downloads\Martin\ts9designs website`.
- This folder is **not a git repository yet** (confirmed no `.git` present) — so there's no commit history and nothing to push.
- The live site (`ts9designs.com`) still reflects whatever was there before this session's work — none of these fixes are visible to visitors yet.

## Next steps

1. **Turn this into a git repo and push to GitHub** — nothing here is version-controlled yet. Once your GitHub company page/org is ready, this needs `git init`, a first commit, and a push to the repo you're setting up.
2. **Create the `template_ts9_newsletter` EmailJS template** (see item 4 above) — the newsletter signup form is wired up but won't send real emails until this exists.
3. **Deploy and re-test**: once live, re-run PageSpeed Insights to confirm the performance gains, and spot-check the pages in a real browser (this session's testing was all via local Python server + automated checks — worth a manual pass on the real domain).
4. **Chase down the injected popup** causing the "Agentic Browsing" ARIA issue — it's not in this codebase, so it's likely a host/platform-level script.
5. **Decide on the sitemap.xml** — the live one is server-generated and references the old page set (e.g. it doesn't yet reflect the MedVet removal or reorganized PDF paths); regenerate/resubmit after deploying.
6. Minor: `README.md` still mentions the legacy `TS9 Designs - Website Source Code/` folder as "archived" — that folder was fully deleted in the cleanup, so the README is slightly stale.
