/*
 * Portfolio server.
 *
 * Static file hosting plus a small, dependency-free contact backend:
 *   POST /api/contact              - validate, store and notify
 *   GET  /api/admin/messages.docx  - authenticated DOCX export
 *
 * All configuration comes from environment variables. No credentials,
 * recipient addresses or admin secrets exist in the frontend or this file.
 */
const http = require('http');
const https = require('https');
const net = require('net');
const tls = require('tls');
const os = require('os');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

/* Load a local .env file without adding a dependency. Real environment
   variables always win, so deployments and tests can override the file. */
function loadLocalEnv() {
  let contents;
  try {
    contents = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return;
    console.warn('Could not read the local .env file; using environment variables only.');
    return;
  }
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const entry = trimmed.replace(/^export\s+/, '');
    const separator = entry.indexOf('=');
    if (separator <= 0) return;
    const key = entry.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
    let value = entry.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  });
}
loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.resolve(process.env.CONTACT_DATA_DIR || path.join(PUBLIC_DIR, 'data'));
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const MAX_BODY_BYTES = 64 * 1024;
const RATE_MAX = Math.max(1, Number(process.env.CONTACT_RATE_LIMIT_MAX || 5));
const RATE_WINDOW = Math.max(1000, Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS || 600000));

const LIMITS = { name: 100, email: 254, subject: 200, message: 5000, website: 100 };

const MAIL = {
  to: process.env.CONTACT_EMAIL_TO || '',
  from: process.env.CONTACT_EMAIL_FROM || process.env.CONTACT_EMAIL_TO || '',
  webhook: process.env.CONTACT_EMAIL_WEBHOOK || '',
  webhookToken: process.env.CONTACT_EMAIL_WEBHOOK_TOKEN || '',
  smtpHost: process.env.CONTACT_SMTP_HOST || '',
  smtpPort: Number(process.env.CONTACT_SMTP_PORT || 587),
  smtpSecure: /^(true|1|yes)$/i.test(process.env.CONTACT_SMTP_SECURE || ''),
  smtpUser: process.env.CONTACT_SMTP_USER || '',
  smtpPass: process.env.CONTACT_SMTP_PASS || ''
};

/* Report configuration problems without ever including secret values. */
function validateMailConfig() {
  if (!MAIL.to) return { ok: false, status: 'skipped', detail: 'No notification recipient configured' };
  if (MAIL.webhook) return { ok: true, transport: 'webhook' };
  if (!MAIL.smtpHost) return { ok: false, status: 'skipped', detail: 'No email transport configured' };
  if (!Number.isInteger(MAIL.smtpPort) || MAIL.smtpPort < 1 || MAIL.smtpPort > 65535) {
    return { ok: false, status: 'failed', detail: 'SMTP port is invalid' };
  }
  if (!MAIL.from) return { ok: false, status: 'failed', detail: 'SMTP sender is not configured' };
  if (MAIL.smtpUser && !MAIL.smtpPass) return { ok: false, status: 'failed', detail: 'SMTP password is not configured' };
  return { ok: true, transport: 'smtp' };
}

/* Google Sheets is the production store. Local JSON is opt-in for offline
   development only and is never required by the deployed site. */
const rawStorageDrive = (process.env.CONTACT_STORAGE || 'sheets').toLowerCase();
const STORAGE_DRIVE = /^(local|local-json|json)$/.test(rawStorageDrive) ? 'local' : 'sheets';

const SHEETS = {
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  serviceEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  /* Render and .env files often supply the PEM with literal \n characters. */
  privateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1',
  tokenUri: process.env.GOOGLE_OAUTH_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  apiBase: (process.env.GOOGLE_SHEETS_API_BASE || 'https://sheets.googleapis.com/v4/spreadsheets').replace(/\/$/, '')
};

