// Halia Residences (fictional) — homes, prices and availability. Deterministic so every visitor sees the same building.
export const F0 = 8, F1 = 45, PH0 = 44, UNITS = 8;
const SKIP = [4, 13, 14];
export function label(f) { let n = 0, l = 0; while (n < f) { l++; if (!SKIP.includes(l)) n++; } return l; } // physical floor → lift button number
export const TYPES = {
  A: { name: 'Type A', beds: '2 bedrooms', baths: 2, sqft: 861, sqm: 80, blurb: 'A compact two-bedroom with a full-width balcony, ideal for couples or a first home.' },
  B: { name: 'Type B', beds: '3 bedrooms', baths: 2, sqft: 1184, sqm: 110, blurb: 'Three bedrooms on the long façades, with a living room that opens entirely onto the balcony.' },
  C: { name: 'Type C', beds: '3 + 1 bedrooms', baths: 3, sqft: 1421, sqm: 132, blurb: 'Dual-aspect corner home with a study, a separate dry and wet kitchen and two balconies.' },
  D: { name: 'Penthouse', beds: '4 + 1 bedrooms', baths: 5, sqft: 2906, sqm: 270, blurb: 'Duplex corner penthouse on levels 47–48 with a private lift lobby, double-height living and a roof terrace.' }
};
export const FACING = ['East · morning sun over the park', 'Northeast · city and sunrise', 'North · the city skyline', 'Northwest · city and sunset', 'West · sunset', 'Southwest · hills and sunset', 'South · Seroja hills', 'Southeast · hills and sunrise'];
export const FACE_SHORT = ['Park east', 'City + sunrise', 'City skyline', 'City + sunset', 'Sunset', 'Hills + sunset', 'Seroja hills', 'Hills + sunrise'];
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
export function unit(f, k) {
  const ph = f >= PH0, corner = k % 2 === 1;
  if (ph && !corner) return null; // penthouse levels hold four corner duplexes only
  const type = ph ? 'D' : corner ? 'C' : (k === 2 || k === 6) ? 'B' : 'A', T = TYPES[type];
  const lv = label(f), no = ph ? `PH-${'ABCD'[(k - 1) / 2]}` : `${lv}-${String(k + 1).padStart(2, '0')}`;
  const psf = ph ? 1580 : 1080 + (f - F0) * 11, prem = ([1, 2, 3].includes(k) ? 1.07 : 1) * (corner && !ph ? 1.04 : 1);
  const price = Math.round(T.sqft * psf * prem / 1000) * 1000;
  const r = hash(`${f}:${k}`), t = (f - F0) / (F1 - F0), soldP = .34 + .3 * t + ([1, 2, 3].includes(k) ? .08 : 0);
  const status = r < soldP ? 'sold' : r < soldP + .09 ? 'reserved' : 'available';
  return { f, k, lv, no, type, T, price, psf: Math.round(psf * prem), status, facing: FACING[k], face: FACE_SHORT[k], ph };
}
export const floorUnits = (f) => Array.from({ length: UNITS }, (_, k) => unit(f, k)).filter(Boolean);
export const totals = (() => { let n = 0, av = 0, minP = 1e12; for (let f = F0; f <= F1; f++) floorUnits(f).forEach((u) => { if (u.ph && f === F1) return; n++; if (u.status === 'available') av++; minP = Math.min(minP, u.price); }); return { n, av, minP }; })();
export const rm = (n) => 'RM ' + Math.round(n).toLocaleString('en-MY');
