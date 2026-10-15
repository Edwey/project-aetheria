/**
 * src/gameplay/physics.js <- Phys - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Position-based dynamics soft bodies.
 */


const Phys = (function () {
'use strict';
const G = -20, RP = 0.07, MARGIN = 0.03, SUB = 4, ITERS = 3;
const SHRINK = 0.35, CHARGE_T = 0.85, JMIN = 4.5, MAXSPEED = 6, DRIVE = 16, DAMP = 3, SQUASH = 75, CLIMB = 36, MAXD = 0.09;

/* ---------- meshes ---------- */
function icosphere(level, R) {
  const t = (1 + Math.sqrt(5)) / 2;
  const V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  const verts = V.map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0]/l*R, v[1]/l*R, v[2]/l*R]; });
  let faces = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
               [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for (let l = 0; l < level; l++) {
    const cache = new Map(), nf = [];
    const mid = (a, b) => {
      const k = a < b ? a * 65536 + b : b * 65536 + a;
      let m = cache.get(k);
      if (m === undefined) {
        const p = verts[a], q = verts[b];
        const x = (p[0]+q[0])/2, y = (p[1]+q[1])/2, z = (p[2]+q[2])/2, l2 = Math.hypot(x, y, z);
        verts.push([x/l2*R, y/l2*R, z/l2*R]); m = verts.length - 1; cache.set(k, m);
      }
      return m;
    };
    for (const f of faces) {
      const a = mid(f[0], f[1]), b = mid(f[1], f[2]), c = mid(f[2], f[0]);
      nf.push([f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]);
    }
    faces = nf;
  }
  return { pos: verts, tris: faces };
}

function boxMesh(n, side) {
  const map = new Map(), pos = [], tris = [];
  const vid = p => {
    const k = Math.round(p[0]*1e4) + ',' + Math.round(p[1]*1e4) + ',' + Math.round(p[2]*1e4);
    let i = map.get(k);
    if (i === undefined) { i = pos.length; pos.push(p); map.set(k, i); }
    return i;
  };
  for (let a = 0; a < 3; a++) for (const s of [1, -1]) {
    const u = (a + 1) % 3, w = (a + 2) % 3;
    const P = (i, j) => { const p = [0, 0, 0]; p[a] = s*side/2; p[u] = (i/n - 0.5)*side; p[w] = (j/n - 0.5)*side; return vid(p); };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const p00 = P(i, j), p10 = P(i+1, j), p11 = P(i+1, j+1), p01 = P(i, j+1);
      if (s > 0) tris.push([p00, p10, p11], [p00, p11, p01]);
      else tris.push([p00, p11, p10], [p00, p01, p11]);
    }
  }
  return { pos, tris };
}

function restVolume(pos, tris) {
  let V = 0;
  for (const t of tris) {
    const a = pos[t[0]], b = pos[t[1]], c = pos[t[2]];
    V += (a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0])) / 6;
  }
  return V;
}

/* ---------- slime body ---------- */
function makeSlime(kind, cx, cy, cz, level, size) {
  level = level || 3; size = size || 1;
  const m = kind === 'cube' ? boxMesh(level >= 3 ? 8 : 5, 1.0) : icosphere(level, 0.6);
  if (size !== 1) m.pos = m.pos.map(q => [q[0]*size, q[1]*size, q[2]*size]);
  const n = m.pos.length;
  const b = {
    kind, n, size,
    x: new Float64Array(3*n), px: new Float64Array(3*n), v: new Float64Array(3*n),
    q: new Float64Array(3*n), grad: new Float64Array(3*n),
    cflag: new Uint8Array(n), nofric: new Uint8Array(n), cn: new Float64Array(3*n),
    idx: new Uint32Array(m.tris.length * 3),
    qr: [0, 0, 0, 1],
    com: [cx, cy, cz], vcom: [0, 0, 0], avgN: [0, 1, 0], contacts: 0,
    charge: 0, prevHeld: false, groundTimer: 0, cooldown: 0,
    jumpActive: false, jumpPower: 0, takeoffY: 0, peak: 0, lastPeak: 0, lastPower: 0,
    melt: 0, airTime: 0, pounding: false, poundQueued: false, gliding: false, events: [],
    shrink: 0, scale: 1, hoverLeft: 0.8, hovering: false, clingLeft: 1.5, glideTime: 0, pitHold: false, lastWallMode: 0, wallNx: 0, wallNz: 0
  };
  let ox = 0, oy = 0, oz = 0;
  for (let i = 0; i < n; i++) { ox += m.pos[i][0]; oy += m.pos[i][1]; oz += m.pos[i][2]; }
  ox /= n; oy /= n; oz /= n;
  for (let i = 0; i < n; i++) {
    const p = m.pos[i];
    b.q[3*i] = p[0]-ox; b.q[3*i+1] = p[1]-oy; b.q[3*i+2] = p[2]-oz;
    b.x[3*i] = cx + p[0]-ox; b.x[3*i+1] = cy + p[1]-oy; b.x[3*i+2] = cz + p[2]-oz;
  }
  b.px.set(b.x);
  m.tris.forEach((t, i) => { b.idx[3*i] = t[0]; b.idx[3*i+1] = t[1]; b.idx[3*i+2] = t[2]; });
  const seen = new Set(), e = [];
  for (const t of m.tris) for (let k = 0; k < 3; k++) {
    const a = t[k], c = t[(k+1)%3], key = a < c ? a*n + c : c*n + a;
    if (!seen.has(key)) { seen.add(key); e.push(a, c); }
  }
  b.edges = new Uint32Array(e);
  b.rest = new Float64Array(e.length/2);
  for (let j = 0; j < b.rest.length; j++) {
    const a = 3*e[2*j], c = 3*e[2*j+1];
    b.rest[j] = Math.hypot(b.q[a]-b.q[c], b.q[a+1]-b.q[c+1], b.q[a+2]-b.q[c+2]);
  }
  b.V0 = restVolume(m.pos.map((p, i) => [b.q[3*i], b.q[3*i+1], b.q[3*i+2]]), m.tris);
  return b;
}

