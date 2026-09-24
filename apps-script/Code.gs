/*
 * Kaizen OS market-validation waitlist
 *
 * Bind this script to the Google Sheet that will contain the waitlist, run
 * setupWaitlistSheet() once, then deploy as a Web app. Deployment steps are
 * documented in apps-script/SETUP.md.
 */

const SETTINGS = {
  sheetName: 'Waitlist',
  dashboardName: 'Dashboard',
  source: 'Kaizen OS waitlist website',
  senderName: 'Kaizen OS · PhoennixAI',
  supportUrl: 'https://phoennixai.com/',
  waitlistStatus: 'Waitlisted',
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

const STATUS_OPTIONS = ['Waitlisted', 'Reviewing', 'Invited', 'Joined', 'Declined'];

/**
 * Run once from the Apps Script editor opened through the target Google Sheet.
 * It saves the sheet ID in Script Properties, creates the Waitlist and
 * Dashboard tabs, and applies the correct headers, validation and formatting.
 *
 * This function is safe to run again: existing waitlist rows are never cleared.
 */
function setupWaitlistSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open the target Google Sheet, then use Extensions → Apps Script and run setupWaitlistSheet().');
  }

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  const sheet = getOrCreateSheet_(spreadsheet, SETTINGS.sheetName);
  initialiseWaitlistSheet_(sheet);
  createDashboard_(spreadsheet);
  SpreadsheetApp.flush();
}

/**
 * Returns a simple health response when the deployed /exec URL is opened in a
 * browser. No visitor data is exposed by this endpoint.
 */
function doGet() {
  return jsonOutput_({ ok: true, service: 'Kaizen OS waitlist collector' });
}

/**
 * Accepts a website submission, appends one row to the Google Sheet and sends
 * an optional confirmation email. Duplicate emails are intentionally treated
 * as a successful no-op so repeated browser submissions do not create rows.
 */
function doPost(event) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(20000);
    lockAcquired = true;

    const lead = normaliseLead_(parsePayload_(event));
    validateLead_(lead);

    const sheet = getWaitlistSheet_();
    if (findLeadByEmail_(sheet, lead.email)) {
      return jsonOutput_({ ok: true, duplicate: true, confirmationSent: false });
    }

    const record = appendLead_(sheet, lead);
    const confirmationSent = sendConfirmation_(lead);
    if (confirmationSent) {
      sheet.getRange(record.rowNumber, columnNumber_('Confirmation sent')).setValue('Yes');
    }

    notifyOwner_(lead, record.leadId, confirmationSent);
    SpreadsheetApp.flush();
    return jsonOutput_({
      ok: true,
      duplicate: false,
      confirmationSent: confirmationSent,
      leadId: record.leadId,
    });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonOutput_({ ok: false, message: 'Unable to record this waitlist request.' });
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

/**
 * Resolves the destination spreadsheet from a Script Property rather than
 * embedding its ID in source control.
 */
function getWaitlistSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not configured. Run setupWaitlistSheet() from the target Google Sheet first.');
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(SETTINGS.sheetName);
  if (!sheet) throw new Error(`Missing required sheet: ${SETTINGS.sheetName}`);
  return sheet;
}

/**
 * Parses the JSON body sent by the site. Form-encoded parameters are accepted
 * as a fallback so the endpoint remains easy to test from Apps Script tools.
 */
function parsePayload_(event) {
  if (!event) throw new Error('A request body is required.');

  const rawBody = event.postData && event.postData.contents;
  if (rawBody) {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      if (event.parameter) return event.parameter;
      throw new Error('The request body must be valid JSON.');
    }
  }

  if (event.parameter) return event.parameter;
  throw new Error('A request body is required.');
}

function normaliseLead_(payload) {
  return {
    firstName: normaliseText_(payload.firstName, 80),
    email: normaliseText_(payload.email, 254).toLowerCase(),
    company: normaliseText_(payload.company, 160),
    role: normaliseText_(payload.role, 120),
    updatesOptIn: toBoolean_(payload.updatesOptIn),
    termsAccepted: toBoolean_(payload.termsAccepted),
    source: normaliseText_(payload.source || SETTINGS.source, 140) || SETTINGS.source,
    honeypot: normaliseText_(payload.website, 200),
  };
}

function normaliseText_(value, maximumLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maximumLength);
}

function toBoolean_(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' || value === 'on' || value === 'yes' || value === 'Yes';
}

function validateLead_(lead) {
  if (lead.honeypot) throw new Error('Automated submission rejected.');
  if (!lead.firstName) throw new Error('First name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw new Error('A valid email address is required.');
  if (!lead.termsAccepted) throw new Error('Terms acceptance is required.');
}

function findLeadByEmail_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const emailColumn = columnNumber_('Email');
  const values = sheet.getRange(2, emailColumn, lastRow - 1, 1).getDisplayValues().flat();
  return values.some((value) => String(value).trim().toLowerCase() === email);
}

