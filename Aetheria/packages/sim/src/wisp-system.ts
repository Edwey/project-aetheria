/**
 * Wisp Creature Physics & Movement System (Phase 4)
 *
 * Key mechanics:
 *  - Free hop (tap Space): +6 m/s instant upward boost
 *  - Rising (hold Space): consumes breath at 20/s, velocity +4 m/s upward
 *  - Floating (V key): gentle hover, consumes breath at 3/s
 *  - Gentle sinking: -2.5 m/s natural descent when not rising
 *  - Condense (C key): 1.4x speed burst
 *  - Diffuse (M key): 0.6x slow drift
 *  - Down-gust (F key): -22 m/s dive with 2s safety timeout
 *  - Wall-hug drift climbing: 3 m/s upward along walls
 *  - Breath auto-refill near ground/water (< 2m height)
 *  - Mote cluster simulation: each mote stays within 2.2m tether
 */

import {
  World,
  EntityId,
  getComponent,
  addComponent,
  getResource,
} from '@core';
import {
  TransformComponent,
  RigidBodyComponent,
  Transform,
  RigidBody,
} from './physics-components.js';
import {
  createPhysicsEntity,
  PhysicsWorldResource,
} from './physics-system.js';
import {
  getBodyPosition,
  getBodyLinearVelocity,
  setBodyLinearVelocity,
  castRay,
  type PhysicsWorld,
  type PhysicsBody,
} from './rapier-wrapper.js';
import {
  WispComponent,
  WispComponentSymbol,
  WispVariant,
  WISP_PRESETS,
  WISP_BREATH,
} from './wisp-components.js';

export interface WispInput {
  moveX: number;         // -1 to 1 (strafe)
  moveZ: number;         // -1 to 1 (forward/back)
  riseHold: boolean;     // Space held - rise on breath
  floatHold: boolean;    // V held - gentle float
  condense: boolean;     // C held - speed burst
  diffuse: boolean;      // M held - slow drift
  downGust: boolean;     // F pressed - down-gust dive
}

/** Initial mote offsets arranged in form-specific patterns */
function buildMoteOffsets(
  variant: WispVariant,
  count: number
): Array<{ x: number; y: number; z: number }> {
  const offsets: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    if (variant === 'ring') {
      // Orbit in a ring pattern in XZ plane
      offsets.push({
        x: Math.cos(t) * 1.2,
        y: 0.0,
        z: Math.sin(t) * 1.2,
      });
    } else if (variant === 'motes') {
      // Scattered sparse cloud
      const phi = Math.acos(1 - 2 * (i / count));
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 0.5 + Math.random() * 1.5;
      offsets.push({
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.cos(phi) * r * 0.5,
        z: Math.sin(phi) * Math.sin(theta) * r,
      });
    } else {
      // Cloud: dense spherical cluster
      const phi = Math.acos(1 - 2 * ((i + 0.5) / count));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.4 + (i / count) * 0.9;
      offsets.push({
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.cos(phi) * r,
        z: Math.sin(phi) * Math.sin(theta) * r,
      });
    }
  }
  return offsets;
}

/**
 * Create a Wisp entity in the ECS world
 */
export function createWispEntity(
  world: World,
  options: {
    position?: { x: number; y: number; z: number };
    variant?: WispVariant;
  } = {}
): EntityId {
  const variant = options.variant ?? 'cloud';
  const preset = WISP_PRESETS[variant];
  const position = options.position ?? { x: 0, y: 5, z: 0 };

  // Wisp uses a small sphere collider for its core
  const entity = createPhysicsEntity(world, {
    position,
    mass: 0.3,          // Very light
    shape: 'sphere',
    size: 0.35,         // Small core radius
    friction: 0.05,     // Almost frictionless
    restitution: 0.1,
  });

  const moteOffsets = buildMoteOffsets(variant, preset.moteCount);
  const moteVelocities = moteOffsets.map(() => ({ x: 0, y: 0, z: 0 }));

  const wispComp: WispComponent = {
    variant,
    preset,
    breath: WISP_BREATH.MAX,
    maxBreath: WISP_BREATH.MAX,
    isRising: false,
    isFloating: false,
    isCondensed: false,
    isDiffused: false,
    isDownGusting: false,
    isWallHugging: false,
    downGustTimer: 0,
    moteOffsets,
    moteVelocities,
  };

  addComponent(world, entity, WispComponentSymbol, wispComp);
  return entity;
}

