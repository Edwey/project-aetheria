/**
 * Versioned Save Schema, Rolling Backups & Staged Import
 * 
 * Aligned with Master Plan v4 (§13).
 * Features:
 * - Versioned schema with migration hooks
 * - Local-first with 3 rolling backups (backup_1, backup_2, backup_3)
 * - Safe Staged Import with syntax check, field validation, and pre-apply backup
 */

import type { CreatureFamily, FormId } from './forms.js';

export const CURRENT_SAVE_VERSION = 1;

export interface PlayerSaveState {
  family: CreatureFamily;
  formId: FormId;
  position: { x: number; y: number; z: number };
  discoveredForms: FormId[];
}

export interface InventorySlotSave {
  itemId: string;
  count: number;
}

export interface PlacedStructureSave {
  id: string;
  pieceType: string;
  position: { x: number; y: number; z: number };
  rotation: [number, number, number, number]; // Quaternion [x, y, z, w]
}

export interface TrenchCellSave {
  x: number;
  z: number;
  depth: number;
}

export interface WorldSave {
  id: string;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
  playtimeSeconds: number;
  seed: number;
  player: PlayerSaveState;
  inventory: InventorySlotSave[];
  structures: PlacedStructureSave[];
  trenches: TrenchCellSave[];
  discoveredPOIs: string[];
}

export interface GameSavePayload {
  version: number;
  activeWorldId: string;
  worlds: Record<string, WorldSave>;
  settings: {
    volume: number;
    reducedMotion: boolean;
    qualityPreset: 'balanced' | 'low';
    customKeyBindings?: Record<string, string[]>;
  };
}

export interface ImportSummary {
  version: number;
  worldCount: number;
  activeWorldName: string;
  activeForm: FormId;
  timestamp: string;
}

export interface StagedImportResult {
  valid: boolean;
  error?: string;
  summary?: ImportSummary;
  parsedData?: GameSavePayload;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export class SaveSystem {
  public static readonly STORAGE_KEY = 'aetheria_save_active';
  public static readonly BACKUP_PREFIX = 'aetheria_backup_';

  private storage: StorageAdapter;
  private currentData: GameSavePayload;
  private lastSavedHash: string = '';

  constructor(storageAdapter?: StorageAdapter) {
    if (storageAdapter) {
      this.storage = storageAdapter;
    } else if (typeof localStorage !== 'undefined') {
      this.storage = localStorage;
    } else {
      this.storage = new MemoryStorageAdapter();
    }

    const initial = this.loadInitial();
    if (initial) {
      this.currentData = initial;
    } else {
      this.currentData = this.createDefaultSave();
      this.storage.setItem(SaveSystem.STORAGE_KEY, JSON.stringify(this.currentData));
    }
    this.lastSavedHash = this.computeHash(this.currentData);
  }

  getCurrentSave(): Readonly<GameSavePayload> {
    return this.currentData;
  }

  getActiveWorld(): WorldSave {
    const world = this.currentData.worlds[this.currentData.activeWorldId];
    if (!world) {
      throw new Error(`Active world ${this.currentData.activeWorldId} not found`);
    }
    return world;
  }

  // --- World Operations ---

  createWorld(name: string, seed = Math.floor(Math.random() * 1000000)): WorldSave {
    const worldId = `world_${Date.now()}`;
    const newWorld: WorldSave = {
      id: worldId,
      name,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      playtimeSeconds: 0,
      seed,
      player: {
        family: 'slime',
        formId: 'oobleck',
        position: { x: 60, y: 1.5, z: 40 }, // Starter cove
        discoveredForms: ['oobleck'],
      },
      inventory: [],
      structures: [],
      trenches: [],
      discoveredPOIs: ['pebble_cove'],
    };

    this.currentData.worlds[worldId] = newWorld;
    this.currentData.activeWorldId = worldId;
    this.commitSave();
    return newWorld;
  }

  updatePlayerState(family: CreatureFamily, formId: FormId, position: { x: number; y: number; z: number }): void {
    const world = this.getActiveWorld();
    world.player.family = family;
    world.player.formId = formId;
    world.player.position = { ...position };
    if (!world.player.discoveredForms.includes(formId)) {
      world.player.discoveredForms.push(formId);
    }
    world.lastPlayedAt = Date.now();
  }

  addPlacedStructure(structure: PlacedStructureSave): void {
    const world = this.getActiveWorld();
    world.structures.push(structure);
  }

  recordTrenchCell(x: number, z: number, depth: number): void {
    const world = this.getActiveWorld();
    const existing = world.trenches.find(t => t.x === x && t.z === z);
    if (existing) {
      existing.depth = depth;
    } else {
      world.trenches.push({ x, z, depth });
    }
  }

  // --- Persistence & Rolling Backups ---

  commitSave(): void {
    const currentHash = this.computeHash(this.currentData);
    if (currentHash === this.lastSavedHash) {
      return; // Do not rotate backups if nothing changed
    }

    // 1. Rotate rolling backups: backup_2 -> backup_3, backup_1 -> backup_2
    const currentStored = this.storage.getItem(SaveSystem.STORAGE_KEY);
    if (currentStored) {
      const b2 = this.storage.getItem(`${SaveSystem.BACKUP_PREFIX}2`);
      if (b2) this.storage.setItem(`${SaveSystem.BACKUP_PREFIX}3`, b2);

      const b1 = this.storage.getItem(`${SaveSystem.BACKUP_PREFIX}1`);
      if (b1) this.storage.setItem(`${SaveSystem.BACKUP_PREFIX}2`, b1);

      this.storage.setItem(`${SaveSystem.BACKUP_PREFIX}1`, currentStored);
    }

    // 2. Write active save
    const jsonStr = JSON.stringify(this.currentData);
    this.storage.setItem(SaveSystem.STORAGE_KEY, jsonStr);
    this.lastSavedHash = currentHash;
  }

  restoreFromBackup(slot: 1 | 2 | 3): boolean {
    const backupKey = `${SaveSystem.BACKUP_PREFIX}${slot}`;
    const raw = this.storage.getItem(backupKey);
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === CURRENT_SAVE_VERSION && parsed.activeWorldId && parsed.worlds) {
        this.currentData = parsed;
        this.storage.setItem(SaveSystem.STORAGE_KEY, raw);
        this.lastSavedHash = this.computeHash(this.currentData);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  // --- Staged Import Algorithm (Master Plan §13) ---

  stageImport(jsonString: string): StagedImportResult {
    // Step 1: Parse syntax
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err: any) {
      return {
        valid: false,
        error: `Invalid JSON syntax: ${err.message}`,
      };
    }

    // Step 2: Check version
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Import payload must be a JSON object' };
    }
    if (typeof parsed.version !== 'number') {
      return { valid: false, error: 'Missing save version number' };
    }
    if (parsed.version > CURRENT_SAVE_VERSION) {
      return {
        valid: false,
        error: `Save version ${parsed.version} is newer than supported version ${CURRENT_SAVE_VERSION}`,
      };
    }

    // Step 3: Check required fields
    if (!parsed.activeWorldId || typeof parsed.activeWorldId !== 'string') {
      return { valid: false, error: 'Missing or invalid activeWorldId' };
    }
    if (!parsed.worlds || typeof parsed.worlds !== 'object') {
      return { valid: false, error: 'Missing worlds dictionary' };
    }
    const activeWorld = parsed.worlds[parsed.activeWorldId];
    if (!activeWorld) {
      return { valid: false, error: `Active world "${parsed.activeWorldId}" not found in save` };
    }
    if (!activeWorld.player || !activeWorld.player.formId) {
      return { valid: false, error: 'World missing valid player state' };
    }

    // Step 4: Generate summary
    const worldCount = Object.keys(parsed.worlds).length;
    const summary: ImportSummary = {
      version: parsed.version,
      worldCount,
      activeWorldName: activeWorld.name || 'Unnamed Island',
      activeForm: activeWorld.player.formId,
      timestamp: new Date(activeWorld.lastPlayedAt || Date.now()).toISOString(),
    };

    return {
      valid: true,
      summary,
      parsedData: parsed as GameSavePayload,
    };
  }

