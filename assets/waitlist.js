(() => {
  const form = document.querySelector('[data-waitlist-form]');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const message = form.querySelector('[data-form-message]');
  const config = window.KAIZEN_WAITLIST_CONFIG || {};

  function showMessage(text, tone = '') {
    message.textContent = text;
    message.className = `form-message ${tone ? `is-${tone}` : ''}`;
  }

  function redirectToThankYou(name) {
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    window.location.assign(`thank-you.html${params.toString() ? `?${params}` : ''}`);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

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
      redirectToThankYou(firstName);
      return;
    }

    if (!config.endpoint) {
      showMessage('The waitlist is not connected yet. Add the Power Automate endpoint in assets/config.js before publishing.', 'error');
      return;
    }

    button.disabled = true;
    button.textContent = 'Reserving your place…';
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
        showMessage(body.message || 'That email address is already on the waitlist.', 'success');
        button.textContent = 'You’re already registered';
        return;
      }
      if (!response.ok || body.ok === false) {
        throw new Error(body.message || 'We could not save your request. Please try again.');
      }
      redirectToThankYou(firstName);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'We could not submit your request. Please try again.', 'error');
      button.disabled = false;
      button.textContent = 'Request early access';
    }
  });
})();
