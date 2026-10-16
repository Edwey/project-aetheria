/**
 * Touch module - Touch input handling
 * Ported verbatim from game.js touch/joystick/buttons block.
 */

export function createTouchControls(deps) {
  const { $, joy, touchJump, setTouchJump, pendingFloat, setPendingFloat, pendingPound, setPendingPound, toggleMelt, touchRide, setTouchRide } = deps;

  if (!$('joy')) return { enabled: false };

  const el = $('joy'), knob = $('knob');
  let id = null;

  function set(e) {
    const r = el.getBoundingClientRect();
    const R = r.width / 2;
    let dx = (e.clientX - (r.left + R)) / R;
    let dy = (e.clientY - (r.top + R)) / R;
    const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    joy.x = dx;
    joy.y = -dy;
    knob.style.transform = 'translate(' + dx * R * 0.7 + 'px,' + dy * R * 0.7 + 'px)';
  }

  el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); set(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
  const end = e => { if (e.pointerId === id) { id = null; joy.x = joy.y = 0; knob.style.transform = ''; } };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  const jb = $('jbtn');
  jb.addEventListener('pointerdown', e => { jb.setPointerCapture(e.pointerId); setTouchJump(true); });
  const jend = () => { setTouchJump(false); };
  jb.addEventListener('pointerup', jend);
  jb.addEventListener('pointercancel', jend);

  $('vbtn').addEventListener('pointerdown', () => { setPendingFloat(true); });
  $('pbtn').addEventListener('pointerdown', () => { setPendingPound(true); });
  $('mbtn').addEventListener('pointerdown', () => { toggleMelt(); });

  const ab = $('abtn');
  ab.addEventListener('pointerdown', e => { ab.setPointerCapture(e.pointerId); setTouchRide(true); });
  const aend = () => { setTouchRide(false); };
  ab.addEventListener('pointerup', aend);
  ab.addEventListener('pointercancel', aend);

  return { enabled: true };
}

