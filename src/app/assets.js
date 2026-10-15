/**
 * Assets module - manifest ids, never hard-coded paths.
 * Game must run with empty public/assets (procedural fallbacks).
 */

'use strict';

let manifest = null;

export async function loadManifest(url = '/assets/models/manifest.json') {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    manifest = await res.json();
    return manifest;
  } catch {
    return null;
  }
}

export function getModelUrl(id) {
  if (manifest && manifest.models && manifest.models[id]) {
    return manifest.models[id].url;
  }
  return null; // caller must use procedural fallback
}

export function hasModel(id) {
  return Boolean(manifest && manifest.models && manifest.models[id]);
}
