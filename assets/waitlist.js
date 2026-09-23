(() => {
  const form = document.querySelector('[data-waitlist-form]');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const buttonText = button.querySelector('.button-text');
  const message = form.querySelector('[data-form-message]');
  const emailInput = form.querySelector('#email');
  const emailFeedback = form.querySelector('#email-feedback');
  const config = window.KAIZEN_WAITLIST_CONFIG || {};

  function showMessage(text, tone = '') {
    message.textContent = text;
    message.className = `form-message ${tone ? `is-${tone}` : ''}`;
  }

  function setLoading(isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
    buttonText.textContent = isLoading ? 'Saving your interest…' : 'Register interest';
  }

  function validateEmail(forceMessage = false) {
    const value = emailInput.value.trim();
    const isValid = Boolean(value) && emailInput.validity.valid;
    emailInput.classList.remove('is-valid', 'is-invalid');
    emailInput.removeAttribute('aria-invalid');
    emailFeedback.className = 'email-feedback';

    if (!value && !forceMessage) {
      emailFeedback.textContent = '';
      return false;
    }
    if (isValid) {
      emailInput.classList.add('is-valid');
      emailFeedback.classList.add('is-valid');
      emailFeedback.textContent = 'Email looks good.';
      return true;
    }

    emailInput.classList.add('is-invalid');
    emailInput.setAttribute('aria-invalid', 'true');
    emailFeedback.classList.add('is-invalid');
    emailFeedback.textContent = value ? 'Enter a valid email address.' : 'Email address is required.';
    return false;
  }

  function redirectToThankYou(name) {
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    window.location.assign(`thank-you.html${params.toString() ? `?${params}` : ''}`);
  }

  emailInput.addEventListener('input', () => validateEmail(false));
  emailInput.addEventListener('blur', () => validateEmail(true));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const emailIsValid = validateEmail(true);
    if (!emailIsValid || !form.reportValidity()) {
      if (!emailIsValid) emailInput.focus();
      return;
    }

    const fields = Object.fromEntries(new FormData(form).entries());
    if (fields.website) return;

    const firstName = String(fields.firstName || '').trim();
    const payload = {
      firstName,
      email: String(fields.email || '').trim().toLowerCase(),
      company: String(fields.company || '').trim(),
      role: String(fields.role || '').trim(),
      updatesOptIn: fields.updatesOptIn === 'on',
      termsAccepted: fields.termsAccepted === 'on',
      source: 'Kaizen OS waitlist website',
      website: String(fields.website || '').trim()
    };

    if (!payload.termsAccepted) {
      showMessage('Please confirm that you agree to the waitlist terms before continuing.', 'error');
      return;
    }

    if (config.demoMode) {
      setLoading(true);
      window.setTimeout(() => redirectToThankYou(firstName), 260);
      return;
    }

    if (!config.endpoint) {
      showMessage('The waitlist is not connected yet. Add the Google Apps Script /exec URL in assets/config.js before publishing.', 'error');
      return;
    }

    setLoading(true);
    showMessage('Saving your interest…');

    try {
      // Apps Script web apps do not expose configurable CORS headers. no-cors
      // dispatches this simple POST; the Sheet and email confirmation are the
      // record of success after it is received by doPost(e).
      await fetch(config.endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      });
      redirectToThankYou(firstName);
    } catch (error) {
      showMessage('We could not send your request. Please check your connection and try again.', 'error');
      setLoading(false);
    }
  });
})();
