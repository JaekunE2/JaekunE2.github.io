// Tool: drop a model -> free in-browser check + preview with problem edges -> "Repair" uploads it ->
// the server repairs it -> before/after 3D, downloads.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";
import { merge, check } from "./meshcheck.js";

const KO = document.documentElement.lang === "ko";
const T = KO ? {
  pick: "모델 파일을 여기로 끌어 놓거나 눌러서 고르세요", formats: "STL · OBJ · PLY · GLB · 3MF · OFF, 최대 50 MB",
  checking: "브라우저에서 점검 중… (아직 업로드하지 않았습니다)", nolocal: "이 형식은 브라우저 점검을 건너뜁니다. 고치기는 그대로 됩니다.",
  ok: "출력 가능", bad: "수리 필요", send: "고치기", sending: "올리는 중…", queued: "대기 중", ahead: n => `앞에 ${n}건`,
  running: "수리 중", done: "완료", failed: "실패", printableAfter: "출력 가능: 열린·논매니폴드 엣지 0",
  notprint: "아직 문제가 남아 있습니다", dl: "내려받기", loading: "3D 불러오는 중…",
  defects: "결함", geometry: "형상", open: "열린 엣지(구멍)", nonman: "논매니폴드 엣지", flipped: "뒤집힌 면",
  degen: "넓이 0인 면", shells: "조각(쉘)", size: "크기 (X × Y × Z)", volume: "부피", faces: "면 수", watertight: "닫힌 솔리드",
  yes: "예", no: "아니요", before: "수정 전", after: "수정 후", badEdges: "빨간 선 = 열린·논매니폴드 엣지",
  agentLeft: n => `에이전트 처리 오늘 ${n}건 남음`, agentOff: "에이전트: 쉬는 중 (요청 문장 없이 자동 수리)",
  down: "처리 서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.", keep: h => `파일은 ${h}시간 뒤 자동 삭제`,
  limit: (mb, n) => `최대 ${mb} MB · 시간당 ${n}건`, needConsent: "동의에 체크해 주세요", needFile: "먼저 파일을 고르세요",
  stats: (b, a) => `엣지 오류 ${b} → ${a}`, units: "단위", afterOk: "수정 후 출력 가능",
} : {
  pick: "Drop a model here or click to choose", formats: "STL · OBJ · PLY · GLB · 3MF · OFF, up to 50 MB",
  checking: "Checking in your browser… (nothing uploaded yet)", nolocal: "No in-browser check for this format; repair still works.",
  ok: "Print-ready", bad: "Needs repair", send: "Repair", sending: "Uploading…", queued: "Queued", ahead: n => `${n} ahead`,
  running: "Repairing", done: "Done", failed: "Failed", printableAfter: "Printable: 0 open / non-manifold edges",
  notprint: "Some problems remain", dl: "Download", loading: "Loading 3D…",
  defects: "Defects", geometry: "Geometry", open: "Open edges (holes)", nonman: "Non-manifold edges", flipped: "Flipped faces",
  degen: "Zero-area faces", shells: "Shells", size: "Size (X × Y × Z)", volume: "Volume", faces: "Faces", watertight: "Watertight",
  yes: "yes", no: "no", before: "Before", after: "After", badEdges: "red = open / non-manifold edges",
  agentLeft: n => `Agent jobs left today: ${n}`, agentOff: "Agent: resting (automatic repair without a request)",
  down: "The processing server is not reachable. Please try again later.", keep: h => `files deleted after ${h} h`,
  limit: (mb, n) => `up to ${mb} MB · ${n} per hour`, needConsent: "Please tick the agreement box", needFile: "Choose a file first",
  stats: (b, a) => `edge errors ${b} → ${a}`, units: "units", afterOk: "Print-ready after repair",
};
const API = window.PD_CONFIG.API;
const $ = s => document.querySelector(s);
const ui = { drop: $("#pd-drop"), file: $("#pd-file"), panel: $("#pd-check"), badge: $("#pd-badge"), req: $("#pd-req"),
  scale: $("#pd-scale"), consent: $("#pd-consent"), send: $("#pd-send"), info: $("#pd-info"), status: $("#pd-status"),
  log: $("#pd-log"), view: $("#pd-view"), files: $("#pd-files") };
ui.drop.querySelector("b").textContent = T.pick; ui.drop.querySelector("small").textContent = T.formats;
document.querySelectorAll("#pd-view .pane").forEach((p, i) => p.insertAdjacentHTML("beforeend", `<span class="tag">${i ? T.after : T.before}</span>`));

// ---------- viewer: two synced panes ----------
const panes = [...ui.view.querySelectorAll(".pane")];
const V = panes.map(p => {
  const r = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(2, devicePixelRatio)); r.setClearColor(0x2b2d31);
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
  return g;
}
function frame(geom) {
  geom.computeBoundingBox(); const b = geom.boundingBox, c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length() / 2 || 1;
  V.forEach(v => { v.cam.near = r / 100; v.cam.far = r * 50; v.cam.updateProjectionMatrix();
    v.cam.position.set(c.x + r * 1.6, c.y - r * 2.2, c.z + r * 1.3); v.ctl.target.copy(c); v.ctl.update(); });
}

