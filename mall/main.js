import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = (s) => document.querySelector(s);
const TAU = Math.PI * 2;
const MALL = window.MALL;
const { UNITS, STALLS, STALL_ITEMS, MOVIES, PROD, CATNAME, DESC, COLORS, LV, ESC, walkAt, shade } = MALL;
const COARSE = matchMedia('(pointer:coarse)').matches;
const cv = $('#gl');
let ready = false;

/* =========================== RENDERER =========================== */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !COARSE, powerPreference: 'high-performance' }); }
catch (e) { document.documentElement.classList.add('nogl'); throw e; }
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;
let pixelScale = COARSE ? Math.min(devicePixelRatio, 1.5) * 0.75 : Math.min(devicePixelRatio, 1.5);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfd6dc);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 260);
scene.add(camera);

const manager = new THREE.LoadingManager();
manager.onProgress = (u, a, b) => { $('#lbar').style.width = Math.round(a / b * 85) + '%'; };
const texLoader = new THREE.TextureLoader(manager);
const fileLoader = new THREE.FileLoader(manager); fileLoader.setResponseType('json');
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const b64 = (s) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
function tex(name, srgb) {
  const t = texLoader.load('tex/' + name + '.jpg');
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, maxAniso);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const TX = {};
for (const k of ['marble', 'terrazzo', 'wood', 'plaster', 'parquet']) TX[k] = { map: tex(k + '_diff', true), normalMap: tex(k + '_nor'), roughnessMap: tex(k + '_rough') };

/* =========================== BAKED-LIGHT MATERIALS =========================== */
// Diffuse light comes from the Cycles bake (per-vertex irradiance); reflections come from a local probe
// and, on the floor you stand on, from a live planar mirror pass.
const SH = {
  uBake: { value: 1.0 }, uTime: { value: 0 }, uReflOn: { value: 0 }, uReflY: { value: 0 }, uReflMat: { value: new THREE.Matrix4() },
  tRefl: { value: null }, uReflTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) }, uConstIrr: { value: 2.0 }
};
const MAPS_CHUNK = THREE.ShaderChunk.lights_fragment_maps
  .replace('iblIrradiance += getIBLIrradiance( geometryNormal );', 'iblIrradiance += BAKED_IRR;')
  .replace(/(radiance \+= getIBLRadiance\( geometryViewDir, geometryNormal, material\.roughness \);)/, '$1\n\t\tPLANAR_HOOK');