function updateStats(b) {
  const n = b.n, x = b.x, v = b.v;
  let cx = 0, cy = 0, cz = 0, vx = 0, vy = 0, vz = 0;
  for (let i = 0; i < n; i++) {
    const k = 3*i;
    cx += x[k]; cy += x[k+1]; cz += x[k+2]; vx += v[k]; vy += v[k+1]; vz += v[k+2];
  }
  b.com[0] = cx/n; b.com[1] = cy/n; b.com[2] = cz/n;
  b.vcom[0] = vx/n; b.vcom[1] = vy/n; b.vcom[2] = vz/n;
}

/* ---------- constraints ---------- */
function edgeStep(b, k) {
  const x = b.x, e = b.edges, r = b.rest, sc = b.scale || 1;
  for (let j = 0; j < r.length; j++) {
    const a = 3*e[2*j], c = 3*e[2*j+1];
    const dx = x[a]-x[c], dy = x[a+1]-x[c+1], dz = x[a+2]-x[c+2];
    const l = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (l < 1e-9) continue;
    const s = k * 0.5 * (l - r[j] * sc) / l;
    x[a] -= dx*s; x[a+1] -= dy*s; x[a+2] -= dz*s;
    x[c] += dx*s; x[c+1] += dy*s; x[c+2] += dz*s;
  }
}

function volumeStep(b, pressure, kp) {
  const x = b.x, idx = b.idx, g = b.grad, c = b.com;
  g.fill(0);
  let V = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const ia = 3*idx[t], ib = 3*idx[t+1], ic = 3*idx[t+2];
    const ax = x[ia]-c[0], ay = x[ia+1]-c[1], az = x[ia+2]-c[2];
    const bx = x[ib]-c[0], by = x[ib+1]-c[1], bz = x[ib+2]-c[2];
    const cx = x[ic]-c[0], cy = x[ic+1]-c[1], cz = x[ic+2]-c[2];
    const bcx = by*cz-bz*cy, bcy = bz*cx-bx*cz, bcz = bx*cy-by*cx;
    V += (ax*bcx + ay*bcy + az*bcz) / 6;
    g[ia] += bcx/6; g[ia+1] += bcy/6; g[ia+2] += bcz/6;
    const cax = cy*az-cz*ay, cay = cz*ax-cx*az, caz = cx*ay-cy*ax;
    g[ib] += cax/6; g[ib+1] += cay/6; g[ib+2] += caz/6;
    const abx = ay*bz-az*by, aby = az*bx-ax*bz, abz = ax*by-ay*bx;
    g[ic] += abx/6; g[ic+1] += aby/6; g[ic+2] += abz/6;
  }
  const sc3 = Math.pow(b.scale || 1, 3);
  const C = V - b.V0 * pressure * sc3;
  let d = 0;
  for (let i = 0; i < g.length; i++) d += g[i]*g[i];
  if (d < 1e-12) return;
  const s = -kp * C / d;
  for (let i = 0; i < g.length; i++) x[i] += s * g[i];
}

