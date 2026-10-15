import fs from 'node:fs';
const s = fs.readFileSync('kenney-assets.html', 'utf8');
const m = [...s.matchAll(/href="\/assets\/([^"]+)"/g)];
const u = [...new Set(m.map(x => x[1]))];
u.forEach(x => console.log(x));