function baked(params, opt = {}) {
  const m = new THREE.MeshStandardMaterial(params);
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, SH);
    const hasIrr = !opt.constIrr;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\n' + (hasIrr ? 'attribute vec3 irr;\n' : '') + (opt.steps ? 'attribute float sdir; varying float vSdir;\n' : '') + 'varying vec3 vIrr; varying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (hasIrr ? 'vIrr = irr*irr*8.0; vIrr -= max(vIrr - 3.0, 0.0)*0.62;' : 'vIrr = vec3(1.0);') + (opt.steps ? ' vSdir = sdir;' : ''))
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix*vec4(transformed,1.0)).xyz;');
    let planar = '';
    if (opt.planar) planar = `
      if (uReflOn > 0.5 && abs(vWPos.y - uReflY) < 0.04) {
        vec4 rc = uReflMat*vec4(vWPos, 1.0); vec2 ruv = rc.xy/rc.w + normal.xy*0.006;
        float bl = 0.6 + material.roughness*6.0; vec2 tx = uReflTexel*bl;
        vec3 rr = texture2D(tRefl, ruv).rgb*0.4 + texture2D(tRefl, ruv + vec2(tx.x, 0.)).rgb*0.15 + texture2D(tRefl, ruv - vec2(tx.x, 0.)).rgb*0.15
                + texture2D(tRefl, ruv + vec2(0., tx.y)).rgb*0.15 + texture2D(tRefl, ruv - vec2(0., tx.y)).rgb*0.15;
        radiance = mix(radiance, rr, ${opt.planar.toFixed(2)});
      }`;
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vIrr; varying vec3 vWPos; ${opt.steps ? 'varying float vSdir;' : ''}
        uniform float uBake; uniform float uTime; uniform float uReflOn; uniform float uReflY; uniform mat4 uReflMat; uniform sampler2D tRefl; uniform vec2 uReflTexel; uniform float uConstIrr;`)
      .replace('#include <lights_fragment_maps>', MAPS_CHUNK
        .replace('BAKED_IRR', hasIrr ? 'vIrr*PI*uBake' : 'vec3(uConstIrr)*PI')
        .replace('PLANAR_HOOK', planar));
    if (opt.ceiling) s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { vec2 c = (floor(vWPos.xz/2.4) + .5)*2.4; float d = length(vWPos.xz - c);
        bool vo = c.x > 16. && c.x < 80. && abs(c.y) < 6.; bool shop = abs(c.y) > 11.; bool boh = shop && (c.x < 8. || c.x > 88.);
        if (!vo && !boh && c.x > .4 && c.x < 95.6 && abs(c.y) < 18.) {
          if (d < .1) totalEmissiveRadiance = (shop ? vec3(1., .86, .7) : vec3(1., .95, .88))*30.;
          else if (d < .135) diffuseColor.rgb *= .55;
        } }`);
    if (opt.steps) s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { float sx = vWPos.x - uTime*.5*vSdir; float rib = step(.5, fract(sx*28.)); float edge = step(fract(sx/.4), .06);
        diffuseColor.rgb = mix(mix(vec3(.10), vec3(.2), rib), vec3(.95, .72, .08), edge); }`);
  };
  m.customProgramCacheKey = () => JSON.stringify(opt);
  return m;
}

/* =========================== MATERIALS =========================== */
let atlasA, atlasB, probeTex = null;
const MAT = {};
function makeMaterials() {
  atlasA = new THREE.CanvasTexture(MALL.A); atlasA.colorSpace = THREE.SRGBColorSpace; atlasA.anisotropy = Math.min(8, maxAniso); atlasA.flipY = false;
  atlasB = new THREE.CanvasTexture(MALL.B); atlasB.colorSpace = THREE.SRGBColorSpace; atlasB.anisotropy = Math.min(8, maxAniso); atlasB.flipY = false;
  const T = TX;
  MAT.m0 = baked({ ...T.marble, color: new THREE.Color(1.5, 1.56, 1.66), roughness: 0.5, envMapIntensity: 1 }, { planar: 0.92 });
  MAT.m1 = baked({ ...T.plaster, color: 0xffffff, vertexColors: true, roughness: 1, normalScale: new THREE.Vector2(.35, .35) });
  MAT.m2 = baked({ ...T.plaster, color: new THREE.Color(1.95, 1.97, 2.05), roughness: 1, normalScale: new THREE.Vector2(.2, .2) }, { ceiling: 1 });
  MAT.m4 = baked({ color: 0xffffff, vertexColors: true, metalness: 1, roughness: .28 });
  MAT.m5 = baked({ map: atlasA, emissiveMap: atlasA, emissive: 0xffffff, emissiveIntensity: 1.25, roughness: .4 });
  MAT.m6 = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(.55, .55, .55) });
  MAT.m7 = baked({ map: atlasB, emissiveMap: atlasB, emissive: 0xffffff, emissiveIntensity: .55, roughness: .3 });
  MAT.m8 = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.5, 2.6) });
  MAT.m9 = baked({ color: 0xffffff, roughness: .5, metalness: .5 }, { steps: 1 });
  MAT.m10 = baked({ ...T.wood, color: 0xffffff, vertexColors: true, roughness: .6 }, { planar: .35 });
  MAT.m10f = baked({ ...T.parquet, color: new THREE.Color(1.15, 1.1, 1.05), roughness: .5 }, { planar: .45 });
  MAT.m11 = baked({ color: 0xffffff, vertexColors: true, roughness: .55 });
  MAT.m12 = baked({ color: 0xffffff, vertexColors: true, roughness: .6 });
  MAT.m12f = baked({ ...T.marble, color: new THREE.Color(1.5, 1.52, 1.55), roughness: .45 }, { planar: .8 });
  MAT.m13 = baked({ ...T.terrazzo, color: new THREE.Color(1.45, 1.45, 1.45), roughness: .4 }, { planar: .7 });
  MAT.m15 = baked({ map: atlasB, roughness: .7 });
  MAT.m3 = new THREE.MeshStandardMaterial({ color: 0xcfe6e3, vertexColors: false, metalness: 0, roughness: .04, transparent: true, opacity: .07, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: .7 });
  MAT.m14 = baked({ map: atlasB, transparent: true, depthWrite: false, roughness: .9, polygonOffset: true, polygonOffsetFactor: -2 }, { constIrr: 1 });
}
const UVSCALE = { m0: 1 / 2, m1: 1 / 2, m2: 1 / 2.4, m10: 1 / 1.2, m10f: 1 / 3.4, m12f: 1 / 2, m13: 1 / 2 };

/* =========================== GEOMETRY =========================== */
const meshes = [];
function buildScene(irr) {
  const r = MALL.build(), OP = r.OP, TR = r.TR, ST = MALL.ST;
  const N = OP.length / ST;
  // OP buckets keyed by material (decided per triangle on its first vertex)
  const groups = {};
  const keyT = (arr, t) => {
    const o = t * ST, m = arr[o + 8];
    if (m === 8) return arr[o + 1] > 15 ? 'm8sky' : 'm8';
    if ((m === 10 || m === 12) && arr[o + 4] > .9) { const y = arr[o + 1]; for (let L = 0; L < 3; L++) if (Math.abs(y - LV[L]) < .01) return 'm' + m + 'f'; }
    return 'm' + m;
  };
  for (let t = 0; t < N; t += 3) { const k = keyT(OP, t); (groups[k] = groups[k] || []).push(t); }
  const make = (arr, list, k, irrArr) => {
    const nv = list.length * 3, P = new Float32Array(nv * 3), Nn = new Float32Array(nv * 3), U = new Float32Array(nv * 2), C = new Float32Array(nv * 3);
    const I = irrArr ? new Uint8Array(nv * 3) : null, D = k === 'm9' ? new Float32Array(nv) : null; const flat = irrArr === 'flat';
    const sc = UVSCALE[k];
    let w = 0;
    for (const t of list) for (let v = 0; v < 3; v++) {
      const s = (t + v) * ST, o3 = w * 3, o2 = w * 2;
      const x = arr[s], y = arr[s + 1], z = arr[s + 2], nx = arr[s + 3], ny = arr[s + 4], nz = arr[s + 5];
      P[o3] = x; P[o3 + 1] = y; P[o3 + 2] = z; Nn[o3] = nx; Nn[o3 + 1] = ny; Nn[o3 + 2] = nz;
      if (sc) {
        const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
        if (ay > ax && ay > az) { U[o2] = x * sc; U[o2 + 1] = z * sc; } else if (ax > az) { U[o2] = z * sc; U[o2 + 1] = y * sc; } else { U[o2] = x * sc; U[o2 + 1] = y * sc; }
      } else { U[o2] = arr[s + 6]; U[o2 + 1] = arr[s + 7]; }
      C[o3] = arr[s + 9]; C[o3 + 1] = arr[s + 10]; C[o3 + 2] = arr[s + 11];
      if (D) D[w] = arr[s + 9];
      if (I) { if (flat) { I[o3] = I[o3 + 1] = I[o3 + 2] = 128; } else { const si = (t + v) * 3; I[o3] = irrArr[si]; I[o3 + 1] = irrArr[si + 1]; I[o3 + 2] = irrArr[si + 2]; } }
      w++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    if (I) g.setAttribute('irr', new THREE.BufferAttribute(I, 3, true));
    if (D) g.setAttribute('sdir', new THREE.BufferAttribute(D, 1));
    g.computeBoundingSphere();
    return g;
  };
  for (const k in groups) {
    if (k === 'm8sky') continue; // real sky shows through the skylight
    const mat = MAT[k]; if (!mat) continue;
    const g = make(OP, groups[k], k, irr);
    const mesh = new THREE.Mesh(g, mat); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false;
    scene.add(mesh); meshes.push(mesh);
  }
  // transparent: glass + kolam
  const tg = {};
  for (let t = 0; t < TR.length / ST; t += 3) { const k = 'm' + TR[t * ST + 8]; (tg[k] = tg[k] || []).push(t); }
  for (const k in tg) {
    const mat = MAT[k]; if (!mat) continue;
    const mesh = new THREE.Mesh(make(TR, tg[k], k, null), mat); mesh.renderOrder = k === 'm14' ? 1 : 2; mesh.matrixAutoUpdate = false; scene.add(mesh); meshes.push(mesh);
  }
}

/* =========================== SHOPPERS =========================== */
function personGeometry(hijab) {
  const P = [], N = [], PART = [];
  const push = (g, part, m) => {
    g = g.toNonIndexed(); if (m) g.applyMatrix4(m); g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); }
    for (let i = 0; i < p.length / 3; i++) PART.push(part);
  };
  const M4 = (x, y, z, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg || 18);
  // legs
  for (const sd of [-1, 1]) {
    push(lathe([[0, .07], [.062, .08], [.07, .3], [.058, .48], [.07, .62], [.085, .9], [0, .92]], 12), 1, M4(sd * .088, 0, 0));
    push(new THREE.SphereGeometry(1, 10, 8), 4, M4(sd * .088, .045, .035, .06, .045, .12));
  }
  // hips + torso (lathe profile, slightly flattened front-to-back)
  push(lathe([[0, .84], [.15, .86], [.165, .95], [.15, 1.06], [.16, 1.2], [.18, 1.32], [.16, 1.4], [.07, 1.45], [0, 1.46]], 20), 0, M4(0, 0, 0, 1, 1, .72));
  push(lathe([[.152, .84], [.168, .9], [.168, .99], [.15, 1.0]], 20), 1, M4(0, 0, 0, 1, 1, .74));
  // arms
  for (const sd of [-1, 1]) {
    push(lathe([[0, .82], [.04, .84], [.042, 1.0], [.05, 1.18], [.058, 1.36], [0, 1.42]], 10), 0, M4(sd * .215, 0, 0));
    push(new THREE.SphereGeometry(1, 10, 8), 2, M4(sd * .215, .8, .0, .042, .055, .036));
  }
  // neck + head
  push(new THREE.CylinderGeometry(.048, .052, .12, 12), 2, M4(0, 1.47, 0));
  push(new THREE.SphereGeometry(1, 20, 16), 2, M4(0, 1.6, .005, .095, .118, .108));
  push(new THREE.SphereGeometry(1, 8, 6), 2, M4(0, 1.585, .105, .018, .026, .02)); // nose
  if (hijab) {
    push(new THREE.SphereGeometry(1, 20, 16, 0, TAU, 0, Math.PI * .62), 3, M4(0, 1.6, -.012, .118, .135, .124));
    push(lathe([[.075, 1.52], [.11, 1.47], [.2, 1.37], [.235, 1.3], [.22, 1.27], [.0, 1.27]], 20), 3, M4(0, 0, 0, 1, 1, .8));
  } else {
    push(new THREE.SphereGeometry(1, 20, 14, 0, TAU, 0, Math.PI * .55), 3, M4(0, 1.615, -.012, .104, .118, .116));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('part', new THREE.Float32BufferAttribute(PART, 1));
  return g;
}
const PEOPLE = [];
const SKIN = [[.78, .58, .44], [.62, .42, .3], [.45, .3, .2], [.85, .68, .55], [.55, .38, .26]];
const CLOTH = [[.8, .15, .15], [.12, .3, .6], [.95, .95, .92], [.1, .1, .12], [.2, .5, .35], [.85, .7, .2], [.55, .3, .55], [.3, .55, .7], [.9, .55, .6], [.45, .45, .48]];
const PANTS = [[.12, .15, .25], [.18, .18, .2], [.35, .3, .25], [.7, .65, .55], [.1, .1, .1]];
const HAIR = [[.05, .04, .04], [.08, .06, .05], [.15, .1, .07]];
const rndC = (a) => a[Math.floor(Math.random() * a.length)];
function personMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, envMapIntensity: 1 });
  const u = { uWalk: { value: 0 } };
  m.onBeforeCompile = (s) => {
    s.uniforms.uWalk = u.uWalk;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float part; uniform float uWalk;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float side = transformed.x < 0. ? -1. : 1.; float sw = sin(uWalk);
        if (part > .5 && part < 1.5 && transformed.y < .9) transformed.z += (.9 - transformed.y)*sw*side*.42;
        if (part < .5 && abs(transformed.x) > .19 && transformed.y < 1.4) transformed.z -= (1.4 - transformed.y)*sw*side*.3;
        if (part > 1.5 && part < 2.5 && abs(transformed.x) > .19 && transformed.y < .9) transformed.z -= (1.4 - transformed.y)*sw*side*.3;
        if (part > 3.5 && transformed.y < .12) transformed.z += .9*sw*side*.42*.5;`);
  };
  m.userData.u = u;
  return m;
}
function randSpot(L) {
  for (let k = 0; k < 40; k++) {
    const x = 4 + Math.random() * 88, z = (Math.random() * 2 - 1) * 10.3;
    if (L > 0 && Math.abs(z) < 6.8 && x > 15 && x < 81) continue;
    if (walkAt(L, x, z) && walkAt(L, x + .4, z) && walkAt(L, x - .4, z) && walkAt(L, x, z + .4) && walkAt(L, x, z - .4)) return [x, z];
  }
  return null;
}
function lineClear(L, a, b) { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(d / .4); for (let i = 1; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; if (!walkAt(L, x, z) || !walkAt(L, x + .3, z) || !walkAt(L, x - .3, z) || !walkAt(L, x, z + .3) || !walkAt(L, x, z - .3)) return false; } return true; }
function initPeople(n) {
  const base = [personGeometry(false), personGeometry(true)];
  for (let i = 0; i < n; i++) {
    const L = i % 3, s = randSpot(L); if (!s) continue;
    const hijab = Math.random() < .35, shirt = rndC(CLOTH);
    const pal = [shirt, hijab && Math.random() < .6 ? shirt : rndC(PANTS), rndC(SKIN), hijab ? rndC(CLOTH) : rndC(HAIR), [.12, .1, .1]];
    const g = base[hijab ? 1 : 0].clone(), part = g.attributes.part.array, col = new Float32Array(part.length * 3);
    for (let v = 0; v < part.length; v++) { const c = pal[part[v] | 0]; const lin = (x) => Math.pow(x, 2.2); col[v * 3] = lin(c[0]); col[v * 3 + 1] = lin(c[1]); col[v * 3 + 2] = lin(c[2]); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = personMaterial(), mesh = new THREE.Mesh(g, mat), sc = .93 + Math.random() * .14;
    mesh.scale.setScalar(sc); scene.add(mesh);
    PEOPLE.push({ L, x: s[0], z: s[1], tx: s[0], tz: s[1], yaw: Math.random() * TAU, sp: .9 + Math.random() * .45, wait: Math.random() * 3, ph: Math.random() * TAU, mesh });
  }
}
function stepPeople(dt) {
  for (const q of PEOPLE) {
    if (q.wait > 0) { q.wait -= dt; }
    else {
      const dx = q.tx - q.x, dz = q.tz - q.z, d = Math.hypot(dx, dz);
      if (d < .3) {
        q.wait = Math.random() < .5 ? 1 + Math.random() * 5 : 0;
        for (let k = 0; k < 8; k++) { const t = randSpot(q.L); if (t && Math.hypot(t[0] - q.x, t[1] - q.z) < 26 && lineClear(q.L, [q.x, q.z], t)) { q.tx = t[0]; q.tz = t[1]; break; } }
      } else {
        const pdx = q.x - P.x, pdz = q.z - P.z, pd = Math.hypot(pdx, pdz), L = Math.round(P.y / 5.5);
        if (walking && L === q.L && pd < 1.1 && !P.onEsc) { q.wait = .6; }
        else {
          const ty = Math.atan2(dz, dx); let dy = ty - q.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; q.yaw += dy * Math.min(1, dt * 6);
          const st = Math.min(d, q.sp * dt); q.x += Math.cos(q.yaw) * st; q.z += Math.sin(q.yaw) * st; q.ph += st * 5.2;
        }
      }
    }
    const moving = q.wait <= 0;
    q.mesh.position.set(q.x, LV[q.L] + (moving ? Math.abs(Math.sin(q.ph)) * .025 : 0), q.z);
    q.mesh.rotation.y = Math.PI / 2 - q.yaw;
    q.mesh.material.userData.u.uWalk.value = moving ? q.ph : 0;
  }
}

/* =========================== PROBE + MIRROR =========================== */
function renderProbe() {
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cc = new THREE.CubeCamera(0.1, 200, rt); cc.position.set(48, 7.6, 0); scene.add(cc);
  PEOPLE.forEach((q) => { q.mesh.visible = false; });
  SH.uReflOn.value = 0;
  cc.update(renderer, scene);
  PEOPLE.forEach((q) => { q.mesh.visible = true; });
  const pm = new THREE.PMREMGenerator(renderer);
  probeTex = pm.fromCubemap(rt.texture).texture;
  rt.dispose(); scene.remove(cc);
  scene.traverse((o) => { if (o.isMesh && o.material && 'envMap' in o.material) { o.material.envMap = probeTex; o.material.needsUpdate = true; } });
}
const mirror = { rt: null, cam: new THREE.PerspectiveCamera(), on: true };
const DUMMY = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); DUMMY.needsUpdate = true;
function sizeMirror() {
  const s = renderer.getDrawingBufferSize(new THREE.Vector2()), k = COARSE ? .25 : .5;
  const w = Math.max(64, Math.round(s.x * k)), h = Math.max(64, Math.round(s.y * k));
  if (!mirror.rt) mirror.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
  else mirror.rt.setSize(w, h);
  SH.tRefl.value = mirror.rt.texture; SH.uReflTexel.value.set(1 / w, 1 / h);
}
const _v = new THREE.Vector3(), _t = new THREE.Vector3(), _la = new THREE.Vector3(), _rm = new THREE.Matrix4(), _q = new THREE.Vector4(), _pl = new THREE.Plane(), _cp = new THREE.Vector4();
function renderMirror(y) {
  const vc = mirror.cam, n = new THREE.Vector3(0, 1, 0), pp = new THREE.Vector3(0, y, 0);
  const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  if (camPos.y < y) return false;
  _v.subVectors(pp, camPos).reflect(n).negate().add(pp); _v.x = camPos.x; _v.z = camPos.z; _v.y = 2 * y - camPos.y;
  _rm.extractRotation(camera.matrixWorld);
  _la.set(0, 0, -1).applyMatrix4(_rm).add(camPos);
  _t.copy(_la); _t.y = 2 * y - _la.y;
  vc.position.copy(_v); vc.up.set(0, 1, 0).applyMatrix4(_rm).reflect(n); vc.lookAt(_t);
  vc.far = camera.far; vc.updateMatrixWorld(); vc.projectionMatrix.copy(camera.projectionMatrix);
  SH.uReflMat.value.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
  _pl.setFromNormalAndCoplanarPoint(n, pp).applyMatrix4(vc.matrixWorldInverse);
  _cp.set(_pl.normal.x, _pl.normal.y, _pl.normal.z, _pl.constant);
  const pm = vc.projectionMatrix.elements;
  _q.x = (Math.sign(_cp.x) + pm[8]) / pm[0]; _q.y = (Math.sign(_cp.y) + pm[9]) / pm[5]; _q.z = -1; _q.w = (1 + pm[10]) / pm[14];
  _cp.multiplyScalar(2 / _cp.dot(_q));
  pm[2] = _cp.x; pm[6] = _cp.y; pm[10] = _cp.z + 1 - .003; pm[14] = _cp.w;
  SH.uReflOn.value = 0; SH.tRefl.value = DUMMY;
  renderer.setRenderTarget(mirror.rt); renderer.clear(); renderer.render(scene, vc); renderer.setRenderTarget(null);
  SH.tRefl.value = mirror.rt.texture; SH.uReflOn.value = 1; SH.uReflY.value = y;
  return true;
}

