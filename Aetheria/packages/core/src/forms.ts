/**
 * Table A1 — The Nine Forms as Pure Data
 * 
 * Aligned with Master Plan v4 (§2, §14).
 * Adding or tuning a form changes this table, never a system.
 */

export type CreatureFamily = 'slime' | 'wisp' | 'stone';

export type SlimeFormId = 'oobleck' | 'dewdrop' | 'aether_bubble';
export type WispFormId = 'mist' | 'zephyr' | 'lantern';
export type StoneFormId = 'aerolite' | 'geode' | 'obsidian';

export type FormId = SlimeFormId | WispFormId | StoneFormId;

export interface AbilityDefinition {
  id: string;
  name: string;
  trigger: 'tap' | 'hold' | 'none';
  description: string;
  cooldownMs?: number;
}

export interface FormVisualConfig {
  topColor: number;
  bottomColor: number;
  coreColor: number;
  outlineColor: number;
  squashFactor: number;
  glowIntensity: number;
}

export interface FormDefinition {
  id: FormId;
  family: CreatureFamily;
  name: string;
  title: string;
  indexInFamily: 0 | 1 | 2; // For 1, 2, 3 hotkeys
  description: string;

  // Physical constants
  mass: number;             // kg (impact load calculation)
  baseRadius: number;       // meters
  restitution: number;      // bounciness (0.0 to 1.0)
  friction: number;         // ground friction
  gravityMultiplier: number;// 1.0 = standard -20 m/s^2
  relativeDensity: number;  // < 1.0 floats in water, > 1.0 sinks
  airDrag: number;          // drag coefficient

  // Signatures
  jAbility: AbilityDefinition;
  kAbility: AbilityDefinition;

  // Visuals
  visual: FormVisualConfig;
}

