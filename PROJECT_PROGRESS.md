# PROJECT PROGRESS — Binesa Sajan Joseph Portfolio

## PHASE 0 — INSPECT AND PREPARE ✅ COMPLETE
- Inspected all project files: vanilla HTML/CSS/JS, custom Node static server, zero dependencies.
- Identified the existing Hero/canvas scroll animation and preserved its engine.
- Verified the frame sequence: `ezgif-frame-001.jpg` … `ezgif-frame-238.jpg` = **238 files**, matching the declared `TOTAL_FRAMES = 238`. No missing frames; ~3.8 MB total.
- No resume, email, LinkedIn or GitHub URL exists anywhere in the workspace or Desktop. Nothing invented.
- Original files backed up to `backup/`.
- Created this progress file.

## PHASE 1 — FOUNDATION ✅ COMPLETE
- Added `data.js` as the single editable source for profile links, skills and project content.
- Built a token-based dual-theme system in `style.css` (dark = cyber/glass/HUD, light = editorial/minimal).
- Theme is set by an inline script **before** the stylesheet loads (no flash), respects system preference on first visit, persists in `localStorage`, and syncs across tabs.
- Added reusable components: buttons, chips, cards, section headings, focus states, semantic landmarks.

## PHASE 2 — HERO AND GLOBAL INTERACTIONS ✅ COMPLETE
- Preserved the original Hero copy direction and upgraded it with three-line headline, intro, dual CTAs, focus chips, social row and scroll indicator.
- Added an animated identity centerpiece (orbits, core orb, HUD terminal, corner brackets, mouse-following glow).
- Integrated the original frame engine into a dedicated 300vh cinematic section (`sequence.js`) with progressive loading, nearest-loaded fallback, DPR-aware canvas, scroll-linked captions and a frame meter.
- Responsive navigation with monogram, section links, active indicator, scroll-aware styling and mobile menu.
- Scroll progress bar and a keyboard-accessible command palette (Ctrl/Cmd+K, arrows, Enter, Escape, click, focus trap).

## PHASE 3 — CORE PORTFOLIO SECTIONS ✅ COMPLETE
- About: editorial intro, facts and four-card identity map.
- Skills: 21 real skills in 4 groups, tabs/filter, selectable chips with contextual detail; no invented proficiency levels.
- Projects: all 6 real projects with CSS-generated previews, category filters, tech chips and full detail modals (overview, problem, features, tech, implementation, limitations).
- Experience: Unified Mentor timeline with the four resume-reported responsibilities and the 70% / 20% metrics clearly labelled as resume-reported.
- Education: CHRIST BCA, 2024–2027.
- Certifications: all 4 listed with issuers and dates; no unverified links.

## PHASE 4 — ADVANCED DESIGN ✅ COMPLETE
- Scroll reveals with stagger, hover/interaction feedback, animated grid/particles/orbits, scanlines, gradients and theme-specific visual language.
- Contact section with validated UI preview form (explicitly states that no backend is connected) and final CTA; footer with back-to-top. *(The preview form was later replaced by the real submission backend documented in the Contact section below.)*
- Reduced-motion, touch-friendly and keyboard-accessible behavior throughout.
- No external JS libraries or runtime dependencies.

## PHASE 5 — POLISH AND TEST ✅ COMPLETE
- `npm test` runs a headless Chrome smoke suite (`tests/smoke.js`) that starts its own server, exercises the site and writes screenshots to `tests/screenshots/`.
- **Final result: 38/38 checks passed** — structure, six project cards, 21 skills, theme toggle + persistence, Ctrl+K palette and filtering, project filters, modal open/Escape, skills filter, active nav, scroll progress, reveals, responsive overflow (desktop + 390px mobile), mobile menu, canvas sequence progress, DPR scaling, accessible names, contrast, zero JS exceptions and zero console errors.
- All local paths and all 238 frame paths verified present.
- Fixed during testing: dynamically rendered skill/project cards were not registered with the reveal observer and would have stayed invisible; observer setup now runs after rendering, with regression checks added.

## HERO REDESIGN — CINEMATIC SEQUENCE AS CENTERPIECE ✅ COMPLETE
- Measured the source frames: **all 238 are 1280×720 JPEGs**. The source is 720p, so no canvas change can add detail beyond that; the earlier softness came from upscaling/canvas mismatch and full-viewport cover scaling.
- Replaced the BSJ orbital centerpiece with the 238-frame canvas as a large, edge-aligned visual on the right of a split Hero; text remains on the left with a clear veil and no awkward overlap. Removed the separate `#sequence` section and all unused orbital CSS/keyframes.
- Hero is now a 215vh sticky composition (230vh on tablet), so scrolling the Hero drives the same damped 238-frame progression. Scroll hint scrolls through the sequence.
- Canvas engine (`sequence.js`) rewritten for quality and memory: backing store = **canvas CSS box × DPR (capped at 2)**, resized via window resize + `ResizeObserver` + DPR-change detection; current frame redrawn after resize; `imageSmoothingQuality = "high"`; cover scaling from full 1280×720 source with aspect ratio preserved; no destination stretching.
- Replaced "preload all 238 decoded images" with a bounded `ImageBitmap` LRU cache (20 frames) + rolling prefetch window (2 behind, 3 ahead), duplicate-request guard, `close()` on eviction, and an `Image` fallback for `file://` / older browsers. No duplicate image assets.
- Theme adaptation: dark uses neon glow and a soft veil; light uses a lighter veil and reduced aura so the sequence does not read as a pasted dark block.
- Mobile layout compacts the copy, uses a 2:1 canvas box and full DPR rendering; no horizontal overflow and all hero elements fit the viewport.
- Updated `tests/smoke.js`: **54/54 checks pass**, including desktop/tablet/mobile canvas backing resolution vs CSS×DPR, aspect ratio preservation, frame count 238, bounded cache, drawn frame matching scroll position, zero frame failures, high-quality smoothing, old orbital removal, and content fitting at all three viewports.

