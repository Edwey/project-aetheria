/**
 * Slime Creature Physics & Movement System (Phase 3)
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
  ColliderComponent,
  Transform,
  RigidBody,
  Collider,
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
  type PhysicsCollider,
} from './rapier-wrapper.js';
import {
  SlimeComponent,
  SlimeComponentSymbol,
  SlimeVariant,
  SLIME_PRESETS,
} from './slime-components.js';

export interface SlimeInput {
  moveX: number;       // -1 (left) to 1 (right)
  moveZ: number;       // -1 (backward) to 1 (forward)
  jumpHold: boolean;   // Space held
  rideWind?: boolean;  // Shift (Rule 4: steady wind, Ride allows boost)
  melt?: boolean;      // M key (shrink into puddle)
  spring?: boolean;    // C key (coiled spring boost)
  groundPound?: boolean; // F key (smash downward)
}

// Physical constants from prototype & CHARACTERS.md
export const SLIME_CONSTANTS = {
  GRAVITY: -20,
  CHARGE_T: 0.85,
  JMIN: 4.5,           // Tap jump velocity (~0.5m rise)
  JMAX: 15.0,          // Full charge jump velocity (~5.3m rise)
  SPRING_MULT: 1.35,   // Spring jump multiplier
  MAX_SPEED: 6.0,      // Max horizontal speed (m/s)
  DRIVE_FORCE: 16.0,   // Ground acceleration force
  AIR_CONTROL: 0.9,    // Air movement control ratio
  IDLE_BRAKE: 25.0,    // Braking deceleration when on ground and idle
  GLIDE_FALL_CAP: -2.2,// Downward velocity limit while gliding (m/s)
  GLIDE_SPEED_MULT: 1.3,
  HOVER_MAX_T: 0.8,    // Hover duration at apex
  OVERHANG_BUDGET: 1.5,// Overhang cling duration (s)
  MELT_HEIGHT_SCALE: 0.45, // Vertical scale when melted (< 0.6m total height)
  MELT_SPREAD_SCALE: 1.35, // Horizontal spread when melted
  RADIUS: 0.5,
};

/**
 * Create a Slime entity in the ECS world
 */
export function createSlimeEntity(
  world: World,
  options: {
    position?: { x: number; y: number; z: number };
    variant?: SlimeVariant;
  } = {}
): EntityId {
  const variant = options.variant ?? 'jelly_ball';
  const preset = SLIME_PRESETS[variant];
  const position = options.position ?? { x: 0, y: 5, z: 0 };

  const entity = createPhysicsEntity(world, {
    position,
    mass: 1.0,
    shape: preset.shape,
    size: preset.shape === 'sphere' ? SLIME_CONSTANTS.RADIUS : {
      x: SLIME_CONSTANTS.RADIUS,
      y: SLIME_CONSTANTS.RADIUS,
      z: SLIME_CONSTANTS.RADIUS,
    },
    friction: preset.grip,
    restitution: preset.restitution,
  });

  const slimeComp: SlimeComponent = {
    variant,
    preset,
    isGrounded: false,
    isClimbing: false,
    isMelting: false,
    isGliding: false,
    isHovering: false,
    isGroundPounding: false,
    isSpringReady: false,
    jumpChargeTimer: 0,
    isChargingJump: false,
    hoverTimer: 0,
    clingBudget: SLIME_CONSTANTS.OVERHANG_BUDGET,
    scale: { x: 1, y: 1, z: 1 },
    targetScale: { x: 1, y: 1, z: 1 },
  };

  addComponent(world, entity, SlimeComponentSymbol, slimeComp);
  return entity;
}

/**
 * Switch the active Slime variant (Goo, Jelly Ball, Jelly Cube)
 */
export function setSlimeVariant(world: World, entity: EntityId, variant: SlimeVariant): void {
  const slime = getComponent<SlimeComponent>(world, entity, SlimeComponentSymbol);
  const collider = getComponent<Collider>(world, entity, ColliderComponent);
  if (!slime) return;

  slime.variant = variant;
  slime.preset = SLIME_PRESETS[variant];

  // Update collider friction and restitution dynamically if Rapier collider exists
  if (collider && collider.handle) {
    const col = collider.handle as PhysicsCollider['handle'];
    if (typeof (col as any).setFriction === 'function') {
      (col as any).setFriction(slime.preset.grip);
      (col as any).setRestitution(slime.preset.restitution);
    }
  }
}

/**
 * Update a Slime entity for one fixed timestep (1/60s)
 */
