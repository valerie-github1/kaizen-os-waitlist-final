# Kaizen OS waitlist — live Google Apps Script deployment and test

This runbook takes the waitlist from the packaged code to a real Google Sheet and a live form submission. The process uses a blank Google Sheet owned by the Google account that will send the confirmation emails.

## Before starting

Have the following files available from the repository:

| File | Use |
| --- | --- |
| `apps-script/Code.gs` | Complete form collector, Google Sheet setup, duplicate guard, dashboard, and optional email notifications. |
| `apps-script/appsscript.json` | Apps Script project manifest and authorisation scopes. |
| `assets/config.js` | Website endpoint setting to update after deployment. |

> The deployed `/exec` URL is a public form endpoint. This is expected for a public waitlist and is **not** a password, API key, or secret. Do not place any credentials in `assets/config.js`.

## 1. Create the live Google Sheet

Create a new blank Google Sheet in the Google account that should own the waitlist. Name it **Kaizen OS — Market waitlist**, then copy its ID from the URL. This Sheet becomes the live record of leads and will contain two tabs after setup: **Waitlist** and **Dashboard**.

## 2. Install the Apps Script files

At [script.google.com](https://script.google.com), create a **standalone** Apps Script project. Replace the default code in `Code.gs` with the full contents of `apps-script/Code.gs`, then replace the Sheet ID inside `SpreadsheetApp.openById(...)` with the copied ID.

Open **Project Settings**, activate **Show "appsscript.json" manifest file in editor**, then open `appsscript.json` in the editor and replace its contents with the repository version. Save the project.

## 3. Create the waitlist tabs and authorise the script

From the function selector at the top of the Apps Script editor, choose **`setupWaitlistSheet`** and select **Run**. The first run requires authorisation because it writes to the Sheet and can send confirmation emails. Use the Sheet owner account and approve the requested permissions.

When the function finishes, return to the Sheet. Confirm that:

1. A **Waitlist** tab exists with the expected headers, a Status dropdown, and filter controls.
2. A **Dashboard** tab exists with total-lead, seven-day, opt-in, and confirmation metrics.
3. No existing data was overwritten. The setup routine is safe to run again only when the header row remains unchanged.

## 4. Optional email configuration

In the Apps Script editor, open **Project Settings → Script properties** and add the following settings if wanted.

| Property | Value | Effect |
| --- | --- | --- |
| `OWNER_EMAIL` | Your notification email address | Receives a brief alert for each new lead. |
| `REPLY_TO` | Address used for confirmation-email replies | Keeps waitlist replies directed to the right inbox. |

Both properties are optional. The script writes the lead even if neither is configured. Confirmation messages are sent only while the account has available MailApp quota.

## 5. Deploy the public web app

In Apps Script select **Deploy → New deployment**. Click the gear icon, choose **Web app**, then use these settings:

| Setting | Required value |
| --- | --- |
| Description | `Kaizen OS waitlist live collector` |
| Execute as | **Me** (the Sheet owner) |
| Who has access | **Anyone** / the public option available for your Google account |

Select **Deploy** and approve any final Google permissions. Copy the resulting web-app URL that ends in **`/exec`**. Do **not** use the `/dev` URL because that only works for editor testing.

## 6. Update the website endpoint

Open `assets/config.js` and replace the empty endpoint value with the exact `/exec` URL:

```js
window.KAIZEN_WAITLIST_CONFIG = {
  endpoint: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
  demoMode: false,
  transport: "apps-script"
};
```

Keep `demoMode: false`. Save the file, then publish or redeploy the static website so the browser receives the updated configuration.

## 7. Run the live test

Use a test email address that you control and has not been submitted before. On the live waitlist page:

1. Enter a first name and test email address.
2. Optionally enter company and role.
3. Tick the required terms/privacy checkbox. For a separate marketing-consent test, also tick the optional product-news checkbox.
4. Submit once and wait for the confirmation page.

Then verify the following in the Sheet and inbox.

| Check | Expected result |
| --- | --- |
| Waitlist row | One new row appears. |
| Lead ID | Begins `KZ-`. |
| Status | `Waitlisted`. |
| Terms accepted at | Timestamp is present. |
| Updates opt-in | Matches the optional checkbox selection. |
| Confirmation sent | `Yes` when mail quota and authorisation are available. |
| Confirmation email | Arrives in the supplied test inbox. |
| Dashboard | Total-lead count increases. |

Submit the same email a second time. The collector must not append another row. A duplicate is treated as a successful no-op to prevent repeated browser submits from creating data duplication.

## 8. If a step fails

| Symptom | Resolution |
| --- | --- |
| `SPREADSHEET_ID is not configured` | Check the Sheet ID in `SpreadsheetApp.openById(...)`, then run `setupWaitlistSheet` again. |
| No waitlist row after website submit | Confirm the pasted URL ends in `/exec`, `demoMode` is `false`, and the website was republished after saving. |
| Permission or access error | Create a new deployment as the Sheet owner and select the public access option available to that account. |
| Row appears but no confirmation email | Check the sender account’s MailApp quota and authorisation. The lead is still recorded. |
| Duplicate test does not create a new row | This is correct behaviour. Test with a different email when testing a new lead. |

## Handoff point

Once you have copied the `/exec` URL, send it here. I will insert it in `assets/config.js`, rebuild the production package, and perform the website-side live-submit verification with your chosen test email address.
