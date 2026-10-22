// Halia Residences — the tower, its city, the sky, and the camera moves (three.js r170). Units: metres.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const FH = 3.4, F0 = 8, F1 = 45, TOP = 47, W = 40, D = 24, CR = 7, UNITS = 8;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- plan outline: rounded rectangle, sampled by perimeter fraction s (0 = east, counter-clockwise from above) ---------- */
function outline(w, d, r, n = 192) {
  const segs = [], hw = w / 2 - r, hd = d / 2 - r;
  // build as list of points walking CCW seen from +y: east side going north (-z), etc.
  const pts = [];
  const arc = (cx, cz, a0) => { for (let i = 0; i <= 12; i++) { const a = a0 + i / 12 * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cz - Math.sin(a) * r]); } };
  pts.push([w / 2, 0]); pts.push([w / 2, -hd]); arc(hw, -hd, 0); pts.push([-hw, -d / 2]); arc(-hw, -hd, Math.PI / 2); pts.push([-w / 2, hd]); arc(-hw, hd, Math.PI); pts.push([hw, d / 2]); arc(hw, hd, Math.PI * 1.5); pts.push([w / 2, 0]);
  let L = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(L); }
  const at = (s) => { s = ((s % 1) + 1) % 1; const t = s * L; let i = 1; while (i < cum.length - 1 && cum[i] < t) i++; const k = (t - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); const a = pts[i - 1], b = pts[i]; const x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k); const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1; return { x, z, nx: -tz / tl, nz: tx / tl }; };
  for (let i = 0; i < n; i++) segs.push(at(i / n));
  return { at, L, pts: segs };
}
const OUT = outline(W, D, CR);
export const unitCentre = (k) => OUT.at(k / UNITS);
// band wall around the outline, offset outward by `off`, from y0 to y1, with uv = (s, v)
function wall(off, y0, y1, s0 = 0, s1 = 1, n = 160, rows = 1) {
  const pos = [], uv = [], idx = [], cols = Math.max(2, Math.round(n * (s1 - s0)));
  for (let r = 0; r <= rows; r++) for (let i = 0; i <= cols; i++) { const s = lerp(s0, s1, i / cols), p = OUT.at(s), y = lerp(y0, y1, r / rows); pos.push(p.x + p.nx * off, y, p.z + p.nz * off); uv.push(s, r / rows); }
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) { const a = r * (cols + 1) + i, b = a + cols + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function slabGeo(off, thick) { const sh = new THREE.Shape(); OUT.pts.forEach((p, i) => { const x = p.x + p.nx * off, z = p.z + p.nz * off; i ? sh.lineTo(x, -z) : sh.moveTo(x, -z); }); const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2); return g; }

