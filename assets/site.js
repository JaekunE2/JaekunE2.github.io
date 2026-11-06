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