/**
 * Switch the active Wisp variant
 */
export function setWispVariant(
  world: World,
  entity: EntityId,
  variant: WispVariant
): void {
  const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
  if (!wisp) return;

  wisp.variant = variant;
  wisp.preset = WISP_PRESETS[variant];

  // Rebuild mote offsets for new variant
  wisp.moteOffsets = buildMoteOffsets(variant, wisp.preset.moteCount);
  wisp.moteVelocities = wisp.moteOffsets.map(() => ({ x: 0, y: 0, z: 0 }));
}

/**
 * Clamp a value between min and max
 */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Update mote cluster simulation — keep motes within tether and add gentle drift
 */
function updateMotes(wisp: WispComponent, dt: number): void {
  const { tetherRadius } = wisp.preset;
  for (let i = 0; i < wisp.moteOffsets.length; i++) {
    const off = wisp.moteOffsets[i];
    const vel = wisp.moteVelocities[i];
    if (!off || !vel) continue;

    // Random gentle drift (Brownian motion)
    vel.x += (Math.random() - 0.5) * 0.8 * dt;
    vel.y += (Math.random() - 0.5) * 0.4 * dt;
    vel.z += (Math.random() - 0.5) * 0.8 * dt;

    // Spring toward current offset target (ring keeps formation, others drift freely)
    const damping = 0.85;
    vel.x *= damping;
    vel.y *= damping;
    vel.z *= damping;

    off.x += vel.x;
    off.y += vel.y;
    off.z += vel.z;

    // Enforce tether constraint: clamp to tetherRadius from core (0,0,0)
    const dist = Math.sqrt(off.x * off.x + off.y * off.y + off.z * off.z);
    if (dist > tetherRadius) {
      const scale = tetherRadius / dist;
      off.x *= scale;
      off.y *= scale;
      off.z *= scale;
      // Dampen velocity on constraint hit
      vel.x *= 0.3;
      vel.y *= 0.3;
      vel.z *= 0.3;
    }
  }
}

/**
 * Update a Wisp entity for one fixed timestep (1/60s)
 */
