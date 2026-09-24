/* Kaizen OS market-validation waitlist — Google Apps Script */

const SETTINGS = {
  sheetName: 'Waitlist',
  dashboardName: 'Dashboard',
  source: 'Kaizen OS waitlist website',
  senderName: 'Kaizen OS · PhoennixAI',
  supportUrl: 'https://phoennixai.com/',
};

const HEADERS = [
  'Lead ID', 'Submitted at', 'First name', 'Email', 'Company / Organisation', 'Role',
  'Updates opt-in', 'Terms accepted at', 'Source', 'Status', 'Confirmation sent', 'Notes',
];

/** Run once from this standalone Apps Script project. */
function setupWaitlistSheet() {
  const spreadsheet = SpreadsheetApp.openById('1jHYbty6R3wy3BxpRL-7EPVrgjDW7h_JoZ8_4ouJpkzM');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  const sheet = spreadsheet.getSheetByName(SETTINGS.sheetName) || spreadsheet.insertSheet(SETTINGS.sheetName);
  initialiseWaitlist_(sheet);
  buildDashboard_(spreadsheet);
  SpreadsheetApp.flush();
}

/** Health check for the deployed /exec URL. */
function doGet() {
  return json_({ ok: true, service: 'Kaizen OS waitlist collector' });
}

/** Records one consented lead and sends a confirmation email when quota permits. */
function doPost(event) {
  const lock = LockService.getScriptLock();
  let acquired = false;
  try {
    lock.waitLock(20000);
    acquired = true;
    const lead = normaliseLead_(parsePayload_(event));
    validateLead_(lead);

    const sheet = getWaitlistSheet_();
    if (hasEmail_(sheet, lead.email)) {
      return json_({ ok: true, duplicate: true, confirmationSent: false });
    }

    const now = new Date();
    const leadId = `KZ-${Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMddHHmmss')}-${Utilities.getUuid().slice(0, 8)}`;
    sheet.appendRow([
      leadId, now, lead.firstName, lead.email, lead.company, lead.role,
      lead.updatesOptIn ? 'Yes' : 'No', now, lead.source, 'Waitlisted', 'No', '',
    ]);

    const row = sheet.getLastRow();
    sheet.getRange(row, 2).setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.getRange(row, 8).setNumberFormat('yyyy-mm-dd hh:mm');
    const confirmationSent = sendConfirmation_(lead);
    if (confirmationSent) sheet.getRange(row, 11).setValue('Yes');
    SpreadsheetApp.flush();

    return json_({ ok: true, duplicate: false, confirmationSent: confirmationSent, leadId: leadId });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, message: 'Unable to record this waitlist request.' });
  } finally {
    if (acquired) lock.releaseLock();
  }
}

function parsePayload_(event) {
  const raw = event && event.postData && event.postData.contents;
  if (!raw) throw new Error('A JSON request body is required.');
  return JSON.parse(raw);
}

function normaliseLead_(payload) {
  const text = (value, limit) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, limit);
  const bool = (value) => value === true || ['true', '1', 'on', 'yes'].includes(String(value).toLowerCase());
  return {
    firstName: text(payload.firstName, 80),
    email: text(payload.email, 254).toLowerCase(),
    company: text(payload.company, 160),
    role: text(payload.role, 120),
    updatesOptIn: bool(payload.updatesOptIn),
    termsAccepted: bool(payload.termsAccepted),
    source: text(payload.source || SETTINGS.source, 140) || SETTINGS.source,
    honeypot: text(payload.website, 200),
  };
}

function validateLead_(lead) {
  if (lead.honeypot) throw new Error('Automated submission rejected.');
  if (!lead.firstName) throw new Error('First name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) throw new Error('A valid email address is required.');
  if (!lead.termsAccepted) throw new Error('Terms acceptance is required.');
}

function getWaitlistSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID is missing. Run setupWaitlistSheet() first.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(SETTINGS.sheetName);
  if (!sheet) throw new Error(`Missing required sheet: ${SETTINGS.sheetName}`);
  return sheet;
}

function hasEmail_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  return sheet.getRange(2, 4, lastRow - 1, 1).getDisplayValues()
    .some((row) => String(row[0]).trim().toLowerCase() === email);
}

function sendConfirmation_(lead) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;
  const name = escapeHtml_(lead.firstName);
  const html = `<div style="margin:0;padding:32px 16px;background:#f3f5f4;color:#1a2b34;font-family:Georgia,serif"><div style="max-width:600px;margin:auto;padding:34px;background:#fff;border:1px solid #d8dfdf;border-radius:12px"><p style="color:#567a89;font:600 11px monospace;letter-spacing:1.4px;text-transform:uppercase">Kaizen OS · PhoennixAI</p><h1>You’re on the early-access list.</h1><p>Thanks, ${name}. We’ve recorded your interest in Kaizen OS and will be in touch if an invitation wave is a good fit.</p><p>This is an interest list, not a purchase or guarantee of access.</p><p><a href="${SETTINGS.supportUrl}">Contact PhoennixAI</a></p></div></div>`;
  MailApp.sendEmail(lead.email, 'You’re on the Kaizen OS early-access list', `Thanks, ${lead.firstName}. We’ve recorded your interest in Kaizen OS. Contact PhoennixAI: ${SETTINGS.supportUrl}`, { htmlBody: html, name: SETTINGS.senderName });
  return true;
}

function initialiseWaitlist_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    const current = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
    if (!HEADERS.every((header, index) => current[index] === header)) {
      throw new Error('Waitlist headers do not match the required structure.');
    }
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#13202D').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
  if (!sheet.getFilter()) sheet.getRange(1, 1, 1, HEADERS.length).createFilter();
  [24, 22, 18, 34, 28, 22, 16, 22, 28, 16, 20, 42].forEach((width, index) => sheet.setColumnWidth(index + 1, width));
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('H:H').setNumberFormat('yyyy-mm-dd hh:mm');
  const status = SpreadsheetApp.newDataValidation().requireValueInList(['Waitlisted', 'Reviewing', 'Invited', 'Joined', 'Declined'], true).setAllowInvalid(false).build();
  sheet.getRange(2, 10, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(status);
}

function buildDashboard_(spreadsheet) {
  const dashboard = spreadsheet.getSheetByName(SETTINGS.dashboardName) || spreadsheet.insertSheet(SETTINGS.dashboardName);
  dashboard.clear();
  dashboard.getRange('A1:B1').merge().setValue('KAIZEN OS · MARKET SIGNALS').setBackground('#0D1520').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(16);
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

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
