import {
  renderLeadEmail,
  renderLeadConfirm,
  renderEstimateEmail,
  renderEstimateAutoReply,
  renderNewsletterEmail,
  renderNewsletterConfirm
} from "./templates.js";

// Server-side floor for the client's own 1500ms honeypot-timing check.
// Kept a bit lower to tolerate clock skew / slow connections.
const MIN_FILL_MS = 1000;
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const MAX_BODY_BYTES = 20_000; // generous for a contact form; blocks abuse payloads
const MAX_FIELD_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 5000;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowed = isAllowedOrigin(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(allowed ? origin : "") });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, allowed ? origin : "");
    }

    if (!allowed) {
      return json({ error: "Forbidden" }, 403, "");
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: "Request too large." }, 413, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return json({ error: "Invalid request body." }, 400, origin);
    }

    const { formType, hp, renderedAt, sourcePage } = body || {};
    const fields = sanitizeFields(body && body.fields);

    // Bot checks: honeypot filled, or submitted faster than a human could.
    // Fail silently with a fake success so bots don't learn to adapt.
    const tooFast = typeof renderedAt === "number" && Date.now() - renderedAt < MIN_FILL_MS;
    if (hp || tooFast) {
      return json({ ok: true }, 200, origin);
    }

    if (env.RATE_LIMIT_KV) {
      const limited = await isRateLimited(request, env, ctx);
      if (limited) {
        return json({ error: "Too many requests. Please try again shortly." }, 429, origin);
      }
    }

    if (!fields || typeof fields !== "object") {
      return json({ error: "Missing form fields." }, 400, origin);
    }

    const email = typeof fields.email === "string" ? fields.email.trim() : "";
    if (!isValidEmail(email)) {
      return json({ error: "A valid email address is required." }, 400, origin);
    }

    let notify;
    let autoReply;
    switch (formType) {
      case "newsletter":
        notify = renderNewsletterEmail(fields, sourcePage);
        autoReply = renderNewsletterConfirm(fields);
        break;
      case "contact":
        notify = renderLeadEmail(fields, sourcePage);
        autoReply = renderLeadConfirm(fields);
        break;
      case "estimate":
        notify = renderEstimateEmail(fields, sourcePage);
        autoReply = renderEstimateAutoReply(fields);
        break;
      default:
        return json({ error: "Unknown form type." }, 400, origin);
    }

    try {
      await sendResendEmail(env, {
        to: env.NOTIFY_EMAIL,
        cc: formType === "estimate" ? env.ESTIMATE_CC_EMAIL : undefined,
        from: env.FROM_EMAIL,
        replyTo: email,
        subject: notify.subject,
        html: notify.html
      });

      if (autoReply) {
        ctx.waitUntil(sendResendEmail(env, {
          to: email,
          from: env.FROM_EMAIL,
          replyTo: env.NOTIFY_EMAIL,
          subject: autoReply.subject,
          html: autoReply.html
        }).catch((err) => console.error("Auto-reply send failed:", err)));
      }
    } catch (err) {
      console.error("Notification send failed:", err);
      return json({ error: "Unable to send right now. Please try again shortly." }, 502, origin);
    }

    // Newsletter sign-ups also go into the Mailchimp audience, when the
    // MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID secrets are set.
    if (formType === "newsletter" && env.MAILCHIMP_API_KEY && env.MAILCHIMP_AUDIENCE_ID) {
      ctx.waitUntil(addToMailchimp(env, email)
        .then(() => console.log("Mailchimp subscribed: newsletter"))
        .catch((err) => console.error("Mailchimp subscribe failed:", err)));
    }

    // Server-side copy of the browser's Lead event (Meta Conversions API).
    // Only runs when the visitor accepted cookies (the client sends `meta`
    // only then) and the access token secret is set.
    if (env.META_CAPI_TOKEN && body.meta && typeof body.meta.eventId === "string") {
      ctx.waitUntil(sendMetaEvent(request, env, { formType, fields, email, sourcePage, meta: body.meta })
        .then(() => console.log(`Meta CAPI sent: ${formType}`))
        .catch((err) => console.error("Meta CAPI send failed:", err)));
    } else {
      console.log(`Meta CAPI skipped: token=${!!env.META_CAPI_TOKEN} meta=${!!(body.meta && body.meta.eventId)}`);
    }

    return json({ ok: true }, 200, origin);
  }
};

