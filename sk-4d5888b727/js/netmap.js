// Sin-Kung — the network map: real coastlines extruded in 3D, road feeder routes with trucks, air links with aircraft.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const D2R = Math.PI / 180, LON0 = 104, LAT0 = 8;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) / D2R;
export const P = (lat, lon, y = 0) => new THREE.Vector3(lon - LON0, y, -(merc(lat) - merc(LAT0)));

export const SITES = [
  { id: 'hq', name: 'Shah Alam HQ', lat: 3.07, lon: 101.52, kind: 'hq', key: 1 },
  { id: 'portklang', name: 'Port Klang', lat: 2.93, lon: 101.33, kind: 'site', key: 1 },
  { id: 'klia', name: 'KLIA Sepang', lat: 2.75, lon: 101.70, kind: 'site', key: 1 },
  { id: 'bm', name: 'Bukit Mertajam', lat: 5.35, lon: 100.46, kind: 'site' },
  { id: 'butterworth', name: 'Butterworth', lat: 5.42, lon: 100.39, kind: 'site' },
  { id: 'penang', name: 'Penang Airport', lat: 5.29, lon: 100.27, kind: 'site', key: 1 },
  { id: 'valdor', name: 'Valdor (2026)', lat: 5.17, lon: 100.48, kind: 'soon' },
  { id: 'johor', name: 'Johor Bahru', lat: 1.49, lon: 103.68, kind: 'site', key: 1 },
  { id: 'langkawi', name: 'Langkawi hangar', lat: 6.33, lon: 99.73, kind: 'site', key: 1 },
  { id: 'kuching', name: 'Kuching', lat: 1.49, lon: 110.35, kind: 'site', key: 1 },
  { id: 'kk', name: 'Kota Kinabalu', lat: 5.94, lon: 116.05, kind: 'site', key: 1 },
  { id: 'labuan', name: 'Labuan', lat: 5.28, lon: 115.24, kind: 'site' },
  { id: 'shanghai', name: 'Shanghai', lat: 31.33, lon: 121.6, kind: 'site', key: 1 },
  { id: 'hongkong', name: 'Hong Kong', lat: 22.29, lon: 114.2, kind: 'site', key: 1 },
  { id: 'changi', name: 'Singapore Changi', lat: 1.36, lon: 103.99, kind: 'airport', key: 1 },
  { id: 'bkk', name: 'Bangkok', lat: 13.69, lon: 100.75, kind: 'airport', key: 1 },
  { id: 'hatyai', name: 'Hat Yai', lat: 6.93, lon: 100.39, kind: 'airport' },
];
export const ROADS = [ // road feeder corridors (lat, lon)
  { kind: 'road', pts: [[2.75, 101.70], [2.95, 101.62], [3.07, 101.52], [3.32, 101.57], [3.75, 101.45], [4.3, 101.18], [4.6, 101.1], [4.86, 100.73], [5.15, 100.5], [5.35, 100.46], [5.42, 100.39], [5.36, 100.32], [5.29, 100.27]] },
  { kind: 'road', pts: [[5.42, 100.39], [5.75, 100.42], [6.12, 100.37], [6.51, 100.42], [7.0, 100.47], [7.6, 100.1], [8.4, 99.6], [9.13, 99.33], [10.49, 99.18], [11.8, 99.8], [12.57, 99.95], [13.3, 100.0], [13.69, 100.75]] },
  { kind: 'road', pts: [[2.75, 101.70], [2.72, 101.94], [2.45, 102.15], [2.27, 102.29], [2.01, 103.07], [1.64, 103.67], [1.49, 103.68], [1.46, 103.77], [1.36, 103.99]] },
  { kind: 'haul', pts: [[2.97, 101.30], [3.0, 101.38], [3.04, 101.46], [3.07, 101.52]] },
  { kind: 'haul', pts: [[2.93, 101.33], [2.86, 101.48], [2.75, 101.70]] },
];
const AIR = [['klia', 'kuching'], ['klia', 'kk'], ['kk', 'labuan'], ['klia', 'hongkong'], ['klia', 'shanghai'], ['penang', 'langkawi'], ['klia', 'bkk']];
const COLORS = { road: 0x6cc02e, haul: 0x1a6fc7, air: 0x1a6fc7 };
const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export async function initNetMap(canvas, labelsEl, { base = '', interactive = false, view = 'peninsula', panel = () => 0, onSite, narrowShift = 0 } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches || innerWidth < 760, REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); const SEA = new THREE.Color(0xd4e4f6); scene.background = SEA; scene.fog = new THREE.Fog(SEA, 40, 110);
  const camera = new THREE.PerspectiveCamera(32, 1, .05, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c8dc, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-14, 30, 12); sun.castShadow = true; sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 22, top: 30, bottom: -14, near: 1, far: 80 }); sun.shadow.bias = -.0004; sun.target.position.set(0, 0, -6); scene.add(sun, sun.target);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xc9dcf2, emissive: 0xa9c6e8, emissiveIntensity: .45, roughness: 1 })); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; scene.add(sea);
  // subtle lat/lon grid on the sea
  { const g = []; for (let lon = 92; lon <= 128; lon += 2) { const a = P(-8, lon, .002), b = P(36, lon, .002); g.push(a, b); } for (let lat = -8; lat <= 36; lat += 2) { const a = P(lat, 90, .002), b = P(lat, 130, .002); g.push(a, b); }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(g), new THREE.LineBasicMaterial({ color: 0xc9d7e8, transparent: true, opacity: .55 }))); }

  // land
  const land = await (await fetch(base + 'data/land.json')).json();
  const H = .06, matMY = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .5, roughness: .9 }), matOther = new THREE.MeshStandardMaterial({ color: 0xeef2f7, emissive: 0xeef2f7, emissiveIntensity: .38, roughness: .95 }), side = new THREE.MeshStandardMaterial({ color: 0xa9bad0, roughness: .9 });
  const borderPts = [], myBorder = [];
  for (const c of land) { const isMY = c.iso === 'MYS' || c.iso === 'SGP';
    const shapes = c.r.map((ring) => { const s = new THREE.Shape(); ring.forEach(([lon, lat], i) => { const p = P(lat, lon); i ? s.lineTo(p.x, -p.z) : s.moveTo(p.x, -p.z); }); return s; });
    const g = new THREE.ExtrudeGeometry(shapes, { depth: H * (isMY ? 1.6 : 1), bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, [isMY ? matMY : matOther, side]); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    for (const ring of c.r) for (let i = 0; i < ring.length - 1; i++) { const a = P(ring[i][1], ring[i][0], H * (isMY ? 1.6 : 1) + .003), b = P(ring[i + 1][1], ring[i + 1][0], H * (isMY ? 1.6 : 1) + .003); (isMY ? myBorder : borderPts).push(a, b); } }
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(borderPts), new THREE.LineBasicMaterial({ color: 0xb9c6d6 })));
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(myBorder), new THREE.LineBasicMaterial({ color: 0x7f9bbd })));
  const TOP = H * 1.6 + .01;

  // routes
  const movers = []; const groups = { road: [], haul: [], air: [] };
  const truckG = new THREE.BoxGeometry(.11, .05, .045); truckG.translate(0, .025, 0);
  ROADS.forEach((r) => { const curve = new THREE.CatmullRomCurve3(r.pts.map(([la, lo]) => P(la, lo, TOP)), false, 'centripetal');
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, r.pts.length * 20, r.kind === 'road' ? .022 : .018, 6, false), new THREE.MeshStandardMaterial({ color: COLORS[r.kind], roughness: .5, emissive: COLORS[r.kind], emissiveIntensity: .15, transparent: true })); scene.add(tube); groups[r.kind].push(tube.material);
    const len = curve.getLength(), n = Math.max(2, Math.round(len / 1.4)); const tm = new THREE.MeshStandardMaterial({ color: r.kind === 'road' ? 0xffffff : 0xffffff, roughness: .4 });
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(truckG, tm); m.castShadow = true; scene.add(m); movers.push({ m, curve, len, u0: i / n, dir: i % 2 ? 1 : -1, speed: .35 / len, kind: 'truck' }); } });
  const siteById = Object.fromEntries(SITES.map((s) => [s.id, s]));
  const planeG = new THREE.ConeGeometry(.035, .13, 8); planeG.rotateX(Math.PI / 2);
  const planeM = new THREE.MeshStandardMaterial({ color: 0x1a6fc7, roughness: .4, emissive: 0x1a6fc7, emissiveIntensity: .3 });
  AIR.forEach(([a, b], k) => { const A = siteById[a], B = siteById[b], pa = P(A.lat, A.lon, TOP), pb = P(B.lat, B.lon, TOP), d = pa.distanceTo(pb), mid = pa.clone().lerp(pb, .5); mid.y += Math.max(.6, d * .18);
    const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb); const pts = curve.getPoints(80);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: COLORS.air, dashSize: .12, gapSize: .09, transparent: true, opacity: .5 })); line.computeLineDistances(); scene.add(line); groups.air.push(line.material);
    const m = new THREE.Mesh(planeG, planeM); scene.add(m); movers.push({ m, curve, len: d, u0: k * .17, dir: 1, speed: .08 / Math.max(2, d) * 6, kind: 'plane' }); });

  // pins + labels
  const pinM = { hq: new THREE.MeshStandardMaterial({ color: 0x1a6fc7, emissive: 0x1a6fc7, emissiveIntensity: .25 }), site: new THREE.MeshStandardMaterial({ color: 0x1a6fc7 }), soon: new THREE.MeshStandardMaterial({ color: 0x6cc02e }), airport: new THREE.MeshStandardMaterial({ color: 0x8a99ad }) };
  const labels = {}; const pulses = [];
  SITES.forEach((s) => { const p = P(s.lat, s.lon, TOP), h = s.kind === 'hq' ? .55 : s.kind === 'airport' ? .18 : .32;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, h, 6), pinM[s.kind] || pinM.site); stem.position.copy(p).add(new THREE.Vector3(0, h / 2, 0)); scene.add(stem);
    const head = new THREE.Mesh(new THREE.SphereGeometry(s.kind === 'hq' ? .07 : s.kind === 'airport' ? .035 : .05, 16, 12), pinM[s.kind] || pinM.site); head.position.copy(p).add(new THREE.Vector3(0, h, 0)); head.castShadow = true; scene.add(head);
    if (s.kind !== 'airport') { const ring = new THREE.Mesh(new THREE.RingGeometry(.05, .07, 32), new THREE.MeshBasicMaterial({ color: s.kind === 'soon' ? 0x6cc02e : 0x1a6fc7, transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.copy(p).add(new THREE.Vector3(0, .004, 0)); scene.add(ring); pulses.push(ring); }
    const el = document.createElement(interactive ? 'button' : 'span'); el.className = `nm-lab ${s.kind}${s.key ? ' key' : ''}`; el.dataset.id = s.id; el.innerHTML = `<i></i>${s.name}`; if (interactive) { el.type = 'button'; el.addEventListener('click', () => onSite && onSite(s.id)); } labelsEl.appendChild(el);
    labels[s.id] = { el, pos: p.clone().add(new THREE.Vector3(0, h + .05, 0)) }; });

  // views
  const VIEWS = {
    peninsula: { t: P(4.6, 101.4), d: 14, az: .16, pol: .74 },
    region: { t: P(14, 109), d: 50, az: .05, pol: .6 },
    malaysia: { t: P(4, 108), d: 26, az: .05, pol: .7 },
    port: { t: P(2.9, 101.5), d: 3.4, az: .25, pol: .72 },
    corridor: { t: P(6.6, 100.9), d: 16, az: .12, pol: .66 },
    north: { t: P(5.3, 100.4), d: 3.2, az: .2, pol: .74 },
  };
  let wide = true, rect = canvas.getBoundingClientRect();
  const camT = new THREE.Vector3(), sph = { d: 12, az: 0, pol: .8 }; let fly = null;
  function placeFrom(t, d, az, pol) { camera.position.set(t.x + d * Math.sin(pol) * Math.sin(az), d * Math.cos(pol), t.z + d * Math.sin(pol) * Math.cos(az)); camera.lookAt(t); }
  function goView(name, dur = 1600) { const v = typeof name === 'string' ? VIEWS[name] : name; const k = wide ? 1 : 1.45;
    fly = { t0: performance.now(), dur, from: { t: camT.clone(), ...sph }, to: { t: v.t.clone(), d: v.d * k, az: v.az, pol: v.pol } }; if (controls) controls.enabled = false; }
  function focusSite(id) { const s = siteById[id]; goView({ t: P(s.lat, s.lon), d: 6.5, az: .12, pol: .8 }); Object.values(labels).forEach((l) => l.el.classList.toggle('pick', l.el.dataset.id === id)); }
  let controls = null;
  if (interactive) { controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxPolarAngle = 1.2; controls.minDistance = 2.5; controls.maxDistance = 75; controls.screenSpacePanning = false; controls.addEventListener('start', () => { fly = null; }); }
  function resize() { rect = canvas.getBoundingClientRect(); const w = Math.max(1, rect.width), h = Math.max(1, rect.height); renderer.setSize(w, h, false); camera.aspect = w / h; wide = w > 760; const off = wide ? panel() : 0; camera.setViewOffset(w, h, -off / 2, wide ? 0 : -h * (narrowShift || 0), w, h); camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  { const v = VIEWS[view]; camT.copy(v.t); Object.assign(sph, { d: v.d * (wide ? 1 : 1.45), az: v.az, pol: v.pol }); placeFrom(camT, sph.d, sph.az, sph.pol); if (controls) { controls.target.copy(camT); controls.update(); } }

  let visible = true; new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  const tmp = new THREE.Vector3(), tg = new THREE.Vector3(); let last = performance.now(); const t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.1, (now - last) / 1000); last = now; if (!visible || document.hidden) return; const t = (now - t0) / 1000;
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.dur), e = ease(k); camT.lerpVectors(fly.from.t, fly.to.t, e); sph.d = fly.from.d + (fly.to.d - fly.from.d) * e; sph.az = fly.from.az + (fly.to.az - fly.from.az) * e; sph.pol = fly.from.pol + (fly.to.pol - fly.from.pol) * e; placeFrom(camT, sph.d, sph.az, sph.pol); if (controls) controls.target.copy(camT);
      if (k >= 1) { fly = null; if (controls) { controls.enabled = true; controls.update(); } } }
    else if (controls) controls.update();
    else if (!REDUCED) { sph.az = VIEWS[view].az + Math.sin(t * .08) * .12; placeFrom(camT, sph.d, sph.az, sph.pol); }
    if (controls && !fly) { /* keep sph in sync for future flights */ tmp.copy(camera.position).sub(controls.target); sph.d = tmp.length(); sph.pol = Math.acos(tmp.y / sph.d); sph.az = Math.atan2(tmp.x, tmp.z); camT.copy(controls.target); }
    for (const mv of movers) { let u = (mv.u0 + t * mv.speed * (REDUCED ? 0 : 1)) % 1; if (mv.dir < 0) u = 1 - u; const p = mv.curve.getPoint(u); mv.m.position.copy(p); tg.copy(mv.curve.getPoint(Math.min(1, Math.max(0, u + .002 * mv.dir)))); if (mv.kind === 'plane') { mv.m.lookAt(tg); } else { tg.y = p.y; mv.m.lookAt(tg); mv.m.rotateY(Math.PI / 2); } if (mv.kind === 'plane') mv.m.visible = u > .02 && u < .98; }
    pulses.forEach((r, i) => { const k = (t * .6 + i * .13) % 1; r.scale.setScalar(1 + k * 2); r.material.opacity = (1 - k) * .55; });
    const W = rect.width, Hh = rect.height, far = !interactive || sph.d > (wide ? 9 : 13);
    for (const [id, l] of Object.entries(labels)) { tmp.copy(l.pos).project(camera); const x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * Hh, inside = tmp.z < 1 && x > -60 && x < W + 60 && y > -30 && y < Hh + 30;
      l.el.style.transform = `translate(${x | 0}px,${y | 0}px)`; l.el.classList.toggle('hid', !inside || (far && !l.el.classList.contains('key') && !l.el.classList.contains('pick'))); }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  function setFocus(kind) { for (const [k, mats] of Object.entries(groups)) mats.forEach((m) => { m.opacity = !kind || kind === k ? (k === 'air' ? .5 : 1) : .12; }); }
  let pathObj = null, pathMover = null;
  function showPath(latlon) { clearPath(); const curve = new THREE.CatmullRomCurve3(latlon.map(([la, lo]) => P(la, lo, TOP + .015)), false, 'centripetal');
    pathObj = new THREE.Mesh(new THREE.TubeGeometry(curve, latlon.length * 24, .045, 8, false), new THREE.MeshStandardMaterial({ color: 0xff8a1f, emissive: 0xff8a1f, emissiveIntensity: .35, roughness: .4 })); scene.add(pathObj);
    const m = new THREE.Mesh(new THREE.BoxGeometry(.2, .09, .08).translate(0, .045, 0), new THREE.MeshStandardMaterial({ color: 0xffffff })); m.castShadow = true; scene.add(m); pathMover = { m, curve, u0: 0, dir: 1, speed: .09, kind: 'truck' }; movers.push(pathMover);
    setFocus('none'); const box = new THREE.Box3(); latlon.forEach(([la, lo]) => box.expandByPoint(P(la, lo))); const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    goView({ t: c, d: Math.max(3.2, Math.max(sz.x * 1.6, sz.z * 1.25)) * 1.25, az: .12, pol: .7 }); }
  function clearPath() { if (pathObj) { scene.remove(pathObj); pathObj.geometry.dispose(); pathObj = null; } if (pathMover) { scene.remove(pathMover.m); movers.splice(movers.indexOf(pathMover), 1); pathMover = null; } setFocus(null); }
  return { goView, focusSite, resize, setFocus, showPath, clearPath };
}