/* =========================== PLAYER =========================== */
var P = { x: 90, z: 0, y: 0, yaw: Math.PI, pitch: -.04, vx: 0, vz: 0, onEsc: null, bob: 0 };
var K = {}, walking = false, joy = { x: 0, y: 0 }, time = 0;
function rampY(e, x) { var t = (x - e.xb) / (e.xt - e.xb); return e.yb + (e.yt - e.yb) * Math.max(0, Math.min(1, t)); }
function onRamp(e, x, z, r) { var lo = Math.min(e.xb, e.xt) - 1.1, hi = Math.max(e.xb, e.xt) + 1.1; return x >= lo && x <= hi && z >= e.z0 + .18 + r * .5 && z <= e.z1 - .18 - r * .5; }
function support(x, z, y) {
  var best = null, bd = .55, r = .28;
  for (var L = 0; L < 3; L++) {
    var d = Math.abs(LV[L] - y); if (d > bd) { continue; }
    if (walkAt(L, x - r, z - r) && walkAt(L, x + r, z - r) && walkAt(L, x - r, z + r) && walkAt(L, x + r, z + r)) { best = { y: LV[L], esc: null }; bd = d; }
  }
  for (var i = 0; i < ESC.length; i++) { var e = ESC[i]; if (onRamp(e, x, z, r)) { var ry = rampY(e, x), d2 = Math.abs(ry - y); if (d2 < bd) { best = { y: ry, esc: e }; bd = d2; } } }
  return best;
}
function stepPlayer(dt) {
  var f = ((K.w || K.arrowup) ? 1 : 0) - ((K.s || K.arrowdown) ? 1 : 0) - joy.y;
  var s = ((K.d || K.arrowright) ? 1 : 0) - ((K.a || K.arrowleft) ? 1 : 0) + joy.x;
  var spd = K.shift ? 3.6 : 1.7, fx = Math.cos(P.yaw), fz = Math.sin(P.yaw);
  var tx = fx * f - fz * s, tz = fz * f + fx * s, tl = Math.hypot(tx, tz); if (tl > 1) { tx /= tl; tz /= tl; }
  if (!walking) { tx = tz = 0; }
  P.vx += (tx * spd - P.vx) * Math.min(1, dt * 8); P.vz += (tz * spd - P.vz) * Math.min(1, dt * 8);
  var cvx = 0;
  if (P.onEsc) { var e = P.onEsc, sg = Math.sign(e.xt - e.xb); cvx = (e.dir > 0 ? sg : -sg) * .55; }
  var nx = P.x + (P.vx + cvx) * dt, nz = P.z + P.vz * dt, sp;
  var ox = P.x, oz = P.z;
  sp = support(nx, P.z, P.y); if (sp) { P.x = nx; P.y += (sp.y - P.y) * Math.min(1, dt * 14); P.onEsc = sp.esc; } else { P.vx = 0; }
  sp = support(P.x, nz, P.y); if (sp) { P.z = nz; P.y += (sp.y - P.y) * Math.min(1, dt * 14); P.onEsc = sp.esc; } else { P.vz = 0; }
  var mv = Math.hypot(P.x - ox, P.z - oz) - (P.onEsc ? Math.abs(cvx) * dt : 0);
  if (mv > .0005 && !P.onEsc) { var before = Math.floor(P.bob / Math.PI); P.bob += mv * 2.4; if (Math.floor(P.bob / Math.PI) !== before) { stepSnd(); } }
}
/* =========================== INTERACTIONS =========================== */
var POIS = [];
function buildPOIs() {
  UNITS.forEach(function (u) { POIS.push({ kind: u.name ? 'shop' : 'hoard', u: u, level: u.level, x: u.xc, z: u.side * 11, nx: 0, nz: -u.side, title: u.name || 'Akan Dibuka', sub: u.name ? (CATNAME[u.cat] + ' · ' + u.code) : 'New store coming soon · ' + u.code }); });
  STALLS.forEach(function (st, i) { POIS.push({ kind: 'stall', i: i, level: 2, x: 2.3, z: -11 + i * 2.75 + 1.375, nx: 1, nz: 0, title: st[0], sub: 'Medan Selera · Stall ' + (i + 1) }); });
  POIS.push({ kind: 'anchor', key: 'market', level: 0, x: .4, z: 0, nx: 1, nz: 0, title: 'MyMart', sub: 'Supermarket · G-West', cat: 'market', range: 6 });
  POIS.push({ kind: 'anchor', key: 'dept', level: 1, x: 1.2, z: 0, nx: 1, nz: 0, title: 'Kedai Besar', sub: 'Department Store · L1-West', cat: 'dept', range: 6 });
  POIS.push({ kind: 'anchor', key: 'books', level: 1, x: 94.8, z: 0, nx: -1, nz: 0, title: 'Pustaka Raya', sub: 'Bookstore · L1-East', cat: 'books', range: 6 });
  POIS.push({ kind: 'anchor', key: 'cinema', level: 2, x: 93.6, z: 0, nx: -1, nz: 0, title: 'Wayang Cahaya', sub: 'Cinemas · L2-East', cat: 'cinema', range: 6 });
  POIS.push({ kind: 'kolam', level: 0, x: 36, z: 0, nx: 0, nz: 0, title: 'Deepavali Kolam', sub: 'Atrium display · view more', range: 6.5 });
  POIS.push({ kind: 'dir', level: 0, x: 86.6, z: 7.2, nx: 0, nz: -1, title: 'Mall Directory', sub: 'Find any shop', range: 3 });
  POIS.push({ kind: 'info', level: 0, x: 92, z: -7.8, nx: 0, nz: 1, title: 'Info & Concierge', sub: 'Wi-Fi, lost & found, wheelchairs', range: 3.5 });
  POIS.push({ kind: 'kiosk', level: 0, x: 67.5, z: 3.2, nx: 0, nz: -1, title: 'Case Corner', sub: 'Kiosk · phone cases', cat: 'gadget', range: 3 });
  POIS.push({ kind: 'kiosk', level: 0, x: 67.5, z: -3.2, nx: 0, nz: 1, title: 'Kuih Cart', sub: 'Kiosk · kuih & snacks', cat: 'kuih', range: 3 });
  POIS.push({ kind: 'entrance', level: 0, x: 95, z: 0, nx: -1, nz: 0, title: 'Main Entrance', sub: 'Taxi & e-hailing pick-up', range: 4 });
}
var focus = null;
function findFocus() {
  var L = Math.round(P.y / 5.5), best = null, bs = 1e9, fx = Math.cos(P.yaw), fz = Math.sin(P.yaw);
  POIS.forEach(function (p) {
    if (p.level !== L || P.onEsc) { return; }
    var dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz), rg = p.range || 4.2;
    var inside = p.kind === 'shop' && Math.abs(P.z) > 11 && Math.sign(P.z) === p.u.side && P.x > p.u.x0 && P.x < p.u.x1;
    if (!inside && d > rg) { return; }
    var facing = d > .01 ? (dx * fx + dz * fz) / d : 1;
    if (!inside && facing < .35) { return; }
    var score = inside ? -1 : d * (1.6 - facing);
    if (score < bs) { bs = score; best = p; }
  });
  return best;
}

