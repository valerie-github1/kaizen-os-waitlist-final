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
    const confirmationSent = sendWelcomeEmail_(lead);
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

function sendWelcomeEmail_(lead) {
  if (MailApp.getRemainingDailyQuota() < 1) return false;
  MailApp.sendEmail(
    lead.email,
    'Welcome to the Kaizen OS waitlist',
    welcomeEmailText_(lead),
    { htmlBody: welcomeEmailHtml_(lead), name: SETTINGS.senderName },
  );
  return true;
}

function welcomeEmailText_(lead) {
  const preference = lead.updatesOptIn
    ? 'You also opted in to occasional Kaizen OS product news. You can unsubscribe from those optional updates at any time.'
    : 'You have not opted in to product news. We will only email you about this waitlist and relevant early-access developments.';
  return [
    `Hello ${lead.firstName},`,
    '',
    'Welcome to the Kaizen OS waitlist. Your interest has been recorded.',
    'Kaizen OS is currently a market-validation project. We are learning where a calmer operating system for focus, rhythm and progress signals can create the most value.',
    'What happens next: as we review the signal from this early group, PhoennixAI may contact people whose context is a strong fit for a future early-access conversation.',
    preference,
    'Joining the waitlist is free. It is not a purchase and does not guarantee access, timing, or a particular feature set.',
    `Questions or removal request: ${SETTINGS.supportUrl}`,
    '',
    '— Kaizen OS · PhoennixAI',
  ].join('\n');
}

function welcomeEmailHtml_(lead) {
  const name = escapeHtml_(lead.firstName);
  const preference = lead.updatesOptIn
    ? 'You also asked for occasional Kaizen OS product news. You can unsubscribe from those optional updates at any time.'
    : 'You have not opted into product news. We will only contact you about this waitlist and relevant early-access developments.';
  return `<div style="margin:0;padding:32px 16px;background:#edf1ef;color:#13202d;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #d8dfdf;border-radius:16px;overflow:hidden">
    <div style="padding:24px 34px;background:#0b1420;color:#ffffff">
      <p style="margin:0;color:#c8cf71;font:600 11px/1.4 monospace;letter-spacing:1.5px;text-transform:uppercase">Kaizen OS · PhoennixAI</p>
      <p style="margin:12px 0 0;font-size:14px;color:#cbd5da">A quieter way to move forward</p>
    </div>
    <div style="padding:34px">
      <h1 style="margin:0 0 18px;font-size:32px;line-height:1.1;color:#13202d">Welcome to the waitlist.</h1>
      <p style="margin:0 0 16px;font-size:17px;line-height:1.6">Hello ${name},</p>
      <p style="margin:0 0 16px;font-size:17px;line-height:1.6">Thank you for adding your perspective. Your interest in <strong>Kaizen OS</strong> has been recorded.</p>
      <p style="margin:0 0 22px;font-size:17px;line-height:1.6">Kaizen OS is a market-validation project exploring a calmer operating system for focus, rhythm, and meaningful progress signals.</p>
      <div style="margin:0 0 22px;padding:20px 22px;background:#f4f6ed;border-left:4px solid #c8cf71;border-radius:4px">
        <p style="margin:0 0 8px;color:#52656e;font:600 11px/1.4 monospace;letter-spacing:1.25px;text-transform:uppercase">What happens next</p>
        <p style="margin:0;font-size:16px;line-height:1.55">As we learn from this early group, PhoennixAI may contact people whose context is a strong fit for a future early-access conversation.</p>
      </div>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#52656e">${preference}</p>
      <p style="margin:0 0 24px;padding-top:18px;border-top:1px solid #e1e7e5;font-size:14px;line-height:1.6;color:#52656e">Joining the waitlist is free. It is not a purchase and does not guarantee access, timing, or a particular feature set.</p>
      <a href="${SETTINGS.supportUrl}" style="display:inline-block;padding:12px 18px;background:#13202d;color:#ffffff;text-decoration:none;border-radius:999px;font:600 12px/1.2 Arial,sans-serif;letter-spacing:.3px">Visit PhoennixAI</a>
    </div>
    <div style="padding:18px 34px;background:#f6f8f7;color:#71808a;font-size:12px;line-height:1.5">Questions or a request to leave the waitlist? <a href="${SETTINGS.supportUrl}" style="color:#3f697b">Contact PhoennixAI</a>.</div>
  </div>
</div>`;
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
