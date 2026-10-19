import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  MANIFEST,
  getModelInfo,
  hasModel,
  listModelIds,
  getModelsByCategory,
  createProceduralFallback,
  AssetLoader,
  type ModelCategory
} from './index';

describe('Asset Catalog & Manifest', () => {
  it('loads the manifest with correct version and count', () => {
    expect(MANIFEST.version).toBe('1.0.0');
    expect(MANIFEST.totalModels).toBeGreaterThanOrEqual(30);
    expect(Object.keys(MANIFEST.models).length).toBe(MANIFEST.totalModels);
  });

  it('includes all 5 required asset categories', () => {
    const expectedCategories: ModelCategory[] = ['nature', 'rocks', 'props', 'structures', 'cosmetics'];
    for (const cat of expectedCategories) {
      expect(MANIFEST.categories).toContain(cat);
      const items = getModelsByCategory(cat);
      expect(items.length).toBeGreaterThan(0);
    }
  });

  it('ensures every model in the catalog is CC0 licensed', () => {
    for (const model of Object.values(MANIFEST.models)) {
      expect(model.license).toBe('CC0');
      expect(model.author).toBeDefined();
      expect(model.authorUrl).toBeDefined();
      expect(model.path).toMatch(/\.glb$/);
      expect(model.sha256).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(model.bytes).toBeGreaterThan(0);
    }
  });

  it('retrieves specific models by ID', () => {
    expect(hasModel('tree_oak')).toBe(true);
    expect(hasModel('crate_wood')).toBe(true);
    expect(hasModel('boulder_large')).toBe(true);
    expect(hasModel('pressure_plate_square')).toBe(true);
    expect(hasModel('gate_sliding')).toBe(true);
    expect(hasModel('stairs_stone')).toBe(true);
    expect(hasModel('lantern')).toBe(true);
    expect(hasModel('hat_cap')).toBe(true);
    expect(hasModel('non_existent_id')).toBe(false);

    const oak = getModelInfo('tree_oak');
    expect(oak).toBeDefined();
    expect(oak?.category).toBe('nature');
    expect(oak?.file).toBe('tree_oak.glb');
  });

  it('lists all model IDs accurately', () => {
    const ids = listModelIds();
    expect(ids).toContain('tree_oak');
    expect(ids).toContain('crate_wood');
    expect(ids).toContain('grate_metal');
    expect(ids.length).toBe(MANIFEST.totalModels);
  });
});

describe('Procedural Fallbacks', () => {
  it('creates valid procedural Three.js fallbacks for all categories', () => {
    const testIds = [
      'tree_oak',
      'tree_pine',
      'mushroom_red',
      'flower_yellow',
      'campfire',
      'cactus',
      'boulder_large',
      'crystal_geode',
      'crate_wood',
      'barrel_wood',
      'lantern',
      'pressure_plate_square',
      'gate_sliding',
      'stairs_stone',
      'hat_cap',
      'charm_star'
    ];

    for (const id of testIds) {
      const obj = createProceduralFallback(id);
      expect(obj).toBeInstanceOf(THREE.Object3D);
      expect(obj.children.length).toBeGreaterThan(0);

      // Verify at least one mesh exists
      let meshCount = 0;
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshCount++;
        }
      });
      expect(meshCount).toBeGreaterThan(0);
    }
  });

  it('handles unknown model IDs gracefully with a fallback object', () => {
    const unknown = createProceduralFallback('some_random_prop');
    expect(unknown).toBeInstanceOf(THREE.Object3D);
    expect(unknown.children.length).toBeGreaterThan(0);
  });
});

describe('AssetLoader', () => {
  it('instantiates and provides synchronous procedural fallbacks', () => {
    const loader = new AssetLoader('/test-assets/');
    const obj = loader.getProcedural('tree_pine');
    expect(obj).toBeInstanceOf(THREE.Object3D);
    expect(obj.name).toBe('fallback_tree_pine');
  });

  it('gracefully falls back on non-existent model load', async () => {
    const loader = new AssetLoader('/');
    const model = await loader.loadModel('unknown_asset_xyz');
    expect(model).toBeInstanceOf(THREE.Object3D);
    expect(model.name).toBe('fallback_unknown_asset_xyz');
  });

  it('clears cache cleanly', () => {
    const loader = new AssetLoader('/');
    loader.clearCache();
    expect(loader).toBeDefined();
  });
});
