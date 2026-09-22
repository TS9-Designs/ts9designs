/**
 * Shared client for the mail-sending Worker (replaces the EmailJS SDK).
 * Every form on the site (newsletter, contact, homepage contact, permit
 * estimate) posts through this one function. Bot checks (honeypot, fill
 * time) run again server-side in the Worker — the client-side ones here are
 * just to skip a network round trip for obvious bots.
 */
function TS9_sendMail(formType, fields, opts) {
  opts = opts || {};
  const endpoint = window.TS9_MAILER_ENDPOINT;
  if (!endpoint) {
    return Promise.reject(new Error('Mailer is not configured yet. Set TS9_MAILER_ENDPOINT in assets/js/mailer-config.js.'));
  }

  const payload = {
    formType: formType,
    fields: fields,
    hp: opts.honeypot || '',
    renderedAt: opts.renderedAt || Date.now(),
    sourcePage: window.location.href
  };

  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function (res) {
    if (!res.ok) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        throw new Error(data.error || 'Unable to send right now.');
      });
    }
    return res.json().catch(function () { return { ok: true }; });
  });
}

window.TS9_sendMail = TS9_sendMail;