## VISUAL REFINEMENT — THEMES + PROJECT SHOWCASE ✅ COMPLETE
- Backed up the pre-change `index.html`, `style.css`, `script.js` and `tests/smoke.js` to `backup-visual/` before editing.
- **Light theme:** replaced the plain neutral palette with centralized tokens for Cream White `#FFF8F0`, Warm/Light Peach, Espresso Brown `#3B2723`, Dusty Rose `#C98F91` and warm neutrals. Hero now uses a layered peach gradient with soft radial texture and rose/espresso glows; the cinematic canvas keeps its light veil and gains a warm frame treatment. Espresso buttons with cream text, readable rose ink for small text, white/light-peach cards, warm borders/shadows and section gradients were applied across navigation, skills, projects, modal, experience, education, certifications, contact, footer, palette and filters.
- **Dark theme:** refined the token system to Jet Black `#08080B`, Royal Amethyst `#8B5CF6` (primary) and Electric Cyan `#22D3EE` (secondary/HUD), with subtle glass, grid and glow treatments. No rainbow colours or excessive neon; Hero canvas and HUD untouched functionally.
- **Project showcase:** kept the accessible semantic card grid and all filters/modals, but restyled it as an orbital constellation: four decorative orbit rings + a labelled core sit behind six cards that use gentle staggered vertical offsets and lift together on hover/focus. Tablet/mobile flatten the offsets and hide the decorative field, so no card is shrunk or hard to read.
- **Artwork:** removed all six initial-placeholder graphics. Each project now has a distinct original inline SVG diagram related to its actual subject: NLP word/threat node graph, IDS radar + log stream, PersonaPulse tone/chat map, Sports Buddy match/court map, resume browser/document UI, and memory-card grid. The modal hero reuses the same artwork instead of initials. No external image hotlinks, no invented screenshots, no new dependencies.
- **Transitions/accessibility:** theme changes remain instant-persistent with system detection and no initial flash; colours/backgrounds/borders/shadows transition in 0.35s; reduced-motion disables the orbit animation and reveals remain visible. Keyboard focus and all existing interactions are preserved.
- **Testing:** `npm test` → **73/73 checks passed** (19 new checks: unique artwork, inline SVG, no initials, orbit field/offsets, light and dark palette tokens, theme meta-colour sync, light peach hero gradient, espresso buttons, contrast in both themes, theme transitions, modal artwork, tablet/mobile flattening, mobile artwork visibility and reduced-motion behaviour). All 54 original checks still pass unchanged, including the 238-frame Hero sequence, filters, modals, palette, navigation and zero console/JS errors. Screenshots regenerated in `tests/screenshots/`.
- Note: the supplied screenshots could not be visually inspected by this model (no image input). Visual verification was done through computed styles, layout geometry and the headless browser suite rather than subjective image review.

## FULL UPGRADE — GITHUB, 3D, LOADER, CHARACTER, CURSOR, CONTACT ✅ COMPLETE
- Backed up the live `index.html`, `style.css`, `script.js`, `data.js`, `tests/smoke.js` and `PROJECT_PROGRESS.md` to `backup-upgrade-20261119/` before editing. Earlier `backup/`, `backup-hero/` and `backup-visual/` folders were left untouched.
- **Project alignment:** replaced the staggered orbital card layout with a deliberate three-column aligned constellation. Cards share equal row heights, fixed artwork dimensions, aligned category/title/tech/button rows and no pairwise overlap. The four orbit rings and labelled core remain strictly behind the opaque cards (`z-index` and `pointer-events: none`) and fade out on tablet/mobile. Hover/keyboard focus selects a project and updates the central focus label; filters stay clearly above the visual stage.
- **GitHub integration:** inspected all pages of `https://api.github.com/users/Binesa1110/repos` (7 public repositories, 1 empty). `data.js` now stores a verified local snapshot and six curated, substantive projects with exact repository URLs and details grounded in repository metadata, README files and source files. The Projects section includes a "More on GitHub" catalog with all 7 public repositories, refresh control, 24-hour local cache, graceful API failure fallback, pagination support, missing-data handling and clear empty/fork/archive labels. No token or external dependency was added; no automatic API request is made on page load.
- **Removed:** "Interactive Online Resume" from project data, artwork, modal data, filters and all project references. The separate hidden resume-download control remains untouched because no resume file exists. The previously unverified PersonaPulse and Memory Card Game showcase entries were also removed from the primary catalog because they have no public repository evidence.
- **Links:** centralized `https://github.com/Binesa1110` and the supplied LinkedIn URL in `PORTFOLIO`, with safe `target="_blank" rel="noopener noreferrer"` links rendered in Hero, Contact and Footer, plus command-palette shortcuts. The GitHub profile and repository URLs were verified from the GitHub API; LinkedIn was supplied by the owner and inserted exactly (LinkedIn blocks automated GET with HTTP 999, so no third-party content was invented). No homepage/demo URL is published by the repositories, so none is displayed.
- **3D:** restrained CSS 3D only on project artwork, contact panel and portrait: perspective-based pointer tilt, depth-preserving layers and magnetic buttons on fine-pointer desktops. Touch layouts and reduced-motion force flat transforms. No Three.js, WebGL or animation library was introduced.
- **Loader:** functional dark loader using Jet Black/Amethyst/Cyan, real first-frame and `window.load` signals, a 1.4s timeout guard, no artificial multi-second delay, and no display at all when the page is already ready. It never blocks interaction and is hidden for reduced-motion users.
- **Character:** image generation was unavailable (invalid image credential), so instead of a generic avatar the character uses an actual frame from the owner's 238-frame cinematic sequence (`frames/ezgif-frame-120.jpg`). It is a small supporting portrait with duotone treatment, scan-line hover, subtle cursor look and a CSS gradient fallback. No frame assets were duplicated.
- **Cursor:** contextual dot/ring cursor with amethyst/cyan in dark and espresso/rose in light, enabled only for fine pointers and non-reduced motion. Native cursor remains visible, controls stay clickable, text remains selectable and touch layouts disable the layer entirely.
- **Contact:** added a 3D-inspired panel, constellation decoration, proper LinkedIn/GitHub actions, an honest "no published email" note, accessible invalid states and validation messages that explicitly say nothing was sent.
- **Themes:** every new component uses the existing dark and light token systems. No third theme was created; the 238-frame Hero engine in `sequence.js` was not modified.
- **Testing:** `npm test` → **117/117 checks passed** (73 original checks + 44 new checks; the external-link allowlist was tightened to the exact verified domains and no assertion was removed or weakened). New coverage includes all 238 frame files, card overlap/row/artwork/button alignment, decorative z-index, exact repository URLs and buttons, demo-link honesty, interactive-resume removal, archive/empty-repo rendering, LinkedIn placement, loader dismissal, 3D tilt, real portrait frame and interaction, cursor theme colours and touch/reduced-motion disabling, contact validation, keyboard project selection, GitHub pagination/missing-data/failure handling, and responsive layouts. All original Hero, palette, filter, modal, theme, navigation and zero-error checks still pass. Screenshots regenerated in `tests/screenshots/`.

