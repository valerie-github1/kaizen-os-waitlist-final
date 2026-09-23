/*
 * Kaizen OS market-validation waitlist
 *
 * Bind this project to the Google Sheet that will hold the leads, then run
 * setupWaitlistSheet() once and deploy as a web app. Full steps are in SETUP.md.
 */

const SETTINGS = {
  sheetName: 'Waitlist',
  dashboardName: 'Dashboard',
  source: 'Kaizen OS waitlist website',
  senderName: 'Kaizen OS · PhoennixAI',
};

const HEADERS = [
  'Lead ID',
  'Submitted at',
  'First name',
  'Email',
  'Company / Organisation',
  'Role',
  'Updates opt-in',
  'Terms accepted at',
  'Source',
  'Status',
  'Confirmation sent',
  'Notes',
];

/**
 * Run once from the bound script editor. It creates the waitlist and a simple
 * dashboard, then stores this sheet's ID in Script Properties for the web app.
 */
function setupWaitlistSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open the target Google Sheet, then use Extensions → Apps Script and run setupWaitlistSheet().');
  }

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  const sheet = getOrCreateSheet_(spreadsheet, SETTINGS.sheetName);
  const existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.clear();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground('#13202D')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.getRange('A1:L1').createFilter();

  const widths = [24, 22, 18, 34, 28, 22, 16, 22, 28, 16, 20, 42];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('H:H').setNumberFormat('yyyy-mm-dd hh:mm');

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Waitlisted', 'Reviewing', 'Invited', 'Joined', 'Declined'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('J2:J').setDataValidation(rule);

  createDashboard_(spreadsheet);
  SpreadsheetApp.flush();
}

/**
 * Web-app health response. Visiting the /exec URL in a browser should show ok.
 */
function doGet() {
  return jsonOutput_({ ok: true, service: 'Kaizen OS waitlist collector' });
}

/**
 * Receives the public website form, stores one row per email, and sends a
 * confirmation email when available within the account's daily mail quota.
 */
function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const payload = parsePayload_(event);
    const lead = normaliseLead_(payload);
    validateLead_(lead);

    const sheet = getWaitlistSheet_();
    const emailColumn = HEADERS.indexOf('Email') + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const emails = sheet.getRange(2, emailColumn, lastRow - 1, 1).getDisplayValues().flat();
      if (emails.some((value) => String(value).trim().toLowerCase() === lead.email)) {
        return jsonOutput_({ ok: true, duplicate: true });
      }
    }

    const now = new Date();
    const row = [
      makeLeadId_(),
      now,
      lead.firstName,
      lead.email,
      lead.company,
      lead.role,
      lead.updatesOptIn ? 'Yes' : 'No',
      lead.termsAccepted ? now : '',
      lead.source,
      'Waitlisted',
      'No',
      '',
    ];
    sheet.appendRow(row);
    const insertedRow = sheet.getLastRow();
    sheet.getRange(insertedRow, 2).setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.getRange(insertedRow, 8).setNumberFormat('yyyy-mm-dd hh:mm');

    const confirmationSent = sendConfirmation_(lead);
    if (confirmationSent) {
      sheet.getRange(insertedRow, HEADERS.indexOf('Confirmation sent') + 1).setValue('Yes');
    }

    notifyOwner_(lead, confirmationSent);
    SpreadsheetApp.flush();
    return jsonOutput_({ ok: true, duplicate: false, confirmationSent: confirmationSent });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonOutput_({ ok: false, message: 'Unable to record this waitlist request.' });
  } finally {
    lock.releaseLock();
  }
}

function getWaitlistSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not configured. Run setupWaitlistSheet() from the target Google Sheet first.');
  }
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(SETTINGS.sheetName);
  if (!sheet) throw new Error(`Missing required sheet: ${SETTINGS.sheetName}`);
  return sheet;
}

function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error('A JSON request body is required.');
  }
  return JSON.parse(event.postData.contents);
}

function normaliseLead_(payload) {
  return {
    firstName: String(payload.firstName || '').trim().slice(0, 80),
    email: String(payload.email || '').trim().toLowerCase().slice(0, 254),
    company: String(payload.company || '').trim().slice(0, 160),
    role: String(payload.role || '').trim().slice(0, 120),
    updatesOptIn: payload.updatesOptIn === true,
    termsAccepted: payload.termsAccepted === true,
    source: String(payload.source || SETTINGS.source).trim().slice(0, 140) || SETTINGS.source,
    honeypot: String(payload.website || '').trim(),
  };
}