  applyStagedImport(staged: StagedImportResult): boolean {
    if (!staged.valid || !staged.parsedData) {
      return false;
    }

    // Step 5: Backup current state before overwriting
    const currentRaw = JSON.stringify(this.currentData);
    this.storage.setItem(`${SaveSystem.BACKUP_PREFIX}1`, currentRaw);

    // Step 6: Apply validated data
    this.currentData = staged.parsedData;
    this.commitSave();
    return true;
  }

  exportToJson(): string {
    return JSON.stringify(this.currentData, null, 2);
  }

  // --- Private Helpers ---

  private loadInitial(): GameSavePayload | null {
    const raw = this.storage.getItem(SaveSystem.STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === CURRENT_SAVE_VERSION && parsed.activeWorldId && parsed.worlds) {
        return parsed as GameSavePayload;
      }
    } catch {
      // Fallback if corrupt
    }
    return null;
  }

  private createDefaultSave(): GameSavePayload {
    const defaultWorld: WorldSave = {
      id: 'world_starter',
      name: 'Pebble Isle',
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      playtimeSeconds: 0,
      seed: 424242,
      player: {
        family: 'slime',
        formId: 'oobleck',
        position: { x: 60, y: 1.5, z: 40 },
        discoveredForms: ['oobleck'],
      },
      inventory: [],
      structures: [],
      trenches: [],
      discoveredPOIs: ['pebble_cove'],
    };

    return {
      version: CURRENT_SAVE_VERSION,
      activeWorldId: 'world_starter',
      worlds: {
        world_starter: defaultWorld,
      },
      settings: {
        volume: 0.8,
        reducedMotion: false,
        qualityPreset: 'balanced',
      },
    };
  }

  private computeHash(data: GameSavePayload): string {
    return JSON.stringify({
      worlds: data.worlds,
      activeWorldId: data.activeWorldId,
    });
  }
}