## ADVANCED INTERACTIVE SECTIONS — SKILLS, EDUCATION, EXPERIENCE, CERTIFICATIONS ✅ COMPLETE
- **Backup:** before editing, created `backup-sections-20261119-171134/` containing `index.html`, `style.css`, `script.js`, `data.js`, `sequence.js`, `tests/smoke.js`, `PROJECT_PROGRESS.md`, `package.json`, `server.js` and the existing screenshots. Earlier `backup/`, `backup-hero/`, `backup-visual/` and `backup-upgrade-20261119/` folders were left untouched.
- **Files modified:** `index.html`, `style.css`, `script.js`, `tests/smoke.js` and this progress document. `data.js` and the 238-frame Hero engine in `sequence.js` were not changed.
- **Dependencies introduced:** none. The 3D environments use vanilla CSS transforms, `IntersectionObserver`, `ResizeObserver`, `requestAnimationFrame` and passive listeners. No Three.js, GSAP, WebGL, canvas particle engine or animation library was added.

### Sections enhanced
- **Skills → interactive technology universe:** heading is now exactly “MY TECH STACK” with subtitle “Technologies, tools and concepts I work with.” A floating perspective cluster renders all 21 existing `window.SKILLS` entries as soft-lit spheres with depth, rotation, float, spring-back, pointer repulsion and subtle pairwise repulsion. Pointer proximity strongly repels nearby spheres; clicking/tapping a sphere selects the matching accessible skill chip and updates the live detail text. Scroll progress gently descends and disperses the cluster toward Projects. Physics runs only while the section intersects the viewport, stops off-screen and is disabled for touch/reduced motion. No unsupported examples such as Java, React, Node.js, PostgreSQL, Git or GitHub were added to the sphere catalog because they are not in the verified skill data.
- **Education → 3D flip cards:** the single verified BCA record is now a perspective card with front/back faces. Front: CHRIST (Deemed to be University), Yeshwanthpur Campus, 2024–2027 and degree. Back: qualification, verified academic context and the three existing learning-area tags. Hover previews the back on fine pointers; click, tap, Enter/Space and Escape are handled through native buttons with `aria-expanded`, `aria-controls`, swapped `aria-hidden` and correct tab order. No institution image, marks, achievements or fabricated details were added.
- **Experience → immersive environment:** retained the single verified Full Stack Developer internship at Unified Mentor (April–May 2025) and the two resume-reported metrics. Added a low-density ambient layer with CSS grid, soft orbs, moving lines, eight particles and an SVG network with animated paths/nodes. Added a scroll-progress timeline rail/node, verified technology chips, a verified four-project outcome note, scroll reveals and restrained CSS 3D tilt on the cards. Ambient animation pauses when off-screen and is removed entirely for reduced motion. No work mode, employer, title or achievement was invented.
- **Certifications → cinematic stacked sequence:** the four existing certificates are now layered in 3D inside a sticky scroll track. Scroll progress scales, rotates, translates and fades cards while retaining the previous card partially behind the active one. Previous/next buttons, a live “Certificate X of 4” status, a progress rail, `aria-labelledby`, `role="list"`/`listitem`, a single active tab stop and focus-to-card navigation keep it keyboard/screen-reader friendly. No certificate image, credential ID, verification code or URL was fabricated; each card honestly states that no public verification link was supplied.
- **Section transitions:** Skills fades toward Projects while the cluster descends, Education uses a soft background transition into the Experience ambient field, and Experience fades into the certification stack with a shared motion language of restrained depth, soft gradients and short eased transforms.

### Verification
- **Testing:** baseline `npm test` → **117/117 checks passed** before edits; final `npm test` → **152/152 checks passed** (35 new checks added; no existing assertion was removed, skipped or weakened).
- New assertions cover exact Skills heading/subtitle, 21 verified sphere labels, pointer physics and sphere-tap selection, Education verified content/flip states/keyboard activation/Escape return, Experience ambient assets/verified-only content/timeline structure/scroll progression, certification content/no fabricated assets/accessibility/scroll progression/3D layering/status/navigation, plus tablet scaling, mobile compact layouts, mobile tap flipping, mobile certification fallback, 360px narrow-mobile overflow/reachability and reduced-motion reload behavior.
- Preserved checks still pass for all eight sections, 21 skill chips, OSINT filtering/detail, six project cards, project artworks/alignment/modals/filters, GitHub catalog and failure fallback, loader, command palette, contact validation, theme tokens/persistence/meta, Hero canvas progress/cache/DPR/quality, navigation, scroll progress, hover/touch cursor rules and zero JS/console errors.
- **Responsive verification:** browser assertions at 1440×900 (dark/light), 820×1180 tablet, 390×844 mobile and 360×780 narrow mobile confirm no horizontal overflow, reachable section content, compact skill cluster, single-column Experience at tablet/mobile, readable single-column certification sequence on mobile, and flattened 3D/cursor effects on touch layouts.
- **Accessibility verification:** native flip/navigation buttons with accessible names, ARIA-expanded/controls/current/live regions, semantic lists/headings, focused-card navigation, one active certificate tab stop, focus-visible outlines, reduced-motion reload checks and text-contrast checks all pass.
- **Screenshots:** `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png` and `modal.png` regenerated in `tests/screenshots/`. They were not visually inspected in this environment; validation used browser assertions, computed styles and geometry, as in the previous upgrade.

## REFINEMENT — CERTIFICATIONS, EDUCATION IMAGES & CONTINUOUS BACKGROUNDS ✅ COMPLETE
- **Backup:** before editing, created `backup-refine-20261119-175117/` containing `index.html`, `style.css`, `script.js`, `data.js`, `sequence.js`, `tests/smoke.js`, `PROJECT_PROGRESS.md`, `package.json`, `server.js`, the existing screenshots and the two supplied education images. Earlier `backup/`, `backup-hero/`, `backup-visual/`, `backup-upgrade-20261119/` and `backup-sections-20261119-171134/` folders were left untouched.
- **Files modified:** `index.html`, `style.css`, `script.js`, `server.js`, `tests/smoke.js` and this document. `data.js` and the 238-frame Hero engine in `sequence.js` remain byte-for-byte unchanged. Added four local topical images under `assets/certifications/`; the existing `byc-campus.webp` and `school.jpg` were referenced in place and were not renamed or duplicated.
- **Dependencies introduced:** none. No Three.js, GSAP, WebGL, canvas particle engine or animation library was added. `server.js` gained only a correct `image/webp` MIME type and cache rule so the supplied campus image loads reliably.

