// Z Lab — the arcade hall menu (three.js r170)
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

window.__hallOK = true;
if (matchMedia('(pointer:coarse)').matches) document.body.classList.add('h-coarse');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const COARSE = matchMedia('(pointer:coarse)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const body = document.body;

/* ------------------------------------------------------------ sites, read from the list view */
const ACC = { hollowreef: '#5fb8ff', mall: '#ff7a59', litar: '#ff3b3b', riaceria: '#ff4fa3', rumah: '#f2b84b', kopi: '#d29254', vacancy: '#e8d36a',
  suria: '#ffb23f', wainscot: '#e0483a', lantera: '#9a8cff', kubu: '#2ee6a6', teduh: '#a5d67c', outbreak: '#ff2a2a', norvane: '#7fc4e0', layang: '#3fb0e6', congkak: '#d08a4a', my24: '#ffb547' };
const groups = $$('#list .grid').map((g) => ({ name: g.previousElementSibling ? g.previousElementSibling.textContent.trim() : '', cards: $$('.card', g) }));
const SITES = [];
groups.forEach((g, gi) => g.cards.forEach((c, ci) => {
  const href = c.getAttribute('href'), slug = href.replace(/\/.*/, '');
  SITES.push({ href, slug, group: g.name, gi, gn: g.cards.length, ci, title: $('h3', c).textContent, desc: $('p', c).textContent,
    badge: $('.badge', c).textContent, hot: $('.badge', c).classList.contains('hot'), ctl: $('.meta span', c).textContent, size: $('.meta b', c).textContent,
    img: $('img', c).getAttribute('src'), acc: ACC[slug] || '#f2b84b' });
}));
const N = SITES.length;
// slot layout: groups separated by an empty slot (a neon pillar stands there)
let slot = 0; SITES.forEach((s, i) => { if (i > 0 && s.gi !== SITES[i - 1].gi) slot++; s.slot = slot++; });
const SLOTS = slot, R = 6.6, SP = 1.0, dA = SP / R;
const slotAngle = (s) => (s - (SLOTS - 1) / 2) * dA;
const dir = (a, r, y = 0) => new THREE.Vector3(Math.sin(a) * r, y, -Math.cos(a) * r);

/* ------------------------------------------------------------ renderer */
const canvas = $('#hall');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer || !renderer.getContext()) { body.classList.add('no3d', 'list'); body.classList.remove('hallmode'); throw new Error('no webgl'); }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040306);
scene.fog = new THREE.FogExp2(0x07050b, .05);
const camera = new THREE.PerspectiveCamera(50, 1, .05, 60);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .32;

/* ------------------------------------------------------------ loading */
const manager = new THREE.LoadingManager();
const loadBar = $('#ld-bar'), loadPct = $('#ld-pct');
manager.onProgress = (u, a, b) => { const p = Math.round(a / b * 100); loadBar.style.width = p + '%'; loadPct.textContent = p + '%'; };
const tl = new THREE.TextureLoader(manager);
const tex = (u, srgb, rep) => { const t = tl.load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep, rep); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const fontsReady = Promise.race([Promise.all([document.fonts.load('700 80px "Space Grotesk"'), document.fonts.load('500 40px "JetBrains Mono"')]).catch(() => 0), new Promise((r) => setTimeout(r, 2500))]);

/* ------------------------------------------------------------ canvas helpers */
const hex = (h) => new THREE.Color(h);
const mixHex = (a, b, t) => '#' + hex(a).lerp(hex(b), t).getHexString();
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function fitFont(x, text, maxW, size, weight = 700, fam = '"Space Grotesk", "Arial Black", sans-serif') { let s = size; do { x.font = `${weight} ${s}px ${fam}`; s -= 2; } while (x.measureText(text).width > maxW && s > 10); return s + 2; }
function grain(x, w, h, a) { const img = x.getImageData(0, 0, w, h), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * a; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(img, 0, 0); }