function validateSheetsConfig() {
  if (!SHEETS.spreadsheetId) return { ok: false, detail: 'Google Sheets spreadsheet ID is not configured' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SHEETS.serviceEmail)) {
    return { ok: false, detail: 'Google service account email is not configured' };
  }
  if (!/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(SHEETS.privateKey) ||
      !/-----END (?:RSA )?PRIVATE KEY-----/.test(SHEETS.privateKey)) {
    return { ok: false, detail: 'Google service account private key is not configured' };
  }
  if (!SHEETS.sheetName.trim()) return { ok: false, detail: 'Google Sheets tab name is not configured' };
  return { ok: true };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

/* ------------------------------------------------------------------ */
/* Input handling                                                      */
/* ------------------------------------------------------------------ */

function normalize(value, max, multiline = false) {
  if (typeof value !== 'string') return '';
  let out = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  out = multiline ? out.replace(/\r\n?/g, '\n') : out.replace(/[\r\n]+/g, ' ');
  return out.trim().slice(0, max + 1);
}

function validate(payload) {
  const value = {
    name: normalize(payload.name, LIMITS.name),
    email: normalize(payload.email, LIMITS.email),
    subject: normalize(payload.subject, LIMITS.subject),
    message: normalize(payload.message, LIMITS.message, true),
    website: normalize(payload.website, LIMITS.website)
  };
  const errors = {};
  if (!value.name) errors.name = 'Name is required.';
  else if (value.name.length > LIMITS.name) errors.name = `Name must be at most ${LIMITS.name} characters.`;
  if (!value.email) errors.email = 'Email is required.';
  else if (value.email.length > LIMITS.email) errors.email = `Email must be at most ${LIMITS.email} characters.`;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email)) errors.email = 'Enter a valid email address.';
  if (!value.subject) errors.subject = 'Subject is required.';
  else if (value.subject.length > LIMITS.subject) errors.subject = `Subject must be at most ${LIMITS.subject} characters.`;
  if (!value.message) errors.message = 'Message is required.';
  else if (value.message.length < 10) errors.message = 'Message must be at least 10 characters.';
  else if (value.message.length > LIMITS.message) errors.message = `Message must be at most ${LIMITS.message} characters.`;
  return { value, errors };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const err = new Error('Payload too large');
        err.status = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, data, extra = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  }, extra));
  res.end(body);
}

/* ------------------------------------------------------------------ */
/* Rate limiting (in-memory, per process)                              */
/* ------------------------------------------------------------------ */

const rateBuckets = new Map();

