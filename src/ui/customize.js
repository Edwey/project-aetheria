/**
 * Customize module - Customization UI and cosmetic mesh builders.
 * Ported verbatim from game.js buildCustomizeUI and cosmetic builders.
 */

import * as THREE from 'three';
import Profile from '../gameplay/profile.js';

export function createCustomizePanel(deps) {
  const {
    $, profile, scene, syncLookColors, buildCore, spawnForm, emoManual,
    buildCosmetics, updateCosmetics, topC, botC, wingGeo, anchors, cosm, trailHist, makePoints, updatePointSizes, tryGLB
  } = deps;

  const cust = $('custBody');

  function row(label, el) {
    const d = document.createElement('div');
    d.className = 'sl';
    const l = document.createElement('label');
    l.textContent = label;
    d.append(l);
    if (el.out) d.append(el.out);
    d.append(el.input || el);
    cust.appendChild(d);
    return d;
  }

  function addColor(label, get, set) {
    const i = document.createElement('input');
    i.type = 'color';
    i.value = get();
    i.addEventListener('input', () => { set(i.value); syncLookColors(); deps.saveSoon(); });
    i.style.gridColumn = '2';
    i.style.justifySelf = 'end';
    i.style.width = '44px';
    row(label, { input: i });
  }

  function addRange(label, min, max, step, get, set, fmt, onChange) {
    const i = document.createElement('input');
    i.type = 'range';
    i.min = min;
    i.max = max;
    i.step = step;
    i.value = get();
    const o = document.createElement('output');
    o.textContent = fmt(get());
    i.addEventListener('input', () => { set(parseFloat(i.value)); o.textContent = fmt(get()); syncLookColors(); deps.saveSoon(); });
    i.addEventListener('change', () => { if (onChange) onChange(); });
    i.addEventListener('pointerup', () => i.blur());
    row(label, { input: i, out: o });
  }

  function addSelect(label, list, get, set) {
    const s = document.createElement('select');
    list.forEach(([id, l]) => {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = l;
      s.appendChild(o);
    });
    s.value = get();
    s.addEventListener('change', () => { set(s.value); s.blur(); deps.saveSoon(); });
    const d = document.createElement('div');
    const l = document.createElement('div');
    l.className = 'lbl';
    l.textContent = label;
    d.append(l, s);
    cust.appendChild(d);
  }

  function buildCustomizeUI() {
    cust.innerHTML = '';
    const nm = document.createElement('input');
    nm.type = 'text';
    nm.maxLength = 16;
    nm.value = profile.name;
    nm.className = 'txt';
    nm.setAttribute('aria-label', 'Creature name');
    nm.addEventListener('input', () => { profile.name = nm.value.slice(0, 16) || 'Slimey'; deps.updateLastLabel(); deps.saveSoon(); });
    const d = document.createElement('div');
    const l = document.createElement('div');
    l.className = 'lbl';
    l.textContent = 'Name';
    d.append(l, nm);
    cust.appendChild(d);
    addColor('Top colour', () => profile.look.top, v => profile.look.top = v);
    addColor('Bottom colour', () => profile.look.bottom, v => profile.look.bottom = v);
    addRange('Translucency', 0.3, 0.95, 0.01, () => profile.look.translucency, v => profile.look.translucency = v, v => v.toFixed(2));
    addRange('Gloss', 0, 1, 0.01, () => profile.look.gloss, v => profile.look.gloss = v, v => v.toFixed(2));
    addRange('Size', 0.7, 1.4, 0.01, () => profile.look.size, v => profile.look.size = v, v => v.toFixed(2) + 'x', () => spawnForm(profile.form, null, true));
    addSelect('Eyes', Profile.EYES, () => profile.look.eyeStyle, v => profile.look.eyeStyle = v);
    addColor('Eye colour', () => profile.look.eyeColor, v => profile.look.eyeColor = v);
    addSelect('Mouth', Profile.MOUTHS, () => profile.look.mouth, v => profile.look.mouth = v);
    addSelect('Inner charm', Profile.CORES, () => profile.look.core, v => { profile.look.core = v; buildCore(); });
    const labels = { head: 'Headgear', face: 'Face', back: 'Back', aura: 'Aura', trail: 'Trail' };
    Object.keys(Profile.CATALOG).forEach(slot => addSelect(labels[slot], Profile.CATALOG[slot], () => profile.cosmetics[slot], v => { profile.cosmetics[slot] = v; buildCosmetics(); }));
    const eb = document.createElement('div');
    eb.className = 'acts';
    Profile.MANUAL.forEach((n, i) => {
      const b = document.createElement('button');
      b.textContent = (i + 1) + ' ' + n;
      b.addEventListener('click', () => { emoManual(n); b.blur(); });
      eb.appendChild(b);
    });
    const ed = document.createElement('div');
    const el = document.createElement('div');
    el.className = 'lbl';
    el.textContent = 'Emotions (keys 1 to 8)';
    ed.append(el, eb);
    cust.appendChild(ed);
    const rs = document.createElement('button');
    rs.textContent = 'Reset look';
    rs.className = 'wide';
    rs.addEventListener('click', () => {
      const d0 = Profile.validate(null);
      profile.look = d0.look;
      profile.cosmetics = d0.cosmetics;
      Profile.save(profile);
      buildCustomizeUI();
      syncLookColors();
      buildCosmetics();
      buildCore();
      spawnForm(profile.form, null, true);
      rs.blur();
    });
    cust.appendChild(rs);
  }

  // Cosmetic mesh builders
  const stdM = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o || {}));

  function addM(g, geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    m.scale.set(sx || 1, sy || 1, sz || 1);
    m.castShadow = true;
    g.add(m);
    return m;
  }

  function makeHead(id) {
    const g = new THREE.Group(), sh = profile.look.size;
    if (id === 'ahoge') { addM(g, new THREE.ConeGeometry(0.05, 0.3, 8), stdM(botC.getHex()), 0, 0.13, 0); addM(g, new THREE.SphereGeometry(0.06, 10, 8), stdM(topC.getHex()), 0, 0.3, 0); }
    else if (id === 'wizard') { addM(g, new THREE.ConeGeometry(0.34, 0.62, 14), stdM(0x5b4bd6), 0, 0.3, 0); addM(g, new THREE.TorusGeometry(0.36, 0.045, 8, 20), stdM(0x4a3cb8), 0, 0.02, 0, Math.PI / 2, 0, 0); addM(g, new THREE.SphereGeometry(0.05, 8, 6), stdM(0xffd75e, { emissive: 0xffd75e, emissiveIntensity: 0.6 }), 0.1, 0.4, 0.28); }
    else if (id === 'sprout') { addM(g, new THREE.CylinderGeometry(0.015, 0.02, 0.14, 6), stdM(0x4f9a3f), 0, 0.07, 0); addM(g, new THREE.SphereGeometry(0.13, 10, 8), stdM(0x6bcf5e), 0.1, 0.17, 0, 0, 0, -0.6, 1, 0.3, 0.6); addM(g, new THREE.SphereGeometry(0.13, 10, 8), stdM(0x5cbf55), -0.1, 0.17, 0, 0, 0, 0.6, 1, 0.3, 0.6); }
    else if (id === 'halo') { addM(g, new THREE.TorusGeometry(0.3, 0.028, 8, 28), stdM(0xffe27a, { emissive: 0xffd24a, emissiveIntensity: 1 }), 0, 0.35, 0, Math.PI / 2, 0, 0); }
    else if (id === 'crown') { const gold = stdM(0xf2c230, { metalness: 0.6, roughness: 0.3 }); addM(g, new THREE.CylinderGeometry(0.27, 0.3, 0.14, 14, 1, true), gold, 0, 0.07, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; addM(g, new THREE.ConeGeometry(0.05, 0.14, 6), gold, Math.cos(a) * 0.28, 0.2, Math.sin(a) * 0.28); } }
    else if (id === 'ears') { const m = stdM(botC.getHex()); addM(g, new THREE.ConeGeometry(0.1, 0.24, 8), m, 0.22, 0.1, 0, 0, 0, -0.4); addM(g, new THREE.ConeGeometry(0.1, 0.24, 8), m, -0.22, 0.1, 0, 0, 0, 0.4); }
    else if (id === 'blossom') { addM(g, new THREE.SphereGeometry(0.06, 8, 6), stdM(0xffd75e), 0, 0.08, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; addM(g, new THREE.SphereGeometry(0.07, 8, 6), stdM(0xff8fb8), Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1, 0, 0, 0, 1, 0.5, 1); } }
    tryGLB(id, g);
    return g;
  }

  function makeBack(id) {
    const g = new THREE.Group();
    if (id === 'backpack') { addM(g, new THREE.BoxGeometry(0.34, 0.4, 0.18), stdM(0x9a6a3a), 0, 0, 0); addM(g, new THREE.BoxGeometry(0.3, 0.14, 0.2), stdM(0x7d5430), 0, 0.14, 0); }
    else if (id === 'minwings') { const m = new THREE.MeshStandardMaterial({ color: 0xfff1d6, side: THREE.DoubleSide, roughness: 0.6 }); const r = new THREE.Mesh(wingGeo, m), l = new THREE.Mesh(wingGeo, m); r.scale.set(0.2, 0.2, 0.2); l.scale.set(-0.2, 0.2, 0.2); r.position.x = 0.05; l.position.x = -0.05; r.rotation.x = l.rotation.x = -0.6; g.add(r); g.add(l); g.userData.flap = [r, l]; }
    tryGLB(id, g);
    return g;
  }

  function makeFace(id) {
    const g = new THREE.Group();
    if (id === 'glasses') { const m = stdM(0x2a2a30, { metalness: 0.4 }); g.userData.l = addM(g, new THREE.TorusGeometry(0.12, 0.015, 6, 18), m); g.userData.r = addM(g, new THREE.TorusGeometry(0.12, 0.015, 6, 18), m); g.userData.bridge = addM(g, new THREE.CylinderGeometry(0.01, 0.01, 0.1, 5), m, 0, 0, 0, 0, 0, Math.PI / 2); }
    else if (id === 'blush') { const m = new THREE.MeshBasicMaterial({ color: 0xff7fa8, transparent: true, opacity: 0.6 }); g.userData.l = addM(g, new THREE.SphereGeometry(0.06, 8, 6), m, 0, 0, 0, 0, 0, 0, 1, 0.5, 0.4); g.userData.r = addM(g, new THREE.SphereGeometry(0.06, 8, 6), m, 0, 0, 0, 0, 0, 0, 1, 0.5, 0.4); }
    tryGLB(id, g);
    return g;
  }

  return { buildCustomizeUI, makeHead, makeBack, makeFace };
}