function shapeMatch(b, k) {
  if (k <= 1e-7) return;
  const n = b.n, x = b.x, q0 = b.q;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += x[3*i]; cy += x[3*i+1]; cz += x[3*i+2]; }
  cx /= n; cy /= n; cz /= n;
  let a00=0,a01=0,a02=0,a10=0,a11=0,a12=0,a20=0,a21=0,a22=0;
  for (let i = 0; i < n; i++) {
    const k3 = 3*i;
    const px = x[k3]-cx, py = x[k3+1]-cy, pz = x[k3+2]-cz;
    const qx = q0[k3], qy = q0[k3+1], qz = q0[k3+2];
    a00 += px*qx; a01 += px*qy; a02 += px*qz;
    a10 += py*qx; a11 += py*qy; a12 += py*qz;
    a20 += pz*qx; a21 += pz*qy; a22 += pz*qz;
  }
  const q = b.qr;
  let r00, r01, r02, r10, r11, r12, r20, r21, r22;
  for (let it = 0; it < 10; it++) {
    const X = q[0], Y = q[1], Z = q[2], W = q[3];
    r00 = 1-2*(Y*Y+Z*Z); r01 = 2*(X*Y-Z*W);   r02 = 2*(X*Z+Y*W);
    r10 = 2*(X*Y+Z*W);   r11 = 1-2*(X*X+Z*Z); r12 = 2*(Y*Z-X*W);
    r20 = 2*(X*Z-Y*W);   r21 = 2*(Y*Z+X*W);   r22 = 1-2*(X*X+Y*Y);
    // columns of R: (r00,r10,r20) (r01,r11,r21) (r02,r12,r22); columns of A likewise
    let ox = (r10*a20 - r20*a10) + (r11*a21 - r21*a11) + (r12*a22 - r22*a12);
    let oy = (r20*a00 - r00*a20) + (r21*a01 - r01*a21) + (r22*a02 - r02*a22);
    let oz = (r00*a10 - r10*a00) + (r01*a11 - r11*a01) + (r02*a12 - r12*a02);
    const den = Math.abs(r00*a00 + r10*a10 + r20*a20 + r01*a01 + r11*a11 + r21*a21 + r02*a02 + r12*a12 + r22*a22) + 1e-9;
    ox /= den; oy /= den; oz /= den;
    const w = Math.sqrt(ox*ox + oy*oy + oz*oz);
    if (w < 1e-9) break;
    const half = w * 0.5, s = Math.sin(half) / w;
    const dx = ox*s, dy = oy*s, dz = oz*s, dw = Math.cos(half);
    const nx = dw*X + dx*W + dy*Z - dz*Y;
    const ny = dw*Y - dx*Z + dy*W + dz*X;
    const nz = dw*Z + dx*Y - dy*X + dz*W;
    const nw = dw*W - dx*X - dy*Y - dz*Z;
    const l = Math.sqrt(nx*nx + ny*ny + nz*nz + nw*nw);
    q[0] = nx/l; q[1] = ny/l; q[2] = nz/l; q[3] = nw/l;
  }
  for (let i = 0; i < n; i++) {
    const k3 = 3*i, sc = b.scale || 1, qx = q0[k3] * sc, qy = q0[k3+1] * sc, qz = q0[k3+2] * sc;
    const gx = cx + r00*qx + r01*qy + r02*qz;
    const gy = cy + r10*qx + r11*qy + r12*qz;
    const gz = cz + r20*qx + r21*qy + r22*qz;
    x[k3] += k*(gx - x[k3]); x[k3+1] += k*(gy - x[k3+1]); x[k3+2] += k*(gz - x[k3+2]);
  }
}


/* ---------- ground sampling + broadphase ---------- */
const gout = [0, 0, 0];
function ground(w, x, z) {
  const cs = w.cs, N = w.N, hg = w.hg, W = N + 1;
  let fx = (x + w.A) / cs, fz = (z + w.A) / cs;
  if (fx < 0) fx = 0; else if (fx > N - 1e-6) fx = N - 1e-6;
  if (fz < 0) fz = 0; else if (fz > N - 1e-6) fz = N - 1e-6;
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * W + i;
  const h00 = hg[k], h10 = hg[k+1], h01 = hg[k+W], h11 = hg[k+W+1];
  gout[0] = h00*(1-u)*(1-v) + h10*u*(1-v) + h01*(1-u)*v + h11*u*v;
  gout[1] = ((h10-h00)*(1-v) + (h11-h01)*v) / cs;
  gout[2] = ((h01-h00)*(1-u) + (h11-h10)*u) / cs;
}
function groundHeight(w, x, z) { ground(w, x, z); return gout[0]; }

function buildGrid(w) {
  const CS = 4, n = Math.ceil(2 * w.A / CS), cells = new Array(n * n);
  for (let i = 0; i < cells.length; i++) cells[i] = { b: [], s: [], c: [] };
  const add = (key, o, cx, cz, rad) => {
    rad += RP + MARGIN + 0.15;
    const x0 = Math.max(0, Math.floor((cx - rad + w.A) / CS)), x1 = Math.min(n - 1, Math.floor((cx + rad + w.A) / CS));
    const z0 = Math.max(0, Math.floor((cz - rad + w.A) / CS)), z1 = Math.min(n - 1, Math.floor((cz + rad + w.A) / CS));
    for (let j = z0; j <= z1; j++) for (let i = x0; i <= x1; i++) cells[j * n + i][key].push(o);
  };
  (w.boxes || []).forEach(o => add('b', o, o.c[0], o.c[2], o.br));
  (w.spheres || []).forEach(o => add('s', o, o.c[0], o.c[2], o.r));
  (w.cyls || []).forEach(o => add('c', o, o.c[0], o.c[2], o.r));
  w.grid = { CS, n, cells };
}


