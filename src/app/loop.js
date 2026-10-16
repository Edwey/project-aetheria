/**
 * Loop module - Main game loop with fixed-step scheduling
 * Ported verbatim from game.js frame()/fixedStep() accumulator logic.
 */

'use strict';

const FIXED = 1 / 60;

export function startLoop(deps) {
  const { fixedStepFn, renderFn, governor, slowToggle } = deps;
  let acc = 0;
  let last = performance.now();
  let slow = false;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Quality governor - lowers only, never raises mid-session
    const prevQuality = governor.quality;
    governor.tick(dt);
    if (prevQuality === 'full' && governor.quality === 'light') {
      // Apply quality downgrade: pixelRatio and shadowMap
      // The caller (game.js) should apply these changes via governor.config
    }

    // Fixed-step accumulator with slow-mo support
    acc += dt * (slow ? 0.25 : 1);
    let steps = 0;
    while (acc >= FIXED && steps < 4) {
      fixedStepFn(FIXED);
      acc -= FIXED;
      steps++;
    }
    if (steps === 4) acc = 0;

    // Render after physics steps
    renderFn(dt);
  }

  // Expose slow toggle for external control
  if (slowToggle) {
    slowToggle._slow = false;
    slowToggle.setSlow = (val) => { slow = val; slowToggle._slow = val; };
  }

  requestAnimationFrame(frame);
}