// ---- road routing over the feeder corridors (indicative distances)
const NODES = { klia: [2.75, 101.70], shahalam: [3.07, 101.52], portklang: [2.93, 101.33], penang: [5.29, 100.27], butterworth: [5.42, 100.39], bm: [5.35, 100.46], johor: [1.49, 103.68], changi: [1.36, 103.99], hatyai: [7.0, 100.47], bangkok: [13.69, 100.75] };
export const ROUTE_POINTS = [['klia', 'KLIA Sepang'], ['shahalam', 'Shah Alam HQ'], ['portklang', 'Port Klang'], ['penang', 'Penang International Airport'], ['butterworth', 'Butterworth'], ['bm', 'Bukit Mertajam'], ['johor', 'Johor Bahru'], ['changi', 'Singapore Changi Airport'], ['hatyai', 'Hat Yai, Thailand'], ['bangkok', 'Bangkok, Thailand']];
const key = (p) => p[0].toFixed(2) + ',' + p[1].toFixed(2);
const hav = (a, b) => { const R = 6371, dl = (b[0] - a[0]) * D2R, dn = (b[1] - a[1]) * D2R, x = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * D2R) * Math.cos(b[0] * D2R) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
export function roadRoute(from, to) {
  const adj = new Map(), pt = new Map(); const add = (a, b) => { const ka = key(a), kb = key(b), d = hav(a, b) * 1.1; pt.set(ka, a); pt.set(kb, b); (adj.get(ka) || adj.set(ka, []).get(ka)).push([kb, d]); (adj.get(kb) || adj.set(kb, []).get(kb)).push([ka, d]); };
  ROADS.forEach((r) => { for (let i = 1; i < r.pts.length; i++) add(r.pts[i - 1], r.pts[i]); });
  const s = key(NODES[from]), t = key(NODES[to]), dist = new Map([[s, 0]]), prev = new Map(), Q = [[0, s]];
  while (Q.length) { Q.sort((a, b) => a[0] - b[0]); const [d, u] = Q.shift(); if (u === t) break; if (d > dist.get(u)) continue; for (const [v, w] of adj.get(u) || []) { const nd = d + w; if (nd < (dist.get(v) ?? Infinity)) { dist.set(v, nd); prev.set(v, u); Q.push([nd, v]); } } }
  if (!dist.has(t)) return null; const path = []; let k = t; while (k) { path.unshift(pt.get(k)); k = prev.get(k); }
  const country = (p) => p[0] > 6.55 ? 'TH' : (p[1] > 103.9 && p[0] < 1.45) ? 'SG' : 'MY';
  let borders = 0; for (let i = 1; i < path.length; i++) if (country(path[i]) !== country(path[i - 1])) borders++;
  return { pts: path, km: Math.round(dist.get(t)), borders };
}