/* =========================== UI =========================== */
var shopP = $('#shopP'), dirP = $('#dirP'), bagP = $('#bagP'), prompt = $('#prompt'), BAG = [];
function money(v) { return v === 0 ? 'Free' : 'RM ' + v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function closePanels() { [shopP, dirP, bagP].forEach(function (p) { p.classList.remove('on'); }); }
function anyOpen() { return shopP.classList.contains('on') || dirP.classList.contains('on') || bagP.classList.contains('on'); }
document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closePanels(); cv.focus(); }); });
function openPOI(p) {
  if (!p) { return; }
  if (p.kind === 'dir') { openDir(); return; }
  var cat = p.u ? p.u.cat : p.cat, color = p.u && p.u.color ? p.u.color : '#0e5a57', items = [], desc = '', facts = [], tag = '';
  $('#sCat').textContent = p.kind === 'stall' ? 'Medan Selera' : p.kind === 'hoard' ? 'Coming soon' : (CATNAME[cat] || 'Cahaya Avenue');
  $('#sName').textContent = p.title;
  var lvlName = ['Ground', 'Level 1', 'Level 2'][p.level];
  var meta = [lvlName, p.u ? 'Unit ' + p.u.code : p.sub.split(' · ')[1] || '', 'Open 10:00 AM – 10:00 PM'];
  if (p.kind === 'shop' || p.kind === 'anchor' || p.kind === 'kiosk') { items = PROD[cat] || []; desc = DESC[cat]; tag = (CATNAME[cat] || '').toUpperCase(); facts = [['Payment', 'Card · DuitNow QR · TnG'], ['Phone', '03-7' + (100 + (p.title.length * 37) % 900) + ' ' + (1000 + (p.title.length * 911) % 9000)]]; }
  if (p.kind === 'stall') { color = STALLS[p.i][1]; items = STALL_ITEMS[p.i]; desc = 'Order at the counter, take a number and find a table. Halal options are marked at every stall in Medan Selera.'; tag = 'HAWKER STALL'; facts = [['Seats', '320 · aircond'], ['Payment', 'Cash · DuitNow QR']]; }
  if (p.kind === 'hoard') { desc = 'A new store is fitting out here. Leasing enquiries: leasing@cahaya-avenue.example (fictional).'; tag = 'AKAN DIBUKA'; color = '#5b6766'; facts = [['Size', '70 m² · ' + p.u.code], ['Status', 'Fitting out']]; }
  if (p.kind === 'kolam') { color = '#7b2cbf'; tag = 'DEEPAVALI 2026'; desc = 'A kolam made of coloured rice flour and petals welcomes visitors for the Festival of Lights. Traditionally drawn at the doorstep each morning, kolam invites prosperity in. Our display is redrawn every weekend by local artists, and the diyas around it are lit every evening from 7 PM.'; facts = [['Diameter', '9 metres'], ['Made of', 'Rice flour, petals'], ['Until', '15 Nov 2026'], ['Workshop', 'Sat 3 PM, free']]; }
  if (p.kind === 'info') { color = '#0e5a57'; tag = 'CONCIERGE'; desc = 'Ask us anything: lost and found, wheelchair and stroller loans, parcel holding and tourist refunds.'; facts = [['Wi-Fi', 'Cahaya_Free'], ['Parking', 'RM 2 first 3 hours'], ['Surau', 'Every level, west'], ['Hotline', '03-7955 0000']]; }
  if (p.kind === 'entrance') { color = '#2f4b9a'; tag = 'GETTING HERE'; desc = 'Main entrance with taxi and e-hailing pick-up. The LRT feeder bus stops every 15 minutes outside.'; facts = [['LRT', 'Feeder bus T7'], ['Parking', 'B1 – B3 · 2,400 bays'], ['EV charging', 'B1, 12 bays'], ['Drop-off', 'Lane 2']]; }
  if (p.kind === 'anchor' && p.cat === 'cinema') { items = PROD.cinema.concat(MOVIES.map(function (m) { return [m[0] + ' · ' + m[1], 0]; })).slice(0, 7); }
  $('#sMeta').innerHTML = ''; meta.filter(Boolean).forEach(function (m) { var s = document.createElement('span'); s.textContent = m; $('#sMeta').appendChild(s); });
  var hero = $('#sHero'); hero.style.background = 'linear-gradient(135deg,' + shade(color, .2) + ',' + shade(color, -.35) + ')'; $('#sTag').textContent = tag;
  $('#sDesc').textContent = desc || '';
  var fe = $('#sFacts'); fe.innerHTML = ''; facts.forEach(function (f) { var d = document.createElement('div'); d.className = 'fact'; d.innerHTML = '<small></small><span></span>'; d.children[0].textContent = f[0]; d.children[1].textContent = f[1]; fe.appendChild(d); });
  var pe = $('#sProds'); pe.innerHTML = '';
  items.forEach(function (it, i) {
    var d = document.createElement('div'); d.className = 'prod';
    var sw = document.createElement('i'); sw.style.background = 'linear-gradient(135deg,' + COLORS[(i * 3 + p.title.length) % COLORS.length] + ',' + shade(COLORS[(i * 5 + 2) % COLORS.length], -.2) + ')';
    var mid = document.createElement('div'); var b = document.createElement('b'); b.textContent = it[0]; var sm = document.createElement('small'); sm.textContent = p.title; mid.appendChild(b); mid.appendChild(sm);
    var right = document.createElement('div'); right.className = 'pr'; right.textContent = cat === 'money' ? it[1].toFixed(2) : money(it[1]);
    if (cat !== 'money' && p.kind !== 'hoard') { var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Add to bag'; btn.addEventListener('click', function () { BAG.push([it[0], it[1], p.title]); btn.textContent = 'Added'; btn.classList.add('done'); renderBag(); chime(); }); right.appendChild(document.createElement('br')); right.appendChild(btn); }
    d.appendChild(sw); d.appendChild(mid); d.appendChild(right); pe.appendChild(d);
  });
  closePanels(); shopP.classList.add('on'); releaseMouse();
}
function renderBag() {
  $('#bagN').textContent = BAG.length; var l = $('#bagL'); l.innerHTML = ''; var t = 0;
  BAG.forEach(function (b) { t += b[1]; var d = document.createElement('div'); d.className = 'bagline'; var a = document.createElement('span'); a.textContent = b[0] + ' · ' + b[2]; var c = document.createElement('b'); c.textContent = money(b[1]); d.appendChild(a); d.appendChild(c); l.appendChild(d); });
  $('#bagT').textContent = money(t).replace('Free', 'RM 0.00'); $('#bagMeta').textContent = BAG.length ? BAG.length + ' item' + (BAG.length > 1 ? 's' : '') + ' from around the mall' : 'Nothing yet. Go jalan-jalan.';
}
$('#pay').addEventListener('click', function () { if (!BAG.length) { return; } $('#payN').textContent = 'Terima kasih! This was a demo, so nothing was charged. Your bag has been cleared.'; BAG = []; renderBag(); });
// directory
var curTab = 'All';
function dirEntries() {
  var list = [];
  UNITS.forEach(function (u) { if (u.name) { list.push({ name: u.name, sub: CATNAME[u.cat], code: u.code, level: u.level, go: { x: u.xc, z: u.side * 8.6, yaw: u.side > 0 ? Math.PI / 2 : -Math.PI / 2 }, poi: u }); } });
  STALLS.forEach(function (s, i) { list.push({ name: s[0], sub: 'Medan Selera stall', code: 'L2-FC', level: 2, go: { x: 6, z: -11 + i * 2.75 + 1.375, yaw: Math.PI } }); });
  [['MyMart', 'Supermarket', 0, 4, 0, Math.PI], ['Kedai Besar', 'Department Store', 1, 4, 0, Math.PI], ['Pustaka Raya', 'Bookstore', 1, 91, 0, 0], ['Wayang Cahaya', 'Cinema', 2, 90, 0, 0], ['Deepavali Kolam', 'Atrium display', 0, 36, 7.5, -Math.PI / 2], ['Info & Concierge', 'Services', 0, 92, -5.5, -Math.PI / 2]].forEach(function (a) { list.push({ name: a[0], sub: a[1], code: ['G', 'L1', 'L2'][a[2]], level: a[2], go: { x: a[3], z: a[4], yaw: a[5] } }); });
  return list;
}
var tabsEl = $('#tabs'); ['All', 'G', 'L1', 'L2', 'Food'].forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t === 'G' ? 'Ground' : t; b.dataset.t = t; b.addEventListener('click', function () { curTab = t; renderDir(); }); tabsEl.appendChild(b); });
function renderDir() {
  var q = $('#q').value.trim().toLowerCase(), dl = $('#dl'); dl.innerHTML = '';
  tabsEl.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === curTab); });
  dirEntries().filter(function (e) {
    if (curTab === 'G' && e.level !== 0) { return false; } if (curTab === 'L1' && e.level !== 1) { return false; } if (curTab === 'L2' && e.level !== 2) { return false; }
    if (curTab === 'Food' && !/kopitiam|drinks|bakery|kuih|boba|dessert|japanese|medan|food|bubble/i.test(e.sub)) { return false; }
    return !q || (e.name + ' ' + e.sub).toLowerCase().indexOf(q) >= 0;
  }).forEach(function (e) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'di';
    b.innerHTML = '<span class="u"></span><span><b></b><small></small></span><span class="go">Go →</span>';
    b.children[0].textContent = e.code.replace('-FC', ''); b.children[1].children[0].textContent = e.name; b.children[1].children[1].textContent = e.sub + ' · ' + ['Ground', 'Level 1', 'Level 2'][e.level];
    b.addEventListener('click', function () { teleport(e.level, e.go); closePanels(); announce('Anda di ' + e.name + ' · You are at ' + e.name); });
    dl.appendChild(b);
  });
}
$('#q').addEventListener('input', renderDir);
function openDir() { closePanels(); renderDir(); dirP.classList.add('on'); releaseMouse(); setTimeout(function () { $('#q').focus(); }, 300); }
$('#dirBtn').addEventListener('click', openDir);
$('#bagBtn').addEventListener('click', function () { closePanels(); renderBag(); bagP.classList.add('on'); releaseMouse(); });
function teleport(L, g) { P.x = g.x; P.z = g.z; P.y = LV[L]; P.yaw = g.yaw; P.pitch = -.04; P.vx = P.vz = 0; P.onEsc = null; fadeFlash(); hud(); }
function fadeFlash() { cv.style.transition = 'none'; cv.style.opacity = '.2'; requestAnimationFrame(function () { cv.style.transition = 'opacity .5s'; cv.style.opacity = '1'; }); }
var annEl = $('#ann'), annT = null;
function announce(t) { annEl.textContent = t; annEl.classList.add('on'); clearTimeout(annT); annT = setTimeout(function () { annEl.classList.remove('on'); }, 4000); }
var ANNS = ['Perhatian: Medan Selera di Aras 2 kini dibuka. · Attention: the food court on Level 2 is now open.', 'Deepavali kolam workshop this Saturday, 3 PM, at the Ground floor atrium.', 'Kepada pemilik kenderaan WXX 1234, sila ke kaunter maklumat. · Will the owner of car WXX 1234 please come to the info counter.', 'Mega Sale 11.11 starts in three weeks. Up to 70% off at selected stores.', 'Free Wi-Fi: Cahaya_Free. Surau located at the west end of every level.'];
var annI = 0; setInterval(function () { if (walking) { announce(ANNS[annI++ % ANNS.length]); dingdong(); } }, 38000);

