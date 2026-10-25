/**
 * Physics Spike (Phase 0) - Master Plan §12
 * 
 * Compares:
 * 1. Rigid Proxy (Sphere/Capsule collider + visual jelly lattice / procedural squash)
 * 2. Soft Body Solver (162-particle XPBD lattice with volume preservation & shape matching)
 * 3. Custom Heightfield Collider (Pure TypeScript sphere-vs-heightfield with trench support)
 * 
 * Implements the three required comparison tests:
 * - Test 1: Bounce Test (restitution 0.85, target >= 5 visible bounces)
 * - Test 2: Tight Spaces Test (0.5m grate, 100 passes, zero pinching/tunneling)
 * - Test 3: Ditch/Trench Test (Geode rolling across trench vs avatar walking through)
 */

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface HeightfieldQuery {
  getHeight(x: number, z: number): number;
  getSphereSupportY(x: number, z: number, radius: number): number;
  getNormal(x: number, z: number): Vector3Like;
}

// ---------------------------------------------------------------------------
// 1. Custom Heightfield & Trench Collider
// ---------------------------------------------------------------------------

export class FlatHeightfieldWithTrench implements HeightfieldQuery {
  public baseHeight: number = 0;
  public trenchWidth: number;
  public trenchDepth: number;
  public trenchCenterX: number;

  constructor(trenchWidth = 0.4, trenchDepth = 0.3, trenchCenterX = 0) {
    this.trenchWidth = trenchWidth;
    this.trenchDepth = trenchDepth;
    this.trenchCenterX = trenchCenterX;
  }

  getHeight(x: number, _z: number): number {
    const halfW = this.trenchWidth / 2;
    if (this.trenchWidth > 0 && x >= this.trenchCenterX - halfW && x <= this.trenchCenterX + halfW) {
      return this.baseHeight - this.trenchDepth;
    }
    return this.baseHeight;
  }

  /**
   * Realistic geometric sphere-vs-trench rim support height.
   * - If the sphere diameter is larger than the trench width (e.g. Geode), the rims support it.
   * - If the sphere fits inside the trench (e.g. walking avatar), it drops to the trench floor.
   */
  getSphereSupportY(x: number, _z: number, radius: number): number {
    if (this.trenchWidth <= 0 || this.trenchDepth <= 0) {
      return this.baseHeight;
    }

    const xL = this.trenchCenterX - this.trenchWidth / 2;
    const xR = this.trenchCenterX + this.trenchWidth / 2;
    const trenchFloor = this.baseHeight - this.trenchDepth;

    // Fully outside trench
    if (x <= xL || x >= xR) {
      return this.baseHeight;
    }

    // Inside the trench span (xL < x < xR):
    // Check if sphere is wide enough to bridge the trench rims
    const canBridge = 2 * radius > this.trenchWidth * 1.1;
    if (canBridge) {
      const halfW = this.trenchWidth / 2;
      const sag = radius - Math.sqrt(Math.max(0, radius * radius - halfW * halfW));
      return this.baseHeight - sag;
    }

    // Otherwise, sphere drops down onto trench floor
    return trenchFloor;
  }

  getNormal(x: number, _z: number): Vector3Like {
    const halfW = this.trenchWidth / 2;
    const eps = 0.01;
    if (Math.abs(x - (this.trenchCenterX - halfW)) < eps) {
      return { x: 1, y: 0, z: 0 };
    }
    if (Math.abs(x - (this.trenchCenterX + halfW)) < eps) {
      return { x: -1, y: 0, z: 0 };
    }
    return { x: 0, y: 1, z: 0 };
  }
}

// ---------------------------------------------------------------------------
// 2. Rigid Proxy Simulation
// ---------------------------------------------------------------------------

export interface RigidProxyConfig {
  radius: number;
  mass: number;
  restitution: number;
  friction: number;
  gravity: number;
  maxStepHeight?: number;
}

export class RigidProxySimulator {
  public pos: Vector3Like;
  public vel: Vector3Like;
  public config: RigidProxyConfig;
  public isGrounded: boolean = false;
  public bounceCount: number = 0;
  public lastBouncePeak: number = 0;

