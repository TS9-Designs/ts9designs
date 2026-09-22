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
        alert('You are subscribed. Thanks for signing up!');
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
        alert('You are subscribed. Thanks for signing up!');
        form.reset();
      } catch (error) {
        alert(error.message || 'Unable to subscribe right now.');
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
