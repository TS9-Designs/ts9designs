const BRAND = {
  dark: "#0f172a",
  gold: "#d5a80f",
  page: "#f4f5f7",
  cardBg: "#f8fafc",
  border: "#f1f5f9",
  muted: "#94a3b8",
  text: "#334155",
  // Tightly-cropped square PNG (not the wide logo-v3.png, which has a lot
  // of transparent padding, or the .webp header logo — Outlook desktop's
  // Word rendering engine doesn't reliably display WebP in email).
  logoUrl: "https://www.ts9designs.com/apple-touch-icon.png"
};

const COMPANY = {
  addressLine: "TS9Designs, 2031 E Lehigh Ave 23B, Philadelphia, PA 19125, USA",
  facebook: "https://www.facebook.com/ts9designs",
  instagram: "https://www.instagram.com/ts9designs",
  website: "https://www.ts9designs.com",
  // PNG, not SVG — Gmail/Outlook don't reliably render <img src="*.svg">.
  facebookIcon: "https://www.ts9designs.com/assets/images/social-facebook.png",
  instagramIcon: "https://www.ts9designs.com/assets/images/social-instagram.png"
};

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function firstName(name) {
  return (name || "there").trim().split(/\s+/)[0];
}

// Icon badge — self-hosted PNGs for the real Facebook/Instagram marks
// (hotlinking a third-party icon CDN is fragile for something sent in
// outbound email forever).
function socialIconBadge(href, label, imgUrl) {
  return `<a href="${href}" style="display:inline-block;width:28px;height:28px;margin:0 4px;" aria-label="${escapeHtml(label)}"><img src="${imgUrl}" width="28" height="28" alt="${escapeHtml(label)}" style="display:block;border-radius:50%;"></a>`;
}

function footerBlock(complianceNote) {
  const social = [
    socialIconBadge(COMPANY.facebook, "Facebook", COMPANY.facebookIcon),
    socialIconBadge(COMPANY.instagram, "Instagram", COMPANY.instagramIcon)
  ].join("");
  return `
    <tr><td style="padding:20px 36px;background:${BRAND.cardBg};text-align:center;">
      <div style="margin-bottom:14px;">${social}</div>
      <p style="margin:0 0 6px;color:${BRAND.muted};font-size:11px;">info@ts9designs.com &middot; (215) 436-7333</p>
      <p style="margin:0 0 6px;color:${BRAND.muted};font-size:11px;">&copy; ${new Date().getFullYear()} TS9Designs. All rights reserved.</p>
      ${complianceNote ? `<p style="margin:0 0 6px;color:${BRAND.muted};font-size:11px;">${complianceNote}</p>` : ""}
      <p style="margin:0;color:${BRAND.muted};font-size:11px;">${escapeHtml(COMPANY.addressLine)}</p>
    </td></tr>`;
}

// Shared shell: white rounded card, thin gold top bar, centered wordmark.
// `header` is the centered eyebrow+heading block; `bodyHtml` is left-aligned
// content (field list, message, etc.); `footerNote` is small print above the
// footer bar (e.g. submission source); `complianceNote` is an accurate,
// per-email "why you're getting this" line — only set on emails sent to an
// external recipient, never on internal notification emails.
function wrapEmail({ preheader, header, bodyHtml, footerNote, complianceNote }) {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:${BRAND.page};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:${BRAND.page};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader || "")}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};padding:40px 0;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
          <tr><td style="height:4px;line-height:4px;font-size:0;background:${BRAND.gold};">&nbsp;</td></tr>
          <tr><td style="padding:36px 36px 8px;text-align:center;">
            <img src="${BRAND.logoUrl}" width="22" height="22" alt="TS9Designs" style="display:inline-block;vertical-align:middle;margin-right:8px;border-radius:4px;">
            <span style="font-size:13px;font-weight:700;letter-spacing:0.04em;color:${BRAND.dark};vertical-align:middle;">TS9Designs</span>
            ${header}
          </td></tr>
          <tr><td style="padding:24px 36px 8px;">
            ${bodyHtml}
          </td></tr>
          ${footerNote ? `<tr><td style="padding:4px 36px 28px;"><p style="margin:0;font-size:11px;color:${BRAND.muted};">${footerNote}</p></td></tr>` : `<tr><td style="height:12px;">&nbsp;</td></tr>`}
          ${footerBlock(complianceNote)}
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function eyebrowHeader(eyebrow, heading) {
  return `
    <p style="margin:18px 0 0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.gold};">${escapeHtml(eyebrow)}</p>
    <h1 style="margin:6px 0 0;font-size:22px;color:${BRAND.dark};font-weight:700;">${escapeHtml(heading)}</h1>`;
}

