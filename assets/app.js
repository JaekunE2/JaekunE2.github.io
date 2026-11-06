// "Try it": upload -> processing server -> status -> before/after 3D view + downloads.
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const KO = document.documentElement.lang === "ko";
const T = KO ? {
  pick: "파일을 고르거나 여기로 끌어 놓으세요", send: "고치기", sending: "올리는 중…", queued: "대기 중", ahead: n => `앞에 ${n}건`,
  running: "처리 중", done: "완료", failed: "실패", printable: "출력 가능: 열린·논매니폴드 엣지 0",
  notprint: "아직 문제가 남아 있습니다", before: "수정 전", after: "수정 후", dl: "내려받기",
  agentLeft: n => `오늘 남은 에이전트 처리: ${n}건`, agentOff: "에이전트 처리: 지금은 쉬는 중 (고정 파이프라인으로 처리)",
  down: "처리 서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.", keep: h => `파일은 ${h}시간 뒤 자동 삭제됩니다.`,
  limit: (mb, n) => `최대 ${mb} MB · 시간당 ${n}건`, consent: "개인정보처리방침과 이용약관에 동의합니다",
  needConsent: "동의에 체크해 주세요", stats: (b, a) => `엣지 오류 ${b} → ${a}`, loading: "3D 불러오는 중…",
} : {
  pick: "Choose a file or drop it here", send: "Repair", sending: "Uploading…", queued: "Queued", ahead: n => `${n} ahead`,
  running: "Working", done: "Done", failed: "Failed", printable: "Printable: 0 open / non-manifold edges",
  notprint: "Some problems remain", before: "Before", after: "After", dl: "Download",
  agentLeft: n => `Agent jobs left today: ${n}`, agentOff: "Agent: resting right now (fixed pipeline is used)",
  down: "The processing server is not reachable. Please try again later.", keep: h => `Files are deleted after ${h} hours.`,
  limit: (mb, n) => `Up to ${mb} MB · ${n} uploads per hour`, consent: "I agree to the privacy policy and terms",
  needConsent: "Please tick the agreement box", stats: (b, a) => `edge errors ${b} → ${a}`, loading: "Loading 3D…",
};
const API = window.PD_CONFIG.API;
const $ = s => document.querySelector(s);
const ui = { form: $("#pd-form"), file: $("#pd-file"), drop: $("#pd-drop"), req: $("#pd-req"), scale: $("#pd-scale"),
  consent: $("#pd-consent"), send: $("#pd-send"), info: $("#pd-info"), status: $("#pd-status"), log: $("#pd-log"),
  view: $("#pd-view"), files: $("#pd-files") };

async function info() {
  try {
    const r = await (await fetch(API + "/api/info")).json();
    ui.info.textContent = [T.limit(r.max_mb, r.per_ip_per_hour), r.agent ? T.agentLeft(r.agent_left_today) : T.agentOff,
      T.keep(r.retain_h)].join(" · ");
    ui.file.accept = r.formats.join(",");
  } catch { ui.info.textContent = T.down; }
}

ui.drop.addEventListener("dragover", e => { e.preventDefault(); ui.drop.classList.add("over"); });
ui.drop.addEventListener("dragleave", () => ui.drop.classList.remove("over"));
ui.drop.addEventListener("drop", e => { e.preventDefault(); ui.drop.classList.remove("over");
  if (e.dataTransfer.files[0]) { ui.file.files = e.dataTransfer.files; label(); } });
ui.file.addEventListener("change", label);
function label() { ui.drop.querySelector("span").textContent = ui.file.files[0] ? ui.file.files[0].name : T.pick; }

ui.form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!ui.file.files[0]) return ui.file.click();
  if (!ui.consent.checked) { ui.status.textContent = T.needConsent; return; }
  const fd = new FormData();
  fd.append("file", ui.file.files[0]); fd.append("request", ui.req.value); fd.append("scale", ui.scale.value || "1");
  ui.send.disabled = true; ui.status.textContent = T.sending; ui.log.textContent = ""; ui.files.innerHTML = ""; ui.view.hidden = true;
  try {
    const r = await fetch(API + "/api/jobs", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || r.status);
    if (j.note) ui.log.textContent = j.note + "\n";
    poll(j.id);
  } catch (err) { ui.status.textContent = `${T.failed}: ${err.message || T.down}`; ui.send.disabled = false; }
});

