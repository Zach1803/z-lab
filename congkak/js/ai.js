import { bestMove } from './rules.js';
self.onmessage = (e) => { const { b, p, level, id } = e.data; self.postMessage({ id, move: bestMove(b, p, level) }); };
