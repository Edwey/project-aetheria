/**
 * Stone Creature Physics & Movement System (Phase 5)
 *
 * Key mechanics:
 *  - Heavy rigid physics: high mass, low grip (0.35), high wind resistance
 *  - Piton wall climbing: clings without slipping when idle on walls (2-3 m/s)
 *  - Heavy charge jump: 4.5 to 12.75 power, 0.5s apex hover
 *  - Crystal Sail glide: caps fall at -3.0 m/s, triggers free shockwave on landing
 *  - Pebble shrinking (M key): scale 0.65 to squeeze through narrow passages
 *  - Ground pound shockwave (F key): -22 m/s dive, shockwave event on landing
 *  - Rolling impact: speed > crackThreshold triggers geode crack event (>5 m/s)
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
  StoneComponent,
  StoneComponentSymbol,
  StoneVariant,
  STONE_PRESETS,
  STONE_CONSTANTS,
} from './stone-components.js';

export interface StoneInput {
  moveX: number;           // -1 to 1
  moveZ: number;           // -1 to 1
  jumpHold: boolean;       // Space held — charge jump or Crystal Sail glide
  pebbleShrink: boolean;   // M key — shrink to pebble size
  groundPound: boolean;    // F key — ground pound smash
}

/** Events emitted by the Stone system (caller reads these) */
export interface StoneEvents {
  shockwave: Array<{ entity: EntityId; radius: number; origin: { x: number; y: number; z: number } }>;
  crackImpact: Array<{ entity: EntityId; speed: number; origin: { x: number; y: number; z: number } }>;
}

/**
 * Create a Stone entity in the ECS world
 */
export function createStoneEntity(
  world: World,
  options: {
    position?: { x: number; y: number; z: number };
    variant?: StoneVariant;
  } = {}
): EntityId {
  const variant = options.variant ?? 'boulder';
  const preset = STONE_PRESETS[variant];
  const position = options.position ?? { x: 0, y: 5, z: 0 };

  const entity = createPhysicsEntity(world, {
    position,
    mass: preset.mass,
    shape: preset.shape,
    size: preset.size,
    friction: preset.grip,
    restitution: 0.1,
  });

  const stoneComp: StoneComponent = {
    variant,
    preset,
    isGrounded: false,
    isPitonClimbing: false,
    isSailGliding: false,
    isPebbleShrunk: false,
    isGroundPounding: false,
    isHovering: false,
    isRolling: false,
    jumpChargeTimer: 0,
    isChargingJump: false,
    hoverTimer: 0,
    scale: { x: 1, y: 1, z: 1 },
    targetScale: { x: 1, y: 1, z: 1 },
    lastLandingSpeed: 0,
  };

  addComponent(world, entity, StoneComponentSymbol, stoneComp);
  return entity;
}

/**
 * Switch the active Stone variant
 */
export function setStoneVariant(
  world: World,
  entity: EntityId,
  variant: StoneVariant
): void {
  const stone = getComponent<StoneComponent>(world, entity, StoneComponentSymbol);
  if (!stone) return;

  stone.variant = variant;
  stone.preset = STONE_PRESETS[variant];
}

/**
 * Update a Stone entity for one fixed timestep (1/60s).
 * Returns StoneEvents emitted this frame (shockwave, crack).
 */
