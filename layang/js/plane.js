// Procedural wide-body airliner (A330neo proportions) in Layang Air livery. Units: metres. Nose points +z, up +y.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const NAVY = '#0c3346', GOLD = '#e2a83c', CREAM = '#f5f4ef';
const L = 63.7, R = 2.82;

export function swallowPath(x, cx, cy, s) {
  // stylised swallow in a 100x100 box, centred at cx,cy, scaled by s/100
  x.save(); x.translate(cx - s / 2, cy - s / 2); x.scale(s / 100, s / 100);
  x.beginPath();
  x.moveTo(50, 47); x.bezierCurveTo(38, 36, 20, 24, 2, 22); x.bezierCurveTo(18, 34, 30, 46, 44, 56);
  x.lineTo(40, 95); x.lineTo(50, 70); x.lineTo(60, 95); x.lineTo(56, 56);
  x.bezierCurveTo(70, 46, 82, 34, 98, 22); x.bezierCurveTo(80, 24, 62, 36, 50, 47); x.closePath();
  x.moveTo(56, 40); x.arc(50, 40, 6, 0, Math.PI * 2);
  x.restore();
}

function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

/* ---------- fuselage ---------- */
function fuselageShape(t) {
  let r = R, yc = 0;
  if (t < .2) { const s = t / .2, k = s * s * (3 - 2 * s); r = R * (.1 + .9 * k); yc = (R - r) * .82; }
  else if (t > .865) { const s = (t - .865) / .135; r = R * Math.pow(Math.max(0, 1 - Math.pow(s, 2.3)), .5); yc = -R * .14 * s * s; }
  return { r, yc };
}
function fuselageGeo(NS = 110, NR = 56) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, { r, yc } = fuselageShape(t), z = -L / 2 + t * L;
    for (let j = 0; j <= NR; j++) { const f = j / NR * Math.PI * 2; pos.push(Math.sin(f) * r, yc - Math.cos(f) * r, z); uv.push(t, j / NR); }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function liveryTex() {
  return canvas(4096, 1024, (x, W, H) => {
    x.fillStyle = CREAM; x.fillRect(0, 0, W, H);
    const tx = (t) => t * W, vy = (v) => v * H;
    // belly (v≈0 and v≈1 are the underside)
    x.fillStyle = '#c9ccd0'; x.fillRect(0, 0, W, vy(.09)); x.fillRect(0, vy(.91), W, vy(.09));
    // tail swoosh: navy sweep with a gold edge rising from the belly toward the fin, both sides
    for (const side of [0, 1]) {
      x.save(); if (side) { x.translate(0, H); x.scale(1, -1); }
      x.fillStyle = NAVY; x.beginPath(); x.moveTo(tx(0), vy(.0)); x.lineTo(tx(0), vy(.5)); x.lineTo(tx(.13), vy(.5));
      x.bezierCurveTo(tx(.2), vy(.38), tx(.26), vy(.2), tx(.36), vy(.07)); x.lineTo(tx(.36), vy(0)); x.closePath(); x.fill();
      x.strokeStyle = GOLD; x.lineWidth = 16; x.beginPath(); x.moveTo(tx(.15), vy(.5)); x.bezierCurveTo(tx(.22), vy(.38), tx(.28), vy(.2), tx(.385), vy(.075)); x.stroke();
      x.lineWidth = 6; x.beginPath(); x.moveTo(tx(.17), vy(.5)); x.bezierCurveTo(tx(.24), vy(.38), tx(.3), vy(.22), tx(.41), vy(.085)); x.stroke();
      // belly line in navy along the cabin
      x.fillStyle = NAVY; x.fillRect(tx(.36), vy(.07), tx(.52), vy(.025));
      x.restore();
    }
    // cabin windows and doors, both sides
    const winRow = (v) => {
      for (let t = .215; t < .835; t += .0083) {
        if ([.235, .425, .625, .805].some((d) => Math.abs(t - d) < .012)) continue;
        x.fillStyle = '#9aa3ab'; x.beginPath(); x.roundRect(tx(t) - 9, vy(v) - 13, 18, 26, 8); x.fill();
        x.fillStyle = '#18222c'; x.beginPath(); x.roundRect(tx(t) - 7, vy(v) - 11, 14, 22, 7); x.fill();
      }
      for (const d of [.235, .425, .625, .805]) { x.strokeStyle = '#a7adb3'; x.lineWidth = 3; x.beginPath(); x.roundRect(tx(d) - 34, vy(v) - 56, 68, 112, 14); x.stroke(); x.fillStyle = '#18222c'; x.beginPath(); x.roundRect(tx(d) - 7, vy(v) - 30, 14, 20, 6); x.fill(); }
    };
    winRow(.285); winRow(.715);
    // cockpit windscreen: four panes per side with cream frames
    for (const side of [0, 1]) {
      x.save(); if (side) { x.translate(0, H); x.scale(1, -1); }
      const pane = (t0, t1, v0, v1, v1b) => { x.beginPath(); x.moveTo(tx(t0), vy(v0)); x.lineTo(tx(t1), vy(v0)); x.lineTo(tx(t1), vy(v1b)); x.lineTo(tx(t0), vy(v1)); x.closePath(); x.fillStyle = '#141c24'; x.fill(); x.strokeStyle = '#d8d8d2'; x.lineWidth = 3; x.stroke(); };
      pane(.9175, .925, .292, .335, .345); pane(.926, .934, .29, .345, .36); pane(.935, .943, .29, .36, .385); pane(.944, .9505, .30, .385, .44);
      x.restore();
    }
    // nose radome
    x.fillStyle = '#e9e8e2'; x.fillRect(tx(.985), 0, W, H);
    // titles: right side (+x, v .25..5) reads nose→tail, so it is drawn rotated 180°; left side drawn normally
    const title = (rot, v) => {
      x.save(); x.translate(tx(.62), vy(v)); if (rot) x.scale(1, -1); else x.scale(-1, 1);
      x.font = '700 92px "DM Serif Display", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = NAVY; x.fillText('Layang Air', 0, 0);
      swallowPath(x, 330, -4, 96); x.fillStyle = GOLD; x.fill('evenodd');
      x.restore();
    };
    title(true, .385); title(false, .615);
    // registration near the tail
    x.font = '600 34px "Plus Jakarta Sans", Arial, sans-serif'; x.fillStyle = '#26323c'; x.textAlign = 'center';
    x.save(); x.translate(tx(.115), vy(.33)); x.scale(1, -1); x.fillText('9M-LYA', 0, 0); x.restore();
    x.save(); x.translate(tx(.115), vy(.67)); x.scale(-1, 1); x.fillText('9M-LYA', 0, 0); x.restore();
    // panel lines
    x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; for (let t = .2; t < .87; t += .035) { x.beginPath(); x.moveTo(tx(t), 0); x.lineTo(tx(t), H); x.stroke(); }
  });
}

