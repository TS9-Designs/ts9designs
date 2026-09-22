const BRAND = {
  dark: "#0f172a",
  gold: "#d5a80f",
  bg: "#f8fafc",
  border: "#e2e8f0",
  muted: "#64748b"
};

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function wrapEmail({ preheader, title, bodyHtml }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader || "")}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr><td style="background:${BRAND.dark};padding:20px 28px;">
            <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.02em;">TS9Designs</span>
          </td></tr>
          <tr><td style="height:3px;line-height:3px;font-size:0;background:${BRAND.gold};">&nbsp;</td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 16px;font-size:18px;color:${BRAND.dark};">${escapeHtml(title)}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:16px 28px;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:12px;">
            TS9Designs &middot; info@ts9designs.com &middot; (215) 436-7333
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function fieldRows(pairs) {
  const rows = pairs.filter(([, value]) => value);
  if (!rows.length) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:6px 0;color:${BRAND.muted};font-size:13px;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;color:${BRAND.dark};font-size:14px;">${escapeHtml(value)}</td>
      </tr>
    `).join("")}
  </table>`;
}

function sourceLine(sourcePage) {
  if (!sourcePage) return "";
  return `<p style="margin-top:20px;font-size:12px;color:${BRAND.muted};">Source: ${escapeHtml(sourcePage)}</p>`;
}

// Contact/lead notification — covers both the homepage quick-contact form
// (name, email, message) and the full contact.html form (adds phone,
// project type, location, timeline, budget). Missing fields are simply
// omitted from the table.
export function renderLeadEmail(fields, sourcePage) {
  const bodyHtml = fieldRows([
    ["Name", fields.name],
    ["Email", fields.email],
    ["Phone", fields.phone],
    ["Project Type", fields.projectType],
    ["Location", fields.location],
    ["Timeline", fields.timeline],
    ["Budget", fields.budget]
  ]) + (fields.message
    ? `<p style="margin-top:16px;font-size:14px;color:${BRAND.dark};white-space:pre-wrap;">${escapeHtml(fields.message)}</p>`
    : "") + sourceLine(sourcePage);

  return {
    subject: "New Contact Form Submission",
    html: wrapEmail({
      preheader: `New lead: ${fields.name || fields.email || ""}`,
      title: "New Contact Form Submission",
      bodyHtml
    })
  };
}

export function renderEstimateEmail(fields, sourcePage) {
  const range = (fields.estimateLow || fields.estimateHigh)
    ? `$${fields.estimateLow || "0"} - $${fields.estimateHigh || "0"}`
    : "";
  const bodyHtml = fieldRows([
    ["Name", fields.name],
    ["Email", fields.email],
    ["Phone", fields.phone],
    ["Project Type", fields.projectType],
    ["Square Footage", fields.squareFootage],
    ["State", fields.state],
    ["City / Metro", fields.city],
    ["Scope", fields.scope],
    ["Timeline", fields.timeline],
    ["Estimate Range", range]
  ]) + sourceLine(sourcePage);

  return {
    subject: "Permit-Ready Estimate Request",
    html: wrapEmail({
      preheader: `Estimate request from ${fields.name || fields.email || ""}`,
      title: "Permit-Ready Estimate Request",
      bodyHtml
    })
  };
}

export function renderEstimateAutoReply(fields) {
  const range = (fields.estimateLow || fields.estimateHigh)
    ? `$${fields.estimateLow || "0"} - $${fields.estimateHigh || "0"}`
    : "your estimate range";
  const bodyHtml = `
    <p style="font-size:14px;color:${BRAND.dark};">Hi ${escapeHtml(fields.name || "there")},</p>
    <p style="font-size:14px;color:${BRAND.dark};">Thanks for requesting an estimate with TS9Designs. We've received your project details — your estimated range is <strong>${escapeHtml(range)}</strong>.</p>
    <p style="font-size:14px;color:${BRAND.dark};">A lead designer will follow up shortly to confirm scope and next steps.</p>
  `;
  return {
    subject: "We got your TS9Designs estimate request",
    html: wrapEmail({
      preheader: "We received your estimate request",
      title: "Request received",
      bodyHtml
    })
  };
}

export function renderNewsletterEmail(fields, sourcePage) {
  const bodyHtml = fieldRows([
    ["Email", fields.email]
  ]) + sourceLine(sourcePage);
  return {
    subject: "New Newsletter Subscriber",
    html: wrapEmail({
      preheader: `New subscriber: ${fields.email || ""}`,
      title: "New Newsletter Subscriber",
      bodyHtml
    })
  };
}