function sideArt(s, i) {
  return canvasTex(512, 1204, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#121217'); g.addColorStop(1, '#09090c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const cols = [s.acc, mixHex(s.acc, '#ffffff', .45), 'rgba(255,255,255,.85)'];
    for (let k = 0; k < 3; k++) {
      const o = k * 64; x.fillStyle = cols[k]; x.beginPath();
      x.moveTo(w, h * .86 - o); x.bezierCurveTo(w * .55, h * .78 - o, w * .3, h * .55 - o, 0, h * .3 - o);
      x.lineTo(0, h * .3 - o - (k === 2 ? 14 : 40)); x.bezierCurveTo(w * .3, h * .55 - o - (k === 2 ? 14 : 40), w * .55, h * .78 - o - (k === 2 ? 14 : 40), w, h * .86 - o - (k === 2 ? 14 : 40)); x.closePath(); x.fill();
    }
    // vertical title along the back half
    x.save(); x.translate(w * .25, h * .97); x.rotate(-Math.PI / 2);
    const t = s.title.toUpperCase(); const fs = fitFont(x, t, h * .6, 110);
    x.lineWidth = 3; x.strokeStyle = s.acc; x.strokeText(t, 0, fs * .35); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillText(t, 0, fs * .35);
    x.restore();
    x.font = '500 22px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText('Z LAB  ·  No. ' + String(i + 1).padStart(2, '0'), w * .42, h * .975);
    grain(x, w, h, 10);
  });
}
function marqueeTex(s) {
  return canvasTex(1024, 372, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .62); g.addColorStop(0, mixHex(s.acc, '#ffffff', .25)); g.addColorStop(.55, s.acc); g.addColorStop(1, mixHex(s.acc, '#000000', .65));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = .12; x.fillStyle = '#000'; for (let y = 0; y < h; y += 6) x.fillRect(0, y, w, 2); x.globalAlpha = 1;
    x.font = '500 30px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(0,0,0,.6)'; x.textAlign = 'center'; x.fillText(s.badge.toUpperCase(), w / 2, 62);
    const t = s.title.toUpperCase(), fs = fitFont(x, t, w * .86, 150);
    x.lineJoin = 'round'; x.lineWidth = fs * .16; x.strokeStyle = 'rgba(10,8,14,.92)'; x.strokeText(t, w / 2, h / 2 + fs * .36);
    x.shadowColor = '#fff'; x.shadowBlur = 18; x.fillStyle = '#fffaf0'; x.fillText(t, w / 2, h / 2 + fs * .36); x.shadowBlur = 0;
    x.font = '500 26px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(0,0,0,.55)'; x.fillText('★  INSERT COIN  ★', w / 2, h - 34);
  });
}
const coinTex = canvasTex(256, 340, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#6d7076'); g.addColorStop(.5, '#a7abb1'); g.addColorStop(1, '#6a6d73'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.globalAlpha = .18; for (let y = 0; y < h; y += 2) { x.fillStyle = Math.random() > .5 ? '#fff' : '#000'; x.fillRect(0, y, w, 1); } x.globalAlpha = 1;
  x.strokeStyle = '#3c3e42'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
  for (const cx of [72, 184]) { x.fillStyle = '#1b1b1f'; x.fillRect(cx - 34, 54, 68, 96); x.fillStyle = '#ff3b30'; x.fillRect(cx - 26, 62, 52, 80); x.fillStyle = '#16060a'; x.fillRect(cx - 4, 72, 8, 60); x.font = '700 22px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText('25¢', cx, 182); }
  x.font = '500 17px "JetBrains Mono", monospace'; x.fillStyle = '#222'; x.textAlign = 'center'; x.fillText('INSERT COIN', w / 2, 232);
  x.beginPath(); x.arc(w / 2, 286, 16, 0, 7); x.fillStyle = '#2a2b2f'; x.fill(); x.fillStyle = '#c9ccd1'; x.fillRect(w / 2 - 2, 276, 4, 20);
});
function panelTex(s) {
  return canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#0d0d11'; x.fillRect(0, 0, w, h);
    x.fillStyle = s.acc; x.beginPath(); x.moveTo(0, h * .82); x.bezierCurveTo(w * .3, h * .7, w * .7, h * .95, w, h * .75); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    x.font = '500 20px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('1P', 30, 40); x.fillText('START', w - 110, 40);
    grain(x, w, h, 8);
  });
}

/* ------------------------------------------------------------ shared materials */
const black = new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: .42, metalness: 0 });
const metal = new THREE.MeshStandardMaterial({ color: 0x8a8d92, metalness: .92, roughness: .3 });
const coinMat = new THREE.MeshStandardMaterial({ map: coinTex, metalness: .7, roughness: .38, emissive: 0xffffff, emissiveMap: coinTex, emissiveIntensity: .05 });
const bezel = new THREE.MeshStandardMaterial({ color: 0x020203, roughness: .6, envMapIntensity: .25 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .05, roughness: .02, metalness: 0, envMapIntensity: .9, depthWrite: false });
const grille = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: .8, metalness: .3 });
const btnCols = [0xff3b3b, 0xffd23b, 0x3bb2ff, 0x3bff8a, 0xff7a3b, 0xd43bff];

