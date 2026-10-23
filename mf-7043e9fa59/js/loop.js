// Mfinity hero: data flowing along the Mfinity wave mark, with six solution nodes
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const host = document.querySelector('.hero');
const canvas = host && host.querySelector('canvas.gl');
if (canvas) fetch(new URL('wave.json', import.meta.url)).then(r => r.json()).then(init).catch(() => host.classList.add('nogl'));

function init(W){
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' }); }
  catch(e){ host.classList.add('nogl'); return; }
  host.classList.add('gl-on');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth < 900;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small()?1.75:2));
  renderer.setClearColor(0x081233, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(0, 0, 12);
  const world = new THREE.Group(); scene.add(world);
  const mark = new THREE.Group(); world.add(mark);

  // ---- the wave path from the logo (normalised to [-1,1]) ----
  const S = 4.4;
  const P = W.path.map(([x,y,t]) => new THREE.Vector3(x*S, y*S*1.15, Math.sin(x*2.4)*.45));
  const T = W.path.map(p => p[2]*S*.5);          // radius at each point
  const N = P.length;
  const at = u => { const f = u*(N-1), i = Math.min(N-2, Math.floor(f)), k = f-i; return [P[i].clone().lerp(P[i+1], k), T[i]+(T[i+1]-T[i])*k]; };

  // ---- particles flowing along the wave ----
  const C = small() ? 6000 : 11000;
  const u0 = new Float32Array(C), ang = new Float32Array(C), rad = new Float32Array(C), spd = new Float32Array(C), sz = new Float32Array(C), seed = new Float32Array(C);
  for (let i=0;i<C;i++){
    u0[i]=Math.random(); ang[i]=Math.random()*Math.PI*2; rad[i]=Math.sqrt(Math.random());
    spd[i]=.035+Math.random()*.03; const pulse=Math.random()<.03;
    sz[i]=pulse?2.6+Math.random()*1.4:.6+Math.random()*1.1; seed[i]=Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(C*3),3));
  [['u0',u0],['ang',ang],['rad',rad],['spd',spd],['sz',sz],['seed',seed]].forEach(([n,a]) => g.setAttribute(n, new THREE.BufferAttribute(a,1)));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  const U = { uTime:{value:0}, uPR:{value:renderer.getPixelRatio()}, uFocus:{value:0}, uAmt:{value:0},
              uP:{value:P}, uT:{value:T} };
  const mat = new THREE.ShaderMaterial({
    uniforms:U, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    vertexShader:`
      #define N ${N}
      attribute float u0, ang, rad, spd, sz, seed;
      uniform float uTime, uPR, uFocus, uAmt; uniform vec3 uP[N]; uniform float uT[N];
      varying vec3 vC; varying float vA;
      void main(){
        float u = fract(u0 + uTime*spd);
        float f = u*float(N-1); int i = int(min(float(N-2), floor(f))); float k = f-float(i);
        vec3 p = mix(uP[i], uP[i+1], k); float r = mix(uT[i], uT[i+1], k);
        vec3 tg = normalize(uP[i+1]-uP[i]);
        vec3 n = normalize(cross(tg, vec3(0.,0.,1.))); vec3 b = cross(tg, n);
        float w = rad * r * (.92 + .1*sin(uTime*1.6 + seed*40.));
        p += n*cos(ang)*w + b*sin(ang)*w*.55;
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        float hot = uAmt * smoothstep(.07, 0., abs(u-uFocus));
        gl_PointSize = sz*(1.+hot*1.3)*uPR*(26./-mv.z);
        vec3 blue = vec3(.12,.36,1.), cyan = vec3(.10,.72,.95), white = vec3(.8,.92,1.);
        vC = mix(blue, cyan, u);
        vC = mix(vC, white, step(2.4, sz)*.5 + hot*.5);
        vA = (.62+.5*seed) * (1.-rad*.45) * smoothstep(0.,.03,u) * smoothstep(1.,.96,u) + hot*.35;
      }`,
    fragmentShader:`
      varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d)*vA; gl_FragColor = vec4(vC*a, a); }`
  });
  mark.add(new THREE.Points(g, mat));

  // ---- core line ----
  mark.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(P).getPoints(400)),
    new THREE.LineBasicMaterial({ color:0x5b9bff, transparent:true, opacity:.3, blending:THREE.AdditiveBlending, depthWrite:false })));

  // ---- the dot ----
  const dp = new THREE.Vector3(W.dot[0]*S, W.dot[1]*S, Math.sin(W.dot[0]*2.4)*.55), dr = W.dot[2]*S;
  const dotCore = new THREE.Mesh(new THREE.SphereGeometry(dr*.5, 48, 32), new THREE.MeshBasicMaterial({ color:0x3bc8ef, transparent:true, opacity:.9 }));
  dotCore.position.copy(dp); mark.add(dotCore);
  const DC = 700, dpos = new Float32Array(DC*3);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos,3));
  const dPts = new THREE.Points(dg, new THREE.PointsMaterial({ color:0x8fe3ff, size:.035, transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false }));
  dPts.position.copy(dp); mark.add(dPts);
  const dSeed = Array.from({length:DC}, () => [Math.random()*Math.PI*2, Math.acos(2*Math.random()-1), dr*(.6+Math.random()*.4), .2+Math.random()*.6]);

  // ---- solution nodes ----
  const nodeU = [.08,.24,.4,.56,.72,.88];
  const nodes = nodeU.map((u,i) => {
    const [p] = at(u), grp = new THREE.Group(); grp.position.copy(p);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.12,2), new THREE.MeshBasicMaterial({ color:0xffffff }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(.2,.23,48), new THREE.MeshBasicMaterial({ color:0x9cc4ff, transparent:true, opacity:.75, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
    const pulse = ring.clone(); pulse.material = ring.material.clone(); pulse.material.opacity = 0;
    grp.add(core, ring, pulse); mark.add(grp); return { core, ring, pulse, k:0 };
  });

  // ---- dust ----
  const dust = new THREE.Points((() => { const a = new Float32Array(600*3); for (let i=0;i<a.length;i+=3){ a[i]=(Math.random()-.5)*32; a[i+1]=(Math.random()-.5)*18; a[i+2]=(Math.random()-.5)*14-3; }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(a,3)); return gg; })(),
    new THREE.PointsMaterial({ color:0x8ab4ff, size:.03, transparent:true, opacity:.4, depthWrite:false }));
  world.add(dust);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1), .5, .45, .2));
  composer.addPass(new OutputPass());

  function resize(){
    const w = host.clientWidth, h = canvas.clientHeight || host.clientHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w/h; camera.updateProjectionMatrix();
    const wide = w >= 900;
    const visW = 2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;
    world.position.set(wide ? visW*.235 : 0, wide ? .2 : 0, 0);
    world.scale.setScalar(wide ? Math.min(1.1, visW*.4/8.6) : Math.min(1, visW*.9/8.6));
    U.uPR.value = renderer.getPixelRatio();
  }
  resize(); addEventListener('resize', resize);

  const mouse = { x:0, y:0, tx:0, ty:0 };
  host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mouse.tx = (e.clientX-r.left)/r.width*2-1; mouse.ty = (e.clientY-r.top)/r.height*2-1; });
  let focus = -1;
  const legend = [].slice.call(host.querySelectorAll('.legend button'));
  function setFocus(i){ focus = i; legend.forEach((b,j) => b.classList.toggle('on', j===i)); if (i>=0) U.uFocus.value = nodeU[i]; }
  legend.forEach((b,i) => {
    b.addEventListener('mouseenter', () => setFocus(i)); b.addEventListener('focus', () => setFocus(i));
    b.addEventListener('mouseleave', () => setFocus(-1)); b.addEventListener('blur', () => setFocus(-1));
    b.addEventListener('click', () => { if (b.dataset.href) location.href = b.dataset.href; });
  });
  window.mfLoop = { focus:setFocus };

  let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  const clock = new THREE.Clock(); let t = 0;
  (function frame(){
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    t += Math.min(clock.getDelta(), .05) * (reduce ? .15 : 1);
    U.uTime.value = t; U.uAmt.value += ((focus>=0?1:0) - U.uAmt.value)*.08;
    mouse.x += (mouse.tx-mouse.x)*.04; mouse.y += (mouse.ty-mouse.y)*.04;
    mark.rotation.y = -.1 + Math.sin(t*.15)*.12 + mouse.x*.22;
    mark.rotation.x = .12 + mouse.y*.14;
    dust.rotation.y = t*.01;
    for (let i=0;i<DC;i++){ const s = dSeed[i], a = s[0] + t*s[3]; dpos[i*3]=Math.cos(a)*Math.sin(s[1])*s[2]; dpos[i*3+1]=Math.cos(s[1])*s[2]; dpos[i*3+2]=Math.sin(a)*Math.sin(s[1])*s[2]; }
    dg.attributes.position.needsUpdate = true;
    dotCore.scale.setScalar(1 + Math.sin(t*2)*.04);
    nodes.forEach((n,i) => {
      n.k += ((focus===i?1:0) - n.k)*.1;
      n.ring.lookAt(camera.position); n.pulse.lookAt(camera.position);
      const ph = (t*.9 + i*.5) % 1; n.pulse.scale.setScalar(1+ph*1.6); n.pulse.material.opacity = (1-ph)*(.25+n.k*.6);
      n.core.scale.setScalar(1 + n.k*.9); n.ring.scale.setScalar(1 + n.k*.7);
    });
    composer.render();
  })();
}