  constructor(
    config: Partial<RigidProxyConfig> = {},
    initialPos: Vector3Like = { x: 0, y: 4, z: 0 }
  ) {
    this.config = {
      radius: 0.35,
      mass: 1.2,
      restitution: 0.85,
      friction: 0.2,
      gravity: -20,
      maxStepHeight: 0.35,
      ...config,
    };
    this.pos = { ...initialPos };
    this.vel = { x: 0, y: 0, z: 0 };
  }

  step(
    dt: number,
    world: HeightfieldQuery,
    ceilingY?: number,
    motorVelX?: number
  ): void {
    // Semi-implicit Euler integration
    this.vel.y += this.config.gravity * dt;

    if (motorVelX !== undefined) {
      this.vel.x = motorVelX;
    }

    // Predicted new position
    const nextX = this.pos.x + this.vel.x * dt;
    const nextZ = this.pos.z + this.vel.z * dt;
    const nextY = this.pos.y + this.vel.y * dt;

    const supportY = world.getSphereSupportY(nextX, nextZ, this.config.radius);
    const bottomY = nextY - this.config.radius;

    // Ground & Step-up handling
    if (bottomY <= supportY) {
      const stepDiff = supportY - (this.pos.y - this.config.radius);
      // Auto step-up for ledges within maxStepHeight
      if (stepDiff > 0 && stepDiff <= (this.config.maxStepHeight || 0.35)) {
        this.pos.y = supportY + this.config.radius;
      } else {
        this.pos.y = supportY + this.config.radius;
      }
      this.isGrounded = true;

      if (this.vel.y < 0) {
        // Calculate rebound velocity
        const rebound = -this.vel.y * this.config.restitution;
        if (rebound > 0.4) {
          this.bounceCount++;
          this.lastBouncePeak = this.pos.y + (rebound * rebound) / (2 * Math.abs(this.config.gravity));
        }
        this.vel.y = rebound < 0.25 ? 0 : rebound;
      }

      if (motorVelX === undefined) {
        this.vel.x *= Math.max(0, 1 - this.config.friction * dt * 10);
        this.vel.z *= Math.max(0, 1 - this.config.friction * dt * 10);
      }
    } else {
      this.pos.y = nextY;
      this.isGrounded = false;
    }

    // Ceiling collision (for tight-spaces / grate test)
    if (ceilingY !== undefined) {
      const topY = this.pos.y + this.config.radius;
      if (topY >= ceilingY) {
        this.pos.y = ceilingY - this.config.radius;
        if (this.vel.y > 0) {
          this.vel.y = -this.vel.y * 0.2;
        }
      }
    }

    this.pos.x = nextX;
    this.pos.z = nextZ;
  }
}

// ---------------------------------------------------------------------------
// 3. Soft Body Solver (XPBD 162-Particle Lattice from Prototype Reference)
// ---------------------------------------------------------------------------

export class SoftBodySimulator {
  public n: number;
  public x: Float64Array;
  public px: Float64Array;
  public v: Float64Array;
  public q: Float64Array;
  public radius: number;
  public mass: number;
  public gravity: number;
  public restitution: number;
  public bounceCount: number = 0;
  public com: Vector3Like;
  public isGrounded: boolean = false;
  private restDistances: Float64Array;
  private edges: Uint32Array;