### Completed refinements
- **Certifications — clean opaque stack:** cards now use a solid `#101015` / `#fffdfa` background, full `opacity: 1`, an 880px-wide editorial grid, a 340px content panel, a right-hand topical image, stronger borders, a three-line accent rule, deeper controlled shadows and generous typography. The scroll track was reduced from 274vh to 196vh (180vh at tablet). Behind cards are limited to ±44px vertical offset, 0.865 minimum scale, ±90px depth and gentle 2.2°/1.2° rotation; a dark veil marks them as inactive without making the card itself transparent. The active card alone remains crisp, while previous/upcoming cards sit neatly behind it. Native prev/next buttons, live status, progress rail, keyboard focus and `aria-current` remain intact.
- **Certification imagery:** four freely licensed, topic-appropriate images were found through image search and saved locally: AI/neural networks for Build with AI Bootcamp, data-security imagery for Foundations of Cybersecurity, mobile privacy for the NPTEL privacy course, and generative artwork for the Infosys Springboard course. Every image is explicitly labelled as a **topic visual, not an official certificate**, with a visible source/licence caption. No certificate image, credential ID, verification code or URL was fabricated.
- **Education — two real image-led flip cards:** the existing `byc-campus.webp` and `school.jpg` are now displayed on the fronts of two consistent 3D flip cards with image-specific cropping, depth, overlay and hover zoom. CHRIST front shows the campus image, institution name, Yeshwanthpur Campus/Bengaluru and 2024–2027; its reverse keeps the verified BCA qualification and learning areas. The new school card shows St. Joseph Convent School, Jabalpur, Madhya Pradesh, Mathematics and Science. No dates, grades, boards, marks, crests or achievements were invented. Mouse hover preview, click, tap, Enter/Space, Escape, `aria-expanded`, `aria-controls`, `aria-hidden` and tab-order management work for both cards.
- **Experience adopts the reference atmosphere:** the About section had no bespoke background in the original implementation, so its existing body-gradient language was made explicit and paired with a lightweight ambient layer of orbs, particles, network paths and a drifting line. Experience uses the same reusable `.ambient-layer` system and shared tokens, with its own scroll-progress timeline, tilt and content untouched. Both layers pause when off-screen and disappear under reduced motion.
- **Continuous section backgrounds:** About, Skills, Projects, Experience, Education, Certifications and Contact now each have a distinct `data-atmosphere` variant built from the same gradient, grid, ambient-glow and soft-motion system. A top/bottom fade ties adjacent sections together, so there are no harsh colour breaks. The dark theme stays Jet Black + Royal Amethyst + Electric Cyan; the light theme keeps its warm cream/peach/rose editorial identity. All atmosphere animations are visibility-aware and freeze off-screen.
- **Responsive behaviour:** desktop card widths, tablet single-column education, mobile no-sticky certification sequence, 390px and 360px overflow checks, image loading and non-overlap were verified in the browser. Touch and reduced-motion layouts flatten 3D transforms and use the readable stacked/sequential alternatives.

### Asset sources
- `byc-campus.webp` and `school.jpg`: supplied local assets, used as-is.
- `assets/certifications/cert-ai.jpg`: *Artificial Neural Network with Chip*, mikemacmarketing, CC BY 2.0, Wikimedia Commons.
- `assets/certifications/cert-cybersecurity.jpg`: *Data Security Breach*, Blogtrepreneur, CC BY 2.0, Wikimedia Commons.
- `assets/certifications/cert-privacy.jpg`: *Privacy of Mobile Devices*, Stefan Nürnberger, CC BY-SA 4.0, Wikimedia Commons.
- `assets/certifications/cert-generative.jpg`: *Ai generated Art*, Ai Fashion Model, CC0, Wikimedia Commons.
- Source/licence details are also shown in each card's visible caption.

### Verification
- **Testing:** baseline `npm test` → **152/152 checks passed** before edits; final `npm test` → **172/172 checks passed** after edits. No assertion was deleted, skipped or weakened; the old “no image assets” certificate assertion was replaced with a stricter check that requires four local topical visuals with honest alt text and visible credits, still forbidding links and fabricated IDs.
- New assertions cover local asset existence, both education images and verified school/CHRIST details, second-card flip state, About/Experience shared ambience, seven section atmospheres, gradient layering, off-screen pause behaviour, opaque certification backgrounds, controlled stack offsets/scales/veils, shorter track, loaded topical images, desktop/tablet card width, mobile non-overlap and reduced-motion image/ambient behaviour.
- Previously passing checks still cover the Hero 238-frame sequence, all eight sections, projects/filters/modals, GitHub integration, themes, command palette, navigation, skills physics, contact validation, custom cursor, accessibility, error-free execution and horizontal overflow.
- **Responsive verification:** 1440×900 dark/light, 820×1180 tablet, 390×844 mobile and 360×780 narrow mobile all pass with no horizontal overflow. `node --check` passes for `script.js`, `server.js` and `tests/smoke.js`.
- **Screenshots:** `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png` and `modal.png` regenerated in `tests/screenshots/`. They could not be visually inspected in this environment; verification used browser assertions, computed styles and layout geometry.

## CONTACT — REAL SUBMISSION BACKEND, EMAIL NOTIFICATION & ADMIN DOCX EXPORT ✅ COMPLETE
- **Backup:** before editing, created `backup-contact-20261119-181317/` containing `index.html`, `style.css`, `script.js`, `server.js`, `tests/smoke.js` and `PROJECT_PROGRESS.md`. All earlier backup folders were left untouched.
- **Files modified:** `index.html`, `style.css`, `script.js`, `server.js`, `tests/smoke.js` and this document. `data.js`, the 238-frame Hero engine in `sequence.js`, and every other section were left unchanged. No framework and no runtime dependencies were introduced — the backend uses only Node's standard library (`http`, `https`, `net`, `tls`, `fs`, `path`, `crypto`, `zlib`, `os`).
- **Visibility note:** as before, screenshots could not be visually inspected in this environment. Visual work was verified through browser-computed styles, element geometry and the headless suite rather than subjective image review.

