/**
 * Physics module - Position-based dynamics for soft bodies
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

const G = -20;
const RP = 0.07;
const MARGIN = 0.03;
const SUB = 4;
const ITERS = 3;
const SHRINK = 0.35;
const CHARGE_T = 0.85;
const JMIN = 4.5;
const MAXSPEED = 6;
const DRIVE = 16;
const DAMP = 3;
const SQUASH = 75;
const CLIMB = 36;
const MAXD = 0.09;

export { G, RP, MARGIN, SUB, ITERS, SHRINK, CHARGE_T, JMIN, MAXSPEED, DRIVE, DAMP, SQUASH, CLIMB, MAXD };
