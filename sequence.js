/*
 * Cinematic 238-frame sequence engine — now the Hero centerpiece.
 * The original frame paths, cover scaling and damped scroll progression are
 * preserved. Rendering uses a DPR-aware backing store sized to the canvas CSS
 * box, high-quality smoothing, and a bounded ImageBitmap cache so all 238
 * frames are never decoded into memory at once.
 */
(() => {
  const section = document.getElementById("home");
  const canvas = document.getElementById("sequence-canvas");
  const counter = document.getElementById("sequence-counter");
  const meter = document.getElementById("sequence-meter");
  const frameLabel = document.getElementById("sequence-frame-label");
  if (!section || !canvas) return;

  const TOTAL_FRAMES = 238;
  const CACHE_LIMIT = 20;
  const DAMPING = 12;
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsBitmap = typeof window.createImageBitmap === "function";

  const cache = new Map();
  const pending = new Map();

  let dpr = 1;
  let targetProgress = 0;
  let currentProgress = 0;
  let lastDrawnIndex = -1;
  let lastTime = performance.now();
  let active = true;
  let needsRedraw = true;
  let failedLoads = 0;

  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
  const pad = (n) => String(n).padStart(3, "0");
  const frameUrl = (i) => `frames/ezgif-frame-${pad(i + 1)}.jpg`;

  function dimensions(img) {
    return {
      w: img.width || img.naturalWidth || 0,
      h: img.height || img.naturalHeight || 0
    };
  }

  function loadFrame(index) {
    if (index < 0 || index >= TOTAL_FRAMES || cache.has(index) || pending.has(index)) return;

    let task;
    if (supportsBitmap) {
      task = fetch(frameUrl(index))
        .then((r) => {
          if (!r.ok) throw new Error(`frame ${index} request failed`);
          return r.blob();
        })
        .then((blob) => createImageBitmap(blob, { imageOrientation: "from-image" }))
        .catch(() => loadAsImage(index));
    } else {
      task = loadAsImage(index);
    }

    pending.set(index, task);
    task.then((img) => {
      if (!img) throw new Error("empty frame");
      cache.set(index, img);
      pending.delete(index);
      trimCache(index);
      needsRedraw = true;
    }).catch(() => {
      pending.delete(index);
      failedLoads++;
    });
  }

  /* Fallback for file:// usage or browsers without createImageBitmap. */
  function loadAsImage(index) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = frameUrl(index);
    });
  }

  function trimCache(protect) {
    while (cache.size > CACHE_LIMIT) {
      let victim = null;
      for (const key of cache.keys()) {
        if (Math.abs(key - protect) > 3) { victim = key; break; }
      }
      if (victim === null) victim = cache.keys().next().value;
      const img = cache.get(victim);
      if (img && typeof img.close === "function") img.close();
      cache.delete(victim);
    }
  }

  function nearestLoaded(index) {
    if (cache.has(index)) return index;
    let best = -1;
    let distance = Infinity;
    for (const key of cache.keys()) {
      const d = Math.abs(key - index);
      if (d < distance) { distance = d; best = key; }
    }
    return best;
  }

  function ensureWindow(index) {
    [index, index + 1, index + 2, index + 3, index - 1, index - 2].forEach((i) => loadFrame(i));
  }

  function resizeCanvas() {
    // Cap DPR at 2: beyond that the 720p source has no extra detail to show,
    // and larger backing stores waste memory.
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width || canvas.clientWidth);
    const cssHeight = Math.max(1, rect.height || canvas.clientHeight);
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      lastDrawnIndex = -1;
      needsRedraw = true;
    }
    updateTarget();
  }

  function render(index) {
    const img = cache.get(index);
    if (!img) return;
    const src = dimensions(img);
    if (!src.w || !src.h) return;

    const cw = canvas.width;
    const ch = canvas.height;
    // Cover scaling keeps the source aspect ratio; only the overflowing axis
    // is cropped. No destination-size stretching.
    const ratio = Math.max(cw / src.w, ch / src.h);
    const rw = src.w * ratio;
    const rh = src.h * ratio;
    const ox = (cw - rw) / 2;
    const oy = (ch - rh) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, src.w, src.h, ox, oy, rw, rh);
    lastDrawnIndex = index;
    needsRedraw = false;
  }

  function updateTarget() {
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - window.innerHeight);
    targetProgress = clamp01(-rect.top / travel);
  }

  function updateOverlay(index) {
    const percent = Math.round(currentProgress * 100);
    if (counter) counter.textContent = `${pad(percent)}%`;
    if (meter) meter.style.transform = `scaleX(${currentProgress})`;
    if (frameLabel) frameLabel.textContent = `${pad(index + 1)} / ${TOTAL_FRAMES}`;
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Zoom / DPR changes can happen without a resize event in some browsers.
    if (Math.min(window.devicePixelRatio || 1, 2) !== dpr) resizeCanvas();

    if (active) {
      updateTarget();
      const diff = targetProgress - currentProgress;
      if (reducedMotion || Math.abs(diff) <= 0.00002) currentProgress = targetProgress;
      else currentProgress += diff * (1 - Math.exp(-DAMPING * dt));

      const targetIndex = Math.round(currentProgress * (TOTAL_FRAMES - 1));
      ensureWindow(targetIndex);
      const drawIndex = nearestLoaded(targetIndex);
      if (drawIndex >= 0 && (drawIndex !== lastDrawnIndex || needsRedraw)) render(drawIndex);
      updateOverlay(drawIndex >= 0 ? drawIndex : targetIndex);
    }
    requestAnimationFrame(loop);
  }

  const visibility = new IntersectionObserver((entries) => {
    active = entries[0].isIntersecting && !document.hidden;
    if (active) {
      lastTime = performance.now();
      ensureWindow(Math.round(currentProgress * (TOTAL_FRAMES - 1)));
    }
  }, { rootMargin: "160px 0px" });
  visibility.observe(section);

  document.addEventListener("visibilitychange", () => {
    active = !document.hidden && section.getBoundingClientRect().bottom > 0;
    lastTime = performance.now();
  });

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("load", resizeCanvas, { once: true });
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(canvas);

  // Paint the opening frame immediately, then keep a small rolling window.
  loadFrame(0);
  ensureWindow(0);
  resizeCanvas();
  updateOverlay(0);
  requestAnimationFrame(loop);

  window.__sequence = {
    getProgress: () => currentProgress,
    getCanvasInfo: () => ({
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.getBoundingClientRect().width,
      cssHeight: canvas.getBoundingClientRect().height,
      dpr,
      totalFrames: TOTAL_FRAMES,
      cached: cache.size,
      pending: pending.size,
      lastDrawnIndex,
      failedLoads,
      sourceWidth: 1280,
      sourceHeight: 720
    })
  };
})();