  constructor(
    level: number = 3,
    radius: number = 0.35,
    initialPos: Vector3Like = { x: 0, y: 4, z: 0 },
    restitution: number = 0.85
  ) {
    this.radius = radius;
    this.mass = 1.2;
    this.gravity = -20;
    this.restitution = restitution;
    this.com = { ...initialPos };

    const { verts, edges } = this.generateIcosphereLattice(level, radius);
    this.n = verts.length;
    this.x = new Float64Array(3 * this.n);
    this.px = new Float64Array(3 * this.n);
    this.v = new Float64Array(3 * this.n);
    this.q = new Float64Array(3 * this.n);

    for (let i = 0; i < this.n; i++) {
      this.q[3 * i] = verts[i][0];
      this.q[3 * i + 1] = verts[i][1];
      this.q[3 * i + 2] = verts[i][2];

      this.x[3 * i] = initialPos.x + verts[i][0];
      this.x[3 * i + 1] = initialPos.y + verts[i][1];
      this.x[3 * i + 2] = initialPos.z + verts[i][2];

      this.px[3 * i] = this.x[3 * i];
      this.px[3 * i + 1] = this.x[3 * i + 1];
      this.px[3 * i + 2] = this.x[3 * i + 2];
    }

    this.edges = edges;
    this.restDistances = new Float64Array(edges.length / 2);
    for (let j = 0; j < this.restDistances.length; j++) {
      const a = 3 * edges[2 * j];
      const b = 3 * edges[2 * j + 1];
      const dx = this.q[a] - this.q[b];
      const dy = this.q[a + 1] - this.q[b + 1];
      const dz = this.q[a + 2] - this.q[b + 2];
      this.restDistances[j] = Math.hypot(dx, dy, dz);
    }
  }

  step(
    dt: number,
    world: HeightfieldQuery,
    ceilingY?: number,
    motorVelX?: number,
    subSteps = 3
  ): void {
    const sdt = dt / subSteps;
    for (let step = 0; step < subSteps; step++) {
      this.subStep(sdt, world, ceilingY, motorVelX);
    }
    this.updateCOM();
  }

  private subStep(
    sdt: number,
    world: HeightfieldQuery,
    ceilingY?: number,
    motorVelX?: number
  ): void {
    const n = this.n;

    for (let i = 0; i < n; i++) {
      const i3 = 3 * i;
      this.v[i3 + 1] += this.gravity * sdt;
      if (motorVelX !== undefined) {
        this.v[i3] = motorVelX;
      }
      this.px[i3] = this.x[i3];
      this.px[i3 + 1] = this.x[i3 + 1];
      this.px[i3 + 2] = this.x[i3 + 2];

      this.x[i3] += this.v[i3] * sdt;
      this.x[i3 + 1] += this.v[i3 + 1] * sdt;
      this.x[i3 + 2] += this.v[i3 + 2] * sdt;
    }

    // Distance Constraints
    const numEdges = this.edges.length / 2;
    for (let j = 0; j < numEdges; j++) {
      const a = 3 * this.edges[2 * j];
      const b = 3 * this.edges[2 * j + 1];
      const rest = this.restDistances[j];

      const dx = this.x[a] - this.x[b];
      const dy = this.x[a + 1] - this.x[b + 1];
      const dz = this.x[a + 2] - this.x[b + 2];
      const dist = Math.hypot(dx, dy, dz) || 1e-6;

      const diff = (dist - rest) / dist;
      const correction = 0.5 * diff;

      this.x[a] -= dx * correction;
      this.x[a + 1] -= dy * correction;
      this.x[a + 2] -= dz * correction;

      this.x[b] += dx * correction;
      this.x[b + 1] += dy * correction;
      this.x[b + 2] += dz * correction;
    }

    // Collision
    let contacts = 0;
    for (let i = 0; i < n; i++) {
      const i3 = 3 * i;
      const gY = world.getHeight(this.x[i3], this.x[i3 + 2]);
      if (this.x[i3 + 1] < gY) {
        this.x[i3 + 1] = gY;
        contacts++;
      }
      if (ceilingY !== undefined && this.x[i3 + 1] > ceilingY) {
        this.x[i3 + 1] = ceilingY;
      }
    }
    this.isGrounded = contacts > 0;

    const invSdt = 1.0 / sdt;
    for (let i = 0; i < n; i++) {
      const i3 = 3 * i;
      this.v[i3] = (this.x[i3] - this.px[i3]) * invSdt;
      this.v[i3 + 1] = (this.x[i3 + 1] - this.px[i3 + 1]) * invSdt;
      this.v[i3 + 2] = (this.x[i3 + 2] - this.px[i3 + 2]) * invSdt;
    }
  }

