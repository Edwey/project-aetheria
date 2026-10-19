/**
 * @file packages/assets/src/index.ts
 * @module @aetheria/assets
 *
 * Core Asset Pipeline, Model Catalog, GLB Loader and Procedural Fallback System.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import manifestData from '../manifest.json';

export type ModelCategory = 'nature' | 'rocks' | 'props' | 'structures' | 'cosmetics';

export interface ModelInfo {
  id: string;
  name: string;
  category: ModelCategory;
  path: string;
  file: string;
  license: string;
  author: string;
  authorUrl: string;
  description: string;
  bytes: number;
  sha256: string;
}

export interface AssetManifest {
  version: string;
  generatedAt: string;
  totalModels: number;
  categories: ModelCategory[];
  totalBytes: number;
  models: Record<string, ModelInfo>;
}

export const MANIFEST = manifestData as unknown as AssetManifest;

/**
 * Retrieve metadata for a specific model ID.
 */
export function getModelInfo(id: string): ModelInfo | undefined {
  return MANIFEST.models[id];
}

/**
 * Check if a model exists in the catalog.
 */
export function hasModel(id: string): boolean {
  return Boolean(MANIFEST.models[id]);
}

/**
 * List all available model IDs.
 */
export function listModelIds(): string[] {
  return Object.keys(MANIFEST.models);
}

/**
 * Query models by category.
 */
export function getModelsByCategory(category: ModelCategory): ModelInfo[] {
  return Object.values(MANIFEST.models).filter(m => m.category === category);
}

/**
 * Generates a stylized procedural 3D fallback for any model ID.
 * Follows Aetheria's cozy pastel aesthetic and ensures the game
 * operates even with an empty assets folder.
 */
export function createProceduralFallback(id: string): THREE.Object3D {
  const group = new THREE.Group();
  group.name = `fallback_${id}`;

  const info = getModelInfo(id);
  const category = info?.category ?? 'props';

  switch (category) {
    case 'nature': {
      if (id.includes('tree')) {
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.4, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.7;
        group.add(trunk);

        const isPine = id.includes('pine');
        const leafGeo = isPine
          ? new THREE.ConeGeometry(0.9, 1.8, 6)
          : new THREE.DodecahedronGeometry(0.95);
        const leafColor = isPine ? 0x3d7045 : 0x6ca362;
        const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.6, flatShading: true });
        const foliage = new THREE.Mesh(leafGeo, leafMat);
        foliage.position.y = isPine ? 2.0 : 1.9;
        group.add(foliage);
      } else if (id.includes('mushroom')) {
        const stemGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0xede4d3, roughness: 0.7 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.2;
        group.add(stem);

        const capGeo = new THREE.ConeGeometry(0.35, 0.25, 8);
        const capColor = id.includes('red') ? 0xd64d4d : 0xc2a688;
        const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.5 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.45;
        group.add(cap);
      } else if (id.includes('flower')) {
        const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a8542 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.25;
        group.add(stem);

        const petalGeo = new THREE.SphereGeometry(0.15, 6, 6);
        let petalColor = 0xe05555;
        if (id.includes('yellow')) petalColor = 0xf5c242;
        if (id.includes('purple')) petalColor = 0x9b6bc4;
        const petalMat = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.4 });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.y = 0.55;
        group.add(petal);
      } else if (id.includes('campfire')) {
        const baseGeo = new THREE.TorusGeometry(0.4, 0.12, 5, 8);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, flatShading: true });
        const stones = new THREE.Mesh(baseGeo, stoneMat);
        stones.rotation.x = Math.PI / 2;
        stones.position.y = 0.1;
        group.add(stones);

        const flameGeo = new THREE.ConeGeometry(0.2, 0.5, 5);
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xff7b24, emissive: 0xff4500, emissiveIntensity: 0.8 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.y = 0.35;
        group.add(flame);
      } else {
        const cactusGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 7);
        const cactusMat = new THREE.MeshStandardMaterial({ color: 0x5a9154, flatShading: true });
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        cactus.position.y = 0.6;
        group.add(cactus);
      }
      break;
    }

    case 'rocks': {
      if (id.includes('crystal')) {
        const crystalGeo = new THREE.OctahedronGeometry(0.45, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: 0x55bbee,
          emissive: 0x2266aa,
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.1,
          flatShading: true
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.y = 0.45;
        group.add(crystal);
      } else {
        const radius = id.includes('boulder') ? 0.9 : id.includes('small') ? 0.25 : 0.65;
        const rockGeo = new THREE.DodecahedronGeometry(radius, 0);
        const rockMat = new THREE.MeshStandardMaterial({
          color: id.includes('boulder') ? 0x475569 : 0x78716c,
          roughness: 0.9,
          flatShading: true
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.y = radius * 0.85;
        group.add(rock);
      }
      break;
    }

    case 'props': {
      if (id.includes('crate')) {
        const size = id.includes('large') ? 1.2 : 0.8;
        const boxGeo = new THREE.BoxGeometry(size, size, size);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xba8c5b, roughness: 0.7, flatShading: true });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = size / 2;
        group.add(box);
      } else if (id.includes('barrel')) {
        const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.85, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8a623a, roughness: 0.7, flatShading: true });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.y = 0.425;
        group.add(barrel);
      } else if (id.includes('lantern')) {
        const cageGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 6);
        const cageMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
        const cage = new THREE.Mesh(cageGeo, cageMat);
        cage.position.y = 0.25;
        group.add(cage);

        const bulbGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffea78, emissive: 0xffc83b, emissiveIntensity: 1.0 });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.y = 0.25;
        group.add(bulb);
      } else {
        const propGeo = new THREE.BoxGeometry(0.7, 0.4, 0.5);
        const propMat = new THREE.MeshStandardMaterial({ color: 0x926c45, flatShading: true });
        const prop = new THREE.Mesh(propGeo, propMat);
        prop.position.y = 0.2;
        group.add(prop);
      }
      break;
    }

    case 'structures': {
      if (id.includes('pressure_plate')) {
        const isRound = id.includes('round');
        const plateGeo = isRound
          ? new THREE.CylinderGeometry(0.5, 0.55, 0.08, 12)
          : new THREE.BoxGeometry(0.9, 0.08, 0.9);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, flatShading: true });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.y = 0.04;
        group.add(plate);
      } else if (id.includes('gate') || id.includes('grate')) {
        const frameGeo = new THREE.BoxGeometry(1.6, 2.2, 0.15);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7, roughness: 0.5 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 1.1;
        group.add(frame);
      } else if (id.includes('stairs')) {
        for (let i = 0; i < 4; i++) {
          const stepGeo = new THREE.BoxGeometry(1.2, 0.2, 0.35);
          const stepMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, flatShading: true });
          const step = new THREE.Mesh(stepGeo, stepMat);
          step.position.set(0, 0.1 + i * 0.2, -i * 0.35);
          group.add(step);
        }
      } else {
        const ladderGeo = new THREE.BoxGeometry(0.6, 2.0, 0.1);
        const ladderMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
        const ladder = new THREE.Mesh(ladderGeo, ladderMat);
        ladder.position.y = 1.0;
        group.add(ladder);
      }
      break;
    }

    case 'cosmetics': {
      if (id.includes('hat')) {
        const hatGeo = new THREE.ConeGeometry(0.35, 0.25, 8);
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 0.15;
        group.add(hat);
      } else {
        const starGeo = new THREE.OctahedronGeometry(0.25, 0);
        const starMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.6 });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.y = 0.25;
        group.add(star);
      }
      break;
    }
  }

  return group;
}

