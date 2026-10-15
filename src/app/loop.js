/**
 * Loop module - Main game loop
 * Placeholder for Stage B - will be implemented in Stage C
 */

'use strict';

export function startLoop(updateFn) {
  function animate(time) {
    updateFn(time);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
