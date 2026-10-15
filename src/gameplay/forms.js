/**
 * Forms module - Form switching and per-form parameters
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

export function formParams(kind, P, out) {
  out = out || {};
  Object.assign(out, P);

  if (kind === 'stone') {
    out.stiff = 1;
    out.skin = 1;
    out.sticky = 0;
    out.noGlide = false;
    out.noMelt = true;
    out.pit = true;
    out.glideCap = -3;
    out.landPound = true;
    out.canShrink = true;
    out.hoverTime = 0.5;
    out.windMul = 0.5;
    out.grip = Math.min(P.grip, 0.35);
    out.jmax = P.jmax * 0.85;
    out.speedMul = (P.speedMul || 1) * 1.1;
  } else {
    out.noGlide = false;
    out.noMelt = false;
    out.pit = false;
    out.glideCap = -2.2;
    out.landPound = false;
    out.canShrink = false;
    out.hoverTime = 0.8;
    out.windMul = 1;
  }

  return out;
}
