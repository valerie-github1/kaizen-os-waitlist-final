# Kaizen OS waitlist automation setup

This package implements the requested lifecycle: a visitor submits the website form, Power Automate records the request in **WaitlistTable**, Outlook sends a confirmation email, an operator changes a record to **Invited**, a scheduled flow sends the invitation, and Kaizen OS can later signal that a person has joined. The supplied workbook already contains the required **WaitlistTable**. The configured version expands it to 1,000 data rows and adds an auditable **Terms accepted at** column.

## Choose a connection pattern before publishing

The direct Power Automate trigger is the fastest way to launch, but its signed URL would be present in a public static website. A same-origin proxy is the safer production option because it keeps the Power Automate URL private and can apply rate limiting. Both patterns preserve the requested Excel and Outlook workflow.

| Approach | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- |
| **Direct form to Power Automate** | Fastest implementation; the signed flow URL is visible in browser source and needs monitoring. Use only for a controlled or private launch. | Depends on the Power Automate licence. | Low |
| **Same-origin proxy to Power Automate** | Keeps the flow URL private and allows rate limiting, origin checks and abuse controls; adds a small serverless endpoint. | Usually covered by the selected hosting plan; Power Automate licensing still applies. | Moderate |

This repository supports both patterns through `assets/config.js`. Leave `endpoint` empty until the required flow has been saved. For a direct controlled launch, paste the flow URL. For a public launch, set it to a same-origin proxy path such as `/api/waitlist`.

> **Important:** The `When an HTTP request is received` trigger can be subject to premium Power Automate licensing. Confirm the licence available in the target Microsoft 365 tenant before choosing the direct pattern. Do not share the generated signed trigger URL in documentation, email or public tickets.

## 1. Store the workbook in Microsoft 365

Upload `kaizen-os-waitlist-system.xlsx` to a stable location in **OneDrive for Business** or a SharePoint document library. Do not rename the `Waitlist` sheet, the `WaitlistTable` table, or its column headings after creating the flows. Give only the operating team edit access to the workbook. The Excel Online (Business) connector requires a workbook table and exposes actions for listing, adding and updating table rows. [1]

The column names used below must match the workbook exactly, including spaces and case for key columns:

| Workbook column | Use in the system |
| --- | --- |
| Lead ID | Unique flow-generated key; use this as the update key whenever possible. |
| First name, Email, Company / Organisation, Role | Details captured from the waitlist form. |
| Joined at | UTC timestamp recorded at intake. |
| Status | `Waitlisted`, `Reviewing`, `Invited`, `Joined` or `Declined`. |
| Updates opt-in, Terms accepted at | Consent and preference audit trail. |
| Confirmation sent, Invitation sent, Invitation date, Joined date | Automation state and operational timestamps. |
| Source, Notes | Attribution and internal operator notes. |

## 2. Build the intake flow

Create an **Instant cloud flow** named `Kaizen OS — Waitlist intake` with the **When an HTTP request is received** trigger. Paste the contents of [`intake-request-schema.json`](intake-request-schema.json) into the trigger’s JSON schema field, then save once to generate the HTTP POST URL. Do not expose that URL publicly unless you have deliberately chosen the direct controlled-launch pattern.

Add the following actions in order. Configure the Excel file and table by browsing to the workbook rather than typing a path.

1. Add a **Compose** action named `Normalised email` with this expression:

   ```text
   toLower(trim(triggerBody()?['email']))
   ```

2. Add a **Compose** action named `Lead ID` with this expression:

   ```text
   concat('KZ-', formatDateTime(utcNow(),'yyyyMMddHHmmss'), '-', substring(guid(),0,8))
   ```

3. Add **Excel Online (Business) → List rows present in a table**. Select `WaitlistTable` and set **Filter Query** to the expression below. The Excel connector supports basic `eq`, `ne`, `contains`, `startswith` and `endswith` filtering; use a table that is not open for editing while testing.

   ```text
   concat('Email eq ''', outputs('Normalised_email'), '''')
   ```

4. Add a **Condition** with this expression. If it evaluates to true, the email already exists.

   ```text
   greater(length(body('List_rows_present_in_a_table')?['value']), 0)
   ```

5. In the **Yes** branch, add a **Response** action: status code `409`, header `Access-Control-Allow-Origin` set to the exact website origin, for example `https://waitlist.example.com`, and this body:

   ```json
   { "ok": false, "message": "That email address is already on the waitlist." }
   ```

6. In the **No** branch, add **Excel Online (Business) → Add a row into a table**. Map every field below. Use the exact text values `Yes` and `No` because the workbook validations use those values.

   | Field | Value |
   | --- | --- |
   | Lead ID | `outputs('Lead_ID')` |
   | First name | `trim(triggerBody()?['firstName'])` |
   | Email | `outputs('Normalised_email')` |
   | Company / Organisation | `trim(coalesce(triggerBody()?['company'], ''))` |
   | Role | `trim(coalesce(triggerBody()?['role'], ''))` |
   | Joined at | `utcNow()` |
   | Status | `Waitlisted` |
   | Updates opt-in | `if(equals(triggerBody()?['updatesOptIn'], true), 'Yes', 'No')` |
   | Confirmation sent | `No` |
   | Invitation sent | `No` |
   | Invitation date | leave blank |
   | Joined date | leave blank |
   | Source | `coalesce(triggerBody()?['source'], 'Kaizen OS waitlist website')` |
   | Notes | leave blank |
   | Terms accepted at | `if(equals(triggerBody()?['termsAccepted'], true), utcNow(), '')` |

