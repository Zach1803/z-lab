// Architectural floor plans drawn as SVG (metres → px). Rooms, walls, doors, windows, a little furniture and dimensions.
const S = 40, WALL = 6, IN = 3;
const R = (x, y, w, h, name, area) => ({ x, y, w, h, name, area: area ?? Math.round(w * h * 10) / 10 });
export const PLANS = {
  A: { w: 10.4, h: 7.7, bal: { side: 'bottom', d: 1.7 }, rooms: [R(0, 0, 4.6, 4.4, 'Living & dining'), R(4.6, 0, 2.4, 2.9, 'Kitchen'), R(7, 0, 3.4, 3.6, 'Bedroom 2'), R(4.6, 2.9, 2.4, 1.8, 'Bath 2'), R(7, 3.6, 3.4, 4.1, 'Master bedroom'), R(0, 4.4, 2.6, 3.3, 'Utility'), R(2.6, 4.4, 2, 3.3, 'Bath 1'), R(4.6, 4.7, 2.4, 3, 'Foyer')],
       doors: [[4.6, 6.2, 'v'], [7, 1.8, 'v'], [7, 5.4, 'v'], [5.8, 2.9, 'h'], [3.6, 4.4, 'h'], [1.3, 4.4, 'h']], windows: [[0, 0, 4.6, 'top'], [7, 0, 3.4, 'top'], [7, 7.7, 3.4, 'bottom']], entry: [5.8, 7.7],
       furn: [['sofa', .4, 2.6, 2.6, .9], ['table', 2.6, .6, 1.6, .9], ['bed', 7.6, 4.5, 1.8, 2], ['bed', 7.5, .5, 1.2, 1.9], ['counter', 4.7, .1, 2.2, .6]] },
  B: { w: 12, h: 9.2, bal: { side: 'top', d: 1.7 }, rooms: [R(0, 0, 5.4, 5, 'Living'), R(5.4, 0, 3.2, 3.4, 'Dining'), R(8.6, 0, 3.4, 3.8, 'Master bedroom'), R(0, 5, 3.4, 4.2, 'Bedroom 2'), R(3.4, 5, 2.6, 2.2, 'Bath 2'), R(3.4, 7.2, 2.6, 2, 'Utility'), R(6, 3.4, 2.6, 2.8, 'Kitchen'), R(8.6, 3.8, 3.4, 2.2, 'Master bath'), R(6, 6.2, 2.6, 3, 'Foyer'), R(8.6, 6, 3.4, 3.2, 'Bedroom 3')],
       doors: [[3.4, 6.2, 'v'], [8.6, 2.2, 'v'], [8.6, 7.6, 'v'], [7.3, 3.4, 'h'], [10.3, 3.8, 'h'], [4.7, 7.2, 'h']], windows: [[0, 0, 5.4, 'top'], [5.4, 0, 3.2, 'top'], [8.6, 0, 3.4, 'top'], [0, 9.2, 3.4, 'bottom'], [8.6, 9.2, 3.4, 'bottom']], entry: [7.3, 9.2],
       furn: [['sofa', .4, 3.6, 3, .9], ['table', 5.8, .8, 2.2, 1], ['bed', 9.4, .6, 1.8, 2], ['bed', .6, 6.1, 1.4, 2], ['bed', 9.3, 6.6, 1.4, 2], ['counter', 6.1, 3.5, .6, 2.6]] },
  C: { w: 12.6, h: 10.6, bal: { side: 'left', d: 1.7 }, rooms: [R(0, 0, 6, 5.2, 'Living & dining'), R(6, 0, 3, 3, 'Study'), R(9, 0, 3.6, 4.2, 'Master bedroom'), R(9, 4.2, 3.6, 2.4, 'Master bath'), R(0, 5.2, 3.6, 2.9, 'Dry kitchen'), R(0, 8.1, 3.6, 2.5, 'Wet kitchen'), R(3.6, 5.2, 2.4, 2.1, 'Bath 2'), R(3.6, 7.3, 2.4, 3.3, 'Bedroom 4 / maid'), R(6, 3, 3, 4.6, 'Foyer'), R(6, 7.6, 3.2, 3, 'Bedroom 2'), R(9.2, 6.6, 3.4, 4, 'Bedroom 3')],
       doors: [[9, 2.4, 'v'], [10.8, 4.2, 'h'], [6, 6.4, 'v'], [7.6, 7.6, 'h'], [9.2, 8.6, 'v'], [3.6, 8.8, 'v'], [4.8, 7.3, 'h'], [1.8, 8.1, 'h']], windows: [[0, 0, 6, 'top'], [6, 0, 3, 'top'], [9, 0, 3.6, 'top'], [12.6, 0, 4.2, 'right'], [12.6, 6.6, 4, 'right'], [6, 10.6, 3.2, 'bottom']], entry: [7.5, 3],
       furn: [['sofa', .5, 3.4, 3.2, .9], ['table', 3.8, .7, 1.8, 1], ['bed', 9.8, .6, 1.8, 2], ['bed', 6.6, 8.2, 1.4, 2], ['bed', 9.9, 7.4, 1.4, 2], ['desk', 6.3, .3, 2.2, .7], ['counter', .1, 5.3, .6, 2.7]] },
  D: { w: 15, h: 12, bal: { side: 'top', d: 2.4 }, rooms: [R(0, 0, 8, 6, 'Double-height living'), R(8, 0, 3.6, 4.4, 'Dining'), R(11.6, 0, 3.4, 4.4, 'Bedroom 4'), R(8, 4.4, 3.6, 3.2, 'Dry kitchen'), R(11.6, 4.4, 3.4, 2.4, 'Bath 4'), R(0, 6, 3.4, 3.4, 'Family'), R(3.4, 6, 2.6, 3.4, 'Stair'), R(6, 6, 2, 3.4, 'Powder'), R(8, 7.6, 3.6, 2.6, 'Wet kitchen'), R(11.6, 6.8, 3.4, 5.2, 'Guest suite'), R(0, 9.4, 6, 2.6, 'Private lift lobby'), R(6, 9.4, 5.6, 2.6, 'Utility & maid')],
       doors: [[8, 2.2, 'v'], [11.6, 2.2, 'v'], [9.8, 4.4, 'h'], [13.3, 4.4, 'h'], [11.6, 8.8, 'v'], [7, 6, 'h'], [3, 9.4, 'h'], [8.8, 9.4, 'h']], windows: [[0, 0, 8, 'top'], [8, 0, 3.6, 'top'], [11.6, 0, 3.4, 'top'], [15, 0, 4.4, 'right'], [15, 6.8, 5.2, 'right']], entry: [3, 12], stair: [3.4, 6, 2.6, 3.4],
       furn: [['sofa', .8, 3.6, 4.2, 1], ['sofa', .4, 6.6, 2.4, .9], ['table', 8.6, 1, 2.4, 1.2], ['bed', 12.2, .6, 1.8, 2], ['bed', 12.4, 8.6, 1.8, 2], ['counter', 8.1, 4.5, 3.4, .6]] }
};
const px = (m) => +(m * S).toFixed(1);
export function planSVG(type) {
  const p = PLANS[type], pad = 70, bal = p.bal, W = px(p.w), H = px(p.h);
  const off = { left: bal.side === 'left' ? px(bal.d) : 0, top: bal.side === 'top' ? px(bal.d) : 0 };
  const VW = W + pad * 2 + (bal.side === 'left' || bal.side === 'right' ? px(bal.d) : 0), VH = H + pad * 2 + (bal.side === 'top' || bal.side === 'bottom' ? px(bal.d) : 0);
  const X = (m) => pad + off.left + px(m), Y = (m) => pad + off.top + px(m);
  let s = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${type === 'D' ? 'Penthouse' : 'Type ' + type} floor plan" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><pattern id="hatch${type}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--plan-hatch)" stroke-width="1"/></pattern></defs>`;
  // balcony
  const bx = bal.side === 'left' ? pad : X(0), by = bal.side === 'top' ? pad : bal.side === 'bottom' ? Y(p.h) : Y(0), bw = bal.side === 'left' ? px(bal.d) : W, bh = bal.side === 'left' ? H : px(bal.d);
  s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#hatch${type})" stroke="var(--plan-line)" stroke-width="1.5"/><text x="${bx + bw / 2}" y="${by + bh / 2 + 4}" text-anchor="middle" class="pl-sm">BALCONY</text>`;
  // rooms
  p.rooms.forEach((r) => { s += `<rect x="${X(r.x)}" y="${Y(r.y)}" width="${px(r.w)}" height="${px(r.h)}" fill="${/Bath|Powder/.test(r.name) ? 'var(--plan-wet)' : 'var(--plan-room)'}" stroke="var(--plan-wall)" stroke-width="${IN}"/>`; });
  if (p.stair) { const [x, y, w, h] = p.stair; for (let i = 1; i < 9; i++) s += `<line x1="${X(x)}" y1="${Y(y) + px(h) * i / 9}" x2="${X(x + w)}" y2="${Y(y) + px(h) * i / 9}" stroke="var(--plan-line)" stroke-width="1"/>`; s += `<path d="M${X(x + w / 2)} ${Y(y + h) - 8}V${Y(y) + 10}l-5 8m5-8 5 8" fill="none" stroke="var(--plan-line)" stroke-width="1.4"/>`; }
  // furniture
  p.furn.forEach(([k, x, y, w, h]) => { const a = `x="${X(x)}" y="${Y(y)}" width="${px(w)}" height="${px(h)}"`; if (k === 'bed') s += `<rect ${a} rx="4" fill="none" stroke="var(--plan-line)" stroke-width="1.2"/><rect x="${X(x) + 6}" y="${Y(y) + 6}" width="${px(w) - 12}" height="16" rx="5" fill="none" stroke="var(--plan-line)" stroke-width="1"/>`; else if (k === 'table') s += `<rect ${a} rx="6" fill="none" stroke="var(--plan-line)" stroke-width="1.2"/>${[0, 1, 2].map((i) => `<circle cx="${X(x) + px(w) * (i + .5) / 3}" cy="${Y(y) - 7}" r="5" fill="none" stroke="var(--plan-line)"/><circle cx="${X(x) + px(w) * (i + .5) / 3}" cy="${Y(y) + px(h) + 7}" r="5" fill="none" stroke="var(--plan-line)"/>`).join('')}`; else s += `<rect ${a} rx="${k === 'sofa' ? 8 : 2}" fill="none" stroke="var(--plan-line)" stroke-width="1.2"/>`; });
  // outer wall
  s += `<rect x="${X(0)}" y="${Y(0)}" width="${W}" height="${H}" fill="none" stroke="var(--plan-wall)" stroke-width="${WALL * 1.6}"/>`;
  // windows (glazing breaks in the outer wall)
  p.windows.forEach(([x, y, len, side]) => { const hz = side === 'top' || side === 'bottom'; const x1 = X(x) + (hz ? 6 : 0), y1 = Y(y) + (hz ? 0 : 6), x2 = hz ? X(x + len) - 6 : X(x), y2 = hz ? Y(y) : Y(y + len) - 6;
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--plan-room)" stroke-width="${WALL * 1.6 - 2}"/><line x1="${x1}" y1="${y1 + (hz ? -3 : 0)}" x2="${x2}" y2="${y2 + (hz ? -3 : 0)}" transform="translate(${hz ? 0 : -3} 0)" stroke="var(--plan-glass)" stroke-width="1.6"/><line x1="${x1}" y1="${y1 + (hz ? 3 : 0)}" x2="${x2}" y2="${y2 + (hz ? 3 : 0)}" transform="translate(${hz ? 0 : 3} 0)" stroke="var(--plan-glass)" stroke-width="1.6"/>`; });
  // doors: gap + swing arc
  p.doors.forEach(([x, y, o]) => { const d = 0.85 * S, cx = X(x), cy = Y(y); if (o === 'v') s += `<line x1="${cx}" y1="${cy - d / 2}" x2="${cx}" y2="${cy + d / 2}" stroke="var(--plan-room)" stroke-width="${IN + 2}"/><path d="M${cx} ${cy - d / 2} a${d} ${d} 0 0 1 ${d} ${d}" fill="none" stroke="var(--plan-line)" stroke-width="1" stroke-dasharray="3 3"/><line x1="${cx}" y1="${cy - d / 2}" x2="${cx + d}" y2="${cy - d / 2}" stroke="var(--plan-line)" stroke-width="1.4"/>`;
    else s += `<line x1="${cx - d / 2}" y1="${cy}" x2="${cx + d / 2}" y2="${cy}" stroke="var(--plan-room)" stroke-width="${IN + 2}"/><path d="M${cx - d / 2} ${cy} a${d} ${d} 0 0 0 ${d} ${d}" fill="none" stroke="var(--plan-line)" stroke-width="1" stroke-dasharray="3 3"/><line x1="${cx - d / 2}" y1="${cy}" x2="${cx - d / 2}" y2="${cy + d}" stroke="var(--plan-line)" stroke-width="1.4"/>`; });
  // entrance
  { const [x, y] = p.entry, cx = X(x), cy = Y(y); s += `<line x1="${cx - 20}" y1="${cy}" x2="${cx + 20}" y2="${cy}" stroke="var(--plan-room)" stroke-width="${WALL * 1.6 + 1}"/><path d="M${cx} ${cy + 26}v-18m-6 6 6-6 6 6" stroke="var(--accent)" stroke-width="2" fill="none"/><text x="${cx}" y="${cy + 42}" text-anchor="middle" class="pl-sm">ENTRY</text>`; }
  // labels
  p.rooms.forEach((r) => { if (r.name === 'Stair') return; const small = r.w < 2.6 || r.h < 2.2; s += `<text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.h / 2) - (small ? 0 : 4)}" text-anchor="middle" class="${small ? 'pl-sm' : 'pl-room'}">${r.name.toUpperCase()}</text>${small ? '' : `<text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.h / 2) + 13}" text-anchor="middle" class="pl-dim">${r.w.toFixed(1)} × ${r.h.toFixed(1)} m</text>`}`; });
  // overall dimensions
  const dimY = Y(p.h) + (bal.side === 'bottom' ? px(bal.d) : 0) + 30, dimX = X(p.w) + 30;
  s += `<g class="pl-dimline"><line x1="${X(0)}" y1="${dimY}" x2="${X(p.w)}" y2="${dimY}"/><line x1="${X(0)}" y1="${dimY - 6}" x2="${X(0)}" y2="${dimY + 6}"/><line x1="${X(p.w)}" y1="${dimY - 6}" x2="${X(p.w)}" y2="${dimY + 6}"/></g><text x="${X(p.w / 2)}" y="${dimY - 7}" text-anchor="middle" class="pl-dim">${p.w.toFixed(1)} m</text>`;
  s += `<g class="pl-dimline"><line x1="${dimX}" y1="${Y(0)}" x2="${dimX}" y2="${Y(p.h)}"/><line x1="${dimX - 6}" y1="${Y(0)}" x2="${dimX + 6}" y2="${Y(0)}"/><line x1="${dimX - 6}" y1="${Y(p.h)}" x2="${dimX + 6}" y2="${Y(p.h)}"/></g><text x="${dimX + 10}" y="${Y(p.h / 2)}" class="pl-dim" transform="rotate(90 ${dimX + 10} ${Y(p.h / 2)})" text-anchor="middle">${p.h.toFixed(1)} m</text>`;
  // north arrow
  s += `<g transform="translate(${VW - 40} 40)"><circle r="16" fill="none" stroke="var(--plan-line)"/><path d="M0 -13 6 8 0 3 -6 8Z" fill="var(--plan-wall)"/><text y="-20" text-anchor="middle" class="pl-sm">N</text></g>`;
  return s + '</svg>';
}
