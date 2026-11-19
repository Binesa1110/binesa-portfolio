/* Portfolio interactions: themes, GitHub catalog, projects, 3D, cursor, loader. */
(() => {
  "use strict";

  const P = window.PORTFOLIO || {};
  const SKILLS = window.SKILLS || [];
  const PROJECTS = window.PROJECTS || [];
  const REPOS = window.GITHUB_REPOS || [];
  const GITHUB = window.GITHUB_PROFILE || {};
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const icon = (id, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"></use></svg>`;
  const safeUrl = (url) => /^(https?:\/\/|mailto:)/i.test(String(url || "")) ? String(url) : "";
  const extAttrs = 'target="_blank" rel="noopener noreferrer"';

  /* Original project-specific artwork: abstract diagrams, never fake screenshots. */
  function projectArtwork(id) {
    switch (id) {
      case "cybermind-nlp":
        return `<svg class="project-art art-nlp" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <g class="art-line art-faint"><path d="M16 44h288M16 146h288"/><path d="M40 24v142M280 24v142"/></g>
          <g class="art-line art-soft"><path d="M58 128 112 74l56 30 56-52 52 44"/><path d="M58 128l64 16 46-40 78 38"/><path d="M112 74l22-38 90 16"/><path d="M224 52l52 44-34 48"/></g>
          <g class="art-fill"><circle cx="58" cy="128" r="5"/><circle cx="112" cy="74" r="6"/><circle cx="168" cy="104" r="7"/><circle cx="224" cy="52" r="6"/><circle cx="276" cy="96" r="5"/><circle cx="122" cy="144" r="4"/><circle cx="246" cy="142" r="4"/><circle cx="134" cy="36" r="3"/></g>
          <path class="art-line" d="M168 80 190 89v20c0 15-11 26-22 31-11-5-22-16-22-31V89l22-9Z"/><path class="art-line" d="m159 110 7 7 13-14"/>
          <text class="art-label" x="24" y="34">text</text><text class="art-label" x="248" y="32">intent</text><text class="art-label" x="252" y="132">risk</text><text class="art-label" x="92" y="166">tone</text>
        </svg>`;
      case "intrusion-detection":
        return `<svg class="project-art art-ids" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <rect class="art-line art-soft" x="16" y="24" width="288" height="142" rx="10"/><path class="art-line art-faint" d="M16 62h288M152 62v104"/>
          <circle class="art-line art-soft" cx="84" cy="104" r="42"/><circle class="art-line art-faint" cx="84" cy="104" r="24"/><path class="art-line" d="M84 104 120 76"/><path class="art-line art-soft" d="M84 62v84M42 104h84"/>
          <g class="art-fill"><circle cx="120" cy="76" r="5"/><circle cx="60" cy="126" r="3"/><circle cx="106" cy="132" r="3"/><circle cx="54" cy="82" r="3"/></g>
          <text class="art-label" x="168" y="48">LOG STREAM</text>
          <g class="art-line art-soft"><path d="M168 68h112M168 80h76M168 92h128M168 104h94M168 116h66"/></g>
          <rect class="art-line" x="168" y="132" width="112" height="22" rx="5"/><text class="art-label" x="178" y="147">THREAT + 01</text>
        </svg>`;
      case "mailpilot-ai":
        return `<svg class="project-art art-mail" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <rect class="art-line art-soft" x="24" y="34" width="184" height="122" rx="10"/><path class="art-line art-faint" d="M24 64h184M154 64v92"/>
          <path class="art-line" d="m40 78 56 38 56-38"/><path class="art-line art-soft" d="M40 138 96 100l56 38"/>
          <g class="art-fill art-soft"><rect x="168" y="80" width="26" height="6" rx="3"/><rect x="168" y="96" width="18" height="6" rx="3"/><rect x="168" y="112" width="30" height="6" rx="3"/></g>
          <circle class="art-line" cx="252" cy="72" r="26"/><path class="art-line" d="m242 72 8 8 15-16"/>
          <text class="art-label" x="222" y="116">APPROVAL</text><text class="art-label" x="36" y="26">DRAFT / REVIEW</text>
          <path class="art-line art-faint" d="M222 126h70M222 138h48"/>
        </svg>`;
      case "ridewise-assist":
        return `<svg class="project-art art-ride" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path class="art-line art-soft" d="M24 138 54 78l40-20 40 20 30 60"/><path class="art-line art-soft" d="M166 96l34-38 52 16 26 64h-64"/>
          <path class="art-line art-faint" d="M24 138h272M94 58v80M200 58l-16 80"/>
          <g class="art-fill"><circle cx="54" cy="78" r="5"/><circle cx="134" cy="78" r="5"/><circle cx="200" cy="58" r="5"/><circle cx="252" cy="74" r="5"/><circle cx="248" cy="138" r="6"/><circle cx="72" cy="138" r="6"/></g>
          <rect class="art-line" x="104" y="20" width="112" height="24" rx="12"/><text class="art-label" x="122" y="36">SUPPORT AGENT</text>
          <g class="art-line art-soft"><path d="M112 166h96M136 158v16M184 158v16"/></g>
        </svg>`;
      case "secure-and-safe":
        return `<svg class="project-art art-secure" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path class="art-line" d="M160 30 232 58v46c0 42-30 66-72 78-42-12-72-36-72-78V58l72-28Z"/>
          <path class="art-line art-soft" d="M160 54v78M126 82h68M132 118h56"/>
          <rect class="art-line art-soft" x="142" y="76" width="36" height="30" rx="6"/><path class="art-line" d="M150 76V66a10 10 0 0 1 20 0v10"/>
          <g class="art-fill"><circle cx="160" cy="92" r="3"/></g>
          <text class="art-label" x="22" y="32">DOCUMENT VAULT</text><text class="art-label" x="224" y="164">AUTH</text>
          <path class="art-line art-faint" d="M22 44h58M22 56h38M240 152h58M258 164h40"/>
        </svg>`;
      case "sports-buddy":
        return `<svg class="project-art art-sports" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <rect class="art-line art-soft" x="24" y="34" width="272" height="120" rx="8"/><path class="art-line art-faint" d="M160 34v120M24 94h272"/><circle class="art-line art-soft" cx="160" cy="94" r="24"/>
          <rect class="art-line art-faint" x="24" y="62" width="34" height="64"/><rect class="art-line art-faint" x="262" y="62" width="34" height="64"/>
          <path class="art-line art-soft" d="M72 62 128 82M214 82l38-20M86 128l48-20M200 108l42 20"/>
          <g class="art-fill"><circle cx="72" cy="62" r="6"/><circle cx="128" cy="82" r="5"/><circle cx="214" cy="82" r="5"/><circle cx="252" cy="62" r="6"/><circle cx="86" cy="128" r="5"/><circle cx="134" cy="108" r="6"/><circle cx="200" cy="108" r="6"/><circle cx="242" cy="128" r="5"/></g>
          <rect class="art-line" x="102" y="12" width="116" height="22" rx="11"/><text class="art-label" x="120" y="27">FIND A MATCH</text>
        </svg>`;
      default:
        return `<svg class="project-art art-default" viewBox="0 0 320 190" aria-hidden="true"><circle class="art-line" cx="160" cy="95" r="52"/></svg>`;
    }
  }

  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }

  function focusables(container) {
    return $$('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', container)
      .filter((el) => el.getClientRects().length > 0);
  }
  function trapFocus(event, container) {
    if (event.key !== "Tab") return;
    const items = focusables(container);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  function updateScrollLock() {
    const open = !$("#palette").hidden || !$("#project-modal").hidden;
    document.body.style.overflow = open ? "hidden" : "";
  }

  /* ---------------- Theme ---------------- */
  const themeBtn = $("#theme-toggle");
  const themeMeta = $('meta[name="theme-color"]');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem("binesa-theme", theme); } catch (e) { /* private mode */ }
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#fff8f0" : "#08080b");
    if (themeBtn) themeBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
  }
  applyTheme(root.dataset.theme === "light" ? "light" : "dark");
  themeBtn?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "light" ? "dark" : "light");
    toast(`${root.dataset.theme === "light" ? "Light" : "Dark"} theme enabled`);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "binesa-theme" && (e.newValue === "light" || e.newValue === "dark")) {
      applyTheme(e.newValue);
    }
  });

  /* ---------------- Configured external links ---------------- */
  function externalLink(url, label, iconId, className = "social-link") {
    const href = safeUrl(url);
    const a = document.createElement("a");
    a.className = className;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `${icon(iconId)}<span>${escapeHtml(label)}</span>${icon("i-arrow-up")}`;
    return a;
  }
  const socials = $("#hero-socials");
  if (socials) {
    if (P.linkedin) socials.appendChild(externalLink(P.linkedin, "LinkedIn", "i-linkedin"));
    if (P.github) socials.appendChild(externalLink(P.github, "GitHub", "i-github"));
  }
  const contactLinks = $("#contact-links");
  if (contactLinks) {
    if (P.email) contactLinks.appendChild(externalLink(`mailto:${P.email}`, P.email, "i-mail", "social-link"));
    if (P.linkedin) contactLinks.appendChild(externalLink(P.linkedin, "LinkedIn", "i-linkedin", "social-link"));
    if (P.github) contactLinks.appendChild(externalLink(P.github, "GitHub", "i-github", "social-link"));
  }
  const footerLinks = $("#footer-links");
  if (footerLinks) {
    if (P.linkedin) footerLinks.appendChild(externalLink(P.linkedin, "LinkedIn", "i-linkedin", "footer-social"));
    if (P.github) footerLinks.appendChild(externalLink(P.github, "GitHub", "i-github", "footer-social"));
  }
  const emailNote = $("#email-availability-note");
  if (emailNote) emailNote.hidden = Boolean(P.email);
  const resumeBtn = $("#resume-btn");
  if (resumeBtn && P.resume) {
    resumeBtn.hidden = false;
    resumeBtn.addEventListener("click", () => window.open(P.resume, "_blank", "noopener"));
  }

  async function copyEmail() {
    if (!P.email) return;
    try {
      await navigator.clipboard.writeText(P.email);
      toast("Email copied to clipboard");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = P.email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("Email copied to clipboard"); }
      catch (err) { toast("Could not copy — select the address manually"); }
      ta.remove();
    }
  }

  /* ---------------- Lightning-fast, honest loader ---------------- */
  const loader = $("#loader");
  const loaderBar = $("#loader-bar");
  const loaderStatus = $("#loader-status");
  let loaderDone = false;
  function setLoaderProgress(value, message) {
    if (!loader) return;
    loader.style.setProperty("--loader-progress", `${Math.max(0, Math.min(100, value))}%`);
    if (loaderBar) loaderBar.style.transform = `scaleX(${Math.max(0, Math.min(1, value / 100))})`;
    if (loaderStatus && message) loaderStatus.textContent = message;
  }
  function finishLoader(reason = "ready") {
    if (loaderDone || !loader) return;
    loaderDone = true;
    setLoaderProgress(100, "Ready");
    loader.classList.add("is-done");
    loader.setAttribute("aria-hidden", "true");
    loader.dataset.reason = reason;
  }
  if (loader) {
    const alreadyReady = document.readyState === "complete" && window.__sequence?.getCanvasInfo().lastDrawnIndex >= 0;
    if (alreadyReady || reduced) {
      finishLoader(alreadyReady ? "already-ready" : "reduced-motion");
    } else {
      loader.classList.add("is-active");
      setLoaderProgress(35, "Preparing interface");
      const frameTimer = setInterval(() => {
        if (window.__sequence?.getCanvasInfo().lastDrawnIndex >= 0) {
          setLoaderProgress(78, "Cinematic frame ready");
          clearInterval(frameTimer);
        }
      }, 80);
      window.addEventListener("load", () => {
        clearInterval(frameTimer);
        setLoaderProgress(92, "Finishing");
        requestAnimationFrame(() => finishLoader("load"));
      }, { once: true });
      setTimeout(() => { clearInterval(frameTimer); finishLoader("timeout-guard"); }, 1400);
    }
  }

  /* ---------------- Navigation & scroll ---------------- */
  const nav = $("#nav");
  const navLinks = $("#nav-links");
  const menuToggle = $("#menu-toggle");
  const progressBar = $("#scroll-progress-bar");
  const sectionIds = ["home", "about", "skills", "projects", "experience", "education", "certifications", "contact"];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  let scrollQueued = false;

  function updateScrollUI() {
    scrollQueued = false;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.min(Math.max(window.scrollY / max, 0), 1);
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    nav?.classList.toggle("is-scrolled", window.scrollY > 12);

    let current = sectionIds[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 160) current = section.id;
    }
    $$("[data-nav-link]").forEach((a) => {
      const active = a.getAttribute("href") === `#${current}`;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScrollUI); }
  }, { passive: true });
  window.addEventListener("resize", updateScrollUI, { passive: true });
  updateScrollUI();

  function closeMenu() {
    navLinks?.classList.remove("is-open");
    menuToggle?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open menu");
  }
  menuToggle?.addEventListener("click", () => {
    const open = !navLinks.classList.contains("is-open");
    navLinks.classList.toggle("is-open", open);
    menuToggle.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("[data-nav-link]").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("click", (e) => {
    if (navLinks?.classList.contains("is-open") && !e.target.closest(".nav")) closeMenu();
  });
  $("#hero-scroll")?.addEventListener("click", () => {
    window.scrollBy({ top: window.innerHeight * 0.72, behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------------- Mouse glow + restrained CSS 3D ---------------- */
  const stage = $("#cinema-frame");
  if (stage && !reduced && finePointer.matches) {
    let glowQueued = false;
    let point = { x: 50, y: 50 };
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      point = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
      if (!glowQueued) {
        glowQueued = true;
        requestAnimationFrame(() => {
          stage.style.setProperty("--mx", `${point.x}%`);
          stage.style.setProperty("--my", `${point.y}%`);
          glowQueued = false;
        });
      }
    }, { passive: true });
  }

  function setupTilt() {
    if (reduced || !finePointer.matches) return;
    $$("[data-tilt]").forEach((el) => {
      let queued = false;
      let values = { x: 0, y: 0 };
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        values = {
          x: ((e.clientY - r.top) / r.height - 0.5) * -3,
          y: ((e.clientX - r.left) / r.width - 0.5) * 3
        };
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          el.style.setProperty("--rx", `${values.x.toFixed(2)}deg`);
          el.style.setProperty("--ry", `${values.y.toFixed(2)}deg`);
          queued = false;
        });
      }, { passive: true });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }
  setupTilt();

  /* ---------------- Personal portrait character ---------------- */
  const character = $(".portrait-character");
  if (character) {
    if (!reduced && finePointer.matches) {
      let queued = false;
      let look = { x: 0, y: 0 };
      character.addEventListener("pointermove", (e) => {
        const r = character.getBoundingClientRect();
        look = { x: ((e.clientX - r.left) / r.width - 0.5) * 8, y: ((e.clientY - r.top) / r.height - 0.5) * -5 };
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          character.style.setProperty("--look-x", `${look.x.toFixed(2)}px`);
          character.style.setProperty("--look-y", `${look.y.toFixed(2)}px`);
          queued = false;
        });
      }, { passive: true });
      character.addEventListener("pointerleave", () => {
        character.style.setProperty("--look-x", "0px");
        character.style.setProperty("--look-y", "0px");
      });
    }
    if ("IntersectionObserver" in window) {
      const charObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => character.classList.toggle("is-visible", entry.isIntersecting));
      }, { threshold: 0.25 });
      charObserver.observe(character);
    } else {
      character.classList.add("is-visible");
    }
  }

  /* ---------------- Contextual custom cursor (fine pointers only) ---------------- */
  const cursorDot = $("#cursor-dot");
  const cursorRing = $("#cursor-ring");
  const cursorEnabled = !reduced && finePointer.matches && cursorDot && cursorRing;
  document.body.classList.toggle("has-custom-cursor", Boolean(cursorEnabled));
  if (cursorEnabled) {
    let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    let cursorQueued = false;
    window.addEventListener("pointermove", (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      if (!cursorQueued) {
        cursorQueued = true;
        requestAnimationFrame(() => {
          ringX += (mouseX - ringX) * 0.22;
          ringY += (mouseY - ringY) * 0.22;
          cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
          cursorQueued = false;
        });
      }
    }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const interactive = e.target.closest("a, button, input, textarea, [data-magnetic]");
      document.body.classList.toggle("cursor-interactive", Boolean(interactive));
    });
    document.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget) document.body.classList.remove("cursor-interactive");
    });
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.08;
        const y = (e.clientY - r.top - r.height / 2) * 0.08;
        el.style.setProperty("--mag-x", `${x.toFixed(2)}px`);
        el.style.setProperty("--mag-y", `${y.toFixed(2)}px`);
      }, { passive: true });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--mag-x", "0px");
        el.style.setProperty("--mag-y", "0px");
      });
    });
  }

  /* ---------------- Skills ---------------- */
  const skillsGrid = $("#skills-grid");
  if (skillsGrid) {
    skillsGrid.innerHTML = SKILLS.map((group) => `
      <div class="skill-group" data-skill-group="${escapeHtml(group.id)}">
        <div class="skill-group-head"><h3>${escapeHtml(group.label)}</h3><span>${group.skills.length} skills</span></div>
        <div class="skill-chips">
          ${group.skills.map((s) => `<button class="skill-chip" type="button" data-name="${escapeHtml(s.name)}" data-note="${escapeHtml(s.note)}" title="${escapeHtml(s.note)}">${escapeHtml(s.name)}</button>`).join("")}
        </div>
      </div>`).join("");
    if (!reduced) {
      $$(".skill-group", skillsGrid).forEach((group, i) => {
        group.setAttribute("data-reveal", "");
        group.style.setProperty("--delay", `${i * 70}ms`);
      });
    }
  }

  const skillDetail = $("#skill-detail");
  $$("[data-skill-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const value = tab.dataset.skillTab;
      $$("[data-skill-tab]").forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      $$("[data-skill-group]").forEach((group) => {
        group.hidden = value !== "all" && group.dataset.skillGroup !== value;
      });
      if (skillDetail) skillDetail.textContent = value === "all"
        ? "Select a skill to see how it fits into my work."
        : `Showing ${tab.textContent.trim()} — select a skill for context.`;
    });
  });
  skillsGrid?.addEventListener("click", (e) => {
    const chip = e.target.closest(".skill-chip");
    if (!chip) return;
    const already = chip.classList.contains("is-selected");
    $$(".skill-chip", skillsGrid).forEach((c) => c.classList.remove("is-selected"));
    if (already) {
      if (skillDetail) skillDetail.textContent = "Select a skill to see how it fits into my work.";
      return;
    }
    chip.classList.add("is-selected");
    if (skillDetail) skillDetail.textContent = `${chip.dataset.name} — ${chip.dataset.note}`;
  });

  /* ---------------- Interactive 3D technology universe ---------------- */
  const techUniverse = $("#tech-universe");
  const techCloud = $("#tech-cloud");
  const SPHERE_LAYOUT = [
    { x: 50, y: 49, z: 90, size: 116 }, { x: 38, y: 43, z: 40, size: 104 },
    { x: 62, y: 42, z: 36, size: 100 }, { x: 49, y: 68, z: 74, size: 110 },
    { x: 30, y: 61, z: -20, size: 88 }, { x: 70, y: 61, z: 14, size: 94 },
    { x: 44, y: 24, z: -34, size: 86 }, { x: 57, y: 24, z: 12, size: 92 },
    { x: 20, y: 34, z: -62, size: 84 }, { x: 79, y: 33, z: -28, size: 90 },
    { x: 15, y: 61, z: -50, size: 86 }, { x: 85, y: 59, z: 8, size: 96 },
    { x: 35, y: 79, z: -46, size: 84 }, { x: 65, y: 80, z: -18, size: 90 },
    { x: 50, y: 14, z: -72, size: 80 }, { x: 50, y: 88, z: -58, size: 82 },
    { x: 11, y: 18, z: -82, size: 78 }, { x: 89, y: 18, z: -66, size: 80 },
    { x: 11, y: 84, z: -76, size: 78 }, { x: 89, y: 84, z: -56, size: 82 },
    { x: 73, y: 14, z: -40, size: 84 }
  ];
  const allSkills = SKILLS.flatMap((group) => group.skills);
  let sphereElements = [];
  let skillVisible = false;
  let skillRaf = 0;
  let clusterScrollQueued = false;
  const skillPointer = { x: 0, y: 0, active: false };

  if (techCloud) {
    techCloud.innerHTML = allSkills.map((skill, i) => {
      const l = SPHERE_LAYOUT[i % SPHERE_LAYOUT.length];
      const depthScale = (0.86 + ((l.z + 100) / 200) * 0.2).toFixed(3);
      const labelSize = skill.name.length > 18 ? ".52rem" : skill.name.length > 12 ? ".6rem" : ".7rem";
      return `<button class="tech-sphere" type="button" tabindex="-1" data-skill-name="${escapeHtml(skill.name)}" style="--x:${l.x};--y:${l.y};--z:${l.z}px;--size:${l.size}px;--depth-scale:${depthScale};--label-size:${labelSize};--delay:${(i % 7) * -730}ms"><span class="sphere-label">${escapeHtml(skill.name)}</span></button>`;
    }).join("");
    sphereElements = $$(".tech-sphere", techCloud);

    techCloud.addEventListener("click", (e) => {
      const sphere = e.target.closest(".tech-sphere");
      if (!sphere || !skillsGrid) return;
      const chip = $$(".skill-chip", skillsGrid).find((c) => c.dataset.name === sphere.dataset.skillName);
      chip?.click();
    });
  }

  const physicsEnabled = Boolean(techCloud && !reduced && finePointer.matches && sphereElements.length);
  const sphereState = physicsEnabled ? sphereElements.map((el, i) => {
    const l = SPHERE_LAYOUT[i % SPHERE_LAYOUT.length];
    return {
      el, layout: l, x: 0, y: 0, bx: 0, by: 0, vx: 0, vy: 0,
      phase: i * 0.73, speed: 0.5 + (i % 5) * 0.075,
      ampX: 2 + (i % 4), ampY: 3 + (i % 3)
    };
  }) : [];

  function measureSpheres() {
    if (!techCloud || !sphereState.length) return;
    const w = techCloud.clientWidth;
    const h = techCloud.clientHeight;
    sphereState.forEach((n) => {
      n.bx = (w * n.layout.x) / 100;
      n.by = (h * n.layout.y) / 100;
      if (!n.x && !n.y) { n.x = n.bx; n.y = n.by; }
    });
  }

  function tickSkillUniverse(now) {
    if (!skillVisible || !sphereState.length) { skillRaf = 0; return; }
    const t = now * 0.001;
    const w = techCloud.clientWidth;
    const h = techCloud.clientHeight;

    if (skillPointer.active) {
      sphereState.forEach((n) => {
        const dx = n.x - skillPointer.x;
        const dy = n.y - skillPointer.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < 135) {
          const force = Math.pow(1 - dist / 135, 2) * 2.6;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
      });
    }

    for (let i = 0; i < sphereState.length; i++) {
      for (let j = i + 1; j < sphereState.length; j++) {
        const a = sphereState[i];
        const b = sphereState[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const min = (a.layout.size + b.layout.size) * 0.5 + 8;
        if (dist < min) {
          const push = (min - dist) * 0.006;
          const nx = dx / dist;
          const ny = dy / dist;
          a.vx -= nx * push; a.vy -= ny * push;
          b.vx += nx * push; b.vy += ny * push;
        }
      }
    }

    sphereState.forEach((n) => {
      const fx = Math.sin(t * n.speed + n.phase) * n.ampX;
      const fy = Math.cos(t * n.speed * 0.82 + n.phase) * n.ampY;
      n.vx += (n.bx + fx - n.x) * 0.014;
      n.vy += (n.by + fy - n.y) * 0.014;
      n.vx *= 0.88;
      n.vy *= 0.88;
      n.x += n.vx;
      n.y += n.vy;
      const half = n.layout.size * 0.5 + 2;
      n.x = Math.max(half, Math.min(w - half, n.x));
      n.y = Math.max(half, Math.min(h - half, n.y));
      n.el.style.setProperty("--dx", `${(n.x - n.bx).toFixed(2)}px`);
      n.el.style.setProperty("--dy", `${(n.y - n.by).toFixed(2)}px`);
      n.el.style.setProperty("--rot-x", `${(Math.cos(t * n.speed * 0.5 + n.phase) * 3).toFixed(2)}deg`);
      n.el.style.setProperty("--rot-y", `${(Math.sin(t * n.speed * 0.6 + n.phase) * 4).toFixed(2)}deg`);
    });
    skillRaf = requestAnimationFrame(tickSkillUniverse);
  }

  function setSkillVisibility(visible) {
    skillVisible = visible;
    techUniverse?.classList.toggle("is-paused", !visible);
    if (!physicsEnabled) return;
    if (visible && !skillRaf) skillRaf = requestAnimationFrame(tickSkillUniverse);
    if (!visible && skillRaf) { cancelAnimationFrame(skillRaf); skillRaf = 0; }
  }

  if (techCloud) {
    measureSpheres();
    if (physicsEnabled) {
      techCloud.addEventListener("pointermove", (e) => {
        const r = techCloud.getBoundingClientRect();
        skillPointer.x = e.clientX - r.left;
        skillPointer.y = e.clientY - r.top;
        skillPointer.active = true;
      }, { passive: true });
      techCloud.addEventListener("pointerleave", () => { skillPointer.active = false; });
      if ("ResizeObserver" in window) new ResizeObserver(measureSpheres).observe(techCloud);
      else window.addEventListener("resize", measureSpheres, { passive: true });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => setSkillVisibility(entries[0].isIntersecting), { rootMargin: "120px" }).observe(techUniverse);
    } else {
      setSkillVisibility(true);
    }

    function updateClusterScroll() {
      clusterScrollQueued = false;
      if (!techUniverse) return;
      const r = techUniverse.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      const offset = (p - 0.5) * 86;
      const scale = 1 + Math.abs(p - 0.5) * 0.035;
      techCloud.style.setProperty("--cluster-y", `${offset.toFixed(1)}px`);
      techCloud.style.setProperty("--cluster-scale", scale.toFixed(3));
    }
    window.addEventListener("scroll", () => {
      if (!clusterScrollQueued) { clusterScrollQueued = true; requestAnimationFrame(updateClusterScroll); }
    }, { passive: true });
    updateClusterScroll();
  }

  /* ---------------- Education flip cards ---------------- */
  $$("[data-flip-card]").forEach((card, index) => {
    const front = $(".edu-face-front", card);
    const back = $(".edu-face-back", card);
    const frontToggle = $(".edu-face-front [data-flip-toggle]", card);
    const backToggle = $(".edu-face-back [data-flip-toggle]", card);
    if (!front || !back || !frontToggle || !backToggle) return;
    front.id ||= `edu-front-${index + 1}`;
    back.id ||= `edu-back-${index + 1}`;
    frontToggle.setAttribute("aria-controls", back.id);
    backToggle.setAttribute("aria-controls", front.id);

    if (reduced) {
      frontToggle.hidden = true;
      backToggle.hidden = true;
      front.removeAttribute("aria-hidden");
      back.removeAttribute("aria-hidden");
      return;
    }

    let flipped = false;
    function setFaceState(face, hidden) {
      face.setAttribute("aria-hidden", String(hidden));
      $$("button, a, input, textarea, select", face).forEach((el) => {
        if (hidden) el.setAttribute("tabindex", "-1");
        else el.removeAttribute("tabindex");
      });
    }
    function applyFlip() {
      card.classList.toggle("is-flipped", flipped);
      frontToggle.setAttribute("aria-expanded", String(flipped));
      backToggle.setAttribute("aria-expanded", String(!flipped));
      setFaceState(front, flipped);
      setFaceState(back, !flipped);
    }

    [frontToggle, backToggle].forEach((button) => {
      button.addEventListener("click", () => {
        flipped = !flipped;
        card.classList.add("is-hover-disabled");
        applyFlip();
        (flipped ? backToggle : frontToggle).focus();
      });
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && flipped) {
        flipped = false;
        applyFlip();
        frontToggle.focus();
      }
    });
    if (finePointer.matches) {
      card.addEventListener("pointerenter", () => card.classList.add("is-hovered"));
      card.addEventListener("pointerleave", () => card.classList.remove("is-hovered", "is-hover-disabled"));
    }
    applyFlip();
  });

  /* ---------------- Immersive experience environment ---------------- */
  const experienceSection = $("#experience");
  const experienceAmbient = $("#experience-ambient");
  const timeline = $("[data-timeline]");
  let timelineScrollQueued = false;

  function updateTimelineProgress() {
    timelineScrollQueued = false;
    if (!timeline) return;
    const card = $(".timeline-card", timeline) || timeline;
    const r = card.getBoundingClientRect();
    const start = window.innerHeight * 0.9;
    const end = window.innerHeight * 0.2;
    const progress = Math.max(0, Math.min(1, (start - r.top) / Math.max(1, start - end)));
    timeline.style.setProperty("--timeline-progress", progress.toFixed(3));
  }
  if (timeline) {
    updateTimelineProgress();
    window.addEventListener("scroll", () => {
      if (!timelineScrollQueued) { timelineScrollQueued = true; requestAnimationFrame(updateTimelineProgress); }
    }, { passive: true });
  }
  if ("IntersectionObserver" in window) {
    $$("[data-ambient]").forEach((layer) => {
      const section = layer.closest(".section");
      if (!section) return;
      new IntersectionObserver((entries) => {
        layer.classList.toggle("is-paused", !entries[0].isIntersecting);
      }, { rootMargin: "80px" }).observe(section);
    });
    $$("[data-atmosphere]").forEach((section) => {
      new IntersectionObserver((entries) => {
        section.classList.toggle("is-paused", !entries[0].isIntersecting);
      }, { rootMargin: "100px" }).observe(section);
    });
  }

  /* ---------------- Projects: aligned constellation + dynamic focus ---------------- */
  const projectsGrid = $("#projects-grid");
  const projectsNote = $("#projects-note");
  const focusLabel = $("#project-focus-label");
  const ORBIT_MARKS = ["-18px", "14px", "-8px", "18px", "-12px", "10px"];

  function repoButton(p) {
    const url = safeUrl(p.repo);
    if (!url) return "";
    return `<a class="btn btn-ghost project-repo-btn" href="${escapeHtml(url)}" ${extAttrs} aria-label="Open ${escapeHtml(p.repoName)} on GitHub" data-repo-link>${icon("i-github")}<span>GitHub</span>${icon("i-arrow-up")}</a>`;
  }
  function demoButton(p) {
    const url = safeUrl(p.homepage);
    if (!url) return "";
    return `<a class="btn btn-ghost" href="${escapeHtml(url)}" ${extAttrs} aria-label="Open live demo for ${escapeHtml(p.title)}" data-demo-link>${icon("i-external")}<span>Live demo</span></a>`;
  }

  if (projectsGrid) {
    projectsGrid.innerHTML = PROJECTS.map((p, i) => `
      <article class="project-card" data-project-id="${escapeHtml(p.id)}" data-categories="${escapeHtml(p.categories.join("|"))}" style="--orbit-y:${ORBIT_MARKS[i % ORBIT_MARKS.length]}">
        <div class="project-visual" data-accent="${escapeHtml(p.accent)}" data-tilt>
          <span class="project-visual-label">${escapeHtml(p.category)}</span>
          ${projectArtwork(p.id)}
        </div>
        <div class="project-body">
          <div class="project-card-top"><span class="project-cat">${escapeHtml(p.categories[0])}</span><span class="project-index">${String(i + 1).padStart(2, "0")}</span></div>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.summary)}</p>
          <div class="project-tech">${p.tech.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>
          <div class="project-actions">
            ${repoButton(p)}
            <button class="btn btn-secondary" type="button" data-project="${escapeHtml(p.id)}">Details ${icon("i-arrow")}</button>
          </div>
        </div>
      </article>`).join("");
    if (!reduced) {
      $$(".project-card", projectsGrid).forEach((card, i) => {
        card.setAttribute("data-reveal", "");
        card.style.setProperty("--delay", `${(i % 3) * 70}ms`);
      });
    }
  }

  function updateFilterCounts() {
    $$("[data-filter]").forEach((btn) => {
      const count = btn.dataset.filter === "All"
        ? PROJECTS.length
        : PROJECTS.filter((p) => p.categories.includes(btn.dataset.filter)).length;
      const badge = $("span", btn);
      if (badge) badge.textContent = String(count).padStart(2, "0");
    });
    const coreCount = $("#project-core-count");
    if (coreCount) coreCount.textContent = String(PROJECTS.length).padStart(2, "0");
  }
  updateFilterCounts();

  function setFocus(card) {
    if (!card) return;
    $$(".project-card", projectsGrid).forEach((c) => c.classList.toggle("is-selected", c === card));
    if (focusLabel) focusLabel.textContent = `${$("h3", card)?.textContent || "Project"} · selected`;
  }

  $$("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.filter;
      $$("[data-filter]").forEach((b) => b.classList.toggle("is-active", b === btn));
      let visible = 0;
      let firstVisible = null;
      $$(".project-card", projectsGrid).forEach((card) => {
        const match = value === "All" || card.dataset.categories.split("|").includes(value);
        card.hidden = !match;
        if (match) { visible++; firstVisible ||= card; }
      });
      if (projectsNote) projectsNote.hidden = visible > 0;
      if (focusLabel) focusLabel.textContent = visible ? `${visible} repositories in view` : "No repositories in view";
      if (firstVisible) setFocus(firstVisible);
    });
  });
  projectsGrid?.addEventListener("pointerover", (e) => {
    const card = e.target.closest(".project-card");
    if (card && finePointer.matches) setFocus(card);
  });
  projectsGrid?.addEventListener("focusin", (e) => {
    const card = e.target.closest(".project-card");
    if (card) setFocus(card);
  });

  const modal = $("#project-modal");
  const modalBody = $("#modal-body");
  const modalPanel = $(".modal-panel", modal);
  let lastFocused = null;

  function openProject(id) {
    const p = PROJECTS.find((item) => item.id === id);
    if (!p || !modal) return;
    lastFocused = document.activeElement;
    const repoUrl = safeUrl(p.repo);
    const demoUrl = safeUrl(p.homepage);
    const sourceNote = repoUrl
      ? `Repository verified from the public GitHub API snapshot.${demoUrl ? "" : " No live demo URL is published for this repository."}`
      : "No public repository or live demo link has been shared for this project.";
    modalBody.innerHTML = `
      <div class="modal-hero">
        <div class="modal-artwork" data-accent="${escapeHtml(p.accent)}">${projectArtwork(p.id)}</div>
        <div>
          <span class="mono-label">${escapeHtml(p.category)}</span>
          <h2 id="modal-title">${escapeHtml(p.title)}</h2>
          <span class="mono-label">${p.categories.map(escapeHtml).join(" · ")}</span>
        </div>
      </div>
      <div class="modal-block"><h3>Overview</h3><p>${escapeHtml(p.overview)}</p></div>
      <div class="modal-block"><h3>Problem addressed</h3><p>${escapeHtml(p.problem)}</p></div>
      <div class="modal-block"><h3>Features</h3><ul class="modal-list">${p.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul></div>
      <div class="modal-block"><h3>Technologies used</h3><div class="modal-tech">${p.tech.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div></div>
      <div class="modal-block"><h3>Implementation</h3><p>${escapeHtml(p.implementation)}</p></div>
      <div class="modal-block"><h3>Limitations</h3><p>${escapeHtml(p.limitations)}</p></div>
      <div class="modal-actions">
        ${repoUrl ? `<a class="btn btn-primary" href="${escapeHtml(repoUrl)}" ${extAttrs} data-modal-repo>${icon("i-github")}<span>View repository</span>${icon("i-arrow-up")}</a>` : ""}
        ${demoButton(p)}
        <span class="mono-label">${escapeHtml(sourceNote)}</span>
      </div>`;
    modal.hidden = false;
    updateScrollLock();
    modalPanel.scrollTop = 0;
    $(".modal-close", modal).focus();
  }
  function closeProject() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    updateScrollLock();
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }
  projectsGrid?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-project]");
    if (btn) openProject(btn.dataset.project);
  });
  modal?.addEventListener("click", (e) => { if (e.target.closest("[data-close-modal]")) closeProject(); });
  modal?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProject();
    trapFocus(e, modalPanel);
  });

  /* ---------------- GitHub catalog with cache + pagination ---------------- */
  const repoList = $("#repo-list");
  const repoStatus = $("#repo-status");
  const CACHE_KEY = "binesa-github-repos";
  const CACHE_TTL = 24 * 60 * 60 * 1000;

  function normalizeRepo(r) {
    return {
      name: String(r.name || "Unnamed repository"),
      url: safeUrl(r.html_url || r.url),
      description: String(r.description || ""),
      homepage: safeUrl(r.homepage) || "",
      language: r.language || "",
      topics: Array.isArray(r.topics) ? r.topics.slice(0, 5) : [],
      size: Number(r.size || 0),
      fork: Boolean(r.fork),
      archived: Boolean(r.archived),
      private: Boolean(r.private),
      updatedAt: r.updated_at || r.updatedAt || "",
      pushedAt: r.pushed_at || r.pushedAt || "",
      empty: Boolean(r.size === 0)
    };
  }
  function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "date unavailable" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }
  function renderRepos(list, status) {
    if (repoList) {
      repoList.innerHTML = list.map((r) => `
        <li class="repo-item${r.empty ? " is-empty" : ""}">
          <div class="repo-item-main">
            <a class="repo-name" href="${escapeHtml(r.url)}" ${extAttrs} data-repo-link>${escapeHtml(r.name)}${icon("i-arrow-up")}</a>
            <p>${escapeHtml(r.description || "No description provided in the repository metadata.")}</p>
            <div class="repo-meta">
              ${r.language ? `<span>${escapeHtml(r.language)}</span>` : ""}
              <span>Updated ${escapeHtml(formatDate(r.updatedAt || r.pushedAt))}</span>
              ${r.fork ? '<span>Fork</span>' : ""}
              ${r.archived ? '<span>Archived</span>' : ""}
              ${r.empty ? '<span>Empty repository</span>' : ""}
              ${r.private ? '<span>Private</span>' : ""}
            </div>
          </div>
        </li>`).join("");
    }
    if (repoStatus && status) repoStatus.textContent = status;
  }
  function readCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (raw?.repos?.length && Date.now() - raw.fetchedAt < CACHE_TTL) return raw;
    } catch (e) { /* ignore corrupt cache */ }
    return null;
  }
  function writeCache(repos) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), repos })); }
    catch (e) { /* storage may be unavailable */ }
  }
  async function fetchAllRepos(fetchImpl = fetch) {
    const headers = { Accept: "application/vnd.github+json" };
    const all = [];
    for (let page = 1; page <= 5; page++) {
      const response = await fetchImpl(`${GITHUB.api}?per_page=100&page=${page}`, { headers });
      if (!response?.ok) throw new Error(`GitHub API error ${response?.status || "unknown"}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Unexpected GitHub API response");
      all.push(...data.map(normalizeRepo));
      if (data.length < 100) break;
    }
    return all;
  }
  async function refreshGitHub(options = {}) {
    const fetchImpl = typeof options.fetchImpl === "function" ? options.fetchImpl : fetch;
    if (repoStatus) repoStatus.textContent = "Checking GitHub…";
    try {
      const repos = await fetchAllRepos(fetchImpl);
      if (!repos.length) throw new Error("No public repositories returned");
      writeCache(repos);
      renderRepos(repos, `${repos.length} public repositories synced from GitHub just now.`);
      return { ok: true, count: repos.length, source: "api" };
    } catch (e) {
      renderRepos(REPOS.map(normalizeRepo), `Using the verified local snapshot (${REPOS.length} public repositories) — GitHub sync is unavailable.`);
      return { ok: false, count: REPOS.length, source: "snapshot", error: String(e.message || e) };
    }
  }
  const cachedRepos = readCache();
  if (cachedRepos) {
    renderRepos(cachedRepos.repos, `${cachedRepos.repos.length} public repositories from the local cache. Select refresh for current data.`);
  } else {
    renderRepos(REPOS.map(normalizeRepo), `${REPOS.length} public repositories from the verified GitHub snapshot. Select refresh for current data.`);
  }
  $("#github-refresh")?.addEventListener("click", () => refreshGitHub());

  /* ---------------- Command palette ---------------- */
  const palette = $("#palette");
  const palettePanel = $(".palette-panel", palette);
  const paletteInput = $("#palette-input");
  const paletteList = $("#palette-list");
  const goto = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const commands = [
    { label: "Go to Home", group: "Navigate", icon: "i-arrow", run: () => goto("home") },
    { label: "Go to About", group: "Navigate", icon: "i-arrow", run: () => goto("about") },
    { label: "Go to Skills", group: "Navigate", icon: "i-arrow", run: () => goto("skills") },
    { label: "Go to Projects", group: "Navigate", icon: "i-arrow", run: () => goto("projects") },
    { label: "Go to Experience", group: "Navigate", icon: "i-arrow", run: () => goto("experience") },
    { label: "Go to Education", group: "Navigate", icon: "i-arrow", run: () => goto("education") },
    { label: "Go to Certifications", group: "Navigate", icon: "i-arrow", run: () => goto("certifications") },
    { label: "Go to Contact", group: "Navigate", icon: "i-arrow", run: () => goto("contact") },
    { label: "Toggle theme", group: "Actions", icon: "i-sun", run: () => themeBtn?.click() },
    { label: "Refresh GitHub repositories", group: "Actions", icon: "i-github", run: () => refreshGitHub() }
  ];
  if (P.linkedin) commands.push({ label: "Open LinkedIn", group: "Links", icon: "i-linkedin", run: () => window.open(P.linkedin, "_blank", "noopener") });
  if (P.github) commands.push({ label: "Open GitHub", group: "Links", icon: "i-github", run: () => window.open(P.github, "_blank", "noopener") });
  if (P.email) commands.push({ label: "Copy email address", group: "Actions", icon: "i-copy", run: copyEmail });

  let filtered = [];
  let activeIndex = 0;
  function renderPalette(query = "") {
    const q = query.trim().toLowerCase();
    filtered = commands.filter((c) => !q || c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    activeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));
    if (!filtered.length) {
      paletteList.innerHTML = `<p class="palette-empty">No matching commands.</p>`;
      return;
    }
    let html = "";
    let group = "";
    filtered.forEach((c, i) => {
      if (c.group !== group) {
        group = c.group;
        html += `<div class="palette-group">${escapeHtml(group)}</div>`;
      }
      html += `<button class="palette-item${i === activeIndex ? " is-active" : ""}" type="button" role="option" aria-selected="${i === activeIndex}" data-index="${i}">${icon(c.icon)}<span>${escapeHtml(c.label)}</span><small>${escapeHtml(c.group)}</small></button>`;
    });
    paletteList.innerHTML = html;
    const active = $(".palette-item.is-active", paletteList);
    active?.scrollIntoView({ block: "nearest" });
  }
  function openPalette() {
    if (!palette) return;
    palette.hidden = false;
    updateScrollLock();
    activeIndex = 0;
    if (paletteInput) { paletteInput.value = ""; paletteInput.focus(); }
    renderPalette();
  }
  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    updateScrollLock();
    $("#command-open")?.focus();
  }
  function runCommand(index) {
    const cmd = filtered[index];
    if (!cmd) return;
    closePalette();
    cmd.run();
  }
  $("#command-open")?.addEventListener("click", openPalette);
  palette?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-palette]")) return closePalette();
    const item = e.target.closest(".palette-item");
    if (item) runCommand(Number(item.dataset.index));
  });
  paletteInput?.addEventListener("input", () => { activeIndex = 0; renderPalette(paletteInput.value); });
  palette?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closePalette(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); renderPalette(paletteInput.value); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); renderPalette(paletteInput.value); return; }
    if (e.key === "Enter") { e.preventDefault(); runCommand(activeIndex); return; }
    trapFocus(e, palettePanel);
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (palette.hidden) openPalette(); else closePalette();
    }
  });

  /* ---------------- Contact form: validated, real submission ---------------- */
  const form = $("#contact-form");
  const formNote = $("#form-note");
  const submitBtn = $("#contact-submit");
  const retryBtn = $("#contact-retry");
  const successPanel = $("#contact-success");
  const successMessage = $("#contact-success-message");
  const anotherBtn = $("#contact-another");
  const messageCount = $("#contact-message-count");
  const contactFields = {
    name: $("#contact-name"),
    email: $("#contact-email"),
    subject: $("#contact-subject"),
    message: $("#contact-message")
  };
  const websiteField = $("#contact-website");
  const CONTACT_RULES = {
    name: { max: 100, label: "Full Name", check: (v) => (v ? "" : "Please enter your full name.") },
    email: {
      max: 254,
      label: "Email",
      check: (v) => (!v ? "Please enter your email address." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "Please enter a valid email address." : "")
    },
    subject: { max: 200, label: "Subject", check: (v) => (v ? "" : "Please enter a subject.") },
    message: {
      max: 5000,
      min: 10,
      label: "Message",
      check: (v) => (!v ? "Please enter a message." : v.length < 10 ? "Please write at least 10 characters." : v.length > 5000 ? "Please keep your message under 5000 characters." : "")
    }
  };
  let contactSubmitting = false;
  let lastDeliveryStatus = "idle";
  let currentSubmissionId = null;

  function newSubmissionId() {
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  function setNote(text, type = "") {
    if (!formNote) return;
    formNote.textContent = text || "";
    formNote.classList.toggle("is-error", type === "error");
    formNote.classList.toggle("is-success", type === "success");
  }

  function setContactError(key, text) {
    const field = contactFields[key];
    const error = document.getElementById(`contact-${key}-error`);
    const invalid = Boolean(text);
    if (field) {
      field.classList.toggle("is-invalid", invalid);
      if (invalid) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }
    if (error) error.textContent = text || "";
  }

  function updateMessageCount() {
    if (!messageCount || !contactFields.message) return;
    const count = contactFields.message.value.length;
    messageCount.textContent = `${count} / 5000`;
    messageCount.classList.toggle("is-near", count > 4500);
  }

  function validateContact() {
    let valid = true;
    let firstInvalid = null;
    Object.keys(CONTACT_RULES).forEach((key) => {
      const rule = CONTACT_RULES[key];
      const raw = contactFields[key]?.value || "";
      const value = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
      let error = rule.check(value);
      if (!error && value.length > rule.max) error = `${rule.label} must be at most ${rule.max} characters.`;
      setContactError(key, error);
      if (error) {
        valid = false;
        if (!firstInvalid) firstInvalid = contactFields[key];
      }
    });
    if (!valid) firstInvalid?.focus();
    return valid;
  }

  function setContactSending(active) {
    contactSubmitting = active;
    form?.setAttribute("aria-busy", active ? "true" : "false");
    form?.classList.toggle("is-sending", active);
    if (submitBtn) submitBtn.disabled = active;
    if (retryBtn) retryBtn.disabled = active;
    const label = submitBtn?.querySelector(".btn-label");
    if (label) label.textContent = active ? "Sending..." : "Send message";
  }

  function clearContactFields() {
    Object.values(contactFields).forEach((field) => { if (field) field.value = ""; });
    if (websiteField) websiteField.value = "";
    Object.keys(CONTACT_RULES).forEach((key) => setContactError(key, ""));
    updateMessageCount();
  }

  function showContactSuccess() {
    clearContactFields();
    setNote("");
    currentSubmissionId = null;
    if (form) form.hidden = true;
    if (successPanel) {
      successPanel.hidden = false;
      successPanel.classList.remove("is-visible");
      void successPanel.offsetWidth;
      successPanel.classList.add("is-visible");
    }
    successMessage?.focus({ preventScroll: true });
    successPanel?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }

  function resetContact() {
    form?.reset();
    clearContactFields();
    lastDeliveryStatus = "idle";
    currentSubmissionId = null;
    if (form) form.hidden = false;
    if (successPanel) {
      successPanel.hidden = true;
      successPanel.classList.remove("is-visible");
    }
    if (retryBtn) retryBtn.hidden = true;
    setNote("");
    contactFields.name?.focus({ preventScroll: true });
  }

  async function submitContact() {
    if (contactSubmitting || !form) return;
    if (!validateContact()) {
      setNote("Please complete all fields with a valid email and a message of at least 10 characters. Nothing was sent.", "error");
      return;
    }
    if (!currentSubmissionId) currentSubmissionId = newSubmissionId();
    const payload = {
      submissionId: currentSubmissionId,
      name: contactFields.name.value.trim(),
      email: contactFields.email.value.trim(),
      subject: contactFields.subject.value.trim(),
      message: contactFields.message.value.trim(),
      website: websiteField?.value || ""
    };
    setContactSending(true);
    setNote("Sending your message…");
    if (retryBtn) retryBtn.hidden = true;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      let data = {};
      try { data = await response.json(); } catch (err) { data = {}; }
      if (!response.ok || !data.ok) throw new Error(data.error || `The server returned ${response.status}.`);
      lastDeliveryStatus = data.emailStatus || "unknown";
      showContactSuccess();
    } catch (err) {
      lastDeliveryStatus = "failed";
      const reason = err.message ? ` ${err.message}` : "";
      setNote(`Your message could not be sent.${reason} Your details are still here — please try again.`, "error");
      if (retryBtn) retryBtn.hidden = false;
      retryBtn?.focus({ preventScroll: true });
    } finally {
      setContactSending(false);
    }
  }

  form?.addEventListener("submit", (e) => { e.preventDefault(); submitContact(); });
  retryBtn?.addEventListener("click", () => submitContact());
  anotherBtn?.addEventListener("click", resetContact);
  Object.keys(CONTACT_RULES).forEach((key) => {
    contactFields[key]?.addEventListener("input", () => {
      if (contactFields[key].classList.contains("is-invalid") && !CONTACT_RULES[key].check(contactFields[key].value.trim())) {
        setContactError(key, "");
      }
    });
  });
  contactFields.message?.addEventListener("input", updateMessageCount);
  updateMessageCount();

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------- Scroll-driven certification stack ---------------- */
  const certTrack = $("#cert-stack-track");
  const certCards = $$("[data-cert-card]");
  const certStatus = $("#cert-status");
  const certBar = $("#cert-progress-bar");
  const certMobile = window.matchMedia("(max-width: 700px)");
  let certVisible = false;
  let certActive = 0;
  let certProgress = 0;
  let certScrollQueued = false;
  const certStackEnabled = () => Boolean(certTrack && certCards.length > 1 && !reduced && !certMobile.matches);

  function updateCertStack() {
    certScrollQueued = false;
    if (!certStackEnabled()) {
      certProgress = 0;
      certActive = 0;
      if (certStatus) certStatus.textContent = `All ${certCards.length} certificates available`;
      return;
    }
    const rect = certTrack.getBoundingClientRect();
    const total = Math.max(1, certTrack.offsetHeight - window.innerHeight);
    certProgress = Math.max(0, Math.min(1, -rect.top / total));
    const position = certProgress * (certCards.length - 1);
    certActive = Math.min(certCards.length - 1, Math.round(position));

    certCards.forEach((card, i) => {
      const relative = i - position;
      const abs = Math.abs(relative);
      const capped = Math.min(abs, 3);
      const active = i === certActive;
      const scale = 1 - capped * 0.045;
      const offset = Math.max(-44, Math.min(44, relative * 20));
      const veil = active ? 0 : abs < 1.5 ? 0.42 : 0.66;
      card.style.setProperty("--cert-y", `${offset.toFixed(1)}px`);
      card.style.setProperty("--cert-z", `${(-capped * 90).toFixed(1)}px`);
      card.style.setProperty("--cert-scale", scale.toFixed(3));
      card.style.setProperty("--cert-rx", `${(relative * -2.2).toFixed(2)}deg`);
      card.style.setProperty("--cert-ry", `${(relative * 1.2).toFixed(2)}deg`);
      card.style.setProperty("--cert-opacity", "1");
      card.style.setProperty("--cert-veil", veil.toFixed(2));
      card.style.zIndex = String(100 - Math.round(capped * 10));
      card.classList.toggle("is-active", active);
      if (active) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
      card.tabIndex = active ? 0 : -1;
    });
    if (certStatus) certStatus.textContent = `Certificate ${certActive + 1} of ${certCards.length}`;
    if (certBar) certBar.style.setProperty("--cert-progress", certProgress.toFixed(3));
  }

  function goToCert(index) {
    if (!certCards.length) return;
    const target = Math.max(0, Math.min(certCards.length - 1, index));
    if (!certStackEnabled()) {
      certCards[target].scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      return;
    }
    const rect = certTrack.getBoundingClientRect();
    const total = Math.max(1, certTrack.offsetHeight - window.innerHeight);
    const top = window.scrollY + rect.top + (target / Math.max(1, certCards.length - 1)) * total;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }

  if (certTrack) {
    certCards.forEach((card, i) => card.addEventListener("focus", () => goToCert(i)));
    $("[data-cert-prev]")?.addEventListener("click", () => goToCert(certActive - 1));
    $("[data-cert-next]")?.addEventListener("click", () => goToCert(certActive + 1));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        certVisible = entries[0].isIntersecting;
        if (certVisible) updateCertStack();
      }, { rootMargin: "100px" }).observe(certTrack);
    } else {
      certVisible = true;
    }
    window.addEventListener("scroll", () => {
      if (!certStackEnabled() || !certVisible || certScrollQueued) return;
      certScrollQueued = true;
      requestAnimationFrame(updateCertStack);
    }, { passive: true });
    window.addEventListener("resize", updateCertStack, { passive: true });
    if (certMobile.addEventListener) certMobile.addEventListener("change", updateCertStack);
    updateCertStack();
  }

  /* ---------------- Debug surface for the smoke suite ---------------- */
  window.__portfolioDebug = {
    refreshGitHub,
    getCatalog: () => ({
      projects: PROJECTS.map((p) => ({ id: p.id, repo: p.repo, title: p.title })),
      repos: REPOS.map(normalizeRepo),
      linkedin: P.linkedin,
      github: P.github
    }),
    getLoader: () => ({ done: loaderDone, reason: loader?.dataset.reason || "none" }),
    getCursor: () => ({ enabled: Boolean(cursorEnabled), fine: finePointer.matches, reduced }),
    getSkills: () => ({
      spheres: sphereElements.length,
      labels: sphereElements.map((el) => el.dataset.skillName),
      interactive: physicsEnabled,
      visible: skillVisible,
      paused: Boolean(techUniverse?.classList.contains("is-paused")),
      firstOffset: sphereElements[0]?.style.getPropertyValue("--dx") || "0px"
    }),
    getEducation: () => ({
      cards: $$("[data-flip-card]").length,
      flipped: $$("[data-flip-card].is-flipped").length,
      images: $$("[data-flip-card] .edu-photo").map((img) => ({ src: img.getAttribute("src"), loaded: img.complete && img.naturalWidth > 0 }))
    }),
    getExperience: () => ({
      ambient: Boolean(experienceAmbient),
      particles: $$(".ambient-particle", experienceAmbient || document).length,
      networkPaths: $$(".ambient-network path", experienceAmbient || document).length,
      paused: Boolean(experienceAmbient?.classList.contains("is-paused")),
      progress: parseFloat(timeline?.style.getPropertyValue("--timeline-progress") || "0")
    }),
    getCertifications: () => ({
      cards: certCards.length,
      active: certActive,
      progress: certProgress,
      stacked: certStackEnabled(),
      visible: certVisible,
      status: certStatus?.textContent || "",
      veils: certCards.map((card) => parseFloat(card.style.getPropertyValue("--cert-veil") || "0")),
      images: certCards.map((card) => {
        const img = $("img", card);
        return { src: img?.getAttribute("src") || "", loaded: Boolean(img?.complete && img.naturalWidth > 0) };
      })
    }),
    getBackgrounds: () => ({
      sections: $$("[data-atmosphere]").length,
      pausedSections: $$("[data-atmosphere].is-paused").length,
      ambientLayers: $$("[data-ambient]").length,
      aboutPaused: Boolean($("#about-ambient")?.classList.contains("is-paused")),
      experiencePaused: Boolean(experienceAmbient?.classList.contains("is-paused"))
    }),
    getContact: () => ({
      sending: contactSubmitting,
      fields: Object.keys(contactFields).length,
      errors: $$("#contact-form .field-error").filter((el) => el.textContent.trim()).length,
      note: formNote?.textContent || "",
      noteType: formNote?.className || "",
      buttonText: submitBtn?.querySelector(".btn-label")?.textContent || "",
      values: Object.keys(contactFields).reduce((acc, key) => { acc[key] = contactFields[key]?.value || ""; return acc; }, {}),
      deliveryStatus: lastDeliveryStatus,
      successNote: "",
      submissionId: currentSubmissionId || "",
      formHidden: Boolean(form?.hidden),
      confirmationVisible: Boolean(successPanel && !successPanel.hidden),
      confirmation: successMessage?.textContent || "",
      retryVisible: Boolean(retryBtn && !retryBtn.hidden)
    }),
    finishLoader
  };

  /* ---------------- Reveal on scroll (after dynamic content exists) ---------------- */
  const revealItems = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-in"));
  }
})();