/* ---------- lofted surfaces ---------- */
const AF = (() => { const n = 18, up = [], lo = []; for (let i = 0; i <= n; i++) { const b = i / n * Math.PI, xx = (1 - Math.cos(b)) / 2, yt = 5 * (.2969 * Math.sqrt(xx) - .126 * xx - .3516 * xx * xx + .2843 * xx ** 3 - .1036 * xx ** 4); up.push([xx, yt]); lo.push([xx, -yt]); } return [...up.slice().reverse(), ...lo.slice(1)]; })();
function loft(sections, chordDir, thickDir, cap = true) {
  const pos = [], uv = [], idx = [], n = AF.length;
  sections.forEach((s, j) => AF.forEach(([u, t]) => { const p = s.p.clone().addScaledVector(chordDir, u * s.c).addScaledVector(thickDir, t * s.c * s.th + (s.camber || 0) * s.c * Math.sin(u * Math.PI)); pos.push(p.x, p.y, p.z); uv.push(u, j / (sections.length - 1)); }));
  for (let j = 0; j < sections.length - 1; j++) for (let k = 0; k < n - 1; k++) { const a = j * n + k, b = a + n; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  if (cap) { const last = (sections.length - 1) * n, c0 = pos.length / 3; const cp = sections[sections.length - 1]; const cc = cp.p.clone().addScaledVector(chordDir, cp.c * .4); pos.push(cc.x, cc.y, cc.z); uv.push(.4, 1); for (let k = 0; k < n - 1; k++) idx.push(last + k, c0, last + k + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z), BACK = V(0, 0, -1), UP = V(0, 1, 0), SIDE = V(1, 0, 0);
function wingGeo(sign) {
  const sw = Math.tan(31 * Math.PI / 180), dh = Math.tan(5.5 * Math.PI / 180);
  const st = (x, c, th, extraY = 0, zOff = 0) => ({ p: V(sign * x, -1.55 + (x - 2.2) * dh + extraY, 5.2 - (x - 2.2) * sw + zOff), c, th, camber: .012 });
  const secs = [st(1.2, 11.2, .15), st(2.2, 10.8, .145), st(10, 6.6, .115), st(29.6, 2.3, .1), st(30.6, 1.9, .09, .3), st(31.2, 1.45, .08, 1.3, -.4), st(31.4, 1.0, .08, 3.0, -1.0)];
  return loft(secs, BACK, UP);
}
function hstabGeo(sign) {
  const sw = Math.tan(33 * Math.PI / 180), dh = Math.tan(7 * Math.PI / 180);
  const st = (x, c) => ({ p: V(sign * x, .9 + x * dh, -22.6 - x * sw), c, th: .1 });
  return loft([st(.4, 5.6), st(1.4, 5.2), st(9.6, 1.9)], BACK, UP);
}
function finGeo() {
  const sw = Math.tan(40 * Math.PI / 180);
  const st = (h, c) => ({ p: V(0, 2.25 + h, -20.4 - h * sw), c, th: .1 });
  return loft([st(-.6, 9.6), st(0, 9.2), st(9.6, 3.3)], BACK, SIDE);
}
function finTex() {
  return canvas(1024, 1024, (x, W, H) => {
    x.fillStyle = NAVY; x.fillRect(0, 0, W, H);
    x.fillStyle = GOLD; x.fillRect(0, 0, W, 22);
    x.save(); x.translate(W * .42, H * .55); x.rotate(Math.PI / 2); swallowPath(x, 0, 0, 520); x.restore(); x.fill('evenodd');
  });
}

/* ---------- engines ---------- */
function nacelleGeo() {
  const pts = [[.95, 0], [1.2, .6], [1.45, 1.8], [1.56, 3.2], [1.55, 4.4], [1.5, 5.3], [1.42, 5.85], [1.3, 6.02], [1.2, 5.92], [1.18, 5.6]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 48); g.rotateX(Math.PI / 2); return g;
}
function fanTex() {
  return canvas(512, 512, (x, W, H) => {
    x.fillStyle = '#0a0c10'; x.fillRect(0, 0, W, H); x.translate(W / 2, H / 2);
    for (let i = 0; i < 22; i++) { x.rotate(Math.PI * 2 / 22); const g = x.createLinearGradient(0, 0, 0, -250); g.addColorStop(0, '#2a2f36'); g.addColorStop(1, '#5a626c'); x.fillStyle = g; x.beginPath(); x.moveTo(-6, -40); x.quadraticCurveTo(30, -150, 8, -252); x.lineTo(-14, -252); x.quadraticCurveTo(8, -150, -20, -40); x.fill(); }
    x.fillStyle = '#d9d9d9'; x.beginPath(); x.arc(0, 0, 42, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 8; x.beginPath(); x.arc(0, 0, 30, .3, 2.6); x.stroke();
  });
}

/* ---------- assemble ---------- */
let shared = null;
function materials() {
  if (shared) return shared;
  shared = {
    paint: new THREE.MeshPhysicalMaterial({ map: liveryTex(), roughness: .32, clearcoat: .8, clearcoatRoughness: .12, metalness: 0 }),
    wing: new THREE.MeshPhysicalMaterial({ color: 0xc7ccd1, roughness: .42, metalness: .35, clearcoat: .3 }),
    fin: new THREE.MeshPhysicalMaterial({ map: finTex(), roughness: .3, clearcoat: .8, side: THREE.DoubleSide }),
    nacelle: new THREE.MeshPhysicalMaterial({ color: NAVY, roughness: .28, clearcoat: .9, side: THREE.DoubleSide }),
    lip: new THREE.MeshStandardMaterial({ color: 0xe8eaec, metalness: 1, roughness: .15 }),
    fan: new THREE.MeshStandardMaterial({ map: fanTex(), metalness: .6, roughness: .4 }),
    core: new THREE.MeshStandardMaterial({ color: 0x3b3f45, metalness: .8, roughness: .45 }),
    gear: new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: .7, roughness: .4 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .85 }),
    red: new THREE.MeshBasicMaterial({ color: new THREE.Color(6, .3, .2), toneMapped: false }),
    green: new THREE.MeshBasicMaterial({ color: new THREE.Color(.2, 5, .6), toneMapped: false }),
    white: new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 6, 6), toneMapped: false })
  };
  return shared;
}