/* ------------------------------------------------------------ CRT screen material */
function crtMat(map) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uOn: { value: .5 }, uT: { value: 0 }, uFlash: { value: 0 }, uCrop: { value: new THREE.Vector2(1, (4 / 3) / (.56 / .385)) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D map; uniform float uOn, uT, uFlash; uniform vec2 uCrop; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec2 c = vUv - .5; vec2 uv = .5 + c*(1. + .09*dot(c,c));
        if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }
        vec2 tuv = .5 + (uv - .5)*uCrop;
        vec3 col = texture2D(map, tuv).rgb;
        float scan = .86 + .14*sin(uv.y*420. + uT*6.);
        float mask = .93 + .07*sin(uv.x*1150.);
        float roll = .06*smoothstep(.0,.04, abs(fract(uv.y*.5 - uT*.08) - .5) - .45);
        float vig = smoothstep(.85, .25, length(c*vec2(1.,1.25)));
        col = col*scan*mask*vig*uOn*1.25 + roll*uOn*.5;
        col += (h(uv*800. + uT) - .5)*.07*clamp(1. - uOn, 0., 1.);
        col = mix(col, vec3(1.7,1.65,1.6), uFlash);
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

/* ------------------------------------------------------------ cabinet */
const shape = new THREE.Shape();
[[-.36, 0], [.30, 0], [.30, .78], [.44, .88], [.44, .95], [.17, 1.03], [.07, 1.60], [.18, 1.64], [.18, 1.88], [-.36, 1.88]].forEach(([a, b], i) => i ? shape.lineTo(a, b) : shape.moveTo(a, b));
const sideGeo = new THREE.ExtrudeGeometry(shape, { depth: .02, bevelEnabled: true, bevelThickness: .006, bevelSize: .008, bevelSegments: 2, curveSegments: 1 });
sideGeo.rotateY(-Math.PI / 2);
const scrA = Math.atan2(.1, .58), scrC = new THREE.Vector3(0, 1.315, .115), scrN = new THREE.Vector3(0, Math.sin(scrA), Math.cos(scrA));
const screenGeo = new THREE.PlaneGeometry(.56, .385, 24, 16);
{ const p = screenGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / .28, y = p.getY(i) / .19; p.setZ(i, .012 * (1 - x * x * .5 - y * y * .5)); } screenGeo.computeVertexNormals(); }

