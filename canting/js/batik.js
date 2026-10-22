// Canting — the batik itself, in 2D canvases: cloth colour, wax resist and the crackle that lets dye creep through.
export const N = 1024;
export const CLOTH = [246, 241, 230];

export const DYES = [
  { id: 'kunyit', name: 'Kuning kunyit', note: 'Turmeric', rgb: [236, 178, 52] },
  { id: 'mengkudu', name: 'Merah mengkudu', note: 'Noni root', rgb: [190, 58, 44] },
  { id: 'daun', name: 'Hijau daun', note: 'Indigo over turmeric', rgb: [86, 140, 82] },
  { id: 'nila', name: 'Biru nila', note: 'Indigo', rgb: [38, 70, 140] },
  { id: 'soga', name: 'Coklat soga', note: 'Soga bark', rgb: [128, 76, 40] },
  { id: 'ungu', name: 'Ungu manggis', note: 'Mangosteen rind', rgb: [104, 52, 108] },
];

export const MOTIFS = [
  { id: 'bunga', name: 'Bunga raya' },
  { id: 'rebung', name: 'Pucuk rebung' },
  { id: 'daun', name: 'Daun' },
  { id: 'awan', name: 'Awan larat' },
  { id: 'kawung', name: 'Kawung' },
];

const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5 | 0, ((s ^ (s >>> 7)) >>> 0) / 4294967296)); }

