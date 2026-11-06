// before/after slider: two looping videos, the "after" one clipped from the handle to the right
function slider(el) {
  const [b, a] = el.querySelectorAll("video");
  const set = x => { const r = el.getBoundingClientRect();
    el.style.setProperty("--cut", Math.min(100, Math.max(0, (x - r.left) / r.width * 100)) + "%"); };
  let drag = false;
  el.addEventListener("pointerdown", e => { drag = true; el.setPointerCapture(e.pointerId); set(e.clientX); });
  el.addEventListener("pointermove", e => drag && set(e.clientX));
  el.addEventListener("pointerup", () => drag = false);
  const start = () => { b.currentTime = 0; a.currentTime = 0; b.play(); a.play(); };
  let ready = 0;
  [b, a].forEach(v => v.addEventListener("canplay", () => ++ready === 2 && start(), { once: true }));
  setInterval(() => { if (Math.abs(a.currentTime - b.currentTime) > 0.08) a.currentTime = b.currentTime; }, 500);
}
document.querySelectorAll(".ba").forEach(slider);