export function updateWisp(
  world: World,
  entity: EntityId,
  input: WispInput,
  dt: number
): void {
  const wisp = getComponent<WispComponent>(world, entity, WispComponentSymbol);
  const transform = getComponent<Transform>(world, entity, TransformComponent);
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld | undefined;

  if (!wisp || !transform || !rigidBody || !physicsWorld) return;

  const body = rigidBody as unknown as PhysicsBody;
  const currentPos = getBodyPosition(body);
  const linvel = getBodyLinearVelocity(body);

  // ---- 1. Ground proximity check (for breath refill) ----
  const groundRayHit = castRay(
    physicsWorld,
    currentPos,
    { x: 0, y: -1, z: 0 },
    WISP_BREATH.GROUND_REFILL_HEIGHT + 0.5,
    true,
    body
  );
  const isNearGround = groundRayHit !== null &&
    groundRayHit.toi <= WISP_BREATH.GROUND_REFILL_HEIGHT;

  // ---- 2. Breath refill near ground ----
  if (isNearGround && wisp.breath < wisp.maxBreath) {
    wisp.breath = Math.min(
      wisp.maxBreath,
      wisp.breath + WISP_BREATH.REFILL_RATE * dt
    );
  }

  // ---- 3. Down-gust timer ----
  if (wisp.isDownGusting) {
    wisp.downGustTimer -= dt;
    if (wisp.downGustTimer <= 0) {
      wisp.isDownGusting = false;
      wisp.downGustTimer = 0;
    }
    // While gusting, skip all other controls
    updateMotes(wisp, dt);
    return;
  }

  // ---- 4. Down-gust (F key) ----
  if (input.downGust && !wisp.isDownGusting) {
    wisp.isDownGusting = true;
    wisp.downGustTimer = WISP_BREATH.DOWN_GUST_TIMEOUT;
    setBodyLinearVelocity(body, {
      x: linvel.x * 0.5,
      y: wisp.preset.downGustVelocity,
      z: linvel.z * 0.5,
    });
    updateMotes(wisp, dt);
    return;
  }

  // ---- 5. Vertical velocity logic ----
  let newVy = linvel.y;

  // Check if Space was just tapped (free hop — handled externally via edge detection)
  // Rising: hold Space, consume breath — not allowed if breath already 0
  if (input.riseHold && wisp.breath > 0) {
    wisp.breath = Math.max(0, wisp.breath - wisp.preset.breathRiseRate * dt);
    // Re-evaluate after depletion: if we just drained to 0 this frame still counts as rising
    wisp.isRising = true;
    newVy = WISP_BREATH.RISE_VELOCITY;
  } else {
    // Either not holding or breath is empty
    wisp.isRising = false;
  }

  // Floating: hold V, very slow breath drain
  wisp.isFloating = input.floatHold && wisp.breath > 0 && !wisp.isRising;
  if (wisp.isFloating) {
    wisp.breath = Math.max(0, wisp.breath - wisp.preset.breathFloatRate * dt);
    newVy = WISP_BREATH.FLOAT_HOLD_VY;
  }

  // No active control: gentle sink
  if (!wisp.isRising && !wisp.isFloating) {
    if (newVy > WISP_BREATH.SINK_VELOCITY) {
      newVy = Math.max(WISP_BREATH.SINK_VELOCITY, newVy - 5 * dt);
    }
  }

  // ---- 6. Wall-hug climbing ----
  const hasInput = Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05;
  wisp.isWallHugging = false;

  if (hasInput) {
    const inputLen = Math.hypot(input.moveX, input.moveZ);
    const dirX = input.moveX / inputLen;
    const dirZ = input.moveZ / inputLen;

    const wallHit = castRay(
      physicsWorld,
      currentPos,
      { x: dirX, y: 0, z: dirZ },
      0.5,
      true,
      body
    );

    if (wallHit && wallHit.normal && Math.abs(wallHit.normal.y) < 0.4) {
      wisp.isWallHugging = true;
      newVy = wisp.preset.climbSpeed;
    }
  }

  // ---- 7. Horizontal movement ----
  let speedMult = 1.0;
  wisp.isCondensed = input.condense;
  wisp.isDiffused = input.diffuse && !input.condense;

  if (wisp.isCondensed) speedMult = wisp.preset.condenseSpeedMult;
  else if (wisp.isDiffused) speedMult = wisp.preset.diffuseSpeedMult;

  const maxHorizSpeed = wisp.preset.driftSpeed * speedMult;

  let newVx = linvel.x;
  let newVz = linvel.z;

  if (hasInput) {
    const inputLen = Math.hypot(input.moveX, input.moveZ);
    const nx = input.moveX / inputLen;
    const nz = input.moveZ / inputLen;

    const accel = maxHorizSpeed * 4.0 * dt;
    newVx = clamp(newVx + nx * accel, -maxHorizSpeed, maxHorizSpeed);
    newVz = clamp(newVz + nz * accel, -maxHorizSpeed, maxHorizSpeed);
  } else {
    // Air drag — gradually lose horizontal speed
    const drag = 1 - clamp(3.0 * dt, 0, 1);
    newVx *= drag;
    newVz *= drag;
  }

  setBodyLinearVelocity(body, { x: newVx, y: newVy, z: newVz });

  // ---- 8. Mote cluster simulation ----
  updateMotes(wisp, dt);
}

/**
 * Wisp system — updates all active Wisp entities in the world
 */
export function wispSystem(
  world: World,
  inputs: Map<EntityId, WispInput> | WispInput,
  dt: number
): void {
  for (const [entity, components] of world.entities.entries()) {
    if (components.has(WispComponentSymbol)) {
      const input = inputs instanceof Map ? inputs.get(entity) : inputs;
      if (input) {
        updateWisp(world, entity, input, dt);
      }
    }
  }
}
