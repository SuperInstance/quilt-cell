// index.js — quilt-cell: the 16-dial cell as a JavaScript library.
//
//   const { Cell, cellToDials, fnv1a_64, stateHash, cosineSim } = require('@superinstance/quilt-cell');
//   const c = new Cell({ number: 470, title: 'Conservation Laws', f_number: 161, phase: 266, date: '2026-09-04', ref_papers: [], ref_f_numbers: [158, 159, 140, 156] });
//   const dials = cellToDials(c);  // [numQ, titleLo, fQ, phaseQ, yearQ, nRefsQ, titleHi, 0, ...]
//   const hash = stateHash([dials]);

// FNV-1a 64-bit constants (byte-exact across C, Python, Rust, Verilog, VHDL, JS)
const FNV_OFFSET = 0xCBF29CE484222325n;
const FNV_PRIME  = 0x00000100000001B3n;
const MASK       = 0xFFFFFFFFFFFFFFFFn;

/**
 * FNV-1a 64-bit hash of a string. UTF-8 encoded.
 * @param {string} s
 * @returns {bigint}
 */
function fnv1a_64(s) {
  let h = FNV_OFFSET;
  const enc = new TextEncoder();
  for (const b of enc.encode(s)) {
    h ^= BigInt(b);
    h = (h * FNV_PRIME) & MASK;
  }
  return h;
}

/**
 * A 16-dial cell (Q1.15 vector).
 * @typedef {Object} Cell
 * @property {number} number      - Paper number
 * @property {string} title       - Paper title
 * @property {number} f_number    - F-series number
 * @property {number} phase       - Phase number
 * @property {string} date        - ISO date
 * @property {number[]} ref_papers  - Referenced paper numbers
 * @property {number[]} ref_f_numbers - Referenced F-numbers
 */

/**
 * Convert a cell to its 16-dial vector (Q1.15).
 * Byte-exact with cellToDials() in the Cloudflare Worker.
 * @param {Cell} cell
 * @returns {number[]} - 16-element array of Q1.15 values
 */
function cellToDials(cell) {
  const year = parseInt((cell.date || '1970-01-01').slice(0, 4)) || 1970;
  const yearQ = (year - 1970) * 546;
  const phaseQ = (cell.phase || 0) * 218;
  const fQ = (cell.f_number || 0) * 218;
  const nRefs = (cell.ref_papers || []).length + (cell.ref_f_numbers || []).length;
  const nRefsQ = Math.min(0x7FFF, nRefs * 256);
  const th = fnv1a_64(cell.title || '');
  const titleLo = Number(th & 0xFFFFn);
  const titleHi = Number((th >> 16n) & 0xFFFFn);
  const num = Math.min(cell.number || 0, 500);
  const numQ = num * 131;
  return [numQ, titleLo, fQ, phaseQ, yearQ, nRefsQ, titleHi, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

/**
 * Cosine similarity between two 16-dial vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < 16; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  na = Math.sqrt(na);
  nb = Math.sqrt(nb);
  if (na === 0 || nb === 0) return 0;
  return dot / (na * nb);
}

/**
 * State hash over a list of dials (sorted by paper number).
 * @param {number[][]} dialsList
 * @returns {bigint}
 */
function stateHash(dialsList) {
  const sorted = [...dialsList].sort((a, b) => a[0] - b[0]);
  let h = FNV_OFFSET;
  for (const d of sorted) {
    for (const v of d) {
      const lo = v & 0xFF;
      const hi = (v >> 8) & 0xFF;
      h ^= BigInt(lo);
      h = (h * FNV_PRIME) & MASK;
      h ^= BigInt(hi);
      h = (h * FNV_PRIME) & MASK;
    }
  }
  return h;
}

/**
 * BIND: add a cell to a fabric. Returns the new fabric.
 * @param {Object} fabric - {cells: Cell[], dials: number[][]}
 * @param {Cell} cell
 * @returns {Object}
 */
function bind(fabric, cell) {
  const dials = cellToDials(cell);
  return {
    cells: [...fabric.cells, cell],
    dials: [...fabric.dials, dials],
  };
}

/**
 * TICK: rebalance the fabric (sort by paper number, recompute state hash).
 * @param {Object} fabric
 * @returns {Object} - {tick_number, cell_count, state_hash}
 */
function tick(fabric) {
  const pairs = fabric.cells.map((c, i) => ({ cell: c, dials: fabric.dials[i] }));
  pairs.sort((a, b) => a.cell.number - b.cell.number);
  return {
    tick_number: (fabric.tick_number || 0) + 1,
    cell_count: fabric.cells.length,
    state_hash: stateHash(pairs.map(p => p.dials)),
  };
}

/**
 * Format state hash as 0x-prefixed hex (matches Python hex() output).
 * @param {bigint} h
 * @returns {string}
 */
function formatHash(h) {
  return '0x' + h.toString(16).padStart(16, '0');
}

module.exports = {
  FNV_OFFSET,
  FNV_PRIME,
  fnv1a_64,
  cellToDials,
  cosineSim,
  stateHash,
  bind,
  tick,
  formatHash,
};