function forEachContact(w, X, Y, Z, r, hit) {
  if (!w.grid) buildGrid(w);
  if (Y - r - MARGIN < w.hmax) {
    ground(w, X, Z);
    const gx = gout[1], gz = gout[2], inv = 1 / Math.sqrt(1 + gx*gx + gz*gz);
    const pen = r - (Y - gout[0]) * inv;
    if (pen > 0) hit(-gx*inv, inv, -gz*inv, pen);
  }
  const GC = w.grid.CS, GN = w.grid.n;
  let ci = ((X + w.A) / GC) | 0, cj = ((Z + w.A) / GC) | 0;
  if (ci < 0) ci = 0; else if (ci >= GN) ci = GN - 1;
  if (cj < 0) cj = 0; else if (cj >= GN) cj = GN - 1;
  const cell = w.grid.cells[cj * GN + ci];
  for (let j = 0; j < cell.b.length; j++) {
    const bx = cell.b[j], c = bx.c, R = bx.R, hh = bx.h;
    const dx = X-c[0], dy = Y-c[1], dz = Z-c[2], rr = bx.br + r;
    if (dx*dx + dy*dy + dz*dz > rr*rr) continue;
    const lx = R[0]*dx + R[3]*dy + R[6]*dz, ly = R[1]*dx + R[4]*dy + R[7]*dz, lz = R[2]*dx + R[5]*dy + R[8]*dz;
    const qx = Math.abs(lx) - hh[0], qy = Math.abs(ly) - hh[1], qz = Math.abs(lz) - hh[2];
    if (qx > r || qy > r || qz > r) continue;
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0), out = Math.sqrt(ox*ox + oy*oy + oz*oz);
    let sd, nx, ny, nz;
    if (out > 0) { sd = out; nx = ox/out*(lx < 0 ? -1 : 1); ny = oy/out*(ly < 0 ? -1 : 1); nz = oz/out*(lz < 0 ? -1 : 1); }
    else { sd = Math.max(qx, qy, qz); nx = 0; ny = 0; nz = 0; if (qx >= qy && qx >= qz) nx = lx < 0 ? -1 : 1; else if (qy >= qz) ny = ly < 0 ? -1 : 1; else nz = lz < 0 ? -1 : 1; }
    const pen = r - sd;
    if (pen > 0) hit(R[0]*nx + R[1]*ny + R[2]*nz, R[3]*nx + R[4]*ny + R[5]*nz, R[6]*nx + R[7]*ny + R[8]*nz, pen);
  }
  for (let j = 0; j < cell.s.length; j++) {
    const s = cell.s[j]; if (s.on === false) continue;
    const dx = X-s.c[0], dy = Y-s.c[1], dz = Z-s.c[2], d = Math.sqrt(dx*dx + dy*dy + dz*dz), pen = s.r + r - d;
    if (pen > 0) hit(d > 1e-9 ? dx/d : 0, d > 1e-9 ? dy/d : 1, d > 1e-9 ? dz/d : 0, pen);
  }
  for (let j = 0; j < cell.c.length; j++) {
    const cy = cell.c[j]; if (cy.on === false) continue;
    const dx = X-cy.c[0], dz = Z-cy.c[2], ty = Math.max(cy.c[1], Math.min(cy.c[1] + cy.h, Y)), dy = Y - ty;
    const d = Math.sqrt(dx*dx + dy*dy + dz*dz), pen = cy.r + r - d;
    if (pen > 0) hit(d > 1e-9 ? dx/d : 1, d > 1e-9 ? dy/d : 0, d > 1e-9 ? dz/d : 0, pen);
  }
}

