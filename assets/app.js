// Tool: drop a .skp / mesh (or pick an open sample) -> free in-browser check + preview with problem edges ->
// print scale 1:N -> "Convert & repair" uploads it -> the server repairs it -> before/after 3D, downloads.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";
import { merge, check } from "./meshcheck.js";

const KO = document.documentElement.lang === "ko";
const PRE = KO ? "../" : "";
const T = KO ? {
  checking: "브라우저에서 점검 중… (아직 업로드하지 않았습니다)", nolocal: "이 형식은 브라우저 점검을 건너뜁니다. 변환·수리는 그대로 됩니다.",
  ok: "출력 가능", bad: "수리 필요", queued: "대기 중", ahead: n => `앞에 ${n}건`,
  running: "처리 중", done: "완료", failed: "실패", printableAfter: "출력 가능 · 열린·논매니폴드 엣지 0",
  notprint: "아직 문제가 남아 있습니다", dl: "내려받기", loading: "3D 불러오는 중…",
  open: "열린 엣지(구멍)", nonman: "논매니폴드 엣지", flipped: "뒤집힌 면",
  degen: "넓이 0인 면", shells: "조각(쉘)", size: "출력 크기", volume: "부피", faces: "면 수", watertight: "닫힌 솔리드",
  yes: "예", no: "아니요", before: "수정 전", after: "수정 후", badEdges: "빨간 선 = 열린·논매니폴드 엣지",
  agentLeft: n => `에이전트 처리 오늘 ${n}건 남음`, agentOff: "에이전트: 쉬는 중 (요청 문장 없이 자동 수리)",
  down: "처리 서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.", keep: h => `파일은 ${h}시간 뒤 자동 삭제`,
  limit: (mb, n) => `최대 ${mb} MB · 시간당 ${n}건`, needConsent: "동의에 체크해 주세요", needFile: "먼저 파일을 고르세요",
  stats: (b, a) => `엣지 오류 ${b} → ${a}`, afterOk: "수정 후 출력 가능",
  skpOn: n => `SketchUp 변환기 켜짐 · 오늘 ${n}건 남음`, skpOff: "SketchUp 변환기 쉬는 중: SketchUp에서 STL로 내보내 올려 주세요",
  skpFile: "SketchUp 파일은 브라우저에서 미리 볼 수 없어, 서버의 격리 환경에서 변환한 뒤 수정 전·후를 함께 보여 드립니다.",
  skpOffFile: "지금은 SketchUp 변환기가 쉬고 있습니다. SketchUp에서 파일 > 내보내기 > 3D 모델 > STL(mm)로 내보내 올려 주세요.",
  printSize: (s, n) => `출력 크기 <b>${s}</b> mm${n}`, big: " · 일반 베드(256 mm)보다 큼", small: " · 매우 작음",
  unitNote: "단위 mm 가정", sample: n => `공개 샘플 (갤러리 축척 1:${n})`, loadingSample: "샘플 불러오는 중…", mm: "mm",
} : {
  checking: "Checking in your browser… (nothing uploaded yet)", nolocal: "No in-browser check for this format; conversion and repair still work.",
  ok: "Print-ready", bad: "Needs repair", queued: "Queued", ahead: n => `${n} ahead`,
  running: "Processing", done: "Done", failed: "Failed", printableAfter: "Printable · 0 open / non-manifold edges",
  notprint: "Some problems remain", dl: "Download", loading: "Loading 3D…",
  open: "Open edges (holes)", nonman: "Non-manifold edges", flipped: "Flipped faces",
  degen: "Zero-area faces", shells: "Shells", size: "Print size", volume: "Volume", faces: "Faces", watertight: "Watertight",
  yes: "yes", no: "no", before: "Before", after: "After", badEdges: "red = open / non-manifold edges",
  agentLeft: n => `Agent jobs left today: ${n}`, agentOff: "Agent: resting (automatic repair without a request)",
  down: "The processing server is not reachable. Please try again later.", keep: h => `files deleted after ${h} h`,
  limit: (mb, n) => `up to ${mb} MB · ${n} per hour`, needConsent: "Please tick the agreement box", needFile: "Choose a file first",
  stats: (b, a) => `edge errors ${b} → ${a}`, afterOk: "Print-ready after repair",
  skpOn: n => `SketchUp converter on · ${n} left today`, skpOff: "SketchUp converter resting: export STL from SketchUp and upload that",
  skpFile: "SketchUp files cannot be previewed in the browser. They are converted in an isolated process on the server, then shown before and after.",
  skpOffFile: "The SketchUp converter is resting right now. In SketchUp use File > Export > 3D Model > STL (mm) and upload that.",
  printSize: (s, n) => `Print size <b>${s}</b> mm${n}`, big: " · larger than a typical 256 mm bed", small: " · very small",
  unitNote: "units assumed mm", sample: n => `open sample (gallery scale 1:${n})`, loadingSample: "Loading sample…", mm: "mm",
};
const API = window.PD_CONFIG.API;
const $ = s => document.querySelector(s);
const ui = { drop: $("#pd-drop"), file: $("#pd-file"), panel: $("#pd-check"), badge: $("#pd-badge"), req: $("#pd-req"),
  consent: $("#pd-consent"), send: $("#pd-send"), info: $("#pd-info"), status: $("#pd-status"), prog: $("#pd-prog"),
  log: $("#pd-log"), view: $("#pd-view"), files: $("#pd-files"), skp: $("#pd-skp"), presets: $("#pd-presets"), n: $("#pd-n"), size: $("#pd-size") };
