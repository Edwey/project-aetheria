/**
 * Aetheria - Main Interactive Client Application
 * Phase 3, 4, 5: Slime, Wisp, and Stone Creatures with Living Physics & Form Switching
 */

import * as THREE from 'three';
import {
  createScene,
  createCreatureVisualController,
  createParticleManager,
  type CreatureKind,
} from '@render/index.js';
import {
  createWorld as createECSWorld,
  getComponent,
  type EntityId,
} from '@core/index.js';
import {
  initPhysicsSystem,
  physicsSystem,
  createPhysicsEntity,
  TransformComponent,
  RigidBodyComponent,
  type RigidBody,
  getBodyLinearVelocity,
  type PhysicsBody,
  // Slime
  createSlimeEntity,
  setSlimeVariant,
  updateSlime,
  SlimeComponentSymbol,
  type SlimeComponent,
  type SlimeVariant,
  // Wisp
  createWispEntity,
  setWispVariant,
  updateWisp,
  WispComponentSymbol,
  type WispComponent,
  type WispVariant,
  // Stone
  createStoneEntity,
  setStoneVariant,
  updateStone,
  StoneComponentSymbol,
  type StoneComponent,
  type StoneVariant,
  type Transform,
} from '@sim/index.js';
import { createInputManager } from '@ui/index.js';

// DOM Elements
const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;

// Creature Tabs
const tabSlime = document.getElementById('tab-slime') as HTMLButtonElement;
const tabWisp = document.getElementById('tab-wisp') as HTMLButtonElement;
const tabStone = document.getElementById('tab-stone') as HTMLButtonElement;

// HUD Info Elements
const creatureIcon = document.getElementById('creature-icon') as HTMLSpanElement;
const creatureName = document.getElementById('creature-name') as HTMLSpanElement;
const creatureBadge = document.getElementById('creature-badge') as HTMLSpanElement;
const variantPills = document.getElementById('variant-pills') as HTMLDivElement;

const meterTitle = document.getElementById('meter-title') as HTMLSpanElement;
const meterVal = document.getElementById('meter-val') as HTMLSpanElement;
const meterFill = document.getElementById('meter-fill') as HTMLDivElement;

const statSpeed = document.getElementById('stat-speed') as HTMLElement;
const statGrip = document.getElementById('stat-grip') as HTMLElement;
const statState = document.getElementById('stat-state') as HTMLElement;

// Ability Buttons
const actJump = document.getElementById('act-jump') as HTMLButtonElement;
const actMelt = document.getElementById('act-melt') as HTMLButtonElement;
const actSpring = document.getElementById('act-spring') as HTMLButtonElement;
const actFloat = document.getElementById('act-float') as HTMLButtonElement;
const actPound = document.getElementById('act-pound') as HTMLButtonElement;

const lblJump = document.getElementById('lbl-jump') as HTMLSpanElement;
const lblMelt = document.getElementById('lbl-melt') as HTMLSpanElement;
const lblSpring = document.getElementById('lbl-spring') as HTMLSpanElement;
const lblPound = document.getElementById('lbl-pound') as HTMLSpanElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