/**
 * AssetLoader manages asynchronous GLB model loading, model caching,
 * and procedural fallbacks.
 */
export class AssetLoader {
  private loader: GLTFLoader;
  private cache: Map<string, THREE.Object3D> = new Map();
  private loadingPromises: Map<string, Promise<THREE.Object3D>> = new Map();
  private basePath: string;

  constructor(basePath = '/') {
    this.loader = new GLTFLoader();
    this.basePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  }

  /**
   * Set root base URL path (e.g. '/' or '/public/').
   */
  public setBasePath(basePath: string): void {
    this.basePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  }

  /**
   * Load a 3D model by its manifest ID.
   * If the model file is not found or fails to load, gracefully falls back
   * to a procedural fallback matching the asset's aesthetic.
   */
  public async loadModel(id: string): Promise<THREE.Object3D> {
    // 1. Check in-memory cache
    const cached = this.cache.get(id);
    if (cached) {
      return cached.clone(true);
    }

    // 2. Check in-flight load
    const inFlight = this.loadingPromises.get(id);
    if (inFlight) {
      const scene = await inFlight;
      return scene.clone(true);
    }

    // 3. Resolve file URL from manifest
    const info = getModelInfo(id);
    if (!info) {
      console.warn(`[AssetLoader] Unknown model ID: "${id}". Using procedural fallback.`);
      const fallback = createProceduralFallback(id);
      this.cache.set(id, fallback);
      return fallback.clone(true);
    }

    const modelUrl = `${this.basePath}${info.path}`;

    const loadPromise = new Promise<THREE.Object3D>((resolve) => {
      this.loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          model.name = id;
          // Apply shadow casting & receiving across meshes
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.cache.set(id, model);
          this.loadingPromises.delete(id);
          resolve(model);
        },
        undefined,
        (err) => {
          console.warn(`[AssetLoader] Failed to load "${modelUrl}" (${(err as Error).message ?? err}). Using procedural fallback.`);
          const fallback = createProceduralFallback(id);
          this.cache.set(id, fallback);
          this.loadingPromises.delete(id);
          resolve(fallback);
        }
      );
    });

    this.loadingPromises.set(id, loadPromise);
    const loaded = await loadPromise;
    return loaded.clone(true);
  }

  /**
   * Synchronously obtain a procedural fallback object for a model ID.
   */
  public getProcedural(id: string): THREE.Object3D {
    return createProceduralFallback(id);
  }

  /**
   * Preload a batch of models.
   */
  public async preload(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.loadModel(id)));
  }

  /**
   * Preload all models in the manifest.
   */
  public async preloadAll(): Promise<void> {
    await this.preload(listModelIds());
  }

  /**
   * Clear loaded model cache.
   */
  public clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}