const dropB = ui.drop.querySelector("b").textContent, dropS = ui.drop.querySelector("small").textContent;
document.querySelectorAll("#pd-view .pane").forEach((p, i) => p.insertAdjacentHTML("beforeend", `<span class="tag">${i ? T.after : T.before}</span>`));
let srv = null;            // /api/info

// ---------- viewer: two synced panes ----------
const panes = [...ui.view.querySelectorAll(".pane")];
const V = panes.map(p => {
  const r = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(2, devicePixelRatio)); r.setClearColor(0x24272c);
  p.appendChild(r.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, 0.1, 1e5); cam.up.set(0, 0, 1);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(1, -1.5, 2); scene.add(d);
  const ctl = new OrbitControls(cam, r.domElement); ctl.enableDamping = true;
  return { p, r, scene, cam, ctl, group: null };
});
let syncing = false;
V.forEach((v, i) => v.ctl.addEventListener("change", () => {
  if (syncing) return; syncing = true; const o = V[1 - i];
  o.cam.position.copy(v.cam.position); o.cam.quaternion.copy(v.cam.quaternion); o.ctl.target.copy(v.ctl.target); o.ctl.update();
  syncing = false; }));
(function loop() {
  V.forEach(v => { if (v.p.hidden || !v.p.offsetParent) return; const w = v.p.clientWidth, h = v.p.clientHeight;
    if (v.r.domElement.width !== Math.floor(w * v.r.getPixelRatio())) { v.r.setSize(w, h, false); v.cam.aspect = w / h; v.cam.updateProjectionMatrix(); }
    v.ctl.update(); v.r.render(v.scene, v.cam); });
  requestAnimationFrame(loop);
})();
function show(i, positions, color, badEdges) {
  const v = V[i];
  if (v.group) { v.scene.remove(v.group); v.group.traverse(o => o.geometry?.dispose()); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(positions, 3)); g.computeVertexNormals();
  v.group = new THREE.Group();
  v.group.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide })));
  if (badEdges && badEdges.length) {
    const e = new THREE.BufferGeometry(); e.setAttribute("position", new THREE.BufferAttribute(badEdges, 3));
    v.group.add(new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color: 0xff3b30 })));
  }
  v.scene.add(v.group);
  v.p.querySelector(".loading")?.remove();
  v.p.querySelector(".legend")?.remove();
  if (badEdges && badEdges.length) v.p.insertAdjacentHTML("beforeend", `<span class="legend">${T.badEdges}</span>`);
  return g;
}
function frame(geom) {
  geom.computeBoundingBox(); const b = geom.boundingBox, c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length() / 2 || 1;
  V.forEach(v => { v.cam.near = r / 100; v.cam.far = r * 50; v.cam.updateProjectionMatrix();
    v.cam.position.set(c.x + r * 1.6, c.y - r * 2.2, c.z + r * 1.3); v.ctl.target.copy(c); v.ctl.update(); });
}
const stlPos = buf => { const g = new STLLoader().parse(buf); return g.index ? g.toNonIndexed().getAttribute("position").array : g.getAttribute("position").array; };

