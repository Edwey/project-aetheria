/**
 * src/gameplay/craft.js <- Craft - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Pocket vs workbench recipes.
 */


const Craft = (function () {
'use strict';
const RES = ['timber', 'sap', 'fiber', 'starstone', 'clay', 'petal', 'spore'];
const ITEMS = {
  timber: 'Timber', sap: 'Sap', fiber: 'Fibre', starstone: 'Starstone', clay: 'Clay', petal: 'Petals', spore: 'Spores',
  twine: 'Twine', torch: 'Torch', campfire: 'Campfire', bowl: 'Clay bowl', workbench: 'Workbench',
  foundation: 'Foundation', wall: 'Log wall', doorwall: 'Door wall', roof: 'Thatched roof', table: 'Table', bed: 'Bed'
};
// station: 'pocket' = craftable anywhere, 'bench' = needs a placed workbench within BENCH_RANGE
const RECIPES = [
  { id: 'twine',      out: 'twine',      n: 1, cost: { fiber: 2 },                    station: 'pocket' },
  { id: 'torch',      out: 'torch',      n: 1, cost: { timber: 1, sap: 1 },           station: 'pocket' },
  { id: 'campfire',   out: 'campfire',   n: 1, cost: { timber: 3, sap: 1 },           station: 'pocket' },
  { id: 'bowl',       out: 'bowl',       n: 1, cost: { clay: 2 },                     station: 'pocket' },
  { id: 'workbench',  out: 'workbench',  n: 1, cost: { timber: 5, twine: 2 },         station: 'pocket' },
  { id: 'foundation', out: 'foundation', n: 1, cost: { timber: 4, twine: 1 },         station: 'bench' },
  { id: 'wall',       out: 'wall',       n: 1, cost: { timber: 2, twine: 1 },         station: 'bench' },
  { id: 'doorwall',   out: 'doorwall',   n: 1, cost: { timber: 2, twine: 1 },         station: 'bench' },
  { id: 'roof',       out: 'roof',       n: 1, cost: { fiber: 3, timber: 1 },         station: 'bench' },
  { id: 'table',      out: 'table',      n: 1, cost: { timber: 3 },                   station: 'bench' },
  { id: 'bed',        out: 'bed',        n: 1, cost: { timber: 2, fiber: 3, petal: 3 }, station: 'bench' }
];
const BENCH_RANGE = 5;
function costText(r) { return Object.keys(r.cost).map(k => r.cost[k] + ' ' + ITEMS[k]).join(', '); }
function canCraft(inv, r, nearBench) {
  if (r.station === 'bench' && !nearBench) return { ok: false, reason: 'Needs a workbench within ' + BENCH_RANGE + ' m' };
  for (const k in r.cost) if ((inv[k] || 0) < r.cost[k]) return { ok: false, reason: 'Missing ' + (r.cost[k] - (inv[k] || 0)) + ' ' + ITEMS[k] };
  return { ok: true, reason: '' };
}
function craft(inv, r, nearBench) {
  const c = canCraft(inv, r, nearBench); if (!c.ok) return c;
  for (const k in r.cost) inv[k] -= r.cost[k];
  inv[r.out] = (inv[r.out] || 0) + r.n; return c;
}
// same rules for every form: only the stack limit of raw resources differs (stone carries double)
function stackCap(form) { return form === 'stone' ? 80 : 40; }
return { RES, ITEMS, RECIPES, BENCH_RANGE, costText, canCraft, craft, stackCap };
})();

// ESM named exports (parity with the prototype return table; default keeps the namespace).
export const { RES, ITEMS, RECIPES, BENCH_RANGE, costText, canCraft, craft, stackCap } = Craft;
export default Craft;
