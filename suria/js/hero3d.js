// Suria Grid — realistic hero scene (three.js r170)
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.getElementById('sky3d');
const COARSE = matchMedia('(pointer:coarse)').matches || innerWidth < 700;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !COARSE, powerPreference: 'high-performance' });
} catch (e) { console.warn('webgl', e); }

if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .5;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !COARSE;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .5, 6000);
  scene.fog = new THREE.FogExp2(0xa8b8c4, .00105);

  /* ---------- noise ---------- */
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); };
  const fbm = (x, y) => { let a = .5, s = 0; for (let i = 0; i < 5; i++) { s += a * vnoise(x, y); x = x * 2.03 + 11.7; y = y * 2.03 + 5.3; a *= .5; } return s; };
  // terrain height: gentle where we build, rolling hills beyond
  const ground = (x, z) => {
    const d = Math.hypot(x + 40, z + 60);
    const near = (fbm(x / 60, z / 60) - .5) * 1.4;
    const hills = (fbm(x / 420 + 3, z / 420 + 7) * 95 + fbm(x / 120, z / 120) * 14 - 40) * sstep(160, 900, d);
    return near + Math.max(hills, -6) * 1;
  };

  /* ---------- textures ---------- */
  const tl = new THREE.TextureLoader();
  const tex = (u, srgb, rep) => { const t = tl.load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep, rep); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const gDiff = tex('tex/grass_diff.jpg', true, 360), gNor = tex('tex/grass_nor.jpg', false, 360), gRough = tex('tex/grass_rough.jpg', false, 360);
  const cDiff = tex('tex/concrete_diff.jpg', true), cNor = tex('tex/concrete_nor.jpg', false);

  /* ---------- sky ---------- */
  const sky = new Sky(); sky.scale.setScalar(4500); scene.add(sky);
  const su = sky.material.uniforms; su.turbidity.value = 7.5; su.rayleigh.value = 1.6; su.mieCoefficient.value = .006; su.mieDirectionalG.value = .82;
  // sky-only scene for reflections
  const envScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(4500); envScene.add(sky2);
  const groundDisc = new THREE.Mesh(new THREE.CircleGeometry(4000, 32), new THREE.MeshBasicMaterial({ color: 0x2c3a24 })); groundDisc.rotation.x = -Math.PI / 2; groundDisc.position.y = -5; envScene.add(groundDisc);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null, envT = -99;

  /* ---------- lights ---------- */
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = !COARSE;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 900 });
  sun.shadow.bias = -.0005; sun.shadow.normalBias = .6; sun.target.position.set(-60, 0, -50);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x3b4a2a, .5); scene.add(hemi);

  /* ---------- terrain ---------- */
  const SEG = COARSE ? 150 : 240, SIZE = 5000;
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i); tp.setY(i, ground(x, z)); }
  tg.computeVertexNormals();
  const tmat = new THREE.MeshStandardMaterial({ map: gDiff, normalMap: gNor, roughnessMap: gRough, color: new THREE.Color(.78, .9, .62), roughness: 1, normalScale: new THREE.Vector2(.7, .7) });
  tmat.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;\nfloat h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float m1 = vn(vW.xz*.012), m2 = vn(vW.xz*.05 + 7.);
        diffuseColor.rgb *= mix(vec3(.82,.9,.7), vec3(1.12,1.04,.78), m1);
        diffuseColor.rgb *= .85 + .3*m2;
        float far = smoothstep(120., 900., length(vW.xz - cameraPosition.xz));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.16,.22,.11)*(.85+.3*m1), far*.7);`);
  };
  const terrain = new THREE.Mesh(tg, tmat); terrain.receiveShadow = true; scene.add(terrain);

  /* ---------- solar farm ---------- */
  function panelTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d');
    x.fillStyle = '#c8ccd0'; x.fillRect(0, 0, 256, 512); // frame
    x.fillStyle = '#0b1424'; x.fillRect(6, 6, 244, 500);
    const cw = 244 / 6, ch = 500 / 12;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 12; j++) {
      const g = x.createLinearGradient(0, 6 + j * ch, 0, 6 + (j + 1) * ch); g.addColorStop(0, '#13233d'); g.addColorStop(1, '#0a1628');
      x.fillStyle = g; x.fillRect(8 + i * cw, 8 + j * ch, cw - 3, ch - 3);
      x.fillStyle = 'rgba(190,200,215,.35)'; for (let b = 1; b < 4; b++) x.fillRect(8 + i * cw + b * cw / 4, 8 + j * ch, 1, ch - 3);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const panelMat = new THREE.MeshPhysicalMaterial({ map: panelTexture(), metalness: .3, roughness: .14, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.7 });
  const panelGeo = new THREE.BoxGeometry(1.04, .04, 2.08);
  const ROWS = COARSE ? 12 : 18, PER = COARSE ? 70 : 100, TILT = .24;
  const nP = ROWS * PER * 2;
  const panels = new THREE.InstancedMesh(panelGeo, panelMat, nP); panels.castShadow = true; panels.receiveShadow = true;
  const postMat = new THREE.MeshStandardMaterial({ color: 0x8a9096, metalness: .8, roughness: .45 });
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .06, 1.6, 6), postMat, ROWS * Math.ceil(PER / 4) * 2); posts.castShadow = true;
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .08, .1), postMat, ROWS * 2);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1);
  let k = 0, kp = 0;
  const farmX0 = -120, farmZ0 = 14, rowGap = 7.2, rowLen = PER * 1.08;
  for (let r = 0; r < ROWS; r++) {
    const z = farmZ0 - r * rowGap, xOff = farmX0 + (r % 3) * .7;
    const y0 = ground(xOff + rowLen / 2, z) + 1.25;
    for (let i = 0; i < PER; i++) {
      for (let s = 0; s < 2; s++) {
        const x = xOff + i * 1.08, zz = z + (s - .5) * 2.12 * Math.cos(TILT), y = y0 + (s - .5) * -2.12 * Math.sin(TILT);
        E.set(TILT, 0, 0); Q.setFromEuler(E); V.set(x, y, zz); M4.compose(V, Q, SC); panels.setMatrixAt(k++, M4);
      }
      if (i % 4 === 0) for (let s = 0; s < 2; s++) { V.set(xOff + i * 1.08, y0 - .55 + (s ? -.35 : .35), z + (s ? 1.6 : -1.6)); Q.identity(); M4.compose(V, Q, new THREE.Vector3(1, s ? .7 : 1.25, 1)); posts.setMatrixAt(kp++, M4); }
    }
    for (let s = 0; s < 2; s++) { V.set(xOff + rowLen / 2, y0 - .1 + (s ? -.5 : .5) * .4, z + (s ? 1.0 : -1.0)); Q.setFromEuler(E.set(TILT, 0, 0)); M4.compose(V, Q, new THREE.Vector3(rowLen, 1, 1)); beams.setMatrixAt(r * 2 + s, M4); }
  }
  panels.count = k; posts.count = kp;
  scene.add(panels, posts, beams);
  // inverter cabins between blocks
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xe8e6df, roughness: .7 });
  for (let i = 0; i < 4; i++) { const cab = new THREE.Mesh(new THREE.BoxGeometry(6, 2.8, 2.6), cabMat); const cx = farmX0 + 12 + i * 26, cz = farmZ0 - ROWS * rowGap - 6; cab.position.set(cx, ground(cx, cz) + 1.4, cz); cab.castShadow = cab.receiveShadow = true; scene.add(cab); }

  /* ---------- lattice pylons ---------- */
  function beam(a, b, t) { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); const g = new THREE.BoxGeometry(t, L, t); g.translate(0, L / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.applyQuaternion(q); g.translate(a.x, a.y, a.z); return g; }
  function towerGeo() {
    const gs = [], H = 32, base = 4.2, neck = .9, waist = 24;
    const leg = (h) => { const f = h < waist ? lerp(base, neck, h / waist) : neck * lerp(1, .55, (h - waist) / (H - waist)); return f; };
    const corners = (h) => { const w = leg(h); return [[-w, h, -w], [w, h, -w], [w, h, w], [-w, h, w]].map((p) => new THREE.Vector3(...p)); };
    const levels = [0, 4, 8, 12, 16, 20, 24, 27.5, 32];
    for (let l = 0; l < levels.length - 1; l++) {
      const A = corners(levels[l]), B = corners(levels[l + 1]);
      for (let c = 0; c < 4; c++) {
        gs.push(beam(A[c], B[c], .22));
        const n = (c + 1) % 4; gs.push(beam(A[c], B[n], .09)); gs.push(beam(A[n], B[c], .09)); gs.push(beam(B[c], B[n], .1));
      }
    }
    // cross arms
    [[20, 6.5], [24, 5.2], [27.5, 4]].forEach(([h, len]) => {
      const w = leg(h);
      for (const sgn of [-1, 1]) {
        const tipU = new THREE.Vector3(sgn * (w + len), h + .4, 0), tipL = new THREE.Vector3(sgn * (w + len), h - .2, 0);
        gs.push(beam(new THREE.Vector3(sgn * w, h + 1.6, -w), tipU, .12), beam(new THREE.Vector3(sgn * w, h + 1.6, w), tipU, .12));
        gs.push(beam(new THREE.Vector3(sgn * w, h, -w), tipL, .12), beam(new THREE.Vector3(sgn * w, h, w), tipL, .12));
        gs.push(beam(tipL, new THREE.Vector3(tipL.x, tipL.y - 2.6, 0), .05)); // insulator string
      }
    });
    gs.push(beam(new THREE.Vector3(0, 32, 0), new THREE.Vector3(0, 34.5, 0), .16));
    return mergeGeometries(gs);
  }
  const towerG = towerGeo();
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa3a8, metalness: .85, roughness: .42 });
  const TW = [];
  { const a = new THREE.Vector2(-110, 22), b = new THREE.Vector2(330, -820), n = 8; for (let i = 0; i < n; i++) { const t = i / (n - 1); const x = lerp(a.x, b.x, t) + (i % 2 ? 6 : -6), z = lerp(a.y, b.y, Math.pow(t, .9)); TW.push(new THREE.Vector3(x, ground(x, z) - .3, z)); } }
  const towers = new THREE.InstancedMesh(towerG, steel, TW.length); towers.castShadow = true;
  const dirTW = Math.atan2(TW[1].x - TW[0].x, TW[1].z - TW[0].z);
  TW.forEach((p, i) => { Q.setFromEuler(E.set(0, dirTW + Math.PI / 2, 0)); M4.compose(p, Q, SC); towers.setMatrixAt(i, M4); });
  scene.add(towers);
  // conductors: catenaries between matching arm tips
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x1d2226, metalness: .6, roughness: .5 });
  const tips = [[20, 6.5 + .9], [24, 5.2 + .9], [27.5, 4 + .9]];
  const wires = [];
  for (let i = 0; i < TW.length - 1; i++) {
    const A = TW[i], B = TW[i + 1];
    for (const [h, off] of tips) for (const sgn of [-1, 1]) {
      const ofs = new THREE.Vector3(sgn * off, h - 2.8, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), dirTW + Math.PI / 2);
      const p0 = A.clone().add(ofs), p1 = B.clone().add(ofs), pts = [], span = p0.distanceTo(p1), sag = span * .045;
      for (let s = 0; s <= 24; s++) { const t = s / 24, p = p0.clone().lerp(p1, t); p.y -= sag * 4 * t * (1 - t); pts.push(p); }
      wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, .07, 5, false));
    }
    // earth wire at the peak
    const e0 = A.clone().add(new THREE.Vector3(0, 34.3, 0)), e1 = B.clone().add(new THREE.Vector3(0, 34.3, 0)), pts2 = [];
    for (let s = 0; s <= 24; s++) { const t = s / 24, p = e0.clone().lerp(e1, t); p.y -= e0.distanceTo(e1) * .035 * 4 * t * (1 - t); pts2.push(p); }
    wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 24, .03, 4, false));
  }
  scene.add(new THREE.Mesh(mergeGeometries(wires), wireMat));
  const aviMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(16, .8, .5), toneMapped: false });
  const avi = new THREE.InstancedMesh(new THREE.SphereGeometry(.35, 8, 6), aviMat, TW.length);
  TW.forEach((p, i) => { V.copy(p).add(new THREE.Vector3(0, 34.8, 0)); M4.compose(V, Q.identity(), SC); avi.setMatrixAt(i, M4); }); scene.add(avi);
  // power pulses travelling along the top conductor
  const pulseMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(16, 11, 5), toneMapped: false, transparent: true });
  const NPULSE = 10, pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(.5, 10, 8), pulseMat, NPULSE); pulses.frustumCulled = false; scene.add(pulses);
  const topWire = []; { const sgn = 1, [h, off] = tips[2]; for (let i = 0; i < TW.length - 1; i++) { const ofs = new THREE.Vector3(sgn * off, h - 2.8, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), dirTW + Math.PI / 2); topWire.push([TW[i].clone().add(ofs), TW[i + 1].clone().add(ofs)]); } }

  /* ---------- dam, spillways, river ---------- */
  const damX = 420, damZ = -980, damR = 230;
  const damG = new THREE.CylinderGeometry(damR, damR, 70, 48, 4, true, -.55, 1.1); damG.translate(0, 35, 0);
  const dUV = damG.attributes.uv; for (let i = 0; i < dUV.count; i++) dUV.setXY(i, dUV.getX(i) * 18, dUV.getY(i) * 5);
  cDiff.repeat.set(1, 1); const damMat = new THREE.MeshStandardMaterial({ map: cDiff, normalMap: cNor, color: 0xd8d6cf, roughness: .85, side: THREE.DoubleSide });
  const dam = new THREE.Mesh(damG, damMat); dam.position.set(damX, ground(damX, damZ - damR) - 18, damZ - damR); dam.rotation.y = Math.PI; dam.castShadow = dam.receiveShadow = true; scene.add(dam); const damParts = [dam];
  const damTopY = dam.position.y + 70;
  const crest = new THREE.Mesh(new THREE.CylinderGeometry(damR + 1, damR + 1, 2, 48, 1, true, -.56, 1.12), new THREE.MeshStandardMaterial({ color: 0xbdbab2, roughness: .8, side: THREE.DoubleSide })); crest.position.set(damX, damTopY, damZ - damR); crest.rotation.y = Math.PI; scene.add(crest); damParts.push(crest);
  // spillway water (animated)
  const spillMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uFlow: { value: .6 }, uLight: { value: 1 } }]),
    vertexShader: ['varying vec2 vUv;', '#include <fog_pars_vertex>', 'void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mvPosition;', '#include <fog_vertex>', '}'].join('\n'),
    fragmentShader: ['#include <common>', '#include <fog_pars_fragment>', 'uniform float uT, uFlow, uLight; varying vec2 vUv;', 'float hh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}', 'void main(){ float n = hh(floor(vec2(vUv.x*40., vUv.y*30. + uT*18.))); float streak = smoothstep(.35,1.,n); float a = (.25 + .65*streak)*uFlow*smoothstep(0.,.08,vUv.y)*smoothstep(1.,.85,vUv.y); gl_FragColor = vec4(vec3(.85,.93,.95)*uLight, a);', '#include <fog_fragment>', '}'].join('\n')
  });
  for (let i = 0; i < 4; i++) { const a = -.22 + i * .15, sp = new THREE.Mesh(new THREE.PlaneGeometry(9, 70), spillMat); sp.position.set(damX + Math.sin(a) * (damR + .6) * -1, dam.position.y + 35, damZ - damR + Math.cos(a) * (damR + .6) * 1); sp.rotation.y = -a; scene.add(sp); damParts.push(sp); }
  // river from the dam toward the camera
  function waterNormal() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const img = x.createImageData(256, 256); for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const nx = Math.sin(i * .2 + Math.sin(j * .07) * 3) * .5 + Math.sin((i + j) * .11) * .3, ny = Math.cos(j * .18 + Math.sin(i * .05) * 2) * .5 + Math.sin((i - j) * .09) * .3, o = (j * 256 + i) * 4; img.data[o] = 128 + nx * 60; img.data[o + 1] = 128 + ny * 60; img.data[o + 2] = 255; img.data[o + 3] = 255; } x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 6); return t; }
  const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x0d2a30, metalness: .1, roughness: .06, normalMap: waterNormal(), normalScale: new THREE.Vector2(.35, .35), envMapIntensity: 1.3 });
  const riverPts = [[damX, damZ - 8], [350, -800], [300, -600], [250, -420], [220, -250], [150, -120], [120, -30], [140, 80]];
  const rc = new THREE.CatmullRomCurve3(riverPts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  { const rg = []; const N = 120, w = 26; const pos = [], idx = [], uv = []; for (let i = 0; i <= N; i++) { const t = i / N, p = rc.getPoint(t), tan = rc.getTangent(t), nx = -tan.z, nz = tan.x, ww = w * (1 - t * .4); for (const s of [-1, 1]) { const x = p.x + nx * ww * s, z = p.z + nz * ww * s; pos.push(x, Math.min(ground(x, z), ground(p.x, p.z)) + .25, z); uv.push(s < 0 ? 0 : 1, t * 12); } if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const river = new THREE.Mesh(g, waterMat); river.receiveShadow = true; scene.add(river); }
  // carve the river bed a little so the water sits low
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i); let best = 1e9; for (let j = 0; j <= 40; j++) { const p = rc.getPoint(j / 40); const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (d < best) best = d; } const d = Math.sqrt(best); if (d < 60) tp.setY(i, tp.getY(i) - 3.5 * sstep(60, 18, d)); }
  // reservoir basin for the floating-solar still (behind the hero camera)
  const LC = new THREE.Vector2(-260, 560), LR = (a) => 230 + 60 * Math.sin(a * 3 + 1) + 35 * Math.sin(a * 5 + 2);
  let lakeY = 1e9; for (let a = 0; a < 6.28; a += .2) lakeY = Math.min(lakeY, ground(LC.x + Math.cos(a) * (LR(a) + 60), LC.y + Math.sin(a) * (LR(a) + 60)));
  lakeY = Math.max(lakeY, -4) - 1;
  const inLake = (x, z, pad = 0) => { const dx = x - LC.x, dz = z - LC.y, d = Math.hypot(dx, dz); return d < LR(Math.atan2(dz, dx)) + pad; };
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i), dx = x - LC.x, dz = z - LC.y, d = Math.hypot(dx, dz), R = LR(Math.atan2(dz, dx)); if (d < R + 90) { const f = sstep(R + 90, R - 10, d); tp.setY(i, lerp(tp.getY(i), Math.min(tp.getY(i), lakeY - 6), f)); } }
  tp.needsUpdate = true; tg.computeVertexNormals();

  /* ---------- palms (billboards) ---------- */
  function palmTexture() {
    // atlas of 4 side-profile oil palms (each 256x512), drawn as seen from the side
    const W = 256, H = 512, c = document.createElement('canvas'); c.width = W * 4; c.height = H; const x = c.getContext('2d');
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let v = 0; v < 4; v++) {
      x.save(); x.translate(v * W + W / 2, 0);
      const lean = rnd(-14, 14), topY = rnd(150, 200);
      // trunk: tapered, ringed with old frond bases
      x.beginPath(); x.moveTo(-9, H); x.quadraticCurveTo(lean * .4 - 8, (H + topY) / 2, lean - 6, topY); x.lineTo(lean + 6, topY); x.quadraticCurveTo(lean * .4 + 8, (H + topY) / 2, 9, H); x.closePath();
      const tg = x.createLinearGradient(-10, 0, 10, 0); tg.addColorStop(0, '#2c2116'); tg.addColorStop(.5, '#5a4630'); tg.addColorStop(1, '#2a1f14'); x.fillStyle = tg; x.fill();
      for (let y = H - 8; y > topY + 10; y -= 9) { const k = (H - y) / (H - topY), cx = lean * k * k; x.strokeStyle = 'rgba(30,22,12,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 9, y); x.lineTo(cx + 9, y - 4); x.stroke(); }
      // fronds: arcs from crown, leaflets along each
      const cx = lean, cy = topY, N = 16 + (v & 1) * 4;
      for (let f = 0; f < N; f++) {
        const side = f % 2 ? 1 : -1, up = rnd(-.9, .35), len = rnd(78, 118);
        const g = 70 + Math.floor(rnd(0, 50)), r = 28 + Math.floor(rnd(0, 26));
        x.strokeStyle = 'rgb(' + r + ',' + g + ',' + (24 + Math.floor(rnd(0, 14))) + ')'; x.fillStyle = x.strokeStyle;
        const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([cx + side * len * t * Math.cos(up * .6), cy - len * t * Math.sin(-up) * .9 + len * .55 * t * t]); }
        x.lineWidth = 2.4; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
        x.lineWidth = 1.6;
        for (let i = 2; i < 20; i++) { const [px, py] = pts[i], t = i / 20, L = 20 * Math.sin(t * Math.PI) + 4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + side * L * .35, py + L); x.moveTo(px, py); x.lineTo(px + side * L * .5, py - L * .45); x.stroke(); }
      }
      // dense crown core
      for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(' + Math.floor(rnd(20, 45)) + ',' + Math.floor(rnd(55, 95)) + ',24,.9)'; x.beginPath(); x.ellipse(cx + rnd(-14, 14), cy + rnd(-6, 14), rnd(3, 8), rnd(6, 14), rnd(0, 3), 0, 7); x.fill(); }
      x.restore();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const palmMat = new THREE.MeshStandardMaterial({ map: palmTexture(), alphaTest: .4, side: THREE.DoubleSide, roughness: .85, color: 0xd8e6c4 });
  palmMat.onBeforeCompile = (sh) => {
    // pick one of the 4 atlas tiles per instance from its matrix translation
    sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  #ifdef USE_MAP\n  float tile = floor(fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453) * 4.0);\n  vMapUv = vec2((vMapUv.x + tile) * .25, vMapUv.y);\n  #endif');
  };
  const NPALM = COARSE ? 900 : 2200, palmG = new THREE.PlaneGeometry(6.5, 13); palmG.translate(0, 6.3, 0);
  const palms = new THREE.InstancedMesh(palmG, palmMat, NPALM * 2); palms.castShadow = false;
  let kk = 0;
  for (let i = 0; i < NPALM * 6 && kk < NPALM * 2; i++) {
    const ang = -Math.PI * .97 + Math.random() * Math.PI * .94, dist = 170 + Math.pow(Math.random(), 1.3) * 1300;
    const x = Math.cos(ang) * dist - 40, z = Math.sin(ang) * dist - 120; if (z > -150 && x < 80 && x > -200) continue;
    if (Math.abs(x - damX) < 260 && z < -700) continue;
    if (inLake(x, z, 25)) continue;
    const s = .75 + Math.random() * .55, y = ground(x, z) - .4, r0 = Math.random() * 3;
    for (let c = 0; c < 2; c++) { Q.setFromEuler(E.set(0, r0 + c * Math.PI / 2, 0)); V.set(x, y, z); M4.compose(V, Q, new THREE.Vector3(s, s * (.9 + Math.random() * .25), s)); palms.setMatrixAt(kk++, M4); }
  }
  palms.count = kk; scene.add(palms);

  /* ---------- night: stars, moon, town lights ---------- */
  const domeMat = new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, uniforms: { uN: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float uN; varying vec3 vP; void main(){ float h = clamp(vP.y, 0., 1.); vec3 c = mix(vec3(.045,.07,.12), vec3(.008,.014,.03), pow(h, .5)); gl_FragColor = vec4(c, uN); }' });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4300, 32, 16), domeMat); dome.renderOrder = 1; scene.add(dome);
  const starG = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 2200; i++) { const u = Math.random(), v = Math.random() * .9 + .05, th = u * Math.PI * 2, ph = Math.acos(1 - v); sp.push(Math.sin(ph) * Math.cos(th) * 3800, Math.cos(ph) * 3800, Math.sin(ph) * Math.sin(th) * 3800); }
  starG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starG, starMat); stars.renderOrder = 2; scene.add(stars);
  const moonC = document.createElement('canvas'); moonC.width = moonC.height = 128; { const x = moonC.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,252,240,1)'); g.addColorStop(.35, 'rgba(245,240,225,1)'); g.addColorStop(.42, 'rgba(200,210,230,.25)'); g.addColorStop(1, 'rgba(160,180,220,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(moonC), transparent: true, fog: false, depthWrite: false, opacity: 0 })); moon.scale.set(220, 220, 1); scene.add(moon);
  const townG = new THREE.BufferGeometry(), tpos = [], tcol = [];
  for (let i = 0; i < 1600; i++) { const cx = -900 + (Math.random() - .5) * 900, cz = -1700 + (Math.random() - .5) * 500; tpos.push(cx, ground(cx, cz) + 1 + Math.random() * 6, cz); const w = Math.random(); tcol.push(1, .7 + w * .25, .4 + w * .4); }
  townG.setAttribute('position', new THREE.Float32BufferAttribute(tpos, 3)); townG.setAttribute('color', new THREE.Float32BufferAttribute(tcol, 3));
  const townMat = new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
  scene.add(new THREE.Points(townG, townMat));
  // inverter / cabin lamps
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 8, 5), toneMapped: false });
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), lampMat); const cx = farmX0 + 12 + i * 26, cz = farmZ0 - ROWS * rowGap - 6 + 1.4; lp.position.set(cx, ground(cx, cz) + 2.6, cz); scene.add(lp); }

  /* ---------- shot-only scenes: floating solar, wind farm ---------- */
  const shotParts = { float: [], wind: [] };
  {
    const lakeMat = waterMat.clone(); lakeMat.normalMap = waterMat.normalMap.clone(); lakeMat.normalMap.repeat.set(70, 70); lakeMat.normalScale.set(.18, .18); lakeMat.color.set(0x16343a); shotParts.lakeMat = lakeMat;
    const lake = new THREE.Mesh(new THREE.CircleGeometry(420, 64), lakeMat); lake.rotation.x = -Math.PI / 2; lake.position.set(LC.x, lakeY, LC.y); scene.add(lake); shotParts.float.push(lake);
    // floating arrays: blocks of low-tilt panels on white HDPE floats
    const fl = [], fp = [];
    const bx0 = LC.x - 120, bz0 = LC.y - 150;
    for (let b = 0; b < 6; b++) {
      const ox = bx0 + (b % 3) * 82, oz = bz0 + Math.floor(b / 3) * 92;
      for (let r = 0; r < 26; r++) for (let i = 0; i < 34; i++) {
        const x = ox + i * 2.2, z = oz + r * 3.1; if (!inLake(x, z, -18)) continue;
        V.set(x, lakeY + .35, z); Q.setFromEuler(E.set(-.2, 0, 0)); M4.compose(V, Q, new THREE.Vector3(2, 1, .78)); fp.push(M4.clone());
        V.set(x, lakeY + .08, z); M4.compose(V, Q.identity(), SC); fl.push(M4.clone());
      }
    }
    const fpan = new THREE.InstancedMesh(panelGeo, panelMat, fp.length); fp.forEach((m, i) => fpan.setMatrixAt(i, m));
    const flt = new THREE.InstancedMesh(new THREE.BoxGeometry(2.15, .22, 3.05), new THREE.MeshStandardMaterial({ color: 0xeef0ee, roughness: .55 }), fl.length); fl.forEach((m, i) => flt.setMatrixAt(i, m));
    fpan.castShadow = true; flt.receiveShadow = true; scene.add(fpan, flt); shotParts.float.push(fpan, flt);
    // walkway + inverter barge
    const walk = new THREE.Mesh(new THREE.BoxGeometry(250, .3, 2.4), new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: .7 })); walk.position.set(bx0 + 110, lakeY + .2, bz0 + 86); scene.add(walk); shotParts.float.push(walk);
    const barge = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 5), cabMat); barge.position.set(bx0 + 110, lakeY + 1.6, bz0 + 86); barge.castShadow = true; scene.add(barge); shotParts.float.push(barge);

    // shoreline palms
    const sp2 = []; for (let i = 0; i < 4000 && sp2.length < 1600; i++) { const a = Math.random() * 6.283, d = LR(a) + 22 + Math.pow(Math.random(), 1.6) * 260, x = LC.x + Math.cos(a) * d, z = LC.y + Math.sin(a) * d; const sc = .75 + Math.random() * .55; for (let c = 0; c < 2; c++) { Q.setFromEuler(E.set(0, a * 7 + c * Math.PI / 2, 0)); const g0 = ground(x, z), gy = lerp(g0, Math.min(g0, lakeY - 6), sstep(LR(a) + 90, LR(a) - 10, d)); if (gy < lakeY + .3) continue; V.set(x, gy - .4, z); M4.compose(V, Q, new THREE.Vector3(sc, sc, sc)); sp2.push(M4.clone()); } }
    const shorePalms = new THREE.InstancedMesh(palmG, palmMat, sp2.length); sp2.forEach((m, i) => shorePalms.setMatrixAt(i, m)); scene.add(shorePalms); shotParts.float.push(shorePalms);
    // wind turbines on the ridge
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f3f1, roughness: .45, metalness: .05 });
    const towerT = new THREE.CylinderGeometry(1.6, 2.8, 90, 20); towerT.translate(0, 45, 0);
    const nac = new THREE.BoxGeometry(4, 4, 11); nac.translate(0, 90, -1.5);
    const bladeShape = () => { const g = new THREE.BoxGeometry(2.4, 52, .45, 1, 8, 1); const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const y = pp.getY(i) + 26, k = y / 52; pp.setX(i, pp.getX(i) * lerp(1, .22, k) + (pp.getX(i) > 0 ? .5 : 0) * (1 - k)); pp.setY(i, y); pp.setZ(i, pp.getZ(i) * lerp(1, .4, k)); } g.computeVertexNormals(); return g; };
    const rotorG = mergeGeometries([0, 1, 2].map((j) => bladeShape().rotateZ(j * Math.PI * 2 / 3)).concat([new THREE.SphereGeometry(1.8, 16, 12).scale(1, 1, 1.6)]));
    const towerBody = mergeGeometries([towerT, nac]);
    const rotors = [];
    for (let i = 0; i < 9; i++) {
      let best = -1e9, bx = 0, bz = 0; for (let j = 0; j < 30; j++) { const x = -120 + i * 120 + (j % 6) * 18 - 45, z = 900 + Math.floor(j / 6) * 40 - 80; const h = ground(x, z); if (h > best) { best = h; bx = x; bz = z; } }
      const tw = new THREE.Mesh(towerBody, white); tw.position.set(bx, best - 1, bz); tw.rotation.y = Math.PI; tw.castShadow = true; scene.add(tw); shotParts.wind.push(tw);
      const ro = new THREE.Mesh(rotorG, white); ro.position.set(bx, best - 1 + 90, bz - 6.5); ro.rotation.z = Math.random() * 6; ro.castShadow = true; scene.add(ro); shotParts.wind.push(ro); rotors.push(ro);
    }
    shotParts.rotors = rotors;
    for (const k3 of ['float', 'wind']) shotParts[k3].forEach((o) => { o.visible = false; });
  }

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: COARSE ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .35, .5, 6); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() { const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.fov = w / h < 1 ? 58 : 42; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  /* ---------- time of day ---------- */
  const sunDir = new THREE.Vector3(), col = new THREE.Color(), fogDay = new THREE.Color(.55, .66, .78), fogGold = new THREE.Color(.95, .66, .42), fogNight = new THREE.Color(.03, .05, .08);
  let mx = 0, my = 0, tmx = 0, tmy = 0; addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });
  let shot = null;
  function setTime(t, perf, prog) {
    const u = (t - 6.95) / 12.2, alt = Math.sin(Math.PI * u), elev = alt > 0 ? Math.asin(alt) * .86 : Math.asin(clamp(alt, -1, 1)) * .5;
    const az = Math.PI * clamp(u, -.15, 1.15);
    sunDir.set(-Math.cos(az) * Math.cos(elev), Math.sin(elev), -.55 * Math.cos(elev)).normalize();
    su.sunPosition.value.copy(sunDir); sky2.material.uniforms.sunPosition.value.copy(sunDir);
    for (const k2 of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sky2.material.uniforms[k2].value = su[k2].value;
    const day = sstep(-.06, .22, alt), low = Math.exp(-Math.pow(alt / .2, 2)) * sstep(-.25, 0, alt), night = 1 - sstep(-.22, .02, alt);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 500);
    sun.intensity = 3.4 * sstep(-.01, .16, alt);
    sun.color.setRGB(1, lerp(.62, .96, sstep(0, .5, alt)), lerp(.38, .9, sstep(0, .5, alt)));
    hemi.intensity = .08 + .55 * day; hemi.color.setRGB(lerp(.35, .74, day), lerp(.42, .84, day), lerp(.62, 1, day)); hemi.groundColor.setRGB(lerp(.04, .23, day), lerp(.05, .29, day), lerp(.08, .16, day));
    col.copy(fogNight).lerp(fogDay, day); col.lerp(fogGold, low * .7); scene.fog.color.copy(col);
    scene.fog.density = lerp(.0008, .00062, day);
    renderer.toneMappingExposure = lerp(.62, .42, day) + low * .08;
    domeMat.uniforms.uN.value = sstep(-.02, -.22, alt) * .97;
    starMat.opacity = night * .95; townMat.opacity = night; moon.material.opacity = night;
    moon.position.set(-sunDir.x * 3000, Math.max(300, -sunDir.y * 3000 + 600), -1800);
    var bl = (night * .95 + .05) * (Math.sin(perf * 2.4) > .2 ? 1 : .05); aviMat.color.setRGB(16 * bl, .8 * bl, .5 * bl);
    lampMat.color.setRGB(10 * night, 8 * night, 5 * night);
    spillMat.uniforms.uT.value = perf; spillMat.uniforms.uLight.value = lerp(.12, 1, day) + low * .2;
    const flow = .35 + .5 * Math.exp(-Math.pow(((t - 20.5 + 24) % 24 - 0) / 3, 2)); spillMat.uniforms.uFlow.value = clamp(flow + .25 * (1 - day), .3, 1);
    waterMat.normalMap.offset.set(perf * .01, -perf * .05); if (shotParts.lakeMat) shotParts.lakeMat.normalMap.offset.set(perf * .004, perf * .006);
    // power pulses: faster and brighter with more output
    const out = .4 + .6 * day; const nSeg = topWire.length;
    for (let i = 0; i < NPULSE; i++) { const f = (perf * (.03 + .03 * out) + i / NPULSE) % 1, seg = f * nSeg, si = Math.floor(seg), fr = seg - si, [a, b] = topWire[si]; V.copy(a).lerp(b, fr); V.y -= a.distanceTo(b) * .045 * 4 * fr * (1 - fr); M4.compose(V, Q.identity(), SC); pulses.setMatrixAt(i, M4); }
    pulses.instanceMatrix.needsUpdate = true; pulseMat.opacity = .35 + .65 * (1 - day * .6);
    // reflections follow the sky
    if (Math.abs(t - envT) > .12) { envT = t; if (envRT) envRT.dispose(); groundDisc.material.color.setRGB(lerp(.02, .17, day), lerp(.03, .23, day), lerp(.04, .12, day)); envRT = pmrem.fromScene(envScene, .02); scene.environment = envRT.texture; }
    // camera
    mx += (tmx - mx) * .04; my += (tmy - my) * .04;
    if (!shot) {
      const p = prog || 0;
      camera.position.set(-44 + mx * 4 + p * 14, 25 - my * 2 + p * 3, 64 - p * 20);
      camera.lookAt(-8 + mx * 6, -4 + p * 2, -150);
    }
  }
  damParts.forEach((o) => { o.visible = false; });
  function render(t, perf, prog) { setTime(t, perf, prog); if (shot === 'wind') shotParts.rotors.forEach((r, i) => { r.rotation.z = perf * .9 + i * 1.7; }); composer.render(); }
  // still shots for the project cards
  function setShot(name) {
    shot = name;
    const tgt = { farm: [-90, 0, -60], pylon: [-40, 0, -20], dam: [damX, 0, damZ], float: [LC.x, 0, LC.y - 90], wind: [300, 0, 860] }[name]; if (tgt) sun.target.position.set(...tgt);
    damParts.forEach((o) => { o.visible = name === 'dam'; });
    for (const k3 of ['float', 'wind']) shotParts[k3].forEach((o) => { o.visible = name === k3; });
    if (name === 'farm') { camera.position.set(-150, 26, 30); camera.lookAt(-90, 0, -80); }
    if (name === 'pylon') { camera.position.set(-96, 3, 52); camera.lookAt(TW[2].x, 30, TW[2].z); }
    if (name === 'dam') { camera.position.set(240, 30, -420); camera.lookAt(damX, damTopY - 30, damZ - 60); }
    if (name === 'float') { camera.position.set(LC.x - 150, lakeY + 34, LC.y - 230); camera.lookAt(LC.x + 10, lakeY, LC.y - 60); }
    if (name === 'wind') { camera.position.set(260, ground(260, 640) + 14, 640); camera.lookAt(330, ground(330, 900) + 60, 900); }
  }
  window.SURIA3D = { ok: true, render, resize, setShot };
  canvas.classList.add('on');
  document.dispatchEvent(new Event('suria3d'));
}