// ---------- print scale ----------
let N = 100, sampleN = 0, first = null, firstScaled = false;   // firstScaled: `first` is already at print size (server conversion)
const scale = () => sampleN ? sampleN / N : 1 / N;          // samples are stored at their own 1:sampleN already
const shown = () => firstScaled ? 1 : scale();
function setN(n, fromInput) {
  N = Math.max(1, +n || 1);
  ui.presets.querySelectorAll(".chip[data-n]").forEach(c => c.classList.toggle("on", +c.dataset.n === N && !fromInput));
  ui.presets.querySelector(".custom").classList.toggle("on", !!fromInput);
  if (!fromInput) ui.n.value = "";
  sizeLine(); if (first) panel(first);
}
ui.presets.addEventListener("click", e => { const c = e.target.closest(".chip[data-n]"); if (c) setN(c.dataset.n); });
ui.n.addEventListener("input", () => ui.n.value && setN(ui.n.value, true));
const num = x => x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2);
function sizeLine() {
  if (!first) { ui.size.innerHTML = ""; return; }
  const s = first.size.map(x => x * shown()), mx = Math.max(...s);
  ui.size.innerHTML = T.printSize(s.map(num).join(" × "), mx > 256 ? `<span class="warn">${T.big}</span>` : mx < 20 ? `<span class="warn">${T.small}</span>` : "") +
    ` · ${sampleN ? T.sample(sampleN) : T.unitNote}`;
}