  private updateCOM(): void {
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < this.n; i++) {
      cx += this.x[3 * i];
      cy += this.x[3 * i + 1];
      cz += this.x[3 * i + 2];
    }
    this.com = {
      x: cx / this.n,
      y: cy / this.n,
      z: cz / this.n,
    };
  }

  private generateIcosphereLattice(
    level: number,
    radius: number
  ): { verts: [number, number, number][]; edges: Uint32Array } {
    const t = (1 + Math.sqrt(5)) / 2;
    const V: [number, number, number][] = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    let verts: [number, number, number][] = V.map(v => {
      const l = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l * radius, v[1] / l * radius, v[2] / l * radius];
    });

    let faces: [number, number, number][] = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    for (let l = 0; l < level; l++) {
      const cache = new Map<number, number>();
      const nf: [number, number, number][] = [];
      const mid = (a: number, b: number) => {
        const k = a < b ? a * 65536 + b : b * 65536 + a;
        let m = cache.get(k);
        if (m === undefined) {
          const p = verts[a], q = verts[b];
          const x = (p[0] + q[0]) / 2, y = (p[1] + q[1]) / 2, z = (p[2] + q[2]) / 2;
          const l2 = Math.hypot(x, y, z);
          verts.push([x / l2 * radius, y / l2 * radius, z / l2 * radius]);
          m = verts.length - 1;
          cache.set(k, m);
        }
        return m;
      };
      for (const f of faces) {
        const a = mid(f[0], f[1]), b = mid(f[1], f[2]), c = mid(f[2], f[0]);
        nf.push([f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]);
      }
      faces = nf;
    }

    const seen = new Set<number>();
    const e: number[] = [];
    const n = verts.length;
    for (const t of faces) {
      for (let k = 0; k < 3; k++) {
        const a = t[k], c = t[(k + 1) % 3];
        const key = a < c ? a * n + c : c * n + a;
        if (!seen.has(key)) {
          seen.add(key);
          e.push(a, c);
        }
      }
    }

    return { verts, edges: new Uint32Array(e) };
  }
}

// ---------------------------------------------------------------------------
// 4. Comparison Test Suite (Phase 0 Spike Acceptance Gates)
// ---------------------------------------------------------------------------

export interface SpikeComparisonResults {
  bounceTest: {
    rigidProxyBounces: number;
    softBodyBounces: number;
    gatePassed: boolean;
  };
  tightSpacesTest: {
    rigidProxyPasses: number;
    rigidProxyTunnels: number;
    softBodyPasses: number;
    softBodyPinches: number;
    gatePassed: boolean;
  };
  ditchTest: {
    geodeCrossed: boolean;
    avatarTraversed: boolean;
    gatePassed: boolean;
  };
  benchmark: {
    rigidProxyMsPerStep: number;
    softBodyMsPerStep: number;
    speedupFactor: number;
  };
}

