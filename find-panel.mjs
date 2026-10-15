import fs from 'node:fs';
const s = fs.readFileSync('src/app/game.js', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes('const formsEl') || l.includes('function syncFormButtons') || 
      l.includes('function syncSliders') || l.includes('function choosePreset') ||
      l.includes('const SLIDERS') || l.includes('const bodiesEl') ||
      l.includes("quality") || l.includes('weather') || 
      l.includes('const time') || l.includes('$(\'forms\')') || 
      l.includes('$(\'bodies\')') || l.includes('$(\'terrain\')') ||
      l.includes('$(\'quality\')') || l.includes('$(\'weather\')') ||
      l.includes('$(\'time\')') || l.includes('$(\'sliders\')') ||
      l.includes('$(\'craft\')') || l.includes('$(\'build\')') ||
      l.includes('$(\'cust\')') || l.includes('$(\'custBody\')')) {
    console.log(i+1 + ':', l.trim());
  }
});