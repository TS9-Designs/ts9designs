// Confirmation and error messages use the site's "Sent" overlay (sent.js);
// the browser alert is only a fallback if that script didn't load.
function TS9_newsletterNotice(title, isError) {
  if (typeof window.TS9_showSent === 'function') {
    window.TS9_showSent(isError ? { error: true, title: title } : { kind: 'commercial', title: 'You are subscribed.', text: 'Thanks for signing up!' });
  } else {
    alert(isError ? title : 'You are subscribed. Thanks for signing up!');
  }
}

function TS9_initNewsletterForms() {
  const forms = document.querySelectorAll('.newsletter-form:not([data-newsletter-bound])');
  if (!forms.length) return;

  forms.forEach((form) => {
    form.setAttribute('data-newsletter-bound', 'true');
    form.dataset.renderedAt = Date.now();

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if (!emailInput) return;

      // Bot check: honeypot field filled, or submitted implausibly fast.
      // Fake a normal success so bots don't learn to adapt.
      const honeypot = form.querySelector('.hp-field');
      const renderedAt = Number(form.dataset.renderedAt || 0);
      const filledTooFast = Date.now() - renderedAt < 1500;
      if ((honeypot && honeypot.value) || filledTooFast) {
        TS9_newsletterNotice();
        form.reset();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';
      }

      try {
        const email = emailInput.value.trim();
        await window.TS9_sendMail('newsletter', { email: email }, {
          honeypot: honeypot ? honeypot.value : '',
          renderedAt: renderedAt
        });
        TS9_newsletterNotice();
        form.reset();
      } catch (error) {
        // Network failures ("Failed to fetch") get the plain message; errors
        // the mailer explains (e.g. rate limits) are shown as written.
        const msg = error && error.message && !/fetch|network/i.test(error.message) ? error.message : 'Unable to subscribe right now.';
        TS9_newsletterNotice(msg, true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText || 'Subscribe';
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', TS9_initNewsletterForms);
window.TS9_initNewsletterForms = TS9_initNewsletterForms;