async function poll(id) {
  let s;
  try { s = await (await fetch(`${API}/api/jobs/${id}`)).json(); }
  catch { setTimeout(() => poll(id), 4000); return; }
  ui.status.textContent = s.status === "queued" ? `${T.queued} (${T.ahead(s.ahead || 0)})` : (T[s.status] || s.status);
  ui.log.textContent = (s.log || []).join("\n"); ui.log.scrollTop = 1e9;
  if (s.status === "done") return show(id, s.report);
  if (s.status === "failed") { ui.status.textContent = `${T.failed}: ${s.error || ""}`; ui.send.disabled = false; return; }
  setTimeout(() => poll(id), 2500);
}

function show(id, rep) {
  ui.send.disabled = false;
  const b = rep.before || {}, a = (rep.after || {}).model || {};
  ui.status.textContent = `${T.done} · ${rep.printable ? T.printable : T.notprint} · ` +
    T.stats((b.open_edges || 0) + (b.nonmanifold_edges || 0), (a.open_edges || 0) + (a.nonmanifold_edges || 0));
  const files = { original: "original.stl", ...(rep.files || {}) };
  ui.files.innerHTML = Object.entries(rep.files || {}).map(([k, f]) =>
    `<a class="btn" href="${API}/api/jobs/${id}/files/${encodeURIComponent(f)}" download>${T.dl} ${k}.stl</a>`).join("");
  view(`${API}/api/jobs/${id}/files/original.stl`, `${API}/api/jobs/${id}/files/${rep.files.model}`);
}

let three;
function view(urlA, urlB) {
  ui.view.hidden = false;
  if (three) three.dispose();
  const panes = [...ui.view.querySelectorAll(".pane")];
  panes.forEach(p => { p.querySelector(".loading")?.remove(); p.insertAdjacentHTML("beforeend", `<span class="loading">${T.loading}</span>`); });
  const loader = new STLLoader(), renderers = [], cams = [];
  const scenes = panes.map(() => new THREE.Scene());
  const box = new THREE.Box3();
  Promise.all([urlA, urlB].map(u => loader.loadAsync(u))).then(geoms => {
    panes.forEach(p => p.querySelector(".loading")?.remove());
    geoms.forEach((g, i) => {
      g.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ color: i ? 0x3b82c4 : 0x9aa0a8, roughness: 0.6, metalness: 0.05,
        side: THREE.DoubleSide });
      const m = new THREE.Mesh(g, mat); scenes[i].add(m);
      if (i === 0) {   // original: also show its open/odd edges faintly
        scenes[i].add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 40), new THREE.LineBasicMaterial({ color: 0x333333 })));
      }
      g.computeBoundingBox(); box.union(g.boundingBox);
      scenes[i].add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2));
      const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(1, -1.5, 2); scenes[i].add(d);
    });
    const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
    panes.forEach((p, i) => {
      const rd = new THREE.WebGLRenderer({ antialias: true }); rd.setPixelRatio(Math.min(2, devicePixelRatio));
      rd.setClearColor(0x2f3134); p.querySelector("canvas")?.remove(); p.appendChild(rd.domElement); renderers.push(rd);
      const cam = new THREE.PerspectiveCamera(35, 1, r / 100, r * 20); cam.up.set(0, 0, 1);
      cam.position.set(c.x + r * 1.6, c.y - r * 2.2, c.z + r * 1.3); cams.push(cam);
    });
    // one control drives both cameras
    const ctl = new OrbitControls(cams[0], renderers[0].domElement); ctl.target.copy(c); ctl.update();
    const ctl2 = new OrbitControls(cams[1], renderers[1].domElement); ctl2.target.copy(c); ctl2.update();
    const sync = (from, to, cf, ct) => from.addEventListener("change", () => { ct.position.copy(cf.position); ct.quaternion.copy(cf.quaternion); to.target.copy(from.target); });
    sync(ctl, ctl2, cams[0], cams[1]); sync(ctl2, ctl, cams[1], cams[0]);
    let run = true;
    const loop = () => { if (!run) return;
      panes.forEach((p, i) => { const w = p.clientWidth, h = p.clientHeight;
        if (renderers[i].domElement.width !== Math.floor(w * renderers[i].getPixelRatio())) { renderers[i].setSize(w, h, false); cams[i].aspect = w / h; cams[i].updateProjectionMatrix(); }
        renderers[i].render(scenes[i], cams[i]); });
      requestAnimationFrame(loop); };
    loop();
    three = { dispose() { run = false; renderers.forEach(r => r.dispose()); } };
  });
}

label(); info();
