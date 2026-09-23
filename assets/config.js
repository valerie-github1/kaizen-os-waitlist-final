/*
 * Deployment configuration
 *
 * Option A (quick launch): paste the HTTPS POST URL from the Power Automate
 * "When an HTTP request is received" trigger below. Use a private repository
 * or replace this direct endpoint with a server-side proxy before a public launch.
 *
 * Option B (recommended public launch): set this to a same-origin proxy endpoint
 * such as /api/waitlist. The proxy keeps the Power Automate trigger URL private.
 */
window.KAIZEN_WAITLIST_CONFIG = {
  endpoint: "",
  demoMode: false
};
