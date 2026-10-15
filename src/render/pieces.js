/**
 * Pieces module - Build piece mesh rendering (ghost + placed pieces).
 * Ported verbatim from game.js buildPieceObj/addPieceObj/clearPieceObjs/updatePieces().
 */

import * as THREE from 'three';
import { Build } from '../gameplay/build.js';

const WOOD = 0xb98a5a, LOG = 0xd9b98a, THATCH = 0xc9a24a;

/**
 * Create a piece mesh group from a build record.
 * @param {string} type - Piece type
 * @param {object|null} rec - Build record (null for ghost)
 * @returns {object} { obj: THREE.Group, rec, fade: [], kind, flames: [], light }
 */
export function buildPieceObj(type, rec) {
  const g = new THREE.Group();
  const info = { obj: g, rec, fade: [], kind: null, flames: [], light: false };
  
  const mk = (geo, color, x, y, z, o) => {
    const mt = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85 }, o || {}));
    const me = new THREE.Mesh(geo, mt);
    me.position.set(x, y, z);
    me.castShadow = true;
    me.receiveShadow = true;
    g.add(me);
    return me;
  };

  const box = (w, h, d, color, x, y, z, o) => mk(new THREE.BoxGeometry(w, h, d), color, x, y, z, o);

  if (type === 'foundation') {
    const me = mk(new THREE.BoxGeometry(4, 0.25, 4), WOOD, 0, 0, 0);
    const posts = rec && rec.posts ? rec.posts : [0, 0, 0, 0];
    [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach((o, i) => {
      const len = Math.max(0.2, rec ? (rec.y - 0.125) - posts[i] + 0.3 : 0.5);
      const p = mk(new THREE.CylinderGeometry(0.13, 0.15, len, 8), 0x7a5233, o[0], -0.125 - len / 2, o[1]);
    });
  } else if (type === 'wall') {
    const me = mk(new THREE.BoxGeometry(4, 3, 0.3), LOG, 0, 0, 0, { transparent: true });
    for (let i = -1; i <= 1; i++) {
      const s = mk(new THREE.BoxGeometry(4.04, 0.06, 0.34), 0x9a6a3a, 0, i * 0.9, 0, { transparent: true });
    }
  } else if (type === 'doorwall') {
    const seg = (4 - 1.4) / 2;
    [-1, 1].forEach(sg => mk(new THREE.BoxGeometry(seg, 3, 0.3), LOG, sg * (0.7 + seg / 2), 0, 0, { transparent: true }));
    box(1.4, 0.8, 0.3, LOG, 0, 1.1, 0, { transparent: true });
  } else if (type === 'roof') {
    info.kind = 'roof'; const a = mk(new THREE.BoxGeometry(4.6, 0.3, 4.6), THATCH, 0, 0, 0, { transparent: true });
    const b = mk(new THREE.ConeGeometry(3.2, 1.0, 4), 0xb5523b, 0, 0.65, 0, { transparent: true });
    b.rotation.y = Math.PI / 4;
  } else if (type === 'table') {
    mk(new THREE.BoxGeometry(1.8, 0.14, 1.1), 0x8a5a33, 0, 0.75, 0);
    [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].forEach(o => mk(new THREE.BoxGeometry(0.12, 0.7, 0.12), 0x6e4526, o[0], 0.35, o[1]));
  } else if (type === 'bed') {
    mk(new THREE.BoxGeometry(1.8, 0.35, 2.4), 0x7a5233, 0, 0.18, 0);
    mk(new THREE.BoxGeometry(1.7, 0.25, 2.2), 0x6d8cc2, 0, 0.45, 0);
    mk(new THREE.BoxGeometry(1.3, 0.2, 0.5), 0xfff1d6, 0, 0.65, -0.85);
  } else if (type === 'workbench') {
    mk(new THREE.BoxGeometry(1.8, 0.2, 0.9), 0x9a6a3a, 0, 0.9, 0);
    [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].forEach(o => mk(new THREE.BoxGeometry(0.14, 0.9, 0.14), 0x7a5233, o[0], 0.45, o[1]));
    mk(new THREE.BoxGeometry(0.5, 0.12, 0.2), 0xcfcfd6, 0.4, 1.06, 0);
    mk(new THREE.BoxGeometry(0.14, 0.14, 0.5), 0x8a8a92, -0.4, 1.07, 0);
  } else if (type === 'campfire') {
    for (let i = 0; i < 3; i++) {
      const lg = mk(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6), 0x6e4526, 0, 0.1, 0);
      lg.rotation.z = Math.PI / 2; lg.rotation.y = i * Math.PI / 3;
    }
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      mk(new THREE.SphereGeometry(0.1, 6, 5), 0x8c8a85, Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.42);
    }
    const f1 = mk(new THREE.ConeGeometry(0.22, 0.6, 8), 0xff7a1a, 0, 0.45, 0, { emissive: 0xff5a00, emissiveIntensity: 1.4 });
    const f2 = mk(new THREE.ConeGeometry(0.12, 0.4, 8), 0xffd24a, 0, 0.45, 0, { emissive: 0xffc000, emissiveIntensity: 1.6 });
  } else if (type === 'torch') {
    mk(new THREE.CylinderGeometry(0.04, 0.06, 1.4, 6), 0x6e4526, 0, 0.7, 0);
    mk(new THREE.ConeGeometry(0.12, 0.35, 8), 0xff9a2a, 0, 1.55, 0, { emissive: 0xff7a00, emissiveIntensity: 1.5 });
  } else if (type === 'bowl') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb98a6a, roughness: 0.85, side: THREE.DoubleSide }));
    b.position.set(0, 0.3, 0);
  }
  return { obj: new THREE.Group(), rec, fade: [], kind: null, flames: [], light: false };
}

/**
 * Add a placed piece object to the scene.
 * @param {object} rec - Build record
 * @param {THREE.Group} pieceGroup - Group to add to
 * @param {Map} pieceObjs - Map of piece objects
 * @returns {object} Info object
 */
export function addPieceObj(rec, pieceGroup, pieceObjs) {
  const info = buildPieceObj(rec.type, rec);
  info.obj.position.set(rec.x, rec.y, rec.z);
  info.obj.rotation.y = rec.yaw * Math.PI / 180;
  if (info.kind === 'wall') {
    const N = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    info.n = N[rec.edge] || [0, 1];
  }
  pieceGroup.add(info.obj);
  pieceObjs.set(rec.id, info);
  return info;
}

export function clearPieceObjs(pieceGroup, pieceObjs) {
  pieceObjs.forEach(i => pieceGroup.remove(i.obj));
  pieceObjs.clear();
}

export function initBuildState(world, scene, pieceGroup, pieceObjs, saveData) {
  // Note: actual loading happens in game.js with Build
  return Build.create(world);
}

export { Build };