function validateLead_(lead) {
  if (lead.honeypot) throw new Error('Automated submission rejected.');
  if (!lead.firstName) throw new Error('First name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw new Error('A valid email address is required.');
  if (!lead.termsAccepted) throw new Error('Terms acceptance is required.');
}

function makeLeadId_() {
  return `KZ-${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss')}-${Utilities.getUuid().slice(0, 8)}`;
}

function sendConfirmation_(lead) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;
  const supportUrl = 'https://phoennixai.com/';
  const name = escapeHtml_(lead.firstName);
  const htmlBody = `
    <div style="margin:0;padding:32px 16px;background:#f3f5f4;color:#1a2b34;font-family:Georgia,serif;">
      <div style="max-width:600px;margin:0 auto;padding:34px;background:#ffffff;border:1px solid #d8dfdf;border-radius:12px;">
        <p style="margin:0 0 12px;color:#567a89;font:600 11px/1.4 monospace;letter-spacing:1.4px;text-transform:uppercase;">Kaizen OS · PhoennixAI</p>
        <h1 style="margin:0 0 16px;font-size:32px;line-height:1.05;">You’re on the early-access list.</h1>
        <p style="font-size:17px;line-height:1.6;">Thanks, ${name}. We’ve recorded your interest in Kaizen OS. We’ll be in touch if an early-access invitation wave is a good fit.</p>
        <p style="font-size:15px;line-height:1.6;color:#526069;">This is an interest list, not a purchase or guarantee of access. If you need to update or remove your details, please contact PhoennixAI.</p>
        <p style="margin:24px 0 0;"><a href="${supportUrl}" style="display:inline-block;padding:12px 16px;background:#1a2b34;color:#ffffff;border-radius:6px;text-decoration:none;">Contact PhoennixAI</a></p>
      </div>
    </div>`;
  const options = {
    htmlBody: htmlBody,
    name: SETTINGS.senderName,
  };
  const replyTo = PropertiesService.getScriptProperties().getProperty('REPLY_TO');
  if (replyTo) options.replyTo = replyTo;
  MailApp.sendEmail(lead.email, 'You’re on the Kaizen OS early-access list', `Thanks, ${lead.firstName}. We’ve recorded your interest in Kaizen OS. We’ll be in touch if an early-access invitation wave is a good fit. Contact PhoennixAI: ${supportUrl}`, options);
  return true;
}

function notifyOwner_(lead, confirmationSent) {
  const ownerEmail = PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL');
  if (!ownerEmail || MailApp.getRemainingDailyQuota() < 1) return;
  MailApp.sendEmail(ownerEmail, `New Kaizen OS waitlist lead: ${lead.firstName}`, [
    `Name: ${lead.firstName}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company || '—'}`,
    `Role: ${lead.role || '—'}`,
    `Updates opt-in: ${lead.updatesOptIn ? 'Yes' : 'No'}`,
    `Confirmation sent: ${confirmationSent ? 'Yes' : 'No'}`,
  ].join('\n'), { name: SETTINGS.senderName });
}

function createDashboard_(spreadsheet) {
  const dashboard = getOrCreateSheet_(spreadsheet, SETTINGS.dashboardName);
  dashboard.clear();
  dashboard.getRange('A1:B1').merge().setValue('KAIZEN OS · MARKET SIGNALS');
  dashboard.getRange('A1:B1').setBackground('#0D1520').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(16);
  dashboard.getRange('A3:B7').setValues([
    ['Metric', 'Value'],
    ['Total leads', '=COUNTA(Waitlist!D2:D)'],
    ['Leads in last 7 days', '=COUNTIFS(Waitlist!B2:B,">="&TODAY()-7,Waitlist!D2:D,"<>")'],
    ['Updates opt-ins', '=COUNTIF(Waitlist!G2:G,"Yes")'],
    ['Confirmed emails', '=COUNTIF(Waitlist!K2:K,"Yes")'],
  ]);
  dashboard.getRange('A3:B3').setBackground('#556970').setFontColor('#FFFFFF').setFontWeight('bold');
  dashboard.setColumnWidth(1, 30);
  dashboard.setColumnWidth(2, 18);
  dashboard.setFrozenRows(3);
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}