// Creature metadata & configuration
const CREATURE_CONFIG = {
  slime: {
    name: 'Slime',
    icon: '💧',
    badge: 'Liquid Form',
    badgeClass: 'badge-liquid',
    variants: [
      { id: 'goo', label: '[1] Goo', desc: 'Ultra Soft & Sticky' },
      { id: 'jelly_ball', label: '[2] Jelly Ball', desc: 'Bouncy & Balanced' },
      { id: 'jelly_cube', label: '[3] Jelly Cube', desc: 'Firm & Springy' },
    ],
    defaultVariant: 'jelly_ball' as SlimeVariant,
    labels: {
      jump: 'Charge Jump',
      melt: 'Melt Puddle',
      spring: 'Spring Coil',
      pound: 'Ground Pound',
      float: '',
    },
    hasFloat: false,
  },
  wisp: {
    name: 'Wisp',
    icon: '💨',
    badge: 'Gas Form',
    badgeClass: 'badge-gas',
    variants: [
      { id: 'cloud', label: '[1] Cloud', desc: '24 Motes Billowing' },
      { id: 'motes', label: '[2] Motes', desc: '10 Motes Zippy' },
      { id: 'ring', label: '[3] Ring', desc: '12 Motes Orbit' },
    ],
    defaultVariant: 'cloud' as WispVariant,
    labels: {
      jump: 'Rise on Breath',
      melt: 'Diffuse Drift',
      spring: 'Condense Boost',
      pound: 'Down-Gust',
      float: 'Float (Hover)',
    },
    hasFloat: true,
  },
  stone: {
    name: 'Stone',
    icon: '🪨',
    badge: 'Solid Form',
    badgeClass: 'badge-solid',
    variants: [
      { id: 'boulder', label: '[1] Boulder', desc: 'Rolling Inertia' },
      { id: 'pillar', label: '[2] Pillar', desc: 'Hexagonal Basalt' },
      { id: 'shard', label: '[3] Shard', desc: 'Quartz Crystal' },
    ],
    defaultVariant: 'boulder' as StoneVariant,
    labels: {
      jump: 'Charge / Sail',
      melt: 'Shrink Pebble',
      spring: 'Brace',
      pound: 'Smash Pound',
      float: '',
    },
    hasFloat: false,
  },
};