const cabs = [], hitBoxes = [];
function buildCabinet(s, i) {
  const g = new THREE.Group();
  const art = sideArt(s, i); art.wrapS = art.wrapT = THREE.ClampToEdgeWrapping; art.repeat.set(1 / .8, 1 / 1.88); art.offset.set(.36 / .8, 0);
  const sideMat = new THREE.MeshPhysicalMaterial({ map: art, roughness: .38, clearcoat: .7, clearcoatRoughness: .2 });
  const tmold = new THREE.MeshPhysicalMaterial({ color: s.acc, roughness: .28, clearcoat: 1, metalness: .1 });
  for (const x of [-.33, .35]) { const m = new THREE.Mesh(sideGeo, [sideMat, tmold]); m.position.x = x; g.add(m); }
  const box = (w, h, d, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.x = rx; g.add(m); return m; };
  box(.66, 1.88, .02, black, 0, .94, -.35);
  box(.66, .02, .54, black, 0, 1.87, -.09);
  box(.66, .78, .02, black, 0, .39, .29);
  box(.66, .14, .16, black, 0, .84, .37);
  box(.66, .02, .13, grille, 0, 1.615, .125, -.35);
  // coin door
  const door = new THREE.Mesh(new THREE.PlaneGeometry(.25, .33), coinMat); door.position.set(0, .5, .301); g.add(door);
  // control panel
  const cpA = Math.atan2(.08, .27);
  const cp = new THREE.Mesh(new THREE.BoxGeometry(.66, .08, .29), [black, black, new THREE.MeshPhysicalMaterial({ map: panelTex(s), roughness: .3, clearcoat: .6 }), black, black, black]);
  cp.position.set(0, .95, .305); cp.rotation.x = cpA; g.add(cp);
  const stick = new THREE.Group(); stick.position.set(-.17, .04, -.01); cp.add(stick);
  stick.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .008, 24), black), {}));
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .07, 8), metal); shaft.position.y = .035; stick.add(shaft);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.022, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xe0242b, roughness: .18, clearcoat: 1 })); ball.position.y = .075; stick.add(ball);
  const btnG = new THREE.CylinderGeometry(.016, .016, .014, 20);
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(btnG, new THREE.MeshPhysicalMaterial({ color: btnCols[(k + i) % 6], roughness: .25, clearcoat: 1, emissive: btnCols[(k + i) % 6], emissiveIntensity: .12 })); b.position.set(.02 + (k % 3) * .055 + (k > 2 ? .012 : 0), .045, k > 2 ? .045 : -.015); cp.add(b); }
  // screen, bezel, glass
  const bz = new THREE.Mesh(new THREE.PlaneGeometry(.64, .6), bezel); bz.position.copy(scrC).addScaledVector(scrN, -.004); bz.rotation.x = -scrA; g.add(bz);
  const scrMat = crtMat(tex(s.img, true)); scrMat.uniforms.map.value.wrapS = scrMat.uniforms.map.value.wrapT = THREE.ClampToEdgeWrapping;
  const scr = new THREE.Mesh(screenGeo, scrMat); scr.position.copy(scrC); scr.rotation.x = -scrA; g.add(scr);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(.62, .58), glass); gl.position.copy(scrC).addScaledVector(scrN, .022); gl.rotation.x = -scrA; gl.renderOrder = 2; g.add(gl);
  // marquee
  const mq = new THREE.Mesh(new THREE.PlaneGeometry(.66, .24), new THREE.MeshBasicMaterial({ map: marqueeTex(s), toneMapped: true }));
  mq.position.set(0, 1.76, .182); g.add(mq);
  box(.68, .012, .04, metal, 0, 1.636, .17); box(.68, .012, .04, metal, 0, 1.884, .17);
  // floor shadow
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.3), shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.set(0, .004, .05); g.add(sh);
  // placement
  const a = slotAngle(s.slot); g.position.copy(dir(a, R)); g.rotation.y = -a;
  scene.add(g);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(.75, 1.9, .9), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(0, .95, .04); hb.userData.i = i; g.add(hb); hitBoxes.push(hb);
  cabs.push({ g, scr, scrMat, mq, a, s });
}
const shadowMat = new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (x, w, h) => { const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(.6, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }, false), transparent: true, depthWrite: false });

