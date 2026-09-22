function TS9_initNewsletterForms() {
  const forms = document.querySelectorAll('.newsletter-form:not([data-newsletter-bound])');
  if (!forms.length) return;

  const emailJsConfig = {
    publicKey: window.TS9_EMAILJS_PUBLIC_KEY || '',
    serviceId: window.TS9_EMAILJS_SERVICE_ID || '',
    templateId: window.TS9_EMAILJS_NEWSLETTER_TEMPLATE_ID || ''
  };
  let emailJsReady = false;

  function ensureEmailJsReady() {
    if (
      typeof window.emailjs === 'undefined' ||
      !emailJsConfig.publicKey ||
      !emailJsConfig.serviceId ||
      !emailJsConfig.templateId
    ) {
      return false;
    }
    if (!emailJsReady) {
      window.emailjs.init({ publicKey: emailJsConfig.publicKey });
      emailJsReady = true;
    }
    return true;
  }

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
      const filledTooFast = Date.now() - Number(form.dataset.renderedAt || 0) < 1500;
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
        if (!ensureEmailJsReady()) {
          throw new Error('Newsletter signup is not configured yet. Add TS9_EMAILJS_NEWSLETTER_TEMPLATE_ID in assets/js/emailjs-config.js.');
        }
        const email = emailInput.value.trim();
        await window.emailjs.send(emailJsConfig.serviceId, emailJsConfig.templateId, {
          from_name: 'Newsletter Signup',
          reply_to: email,
          phone_number: '',
          project_type: 'Newsletter Signup',
          project_state: '',
          project_city: '',
          estimated_range: '',
          subject: 'New Newsletter Subscriber',
          message: [
            `Email: ${email}`,
            `Source: ${window.location.href}`
          ].join('\n'),
          email: email,
          to_email: 'info@ts9designs.com',
          form_type: 'newsletter',
          source_page: window.location.href
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
