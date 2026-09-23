/*
 * Google Apps Script deployment configuration
 *
 * 1. Follow apps-script/SETUP.md to create the Google Sheet and deploy Code.gs
 *    as a web app.
 * 2. Paste the resulting /exec URL below.
 *
 * The Apps Script /exec URL is a public form endpoint by design. Do not put a
 * password, API key or any other secret in this file.
 */
window.KAIZEN_WAITLIST_CONFIG = {
  endpoint: "",
  demoMode: false,
  transport: "apps-script"
};