/* =========================== INPUT =========================== */
var locked = false, drag = null;
function releaseMouse() { try { if (document.pointerLockElement) { document.exitPointerLock(); } } catch (e) {} K = {}; }
document.addEventListener('pointerlockchange', function () { locked = document.pointerLockElement === cv; });
addEventListener('keydown', function (e) {
  var tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA') { if (e.key === 'Escape') { closePanels(); cv.focus(); } return; }
  var k = e.key.toLowerCase();
  if (k === 'escape') { if (anyOpen()) { closePanels(); } return; }
  if (!walking) { if (k === 'enter' || k === ' ') { startWalking(); } return; }
  if (k === 'e') { if (anyOpen()) { closePanels(); } else if (focus) { openPOI(focus); } return; }
  if (k === 'm') { if (dirP.classList.contains('on')) { closePanels(); } else { openDir(); } e.preventDefault(); return; }
  if (k === 'b') { $('#bagBtn').click(); return; }
  if (anyOpen()) { return; }
  K[k] = true; if (e.shiftKey) { K.shift = true; }
  if (k.indexOf('arrow') === 0 || k === ' ') { e.preventDefault(); }
});
addEventListener('keyup', function (e) { K[e.key.toLowerCase()] = false; if (!e.shiftKey) { K.shift = false; } });
addEventListener('blur', function () { K = {}; });
cv.addEventListener('pointerdown', function (e) {
  if (!walking) { return; }
  if (anyOpen()) { closePanels(); }
  cv.focus();
  if (e.pointerType === 'mouse') {
    try { var pr = cv.requestPointerLock && cv.requestPointerLock(); if (pr && pr.catch) { pr.catch(function () {}); } } catch (er) {}
    drag = { id: e.pointerId, look: true, x: e.clientX, y: e.clientY };
  } else {
    var look = e.clientX > innerWidth * .45;
    drag = { id: e.pointerId, look: look, x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY };
    if (!look) { var j = $('#joy'); j.style.left = (e.clientX - 60) + 'px'; j.style.top = (e.clientY - 60) + 'px'; j.style.bottom = 'auto'; }
  }
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
});
cv.addEventListener('pointermove', function (e) {
  if (!walking) { return; }
  if (locked) { P.yaw += e.movementX * .0022; P.pitch = Math.max(-1.1, Math.min(1.1, P.pitch - e.movementY * .0022)); return; }
  if (!drag || drag.id !== e.pointerId) { return; }
  if (drag.look) { P.yaw += (e.clientX - drag.x) * (e.pointerType === 'mouse' ? .005 : .006); P.pitch = Math.max(-1.1, Math.min(1.1, P.pitch - (e.clientY - drag.y) * .005)); drag.x = e.clientX; drag.y = e.clientY; }
  else { joy.x = Math.max(-1, Math.min(1, (e.clientX - drag.ox) / 50)); joy.y = Math.max(-1, Math.min(1, (e.clientY - drag.oy) / 50)); var ji = $('#joy i'); ji.style.transform = 'translate(' + joy.x * 34 + 'px,' + joy.y * 34 + 'px)'; }
});
function endDrag(e) { if (drag && drag.id === e.pointerId) { if (!drag.look) { joy.x = joy.y = 0; $('#joy i').style.transform = ''; } drag = null; } }
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
prompt.addEventListener('click', function () { if (focus) { openPOI(focus); } });
$('#ebtn').addEventListener('click', function () { if (focus) { openPOI(focus); } });
function startWalking() {
  if (!ready) { return; }
  walking = true; $('#intro').classList.add('off'); $('#hud').classList.add('on'); document.body.classList.add('walking');
  P.x = 90; P.z = 0; P.y = 0; P.yaw = Math.PI; P.pitch = -.04; cv.focus();
  announce('Selamat datang ke Cahaya Avenue · Welcome to Cahaya Avenue'); dingdong();
}
$('#enter').addEventListener('click', startWalking);

