/**
 * Craft module - Crafting recipes and logic
 * Pure gameplay module - no THREE, no DOM, runs in Node
 */

'use strict';

const RES = ['timber', 'sap', 'fiber', 'starstone', 'clay', 'petal', 'spore'];

const ITEMS = {
  timber: 'Timber',
  sap: 'Sap',
  fiber: 'Fibre',
  starstone: 'Starstone',
  clay: 'Clay',
  petal: 'Petals',
  spore: 'Spores',
  twine: 'Twine',
  torch: 'Torch',
  campfire: 'Campfire',
  bowl: 'Clay bowl',
  workbench: 'Workbench',
  foundation: 'Foundation',
  wall: 'Log wall',
  doorwall: 'Door wall',
  roof: 'Thatched roof',
  table: 'Table',
  bed: 'Bed'
};

const RECIPES = [
  { id: 'twine', out: 'twine', n: 1, cost: { fiber: 2 }, station: 'pocket' },
  { id: 'torch', out: 'torch', n: 1, cost: { timber: 1, sap: 1 }, station: 'pocket' },
  { id: 'campfire', out: 'campfire', n: 1, cost: { timber: 3, sap: 1 }, station: 'pocket' },
  { id: 'bowl', out: 'bowl', n: 1, cost: { clay: 2 }, station: 'pocket' },
  { id: 'workbench', out: 'workbench', n: 1, cost: { timber: 5, twine: 2 }, station: 'pocket' },
  { id: 'foundation', out: 'foundation', n: 1, cost: { timber: 4, twine: 1 }, station: 'bench' },
  { id: 'wall', out: 'wall', n: 1, cost: { timber: 2, twine: 1 }, station: 'bench' },
  { id: 'doorwall', out: 'doorwall', n: 1, cost: { timber: 2, twine: 1 }, station: 'bench' },
  { id: 'roof', out: 'roof', n: 1, cost: { fiber: 3, timber: 1 }, station: 'bench' },
  { id: 'table', out: 'table', n: 1, cost: { timber: 3 }, station: 'bench' },
  { id: 'bed', out: 'bed', n: 1, cost: { timber: 2, fiber: 3, petal: 3 }, station: 'bench' }
];

const BENCH_RANGE = 5;

export { RES, ITEMS, RECIPES, BENCH_RANGE };