function rateKey(req) {
  const trustProxy = /^(true|1|yes)$/i.test(process.env.CONTACT_TRUST_PROXY || '');
  const forwarded = req.headers['x-forwarded-for'];
  if (trustProxy && forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function checkRate(req) {
  const key = rateKey(req);
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start >= RATE_WINDOW) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (rateBuckets.size > 5000) {
    for (const [k, b] of rateBuckets) if (now - b.start >= RATE_WINDOW) rateBuckets.delete(k);
  }
  return {
    allowed: bucket.count <= RATE_MAX,
    retryAfter: Math.max(1, Math.ceil((bucket.start + RATE_WINDOW - now) / 1000))
  };
}

/* ------------------------------------------------------------------ */
/* Message storage: Google Sheets (default) or explicit local JSON      */
/* ------------------------------------------------------------------ */

let messages = [];
let writeQueue = Promise.resolve();

async function initStore() {
  if (STORAGE_DRIVE === 'local') {
    await fsp.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
    try {
      const raw = await fsp.readFile(MESSAGES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      messages = Array.isArray(parsed) ? parsed.filter((m) => m && typeof m === 'object') : [];
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn('Contact store: could not read existing messages:', err.message);
      messages = [];
    }
    return;
  }
  const config = validateSheetsConfig();
  if (!config.ok) console.warn(`Contact storage is not ready: ${config.detail}`);
  else console.log('Contact storage: Google Sheets');
}

function persistMessages(next) {
  const task = writeQueue.then(async () => {
    const temp = path.join(DATA_DIR, `.messages-${process.pid}-${crypto.randomBytes(4).toString('hex')}.tmp`);
    await fsp.writeFile(temp, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    await fsp.rename(temp, MESSAGES_FILE);
    messages = next;
  });
  writeQueue = task.catch(() => {});
  return task;
}

/* Small HTTPS/HTTP JSON helper. Errors are deliberately generic so no
   response body, token or service-account detail can reach a visitor. */
function requestJson(url, { method = 'GET', headers = {}, body = '', timeout = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    let target;
    try { target = new URL(url); } catch { reject(new Error('Google API URL is invalid')); return; }
    const client = target.protocol === 'https:' ? https : http;
    const req = client.request(target, { method, headers, timeout }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        if (raw.length + chunk.length > 65536) res.destroy(new Error('Google API response too large'));
        else raw += chunk;
      });
      res.on('end', () => {
        let parsed = {};
        try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = {}; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(new Error(`Google API returned HTTP ${res.statusCode}`));
      });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('Google API request timed out')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

let googleToken = { value: '', expiresAt: 0 };

async function getGoogleAccessToken() {
  if (googleToken.value && Date.now() < googleToken.expiresAt - 60000) return googleToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: SHEETS.serviceEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: SHEETS.tokenUri,
    iat: now,
    exp: now + 3600
  }));
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), SHEETS.privateKey).toString('base64url');
  const assertion = `${header}.${claims}.${signature}`;
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  }).toString();
  const data = await requestJson(SHEETS.tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  });
  if (!data.access_token) throw new Error('Google OAuth response missing access token');
  googleToken = { value: data.access_token, expiresAt: now + (Number(data.expires_in) || 3600) };
  return googleToken.value;
}

function sheetsRange() {
  return `${encodeURIComponent(SHEETS.sheetName)}!A:E`;
}

function sheetsUrl(suffix = '') {
  return `${SHEETS.apiBase}/${encodeURIComponent(SHEETS.spreadsheetId)}/values/${sheetsRange()}${suffix}`;
}

/* valueInputOption=RAW stores visitor text literally, so values beginning
   with =, +, - or @ can never be evaluated as spreadsheet formulas. */
async function appendToGoogleSheets(record) {
  const config = validateSheetsConfig();
  if (!config.ok) throw new Error(config.detail);
  const token = await getGoogleAccessToken();
  const url = sheetsUrl(':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS');
  const body = JSON.stringify({
    values: [[record.name, record.email, record.subject, record.message, record.submittedAt]]
  });
  await requestJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  });
  return 'Google Sheets';
}

function recordsFromRows(rows) {
  return rows
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim()))
    .filter((row) => !(String(row[0] ?? '').trim().toLowerCase() === 'name' &&
      String(row[1] ?? '').trim().toLowerCase() === 'email'))
    .map((row, index) => ({
      id: `sheet-row-${index + 2}`,
      submittedAt: String(row[4] ?? ''),
      name: String(row[0] ?? ''),
      email: String(row[1] ?? ''),
      subject: String(row[2] ?? ''),
      message: String(row[3] ?? ''),
      status: 'received',
      emailStatus: 'not-stored',
      emailDetail: 'Google Sheets stores the five visible contact columns only.'
    }));
}