/* ---------- collisions ---------- */
function collide(b, w, mu) {
  if (!w.grid) buildGrid(w);
  const n = b.n, x = b.x, px = b.px, cf = b.cflag, cn = b.cn, nf = b.nofric;
  const A = w.A, lim = A - 0.12, hmax = w.hmax;
  const GC = w.grid.CS, GN = w.grid.n, cells = w.grid.cells;

  function resolve(i3, i, nx, ny, nz, pen) {
    x[i3] += nx*pen; x[i3+1] += ny*pen; x[i3+2] += nz*pen;
    const dx = x[i3]-px[i3], dy = x[i3+1]-px[i3+1], dz = x[i3+2]-px[i3+2];
    const dn = dx*nx + dy*ny + dz*nz;
    const tx = dx - nx*dn, ty = dy - ny*dn, tz = dz - nz*dn;
    const tl = Math.sqrt(tx*tx + ty*ty + tz*tz);
    if (tl > 1e-12) {
      const maxF = (nf[i] || ny < -0.5 ? 0.08 : 1) * mu * pen;
      const f = tl <= maxF ? 1 : maxF / tl;
      x[i3] -= tx*f; x[i3+1] -= ty*f; x[i3+2] -= tz*f;
    }
    cf[i] = 1; cn[i3] = nx; cn[i3+1] = ny; cn[i3+2] = nz;
  }
  function flag(i3, i, nx, ny, nz) { cf[i] = 1; cn[i3] = nx; cn[i3+1] = ny; cn[i3+2] = nz; }

  for (let i = 0; i < n; i++) {
    const i3 = 3*i;
    let pen = -lim - x[i3];  if (pen > 0) x[i3] += pen;
    pen = x[i3] - lim;       if (pen > 0) x[i3] -= pen;
    pen = -lim - x[i3+2];    if (pen > 0) x[i3+2] += pen;
    pen = x[i3+2] - lim;     if (pen > 0) x[i3+2] -= pen;

    const X = x[i3], Y = x[i3+1], Z = x[i3+2];
    if (Y - RP - MARGIN < hmax) {
      ground(w, X, Z);
      const hg = gout[0], gx = gout[1], gz = gout[2];
      const inv = 1 / Math.sqrt(1 + gx*gx + gz*gz);
      pen = RP - (Y - hg) * inv;
      if (pen > 0) resolve(i3, i, -gx*inv, inv, -gz*inv, pen);
      else if (pen > -MARGIN) flag(i3, i, -gx*inv, inv, -gz*inv);
    }
    let ci = ((x[i3] + A) / GC) | 0, cj = ((x[i3+2] + A) / GC) | 0;
    if (ci < 0) ci = 0; else if (ci >= GN) ci = GN - 1;
    if (cj < 0) cj = 0; else if (cj >= GN) cj = GN - 1;
    const cell = cells[cj * GN + ci];

    const boxes = cell.b;
    for (let j = 0; j < boxes.length; j++) {
      const bx = boxes[j], c = bx.c, R = bx.R, hh = bx.h;
      const dx = x[i3]-c[0], dy = x[i3+1]-c[1], dz = x[i3+2]-c[2];
      const rr = bx.br + RP + MARGIN;
      if (dx*dx + dy*dy + dz*dz > rr*rr) continue;
      const lx = R[0]*dx + R[3]*dy + R[6]*dz;
      const ly = R[1]*dx + R[4]*dy + R[7]*dz;
      const lz = R[2]*dx + R[5]*dy + R[8]*dz;
      const qx = Math.abs(lx) - hh[0], qy = Math.abs(ly) - hh[1], qz = Math.abs(lz) - hh[2];
      if (qx > RP + MARGIN || qy > RP + MARGIN || qz > RP + MARGIN) continue;
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
      const out = Math.sqrt(ox*ox + oy*oy + oz*oz);
      let sd, nlx, nly, nlz;
      if (out > 0) {
        sd = out;
        nlx = ox/out * (lx < 0 ? -1 : 1); nly = oy/out * (ly < 0 ? -1 : 1); nlz = oz/out * (lz < 0 ? -1 : 1);
      } else {
        sd = Math.max(qx, qy, qz);
        nlx = 0; nly = 0; nlz = 0;
        if (qx >= qy && qx >= qz) nlx = lx < 0 ? -1 : 1;
        else if (qy >= qz) nly = ly < 0 ? -1 : 1;
        else nlz = lz < 0 ? -1 : 1;
      }
      const wx = R[0]*nlx + R[1]*nly + R[2]*nlz;
      const wy = R[3]*nlx + R[4]*nly + R[5]*nlz;
      const wz = R[6]*nlx + R[7]*nly + R[8]*nlz;
      pen = RP - sd;
      if (pen > 0) resolve(i3, i, wx, wy, wz, pen);
      else if (pen > -MARGIN) flag(i3, i, wx, wy, wz);
    }
    const spheres = cell.s;
    for (let j = 0; j < spheres.length; j++) {
      const s = spheres[j]; if (s.on === false) continue;
      const c = s.c;
      const dx = x[i3]-c[0], dy = x[i3+1]-c[1], dz = x[i3+2]-c[2];
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      pen = s.r + RP - d;
      if (pen > -MARGIN) {
        const nx = d > 1e-9 ? dx/d : 0, ny = d > 1e-9 ? dy/d : 1, nz = d > 1e-9 ? dz/d : 0;
        if (pen > 0) resolve(i3, i, nx, ny, nz, pen); else flag(i3, i, nx, ny, nz);
      }
    }
    const cyls = cell.c;
    for (let j = 0; j < cyls.length; j++) {
      const cy = cyls[j]; if (cy.on === false) continue;
      const c = cy.c;
      const dx = x[i3]-c[0], dz = x[i3+2]-c[2];
      const ty = Math.max(c[1], Math.min(c[1] + cy.h, x[i3+1]));
      const dy = x[i3+1] - ty;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      pen = cy.r + RP - d;
      if (pen > -MARGIN) {
        const nx = d > 1e-9 ? dx/d : 1, ny = d > 1e-9 ? dy/d : 0, nz = d > 1e-9 ? dz/d : 0;
        if (pen > 0) resolve(i3, i, nx, ny, nz, pen); else flag(i3, i, nx, ny, nz);
      }
    }
  }
}

