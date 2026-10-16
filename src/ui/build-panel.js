/**
 * Build panel module - Build mode UI (ghost preview, placement, rotation, removal).
 * Ported verbatim from game.js build-mode UI functions.
 */

import Build from '../gameplay/build.js';
import Craft from '../gameplay/craft.js';
import { buildPieceObj } from '../render/pieces.js';

/**
 * Create build panel controller.
 * @param {object} deps - Dependencies
 * @returns {object} Build panel controller
 */
export function createBuildPanel(deps) {
  const {
    $, scene, ghostMat,
    com, facing, inv, formKind,
    pieceGroup, pieceObjs,
    chime, emoTrigger, saveSave, renderInv
  } = deps;

  // Mutable build-mode state (owned by this module)
  let ghostObj = null;
  let ghostType = '';
  let ghostYaw = 0;
  let ghostG = null;
  let lastGhostTxt = '';
  let buildMode = false;
  let selPiece = 'workbench';
  let bs = null;

  function setBs(newBs) { bs = newBs; }

  function setGhostObj(type) {
    if (ghostObj) scene.remove(ghostObj);
    ghostType = type;
    const info = buildPieceObj(type, null);
    info.obj.traverse(o => { if (o.isMesh) { o.material = ghostMat; o.castShadow = false; } });
    ghostObj = info.obj;
    ghostObj.visible = false;
    scene.add(ghostObj);
  }

  function toggleBuild() {
    buildMode = !buildMode;
    $('bMode').setAttribute('aria-pressed', buildMode);
    if (!buildMode && ghostObj) ghostObj.visible = false;
  }

  function cyclePiece(d) {
    const list = Build.PLACEABLE;
    selPiece = list[(list.indexOf(selPiece) + d + list.length) % list.length];
    $('bPiece').value = selPiece;
  }

  function rotateGhost() { ghostYaw = (ghostYaw + 90) % 360; }

  function updateGhost() {
    if (!buildMode) { $('buildInfo').textContent = 'Build mode is off (P)'; return; }
    if (ghostType !== selPiece) setGhostObj(selPiece);
    const c = com();
    const ahead = (selPiece === 'foundation' || selPiece === 'roof') ? 4.5 : 3.5;
    const tx = c[0] + facing.x * ahead, tz = c[2] + facing.z * ahead;
    const g = Build.ghost(bs, selPiece, { x: c[0], y: c[1], z: c[2] }, tx, tz, ghostYaw, formKind);
    if (g.valid && (inv[selPiece] || 0) < 1) { g.valid = false; g.reason = 'None in inventory (craft one)'; }
    ghostG = g;
    ghostObj.position.set(g.x, g.y, g.z);
    ghostObj.rotation.y = g.yaw * Math.PI / 180;
    ghostObj.visible = true;
    ghostMat.color.setHex(g.valid ? 0x55ee88 : 0xf43f5e);
    const txt = Craft.ITEMS[selPiece] + ' (you have ' + (inv[selPiece] || 0) + '): ' + (g.valid ? 'ready, press Enter or tap Place' : g.reason);
    if (txt !== lastGhostTxt) { lastGhostTxt = txt; $('buildInfo').textContent = txt; }
  }

  function placeGhost(addPieceObjFn, renderInvFn, chimeFn, emoTriggerFn, saveSaveFn) {
    if (!buildMode || !ghostG || !ghostG.valid) return;
    const rec = Build.place(bs, ghostG);
    if (!rec) return;
    inv[selPiece]--;
    addPieceObjFn(rec);
    renderInvFn();
    chimeFn([392, 523, 659], 0.05);
    emoTriggerFn('proud', 1.6);
    saveSaveFn();
  }

  function removeNear(renderInvFn, chimeFn, saveSaveFn) {
    const c = com();
    const p = Build.nearestPiece(bs, c[0], c[2], 5);
    if (!p) return;
    const gone = Build.remove(bs, p.id) || [];
    gone.forEach(r => {
      const i = pieceObjs.get(r.id);
      if (i) { pieceGroup.remove(i.obj); pieceObjs.delete(r.id); }
      inv[r.type] = (inv[r.type] || 0) + 1;
    });
    renderInvFn();
    chimeFn([330, 262], 0.05);
    saveSaveFn();
  }

  return {
    setGhostObj, toggleBuild, cyclePiece, rotateGhost, updateGhost, placeGhost, removeNear, setBs,
    get ghostObj() { return ghostObj; },
    get ghostType() { return ghostType; },
    get ghostYaw() { return ghostYaw; },
    get ghostG() { return ghostG; },
    get lastGhostTxt() { return lastGhostTxt; },
    get buildMode() { return buildMode; },
    get selPiece() { return selPiece; },
    get bs() { return bs; }
  };
}