/* ------------------------------------------------------------ hall: floor, walls, ceiling, neon */
const floorD = tex('arcade/tex/floor_diff.jpg', true, 1), floorN = tex('arcade/tex/floor_nor.jpg', false, 1), floorR = tex('arcade/tex/floor_rough.jpg', false, 1);
const NG = 24; // glow pools: one per cabinet (max 24)
const glowP = Array.from({ length: NG }, () => new THREE.Vector3(0, 0, 0)), glowC = Array.from({ length: NG }, () => new THREE.Vector3());
const FloorShader = {
  name: 'FloorShader',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, tFloor: { value: null }, tNor: { value: null }, tRough: { value: null }, uGlowP: { value: glowP }, uGlowC: { value: glowC }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv = textureMatrix*vec4(position,1.); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse, tFloor, tNor, tRough; uniform vec3 uGlowP[${NG}]; uniform vec3 uGlowC[${NG}]; varying vec4 vUv; varying vec3 vW;
    void main(){
      vec2 fuv = vW.xz*.32;
      vec3 d = texture2D(tFloor, fuv).rgb; float r = texture2D(tRough, fuv).r; vec2 nn = texture2D(tNor, fuv).xy*2. - 1.;
      d *= .55 + .45*texture2D(tFloor, vW.xz*.045 + .3).r;
      float rough = clamp(r*1.1 - .15, .05, 1.);
      vec2 puv = vUv.xy/vUv.w + nn*.006*rough;
      float bl = .006 + .02*rough; vec3 refl = vec3(0.);
      refl += texture2D(tDiffuse, puv).rgb*.28;
      refl += texture2D(tDiffuse, puv + vec2(bl,0.)).rgb*.18; refl += texture2D(tDiffuse, puv - vec2(bl,0.)).rgb*.18;
      refl += texture2D(tDiffuse, puv + vec2(0.,bl*1.6)).rgb*.18; refl += texture2D(tDiffuse, puv - vec2(0.,bl*1.6)).rgb*.18;
      vec3 V = normalize(cameraPosition - vW); float fr = .04 + .96*pow(1. - clamp(V.y,0.,1.), 5.);
      float k = mix(.22, .9, fr)*(1. - rough*.65);
      vec3 light = vec3(.035,.03,.045);
      for (int i = 0; i < ${NG}; i++) { vec2 dd = vW.xz - uGlowP[i].xy; light += uGlowC[i]*uGlowP[i].z*exp(-dot(dd,dd)*1.6); }
      vec3 col = d*light*2.2 + refl*k*color;
      gl_FragColor = vec4(col, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
};
const floorGeo = new THREE.CircleGeometry(16, 64);
let floor;
{
  const sc = COARSE ? .4 : .55;
  floor = new Reflector(floorGeo, { clipBias: .003, textureWidth: innerWidth * sc * Math.min(devicePixelRatio, 1.5), textureHeight: innerHeight * sc * Math.min(devicePixelRatio, 1.5), color: 0xcfcfd6, shader: FloorShader, multisample: 0 });
  floor.rotation.x = -Math.PI / 2;
  const u = floor.material.uniforms; u.tFloor.value = floorD; u.tNor.value = floorN; u.tRough.value = floorR; u.uGlowP.value = glowP; u.uGlowC.value = glowC;
  scene.add(floor);
}
// walls (brick drum) and ceiling
const brickD = tex('arcade/tex/brick_diff.jpg', true), brickN = tex('arcade/tex/brick_nor.jpg', false);
brickD.repeat.set(26, 2.6); brickN.repeat.set(26, 2.6);
const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.5, R + 1.5, 4.4, 128, 1, true), new THREE.MeshStandardMaterial({ map: brickD, normalMap: brickN, color: 0x6c6670, roughness: .92, side: THREE.BackSide }));
wall.position.y = 2.2; scene.add(wall);
const ceil = new THREE.Mesh(new THREE.CircleGeometry(R + 1.6, 64), new THREE.MeshStandardMaterial({ color: 0x0b0a0e, roughness: .9 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.4; scene.add(ceil);
// ceiling troffers: warm strips over the aisle
const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.7) });
for (let s = -1; s < SLOTS + 1; s += 2) { const a = slotAngle(s + .5), m = new THREE.Mesh(new THREE.PlaneGeometry(.18, 1.1), lampMat); m.position.copy(dir(a, R - 1.4, 4.38)); m.rotation.set(Math.PI / 2, 0, a); scene.add(m); }
// neon tubes along the wall: magenta high, cyan skirting
function neonRing(r, y, col, t, a0, a1) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 160, a1 - a0), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); m.rotation.x = Math.PI / 2; m.rotation.z = -Math.PI / 2 + a0; m.position.y = y; scene.add(m); return m; }
const aMin = slotAngle(-1.2), aMax = slotAngle(SLOTS + .2);
neonRing(R + 1.45, 3.35, new THREE.Color(3.2, .35, 1.6), .022, aMin, aMax);
neonRing(R + 1.45, .1, new THREE.Color(.3, 2.2, 2.6), .016, aMin, aMax);
// neon signs over each group, and the pillar in the gap
function neonSign(text, col, hgt) {
  const t = canvasTex(1024, 220, (x, w, h) => {
    x.font = '700 150px "Space Grotesk", sans-serif'; const fs = fitFont(x, text, w * .92, 150); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineJoin = 'round'; x.shadowColor = col; x.shadowBlur = 34; x.strokeStyle = col; x.lineWidth = fs * .09; x.strokeText(text, w / 2, h / 2);
    x.shadowBlur = 8; x.strokeStyle = '#fff'; x.lineWidth = fs * .03; x.strokeText(text, w / 2, h / 2);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(hgt * 1024 / 220, hgt), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.8, 1.8, 1.8), toneMapped: false }));
  return m;
}
const signCols = ['#38e1ff', '#ff4fd8', '#ffd23b'];
groups.forEach((gr, gi) => {
  const ss = SITES.filter((s) => s.gi === gi); if (!ss.length) return;
  const a = slotAngle((ss[0].slot + ss[ss.length - 1].slot) / 2), m = neonSign(gr.name.toUpperCase(), signCols[gi % 3], .42);
  m.position.copy(dir(a, R + 1.42, 2.75)); m.rotation.y = -a; scene.add(m);
});
const zSign = neonSign('Z LAB', '#ffd23b', .5);
{ const a = slotAngle(-2.6); zSign.position.copy(dir(a, R + 1.4, 3.0)); zSign.rotation.y = -a; zSign.scale.setScalar(.75); scene.add(zSign); }
// pillars with vertical neon in gaps / ends
const pillarMat = new THREE.MeshStandardMaterial({ color: 0x141218, roughness: .6 });
function pillar(sl, col) { const a = slotAngle(sl), p = new THREE.Mesh(new THREE.BoxGeometry(.38, 4.4, .38), pillarMat); p.position.copy(dir(a, R + .2, 2.2)); p.rotation.y = -a; scene.add(p); const tube = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 3.4, 8), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(.6), toneMapped: false })); tube.position.copy(dir(a, R + .2 - .2, 2.1)); scene.add(tube); }
SITES.forEach((s, i) => { if (i > 0 && s.gi !== SITES[i - 1].gi) pillar(s.slot - 1, new THREE.Color(2.6, .5, 2.2)); });
pillar(-1, new THREE.Color(.4, 2.2, 2.6)); pillar(SLOTS, new THREE.Color(.4, 2.2, 2.6));