// Adds one contact to a Mailchimp audience. If the address is already there
// (subscribed, unsubscribed or cleaned) Mailchimp answers 400 "Member Exists"
// and we leave it alone, so a repeat sign-up is harmless and someone who
// unsubscribed earlier is never silently re-subscribed. MAILCHIMP_STATUS can
// be "subscribed" (default) or "pending" (Mailchimp sends its own
// confirmation email first).
async function addToMailchimp(env, email) {
  const key = env.MAILCHIMP_API_KEY;
  const server = env.MAILCHIMP_SERVER_PREFIX || (key.includes("-") ? key.split("-").pop() : "");
  if (!/^[a-z]+\d+$/.test(server)) throw new Error("Mailchimp server prefix missing (expected e.g. us22)");

  const status = env.MAILCHIMP_STATUS === "pending" ? "pending" : "subscribed";
  const res = await fetch(
    `https://${server}.api.mailchimp.com/3.0/lists/${encodeURIComponent(env.MAILCHIMP_AUDIENCE_ID)}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`ts9:${key}`)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email_address: email.trim().toLowerCase(),
        status,
        tags: ["Website newsletter"]
      })
    }
  );
  if (res.ok) return;
  const text = await res.text().catch(() => "");
  if (res.status === 400 && /Member Exists/i.test(text)) return;
  throw new Error(`Mailchimp API error ${res.status}: ${text.slice(0, 300)}`);
}

const META_PIXEL_ID = "716800377403198";
const META_API_VERSION = "v21.0";

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value).trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Event name and id match what analytics.js fires in the browser, so Meta
// de-duplicates the pair. Email/phone/name are hashed as Meta requires.
async function sendMetaEvent(request, env, { formType, fields, email, sourcePage, meta }) {
  const isNewsletter = formType === "newsletter";
  const userData = {
    em: [await sha256Hex(email)],
    client_ip_address: request.headers.get("CF-Connecting-IP") || undefined,
    client_user_agent: request.headers.get("User-Agent") || undefined,
    fbp: typeof meta.fbp === "string" && meta.fbp ? meta.fbp.slice(0, 200) : undefined,
    fbc: typeof meta.fbc === "string" && meta.fbc ? meta.fbc.slice(0, 200) : undefined
  };
  const phone = typeof fields.phone === "string" ? fields.phone.replace(/\D/g, "") : "";
  if (phone.length >= 10) userData.ph = [await sha256Hex(phone)];
  const nameParts = typeof fields.name === "string" ? fields.name.trim().split(/\s+/).filter(Boolean) : [];
  if (nameParts.length) userData.fn = [await sha256Hex(nameParts[0])];
  if (nameParts.length > 1) userData.ln = [await sha256Hex(nameParts[nameParts.length - 1])];

  const customData = { form_type: formType };
  const low = Number(fields.estimateLow);
  if (formType === "estimate" && low > 0) {
    customData.value = low;
    customData.currency = "USD";
  }

  const payload = {
    data: [{
      event_name: isNewsletter ? "NewsletterSignup" : "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: meta.eventId.slice(0, 100),
      action_source: "website",
      event_source_url: typeof sourcePage === "string" ? sourcePage.slice(0, 500) : undefined,
      user_data: userData,
      custom_data: customData
    }]
  };
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE;

  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta CAPI error ${res.status}: ${text}`);
  }
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return allowedOrigins.includes(origin);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Caps every field to a sane length so a huge payload can't be used to send
// oversized outbound emails or inflate Resend usage. `message` gets more
// room since it's free text; everything else is short structured input.
function sanitizeFields(fields) {
  if (!fields || typeof fields !== "object") return {};
  const clean = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== "string") continue;
    const max = key === "message" ? MAX_MESSAGE_LENGTH : MAX_FIELD_LENGTH;
    clean[key] = value.slice(0, max);
  }
  return clean;
}

async function isRateLimited(request, env, ctx) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `rl:${ip}`;
  const count = Number(await env.RATE_LIMIT_KV.get(key)) || 0;
  if (count >= RATE_LIMIT_MAX) return true;
  ctx.waitUntil(env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS }));
  return false;
}

async function sendResendEmail(env, { to, cc, from, replyTo, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      cc: cc ? [cc] : undefined,
      reply_to: replyTo || undefined,
      subject,
      html
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin)
    }
  });
}
