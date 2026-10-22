// mlabs — the group globe: a real Earth centred on Malaysia, with the nine subsidiaries orbiting it,
// each linked to headquarters in Petaling Jaya by a beam. three.js r170.
import * as THREE from 'three';

const D2R = Math.PI / 180;
const ll = (lat, lon, r = 1) => { const ph = (lon + 180) * D2R, th = (90 - lat) * D2R; return new THREE.Vector3(-Math.cos(ph) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(ph) * Math.sin(th) * r); };
const HQ = { lat: 3.131, lon: 101.597 }; // Menara Lien Hoe, Tropicana, Petaling Jaya

export function initGlobe(canvas, labelsEl, { items = [], onPick, onHover, onReady } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches || innerWidth < 760, REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 1.5)); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .01, 200); camera.position.set(0, 0, 4.8);
  const mgr = new THREE.LoadingManager(); let ready = false, readyAt = 0; mgr.onLoad = () => { if (!ready) { ready = true; readyAt = performance.now(); onReady && onReady(); } };
  const tl = new THREE.TextureLoader(mgr), T = (u, srgb) => { const t = tl.load(u); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const day = T('tex/earth_day.jpg', true), night = T('tex/earth_night.jpg', true), spec = T('tex/earth_spec.jpg'), nor = T('tex/earth_nor.jpg'), clouds = T('tex/earth_clouds.jpg'); clouds.wrapS = THREE.RepeatWrapping;
  const sunDir = new THREE.Vector3(.85, .35, .45).normalize(), sunLocal = new THREE.Vector3();
  // real subsolar point, so the day/night line on the globe is what it is right now
  function subsolar(d = new Date()) { const doy = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5; const g = 2 * Math.PI / 365 * (doy - 1 + (d.getUTCHours() - 12) / 24);
    const decl = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) + .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
    const eqt = 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2 * g) - .040849 * Math.sin(2 * g)); const mins = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
    return { lat: decl / D2R, lon: -(mins + eqt - 720) / 4 }; }
  let sunT = 0; const updSun = () => { const s = subsolar(); sunLocal.copy(ll(s.lat, s.lon)).normalize(); };
  updSun();


  // earth (day / night / ocean glint / clouds / atmosphere)
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
        float ndl = dot(N, sun), lit = max(dot(n, sun), 0.), dayK = smoothstep(-.12, .18, ndl);
        vec3 dc = texture2D(day, vUv).rgb; float cl = texture2D(clouds, vUv + vec2(uCloudOff - .003, .002)).r; dc *= 1. - .45*cl*dayK;
        vec3 col = dc*(lit*1.45 + .16);
        vec3 nl = texture2D(night, vUv).rgb; col += nl*nl*vec3(2.3,1.85,1.35)*(1. - dayK)*(1. - .7*cl) + dc*.11*(1. - dayK);
        float ocean = texture2D(spec, vUv).r; vec3 H = normalize(sun + V); col += vec3(.9,.92,1.)*pow(max(dot(N, H), 0.), 160.)*ocean*.14*dayK;
        float fr = pow(1. - max(dot(N, V), 0.), 3.); col += vec3(.35,.45,1.)*fr*(.14 + .9*smoothstep(-.35, .6, ndl));
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), earthMat));
  const cloudMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { clouds: { value: clouds }, sun: { value: sunDir }, uOff: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN, vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform sampler2D clouds; uniform vec3 sun; uniform float uOff; varying vec2 vUv; varying vec3 vN, vW;
      void main(){ float c = texture2D(clouds, vUv + vec2(uOff, 0.)).r; float l = dot(normalize(vN), sun); vec3 V = normalize(cameraPosition - vW); float rim = pow(1. - max(dot(normalize(vN), V), 0.), 2.);
        gl_FragColor = vec4(vec3(1.)*(max(l, 0.)*1.05 + .01), c*.9*(1. - rim*.6)*smoothstep(-.35,.05,l + .2));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(1.007, 72, 48), cloudMat));
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.03, 72, 48), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { sun: { value: sunDir } },
    vertexShader: 'varying vec3 vN, vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'uniform vec3 sun; varying vec3 vN, vW; void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW); float f = pow(1. - max(dot(N, V), 0.), 4.); float s = smoothstep(-.4, .5, dot(N, sun)); gl_FragColor = vec4(vec3(.32,.55,1.), clamp(f*(.45 + .55*s)*1.1, 0., 1.)); }' })));

  // headquarters marker
  const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.22, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const discTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(32, 32, 17, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const hqLocal = ll(HQ.lat, HQ.lon, 1.008);
  const hq = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0x1d5fb4, transparent: true, depthWrite: false })); hq.position.copy(hqLocal); hq.scale.setScalar(.06); globe.add(hq);
  const hqLab = document.createElement('div'); hqLab.className = 'hq-lab'; hqLab.innerHTML = '<b>HQ</b> Petaling Jaya'; labelsEl.appendChild(hqLab);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.018, .022, 48), new THREE.MeshBasicMaterial({ color: 0x1d5fb4, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  ring.position.copy(ll(HQ.lat, HQ.lon, 1.01)); ring.lookAt(ll(HQ.lat, HQ.lon, 2)); globe.add(ring);

  // the orbit
  const orbit = new THREE.Group(); orbit.rotation.set(.34, 0, -.2); scene.add(orbit);
  const R = 1.62;
  { const pts = []; for (let i = 0; i <= 256; i++) { const a = i / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)); }
    const g = new THREE.BufferGeometry().setFromPoints(pts); orbit.add(new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0x3550b8, transparent: true, opacity: .32, dashSize: .03, gapSize: .025 }))).children.at(-1).computeLineDistances(); }
  let hl = null;
  const sats = items.map((it, i) => {
    const col = new THREE.Color(it.color), a0 = i / items.length * Math.PI * 2;
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex, color: col, transparent: true, depthWrite: false })); core.scale.setScalar(.12);
    const halo = new THREE.Mesh(new THREE.RingGeometry(.05, .058, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide }));
    const g = new THREE.Group(); g.add(core, halo); orbit.add(g);
    // beam to HQ
    const N = 48, pos = new Float32Array((N + 1) * 3), uvs = new Float32Array(N + 1); for (let k = 0; k <= N; k++) uvs[k] = k / N;
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('u', new THREE.BufferAttribute(uvs, 1));
    const bm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uC: { value: col }, uT: { value: 0 }, uOn: { value: .15 }, uS: { value: Math.random() } },
      vertexShader: 'attribute float u; varying float vU; void main(){ vU = u; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 uC; uniform float uT, uOn, uS; varying float vU; void main(){ float h = fract(uT*.35 + uS); float p = exp(-pow((vU - h)/.06, 2.)); gl_FragColor = vec4(mix(uC, vec3(1.), p*.3), clamp(uOn*.75 + p*uOn*.9, 0., 1.)); }' });
    const beam = new THREE.Line(bg, bm); beam.frustumCulled = false; scene.add(beam);
    const lab = document.createElement('button'); lab.type = 'button'; lab.className = 'sat-lab'; lab.style.setProperty('--c', it.color); lab.innerHTML = `<i></i>${it.short || it.name}`; lab.addEventListener('click', () => onPick && onPick(it.id)); labelsEl.appendChild(lab);
    lab.addEventListener('pointerenter', () => { hl = it.id; }); lab.addEventListener('pointerleave', () => { hl = null; });
    return { it, g, core, halo, beam, bm, a0, lab, on: .15, vis: 1 };
  });

  // layout + focus
  const view = { lon: 104, lat: 5, tlon: 104, tlat: 5 };
  let zBase = 6.4, orbitA = 0, orbitT = 0, focus = null, layout = 'hero', wide = true;
  function setFocus(sector) {
    focus = sector || null;
    const firstIdx = sats.findIndex((s) => s.it.sector === focus);
    if (firstIdx >= 0) { const members = sats.map((s, i) => [s, i]).filter(([s]) => s.it.sector === focus); const mean = members.reduce((acc, [, i]) => acc + i, 0) / members.length; const a = mean / sats.length * Math.PI * 2; let target = Math.PI / 2 - a; while (target - orbitA > Math.PI) target -= Math.PI * 2; while (orbitA - target > Math.PI) target += Math.PI * 2; orbitT = target; }
  }
  function setLayout(l) { if (l !== layout) { layout = l; } }
  let offK = 0, W = 1, H = 1, rect = { width: 1, height: 1 };
  function applyOffset(k) { if (wide) camera.setViewOffset(W, H, W * (-.23 + .45 * k), 0, W, H); else camera.setViewOffset(W, H, 0, H * (.29 - .02 * k), W, H); camera.updateProjectionMatrix(); }
  function resize() {
    const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); rect = r;
    camera.aspect = w / h; wide = w / h > 1.05; camera.fov = wide ? 30 : 40; zBase = wide ? 6.4 : 9.6; camera.position.z = zBase;
    W = w; H = h; applyOffset(offK);
  }
  addEventListener('resize', resize); resize();

  // pointer: drag to spin, hover satellites
  let drag = null, mx = 0, my = 0, tmx = 0, tmy = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, lon: view.tlon, a: orbitT }; });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; if (drag) { const dx = e.clientX - drag.x; view.tlon = drag.lon - dx * .2; } });

  let visible = true; new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  const occluded = (S) => { const C = camera.position, dx = S.x - C.x, dy = S.y - C.y, dz = S.z - C.z, a = dx*dx + dy*dy + dz*dz, b = 2 * (C.x*dx + C.y*dy + C.z*dz), c = C.x*C.x + C.y*C.y + C.z*C.z - 1.02, D = b*b - 4*a*c; if (D <= 0) return false; const t1 = (-b - Math.sqrt(D)) / (2*a); return t1 > 0 && t1 < 1; };
  const clock = new THREE.Clock(), tmp = new THREE.Vector3(), hqW = new THREE.Vector3(), satW = new THREE.Vector3(), mid = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame); const raw = clock.getDelta(), dt = Math.min(raw, .05), rdt = Math.min(raw, .3), t = clock.elapsedTime; if (!visible || document.hidden) return;
    const ip = ready ? Math.min(1, (performance.now() - readyAt) / 2600) : 0, ie = REDUCED ? 1 : 1 - Math.pow(1 - ip, 4);
    camera.position.z = zBase * (1 + (1 - ie) * .9); orbit.scale.setScalar(.55 + .45 * ie); labelsEl.style.opacity = Math.max(0, (ip - .55) / .45);
    if ((sunT += raw) > 30) { sunT = 0; updSun(); }
    { const tk = layout === 'hero' ? 0 : 1; if (Math.abs(tk - offK) > .001) { offK += (tk - offK) * (1 - Math.exp(-rdt * 3)); applyOffset(offK); } }
    mx += (tmx - mx) * (1 - Math.exp(-rdt * 3)); my += (tmy - my) * (1 - Math.exp(-rdt * 3));
    if (!drag) view.tlon += (104 + (REDUCED ? 0 : Math.sin(t * .12) * 14) - view.tlon) * (1 - Math.exp(-rdt * .5));
    view.lon += (view.tlon - view.lon) * (1 - Math.exp(-rdt * 2)); view.lat += (view.tlat - view.lat) * (1 - Math.exp(-rdt * 2));
    globe.rotation.set(view.lat * D2R + my * .08, Math.PI / 2 - (view.lon + 180) * D2R + mx * .15, 0, 'XYZ');
    if (!focus && !hl && !REDUCED) orbitT += dt * .06;
    orbitA += (orbitT - orbitA) * (1 - Math.exp(-rdt * 2.2));
    cloudMat.uniforms.uOff.value = t * .0015; earthMat.uniforms.uCloudOff.value = t * .0015;
    ring.scale.setScalar(1 + (t * .7 % 1) * 1.4); ring.material.opacity = 1 - (t * .7 % 1);
    globe.updateMatrixWorld(); orbit.updateMatrixWorld(); hqW.copy(hqLocal).applyMatrix4(globe.matrixWorld); sunDir.set(-.35, .38, 1).normalize();
    const r = rect;
    { tmp.copy(hqW).project(camera); const hx = (tmp.x + 1) / 2 * r.width, hy = (1 - tmp.y) / 2 * r.height; hqLab.style.transform = `translate(${hx}px,${hy}px)`; hqLab.classList.toggle('hid', occluded(tmp.copy(hqW).multiplyScalar(1.03)) || (!!focus && !wide)); }
    sats.forEach((s, i) => {
      const a = s.a0 + orbitA; s.g.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); s.g.updateMatrixWorld(); satW.setFromMatrixPosition(s.g.matrixWorld);
      s.halo.lookAt(camera.position); const isHl = hl === s.it.id, active = isHl || (focus ? s.it.sector === focus : false), target = isHl ? 1.35 : focus ? (active ? 1 : .05) : (hl ? .08 : .22);
      s.on += (target - s.on) * (1 - Math.exp(-rdt * 4)); const occ = occluded(satW); s.vis += ((occ ? 0 : 1) - s.vis) * (1 - Math.exp(-rdt * 10));
      const sc = (.06 + s.on * .05 + (active ? Math.sin(t * 3 + i) * .006 : 0)) * (.3 + .7 * s.vis); s.core.scale.setScalar(sc); s.halo.scale.setScalar(.55 + s.on * .55); s.halo.material.opacity = (.2 + s.on * .6) * s.vis; s.core.material.opacity = s.vis;
      // beam: curve from HQ out and over to the satellite
      mid.copy(hqW).add(satW).multiplyScalar(.5); mid.normalize().multiplyScalar(Math.max(1.45, mid.length() * 1.25));
      const P = s.beam.geometry.attributes.position; for (let k = 0; k <= 48; k++) { const u = k / 48, a1 = (1 - u) * (1 - u), b1 = 2 * (1 - u) * u, c1 = u * u; P.setXYZ(k, hqW.x * a1 + mid.x * b1 + satW.x * c1, hqW.y * a1 + mid.y * b1 + satW.y * c1, hqW.z * a1 + mid.z * b1 + satW.z * c1); } P.needsUpdate = true;
      s.bm.uniforms.uT.value = t; s.bm.uniforms.uOn.value = s.on;
      // label
      tmp.copy(satW).project(camera); const x = (tmp.x + 1) / 2 * r.width, y = (1 - tmp.y) / 2 * r.height; const behind = occ;
      s.lab.style.transform = `translate(${x}px,${y}px)`; s.lab.classList.toggle('hid', behind); s.lab.classList.toggle('dim', !behind && !!focus && !active); s.lab.classList.toggle('on', !!active);
    });
    renderer.render(scene, camera);
  }
  frame();
  return { setFocus, setLayout, resize, highlight: (id) => { hl = id || null; }, isDayAtHQ: () => sunLocal.dot(ll(HQ.lat, HQ.lon)) > 0 };
}