/* =========================== AUDIO =========================== */
var AC = null, master = null, soundOn = false;
function startAudio() {
  AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0; master.connect(AC.destination);
  var len = AC.sampleRate * 3, b = AC.createBuffer(2, len, AC.sampleRate);
  for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch), last = 0; for (var i = 0; i < len; i++) { last = last * .985 + (Math.random() * 2 - 1) * .015; d[i] = last * 6; } }
  var crowd = AC.createBufferSource(); crowd.buffer = b; crowd.loop = true; var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .6; var cg = AC.createGain(); cg.gain.value = .5;
  crowd.connect(bp); bp.connect(cg); cg.connect(master); crowd.start();
  // gentle mall muzak pad
  var notes = [[261.6, 329.6, 392], [220, 277.2, 329.6], [246.9, 311.1, 370], [196, 246.9, 293.7]], ci = 0;
  function chord() { if (!AC) { return; } var t = AC.currentTime; notes[ci++ % notes.length].forEach(function (f) { var o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + 1.2); g.gain.linearRampToValueAtTime(0, t + 4.2); o.connect(g); g.connect(master); o.start(t); o.stop(t + 4.3); }); }
  chord(); setInterval(chord, 4000);
}
function tone(f, t0, d, v) { if (!AC || !soundOn) { return; } var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + d); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + d + .05); }
function dingdong() { if (!AC || !soundOn) { return; } var t = AC.currentTime; tone(659.3, t, 1.2, .25); tone(523.3, t + .55, 1.6, .25); }
function chime() { if (!AC || !soundOn) { return; } var t = AC.currentTime; tone(880, t, .3, .15); tone(1318.5, t + .08, .4, .12); }
function stepSnd() {
  if (!AC || !soundOn) { return; }
  var t = AC.currentTime, s = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * .06, AC.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < d.length; i++) { d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); }
  s.buffer = b; var hp = AC.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2400 + Math.random() * 600; hp.Q.value = 1.5; var g = AC.createGain(); g.gain.value = .12;
  s.connect(hp); hp.connect(g); g.connect(master); s.start(t);
}
$('#sndBtn').addEventListener('click', function () {
  if (!AC) { try { startAudio(); } catch (e) { return; } }
  soundOn = !soundOn; if (AC.state === 'suspended') { AC.resume(); }
  master.gain.setTargetAtTime(soundOn ? .6 : 0, AC.currentTime, .3);
  $('#sndS').textContent = soundOn ? 'on' : 'off'; $('#sndBtn').setAttribute('aria-pressed', soundOn ? 'true' : 'false');
});

