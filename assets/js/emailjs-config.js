window.TS9_EMAILJS_PUBLIC_KEY = "cvQPyDef_aRF81Ya1";
window.TS9_EMAILJS_SERVICE_ID = "service_rhhe3l3";
window.TS9_EMAILJS_PERMIT_TEMPLATE_ID = "template_63b7m05";
// The EmailJS plan only allows 2 templates, both already used by the estimate
// flow (this one + the Auto-Reply template). The contact forms reuse this same
// template instead of a dedicated one — its {{message}} field is a pre-built
// block of labeled lines built in JS, so it renders fine for non-estimate leads too.
window.TS9_EMAILJS_CONTACT_TEMPLATE_ID = "template_63b7m05";
// Same 2-template-plan constraint as the contact forms above — reuse the
// estimate-request template instead of the nonexistent "template_ts9_newsletter".
window.TS9_EMAILJS_NEWSLETTER_TEMPLATE_ID = "template_63b7m05";