/* ------------------------------------------------------------ lights */
scene.add(new THREE.HemisphereLight(0x9aa6ff, 0x1a1210, .35));
const spot = new THREE.SpotLight(0xffe2c0, 26, 9, .48, .65, 1.6); scene.add(spot, spot.target);
const pinkL = new THREE.PointLight(0xff3fb4, 10, 9, 1.6), cyanL = new THREE.PointLight(0x3fe0ff, 10, 9, 1.6);
pinkL.position.copy(dir(slotAngle(1), R + .6, 3.2)); cyanL.position.copy(dir(slotAngle(SLOTS - 2), R + .6, 3.2)); scene.add(pinkL, cyanL);

/* ------------------------------------------------------------ post */
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: COARSE ? 0 : 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .45, .82); composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ------------------------------------------------------------ build */
await fontsReady;
SITES.forEach(buildCabinet);
// average thumbnail colour → floor glow tint
SITES.forEach((s, i) => {
  const c = hex(s.acc); glowC[i].set(c.r, c.g, c.b);
  const im = new Image(); im.onload = () => { try { const cv = document.createElement('canvas'); cv.width = cv.height = 8; const x = cv.getContext('2d'); x.drawImage(im, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data; let r = 0, g = 0, b = 0; for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; } const n = d.length / 4 * 255, avg = new THREE.Color(r / n, g / n, b / n).convertSRGBToLinear(); const mix = avg.multiplyScalar(2.2).lerp(c, .45); glowC[i].set(mix.r, mix.g, mix.b); } catch (e) { } }; im.src = s.img;
  const p = dir(cabs[i].a, R - .75); glowP[i].set(p.x, p.z, .2);
});

/* ------------------------------------------------------------ HUD */
const hud = { grp: $('#h-grp'), badge: $('#h-badge'), title: $('#h-title'), desc: $('#h-desc'), ctl: $('#h-ctl'), size: $('#h-size'), play: $('#h-play'), panel: $('#h-panel'), rail: $('#h-rail') };
SITES.forEach((s, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', s.title); b.style.setProperty('--c', s.acc); b.addEventListener('click', () => select(i)); if (i > 0 && s.gi !== SITES[i - 1].gi) b.classList.add('gap'); hud.rail.appendChild(b); });
let sel = -1, camSlot = SITES[0].slot, targetSlot = camSlot, hover = -1;
function select(i, quiet) {
  i = (i + N) % N; if (i === sel) return; sel = i; targetSlot = SITES[i].slot; const s = SITES[i];
  hud.grp.textContent = `${s.group} · ${s.ci + 1} / ${s.gn}`; hud.badge.textContent = s.badge; hud.badge.classList.toggle('hot', s.hot);
  hud.title.textContent = s.title; hud.desc.textContent = s.desc; hud.ctl.textContent = s.ctl; hud.size.textContent = s.size;
  hud.play.href = s.href; hud.panel.style.setProperty('--acc', s.acc);
  hud.panel.classList.remove('swap'); void hud.panel.offsetWidth; hud.panel.classList.add('swap');
  $$('button', hud.rail).forEach((b, k) => b.classList.toggle('on', k === i));
  if (!quiet) sfx.tick();
  try { localStorage.setItem('zlab.sel', s.slug); } catch (e) { }
}
{ let start = 0; try { const k = localStorage.getItem('zlab.sel'); const f = SITES.findIndex((s) => s.slug === k); if (f >= 0) start = f; } catch (e) { } camSlot = SITES[start].slot; select(start, true); }
$('#h-prev').addEventListener('click', () => select(sel - 1));
$('#h-next').addEventListener('click', () => select(sel + 1));
hud.play.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); play(sel); });

