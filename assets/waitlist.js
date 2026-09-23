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
    buttonText.textContent = isLoading ? 'Reserving your place…' : 'Request early access';
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
    const email = String(fields.email || '').trim().toLowerCase();
    const payload = {
      firstName,
      email,
      company: String(fields.company || '').trim(),
      role: String(fields.role || '').trim(),
      updatesOptIn: fields.updatesOptIn === 'on',
      termsAccepted: fields.termsAccepted === 'on',
      source: 'Kaizen OS waitlist website'
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
      showMessage('The waitlist is not connected yet. Add the Power Automate endpoint in assets/config.js before publishing.', 'error');
      return;
    }

    setLoading(true);
    showMessage('Submitting your request…');

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }

      if (response.status === 409) {
        setLoading(false);
        button.disabled = true;
        buttonText.textContent = 'You’re already registered';
        showMessage(body.message || 'That email address is already on the waitlist.', 'success');
        return;
      }
      if (!response.ok || body.ok === false) {
        throw new Error(body.message || 'We could not save your request. Please try again.');
      }
      redirectToThankYou(firstName);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'We could not submit your request. Please try again.', 'error');
      setLoading(false);
    }
  });
})();