async function readGoogleSheets() {
  const config = validateSheetsConfig();
  if (!config.ok) throw new Error(config.detail);
  const token = await getGoogleAccessToken();
  const data = await requestJson(sheetsUrl(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  return recordsFromRows(Array.isArray(data.values) ? data.values : []);
}

/* In-memory idempotency: a client keeps one submission ID across retries,
   so a lost response cannot create a second row in the same process. */
const recentSubmissions = new Map();
const activeSubmissions = new Map();
const IDEMPOTENCY_TTL = 10 * 60 * 1000;

function getReplayedSubmission(id) {
  if (!id) return null;
  const hit = recentSubmissions.get(id);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    recentSubmissions.delete(id);
    return null;
  }
  return hit.result;
}

function rememberSubmission(id, result) {
  if (!id) return;
  if (recentSubmissions.size > 1000) {
    for (const [key, item] of recentSubmissions) {
      if (Date.now() > item.expiresAt) recentSubmissions.delete(key);
    }
  }
  recentSubmissions.set(id, { result, expiresAt: Date.now() + IDEMPOTENCY_TTL });
}

function withSubmissionLock(id, task) {
  if (!id) return task();
  if (activeSubmissions.has(id)) return activeSubmissions.get(id);
  const promise = Promise.resolve().then(task).finally(() => activeSubmissions.delete(id));
  activeSubmissions.set(id, promise);
  return promise;
}

async function storeSubmission(record) {
  if (STORAGE_DRIVE === 'sheets') return appendToGoogleSheets(record);
  if (STORAGE_DRIVE === 'local') {
    await persistMessages([...messages, record]);
    return 'local JSON store';
  }
  throw new Error('Unsupported contact storage driver');
}

async function updateSubmissionStatus(record) {
  if (STORAGE_DRIVE !== 'local') return;
  try {
    await persistMessages(messages.map((item) => item.id === record.id
      ? { ...item, emailStatus: record.emailStatus, emailDetail: record.emailDetail }
      : item));
  } catch (err) {
    console.error('Contact store: status update failed:', err.message);
  }
}

async function loadExportRecords() {
  if (STORAGE_DRIVE === 'sheets') return readGoogleSheets();
  return messages;
}

/* ------------------------------------------------------------------ */
/* Email notification - built-in transports only, no dependencies     */
/* ------------------------------------------------------------------ */

function sendWebhook(record) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(MAIL.webhook); } catch { reject(new Error('Invalid mail webhook URL')); return; }
    if (!/^https?:$/.test(url.protocol)) { reject(new Error('Mail webhook must use http or https')); return; }
    const mod = url.protocol === 'https:' ? https : http;
    const text = [
      `Name: ${record.name}`,
      `Email: ${record.email}`,
      `Subject: ${record.subject}`,
      '',
      record.message,
      '',
      `Submitted: ${record.submittedAt}`,
      `Message ID: ${record.id}`
    ].join('\n');
    const body = JSON.stringify({
      to: MAIL.to,
      from: MAIL.from,
      subject: `Portfolio contact: ${record.subject}`,
      text
    });
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    };
    if (MAIL.webhookToken) headers.Authorization = `Bearer ${MAIL.webhookToken}`;
    const req = mod.request(url, { method: 'POST', headers, timeout: 8000 }, (res) => {
      let received = 0;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (received > 4096) res.destroy(new Error('Mail webhook response too large'));
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve('delivered via configured webhook');
        else reject(new Error(`Mail webhook returned HTTP ${res.statusCode}`));
      });
    });
    req.on('timeout', () => req.destroy(new Error('Mail webhook timed out')));
    req.on('error', reject);
    req.end(body);
  });
}

function makeSmtpSession(socket) {
  let buffer = '';
  const waiters = [];
  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    while (waiters.length) {
      const match = buffer.match(/^(\d{3})([- ])([^\r\n]*)\r?\n/);
      if (!match) break;
      buffer = buffer.slice(match[0].length);
      const waiter = waiters[0];
      waiter.parts.push({ code: Number(match[1]), text: match[3] });
      if (match[2] === ' ') {
        waiters.shift();
        const last = waiter.parts[waiter.parts.length - 1];
        if (last.code >= 400) waiter.reject(new Error(`SMTP ${last.code}: ${last.text}`));
        else waiter.resolve(last);
      }
    }
  });
  const fail = (err) => {
    const waiter = waiters.shift();
    if (waiter) waiter.reject(err);
  };
  socket.on('error', fail);
  socket.on('close', () => fail(new Error('SMTP connection closed')));
  return {
    read: () => new Promise((resolve, reject) => waiters.push({ parts: [], resolve, reject })),
    write: (line) => socket.write(line + '\r\n'),
    raw: (text) => socket.write(text),
    socket
  };
}