/* ---------- stepping ---------- */
function substep(b, w, P, c, h) {
  const n = b.n, x = b.x, px = b.px, v = b.v, cf = b.cflag, cn = b.cn, nf = b.nofric;
  const mx = c.mx, mz = c.mz, mag = c.mag, gs = c.gs;
  let cx = 0, cy = 0, cz = 0, vx = 0, vy = 0, vz = 0, minY = 1e9, maxY = -1e9;
  for (let i = 0; i < n; i++) {
    const k = 3*i;
    cx += x[k]; cy += x[k+1]; cz += x[k+2];
    vx += v[k]; vy += v[k+1]; vz += v[k+2];
    if (x[k+1] < minY) minY = x[k+1];
    if (x[k+1] > maxY) maxY = x[k+1];
  }
  cx /= n; cy /= n; cz /= n;
  b.com[0] = cx; b.com[1] = cy; b.com[2] = cz;
  vx /= n; vy /= n; vz /= n;
  const H = Math.max(0.05, maxY - minY);
  const sticky = P.sticky, sq = c.sq, glide = c.glide;
  let wcount = 0, wany = 0, ohAny = 0;
  if (c.overhang) for (let i = 0; i < n; i++) { if (cf[i] && cn[3*i+1] <= -0.3) ohAny++; }
  if (c.pit) for (let i = 0; i < n; i++) { if (cf[i]) { const ny = cn[3*i+1]; if (ny < 0.6 && ny > -0.3) wany++; } }
  if ((sticky > 0 || c.pit) && mag > 0.01) {
    for (let i = 0; i < n; i++) {
      if (!cf[i]) continue;
      const ny = cn[3*i+1];
      if (ny < 0.6 && ny > -0.3 && -(mx*cn[3*i] + mz*cn[3*i+2]) > 0.25) wcount++;
    }
  }
  const wallMode = Math.min(1, wcount / 20);
  b.lastWallMode = wallMode;
  const tx = mx * c.maxSpeed, tz = mz * c.maxSpeed;
  const dk = DAMP * h;

  for (let i = 0; i < n; i++) {
    const k = 3*i;
    const hn = (x[k+1] - minY) / H;
    nf[i] = 0;
    v[k+1] += G * gs * h;
    v[k]   -= (v[k]   - vx) * dk;
    v[k+1] -= (v[k+1] - vy) * dk;
    v[k+2] -= (v[k+2] - vz) * dk;
    v[k] += c.wx * c.cwx * h; if (c.wy !== 0) v[k+1] += (c.wy - v[k+1]) * c.cwy * h;   /* updrafts pull you toward their speed (Ride only) */ v[k+2] += c.wz * c.cwx * h;
    if (c.brake > 0) { v[k] -= vx * c.brake * h; v[k+2] -= vz * c.brake * h; }   // idle on the ground: hold position (no drifting on wind or slopes)
    if (mag > 0.01) {
      const kk = Math.min(1, DRIVE * h * c.control * (0.55 + 0.7*hn));
      v[k] += (tx - v[k]) * kk; v[k+2] += (tz - v[k+2]) * kk;
    }
    if (sq > 0) v[k+1] -= hn * sq * SQUASH * h;
    if (glide) {
      if (v[k+1] < c.glideCap) v[k+1] += (c.glideCap - v[k+1]) * Math.min(1, 60*h);
      if (c.hover) v[k+1] -= v[k+1] * 6 * h;                    // brief float: hang at the top of the jump
      const rx = x[k] - cx, rz = x[k+2] - cz, rl = Math.sqrt(rx*rx + rz*rz);
      if (rl < 1.3 && rl > 1e-4) { v[k] += rx/rl * 5 * h; v[k+2] += rz/rl * 5 * h; }
      v[k+1] += 6 * h;
    }
    if (sticky > 0) {
      let cling = false;
      if (cf[i]) { const ny = cn[k+1]; if ((ny < 0.6 && ny > -0.3) || (c.overhang && ny <= -0.3)) { cling = true; if (wallMode > 0) nf[i] = 1; } }
      if (cling) v[k+1] -= G * h * 0.92 * sticky;
      if (c.overhang && ohAny >= 4) { v[k+1] -= G * gs * h * 0.92 * sticky; v[k+1] *= (1 - 14 * h); v[k] *= (1 - 4 * h); v[k+2] *= (1 - 4 * h); }   // body-wide grip while any part of it clings to an overhang
      if (c.overhang && cf[i] && cn[k+1] <= -0.3) { v[k] -= cn[k] * 160 * h; v[k+1] -= cn[k+1] * 160 * h; v[k+2] -= cn[k+2] * 160 * h; v[k] *= (1 - 30 * h); v[k+1] *= (1 - 30 * h); v[k+2] *= (1 - 30 * h); }   // sticky pull into an overhang (short budget)
      if (wallMode > 0 && v[k+1] < 4.5) {
        if (!cling) v[k+1] -= G * h * 0.92 * sticky * wallMode;
        v[k+1] += sticky * CLIMB * h * wallMode;
      }
    }
    if (c.pit && wany >= 4) {                       // stone pitons: climb at 2 m/s while pushing in, hang without slipping
      if (cf[i]) nf[i] = 1;
      if (wallMode > 0) v[k+1] += (2.0 - v[k+1]) * Math.min(1, 10 * h);
      else if (b.pitHold) { v[k+1] -= G * gs * h; v[k+1] *= (1 - 8 * h); v[k] -= b.wallNx * 4 * h; v[k+2] -= b.wallNz * 4 * h; }   // keep pressing into the wall
    }
    cf[i] = 0;
    px[k] = x[k]; px[k+1] = x[k+1]; px[k+2] = x[k+2];
    let dx = v[k]*h, dy = v[k+1]*h, dz = v[k+2]*h;
    const dl = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dl > MAXD) { const s = MAXD/dl; dx *= s; dy *= s; dz *= s; v[k] *= s; v[k+1] *= s; v[k+2] *= s; }
    x[k] += dx; x[k+1] += dy; x[k+2] += dz;
  }

  shapeMatch(b, c.kShape);
  for (let it = 0; it < ITERS; it++) {
    edgeStep(b, c.kEdge);
    volumeStep(b, c.pressure, 0.5);
    collide(b, w, c.mu);
  }
  const ih = 1 / h;
  for (let i = 0; i < 3*n; i++) v[i] = (x[i] - px[i]) * ih;
}

function powerMul(P) { return (P.jboost || 1) * (P.spring ? 1.35 : 1); }