// ---------- local check ----------
const fmt = n => n.toLocaleString(KO ? "ko-KR" : "en-US");
async function loadLocal(file) {
  const ext = file.name.split(".").pop().toLowerCase(), buf = await file.arrayBuffer();
  if (ext === "stl") return new THREE.Mesh(new STLLoader().parse(buf));
  if (ext === "ply") return new THREE.Mesh(new PLYLoader().parse(buf));
  if (ext === "obj") return new OBJLoader().parse(new TextDecoder().decode(buf));
  if (ext === "3mf") return new ThreeMFLoader().parse(buf);
  if (ext === "glb" || ext === "gltf") return (await new GLTFLoader().parseAsync(buf, "")).scene;
  return null;
}
function row(label, val, bad) { return `<li><span>${label}</span><b class="${bad ? "bad" : ""}">${val}</b></li>`; }
function panel(r, r2) {
  const v = (a, b, f = fmt) => r2 ? `${f(a)} → ${f(b)}` : f(a);
  const yn = x => x ? T.yes : T.no, s = r2 ? 1 : shown();
  ui.panel.querySelector(".def").innerHTML =
    row(T.open, v(r.open, r2?.open), (r2 || r).open) + row(T.nonman, v(r.nonmanifold, r2?.nonmanifold), (r2 || r).nonmanifold) +
    row(T.flipped, v(r.flipped, r2?.flipped), (r2 || r).flipped) + row(T.degen, v(r.degenerate, r2?.degenerate), (r2 || r).degenerate) +
    row(T.watertight, v(r.watertight, r2?.watertight, yn), !(r2 || r).watertight);
  ui.panel.querySelector(".geo").innerHTML = row(T.size, (r2 || r).size.map(x => num(x * s)).join(" × ") + " mm") +
    row(T.volume, (r2 ? `${num(r.volume * shown() ** 3 / 1000)} → ${num(r2.volume / 1000)}` : num(r.volume * s ** 3 / 1000)) + " cm³") +
    row(T.faces, v(r.faces, r2?.faces)) + row(T.shells, v(r.shells, r2?.shells), (r2 || r).shells > 1);
  const ok = (r2 || r).printable;
  ui.badge.hidden = false; ui.badge.className = "badge-state " + (ok ? "ok" : "bad");
  ui.badge.textContent = r2 ? (ok ? T.afterOk : T.notprint) : (ok ? T.ok : T.bad);
}
function skpNote(isSkp) {
  ui.skp.hidden = !isSkp; if (!isSkp) return;
  const on = srv?.skp; ui.skp.className = "skpnote" + (on === false ? " warn" : "");
  ui.skp.textContent = on === false ? T.skpOffFile : T.skpFile;
}
async function onFile(keepSample) {
  const f = ui.file.files[0]; if (!f) return;
  if (!keepSample) { sampleN = 0; setN(N); }
  ui.drop.querySelector("b").textContent = f.name;
  ui.drop.querySelector("small").textContent = f.size < 1048576 ? (f.size / 1024).toFixed(0) + " KB" : (f.size / 1048576).toFixed(1) + " MB";
  first = null; firstScaled = false; sizeLine();
  ui.files.innerHTML = ""; ui.log.textContent = ""; ui.badge.hidden = true;
  panes[1].hidden = true; ui.view.classList.add("single");
  const isSkp = /\.skp$/i.test(f.name); skpNote(isSkp);
  if (isSkp) { ui.view.hidden = true; ui.panel.hidden = true; ui.status.textContent = ""; return; }
  ui.view.hidden = false; ui.status.textContent = T.checking;
  try {
    const obj = await loadLocal(f);
    if (!obj) { ui.status.textContent = T.nolocal; ui.panel.hidden = true; return; }
    const pos = merge(obj), r = check(pos); first = r;
    const g = show(0, pos, 0x9aa0a8, r.badEdges); frame(g);
    ui.panel.hidden = false; panel(r); sizeLine();
    ui.status.textContent = "";
  } catch (e) { ui.status.textContent = T.nolocal; ui.panel.hidden = true; console.warn(e); }
}
function setFile(file, keepSample) { const dt = new DataTransfer(); dt.items.add(file); ui.file.files = dt.files; onFile(keepSample); }
ui.drop.addEventListener("dragover", e => { e.preventDefault(); ui.drop.classList.add("over"); });
ui.drop.addEventListener("dragleave", () => ui.drop.classList.remove("over"));
ui.drop.addEventListener("drop", e => { e.preventDefault(); ui.drop.classList.remove("over");
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });
ui.file.addEventListener("change", () => onFile());

// ---------- open samples ----------
const SAMPLES = {};
document.querySelectorAll(".sample").forEach(el => { SAMPLES[el.dataset.id] = +el.querySelector(".scale-tag").textContent.split(":")[1].replace(/[^0-9]/g, ""); });
async function trySample(id) {
  document.getElementById("tool").scrollIntoView({ behavior: "smooth" });
  ui.status.textContent = T.loadingSample;
  try {
    const buf = await (await fetch(`${PRE}samples/${id}/original.stl`)).arrayBuffer();
    sampleN = SAMPLES[id] || 100; N = sampleN; setN(sampleN);
    setFile(new File([buf], `${id}.stl`, { type: "model/stl" }), true);
  } catch (e) { ui.status.textContent = T.down; }
}
document.addEventListener("click", e => { const b = e.target.closest(".chip-sample, .sample .try"); if (b) trySample(b.dataset.id); });

