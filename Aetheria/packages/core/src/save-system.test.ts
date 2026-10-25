import { describe, it, expect, beforeEach } from 'vitest';
import {
  SaveSystem,
  MemoryStorageAdapter,
  CURRENT_SAVE_VERSION,
  type GameSavePayload,
} from './save-system.js';

describe('Phase 1 Foundation - Save System & Staged Import', () => {
  let memoryStorage: MemoryStorageAdapter;
  let saveSystem: SaveSystem;

  beforeEach(() => {
    memoryStorage = new MemoryStorageAdapter();
    saveSystem = new SaveSystem(memoryStorage);
  });

  it('initializes with default Pebble Isle world at Pebble Cove', () => {
    const save = saveSystem.getCurrentSave();
    expect(save.version).toBe(CURRENT_SAVE_VERSION);
    expect(save.activeWorldId).toBe('world_starter');

    const world = saveSystem.getActiveWorld();
    expect(world.name).toBe('Pebble Isle');
    expect(world.player.formId).toBe('oobleck');
    expect(world.player.position).toEqual({ x: 60, y: 1.5, z: 40 });
  });

  it('creates multiple named worlds and switches between them', () => {
    const newWorld = saveSystem.createWorld('Dune Haven', 12345);
    expect(newWorld.name).toBe('Dune Haven');
    expect(saveSystem.getCurrentSave().activeWorldId).toBe(newWorld.id);

    const active = saveSystem.getActiveWorld();
    expect(active.id).toBe(newWorld.id);
  });

  it('manages 3 rolling backups rotating only when content changes', () => {
    // Initial save created
    saveSystem.updatePlayerState('slime', 'dewdrop', { x: 70, y: 2, z: 45 });
    saveSystem.commitSave();

    const backup1Key = `${SaveSystem.BACKUP_PREFIX}1`;
    const backup2Key = `${SaveSystem.BACKUP_PREFIX}2`;
    const backup3Key = `${SaveSystem.BACKUP_PREFIX}3`;

    expect(memoryStorage.getItem(backup1Key)).not.toBeNull();

    // Second mutation
    saveSystem.updatePlayerState('wisp', 'mist', { x: 80, y: 3, z: 50 });
    saveSystem.commitSave();

    expect(memoryStorage.getItem(backup2Key)).not.toBeNull();

    // Third mutation
    saveSystem.updatePlayerState('stone', 'obsidian', { x: 90, y: 4, z: 55 });
    saveSystem.commitSave();

    expect(memoryStorage.getItem(backup3Key)).not.toBeNull();

    // backup_1 is 1 step back (mist), backup_2 is 2 steps back (dewdrop), backup_3 is 3 steps back (oobleck)
    const restored1 = saveSystem.restoreFromBackup(1);
    expect(restored1).toBe(true);
    expect(saveSystem.getActiveWorld().player.formId).toBe('mist');

    const restored2 = saveSystem.restoreFromBackup(2);
    expect(restored2).toBe(true);
    expect(saveSystem.getActiveWorld().player.formId).toBe('dewdrop');
  });

  describe('Staged Import Validation (Master Plan §13)', () => {
    it('validates and stages a valid save payload with clear summary', () => {
      const validPayload: GameSavePayload = {
        version: CURRENT_SAVE_VERSION,
        activeWorldId: 'imported_world',
        worlds: {
          imported_world: {
            id: 'imported_world',
            name: 'Cloud Isle',
            createdAt: 1000000,
            lastPlayedAt: 1050000,
            playtimeSeconds: 300,
            seed: 999,
            player: {
              family: 'wisp',
              formId: 'zephyr',
              position: { x: 10, y: 5, z: 20 },
              discoveredForms: ['oobleck', 'zephyr'],
            },
            inventory: [{ itemId: 'petal', count: 5 }],
            structures: [],
            trenches: [],
            discoveredPOIs: ['pebble_cove'],
          },
        },
        settings: {
          volume: 0.9,
          reducedMotion: false,
          qualityPreset: 'balanced',
        },
      };

      const jsonStr = JSON.stringify(validPayload);
      const staged = saveSystem.stageImport(jsonStr);

      expect(staged.valid).toBe(true);
      expect(staged.summary).toBeDefined();
      expect(staged.summary?.activeWorldName).toBe('Cloud Isle');
      expect(staged.summary?.activeForm).toBe('zephyr');
      expect(staged.summary?.worldCount).toBe(1);

      // Apply the staged import
      const applied = saveSystem.applyStagedImport(staged);
      expect(applied).toBe(true);
      expect(saveSystem.getActiveWorld().name).toBe('Cloud Isle');
      expect(saveSystem.getActiveWorld().player.formId).toBe('zephyr');
    });

    it('rejects malformed JSON syntax gracefully', () => {
      const brokenJson = '{ version: 1, activeWorldId: ';
      const staged = saveSystem.stageImport(brokenJson);
      expect(staged.valid).toBe(false);
      expect(staged.error).toContain('Invalid JSON syntax');
    });

    it('rejects unsupported future version', () => {
      const futurePayload = {
        version: CURRENT_SAVE_VERSION + 99,
        activeWorldId: 'w1',
        worlds: {},
      };
      const staged = saveSystem.stageImport(JSON.stringify(futurePayload));
      expect(staged.valid).toBe(false);
      expect(staged.error).toContain('is newer than supported version');
    });

    it('rejects payloads missing required world structure', () => {
      const missingWorld = {
        version: CURRENT_SAVE_VERSION,
        activeWorldId: 'missing_world_key',
        worlds: {},
      };
      const staged = saveSystem.stageImport(JSON.stringify(missingWorld));
      expect(staged.valid).toBe(false);
      expect(staged.error).toContain('not found in save');
    });
  });
});
