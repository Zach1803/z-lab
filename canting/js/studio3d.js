// Canting — the 3D studio: a cloth on a wooden frame above a dye trough, in afternoon light.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { N } from './batik.js';

const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const canvasTex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

export function initStudio(canvas, batik) {
  const COARSE = matchMedia('(pointer:coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe9dcc6); scene.fog = new THREE.Fog(0xe9dcc6, 9, 20);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .55;
  const camera = new THREE.PerspectiveCamera(38, 1, .05, 60);

  // light: low sun through a window on the left
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x8a6a4a, .55));
  const sun = new THREE.DirectionalLight(0xffd9a8, 2.6); sun.position.set(-4.5, 5, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -3, near: 1, far: 16 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; scene.add(sun);

  // room
  const wood = canvasTex(1024, 1024, (x, w, h) => { const r = (() => { let s = 9; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    for (let i = 0; i < 8; i++) { const y = i * h / 8, base = 112 + r() * 26; x.fillStyle = `rgb(${base + 40},${base},${base * .62})`; x.fillRect(0, y, w, h / 8);
      for (let k = 0; k < 70; k++) { x.strokeStyle = `rgba(70,40,20,${.04 + r() * .07})`; x.lineWidth = 1 + r() * 2; x.beginPath(); const yy = y + r() * h / 8; x.moveTo(0, yy); x.bezierCurveTo(w * .3, yy + (r() - .5) * 8, w * .7, yy + (r() - .5) * 8, w, yy + (r() - .5) * 6); x.stroke(); }
      x.fillStyle = 'rgba(40,22,10,.5)'; x.fillRect(0, y, w, 2); x.fillRect(r() * w, y, 2, h / 8); } });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(3, 3);
  const floorShape = new THREE.Shape(); floorShape.moveTo(-8, -8); floorShape.lineTo(8, -8); floorShape.lineTo(8, 8); floorShape.lineTo(-8, 8); floorShape.closePath();
  const hole = new THREE.Path(); hole.moveTo(-1.05, -.4); hole.lineTo(-1.05, .4); hole.lineTo(1.05, .4); hole.lineTo(1.05, -.4); hole.closePath(); floorShape.holes.push(hole);
  const floorG = new THREE.ShapeGeometry(floorShape); floorG.rotateX(-Math.PI / 2); { const p = floorG.attributes.position, uv = floorG.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 5.3, p.getZ(i) / 5.3); }
  const floor = new THREE.Mesh(floorG, new THREE.MeshStandardMaterial({ map: wood, roughness: .75 })); floor.receiveShadow = true; scene.add(floor);
  const wallTex = canvasTex(1024, 512, (x, w, h) => { x.fillStyle = '#efe3cf'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '255,250,240' : '150,120,90'},${Math.random() * .05})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    const g = x.createRadialGradient(w * .24, h * .38, 10, w * .24, h * .38, w * .32); g.addColorStop(0, 'rgba(255,226,170,.55)'); g.addColorStop(1, 'rgba(255,226,170,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(120,80,40,.08)'; for (let i = 0; i < 4; i++) x.fillRect(w * .12 + i * w * .065, h * .16, w * .012, h * .45); });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshStandardMaterial({ map: wallTex, roughness: .95 })); wall.position.set(0, 4, -2.2); wall.receiveShadow = true; scene.add(wall);
  // dye trough
  const stone = new THREE.MeshStandardMaterial({ color: 0x5b4a3c, roughness: .9 });
  const trough = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.6, .8), [stone, stone, stone, stone, stone, stone].map((m) => { const c = m.clone(); c.side = THREE.BackSide; return c; })); trough.position.set(0, -1.3, 0); trough.receiveShadow = true; scene.add(trough);
  const rimM = new THREE.MeshStandardMaterial({ color: 0x8a6e50, roughness: .7 });
  [[0, .4, 2.3, .14], [0, -.4, 2.3, .14]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .08, d), rimM); m.position.set(x, .04, z + Math.sign(z) * .07); m.castShadow = m.receiveShadow = true; scene.add(m); });
  [-1, 1].forEach((sx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.14, .08, .94), rimM); m.position.set(sx * 1.12, .04, 0); m.castShadow = m.receiveShadow = true; scene.add(m); });
  const liquidMat = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(0x26468c) }, uT: { value: 0 }, uRip: { value: -10 }, uBoil: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uC; uniform float uT, uRip, uBoil; varying vec2 vP;
      void main(){ float d = length(vP*vec2(1.,2.4)); float age = uT - uRip; float rip = age > 0. && age < 3. ? sin(d*30. - age*9.)*exp(-age*1.2)*exp(-d*1.5) : 0.;
        float n = sin(vP.x*18. + uT*1.3)*sin(vP.y*30. - uT*1.1)*.5 + .5; float b = uBoil*smoothstep(.75,1.,fract(sin(dot(floor(vP*vec2(40.,40.)), vec2(12.9,78.2)))*43758.5 + uT*.8));
        vec3 c = uC*(.62 + .1*n) + vec3(.9,.85,.75)*(max(rip,0.)*.35 + b*.25) + vec3(.08)*uBoil;
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const liquid = new THREE.Mesh(new THREE.PlaneGeometry(2.08, .78), liquidMat); liquid.rotation.x = -Math.PI / 2; liquid.position.y = -.05; scene.add(liquid);
  // steam for the boil
  const steamN = 160, steamPos = new Float32Array(steamN * 3), steamSeed = new Float32Array(steamN); for (let i = 0; i < steamN; i++) { steamSeed[i] = Math.random(); }
  const steamG = new THREE.BufferGeometry(); steamG.setAttribute('position', new THREE.BufferAttribute(steamPos, 3)); steamG.setAttribute('seed', new THREE.BufferAttribute(steamSeed, 1));
  const steamMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uA: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: 'attribute float seed; uniform float uT, uPR; varying float vA; void main(){ float t = fract(uT*.25 + seed); vec3 p = vec3((fract(seed*91.7)-.5)*1.9 + sin(t*6.+seed*20.)*.08, -.05 + t*1.6, (fract(seed*37.3)-.5)*.6); vA = sin(t*3.14159); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (40. + 90.*t)*uPR/ -mv.z; }',
    fragmentShader: 'uniform float uA; varying float vA; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(1.,.98,.95, uA*vA*.22*smoothstep(.5,0.,d)); }' });
  const steam = new THREE.Points(steamG, steamMat); steam.frustumCulled = false; scene.add(steam);

  // frame (pemidang): two posts and a bar that lowers on ropes
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: .6 });
  [-1.25, 1.25].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 2.7, 16), darkWood); p.position.set(x, 1.35, 0); p.castShadow = true; scene.add(p);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .08, 16), darkWood); top.position.set(x, 2.72, 0); scene.add(top); });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.6, 16), darkWood); beam.rotation.z = Math.PI / 2; beam.position.set(0, 2.62, 0); beam.castShadow = true; scene.add(beam);
  const hang = new THREE.Group(); scene.add(hang);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.7, 12), darkWood); bar.rotation.z = Math.PI / 2; bar.position.y = 2.14; bar.castShadow = true; hang.add(bar);
  const ropeM = new THREE.MeshStandardMaterial({ color: 0xcbb38a, roughness: 1 });
  const ropes = [-.8, .8].map((x) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 1, 6), ropeM); r.position.x = x; scene.add(r); return r; });
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.04, .07, .03), new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: .5 })); c.position.set(-.7 + i * .28, 2.11, .01); c.castShadow = true; hang.add(c); }

  // the cloth
  const W = 1.5, H = 1.9, SX = 60, SY = 76;
  const clothG = new THREE.PlaneGeometry(W, H, SX, SY); clothG.translate(0, 2.1 - H / 2, 0);
  const base = clothG.attributes.position.array.slice();
  const colorTex = new THREE.CanvasTexture(batik.color); colorTex.colorSpace = THREE.SRGBColorSpace; colorTex.anisotropy = 8;
  const waxTex = new THREE.CanvasTexture(batik.wax); waxTex.anisotropy = 8;
  const waxU = { value: 1 }, weaveU = { value: 1 };
  const clothMat = new THREE.MeshPhysicalMaterial({ map: colorTex, side: THREE.DoubleSide, roughness: .92, sheen: 1, sheenRoughness: .55, sheenColor: new THREE.Color(0xfff4e0) });
  clothMat.onBeforeCompile = (sh) => {
    sh.uniforms.waxMap = { value: waxTex }; sh.uniforms.waxAmt = waxU; sh.uniforms.weaveAmt = weaveU;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D waxMap; uniform float waxAmt, weaveAmt; float gWax;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        { vec2 q = vMapUv*vec2(${N}.*.55); vec2 fw = fwidth(q); float wv = .5 + .5*sin(q.x*6.2831)*sin(q.y*6.2831); float aa = clamp(1. - max(fw.x,fw.y)*1.5, 0., 1.); diffuseColor.rgb *= 1. - weaveAmt*.07*wv*aa; }
        gWax = texture2D(waxMap, vMapUv).a*waxAmt;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(.84,.64,.34), gWax*.95);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .38, gWax);');
  };
  const cloth = new THREE.Mesh(clothG, clothMat); cloth.castShadow = true; cloth.receiveShadow = true; hang.add(cloth);

  // products
  const prodGroup = new THREE.Group(); prodGroup.visible = false; scene.add(prodGroup);
  const prodMat = new THREE.MeshPhysicalMaterial({ map: colorTex, side: THREE.DoubleSide, roughness: .9, sheen: 1, sheenRoughness: .5, sheenColor: new THREE.Color(0xfff4e0) });
  prodMat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>\n{ vec2 q = vMapUv*vec2(${N}.*.55); vec2 fw = fwidth(q); float wv = .5 + .5*sin(q.x*6.2831)*sin(q.y*6.2831); diffuseColor.rgb *= 1. - .07*wv*clamp(1. - max(fw.x,fw.y)*1.5, 0., 1.); }`); };
  const products = {};
  { // sarong: an open tube with soft folds
    const g = new THREE.CylinderGeometry(.36, .38, 1.1, 128, 24, true); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), k = 1 + .045 * Math.sin(a * 9) * (.5 - y / 2.2) + .02 * Math.sin(a * 3); p.setX(i, x * k); p.setZ(i, z * k); } g.computeVertexNormals();
    const m = new THREE.Mesh(g, prodMat); m.position.y = 1.05; m.castShadow = true; const gp = new THREE.Group(); gp.add(m); products.sarong = gp; }
  { // selendang: a long scarf draped over a rod
    const L = 2.3, g = new THREE.PlaneGeometry(.55, L, 12, 160), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const s = p.getY(i), x = p.getX(i), as = Math.abs(s); let y, z; if (as < .12) { const a = s / .12 * Math.PI / 2; y = 1.95 + Math.cos(a) * .06; z = Math.sin(a) * .06; } else { y = 1.95 - (as - .12); z = Math.sign(s) * (.06 + (as - .12) * .04); } p.setXYZ(i, x + Math.sin(y * 5) * .01, y, z + Math.sin(y * 7 + x * 3) * .012); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, prodMat); m.castShadow = true; const rod = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .9, 12), darkWood); rod.rotation.z = Math.PI / 2; rod.position.y = 1.95; const gp = new THREE.Group(); gp.add(m, rod); products.selendang = gp; }
  { // cushion pair
    const mkC = () => { const g = new THREE.BoxGeometry(.55, .55, .2, 16, 16, 4), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / .275, y = p.getY(i) / .275, k = Math.max(0, 1 - (x * x * x * x + y * y * y * y) * .5); p.setZ(i, p.getZ(i) * (.25 + .75 * k)); p.setX(i, p.getX(i) * (1 - .05 * y * y)); p.setY(i, p.getY(i) * (1 - .05 * x * x)); } g.computeVertexNormals(); const m = new THREE.Mesh(g, prodMat); m.castShadow = true; return m; };
    const a = mkC(), b = mkC(); a.position.set(-.32, .95, 0); a.rotation.set(-.1, .25, .08); b.position.set(.34, .9, .1); b.rotation.set(-.15, -.3, -.1); const gp = new THREE.Group(); gp.add(a, b); products.cushion = gp; }
  { // framed wall hanging
    const gp = new THREE.Group(), art = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), prodMat); art.position.y = 1.2; gp.add(art);
    [[0, .53, 1.12, .06], [0, -.53, 1.12, .06], [-.53, 0, .06, 1.12], [.53, 0, .06, 1.12]].forEach(([x, y, w, h]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, .05), darkWood); f.position.set(x, 1.2 + y, .02); f.castShadow = true; gp.add(f); }); products.hanging = gp; }
  Object.values(products).forEach((p) => { p.visible = false; prodGroup.add(p); });

  // camera choreography
  let mode = 'hero', camFrom = null, camT = 1, camDur = 1.6, layoutPanel = 'none';
  const cur = { p: new THREE.Vector3(3.2, 1.8, 5.4), t: new THREE.Vector3(.8, 1.2, 0) }, goal = { p: cur.p.clone(), t: cur.t.clone() };
  let aspect = 1;
  function framing() {
    const fov = camera.fov * Math.PI / 180, tv = Math.tan(fov / 2), wide = aspect > 1;
    if (mode === 'hero') return wide ? { p: [1.9, 1.7, 4.6], t: [-1.25, 1.2, 0] } : { p: [1.4, 1.5, 5.6], t: [0, .55, 0] };
    if (mode === 'wax' || mode === 'review') {
      const usableW = wide ? .66 : 1, usableH = wide ? 1 : .56, d = Math.max((H / 2 + .1) / (tv * usableH), (W / 2 + .1) / (tv * aspect * usableW)) * 1.12;
      const cy = 2.1 - H / 2, offX = (1 - usableW) * d * tv * aspect, offY = (1 - usableH) * d * tv;
      return { p: [offX, cy - offY, d], t: [offX, cy - offY, 0] };
    }
    if (mode === 'dye' || mode === 'boil') return wide ? { p: [.35, 2.3, 3.1], t: [.35, .45, 0] } : { p: [0, 2.6, 4.4], t: [0, .1, 0] };
    if (mode === 'product') return wide ? { p: [.5, 1.35, 3.2], t: [.5, 1.15, 0] } : { p: [0, 1.4, 4.2], t: [0, .75, 0] };
    return { p: [2, 2, 4], t: [0, 1, 0] };
  }
  function setMode(m) { mode = m; const f = framing(); camFrom = { p: cur.p.clone(), t: cur.t.clone() }; goal.p.set(...f.p); goal.t.set(...f.t); camT = 0; camDur = 1.4; }
  function resize() { const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setSize(w, h, false); aspect = w / h; camera.aspect = aspect; camera.fov = aspect > 1 ? 34 : 44; camera.updateProjectionMatrix(); const f = framing(); goal.p.set(...f.p); goal.t.set(...f.t); if (camT >= 1) { cur.p.copy(goal.p); cur.t.copy(goal.t); } }
  addEventListener('resize', resize); resize();

  // picking for wax drawing
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy) { const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); clothG.computeBoundingSphere(); const hit = ray.intersectObject(cloth)[0]; return hit ? hit.uv : null; }

  // dip / boil sequences
  let dropY = 0, anim = null, wind = .55, windT = .55, prodSpin = 0, prodDrag = 0;
  function sequence(kind, onBottom, onEnd) {
    return new Promise((res) => { anim = { kind, t0: performance.now(), onBottom, onEnd, fired: false, res }; if (kind === 'boil') { liquidMat.uniforms.uBoil.value = 1; } });
  }
  function setDye(rgb) { liquidMat.uniforms.uC.value.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace); }
  function texDirty(which = 'both') { if (which !== 'wax') colorTex.needsUpdate = true; if (which !== 'color') waxTex.needsUpdate = true; }
  function setProduct(id) { prodGroup.visible = !!id; hang.visible = !id; Object.entries(products).forEach(([k, p]) => { p.visible = k === id; }); prodSpin = 0; }
  canvas.addEventListener('pointerdown', (e) => { if (mode === 'product') { prodDrag = e.clientX; canvas.setPointerCapture(e.pointerId); } });
  canvas.addEventListener('pointermove', (e) => { if (mode === 'product' && prodDrag) { prodSpin += (e.clientX - prodDrag) * .008; prodDrag = e.clientX; } });
  canvas.addEventListener('pointerup', () => { prodDrag = 0; });

  let visible = true; new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  const pos = clothG.attributes.position; let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.1, (now - last) / 1000); last = now; if (!visible || document.hidden) return; const t = now / 1000;
    windT = mode === 'hero' ? .6 : mode === 'wax' ? .02 : mode === 'review' ? .12 : .3; wind += (windT - wind) * (1 - Math.exp(-dt * 2));
    // cloth motion (top row pinned)
    if (hang.visible) { const amp = wind * .06; for (let i = 0; i < pos.count; i++) { const bx = base[i * 3], by = base[i * 3 + 1], k = (2.1 - by) / H, kk = k * k;
        const z = amp * kk * (Math.sin(bx * 2.6 + t * 1.6 + by * 1.4) * 1.0 + Math.sin(bx * 5.1 - t * 2.3 + by * 3.1) * .35) + (anim && anim.kind === 'dye' ? 0 : 0);
        pos.setXYZ(i, bx + amp * .25 * kk * Math.sin(t * 1.1 + by * 2), by + amp * .1 * kk * Math.sin(bx * 3 + t * 1.3), z); }
      pos.needsUpdate = true; clothG.computeVertexNormals(); }
    // dip choreography
    if (anim) { const e = (now - anim.t0) / 1000, total = anim.kind === 'dye' ? 4.6 : 5.4, down = 1.3, hold = anim.kind === 'dye' ? 1.6 : 2.6; let y;
      if (e < down) y = -2.28 * ease(e / down); else if (e < down + hold) y = -2.28; else y = -2.28 * (1 - ease(Math.min(1, (e - down - hold) / (total - down - hold))));
      if (e > .55 && liquidMat.uniforms.uRip.value < anim.t0 / 1000) liquidMat.uniforms.uRip.value = t;
      if (!anim.fired && e > down + .1) { anim.fired = true; anim.onBottom && anim.onBottom(); }
      if (anim.kind === 'boil') { steamMat.uniforms.uA.value = Math.min(1, e / .8) * (e > total - .6 ? (total - e) / .6 : 1); if (e > down) waxU.value = Math.max(0, 1 - (e - down) / hold); }
      dropY = y; if (e >= total) { anim.onEnd && anim.onEnd(); const r = anim.res; anim = null; dropY = 0; liquidMat.uniforms.uBoil.value = 0; steamMat.uniforms.uA.value = 0; waxU.value = 1; r(); } }
    hang.position.y = dropY; ropes.forEach((r) => { const top = 2.62, bot = 2.14 + dropY, len = Math.max(.01, top - bot); r.scale.y = len; r.position.y = bot + len / 2; });
    liquidMat.uniforms.uT.value = t; steamMat.uniforms.uT.value = t;
    if (prodGroup.visible) { prodGroup.rotation.y += ((prodDrag ? 0 : dt * .35) ); prodGroup.rotation.y += prodSpin * .2; prodSpin *= .8; }
    // camera
    if (camT < 1) { camT = Math.min(1, camT + dt / camDur); const k = ease(camT); cur.p.lerpVectors(camFrom.p, goal.p, k); cur.t.lerpVectors(camFrom.t, goal.t, k); }
    const sway = mode === 'hero' ? Math.sin(t * .2) * .25 : 0; camera.position.set(cur.p.x + sway, cur.p.y, cur.p.z); camera.lookAt(cur.t);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return { setMode, pick, sequence, setDye, texDirty, setProduct, resize, get mode() { return mode; } };
}
