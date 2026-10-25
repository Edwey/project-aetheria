/**
 * Aetheria - Modular Building System
 * Phase 3: Loop Slice
 *
 * Implements:
 * - 0.5m and 1.0m structural grid snapping
 * - Adaptive stilts down to 3.0m for foundations
 * - Strict support rule when placed (permanent once placed)
 * - 20-step full-cost Undo/Redo
 * - 75% predictable refund on dismantling
 * - Save schema serialization/deserialization
 * Aligned with Master Plan §9 and §14.
 */

import type { ResourceType, Inventory } from './harvest-system.js';
import type { PlacedStructureSave } from '@core/save-system.js';

export type BuildingPieceType =
  | 'foundation'
  | 'floor'
  | 'wall'
  | 'doorway'
  | 'roof'
  | 'stairs'
  | 'bridge';

export type BuildingMaterial = 'wood' | 'stone';

export interface BuildingPieceDef {
  type: BuildingPieceType;
  material: BuildingMaterial;
  name: string;
  cost: Partial<Record<ResourceType, number>>;
  size: { x: number; y: number; z: number };
}

export const PIECE_DEFINITIONS: Record<string, BuildingPieceDef> = {
  foundation_wood: {
    type: 'foundation',
    material: 'wood',
    name: 'Timber Foundation',
    cost: { wood: 4 },
    size: { x: 2.0, y: 0.5, z: 2.0 },
  },
  floor_wood: {
    type: 'floor',
    material: 'wood',
    name: 'Wooden Floor',
    cost: { wood: 2 },
    size: { x: 2.0, y: 0.1, z: 2.0 },
  },
  wall_wood: {
    type: 'wall',
    material: 'wood',
    name: 'Timber Wall',
    cost: { wood: 3 },
    size: { x: 2.0, y: 2.0, z: 0.2 },
  },
  doorway_wood: {
    type: 'doorway',
    material: 'wood',
    name: 'Wooden Doorway',
    cost: { wood: 3 },
    size: { x: 2.0, y: 2.0, z: 0.2 },
  },
  roof_wood: {
    type: 'roof',
    material: 'wood',
    name: 'Sloped Roof',
    cost: { wood: 3 },
    size: { x: 2.0, y: 1.0, z: 2.0 },
  },
  stairs_wood: {
    type: 'stairs',
    material: 'wood',
    name: 'Wooden Stairs',
    cost: { wood: 3 },
    size: { x: 2.0, y: 2.0, z: 2.0 },
  },
  bridge_wood: {
    type: 'bridge',
    material: 'wood',
    name: 'Timber Bridge',
    cost: { wood: 4 },
    size: { x: 2.0, y: 0.3, z: 4.0 },
  },
  foundation_stone: {
    type: 'foundation',
    material: 'stone',
    name: 'Stone Foundation',
    cost: { stone: 4 },
    size: { x: 2.0, y: 0.5, z: 2.0 },
  },
  wall_stone: {
    type: 'wall',
    material: 'stone',
    name: 'Stone Wall',
    cost: { stone: 3 },
    size: { x: 2.0, y: 2.0, z: 0.3 },
  },
  stairs_stone: {
    type: 'stairs',
    material: 'stone',
    name: 'Stone Steps',
    cost: { stone: 3 },
    size: { x: 2.0, y: 2.0, z: 2.0 },
  },
};

export interface PlacedBuildingPiece {
  id: string;
  pieceKey: string; // e.g. "foundation_wood"
  type: BuildingPieceType;
  material: BuildingMaterial;
  position: { x: number; y: number; z: number };
  rotationY: number; // In radians (0, PI/2, PI, 3PI/2)
  stiltsHeight: number; // 0 if no stilts needed, up to 3.0m
}

export interface BuildAction {
  type: 'place' | 'dismantle';
  piece: PlacedBuildingPiece;
  refundedOrCost: Partial<Record<ResourceType, number>>;
}

export class BuildingSystem {
  readonly structures = new Map<string, PlacedBuildingPiece>();

  // 20-step undo and redo stacks
  private readonly undoStack: BuildAction[] = [];
  private readonly redoStack: BuildAction[] = [];
  readonly MAX_HISTORY_STEPS = 20;

  private pieceIdCounter = 0;
  gridSnapSize: 0.5 | 1.0 = 0.5;

  onPiecePlaced?: (piece: PlacedBuildingPiece) => void;
  onPieceDismantled?: (pieceId: string) => void;

  /**
   * Snaps a 3D coordinate to current grid snap size (0.5m or 1.0m)
   */
  snapPosition(pos: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    const snap = this.gridSnapSize;
    return {
      x: Math.round(pos.x / snap) * snap,
      y: Math.round(pos.y / snap) * snap,
      z: Math.round(pos.z / snap) * snap,
    };
  }

  /**
   * Snaps rotation to nearest 90 degrees (PI/2)
   */
  snapRotation(rad: number): number {
    const halfPi = Math.PI / 2;
    return Math.round(rad / halfPi) * halfPi;
  }

