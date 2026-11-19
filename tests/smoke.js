/*
 * Headless smoke test — launches its own server and Chrome, then exercises
 * the theme, palette, filters, modal, navigation, sequence and layout.
 * Usage: npm test
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const zlib = require("zlib");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const PORT = 3000;
const DEBUG_PORT = 9333;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find((p) => fs.existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

async function waitFor(url, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch (e) { /* retry */ }
    await sleep(200);
  }
  return false;
}

function readZipEntries(buffer) {
  const entries = {};
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const packedSize = buffer.readUInt32LE(offset + 18);
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLength);
    const start = offset + 30 + nameLength + extraLength;
    entries[name] = zlib.inflateRawSync(buffer.slice(start, start + packedSize)).toString("utf8");
    offset = start + packedSize;
  }
  return entries;
}

async function main() {
  if (!CHROME) throw new Error("Chrome or Edge not found");
  let server;
  let chrome;
  let mailWebhook;
  let googleAuthServer;
  let googleSheetsServer;
  let configServer;
  let sheetsServer;
  let invalidSheetsServer;
  let configDataDir;
  let sheetsDataDir;
  let serverLog = "";
  let configServerLog = "";
  let sheetsServerLog = "";
  let invalidSheetsServerLog = "";
  const mailEvents = [];
  const googleAuthEvents = [];
  const sheetsEvents = [];
  const sheetRows = [];
  let sheetsAppendStatus = 200;
  let sheetsReadStatus = 200;
  let mailStatus = 200;
  let failContactFetch = false;
  const testDataDir = path.join(require("os").tmpdir(), `portfolio-contact-test-${process.pid}`);
  const adminToken = `test-admin-token-${process.pid}`;
  const webhookToken = `test-webhook-token-${process.pid}`;
  const serviceEmail = `contact-test@portfolio-test.iam.gserviceaccount.com`;
  const spreadsheetId = `test-spreadsheet-${process.pid}`;
  const sheetName = "Sheet1";
  const keyPair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privateKeyPem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" });
  const escapedPrivateKey = privateKeyPem.replace(/\n/g, "\\n");
  fs.rmSync(testDataDir, { recursive: true, force: true });
  try {
    mailWebhook = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        mailEvents.push({ method: req.method, url: req.url, body, headers: req.headers });
        res.writeHead(mailStatus, { "Content-Type": "application/json" });
        res.end(mailStatus < 300 ? '{"ok":true}' : '{"ok":false}');
      });
    });
    await new Promise((resolve) => mailWebhook.listen(0, "127.0.0.1", resolve));
    const webhookPort = mailWebhook.address().port;

    googleAuthServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        const params = new URLSearchParams(body);
        const assertion = params.get("assertion") || "";
        let claims = {};
        try { claims = JSON.parse(Buffer.from(assertion.split(".")[1], "base64url").toString("utf8")); } catch (err) { claims = {}; }
        googleAuthEvents.push({ url: req.url, body, claims, segments: assertion.split(".").length });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ access_token: "mock-google-access-token", expires_in: 3600, token_type: "Bearer" }));
      });
    });
    await new Promise((resolve) => googleAuthServer.listen(0, "127.0.0.1", resolve));
    const googleAuthPort = googleAuthServer.address().port;

    googleSheetsServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        const parsedUrl = new URL(req.url, "http://127.0.0.1");
        sheetsEvents.push({ method: req.method, url: req.url, body, headers: req.headers });
        if (parsedUrl.pathname.includes(":append")) {
          if (sheetsAppendStatus !== 200) {
            res.writeHead(sheetsAppendStatus, { "Content-Type": "application/json" });
            res.end('{"error":"mock append failure"}');
            return;
          }
          let payload = {};
          try { payload = JSON.parse(body); } catch (err) { payload = {}; }
          const row = Array.isArray(payload.values?.[0]) ? payload.values[0] : [];
          sheetRows.push(row);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ updates: { updatedRange: `${sheetName}!A${sheetRows.length}:E${sheetRows.length}` } }));
          return;
        }
        if (req.method === "GET" && parsedUrl.pathname.includes("/values/")) {
          if (sheetsReadStatus !== 200) {
            res.writeHead(sheetsReadStatus, { "Content-Type": "application/json" });
            res.end('{"error":"mock read failure"}');
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ values: sheetRows.slice() }));
          return;
        }
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end('{"error":"not found"}');
      });
    });
    await new Promise((resolve) => googleSheetsServer.listen(0, "127.0.0.1", resolve));
    const googleSheetsPort = googleSheetsServer.address().port;

    server = spawn("node", ["server.js"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PORT: String(PORT),
        CONTACT_DATA_DIR: testDataDir,
        CONTACT_STORAGE: "local",
        CONTACT_EMAIL_TO: "owner@example.com",
        CONTACT_EMAIL_FROM: "portfolio@example.com",
        CONTACT_EMAIL_WEBHOOK: `http://127.0.0.1:${webhookPort}/notify`,
        CONTACT_EMAIL_WEBHOOK_TOKEN: webhookToken,
        CONTACT_ADMIN_TOKEN: adminToken,
        CONTACT_RATE_LIMIT_MAX: "12",
        CONTACT_RATE_LIMIT_WINDOW_MS: "60000"
      }
    });
    server.stdout.on("data", (chunk) => { serverLog += chunk.toString(); });
    server.stderr.on("data", (chunk) => { serverLog += chunk.toString(); });
    if (!(await waitFor(BASE))) throw new Error("Server did not start");

    const profile = path.join(require("os").tmpdir(), "portfolio-smoke-profile");
    chrome = spawn(CHROME, [
      "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
      `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
      "--window-size=1440,900", "about:blank"
    ], { stdio: "ignore" });

    const targetsUrl = `http://127.0.0.1:${DEBUG_PORT}/json/list`;
    if (!(await waitFor(targetsUrl))) throw new Error("Chrome debugging port not ready");
    const targets = await (await fetch(targetsUrl)).json();
    const target = targets.find((t) => t.type === "page");
    if (!target) throw new Error("No page target");

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let seq = 0;
    const pending = new Map();
    const exceptions = [];
    const consoleErrors = [];
    const logErrors = [];

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
      if (msg.method === "Runtime.exceptionThrown") {
        exceptions.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
      }
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        consoleErrors.push(msg.params.args.map((a) => a.value || a.description || "").join(" "));
      }
      if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
        logErrors.push(msg.params.entry.text);
      }
      if (msg.method === "Fetch.requestPaused" && failContactFetch) {
        send("Fetch.failRequest", { requestId: msg.params.requestId, errorReason: "Failed" }).catch(() => {});
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
      return r.result.value;
    };
    const shot = async (name) => {
      const r = await send("Page.captureScreenshot", { format: "png" });
      const dir = path.join(ROOT, "tests", "screenshots");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), Buffer.from(r.data, "base64"));
    };
    const apiPost = async (payload) => {
      const response = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      let json = {};
      try { json = await response.json(); } catch (err) { json = {}; }
      return { status: response.status, json, headers: response.headers };
    };
    const postTo = async (base, payload) => {
      const response = await fetch(`${base}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      let json = {};
      try { json = await response.json(); } catch (err) { json = {}; }
      return { status: response.status, json, headers: response.headers };
    };
    const validMessage = () => ({
      name: "Ada Lovelace",
      email: "ada@example.com",
      subject: "Collaboration enquiry",
      message: "Hello, I would like to discuss a possible collaboration with you."
    });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Page.navigate", { url: BASE });
    await sleep(1600);
    /* Isolate the GitHub cache from earlier test runs without touching theme persistence. */
    await evaluate("localStorage.removeItem('binesa-github-repos')");
    await send("Page.reload", { ignoreCache: true });
    await sleep(1600);

    /* --- structure --- */
    check("Page title", (await evaluate("document.title")).includes("Binesa"));
    check("All sections present", await evaluate(`["home","about","skills","projects","experience","education","certifications","contact"].every(id=>!!document.getElementById(id))`));
    const requiredAssets = [
      "byc-campus.webp", "school.jpg",
      "assets/certifications/cert-ai.jpg", "assets/certifications/cert-cybersecurity.jpg",
      "assets/certifications/cert-privacy.jpg", "assets/certifications/cert-generative.jpg"
    ];
    check("Local education and certification assets exist", requiredAssets.every((asset) => fs.existsSync(path.join(ROOT, ...asset.split("/")))), requiredAssets.filter((asset) => !fs.existsSync(path.join(ROOT, ...asset.split("/")))).join(", "));
    check("Six project cards rendered", await evaluate("document.querySelectorAll('.project-card').length") === 6);
    check("21 skill chips rendered", await evaluate("document.querySelectorAll('.skill-chip').length") === 21);
    check("Hero headline present", await evaluate("document.getElementById('hero-title').textContent.includes('Exploring Digital Security.')"));
    check("No invented external links", await evaluate(`(()=>{const allowed=['fonts.googleapis','fonts.gstatic','w3.org','github.com/Binesa1110','linkedin.com/in/binesa-sajan-joseph-a5a551339'];return Array.from(document.querySelectorAll('a[href^="http"]')).filter(a=>!allowed.some(d=>a.href.includes(d))).length})()`) === 0);
    check("Six distinct project artworks", await evaluate(`(()=>{const a=[...document.querySelectorAll('.project-visual .project-art')];return a.length===6 && new Set(a.map(x=>x.getAttribute('class'))).size===6})()`));
    check("Artwork is inline SVG", await evaluate(`[...document.querySelectorAll('.project-art')].every(x=>x instanceof SVGSVGElement)`));
    check("Placeholder initials removed", await evaluate(`document.querySelectorAll('.project-glyph').length===0`));
    check("Orbit field present", await evaluate(`document.querySelectorAll('.project-orbit .orbit-ring').length===4 && !!document.querySelector('.orbit-core')`));
    check("Project cards follow orbit offsets", await evaluate(`(()=>{const v=[...document.querySelectorAll('.project-card')].map(c=>getComputedStyle(c).getPropertyValue('--orbit-y').trim());return new Set(v).size>2})()`));

    /* --- upgrade: structure, alignment, GitHub data --- */
    const frameFiles = fs.readdirSync(path.join(ROOT, "frames")).filter((f) => /^ezgif-frame-\d{3}\.jpg$/.test(f));
    check("All 238 source frames exist", frameFiles.length === 238 && fs.existsSync(path.join(ROOT, "frames", "ezgif-frame-001.jpg")) && fs.existsSync(path.join(ROOT, "frames", "ezgif-frame-238.jpg")), `${frameFiles.length} frames`);
    const alignment = await evaluate(`(()=>{
      const cards=[...document.querySelectorAll('.project-card')].filter(c=>!c.hidden);
      const rects=cards.map(c=>c.getBoundingClientRect());
      let overlaps=0;
      for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
        const a=rects[i],b=rects[j];
        if(a.left < b.right-1 && a.right > b.left+1 && a.top < b.bottom-1 && a.bottom > b.top+1) overlaps++;
      }
      const firstRow=rects.slice(0,3).map(r=>r.top), secondRow=rects.slice(3,6).map(r=>r.top);
      const rowDelta=Math.max(...firstRow)-Math.min(...firstRow)+Math.max(...secondRow)-Math.min(...secondRow);
      const artHeights=[...document.querySelectorAll('.project-visual .project-art')].map(a=>Math.round(a.getBoundingClientRect().height));
      const actionTops=cards.slice(0,3).map(c=>Math.round(c.querySelector('.project-actions').getBoundingClientRect().top));
      return {overlaps,rowDelta,artUnique:new Set(artHeights).size,artHeights,actionUnique:new Set(actionTops).size};
    })()`);
    check("Project cards do not overlap", alignment.overlaps === 0, JSON.stringify(alignment));
    check("Project rows align consistently", alignment.rowDelta <= 1, `row delta ${alignment.rowDelta}`);
    check("Project artwork has consistent dimensions", alignment.artUnique === 1, alignment.artHeights.join(","));
    check("Project buttons align consistently", alignment.actionUnique === 1, `${alignment.actionUnique} distinct tops`);
    check("Orbit paths sit behind cards", await evaluate(`(()=>{const o=getComputedStyle(document.querySelector('.project-orbit')),g=getComputedStyle(document.querySelector('.project-grid'));return Number(o.zIndex) < Number(g.zIndex) && o.pointerEvents==='none'})()`));
    check("No excessive card displacement", await evaluate(`(()=>{const ys=[...document.querySelectorAll('.project-card')].map(c=>parseFloat(getComputedStyle(c).getPropertyValue('--orbit-y'))||0);return Math.max(...ys)-Math.min(...ys)<=40})()`));

    const catalog = await evaluate("window.__portfolioDebug.getCatalog()");
    const expectedRepos = [
      "https://github.com/Binesa1110/CYBERMIND-NLP",
      "https://github.com/Binesa1110/IDS-project",
      "https://github.com/Binesa1110/mailpilot-ai",
      "https://github.com/Binesa1110/RideWise-Assist",
      "https://github.com/Binesa1110/secure-and-safe",
      "https://github.com/Binesa1110/sports-buddy"
    ];
    check("Six verified GitHub repositories shown", catalog.projects.length === 6 && catalog.projects.every((p, i) => p.repo === expectedRepos[i]));
    check("GitHub profile URL is centralized", catalog.github === "https://github.com/Binesa1110");
    check("LinkedIn URL is centralized", catalog.linkedin === "https://linkedin.com/in/binesa-sajan-joseph-a5a551339");
    check("Every project has an exact GitHub button", await evaluate(`(()=>{const a=[...document.querySelectorAll('.project-card [data-repo-link]')];return a.length===6 && a.every(x=>/^https:\\/\\/github\\.com\\/Binesa1110\\/[A-Za-z0-9._-]+$/.test(x.href) && x.target==='_blank' && x.rel.includes('noopener'))})()`));
    check("No invented demo links", await evaluate(`document.querySelectorAll('[data-demo-link]').length===0`));
    check("Interactive resume project removed", await evaluate(`!window.__portfolioDebug.getCatalog().projects.some(p=>p.id==='interactive-resume') && !document.body.textContent.includes('Interactive Online Resume')`));
    check("Repository archive present", await evaluate(`!!document.getElementById('repo-panel') && document.querySelectorAll('#repo-list .repo-item').length===7`));
    check("Empty repository clearly labelled", await evaluate(`[...document.querySelectorAll('#repo-list .repo-item')].some(li=>li.textContent.includes('SavoryAtlas') && li.textContent.includes('Empty repository'))`));
    check("GitHub refresh control present", await evaluate(`!!document.getElementById('github-refresh')`));
    check("LinkedIn appears in hero, contact and footer", await evaluate(`(()=>{const u='https://linkedin.com/in/binesa-sajan-joseph-a5a551339';return ['#hero-socials','#contact-links','#footer-links'].every(s=>[...document.querySelectorAll(s+' a')].some(a=>a.href===u))})()`));
    check("GitHub appears in hero, contact and footer", await evaluate(`(()=>{const u='https://github.com/Binesa1110';return ['#hero-socials','#contact-links','#footer-links'].every(s=>[...document.querySelectorAll(s+' a')].some(a=>a.href===u))})()`));
    check("Functional loader dismissed without blocking", await evaluate(`(()=>{const d=window.__portfolioDebug.getLoader(),l=document.getElementById('loader');return d.done && d.reason!=='none' && getComputedStyle(l).visibility==='hidden'})()`));

    /* --- theme --- */
    const initialTheme = await evaluate("document.documentElement.dataset.theme");
    await evaluate("document.getElementById('theme-toggle').click()");
    await sleep(150);
    const toggledTheme = await evaluate("document.documentElement.dataset.theme");
    check("Theme toggle changes theme", initialTheme !== toggledTheme, `${initialTheme} -> ${toggledTheme}`);
    check("Theme persisted", await evaluate("localStorage.getItem('binesa-theme')") === toggledTheme);
    await evaluate("document.getElementById('theme-toggle').click()");
    await sleep(150);
    if (await evaluate("document.documentElement.dataset.theme") !== "dark") {
      await evaluate("document.getElementById('theme-toggle').click()");
      await sleep(150);
    }
    await shot("desktop-dark.png");
    await sleep(450);
    check("Dark theme text contrast sufficient", await evaluate(`(()=>{const lum=c=>{const v=c.match(/\\d+/g).slice(0,3).map(n=>{n=n/255;return n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};const s=getComputedStyle(document.body);const a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>4.5})()`));
    check("Dark palette tokens applied", await evaluate(`(()=>{const s=getComputedStyle(document.documentElement);return [s.getPropertyValue('--bg').trim(),s.getPropertyValue('--accent').trim(),s.getPropertyValue('--accent-2').trim()].join('|')==='#08080b|#8b5cf6|#22d3ee'})()`));
    check("Theme transitions defined", await evaluate(`getComputedStyle(document.body).transitionDuration.includes('0.35s')`));
    check("Theme meta colour synced", await evaluate(`document.querySelector('meta[name="theme-color"]').content.toLowerCase()==='#08080b'`));
    check("Dark cursor uses amethyst", await evaluate(`(()=>{const c=getComputedStyle(document.querySelector('.cursor-dot')).backgroundColor;return c==='rgb(139, 92, 246)'})()`));
    check("Dark theme contact panel stays glassy and readable", await evaluate(`(()=>{const p=document.querySelector('.contact-panel'),i=document.getElementById('contact-name'),a=document.querySelector('.availability-dot');return getComputedStyle(p).backdropFilter.includes('blur') && getComputedStyle(p).backgroundImage.includes('gradient') && getComputedStyle(i).color==='rgb(244, 243, 248)' && getComputedStyle(a).backgroundColor==='rgb(139, 92, 246)'})()`));
    check("3D surfaces preserve depth", await evaluate(`getComputedStyle(document.querySelector('[data-tilt]')).transformStyle==='preserve-3d'`));
    const tiltBefore = await evaluate(`document.querySelector('.project-visual').style.getPropertyValue('--rx') || '0deg'`);
    await evaluate(`(()=>{const el=document.querySelector('.project-visual'),r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+r.width*0.8,clientY:r.top+r.height*0.2,bubbles:true}))})()`);
    await sleep(80);
    check("3D tilt responds to pointer", await evaluate(`document.querySelector('.project-visual').style.getPropertyValue('--rx')`) !== tiltBefore);
    check("Portrait uses real sequence frame", await evaluate(`(()=>{const img=document.querySelector('.portrait-character img');return !!img && img.getAttribute('src').startsWith('frames/ezgif-frame-')})()`) && fs.existsSync(path.join(ROOT, "frames", "ezgif-frame-120.jpg")));
    const lookBefore = await evaluate(`document.querySelector('.portrait-character').style.getPropertyValue('--look-x') || '0px'`);
    await evaluate(`(()=>{const el=document.querySelector('.portrait-character'),r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointermove',{clientX:r.right,clientY:r.top,bubbles:true}))})()`);
    await sleep(80);
    check("Portrait reacts to pointer", await evaluate(`document.querySelector('.portrait-character').style.getPropertyValue('--look-x')`) !== lookBefore);
    check("Portrait has CSS fallback", await evaluate(`getComputedStyle(document.querySelector('.portrait-frame')).backgroundImage.includes('gradient')`));

    /* --- command palette --- */
    await send("Input.dispatchKeyEvent", { type: "keyDown", modifiers: 2, key: "k", code: "KeyK", windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", modifiers: 2, key: "k", code: "KeyK", windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75 });
    await sleep(120);
    check("Ctrl+K opens palette", await evaluate("!document.getElementById('palette').hidden"));
    check("Palette has commands", await evaluate("document.querySelectorAll('.palette-item').length") >= 9);
    await evaluate(`document.getElementById('palette-input').value='projects'; document.getElementById('palette-input').dispatchEvent(new Event('input',{bubbles:true}))`);
    await sleep(80);
    check("Palette filters", await evaluate("document.querySelectorAll('.palette-item').length") === 1);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await sleep(100);
    check("Palette closes on select", await evaluate("document.getElementById('palette').hidden"));

    /* --- project filters + modal --- */
    await evaluate(`document.querySelector('[data-filter="Cybersecurity"]').click()`);
    await sleep(80);
    check("Project filter works", await evaluate(`Array.from(document.querySelectorAll('.project-card')).filter(c=>!c.hidden).length`) === 2);
    await evaluate(`document.querySelector('[data-filter="All"]').click()`);
    await evaluate(`document.querySelector('[data-project="cybermind-nlp"]').click()`);
    await sleep(100);
    check("Project modal opens", await evaluate("!document.getElementById('project-modal').hidden"));
    check("Modal has full detail", await evaluate(`document.getElementById('modal-body').textContent.includes('Problem addressed') && document.getElementById('modal-body').textContent.includes('Limitations')`));
    check("Modal uses project artwork", await evaluate(`!!document.querySelector('#modal-body .modal-artwork .project-art')`));
    check("Modal links to exact repository", await evaluate(`(()=>{const a=document.querySelector('#modal-body [data-modal-repo]');return !!a && a.href==='https://github.com/Binesa1110/CYBERMIND-NLP' && a.rel.includes('noopener')})()`));
    check("Modal is honest about demo links", await evaluate(`document.getElementById('modal-body').textContent.includes('No live demo URL is published')`));
    await shot("modal.png");
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await sleep(100);
    check("Escape closes modal", await evaluate("document.getElementById('project-modal').hidden"));

    /* --- contact form: validation, real submission and confirmation --- */
    check("Contact section uses a balanced two-column layout", await evaluate(`(()=>{const s=getComputedStyle(document.getElementById('contact')),g=getComputedStyle(document.querySelector('.contact-grid'));return g.gridTemplateColumns.trim().split(/\\s+/).length===2 && s.overflowX==='clip' && getComputedStyle(document.querySelector('.contact-title')).fontSize < getComputedStyle(document.getElementById('projects-title')).fontSize})()`));
    check("Contact heading is compact and editorial", await evaluate(`(()=>{const h=document.getElementById('contact-title');return h && h.innerText.replace(/\\s+/g,' ').trim()==="Let's build something meaningful."})()`));
    check("Contact availability line is honest and static", await evaluate(`(()=>{const p=document.querySelector('.contact-availability'),d=document.querySelector('.availability-dot');return p && /internships, projects & collaborations/i.test(p.textContent) && d && getComputedStyle(d).animationName==='none'})()`));
    check("Portrait is framed with a subtle orbital border", await evaluate(`(()=>{const f=document.querySelector('.contact-copy .portrait-frame'),o=document.querySelector('.contact-copy .portrait-orbit');return f && o && getComputedStyle(o).animationName==='orbit-spin' && parseFloat(getComputedStyle(f).getPropertyValue('aspect-ratio'))>0})()`));
    check("Contact panel uses a readable glass surface", await evaluate(`(()=>{const p=document.querySelector('.contact-panel'),b=getComputedStyle(p,'::before');return getComputedStyle(p).backdropFilter.includes('blur') && b.animationName==='contact-accent'})()`));
    check("Contact fields have associated labels", await evaluate(`['contact-name','contact-email','contact-subject','contact-message'].every(id=>{const l=document.querySelector('label[for="'+id+'"]');return !!l && !!document.getElementById(id)})`));
    check("Full Name label is used", await evaluate(`document.querySelector('label[for="contact-name"]').textContent.trim()==='Full Name'`));
    check("Contact social links are safe with gentle hover feedback", await evaluate(`(()=>{const a=document.querySelector('#contact-links a');return !!a && a.target==='_blank' && a.rel.includes('noopener') && getComputedStyle(a).transitionDuration.includes('0.2s')})()`));
    check("Contact decorative overlay was removed", await evaluate(`!document.querySelector('.contact-constellation') && !document.querySelector('.contact-panel span[style*="border-radius: 50%"]')`));
    await evaluate(`document.getElementById('contact-form').requestSubmit()`);
    await sleep(120);
    check("Contact form validates empty fields", await evaluate(`document.querySelectorAll('#contact-form [aria-invalid="true"]').length===4`));
    check("Contact form reports nothing sent", await evaluate(`document.getElementById('form-note').textContent.includes('Nothing was sent') && document.getElementById('contact-success').hidden===true`));
    check("Inline validation errors are accessible", await evaluate(`(()=>{const f=document.getElementById('contact-email');return f.getAttribute('aria-describedby')==='contact-email-error' && document.getElementById('contact-email-error').getAttribute('aria-live')==='polite' && document.getElementById('contact-name-error').textContent.length>0})()`));
    check("No request was made for invalid input", mailEvents.length === 0);

    await evaluate(`(()=>{document.getElementById('contact-name').value='A';document.getElementById('contact-email').value='bad-email';document.getElementById('contact-subject').value='Hi';document.getElementById('contact-message').value='too short';document.getElementById('contact-form').requestSubmit()})()`);
    await sleep(100);
    check("Contact form rejects invalid email and short message", await evaluate(`(()=>{const e=document.getElementById('contact-email'),m=document.getElementById('contact-message');return e.getAttribute('aria-invalid')==='true' && m.getAttribute('aria-invalid')==='true' && document.getElementById('contact-email-error').textContent.includes('valid email') && document.getElementById('contact-message-error').textContent.includes('10 characters')})()`));
    check("Invalid input still sends no request", mailEvents.length === 0);

    check("Contact fields are keyboard focusable", await evaluate(`(()=>{const f=['contact-name','contact-email','contact-subject','contact-message','contact-submit'];return f.every(id=>{const el=document.getElementById(id);el.focus();return document.activeElement===el})})()`));
    await evaluate(`document.getElementById('contact-name').focus()`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await sleep(60);
    check("Tab moves through contact fields", await evaluate(`document.activeElement.id==='contact-email'`));

    check("Contact form shows a sending state", await evaluate(`(()=>{document.getElementById('contact-name').value='Test Visitor';document.getElementById('contact-email').value='visitor@example.com';document.getElementById('contact-subject').value='Portfolio enquiry';document.getElementById('contact-message').value='This is a meaningful test message for the contact form.';document.getElementById('contact-form').requestSubmit();const f=document.getElementById('contact-form'),b=document.getElementById('contact-submit'),c=window.__portfolioDebug.getContact();return f.classList.contains('is-sending') && f.getAttribute('aria-busy')==='true' && b.disabled && c.buttonText==='Sending...'})()`));
    for (let i = 0; i < 40 && !(await evaluate(`window.__portfolioDebug.getContact().confirmationVisible`)); i++) await sleep(100);
    check("Contact form confirms only after server acceptance", await evaluate(`(()=>{const c=window.__portfolioDebug.getContact();return c.confirmationVisible && c.formHidden && !c.sending && c.note==='' && c.confirmation==="Your message has been received! I'll get back to you as soon as possible."})()`));
    check("Form is cleared only after confirmed success", await evaluate(`(()=>{const c=window.__portfolioDebug.getContact();return c.values.name==='' && c.values.email==='' && c.values.subject==='' && c.values.message==='' && c.deliveryStatus==='sent' && c.successNote==='' && c.buttonText==='Send message'})()`));
    check("Confirmation is announced to screen readers", await evaluate(`(()=>{const s=document.getElementById('contact-success');return s.getAttribute('role')==='status' && s.getAttribute('aria-live')==='polite' && document.getElementById('contact-success-message').getAttribute('tabindex')==='-1' && s.classList.contains('is-visible')})()`));
    check("No fake email link is generated", await evaluate(`![...document.querySelectorAll('a')].some(a=>a.href.startsWith('mailto:'))`));
    check("Notification webhook received the browser submission", mailEvents.length === 1 && JSON.parse(mailEvents[0].body).text.includes("Test Visitor"));

    await evaluate(`document.getElementById('contact-another').click()`);
    await sleep(80);
    check("Send another message resets the form", await evaluate(`(()=>{const c=window.__portfolioDebug.getContact();return !c.confirmationVisible && !c.formHidden && document.getElementById('contact-name').value==='' && document.getElementById('contact-message-count').textContent==='0 / 5000'})()`));

    /* --- failed delivery keeps data, reports honestly and allows retry --- */
    await evaluate(`(()=>{document.getElementById('contact-name').value='Retry Visitor';document.getElementById('contact-email').value='retry@example.com';document.getElementById('contact-subject').value='Retry test';document.getElementById('contact-message').value='This message should survive a failed delivery.';})()`);
    failContactFetch = true;
    await send("Fetch.enable", { patterns: [{ urlPattern: "*api/contact*", requestStage: "Request" }] });
    await evaluate(`document.getElementById('contact-form').requestSubmit()`);
    for (let i = 0; i < 40 && !(await evaluate(`window.__portfolioDebug.getContact().retryVisible`)); i++) await sleep(50);
    check("Failed delivery shows a clear error state", await evaluate(`(()=>{const c=window.__portfolioDebug.getContact();return c.retryVisible && !c.confirmationVisible && !c.formHidden && !c.sending && c.noteType.includes('is-error') && c.note.includes('could not be sent') && c.deliveryStatus==='failed'})()`));
    check("Failed delivery preserves the user's data", await evaluate(`(()=>{const v=window.__portfolioDebug.getContact().values;return v.name==='Retry Visitor' && v.email==='retry@example.com' && v.subject==='Retry test' && v.message==='This message should survive a failed delivery.'})()`));
    check("Failed delivery does not report success", mailEvents.length === 1 && !(await evaluate(`window.__portfolioDebug.getContact().confirmationVisible`)));
    await send("Fetch.disable");
    failContactFetch = false;

    await evaluate(`document.getElementById('contact-retry').click()`);
    for (let i = 0; i < 40 && !(await evaluate(`window.__portfolioDebug.getContact().confirmationVisible`)); i++) await sleep(100);
    check("Retry delivers the preserved message", await evaluate(`(()=>{const c=window.__portfolioDebug.getContact();return c.confirmationVisible && !c.retryVisible && c.deliveryStatus==='sent' && c.values.name===''})()`));
    check("Successful retry notifies once", mailEvents.length === 2 && JSON.parse(mailEvents[1].body).text.includes("Retry Visitor"));
    await evaluate(`document.getElementById('contact-another').click()`);
    await sleep(60);

    await evaluate(`document.querySelector('[data-project="sports-buddy"]').focus()`);
    await sleep(60);
    check("Keyboard focus selects a project", await evaluate(`document.querySelector('.project-card[data-project-id="sports-buddy"]').classList.contains('is-selected')`));

    /* --- contact backend: validation, honeypot, email, persistence, DOCX --- */
    const emptyResult = await apiPost({});
    check("Backend rejects empty submission with field errors", emptyResult.status === 400 && Object.keys(emptyResult.json.fields || {}).length === 4, JSON.stringify(emptyResult.json));
    const badEmail = await apiPost({ ...validMessage(), email: "not-an-email" });
    check("Backend rejects invalid email", badEmail.status === 400 && /valid email/i.test(badEmail.json.fields?.email || ""));
    const shortMessage = await apiPost({ ...validMessage(), message: "short" });
    check("Backend enforces minimum message length", shortMessage.status === 400 && /at least 10/i.test(shortMessage.json.fields?.message || ""));
    const longMessage = await apiPost({ ...validMessage(), message: "x".repeat(5001) });
    check("Backend enforces maximum message length", longMessage.status === 400 && /at most 5000/i.test(longMessage.json.fields?.message || ""));
    const escaped = await apiPost({ ...validMessage(), name: "<b>Ada</b>", subject: "X & Y", message: 'A message with <tags> & "quotes" that must be escaped properly.' });
    check("Backend accepts and sanitizes special characters", escaped.status === 201 && escaped.json.ok === true);

    const beforeSpam = mailEvents.length;
    const spam = await apiPost({ ...validMessage(), website: "https://spam.example.com" });
    check("Honeypot silently rejects bots without storing or notifying", spam.status === 202 && spam.json.spam === true && spam.json.stored === false && mailEvents.length === beforeSpam);

    const okResult = await apiPost({ ...validMessage(), name: "Grace Hopper", subject: "Successful delivery" });
    check("Backend reports successful email delivery", okResult.status === 201 && okResult.json.ok === true && okResult.json.stored === true && okResult.json.emailStatus === "sent");
    check("Notification payload contains submitted fields", mailEvents.length === beforeSpam + 1 && JSON.parse(mailEvents[mailEvents.length - 1].body).text.includes("Grace Hopper"));

    mailStatus = 500;
    const failResult = await apiPost({ ...validMessage(), name: "Failed Mail", subject: "Delivery failure test" });
    mailStatus = 200;
    check("Email failure preserves the submission and reports status", failResult.status === 201 && failResult.json.ok === true && failResult.json.emailStatus === "failed");

    const storePath = path.join(testDataDir, "messages.json");
    check("Messages persist to a private store", fs.existsSync(storePath));
    const stored = JSON.parse(fs.readFileSync(storePath, "utf8"));
    check("All accepted submissions are retained", stored.length === 5 &&
      ["Test Visitor", "Retry Visitor", "<b>Ada</b>", "Grace Hopper", "Failed Mail"].every((n) => stored.some((m) => m.name === n)) &&
      !stored.some((m) => m.name === "Ada Lovelace"));
    check("Stored records contain all required fields and statuses", stored.every((m) => m.id && m.submittedAt && m.name && m.email && m.subject && m.message && m.emailStatus) &&
      stored.some((m) => m.emailStatus === "sent") && stored.some((m) => m.emailStatus === "failed"));
    const appendResult = await apiPost(validMessage());
    const storedAgain = JSON.parse(fs.readFileSync(storePath, "utf8"));
    check("New submissions append without losing records", appendResult.status === 201 && storedAgain.length === stored.length + 1 && stored.every((m) => storedAgain.some((n) => n.id === m.id)));
    check("Private message store is not publicly served", (await fetch(`${BASE}/data/messages.json`)).status === 404);

    const noAuth = await fetch(`${BASE}/api/admin/messages.docx`);
    check("DOCX export requires authentication", noAuth.status === 401);
    const wrongAuth = await fetch(`${BASE}/api/admin/messages.docx`, { headers: { Authorization: "Bearer wrong-token" } });
    check("DOCX export rejects invalid credentials", wrongAuth.status === 401);
    const exportRes = await fetch(`${BASE}/api/admin/messages.docx`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const docxBuffer = Buffer.from(await exportRes.arrayBuffer());
    check("Authenticated DOCX export succeeds", exportRes.status === 200 && exportRes.headers.get("content-type").includes("wordprocessingml") && docxBuffer.slice(0, 2).toString() === "PK");
    check("DOCX is delivered as an attachment", /attachment; filename=/.test(exportRes.headers.get("content-disposition") || ""));
    const docxEntries = readZipEntries(docxBuffer);
    const documentXml = docxEntries["word/document.xml"] || "";
    check("DOCX contains all required OOXML parts", Boolean(docxEntries["[Content_Types].xml"] && docxEntries["_rels/.rels"] && documentXml));
    const xmlText = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    check("DOCX includes title and every record field", documentXml.includes("Portfolio Contact Messages") &&
      storedAgain.every((m) => m.submittedAt && documentXml.includes(xmlText(m.submittedAt)) && documentXml.includes(xmlText(m.name)) &&
        documentXml.includes(xmlText(m.email)) && documentXml.includes(xmlText(m.subject)) && documentXml.includes(`Email status: ${m.emailStatus}`)));
    check("DOCX includes full escaped message bodies", documentXml.includes(xmlText('A message with <tags> & "quotes" that must be escaped properly.')));

    /* --- local configuration, secret hygiene and SMTP validation --- */
    const serverSource = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
    const packageSource = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
    check("No dotenv dependency was added; .env is loaded by the server itself",
      !packageSource.includes("dotenv") && !/require\(['"]dotenv['"]\)/.test(serverSource) && serverSource.includes("loadLocalEnv()"));
    const envExample = fs.readFileSync(path.join(ROOT, ".env.example"), "utf8");
    check(".env.example documents Sheets and Gmail with placeholders only",
      envExample.includes("CONTACT_STORAGE=sheets") &&
      envExample.includes("GOOGLE_SHEETS_SPREADSHEET_ID=REPLACE_WITH_GOOGLE_SHEET_ID") &&
      envExample.includes("GOOGLE_SERVICE_ACCOUNT_EMAIL=REPLACE_WITH_SERVICE_ACCOUNT_EMAIL") &&
      envExample.includes('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nREPLACE_WITH_PRIVATE_KEY_BODY\\n-----END PRIVATE KEY-----\\n"') &&
      envExample.includes("GOOGLE_SHEETS_SHEET_NAME=Sheet1") &&
      envExample.includes("CONTACT_EMAIL_TO=binesa1110@gmail.com") &&
      envExample.includes("CONTACT_EMAIL_FROM=binesa1110@gmail.com") &&
      envExample.includes("CONTACT_SMTP_HOST=smtp.gmail.com") &&
      envExample.includes("CONTACT_SMTP_PORT=465") &&
      envExample.includes("CONTACT_SMTP_SECURE=true") &&
      envExample.includes("CONTACT_SMTP_USER=binesa1110@gmail.com") &&
      envExample.includes("CONTACT_SMTP_PASS=PASTE_GOOGLE_APP_PASSWORD_HERE") &&
      envExample.includes("CONTACT_ADMIN_TOKEN=REPLACE_WITH_A_LONG_RANDOM_TOKEN"));
    const gitignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
    check(".gitignore excludes all secret, data, backup and generated artefacts",
      /^\.env$/m.test(gitignore) && /^\.env\.\*$/m.test(gitignore) && /^!\.env\.example$/m.test(gitignore) &&
      /service-account\*\.json/.test(gitignore) && /\*service_account\*\.json/.test(gitignore) &&
      /^\*\.pem$/m.test(gitignore) && /^\*\.key$/m.test(gitignore) &&
      /^data\/$/m.test(gitignore) && /^\*\.docx$/m.test(gitignore) &&
      /^node_modules\/$/m.test(gitignore) && /^tests\/screenshots\/$/m.test(gitignore) &&
      /^\*\.log$/m.test(gitignore) && /^backup-\*\/$/m.test(gitignore));
    check("README documents GitHub and Render setup without secrets",
      fs.existsSync(path.join(ROOT, "README.md")) &&
      /npm start/.test(fs.readFileSync(path.join(ROOT, "README.md"), "utf8")) &&
      /process\.env\.PORT/.test(fs.readFileSync(path.join(ROOT, "README.md"), "utf8")));
    check("Secret and private paths are never served publicly",
      (await fetch(`${BASE}/.env`)).status === 404 &&
      (await fetch(`${BASE}/%2Eenv`)).status === 404 &&
      (await fetch(`${BASE}/.env.example`)).status === 404 &&
      (await fetch(`${BASE}/.git/config`)).status === 404 &&
      (await fetch(`${BASE}/service-account.json`)).status === 404 &&
      (await fetch(`${BASE}/credentials.json`)).status === 404 &&
      (await fetch(`${BASE}/data/messages.json`)).status === 404);

    configDataDir = path.join(require("os").tmpdir(), `portfolio-smtp-config-test-${process.pid}`);
    fs.rmSync(configDataDir, { recursive: true, force: true });
    const configPort = PORT + 1;
    const configBase = `http://127.0.0.1:${configPort}`;
    configServer = spawn("node", ["server.js"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PORT: String(configPort),
        CONTACT_DATA_DIR: configDataDir,
        CONTACT_STORAGE: "local",
        CONTACT_EMAIL_TO: "owner@example.com",
        CONTACT_EMAIL_FROM: "portfolio@example.com",
        CONTACT_EMAIL_WEBHOOK: "",
        CONTACT_EMAIL_WEBHOOK_TOKEN: "",
        CONTACT_SMTP_HOST: "smtp.gmail.com",
        CONTACT_SMTP_PORT: "465",
        CONTACT_SMTP_SECURE: "true",
        CONTACT_SMTP_USER: "test-user@example.com",
        CONTACT_SMTP_PASS: "",
        CONTACT_ADMIN_TOKEN: adminToken,
        CONTACT_RATE_LIMIT_MAX: "12",
        CONTACT_RATE_LIMIT_WINDOW_MS: "60000"
      }
    });
    configServer.stdout.on("data", (chunk) => { configServerLog += chunk.toString(); });
    configServer.stderr.on("data", (chunk) => { configServerLog += chunk.toString(); });
    if (!(await waitFor(configBase))) throw new Error("SMTP configuration test server did not start");
    const configRes = await fetch(`${configBase}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validMessage())
    });
    const configJson = await configRes.json();
    check("Incomplete SMTP credentials are rejected without a network send",
      configRes.status === 201 && configJson.ok === true && configJson.stored === true && configJson.emailStatus === "failed");
    check("SMTP config failure is reported with a generic warning",
      /Contact email is inactive: SMTP password is not configured/.test(configServerLog));
    check("SMTP config failure never exposes credentials",
      !JSON.stringify(configJson).includes("test-user@example.com") &&
      !configServerLog.includes("test-user@example.com") &&
      !configServerLog.includes(adminToken));
    configServer.kill();
    configServer = null;
    fs.rmSync(configDataDir, { recursive: true, force: true });
    configDataDir = null;

    const webhookEvent = mailEvents.find((event) => event.body.includes("Grace Hopper"));
    check("Webhook token is sent only to the configured endpoint",
      Boolean(webhookEvent) && webhookEvent.headers.authorization === `Bearer ${webhookToken}`);
    const frontendCode = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
    check("No admin or mail credentials in frontend JavaScript, API or logs",
      !frontendCode.includes(adminToken) && !frontendCode.includes(webhookToken) &&
      !JSON.stringify(okResult.json).includes(adminToken) && !JSON.stringify(okResult.json).includes(webhookToken) &&
      !serverLog.includes(adminToken) && !serverLog.includes(webhookToken) &&
      await evaluate(`!document.documentElement.outerHTML.includes('${adminToken}') && !document.documentElement.outerHTML.includes('${webhookToken}') && !document.documentElement.outerHTML.includes('CONTACT_ADMIN_TOKEN')`));
    check("Preview message functionality was removed", !fs.readFileSync(path.join(ROOT, "index.html"), "utf8").includes("Preview message") &&
      !fs.readFileSync(path.join(ROOT, "script.js"), "utf8").includes("Message preview"));

    /* --- Google Sheets cloud storage --- */
    const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    check("Public email delivery warning was removed",
      !indexHtml.includes("contact-success-note") &&
      !frontendCode.includes("could not be confirmed") &&
      !frontendCode.includes("No email notification is configured"));

    const sheetsPort = PORT + 2;
    const sheetsBase = `http://127.0.0.1:${sheetsPort}`;
    sheetsDataDir = path.join(require("os").tmpdir(), `portfolio-sheets-test-${process.pid}`);
    fs.rmSync(sheetsDataDir, { recursive: true, force: true });
    const sheetsEnv = {
      ...process.env,
      PORT: String(sheetsPort),
      CONTACT_DATA_DIR: sheetsDataDir,
      CONTACT_STORAGE: "sheets",
      GOOGLE_SHEETS_SPREADSHEET_ID: spreadsheetId,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: serviceEmail,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: escapedPrivateKey,
      GOOGLE_SHEETS_SHEET_NAME: sheetName,
      GOOGLE_OAUTH_TOKEN_URI: `http://127.0.0.1:${googleAuthPort}/token`,
      GOOGLE_SHEETS_API_BASE: `http://127.0.0.1:${googleSheetsPort}/v4/spreadsheets`,
      CONTACT_EMAIL_TO: "owner@example.com",
      CONTACT_EMAIL_FROM: "portfolio@example.com",
      CONTACT_EMAIL_WEBHOOK: "",
      CONTACT_EMAIL_WEBHOOK_TOKEN: "",
      CONTACT_SMTP_HOST: "127.0.0.1",
      CONTACT_SMTP_PORT: "9",
      CONTACT_SMTP_SECURE: "false",
      CONTACT_SMTP_USER: serviceEmail,
      CONTACT_SMTP_PASS: "fake-smtp-pass",
      CONTACT_ADMIN_TOKEN: adminToken,
      CONTACT_RATE_LIMIT_MAX: "12",
      CONTACT_RATE_LIMIT_WINDOW_MS: "60000"
    };
    sheetsServer = spawn("node", ["server.js"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: sheetsEnv
    });
    sheetsServer.stdout.on("data", (chunk) => { sheetsServerLog += chunk.toString(); });
    sheetsServer.stderr.on("data", (chunk) => { sheetsServerLog += chunk.toString(); });
    if (!(await waitFor(sheetsBase))) throw new Error("Google Sheets test server did not start");

    const sheetSubmissionId = "sheets-success-id-0001";
    const sheetPayload = {
      ...validMessage(),
      submissionId: sheetSubmissionId,
      name: "Sheet Visitor",
      message: "=SUM(1+1) formula safety check"
    };
    const beforeSheetMail = mailEvents.length;
    const sheetResult = await postTo(sheetsBase, sheetPayload);
    check("Successful Sheets append is treated as stored",
      sheetResult.status === 201 && sheetResult.json.ok === true && sheetResult.json.stored === true &&
      sheetResult.json.id === sheetSubmissionId && sheetResult.json.emailStatus === "failed");
    check("Sheets row stores the five columns in order",
      sheetRows.length === 1 && sheetRows[0][0] === "Sheet Visitor" && sheetRows[0][1] === "ada@example.com" &&
      sheetRows[0][2] === "Collaboration enquiry" && sheetRows[0][3] === "=SUM(1+1) formula safety check" &&
      /^\d{4}-\d{2}-\d{2}T/.test(String(sheetRows[0][4])));
    check("Sheets append uses RAW values and the configured tab",
      sheetsEvents.some((event) => event.method === "POST" && event.url.includes(`${sheetName}!A:E`) &&
        event.url.includes("valueInputOption=RAW") && event.body.includes("=SUM(1+1)")));
    check("Service-account JWT authentication uses the configured email",
      googleAuthEvents.some((event) => event.segments === 3 && event.claims.iss === serviceEmail &&
        /spreadsheets/.test(event.claims.scope || "") && event.claims.aud === sheetsEnv.GOOGLE_OAUTH_TOKEN_URI));
    check("Escaped private-key newlines were normalized for signing",
      privateKeyPem.includes("\n") && escapedPrivateKey.includes("\\n") && sheetRows.length === 1);
    check("SMTP failure after Sheets storage does not create an email notification",
      mailEvents.length === beforeSheetMail && /email: failed/.test(sheetsServerLog));

    const duplicateResult = await postTo(sheetsBase, sheetPayload);
    check("Submission ID prevents duplicate Sheets rows",
      duplicateResult.status === 201 && duplicateResult.json.id === sheetSubmissionId && sheetRows.length === 1);

    const sheetNoAuth = await fetch(`${sheetsBase}/api/admin/messages.docx`);
    check("Sheets-backed DOCX export remains authenticated", sheetNoAuth.status === 401);
    const sheetExport = await fetch(`${sheetsBase}/api/admin/messages.docx`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sheetDocx = Buffer.from(await sheetExport.arrayBuffer());
    const sheetDocXml = readZipEntries(sheetDocx)["word/document.xml"] || "";
    check("DOCX export is generated from Google Sheets rows",
      sheetExport.status === 200 && sheetDocXml.includes("Portfolio Contact Messages") &&
      sheetDocXml.includes("Sheet Visitor") && sheetDocXml.includes("=SUM(1+1) formula safety check"));

    sheetsAppendStatus = 500;
    const failedSheetResult = await postTo(sheetsBase, {
      ...validMessage(),
      submissionId: "sheets-failure-id-0002",
      name: "Sheet Failure"
    });
    sheetsAppendStatus = 200;
    check("Google Sheets failure returns a genuine submission failure",
      failedSheetResult.status === 503 && failedSheetResult.json.ok === false &&
      !failedSheetResult.json.stored && sheetRows.length === 1);
    check("Google Sheets failure never reports success to the visitor",
      !JSON.stringify(failedSheetResult.json).includes("received successfully") &&
      !failedSheetResult.json.confirmationVisible);

    const invalidPort = PORT + 3;
    const invalidBase = `http://127.0.0.1:${invalidPort}`;
    invalidSheetsServer = spawn("node", ["server.js"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...sheetsEnv,
        PORT: String(invalidPort),
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: ""
      }
    });
    invalidSheetsServer.stdout.on("data", (chunk) => { invalidSheetsServerLog += chunk.toString(); });
    invalidSheetsServer.stderr.on("data", (chunk) => { invalidSheetsServerLog += chunk.toString(); });
    if (!(await waitFor(invalidBase))) throw new Error("Invalid Sheets config test server did not start");
    const invalidResult = await postTo(invalidBase, {
      ...validMessage(),
      submissionId: "sheets-invalid-id-0003"
    });
    check("Missing Google credentials are rejected without success",
      invalidResult.status === 503 && invalidResult.json.ok === false && !invalidResult.json.stored);
    check("Invalid configuration warning is generic",
      /Contact storage is not ready: Google service account private key is not configured/.test(invalidSheetsServerLog));
    check("Google credentials are absent from frontend, API responses and logs",
      !frontendCode.includes(privateKeyPem) && !indexHtml.includes(spreadsheetId) &&
      !JSON.stringify(sheetResult.json).includes(privateKeyPem) &&
      !JSON.stringify(sheetResult.json).includes(serviceEmail) &&
      !sheetsServerLog.includes(privateKeyPem) && !sheetsServerLog.includes(serviceEmail) &&
      !invalidSheetsServerLog.includes(privateKeyPem));

    sheetsServer.kill();
    sheetsServer = null;
    invalidSheetsServer.kill();
    invalidSheetsServer = null;
    fs.rmSync(sheetsDataDir, { recursive: true, force: true });
    sheetsDataDir = null;

    let rateLimited = 0;
    let lastRateStatus = 0;
    for (let i = 0; i < 20; i++) {
      const result = await apiPost(validMessage());
      lastRateStatus = result.status;
      if (result.status === 429) rateLimited++;
    }
    check("Rate limiting blocks excessive submissions", rateLimited > 0 && lastRateStatus === 429, `${rateLimited} blocked`);
    const rateProbe = await apiPost(validMessage());
    check("Rate limit response includes retry guidance", rateProbe.status === 429 && Number(rateProbe.headers.get("retry-after")) > 0);

    /* --- skills --- */
    check("Skills heading and subtitle are exact", await evaluate(`(()=>{const h=document.getElementById('skills-title'),a=document.querySelector('#skills .section-aside');return h && h.textContent.replace(/\\s+/g,' ').trim()==='MY TECH STACK' && a && a.textContent.trim()==='Technologies, tools and concepts I work with.'})()`));
    const skillViz = await evaluate("window.__portfolioDebug.getSkills()");
    check("Technology spheres render from verified skills", skillViz.spheres === 21 && await evaluate(`(()=>{const expected=window.SKILLS.flatMap(g=>g.skills).map(s=>s.name);const actual=[...document.querySelectorAll('.tech-sphere .sphere-label')].map(s=>s.textContent);return expected.length===actual.length && expected.every((n,i)=>n===actual[i])})()`), `${skillViz.spheres} spheres`);
    check("Technology spheres support pointer physics", skillViz.interactive === true, JSON.stringify({ interactive: skillViz.interactive, visible: skillViz.visible }));
    await evaluate(`window.scrollTo(0, document.getElementById('skills').offsetTop + 60)`);
    await sleep(260);
    const sphereBefore = await evaluate(`window.__portfolioDebug.getSkills().firstOffset`);
    await evaluate(`(()=>{const c=document.getElementById('tech-cloud'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+r.width*.5,clientY:r.top+r.height*.49,bubbles:true}))})()`);
    await sleep(140);
    check("Technology spheres react to pointer", await evaluate(`window.__portfolioDebug.getSkills().firstOffset`) !== sphereBefore);
    await evaluate(`(()=>{[...document.querySelectorAll('.tech-sphere')].find(s=>s.dataset.skillName==='Python').click()})()`);
    await sleep(60);
    check("Technology sphere tap selects matching skill", await evaluate(`document.getElementById('skill-detail').textContent.includes('Python')`));
    await evaluate(`document.querySelector('[data-skill-tab="security"]').click(); document.querySelector('.skill-chip[data-name="OSINT"]').click()`);
    await sleep(80);
    check("Skill filter works", await evaluate(`Array.from(document.querySelectorAll('[data-skill-group]')).filter(g=>!g.hidden).length`) === 1);
    check("Skill selection updates detail", await evaluate(`document.getElementById('skill-detail').textContent.includes('OSINT')`));

    /* --- education flip cards --- */
    check("Education card uses verified content only", await evaluate(`(()=>{const c=document.querySelector('[data-institution="christ"]'),f=c.querySelector('.edu-face-front'),b=c.querySelector('.edu-face-back');return f.textContent.includes('2024 — 2027') && f.textContent.includes('CHRIST (Deemed to be University)') && f.textContent.includes('Yeshwanthpur Campus, Bengaluru') && b.textContent.includes('Bachelor of Computer Applications') && b.textContent.includes('CHRIST (Deemed to be University)') && b.textContent.includes('Yeshwanthpur Campus, Bengaluru') && b.textContent.includes('Computer Applications') && b.textContent.includes('AI & Security interests') && b.textContent.includes('2027 cohort') && !c.textContent.match(/GPA|grade|achievement/i)})()`));
    check("Education cards use the supplied local images", await evaluate(`(()=>{const d=window.__portfolioDebug.getEducation(),c=[...document.querySelectorAll('[data-flip-card]')];return d.cards===2 && d.images.length===2 && d.images[0].src==='byc-campus.webp' && d.images[1].src==='school.jpg' && c.every(x=>{const i=x.querySelector('.edu-photo');return i && /institution|school|building|campus/i.test(i.alt)})})()`));
    check("School education uses verified details only", await evaluate(`(()=>{const c=document.querySelector('[data-institution="school"]'),t=c.textContent;return t.includes('St. Joseph Convent School') && t.includes('Jabalpur, Madhya Pradesh') && t.includes('Mathematics') && t.includes('Science') && !/\\b(class|board|percentage|gpa|grade|year|12th|10th)\\b/i.test(t)})()`));
    await evaluate(`document.querySelector('.edu-face-front [data-flip-toggle]').click()`);
    await sleep(140);
    check("Education card flips with accessible state", await evaluate(`(()=>{const c=document.querySelector('[data-flip-card]');return c.classList.contains('is-flipped') && c.querySelector('.edu-face-front').getAttribute('aria-hidden')==='true' && c.querySelector('.edu-face-back').getAttribute('aria-hidden')==='false' && c.querySelector('.edu-face-front [data-flip-toggle]').getAttribute('aria-expanded')==='true'})()`));
    await evaluate(`document.querySelector('.edu-face-back [data-flip-toggle]').click()`);
    await sleep(140);
    check("Education card returns to front", await evaluate(`(()=>{const c=document.querySelector('[data-flip-card]');return !c.classList.contains('is-flipped') && c.querySelector('.edu-face-back').getAttribute('aria-hidden')==='true'})()`));
    await evaluate(`document.querySelector('.edu-face-front [data-flip-toggle]').focus()`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", text: "\r", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await sleep(140);
    check("Keyboard activation flips education card", await evaluate(`document.querySelector('[data-flip-card]').classList.contains('is-flipped')`));
    await evaluate(`document.querySelector('[data-flip-card]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
    await sleep(140);
    check("Escape returns education card to front", await evaluate(`!document.querySelector('[data-flip-card]').classList.contains('is-flipped')`));
    await evaluate(`document.querySelector('[data-institution="school"] .edu-face-front [data-flip-toggle]').click()`);
    await sleep(140);
    check("Second education card flips with accessible state", await evaluate(`(()=>{const c=document.querySelector('[data-institution="school"]');return c.classList.contains('is-flipped') && c.querySelector('.edu-face-front').getAttribute('aria-hidden')==='true' && c.querySelector('.edu-face-back').getAttribute('aria-hidden')==='false'})()`));
    await evaluate(`document.querySelector('[data-institution="school"] .edu-face-back [data-flip-toggle]').click()`);
    await sleep(140);

    /* --- immersive experience --- */
    const experienceViz = await evaluate("window.__portfolioDebug.getExperience()");
    check("Experience ambient environment renders", experienceViz.ambient && experienceViz.particles === 8 && experienceViz.networkPaths === 3, JSON.stringify(experienceViz));
    check("About and Experience share the ambient language", await evaluate(`(()=>{const a=document.getElementById('about-ambient'),e=document.getElementById('experience-ambient');return !!a && !!e && a.classList.contains('ambient-layer') && e.classList.contains('ambient-layer') && a.querySelectorAll('.ambient-orb').length===2 && e.querySelectorAll('.ambient-orb').length===2 && a.querySelector('.ambient-network') && e.querySelector('.ambient-network')})()`));
    const atmosphereInfo = await evaluate("window.__portfolioDebug.getBackgrounds()");
    check("Every major section has a distinct atmosphere", atmosphereInfo.sections === 7 && atmosphereInfo.ambientLayers === 2, JSON.stringify(atmosphereInfo));
    check("Section atmospheres use layered gradients", await evaluate(`(()=>{const ids=['about','skills','projects','experience','education','certifications','contact'];return ids.every(id=>{const s=getComputedStyle(document.getElementById(id),'::before');return s.content!=='none' && s.backgroundImage.includes('radial-gradient') && s.backgroundImage.includes('linear-gradient') && getComputedStyle(document.getElementById(id)).overflowX==='clip'})})()`));
    check("Experience uses only verified internship content", await evaluate(`(()=>{const s=document.getElementById('experience'),t=s.textContent;return document.querySelectorAll('#experience .timeline-card').length===1 && t.includes('Unified Mentor') && t.includes('Full Stack Developer Intern') && t.includes('APRIL 2025 — MAY 2025') && t.includes('HTML') && t.includes('CSS') && t.includes('JavaScript') && t.includes('Firebase') && s.querySelectorAll('.timeline-list li').length===4 && !/Remote|Hybrid|On-site|Onsite/i.test(t)})()`));
    check("Experience timeline is structured", await evaluate(`!!document.querySelector('#experience [data-timeline] .timeline-progress') && !!document.querySelector('#experience [data-timeline] .timeline-node') && document.querySelectorAll('#experience [data-tilt]').length >= 3`));
    await evaluate(`window.scrollTo(0, document.getElementById('experience').offsetTop + 120)`);
    await sleep(280);
    const experienceActive = await evaluate("window.__portfolioDebug.getExperience()");
    check("Timeline progresses on scroll", experienceActive.progress > 0 && experienceActive.paused === false, JSON.stringify(experienceActive));
    check("Off-screen atmosphere animations pause", await evaluate(`(()=>{const b=window.__portfolioDebug.getBackgrounds();return b.aboutPaused===true && b.experiencePaused===false})()`));

    /* --- certification stack --- */
    const certInitial = await evaluate("window.__portfolioDebug.getCertifications()");
    check("Certification stack renders four verified cards", certInitial.cards === 4 && await evaluate(`(()=>{const t=document.getElementById('cert-stack').textContent;return t.includes('Build with AI Bootcamp') && t.includes('Google for Developers & Hack2Skill') && t.includes('JULY 2026') && t.includes('Foundations of Cybersecurity') && t.includes('Google') && t.includes('MAY 2026') && t.includes('Master Privacy and Security in Online Social Media') && t.includes('NPTEL') && t.includes('Master Generative AI & Generative AI Tools') && t.includes('Infosys Springboard') && t.includes('2025')})()`));
    check("Certification visuals are topical local assets, not certificates", await evaluate(`(()=>{const s=document.getElementById('cert-stack'),imgs=[...s.querySelectorAll('img')];return imgs.length===4 && imgs.every(i=>i.getAttribute('src').startsWith('assets/certifications/') && /^Topic visual:/i.test(i.alt) && /not an official certificate/i.test(i.alt)) && s.querySelectorAll('a').length===0 && s.querySelectorAll('[href]:not(use)').length===0 && s.querySelectorAll('figcaption').length===4 && [...s.querySelectorAll('figcaption')].every(f=>f.textContent.includes('Topic visual')) && !/credential id|certificate id|verification code/i.test(s.textContent)})()`));
    check("Certification cards are accessible", await evaluate(`(()=>{const c=[...document.querySelectorAll('[data-cert-card]')];return c.every((x,i)=>x.getAttribute('role')==='listitem' && x.getAttribute('aria-labelledby')==='cert-title-'+(i+1) && x.hasAttribute('aria-labelledby')) && c.filter(x=>x.tabIndex===0).length===1 && !!document.querySelector('[data-cert-prev]') && !!document.querySelector('[data-cert-next]') && !!document.getElementById('cert-status')})()`));
    await evaluate(`(()=>{const t=document.getElementById('cert-stack-track'),r=t.getBoundingClientRect(),top=r.top+window.scrollY,total=Math.max(1,t.offsetHeight-window.innerHeight);window.scrollTo({top:top+total*.55,behavior:'instant'})})()`);
    await sleep(320);
    const certMiddle = await evaluate("window.__portfolioDebug.getCertifications()");
    check("Certification stack advances with scroll", certMiddle.stacked === true && certMiddle.progress > .45 && certMiddle.active >= 1, JSON.stringify(certMiddle));
    check("Certification cards use controlled layered 3D transforms", await evaluate(`(()=>{const c=[...document.querySelectorAll('[data-cert-card]')],ys=c.map(x=>Math.abs(parseFloat(x.style.getPropertyValue('--cert-y')))),scales=c.map(x=>parseFloat(x.style.getPropertyValue('--cert-scale'))),veils=c.map(x=>parseFloat(x.style.getPropertyValue('--cert-veil')));return c.every(x=>getComputedStyle(x).transform!=='none' && getComputedStyle(x).opacity==='1' && /^rgb\\(/.test(getComputedStyle(x).backgroundColor)) && new Set(c.map(x=>x.style.zIndex)).size>1 && Math.max(...ys)<=44 && Math.min(...scales)>=.86 && veils.filter(v=>v===0).length===1})()`));
    check("Certification visuals load after scrolling into view", await evaluate(`window.__portfolioDebug.getCertifications().images.every(i=>i.loaded)`));
    check("Certification cards are wide and opaque", await evaluate(`(()=>{const c=[...document.querySelectorAll('[data-cert-card]')],r=document.querySelector('[data-cert-card].is-active').getBoundingClientRect();return r.width>=700 && r.height>=300 && c.every(x=>getComputedStyle(x).backgroundColor==='rgb(16, 16, 21)')})()`));
    check("Certification track is shorter than before", await evaluate(`(()=>{const t=document.getElementById('cert-stack-track');return t.offsetHeight<=innerHeight*2.1 && t.offsetHeight>=innerHeight*1.7})()`));
    check("Certification status tracks the active card", await evaluate(`document.getElementById('cert-status').textContent.includes('Certificate '+(window.__portfolioDebug.getCertifications().active+1)+' of 4')`));
    await evaluate(`document.querySelector('[data-cert-next]').click()`);
    await sleep(900);
    check("Certification navigation moves forward", await evaluate(`window.__portfolioDebug.getCertifications().active`) > certMiddle.active);

    /* --- navigation + scroll --- */
    await evaluate(`window.scrollTo(0, document.getElementById('projects').offsetTop + 40)`);
    await sleep(400);
    check("Active nav updates", await evaluate(`document.querySelector('[data-nav-link].is-active')?.getAttribute('href')`) === "#projects");
    check("Scroll progress advances", await evaluate(`getComputedStyle(document.getElementById('scroll-progress-bar')).transform`) !== "matrix(0, 0, 0, 1, 0, 0)");
    check("Reveals activate", await evaluate(`document.querySelectorAll('[data-reveal].is-in').length`) > 0);
    await evaluate(`window.scrollTo(0, document.getElementById('projects').offsetTop + document.getElementById('projects').offsetHeight - window.innerHeight)`);
    await sleep(600);
    check("All project cards become visible", await evaluate(`Array.from(document.querySelectorAll('.project-card')).every(c=>c.classList.contains('is-in'))`));
    await evaluate(`window.scrollTo(0, document.getElementById('skills').offsetTop + 40)`);
    await sleep(500);
    check("All skill groups become visible", await evaluate(`Array.from(document.querySelectorAll('[data-skill-group]')).every(g=>g.classList.contains('is-in'))`));
    check("No horizontal overflow", await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"));

    /* --- sequence engine inside the Hero --- */
    await evaluate(`window.scrollTo(0, document.getElementById('home').offsetTop + window.innerHeight * 0.8)`);
    await sleep(1000);
    const seqProgress = await evaluate("window.__sequence ? window.__sequence.getProgress() : -1");
    check("Canvas sequence advances", seqProgress > 0.05, `progress ${Number(seqProgress).toFixed(3)}`);
    const info = await evaluate("window.__sequence.getCanvasInfo()");
    check("Canvas has pixels", info.width > 0 && info.height > 0, `${info.width}x${info.height}`);
    check("Canvas is the Hero centerpiece", info.cssWidth > 300, `${Math.round(info.cssWidth)}px wide`);
    check("Canvas backing matches CSS x DPR", Math.abs(info.width - info.cssWidth * info.dpr) <= 2 && Math.abs(info.height - info.cssHeight * info.dpr) <= 2, `backing ${info.width}x${info.height}, css ${Math.round(info.cssWidth)}x${Math.round(info.cssHeight)}, dpr ${info.dpr}`);
    check("Canvas aspect ratio preserved", Math.abs(info.width / info.height - info.cssWidth / info.cssHeight) < 0.02);
    check("236+ frame count preserved", info.totalFrames === 238);
    check("Frame cache is bounded", info.cached <= 20 && info.pending <= 6, `${info.cached} cached, ${info.pending} pending`);
    check("Drawn frame matches scroll position", Math.abs(info.lastDrawnIndex - Math.round(seqProgress * 237)) <= 4, `drawn ${info.lastDrawnIndex}, target ${Math.round(seqProgress * 237)}`);
    check("No frame load failures", info.failedLoads === 0);
    check("Hero content fits desktop viewport", await evaluate(`(()=>{const sels=['.hero-name','#hero-title','.hero-actions','#cinema-frame'];return sels.every(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top>=-2 && r.bottom<=innerHeight+2})})()`));
    check("Old orbital centerpiece removed", await evaluate(`document.querySelectorAll('.core-stage,.orbit,.core-orb').length === 0`));
    check("Sequence section removed", await evaluate(`!document.getElementById('sequence')`));

    /* --- light theme screenshot --- */
    if (await evaluate("document.documentElement.dataset.theme") !== "light") {
      await evaluate("document.getElementById('theme-toggle').click()");
    }
    await sleep(250);
    await evaluate("window.scrollTo(0,0)");
    await sleep(300);
    await shot("desktop-light.png");
    check("Light theme applied", await evaluate("document.documentElement.dataset.theme") === "light");
    check("Light palette tokens applied", await evaluate(`(()=>{const s=getComputedStyle(document.documentElement);return s.getPropertyValue('--bg').trim()==='#fff8f0' && s.getPropertyValue('--text').trim()==='#3b2723' && s.getPropertyValue('--accent').trim()==='#c98f91' && s.getPropertyValue('--espresso').trim()==='#3b2723'})()`));
    check("Light hero uses peach gradient", await evaluate(`getComputedStyle(document.querySelector('.hero-bg')).backgroundImage.includes('gradient')`));
    check("Light primary button uses espresso", await evaluate(`getComputedStyle(document.querySelector('.btn-primary')).backgroundColor==='rgb(59, 39, 35)'`));
    check("Light theme meta colour synced", await evaluate(`document.querySelector('meta[name="theme-color"]').content.toLowerCase()==='#fff8f0'`));
    check("Light theme text contrast sufficient", await evaluate(`(()=>{const lum=c=>{const v=c.match(/\\d+/g).slice(0,3).map(n=>{n=n/255;return n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};const s=getComputedStyle(document.body);const a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>4.5})()`));
    check("Light theme contact panel stays readable", await evaluate(`(()=>{const p=document.querySelector('.contact-panel'),i=document.getElementById('contact-name'),o=document.querySelector('.contact-copy .portrait-orbit');return getComputedStyle(p).backdropFilter.includes('blur') && getComputedStyle(p).backgroundImage.includes('gradient') && getComputedStyle(i).color==='rgb(59, 39, 35)' && getComputedStyle(o).borderTopColor.includes('150, 92, 96')})()`));
    check("Light cursor uses espresso", await evaluate(`getComputedStyle(document.querySelector('.cursor-dot')).backgroundColor==='rgb(59, 39, 35)'`));
    check("Light cursor ring uses dusty rose", await evaluate(`getComputedStyle(document.querySelector('.cursor-ring')).borderColor.includes('150, 92, 96')`));

    /* --- GitHub API pagination, failures and missing data --- */
    const paged = await evaluate(`(async()=>{const make=n=>Array.from({length:n},(_,i)=>({name:'repo-'+i,html_url:'https://github.com/Binesa1110/repo-'+i,description:'Synthetic test repository '+(i+1),homepage:'',language:'JavaScript',size:1,fork:false,archived:false,updated_at:'2026-01-01T00:00:00Z'}));const result=await window.__portfolioDebug.refreshGitHub({fetchImpl:async url=>{const page=Number(new URL(url).searchParams.get('page'));return {ok:true,json:async()=>page===1?make(100):page===2?make(3):[]}}});return result})()`);
    check("GitHub API pagination fetches every page", paged.ok === true && paged.count === 103 && paged.source === 'api', JSON.stringify(paged));
    check("Paginated catalog renders all repositories", await evaluate(`document.querySelectorAll('#repo-list .repo-item').length===103`));
    const missing = await evaluate(`(async()=>{const r=await window.__portfolioDebug.refreshGitHub({fetchImpl:async()=>({ok:true,json:async()=>[{name:'minimal-repo',html_url:'https://github.com/Binesa1110/minimal-repo',description:null,homepage:null,language:null,size:0,fork:false,archived:false,updated_at:''}]})});return r})()`);
    check("Missing repository data handled", missing.ok === true && await evaluate(`document.querySelector('#repo-list').textContent.includes('No description provided') && document.querySelector('#repo-list').textContent.includes('Empty repository')`));
    const failed = await evaluate(`(async()=>window.__portfolioDebug.refreshGitHub({fetchImpl:async()=>({ok:false,status:403})}))()`);
    check("GitHub API failure falls back gracefully", failed.ok === false && failed.source === 'snapshot' && await evaluate(`document.getElementById('repo-status').textContent.includes('verified local snapshot')`));
    check("Fallback restores full public catalog", await evaluate(`document.querySelectorAll('#repo-list .repo-item').length===7`));

    /* --- tablet --- */
    await send("Emulation.setDeviceMetricsOverride", { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
    await sleep(300);
    check("Tablet no horizontal overflow", await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"));
    check("Tablet hero content fits", await evaluate(`(()=>{const sels=['#hero-title','.hero-actions','#cinema-frame'];return sels.every(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top>=-2 && r.bottom<=innerHeight+2})})()`));
    check("Tablet project layout simplified", await evaluate(`getComputedStyle(document.querySelector('.project-card')).getPropertyValue('--orbit-y').trim()==='0px'`));
    check("Tablet technology universe scales down", await evaluate(`parseFloat(getComputedStyle(document.getElementById('tech-universe')).height)<=391`));
    check("Tablet experience stacks into one column", await evaluate(`getComputedStyle(document.querySelector('.experience-grid')).gridTemplateColumns.trim().split(/\\s+/).length===1`));
    check("Tablet certification stack remains active", await evaluate(`window.__portfolioDebug.getCertifications().stacked===true`));
    check("Tablet certification cards stay wide and readable", await evaluate(`(()=>{const r=document.querySelector('[data-cert-card]').getBoundingClientRect();return r.width>=700 && r.height>=300 && getComputedStyle(document.querySelector('[data-cert-card]')).backgroundColor==='rgb(255, 253, 250)'})()`));
    check("Tablet education images render", await evaluate(`[...document.querySelectorAll('.edu-photo')].every(i=>i.complete && i.naturalWidth>0 && i.getBoundingClientRect().width>200)`));
    check("Tablet section atmospheres do not overflow", await evaluate(`document.documentElement.scrollWidth<=window.innerWidth+1 && [...document.querySelectorAll('[data-atmosphere]')].every(s=>getComputedStyle(s,'::before').content!=='none')`));
    check("Tablet contact form stays readable", await evaluate(`(()=>{const g=getComputedStyle(document.querySelector('.contact-grid')),b=document.getElementById('contact-submit').getBoundingClientRect(),p=document.querySelector('.contact-panel').getBoundingClientRect();return g.gridTemplateColumns.trim().split(/\\s+/).length===1 && b.width>200 && b.height>=40 && b.left>=p.left-1 && b.right<=p.right+1})()`));
    check("Tablet portrait stays compact and clear of the form", await evaluate(`(()=>{const r=document.querySelector('.contact-copy .portrait-frame').getBoundingClientRect(),p=document.querySelector('.contact-panel').getBoundingClientRect();return r.width<=200 && r.height<=200 && r.right<=innerWidth+1 && (r.bottom<=p.top+2 || r.top>=p.bottom-2)})()`));
    await shot("tablet-light.png");

    /* --- mobile --- */
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await sleep(250);
    check("Mobile menu button visible", await evaluate(`getComputedStyle(document.getElementById('menu-toggle')).display !== 'none'`));
    check("No mobile horizontal overflow", await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"));
    await evaluate(`document.getElementById('menu-toggle').click()`);
    await sleep(150);
    check("Mobile menu opens", await evaluate("document.getElementById('nav-links').classList.contains('is-open')"));
    await evaluate("document.getElementById('menu-toggle').click()");
    await sleep(200);
    const mobileInfo = await evaluate("window.__sequence.getCanvasInfo()");
    check("Mobile canvas DPR-scaled", Math.abs(mobileInfo.width - mobileInfo.cssWidth * mobileInfo.dpr) <= 2 && Math.abs(mobileInfo.height - mobileInfo.cssHeight * mobileInfo.dpr) <= 2, `backing ${mobileInfo.width}x${mobileInfo.height}, css ${Math.round(mobileInfo.cssWidth)}x${Math.round(mobileInfo.cssHeight)}, dpr ${mobileInfo.dpr}`);
    check("Mobile canvas aspect preserved", Math.abs(mobileInfo.width / mobileInfo.height - mobileInfo.cssWidth / mobileInfo.cssHeight) < 0.02);
    check("Mobile canvas visible", mobileInfo.cssWidth > 300 && mobileInfo.cssHeight > 150);
    check("Custom cursor disabled on touch layouts", await evaluate(`getComputedStyle(document.querySelector('.cursor-layer')).display==='none'`));
    check("Mobile 3D effects simplified", await evaluate(`getComputedStyle(document.querySelector('.project-visual')).transformStyle==='flat' || getComputedStyle(document.querySelector('.project-visual')).transform==='none'`));
    const mobileArtwork = await evaluate(`(()=>{const r=document.querySelector('.project-art').getBoundingClientRect();return {w:r.width,h:r.height}})()`);
    check("Mobile project artwork visible", mobileArtwork.w > 200 && mobileArtwork.h > 100, `${Math.round(mobileArtwork.w)}x${Math.round(mobileArtwork.h)}`);
    check("Mobile project layout simplified", await evaluate(`getComputedStyle(document.querySelector('.project-card')).getPropertyValue('--orbit-y').trim()==='0px'`));
    check("Mobile technology universe compact", await evaluate(`(()=>{const h=parseFloat(getComputedStyle(document.getElementById('tech-universe')).height),f=parseFloat(getComputedStyle(document.querySelector('.sphere-label')).fontSize);return h<=361 && f<=9.6})()`));
    check("Mobile certification stack becomes readable sequence", await evaluate(`(()=>{const d=window.__portfolioDebug.getCertifications(),c=document.querySelector('[data-cert-card]');return d.stacked===false && getComputedStyle(c).transform==='none' && getComputedStyle(document.getElementById('cert-stack')).display==='grid'})()`));
    check("Mobile certification cards do not overlap", await evaluate(`(()=>{const r=[...document.querySelectorAll('[data-cert-card]')].map(x=>x.getBoundingClientRect());return r.every((x,i)=>x.width>300 && x.height>300 && (i===0 || x.top>=r[i-1].bottom-1))})()`));
    check("Mobile certification visuals and credits display", await evaluate(`[...document.querySelectorAll('.cert-visual img')].every(i=>i.complete && i.naturalWidth>0 && i.getBoundingClientRect().width>280) && [...document.querySelectorAll('.cert-visual figcaption')].every(f=>getComputedStyle(f).display!=='none')`));
    check("Mobile education images fit the viewport", await evaluate(`[...document.querySelectorAll('.edu-photo')].every(i=>i.complete && i.naturalWidth>0 && i.getBoundingClientRect().width<=innerWidth-24)`));
    check("Mobile contact stacks into one column", await evaluate(`(()=>{const g=getComputedStyle(document.querySelector('.contact-grid')),p=document.querySelector('.contact-panel').getBoundingClientRect(),i=document.getElementById('contact-message').getBoundingClientRect();return g.gridTemplateColumns.trim().split(/\\s+/).length===1 && i.left>=p.left-1 && i.right<=p.right+1 && i.width<=innerWidth-40})()`));
    check("Mobile portrait does not dominate the screen", await evaluate(`(()=>{const r=document.querySelector('.contact-copy .portrait-frame').getBoundingClientRect();return r.width<=innerWidth*0.5 && r.height<200 && r.left>=-2 && r.right<=innerWidth+2})()`));
    await evaluate(`document.querySelector('.edu-face-front [data-flip-toggle]').click()`);
    await sleep(100);
    check("Mobile education flip works by tap", await evaluate(`document.querySelector('[data-flip-card]').classList.contains('is-flipped')`));
    await evaluate(`document.querySelector('.edu-face-back [data-flip-toggle]').click()`);
    await sleep(100);
    check("Mobile experience card fits viewport", await evaluate(`(()=>{const r=document.querySelector('.timeline-card').getBoundingClientRect();return r.width>240 && r.width<=innerWidth-24 && r.height>200})()`));
    await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 780, deviceScaleFactor: 2, mobile: true });
    await sleep(180);
    check("Narrow mobile has no horizontal overflow", await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"));
    check("Narrow mobile keeps all section content reachable", await evaluate(`(()=>{const ids=['skills','projects','experience','education','certifications','contact'];return ids.every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.height>100 && r.left>=-2 && r.right<=innerWidth+2})})()`));
    check("Narrow mobile contact fields fit the viewport", await evaluate(`(()=>{const ids=['contact-name','contact-email','contact-subject','contact-message','contact-submit'];return ids.every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width>200 && r.width<=innerWidth-24 && r.left>=12})})()`));
    check("Narrow mobile contact availability stays in view", await evaluate(`(()=>{const a=document.querySelector('.contact-availability').getBoundingClientRect(),l=document.getElementById('contact-links').getBoundingClientRect();return a.left>=8 && a.right<=innerWidth-8 && l.left>=8 && l.right<=innerWidth+1})()`));
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await sleep(120);
    const mobileFit = await evaluate(`(()=>{const sels=['.hero-name','#hero-title','.hero-actions','#cinema-frame'];return sels.map(s=>({s,r:document.querySelector(s).getBoundingClientRect()})).filter(o=>o.r.top< -2 || o.r.bottom>innerHeight+2).map(o=>o.s+':'+Math.round(o.r.top)+'-'+Math.round(o.r.bottom))})()`);
    check("Hero content fits mobile viewport", mobileFit.length === 0, mobileFit.join(", "));
    await shot("mobile-light.png");

    /* --- accessibility / layout --- */
    check("All buttons have accessible names", await evaluate(`Array.from(document.querySelectorAll('button')).every(b=>(b.textContent.trim() || b.getAttribute('aria-label')))`));
    check("All links have href and label", await evaluate(`Array.from(document.querySelectorAll('a')).every(a=>a.getAttribute('href') && (a.textContent.trim() || a.getAttribute('aria-label')))`));
    check("Hero title visible", await evaluate(`(()=>{const el=document.getElementById('hero-title');const r=el.getBoundingClientRect();return r.height>50 && getComputedStyle(el).opacity==='1'})()`));
    check("Canvas uses high-quality smoothing", await evaluate(`(()=>{const c=document.getElementById('sequence-canvas');const ctx=c.getContext('2d');return ctx.imageSmoothingEnabled && ctx.imageSmoothingQuality==='high'})()`));
    check("Visible text colour sufficient", await evaluate(`(()=>{const lum=c=>{const v=c.match(/\\d+/g).slice(0,3).map(n=>{n=n/255;return n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};const s=getComputedStyle(document.body);const a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>4.5})()`));

    /* --- reduced motion --- */
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await send("Page.reload", { ignoreCache: true });
    await sleep(1600);
    check("Reduced motion keeps revealed content visible", await evaluate(`(()=>{const el=document.querySelector('[data-reveal]');return !!el && getComputedStyle(el).opacity==='1'})()`));
    check("Reduced motion disables orbit animation", await evaluate(`(()=>{const el=document.querySelector('.orbit-core i');return !!el && parseFloat(getComputedStyle(el).animationDuration)<0.01})()`));
    check("Reduced motion disables custom cursor", await evaluate(`getComputedStyle(document.querySelector('.cursor-layer')).display==='none'`));
    check("Reduced motion hides loader", await evaluate(`getComputedStyle(document.getElementById('loader')).display==='none'`));
    check("Reduced motion keeps portrait visible", await evaluate(`(()=>{const el=document.querySelector('.portrait-character');return !!el && getComputedStyle(el).opacity==='1'})()`));
    check("Reduced motion disables skill physics", await evaluate(`window.__portfolioDebug.getSkills().interactive===false`));
    check("Reduced motion simplifies certification cards", await evaluate(`(()=>{const d=window.__portfolioDebug.getCertifications(),c=document.querySelector('[data-cert-card]');return d.stacked===false && getComputedStyle(c).transform==='none' && getComputedStyle(document.getElementById('cert-stack')).display==='grid'})()`));
    check("Reduced motion exposes both education faces", await evaluate(`(()=>{const c=document.querySelector('[data-flip-card]');return !c.querySelector('.edu-face-front').hasAttribute('aria-hidden') && !c.querySelector('.edu-face-back').hasAttribute('aria-hidden') && getComputedStyle(c.querySelector('.edu-card-inner')).transform==='none'})()`));
    check("Reduced motion hides experience ambient layer", await evaluate(`getComputedStyle(document.getElementById('experience-ambient')).display==='none'`));
    check("Reduced motion hides about ambient layer", await evaluate(`getComputedStyle(document.getElementById('about-ambient')).display==='none'`));
    check("Reduced motion freezes section atmospheres", await evaluate(`(()=>{const s=getComputedStyle(document.getElementById('about'),'::before');return s.animationName==='none' || parseFloat(s.animationDuration)<0.01})()`));
    check("Reduced motion keeps local visuals visible", await evaluate(`(()=>{const imgs=[...document.querySelectorAll('.edu-photo, .cert-visual img')];return imgs.length===6 && imgs.every(i=>i.complete && i.naturalWidth>0)})()`));
    check("Reduced motion disables contact animations", await evaluate(`(()=>{const s=document.getElementById('contact-success');s.hidden=false;const icon=getComputedStyle(s.querySelector('.success-icon')),check=getComputedStyle(s.querySelector('.success-icon .icon'));s.hidden=true;return icon.animationName==='none' && check.animationName==='none' && getComputedStyle(document.querySelector('.contact-panel'),'::before').animationName==='none' && getComputedStyle(document.querySelector('.contact-copy .portrait-orbit')).animationName==='none'})()`));
    check("Reduced motion keeps enhanced sections reachable", await evaluate(`['skills','experience','education','certifications'].every(id=>document.getElementById(id) && document.getElementById(id).getBoundingClientRect().height>100) && document.documentElement.scrollWidth<=window.innerWidth+1`));

    /* --- errors --- */
    check("No JS exceptions", exceptions.length === 0, exceptions.join(" | "));
    check("No console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
    if (logErrors.length) console.log("NOTE  Browser network log entries (the one ERR_FAILED is the intentionally blocked retry test): " + logErrors.slice(0, 3).join(" | "));
  } finally {
    if (chrome) chrome.kill();
    if (server) server.kill();
    if (configServer) configServer.kill();
    if (sheetsServer) sheetsServer.kill();
    if (invalidSheetsServer) invalidSheetsServer.kill();
    if (mailWebhook) mailWebhook.close();
    if (googleAuthServer) googleAuthServer.close();
    if (googleSheetsServer) googleSheetsServer.close();
    fs.rmSync(testDataDir, { recursive: true, force: true });
    if (configDataDir) fs.rmSync(configDataDir, { recursive: true, force: true });
    if (sheetsDataDir) fs.rmSync(sheetsDataDir, { recursive: true, force: true });
  }
}

main().then(() => {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
}).catch((e) => { console.error(e); process.exit(1); });
