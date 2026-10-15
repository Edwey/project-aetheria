/**
 * Wisp module - Gas form physics
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

const SUB = 2;
const HS = 1024;
const MAXSPEED = 5;
const ACCEL = 14;
const PR = 0.12;
const WIND_CAP = 10;
const TETHER = 2.2;
const FLOAT_COST = 20;
const HOVER_COST = 3;
const FLOAT_REFILL = 60;
const LOW_H = 1.4;
const SINK = 2.5;

export { SUB, HS, MAXSPEED, ACCEL, PR, WIND_CAP, TETHER, FLOAT_COST, HOVER_COST, FLOAT_REFILL, LOW_H, SINK };
