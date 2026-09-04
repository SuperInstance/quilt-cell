# @superinstance/quilt-cell

The Quilt cell as a JavaScript library. 16-dial Q1.15 vectors, FNV-1a 64-bit state hash. **Byte-exact** with the Python, C, Rust, Verilog, and VHDL ports.

```js
const { Cell, cellToDials, fnv1a_64, stateHash, cosineSim, bind, tick, formatHash } = require('@superinstance/quilt-cell');

const cell = { number: 470, title: 'Conservation Laws', f_number: 161, phase: 266, date: '2026-09-04', ref_papers: [], ref_f_numbers: [158, 159, 140, 156] };
const dials = cellToDials(cell);
// [61570, 64736, 35098, 57988, 30576, 512, 31053, 0, 0, 0, 0, 0, 0, 0, 0, 0]

let fabric = { cells: [], dials: [] };
fabric = bind(fabric, cell);
const t = tick(fabric);
// { tick_number: 1, cell_count: 1, state_hash: 0x... }
```

## Self-test

```bash
npm test
```

The test file includes a check that the state hash for a cell matches the Python implementation's hash byte-for-byte.

## Source

https://github.com/SuperInstance/quilt-cell

## License

MIT