/* =========================== MINIMAP / HUD =========================== */
var mm = $('#mm'), mctx = mm.getContext('2d'), lastL = -1, mmBase = null;
function drawMapBase(L) {
  mmBase = document.createElement('canvas'); mmBase.width = mm.width; mmBase.height = mm.height; var c = mmBase.getContext('2d');
  var sx = mm.width / 96, sz = mm.height / 36;
  c.fillStyle = '#e9e5dc'; c.fillRect(0, 0, mm.width, mm.height);
  var img = c.getImageData(0, 0, mm.width, mm.height), d = img.data;
  for (var y = 0; y < mm.height; y++) { for (var x = 0; x < mm.width; x++) { var wx = (x + .5) / sx, wz = (y + .5) / sz - 18; var w = walkAt(L, wx, wz); var p = (y * mm.width + x) * 4; if (w) { d[p] = 255; d[p + 1] = 255; d[p + 2] = 252; } else { d[p] = 205; d[p + 1] = 200; d[p + 2] = 190; } } }
  c.putImageData(img, 0, 0);
  UNITS.forEach(function (u) { if (u.level !== L || !u.name) { return; } c.fillStyle = u.color; c.globalAlpha = .28; c.fillRect(u.x0 * sx, (u.side > 0 ? 11 + 18 : 18 - 18) * sz, 10 * sx, 7 * sz); c.globalAlpha = 1; });
  c.fillStyle = 'rgba(14,90,87,.45)'; ESC.forEach(function (e) { if (e.yb === LV[L] || e.yt === LV[L]) { c.fillRect(Math.min(e.xb, e.xt) * sx, (e.z0 + 18) * sz, Math.abs(e.xt - e.xb) * sx, (e.z1 - e.z0) * sz); } });
}
function drawMap() {
  var L = Math.round(P.y / 5.5); if (L !== lastL) { lastL = L; drawMapBase(L); }
  mctx.drawImage(mmBase, 0, 0);
  var sx = mm.width / 96, sz = mm.height / 36, px = P.x * sx, pz = (P.z + 18) * sz;
  mctx.fillStyle = 'rgba(227,167,47,.3)'; mctx.beginPath(); mctx.moveTo(px, pz); mctx.arc(px, pz, 34, P.yaw - .55, P.yaw + .55); mctx.closePath(); mctx.fill();
  mctx.fillStyle = '#0e5a57'; mctx.beginPath(); mctx.arc(px, pz, 6, 0, TAU); mctx.fill(); mctx.strokeStyle = '#fff'; mctx.lineWidth = 2; mctx.stroke();
}
var LN = ['G', 'L1', 'L2'], LNN = ['Ground · Concourse', 'Level 1 · Fashion', 'Level 2 · Food & Fun'];
function hud() {
  var L = Math.round(P.y / 5.5);
  if (L !== hud.l) { hud.l = L; }
  $('#lvl').textContent = P.onEsc ? '⇅' : LN[L]; $('#lvlname').textContent = P.onEsc ? 'On the escalator' : LNN[L];
  var near = 'Atrium', bd = 1e9;
  POIS.forEach(function (p) { if (p.level !== L || p.kind === 'hoard') { return; } var d = Math.hypot(p.x - P.x, p.z - P.z); if (d < bd) { bd = d; near = p.title; } });
  $('#near').textContent = near;
}

