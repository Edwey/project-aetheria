/**
 * src/gameplay/build.js <- Build - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Ghost preview, sockets, stilts.
 * Stage C: `Phys` was a browser global in the prototype; ES import here (same numbers).
 */

import { groundHeight } from './physics.js';

const Build = (function () {
'use strict';
const FT = 0.25, WALL_H = 3, DOOR_GAP = 0.7;
const ROT = yaw => { const a = yaw * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const KIND = { foundation: 'floor', wall: 'wall', doorwall: 'wall', roof: 'roof', table: 'prop', bed: 'prop', campfire: 'ground', torch: 'ground', bowl: 'ground', workbench: 'ground' };
const RADIUS = { table: 0.9, bed: 1.2, campfire: 0.6, torch: 0.25, bowl: 0.35, workbench: 1.0 };
const LIGHTS = { campfire: true, torch: true };
const PLACEABLE = Object.keys(KIND);

function create(world) { return { world, list: [], nextId: 1 }; }
const gy = (w, x, z) => groundHeight(w, x, z);
function footprintHeights(w, x, z, half) {
  let hi = -1e9, lo = 1e9;
  for (const dx of [-half, 0, half]) for (const dz of [-half, 0, half]) { const h = gy(w, x + dx, z + dz); if (h > hi) hi = h; if (h < lo) lo = h; }
  return { hi, lo };
}
function foundations(S) { return S.list.filter(p => p.type === 'foundation'); }
function floorTopAt(S, x, z) { for (const f of foundations(S)) if (Math.abs(x - f.x) <= 2 && Math.abs(z - f.z) <= 2) return f.top; return null; }

// perks: reach and slopeMax depend on the form; everything else is identical for all forms
function perks(form) { return { reach: form === 'wisp' ? 7 : 4.5, slopeMax: form === 'slime' ? 4.0 : 2.5 }; }

// c = creature {x,y,z}; (tx,tz) = where the player is aiming (usually in front of the creature)
function ghost(S, type, c, tx, tz, yaw, form) {
  const w = S.world, kind = KIND[type], pk = perks(form), g = { type, x: tx, y: 0, z: tz, yaw: yaw || 0, valid: false, reason: '', fId: 0, edge: -1, top: 0 };
  const lim = w.A - 3;
  if (Math.abs(tx) > lim || Math.abs(tz) > lim) { g.reason = 'Out of bounds'; return g; }
  const nearest = (list, px, pz, maxD) => { let best = null, bd = maxD; for (const o of list) { const d = Math.hypot(o.x - px, o.z - pz); if (d < bd) { bd = d; best = o; } } return best; };
  if (kind === 'floor') {
    let x = Math.round(tx / 2) * 2, z = Math.round(tz / 2) * 2, top = null, snapped = false;
    let best = null, bd = 3;
    for (const f of foundations(S)) for (const o of [[4, 0], [-4, 0], [0, 4], [0, -4]]) {
      const sx = f.x + o[0], sz = f.z + o[1], d = Math.hypot(sx - tx, sz - tz);
      if (d < bd && !foundations(S).some(q => Math.abs(q.x - sx) < 0.5 && Math.abs(q.z - sz) < 0.5)) { bd = d; best = { x: sx, z: sz, top: f.top }; }
    }
    if (best) { x = best.x; z = best.z; top = best.top; snapped = true; }
    const hh = footprintHeights(w, x, z, 2);
    if (top === null) top = hh.hi + 0.3;
    g.x = x; g.z = z; g.top = top; g.y = top - FT / 2; g.snapped = snapped;
    if (hh.hi - hh.lo > pk.slopeMax) { g.reason = 'Too steep'; return g; }
    if (foundations(S).some(q => Math.abs(q.x - x) < 3.9 && Math.abs(q.z - z) < 3.9)) { g.reason = 'Overlaps another floor'; return g; }
    if (S.list.some(p => p.type !== 'foundation' && Math.abs(p.x - x) < 2.4 && Math.abs(p.z - z) < 2.4)) { g.reason = 'Something is in the way'; return g; }
    if (Math.abs(c.x - x) < 2.2 && Math.abs(c.z - z) < 2.2 && Math.abs(c.y - top) < 1.5) { g.reason = 'You are in the way'; return g; }
  } else if (kind === 'wall') {
    let best = null, bd = 3.5;
    for (const f of foundations(S)) [[0, -2, 0], [0, 2, 0], [-2, 0, 90], [2, 0, 90]].forEach((o, i) => {
      const sx = f.x + o[0], sz = f.z + o[1], d = Math.hypot(sx - tx, sz - tz);
      if (d < bd && !S.list.some(p => (p.type === 'wall' || p.type === 'doorwall') && p.fId === f.id && p.edge === i)) { bd = d; best = { f, i, sx, sz, yaw: o[2] }; }
    });
    if (!best) { g.reason = 'Needs a free foundation edge'; return g; }
    g.x = best.sx; g.z = best.sz; g.y = best.f.top + WALL_H / 2; g.yaw = best.yaw; g.fId = best.f.id; g.edge = best.i; g.top = best.f.top;
  } else if (kind === 'roof') {
    const f = nearest(foundations(S).filter(q => !S.list.some(p => p.type === 'roof' && p.fId === q.id)), tx, tz, 3.5);
    if (!f) { g.reason = 'Needs a floor without a roof'; return g; }
    g.x = f.x; g.z = f.z; g.y = f.top + WALL_H + 0.15; g.fId = f.id; g.top = f.top;
  } else if (kind === 'prop') {
    const f = nearest(foundations(S), tx, tz, 3.2);
    if (!f) { g.reason = 'Place on a floor'; return g; }
    const r = RADIUS[type], lim2 = 1.9 - r * 0.5;
    g.x = f.x + Math.max(-lim2, Math.min(lim2, Math.round((tx - f.x) * 2) / 2)); g.z = f.z + Math.max(-lim2, Math.min(lim2, Math.round((tz - f.z) * 2) / 2));
    g.y = f.top; g.fId = f.id; g.top = f.top;
    if (S.list.some(p => (KIND[p.type] === 'prop' || p.type === 'workbench') && Math.hypot(p.x - g.x, p.z - g.z) < r + (RADIUS[p.type] || 1))) { g.reason = 'Too close to another piece'; return g; }
  } else { // ground items
    const x = Math.round(tx * 2) / 2, z = Math.round(tz * 2) / 2, ft = floorTopAt(S, x, z);
    g.x = x; g.z = z; g.y = ft !== null ? ft : gy(w, x, z); g.top = g.y;
    if (ft === null) { const hh = footprintHeights(w, x, z, 0.5); if (hh.hi - hh.lo > 0.6) { g.reason = 'Too steep'; return g; } }
    const r = RADIUS[type] || 0.5;
    if (S.list.some(p => p.type !== 'foundation' && p.type !== 'roof' && p.type !== 'wall' && p.type !== 'doorwall' && Math.hypot(p.x - g.x, p.z - g.z) < r + (RADIUS[p.type] || 0.5))) { g.reason = 'Too close to another piece'; return g; }
  }
  const ext = { foundation: 2.8, roof: 2.8, wall: 2, doorwall: 2 }[type] || 0.4;   // reach is measured to the nearest edge of the piece
  if (Math.hypot(c.x - g.x, c.z - g.z) - ext > pk.reach) { g.reason = 'Too far (reach ' + pk.reach + ' m)'; return g; }
  g.valid = true; return g;
}

function colliders(type, x, y, z, yaw) {
  const R = ROT(yaw), box = (cx, cy, cz, hx, hy, hz) => ({ c: [cx, cy, cz], h: [hx, hy, hz], R, br: Math.hypot(hx, hy, hz), tag: 'built' });
  const loc = (lx, ly, lz) => { const a = yaw * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [x + lx * c + lz * s, y + ly, z - lx * s + lz * c]; };
  const out = { boxes: [], cyls: [] };
  if (type === 'foundation') out.boxes.push(box(x, y, z, 2, FT / 2, 2));
  else if (type === 'wall') out.boxes.push(box(x, y, z, 2, WALL_H / 2, 0.15));
  else if (type === 'doorwall') {
    const seg = (4 - 2 * DOOR_GAP) / 2;
    [-1, 1].forEach(sg => { const p = loc(sg * (DOOR_GAP + seg / 2), 0, 0); out.boxes.push(box(p[0], p[1], p[2], seg / 2, WALL_H / 2, 0.15)); });
    const l = loc(0, 1.1, 0); out.boxes.push(box(l[0], l[1], l[2], DOOR_GAP, 0.4, 0.15));
  }
  else if (type === 'roof') out.boxes.push(box(x, y, z, 2.3, 0.15, 2.3));
  else if (type === 'table') out.boxes.push(box(x, y + 0.4, z, 0.9, 0.4, 0.55));
  else if (type === 'bed') out.boxes.push(box(x, y + 0.3, z, 0.9, 0.3, 1.2));
  else if (type === 'workbench') out.boxes.push(box(x, y + 0.5, z, 0.9, 0.5, 0.45));
  else if (type === 'campfire') out.cyls.push({ c: [x, y, z], r: 0.45, h: 0.45, on: true, tag: 'built' });
  else if (type === 'torch') out.cyls.push({ c: [x, y, z], r: 0.12, h: 1.4, on: true, tag: 'built' });
  return out;
}
function addColliders(S, rec) { const co = colliders(rec.type, rec.x, rec.y, rec.z, rec.yaw); rec.col = co; S.world.boxes.push(...co.boxes); S.world.cyls.push(...co.cyls); S.world.grid = null; }
function removeColliders(S, rec) {
  const w = S.world; if (!rec.col) return;
  w.boxes = w.boxes.filter(b => rec.col.boxes.indexOf(b) < 0); w.cyls = w.cyls.filter(b => rec.col.cyls.indexOf(b) < 0); w.grid = null;
}
function place(S, g) {
  if (!g.valid) return null;
  const rec = { id: S.nextId++, type: g.type, x: g.x, y: g.y, z: g.z, yaw: g.yaw, fId: g.fId, edge: g.edge, top: g.top };
  if (g.type === 'foundation') { rec.posts = [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].map(o => gy(S.world, g.x + o[0], g.z + o[1])); }
  addColliders(S, rec); S.list.push(rec); return rec;
}
function remove(S, id) {
  const i = S.list.findIndex(p => p.id === id); if (i < 0) return null;
  const rec = S.list[i];
  if (rec.type === 'foundation') { // pieces that depend on a removed floor go with it
    const dep = S.list.filter(p => p.fId === rec.id && p.type !== 'foundation'); const gone = [rec, ...dep];
    gone.forEach(p => { removeColliders(S, p); const k = S.list.indexOf(p); if (k >= 0) S.list.splice(k, 1); }); return gone;
  }
  removeColliders(S, rec); S.list.splice(i, 1); return [rec];
}
function nearestPiece(S, x, z, maxD) { let best = null, bd = maxD; for (const p of S.list) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } } return best; }
function nearBench(S, x, z, range) { return S.list.some(p => p.type === 'workbench' && Math.hypot(p.x - x, p.z - z) <= range); }
function serialize(S) { return S.list.map(p => ({ type: p.type, x: p.x, y: p.y, z: p.z, yaw: p.yaw, fId: p.fId, edge: p.edge, top: p.top, id: p.id })); }
function load(S, data) {
  S.list = []; S.nextId = 1;
  (data || []).forEach(d => { if (!d || PLACEABLE.indexOf(d.type) < 0 || !isFinite(d.x + d.y + d.z)) return; const rec = { id: d.id || S.nextId, type: d.type, x: d.x, y: d.y, z: d.z, yaw: d.yaw || 0, fId: d.fId || 0, edge: d.edge === undefined ? -1 : d.edge, top: d.top || d.y };
    if (rec.type === 'foundation') rec.posts = [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].map(o => gy(S.world, rec.x + o[0], rec.z + o[1]));
    S.nextId = Math.max(S.nextId, rec.id + 1); addColliders(S, rec); S.list.push(rec); });
}
return { create, ghost, place, remove, nearestPiece, nearBench, serialize, load, perks, KIND, RADIUS, LIGHTS, PLACEABLE, WALL_H, FT };
})();

// ESM named exports (parity with the prototype return table; default keeps the namespace).
export const { create, ghost, place, remove, nearestPiece, nearBench, serialize, load, perks, KIND, RADIUS, LIGHTS, PLACEABLE, WALL_H, FT } = Build;
export default Build;
