// Laluan — network maths: run times, timetables, journey planning and fares.
import { STATIONS, LINES } from './data.js';

export const DWELL = .5, TRANSFER = 4, OPEN = 6 * 3600, CLOSE = 24 * 3600;
const dist = (a, b) => Math.hypot(STATIONS[a].x - STATIONS[b].x, STATIONS[a].z - STATIONS[b].z) * 1.12;

// cumulative minutes and km along each line, both directions
LINES.forEach((L, li) => {
  L.idx = li; L.km = [0]; L.min = [0];
  for (let i = 1; i < L.stops.length; i++) { const d = dist(L.stops[i - 1], L.stops[i]); L.km.push(L.km[i - 1] + d); L.min.push(L.min[i - 1] + d / L.speed * 60 + DWELL); }
  L.run = L.min.at(-1); L.lengthKm = L.km.at(-1); L.offset = li * 1.5;
});
export const lineById = (id) => LINES.find((l) => l.id === id);
export const linesAt = (s) => LINES.filter((l) => l.stops.includes(s));

// headway in minutes by time of day (seconds since midnight, Malaysia time)
export function headway(sec) { const h = sec / 3600; if (h < 6) return null; if (h < 7) return 6; if (h < 9.5) return 3.5; if (h < 17) return 5; if (h < 20) return 3.5; return 7; }
export function myt(now = Date.now()) { return ((now / 1000 + 8 * 3600) % 86400 + 86400) % 86400; }
export const clock = (sec) => { sec = ((sec % 86400) + 86400) % 86400; const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60; return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };

// departures from each terminus, seconds since midnight
const DEPS = {}; LINES.forEach((L) => { const out = []; let t = OPEN + L.offset * 60; while (t < CLOSE - L.run * 60) { out.push(t); t += headway(t) * 60; } DEPS[L.id] = out; });
export const departuresOf = (L) => DEPS[L.id];

// next trains at a station on a line, in a direction (+1 = towards the last stop)
export function nextTrains(L, s, dir, now = myt(), n = 3) {
  const i = L.stops.indexOf(s); if (i < 0) return []; const off = dir > 0 ? L.min[i] : L.run - L.min[i];
  if ((dir > 0 && i === L.stops.length - 1) || (dir < 0 && i === 0)) return [];
  const out = []; for (const d of DEPS[L.id]) { const at = d + off * 60; if (at >= now - 20) { out.push(at); if (out.length >= n) break; } } return out;
}

// trains on the line right now: [{dir, pos}] where pos is a fractional station index
export function trainsNow(L, now = myt()) {
  const out = [], run = L.run * 60;
  for (const d of DEPS[L.id]) { if (d > now) break; const age = now - d; if (age > run) continue;
    for (const dir of [1, -1]) { const m = age / 60; // minutes since leaving the terminus
      const cum = dir > 0 ? L.min : L.min.map((x) => L.run - x).reverse(); let k = 0; while (k < cum.length - 1 && cum[k + 1] <= m) k++;
      const segStart = cum[k] , segEnd = cum[k + 1] ?? cum[k]; const travel = Math.max(.01, segEnd - segStart - DWELL); const f = Math.min(1, Math.max(0, (m - segStart) / travel));
      const p = k + f; out.push({ dir, pos: dir > 0 ? p : (L.stops.length - 1) - p }); } }
  return out;
}

// journey planner: Dijkstra over (station, line) nodes
export function plan(from, to, nowSec = myt()) {
  if (from === to) return null;
  const key = (s, l) => s + '|' + l, dist0 = new Map(), prev = new Map(), Q = [];
  for (const L of linesAt(from)) { dist0.set(key(from, L.id), 0); Q.push([0, from, L.id]); }
  while (Q.length) { Q.sort((a, b) => a[0] - b[0]); const [d, s, l] = Q.shift(); if (d > (dist0.get(key(s, l)) ?? Infinity)) continue; if (s === to) break;
    const L = lineById(l), i = L.stops.indexOf(s);
    for (const j of [i - 1, i + 1]) { if (j < 0 || j >= L.stops.length) continue; const nd = d + Math.abs(L.min[j] - L.min[i]), k = key(L.stops[j], l); if (nd < (dist0.get(k) ?? Infinity)) { dist0.set(k, nd); prev.set(k, key(s, l)); Q.push([nd, L.stops[j], l]); } }
    for (const M of linesAt(s)) { if (M.id === l) continue; const nd = d + TRANSFER, k = key(s, M.id); if (nd < (dist0.get(k) ?? Infinity)) { dist0.set(k, nd); prev.set(k, key(s, l)); Q.push([nd, s, M.id]); } } }
  let best = null; for (const L of linesAt(to)) { const d = dist0.get(key(to, L.id)); if (d != null && (!best || d < best.d)) best = { d, k: key(to, L.id) }; }
  if (!best) return null;
  const path = []; let k = best.k; while (k) { const [s, l] = k.split('|'); path.unshift({ s, l }); k = prev.get(k); }
  // collapse into legs
  const legs = []; for (const p of path) { const last = legs.at(-1); if (last && last.line === p.l) last.stops.push(p.s); else if (last && last.stops.at(-1) === p.s) legs.push({ line: p.l, stops: [p.s] }); else legs.push({ line: p.l, stops: [p.s] }); }
  const clean = legs.filter((g) => g.stops.length > 1);
  // timings against the real timetable
  let t = nowSec, km = 0; const out = [];
  for (const g of clean) { const L = lineById(g.line), a = L.stops.indexOf(g.stops[0]), b = L.stops.indexOf(g.stops.at(-1)), dir = b > a ? 1 : -1;
    const dep = nextTrains(L, g.stops[0], dir, t + (out.length ? 60 : 0), 1)[0]; if (dep == null) return { closed: true };
    const ride = Math.abs(L.min[b] - L.min[a]) - DWELL; const arr = dep + ride * 60; km += Math.abs(L.km[b] - L.km[a]);
    out.push({ line: L, from: g.stops[0], to: g.stops.at(-1), stops: g.stops, dir, towards: dir > 0 ? L.stops.at(-1) : L.stops[0], dep, arr, mins: Math.round(ride) });
    t = arr + 120; }
  if (!out.length) return null;
  return { legs: out, depart: out[0].dep, arrive: out.at(-1).arr, mins: Math.round((out.at(-1).arr - nowSec) / 60), km, fare: fare(km), transfers: out.length - 1 };
}
export function fare(km) { return Math.min(6.4, Math.round((1.2 + km * .17) * 10) / 10); }
export const rm = (v) => 'RM ' + v.toFixed(2);