export function updateSlime(
  world: World,
  entity: EntityId,
  input: SlimeInput,
  dt: number
): void {
  const slime = getComponent<SlimeComponent>(world, entity, SlimeComponentSymbol);
  const transform = getComponent<Transform>(world, entity, TransformComponent);
  const rigidBody = getComponent<RigidBody>(world, entity, RigidBodyComponent);
  const physicsWorld = getResource(world, PhysicsWorldResource) as PhysicsWorld | undefined;

  if (!slime || !transform || !rigidBody || !physicsWorld) return;

  const body = rigidBody as unknown as PhysicsBody;
  const currentPos = getBodyPosition(body);
  const linvel = getBodyLinearVelocity(body);

  // 1. Ground detection via downward raycast (originating just inside bottom surface and excluding own body)
  const groundRayDist = 0.25;
  const groundRayOrigin = {
    x: currentPos.x,
    y: currentPos.y - (SLIME_CONSTANTS.RADIUS * slime.scale.y * 0.85),
    z: currentPos.z,
  };
  const groundHit = castRay(
    physicsWorld,
    groundRayOrigin,
    { x: 0, y: -1, z: 0 },
    groundRayDist,
    true,
    body
  );

  const wasGrounded = slime.isGrounded;
  slime.isGrounded = groundHit !== null;

  // Reset cling budget and hover timer when landing
  if (slime.isGrounded) {
    slime.clingBudget = SLIME_CONSTANTS.OVERHANG_BUDGET;
    slime.hoverTimer = 0;
    slime.isGliding = false;
    slime.isHovering = false;
    slime.isGroundPounding = false;
  }

  // 2. Melting / Squeezing (M key)
  slime.isMelting = !!input.melt;
  if (slime.isMelting) {
    slime.targetScale = {
      x: SLIME_CONSTANTS.MELT_SPREAD_SCALE,
      y: SLIME_CONSTANTS.MELT_HEIGHT_SCALE,
      z: SLIME_CONSTANTS.MELT_SPREAD_SCALE,
    };
  } else {
    slime.targetScale = { x: 1.0, y: 1.0, z: 1.0 };
  }

  // Smoothly interpolate scale toward target
  const lerpSpeed = 12.0 * dt;
  slime.scale.x += (slime.targetScale.x - slime.scale.x) * lerpSpeed;
  slime.scale.y += (slime.targetScale.y - slime.scale.y) * lerpSpeed;
  slime.scale.z += (slime.targetScale.z - slime.scale.z) * lerpSpeed;
  transform.scale = { ...slime.scale };

  // 3. Wall Climbing (sticky climb when pushing against a wall)
  // Check if moving into a wall horizontally
  const hasInput = Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05;
  slime.isClimbing = false;

  if (hasInput && !slime.isMelting) {
    const inputDirLen = Math.hypot(input.moveX, input.moveZ);
    const dirX = input.moveX / inputDirLen;
    const dirZ = input.moveZ / inputDirLen;

    const wallRayDist = 0.35;
    const wallRayOrigin = {
      x: currentPos.x + dirX * (SLIME_CONSTANTS.RADIUS * slime.scale.x * 0.7),
      y: currentPos.y,
      z: currentPos.z + dirZ * (SLIME_CONSTANTS.RADIUS * slime.scale.z * 0.7),
    };
    const wallHit = castRay(
      physicsWorld,
      wallRayOrigin,
      { x: dirX, y: 0, z: dirZ },
      wallRayDist,
      true,
      body
    );

    if (wallHit && wallHit.normal && Math.abs(wallHit.normal.y) < 0.6) {
      // Wall detected!
      if (slime.clingBudget > 0) {
        slime.isClimbing = true;
        slime.clingBudget = Math.max(0, slime.clingBudget - dt);

        // Climb upward at preset climb speed
        const climbRate = slime.preset.climbSpeed;
        setBodyLinearVelocity(body, {
          x: linvel.x * 0.5,
          y: climbRate,
          z: linvel.z * 0.5,
        });
      }
    }
  }

  // 4. Horizontal Movement & Idle Brake (when not climbing)
  if (!slime.isClimbing) {
    let targetVx = linvel.x;
    let targetVz = linvel.z;

    if (hasInput) {
      const inputDirLen = Math.hypot(input.moveX, input.moveZ);
      const normX = input.moveX / inputDirLen;
      const normZ = input.moveZ / inputDirLen;

      const controlMult = slime.isGrounded ? 1.0 : SLIME_CONSTANTS.AIR_CONTROL;
      const speedMult = slime.isGliding ? SLIME_CONSTANTS.GLIDE_SPEED_MULT : 1.0;
      const maxSpd = SLIME_CONSTANTS.MAX_SPEED * speedMult;

      const accel = SLIME_CONSTANTS.DRIVE_FORCE * controlMult * dt;
      targetVx += normX * accel * 4.0;
      targetVz += normZ * accel * 4.0;

      // Clamp horizontal velocity to max speed
      const curSpeed = Math.hypot(targetVx, targetVz);
      if (curSpeed > maxSpd) {
        const factor = maxSpd / curSpeed;
        targetVx *= factor;
        targetVz *= factor;
      }
    } else if (slime.isGrounded) {
      // Idle brake: rapidly decelerate when grounded and no input
      const brake = Math.max(0, 1 - (SLIME_CONSTANTS.IDLE_BRAKE * dt));
      targetVx *= brake;
      targetVz *= brake;
    }

    setBodyLinearVelocity(body, {
      x: targetVx,
      y: linvel.y,
      z: targetVz,
    });
  }

  // 5. Spring toggle (C key)
  if (input.spring) {
    slime.isSpringReady = true;
  }

  // 6. Charge Jump & Release
  if (input.jumpHold) {
    if (slime.isGrounded) {
      slime.isChargingJump = true;
      slime.jumpChargeTimer = Math.min(
        SLIME_CONSTANTS.CHARGE_T,
        slime.jumpChargeTimer + dt
      );
    } else if (linvel.y < 0 && !slime.isClimbing) {
      // Airborne and falling: activate Glide!
      slime.isGliding = true;
    }
  } else {
    // Jump button released
    if (slime.isChargingJump && slime.isGrounded) {
      // Calculate jump velocity from charge
      const chargeRatio = Math.min(1.0, slime.jumpChargeTimer / SLIME_CONSTANTS.CHARGE_T);
      let jumpPower = SLIME_CONSTANTS.JMIN + (SLIME_CONSTANTS.JMAX - SLIME_CONSTANTS.JMIN) * chargeRatio;

      if (slime.isSpringReady) {
        jumpPower *= SLIME_CONSTANTS.SPRING_MULT;
        slime.isSpringReady = false;
      }

      setBodyLinearVelocity(body, { x: linvel.x, y: jumpPower, z: linvel.z });
      slime.isGrounded = false;
      slime.jumpChargeTimer = 0;
      slime.isChargingJump = false;
    } else {
      slime.jumpChargeTimer = 0;
      slime.isChargingJump = false;
    }

    slime.isGliding = false;
  }

  // 7. Glide velocity cap
  if (slime.isGliding && !slime.isGrounded) {
    const updatedVel = getBodyLinearVelocity(body);
    if (updatedVel.y < SLIME_CONSTANTS.GLIDE_FALL_CAP) {
      setBodyLinearVelocity(body, {
        x: updatedVel.x,
        y: SLIME_CONSTANTS.GLIDE_FALL_CAP,
        z: updatedVel.z,
      });
    }
  }

  // 8. Apex Hover (0.8s float at jump peak)
  if (!slime.isGrounded && !slime.isClimbing && !slime.isGliding) {
    const updatedVel = getBodyLinearVelocity(body);
    // Apex reached when vertical speed is close to 0 after rising
    if (Math.abs(updatedVel.y) < 1.0 && wasGrounded === false && slime.hoverTimer < SLIME_CONSTANTS.HOVER_MAX_T) {
      slime.isHovering = true;
      slime.hoverTimer += dt;
      // Counter gravity briefly to hover
      setBodyLinearVelocity(body, {
        x: updatedVel.x,
        y: 0.1,
        z: updatedVel.z,
      });
    } else {
      slime.isHovering = false;
    }
  }

  // 9. Ground Pound (F key while airborne)
  if (input.groundPound && !slime.isGrounded) {
    slime.isGroundPounding = true;
    slime.isGliding = false;
    slime.isHovering = false;
    const curVel = getBodyLinearVelocity(body);
    setBodyLinearVelocity(body, {
      x: curVel.x * 0.3,
      y: -22.0,
      z: curVel.z * 0.3,
    });
  }
}

/**
 * Slime system - updates all active Slime entities in the world
 */
export function slimeSystem(
  world: World,
  inputs: Map<EntityId, SlimeInput> | SlimeInput,
  dt: number
): void {
  for (const [entity, components] of world.entities.entries()) {
    if (components.has(SlimeComponentSymbol)) {
      const input = inputs instanceof Map ? inputs.get(entity) : inputs;
      if (input) {
        updateSlime(world, entity, input, dt);
      }
    }
  }
}
