/**
 * IRIS session logger + email notifier.
 *
 * Deployed as a Google Apps Script Web App. Receives POST from /api/log.js
 * (which proxies the browser's logIrisEvent forward).
 *
 * Writes each session into a Google Sheet (one row per session, upserted by
 * sessionId) and sends Jacob an email on session start + session end.
 *
 * Payload shape from /api/log:
 * {
 *   sessionId: string,
 *   scenario: string|null,
 *   startedAt: ISO,
 *   endedAt:   ISO|null,
 *   events:    [{t, role, text, meta}],
 *   ua:        string,
 *   lang:      string,
 *   tz:        string,
 *   ip:        string|null,     // from Vercel x-forwarded-for, added server-side
 *   geo:       object|null,     // from Vercel request.geo, added server-side
 *   referrer:  string|null,
 *   url:       string|null,
 *   phase:     'start' | 'turn' | 'end'
 * }
 */

// ====== CONFIG ======
var NOTIFY_EMAIL = 'jacobcharendoff@gmail.com';
var SHEET_NAME   = 'iris-sessions';
var SEND_START_EMAIL = true;   // email when a new session opens
var SEND_END_EMAIL   = true;   // email with full transcript when session ends
var SEND_TURN_EMAIL  = false;  // set true for firehose (every turn)
// ====================

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _json({ ok: false, error: 'no body' });
    }
    var payload = JSON.parse(e.postData.contents);
    if (!payload || !payload.sessionId) {
      return _json({ ok: false, error: 'no sessionId' });
    }

    var sheet = _getSheet();
    var rowIndex = _findRow(sheet, payload.sessionId);

    var transcript = _renderTranscript(payload.events || []);
    var geo = payload.geo || {};
    var location = [geo.city, geo.region, geo.country].filter(Boolean).join(', ') || 'unknown';

    var row = [
      payload.sessionId,
      payload.startedAt || '',
      payload.endedAt   || '',
      payload.phase     || '',
      payload.scenario  || '',
      (payload.events || []).length,
      location,
      payload.ip || '',
      payload.ua || '',
      payload.lang || '',
      payload.tz || '',
      payload.referrer || '',
      payload.url || '',
      transcript
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    // === EMAIL NOTIFICATIONS ===
    var phase = payload.phase || 'turn';
    try {
      if (phase === 'start' && SEND_START_EMAIL) {
        _sendStartEmail(payload, location);
      } else if (phase === 'end' && SEND_END_EMAIL) {
        _sendEndEmail(payload, location, transcript);
      } else if (phase === 'turn' && SEND_TURN_EMAIL) {
        _sendTurnEmail(payload, location, transcript);
      }
    } catch (mailErr) {
      // Never let email failure break the log write
      Logger.log('email error: ' + mailErr);
    }

    return _json({ ok: true });
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return _json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return _json({ ok: true, service: 'iris-log', hint: 'POST sessions here' });
}

function _getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    // Standalone script — create a spreadsheet on first run
    ss = SpreadsheetApp.create('IRIS Sessions');
    DriveApp.getFileById(ss.getId()).setSharing(
      DriveApp.Access.PRIVATE, DriveApp.Permission.NONE
    );
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'sessionId', 'startedAt', 'endedAt', 'phase', 'scenario',
      'eventCount', 'location', 'ip', 'userAgent', 'lang', 'tz',
      'referrer', 'url', 'transcript'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function _findRow(sheet, sessionId) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === sessionId) return i + 2;
  }
  return -1;
}

function _renderTranscript(events) {
  if (!events || !events.length) return '';
  return events.map(function (ev) {
    var who = ev.role === 'iris' ? 'Iris'
            : ev.role === 'member' ? 'Member'
            : (ev.role || 'system');
    var ts  = ev.t ? ev.t.replace('T', ' ').replace('Z', '') : '';
    return '[' + ts + '] ' + who + ': ' + (ev.text || '');
  }).join('\n');
}

function _sendStartEmail(p, location) {
  var subject = '🌱 New IRIS session started — ' + location;
  var body =
    'Someone just started a conversation with IRIS.\n\n' +
    'Session:   ' + p.sessionId + '\n' +
    'Started:   ' + p.startedAt + '\n' +
    'Scenario:  ' + (p.scenario || 'live chat') + '\n' +
    'Location:  ' + location + '\n' +
    'IP:        ' + (p.ip || 'unknown') + '\n' +
    'Referrer:  ' + (p.referrer || '') + '\n' +
    'URL:       ' + (p.url || '') + '\n' +
    'User agent:\n' + (p.ua || '') + '\n\n' +
    'You\'ll get another email with the full transcript when the session ends.';
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function _sendEndEmail(p, location, transcript) {
  var events = p.events || [];
  var memberTurns = events.filter(function(e){return e.role==='member';}).length;
  var irisTurns   = events.filter(function(e){return e.role==='iris';}).length;
  var subject = '📜 IRIS session ended — ' + memberTurns + ' member turns — ' + location;
  var body =
    'An IRIS session just ended.\n\n' +
    'Session:      ' + p.sessionId + '\n' +
    'Started:      ' + p.startedAt + '\n' +
    'Ended:        ' + (p.endedAt || '(unknown — probably page close)') + '\n' +
    'Scenario:     ' + (p.scenario || 'live chat') + '\n' +
    'Location:     ' + location + '\n' +
    'Member turns: ' + memberTurns + '\n' +
    'Iris turns:   ' + irisTurns + '\n\n' +
    '===== TRANSCRIPT =====\n' +
    transcript + '\n' +
    '===== END =====\n';
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function _sendTurnEmail(p, location, transcript) {
  var subject = '💬 IRIS turn — ' + location;
  var body =
    'IRIS conversation update.\n\n' +
    'Session: ' + p.sessionId + '\n' +
    'Events:  ' + (p.events || []).length + '\n\n' +
    transcript;
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
