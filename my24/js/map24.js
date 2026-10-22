// 3D Malaysia lit by the real sun. NASA Blue Marble (day), Black Marble (night lights), GEBCO (relief).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const BOX = { lon0: 99.0, lon1: 119.6, lat0: .2, lat1: 7.8 };
const CX = (BOX.lon0 + BOX.lon1) / 2, CY = (BOX.lat0 + BOX.lat1) / 2, W = BOX.lon1 - BOX.lon0, H = BOX.lat1 - BOX.lat0, EXAG = .3;
export const xz = (lon, lat) => new THREE.Vector3(lon - CX, 0, -(lat - CY));
const D2R = Math.PI / 180;

/* ---------- solar position (NOAA) ---------- */
export function subsolar(date) {
  const jd = date.getTime() / 86400000 + 2440587.5, n = jd - 2451545.0;
  const L = (280.46 + .9856474 * n) % 360, g = ((357.528 + .9856003 * n) % 360) * D2R;
  const lam = (L + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * D2R, eps = (23.439 - .0000004 * n) * D2R;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = (280.46061837 + 360.98564736629 * n) % 360;
  let lon = (ra / D2R - gmst) % 360; if (lon < -180) lon += 360; if (lon > 180) lon -= 360;
  return { lat: dec / D2R, lon };
}
export function sunAlt(date, lat, lon) { const s = subsolar(date); const f = lat * D2R, d = s.lat * D2R, h = (lon - s.lon) * D2R; return Math.asin(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(h)) / D2R; }
// sunrise / sunset in minutes after local (MYT) midnight for a given MYT day
export function riseSet(y, m, d, lat, lon) {
  const at = (min) => new Date(Date.UTC(y, m, d, 0, 0) + (min - 480) * 60000);
  const find = (a, b, up) => { for (let i = 0; i < 40; i++) { const mid = (a + b) / 2, alt = sunAlt(at(mid), lat, lon) + .833; if ((alt > 0) === up) b = mid; else a = mid; } return (a + b) / 2; };
  return { rise: find(240, 600, true), set: find(1020, 1320, false) };
}

export function createMap(canvas, { onReady } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches || innerWidth < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, .05, 400);
  const manager = new THREE.LoadingManager(); manager.onLoad = () => onReady && onReady();
  const tl = new THREE.TextureLoader(manager);
  const T = (u, srgb) => { const t = tl.load(u); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  const day = T(COARSE ? 'tex/my_day_2k.jpg' : 'tex/my_day.jpg', true), night = T('tex/my_night.jpg', true), elev = T('tex/my_elev.png');
  elev.minFilter = THREE.LinearFilter; elev.generateMipmaps = false;

  const U = { day: { value: day }, night: { value: night }, elev: { value: elev }, sLat: { value: 0 }, sLon: { value: 0 }, exag: { value: EXAG }, texel: { value: new THREE.Vector2(1 / 1236, 1 / 456) },
    box: { value: new THREE.Vector4(BOX.lon0, BOX.lat0, W, H) }, fogCol: { value: new THREE.Color() }, seaCol: { value: new THREE.Color() }, glow: { value: 0 }, glowP: { value: new THREE.Vector3(101.69, 3.14, .6) }, lightsBoost: { value: 1 } };
  const vert = `uniform sampler2D elev; uniform float exag; uniform vec4 box; varying vec2 vUv; varying vec3 vW; varying float vH;
    void main(){ vUv = uv; float h = texture2D(elev, uv).r; vH = h; vec3 p = position; p.y += pow(h, .9)*exag*1.6; vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
  const frag = `uniform sampler2D day, night, elev; uniform float sLat, sLon, exag, glow, lightsBoost; uniform vec2 texel; uniform vec4 box; uniform vec3 fogCol, seaCol, glowP; varying vec2 vUv; varying vec3 vW; varying float vH;
    void main(){
      float lat = radians(box.y + vUv.y*box.w), lon = radians(box.x + vUv.x*box.z), d = radians(sLat), hh = radians(sLon) - lon;
      vec3 S = vec3(cos(d)*sin(hh), sin(lat)*sin(d) + cos(lat)*cos(d)*cos(hh), -(cos(lat)*sin(d) - sin(lat)*cos(d)*cos(hh))); // east, up, -north
      float hx = texture2D(elev, vUv + vec2(texel.x,0.)).r - texture2D(elev, vUv - vec2(texel.x,0.)).r;
      float hz = texture2D(elev, vUv + vec2(0.,texel.y)).r - texture2D(elev, vUv - vec2(0.,texel.y)).r;
      vec3 N = normalize(vec3(-hx*exag*1.6/(2.*texel.x*box.z), 1., hz*exag*1.6/(2.*texel.y*box.w)));
      float sunUp = S.y; float dayK = smoothstep(-.10, .12, sunUp);
      vec3 dc = texture2D(day, vUv).rgb;
      float water = step(vH, .002)*smoothstep(.02,.12, dc.b - dc.r);
      vec3 sunCol = mix(vec3(1.,.55,.3), vec3(1.,.97,.92), smoothstep(.0,.35,sunUp));
      float lam = max(dot(N, normalize(S)), 0.);
      vec3 col = dc*(lam*1.55*sunCol*smoothstep(-.02,.06,sunUp) + vec3(.05,.07,.1)*dayK + .004);
      vec3 V = normalize(cameraPosition - vW); vec3 Hh = normalize(normalize(S) + V);
      col += water*sunCol*pow(max(dot(vec3(0.,1.,0.), Hh),0.), 120.)*1.4*smoothstep(0.,.1,sunUp);
      vec3 nl = texture2D(night, vUv).rgb; float L = dot(nl, vec3(.33)); col += vec3(1.,.72,.38)*pow(L,1.6)*2.6*lightsBoost*(1. - dayK);
      col += vec3(1.,.45,.2)*exp(-pow(sunUp/.06, 2.))*.05*(1.-water);
      vec2 g = vec2(box.x + vUv.x*box.z - glowP.x, (box.y + vUv.y*box.w - glowP.y)); col += vec3(1.,.7,.35)*glow*exp(-dot(g,g)/(glowP.z*glowP.z))*.9;
      float edge = smoothstep(0.,.05,vUv.x)*smoothstep(1.,.95,vUv.x)*smoothstep(0.,.1,vUv.y)*smoothstep(1.,.9,vUv.y);
      float dist = length(cameraPosition - vW); col = mix(seaCol, col, edge); col = mix(fogCol, col, exp(-pow(dist*.026, 2.)));
      gl_FragColor = vec4(col, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const seg = COARSE ? [420, 155] : [900, 332];
  const geo = new THREE.PlaneGeometry(W, H, seg[0], seg[1]); geo.rotateX(-Math.PI / 2);
  const land = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: frag })); scene.add(land);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x020507, fog: true })); scene.fog = new THREE.FogExp2(0x05080c, .026); sea.rotation.x = -Math.PI / 2; sea.position.y = -.01; scene.add(sea);
  scene.background = new THREE.Color(0x05080c);

  /* ---------- overlay layers ---------- */
  const groups = {}; const layer = (name) => { const g = new THREE.Group(); g.visible = false; scene.add(g); groups[name] = g; return g; };
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,220,160,.8)'); gr.addColorStop(1, 'rgba(255,180,90,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  function arc(a, b, h, col, n = 64) {
    const A = xz(...a), B = xz(...b), pts = []; for (let i = 0; i <= n; i++) { const t = i / n, p = A.clone().lerp(B, t); p.y = .03 + Math.sin(Math.PI * t) * h; pts.push(p); }
    const curve = new THREE.CatmullRomCurve3(pts), mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .012, 6), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color(col) }, uS: { value: Math.random() } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uT, uS; uniform vec3 uC; varying vec2 vUv; void main(){ float h = fract(uT*.25 + uS); float d = vUv.x - h; float a = .16 + 1.1*exp(-pow(d/.035,2.)); a *= smoothstep(0.,.05,vUv.x)*smoothstep(1.,.9,vUv.x); gl_FragColor = vec4(uC*a*1.6, 1.); }' }));
    return mesh;
  }
  const sprite = (lon, lat, s, col = [1.6, 1.3, 1]) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(...col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); const p = xz(lon, lat); m.position.set(p.x, .06, p.z); m.scale.setScalar(s); return m; };
  // exports: from the big ports out to sea lanes
  { const g = layer('exports'); [[[101.36, 3.0], [99.2, 5.6]], [[101.36, 3.0], [104.5, .5]], [[103.55, 1.36], [107.5, .3]], [[103.55, 1.36], [105.5, 4.9]], [[100.36, 5.4], [99.3, 7.4]], [[113.03, 3.26], [112.0, 6.9]], [[113.03, 3.26], [117.5, 7.0]], [[101.36, 3.0], [100.0, 1.0]]].forEach(([a, b]) => g.add(arc(a, b, .35, '#ffb547'))); [[101.36, 3.0, .32], [103.55, 1.36, .28], [100.36, 5.4, .22], [113.03, 3.26, .22]].forEach(([lo, la, s]) => g.add(sprite(lo, la, s, [1.4, 1.0, .6]))); }
  // flights out of KLIA and the Borneo hubs
  { const g = layer('flights'); const K = [101.71, 2.75]; [[99.3, 7.6], [104.0, 7.6], [109, 7.7], [116.05, 5.94], [110.35, 1.48], [119.4, 4.6], [100.27, 5.3], [103.9, 1.0], [99.1, 1.0], [106, .3], [115.17, .3]].forEach((b, i) => g.add(arc(K, b, .25 + i % 3 * .12, '#6fd3ff'))); [[116.05, 5.94], [110.35, 1.48]].forEach((a) => [[119.5, 7.6], [114, 7.7], [118.1, 4.3]].forEach((b) => g.add(arc(a, b, .2, '#6fd3ff')))); g.add(sprite(101.71, 2.75, .35, [.8, 1.2, 1.6])); }
  // births: sparkles at population centres (rough weights)
  const cities = [[101.69, 3.14, 8], [101.52, 3.07, 6], [103.76, 1.49, 4], [100.33, 5.41, 3], [101.08, 4.6, 2], [102.25, 2.19, 1.4], [103.33, 3.82, 1.3], [102.24, 6.12, 1.4], [103.14, 5.33, 1], [100.37, 6.12, 1], [110.35, 1.55, 1.4], [116.07, 5.98, 1.4], [118.06, 5.84, .7], [117.89, 4.25, .6], [113.99, 4.39, .6], [111.82, 2.29, .6], [101.94, 2.73, 1.2], [101.45, 3.04, 2]];
  const births = layer('births'); const sparks = Array.from({ length: 40 }, () => { const s = sprite(0, 0, .0, [1.8, 1.5, 1.1]); births.add(s); return { s, t: Math.random() * 2 }; });
  const pickCity = () => { const tot = cities.reduce((a, c) => a + c[2], 0); let r = Math.random() * tot; for (const c of cities) { r -= c[2]; if (r <= 0) return c; } return cities[0]; };
  // commute: streams of light flowing into central KL along rough corridors
  const commute = layer('commute'); const flows = [];
  { const KL = [101.695, 3.147]; [[101.45, 3.04], [101.58, 3.07], [101.71, 2.93], [101.79, 2.99], [101.53, 3.23], [101.61, 3.29], [101.76, 3.25], [101.82, 3.12], [101.64, 2.98], [101.47, 3.16]].forEach((a) => { const A = xz(...a), B = xz(...KL); for (let k = 0; k < 6; k++) { const s = sprite(a[0], a[1], .028, [1.6, 1.3, .9]); commute.add(s); flows.push({ s, A, B, t: Math.random() }); } }); commute.add(sprite(KL[0], KL[1], .14, [1.4, 1.1, .8])); }

  /* ---------- camera ---------- */
  const cam = { tx: 0, tz: 0, dist: 15, tilt: 52, yaw: 0 }, tgt = { ...cam }; let flyT = 1, from = { ...cam }, flyStart = 0;
  function flyTo(v, instant) { from = { ...cam }; Object.assign(tgt, v.lon != null ? { tx: v.lon - CX, tz: -(v.lat - CY) } : {}, v.dist != null ? { dist: v.dist } : {}, v.tilt != null ? { tilt: v.tilt } : {}, v.yaw != null ? { yaw: v.yaw } : {}); flyT = instant ? 1 : 0; flyStart = performance.now(); if (instant) Object.assign(cam, tgt); }
  function placeCam() { const portrait = camera.aspect < .9, t = Math.min(82, cam.tilt + (portrait ? 14 : 0)) * D2R, y = cam.yaw * D2R, d = cam.dist * (portrait ? 1.2 : 1); camera.position.set(cam.tx + Math.sin(y) * Math.cos(t) * d, Math.sin(t) * d, cam.tz + Math.cos(y) * Math.cos(t) * d); camera.lookAt(cam.tx, 0, cam.tz); }

  /* ---------- time ---------- */
  let when = new Date(), active = null;
  function setTime(date) { when = date; const s = subsolar(date); U.sLat.value = s.lat; U.sLon.value = s.lon; const alt = sunAlt(date, 3.14, 101.69); const k = Math.max(0, Math.min(1, (alt + 8) / 22)); const dawn = Math.exp(-Math.pow(alt / 6, 2)); U.fogCol.value.setRGB(.012 + .045 * k + .09 * dawn, .018 + .085 * k + .04 * dawn, .03 + .15 * k + .02 * dawn); scene.background.copy(U.fogCol.value); scene.fog.color.copy(U.fogCol.value); U.seaCol.value.setRGB(.008 + .03 * k, .014 + .07 * k, .025 + .16 * k); sea.material.color.copy(U.seaCol.value); renderer.toneMappingExposure = 1.0 + (1 - k) * .3; }
  function setLayer(name) { active = name; Object.entries(groups).forEach(([k, g]) => { g.visible = k === name; }); U.glow.value = 0; }
  function setGlow(lon, lat, r, v) { U.glowP.value.set(lon, lat, r); glowTarget = v; }
  let glowTarget = 0;

  /* ---------- render ---------- */
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: COARSE ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .45, .78); composer.addPass(bloom); composer.addPass(new OutputPass());
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); camera.aspect = w / h; camera.fov = camera.aspect < .9 ? 50 : 36; if (camera.aspect < .9) camera.setViewOffset(w, h, 0, h * .2, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  const clock = new THREE.Clock(), tmp = new THREE.Vector3();
  (function loop() {
    requestAnimationFrame(loop); if (document.hidden) return; const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    if (flyT < 1) { flyT = Math.min(1, (performance.now() - flyStart) / 2200); const k = flyT < .5 ? 4 * flyT ** 3 : 1 - Math.pow(-2 * flyT + 2, 3) / 2; for (const key of ['tx', 'tz', 'dist', 'tilt', 'yaw']) cam[key] = from[key] + (tgt[key] - from[key]) * k; }
    cam.yaw += Math.sin(t * .1) * .002; placeCam();
    U.glow.value += (glowTarget - U.glow.value) * (1 - Math.exp(-dt * 3)) ;
    Object.values(groups).forEach((g) => g.visible && g.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uT) o.material.uniforms.uT.value = t; }));
    if (active === 'births') sparks.forEach((p) => { p.t += dt; if (p.t > 1.6) { p.t = 0; const c = pickCity(); const q = xz(c[0] + (Math.random() - .5) * .25, c[1] + (Math.random() - .5) * .25); p.s.position.set(q.x, .06, q.z); } const k = p.t / 1.6; p.s.scale.setScalar(Math.sin(Math.PI * Math.min(1, k)) * .22); });
    if (active === 'commute') flows.forEach((f) => { f.t = (f.t + dt * .16) % 1; f.s.position.lerpVectors(f.A, f.B, f.t); f.s.position.y = .03; f.s.material.opacity = Math.sin(Math.PI * f.t); });
    composer.render();
  })();
  function project(lon, lat) { tmp.copy(xz(lon, lat)); tmp.y = .05; tmp.project(camera); return { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight, vis: tmp.z < 1 }; }
  return { setTime, flyTo, setLayer, setGlow, project, get time() { return when; } };
}