7. Add **Outlook → Send an email (V2)**. Set **To** to `outputs('Normalised_email')`, set the subject to `You’re on the Kaizen OS early-access list`, and copy the HTML from [`confirmation-email.html`](confirmation-email.html) into the email body. Mark the body as HTML.

8. Add **Excel Online (Business) → Update a row**. Set **Key Column** to `Lead ID`, **Key Value** to `outputs('Lead_ID')`, and set **Confirmation sent** to `Yes`. Map the remaining columns from the row added in step 6 so the update does not clear them.

9. Add a **Response** action after the update: status code `201`, header `Access-Control-Allow-Origin` set to the exact production website origin, and body:

   ```json
   { "ok": true }
   ```

The website deliberately sends JSON as `text/plain;charset=UTF-8`, which avoids a browser preflight request. The response still needs the `Access-Control-Allow-Origin` header for the browser to read it. If the flow does not return the expected response in testing, use the same-origin proxy pattern rather than weakening the browser-side UX.

## 3. Connect the website

Open `assets/config.js` in the repository.

For a **controlled direct launch**, paste the saved Power Automate HTTP POST URL in the `endpoint` value and set `demoMode` to `false`. Run a first test using [`test-intake-payload.json`](test-intake-payload.json) in a REST client, then use the website form and confirm the following results: one Excel row appears; the confirmation email arrives; `Confirmation sent` changes to `Yes`; and a duplicate submission returns the existing-list message.

For a **public launch**, set `endpoint` to a same-origin proxy address, such as `/api/waitlist`. The proxy should validate the payload, drop requests with the honeypot field, rate-limit by IP and forward the same JSON to the secret Power Automate URL. Keep the signed flow URL in the proxy’s secret store rather than JavaScript source control.

## 4. Build the scheduled invitation flow

Create a **Scheduled cloud flow** named `Kaizen OS — Invitation wave`. Use the **Recurrence** trigger, initially set to once per day at a quiet operating time. Power Automate supports scheduled cloud flows with a selected frequency, time zone and start time. [2]

Add **Excel Online (Business) → List rows present in a table** for `WaitlistTable`. Set its **Filter Query** to:

```text
Status eq 'Invited'
```

Turn on pagination and set the threshold above the expected invitation-wave size. The connector returns up to 256 rows by default, and filtered/sorted results can have a short delay, so do not use the spreadsheet as a high-frequency transactional store. [1]

Add **Filter array** using the `value` from the list action, with this condition:

```text
@equals(item()?['Invitation sent'], 'No')
```

Add **Apply to each** using the Filter array output. In its settings, turn off concurrency or set the degree of parallelism to `1` to avoid workbook write contention. Within the loop:

1. Use **Outlook → Send an email (V2)** to `items('Apply_to_each')?['Email']` with subject `Your Kaizen OS early-access invitation is ready`.
2. Copy [`invitation-email.html`](invitation-email.html) into the HTML body. Replace both `{{INVITATION_URL}}` placeholders with the real Kaizen OS invite or account-creation URL before enabling the flow.
3. Use **Excel Online (Business) → Update a row** with **Key Column** `Lead ID` and **Key Value** `items('Apply_to_each')?['Lead ID']`. Set `Invitation sent` to `Yes` and `Invitation date` to `utcNow()`. Preserve the other columns.

An operator initiates an invitation simply by changing `Status` to `Invited` in the `Waitlist` table. The scheduled flow handles the rest and does not resend people whose `Invitation sent` value is `Yes`.

## 5. Mark people as joined

Once the Kaizen OS product has an account-creation or first-successful-entry event, create another instant flow named `Kaizen OS — Mark joined` using **When an HTTP request is received** and [`joined-request-schema.json`](joined-request-schema.json). Secure this flow as a server-to-server integration; do not call it from browser JavaScript.

1. Normalise the submitted email with `toLower(trim(triggerBody()?['email']))`.
2. List `WaitlistTable` rows with filter query `concat('Email eq ''', outputs('Normalised_email'), '''')`.
3. If no row exists, return `404` with `{ "ok": false, "message": "Waitlist record not found" }` and log the event for investigation.
4. If a row exists, update it using `Lead ID` as the key. Set `Status` to `Joined` and `Joined date` to `utcNow()`.
5. Return `200` with `{ "ok": true }`.

This flow completes the requested lifecycle without forcing a person to click an email link merely to be counted as joined.

## 6. Operations and testing

Use the Dashboard worksheet each day to check total demand, pending confirmations, people ready to invite, invitations sent and conversion to `Joined`. Before enabling the public site, run the test sequence below with a non-production email address.

1. Submit the form once and confirm a row is recorded with `Status = Waitlisted`, `Confirmation sent = Yes`, and a populated terms timestamp.
2. Submit the same email again and confirm no duplicate row is created.
3. Set the test row’s `Status` to `Invited`, run the invitation flow manually, and confirm the email arrives once and the row is stamped `Invitation sent = Yes` plus an invitation date.
4. Call the joined flow from the Kaizen OS backend and confirm the row becomes `Joined` with a joined date.
5. Remove the test row or mark it `Declined` after testing.

Keep the workbook closed in desktop Excel when flows run. Microsoft documents that writes can take up to 30 seconds to appear and that update/delete operations act on only the first row if the key is not unique; the flow therefore creates and uses a unique `Lead ID`. [1]

## References

[1]: https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/ "Excel Online (Business) connector — Microsoft Learn"
[2]: https://learn.microsoft.com/en-us/power-automate/run-scheduled-tasks "Run a cloud flow on a schedule — Microsoft Learn"