export function createScene(canvas, { onReady } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches || innerWidth < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: location.search.includes('snap') });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, .2, 6000);
  scene.fog = new THREE.FogExp2(0xbfc9d2, .00055);

  /* ---------- sky + light ---------- */
  const sky = new Sky(); sky.scale.setScalar(5000); scene.add(sky);
  const su = sky.material.uniforms; su.turbidity.value = 3.2; su.rayleigh.value = 2.2; su.mieCoefficient.value = .005; su.mieDirectionalG.value = .82;
  const envScene = new THREE.Scene(), sky2 = new Sky(); sky2.scale.setScalar(5000); envScene.add(sky2);
  const envGround = new THREE.Mesh(new THREE.CircleGeometry(4000, 24), new THREE.MeshBasicMaterial({ color: 0x30343a })); envGround.rotation.x = -Math.PI / 2; envGround.position.y = -10; envScene.add(envGround);
  const pmrem = new THREE.PMREMGenerator(renderer); let envRT = null, envH = -99;
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 170, bottom: -40, near: 10, far: 900 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .8; scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x4a4036, .6); scene.add(hemi);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4800, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, uniforms: { uN: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float uN; varying vec3 vP; float h(vec3 p){ return fract(sin(dot(p, vec3(12.9,78.2,37.7)))*43758.5); } void main(){ float y = clamp(vP.y,0.,1.); vec3 c = mix(vec3(.05,.06,.1), vec3(.008,.013,.035), pow(y,.4)); float st = step(.9985, h(floor(vP*900.)))*smoothstep(.05,.3,y); c += st*.8; gl_FragColor = vec4(c, uN); }' }));
  dome.renderOrder = -1; scene.add(dome);

  /* ---------- shared shader bits ---------- */
  const U = { uNight: { value: 0 }, uLit: { value: .6 }, uTime: { value: 0 } };
  const hashGL = 'float hsh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }';

  /* ---------- the tower ---------- */
  const tower = new THREE.Group(); scene.add(tower);
  const Y0 = F0 * FH - FH, Y1 = TOP * FH;
  // glass curtain wall with interior lights at night
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1d2c33, metalness: .1, roughness: .06, envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: .05 });
  glassMat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vU;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvU = uv;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec2 vU; uniform float uNight, uLit, uTime; ${hashGL}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float floors = ${(TOP - F0 + 1).toFixed(1)}; float bays = 84.; vec2 g = vec2(vU.x*bays, vU.y*floors); vec2 c = floor(g), f = fract(g);
          float aa = clamp(1.6 - max(fwidth(g.x), fwidth(g.y))*2.5, 0., 1.);
          float frame = mix(.9, step(.03, f.x)*step(f.x, .97)*step(.07, f.y)*step(f.y, .95), aa);
          float unit = floor(vU.x*8. + .5); float r = hsh(c + vec2(unit*3.1, 0.)); float rr = hsh(c*1.7 + 9.);
          float lit = step(1. - uLit, r) * step(c.y, floors - 1.5);
          vec3 warm = mix(vec3(1.,.72,.42), vec3(1.,.86,.66), rr); float curtain = .55 + .45*step(.35, fract(f.x*1.3 + rr));
          totalEmissiveRadiance += warm * lit * frame * uNight * .5 * curtain;
          float sky = step(floors - 1.5, c.y); totalEmissiveRadiance += vec3(.9,1.,.75) * sky * uNight * .6 * frame;
          diffuseColor.rgb = mix(vec3(.5,.52,.53), diffuseColor.rgb, frame); }`);
  };
  const glass = new THREE.Mesh(wall(0, Y0, Y1, 0, 1, 220, 1), glassMat); glass.castShadow = true; glass.receiveShadow = true; tower.add(glass);
  // floor slabs + balconies (white), glass balustrades and rails
  const concrete = new THREE.MeshStandardMaterial({ color: 0xf1efe9, roughness: .55 });
  const slabG = slabGeo(1.7, .32), nSlab = TOP - F0 + 2;
  const slabs = new THREE.InstancedMesh(slabG, concrete, nSlab); slabs.castShadow = slabs.receiveShadow = true;
  const balG = wall(1.62, 0, 1.1, 0, 1, 200), balMat = new THREE.MeshPhysicalMaterial({ color: 0xbfd6dc, transparent: true, opacity: .14, roughness: .05, metalness: 0, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.5 });
  const bals = new THREE.InstancedMesh(balG, balMat, nSlab);
  const railG = wall(1.62, 1.08, 1.14, 0, 1, 200), rails = new THREE.InstancedMesh(railG, new THREE.MeshStandardMaterial({ color: 0x9aa1a6, metalness: .9, roughness: .3, side: THREE.DoubleSide }), nSlab);
  const M = new THREE.Matrix4();
  for (let i = 0; i < nSlab; i++) { const y = Y0 + i * FH - .32; M.makeTranslation(0, y, 0); slabs.setMatrixAt(i, M); M.makeTranslation(0, y + .32, 0); bals.setMatrixAt(i, M); rails.setMatrixAt(i, M); }
  bals.count = rails.count = nSlab - 1; tower.add(slabs, bals, rails);
  // vertical fins at unit boundaries, brass-toned
  const finMat = new THREE.MeshStandardMaterial({ color: 0xb79b6e, metalness: .65, roughness: .35 });
  for (let k = 0; k < UNITS; k++) { const p = OUT.at((k + .5) / UNITS); const fin = new THREE.Mesh(new THREE.BoxGeometry(.45, Y1 - Y0 + 8, 2.2), finMat); fin.position.set(p.x + p.nx * 1.0, (Y0 + Y1) / 2 + 3, p.z + p.nz * 1.0); fin.rotation.y = Math.atan2(p.nx, p.nz); fin.castShadow = true; tower.add(fin); }
  // crown: sky garden trees and a pergola roof
  const roofY = Y1;
  const roof = new THREE.Mesh(slabGeo(2.6, .6), concrete); roof.position.y = roofY + 6; roof.castShadow = true; tower.add(roof);
  const crownGlass = new THREE.Mesh(wall(-.2, roofY, roofY + 6, 0, 1, 160), new THREE.MeshPhysicalMaterial({ color: 0x8fb6a8, transparent: true, opacity: .22, roughness: .04, side: THREE.DoubleSide, depthWrite: false })); tower.add(crownGlass);
  const leaf = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, flatShading: false }), trunk = new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: .9 });
  const blob = (r, x, y, z, seed) => { const g = new THREE.IcosahedronGeometry(r, 2), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), n = 1 + .16 * Math.sin(vx * 3.1 + seed) * Math.cos(vz * 2.7 + seed * 2) + .1 * Math.sin(vy * 4.3 + seed * 3); p.setXYZ(i, vx * n, vy * n * .82, vz * n); } g.translate(x, y, z); g.computeVertexNormals(); return g; };
  const crownG = mergeGeometries([blob(1.5, 0, 3.5, 0, 1), blob(1.1, .9, 3.0, .4, 2), blob(1.05, -.8, 3.1, -.5, 3), blob(.9, .2, 4.4, -.3, 4)].map((g) => g.toNonIndexed()));
  const treeG = mergeGeometries([new THREE.CylinderGeometry(.14, .24, 3, 6).translate(0, 1.5, 0).toNonIndexed(), crownG], true);
  const greens = [0x3d6b34, 0x4a7a3a, 0x335f2f, 0x5a8442, 0x2f5530, 0x46703c].map((c) => new THREE.Color(c));
  function treeField(pts, y, sMin = .8, sMax = 1.4) { const m = new THREE.InstancedMesh(treeG, [trunk, leaf], pts.length); pts.forEach(([x, z], i) => { m.setColorAt(i, greens[Math.floor(Math.random() * greens.length)]); const s = sMin + Math.random() * (sMax - sMin); M.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.random() * 6, 0)), new THREE.Vector3(s, s, s)); m.setMatrixAt(i, M); }); m.castShadow = true; m.receiveShadow = true; return m; }
  { const pts = []; for (let i = 0; i < 26; i++) { const p = OUT.at(i / 26); pts.push([p.x * .78, p.z * .7]); } tower.add(treeField(pts, roofY + .1, .6, .9)); }
  const crownLight = new THREE.PointLight(0xffd9a0, 0, 60, 1.6); crownLight.position.set(0, roofY + 3, 0); tower.add(crownLight);

  // podium: car park screen fins, lobby glass, pool deck
  const PW = 66, PD = 50, PH = (F0 - 1) * FH - FH;
  const podium = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, PD), new THREE.MeshStandardMaterial({ color: 0xd9d4ca, roughness: .8 })); podium.position.y = PH / 2; podium.castShadow = podium.receiveShadow = true; scene.add(podium);
  { const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(.35, PH - 6, 1.1), finMat, 260); let n = 0; for (let x = -PW / 2 + 1; x <= PW / 2 - 1; x += 1.3) for (const z of [-PD / 2 - .6, PD / 2 + .6]) { M.makeTranslation(x, PH / 2 + 3, z); fins.setMatrixAt(n++, M); } for (let z = -PD / 2 + 1; z <= PD / 2 - 1; z += 1.3) for (const x of [-PW / 2 - .6, PW / 2 + .6]) { M.makeRotationY(Math.PI / 2).setPosition(x, PH / 2 + 3, z); if (n < 260) fins.setMatrixAt(n++, M); } fins.count = n; fins.castShadow = true; scene.add(fins); }
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(PW + .4, 5.6, PD + .4), new THREE.MeshPhysicalMaterial({ color: 0x2a3438, roughness: .08, metalness: .2, emissive: 0xffc98a, emissiveIntensity: 0 })); lobby.position.y = 2.8; scene.add(lobby);
  const deckY = PH + .05;
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshStandardMaterial({ color: 0xa88866, roughness: .7 })); deck.rotation.x = -Math.PI / 2; deck.position.y = deckY; deck.receiveShadow = true; scene.add(deck);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(50, 7.5), new THREE.MeshPhysicalMaterial({ color: 0x2fa7c0, roughness: .03, metalness: .1, clearcoat: 1, envMapIntensity: 1.3, emissive: 0x2fb7d6, emissiveIntensity: 0 })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, deckY + .06, PD / 2 - 6); scene.add(pool);
  { const pts = []; for (let i = 0; i < 18; i++) pts.push([-PW / 2 + 3 + i * 3.6, PD / 2 - 1.6]); for (let i = 0; i < 10; i++) pts.push([-PW / 2 + 2, -PD / 2 + 3 + i * 4]); for (let i = 0; i < 10; i++) pts.push([PW / 2 - 2, -PD / 2 + 3 + i * 4]); scene.add(treeField(pts, deckY, .7, 1.1)); }
  { const lounger = new THREE.InstancedMesh(new THREE.BoxGeometry(.8, .35, 2), new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: .8 }), 14); for (let i = 0; i < 14; i++) { M.makeTranslation(-22 + i * 3.4, deckY + .2, PD / 2 - 11.5); lounger.setMatrixAt(i, M); } lounger.castShadow = true; scene.add(lounger); }

  /* ---------- the city ---------- */
  const cityMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .55, metalness: .25, envMapIntensity: .9 });
  cityMat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW; varying vec3 vNw; varying float vId;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * instanceMatrix * vec4(transformed,1.)).xyz; vNw = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal); vId = float(gl_InstanceID);');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vW; varying vec3 vNw; varying float vId; uniform float uNight, uLit; ${hashGL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float side = 1. - step(.6, abs(vNw.y)); float along = abs(vNw.x) > .5 ? vW.z : vW.x; float t = hsh(vec2(vId, 3.));
        float pitch = mix(2.6, 4.2, t); vec2 g = vec2(along/pitch, vW.y/3.6); vec2 c = floor(g), f = fract(g);
        float aa = clamp(1.6 - max(fwidth(g.x), fwidth(g.y))*2.2, 0., 1.);
        float win = mix(.5, step(.18, f.x)*step(f.x, .82)*step(.22, f.y)*step(f.y, .86), aa)*side*step(4., vW.y);
        vec3 body = t < .33 ? vec3(.70,.70,.68) : t < .6 ? vec3(.74,.68,.58) : t < .8 ? vec3(.22,.28,.33) : vec3(.40,.34,.28);
        float curtainWall = step(.6, t); win = max(win, curtainWall*side*step(.06, f.y)*step(4., vW.y));
        vec3 glassC = mix(vec3(.08,.12,.15), vec3(.15,.2,.24), hsh(c + vId)) * (t > .8 ? vec3(1.2,1.,.8) : vec3(1.));
        diffuseColor.rgb = mix(body, glassC, win); diffuseColor.rgb *= mix(1., .55, 1. - side);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float r = hsh(c*1.31 + vec2(vId*7.7, vId)); float lit = mix(uLit*.6, step(1. - uLit*.75, r), aa)*win;
        totalEmissiveRadiance += mix(vec3(1.,.74,.45), vec3(.85,.9,1.), step(.75, hsh(c + vId*2.))) * lit * uNight * .8;
        totalEmissiveRadiance += vec3(1.,.15,.1)*step(.985, t)*step(vW.y, 999.)*0.;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(.75, .08, win);');
  };
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
  const NB = COARSE ? 520 : 900, city = new THREE.InstancedMesh(box, cityMat, NB);
  const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  let nb = 0; const blocks = [];
  for (let i = 0; i < NB * 6 && nb < NB; i++) {
    const a = rnd() * Math.PI * 2, dist = 330 + Math.pow(rnd(), .8) * 1400, x = Math.cos(a) * dist, z = Math.sin(a) * dist;
    if (Math.abs(x % 140) < 14 || Math.abs(z % 140) < 14) continue; // roads
    const north = sstep(200, -500, z) * sstep(-1400, -500, z) + .25, hills = z > 260;
    if (hills && rnd() < .85) continue;
    const w = 16 + rnd() * 26, d = 16 + rnd() * 26, h = 14 + Math.pow(rnd(), 2.4) * 230 * north * sstep(1600, 300, dist) + (rnd() < .3 ? 0 : rnd() * 30);
    M.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.round(rnd() * 4) * Math.PI / 2 + (rnd() - .5) * .15, 0)), new THREE.Vector3(w, h, d)); city.setMatrixAt(nb++, M); blocks.push([x, z, w, d, h]);
  }
  city.count = nb; city.castShadow = true; city.receiveShadow = true; scene.add(city);
  // landmark towers to the north (generic, tapered)
  const aviMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, .3, .2), toneMapped: false });
  [[-520, -820, 330, 42], [-380, -900, 270, 36], [140, -760, 305, 40], [380, -1100, 250, 34], [-80, -1250, 360, 46]].forEach(([x, z, h, w]) => {
    const parts = [box.clone().scale(w, h * .62, w), box.clone().scale(w * .8, h * .22, w * .8).translate(0, h * .62, 0), box.clone().scale(w * .55, h * .12, w * .55).translate(0, h * .84, 0), new THREE.CylinderGeometry(.6, 1.6, h * .1, 6).translate(0, h * .96 + h * .05, 0)];
    const g = mergeGeometries(parts.map((p) => p.toNonIndexed())); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xb8c0c6, roughness: .2, metalness: .7, envMapIntensity: 1.2 })); m.position.set(x, 0, z); m.castShadow = true; scene.add(m);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), aviMat); beacon.position.set(x, h * 1.02, z); scene.add(beacon);
  });
  // ground with roads, parks and street lights
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .95 });
  groundMat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vW; uniform float uNight; ${hashGL} float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 q = mod(vW.xz + 7., 140.); float road = 1. - step(14., q.x)*step(14., q.y);
        float rr = length(vW.xz); float park = smoothstep(.55,.62, vn(vW.xz*.004)) + smoothstep(240., 330., vW.z) + (1. - smoothstep(250., 300., rr)); road *= smoothstep(285., 300., rr) + step(rr, 1.)*0.; float plaza = 1. - smoothstep(48., 52., max(abs(vW.x) - 30., abs(vW.z) - 22.) + 50.);
        vec3 base = mix(vec3(.36,.35,.33), vec3(.17,.25,.12), clamp(park,0.,1.)); base *= .85 + .3*vn(vW.xz*.05);
        vec3 asphalt = vec3(.16,.16,.17); float lane = step(abs(min(q.x,q.y) - 7.), .18)*step(.5, fract((max(q.x,q.y))*.08));
        diffuseColor.rgb = mix(base, asphalt + lane*.5, road); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62,.6,.56), plaza);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float edge = min(abs(q.x - 1.), abs(q.x - 13.)); float edge2 = min(abs(q.y - 1.), abs(q.y - 13.));
        float lamp = (1. - smoothstep(.0, 2.2, min(edge, edge2)))*step(.82, fract(max(q.x,q.y)/12.))*road;
        totalEmissiveRadiance += vec3(1.,.66,.3)*(road*.07 + lamp*1.6)*uNight*smoothstep(2200., 300., length(vW.xz));`);
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // southern hills
  { const g = new THREE.PlaneGeometry(4200, 1600, 140, 60); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const t = (z + 800) / 1600; const h = Math.max(0, Math.sin(x * .0021 + 1.3) * 70 + Math.sin(x * .0057) * 40 + Math.cos(x * .0013 + z * .002) * 60 + 90) * sstep(0, .35, t); p.setY(i, h); } g.computeVertexNormals();
    const hills = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x2f4a2c, roughness: 1 })); hills.position.set(0, -2, 1450); hills.receiveShadow = true; scene.add(hills); }
  // street trees around the site
  { const pts = []; for (let i = 0; i < 70; i++) { const a = i / 70 * Math.PI * 2; pts.push([Math.cos(a) * (PW / 2 + 12 + (i % 2) * 4), Math.sin(a) * (PD / 2 + 12 + (i % 2) * 4)]); } let g = 0; while (pts.length < (COARSE ? 380 : 700) && g++ < 5000) { const a = Math.random() * 6.283, r = 70 + Math.random() * 220, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 52 && Math.abs(z) < 42) continue; pts.push([x, z]); } scene.add(treeField(pts, 0, 1.6, 3.2)); }

  /* ---------- highlight bands ---------- */
  const hlMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.15, .55), transparent: true, opacity: .0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const floorBand = new THREE.Mesh(wall(1.78, -.3, FH - .3, 0, 1, 200), hlMat); floorBand.visible = false; tower.add(floorBand);
  const unitMat = hlMat.clone(); unitMat.color = new THREE.Color(2.4, 1.7, .8);
  let unitBand = null;
  const floorY = (f) => Y0 + (f - F0) * FH;

  /* ---------- time of day ---------- */
  const sunDir = new THREE.Vector3();
  let hour = 18.4;
  function setTime(h) {
    hour = h; const u = (h - 7.0) / 12.15, alt = Math.sin(Math.PI * u), elev = alt > 0 ? Math.asin(alt) * .95 : Math.asin(clamp(alt, -1, 1)) * .4;
    const az = Math.PI * clamp(u, -.1, 1.1);
    sunDir.set(Math.cos(az) * Math.cos(elev), Math.sin(elev), Math.cos(elev) * .32).normalize(); // east (+x) → west (−x), a little to the south (+z)
    su.sunPosition.value.copy(sunDir); sky2.material.uniforms.sunPosition.value.copy(sunDir); ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG'].forEach((k) => { sky2.material.uniforms[k].value = su[k].value; });
    const day = sstep(-.05, .25, alt), low = Math.exp(-Math.pow(alt / .2, 2)) * sstep(-.3, 0, alt), night = 1 - sstep(-.22, .04, alt);
    sun.position.copy(sunDir).multiplyScalar(500); sun.target.position.set(0, 60, 0); sun.intensity = 3.2 * sstep(-.02, .14, alt); sun.color.setRGB(1, lerp(.6, .97, sstep(0, .5, alt)), lerp(.36, .9, sstep(0, .5, alt)));
    hemi.intensity = .06 + .55 * day; hemi.color.setRGB(lerp(.3, .8, day), lerp(.34, .88, day), lerp(.5, 1, day));
    scene.fog.color.setRGB(lerp(.035, .5, day) + low * .3, lerp(.04, .6, day) + low * .12, lerp(.07, .74, day));
    scene.fog.density = lerp(.00045, .00028, day);
    U.uNight.value = sstep(.18, -.12, alt); U.uLit.value = h > 23.5 || h < 5.5 ? .18 : h > 21.5 ? .4 : .55;
    dome.material.uniforms.uN.value = night * .96;
    renderer.toneMappingExposure = lerp(.6, .4, day) + low * .12 + night * .15;
    crownLight.intensity = 260 * U.uNight.value; lobby.material.emissiveIntensity = 1.1 * U.uNight.value; pool.material.emissiveIntensity = .9 * U.uNight.value;
    if (Math.abs(h - envH) > .2) { envH = h; envGround.material.color.setRGB(lerp(.02, .2, day), lerp(.02, .21, day), lerp(.03, .22, day)); if (envRT) envRT.dispose(); envRT = pmrem.fromScene(envScene, .02); scene.environment = envRT.texture; }
  }

  /* ---------- camera modes ---------- */
  const cam = { pos: new THREE.Vector3(150, 40, 180), look: new THREE.Vector3(0, 80, 0) }, goal = { pos: cam.pos.clone(), look: cam.look.clone() };
  const shotCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  let mode = 'hero', heroP = 0, selF = 30, selK = 2, yaw = 0, pitch = 0, tyaw = 0, tpitch = 0, orbitA = .7;
  function viewFor(f, k) { const c = unitCentre(k), y = floorY(f) + 1.6, base = new THREE.Vector3(c.x + c.nx * .35, y, c.z + c.nz * .35); const dir = new THREE.Vector3(c.nx, -.2, c.nz).normalize(); return { base, dir }; }
  function computeGoal(t) {
    const portrait = camera.aspect < .85;
    if (mode === 'hero') { const a = orbitA + heroP * 1.1 + t * .02, r = (portrait ? 290 : 210) - heroP * 30, y = 30 + heroP * 70; goal.pos.set(Math.sin(a) * r, y, Math.cos(a) * r); goal.look.set(0, 70 + heroP * 40, 0); }
    else if (mode === 'picker') { const c = unitCentre(selK), a = Math.atan2(c.nx, c.nz) + .25, r = portrait ? 420 : 330, fy = floorY(selF); goal.pos.set(Math.sin(a) * r, 40 + fy * .35, Math.cos(a) * r); goal.look.set(0, 72 + fy * .12, 0); }
    else if (mode === 'shot') { goal.pos.copy(shotCam.pos); goal.look.copy(shotCam.look); }
    else if (mode === 'view') { const v = viewFor(selF, selK); goal.pos.copy(v.base); const d = v.dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); d.y += pitch; goal.look.copy(v.base).add(d.multiplyScalar(50)); }
  }
  function setMode(m) { if (m === mode) return; mode = m; camera.near = m === 'view' ? .1 : .5; camera.fov = m === 'view' ? (camera.aspect < .85 ? 70 : 56) : (camera.aspect < .85 ? 50 : 38); camera.updateProjectionMatrix(); yaw = tyaw = pitch = tpitch = 0; floorBand.visible = m === 'picker'; if (unitBand) unitBand.visible = m === 'picker'; jump = m === 'view' || lastMode === 'view'; lastMode = m; frameOffset(); }
  let jump = false, lastMode = 'hero';
  function select(f, k) {
    selF = f; selK = k; floorBand.position.y = floorY(f) + .05;
    if (unitBand) { tower.remove(unitBand); unitBand.geometry.dispose(); }
    const s0 = (k - .5) / UNITS, s1 = (k + .5) / UNITS; unitBand = new THREE.Mesh(wall(1.86, -.3, FH - .3, s0, s1, 200), unitMat); unitBand.position.y = floorY(f) + .05; unitBand.visible = mode === 'picker'; tower.add(unitBand);
  }
  // view-mode look-around by drag
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { if (mode !== 'view') return; drag = { x: e.clientX, y: e.clientY, yaw: tyaw, pitch: tpitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; tyaw = clamp(drag.yaw - (e.clientX - drag.x) * .004, -1.1, 1.1); tpitch = clamp(drag.pitch + (e.clientY - drag.y) * .003, -.45, .35); });
  canvas.addEventListener('pointerup', () => { drag = null; });
  // picking floors/units on the tower
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(x, y) {
    const r = canvas.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(glass, false)[0]; if (!hit) return null;
    const f = Math.floor((hit.point.y - Y0) / FH) + F0; if (f < F0 || f > F1) return null;
    const s = hit.uv.x; const k = Math.round(s * UNITS) % UNITS; return { f, k };
  }

  /* ---------- post + loop ---------- */
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: COARSE ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .45, .5, .85); composer.addPass(bloom); composer.addPass(new OutputPass());
  function frameOffset() { const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height), wide = w / h > 1.05;
    if (wide && mode === 'hero') camera.setViewOffset(w, h, -w * .17, 0, w, h); else if (wide && mode === 'picker') camera.setViewOffset(w, h, w * .2, 0, w, h); else if (!wide && mode === 'picker') camera.setViewOffset(w, h, 0, h * .2, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
  function resize() { const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); camera.aspect = w / h; camera.fov = mode === 'view' ? (camera.aspect < .85 ? 70 : 56) : (camera.aspect < .85 ? 50 : 38); frameOffset(); }
  addEventListener('resize', resize); resize();
  let visible = true; new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  const clock = new THREE.Clock(); setTime(hour); select(selF, selK);
  let ready = false; requestAnimationFrame(() => { ready = true; onReady && onReady(); });
  (function loop() {
    requestAnimationFrame(loop); const raw = clock.getDelta(), dt = Math.min(raw, .05), rdt = Math.min(raw, .35), t = clock.elapsedTime; if (!visible || document.hidden) return;
    yaw += (tyaw - yaw) * (1 - Math.exp(-rdt * 8)); pitch += (tpitch - pitch) * (1 - Math.exp(-rdt * 8));
    computeGoal(t); const k = jump ? 1 : 1 - Math.exp(-rdt * (mode === 'view' ? 6 : 2.2)); jump = false;
    cam.pos.lerp(goal.pos, k); cam.look.lerp(goal.look, k); camera.position.copy(cam.pos); camera.lookAt(cam.look);
    const pulse = .55 + .25 * Math.sin(t * 3); hlMat.opacity = mode === 'picker' ? .3 : 0; unitMat.opacity = mode === 'picker' ? pulse : 0;
    U.uTime.value = t; composer.render();
  })();
  return { shot(p, l) { shotCam.pos.set(...p); shotCam.look.set(...l); mode = 'none'; setMode('shot'); jump = true; }, setTime, setMode, select, pickAt, setHeroProgress(p) { heroP = p; }, resize, get mode() { return mode; }, get hour() { return hour; }, floorY, renderer };
}