async function main() {
  // 1. Three.js Scene Setup
  const { scene, camera, renderer } = createScene({ canvas, shadows: true });
  scene.background = new THREE.Color(0xa7dbf8);
  scene.fog = new THREE.FogExp2(0xa7dbf8, 0.012);

  // Soft warm ambient fill + crisp sunlight
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x6e9477, 0.55);
  scene.add(hemiLight);

  // 2. Particle Effects Manager
  const particleManager = createParticleManager(scene);

  // 3. ECS World & Rapier Physics
  const world = createECSWorld();
  await initPhysicsSystem(world, { x: 0, y: -20, z: 0 });

  // 4. Ground Terrain & Climbing Wall Obstacle
  const groundGeo = new THREE.BoxGeometry(160, 2, 160);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x76ba5d, // Rich meadow green
    roughness: 0.82,
    metalness: 0.02,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.set(0, -1, 0);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Rapier Static Ground Collider
  createPhysicsEntity(world, {
    position: { x: 0, y: -1, z: 0 },
    mass: 0,
    shape: 'box',
    size: { x: 80, y: 1, z: 80 },
    isStatic: true,
    friction: 0.7,
    restitution: 0.1,
  });

  // Test obstacle: 6m sandstone climbing wall
  const wallGeo = new THREE.BoxGeometry(14, 6.5, 1.2);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xd9a877, // Warm sandstone
    roughness: 0.88,
  });
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.position.set(0, 3.25, -12);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  scene.add(wallMesh);

  createPhysicsEntity(world, {
    position: { x: 0, y: 3.25, z: -12 },
    mass: 0,
    shape: 'box',
    size: { x: 7, y: 3.25, z: 0.6 },
    isStatic: true,
    friction: 0.8,
  });

  // Elevated decorative stone platform
  const platGeo = new THREE.BoxGeometry(6, 2, 6);
  const platMat = new THREE.MeshStandardMaterial({ color: 0xbfb69e, roughness: 0.85 });
  const platMesh = new THREE.Mesh(platGeo, platMat);
  platMesh.position.set(10, 1, -5);
  platMesh.castShadow = true;
  platMesh.receiveShadow = true;
  scene.add(platMesh);

  createPhysicsEntity(world, {
    position: { x: 10, y: 1, z: -5 },
    mass: 0,
    shape: 'box',
    size: { x: 3, y: 1, z: 3 },
    isStatic: true,
  });

  // 5. Active Player Creature Management
  let activeKind: CreatureKind = 'slime';
  let activeSlimeVariant: SlimeVariant = 'jelly_ball';
  let activeWispVariant: WispVariant = 'cloud';
  let activeStoneVariant: StoneVariant = 'boulder';

  let currentEntity: EntityId;

  // Initialize unified creature visual controller
  const creatureVisual = createCreatureVisualController(scene, activeKind, activeSlimeVariant);

  function spawnActiveEntity(kind: CreatureKind, spawnPos = { x: 0, y: 2.0, z: 0 }): void {
    // If switching from previous entity, destroy old physics body from world
    if (currentEntity !== undefined) {
      world.entities.delete(currentEntity);
    }

    activeKind = kind;

    if (kind === 'slime') {
      currentEntity = createSlimeEntity(world, {
        position: spawnPos,
        variant: activeSlimeVariant,
      });
      creatureVisual.setCreature('slime', activeSlimeVariant);
    } else if (kind === 'wisp') {
      currentEntity = createWispEntity(world, {
        position: { x: spawnPos.x, y: Math.max(spawnPos.y, 3.0), z: spawnPos.z },
        variant: activeWispVariant,
      });
      creatureVisual.setCreature('wisp', activeWispVariant);
    } else if (kind === 'stone') {
      currentEntity = createStoneEntity(world, {
        position: spawnPos,
        variant: activeStoneVariant,
      });
      creatureVisual.setCreature('stone', activeStoneVariant);
    }

    updateHUD();
    particleManager.spawnDustPuff(spawnPos.x, spawnPos.y - 0.4, spawnPos.z, 16, 2.2);
  }

  // Initial spawn
  spawnActiveEntity('slime', { x: 0, y: 2.0, z: 0 });

  // 6. Input Manager
  const inputManager = createInputManager();

  // Wire ability button clicks/touches
  const bindVirtualButton = (btnEl: HTMLButtonElement, action: 'jump' | 'melt' | 'spring' | 'pound' | 'float') => {
    btnEl.addEventListener('pointerdown', (e) => {
      btnEl.setPointerCapture(e.pointerId);
      inputManager.setVirtualButton(action, true);
      btnEl.classList.add('pressed');
    });
    const release = () => {
      inputManager.setVirtualButton(action, false);
      btnEl.classList.remove('pressed');
    };
    btnEl.addEventListener('pointerup', release);
    btnEl.addEventListener('pointercancel', release);
  };

  bindVirtualButton(actJump, 'jump');
  bindVirtualButton(actMelt, 'melt');
  bindVirtualButton(actSpring, 'spring');
  bindVirtualButton(actFloat, 'float');
  bindVirtualButton(actPound, 'pound');

  // Wire Creature Tabs
  tabSlime.addEventListener('click', () => switchCreature('slime'));
  tabWisp.addEventListener('click', () => switchCreature('wisp'));
  tabStone.addEventListener('click', () => switchCreature('stone'));

  function switchCreature(kind: CreatureKind): void {
    if (activeKind === kind) return;

    // Get current entity position to spawn new creature at same spot
    const trans = getComponent<Transform>(world, currentEntity, TransformComponent);
    const pos = trans ? { x: trans.position.x, y: trans.position.y + 0.5, z: trans.position.z } : { x: 0, y: 2, z: 0 };

    spawnActiveEntity(kind, pos);
  }

  function setCreatureVariant(variantId: string): void {
    if (activeKind === 'slime') {
      activeSlimeVariant = variantId as SlimeVariant;
      setSlimeVariant(world, currentEntity, activeSlimeVariant);
      creatureVisual.setVariant(activeSlimeVariant);
    } else if (activeKind === 'wisp') {
      activeWispVariant = variantId as WispVariant;
      setWispVariant(world, currentEntity, activeWispVariant);
      creatureVisual.setVariant(activeWispVariant);
    } else if (activeKind === 'stone') {
      activeStoneVariant = variantId as StoneVariant;
      setStoneVariant(world, currentEntity, activeStoneVariant);
      creatureVisual.setVariant(activeStoneVariant);
    }
    updateHUD();
  }

  function updateHUD(): void {
    const cfg = CREATURE_CONFIG[activeKind];

    // Top Tabs styling
    tabSlime.classList.toggle('active', activeKind === 'slime');
    tabWisp.classList.toggle('active', activeKind === 'wisp');
    tabStone.classList.toggle('active', activeKind === 'stone');

    // Info header
    creatureIcon.textContent = cfg.icon;
    creatureName.textContent = cfg.name;
    creatureBadge.textContent = cfg.badge;
    creatureBadge.className = `badge ${cfg.badgeClass}`;

    // Ability labels
    lblJump.textContent = cfg.labels.jump;
    lblMelt.textContent = cfg.labels.melt;
    lblSpring.textContent = cfg.labels.spring;
    lblPound.textContent = cfg.labels.pound;
    actFloat.style.display = cfg.hasFloat ? 'flex' : 'none';

    // Populate variant pills
    variantPills.innerHTML = '';
    const activeVar = activeKind === 'slime' ? activeSlimeVariant : activeKind === 'wisp' ? activeWispVariant : activeStoneVariant;

    cfg.variants.forEach((v) => {
      const btn = document.createElement('button');
      btn.className = `variant-btn ${v.id === activeVar ? 'active' : ''}`;
      btn.textContent = v.label;
      btn.title = v.desc;
      btn.addEventListener('click', () => setCreatureVariant(v.id));
      variantPills.appendChild(btn);
    });
  }

  // Hide loading indicator
  if (loading) {
    loading.style.display = 'none';
  }

  // 7. Main Game Loop (Fixed 60Hz Physics + Dynamic Smooth Rendering)
  const FIXED_DT = 1 / 60;
  let lastTime = performance.now();
  let accumulator = 0;
  const cameraOffset = new THREE.Vector3(0, 5, 12);

  let prevAirborne = false;

  function animate(currentTime: number) {
    requestAnimationFrame(animate);

    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    accumulator += deltaTime;

    // Check creature cycle hotkey (Tab)
    if (inputManager.consumeCreatureCycle()) {
      const order: CreatureKind[] = ['slime', 'wisp', 'stone'];
      const nextKind = order[(order.indexOf(activeKind) + 1) % 3]!;
      switchCreature(nextKind);
    }

    // Check variant selection hotkey (1, 2, 3)
    const reqVariantIdx = inputManager.getRequestedVariantIndex();
    if (reqVariantIdx !== null) {
      const cfg = CREATURE_CONFIG[activeKind];
      const selected = cfg.variants[reqVariantIdx];
      if (selected) {
        setCreatureVariant(selected.id);
      }
      inputManager.resetVariantSelection();
    }

    // Fixed timestep physics update
    while (accumulator >= FIXED_DT) {
      if (activeKind === 'slime') {
        const input = inputManager.getSlimeInput();
        updateSlime(world, currentEntity, input, FIXED_DT);
      } else if (activeKind === 'wisp') {
        const input = inputManager.getWispInput();
        updateWisp(world, currentEntity, input, FIXED_DT);
      } else if (activeKind === 'stone') {
        const input = inputManager.getStoneInput();
        const stoneEvents = updateStone(world, currentEntity, input, FIXED_DT);

        // Process shockwaves from Stone
        if (stoneEvents.shockwave.length > 0) {
          stoneEvents.shockwave.forEach((sw) => {
            particleManager.spawnShockwave(sw.origin.x, sw.origin.y, sw.origin.z, sw.radius, 0xffd166);
            particleManager.spawnDustPuff(sw.origin.x, sw.origin.y, sw.origin.z, 20, 3.0);
          });
        }
      }

      physicsSystem(world, FIXED_DT);
      accumulator -= FIXED_DT;
    }

    // Sync particles
    particleManager.update(deltaTime);

    // Retrieve active components
    const transform = getComponent<Transform>(world, currentEntity, TransformComponent);
    const rigidBody = getComponent<RigidBody>(world, currentEntity, RigidBodyComponent);

    let linvel = { x: 0, y: 0, z: 0 };
    if (rigidBody) {
      linvel = getBodyLinearVelocity(rigidBody as unknown as PhysicsBody);
    }

    if (transform) {
      const horizSpeed = Math.hypot(linvel.x, linvel.z);

      // Render update
      if (activeKind === 'slime') {
        const slimeComp = getComponent<SlimeComponent>(world, currentEntity, SlimeComponentSymbol);
        if (slimeComp) {
          creatureVisual.update(transform, slimeComp, linvel, deltaTime);

          // Landing dust puff detection
          if (prevAirborne && slimeComp.isGrounded) {
            particleManager.spawnDustPuff(transform.position.x, transform.position.y - 0.45, transform.position.z, 14, 2.0);
          }
          prevAirborne = !slimeComp.isGrounded;

          // HUD updates
          meterTitle.textContent = 'Jump Power Charge';
          const chargePct = Math.round((slimeComp.jumpChargeTimer / 0.85) * 100);
          meterVal.textContent = `${chargePct}%`;
          meterFill.style.width = `${chargePct}%`;
          meterFill.className = 'meter-fill charge-power';

          statSpeed.textContent = `${horizSpeed.toFixed(1)} m/s`;
          statGrip.textContent = `${slimeComp.preset.grip.toFixed(2)}`;
          statState.textContent = slimeComp.isMelting ? 'Melt Puddle' : slimeComp.isClimbing ? 'Climbing Wall' : slimeComp.isGliding ? 'Gliding' : slimeComp.isGrounded ? 'Grounded' : 'Airborne';
        }
      } else if (activeKind === 'wisp') {
        const wispComp = getComponent<WispComponent>(world, currentEntity, WispComponentSymbol);
        if (wispComp) {
          creatureVisual.update(transform, wispComp, linvel, deltaTime);

          // HUD updates for breath
          meterTitle.textContent = 'Wisp Breath Energy';
          const breathPct = Math.round(wispComp.breath);
          meterVal.textContent = `${breathPct}%`;
          meterFill.style.width = `${breathPct}%`;
          meterFill.className = 'meter-fill wisp-breath';

          statSpeed.textContent = `${horizSpeed.toFixed(1)} m/s`;
          statGrip.textContent = `Air Drift`;
          statState.textContent = wispComp.isDownGusting ? 'Down-Gust Dive' : wispComp.isRising ? 'Rising' : wispComp.isFloating ? 'Floating' : wispComp.isCondensed ? 'Condensed Boost' : wispComp.isDiffused ? 'Diffused Drift' : 'Floating';
        }
      } else if (activeKind === 'stone') {
        const stoneComp = getComponent<StoneComponent>(world, currentEntity, StoneComponentSymbol);
        if (stoneComp) {
          creatureVisual.update(transform, stoneComp, linvel, deltaTime);

          // Landing puff detection
          if (prevAirborne && stoneComp.isGrounded) {
            particleManager.spawnDustPuff(transform.position.x, transform.position.y - 0.5, transform.position.z, 18, 2.5);
          }
          prevAirborne = !stoneComp.isGrounded;

          // Rolling dust puffs
          if (stoneComp.isGrounded && horizSpeed > 4.0 && Math.random() < 0.25) {
            particleManager.spawnDustPuff(transform.position.x, transform.position.y - 0.45, transform.position.z, 2, 0.8);
          }

          meterTitle.textContent = 'Jump Charge';
          const chargePct = Math.round((stoneComp.jumpChargeTimer / 0.9) * 100);
          meterVal.textContent = `${chargePct}%`;
          meterFill.style.width = `${chargePct}%`;
          meterFill.className = 'meter-fill charge-power';

          statSpeed.textContent = `${horizSpeed.toFixed(1)} m/s`;
          statGrip.textContent = `${stoneComp.preset.grip.toFixed(2)}`;
          statState.textContent = stoneComp.isPebbleShrunk ? 'Pebble Shrunk' : stoneComp.isSailGliding ? 'Crystal Sail' : stoneComp.isPitonClimbing ? 'Piton Cling' : stoneComp.isRolling ? 'High-Speed Roll' : stoneComp.isGrounded ? 'Grounded' : 'Airborne';
        }
      }

      // Smooth Camera tracking with slight look-ahead
      const targetCamPos = new THREE.Vector3(
        transform.position.x + cameraOffset.x + linvel.x * 0.2,
        transform.position.y + cameraOffset.y,
        transform.position.z + cameraOffset.z + linvel.z * 0.2
      );
      camera.position.lerp(targetCamPos, 0.08);
      camera.lookAt(transform.position.x, transform.position.y + 0.6, transform.position.z);
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
  console.log('Aetheria: Living Slime, Wisp, and Stone Creature Playground ready.');
}

main().catch(console.error);
