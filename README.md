# Kaizen OS market-validation waitlist

A lightweight, GitHub-ready waitlist for **PhoennixAI**. It is designed to test demand for Kaizen OS before investing in a deeper product-access system: the public website collects interest, a Google Apps Script web app records leads in one Google Sheet, and the script can send a confirmation email.

## Why this approach

For a temporary market test, a full invitation workflow is unnecessary. This project now uses **Google Sheets + Google Apps Script** because it is easy to operate, cheap to run, and keeps the useful market signal in one simple spreadsheet. It records who is interested, when they joined, optional company/role context, and optional product-news consent. It does not promise access or build user accounts.

## Project structure

```text
kaizen-os-waitlist-final/
├── index.html
├── privacy.html
├── terms.html
├── thank-you.html
├── kaizen-os-waitlist-system.xlsx      ← retained reference workbook; not used by Apps Script
├── assets/
│   ├── PhoennixAI.jpg
│   ├── kaizen-os-product-hero.png
│   ├── kaizen-focus-dashboard.png
│   ├── kaizen-weekly-rhythm.png
│   ├── kaizen-progress-signals.png
│   ├── config.js                       ← paste the Apps Script /exec URL here
│   ├── navigation.js                   ← smooth Product and FAQ navigation
│   ├── gallery.js
│   ├── share.js
│   ├── site.css
│   └── waitlist.js
└── apps-script/
    ├── Code.gs                         ← Google Sheets collector + email confirmation
    ├── appsscript.json
    ├── SETUP.md
    └── test-payload.json
```

## What is ready

The website includes a responsive waitlist form, live email validation, submission loading feedback, an interactive three-panel product gallery with click-to-enlarge lightbox views, hover-scale and magnifying-glass thumbnail cues, smooth navigation links to **Product** and **FAQ**, an accessible confirmation page, and social sharing actions. The form is wired for an Apps Script `/exec` endpoint through `assets/config.js`.

The Apps Script package provisions a `Waitlist` tab and a simple `Dashboard` in a Google Sheet. Each new lead receives a generated ID and timestamp; duplicate email addresses are not appended; consent and optional-marketing preference are preserved; and a confirmation email is sent when the owner account has sufficient mail quota. An optional owner notification can be configured using Script Properties.

## Quick launch

1. Create a blank Google Sheet in the Google account that will own the market-test data.
2. Follow [`apps-script/SETUP.md`](apps-script/SETUP.md) to deploy `Code.gs` from a standalone Apps Script project as a web app.
3. Confirm that `assets/config.js` contains the deployed web app URL ending in `/exec`.
4. Publish the website and submit a non-production test email.
5. Confirm that the Google Sheet receives exactly one lead and that the confirmation email arrives.

> Treat the Apps Script `/exec` address as a **public form endpoint**, not a secret. Do not place passwords or keys in `assets/config.js`. The system includes client validation, a honeypot, duplicate-email protection, and a script lock, but is intentionally not an enterprise-grade anti-abuse system.

## Pre-publish checklist

- [ ] Deploy the Apps Script web app to run as its owner and configure public form access appropriately.
- [ ] Add the `/exec` URL to `assets/config.js` with `demoMode: false`.
- [ ] Add `OWNER_EMAIL` and `REPLY_TO` Script Properties if owner alerts and reply routing are wanted.
- [ ] Test with a non-production email address, including a duplicate submission.
- [ ] Confirm the Google account’s Apps Script mail quota is appropriate for expected traffic.
- [ ] Add the final PhoennixAI legal entity, postal address, and privacy contact before a broad public campaign.
- [ ] Review lead volume and profile in the Dashboard weekly; use that evidence to decide whether Kaizen OS merits the next investment phase.

## Reference sources

- [Apps Script web apps](https://developers.google.com/apps-script/guides/web)
- [SpreadsheetApp](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app)
- [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app)
