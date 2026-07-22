const fs = require('fs');
const c = fs.readFileSync('src/stores/checkin.spec.ts', 'utf8');
const lines = c.split('\n');
let d = 0;
for (let i = 0; i < lines.length; i++) {
  const o = (lines[i].match(/\{/g) || []).length;
  const cl = (lines[i].match(/\}/g) || []).length;
  const prev = d;
  d += o - cl;
  // Show lines where depth changes in a non-obvious way
  if (i >= 595 && i <= 620) {
    console.log('Line', i+1, 'prev:', prev, 'o:', o, 'cl:', cl, 'd:', d, '->', lines[i].trim().substring(0, 60));
  }
}
console.log('Final depth:', d);