export const FORMS_TABLE: Record<FormId, FormDefinition> = {
  // -------------------------------------------------------------------------
  // SLIME FAMILY
  // -------------------------------------------------------------------------
  oobleck: {
    id: 'oobleck',
    family: 'slime',
    name: 'Oobleck',
    title: 'Shear-Thickening Slime',
    indexInFamily: 0,
    description: 'Bouncy non-Newtonian slime. Planes across water at high speed and squeezes through grates.',
    mass: 1.2,
    baseRadius: 0.35,
    restitution: 0.85,
    friction: 0.20,
    gravityMultiplier: 1.0,
    relativeDensity: 1.12,
    airDrag: 0.15,
    jAbility: {
      id: 'squeeze',
      name: 'Squeeze',
      trigger: 'hold',
      description: 'Compress body to fit through 0.5m grates and narrow cave fissures.',
    },
    kAbility: {
      id: 'none',
      name: 'None',
      trigger: 'none',
      description: 'Passive hydrodynamic planing at high speed.',
    },
    visual: {
      topColor: 0x8ef5e8,
      bottomColor: 0x2bbda8,
      coreColor: 0x48e5c2,
      outlineColor: 0x18321f,
      squashFactor: 1.3,
      glowIntensity: 0.1,
    },
  },

  dewdrop: {
    id: 'dewdrop',
    family: 'slime',
    name: 'Dewdrop',
    title: 'Water Ballast Slime',
    indexInFamily: 1,
    description: 'Absorbs water to gain mass for heavy pressure plates; exhausts water in a rocket jet.',
    mass: 1.2, // Base dry mass; scales up to 2.0 kg with soaked ballast
    baseRadius: 0.34,
    restitution: 0.80,
    friction: 0.22,
    gravityMultiplier: 1.0,
    relativeDensity: 0.85, // Floats dry, sinks when saturated
    airDrag: 0.16,
    jAbility: {
      id: 'release_ballast',
      name: 'Release Ballast',
      trigger: 'hold',
      description: 'Expels soaked water to quickly drop weight.',
    },
    kAbility: {
      id: 'water_jet',
      name: 'Water Jet',
      trigger: 'hold',
      description: 'Blasts a high-pressure water jet forward or upward for rocket propulsion.',
    },
    visual: {
      topColor: 0x76b6ff,
      bottomColor: 0x2c6dd8,
      coreColor: 0xa8d4ff,
      outlineColor: 0x18321f,
      squashFactor: 1.4,
      glowIntensity: 0.15,
    },
  },

  aether_bubble: {
    id: 'aether_bubble',
    family: 'slime',
    name: 'Aether Bubble',
    title: 'Luminescent Floater',
    indexInFamily: 2,
    description: 'Feather-light buoyant bubble. High elasticity and gentle slow descent.',
    mass: 0.4,
    baseRadius: 0.38,
    restitution: 0.95,
    friction: 0.10,
    gravityMultiplier: 0.35, // Low gravity float
    relativeDensity: 0.25,  // Super buoyant
    airDrag: 0.45,
    jAbility: {
      id: 'lift_pulse',
      name: 'Lift Pulse',
      trigger: 'tap',
      description: 'Inflates momentarily to pop into the air with a buoyant upward leap.',
      cooldownMs: 800,
    },
    kAbility: {
      id: 'none',
      name: 'None',
      trigger: 'none',
      description: 'Passive buoyant wave hopping.',
    },
    visual: {
      topColor: 0xffb5ea,
      bottomColor: 0xda5ebf,
      coreColor: 0xffffff,
      outlineColor: 0x18321f,
      squashFactor: 1.6,
      glowIntensity: 0.4,
    },
  },

  // -------------------------------------------------------------------------
  // WISP FAMILY
  // -------------------------------------------------------------------------
  mist: {
    id: 'mist',
    family: 'wisp',
    name: 'Mist',
    title: 'Gaseous Dispersion',
    indexInFamily: 0,
    description: 'Dispersed vapor that drifts effortlessly and phases through barred gates.',
    mass: 0.3,
    baseRadius: 0.32,
    restitution: 0.10,
    friction: 0.05,
    gravityMultiplier: 0.10,
    relativeDensity: 0.08,
    airDrag: 0.80,
    jAbility: {
      id: 'phase',
      name: 'Phase',
      trigger: 'hold',
      description: 'Disperse particle cloud to float through metal bars and grates.',
    },
    kAbility: {
      id: 'none',
      name: 'None',
      trigger: 'none',
      description: 'Passive vapor skim over water.',
    },
    visual: {
      topColor: 0xdff9fb,
      bottomColor: 0x95afc0,
      coreColor: 0xffffff,
      outlineColor: 0x535c68,
      squashFactor: 1.1,
      glowIntensity: 0.5,
    },
  },

  zephyr: {
    id: 'zephyr',
    family: 'wisp',
    name: 'Zephyr',
    title: 'Breeze Skimmer',
    indexInFamily: 1,
    description: 'Swift air spirit that catches thermals effortlessly and emits directional wind gusts.',
    mass: 0.3,
    baseRadius: 0.30,
    restitution: 0.20,
    friction: 0.05,
    gravityMultiplier: 0.20,
    relativeDensity: 0.12,
    airDrag: 0.50,
    jAbility: {
      id: 'none',
      name: 'None',
      trigger: 'none',
      description: 'Passive thermal lift bonus.',
    },
    kAbility: {
      id: 'gust_dash',
      name: 'Gust Dash',
      trigger: 'hold',
      description: 'Emits a powerful wind gust that propels forward and pushes movable objects.',
      cooldownMs: 1000,
    },
    visual: {
      topColor: 0x55efc4,
      bottomColor: 0x00b894,
      coreColor: 0xa8ffea,
      outlineColor: 0x006266,
      squashFactor: 1.2,
      glowIntensity: 0.45,
    },
  },

  lantern: {
    id: 'lantern',
    family: 'wisp',
    name: 'Lantern',
    title: 'Hard-Light Beacon',
    indexInFamily: 2,
    description: 'Emits warm luminescence to illuminate dark caverns and deep waters. Condenses into heavy hard-light.',
    mass: 0.3, // Condenses up to 3.3 kg
    baseRadius: 0.32,
    restitution: 0.30,
    friction: 0.15,
    gravityMultiplier: 0.30,
    relativeDensity: 0.05, // Condenses up to 2.40 (sinks to lakebed)
    airDrag: 0.40,
    jAbility: {
      id: 'condense',
      name: 'Condense',
      trigger: 'hold',
      description: 'Condenses light into solid mass, gaining weight for plates and sinking in water.',
    },
    kAbility: {
      id: 'spectral_stairs',
      name: 'Spectral Stairs',
      trigger: 'hold',
      description: 'Projects temporary light platforms to ascend steep cliffs.',
      cooldownMs: 2500,
    },
    visual: {
      topColor: 0xffeaa7,
      bottomColor: 0xfdcb6e,
      coreColor: 0xffffff,
      outlineColor: 0xe17055,
      squashFactor: 1.15,
      glowIntensity: 0.85,
    },
  },

  // -------------------------------------------------------------------------
  // STONE FAMILY
  // -------------------------------------------------------------------------
  aerolite: {
    id: 'aerolite',
    family: 'stone',
    name: 'Aerolite',
    title: 'Porous Pumice',
    indexInFamily: 0,
    description: 'Volcanic pumice stone riddled with air pockets. Floats naturally on water and catches thermals.',
    mass: 1.5,
    baseRadius: 0.36,
    restitution: 0.35,
    friction: 0.30,
    gravityMultiplier: 0.80,
    relativeDensity: 0.55, // Naturally floats (< 1.0)
    airDrag: 0.25,
    jAbility: {
      id: 'none',
      name: 'None',
      trigger: 'none',
      description: 'Passive driftwood float and thermal skimming.',
    },
    kAbility: {
      id: 'none',
      name: 'None',
      trigger: 'none',
      description: 'Porous texture provides steady grip on slopes.',
    },
    visual: {
      topColor: 0xced6e0,
      bottomColor: 0x747d8c,
      coreColor: 0xa4b0be,
      outlineColor: 0x2f3542,
      squashFactor: 1.05,
      glowIntensity: 0.05,
    },
  },

  geode: {
    id: 'geode',
    family: 'stone',
    name: 'Geode',
    title: 'Crystalline Roller',
    indexInFamily: 1,
    description: 'Spherical crystalline rock that rolls with near-zero friction. Bridges trenches and cracks open geysers.',
    mass: 3.5,
    baseRadius: 0.45,
    restitution: 0.40,
    friction: 0.05, // Ultra low rolling friction
    gravityMultiplier: 1.0,
    relativeDensity: 2.60, // Sinks deep
    airDrag: 0.08,
    jAbility: {
      id: 'roll_brake',
      name: 'Roll Brake',
      trigger: 'hold',
      description: 'Digs crystalline facets into terrain to come to an immediate halt on steep grades.',
    },
    kAbility: {
      id: 'boost',
      name: 'Boost',
      trigger: 'hold',
      description: 'Unleashes stored momentum in a high-speed rotational acceleration burst.',
      cooldownMs: 1500,
    },
    visual: {
      topColor: 0xd980fa,
      bottomColor: 0x9980fa,
      coreColor: 0x12cbc4,
      outlineColor: 0x5758bb,
      squashFactor: 1.02,
      glowIntensity: 0.3,
    },
  },

  obsidian: {
    id: 'obsidian',
    family: 'stone',
    name: 'Obsidian',
    title: 'Volcanic Anchor',
    indexInFamily: 2,
    description: 'Super-dense volcanic glass. Heavy anchor on pressure plates and immovable against rushing currents.',
    mass: 9.0,
    baseRadius: 0.40,
    restitution: 0.05,
    friction: 0.80, // High grip
    gravityMultiplier: 1.2,
    relativeDensity: 5.00, // Heavy plunge
    airDrag: 0.05,
    jAbility: {
      id: 'anchor',
      name: 'Anchor',
      trigger: 'hold',
      description: 'Locks body into substrate, becoming completely immovable to wind, water, and slopes.',
    },
    kAbility: {
      id: 'shockwave',
      name: 'Ground Shockwave',
      trigger: 'tap',
      description: 'Slams into the ground, sending a bounded shockwave that triggers impact plates and rattles loose items.',
      cooldownMs: 2000,
    },
    visual: {
      topColor: 0x3d3d3d,
      bottomColor: 0x1e1e1e,
      coreColor: 0xff4757, // Crimson glass vein
      outlineColor: 0x000000,
      squashFactor: 1.01,
      glowIntensity: 0.2,
    },
  },
};

export const FAMILY_ORDER: CreatureFamily[] = ['slime', 'wisp', 'stone'];

export const ALL_FORMS: FormDefinition[] = Object.values(FORMS_TABLE);

export function getForm(id: FormId): FormDefinition {
  const form = FORMS_TABLE[id];
  if (!form) {
    throw new Error(`Unknown form ID: "${id}"`);
  }
  return form;
}

export function getFormsForFamily(family: CreatureFamily): FormDefinition[] {
  return ALL_FORMS.filter(f => f.family === family);
}

export function getFormByIndex(family: CreatureFamily, index: 0 | 1 | 2): FormDefinition {
  const forms = getFormsForFamily(family);
  const form = forms.find(f => f.indexInFamily === index);
  if (!form) {
    throw new Error(`No form found for family "${family}" at index ${index}`);
  }
  return form;
}