/* ------------------------------------------------------------ sound (WebAudio, off until asked) */
const sfx = (() => {
  let ac = null, on = false, master, amb;
  const btn = $('#h-sound');
  function init() {
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; amb = ac.createGain(); amb.gain.value = 0; src.connect(lp).connect(amb).connect(master); src.start();
    const hum = ac.createOscillator(); hum.frequency.value = 50; const hg = ac.createGain(); hg.gain.value = .012; hum.connect(hg).connect(amb); hum.start();
    (function bleep() { if (on) { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), p = ac.createStereoPanner(); o.type = Math.random() > .5 ? 'square' : 'triangle'; const base = [262, 330, 392, 523, 659][Math.floor(Math.random() * 5)]; o.frequency.setValueAtTime(base, t); o.frequency.setValueAtTime(base * 1.5, t + .07); o.frequency.setValueAtTime(base * 2, t + .14); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.012, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .3); p.pan.value = Math.random() * 1.6 - .8; o.connect(g).connect(p).connect(master); o.start(t); o.stop(t + .32); } setTimeout(bleep, 1800 + Math.random() * 3500); })();
  }
  function tone(f, t0, dur, type = 'square', vol = .06) { const t = ac.currentTime + t0, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02); }
  function set(v) { on = v; if (on && !ac) init(); if (ac) { ac.resume(); amb.gain.setTargetAtTime(on ? .35 : 0, ac.currentTime, .3); } btn.setAttribute('aria-pressed', on); btn.querySelector('span').textContent = on ? 'Sound on' : 'Sound off'; try { localStorage.setItem('zlab.snd', on ? '1' : '0'); } catch (e) { } }
  btn.addEventListener('click', () => set(!on));
  return { tick() { if (on) tone(1400, 0, .03, 'square', .02); }, coin() { if (on) { tone(988, 0, .09); tone(1319, .085, .45); } }, power() { if (on) { tone(110, 0, .5, 'sawtooth', .03); tone(55, .05, .6, 'sine', .08); } } };
})();

/* ------------------------------------------------------------ input */
let drag = null, intro = REDUCED || location.search.includes('still') ? 1 : 0, playing = null, mx = 0, my = 0, tmx = 0, tmy = 0, idle = 0;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(hitBoxes, false)[0]; return h ? h.object.userData.i : -1; }
const nearestCab = (sl) => { let b = 0, bd = 1e9; SITES.forEach((s, i) => { const d = Math.abs(s.slot - sl); if (d < bd) { bd = d; b = i; } }); return b; };
canvas.addEventListener('pointerdown', (e) => { if (playing) return; drag = { x: e.clientX, y: e.clientY, s: camSlot, moved: 0 }; canvas.setPointerCapture(e.pointerId); hideHint(); });
canvas.addEventListener('pointermove', (e) => {
  tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5;
  if (drag) { const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx)); if (drag.moved > 6) { targetSlot = clamp(drag.s - dx / (COARSE ? 90 : 160), -.4, SLOTS - .6); } }
  else if (!COARSE) { hover = pick(e); canvas.style.cursor = hover >= 0 ? 'pointer' : 'grab'; }
});
canvas.addEventListener('pointerup', (e) => {
  if (!drag) return; const d = drag; drag = null;
  if (d.moved > 6) { const i = nearestCab(targetSlot); sel = -1; select(i); return; }
  const i = pick(e); if (i < 0) return; if (i === sel) play(i); else select(i);
});
canvas.addEventListener('pointercancel', () => { if (drag) { drag = null; const i = nearestCab(targetSlot); sel = -1; select(i, true); } });
let wheelT = 0;
addEventListener('wheel', (e) => { if (body.classList.contains('list') || playing) return; const now = performance.now(); if (now - wheelT < 260) return; const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(d) < 8) return; wheelT = now; select(sel + Math.sign(d)); hideHint(); }, { passive: true });
addEventListener('keydown', (e) => {
  if (body.classList.contains('list') || playing) return; if (e.target.closest && e.target.closest('input,textarea')) return;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { select(sel + 1); hideHint(); }
  else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { select(sel - 1); hideHint(); }
  else if (e.key === 'Enter' && (e.target === document.body || e.target === canvas)) play(sel);
});
const hint = $('#h-hint'); let hintGone = false;
function hideHint() { if (hintGone) return; hintGone = true; hint.classList.add('gone'); }
setTimeout(hideHint, 9000);