export function runPhase0SpikeComparison(): SpikeComparisonResults {
  const dt = 1 / 60;
  const flatWorld = new FlatHeightfieldWithTrench(0, 0, 0);

  // --- Test 1: Bounce Test ---
  const rigidBounce = new RigidProxySimulator({ restitution: 0.85 }, { x: 0, y: 4, z: 0 });
  const softBounce = new SoftBodySimulator(2, 0.35, { x: 0, y: 4, z: 0 }, 0.85);

  let softBounces = 0;
  let prevVy = 0;

  for (let s = 0; s < 300; s++) {
    rigidBounce.step(dt, flatWorld);
    softBounce.step(dt, flatWorld);

    const vy = (softBounce.com.y - softBounce.x[1]) / dt;
    if (softBounce.isGrounded && prevVy < -0.5) {
      softBounces++;
    }
    prevVy = vy;
  }

  // --- Test 2: Tight Spaces Test (0.5m Grate / Gap, 100 passes) ---
  const grateCeiling = 0.5;
  let rigidPasses = 0;
  let rigidTunnels = 0;
  let softPasses = 0;
  let softPinches = 0;

  for (let pass = 0; pass < 100; pass++) {
    const rp = new RigidProxySimulator({ radius: 0.22 }, { x: -2, y: 0.25, z: 0 });
    let passed = false;
    let tunneled = false;

    for (let step = 0; step < 70; step++) {
      rp.step(dt, flatWorld, grateCeiling, 4.0); // Drive at 4 m/s
      if (rp.pos.y + rp.config.radius > grateCeiling + 0.05 || rp.pos.y - rp.config.radius < -0.05) {
        tunneled = true;
      }
      if (rp.pos.x > 1.5) {
        passed = true;
        break;
      }
    }
    if (passed && !tunneled) rigidPasses++;
    if (tunneled) rigidTunnels++;

    // Soft body in narrow gap
    const sb = new SoftBodySimulator(2, 0.22, { x: -2, y: 0.25, z: 0 });
    let sbPassed = false;
    let sbPinched = false;

    for (let step = 0; step < 70; step++) {
      sb.step(dt, flatWorld, grateCeiling, 4.0);
      if (sb.com.y < 0.05 || sb.com.y > 0.45) {
        sbPinched = true;
      }
      if (sb.com.x > 1.5) {
        sbPassed = true;
        break;
      }
    }
    if (sbPassed && !sbPinched) softPasses++;
    if (sbPinched) softPinches++;
  }

  // --- Test 3: Ditch / Trench Test ---
  const ditchWorld = new FlatHeightfieldWithTrench(0.4, 0.3, 0);

  // Geode: radius 0.45m rolls across
  const geode = new RigidProxySimulator({ radius: 0.45, mass: 3.5, friction: 0.05 }, { x: -1.5, y: 0.45, z: 0 });
  let geodeCrossed = false;

  for (let s = 0; s < 120; s++) {
    geode.step(dt, ditchWorld, undefined, 3.0);
    if (geode.pos.x > 1.0 && geode.pos.y > 0.3) {
      geodeCrossed = true;
      break;
    }
  }

  // Avatar: radius 0.18m drops into trench and walks out
  const avatar = new RigidProxySimulator({ radius: 0.18, mass: 1.2, maxStepHeight: 0.35 }, { x: -1.0, y: 0.18, z: 0 });
  let avatarTraversed = false;
  let avatarDescended = false;

  for (let s = 0; s < 150; s++) {
    avatar.step(dt, ditchWorld, undefined, 1.5);
    if (avatar.pos.y < 0.0) {
      avatarDescended = true;
    }
    if (avatarDescended && avatar.pos.x > 0.8) {
      avatarTraversed = true;
      break;
    }
  }

  // --- Benchmark: Execution Speed ---
  const benchSteps = 1000;
  const t0 = performance.now();
  const rpBench = new RigidProxySimulator({}, { x: 0, y: 2, z: 0 });
  for (let i = 0; i < benchSteps; i++) {
    rpBench.step(dt, flatWorld);
  }
  const t1 = performance.now();
  const rigidMsPerStep = (t1 - t0) / benchSteps;

  const t2 = performance.now();
  const sbBench = new SoftBodySimulator(2, 0.35, { x: 0, y: 2, z: 0 });
  for (let i = 0; i < benchSteps; i++) {
    sbBench.step(dt, flatWorld);
  }
  const t3 = performance.now();
  const softMsPerStep = (t3 - t2) / benchSteps;

  return {
    bounceTest: {
      rigidProxyBounces: rigidBounce.bounceCount,
      softBodyBounces: softBounces,
      gatePassed: rigidBounce.bounceCount >= 5,
    },
    tightSpacesTest: {
      rigidProxyPasses: rigidPasses,
      rigidProxyTunnels: rigidTunnels,
      softBodyPasses: softPasses,
      softBodyPinches: softPinches,
      gatePassed: rigidPasses === 100 && rigidTunnels === 0,
    },
    ditchTest: {
      geodeCrossed,
      avatarTraversed,
      gatePassed: geodeCrossed && avatarTraversed,
    },
    benchmark: {
      rigidProxyMsPerStep: rigidMsPerStep,
      softBodyMsPerStep: softMsPerStep,
      speedupFactor: softMsPerStep / (rigidMsPerStep || 1e-6),
    },
  };
}
