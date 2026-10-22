// Fleet showroom: the A330neo parked on the apron under a real HDRI sky.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildPlane } from './plane.js';

export function initFleet(canvas, { onReady } = {}) {
  const COARSE = matchMedia('(pointer:coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 4000);
  camera.position.set(-62, 9, 64);
  scene.fog = new THREE.Fog(0xb9c6d2, 220, 1400);

  new RGBELoader().load('tex/sky.hdr', (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = hdr; scene.environment = hdr; scene.backgroundIntensity = 1; scene.environmentIntensity = 1;
    onReady && onReady(); dirty = 3;
  });
  const sun = new THREE.DirectionalLight(0xfff1dc, 3.2); sun.position.set(-60, 90, 40); sun.castShadow = true;
  sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 10, far: 260 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .4;
  scene.add(sun);

  // apron
  const tl = new THREE.TextureLoader();
  const T = (u, srgb) => { const t = tl.load(u, () => { dirty = 3; }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(160, 160); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1500, 64), new THREE.MeshStandardMaterial({ map: T('tex/floor_diff.jpg', true), normalMap: T('tex/floor_nor.jpg'), roughnessMap: T('tex/floor_rough.jpg'), color: 0xb9b6ae, roughness: .9 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // markings: yellow taxi centreline, stop bar and stand number
  const paint = (w, h, x, z, col, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: col, roughness: .7 })); m.rotation.x = -Math.PI / 2; m.rotation.z = ry; m.position.set(x, .02, z); m.receiveShadow = true; scene.add(m); return m; };
  paint(.35, 400, 0, -60, 0xe8b528); paint(9, .45, 0, 30.5, 0xe8b528); paint(.35, 400, 22, -60, 0xf2f2ee); paint(.35, 400, -22, -60, 0xf2f2ee);
  { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#e8b528'; x.font = '800 96px Arial'; x.textAlign = 'center'; x.fillText('C14', 128, 100); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .7 })); m.rotation.x = -Math.PI / 2; m.position.set(0, .03, 35); scene.add(m); }

  const plane = buildPlane({ gear: true, lights: true }); plane.position.y = 4.85; scene.add(plane);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 4, 0); controls.enableDamping = true; controls.dampingFactor = .06;
  controls.minDistance = 30; controls.maxDistance = 140; controls.maxPolarAngle = Math.PI / 2 - .04; controls.minPolarAngle = .2;
  controls.enablePan = false; controls.autoRotate = true; controls.autoRotateSpeed = .45;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resumeT); });
  controls.addEventListener('end', () => { resumeT = setTimeout(() => { controls.autoRotate = true; }, 6000); });
  let resumeT = 0, dirty = 3, visible = false;
  // touch: let the page scroll vertically unless the user is clearly rotating
  canvas.style.touchAction = 'pan-y';

  function resize() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.fov = camera.aspect < 1 ? 46 : 32; camera.updateProjectionMatrix(); dirty = 3; }
  addEventListener('resize', resize); resize();
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);

  const views = { side: [-70, 6, 0], front: [0, 6, 70], top: [-34, 58, 30], rear: [40, 10, -62], three: [-62, 9, 64] };
  let fly = null;
  function view(name) { const v = views[name]; if (!v) return; fly = { from: camera.position.clone(), to: new THREE.Vector3(...v), t: 0 }; controls.autoRotate = false; clearTimeout(resumeT); resumeT = setTimeout(() => { controls.autoRotate = true; }, 9000); }

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .05);
    if (!visible) return;
    if (fly) { fly.t = Math.min(1, fly.t + dt / 1.4); const k = fly.t < .5 ? 2 * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 2) / 2; camera.position.lerpVectors(fly.from, fly.to, k); if (fly.t >= 1) fly = null; }
    controls.update(); plane.userData.tick(clock.elapsedTime);
    renderer.render(scene, camera);
  })();
  return { view, resize };
}