export function buildPlane({ gear = false, lights = true } = {}) {
  const M = materials(), g = new THREE.Group();
  const fus = new THREE.Mesh(fuselageGeo(), M.paint); g.add(fus);
  const wings = new THREE.Mesh(mergeGeometries([wingGeo(1), wingGeo(-1), hstabGeo(1), hstabGeo(-1)]), M.wing); g.add(wings);
  // wing-body fairing
  const fair = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), M.paint.clone()); fair.material.map = null; fair.material.color.set('#c9ccd0'); fair.scale.set(3.0, 1.4, 11); fair.position.set(0, -2.1, 0); g.add(fair);
  const fin = new THREE.Mesh(finGeo(), M.fin); g.add(fin);
  const nac = nacelleGeo(), fanG = new THREE.CircleGeometry(1.2, 48), coreG = new THREE.ConeGeometry(.55, 1.6, 32);
  for (const s of [1, -1]) {
    const e = new THREE.Group(); e.position.set(s * 9.4, -2.75, -.6); g.add(e);
    e.add(new THREE.Mesh(nac, M.nacelle));
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.25, .07, 12, 48), M.lip); lip.position.z = 5.98; e.add(lip);
    const fan = new THREE.Mesh(fanG, M.fan); fan.position.z = 5.3; e.add(fan); e.userData.fan = fan;
    const core = new THREE.Mesh(coreG, M.core); core.rotation.x = -Math.PI / 2; core.position.z = -.55; e.add(core);
    const pylon = new THREE.Mesh(loft([{ p: V(0, 1.1, 4.2), c: 6.6, th: .14 }, { p: V(0, 2.1, 2.6), c: 7.2, th: .12 }], BACK, SIDE, false), M.wing); e.add(pylon);
  }
  if (gear) {
    const strutG = new THREE.CylinderGeometry(.16, .16, 1, 12), wheelG = new THREE.CylinderGeometry(.62, .62, .42, 28); wheelG.rotateZ(Math.PI / 2);
    for (const s of [1, -1]) {
      const st = new THREE.Mesh(strutG, M.gear); st.scale.y = 2.7; st.position.set(s * 5.3, -2.95, -2.2); g.add(st);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(.25, .25, 2.4), M.gear); beam.position.set(s * 5.3, -4.25, -2.2); g.add(beam);
      for (const dz of [-1, 1]) for (const dx of [-.42, .42]) { const w = new THREE.Mesh(wheelG, M.tyre); w.position.set(s * 5.3 + dx, -4.25, -2.2 + dz * .95); g.add(w); }
    }
    const ns = new THREE.Mesh(strutG, M.gear); ns.scale.y = 1.7; ns.position.set(0, -3.4, 24.6); g.add(ns);
    const nw = new THREE.CylinderGeometry(.46, .46, .3, 24); nw.rotateZ(Math.PI / 2);
    for (const dx of [-.25, .25]) { const w = new THREE.Mesh(nw, M.tyre); w.position.set(dx, -4.35, 24.6); g.add(w); }
  }
  if (lights) {
    const dot = new THREE.SphereGeometry(.22, 10, 8);
    const add = (m, x, y, z) => { const o = new THREE.Mesh(dot, m); o.position.set(x, y, z); g.add(o); return o; };
    g.userData.nav = [add(M.red, -31.3, 1.6, -13.2), add(M.green, 31.3, 1.6, -13.2), add(M.white, 0, 3.0, -31.5)];
    g.userData.beacon = [add(M.red, 0, 2.9, -2), add(M.red, 0, -2.9, 2)];
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.tick = (t) => {
    g.children.forEach((c) => { if (c.userData.fan) c.userData.fan.rotation.z = t * 9; });
    if (g.userData.beacon) { const on = (t % 1.2) < .08; g.userData.beacon.forEach((b) => { b.visible = on; }); }
  };
  return g;
}