export function updateStone(
  world: World,
  entity: EntityId,
  input: StoneInput,
  dt: number
): StoneEvents {
  const events: StoneEvents = { shockwave: [], crackImpact: [] };

  const stone = getComponent<StoneComponent>(world, entity, StoneComponentSymbol);
  const transform = getComponent<Transform>(world, entity, TransformComponent);
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld | undefined;

  if (!stone || !transform || !rigidBody || !physicsWorld) return events;

  const body = rigidBody as unknown as PhysicsBody;
  const currentPos = getBodyPosition(body);
  const linvel = getBodyLinearVelocity(body);

  // ---- 1. Ground detection ----
  const groundRayOrigin = {
    x: currentPos.x,
    y: currentPos.y - 0.45,
    z: currentPos.z,
  };
  const groundHit = castRay(physicsWorld, groundRayOrigin, { x: 0, y: -1, z: 0 }, 0.3, true, body);

  const wasGrounded = stone.isGrounded;
  stone.isGrounded = groundHit !== null;

  // ---- 2. Landing shockwave detection ----
  if (!wasGrounded && stone.isGrounded) {
    const landSpeed = Math.abs(linvel.y);
    stone.lastLandingSpeed = landSpeed;

    // Crystal Sail always emits a free shockwave on land
    if (stone.isSailGliding || stone.isGroundPounding) {
      events.shockwave.push({
        entity,
        radius: stone.preset.shockwaveRadius,
        origin: { ...currentPos },
      });
    }

    stone.isSailGliding = false;
    stone.isGroundPounding = false;
    stone.isHovering = false;
    stone.hoverTimer = 0;
  }

  // ---- 3. Rolling impact detection ----
  const horizSpeed = Math.hypot(linvel.x, linvel.z);
  stone.isRolling = horizSpeed > stone.preset.crackSpeedThreshold;
  if (stone.isGrounded && stone.isRolling) {
    events.crackImpact.push({
      entity,
      speed: horizSpeed,
      origin: { ...currentPos },
    });
  }

  // ---- 4. Pebble shrink (M key) ----
  stone.isPebbleShrunk = !!input.pebbleShrink;
  if (stone.isPebbleShrunk) {
    stone.targetScale = {
      x: STONE_CONSTANTS.MELT_SCALE,
      y: STONE_CONSTANTS.MELT_SCALE,
      z: STONE_CONSTANTS.MELT_SCALE,
    };
  } else {
    stone.targetScale = { x: 1.0, y: 1.0, z: 1.0 };
  }

  // Smoothly interpolate scale
  const lerpSpeed = 10.0 * dt;
  stone.scale.x += (stone.targetScale.x - stone.scale.x) * lerpSpeed;
  stone.scale.y += (stone.targetScale.y - stone.scale.y) * lerpSpeed;
  stone.scale.z += (stone.targetScale.z - stone.scale.z) * lerpSpeed;
  transform.scale = { ...stone.scale };

  // ---- 5. Piton wall climbing ----
  const hasInput = Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05;
  stone.isPitonClimbing = false;

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
      // Wall detected: clamp upward or hold position (piton cling)
      stone.isPitonClimbing = true;

      const climbVy = hasInput ? stone.preset.pitonClimbSpeed : 0; // Idle = cling, no slip
      setBodyLinearVelocity(body, {
        x: linvel.x * 0.2,
        y: climbVy,
        z: linvel.z * 0.2,
      });
      return events;
    }
  }

  // ---- 6. Horizontal movement ----
  if (!stone.isPitonClimbing) {
    let newVx = linvel.x;
    let newVz = linvel.z;

    if (hasInput) {
      const inputLen = Math.hypot(input.moveX, input.moveZ);
      const nx = input.moveX / inputLen;
      const nz = input.moveZ / inputLen;

      const controlMult = stone.isGrounded ? 1.0 : STONE_CONSTANTS.AIR_CONTROL;
      const accel = STONE_CONSTANTS.DRIVE_FORCE * controlMult * dt;
      newVx += nx * accel * 4.0;
      newVz += nz * accel * 4.0;

      const curSpeed = Math.hypot(newVx, newVz);
      if (curSpeed > STONE_CONSTANTS.MAX_SPEED) {
        const factor = STONE_CONSTANTS.MAX_SPEED / curSpeed;
        newVx *= factor;
        newVz *= factor;
      }
    } else if (stone.isGrounded) {
      const brake = Math.max(0, 1 - (STONE_CONSTANTS.IDLE_BRAKE * dt));
      newVx *= brake;
      newVz *= brake;
    }

    // ---- 7. Crystal Sail Glide (hold Space while falling) ----
    let newVy = linvel.y;

    if (input.jumpHold) {
      if (stone.isGrounded) {
        // Charge jump
        stone.isChargingJump = true;
        stone.jumpChargeTimer = Math.min(
          STONE_CONSTANTS.CHARGE_T,
          stone.jumpChargeTimer + dt
        );
      } else if (linvel.y < 0) {
        // Falling + Space held = Crystal Sail glide
        stone.isSailGliding = true;
        if (newVy < stone.preset.sailFallCap) {
          newVy = stone.preset.sailFallCap;
        }
      }
    } else {
      // Jump released
      if (stone.isChargingJump && stone.isGrounded) {
        const chargeRatio = Math.min(1.0, stone.jumpChargeTimer / STONE_CONSTANTS.CHARGE_T);
        const jumpPower = STONE_CONSTANTS.JMIN +
          (stone.preset.maxJumpPower - STONE_CONSTANTS.JMIN) * chargeRatio;

        setBodyLinearVelocity(body, { x: newVx, y: jumpPower, z: newVz });
        stone.isGrounded = false;
        stone.jumpChargeTimer = 0;
        stone.isChargingJump = false;
        return events;
      }

      stone.jumpChargeTimer = 0;
      stone.isChargingJump = false;
      stone.isSailGliding = false;
    }

    // ---- 8. Apex hover (0.5s) ----
    if (!stone.isGrounded && !stone.isSailGliding && !stone.isGroundPounding) {
      if (Math.abs(newVy) < 1.0 && !wasGrounded && stone.hoverTimer < stone.preset.apexHoverDuration) {
        stone.isHovering = true;
        stone.hoverTimer += dt;
        newVy = 0.1;
      } else {
        stone.isHovering = false;
      }
    }

    // ---- 9. Ground pound (F key) ----
    if (input.groundPound && !stone.isGrounded) {
      stone.isGroundPounding = true;
      stone.isSailGliding = false;
      stone.isHovering = false;
      setBodyLinearVelocity(body, { x: newVx * 0.3, y: -22.0, z: newVz * 0.3 });
      return events;
    }

    setBodyLinearVelocity(body, { x: newVx, y: newVy, z: newVz });
  }

  return events;
}

/**
 * Stone system — updates all active Stone entities in the world
 */
export function stoneSystem(
  world: World,
  inputs: Map<EntityId, StoneInput> | StoneInput,
  dt: number
): StoneEvents {
  const allEvents: StoneEvents = { shockwave: [], crackImpact: [] };

  for (const [entity, components] of world.entities.entries()) {
    if (components.has(StoneComponentSymbol)) {
      const input = inputs instanceof Map ? inputs.get(entity) : inputs;
      if (input) {
        const evts = updateStone(world, entity, input, dt);
        allEvents.shockwave.push(...evts.shockwave);
        allEvents.crackImpact.push(...evts.crackImpact);
      }
    }
  }

  return allEvents;
}
