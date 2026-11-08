// Sample cards: before/after toggle (buttons, hover on desktop), videos load and play only while visible.
(function () {
  const cards = document.querySelectorAll(".sample .smedia");
  const set = (m, v) => {
    m.dataset.state = v;
    m.querySelectorAll(".seg button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  };
  cards.forEach(m => {
    m.querySelector(".seg").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { m.dataset.pinned = "1"; set(m, b.dataset.v); } });
    if (matchMedia("(hover: hover)").matches) {
      m.addEventListener("mouseenter", () => { if (!m.dataset.pinned) set(m, "after"); });
      m.addEventListener("mouseleave", () => { if (!m.dataset.pinned) set(m, "before"); });
    }
  });
  const io = new IntersectionObserver(es => es.forEach(en => {
    const vs = en.target.querySelectorAll("video");
    if (en.isIntersecting) {
      vs.forEach(v => { if (v.preload === "none") { v.preload = "auto"; v.load(); } });
      Promise.all([...vs].map(v => v.play().catch(() => {}))).then(() => { vs[1].currentTime = vs[0].currentTime; });
    } else vs.forEach(v => v.pause());
  }), { rootMargin: "100px" });
  cards.forEach(m => io.observe(m));
  setInterval(() => cards.forEach(m => { const [b, a] = m.querySelectorAll("video");
    if (!b.paused && Math.abs(a.currentTime - b.currentTime) > 0.1) a.currentTime = b.currentTime; }), 600);
})();

// Scale calculator: real thickness at 1:N -> printed thickness against 0.45 mm (detail) and 0.8 mm (wall).
(function () {
  const box = document.querySelector(".calc"); if (!box) return;
  const msgs = JSON.parse(box.dataset.msgs), real = document.getElementById("c-real"), n = document.getElementById("c-n");
  const out = document.getElementById("c-out"), bar = document.getElementById("c-bar"), msg = document.getElementById("c-msg");
  function upd() {
    const t = (+real.value || 0) / Math.max(1, +n.value || 1);
    out.textContent = (t >= 10 ? t.toFixed(1) : t >= 1 ? t.toFixed(2) : t.toFixed(3)) + " mm";
    const k = t >= 0.8 ? 0 : t >= 0.45 ? 1 : 2, col = ["var(--ok)", "#d97706", "var(--bad)"][k];
    bar.style.width = Math.min(100, t / 2 * 100) + "%"; bar.style.background = col;
    msg.textContent = msgs[k]; msg.style.color = col;
  }
  real.addEventListener("input", upd); n.addEventListener("input", upd); upd();
})();

// Drag-to-compare sliders (.ba[data-ba]:not(.auto)) and keeping before/after videos in step.
(function () {
  document.querySelectorAll(".ba[data-ba]").forEach(el => {
    const [b, a] = el.querySelectorAll("video");
    setInterval(() => { if (!b.paused && !a.paused && Math.abs(a.currentTime - b.currentTime) > 0.08) a.currentTime = b.currentTime; }, 500);
    if (el.classList.contains("auto")) return;
    const set = x => { const r = el.getBoundingClientRect(); el.style.setProperty("--cut", Math.min(100, Math.max(0, (x - r.left) / r.width * 100)) + "%"); };
    let drag = false;
    el.addEventListener("pointerdown", e => { drag = true; el.setPointerCapture(e.pointerId); set(e.clientX); });
    el.addEventListener("pointermove", e => drag && set(e.clientX));
    el.addEventListener("pointerup", () => drag = false);
    el.addEventListener("pointercancel", () => drag = false);
  });
})();

// Showcase: tabs swap the building; videos load when the section comes into view.
(function () {
  const sec = document.getElementById("showcase"); if (!sec) return;
  const pre = document.documentElement.lang === "ko" ? "../" : "";
  const [b, a] = sec.querySelectorAll(".ba video"), meta = document.getElementById("showmeta");
  const labels = JSON.parse(meta.dataset.labels);
  let started = false;
  function pick(tab) {
    sec.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t === tab));
    const id = tab.dataset.id;
    b.poster = `${pre}samples/${id}/before.jpg`; a.poster = `${pre}samples/${id}/after.jpg`;
    if (started) { b.src = `${pre}samples/${id}/before.mp4`; a.src = `${pre}samples/${id}/after.mp4`;
      Promise.all([b.play().catch(() => {}), a.play().catch(() => {})]); }
    meta.innerHTML = JSON.parse(tab.dataset.meta).map((v, i) => `<div><span>${labels[i]}</span><b>${v}</b></div>`).join("");
  }
  sec.querySelector(".tabs").addEventListener("click", e => { const t = e.target.closest(".tab"); if (t) pick(t); });
  pick(sec.querySelector(".tab.on"));
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { started = true; pick(sec.querySelector(".tab.on")); io.disconnect(); } },
    { rootMargin: "200px" }).observe(sec);
})();

