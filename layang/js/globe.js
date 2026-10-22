// Hero globe: day/night Earth, clouds, atmosphere, great-circle routes from KUL, a tiny A330 flying the chosen route.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HUB, DEST } from './data.js';
import { buildPlane } from './plane.js';

const D2R = Math.PI / 180;
export const ll = (lat, lon, r = 1) => { const ph = (lon + 180) * D2R, th = (90 - lat) * D2R; return new THREE.Vector3(-Math.cos(ph) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(ph) * Math.sin(th) * r); };

export function initGlobe(canvas, labelsEl, { onPick, onHover, onReady } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches, REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: location.search.includes('snap') });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02040a);
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 200); camera.position.set(0, 0, 3.7);
  const manager = new THREE.LoadingManager(); manager.onLoad = () => { onReady && onReady(); };
  const tl = new THREE.TextureLoader(manager);
  const T = (u, srgb) => { const t = tl.load(u); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const day = T('tex/earth_day.jpg', true), night = T('tex/earth_night.jpg', true), spec = T('tex/earth_spec.jpg'), nor = T('tex/earth_nor.jpg'), clouds = T('tex/earth_clouds.jpg');
  clouds.wrapS = THREE.RepeatWrapping;
  const sunDir = new THREE.Vector3(.92, .28, .3).normalize();

  /* ---------- stars ---------- */
  { const n = 3500, p = [], s = []; for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(60); p.push(v.x, v.y, v.z); s.push(Math.random() < .04 ? 2.6 : .6 + Math.random() * 1.3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('size', new THREE.Float32BufferAttribute(s, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uPR: { value: renderer.getPixelRatio() } }, transparent: true, depthWrite: false,
      vertexShader: 'attribute float size; uniform float uPR; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = size*uPR; vA = .35 + .65*fract(sin(dot(position.xy, vec2(12.9,78.2)))*43758.5); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(.85,.9,1.), vA*smoothstep(.5,.1,d)); }' });
    scene.add(new THREE.Points(g, m)); }

  /* ---------- earth ---------- */
  const globe = new THREE.Group(); scene.add(globe);
  const earthMat = new THREE.ShaderMaterial({
    uniforms: { day: { value: day }, night: { value: night }, spec: { value: spec }, nor: { value: nor }, clouds: { value: clouds }, sun: { value: sunDir }, uCloudOff: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN, vT, vB, vW;
      void main(){ vUv = uv; vec3 n = normalize(position); vec3 t = normalize(cross(vec3(0.,1.,0.), n)); vec3 b = cross(n, t);
        mat3 m = mat3(modelMatrix); vN = normalize(m*n); vT = normalize(m*t); vB = normalize(m*b); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform sampler2D day, night, spec, nor, clouds; uniform vec3 sun; uniform float uCloudOff; varying vec2 vUv; varying vec3 vN, vT, vB, vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        vec3 nm = texture2D(nor, vUv).xyz*2. - 1.; vec3 n = normalize(-vT*nm.x*.6 + vB*nm.y*.6 + N*nm.z);
        float ndl = dot(N, sun), lit = max(dot(n, sun), 0.);
        float dayK = smoothstep(-.12, .18, ndl);
        vec3 dc = texture2D(day, vUv).rgb;
        float cl = texture2D(clouds, vUv + vec2(uCloudOff - .003, .002)).r;
        dc *= 1. - .45*cl*dayK;
        vec3 col = dc*(lit*1.35 + .015);
        vec3 nl = texture2D(night, vUv).rgb; col += nl*nl*vec3(2.4,1.7,1.0)*(1. - dayK)*(1. - .7*cl);
        float ocean = texture2D(spec, vUv).r; vec3 H = normalize(sun + V);
        col += vec3(1.,.86,.66)*pow(max(dot(N, H), 0.), 90.)*ocean*.3*dayK;
        float fr = pow(1. - max(dot(N, V), 0.), 3.);
        col += vec3(.3,.55,1.)*fr*(.12 + .9*smoothstep(-.35, .6, ndl));
        col += vec3(1.,.5,.2)*exp(-pow((ndl - .02)/.05, 2.))*.035*(1. - cl);
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), earthMat); globe.add(earth);
  const cloudMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { clouds: { value: clouds }, sun: { value: sunDir }, uOff: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN, vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform sampler2D clouds; uniform vec3 sun; uniform float uOff; varying vec2 vUv; varying vec3 vN, vW;
      void main(){ float c = texture2D(clouds, vUv + vec2(uOff, 0.)).r; float l = dot(normalize(vN), sun); vec3 V = normalize(cameraPosition - vW);
        float rim = pow(1. - max(dot(normalize(vN), V), 0.), 2.);
        vec3 col = vec3(1.)*(max(l, 0.)*1.1 + .01) + vec3(1.,.55,.3)*exp(-pow(l/.08,2.))*.08; gl_FragColor = vec4(col, c*.92*(1. - rim*.6)*smoothstep(-.35,.05,l + .2));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.007, 96, 64), cloudMat); globe.add(cloudMesh);
  // thin atmosphere: a front-facing limb haze plus a faint outer glow
  const atm = new THREE.Mesh(new THREE.SphereGeometry(1.025, 96, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { sun: { value: sunDir } },
    vertexShader: 'varying vec3 vN, vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform vec3 sun; varying vec3 vN, vW; void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); float f = pow(1. - max(dot(N, V), 0.), 4.); float s = smoothstep(-.35, .5, dot(N, sun));
      gl_FragColor = vec4(vec3(.32,.58,1.)*f*(.08 + 1.3*s), 1.); }` }));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.09, 64, 48), new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { sun: { value: sunDir } },
    vertexShader: 'varying vec3 vN, vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform vec3 sun; varying vec3 vN, vW; void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); float d = -dot(N, V); float i = pow(clamp(1. - d*2.6, 0., 1.), 2.)*smoothstep(0., .25, d); float s = smoothstep(-.4, .6, dot(N, sun));
      gl_FragColor = vec4(vec3(.3,.55,1.)*i*(.05 + .5*s), 1.); }` }));
  scene.add(atm);

  /* ---------- routes ---------- */
  const A = ll(HUB.lat, HUB.lon), routes = {};
  const arcPoints = (B, n = 96) => { const ang = A.angleTo(B), h = .015 + .2 * Math.pow(ang / Math.PI, .9), pts = []; for (let i = 0; i <= n; i++) { const t = i / n, p = new THREE.Vector3().copy(A).lerp(B, t).normalize(); const q = slerp(A, B, t); pts.push(q.multiplyScalar(1.004 + h * Math.sin(Math.PI * t))); } return pts; };
  function slerp(a, b, t) { const w = a.angleTo(b); if (w < 1e-6) return a.clone(); const s = Math.sin(w); return a.clone().multiplyScalar(Math.sin((1 - t) * w) / s).add(b.clone().multiplyScalar(Math.sin(t * w) / s)); }
  const routeMat = (sel) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uSel: { value: 0 }, uSeed: { value: Math.random() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uT, uSel, uSeed; varying vec2 vUv; void main(){ float x = vUv.x; float head = fract(uT*(.22 + .3*uSel) + uSeed); float d = x - head; float dash = exp(-pow(d/.025,2.)) + exp(-pow((d+1.)/.025,2.));
      float base = mix(.16, .55, uSel); vec3 c = mix(vec3(1.,.72,.3), vec3(1.,.85,.5), uSel); float a = (base + dash*(1.2 + 2.*uSel))*smoothstep(0.,.03,x)*smoothstep(1.,.97,x); gl_FragColor = vec4(c*a*(1. + uSel*1.5), 1.); }` });
  DEST.forEach((d) => {
    const B = ll(d.lat, d.lon), pts = arcPoints(B), curve = new THREE.CatmullRomCurve3(pts);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .0024, 6, false), routeMat()); globe.add(mesh);
    routes[d.code] = { d, B, curve, mesh, len: curve.getLength() };
  });
  // city dots
  const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(.25, 'rgba(255,200,110,.9)'); g.addColorStop(1, 'rgba(255,170,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const dots = {};
  [HUB, ...DEST].forEach((d) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.6, 1.4, 1.1) })); const p = ll(d.lat, d.lon, 1.006); s.position.copy(p); s.scale.setScalar(d === HUB ? .05 : .026); globe.add(s); dots[d.code] = s; });
  const ring = new THREE.Mesh(new THREE.RingGeometry(.016, .019, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.6, .9), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  ring.position.copy(ll(HUB.lat, HUB.lon, 1.008)); ring.lookAt(ll(HUB.lat, HUB.lon, 2)); globe.add(ring);

  /* ---------- the flying jet ---------- */
  const sunL = new THREE.DirectionalLight(0xffffff, 3); sunL.position.copy(sunDir).multiplyScalar(10); scene.add(sunL, new THREE.AmbientLight(0x8899bb, .25));
  const jet = buildPlane({ gear: false, lights: true }); jet.scale.setScalar(.00075); globe.add(jet); jet.visible = false;
  let flight = null;

  /* ---------- labels ---------- */
  const lab = {}; [HUB, ...DEST].forEach((d) => { const e = document.createElement('div'); e.className = 'gl-lab' + (d === HUB ? ' hub' : ''); e.innerHTML = `<b>${d.code}</b><span>${d.city}</span>`; labelsEl.appendChild(e); lab[d.code] = e; });

  /* ---------- view / interaction ---------- */
  const view = { lat: 6, lon: 96, tlat: 6, tlon: 96, vlon: 0 };
  let intro = REDUCED ? 1 : 0, drag = null, sel = null, hover = null, idleT = 0;
  if (!REDUCED) { view.lon = 30; }
  const applyView = () => { globe.rotation.set(view.lat * D2R, Math.PI / 2 - (view.lon + 180) * D2R, 0, 'XYZ'); };
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, lon: view.tlon, lat: view.tlat, moved: 0, t: performance.now() }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy)); if (drag.moved > 4) { view.tlon = drag.lon - dx * .25; view.tlat = Math.max(-50, Math.min(60, drag.lat + dy * .2)); idleT = 0; } return; }
    const h = pick(mx, my); if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : 'grab'; onHover && onHover(h); }
  });
  canvas.addEventListener('pointerup', (e) => { const d = drag; drag = null; if (!d || d.moved > 6) return; const r = canvas.getBoundingClientRect(); const h = pick(e.clientX - r.left, e.clientY - r.top); if (h && h !== HUB.code) { onPick && onPick(h); } });
  const scr = {}; const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
  function project() {
    const r = canvas.getBoundingClientRect();
    [HUB, ...DEST].forEach((d) => { const w = dots[d.code].getWorldPosition(tmp.set(0, 0, 0)); const facing = w.clone().normalize().dot(camDir.copy(camera.position).sub(w).normalize()); const p = w.clone().project(camera); scr[d.code] = { x: (p.x + 1) / 2 * r.width, y: (1 - p.y) / 2 * r.height, vis: facing > .15 }; });
  }
  function pick(mx, my) { let best = null, bd = COARSE ? 26 : 16; for (const k in scr) { const s = scr[k]; if (!s.vis) continue; const d = Math.hypot(s.x - mx, s.y - my); if (d < bd) { bd = d; best = k; } } return best; }

  function select(code) {
    if (sel && routes[sel]) routes[sel].mesh.material.uniforms.uSel.value = 0;
    sel = code || null; idleT = 0;
    if (sel && routes[sel]) {
      const r = routes[sel]; r.mesh.material.uniforms.uSel.value = 1;
      // frame the midpoint of the route
      const mid = r.curve.getPoint(.5).normalize(); const lat = Math.asin(mid.y) / D2R; const lon = Math.atan2(mid.z, -mid.x) / D2R - 180;
      view.tlat = Math.max(-35, Math.min(45, lat)); let L = ((lon + 540) % 360) - 180; while (L - view.tlon > 180) L -= 360; while (view.tlon - L > 180) L += 360; view.tlon = L;
      flight = { r, t: 0 }; jet.visible = true;
    } else { flight = null; jet.visible = false; }
    Object.entries(lab).forEach(([k, e]) => e.classList.toggle('sel', k === sel));
  }

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: COARSE ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .5, .5, .82); composer.addPass(bloom); composer.addPass(new OutputPass());
  let wide = true;
  function resize() {
    const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h; wide = w / h > 1.05;
    camera.fov = wide ? 30 : 36; camera.position.z = wide ? 4.7 : 4.6;
    if (wide) camera.setViewOffset(w, h, -w * .21, h * .04, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();
  let visible = true; new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock(), fwd = new THREE.Vector3(), up = new THREE.Vector3(), m4 = new THREE.Matrix4();
  function frame() {
    requestAnimationFrame(frame); if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    if (intro < 1) { intro = Math.min(1, intro + dt / 3); }
    idleT += dt;
    if (!drag && !sel && idleT > 4 && !REDUCED) view.tlon += dt * 2.2; // slow drift eastward when idle
    const k = 1 - Math.exp(-dt * (drag ? 12 : 2.4)); view.lon += (view.tlon - view.lon) * k; view.lat += (view.tlat - view.lat) * k;
    applyView();
    cloudMat.uniforms.uOff.value = t * .0015; earthMat.uniforms.uCloudOff.value = t * .0015;
    for (const c in routes) routes[c].mesh.material.uniforms.uT.value = t;
    ring.scale.setScalar(1 + (t * .8 % 1) * 1.2); ring.material.opacity = 1 - (t * .8 % 1);
    if (flight) {
      flight.t = (flight.t + dt / (4 + flight.r.len * 2.2)) % 1; const f = flight.t, c = flight.r.curve;
      const p = c.getPointAt(f), p2 = c.getPointAt(Math.min(1, f + .002)); fwd.subVectors(p2, p); up.copy(p).normalize();
      jet.position.copy(p).addScaledVector(up, .004); globe.updateMatrixWorld();
      jet.up.copy(up).applyQuaternion(globe.quaternion); jet.lookAt(globe.localToWorld(jet.position.clone().add(fwd))); jet.userData.tick(t);
    }
    project();
    for (const [k, e] of Object.entries(lab)) { const s = scr[k]; const show = s && s.vis && (k === sel || k === hover || k === HUB.code || (wide && !COARSE && ['SIN', 'BKK', 'NRT', 'SYD', 'LHR', 'DXB', 'HKG', 'DPS', 'KCH', 'BKI', 'DEL', 'PER'].includes(k))); e.style.transform = `translate(${s ? s.x : -999}px,${s ? s.y : -999}px)`; e.classList.toggle('on', !!show); }
    composer.render();
  }
  frame();
  // snapshots for destination cards (used once at build time)
  function snap(code, w = 640, h = 400) {
    const d = [HUB, ...DEST].find((x) => x.code === code); if (!d) return null;
    view.lat = view.tlat = d.lat - 12; view.lon = view.tlon = d.lon; applyView(); globe.updateMatrixWorld();
    const keepSun = sunDir.clone(); const n = ll(d.lat, d.lon).applyEuler(globe.rotation); sunDir.copy(n.clone().multiplyScalar(.8).add(new THREE.Vector3(-.75, .55, .1)).normalize());
    renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.fov = 44; camera.position.z = 1.92; camera.setViewOffset(w, h, 0, -h * .2, w, h); camera.updateProjectionMatrix();
    const hidden = []; globe.children.forEach((o) => { if (o !== earth && o !== cloudMesh && o.visible) { o.visible = false; hidden.push(o); } });
    dots[code].visible = true; dots[code].scale.setScalar(.03);
    Object.values(lab).forEach((e) => e.classList.remove('on'));
    composer.render(); const url = renderer.domElement.toDataURL('image/jpeg', .86);
    hidden.forEach((o) => { o.visible = true; }); dots[code].scale.setScalar(code === HUB.code ? .05 : .026); jet.visible = !!flight;
    sunDir.copy(keepSun); resize(); return url;
  }
  return { select, resize, snap, routes };
}