// ---------- local check ----------
const fmt = n => n.toLocaleString(KO ? "ko-KR" : "en-US");
const num = x => x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2);
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
let first = null;
function panel(r, r2) {
  const v = (a, b, f = fmt) => r2 ? `${f(a)} → ${f(b)}` : f(a);
  const yn = x => x ? T.yes : T.no;
  ui.panel.querySelector(".def").innerHTML =
    row(T.open, v(r.open, r2?.open), (r2 || r).open) + row(T.nonman, v(r.nonmanifold, r2?.nonmanifold), (r2 || r).nonmanifold) +
    row(T.flipped, v(r.flipped, r2?.flipped), (r2 || r).flipped) + row(T.degen, v(r.degenerate, r2?.degenerate), (r2 || r).degenerate) +
    row(T.watertight, v(r.watertight, r2?.watertight, yn), !(r2 || r).watertight);
  ui.panel.querySelector(".geo").innerHTML = row(T.size, (r2 || r).size.map(num).join(" × ") + ` ${T.units}`) +
    row(T.volume, v(r.volume, r2?.volume, num)) + row(T.faces, v(r.faces, r2?.faces)) + row(T.shells, v(r.shells, r2?.shells), (r2 || r).shells > 1);
  const ok = (r2 || r).printable;
  ui.badge.hidden = false; ui.badge.className = "badge-state " + (ok ? "ok" : "bad");
  ui.badge.textContent = r2 ? (ok ? T.afterOk : T.notprint) : (ok ? T.ok : T.bad);
}
async function onFile() {
  const f = ui.file.files[0]; if (!f) return;
  ui.drop.querySelector("b").textContent = f.name;
  ui.drop.querySelector("small").textContent = f.size < 1048576 ? (f.size / 1024).toFixed(0) + " KB" : (f.size / 1048576).toFixed(1) + " MB";
  first = null;
  ui.files.innerHTML = ""; ui.log.textContent = ""; ui.status.textContent = T.checking; ui.badge.hidden = true;
  ui.view.hidden = false; panes[1].hidden = true; ui.view.classList.add("single");
  try {
    const obj = await loadLocal(f);
    if (!obj) { ui.status.textContent = T.nolocal; ui.panel.hidden = true; return; }
    const pos = merge(obj), r = check(pos); first = r;
    const g = show(0, pos, 0x9aa0a8, r.badEdges); frame(g);
    ui.panel.hidden = false; panel(r);
    ui.status.textContent = r.open + r.nonmanifold ? T.badEdges : "";
  } catch (e) { ui.status.textContent = T.nolocal; ui.panel.hidden = true; console.warn(e); }
}
ui.drop.addEventListener("dragover", e => { e.preventDefault(); ui.drop.classList.add("over"); });
ui.drop.addEventListener("dragleave", () => ui.drop.classList.remove("over"));
ui.drop.addEventListener("drop", e => { e.preventDefault(); ui.drop.classList.remove("over");
  if (e.dataTransfer.files[0]) { ui.file.files = e.dataTransfer.files; onFile(); } });
ui.file.addEventListener("change", onFile);

// ---------- server repair ----------
async function info() {
  try {
    const r = await (await fetch(API + "/api/info")).json();
    ui.info.textContent = [T.limit(r.max_mb, r.per_ip_per_hour), r.agent ? T.agentLeft(r.agent_left_today) : T.agentOff, T.keep(r.retain_h)].join(" · ");
  } catch { ui.info.textContent = T.down; }
}
ui.send.addEventListener("click", async () => {
  if (!ui.file.files[0]) { ui.status.textContent = T.needFile; return ui.file.click(); }
  if (!ui.consent.checked) { ui.status.textContent = T.needConsent; return; }
  const fd = new FormData();
  fd.append("file", ui.file.files[0]); fd.append("request", ui.req.value); fd.append("scale", ui.scale.value || "1");
  ui.send.disabled = true; ui.status.textContent = T.sending; ui.files.innerHTML = "";
  try {
    const r = await fetch(API + "/api/jobs", { method: "POST", body: fd }), j = await r.json();
    if (!r.ok) throw new Error(j.detail || r.status);
    ui.log.textContent = j.note ? j.note + "\n" : ""; poll(j.id);
  } catch (err) { ui.status.textContent = `${T.failed}: ${err.message || T.down}`; ui.send.disabled = false; }
});
async function poll(id) {
  let s;
  try { s = await (await fetch(`${API}/api/jobs/${id}`)).json(); } catch { setTimeout(() => poll(id), 4000); return; }
  ui.status.textContent = s.status === "queued" ? `${T.queued} (${T.ahead(s.ahead || 0)})` : (T[s.status] || s.status);
  ui.log.textContent = (s.log || []).join("\n"); ui.log.scrollTop = 1e9;
  if (s.status === "done") return result(id, s.report);
  if (s.status === "failed") { ui.status.textContent = `${T.failed}: ${s.error || ""}`; ui.send.disabled = false; return; }
  setTimeout(() => poll(id), 2500);
}
async function result(id, rep) {
  ui.send.disabled = false;
  const b = rep.before || {}, a = (rep.after || {}).model || {};
  ui.status.textContent = `${T.done} · ${rep.printable ? T.printableAfter : T.notprint} · ` +
    T.stats((b.open_edges || 0) + (b.nonmanifold_edges || 0), (a.open_edges || 0) + (a.nonmanifold_edges || 0));
  ui.files.innerHTML = Object.entries(rep.files || {}).map(([k, f]) =>
    `<a class="btn primary-btn" href="${API}/api/jobs/${id}/files/${encodeURIComponent(f)}" download>${T.dl} ${k}.stl</a>`).join("");
  panes[1].hidden = false; ui.view.classList.remove("single");
  panes[1].insertAdjacentHTML("beforeend", `<span class="loading">${T.loading}</span>`);
  const g = new STLLoader().parse(await (await fetch(`${API}/api/jobs/${id}/files/${rep.files.model}`)).arrayBuffer());
  const pos = g.index ? g.toNonIndexed().getAttribute("position").array : g.getAttribute("position").array;
  show(1, pos, 0x3b82c4);
  if (!V[0].group) frame(g);
  if (first) { try { panel(first, check(pos)); } catch (e) { console.warn(e); } }
}
info();
