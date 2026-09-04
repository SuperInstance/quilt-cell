const { fnv1a_64, cellToDials, cosineSim, stateHash, bind, tick, formatHash, FNV_OFFSET, FNV_PRIME } = require('../index.js');

console.log('quilt-cell self-test');

// FNV-1a constants
if (FNV_OFFSET !== 0xCBF29CE484222325n) throw new Error('FNV_OFFSET wrong');
if (FNV_PRIME  !== 0x00000100000001B3n)  throw new Error('FNV_PRIME wrong');
console.log('  FNV constants ok');

// FNV-1a deterministic
const h1 = fnv1a_64('hello');
const h2 = fnv1a_64('hello');
const h3 = fnv1a_64('world');
if (h1 !== h2) throw new Error('FNV should be deterministic');
if (h1 === h3) throw new Error('FNV should differ for different strings');
console.log('  FNV-1a deterministic ✓');

// cellToDials returns 16
const d = cellToDials({ number: 470, title: 'Conservation', f_number: 161, phase: 266, date: '2026-09-04', ref_papers: [], ref_f_numbers: [158, 159] });
if (d.length !== 16) throw new Error('dials should be 16');
console.log('  cellToDials returns 16 ✓');

// cosine sim identical
const v = [100, 200, 300, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const sim = cosineSim(v, v);
if (Math.abs(sim - 1.0) > 0.001) throw new Error('cosine of v with itself should be 1');
console.log('  cosineSim(v, v) = 1.0 ✓');

// stateHash deterministic
const fabric1 = { cells: [{number:1, title:'a', f_number:1, phase:1, date:'2026', ref_papers:[], ref_f_numbers:[]}], dials: [cellToDials({number:1, title:'a', f_number:1, phase:1, date:'2026', ref_papers:[], ref_f_numbers:[]})] };
const fabric2 = { cells: [{number:1, title:'a', f_number:1, phase:1, date:'2026', ref_papers:[], ref_f_numbers:[]}], dials: [cellToDials({number:1, title:'a', f_number:1, phase:1, date:'2026', ref_papers:[], ref_f_numbers:[]})] };
const t1 = tick(fabric1);
const t2 = tick(fabric2);
if (t1.state_hash !== t2.state_hash) throw new Error('state hash should be deterministic');
console.log('  stateHash deterministic ✓');

// bind works
let f = { cells: [], dials: [] };
f = bind(f, { number: 1, title: 'a', f_number: 1, phase: 1, date: '2026-01-01', ref_papers: [], ref_f_numbers: [] });
f = bind(f, { number: 2, title: 'b', f_number: 2, phase: 2, date: '2026-02-01', ref_papers: [], ref_f_numbers: [] });
if (f.cells.length !== 2) throw new Error('bind should add cells');
console.log('  bind adds cells ✓');

// format hash
const formatted = formatHash(0x7f563ed9982496a1n);
if (formatted !== '0x7f563ed9982496a1') throw new Error('formatHash wrong: ' + formatted);
console.log('  formatHash: ' + formatted, '✓');

console.log('  ✓ all checks passed');
