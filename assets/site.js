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
