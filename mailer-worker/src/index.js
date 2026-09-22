import {
  renderLeadEmail,
  renderEstimateEmail,
  renderEstimateAutoReply,
  renderNewsletterEmail
} from "./templates.js";

// Server-side floor for the client's own 1500ms honeypot-timing check.
// Kept a bit lower to tolerate clock skew / slow connections.
const MIN_FILL_MS = 1000;
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_SECONDS = 600;

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

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return json({ error: "Invalid request body." }, 400, origin);
    }

    const { formType, fields, hp, renderedAt, sourcePage } = body || {};

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
        break;
      case "contact":
        notify = renderLeadEmail(fields, sourcePage);
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
        from: env.FROM_EMAIL,
        replyTo: email,
        subject: notify.subject,
        html: notify.html
      });

      if (autoReply) {
        ctx.waitUntil(sendResendEmail(env, {
          to: email,
          from: env.FROM_EMAIL,
          subject: autoReply.subject,
          html: autoReply.html
        }).catch((err) => console.error("Auto-reply send failed:", err)));
      }
    } catch (err) {
      console.error("Notification send failed:", err);
      return json({ error: "Unable to send right now. Please try again shortly." }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
  }
};

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return allowedOrigins.includes(origin);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function isRateLimited(request, env, ctx) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `rl:${ip}`;
  const count = Number(await env.RATE_LIMIT_KV.get(key)) || 0;
  if (count >= RATE_LIMIT_MAX) return true;
  ctx.waitUntil(env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS }));
  return false;
}

async function sendResendEmail(env, { to, from, replyTo, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
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
