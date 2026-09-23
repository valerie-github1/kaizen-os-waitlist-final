# Kaizen OS waitlist

A GitHub-ready early-access waitlist for **PhoennixAI**. The package includes a branded responsive website, privacy and waitlist-term pages, an Excel Online control workbook, and a practical Power Automate implementation guide for confirmation, invitations and joined-status updates.

## Project structure

```text
kaizen-os-waitlist-final/
├── index.html
├── privacy.html
├── terms.html
├── thank-you.html
├── kaizen-os-waitlist-system.xlsx
├── assets/
│   ├── PhoennixAI.jpg
│   ├── kaizen-os-product-hero.png
│   ├── kaizen-focus-dashboard.png
│   ├── kaizen-weekly-rhythm.png
│   ├── kaizen-progress-signals.png
│   ├── config.js
│   ├── gallery.js
│   ├── share.js
│   ├── site.css
│   └── waitlist.js
└── power-automate/
    ├── SETUP.md
    ├── intake-request-schema.json
    ├── joined-request-schema.json
    ├── confirmation-email.html
    ├── invitation-email.html
    ├── test-intake-payload.json
    └── workbook-lifecycle-test-result.md
```

## What is ready

The static website is complete and responsive, including keyboard focus states, terms acceptance, optional product-news consent, basic bot trapping, real-time email validation, submission loading feedback, an interactive three-panel product teaser gallery, and an accessible confirmation page. The FAQ now sends removal requests to the PhoennixAI agency website. The confirmation page provides X, LinkedIn and Instagram share actions. The Instagram action opens a native share sheet where available; otherwise, it copies the link and opens Instagram. The form becomes live when `assets/config.js` receives the submitted endpoint from the intake flow. The Excel workbook includes a 1,000-row `WaitlistTable`, controlled status/consent values, duplicate-email highlighting, a control dashboard, a Field map worksheet, and a verified local lifecycle test. The Power Automate guide specifies three flows: **intake**, **scheduled invitations** and **mark joined**.

## Quick launch

Upload the complete folder to a private GitHub repository. Follow [`power-automate/SETUP.md`](power-automate/SETUP.md) before changing `assets/config.js`. If publishing the site publicly, use the documented same-origin proxy pattern to keep the signed Power Automate URL out of browser source. Replace the privacy and terms placeholders with the final PhoennixAI legal entity and contact details, then obtain appropriate legal review before public launch.

## Pre-publish checklist

- Store the workbook in OneDrive for Business or SharePoint and restrict edit access.
- Create and test the flows with a non-production email address. The included `workbook-lifecycle-test-result.md` verifies the local workbook field lifecycle; a live Excel Online/Outlook test still requires the Microsoft 365 tenant and saved flow URL.
- Configure the form endpoint in `assets/config.js`.
- Replace `{{INVITATION_URL}}` in the invitation email template.
- Add the final PhoennixAI legal identity, address and privacy contact.
- Confirm the legal basis, retention criteria and optional marketing process for the launch jurisdiction.

## Notes on Excel Online

The Excel Online (Business) connector needs a workbook table for row operations, supports basic table filtering, and may delay committed write visibility. The automation uses a flow-generated unique `Lead ID` as the update key to avoid ambiguous updates. [1]

## References

[1]: https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/ "Excel Online (Business) connector — Microsoft Learn"