  /**
   * Calculates adaptive stilt height and validates structural support.
   * Master Plan §9:
   * Foundations support ground with adaptive stilts down to 3.0 m.
   * Other pieces require ground underneath or an adjacent supported piece within 2.2 m.
   */
  validateSupport(
    pieceType: BuildingPieceType,
    pos: { x: number; y: number; z: number },
    groundY: number
  ): { valid: boolean; stiltsHeight: number; reason?: string } {
    const distToGround = pos.y - groundY;

    if (pieceType === 'foundation') {
      // Foundation can touch ground directly or extend stilts down to 3.0m
      if (distToGround >= -0.2 && distToGround <= 3.0) {
        const stilts = Math.max(0, distToGround);
        return { valid: true, stiltsHeight: stilts };
      }
      // Or sit on top of another foundation / floor
      const hasSupport = this.hasStructuralSupport(pos);
      if (hasSupport) {
        return { valid: true, stiltsHeight: 0 };
      }
      return {
        valid: false,
        stiltsHeight: 0,
        reason: 'Ground is farther than 3.0m stilt limit and no support below',
      };
    }

    // Bridge can anchor into ground at ends or to existing structures
    if (pieceType === 'bridge') {
      if (distToGround >= -0.2 && distToGround <= 1.0) {
        return { valid: true, stiltsHeight: 0 };
      }
      if (this.hasStructuralSupport(pos)) {
        return { valid: true, stiltsHeight: 0 };
      }
      return { valid: false, stiltsHeight: 0, reason: 'Bridge requires support at ends' };
    }

    // Walls, floors, roofs, stairs need structural support below or adjacent
    if (distToGround >= -0.2 && distToGround <= 0.6) {
      // Close to ground
      return { valid: true, stiltsHeight: 0 };
    }

    if (this.hasStructuralSupport(pos)) {
      return { valid: true, stiltsHeight: 0 };
    }

    return {
      valid: false,
      stiltsHeight: 0,
      reason: 'Piece requires structural support from an adjacent or supporting piece',
    };
  }

