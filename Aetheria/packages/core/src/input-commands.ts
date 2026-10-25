/**
 * Input Command Abstraction & Buffer
 * 
 * Aligned with Master Plan v4 (§5.2, §10, §12).
 * Decouples raw DOM Keyboard/Pointer events into semantic game commands.
 * Implements 100ms coyote time and 100ms jump input buffering.
 */

export interface GameCommandState {
  // Analog movement (-1.0 to +1.0)
  moveX: number;
  moveZ: number;

  // Primary Traversal
  jumpPressed: boolean;
  jumpHeld: boolean;
  jumpReleased: boolean;
  jumpChargeProgress: number; // 0.0 to 1.0 (charges up over 0.85s)
  sprint: boolean;
  rideWind: boolean;

  // Signature Form Abilities
  abilityJPressed: boolean;
  abilityJHeld: boolean;
  abilityJReleased: boolean;

  abilityKPressed: boolean;
  abilityKHeld: boolean;
  abilityKReleased: boolean;

  // Actions
  stompPressed: boolean;       // F key (universal pound / down-gust)
  interactPressed: boolean;    // E key (craft, talk, examine)
  buildModePressed: boolean;   // B key

  // Form & Family Selection
  switchFamilyPressed: boolean;// C key (cycle Slime -> Wisp -> Stone)
  selectFormIndex: 0 | 1 | 2 | null; // 1, 2, 3 keys

  // UI & Menus
  inventoryToggled: boolean;   // Tab key
  pauseToggled: boolean;       // Esc key

  // Camera Orbit
  orbitYawDelta: number;
  orbitPitchDelta: number;
  zoomDelta: number;
}

export type ActionName =
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'jump'
  | 'sprint'
  | 'rideWind'
  | 'abilityJ'
  | 'abilityK'
  | 'stomp'
  | 'interact'
  | 'buildMode'
  | 'switchFamily'
  | 'selectForm1'
  | 'selectForm2'
  | 'selectForm3'
  | 'inventory'
  | 'pause';

export interface KeyBindingMap {
  [action: string]: string[]; // Array of key codes or keys (e.g. ['KeyW', 'ArrowUp'])
}

export const DEFAULT_KEY_BINDINGS: KeyBindingMap = {
  moveForward: ['KeyW', 'ArrowUp'],
  moveBackward: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  rideWind: ['ShiftLeft', 'ShiftRight', 'KeyG'],
  abilityJ: ['KeyJ'],
  abilityK: ['KeyK'],
  stomp: ['KeyF'],
  interact: ['KeyE'],
  buildMode: ['KeyB'],
  switchFamily: ['KeyC'],
  selectForm1: ['Digit1'],
  selectForm2: ['Digit2'],
  selectForm3: ['Digit3'],
  inventory: ['Tab'],
  pause: ['Escape'],
};

export class InputCommandBuffer {
  public keyBindings: KeyBindingMap;
  private rawKeysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();

  // Jump timing & Buffering
  private jumpHoldTime: number = 0;
  private jumpBufferTimer: number = 0; // Expires after 100ms (0.1s)
  private coyoteTimer: number = 0;     // Expires after 100ms (0.1s)
  private wasGroundedLastFrame: boolean = false;

  // Ability key release lockout (Master Plan §10)
  private lockedOutKeys: Set<string> = new Set();

  // Camera deltas
  private pendingOrbitYaw: number = 0;
  private pendingOrbitPitch: number = 0;
  private pendingZoom: number = 0;