function sanitizeHeader(value) {
  return String(value).replace(/[\r\n]+/g, ' ').slice(0, 200);
}

async function sendSmtp(record) {
  const config = validateMailConfig();
  if (!config.ok || config.transport !== 'smtp') {
    throw new Error(config.detail || 'SMTP is not fully configured');
  }
  const helo = `EHLO ${os.hostname().replace(/[^A-Za-z0-9.-]/g, '') || 'localhost'}`;
  let socket = MAIL.smtpSecure
    ? tls.connect({ host: MAIL.smtpHost, port: MAIL.smtpPort, servername: MAIL.smtpHost })
    : net.connect({ host: MAIL.smtpHost, port: MAIL.smtpPort });
  let session = makeSmtpSession(socket);
  const timer = setTimeout(() => socket.destroy(new Error('SMTP timed out')), 12000);
  try {
    await session.read();
    session.write(helo);
    let greeting = await session.read();
    if (!MAIL.smtpSecure && greeting.parts.some((p) => /STARTTLS/i.test(p.text))) {
      session.write('STARTTLS');
      await session.read();
      socket.removeAllListeners('data');
      socket = tls.connect({ socket, servername: MAIL.smtpHost });
      session = makeSmtpSession(socket);
      session.write(helo);
      greeting = await session.read();
    }
    if (MAIL.smtpUser) {
      const auth = Buffer.from(`\0${MAIL.smtpUser}\0${MAIL.smtpPass}`, 'utf8').toString('base64');
      session.write(`AUTH PLAIN ${auth}`);
      await session.read();
    }
    session.write(`MAIL FROM:<${MAIL.from.replace(/[<>]/g, '')}>`);
    await session.read();
    session.write(`RCPT TO:<${MAIL.to.replace(/[<>]/g, '')}>`);
    await session.read();
    session.write('DATA');
    await session.read();
    session.raw([
      `From: ${sanitizeHeader(MAIL.from)}`,
      `To: ${sanitizeHeader(MAIL.to)}`,
      `Subject: ${sanitizeHeader(`Portfolio contact: ${record.subject}`)}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      `Name: ${record.name}`,
      `Email: ${record.email}`,
      `Subject: ${record.subject}`,
      '',
      record.message,
      '',
      '.',
      ''
    ].join('\r\n'));
    await session.read();
    return 'delivered via SMTP';
  } finally {
    clearTimeout(timer);
    socket.destroy();
  }
}

async function sendNotification(record) {
  const config = validateMailConfig();
  if (!config.ok) return { status: config.status, detail: config.detail };
  try {
    if (config.transport === 'webhook') return { status: 'sent', detail: await sendWebhook(record) };
    if (config.transport === 'smtp') return { status: 'sent', detail: await sendSmtp(record) };
    return { status: 'skipped', detail: 'No email transport configured' };
  } catch (err) {
    console.warn('Contact email delivery failed:', err.message);
    return { status: 'failed', detail: err.message };
  }
}

/* ------------------------------------------------------------------ */
/* DOCX export - minimal OOXML built with the standard library         */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files) {
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals = [];
  const centrals = [];
  let offset = 0;
  files.forEach((file) => {
    const name = Buffer.from(file.name, 'utf8');
    const data = Buffer.from(file.data, 'utf8');
    const packed = zlib.deflateRawSync(data, { level: 6 });
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, packed);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length + packed.length;
  });
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, end]);
}

function xmlEscape(text) {
  return String(text)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function paragraph(text, { bold = false, size = 22, spaceBefore = 0 } = {}) {
  const runProps = `<w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${size}"/></w:rPr>`;
  const paraProps = `<w:pPr>${spaceBefore ? `<w:spacing w:before="${spaceBefore}"/>` : ''}${runProps}</w:pPr>`;
  const runs = String(text).split('\n').map((line, i) => `${i ? '<w:br/>' : ''}<w:t xml:space="preserve">${xmlEscape(line)}</w:t>`).join('');
  return `<w:p>${paraProps}<w:r>${runProps}${runs}</w:r></w:p>`;
}

function buildDocx(records) {
  const body = [
    paragraph('Portfolio Contact Messages', { bold: true, size: 36 }),
    paragraph(`Exported: ${new Date().toISOString()}  |  Total messages: ${records.length}`, { size: 18 }),
    paragraph('')
  ];
  if (!records.length) {
    body.push(paragraph('No messages have been received yet.', { size: 22 }));
  }
  records.forEach((record, index) => {
    body.push(paragraph(`Message ${index + 1} - ${record.id}`, { bold: true, size: 26, spaceBefore: 260 }));
    body.push(paragraph(`Submission date and time: ${record.submittedAt}`));
    body.push(paragraph(`Name: ${record.name}`));
    body.push(paragraph(`Email: ${record.email}`));
    body.push(paragraph(`Subject: ${record.subject}`));
    body.push(paragraph('Full message:', { bold: true }));
    body.push(paragraph(record.message));
    body.push(paragraph(`Email status: ${record.emailStatus || 'unknown'}`));
    body.push(paragraph(`Record status: ${record.status || 'received'}`));
  });
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>` +
    body.join('') +
    `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>` +
    `</w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `</Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`;
  return buildZip([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'word/document.xml', data: documentXml }
  ]);
}

/* ------------------------------------------------------------------ */
/* Admin authentication                                                */
/* ------------------------------------------------------------------ */

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function adminConfigured() {
  return Boolean(process.env.CONTACT_ADMIN_TOKEN ||
    (process.env.CONTACT_ADMIN_USER && process.env.CONTACT_ADMIN_PASSWORD));
}

function isAdmin(req) {
  const header = String(req.headers.authorization || '');
  const token = process.env.CONTACT_ADMIN_TOKEN || '';
  if (token && header.startsWith('Bearer ')) return safeEqual(header.slice(7).trim(), token);
  const user = process.env.CONTACT_ADMIN_USER || '';
  const pass = process.env.CONTACT_ADMIN_PASSWORD || '';
  if (user && pass && header.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const split = decoded.indexOf(':');
      if (split >= 0 && safeEqual(decoded.slice(0, split), user) && safeEqual(decoded.slice(split + 1), pass)) return true;
    } catch { /* invalid header */ }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

function result(status, body) {
  return { status, body };
}

async function processContactRecord(record) {
  let storeDetail;
  try {
    storeDetail = await storeSubmission(record);
  } catch (err) {
    console.error('Contact store: save failed:', err.message);
    return result(503, { ok: false, error: 'Your message could not be stored. Please try again.' });
  }
  /* Email notification is best-effort. Once cloud storage has accepted the
     message, a mail failure must not be shown to the visitor. */
  const email = await sendNotification(record);
  record.emailStatus = email.status;
  record.emailDetail = email.detail;
  await updateSubmissionStatus(record);
  console.log(`Contact message ${record.id} stored in ${storeDetail} (email: ${record.emailStatus})`);
  return result(201, {
    ok: true,
    id: record.id,
    stored: true,
    spam: false,
    emailStatus: record.emailStatus,
    message: 'Your message has been received successfully.'
  });
}

async function handleContact(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (err) {
    sendJson(res, err.status === 413 ? 413 : 400, {
      ok: false,
      error: err.status === 413 ? 'Payload too large' : 'Invalid JSON body'
    });
    return;
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    sendJson(res, 400, { ok: false, error: 'Invalid payload' });
    return;
  }
  const { value, errors } = validate(payload);
  if (Object.keys(errors).length) {
    sendJson(res, 400, { ok: false, error: 'Validation failed', fields: errors });
    return;
  }
  const limit = checkRate(req);
  if (!limit.allowed) {
    sendJson(res, 429, { ok: false, error: 'Too many messages. Please try again later.' }, { 'Retry-After': String(limit.retryAfter) });
    return;
  }
  /* Honeypot: silently accept for bots, never store or notify. */
  if (value.website) {
    sendJson(res, 202, { ok: true, stored: false, spam: true, message: 'Message accepted.' });
    return;
  }
  const suppliedId = typeof payload.submissionId === 'string' && /^[A-Za-z0-9_-]{12,64}$/.test(payload.submissionId)
    ? payload.submissionId
    : null;
  const submissionId = suppliedId || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(12).toString('hex'));
  const replay = getReplayedSubmission(submissionId);
  if (replay) {
    sendJson(res, replay.status, replay.body);
    return;
  }
  const record = {
    id: submissionId,
    submittedAt: new Date().toISOString(),
    name: value.name,
    email: value.email,
    subject: value.subject,
    message: value.message,
    status: 'received',
    emailStatus: 'pending',
    emailDetail: ''
  };
  const outcome = await withSubmissionLock(submissionId, () => processContactRecord(record));
  if (outcome.status === 201) rememberSubmission(submissionId, outcome);
  sendJson(res, outcome.status, outcome.body);
}

async function handleExport(req, res) {
  if (!adminConfigured()) {
    sendJson(res, 503, { ok: false, error: 'Admin export is not configured on this server.' });
    return;
  }
  if (!isAdmin(req)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' }, { 'WWW-Authenticate': 'Basic realm="Portfolio admin"' });
    return;
  }
  try {
    const docx = buildDocx(await loadExportRecords());
    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Length': docx.length,
      'Content-Disposition': 'attachment; filename="portfolio-contact-messages.docx"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(docx);
  } catch (err) {
    console.error('DOCX export failed:', err.message);
    sendJson(res, 500, { ok: false, error: 'Export failed' });
  }
}

function handleApi(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/contact') return handleContact(req, res);
  if (req.method === 'GET' && pathname === '/api/admin/messages.docx') return handleExport(req, res);
  sendJson(res, 404, { ok: false, error: 'Not found' });
}

function decodeSafe(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

const server = http.createServer((req, res) => {
  const parsedUrl = decodeSafe((req.url || '/').split('?')[0]);
  if (parsedUrl === '/api' || parsedUrl.startsWith('/api/')) {
    handleApi(req, res, parsedUrl);
    return;
  }
  const pathname = parsedUrl === '/' ? '/index.html' : parsedUrl;
  const lower = pathname.toLowerCase();

  /* Never serve dotfiles, the private message store or any API data. */
  if (lower.split('/').some((segment) => segment.startsWith('.'))) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }
  /* The conventional ./data store path is always private, even when the
     active store is relocated with CONTACT_DATA_DIR. */
  const dataRelative = path.relative(PUBLIC_DIR, DATA_DIR).replace(/\\/g, '/');
  const privatePrefixes = ['/data'];
  if (dataRelative && !dataRelative.startsWith('..')) privatePrefixes.push('/' + dataRelative.toLowerCase());
  if (privatePrefixes.some((prefix) => lower === prefix || lower.startsWith(prefix + '/'))) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    };
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
      headers['Cache-Control'] = 'public, max-age=86400, immutable';
    } else {
      headers['Cache-Control'] = 'no-cache';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

const mailConfig = validateMailConfig();
if (!mailConfig.ok) console.warn(`Contact email is inactive: ${mailConfig.detail}`);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, retrying on ${PORT + 1}...`);
    server.listen(PORT + 1, '0.0.0.0');
  } else {
    console.error('Server error:', err);
  }
});

initStore().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Server running at:');
    console.log(`> Local:   http://localhost:${PORT}/`);
    console.log(`> Network: http://127.0.0.1:${PORT}/`);
  });
}).catch((err) => {
  console.error('Could not initialise contact store:', err);
  process.exitCode = 1;
});