function doJump(b, P) {
  const J = (JMIN + (P.jmax - JMIN) * b.charge) * powerMul(P);
  const n = b.n, x = b.x, v = b.v;
  let minY = 1e9, maxY = -1e9;
  for (let i = 0; i < n; i++) { const y = x[3*i+1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const H = Math.max(0.05, maxY - minY);
  const wall = b.avgN[1] < 0.7;
  for (let i = 0; i < n; i++) {
    const k = 3*i, hn = (x[k+1] - minY) / H;
    v[k+1] = Math.max(v[k+1], 0) + J * (0.88 + 0.24*hn);
    if (wall) { v[k] += b.avgN[0] * J * 0.35; v[k+2] += b.avgN[2] * J * 0.35; }
  }
  updateStats(b);
  b.jumpActive = true; b.lastPower = J; b.takeoffY = b.com[1]; b.peak = 0;
  b.cooldown = 0.18; b.groundTimer = 0; b.charge = 0; b.pitHold = false;
}

function slam(b) {
  const v = b.v;
  for (let i = 0; i < b.n; i++) { v[3*i] *= 0.2; v[3*i+1] = -26; v[3*i+2] *= 0.2; }
  b.pounding = true; b.poundQueued = false; b.charge = 0;
}

function heartPop(b) {
  updateStats(b);
  const x = b.x, v = b.v, c = b.com;
  for (let i = 0; i < b.n; i++) {
    const k = 3*i, rx = x[k]-c[0], ry = x[k+1]-c[1], rz = x[k+2]-c[2], l = Math.sqrt(rx*rx + ry*ry + rz*rz) + 1e-6;
    v[k] += rx/l * 4.5; v[k+1] += ry/l * 4.5 + 3; v[k+2] += rz/l * 4.5;
  }
}

function stepBody(b, w, P, inp, dt) {
  const held = !!inp.jumpHeld;
  let mx = inp.mx || 0, mz = inp.mz || 0;
  const mag = Math.min(1, Math.hypot(mx, mz));
  if (mag > 1) { mx /= mag; mz /= mag; }
  if (b.cooldown > 0) b.cooldown -= dt;

  // melt blends toward the requested state
  const meltTarget = (inp.melt && !P.noMelt) ? 1 : 0;
  b.melt += (meltTarget - b.melt) * Math.min(1, dt * 5);
  if (b.melt < 0.001 && !meltTarget) b.melt = 0;
  const shrinkT = (inp.melt && P.canShrink) ? 1 : 0;       // stone pebble: shrink to fit small gaps
  b.shrink += (shrinkT - b.shrink) * Math.min(1, dt * 5); if (b.shrink < 0.001 && !shrinkT) b.shrink = 0;
  b.scale = 1 - SHRINK * b.shrink;

  if (b.groundTimer <= 0) b.airTime += dt; else b.airTime = 0;

  // one-shot actions
  if (inp.heart) { heartPop(b); b.events.push({ t: 'heart', x: b.com[0], y: b.com[1], z: b.com[2] }); }
  if (inp.pound && b.melt < 0.4 && !b.pounding) {
    if (b.groundTimer > 0 && b.cooldown <= 0) { b.charge = 0.5; doJump(b, P); b.poundQueued = true; }
    else if (b.groundTimer <= 0) slam(b);
  }
  if (b.poundQueued) {
    if (b.groundTimer <= 0 && b.cooldown <= 0 && b.vcom[1] < 0.5) slam(b);
    else if (b.groundTimer > 0 && b.cooldown <= 0) b.poundQueued = false;
  }

  // jump charge / release
  if (held && b.melt < 0.4) {
    if (b.groundTimer > 0 && b.cooldown <= 0) b.charge = Math.min(1, b.charge + dt / CHARGE_T);
    else if (b.airTime > 0.1) b.charge = 0;
  } else {
    if (!held && b.prevHeld && b.groundTimer > 0 && b.cooldown <= 0 && b.melt < 0.4) doJump(b, P);
    b.charge = 0;
  }
  b.prevHeld = held;

  b.gliding = !P.noGlide && held && b.groundTimer <= 0 && b.airTime > 0.18 && !b.pounding && b.melt < 0.3;
  if (b.contacts >= 3 && b.avgN[1] > 0.5) { b.hoverLeft = P.hoverTime || 0.8; b.clingLeft = 1.5; }
  b.hovering = b.gliding && Math.abs(b.vcom[1]) < 1.6 && b.hoverLeft > 0;    // brief float at the top of a jump
  if (b.hovering) b.hoverLeft -= dt;

  const s = Math.max(0, Math.min(1, P.stiff));
  let kShape = s*s*s * (1 - 0.85*b.charge) * (1 - 0.97*b.melt);
  if (b.gliding) kShape *= 0.4;
  const sk = Math.max(0, Math.min(1, P.skin));
  const kEdge = (0.02 + 0.7*sk*sk*sk) * (1 - 0.7*b.melt);
  const gripMul = (P.gripMul || 1) * (1 - 0.5*b.melt);
  const ctx = {
    mx: mx, mz: mz, mag: mag,
    control: b.groundTimer > 0 ? 1 : (b.gliding ? 0.9 : 0.3),
    kShape: kShape, kEdge: kEdge,
    mu: (0.15 + 1.6 * P.grip) * gripMul,
    pressure: P.pressure * (1 - 0.45*b.melt),
    gs: (P.gscale || 1) * (b.hovering ? 0.3 : 1),
    sq: Math.max(b.charge, b.melt * 0.9, (b.gliding && !b.hovering) ? 0.3 : 0),
    glide: b.gliding, hover: b.hovering, pit: !!P.pit, glideCap: P.glideCap || -2.2, overhang: b.clingLeft > 0 && P.sticky > 0.3,
    maxSpeed: MAXSPEED * (b.gliding ? 1.3 : 1) * (1 - 0.2*b.melt) * (P.speedMul || 1)
  };
  // Wind: Steady by default (it never moves, slows or lifts you). Hold Ride to let it carry and boost you.
  const riding = !!inp.ride;
  let wnd = riding ? (inp.wind || [0, 0, 0]) : [0, 0, 0], tail = 0;
  if (riding && mag > 0.05) {
    const dx = mx / mag, dz = mz / mag, dn = wnd[0] * dx + wnd[2] * dz;
    if (dn < 0) wnd = [wnd[0] - dn * dx, wnd[1], wnd[2] - dn * dz];   // headwinds never slow you
    else tail = Math.min(1, dn / 4);                                  // tailwinds speed you up
  }
  const wBase = P.windMul === undefined ? 1 : P.windMul;               // ride strength: slime 1, stone 0.5
  const wm = wBase * (b.kind === 'cube' ? 0.8 : 1) * (1 - 0.7*b.melt);
  ctx.wx = wnd[0]; ctx.wy = wnd[1]; ctx.wz = wnd[2];
  ctx.cwx = 0.8 * wm * (b.gliding ? 1.5 : 1); ctx.cwy = (b.gliding ? 12 : 0.8) * wm;
  ctx.maxSpeed *= 1 + 0.4 * tail * Math.min(1, wBase);
  ctx.brake = (mag < 0.05 && b.groundTimer > 0 && b.melt < 0.5 && !b.pounding && !riding) ? 25 : 0;
  const h = dt / SUB;
  for (let s2 = 0; s2 < SUB; s2++) substep(b, w, P, ctx, h);

  updateStats(b);
  const thr = (P.sticky > 0.3 || P.pit) ? -0.2 : 0.3;
  let cnt = 0, ax = 0, ay = 0, az = 0;
  for (let i = 0; i < b.n; i++) {
    if (b.cflag[i] && b.cn[3*i+1] > thr) { cnt++; ax += b.cn[3*i]; ay += b.cn[3*i+1]; az += b.cn[3*i+2]; }
  }
  b.contacts = cnt;
  if (cnt > 0) { const l = Math.hypot(ax, ay, az) || 1; b.avgN[0] = ax/l; b.avgN[1] = ay/l; b.avgN[2] = az/l; }
  if (b.cooldown <= 0 && cnt >= 3) b.groundTimer = 0.12;
  else b.groundTimer = Math.max(0, b.groundTimer - dt);
  { // wall bookkeeping: pitons keep holding after you stop pushing; overhang cling is a short budget
    let wallC = 0, ohC = 0, wsx = 0, wsz = 0;
    for (let i = 0; i < b.n; i++) { if (!b.cflag[i]) continue; const ny = b.cn[3*i+1]; if (ny < 0.6 && ny > -0.3) { wallC++; wsx += b.cn[3*i]; wsz += b.cn[3*i+2]; } else if (ny <= -0.3) ohC++; }
    if (wallC > 0) { const l = Math.hypot(wsx, wsz) || 1; b.wallNx = wsx / l; b.wallNz = wsz / l; }
    b.pitHold = !!P.pit && wallC >= 4 && !(held && b.charge > 0.05) && (b.lastWallMode > 0 || b.pitHold);
    if (P.sticky > 0.3 && ohC >= 4) b.clingLeft = Math.max(0, b.clingLeft - dt);
  }
  if (b.gliding) b.glideTime += dt;
  if (b.contacts >= 3 && b.avgN[1] > 0.5) {
    if (b.glideTime > 0.5 && P.landPound && b.cooldown <= 0) b.events.push({ t: 'pound', x: b.com[0], y: b.com[1], z: b.com[2] });   // stone sail lands with a free shockwave
    b.glideTime = 0;
  }

  if (b.pounding && cnt >= 3 && b.avgN[1] > 0.3) {
    b.pounding = false;
    b.events.push({ t: 'pound', x: b.com[0], y: b.com[1], z: b.com[2] });
  }

  if (b.jumpActive) {
    b.peak = Math.max(b.peak, b.com[1] - b.takeoffY);
    if (b.groundTimer > 0 && b.cooldown <= 0) { b.jumpActive = false; b.lastPeak = b.peak; }
  }
}

function jumpHeight(P, charge) {
  const J = (JMIN + (P.jmax - JMIN) * charge) * powerMul(P);
  return { power: J, height: J*J / (2 * -G * (P.gscale || 1)) };
}

// Per-form parameter overrides (single source of truth, used by the game and by the tests).
// Slime: sticky climbing, glide, melt. Stone: rigid body with pitons (climb and hang), crystal sail (glide with a landing shockwave), pebble (shrink).
function formParams(kind, P, out) {
  out = out || {}; Object.assign(out, P);
  if (kind === 'stone') {
    out.stiff = 1; out.skin = 1; out.sticky = 0; out.noGlide = false; out.noMelt = true; out.pit = true; out.glideCap = -3; out.landPound = true; out.canShrink = true;
    out.hoverTime = 0.5; out.windMul = 0.5; out.grip = Math.min(P.grip, 0.35); out.jmax = P.jmax * 0.85; out.speedMul = (P.speedMul || 1) * 1.1;
  } else { out.noGlide = false; out.noMelt = false; out.pit = false; out.glideCap = -2.2; out.landPound = false; out.canShrink = false; out.hoverTime = 0.8; out.windMul = 1; }
  return out;
}

return { makeSlime, stepBody, updateStats, jumpHeight, groundHeight, forEachContact, formParams, constants: { G, RP } };
})();

// ESM named exports (parity with the prototype return table; default keeps the namespace).
export const { makeSlime, stepBody, updateStats, jumpHeight, groundHeight, forEachContact, formParams, constants } = Phys;
export default Phys;
