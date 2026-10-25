/**
 * Aetheria - Trench & Water Diversion System
 * Phase 3: Loop Slice
 *
 * Implements:
 * - 1m integer grid trench map with 0.3m depth per dig step
 * - Collision height offset without rebuilding static collider
 * - Water propagation from reservoir (~4 flow steps/s)
 * - Soil moisture diffusion (2-3 cells radius)
 * - Save schema serialization/deserialization
 * Aligned with Master Plan §8 and §14.
 */

import { TerrainGridTrenchMap, type GridCell } from './trench-experiment.js';
import type { TrenchCellSave } from '@core/save-system.js';

export interface ReservoirSource {
  id: string;
  x: number;
  z: number;
  waterLevel: number; // Constant water depth provided by spring/reservoir
}

export class TrenchSystem {
  readonly grid: TerrainGridTrenchMap;
  readonly reservoirs: ReservoirSource[] = [];

  private flowAccumulator = 0;
  readonly FLOW_INTERVAL = 0.25; // 4 flow steps per second

  onTrenchDug?: (cellX: number, cellZ: number, newDepth: number) => void;
  onWaterFlowed?: () => void;

  /**
   * Initializes starter trench map covering Pebble Cove (origin at 40, 20 with 40x40 1m cells)
   */
  constructor(
    width = 40,
    height = 40,
    originX = 40,
    originZ = 20,
    cellSize = 1.0
  ) {
    this.grid = new TerrainGridTrenchMap(width, height, cellSize, originX, originZ);
  }

  addReservoir(reservoir: ReservoirSource): void {
    this.reservoirs.push(reservoir);
    const cell = this.grid.getCell(reservoir.x, reservoir.z);
    if (cell) {
      cell.waterLevel = reservoir.waterLevel;
      cell.trenchDepth = Math.max(1, cell.trenchDepth);
    }
  }

  /**
   * Digs a 0.3m trench cell at world coordinate
   */
  digAt(worldX: number, worldZ: number): { success: boolean; newDepth: number } {
    const success = this.grid.dig(worldX, worldZ);
    if (success) {
      const cell = this.grid.getCell(worldX, worldZ);
      const newDepth = cell ? cell.trenchDepth : 1;
      this.onTrenchDug?.(Math.floor(worldX), Math.floor(worldZ), newDepth);
      return { success: true, newDepth };
    }
    return { success: false, newDepth: 0 };
  }

  getEffectiveHeight(baseHeight: number, worldX: number, worldZ: number): number {
    return this.grid.getEffectiveHeight(baseHeight, worldX, worldZ);
  }

  getCell(worldX: number, worldZ: number): GridCell | null {
    return this.grid.getCell(worldX, worldZ);
  }

  /**
   * Updates water simulation at ~4 flow steps/s and diffuses soil moisture
   */
  update(dt: number): void {
    // Keep reservoirs filled
    for (const res of this.reservoirs) {
      const cell = this.grid.getCell(res.x, res.z);
      if (cell) {
        cell.waterLevel = res.waterLevel;
      }
    }

    this.flowAccumulator += dt;
    while (this.flowAccumulator >= this.FLOW_INTERVAL) {
      this.grid.stepWaterFlow(this.FLOW_INTERVAL);
      this.diffuseSoilMoisture();
      this.onWaterFlowed?.();
      this.flowAccumulator -= this.FLOW_INTERVAL;
    }
  }

  /**
   * Moisture spreads 2-3 cells outward from water-carrying trench cells
   * Master Plan §8: "moisture spreads 2–3 cells"
   */
  private diffuseSoilMoisture(): void {
    const w = this.grid.width;
    const h = this.grid.height;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const cell = this.grid.cells[r * w + c];
        if (cell.waterLevel > 0.05) {
          // Spread moisture to 2-cell Manhattan neighborhood
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              if (Math.abs(dr) + Math.abs(dc) > 2) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < h && nc >= 0 && nc < w) {
                const neighbor = this.grid.cells[nr * w + nc];
                neighbor.soilMoisture = Math.min(100, neighbor.soilMoisture + 2);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Checks if an entity is submerged in water at the given position
   */
  getSubmergedInfo(
    worldX: number,
    worldY: number,
    worldZ: number,
    baseHeight: number,
    entityRadius = 0.5
  ): { isSubmerged: boolean; submergedRatio: number; waterSurfaceY: number } {
    const cell = this.grid.getCell(worldX, worldZ);
    if (!cell || cell.waterLevel <= 0.02) {
      return { isSubmerged: false, submergedRatio: 0, waterSurfaceY: baseHeight };
    }

    const groundY = baseHeight - cell.trenchDepth * 0.3;
    const waterSurfaceY = groundY + cell.waterLevel;
    const bottomY = worldY - entityRadius;
    const topY = worldY + entityRadius;

    if (bottomY >= waterSurfaceY) {
      return { isSubmerged: false, submergedRatio: 0, waterSurfaceY };
    }

    const submergedDepth = Math.min(topY, waterSurfaceY) - bottomY;
    const entityHeight = entityRadius * 2;
    const ratio = Math.max(0, Math.min(1.0, submergedDepth / entityHeight));

    return {
      isSubmerged: ratio >= 0.08, // Master Plan §8: 8% submerged gate
      submergedRatio: ratio,
      waterSurfaceY,
    };
  }

  /**
   * Serialize modified trench cells for save storage
   */
  serialize(): TrenchCellSave[] {
    const list: TrenchCellSave[] = [];
    const w = this.grid.width;
    const h = this.grid.height;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const cell = this.grid.cells[r * w + c];
        if (cell.trenchDepth > 0) {
          const worldX = this.grid.originX + c * this.grid.cellSize;
          const worldZ = this.grid.originZ + r * this.grid.cellSize;
          list.push({
            x: worldX,
            z: worldZ,
            depth: cell.trenchDepth,
          });
        }
      }
    }
    return list;
  }

  /**
   * Restore trench cells from save storage
   */
  deserialize(saves: TrenchCellSave[]): void {
    for (const s of saves) {
      const cell = this.grid.getCell(s.x, s.z);
      if (cell) {
        cell.trenchDepth = Math.min(3, Math.max(0, s.depth));
      }
    }
  }

  /**
   * Initialize starter reservoir and stream in Pebble Cove
   */
  initStarterWatershed(): void {
    // Authored Spring Reservoir at (52, 48)
    this.addReservoir({
      id: 'cove_spring',
      x: 52,
      z: 48,
      waterLevel: 0.6,
    });
  }
}
