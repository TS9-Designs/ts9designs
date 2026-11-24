# ts9designs Mailer

Cloudflare Worker that sends form emails via [Resend](https://resend.com), replacing EmailJS. Handles the newsletter, contact, and permit-estimate forms on the main site (`assets/js/ts9-mailer.js` calls it).

Live at: `https://ts9designs-mailer.ts9designs.workers.dev/send`

## Deploy

```
npm install
npx wrangler login          # first time only
npx wrangler secret put RESEND_API_KEY   # first time only, or to rotate
npx wrangler deploy
```

Config (`ALLOWED_ORIGINS`, `NOTIFY_EMAIL`, `FROM_EMAIL`, `ESTIMATE_CC_EMAIL`) lives in `wrangler.toml`. The Resend API key is a Worker secret — never put it in `wrangler.toml` or any committed file.

## What's not in this repo: DNS records on Cloudflare

These live on the `ts9designs.com` zone in the Cloudflare dashboard, not in code. If mail delivery or the brand logo in inboxes ever breaks, check these first.

- **SPF** (`ts9designs.com` TXT): covers the existing mail host (aserv.co.za), not Resend directly — Resend delivery relies on DKIM alignment instead.
- **DKIM** (`default._domainkey.ts9designs.com` TXT): managed by the mail host's control panel (cPanel → Email Deliverability), selector `default`. If this ever needs regenerating, get the new value from cPanel and publish it here — Cloudflare doesn't know about it automatically since DNS and mail hosting are on different providers.
- **DMARC** (`_dmarc.ts9designs.com` TXT): `p=quarantine` (enforced, not `p=none`). Reports go to `rua=mailto:info@ts9designs.com` — worth glancing at those if delivery issues come up. Enforcing this required confirming SPF+DKIM pass cleanly for the *existing* mail host too, not just Resend, since DMARC applies to all mail from the domain.
- **BIMI** (`default._bimi.ts9designs.com` TXT): `v=BIMI1; l=https://www.ts9designs.com/assets/images/bimi-logo.svg;` — shows the logo next to emails in some inboxes (Yahoo, Apple Mail, Fastmail). **Not Gmail** — that needs a paid Verified Mark Certificate + registered trademark, not set up.

Check all of these at once: [mailhardener.com/tools/bimi-validator](https://www.mailhardener.com/tools/bimi-validator) (enter `default._bimi.ts9designs.com`).

## Bot protection

Client-side honeypot + minimum-fill-time checks are cosmetic — a non-browser client can bypass both. The real backstop is server-side: `RATE_LIMIT_KV` (Workers KV, 8 requests / 10 min / IP, see `src/index.js`). Don't deploy without this bound; without it, `fields.email` (attacker-controlled) becoming the confirmation email's recipient turns this into an open relay.

## Testing

```
curl -X POST https://ts9designs-mailer.ts9designs.workers.dev/send \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.ts9designs.com" \
  -d '{"formType":"contact","fields":{"name":"Test","email":"you@example.com","message":"hi"},"renderedAt":<ms-timestamp from 5s ago>}'
```

`formType` is `newsletter`, `contact`, or `estimate`. `renderedAt` must be more than ~1s in the past or the bot check silently no-ops (returns `{"ok":true}` without sending).

## Meta Conversions API (optional)

When `META_CAPI_TOKEN` is set, the Worker also sends each Lead (and newsletter
sign-up) to Meta server-side, de-duplicated against the browser Pixel by event
id. It only fires for visitors who accepted cookies.

    wrangler secret put META_CAPI_TOKEN        # Events Manager > Dataset > Settings > Conversions API > Generate access token
    wrangler secret put META_TEST_EVENT_CODE   # optional, only while checking Events Manager > Test events

Remove `META_TEST_EVENT_CODE` once verified, or test events will not count.

## Mailchimp newsletter sync (optional)

When both secrets below are set, each newsletter sign-up is also added to a
Mailchimp audience (tagged "Website newsletter"). Anyone already in the
audience, including people who unsubscribed, is left untouched. A Mailchimp
failure is logged and never shown to the visitor.

    wrangler secret put MAILCHIMP_API_KEY       # Account > Extras > API keys (ends in -us22)
    wrangler secret put MAILCHIMP_AUDIENCE_ID   # Audience > Settings > Audience name and defaults

Optional: `MAILCHIMP_STATUS` = `pending` makes Mailchimp send its own
confirmation email first (default is `subscribed`, because the Worker already
sends a welcome email). Watch for `Mailchimp subscribed` or
`Mailchimp subscribe failed` in `wrangler tail`.