/* ------------------------------------------------------------ play: walk up, lean into the screen, go */
const fade = $('#fade');
function play(i) {
  if (playing) return; if (i !== sel) select(i, true);
  const c = cabs[i];
  const C = scrC.clone().applyMatrix4(c.g.matrixWorld), n = scrN.clone().transformDirection(c.g.matrixWorld);
  const dur = REDUCED ? 600 : 1250; setTimeout(() => { if (playing && !playing.gone) { playing.gone = true; location.href = SITES[i].href; } }, dur + 700);
  playing = { i, t: 0, t0: performance.now(), dur, p0: camera.position.clone(), l0: curLook.clone(), p1: C.clone().addScaledVector(n, camera.aspect < 1 ? .62 : .44), l1: C };
  sfx.coin(); setTimeout(() => sfx.power(), 380);
  body.classList.add('playing');
}
addEventListener('pageshow', (e) => { if (e.persisted || playing) { playing = null; body.classList.remove('playing'); fade.style.opacity = 0; cabs.forEach((c) => { c.scrMat.uniforms.uFlash.value = 0; }); } });

/* ------------------------------------------------------------ resize */
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
  camera.aspect = w / h; camera.fov = w / h < .8 ? 62 : 50;
  // push the subject away from the HUD: right of the panel on wide screens, above it on tall ones
  if (w / h >= 1) camera.setViewOffset(w, h, -w * .13, 0, w, h); else camera.setViewOffset(w, h, 0, h * .17, w, h);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* ------------------------------------------------------------ loop */
const curLook = new THREE.Vector3(), clock = new THREE.Clock();
let running = true; document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.getDelta(); });
function frame() {
  requestAnimationFrame(frame); if (!running || body.classList.contains('list')) return;
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (revealed) intro = Math.min(1, intro + dt / 2.6); const ei = ease(intro);
  camSlot += (targetSlot - camSlot) * (1 - Math.exp(-dt * (drag ? 14 : 5)));
  mx += (tmx - mx) * .05; my += (tmy - my) * .05;
  const a = slotAngle(camSlot) + mx * .035;
  const portrait = camera.aspect < .8, rc = portrait ? R - 3.3 : R - 3.7;
  const pos = dir(a, lerp(-2.4, rc, ei), lerp(2.6, portrait ? 1.5 : 1.55, ei) - my * .08);
  const look = dir(a, R, lerp(1.05, portrait ? 1.0 : 1.02, ei));
  if (playing) {
    playing.t = Math.min(1, (performance.now() - playing.t0) / playing.dur); const k = ease(playing.t);
    camera.position.lerpVectors(playing.p0, playing.p1, k); curLook.lerpVectors(playing.l0, playing.l1, k);
    const u = cabs[playing.i].scrMat.uniforms; u.uOn.value = lerp(1, 1.5, k); u.uFlash.value = clamp((playing.t - .62) / .3, 0, 1);
    fade.style.opacity = clamp((playing.t - .78) / .2, 0, 1);
    if (playing.t >= 1 && !playing.gone) { playing.gone = true; location.href = SITES[playing.i].href; }
  } else { camera.position.copy(pos); curLook.copy(look); }
  camera.lookAt(curLook);
  // cabinets: selected screen bright, others in attract mode; floor pools follow
  cabs.forEach((c, i) => {
    const on = i === sel ? 1 : (i === hover ? .8 : .42); const u = c.scrMat.uniforms;
    if (!playing || playing.i !== i) u.uOn.value += (on - u.uOn.value) * (1 - Math.exp(-dt * 6));
    u.uT.value = t + i * 3.1; glowP[i].z += ((i === sel ? .55 : .16) - glowP[i].z) * (1 - Math.exp(-dt * 5));
  });
  // key light follows the selection
  const sa = slotAngle(SITES[sel].slot); spot.position.copy(dir(sa, R - 1.6, 4.2)); spot.target.position.copy(dir(sa, R, .9));
  zSign.material.opacity = Math.sin(t * 17) > -.92 || Math.random() > .4 ? 1 : .3;
  composer.render();
}
// warm up: compile, then reveal
manager.onLoad = () => reveal();
setTimeout(() => reveal(), 9000);
let revealed = false;
function reveal() { if (revealed) return; revealed = true; renderer.compile(scene, camera); body.classList.add('ready'); clock.getDelta(); }
frame();
