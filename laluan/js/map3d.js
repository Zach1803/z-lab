// Laluan — the live network map: a stylised Klang Valley with elevated lines and trains running to the timetable.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STATIONS, LINES, WATER, PARKS, ROADS, CENTRES, BOUNDS } from './data.js';
import { trainsNow, myt, linesAt } from './net.js';

const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const EL = .2; // track height

export function initMap(canvas, labelsEl, { onStation } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); const BG = new THREE.Color(0xeef1f6); scene.background = BG; scene.fog = new THREE.Fog(BG, 55, 120);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d2e0, 1.4));
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.9); sun.position.set(-10, 22, 8); sun.castShadow = true; sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 20, top: 20, bottom: -20, near: 1, far: 60 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .03; sun.target.position.set(-4, 0, 1); scene.add(sun, sun.target);

  // ground texture
  const GW = BOUNDS.x1 - BOUNDS.x0, GH = BOUNDS.z1 - BOUNDS.z0, TW = 2048, TH = Math.round(TW * GH / GW), S = TW / GW;
  const gc = document.createElement('canvas'); gc.width = TW; gc.height = TH; const g = gc.getContext('2d');
  const P = (x, z) => [(x - BOUNDS.x0) * S, (z - BOUNDS.z0) * S];
  g.fillStyle = '#eef1f6'; g.fillRect(0, 0, TW, TH);
  // faint street grid
  g.strokeStyle = 'rgba(160,170,190,.18)'; g.lineWidth = 1; for (let i = 0; i < 900; i++) { const c = CENTRES[i % CENTRES.length], a = Math.random() * Math.PI, r = Math.random() * c.r * 2.2, x = c.x + Math.cos(i) * r, z = c.z + Math.sin(i * 1.7) * r, l = .3 + Math.random() * .8; const [px, pz] = P(x, z); g.beginPath(); g.moveTo(px, pz); g.lineTo(px + Math.cos(a) * l * S, pz + Math.sin(a) * l * S); g.stroke(); }
  PARKS.forEach((p) => { const [px, pz] = P(p.x, p.z); g.fillStyle = '#d4e9d2'; g.beginPath(); g.ellipse(px, pz, p.rx * S, p.rz * S, .3, 0, 7); g.fill(); });
  const poly = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w * S; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, z], i) => { const [px, pz] = P(x, z); i ? g.lineTo(px, pz) : g.moveTo(px, pz); }); g.stroke(); };
  WATER.forEach((w) => poly(w, .34, '#b8d5f0'));
  ROADS.forEach((r) => { poly(r, .2, '#dde2ea'); poly(r, .13, '#ffffff'); });
  const gtex = new THREE.CanvasTexture(gc); gtex.colorSpace = THREE.SRGBColorSpace; gtex.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), new THREE.MeshStandardMaterial({ map: gtex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set((BOUNDS.x0 + BOUNDS.x1) / 2, 0, (BOUNDS.z0 + BOUNDS.z1) / 2); ground.receiveShadow = true; scene.add(ground);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0xeef1f6, roughness: 1 })); under.rotation.x = -Math.PI / 2; under.position.y = -.01; scene.add(under);

  // buildings
  const nearWater = (x, z) => WATER.some((w) => w.some(([a, b], i) => { const n = w[i + 1]; if (!n) return false; const dx = n[0] - a, dz = n[1] - b, t = Math.max(0, Math.min(1, ((x - a) * dx + (z - b) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a - dx * t, z - b - dz * t) < .32; }));
  const inPark = (x, z) => PARKS.some((p) => ((x - p.x) / p.rx) ** 2 + ((z - p.z) / p.rz) ** 2 < 1.1);
  const nearStation = (x, z) => Object.values(STATIONS).some((s) => Math.hypot(s.x - x, s.z - z) < .28);
  const B = []; let tries = 0; const NB = COARSE ? 1500 : 2600;
  while (B.length < NB && tries++ < 60000) { const x = BOUNDS.x0 + 1 + Math.random() * (GW - 2), z = BOUNDS.z0 + 1 + Math.random() * (GH - 2);
    let d = 0; for (const c of CENTRES) d += c.h * Math.exp(-((x - c.x) ** 2 + (z - c.z) ** 2) / (c.r * c.r)); if (Math.random() > d * 1.6 + .025) continue; if (nearWater(x, z) || inPark(x, z) || nearStation(x, z)) continue;
    const h = .04 + d * Math.pow(Math.random(), 2.2) * 1.4 + (Math.hypot(x, z + .1) < .6 ? Math.random() * .9 : 0); B.push([x, z, .08 + Math.random() * .16, .08 + Math.random() * .16, h]); }
  const bg = new THREE.BoxGeometry(1, 1, 1); bg.translate(0, .5, 0);
  const bm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }), inst = new THREE.InstancedMesh(bg, bm, B.length), m4 = new THREE.Matrix4(), col = new THREE.Color();
  B.forEach(([x, z, w, d, h], i) => { m4.makeScale(w, h, d); m4.setPosition(x, 0, z); inst.setMatrixAt(i, m4); col.setHSL(.6, .12, .86 + Math.random() * .1 - h * .05); inst.setColorAt(i, col); });
  inst.castShadow = inst.receiveShadow = true; scene.add(inst);

  // lines
  const lineObjs = LINES.map((L, li) => {
    const off = (li - 1) * .07, pts = L.stops.map((s) => new THREE.Vector3(STATIONS[s].x, EL, STATIONS[s].z));
    const raw = new THREE.CatmullRomCurve3(pts, false, 'centripetal', .5);
    // shift sideways so shared corridors read as parallel tracks
    const shifted = L.stops.map((s, i) => { const t = raw.getTangent(i / (L.stops.length - 1)); const n = new THREE.Vector3(-t.z, 0, t.x).normalize(); return pts[i].clone().addScaledVector(n, off); });
    const curve = new THREE.CatmullRomCurve3(shifted, false, 'centripetal', .5);
    const mat = new THREE.MeshStandardMaterial({ color: L.color, roughness: .45, metalness: .05, transparent: true, opacity: 1 });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, L.stops.length * 24, .055, 10, false), mat); tube.castShadow = true; scene.add(tube);
    // a few pillars
    const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(.018, .022, EL, 6).translate(0, EL / 2, 0), new THREE.MeshStandardMaterial({ color: 0xc8cfdb }), 60); let k = 0;
    for (let u = .01; u < 1 && k < 60; u += 1 / 60) { const p = curve.getPoint(u); m4.makeTranslation(p.x, 0, p.z); pil.setMatrixAt(k++, m4); } pil.count = k; pil.castShadow = true; scene.add(pil);
    // trains
    const tm = new THREE.MeshStandardMaterial({ color: new THREE.Color(L.color).lerp(new THREE.Color('#ffffff'), .25), roughness: .3, metalness: .1, emissive: new THREE.Color(L.color), emissiveIntensity: .15 });
    const tg = new THREE.CapsuleGeometry(.05, .3, 4, 10); tg.rotateZ(Math.PI / 2);
    const pool = []; for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(tg, tm); m.castShadow = true; m.visible = false; scene.add(m); pool.push(m); }
    return { L, curve, tube, mat, pool, pil };
  });

  // stations
  const stMeshes = {}, labels = {};
  const stMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 }), ringMat = new THREE.MeshStandardMaterial({ color: 0x8592a8, roughness: .5 });
  Object.entries(STATIONS).forEach(([id, s]) => {
    const inter = linesAt(id).length > 1, r = inter ? .17 : .12;
    const grp = new THREE.Group(); grp.position.set(s.x, EL - .02, s.z);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r + .03, r + .03, .07, 28), ringMat); const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .09, 28), stMat); grp.add(ring, disc); ring.castShadow = true; scene.add(grp); stMeshes[id] = grp;
    const lab = document.createElement('button'); lab.type = 'button'; lab.className = 'st-lab' + (inter ? ' inter' : ''); lab.dataset.id = id;
    lab.innerHTML = `<span class="dots">${linesAt(id).map((l) => `<i style="background:${l.color}"></i>`).join('')}</span>${s.name}`;
    lab.addEventListener('click', () => onStation && onStation(id)); labelsEl.appendChild(lab); labels[id] = lab;
  });

  // route highlight
  let routeGroup = null, routeSet = null;
  function setRoute(r) {
    if (routeGroup) { scene.remove(routeGroup); routeGroup.traverse((o) => o.geometry && o.geometry.dispose()); routeGroup = null; }
    routeSet = null; lineObjs.forEach((o) => { o.mat.opacity = 1; o.pool.forEach((m) => { m.material.opacity = 1; }); });
    Object.values(labels).forEach((l) => l.classList.remove('on', 'off'));
    if (!r) return;
    routeSet = new Set(); routeGroup = new THREE.Group(); scene.add(routeGroup);
    lineObjs.forEach((o) => { o.mat.opacity = .18; });
    r.legs.forEach((leg) => { const o = lineObjs.find((x) => x.L.id === leg.line.id), n = o.L.stops.length - 1, a = o.L.stops.indexOf(leg.from), b = o.L.stops.indexOf(leg.to), lo = Math.min(a, b), hi = Math.max(a, b);
      const pts = []; for (let u = lo; u <= hi + 1e-6; u += .05) pts.push(o.curve.getPoint(Math.min(u, hi) / n).add(new THREE.Vector3(0, .02, 0)));
      const c = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(c, pts.length * 2, .085, 12, false), new THREE.MeshStandardMaterial({ color: leg.line.color, emissive: leg.line.color, emissiveIntensity: .25, roughness: .35 })); m.castShadow = true; routeGroup.add(m);
      leg.stops.forEach((s) => routeSet.add(s)); });
    Object.entries(labels).forEach(([id, l]) => { l.classList.toggle('on', routeSet.has(id)); l.classList.toggle('off', !routeSet.has(id)); });
    // fit camera to the route
    const box = new THREE.Box3(); routeSet.forEach((s) => box.expandByPoint(new THREE.Vector3(STATIONS[s].x, 0, STATIONS[s].z))); fit(box);
  }
  function fit(box, extra = 1) { const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()); const span = Math.max(sz.x / Math.max(.6, camera.aspect * (wide ? .62 : 1)), sz.z * 1.3, 4) * extra;
    const dist = span / (2 * Math.tan(camera.fov * Math.PI / 360)) * 1.25 + 3; const dir = camera.position.clone().sub(controls.target).normalize(); flyTo(c, dist, dir); }
  function flyTo(target, dist, dir) { const d = dir || camera.position.clone().sub(controls.target).normalize(); if (d.y < .45) { d.y = .6; d.normalize(); } fly = { t0: performance.now(), dur: 1500, fromT: controls.target.clone(), toT: target.clone(), fromP: camera.position.clone(), toP: target.clone().addScaledVector(d, dist) }; controls.autoRotate = false; }
  function focusStation(id) { const s = STATIONS[id]; flyTo(new THREE.Vector3(s.x, 0, s.z), 9); Object.entries(labels).forEach(([k, l]) => l.classList.toggle('pick', k === id)); }
  function overview() { flyTo(new THREE.Vector3(-4, 0, .5), wide ? 34 : 46, new THREE.Vector3(.35, 1, .9).normalize()); }

  // camera + controls
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = 1.18; controls.minDistance = 5; controls.maxDistance = 60; controls.autoRotate = true; controls.autoRotateSpeed = .25; controls.screenSpacePanning = false;
  controls.addEventListener('start', () => { controls.autoRotate = false; fly = null; });
  camera.position.set(6, 22, 26); controls.target.set(-4, 0, .5);
  let fly = null, wide = true, panelW = 0;
  function resize() { const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; wide = w > 760; camera.setViewOffset(w, h, wide ? -panelW / 2 : 0, 0, w, h); camera.updateProjectionMatrix(); rect = r; }
  let rect = canvas.getBoundingClientRect(); addEventListener('resize', resize);
  function setPanel(px) { panelW = px; resize(); }
  resize(); overview(); fly.dur = 10; // start framed

  let visible = true; new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(); let lastTrain = 0, last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.1, (now - last) / 1000); last = now; if (!visible || document.hidden) return;
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.dur), e = ease(k); controls.target.lerpVectors(fly.fromT, fly.toT, e); camera.position.lerpVectors(fly.fromP, fly.toP, e); if (k >= 1) fly = null; }
    // keep the view on the map
    controls.target.x = Math.max(BOUNDS.x0 + 2, Math.min(BOUNDS.x1 - 2, controls.target.x)); controls.target.z = Math.max(BOUNDS.z0 + 2, Math.min(BOUNDS.z1 - 2, controls.target.z)); controls.target.y = 0;
    controls.update();
    // trains, from the live timetable
    if (now - lastTrain > 40) { lastTrain = now; const t = myt();
      lineObjs.forEach((o) => { const list = trainsNow(o.L, t), n = o.L.stops.length - 1; o.pool.forEach((m, i) => { const tr = list[i]; if (!tr) { m.visible = false; return; } m.visible = true;
        const u = Math.max(0, Math.min(1, tr.pos / n)), p = o.curve.getPoint(u), tg = o.curve.getTangent(u); side.crossVectors(tg, up).normalize(); p.addScaledVector(side, tr.dir > 0 ? .055 : -.055); p.y += .07;
        m.position.copy(p); m.lookAt(p.clone().add(tg)); m.rotateY(Math.PI / 2); m.material.transparent = !!routeSet; m.material.opacity = routeSet ? .35 : 1; }); }); }
    // labels
    const W = rect.width, H = rect.height, camD = camera.position.distanceTo(controls.target);
    for (const [id, lab] of Object.entries(labels)) { const s = STATIONS[id]; v.set(s.x, EL + .12, s.z).project(camera);
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H, inside = v.z < 1 && x > -40 && x < W + 40 && y > -20 && y < H + 20;
      lab.style.transform = `translate(${x | 0}px,${y | 0}px)`; lab.classList.toggle('hid', !inside || (!lab.classList.contains('inter') && !lab.classList.contains('on') && !lab.classList.contains('pick') && camD > (wide ? 30 : 26))); }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return { setRoute, focusStation, overview, setPanel, resize };
}