// Reveal on scroll + count-up for the stats.
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = document.querySelectorAll(".shead, .step, .ecard, .sample, .use, .stat, .calc, .ctable, .faq, .cta");
  els.forEach(el => el.classList.add("rv"));
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, sib = [...el.parentElement.children].indexOf(el);
    el.style.transitionDelay = Math.min(sib, 6) * 70 + "ms"; el.classList.add("in"); io.unobserve(el);
    setTimeout(() => { el.style.transitionDelay = ""; el.classList.remove("rv", "in"); }, 1200);
    const b = el.matches(".stat") && el.querySelector("b");
    if (b) {
      const m = b.textContent.match(/^([\d,.]+)(.*)$/); if (!m) return;
      const target = parseFloat(m[1].replace(/,/g, "")), dec = (m[1].split(".")[1] || "").length, t0 = performance.now();
      const step = t => { const k = Math.min(1, (t - t0) / 1100), v = target * (1 - Math.pow(1 - k, 3));
        b.textContent = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[2];
        if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }), { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

// Slice comparison: Cura G-code before/after, drawn layer by layer (3D stack or one layer from above).
(function () {
  const sec = document.getElementById("slicer"); if (!sec) return;
  const pre = document.documentElement.lang === "ko" ? "../" : "";
  const ko = document.documentElement.lang === "ko";
  const cv = { before: document.getElementById("sl-b"), after: document.getElementById("sl-a") };
  const range = document.getElementById("sl-r"), cap = document.getElementById("sl-cap"), stats = document.getElementById("sl-stats");
  const labels = JSON.parse(stats.dataset.labels), COL = ["#ff7a45", "#5b93ff", "#2fbf88"];
  let D = null, mode = "iso", theta = -0.6, anim = 0, token = 0, seen = false;
  const E = 0.62, sinE = Math.sin(E), cosE = Math.cos(E);

  async function load(id) {
    const my = ++token; sec.classList.add("loading");
    const [meta, b, a] = await Promise.all([fetch(`${pre}samples/${id}/slice.json`).then(r => r.json()),
      ...["before", "after"].map(n => fetch(`${pre}samples/${id}/slice_${n}.bin`).then(r => r.arrayBuffer()).then(x => new Int16Array(x)))]);
    if (my !== token) return;
    D = { meta, pts: { before: b, after: a } }; sec.classList.remove("loading");
    const s = meta.stats, f = v => v.toLocaleString("en-US", { maximumFractionDigits: 1 });
    const row = k => `${f(s.before[k])} → ${f(s.after[k])} m`;
    stats.innerHTML = [row("wall_m"), row("skin_m"), row("fill_m"),
      `${s.short_layers.toLocaleString("en-US")} / ${s.compared_layers.toLocaleString("en-US")}${ko ? "층" : ""}`]
      .map((v, i) => `<div><span>${labels[i]}</span><b>${v}</b></div>`).join("");
    play();
  }

  function size(c) {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return [w, h, dpr];
  }

  function draw() {
    if (!D) return;
    const m = D.meta, [x0, y0, x1, y1] = m.bounds, q = m.q, zcut = m.zmax * range.value / 1000;
    const cx = (x1 - x0) / 2, cy = (y1 - y0) / 2, ct = Math.cos(theta), st = Math.sin(theta);
    for (const nm of ["before", "after"]) {
      const c = cv[nm], [W, H, dpr] = size(c), g = c.getContext("2d"), P = D.pts[nm], L = m.layers[nm];
      g.clearRect(0, 0, W, H); g.lineJoin = "round";
      let top = 0;
      L.forEach((l, i) => { if (l && l.z <= zcut + 1e-6) top = i; });
      c.parentElement.querySelector(".slz").textContent = L[top] ? `z ${L[top].z.toFixed(1)} mm` : "";
      if (mode === "top") {
        const k = Math.min((W - 24 * dpr) / (x1 - x0), (H - 24 * dpr) / (y1 - y0));
        const ox = (W - k * (x1 - x0)) / 2, oy = (H + k * (y1 - y0)) / 2, l = L[top];
        if (!l) continue;
        g.globalAlpha = 1; g.lineWidth = 1.2 * dpr;
        for (const [grp, off, n] of l.p) {
          g.strokeStyle = COL[grp]; g.beginPath();
          for (let j = 0; j < n; j++) {
            const X = ox + P[(off + j) * 2] * q * k, Y = oy - P[(off + j) * 2 + 1] * q * k;
            j ? g.lineTo(X, Y) : g.moveTo(X, Y);
          }
          g.stroke();
        }
        continue;
      }
      // fit the turned bounding box (full height) into the canvas
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
      for (const [px, py] of [[0, 0], [x1 - x0, 0], [0, y1 - y0], [x1 - x0, y1 - y0]]) for (const pz of [0, m.zmax]) {
        const xr = (px - cx) * ct - (py - cy) * st, yr = (px - cx) * st + (py - cy) * ct, sy = -yr * sinE - pz * cosE;
        mnx = Math.min(mnx, xr); mxx = Math.max(mxx, xr); mny = Math.min(mny, sy); mxy = Math.max(mxy, sy);
      }
      const k = Math.min((W - 20 * dpr) / (mxx - mnx), (H - 36 * dpr) / (mxy - mny));
      const ox = W / 2 - k * (mxx + mnx) / 2, oy = H / 2 + 8 * dpr - k * (mxy + mny) / 2;
      const a = q * ct * k, b = q * st * k, ccx = cx / q, ccy = cy / q;
      for (let i = 0; i <= top; i++) {
        const l = L[i]; if (!l) continue;
        const isTop = i === top, zz = -l.z * cosE * k;
        g.globalAlpha = isTop ? 1 : 0.25 + 0.45 * (i / Math.max(1, top)); g.lineWidth = (isTop ? 1.5 : 0.8) * dpr;
        for (const [grp, off, n] of l.p) {
          g.strokeStyle = COL[grp]; g.beginPath();
          for (let j = 0; j < n; j++) {
            const px = P[(off + j) * 2] - ccx, py = P[(off + j) * 2 + 1] - ccy;
            const X = ox + px * a - py * b, Y = oy - (px * b + py * a) * sinE + zz;
            j ? g.lineTo(X, Y) : g.moveTo(X, Y);
          }
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    }
  }
  let raf = 0;
  const redraw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };

  function play() {
    cancelAnimationFrame(anim);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { range.value = 1000; draw(); return; }
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 2600); range.value = Math.round(1000 * (1 - Math.pow(1 - k, 2))); draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function pick(tab) {
    sec.querySelectorAll(".stab").forEach(t => t.classList.toggle("on", t === tab));
    cap.textContent = tab.dataset.cap; if (seen) load(tab.dataset.id);
  }
  sec.querySelector(".stabs").addEventListener("click", e => { const t = e.target.closest(".stab"); if (t) pick(t); });
  range.addEventListener("input", () => { cancelAnimationFrame(anim); redraw(); });
  document.getElementById("sl-play").addEventListener("click", () => { if (mode === "top") range.value = 0; play(); });
  sec.querySelector(".slmode").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    mode = b.dataset.m; sec.querySelectorAll(".slmode button").forEach(x => x.classList.toggle("on", x === b));
    cancelAnimationFrame(anim);
    if (mode === "top" && +range.value > 900) range.value = 300;
    redraw();
  });
  // drag either view to turn the 3D stack
  Object.values(cv).forEach(c => {
    let x = null;
    c.addEventListener("pointerdown", e => { if (mode !== "iso") return; x = e.clientX; c.setPointerCapture(e.pointerId); });
    c.addEventListener("pointermove", e => { if (x === null) return; theta += (e.clientX - x) * 0.01; x = e.clientX; redraw(); });
    c.addEventListener("pointerup", () => x = null); c.addEventListener("pointercancel", () => x = null);
  });
  addEventListener("resize", redraw);
  pick(sec.querySelector(".stab.on"));
  new IntersectionObserver((es, io) => {
    if (es[0].isIntersecting) { seen = true; load(sec.querySelector(".stab.on").dataset.id); io.disconnect(); }
  }, { rootMargin: "150px" }).observe(sec);
})();
