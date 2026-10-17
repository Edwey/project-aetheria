/**
 * Panel module - Control panel UI (form, body, sliders, quality, weather, time).
 * Ported verbatim from game.js panel/form/slider/quality/weather/time block.
 * All dependencies passed via createPanel() parameter object.
 */

import Phys from '../gameplay/physics.js';

/**
 * Create the control panel UI and return controller functions.
 * @param {object} deps - All dependencies needed by panel
 * @returns {object} Panel controller with sync/update functions
 */
export function createPanel(deps) {
  const {
    $, profile, P, PRESETS, Phys, formKind, quality, coarse,
    saveSoon, switchForm, choosePreset, spawnForm,
    syncSliders, syncFormButtons,
    applyTime
  } = deps;

  // Form buttons
  const FORMS = [['slime', 'Slime'], ['wisp', 'Wisp'], ['stone', 'Stone']];
  const formsEl = $('forms');
  FORMS.forEach(([id, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.dataset.id = id;
    b.setAttribute('aria-pressed', id === deps.formKind);
    b.addEventListener('click', () => { deps.switchForm(id); b.blur(); });
    formsEl.appendChild(b);
  });

  // Sliders
  const SLIDERS = [
    ['stiff', 'Shape hold', 0, 1, 0.01, v => v.toFixed(2)],
    ['pressure', 'Squish', 0.6, 1.5, 0.01, v => v.toFixed(2)],
    ['skin', 'Skin tension', 0.05, 1, 0.01, v => v.toFixed(2)],
    ['grip', 'Grip', 0, 1, 0.01, v => v.toFixed(2)],
    ['sticky', 'Stickiness', 0, 1, 0.01, v => v.toFixed(2)],
    ['jmax', 'Max jump', 8, 20, 0.5, v => Phys.jumpHeight({ jmax: v }, 1).height.toFixed(1) + ' m']
  ];
  const sliderEls = {};
  const slidersEl = $('sliders');
  SLIDERS.forEach(([key, label, min, max, step, fmt]) => {
    const d = document.createElement('div'); d.className = 'sl';
    const l = document.createElement('label'); l.textContent = label; l.htmlFor = 's_' + key;
    const o = document.createElement('output');
    const r = document.createElement('input');
    r.type = 'range'; r.id = 's_' + key; r.min = min; r.max = max; r.step = step; r.value = deps.P[key];
    r.addEventListener('input', () => { deps.P[key] = parseFloat(r.value); deps.profile.body[key] = deps.P[key]; o.textContent = fmt(deps.P[key]); deps.saveSoon(); });
    r.addEventListener('pointerup', () => r.blur());
    d.append(l, o, r); $('sliders').appendChild(d);
    deps.sliderEls[key] = { r, o, fmt };
    o.textContent = fmt(deps.P[key]);
  });

  function syncSlidersFn() {
    for (const k in deps.sliderEls) {
      deps.sliderEls[k].r.value = deps.P[k];
      deps.sliderEls[k].o.textContent = deps.sliderEls[k].fmt(deps.P[k]);
    }
  }

  // Body presets - filter by current form
  const bodiesEl = $('bodies');
  const presetKeys = Object.keys(deps.PRESETS).filter(id => {
    if (deps.formKind === 'slime') return ['blob', 'goo', 'ball', 'cube'].includes(id);
    if (deps.formKind === 'stone') return ['crystal', 'boulder', 'pillar', 'shard'].includes(id);
    if (deps.formKind === 'wisp') return ['dense', 'sparse', 'ring', 'spiral'].includes(id);
    return false;
  });
  presetKeys.forEach(id => {
    const b = document.createElement('button');
    b.textContent = deps.PRESETS[id].label;
    b.dataset.id = id;
    b.setAttribute('aria-pressed', id === deps.profile.body.preset);
    b.addEventListener('click', () => { choosePresetFn(id); b.blur(); });
    bodiesEl.appendChild(b);
  });

  function syncSlidersFn() {
    for (const k in deps.sliderEls) {
      deps.sliderEls[k].r.value = deps.P[k];
      deps.sliderEls[k].o.textContent = deps.sliderEls[k].fmt(deps.P[k]);
    }
  }

  function choosePresetFn(id) {
    const p = deps.PRESETS[id];
    deps.profile.body.preset = id;
    // Apply preset properties based on form
    if (deps.formKind === 'wisp') {
      // Wisp presets only affect particle count (nMod), handled in spawnForm
    } else {
      // Slime and stone presets apply physics properties
      ['stiff', 'pressure', 'skin', 'grip', 'sticky'].forEach(k => {
        if (p[k] !== undefined) {
          deps.P[k] = p[k];
          deps.profile.body[k] = p[k];
        }
      });
    }
    syncSlidersFn();
    [...$('bodies').children].forEach(c => c.setAttribute('aria-pressed', c.dataset.id === id));
    // Respawn form to apply preset changes
    deps.spawnForm(deps.formKind, null, true);
    deps.saveSoon();
  }

  // Quality select (governor-aware when deps.governor exists, else legacy numeric)
  const qualityEl = $('quality');
  if (deps.governor) {
    qualityEl.value = deps.governor.quality;
    qualityEl.addEventListener('change', e => {
      const v = e.target.value;
      if (v === 'light') { deps.governor.quality = 'light'; deps.setQuality(2); }
      else { deps.governor.quality = 'full'; deps.setQuality(3); }
      deps.spawnForm(deps.formKind, null, true);
      e.target.blur();
    });
  } else {
    qualityEl.value = String(deps.quality);
    qualityEl.addEventListener('change', e => {
      deps.setQuality(parseInt(e.target.value, 10));
      deps.spawnForm(deps.formKind, null, true);
      e.target.blur();
    });
  }

  // Weather select
  const weatherEl = $('weather');
  weatherEl.addEventListener('change', e => { if (deps.env) deps.env.override = e.target.value; e.target.blur(); });

  // Time input
  $('time').addEventListener('input', e => deps.applyTime(parseFloat(e.target.value)));
  $('time').addEventListener('pointerup', e => e.target.blur());

  return {
    syncFormButtons: () => {
      [...$('forms').children].forEach(c => c.setAttribute('aria-pressed', c.dataset.id === deps.formKind));
      // Refresh preset buttons for new form
      bodiesEl.innerHTML = '';
      const presetKeys = Object.keys(deps.PRESETS).filter(id => {
        if (deps.formKind === 'slime') return ['blob', 'goo', 'ball', 'cube'].includes(id);
        if (deps.formKind === 'stone') return ['crystal', 'boulder', 'pillar', 'shard'].includes(id);
        if (deps.formKind === 'wisp') return ['dense', 'sparse', 'ring', 'spiral'].includes(id);
        return false;
      });
      presetKeys.forEach(id => {
        const b = document.createElement('button');
        b.textContent = deps.PRESETS[id].label;
        b.dataset.id = id;
        b.setAttribute('aria-pressed', id === deps.profile.body.preset);
        b.addEventListener('click', () => { choosePresetFn(id); b.blur(); });
        bodiesEl.appendChild(b);
      });
    },
    syncSliders: syncSlidersFn,
    choosePreset: (id) => {
      const p = deps.PRESETS[id];
      deps.profile.body.preset = id;
      // Apply preset properties based on form
      if (deps.formKind === 'wisp') {
        // Wisp presets only affect particle count (nMod), handled in spawnForm
      } else {
        // Slime and stone presets apply physics properties
        ['stiff', 'pressure', 'skin', 'grip', 'sticky'].forEach(k => {
          if (p[k] !== undefined) {
            deps.P[k] = p[k];
            deps.profile.body[k] = p[k];
          }
        });
      }
      syncSlidersFn();
      [...$('bodies').children].forEach(c => c.setAttribute('aria-pressed', c.dataset.id === id));
      // Respawn form to apply preset changes
      deps.spawnForm(deps.formKind, null, true);
      deps.saveSoon();
    },
    sliderEls,
    P,
    PRESETS,
    FORMS: [['slime', 'Slime'], ['wisp', 'Wisp'], ['stone', 'Stone']]
  };
}