// ---------- server repair ----------
async function info() {
  try {
    srv = await (await fetch(API + "/api/info")).json();
    ui.info.textContent = [T.limit(srv.max_mb, srv.per_ip_per_hour), srv.skp ? T.skpOn(srv.skp_left_today) : T.skpOff,
      srv.agent ? T.agentLeft(srv.agent_left_today) : T.agentOff, T.keep(srv.retain_h)].join(" · ");
  } catch { ui.info.textContent = T.down; }
  if (ui.file.files[0]) skpNote(/\.skp$/i.test(ui.file.files[0].name));
}
ui.send.addEventListener("click", async () => {
  if (!ui.file.files[0]) { ui.status.textContent = T.needFile; return ui.file.click(); }
  if (!ui.consent.checked) { ui.status.textContent = T.needConsent; ui.consent.parentElement.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], 250); return; }
  const fd = new FormData();
  fd.append("file", ui.file.files[0]); fd.append("request", ui.req.value); fd.append("scale", String(scale()));
  ui.send.disabled = true; ui.prog.hidden = false; ui.status.textContent = "…"; ui.files.innerHTML = "";
  try {
    const r = await fetch(API + "/api/jobs", { method: "POST", body: fd }), j = await r.json();
    if (!r.ok) throw new Error(j.detail || r.status);
    ui.log.textContent = j.note ? j.note + "\n" : ""; poll(j.id);
  } catch (err) { stop(`${T.failed}: ${err.message || T.down}`); }
});
function stop(msg) { ui.status.textContent = msg; ui.send.disabled = false; ui.prog.hidden = true; }
async function poll(id) {
  let s;
  try { s = await (await fetch(`${API}/api/jobs/${id}`)).json(); } catch { setTimeout(() => poll(id), 4000); return; }
  ui.status.textContent = s.status === "queued" ? `${T.queued} (${T.ahead(s.ahead || 0)})` : (T[s.status] || s.status);
  ui.log.textContent = (s.log || []).join("\n"); ui.log.scrollTop = 1e9;
  if (s.status === "done") return result(id, s.report);
  if (s.status === "failed") return stop(`${T.failed}: ${s.error || ""}`);
  setTimeout(() => poll(id), 2500);
}
async function result(id, rep) {
  stop("");
  const b = rep.before || {}, a = (rep.after || {}).model || {};
  ui.status.textContent = `${T.done} · ${rep.printable ? T.printableAfter : T.notprint} · ` +
    T.stats(fmt((b.open_edges || 0) + (b.nonmanifold_edges || 0)), fmt((a.open_edges || 0) + (a.nonmanifold_edges || 0)));
  ui.files.innerHTML = Object.entries(rep.files || {}).map(([k, f]) =>
    `<a class="primary-btn" href="${API}/api/jobs/${id}/files/${encodeURIComponent(f)}" download>${T.dl} ${k}.stl</a>`).join("");
  ui.view.hidden = false; panes[1].hidden = false; ui.view.classList.remove("single");
  if (!V[0].group) {          // .skp: the "before" comes from the server's conversion
    panes[0].insertAdjacentHTML("beforeend", `<span class="loading">${T.loading}</span>`);
    try {
      const pos0 = stlPos(await (await fetch(`${API}/api/jobs/${id}/files/original.stl`)).arrayBuffer());
      const r0 = check(pos0); first = r0; firstScaled = true;
      frame(show(0, pos0, 0x9aa0a8, r0.badEdges)); ui.panel.hidden = false; ui.skp.hidden = true; panel(r0);
    } catch (e) { console.warn(e); }
  }
  panes[1].insertAdjacentHTML("beforeend", `<span class="loading">${T.loading}</span>`);
  const view = (rep.previews || {}).model || rep.files.model;          // light copy for the viewer when the result is large
  const pos = stlPos(await (await fetch(`${API}/api/jobs/${id}/files/${encodeURIComponent(view)}`)).arrayBuffer());
  const g = show(1, pos, 0x3b82c4);
  if (!V[0].group) frame(g);
  if (first) { try { panel(first, check(pos)); } catch (e) { console.warn(e); } }
}
info();