### Contact section redesign
- Balanced two-column grid on desktop (`1.05fr / .95fr`), stacking to one column at ≤900px. Smaller Contact headline than the Projects headline, concise professional intro, and the two verified links (LinkedIn `…/binesa-sajan-joseph-a5a551339`, GitHub `https://github.com/Binesa1110`) rendered exactly as before.
- Portrait resized to a controlled 5:4 frame (≈190px wide) with a stronger border, deeper shadow and a caption that no longer wraps; the large decorative circle/constellation behind the form was removed. Decorative atmosphere layers are non-interactive (`pointer-events: none`) and sit behind every control, so text and inputs are never overlapped.
- Cleaner field hierarchy: uppercase mono labels, hover/focus-visible states, inline error slots, a live `0 / 5000` message counter, and explicit `cursor: text`/`pointer` rules. The custom cursor layer is `pointer-events: none` and disabled on touch/reduced-motion, so it cannot block typing or clicking.

### Functional form and confirmation
- Four required fields (Name, Email, Subject, Message) with client-side validation for empty values, email format, 10-character minimum and field maxima (100/254/200/5000). Errors are injected into associated `aria-describedby` elements with `aria-live="polite"`, set `aria-invalid`, and focus the first invalid field.
- Real `POST /api/contact` request with a JSON body. A `contactSubmitting` guard plus a disabled button and `aria-busy="true"` prevent duplicate submissions. A visible spinner plays while sending; on failure the note explains what happened and a **Try again** button is offered (no fake success).
- Confirmation is shown **only** after a server `2xx` response with `ok: true`. It replaces the form in place with a check-mark animation and the exact required text: *"Thank you for reaching out! Your message has been received successfully. I'll get back to you as soon as possible."* It is an `aria-live="polite"` status region, is focused and scrolled into view with reduced-motion respected, and **Send another message** resets everything. No page reload occurs.

### Backend (`server.js`)
- `POST /api/contact`: strict JSON body parsing with a 64 KB size cap, server-side re-validation of every field (authoritative, independent of the client), control-character stripping and whitespace/length normalization. Records are stored with an id, ISO submission timestamp, all fields, `status` and `emailStatus`.
- **Persistence:** JSON Lines-style array in a private store (`data/messages.json` by default, relocatable with `CONTACT_DATA_DIR`), written atomically via a temp file + rename with `0600` mode and a serialized write queue, so new submissions append without losing existing ones. The store, dotfiles and all `/api/*` paths are never served as static files; static paths are confined to the project directory with a boundary check that also prevents sibling-prefix bypasses.
- **Spam protection:** hidden honeypot field (`website`) is silently accepted with `202 { spam: true, stored: false }` — never stored and never notified. In-memory per-IP rate limiting (`CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW_MS`, optional `CONTACT_TRUST_PROXY` for `X-Forwarded-For`) returns `429` with `Retry-After`.
- **Email notification:** env-configured only — nothing hardcoded. The message is **stored before** notification; if delivery fails the record is preserved with `emailStatus: "failed"` and the API still reports honest status (never claims an email was sent when it was not). If no recipient/transport is configured the status is `"skipped"`. Two dependency-free transports are supported: an HTTP(S) webhook (e.g. a mail relay) or direct SMTP with optional STARTTLS/implicit TLS and `AUTH PLAIN`.

### Admin DOCX export
- `GET /api/admin/messages.docx` is authenticated and never exposed publicly. Configure either `CONTACT_ADMIN_TOKEN` (send `Authorization: Bearer <token>`) or `CONTACT_ADMIN_USER` + `CONTACT_ADMIN_PASSWORD` (HTTP Basic). Credentials are compared in constant time with `crypto.timingSafeEqual`. If no admin credentials are configured the endpoint returns `503`; wrong or missing credentials return `401`.
- The exported OOXML `.docx` (a real ZIP built with `zlib`) is titled **"Portfolio Contact Messages"** and contains, for every stored record: submission date/time, name, email, subject, full message, email status and record status. It is delivered as an attachment with `Cache-Control: no-store`. No admin credential is present in frontend code or markup.

### Environment variables
| Variable | Purpose |
| --- | --- |
| `CONTACT_EMAIL_TO` | Notification recipient (enables email when set) |
| `CONTACT_EMAIL_FROM` | Sender address (defaults to `CONTACT_EMAIL_TO`) |
| `CONTACT_EMAIL_WEBHOOK` | HTTP(S) mail-relay endpoint (preferred transport) |
| `CONTACT_EMAIL_WEBHOOK_TOKEN` | Optional `Bearer` token for the webhook |
| `CONTACT_SMTP_HOST` / `CONTACT_SMTP_PORT` / `CONTACT_SMTP_SECURE` | Direct SMTP host, port and TLS mode |
| `CONTACT_SMTP_USER` / `CONTACT_SMTP_PASS` | Optional SMTP credentials |
| `CONTACT_ADMIN_TOKEN` | Bearer token for the DOCX export |
| `CONTACT_ADMIN_USER` / `CONTACT_ADMIN_PASSWORD` | Basic-auth alternative for the DOCX export |
| `CONTACT_DATA_DIR` | Private message-store directory (default `./data`) |
| `CONTACT_RATE_LIMIT_MAX` / `CONTACT_RATE_LIMIT_WINDOW_MS` | Rate-limit threshold and window |
| `CONTACT_TRUST_PROXY` | Trust `X-Forwarded-For` when behind a reverse proxy |
| `PORT` | Server port (default 3000) |

Example (PowerShell): `$env:CONTACT_EMAIL_TO='me@example.com'; $env:CONTACT_EMAIL_WEBHOOK='https://relay.example.com/send'; $env:CONTACT_ADMIN_TOKEN='a-long-random-secret'; npm start`

### Verification
- **Testing:** baseline `npm test` → **172/172 checks passed** before edits; final `npm test` → **213/213 checks passed** after edits. No assertion was deleted, skipped or weakened; the three obsolete "preview" assertions were replaced with stronger functional ones. `node --check` passes for `server.js`, `script.js` and `tests/smoke.js`.
- The test suite starts the real server with an isolated temp data directory, a local mail webhook and a test admin token. New checks cover: empty/invalid fields, invalid email, short and overlong messages, honeypot, rate limiting (including `Retry-After`), successful browser submission and sending state, server-only confirmation, accessible errors and screen-reader announcement, keyboard focus/Tab order, retry and reset, backend validation and sanitization, persistence and append-without-loss, private-store access denial, email success **and** failure statuses, DOCX authentication (missing/invalid/valid), DOCX ZIP parts and required fields with escaped special characters, no credentials in frontend code, and no remaining preview wording. Tablet/mobile/narrow-mobile, reduced-motion and no-overflow checks were extended to Contact.
- **Screenshots:** `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png` and `modal.png` regenerated in `tests/screenshots/`.

