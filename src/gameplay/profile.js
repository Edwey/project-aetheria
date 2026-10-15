/**
 * src/gameplay/profile.js <- Profile - ported verbatim from Aetheria Slime Lab.html (Stage C).
 * THE PROTOTYPE IS SOURCE OF TRUTH FOR EVERY NUMBER. Do not change behaviour.
 * Customization profile + local save.
 */


const Profile = (function () {
'use strict';
const KEY = 'aetheria.profile.v1';
const DEFAULT = {
  v: 1, name: 'Slimey', form: 'slime',
  look: { top: '#7cf0a0', bottom: '#2fbf62', translucency: 0.86, gloss: 1, size: 1, eyeStyle: 'oval', eyeColor: '#16301f', mouth: 'smile', core: 'crystal' },
  body: { preset: 'blob', stiff: 0.22, pressure: 1, skin: 0.9, grip: 0.55, sticky: 0.5, jmax: 15 },
  cosmetics: { head: 'none', face: 'none', back: 'none', aura: 'none', trail: 'none' }
};
const CATALOG = {
  head:  [['none', 'None'], ['ahoge', 'Droplet ahoge'], ['wizard', 'Wizard hat'], ['sprout', 'Sprout leaf'], ['halo', 'Starlight halo'], ['crown', 'Royal crown'], ['ears', 'Cat ears'], ['blossom', 'Wildflower']],
  face:  [['none', 'None'], ['glasses', 'Round glasses'], ['blush', 'Blush cheeks']],
  back:  [['none', 'None'], ['backpack', 'Backpack'], ['minwings', 'Mini wings']],
  aura:  [['none', 'None'], ['sparkles', 'Sparkles'], ['fireflies', 'Fireflies']],
  trail: [['none', 'None'], ['stars', 'Star dust'], ['petals', 'Petal trail']]
};
const CORES = [['crystal', 'Crystal'], ['star', 'Star'], ['heart', 'Heart gem'], ['flakes', 'Gold flakes']];
const EYES = [['oval', 'Oval'], ['round', 'Round'], ['sparkle', 'Sparkle'], ['sleepy', 'Sleepy']];
const MOUTHS = [['smile', 'Smile'], ['dot', 'Dot'], ['cat', 'Cat']];
// ey: eye height, tilt: eyebrow-style tilt (rad), pupil: pupil scale, curve: mouth (-1 frown..1 smile), open: round mouth 0..1
const EMOTIONS = {
  neutral:   { pri: 0, ey: 1.0,  tilt: 0,     pupil: 1.0, curve: 0.35, open: 0 },
  sleepy:    { pri: 1, ey: 0.25, tilt: 0,     pupil: 0.9, curve: 0.1,  open: 0 },
  cozy:      { pri: 2, ey: 0.45, tilt: 0,     pupil: 0.9, curve: 0.6,  open: 0 },
  happy:     { pri: 3, ey: 0.35, tilt: 0,     pupil: 0.6, curve: 1.0,  open: 0 },
  sad:       { pri: 3, ey: 0.9,  tilt: -0.25, pupil: 1.1, curve: -0.7, open: 0 },
  curious:   { pri: 4, ey: 1.15, tilt: 0.2,   pupil: 1.1, curve: 0.1,  open: 0 },
  excited:   { pri: 5, ey: 1.2,  tilt: 0,     pupil: 1.2, curve: 1.0,  open: 0.3 },
  proud:     { pri: 6, ey: 0.6,  tilt: 0,     pupil: 0.8, curve: 0.8,  open: 0 },
  love:      { pri: 7, ey: 0.9,  tilt: 0,     pupil: 1.35, curve: 0.9, open: 0 },
  surprised: { pri: 8, ey: 1.3,  tilt: 0,     pupil: 0.6, curve: 0,    open: 1 }
};
const MANUAL = ['happy', 'love', 'surprised', 'sleepy', 'curious', 'proud', 'excited', 'cozy'];
const isHex = s => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
const num = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v)) ? Math.min(hi, Math.max(lo, v)) : d;
const pick = (v, list, d) => list.some(x => x[0] === v) ? v : d;
function validate(o) {
  const d = JSON.parse(JSON.stringify(DEFAULT)); if (!o || typeof o !== 'object') return d;
  const L = o.look || {}, B = o.body || {}, C = o.cosmetics || {};
  d.name = typeof o.name === 'string' ? o.name.slice(0, 16) : d.name;
  d.form = ['slime', 'wisp', 'stone'].indexOf(o.form) >= 0 ? o.form : d.form;
  d.look.top = isHex(L.top) ? L.top : d.look.top; d.look.bottom = isHex(L.bottom) ? L.bottom : d.look.bottom;
  d.look.translucency = num(L.translucency, 0.3, 0.95, d.look.translucency); d.look.gloss = num(L.gloss, 0, 1, d.look.gloss);
  d.look.size = num(L.size, 0.7, 1.4, 1); d.look.eyeStyle = pick(L.eyeStyle, EYES, d.look.eyeStyle);
  d.look.eyeColor = isHex(L.eyeColor) ? L.eyeColor : d.look.eyeColor; d.look.mouth = pick(L.mouth, MOUTHS, d.look.mouth); d.look.core = pick(L.core, CORES, 'crystal');
  ['stiff', 'pressure', 'skin', 'grip', 'sticky'].forEach(k => { d.body[k] = num(B[k], k === 'pressure' ? 0.6 : 0, k === 'pressure' ? 1.5 : 1, d.body[k]); });
  d.body.jmax = num(B.jmax, 8, 20, 15); d.body.preset = ['blob', 'goo', 'ball', 'cube'].indexOf(B.preset) >= 0 ? B.preset : 'blob';
  Object.keys(CATALOG).forEach(slot => { d.cosmetics[slot] = pick(C[slot], CATALOG[slot], 'none'); });
  return d;
}
function load() { try { const s = window.localStorage.getItem(KEY); return validate(s ? JSON.parse(s) : null); } catch (e) { return validate(null); } }
function save(p) { try { window.localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch (e) { return false; } }
return { DEFAULT, CATALOG, CORES, EYES, MOUTHS, EMOTIONS, MANUAL, validate, load, save };
})();

// ESM named exports (parity with the prototype return table; default keeps the namespace).
export const { DEFAULT, CATALOG, CORES, EYES, MOUTHS, EMOTIONS, MANUAL, validate, load, save } = Profile;
export default Profile;
