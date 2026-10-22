// Congkak board in 3D: a carved hardwood perahu-shaped board, 98 cowrie shells, a woven mat on a timber floor.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { STORE } from './rules.js';

const HALF_L = .45, HALF_W = .118, PITCH = .082, RH = .031, DH = .021, RS_X = .046, RS_Z = .07, DS = .03, ROWZ = .047, SX = .338;
export const holePos = (i) => {
  if (i === 7) return new THREE.Vector3(-SX, 0, 0);
  if (i === 15) return new THREE.Vector3(SX, 0, 0);
  if (i < 7) return new THREE.Vector3(.246 - i * PITCH, 0, ROWZ);
  return new THREE.Vector3(-.246 + (i - 8) * PITCH, 0, -ROWZ);
};
const halfWidth = (x) => { const a = Math.abs(x); if (a < .355) return HALF_W; const t = Math.min(1, (a - .355) / (HALF_L - .355)); return HALF_W * Math.pow(Math.max(0, Math.cos(t * Math.PI / 2)), .75) + .0001; };
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function carve(x, z) {
  // returns height (<=0 inside bowls) and a 0..1 cavity value for baked shading
  let h = 0, cav = 0;
  for (let i = 0; i < 16; i++) {
    const p = holePos(i), store = i === 7 || i === 15, rx = store ? RS_X : RH, rz = store ? RS_Z : RH, D = store ? DS : DH;
    const dx = (x - p.x) / rx, dz = (z - p.z) / rz, t2 = dx * dx + dz * dz;
    if (t2 < 1.3) { const t = Math.sqrt(t2); const bowl = -D * Math.max(0, 1 - t2); const lip = t < 1 ? 0 : 0; const edge = 1 - sstep(.9, 1.06, t); const v = bowl * (t < 1 ? 1 : 0) + lip; if (v < h) { h = v; cav = Math.max(cav, -v / D); } cav = Math.max(cav, edge * .15 * (t > .85 ? 1 : 0)); }
  }
  return { h, cav };
}
export function bowlSurface(i, x, z) { return carve(x, z).h; }