  constructor(customBindings?: Partial<KeyBindingMap>) {
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS, ...customBindings };
  }

  // --- Raw Event Ingestion ---

  handleKeyDown(code: string): void {
    if (this.lockedOutKeys.has(code)) {
      return;
    }
    if (!this.rawKeysDown.has(code)) {
      this.keysJustPressed.add(code);
    }
    this.rawKeysDown.add(code);
  }

  handleKeyUp(code: string): void {
    this.rawKeysDown.delete(code);
    this.keysJustReleased.add(code);
    this.lockedOutKeys.delete(code);
  }

  handlePointerOrbit(yawDelta: number, pitchDelta: number): void {
    this.pendingOrbitYaw += yawDelta;
    this.pendingOrbitPitch += pitchDelta;
  }

  handleWheelZoom(delta: number): void {
    this.pendingZoom += delta;
  }

  lockoutKeyUntilRelease(code: string): void {
    this.lockedOutKeys.add(code);
    this.rawKeysDown.delete(code);
  }

  // --- Fixed Step Tick & Command Polling ---

  /**
   * Polls semantic commands for the current fixed 60Hz tick (dt = ~0.0166s).
   * Automatically manages the 100ms coyote timer and 100ms jump buffer.
   */
  pollCommands(dt: number, isGrounded: boolean): GameCommandState {
    // 1. Update Coyote Timer (100ms grace period after walking off a ledge)
    if (isGrounded) {
      this.coyoteTimer = 0.100; // 100 ms
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // 2. Movement
    let moveX = 0;
    let moveZ = 0;
    if (this.isActionDown('moveLeft')) moveX -= 1.0;
    if (this.isActionDown('moveRight')) moveX += 1.0;
    if (this.isActionDown('moveForward')) moveZ -= 1.0;
    if (this.isActionDown('moveBackward')) moveZ += 1.0;

    // Normalize diagonal movement
    const mag = Math.hypot(moveX, moveZ);
    if (mag > 1.0) {
      moveX /= mag;
      moveZ /= mag;
    }

    // 3. Jump & Jump Buffering (100ms input buffer)
    const rawJumpPressed = this.isActionJustPressed('jump');
    const rawJumpHeld = this.isActionDown('jump');
    const rawJumpReleased = this.isActionJustReleased('jump');

    if (rawJumpPressed) {
      this.jumpBufferTimer = 0.100; // 100 ms buffer
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Effective jump activates if buffer is hot and either grounded or inside coyote window
    let effectiveJumpPressed = false;
    if (this.jumpBufferTimer > 0 && (isGrounded || this.coyoteTimer > 0)) {
      effectiveJumpPressed = true;
      this.jumpBufferTimer = 0; // Consume buffered jump
      this.coyoteTimer = 0;     // Consume coyote time
    }

    // Jump charging (up to 0.85s for full power)
    if (rawJumpHeld) {
      this.jumpHoldTime += dt;
    } else {
      this.jumpHoldTime = 0;
    }
    const jumpChargeProgress = Math.min(1.0, this.jumpHoldTime / 0.85);

    // 4. Form Selection Hotkeys
    let selectFormIndex: 0 | 1 | 2 | null = null;
    if (this.isActionJustPressed('selectForm1')) selectFormIndex = 0;
    else if (this.isActionJustPressed('selectForm2')) selectFormIndex = 1;
    else if (this.isActionJustPressed('selectForm3')) selectFormIndex = 2;

    const commands: GameCommandState = {
      moveX,
      moveZ,
      jumpPressed: effectiveJumpPressed,
      jumpHeld: rawJumpHeld,
      jumpReleased: rawJumpReleased,
      jumpChargeProgress,
      sprint: this.isActionDown('sprint'),
      rideWind: this.isActionDown('rideWind'),

      abilityJPressed: this.isActionJustPressed('abilityJ'),
      abilityJHeld: this.isActionDown('abilityJ'),
      abilityJReleased: this.isActionJustReleased('abilityJ'),

      abilityKPressed: this.isActionJustPressed('abilityK'),
      abilityKHeld: this.isActionDown('abilityK'),
      abilityKReleased: this.isActionJustReleased('abilityK'),

      stompPressed: this.isActionJustPressed('stomp'),
      interactPressed: this.isActionJustPressed('interact'),
      buildModePressed: this.isActionJustPressed('buildMode'),

      switchFamilyPressed: this.isActionJustPressed('switchFamily'),
      selectFormIndex,

      inventoryToggled: this.isActionJustPressed('inventory'),
      pauseToggled: this.isActionJustPressed('pause'),

      orbitYawDelta: this.pendingOrbitYaw,
      orbitPitchDelta: this.pendingOrbitPitch,
      zoomDelta: this.pendingZoom,
    };

    // Reset single-frame transient flags
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.pendingOrbitYaw = 0;
    this.pendingOrbitPitch = 0;
    this.pendingZoom = 0;
    this.wasGroundedLastFrame = isGrounded;

    return commands;
  }

  // --- Key Remapping & Conflict Checks ---

  remapAction(action: ActionName, newKeys: string[]): { success: boolean; conflict?: ActionName } {
    // Check conflict with other actions
    for (const [otherAction, keys] of Object.entries(this.keyBindings)) {
      if (otherAction === action) continue;
      for (const k of newKeys) {
        if (keys.includes(k)) {
          return { success: false, conflict: otherAction as ActionName };
        }
      }
    }
    this.keyBindings[action] = [...newKeys];
    return { success: true };
  }

  restoreDefaultBindings(): void {
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
  }

  private isActionDown(action: ActionName): boolean {
    const keys = this.keyBindings[action] || [];
    return keys.some(k => this.rawKeysDown.has(k));
  }

  private isActionJustPressed(action: ActionName): boolean {
    const keys = this.keyBindings[action] || [];
    return keys.some(k => this.keysJustPressed.has(k));
  }

  private isActionJustReleased(action: ActionName): boolean {
    const keys = this.keyBindings[action] || [];
    return keys.some(k => this.keysJustReleased.has(k));
  }
}