function appendLead_(sheet, lead) {
  const now = new Date();
  const leadId = makeLeadId_();
  sheet.appendRow([
    leadId,
    now,
    lead.firstName,
    lead.email,
    lead.company,
    lead.role,
    lead.updatesOptIn ? 'Yes' : 'No',
    now,
    lead.source,
    SETTINGS.waitlistStatus,
    'No',
    '',
  ]);

  const rowNumber = sheet.getLastRow();
  sheet.getRange(rowNumber, columnNumber_('Submitted at')).setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange(rowNumber, columnNumber_('Terms accepted at')).setNumberFormat('yyyy-mm-dd hh:mm');
  return { leadId: leadId, rowNumber: rowNumber };
}

function makeLeadId_() {
  const datePart = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  return `KZ-${datePart}-${Utilities.getUuid().slice(0, 8)}`;
}

function columnNumber_(header) {
  const index = HEADERS.indexOf(header);
  if (index === -1) throw new Error(`Unknown waitlist header: ${header}`);
  return index + 1;
}

/**
 * Sends a confirmation only when the owner has email quota remaining. The
 * signup is still saved if email is unavailable.
 */
function sendConfirmation_(lead) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;

  const firstName = escapeHtml_(lead.firstName);
  const htmlBody = `
    <div style="margin:0;padding:32px 16px;background:#f3f5f4;color:#1a2b34;font-family:Georgia,serif;">
      <div style="max-width:600px;margin:0 auto;padding:34px;background:#ffffff;border:1px solid #d8dfdf;border-radius:12px;">
        <p style="margin:0 0 12px;color:#567a89;font:600 11px/1.4 monospace;letter-spacing:1.4px;text-transform:uppercase;">Kaizen OS · PhoennixAI</p>
        <h1 style="margin:0 0 16px;font-size:32px;line-height:1.05;">You’re on the early-access list.</h1>
        <p style="font-size:17px;line-height:1.6;">Thanks, ${firstName}. We’ve recorded your interest in Kaizen OS. We’ll be in touch if an early-access invitation wave is a good fit.</p>
        <p style="font-size:15px;line-height:1.6;color:#526069;">This is an interest list, not a purchase or a guarantee of access. To update or remove your details, contact PhoennixAI.</p>
        <p style="margin:24px 0 0;"><a href="${SETTINGS.supportUrl}" style="display:inline-block;padding:12px 16px;background:#1a2b34;color:#ffffff;border-radius:6px;text-decoration:none;">Contact PhoennixAI</a></p>
      </div>
    </div>`;

  const options = { htmlBody: htmlBody, name: SETTINGS.senderName };
  const replyTo = PropertiesService.getScriptProperties().getProperty('REPLY_TO');
  if (replyTo) options.replyTo = replyTo;

  MailApp.sendEmail(
    lead.email,
    'You’re on the Kaizen OS early-access list',
    `Thanks, ${lead.firstName}. We’ve recorded your interest in Kaizen OS. We’ll be in touch if an early-access invitation wave is a good fit. Contact PhoennixAI: ${SETTINGS.supportUrl}`,
    options,
  );
  return true;
}

/**
 * Optional notification for the operator. Configure OWNER_EMAIL in Script
 * Properties; omit it to disable owner notifications.
 */
function notifyOwner_(lead, leadId, confirmationSent) {
  const ownerEmail = PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL');
  if (!ownerEmail || MailApp.getRemainingDailyQuota() < 1) return;

  const lines = [
    `Lead ID: ${leadId}`,
    `Name: ${lead.firstName}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company || '—'}`,
    `Role: ${lead.role || '—'}`,
    `Updates opt-in: ${lead.updatesOptIn ? 'Yes' : 'No'}`,
    `Confirmation sent: ${confirmationSent ? 'Yes' : 'No'}`,
  ];
  MailApp.sendEmail(ownerEmail, `New Kaizen OS waitlist lead: ${lead.firstName}`, lines.join('\n'), { name: SETTINGS.senderName });
}

function initialiseWaitlistSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    const existingHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
    const isExpectedHeader = HEADERS.every((header, index) => existingHeaders[index] === header);
    if (!isExpectedHeader) {
      throw new Error(`The ${SETTINGS.sheetName} sheet has unexpected headers. Create a new sheet or restore the required header row before running setup again.`);
    }
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground('#13202D')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  if (!sheet.getFilter()) sheet.getRange(1, 1, 1, HEADERS.length).createFilter();

  const widths = [24, 22, 18, 34, 28, 22, 16, 22, 28, 16, 20, 42];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('H:H').setNumberFormat('yyyy-mm-dd hh:mm');

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  const dataRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, columnNumber_('Status'), dataRows, 1).setDataValidation(statusRule);
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