// motif paths, drawn in unit space (about -1..1)
const MOTIF_DRAW = {
  bunga(x) {
    for (let i = 0; i < 5; i++) { x.save(); x.rotate(i / 5 * Math.PI * 2); x.beginPath(); x.moveTo(0, -.16); x.bezierCurveTo(.42, -.36, .5, -.92, 0, -.98); x.bezierCurveTo(-.5, -.92, -.42, -.36, 0, -.16); x.stroke();
      x.beginPath(); x.moveTo(0, -.24); x.quadraticCurveTo(.06, -.55, 0, -.78); x.stroke(); x.restore(); }
    x.beginPath(); x.arc(0, 0, .14, 0, 7); x.fill();
    for (let i = 0; i < 5; i++) { const a = (i + .5) / 5 * Math.PI * 2; x.beginPath(); x.arc(Math.sin(a) * .3, -Math.cos(a) * .3, .035, 0, 7); x.fill(); }
  },
  rebung(x) {
    x.beginPath(); x.moveTo(0, -1); x.lineTo(.5, .9); x.lineTo(-.5, .9); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(0, -.7); x.lineTo(.3, .55); x.lineTo(-.3, .55); x.closePath(); x.stroke();
    for (let i = 0; i < 4; i++) { const y = -.3 + i * .28, w = .1 + i * .07; x.beginPath(); x.moveTo(-w, y); x.lineTo(0, y - .14); x.lineTo(w, y); x.stroke(); }
    x.beginPath(); x.moveTo(0, -.6); x.lineTo(0, .55); x.stroke();
  },
  daun(x) {
    x.beginPath(); x.moveTo(0, -1); x.bezierCurveTo(.62, -.55, .58, .45, 0, .95); x.bezierCurveTo(-.58, .45, -.62, -.55, 0, -1); x.stroke();
    x.beginPath(); x.moveTo(0, -.9); x.lineTo(0, .95); x.stroke();
    for (let i = 0; i < 6; i++) { const y = -.6 + i * .24, w = .36 - Math.abs(i - 2.5) * .06; x.beginPath(); x.moveTo(0, y + .12); x.quadraticCurveTo(w * .6, y, w, y - .1); x.moveTo(0, y + .12); x.quadraticCurveTo(-w * .6, y, -w, y - .1); x.stroke(); }
  },
  awan(x) {
    const spiral = (cx, cy, r, dir) => { x.beginPath(); for (let t = 0; t <= 1; t += .02) { const a = t * Math.PI * 3.2 * dir, rr = r * (1 - t * .8); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
    x.beginPath(); x.moveTo(-1, .2); x.bezierCurveTo(-.6, -.5, -.1, .6, .3, -.1); x.bezierCurveTo(.55, -.5, .85, -.2, 1, .1); x.stroke();
    spiral(-.55, -.25, .42, 1); spiral(.35, .35, .38, -1); spiral(.72, -.45, .24, 1);
  },
  kawung(x) {
    for (let i = 0; i < 4; i++) { x.save(); x.rotate(i * Math.PI / 2 + Math.PI / 4); x.beginPath(); x.ellipse(0, -.5, .26, .46, 0, 0, 7); x.stroke(); x.beginPath(); x.ellipse(0, -.5, .1, .22, 0, 0, 7); x.stroke(); x.restore(); }
    x.beginPath(); x.arc(0, 0, .08, 0, 7); x.fill();
  },
};

export class Batik {
  constructor() {
    this.color = mk(); this.wax = mk(); this.crack = mk();
    this.cx = this.color.getContext('2d', { willReadFrequently: true }); this.wx = this.wax.getContext('2d', { willReadFrequently: true });
    this.wx.lineCap = 'round'; this.wx.lineJoin = 'round';
    this._makeCrack(); this._makeNoise(); this.reset(); this.undo = [];
  }
  _makeCrack() {
    const x = this.crack.getContext('2d'), r = rng(7); x.strokeStyle = '#fff'; x.lineCap = 'round';
    for (let i = 0; i < 340; i++) { let px = r() * N, py = r() * N, a = r() * Math.PI * 2; x.globalAlpha = .5 + r() * .5; x.lineWidth = .6 + r() * 1.1; x.beginPath(); x.moveTo(px, py);
      const segs = 5 + (r() * 12 | 0); for (let k = 0; k < segs; k++) { a += (r() - .5) * 1.1; const l = 6 + r() * 16; px += Math.cos(a) * l; py += Math.sin(a) * l; x.lineTo(px, py); if (r() < .12) { const bx = px, by = py; x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + 1.3) * l, by + Math.sin(a + 1.3) * l); x.moveTo(px, py); } } x.stroke(); }
    this.crackA = x.getImageData(0, 0, N, N).data;
  }
  _makeNoise() { // uneven absorption, so dye looks hand-dipped rather than flat
    const n = new Float32Array(N * N), r = rng(3), G = 32, g = new Float32Array((G + 1) * (G + 1)); for (let i = 0; i < g.length; i++) g[i] = r();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const fx = x / N * G, fy = y / N * G, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = g[iy * (G + 1) + ix], b = g[iy * (G + 1) + ix + 1], c = g[(iy + 1) * (G + 1) + ix], d = g[(iy + 1) * (G + 1) + ix + 1]; n[y * N + x] = .86 + .2 * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy); }
    this.noise = n;
  }
  reset() { this.cx.fillStyle = `rgb(${CLOTH})`; this.cx.fillRect(0, 0, N, N); this.wx.clearRect(0, 0, N, N); this.dyes = 0; }
  save() { this.undo.push({ w: this.wx.getImageData(0, 0, N, N), c: this.cx.getImageData(0, 0, N, N), dyes: this.dyes }); if (this.undo.length > 8) this.undo.shift(); }
  restore() { const s = this.undo.pop(); if (!s) return false; this.wx.putImageData(s.w, 0, 0); this.cx.putImageData(s.c, 0, 0); this.dyes = s.dyes; return true; }
  // u,v in 0..1 (v up). Width in canvas px.
  line(u0, v0, u1, v1, w) { const x = this.wx; x.strokeStyle = '#fff'; x.lineWidth = w; x.beginPath(); x.moveTo(u0 * N, (1 - v0) * N); x.lineTo(u1 * N, (1 - v1) * N); x.stroke(); }
  dot(u, v, w) { const x = this.wx; x.fillStyle = '#fff'; x.beginPath(); x.arc(u * N, (1 - v) * N, w / 2, 0, 7); x.fill(); }
  stamp(id, u, v, size = 120, rot = 0) {
    const x = this.wx; x.save(); x.translate(u * N, (1 - v) * N); x.rotate(rot); x.scale(size / 2, size / 2); x.strokeStyle = x.fillStyle = '#fff'; x.lineWidth = 9 / size; MOTIF_DRAW[id](x); x.restore();
  }
  hasWax() { const d = this.wx.getImageData(0, 0, N, N).data; for (let i = 3; i < d.length; i += 64) if (d[i] > 20) return true; return false; }
  dye(rgb, strength = 1) {
    const ci = this.cx.getImageData(0, 0, N, N), c = ci.data, w = this.wx.getImageData(0, 0, N, N).data, k = this.crackA, n = this.noise;
    const dr = rgb[0] / 255, dg = rgb[1] / 255, db = rgb[2] / 255;
    for (let p = 0, i = 0; p < N * N; p++, i += 4) {
      const wa = w[i + 3] / 255, eff = (1 - wa) + wa * (k[i + 3] / 255) * .6, f = Math.min(1, eff * strength * n[p]);
      c[i] *= 1 - f * (1 - dr); c[i + 1] *= 1 - f * (1 - dg); c[i + 2] *= 1 - f * (1 - db);
    }
    this.cx.putImageData(ci, 0, 0); this.dyes++;
  }
  lorod() { this.wx.clearRect(0, 0, N, N); }
  // a finished design, for the hero cloth and the shop
  auto(seed, palette) {
    const r = rng(seed), M = MOTIFS.map((m) => m.id); this.reset();
    const a = M[(r() * M.length) | 0], b = M[(r() * M.length) | 0], cols = 4 + ((r() * 3) | 0), sz = N / cols;
    for (let y = 0; y < cols; y++) for (let x = 0; x < cols; x++) this.stamp(a, (x + .5) / cols, (y + .5) / cols, sz * .78, (x + y) % 2 ? Math.PI : 0);
    for (let i = 0; i < 2; i++) { const yy = i ? .97 : .03; this.line(0, yy, 1, yy, 10); for (let x = 0; x < 24; x++) this.stamp('rebung', (x + .5) / 24, i ? .925 : .075, 40, i ? Math.PI : 0); }
    this.dye(palette[0], 1);
    for (let y = 0; y < cols; y++) for (let x = 0; x < cols; x++) { this.stamp(b, x / cols, y / cols, sz * .4, r() * 6); for (let k = 0; k < 6; k++) this.dot(x / cols + (r() - .5) * .04, y / cols + (r() - .5) * .04, 6); }
    this.dye(palette[1], 1);
    if (palette[2]) { for (let i = 0; i < 70; i++) this.dot(r(), r(), 5 + r() * 8); this.dye(palette[2], .85); }
    this.lorod();
  }
  // a flat image with a hint of weave, for <img> use
  toImage(scale = .5) {
    const s = N * scale, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.drawImage(this.color, 0, 0, s, s);
    x.globalAlpha = .07; x.fillStyle = '#000'; for (let i = 0; i < s; i += 2) { x.fillRect(i, 0, 1, s); x.fillRect(0, i, s, 1); }
    return c.toDataURL('image/jpeg', .85);
  }
}

export function motifPreview(id, px = 56, color = '#3b2a1a') {
  const c = document.createElement('canvas'); c.width = c.height = px * 2; const x = c.getContext('2d');
  x.translate(px, px); x.scale(px * .82, px * .82); x.strokeStyle = x.fillStyle = color; x.lineWidth = .07; x.lineCap = x.lineJoin = 'round'; MOTIF_DRAW[id](x); return c;
}
