# Binesa Sajan Joseph — Portfolio

An interactive two-theme personal portfolio with a cinematic animated hero, skills, education, experience, certifications and projects. The contact form uses a dependency-free Node.js backend with Google Sheets cloud storage, Gmail SMTP notifications and an authenticated DOCX export.

## Features

- 238-frame cinematic Hero sequence with reduced-motion fallback
- Light and dark themes with persisted preference
- Interactive skills, education flip cards, experience and certification stack
- Project filters, modals and verified GitHub links
- Custom cursor and section atmospheres
- Contact form with client and server validation, honeypot and rate limiting
- Google Sheets append-only message storage (no Persistent Disk required)
- Gmail SMTP notifications via Google App Password
- `CONTACT_ADMIN_TOKEN`-protected DOCX message export
- 254-check automated smoke test suite

## Requirements

- Node.js 18 or newer
- A private Google Sheet and a Google service account with the Sheets API enabled
- Optional: Gmail account with 2-Step Verification and an App Password for notifications

No npm dependencies are required.

## Local development

1. Copy the template:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Fill in the placeholders in `.env`. Never commit this file.
3. Share your Google Sheet with the service-account email as **Editor**, and set the Spreadsheet ID and private key in `.env`.
4. Start the site:
   ```powershell
   npm start
   ```
5. Open `http://localhost:3000`.

For offline development only, set `CONTACT_STORAGE=local` to use `data/messages.json` instead of Google Sheets. Production and Render should always use the default `sheets` driver.

## Environment variables

See `.env.example` for the full template. The backend reads:

| Variable | Purpose |
| --- | --- |
| `CONTACT_STORAGE` | `sheets` (default) or `local` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Private Google Sheet ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account `client_email` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service account PEM key; literal `\n` is accepted |
| `GOOGLE_SHEETS_SHEET_NAME` | Tab name, default `Sheet1` |
| `CONTACT_EMAIL_TO` / `CONTACT_EMAIL_FROM` | Notification recipient and sender |
| `CONTACT_SMTP_HOST` / `CONTACT_SMTP_PORT` / `CONTACT_SMTP_SECURE` | SMTP transport |
| `CONTACT_SMTP_USER` / `CONTACT_SMTP_PASS` | SMTP credentials; use an App Password |
| `CONTACT_ADMIN_TOKEN` | Bearer token for the DOCX export |

Service-account credentials must stay on the server. They are never sent to the browser.

## Automated tests

```powershell
npm test
```

The suite launches its own server and headless Chrome/Edge, verifies all sections, themes, responsiveness, reduced motion, contact validation, storage success/failure paths, secret hygiene and DOCX export. Screenshots are written to `tests/screenshots/` but are not committed.

## Render deployment

1. Create a **Web Service** from this repository.
2. Runtime: **Node**.
3. Build Command: `npm install` (there are no dependencies, but this is safe).
4. Start Command: `npm start`.
5. Add the environment variables from `.env.example` in the Render dashboard.
6. Do **not** attach a Persistent Disk. Google Sheets is the message store.
7. Leave `CONTACT_EMAIL_WEBHOOK` unset to use Gmail SMTP.

The server reads `process.env.PORT` and binds to `0.0.0.0`, so it works with Render's assigned port.

## Security notes

- `.env`, service-account JSON keys, private keys, contact message data, DOCX exports, logs, temporary files and backup folders are ignored by Git.
- The static server blocks dotfiles and the private `data/` directory.
- Never commit credentials or generated message data. Share the Google Sheet only with your account and the service account.

## Repository layout

- `index.html`, `style.css`, `script.js`, `data.js`, `sequence.js` — frontend
- `frames/`, `assets/` — animation frames and local images
- `server.js` — static server and contact backend
- `tests/smoke.js` — automated browser/API suite
- `PROJECT_PROGRESS.md` — detailed development and verification history