  private hasStructuralSupport(pos: { x: number; y: number; z: number }): boolean {
    for (const struct of this.structures.values()) {
      const dx = Math.abs(pos.x - struct.position.x);
      const dy = pos.y - struct.position.y;
      const dz = Math.abs(pos.z - struct.position.z);

      // Directly on top of an existing piece
      if (dx <= 1.2 && dz <= 1.2 && dy >= 0.1 && dy <= 2.5) {
        return true;
      }
      // Horizontally adjacent piece at the same elevation
      if (Math.abs(dy) <= 0.6 && ((dx <= 2.1 && dz <= 0.5) || (dz <= 2.1 && dx <= 0.5))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Preview ghost validation (green = valid, red = invalid)
   */
  validatePlacement(
    pieceKey: string,
    rawPos: { x: number; y: number; z: number },
    rotationY: number,
    inventory: Inventory,
    groundY: number
  ): { valid: boolean; reason?: string; stiltsHeight: number; snappedPos: { x: number; y: number; z: number } } {
    const def = PIECE_DEFINITIONS[pieceKey];
    if (!def) {
      return {
        valid: false,
        reason: `Unknown piece: ${pieceKey}`,
        stiltsHeight: 0,
        snappedPos: rawPos,
      };
    }

    const snappedPos = this.snapPosition(rawPos);

    // Check inventory materials
    for (const [res, count] of Object.entries(def.cost)) {
      if (count && !inventory.has(res as ResourceType, count)) {
        return {
          valid: false,
          reason: `Insufficient ${res} (need ${count}, have ${inventory.get(res as ResourceType)})`,
          stiltsHeight: 0,
          snappedPos,
        };
      }
    }

    // Check structural support
    const support = this.validateSupport(def.type, snappedPos, groundY);
    if (!support.valid) {
      return {
        valid: false,
        reason: support.reason,
        stiltsHeight: support.stiltsHeight,
        snappedPos,
      };
    }

    return {
      valid: true,
      stiltsHeight: support.stiltsHeight,
      snappedPos,
    };
  }

  /**
   * Places a building piece, consumes full material cost, and records to undo stack
   */
  placePiece(
    pieceKey: string,
    rawPos: { x: number; y: number; z: number },
    rotationY: number,
    inventory: Inventory,
    groundY: number
  ): { success: boolean; piece?: PlacedBuildingPiece; reason?: string } {
    const val = this.validatePlacement(pieceKey, rawPos, rotationY, inventory, groundY);
    if (!val.valid) {
      return { success: false, reason: val.reason };
    }

    const def = PIECE_DEFINITIONS[pieceKey]!;

    // Consume materials
    const consumed: Partial<Record<ResourceType, number>> = {};
    for (const [res, count] of Object.entries(def.cost)) {
      if (count) {
        inventory.consume(res as ResourceType, count);
        consumed[res as ResourceType] = count;
      }
    }

    const id = `bldg_${++this.pieceIdCounter}`;
    const snappedRot = this.snapRotation(rotationY);
    const piece: PlacedBuildingPiece = {
      id,
      pieceKey,
      type: def.type,
      material: def.material,
      position: val.snappedPos,
      rotationY: snappedRot,
      stiltsHeight: val.stiltsHeight,
    };

    this.structures.set(id, piece);

    // Record action into undo stack
    this.recordAction({
      type: 'place',
      piece,
      refundedOrCost: consumed,
    });
    this.redoStack.length = 0; // Clear redo upon new action

    this.onPiecePlaced?.(piece);

    return { success: true, piece };
  }

  /**
   * Dismantles an existing piece with predictable 75% material refund.
   * Master Plan §9: "Dismantling returns a predictable 75%."
   */
  dismantlePiece(
    pieceId: string,
    inventory: Inventory
  ): { success: boolean; refund?: Partial<Record<ResourceType, number>>; reason?: string } {
    const piece = this.structures.get(pieceId);
    if (!piece) {
      return { success: false, reason: 'Piece not found' };
    }

    const def = PIECE_DEFINITIONS[piece.pieceKey];
    const refund: Partial<Record<ResourceType, number>> = {};

    if (def) {
      for (const [res, count] of Object.entries(def.cost)) {
        if (count) {
          // 75% predictable refund
          const refundAmount = Math.max(1, Math.floor(count * 0.75));
          inventory.add(res as ResourceType, refundAmount);
          refund[res as ResourceType] = refundAmount;
        }
      }
    }

    this.structures.delete(pieceId);

    this.recordAction({
      type: 'dismantle',
      piece,
      refundedOrCost: refund,
    });
    this.redoStack.length = 0;

    this.onPieceDismantled?.(pieceId);

    return { success: true, refund };
  }

  /**
   * 20-step Undo: Restores 100% full cost on undone placements
   */
  undo(inventory: Inventory): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;

    if (action.type === 'place') {
      // Remove piece and return 100% of consumed materials
      this.structures.delete(action.piece.id);
      for (const [res, count] of Object.entries(action.refundedOrCost)) {
        if (count) {
          inventory.add(res as ResourceType, count);
        }
      }
      this.onPieceDismantled?.(action.piece.id);
      this.redoStack.push(action);
      return true;
    } else if (action.type === 'dismantle') {
      // Restore dismantled piece, deducting the 75% refund that was given
      for (const [res, count] of Object.entries(action.refundedOrCost)) {
        if (count) {
          inventory.consume(res as ResourceType, count);
        }
      }
      this.structures.set(action.piece.id, action.piece);
      this.onPiecePlaced?.(action.piece);
      this.redoStack.push(action);
      return true;
    }

    return false;
  }

  /**
   * Redo previously undone action
   */
  redo(inventory: Inventory): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;

    if (action.type === 'place') {
      // Deduct materials and re-add piece
      for (const [res, count] of Object.entries(action.refundedOrCost)) {
        if (count) {
          inventory.consume(res as ResourceType, count);
        }
      }
      this.structures.set(action.piece.id, action.piece);
      this.onPiecePlaced?.(action.piece);
      this.undoStack.push(action);
      return true;
    } else if (action.type === 'dismantle') {
      // Re-dismantle
      this.structures.delete(action.piece.id);
      for (const [res, count] of Object.entries(action.refundedOrCost)) {
        if (count) {
          inventory.add(res as ResourceType, count);
        }
      }
      this.onPieceDismantled?.(action.piece.id);
      this.undoStack.push(action);
      return true;
    }

    return false;
  }

  private recordAction(action: BuildAction): void {
    this.undoStack.push(action);
    if (this.undoStack.length > this.MAX_HISTORY_STEPS) {
      this.undoStack.shift();
    }
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Serialize structures to save format
   */
  serialize(): PlacedStructureSave[] {
    const list: PlacedStructureSave[] = [];
    for (const p of this.structures.values()) {
      // Convert Y-rotation to Quaternion [0, sin(θ/2), 0, cos(θ/2)]
      const halfAngle = p.rotationY / 2;
      list.push({
        id: p.id,
        pieceType: p.pieceKey,
        position: { ...p.position },
        rotation: [0, Math.sin(halfAngle), 0, Math.cos(halfAngle)],
      });
    }
    return list;
  }

  /**
   * Deserialize structures from save format
   */
  deserialize(saves: PlacedStructureSave[]): void {
    this.structures.clear();
    this.undoStack.length = 0;
    this.redoStack.length = 0;

    for (const s of saves) {
      const def = PIECE_DEFINITIONS[s.pieceType];
      if (!def) continue;

      // Approximate rotation from quaternion
      const rotY = 2 * Math.atan2(s.rotation[1], s.rotation[3]);
      const piece: PlacedBuildingPiece = {
        id: s.id,
        pieceKey: s.pieceType,
        type: def.type,
        material: def.material,
        position: { ...s.position },
        rotationY: this.snapRotation(rotY),
        stiltsHeight: 0,
      };
      this.structures.set(piece.id, piece);
    }
  }
}