function fieldList(pairs) {
  const rows = pairs.filter(([, value]) => value);
  if (!rows.length) return "";
  return rows.map(([label, value]) => `
    <div style="padding:12px 0;border-bottom:1px solid ${BRAND.border};">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:3px;">${escapeHtml(label)}</div>
      <div style="font-size:15px;color:${BRAND.dark};font-weight:500;">${escapeHtml(value)}</div>
    </div>`).join("");
}

function messageBlock(message) {
  if (!message) return "";
  return `
    <div style="padding:12px 0;border-bottom:1px solid ${BRAND.border};">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:5px;">Message</div>
      <div style="font-size:14px;color:${BRAND.text};line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
    </div>`;
}

function ctaButton(href, label) {
  return `
    <div style="padding:24px 0 4px;text-align:center;">
      <a href="${href}" style="display:inline-block;background:${BRAND.gold};color:${BRAND.dark};text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.02em;padding:14px 32px;border-radius:15px;">${escapeHtml(label)}</a>
    </div>`;
}

function rangeBox(low, high) {
  if (!low && !high) return "";
  return `
    <div style="margin:18px 0 4px;text-align:center;">
      <div style="display:inline-block;background:${BRAND.cardBg};border-radius:12px;padding:16px 26px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:5px;">Estimated Range</div>
        <div style="font-size:24px;font-weight:700;color:${BRAND.dark};">$${escapeHtml(low || "0")} - $${escapeHtml(high || "0")}</div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Contact / lead — covers both the homepage quick-contact form (name, email,
// message) and the full contact.html form (adds phone, project type,
// location, timeline, budget). Missing fields are simply omitted.
// ---------------------------------------------------------------------------
export function renderLeadEmail(fields, sourcePage) {
  const bodyHtml =
    fieldList([
      ["Name", fields.name],
      ["Email", fields.email],
      ["Phone", fields.phone],
      ["Project Type", fields.projectType],
      ["Location", fields.location],
      ["Timeline", fields.timeline],
      ["Budget", fields.budget]
    ]) +
    messageBlock(fields.message) +
    ctaButton(`mailto:${fields.email}`, `Reply to ${escapeHtml(firstName(fields.name))}`);

  return {
    subject: "New Contact Form Submission",
    html: wrapEmail({
      preheader: `New lead: ${fields.name || fields.email || ""}`,
      header: eyebrowHeader("New Contact Message", fields.name || fields.email || "Website Lead"),
      bodyHtml,
      footerNote: sourcePage ? `Source: ${escapeHtml(sourcePage)}` : ""
    })
  };
}

export function renderLeadConfirm(fields) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:${BRAND.text};text-align:center;">We've received your message and will get back to you within 24 hours.</p>
    ${fields.message ? `<div style="margin-top:20px;padding:16px 20px;background:${BRAND.cardBg};border-radius:12px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:6px;">What you sent us</div>
      <div style="font-size:14px;color:${BRAND.text};line-height:1.6;white-space:pre-wrap;">${escapeHtml(fields.message)}</div>
    </div>` : ""}
  `;
  return {
    subject: "We got your message — TS9Designs",
    html: wrapEmail({
      preheader: "We received your message",
      header: `<h1 style="margin:18px 0 0;font-size:22px;color:${BRAND.dark};font-weight:700;">Thanks, ${escapeHtml(firstName(fields.name))}!</h1>`,
      bodyHtml,
      complianceNote: "You're receiving this because you submitted a message on our website."
    })
  };
}