## CONTACT REFINEMENT — EDITORIAL LAYOUT, SUBMISSION STATES & VERIFIED TESTING ✅ COMPLETE
- **Backup:** before editing, created `backup-contact-refine-20261119-184019/` containing `index.html`, `style.css`, `script.js`, `server.js`, `tests/smoke.js` and `PROJECT_PROGRESS.md`. Earlier backup folders, including `backup-contact-20261119-181317/`, were left untouched.
- **Files modified:** `index.html`, `style.css`, `script.js`, `server.js`, `tests/smoke.js` and this document. `data.js`, the 238-frame Hero engine in `sequence.js` and all other sections were not changed. No dependencies, framework, Three.js or GSAP were added.
- **Baseline:** `npm test` → **213/213 checks passed** before edits (verified from the previous phase and this run's starting state).

### Visual and layout changes
- Replaced the oversized two-line heading with the compact editorial headline **"Let's build something meaningful."** and a shorter professional invitation. Added an explicit, static availability line — "Open to internships, projects & collaborations" — with a non-animated accent dot so it cannot be mistaken for a live status.
- Reduced section padding, headline scale, field padding, textarea height and field gaps; the form is now compact without losing readability.
- Left column now integrates a smaller ~206px portrait (5:4) with a subtle glowing orbital border, a slow 60s orbit animation and restrained depth, all behind the caption and non-interactive. The previous "ONLINE" caption was replaced with the honest "ARCHIVE FRAME" label.
- Right column is a readable glass panel: translucent gradient surface with `backdrop-filter: blur(16px)`, a very slow animated accent hairline and strong shadow. All text and controls sit above decorative layers. Social links gained a gentle accent hover, and buttons have press feedback.
- The existing `data-atmosphere` system is untouched: Contact keeps its own gradient/grid/glow variation behind the content, with the same top/bottom fade and visibility-aware pausing. No competing background layer was added.
- Light theme uses the cream/peach/espresso glass variant; dark theme uses the jet/amethyst/cyan variant. Both themes were asserted in the browser.

### Functional changes
- Labels are now Full Name / Email / Subject / Message; validation, ARIA descriptions and live error slots remain intact.
- During sending the button text changes to **"Sending..."**, a spinner appears, and repeated submissions are blocked with `aria-busy="true"` and a disabled button.
- On server-confirmed success the form is cleared **at that point only**, a subtle check animation plays, and the confirmation reads exactly: **"Your message has been received! I'll get back to you as soon as possible."** The confirmation stays visible with a "Send another message" control, is an `aria-live` region and is focused/scrolled into view with reduced-motion respected.
- Delivery is honest: when the backend reports `emailStatus: "failed"` or `"skipped"`, the confirmation includes a smaller factual note and never claims an email was sent. On a request failure the entered data is preserved, a clear error is shown and "Try again" re-sends the same values.
- `server.js` now always blocks the reserved `/data` path (as well as the configured `CONTACT_DATA_DIR`) even when the active store is relocated, so a legacy store can never be served publicly. A pre-existing `data/messages.json` from earlier manual testing was preserved, not deleted.

### Verification
- **Testing:** baseline **213/213** → final **231/231 checks passed** (18 new checks; no assertion deleted, skipped or weakened). `node --check` passes for `server.js`, `script.js` and `tests/smoke.js`.
- New checks cover the compact heading, honest availability indicator, orbital portrait, glass panel and accent hairline, associated labels and safe social links, "Sending..." state, form-clearing only after confirmation, exact new confirmation text, simulated delivery failure (CDP request block) with data preservation and honest error, successful retry, dark/light contact styling, tablet/mobile/narrow-mobile portrait and field geometry, and reduced-motion handling of the new animations.
- A stale `node server.js` holding port 3000 from an earlier `npm start` was stopped before the final run so the suite talked to its own isolated server. The suite's single `ERR_FAILED` browser log note is the intentionally blocked failure-test request; there are zero JS exceptions and zero console errors.
- **Screenshots:** `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png` and `modal.png` regenerated. As before, they could not be visually inspected in this environment; verification used computed styles, geometry and browser assertions.

## GMAIL SMTP CONFIGURATION — LOCAL .env SETUP ✅ COMPLETE
- **Backup:** before editing, created `backup-gmail-smtp-20261119-190112/` containing `server.js`, `tests/smoke.js` and `PROJECT_PROGRESS.md`. All earlier backup folders were left untouched.
- **Files modified/added:** `server.js`, `tests/smoke.js`, `PROJECT_PROGRESS.md`, plus new `.env.example` and `.gitignore`. No portfolio feature, `sequence.js`, `data.js` or frontend file was changed, and no dependency was added.
- **Approach:** there was no `node_modules` directory, no installed `dotenv` package and no `package.json` dependency, so `server.js` now loads a local `.env` with a tiny built-in parser using only `fs` and `path`. Real process environment variables always take precedence, which keeps deployment/test overrides working. Malformed lines and file-read problems are ignored or reported generically; file contents are never logged.

### Where to enter your Google App Password
1. In your Google Account, enable **2-Step Verification**, then generate a **16-character App Password** for this app (your normal Gmail password will not work).
2. Copy the template locally: `Copy-Item .env.example .env` (PowerShell) or `cp .env.example .env` (macOS/Linux).
3. Open the local `.env` file and replace only these two placeholders:
   - `CONTACT_SMTP_PASS=PASTE_GOOGLE_APP_PASSWORD_HERE`
   - `CONTACT_ADMIN_TOKEN=REPLACE_WITH_A_LONG_RANDOM_TOKEN`
4. Start the site with `npm start`. The server reads `.env` once at startup; restart it after editing the file.
5. The admin DOCX export is then available at `GET /api/admin/messages.docx` using `Authorization: Bearer <your CONTACT_ADMIN_TOKEN>`.

The template already contains the requested non-secret Gmail settings:
`CONTACT_EMAIL_TO=binesa1110@gmail.com`, `CONTACT_EMAIL_FROM=binesa1110@gmail.com`,
`CONTACT_SMTP_HOST=smtp.gmail.com`, `CONTACT_SMTP_PORT=465`, `CONTACT_SMTP_SECURE=true` and
`CONTACT_SMTP_USER=binesa1110@gmail.com`.

### Secret handling and validation
- `.gitignore` ignores `.env` and all `.env.*` variants except `.env.example`. The static server also blocks every dotfile segment, so `.env` and `.env.example` both return `404` over HTTP.
- No SMTP password, webhook token or admin token is written to frontend JavaScript, HTML, API responses, browser console output or server logs. The webhook token is only sent as an `Authorization` header to the configured webhook endpoint.
- If `CONTACT_EMAIL_WEBHOOK` is set it still takes precedence over SMTP, preserving the existing webhook path. Leave it unset to use Gmail SMTP.
- `validateMailConfig()` checks that a recipient exists, the SMTP port is a valid integer, a sender is configured, and that a configured SMTP username also has a password. Problems are returned as `emailStatus: "failed"` (or `"skipped"` when no transport/recipient is configured) with generic details; the message is still stored and the submitter sees the honest delivery note. No connection is attempted when the configuration is incomplete.

### Verification
- **Testing:** baseline **231/231** → final **239/239 checks passed** (8 new checks; no assertion deleted, skipped or weakened). `node --check` passes for `server.js` and `tests/smoke.js`.
- New checks confirm: no `dotenv` dependency was added, `.env.example` contains Gmail settings with secret placeholders, `.gitignore` keeps `.env` out of Git, dotfiles are not publicly served, an intentionally incomplete SMTP config fails without a network send and with a generic warning, credentials do not leak into responses/logs/frontend, the webhook token reaches only its endpoint, and no admin/mail secrets appear in the API response or server log.
- **No live Gmail SMTP delivery was performed** because no App Password was supplied to this environment. The existing webhook delivery/failure paths were exercised end-to-end, and SMTP configuration validation/failure was exercised locally. Gmail delivery remains to be confirmed by the site owner after entering the App Password.

## GOOGLE SHEETS CLOUD MESSAGE STORAGE ✅ COMPLETE
- **Backup:** before editing, created `backup-sheets-20261119-193540/` containing `server.js`, `script.js`, `index.html`, `style.css`, `.env.example`, `.gitignore`, `tests/smoke.js` and `PROJECT_PROGRESS.md`. All earlier backup folders were left untouched.
- **Files modified:** `server.js`, `script.js`, `index.html`, `style.css`, `.env.example`, `.gitignore`, `tests/smoke.js` and this document. No dependency, framework, `sequence.js` or `data.js` change was needed.
- **Implementation:** the official `googleapis` package was not installed because a small service-account JWT + Google Sheets REST append can be implemented with Node's built-in `crypto` and `https`. This keeps the Render deployment dependency-free and matches the existing backend style.
- **Storage architecture:** `CONTACT_STORAGE` now selects the driver. It defaults to `sheets`, which is the production/Render store. Set `CONTACT_STORAGE=local` only for offline development; that explicitly uses `data/messages.json` and is never required in production. No persistent disk is needed.
- **Appended data:** `Name`, `Email`, `Subject`, `Message`, `Timestamp` — always in that order. The append uses `valueInputOption=RAW`, so visitor text beginning with `=`, `+`, `-` or `@` cannot be evaluated as a spreadsheet formula.

### Local setup
1. Create a private Google Sheet with a tab named `Sheet1` (or set `GOOGLE_SHEETS_SHEET_NAME` to another tab) and add a header row: `Name | Email | Subject | Message | Timestamp`.
2. In Google Cloud, create a **service account**, enable the **Google Sheets API**, create a JSON key, and copy its `client_email` and `private_key`. Share the Sheet with the service account email as **Editor**.
3. Copy the template: `Copy-Item .env.example .env`.
4. Fill in `GOOGLE_SHEETS_SPREADSHEET_ID` (from the Sheet URL), `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and `CONTACT_ADMIN_TOKEN`. The private key may be pasted with literal `\n` characters between PEM lines; the server converts them to real newlines. Quotes around the value are optional and are removed by the local `.env` loader.
5. Start with `npm start`. The server obtains a short-lived OAuth access token with a signed JWT and appends one row per accepted submission.
6. Keep `CONTACT_STORAGE=sheets`. Use `CONTACT_STORAGE=local` only if you intentionally want offline JSON storage during development.

**Never commit** `.env`, service-account JSON keys, PEM files or private keys. `.gitignore` now excludes these patterns, and the static server returns `404` for all dotfiles.

### Render environment variables
Set these in the Render service environment (no Persistent Disk):
```text
CONTACT_STORAGE=sheets
GOOGLE_SHEETS_SPREADSHEET_ID=<your spreadsheet id>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service account client_email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<private key, literal \n is accepted>
GOOGLE_SHEETS_SHEET_NAME=Sheet1
CONTACT_EMAIL_TO=binesa1110@gmail.com
CONTACT_EMAIL_FROM=binesa1110@gmail.com
CONTACT_SMTP_HOST=smtp.gmail.com
CONTACT_SMTP_PORT=465
CONTACT_SMTP_SECURE=true
CONTACT_SMTP_USER=binesa1110@gmail.com
CONTACT_SMTP_PASS=<Google App Password>
CONTACT_ADMIN_TOKEN=<long random token>
```
Render may store the PEM across multiple lines; either paste it with literal `\n` sequences or use a single environment value containing them. Leave `CONTACT_EMAIL_WEBHOOK` unset to use Gmail SMTP.

### Submission and security behavior
- Existing validation, honeypot and rate limiting run before storage.
- A successful Sheets append is the authoritative storage success. If Gmail/SMTP subsequently fails, the visitor still sees the normal success message; the public email-failure warning was removed from `index.html`, `style.css` and `script.js`.
- If the Sheets append fails, the API returns `503` with `ok: false`, no success is shown, and the visitor can retry.
- A client-generated `submissionId` is kept across retries. The server caches successful submission IDs for 10 minutes and serializes in-flight writes, preventing duplicate rows from repeated clicks or a lost response within one process lifetime. This is in-process only; a process restart clears the cache.
- The authenticated DOCX export now reads rows from Google Sheets when `CONTACT_STORAGE=sheets`, and from the local store when explicitly using the local driver. It remains protected by `CONTACT_ADMIN_TOKEN` and is never exposed in the UI.
- Service-account email/private key, Spreadsheet ID, SMTP password and admin token are never written to frontend JavaScript, HTML, public APIs, console logs or error responses. API errors are deliberately generic.

### Verification
- **Testing:** baseline **239/239** → final **254/254 checks passed** (15 new checks; no assertion deleted, skipped or weakened). `node --check` passes for `server.js`, `script.js` and `tests/smoke.js`.
- New checks cover successful mock Sheets append with five ordered columns, RAW mode formula safety, configurable tab name, service-account JWT authentication, escaped private-key newline handling, SMTP failure after successful storage, in-process duplicate prevention, authenticated Sheets-backed DOCX export, Google Sheets append failure, missing credentials, generic configuration warnings, removal of the public email warning, and absence of Google/Google credentials in frontend code, API responses and logs.
- The tests use local mock OAuth and Sheets endpoints. **No real Google Sheet write or live Gmail send was performed** because no credentials/App Password were supplied here. Real Sheets delivery must be confirmed after configuring the environment variables locally or on Render.

## GITHUB / RENDER PREPARATION ✅ COMPLETE
- **Backup:** before editing, created `backup-github-prep-20261119-200335/` containing `.gitignore`, `package.json`, `tests/smoke.js`, `PROJECT_PROGRESS.md` and the previous `.env.example`. This folder is ignored by Git.
- **Files modified/added:** `.gitignore`, `package.json`, `tests/smoke.js`, `PROJECT_PROGRESS.md`; restored `.env.example` and added `README.md`. No portfolio feature, animation, design or backend behaviour was changed.
- **Audit finding:** `.env.example` was missing from the working tree (likely consumed when creating the local `.env`). It was restored from the safe template and extended with the Google Sheets placeholders. No real credential value was copied into it.
- **Git:** Git was not previously initialized. A fresh repository with `main` as the initial branch was created and a clean initial commit was made after verifying the staging area. Nothing was pushed and no GitHub repository was created automatically.

### Security audit results
- `.gitignore` now excludes `.env`, `.env.*` (except `.env.example`), all private-key/certificate extensions, service-account JSON variants, `data/`, `*.docx`, `node_modules/`, `tests/screenshots/`, logs, temporary files, `.DS_Store`/Thumbs.db, and `backup/`, `backup-*/`, `backups/`.
- `.env.example` contains only placeholders plus the non-secret Gmail address/host/port/secure settings requested earlier. It contains no App Password, admin token, private key or Spreadsheet ID.
- Scans of commit-candidate text files found no values from the local `.env` (SMTP password, admin token, Google credentials), no PEM private-key blocks, no Google API key patterns and no real contact-message content. The only PEM-like text is the documented `REPLACE_WITH_PRIVATE_KEY_BODY` placeholder in `.env.example`/test assertions.
- The static server blocks dotfiles such as `/.env` and `/.git/config`, service-account JSON paths, and the private `data/` store. Tests confirm `404` responses for all of them.
- `package.json` now declares `"private": true` and `"engines": { "node": ">=18" }`, while preserving `npm start` and `npm test`.

### GitHub / Render readiness
- `server.js` already reads `process.env.PORT`, binds to `0.0.0.0`, serves from `__dirname`, and uses Google Sheets by default — no Persistent Disk required.
- `README.md` documents local setup, environment variables, tests, GitHub push commands and Render Web Service settings (Build `npm install`, Start `npm start`).
- Useful source assets (frames, images, source ZIP, `.vscode/launch.json`) were kept. Generated screenshots, local data, backups and exports are ignored but not deleted.

### Verification
- **Testing:** baseline **254/254** → final **255/255 checks passed** (one new check; no assertion deleted, skipped or weakened). `node --check` passes for `server.js`, `script.js` and `tests/smoke.js`.
- A stale `node server.js` on port 3000 was stopped before the final run so the suite used its own isolated server. The single `ERR_FAILED` browser log note is the intentionally blocked retry test; there are zero JS exceptions and zero console errors.

## ISSUES / NOTES (honest limitations)
- No resume file was provided, so the resume download button is hidden. To enable it, set `PORTFOLIO.resume` in `data.js`.
- No public email address is rendered and no `mailto:` link is generated; LinkedIn and GitHub are rendered from the supplied/verified URLs. The contact form now submits to the local backend instead of being a preview.
- Email notification is opt-in via environment variables or the local `.env` file. Google Sheets is now the authoritative message store, so when email is unconfigured or fails the visitor still receives the normal success confirmation and no public warning is shown. Gmail SMTP settings and App Password instructions are in the configuration sections above. The SMTP transport and its failure/config-validation paths are tested locally; a live Gmail send has not been performed here.
- The admin DOCX export requires `CONTACT_ADMIN_TOKEN` or `CONTACT_ADMIN_USER`/`CONTACT_ADMIN_PASSWORD` to be set in the server environment or local `.env`. Keep these values out of frontend code and out of any public client configuration.
- GitHub data is a verified snapshot plus cached refresh; because API calls are unauthenticated, rate limits can make refresh fall back to the snapshot. New repositories appear in the catalog but are not promoted into the curated six-card showcase until their content is reviewed.
- No certificate URLs, credential IDs or actual certificate images were available, so certification cards remain unlinked and explicitly say that no public verification link was supplied. The four local images are clearly labelled topical visuals, not credentials.
- The supplied `byc-campus.webp` is wide (737×306), so its education card uses `object-fit: cover` with a centre crop; no image data was altered. If a wider original becomes available, it can be swapped in without changing markup.
- The original About section had no bespoke background implementation; the shared atmosphere system was established from its existing body-gradient language and the Experience ambient layer rather than copied from nonexistent About-specific code.
- No verified work mode or additional internships were available, so only the existing Unified Mentor record is shown.
- The Skills physics is intentionally bounded to 21 lightweight nodes with visibility-aware frames; it is not a full rigid-body engine. Touch and reduced-motion users receive simplified static alternatives.
- If a local `.env` was created before the Sheets work, it will not contain the `GOOGLE_*` variables. Add the Google Sheets block from `.env.example` before starting the app; otherwise the default `sheets` driver will correctly reject submissions until configured.
- Screenshots were regenerated but could not be visually inspected in this environment; visual validation relied on browser assertions, computed styles and layout geometry.
- "Beyond Code" was omitted because no factual source material was available; no activities were invented.
- The cinematic sequence intentionally uses a dark overlay in both themes because it is a full-bleed image sequence, not themable UI chrome.
