/**
 * Trench Experiment (Phase 0) - Master Plan §10 & §12
 * 
 * Verifies that dynamic digging on a 1-meter integer grid cell:
 * 1. Lowers terrain by 0.3m per dig step.
 * 2. Modifies effective collision height dynamically without rebuilding the terrain collider.
 * 3. Supports water dispersion across contiguous trench cells.
 * 4. Enables Geodes (diameter > cell width) to bridge across without getting stuck.
 */

export interface GridCell {
  soilMoisture: number; // 0 to 100
  cropStage: number;    // 0 to 4
  trenchDepth: number;  // 0 to 3 (each unit = 0.3m)
  waterLevel: number;   // 0 to 1.0 (m)
}

export class TerrainGridTrenchMap {
  public width: number;
  public height: number;
  public cellSize: number; // 1.0 m
  public originX: number;
  public originZ: number;
  public cells: GridCell[];

  constructor(width = 32, height = 32, cellSize = 1.0, originX = -16, originZ = -16) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.originX = originX;
    this.originZ = originZ;
    this.cells = new Array(width * height);

    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = {
        soilMoisture: 20,
        cropStage: 0,
        trenchDepth: 0,
        waterLevel: 0,
      };
    }
  }

  getIndex(x: number, z: number): number | -1 {
    const col = Math.floor((x - this.originX) / this.cellSize);
    const row = Math.floor((z - this.originZ) / this.cellSize);
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      return -1;
    }
    return row * this.width + col;
  }

  getCell(x: number, z: number): GridCell | null {
    const idx = this.getIndex(x, z);
    if (idx === -1) return null;
    return this.cells[idx];
  }

  /**
   * Digs at world position (x, z).
   * Lowers trench depth by 0.3m (1 step), up to max 3 steps (0.9m).
   */
  dig(x: number, z: number): boolean {
    const cell = this.getCell(x, z);
    if (!cell) return false;
    if (cell.trenchDepth < 3) {
      cell.trenchDepth += 1;
      // Digging moistens soil
      cell.soilMoisture = Math.min(100, cell.soilMoisture + 15);
      return true;
    }
    return false;
  }

  /**
   * Returns effective surface height taking dynamic trench depth into account.
   */
  getEffectiveHeight(baseHeight: number, x: number, z: number): number {
    const cell = this.getCell(x, z);
    if (!cell) return baseHeight;
    return baseHeight - cell.trenchDepth * 0.3;
  }

  /**
   * Step water dispersion between contiguous trench cells.
   * Water flows from high waterLevel to lower waterLevel.
   */
  stepWaterFlow(dt: number, flowRate = 2.0): void {
    const deltas = new Float32Array(this.cells.length);

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const i = r * this.width + c;
        const cell = this.cells[i];
        if (cell.waterLevel <= 0.01) continue;

        // Check 4 neighbors
        const neighbors = [
          c > 0 ? i - 1 : -1,
          c < this.width - 1 ? i + 1 : -1,
          r > 0 ? i - this.width : -1,
          r < this.height - 1 ? i + this.width : -1,
        ];

        for (const n of neighbors) {
          if (n === -1) continue;
          const target = this.cells[n];
          // Water flows only if target is in a trench or has lower level
          if (target.trenchDepth >= cell.trenchDepth && cell.waterLevel > target.waterLevel) {
            const diff = cell.waterLevel - target.waterLevel;
            const flow = Math.min(cell.waterLevel * 0.5, diff * flowRate * dt);
            deltas[i] -= flow;
            deltas[n] += flow;
            // Moistens target soil
            target.soilMoisture = Math.min(100, target.soilMoisture + 20);
          }
        }
      }
    }

    // Apply deltas
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].waterLevel = Math.max(0, this.cells[i].waterLevel + deltas[i]);
    }
  }
}