// ---------------------------------------------------------------------------
// Permit-ready estimate
// ---------------------------------------------------------------------------
export function renderEstimateEmail(fields, sourcePage) {
  const bodyHtml =
    fieldList([
      ["Name", fields.name],
      ["Email", fields.email],
      ["Phone", fields.phone],
      ["Project Type", fields.projectType],
      ["Square Footage", fields.squareFootage],
      ["State / City", [fields.state, fields.city].filter(Boolean).join(" — ")],
      ["Scope", fields.scope],
      ["Timeline", fields.timeline],
      ["Estimate Range", (fields.estimateLow || fields.estimateHigh) ? `$${fields.estimateLow || "0"} - $${fields.estimateHigh || "0"}` : ""]
    ]) +
    ctaButton(`mailto:${fields.email}`, `Reply to ${escapeHtml(firstName(fields.name))}`);

  return {
    subject: "Permit-Ready Estimate Request",
    html: wrapEmail({
      preheader: `Estimate request from ${fields.name || fields.email || ""}`,
      header: eyebrowHeader("New Estimate Request", fields.name || fields.email || "Website Lead"),
      bodyHtml,
      footerNote: sourcePage ? `Source: ${escapeHtml(sourcePage)}` : ""
    })
  };
}

export function renderEstimateAutoReply(fields) {
  const bodyHtml = `
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.text};text-align:center;">We've received your estimate request and will follow up shortly.</p>
    ${rangeBox(fields.estimateLow, fields.estimateHigh)}
    <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">This range is preliminary, based on the details you shared — final pricing is confirmed after review.</p>
    <div style="margin:20px 0 0;padding:16px 20px;background:${BRAND.cardBg};border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.text};">Have floor plans, site photos, or reference images? Just reply to this email and attach them — it helps us scope your project faster.</p>
    </div>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};text-align:center;">A lead designer will be in touch soon to confirm scope and next steps.</p>
  `;
  return {
    subject: "We got your TS9Designs estimate request",
    html: wrapEmail({
      preheader: "We received your estimate request",
      header: `<h1 style="margin:18px 0 0;font-size:22px;color:${BRAND.dark};font-weight:700;">Thanks, ${escapeHtml(firstName(fields.name))}!</h1>`,
      bodyHtml,
      complianceNote: "You're receiving this because you requested an estimate on our website."
    })
  };
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export function renderNewsletterEmail(fields, sourcePage) {
  const bodyHtml = fieldList([["Email", fields.email]]);
  return {
    subject: "New Newsletter Subscriber",
    html: wrapEmail({
      preheader: `New subscriber: ${fields.email || ""}`,
      header: eyebrowHeader("New Newsletter Subscriber", fields.email || ""),
      bodyHtml,
      footerNote: sourcePage ? `Source: ${escapeHtml(sourcePage)}` : ""
    })
  };
}

export function renderNewsletterConfirm(fields) {
  const unsubscribeHref = `mailto:info@ts9designs.com?subject=${encodeURIComponent("Unsubscribe: " + (fields.email || ""))}`;
  const bodyHtml = `
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.text};text-align:center;">You're subscribed to updates from TS9Designs — project spotlights, permitting tips, and the occasional announcement.</p>
    <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">No spam. <a href="${unsubscribeHref}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe any time</a>.</p>
  `;
  return {
    subject: "You're subscribed — TS9Designs",
    html: wrapEmail({
      preheader: "You're subscribed to TS9Designs updates",
      header: `<h1 style="margin:18px 0 0;font-size:22px;color:${BRAND.dark};font-weight:700;">You're in!</h1>`,
      bodyHtml,
      complianceNote: "You're receiving this because you subscribed via our website."
    })
  };
}
