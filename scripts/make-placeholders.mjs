#!/usr/bin/env node
/**
 * make-placeholders.mjs - SVG placeholders for UI icons + logo.
 * Writes to public/assets/ui with README telling the human which files to replace.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const out = new URL('../public/assets/ui/', import.meta.url);
await mkdir(out, { recursive: true });

const svg = (label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#cfe9f3"/><text x="32" y="36" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#16301f">${label}</text></svg>`;

const icons = ['logo', 'icon-slime', 'icon-wisp', 'icon-stone', 'icon-build', 'icon-craft', 'icon-save'];
for (const name of icons) {
  await writeFile(new URL(`../public/assets/ui/${name}.svg`, import.meta.url), svg(name));
}
await writeFile(
  new URL('../public/assets/ui/README.md', import.meta.url),
  `# UI placeholders\n\nReplace these SVG files with your own icons (same file names):\n\n${icons.map((i) => `- ${i}.svg`).join('\n')}\n`,
);
console.log(`Wrote ${icons.length} SVG placeholders to public/assets/ui/`);