/* =========================== LOOP =========================== */
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.45, 1.6); composer.addPass(bloom);
composer.addPass(new OutputPass());
function resize() {
  renderer.setPixelRatio(pixelScale); renderer.setSize(innerWidth, innerHeight, false);
  composer.setPixelRatio(pixelScale); composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); sizeMirror();
}
addEventListener('resize', resize);
let last = performance.now(), hudT = 0, introT = 0, fpsAcc = 0, fpsN = 0;
const MAXPS = COARSE ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 1.5);
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = Math.max(last, now); time += dt;
  if (!ready || document.hidden) return;
  stepPeople(dt);
  if (walking && !anyOpen()) { stepPlayer(dt); }
  else if (!walking) { introT += dt; P.x = 48 + Math.cos(introT * .05) * 26; P.z = Math.sin(introT * .05) * 3; P.y = 5.5 + 2.2; P.yaw = Math.PI * .5 + introT * .05 + Math.PI * .5 + .6; P.pitch = -.12; }
  if (walking) {
    focus = anyOpen() ? null : findFocus();
    prompt.classList.toggle('on', !!focus); document.body.classList.toggle('near', !!focus);
    if (focus) { $('#pT').textContent = focus.kind === 'dir' ? 'Open the directory' : focus.kind === 'hoard' ? 'Coming soon' : 'View more · ' + focus.title; $('#pS').textContent = focus.sub; }
    hudT += dt; if (hudT > .25) { hudT = 0; hud(); }
    drawMap();
  }
  const eyeH = walking ? 1.62 + Math.sin(P.bob) * .025 : 0, cp = Math.cos(P.pitch);
  camera.position.set(P.x, P.y + eyeH, P.z);
  camera.lookAt(P.x + Math.cos(P.yaw) * cp, P.y + eyeH + Math.sin(P.pitch), P.z + Math.sin(P.yaw) * cp);
  camera.updateMatrixWorld();
  SH.uTime.value = time;
  const reflY = LV[Math.max(0, Math.min(2, Math.round(P.y / 5.5)))];
  if (!(mirror.on && renderMirror(reflY))) SH.uReflOn.value = 0;
  composer.render();
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 2) {
    const fps = fpsN / fpsAcc;
    if (fps < 34 && pixelScale > .5) { pixelScale = Math.max(.5, pixelScale - .15); resize(); }
    else if (fps < 24 && mirror.on && COARSE) { mirror.on = false; }
    else if (fps > 57 && pixelScale < MAXPS) { pixelScale = Math.min(MAXPS, pixelScale + .1); resize(); }
    fpsAcc = 0; fpsN = 0;
  }
}

/* =========================== BOOT =========================== */
async function boot() {
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]); } catch (e) {}
  const [skyJ, irrJ] = await Promise.all([fileLoader.loadAsync('tex/sky.json'), fileLoader.loadAsync('data/irr.json').catch(() => null)]);
  const rg = new RGBELoader(); rg.setDataType(THREE.HalfFloatType);
  const hd = rg.parse(b64(skyJ.b64).buffer);
  const sky = new THREE.DataTexture(hd.data, hd.width, hd.height, THREE.RGBAFormat, hd.type);
  Object.assign(sky, { colorSpace: THREE.LinearSRGBColorSpace, flipY: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, mapping: THREE.EquirectangularReflectionMapping });
  sky.needsUpdate = true;
  scene.background = sky; scene.backgroundIntensity = 1.4;
  $('#lmsg').textContent = 'Setting up the shops…'; $('#lbar').style.width = '90%';
  await new Promise((r) => setTimeout(r, 30));
  makeMaterials();
  buildScene(irrJ ? b64(irrJ.b64) : 'flat');
  buildPOIs(); renderBag(); initPeople(COARSE ? 22 : 36);
  resize();
  P.x = 48; P.z = 0; P.y = 7.7; P.yaw = Math.PI; P.pitch = -.12;
  renderProbe();
  ready = true;
  $('#lbar').style.width = '100%'; $('#loader').classList.add('done'); $('#enter').disabled = false;
  requestAnimationFrame(frame);
}
boot().catch((e) => { console.error(e); $('#lmsg').textContent = 'Could not open the mall.'; });
window.__mall = { P, get ready() { return ready; }, start: () => startWalking(), teleport: (L, g) => teleport(L, g), mirror, renderer };