function boardGeometry() {
  const NX = 420, NV = 120, pos = [], uv = [], col = [], idx = [];
  const R = .007; // edge round-over
  for (let a = 0; a <= NX; a++) {
    const x = -HALF_L + (a / NX) * 2 * HALF_L, w = halfWidth(x), up = .034 * Math.pow(sstep(.36, HALF_L, Math.abs(x)), 2);
    for (let b = 0; b <= NV; b++) {
      const v = -1 + 2 * b / NV, z = v * w, e = w - Math.abs(z);
      let y = up; if (e < R) y -= R - Math.sqrt(Math.max(0, R * R - (R - e) * (R - e)));
      const { h, cav } = carve(x, z); y += h;
      // incised border line, inset from the edge, and a second line framing the holes
      const g1 = Math.abs(e - .015), g2 = Math.abs(Math.abs(z) - (ROWZ + RH + .012)) + (Math.abs(x) > .29 ? 1 : 0);
      let groove = 0; if (g1 < .0011) groove = .0012 * (1 - g1 / .0011); if (g2 < .0009 && w > .1) groove = Math.max(groove, .0009 * (1 - g2 / .0009));
      y -= groove;
      pos.push(x, y, z); uv.push(x * 1.1 + .5, z * 1.1 + .5);
      const shade = 1 - .42 * cav - (groove > 0 ? .35 : 0); col.push(shade, shade * .97, shade * .95);
    }
  }
  for (let a = 0; a < NX; a++) for (let b = 0; b < NV; b++) { const i0 = a * (NV + 1) + b, i1 = i0 + NV + 1; idx.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  // side wall + base, following the outline
  const ring = []; for (let a = 0; a <= NX; a += 2) { const x = -HALF_L + (a / NX) * 2 * HALF_L; ring.push([x, halfWidth(x), .034 * Math.pow(sstep(.36, HALF_L, Math.abs(x)), 2)]); }
  const outline = [...ring.map(([x, w, u]) => [x, w, u]), ...ring.slice().reverse().map(([x, w, u]) => [x, -w, u])];
  const wp = [], wu = [], wi = [], Y0 = -R, Y1 = -.055, Y2 = -.068, INS = .9;
  outline.forEach(([x, z, u], k) => { wp.push(x, Y0 + u, z, x * .995, Y1, z, x * .97, Y1 - .004, z * INS, x * .97, Y2, z * INS); const s = k / outline.length * 6; wu.push(s, .0, s, .3, s, .32, s, .4); });
  const n = outline.length; for (let k = 0; k < n; k++) { const a = k * 4, b = ((k + 1) % n) * 4; for (let r = 0; r < 3; r++) wi.push(a + r, b + r, a + r + 1, a + r + 1, b + r, b + r + 1); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(wu, 2)); wg.setIndex(wi); wg.computeVertexNormals();
  return { top: g, wall: wg };
}

function shellGeometry() {
  const g = new THREE.SphereGeometry(1, 28, 18), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0) y *= .32;                                   // flat underside
    const slit = Math.exp(-Math.pow(z / .12, 2)) * (y < .05 ? 1 : 0); y += slit * .18;   // the toothed aperture
    x *= 1 + .06 * (1 - Math.abs(y));
    p.setXYZ(i, x * .0086, y * .0058, z * .0063);
  }
  g.computeVertexNormals(); return g;
}
function shellTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#f4ead7'); g.addColorStop(.5, '#fbf5ea'); g.addColorStop(1, '#efe3cc'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${150 + Math.random() * 40},${105 + Math.random() * 30},${60 + Math.random() * 30},${.08 + Math.random() * .18})`; x.beginPath(); x.arc(Math.random() * 256, 20 + Math.random() * 60, 1 + Math.random() * 3.5, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(120,80,40,.25)'; for (let i = 0; i < 16; i++) x.fillRect(i * 16 + 4, 104, 3, 14);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createBoard(canvas, { onHole, onHover, onReady } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.75 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a120c); scene.fog = new THREE.Fog(0x1a120c, 1.4, 3.6);
  const camera = new THREE.PerspectiveCamera(30, 1, .02, 20);
  const manager = new THREE.LoadingManager(); manager.onLoad = () => { onReady && onReady(); };
  const tl = new THREE.TextureLoader(manager);
  const T = (u, srgb, rep = 1) => { const t = tl.load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  new RGBELoader(manager).load('tex/room.hdr', (h) => { h.mapping = THREE.EquirectangularReflectionMapping; scene.environment = h; scene.environmentIntensity = .3; });

  // light: warm window light from the far left, soft fill
  const key = new THREE.DirectionalLight(0xffe2b8, 2.6); key.position.set(-.9, 1.6, -.5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -.6, right: .6, top: .6, bottom: -.6, near: .1, far: 4 }); key.shadow.bias = -.0002; key.shadow.normalBias = .004; key.shadow.radius = 4;
  scene.add(key, new THREE.HemisphereLight(0xfff0dc, 0x3a2414, .35));
  const rim = new THREE.SpotLight(0xffc68a, 3, 3, .6, .8, 1.5); rim.position.set(.8, .9, .9); rim.target.position.set(0, 0, 0); scene.add(rim, rim.target);

  // floor + mat
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ map: T('tex/floor_diff.jpg', true, 5), normalMap: T('tex/floor_nor.jpg', false, 5), roughnessMap: T('tex/floor_rough.jpg', false, 5), color: 0x9a8370 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.073; floor.receiveShadow = true; scene.add(floor);
  const matG = new THREE.PlaneGeometry(1.25, .62, 1, 1); const mat = new THREE.Mesh(matG, new THREE.MeshStandardMaterial({ map: T('tex/mat_diff.jpg', true, 3), normalMap: T('tex/mat_nor.jpg', false, 3), color: 0xd9c49c, roughness: .95 }));
  mat.rotation.x = -Math.PI / 2; mat.position.y = -.0715; mat.receiveShadow = true; scene.add(mat);
  // mat border band (woven edge in a darker dye)
  const band = new THREE.Mesh(new THREE.RingGeometry(1, 1.06, 4, 1, Math.PI / 4), new THREE.MeshStandardMaterial({ color: 0x6b2e1d, roughness: .9 })); band.scale.set(.625 / Math.SQRT1_2 * .995, .31 / Math.SQRT1_2 * .995, 1); band.rotation.x = -Math.PI / 2; band.position.y = -.0712; band.receiveShadow = true; scene.add(band);

  // the board
  const woodMat = new THREE.MeshPhysicalMaterial({ map: T('tex/wood_diff.jpg', true), normalMap: T('tex/wood_nor.jpg'), roughnessMap: T('tex/wood_rough.jpg'), vertexColors: true, clearcoat: .35, clearcoatRoughness: .3, color: 0xffd9bd, normalScale: new THREE.Vector2(.6, .6) });
  const wallMat = woodMat.clone(); wallMat.vertexColors = false; wallMat.color.set(0xd7a888); wallMat.side = THREE.DoubleSide;
  const { top, wall } = boardGeometry();
  const board = new THREE.Mesh(top, woodMat); board.castShadow = board.receiveShadow = true; scene.add(board);
  const sides = new THREE.Mesh(wall, wallMat); sides.castShadow = sides.receiveShadow = true; scene.add(sides);
  [board, sides].forEach((m) => { m.position.y = 0; });

  // shells
  const shellMat = new THREE.MeshPhysicalMaterial({ map: shellTex(), roughness: .28, clearcoat: 1, clearcoatRoughness: .06, sheen: .3 });
  const shells = new THREE.InstancedMesh(shellGeometry(), shellMat, 98); shells.castShadow = true; shells.receiveShadow = true; scene.add(shells);
  const tints = ['#ffffff', '#fff4e2', '#f3e2c6', '#e8cfa6', '#fffaf2', '#dcc09a', '#f7ecd8', '#cfae84'];
  for (let i = 0; i < 98; i++) shells.setColorAt(i, new THREE.Color(tints[i % tints.length]));
  const S = Array.from({ length: 98 }, (_, i) => ({ pos: new THREE.Vector3(), rot: new THREE.Euler(0, Math.random() * 6.28, 0), tw: null, yaw: Math.random() * 6.28, tilt: (Math.random() - .5) * .5 }));
  let holes = Array.from({ length: 16 }, () => []);
  const slotPos = (i, k) => {
    const c = holePos(i), store = i === 7 || i === 15, L = store ? 16 : 7, layer = Math.floor(k / L), j = k % L;
    const rx = (store ? RS_X : RH) * .62, rz = (store ? RS_Z : RH) * .62, rr = Math.sqrt((j + .5) / L), a = j * 2.39996 + layer * 1.1 + i;
    const x = c.x + Math.cos(a) * rx * rr * (1 + layer * .05), z = c.z + Math.sin(a) * rz * rr * (1 + layer * .05);
    return new THREE.Vector3(x, carve(x, z).h + .0045 + layer * .0068, z);
  };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), ONE = new THREE.Vector3(1, 1, 1);
  function writeShell(id) { const s = S[id]; Q.setFromEuler(new THREE.Euler(s.tilt, s.yaw, s.tilt * .6)); M4.compose(s.pos, Q, ONE); shells.setMatrixAt(id, M4); }
  function layout(b) {
    holes = Array.from({ length: 16 }, () => []); let id = 0;
    for (let i = 0; i < 16; i++) for (let k = 0; k < b[i]; k++) { holes[i].push(id); S[id].pos.copy(slotPos(i, k)); S[id].tw = null; id++; }
    for (; id < 98; id++) { S[id].pos.set(0, -1, 0); }
    for (let i = 0; i < 98; i++) writeShell(i); shells.instanceMatrix.needsUpdate = true;
  }

  // hole markers (hover/turn rings) and hit areas
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd38a, transparent: true, opacity: 0, depthWrite: false });
  const rings = [], hits = [];
  for (let i = 0; i < 16; i++) {
    const store = i === 7 || i === 15, p = holePos(i);
    const r = new THREE.Mesh(new THREE.RingGeometry(store ? .9 : .9, 1, 48), ringMat.clone()); r.rotation.x = -Math.PI / 2; r.scale.set(store ? RS_X * 1.08 : RH * 1.12, store ? RS_Z * 1.08 : RH * 1.12, 1); r.position.set(p.x, .0012, p.z); scene.add(r); rings.push(r);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .06, 16), new THREE.MeshBasicMaterial({ visible: false })); h.scale.set(store ? RS_X : RH * 1.25, 1, store ? RS_Z : RH * 1.25); h.position.set(p.x, .01, p.z); h.userData.i = i; scene.add(h); hits.push(h);
  }
  let playable = [], hover = -1, lastMove = -1;
  function setPlayable(list, color = 0xffd38a) { playable = list.slice(); rings.forEach((r, i) => { r.userData.on = playable.includes(i); r.material.color.set(color); }); }

  // picking
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(hits, false)[0]; return h ? h.object.userData.i : -1; }
  canvas.addEventListener('pointermove', (e) => { const i = pick(e); const ok = playable.includes(i) ? i : -1; if (ok !== hover) { hover = ok; canvas.style.cursor = ok >= 0 ? 'pointer' : 'default'; onHover && onHover(ok); } });
  canvas.addEventListener('pointerleave', () => { hover = -1; onHover && onHover(-1); });
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => { if (!down) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (d > 12) return; const i = pick(e); if (playable.includes(i)) onHole && onHole(i); });

  // animation of a turn
  const hand = { pos: new THREE.Vector3(), target: new THREE.Vector3(), ids: [] };
  let queue = Promise.resolve(), speed = 1, skipping = false;
  const wait = (ms) => new Promise((res) => { if (skipping) return res(); const t0 = performance.now(); const tick = () => { if (skipping || performance.now() - t0 >= ms) res(); else requestAnimationFrame(tick); }; tick(); });
  function tween(id, to, dur, arc) { const s = S[id]; s.tw = { from: s.pos.clone(), to: to.clone(), t0: performance.now(), dur: skipping ? 1 : dur, arc }; }
  const above = (i) => holePos(i).clone().add(new THREE.Vector3(0, .085, 0));
  async function animate(ev, { onDrop, onStep } = {}) {
    skipping = false; let n = 0;
    for (const e of ev) {
      if (e.t === 'pick') {
        const ids = holes[e.i].splice(0); hand.ids.push(...ids); hand.target.copy(above(e.i)); if (!hand.ids.length) continue;
        if (n === 0) hand.pos.copy(above(e.i));
        ids.forEach((id, k) => tween(id, handSlot(k), 260 / speed, .02));
        lastMove = e.i; onStep && onStep(e); await wait(320 / speed);
      } else if (e.t === 'drop') {
        hand.target.copy(above(e.i)); const id = hand.ids.shift(); const k = holes[e.i].length; holes[e.i].push(id);
        await wait(Math.max(36, (n < 14 ? 120 : n < 40 ? 75 : 45)) / speed);
        tween(id, slotPos(e.i, k), 170 / speed, .025); n++; onDrop && onDrop(e.i, k); onStep && onStep(e);
      } else if (e.t === 'capture' || e.t === 'sweep') {
        await wait(260 / speed);
        const ids = e.t === 'capture' ? [...holes[e.i].splice(0), ...holes[e.o].splice(0)] : holes[e.i].splice(0);
        ids.forEach((id, k) => { const kk = holes[e.store].length; holes[e.store].push(id); setTimeout(() => tween(id, slotPos(e.store, kk), 520 / speed, .07), skipping ? 0 : k * 35 / speed); });
        onStep && onStep(e); await wait((560 + ids.length * 35) / speed);
      }
    }
    await wait(200 / speed); skipping = false;
  }
  function handSlot(k) { const a = k * 2.39996, r = .006 * Math.sqrt(k + 1); return hand.pos.clone().add(new THREE.Vector3(Math.cos(a) * r, (k % 3) * .004, Math.sin(a) * r)); }

  // camera framing
  let portrait = false, intro = 0, side = 0;
  function frameCam() {
    const target = new THREE.Vector3(0, -.01, portrait ? 0 : .012 * (side ? -1 : 1));
    if (portrait) { camera.fov = 36; camera.position.set(.0, 1.5, .26); camera.up.set(-1, 0, 0); }
    else { const a = camera.aspect, f = a < 1.35 ? 1.25 : 1; camera.fov = 30; camera.position.set(0, .86 * f, .8 * f); camera.up.set(0, 1, 0); }
    if (side) { camera.position.x *= -1; camera.position.z *= -1; camera.up.x *= -1; }
    camera.lookAt(target); camera.updateProjectionMatrix();
  }
  function resize() { const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; portrait = w / h < .8; frameCam(); if (portrait) camera.setViewOffset(w, h, 0, -h * .055, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock(), tmp = new THREE.Vector3();
  const labels = []; // projected positions for HTML count badges
  function loop() {
    requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .05), now = performance.now(), t = clock.elapsedTime;
    hand.pos.lerp(hand.target, 1 - Math.exp(-dt * 14));
    let dirty = false;
    hand.ids.forEach((id, k) => { const s = S[id]; if (s.tw && now - s.tw.t0 < s.tw.dur) return; s.tw = null; s.pos.copy(handSlot(k)); s.pos.y += Math.sin(t * 6 + k) * .0008; writeShell(id); dirty = true; });
    S.forEach((s, id) => { if (!s.tw) return; const k = Math.min(1, (now - s.tw.t0) / s.tw.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; s.pos.lerpVectors(s.tw.from, s.tw.to, e); s.pos.y += Math.sin(Math.PI * e) * s.tw.arc; if (k >= 1 && !hand.ids.includes(id)) s.tw = null; writeShell(id); dirty = true; });
    if (dirty) shells.instanceMatrix.needsUpdate = true;
    rings.forEach((r, i) => { const on = r.userData.on, target = i === hover ? .95 : on ? .42 + .18 * Math.sin(t * 3) : (i === lastMove ? .0 : 0); r.material.opacity += (target - r.material.opacity) * (1 - Math.exp(-dt * 10)); });
    renderer.render(scene, camera);
  }
  loop();
  function project() { const r = canvas.getBoundingClientRect(); return Array.from({ length: 16 }, (_, i) => { tmp.copy(holePos(i)); tmp.z += (i === 7 || i === 15) ? 0 : (i < 7 ? RH + .014 : -(RH + .014)); if (portrait) { tmp.z = holePos(i).z + (i < 7 ? RH + .016 : i > 7 && i < 15 ? -(RH + .016) : 0); } tmp.y = .003; tmp.project(camera); return { x: (tmp.x + 1) / 2 * r.width, y: (1 - tmp.y) / 2 * r.height }; }); }
  function centers() { const r = canvas.getBoundingClientRect(); return Array.from({ length: 16 }, (_, i) => { tmp.copy(holePos(i)); tmp.y = -.01; tmp.project(camera); return { x: (tmp.x + 1) / 2 * r.width, y: (1 - tmp.y) / 2 * r.height }; }); }
  return { debugPick: (x, y) => ({ hit: pick({ clientX: x, clientY: y }), playable }), layout, animate, setPlayable, project, centers, setSide(v) { side = v; frameCam(); }, skip() { skipping = true; }, setSpeed(s) { speed = s; }, get portrait() { return portrait; }, renderer };
}
