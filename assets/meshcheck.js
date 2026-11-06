// In-browser printability check (nothing is uploaded): weld vertices, count open / non-manifold edges,
// flipped faces (two faces walk a shared edge the same way), zero-area faces, shells, size, volume.
import * as THREE from "three";

export function merge(object) {
  // all meshes of a loaded scene -> one non-indexed position array in world space
  const parts = [];
  object.updateMatrixWorld(true);
  object.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    parts.push(g.getAttribute("position").array);
  });
  const n = parts.reduce((s, a) => s + a.length, 0), out = new Float32Array(n);
  let k = 0; for (const a of parts) { out.set(a, k); k += a.length; }
  return out;
}

export function check(pos) {
  const nf = pos.length / 9;
  // weld: quantise to 1e-4 of the bounding size
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) {
    const v = pos[i + a]; if (v < lo[a]) lo[a] = v; if (v > hi[a]) hi[a] = v; }
  const size = hi.map((h, a) => h - lo[a]), q = Math.max(...size, 1e-9) * 1e-5;
  const vid = new Map(), F = new Uint32Array(nf * 3); let nv = 0;
  for (let i = 0; i < nf * 3; i++) {
    const key = Math.round(pos[3 * i] / q) + "," + Math.round(pos[3 * i + 1] / q) + "," + Math.round(pos[3 * i + 2] / q);
    let id = vid.get(key); if (id === undefined) { id = nv++; vid.set(key, id); } F[i] = id;
  }
  // edges: key min*nv+max -> [count, firstFace, firstDir]
  const E = new Map(); let degenerate = 0, vol = 0;
  const flippedEdges = [];
  const parent = new Int32Array(nf).map((_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (let f = 0; f < nf; f++) {
    const a = F[3 * f], b = F[3 * f + 1], c = F[3 * f + 2];
    const p = pos.subarray(9 * f, 9 * f + 9);
    const ux = p[3] - p[0], uy = p[4] - p[1], uz = p[5] - p[2], vx = p[6] - p[0], vy = p[7] - p[1], vz = p[8] - p[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (a === b || b === c || a === c || Math.hypot(cx, cy, cz) < q * q) degenerate++;
    vol += (p[0] * (p[4] * p[8] - p[5] * p[7]) - p[1] * (p[3] * p[8] - p[5] * p[6]) + p[2] * (p[3] * p[7] - p[4] * p[6])) / 6;
    for (const [s, t] of [[a, b], [b, c], [c, a]]) {
      if (s === t) continue;
      const k = s < t ? s * nv + t : t * nv + s, dir = s < t ? 1 : -1;
      const e = E.get(k);
      if (!e) E.set(k, [1, f, dir]);
      else {
        e[0]++;
        if (e[0] === 2) { if (e[2] === dir) flippedEdges.push(k); const r1 = find(f), r2 = find(e[1]); if (r1 !== r2) parent[r1] = r2; }
      }
    }
  }
  let open = 0, nonman = 0; const bad = [];
  const vpos = new Float32Array(nv * 3);
  for (let i = 0; i < nf * 3; i++) vpos.set(pos.subarray(3 * i, 3 * i + 3), 3 * F[i]);
  const pushEdge = k => { const s = Math.floor(k / nv), t = k - s * nv; bad.push(...vpos.subarray(3 * s, 3 * s + 3), ...vpos.subarray(3 * t, 3 * t + 3)); };
  for (const [k, e] of E) {
    if (e[0] === 1) { open++; if (bad.length < 6e5) pushEdge(k); }
    else if (e[0] > 2) { nonman++; if (bad.length < 6e5) pushEdge(k); }
  }
  const roots = new Set(); for (let f = 0; f < nf; f++) roots.add(find(f));
  return { faces: nf, vertices: nv, open, nonmanifold: nonman, flipped: flippedEdges.length, degenerate,
           shells: roots.size, size, volume: Math.abs(vol), watertight: open === 0 && nonman === 0,
           printable: open === 0 && nonman === 0 && flippedEdges.length === 0, badEdges: new Float32Array(bad) };
}
