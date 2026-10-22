// Congkak rules (Malaysian, relay sowing). Pure functions so the same code drives the 3D board, the AI and online play.
// Index layout in sowing (clockwise) order:
//   0..6   player 0's holes (near row, sown right → left)   7  player 0's store (left end)
//   8..14  player 1's holes (far row, sown left → right)     15 player 1's store (right end)
export const SEEDS = 7, STORE = [7, 15];
export const holesOf = (p) => (p === 0 ? [0, 1, 2, 3, 4, 5, 6] : [8, 9, 10, 11, 12, 13, 14]);
export const isHoleOf = (i, p) => (p === 0 ? i >= 0 && i <= 6 : i >= 8 && i <= 14);
export const opposite = (i) => 14 - i;
export const newBoard = () => { const b = Array(16).fill(SEEDS); b[7] = 0; b[15] = 0; return b; };
const next = (i, p) => { let j = (i + 1) % 16; if (j === STORE[1 - p]) j = (j + 1) % 16; return j; };
export const seedsOnSide = (b, p) => holesOf(p).reduce((s, i) => s + b[i], 0);
export const legal = (b, p) => holesOf(p).filter((i) => b[i] > 0);

// Play one sowing turn. Returns the new board, the event list (for animation) and who moves next.
export function play(board, p, start) {
  const b = board.slice(), ev = [];
  if (!isHoleOf(start, p) || b[start] === 0) return null;
  let pos = start, hand = b[pos], drops = 0, reason = 'end';
  b[pos] = 0; ev.push({ t: 'pick', i: pos, n: hand });
  for (;;) {
    while (hand > 0) { pos = next(pos, p); b[pos]++; hand--; drops++; ev.push({ t: 'drop', i: pos }); }
    if (pos === STORE[p]) { reason = 'store'; break; }
    if (b[pos] > 1) { if (drops > 3000) { reason = 'limit'; break; } hand = b[pos]; b[pos] = 0; ev.push({ t: 'pick', i: pos, n: hand }); continue; }
    if (isHoleOf(pos, p)) {
      const o = opposite(pos);
      if (b[o] > 0) { const n = b[o] + 1; ev.push({ t: 'capture', i: pos, o, n, store: STORE[p] }); b[STORE[p]] += n; b[o] = 0; b[pos] = 0; reason = 'capture'; }
      else reason = 'empty-own';
    } else reason = 'empty-opp';
    break;
  }
  let nextP = reason === 'store' && seedsOnSide(b, p) > 0 ? p : 1 - p;
  let over = false;
  if (seedsOnSide(b, nextP) === 0) {
    const other = 1 - nextP; if (seedsOnSide(b, nextP) === 0 && seedsOnSide(b, other) === 0) over = true;
    else if (nextP === p) nextP = other; // extra turn but nothing left to sow
    else { // the player to move is stuck: the other side keeps what remains in their holes
      const rest = seedsOnSide(b, other); holesOf(other).forEach((i) => { if (b[i]) ev.push({ t: 'sweep', i, n: b[i], store: STORE[other] }); b[i] = 0; }); b[STORE[other]] += rest; over = true;
    }
  }
  if (!over && seedsOnSide(b, nextP) === 0) over = true;
  return { board: b, ev, reason, next: nextP, over };
}
export const winner = (b) => (b[7] === b[15] ? -1 : b[7] > b[15] ? 0 : 1);

// AI: easy = random, normal = best single turn, hard = alpha-beta search (extra turns keep the same player)
export function bestMove(b, p, level = 'normal') {
  const moves = legal(b, p); if (!moves.length) return null;
  if (level === 'easy') { const good = moves.filter((m) => play(b, p, m).reason !== 'empty-opp'); const pool = Math.random() < .5 && good.length ? good : moves; return pool[Math.floor(Math.random() * pool.length)]; }
  const evalB = (bb) => (bb[STORE[p]] - bb[STORE[1 - p]]) + .15 * (seedsOnSide(bb, p) - seedsOnSide(bb, 1 - p));
  const depth = level === 'hard' ? 4 : 1;
  function search(bb, who, d, a, beta, nodes) {
    if (d === 0) return evalB(bb);
    const ms = legal(bb, who); if (!ms.length) return evalB(bb);
    let best = who === p ? -1e9 : 1e9;
    for (const m of ms) {
      const r = play(bb, who, m); nodes.n++;
      const v = r.over ? (r.board[STORE[p]] - r.board[STORE[1 - p]]) * 100 : search(r.board, r.next, r.next === who ? d : d - 1, a, beta, nodes);
      if (who === p) { if (v > best) best = v; if (best > a) a = best; } else { if (v < best) best = v; if (best < beta) beta = best; }
      if (a >= beta || nodes.n > 60000) break;
    }
    return best;
  }
  let bm = moves[0], bv = -1e9;
  for (const m of moves) { const r = play(b, p, m), nodes = { n: 0 }; const v = r.over ? (r.board[STORE[p]] - r.board[STORE[1 - p]]) * 100 : search(r.board, r.next, r.next === p ? depth - 1 + 1 : depth - 1, -1e9, 1e9, nodes) + (r.reason === 'store' ? .5 : 0); if (v > bv) { bv = v; bm = m; } }
  return bm;
}
