/**
 * Unified Creature Visual Controller (Phase 3, 4, 5)
 * Manages active creature visual representation (Slime, Wisp, Stone) and smooth switching
 */

import * as THREE from 'three';
import {
  createSlimeMesh,
  updateSlimeVisual,
  setSlimeVisualVariant,
  disposeSlimeVisual,
  type SlimeVisual,
} from './slime-mesh.js';
import {
  createWispMesh,
  updateWispVisual,
  setWispVisualVariant,
  disposeWispVisual,
  type WispVisual,
} from './wisp-mesh.js';
import {
  createStoneMesh,
  updateStoneVisual,
  setStoneVisualVariant,
  disposeStoneVisual,
  type StoneVisual,
} from './stone-mesh.js';
import type {
  SlimeComponent,
  SlimeVariant,
  WispComponent,
  WispVariant,
  StoneComponent,
  StoneVariant,
  Transform,
} from '@sim/index.js';

export type CreatureKind = 'slime' | 'wisp' | 'stone';

export interface CreatureVisualController {
  activeKind: CreatureKind;
  slimeVisual: SlimeVisual | null;
  wispVisual: WispVisual | null;
  stoneVisual: StoneVisual | null;

  setCreature(kind: CreatureKind, variant?: string): void;
  setVariant(variant: string): void;
  update(
    transform: Transform,
    creatureComp: SlimeComponent | WispComponent | StoneComponent,
    linearVelocity?: { x: number; y: number; z: number },
    dt?: number
  ): void;
  dispose(): void;
}

export function createCreatureVisualController(
  scene: THREE.Scene,
  initialKind: CreatureKind = 'slime',
  initialVariant = 'jelly_ball'
): CreatureVisualController {
  let activeKind: CreatureKind = initialKind;
  let slimeVisual: SlimeVisual | null = null;
  let wispVisual: WispVisual | null = null;
  let stoneVisual: StoneVisual | null = null;

  function cleanupCurrent(): void {
    if (slimeVisual) {
      disposeSlimeVisual(slimeVisual, scene);
      slimeVisual = null;
    }
    if (wispVisual) {
      disposeWispVisual(wispVisual, scene);
      wispVisual = null;
    }
    if (stoneVisual) {
      disposeStoneVisual(stoneVisual, scene);
      stoneVisual = null;
    }
  }

  function spawnCreature(kind: CreatureKind, variant?: string): void {
    cleanupCurrent();
    activeKind = kind;

    if (kind === 'slime') {
      const v = (variant as SlimeVariant) || 'jelly_ball';
      slimeVisual = createSlimeMesh(v);
      scene.add(slimeVisual.group);
    } else if (kind === 'wisp') {
      const v = (variant as WispVariant) || 'cloud';
      wispVisual = createWispMesh(v);
      scene.add(wispVisual.group);
    } else if (kind === 'stone') {
      const v = (variant as StoneVariant) || 'boulder';
      stoneVisual = createStoneMesh(v);
      scene.add(stoneVisual.group);
    }
  }

  // Initialize
  spawnCreature(initialKind, initialVariant);

  return {
    get activeKind() {
      return activeKind;
    },
    get slimeVisual() {
      return slimeVisual;
    },
    get wispVisual() {
      return wispVisual;
    },
    get stoneVisual() {
      return stoneVisual;
    },

    setCreature(kind: CreatureKind, variant?: string): void {
      if (activeKind === kind && !variant) return;
      spawnCreature(kind, variant);
    },

    setVariant(variant: string): void {
      if (activeKind === 'slime' && slimeVisual) {
        setSlimeVisualVariant(slimeVisual, variant as SlimeVariant);
      } else if (activeKind === 'wisp' && wispVisual) {
        setWispVisualVariant(wispVisual, variant as WispVariant);
      } else if (activeKind === 'stone' && stoneVisual) {
        setStoneVisualVariant(stoneVisual, variant as StoneVariant);
      }
    },

    update(
      transform: Transform,
      creatureComp: SlimeComponent | WispComponent | StoneComponent,
      linearVelocity?: { x: number; y: number; z: number },
      dt = 1 / 60
    ): void {
      if (activeKind === 'slime' && slimeVisual) {
        updateSlimeVisual(slimeVisual, creatureComp as SlimeComponent, transform, linearVelocity, dt);
      } else if (activeKind === 'wisp' && wispVisual) {
        updateWispVisual(wispVisual, creatureComp as WispComponent, transform, linearVelocity, dt);
      } else if (activeKind === 'stone' && stoneVisual) {
        updateStoneVisual(stoneVisual, creatureComp as StoneComponent, transform, linearVelocity, dt);
      }
    },

    dispose(): void {
      cleanupCurrent();
    },
  };
}
