// Congkak Online — game controller: modes, turns, AI worker, online rooms over the relay, sound.
import { newBoard, play, legal, holesOf, seedsOnSide, STORE, winner, bestMove } from './rules.js';
import { createBoard } from './board3d.js';
import { joinRelay } from './relay.js';

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const store = { get(k, d) { try { const v = localStorage.getItem('congkak.' + k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('congkak.' + k, v); } catch (e) { } } };

/* ------------------------------------------------------------ sound: wood clicks and shell clatter, synthesised */
const sfx = (() => {
  let ac = null, on = store.get('snd', '1') === '1';
  const ensure = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  function click(f = 2400, vol = .25, decay = .05) {
    if (!on || !ensure()) return; const t = ac.currentTime, n = Math.floor(ac.sampleRate * .06), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * decay * .3));
    const s = ac.createBufferSource(); s.buffer = buf; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * (.85 + Math.random() * .3); bp.Q.value = 6; const g = ac.createGain(); g.gain.value = vol;
    const o = ac.createOscillator(); o.frequency.value = f * .38; const og = ac.createGain(); og.gain.setValueAtTime(vol * .25, t); og.gain.exponentialRampToValueAtTime(.0001, t + decay);
    s.connect(bp).connect(g).connect(ac.destination); o.connect(og).connect(ac.destination); s.start(t); o.start(t); o.stop(t + decay + .02);
  }
  const btn = $('#snd'); const sync = () => btn.setAttribute('aria-pressed', on);
  btn.addEventListener('click', () => { on = !on; store.set('snd', on ? '1' : '0'); sync(); ensure(); }); sync();
  return { drop: (k) => click(2000 + Math.min(k, 8) * 120, .22, .045), pick() { for (let i = 0; i < 4; i++) setTimeout(() => click(3200, .12, .03), i * 28); }, store() { for (let i = 0; i < 7; i++) setTimeout(() => click(1500 + Math.random() * 1500, .15, .06), i * 40); }, ensure };
})();

/* ------------------------------------------------------------ board */
let ready = false;
const B = createBoard($('#board'), { onHole: (i) => human(i), onHover: () => {}, onReady: () => { ready = true; } });
const G = { b: newBoard(), p: 0, mode: null, level: store.get('lvl', 'normal'), names: ['Kamu', 'Kak Long'], over: false, busy: false, moveNo: 0, me: 0, net: null };
B.layout(G.b);

/* badges */
const badgeEls = Array.from({ length: 16 }, (_, i) => { const e = document.createElement('div'); e.className = 'bd' + (i === 7 ? ' store p0' : i === 15 ? ' store p1' : ''); $('#badges').appendChild(e); return e; });
let shown = G.b.slice();
function setCount(i, n, bump) { const e = badgeEls[i]; e.textContent = n; e.classList.toggle('zero', n === 0 && i !== 7 && i !== 15); if (bump) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); setTimeout(() => e.classList.remove('bump'), 160); } }
function syncBadges(b) { shown = b.slice(); shown.forEach((n, i) => setCount(i, n)); }
syncBadges(G.b);
(function place() { requestAnimationFrame(place); const pts = B.project(); pts.forEach((p, i) => { badgeEls[i].style.left = p.x + 'px'; badgeEls[i].style.top = p.y + 'px'; }); })();
function markMine() { badgeEls.forEach((e, i) => e.classList.toggle('mine', holesOf(G.me).includes(i) && G.mode !== 'pass')); }

/* ------------------------------------------------------------ HUD */
const toastEl = $('#toast'); let toastT = 0;
function toast(big, small = '') { toastEl.innerHTML = big + (small ? `<small>${small}</small>` : ''); toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 1500); }
const status = (t) => { $('#status-text').textContent = t; };
function hud() {
  [0, 1].forEach((p) => { $('#nm' + p).textContent = G.names[p]; $('#av' + p).textContent = G.names[p][0].toUpperCase(); $('#st' + p).textContent = G.b[STORE[p]]; $('#side' + p).textContent = `${seedsOnSide(G.b, p)} on the board`; $('#pc' + p).classList.toggle('on', !G.over && G.p === p); });
  $('#pc0 .turn').textContent = G.mode === 'pass' ? 'Turn' : (G.me === 0 ? 'Your turn' : 'Their turn'); $('#pc1 .turn').textContent = G.mode === 'pass' ? 'Turn' : (G.me === 1 ? 'Your turn' : 'Their turn');
}
const show = (id) => { $$('.ov').forEach((o) => { o.hidden = o.id !== id; }); };
const inGame = (v) => { $('#scores').hidden = !v; $('#status').hidden = !v; $('#badges').style.display = v ? '' : 'none'; };
inGame(false);

/* ------------------------------------------------------------ turn flow */
const isLocalTurn = () => !G.over && (G.mode === 'pass' || (G.mode === 'ai' && G.p === 0) || (G.mode === 'net' && G.p === G.me));
function turnStart() {
  hud();
  if (G.over) return endGame();
  if (isLocalTurn()) { B.setPlayable(legal(G.b, G.p), G.p === 0 ? 0xffd38a : 0x8ff0dc); status(G.mode === 'pass' ? `${G.names[G.p]}: pick a kampung on your side` : 'Your turn: tap a kampung on your side'); }
  else { B.setPlayable([]); if (G.mode === 'ai') { status(`${G.names[1]} is thinking…`); aiMove(); } else status(`Waiting for ${G.names[G.p]}…`); }
}
function human(i) { if (!isLocalTurn() || G.busy) return; sfx.ensure(); doMove(i, false); }
const NAR = { store: (n) => ['Rumah!', `${n} goes again`], capture: (n, e) => ['Tembak!', `${n} captures ${e.n} buah`], 'empty-own': (n) => ['', `Empty kampung. ${n}'s turn ends.`], 'empty-opp': (n) => ['Mati', `${n}'s turn ends`], limit: () => ['', 'Turn ends'] };
async function doMove(i, fromNet) {
  if (G.busy) return; const r = play(G.b, G.p, i); if (!r) return;
  G.busy = true; document.body.classList.add('busy'); B.setPlayable([]); G.moveNo++;
  if (G.mode === 'net' && !fromNet && G.net) G.net.send('move', { n: G.moveNo, i });
  status(`${G.names[G.p]} sows ${G.b[i]} from kampung ${holesOf(G.p).indexOf(i) + 1}…`);
  const cnt = shown.slice(); let drops = 0;
  await B.animate(r.ev, {
    onStep: (e) => {
      if (e.t === 'pick') { cnt[e.i] = 0; setCount(e.i, 0); sfx.pick(); }
      else if (e.t === 'drop') { cnt[e.i]++; setCount(e.i, cnt[e.i], true); sfx.drop(drops++); }
      else if (e.t === 'capture') { cnt[e.store] += e.n; cnt[e.i] = 0; cnt[e.o] = 0; setCount(e.i, 0); setCount(e.o, 0); setTimeout(() => setCount(e.store, cnt[e.store], true), 400); sfx.store(); }
      else if (e.t === 'sweep') { cnt[e.store] += e.n; cnt[e.i] = 0; setCount(e.i, 0); setTimeout(() => setCount(e.store, cnt[e.store], true), 400); }
      $('#st0').textContent = cnt[7]; $('#st1').textContent = cnt[15];
    }
  });
  const who = G.names[G.p], cap = r.ev.find((e) => e.t === 'capture'); const [big, small] = NAR[r.reason] ? NAR[r.reason](who, cap) : ['', ''];
  if (big || small) toast(big || ' ', small);
  G.b = r.board; G.p = r.next; G.over = r.over; syncBadges(G.b); B.layout(G.b);
  G.busy = false; document.body.classList.remove('busy');
  setTimeout(turnStart, big ? 650 : 250);
}
$('#skip').addEventListener('click', () => B.skip());

/* AI in a worker (falls back to the main thread) */
let worker = null, reqId = 0;
try { worker = new Worker(new URL('./ai.js', import.meta.url), { type: 'module' }); } catch (e) { worker = null; }
function aiMove() {
  const id = ++reqId, t0 = performance.now(), b = G.b.slice(), p = G.p;
  const done = (m) => { if (id !== reqId || G.mode !== 'ai' || G.p !== p || G.over) return; const wait = Math.max(0, 700 - (performance.now() - t0)); setTimeout(() => { if (id === reqId) doMove(m, true); }, wait); };
  if (worker) { const h = (e) => { if (e.data.id !== id) return; worker.removeEventListener('message', h); done(e.data.move); }; worker.addEventListener('message', h); worker.postMessage({ b, p, level: G.level, id }); setTimeout(() => { if (id === reqId && G.p === p && !G.busy && G.mode === 'ai') { worker.removeEventListener('message', h); done(bestMove(b, p, 'normal')); } }, 6000); }
  else setTimeout(() => done(bestMove(b, p, G.level)), 30);
}

/* ------------------------------------------------------------ game start / end */
const LV = { easy: 'Adik', normal: 'Kak Long', hard: 'Tok Wan' };
function start(mode, opts = {}) {
  G.mode = mode; G.b = newBoard(); G.over = false; G.busy = false; G.moveNo = 0; reqId++;
  G.p = opts.first ?? 0; G.me = opts.me ?? 0;
  if (mode === 'ai') { G.names = [store.get('name', '') || 'Kamu', LV[G.level]]; $('#mode-label').textContent = `vs ${LV[G.level]} · ${G.level === 'hard' ? 'hard' : G.level === 'easy' ? 'easy' : 'normal'}`; }
  if (mode === 'pass') { G.names = ['Pemain 1', 'Pemain 2']; $('#mode-label').textContent = 'Pass & play'; }
  if (mode === 'net') { G.names = opts.names; $('#mode-label').textContent = `Online · room ${G.net.code}`; }
  B.setSide(mode === 'net' ? G.me : 0); markMine();
  B.layout(G.b); syncBadges(G.b); show(null); inGame(true);
  toast(mode === 'pass' ? 'Mula!' : G.p === G.me ? 'You start' : `${G.names[G.p]} starts`, mode === 'ai' ? 'Your kampung are the row nearest you' : '');
  setTimeout(turnStart, 400);
}
function endGame() {
  B.setPlayable([]); const w = winner(G.b);
  $('#end-s0').textContent = G.b[7]; $('#end-s1').textContent = G.b[15]; $('#end-n0').textContent = G.names[0]; $('#end-n1').textContent = G.names[1];
  let title = w === -1 ? 'Seri!' : G.mode === 'pass' ? `${G.names[w]} menang!` : w === G.me ? 'Menang!' : 'Kalah…';
  $('#end-title').textContent = title; $('#end-eyebrow').textContent = w === -1 ? 'A draw, 49 each' : `${G.b[STORE[w]]} buah in the rumah`;
  status('Game over'); setTimeout(() => show('ov-end'), 900);
}
$('#again').addEventListener('click', () => { if (G.mode === 'net') { if (G.net) G.net.send('rematch', {}); netRematch(true); } else start(G.mode, { first: G.mode === 'ai' ? (Math.random() < .5 ? 0 : 1) : 0 }); });
$('#to-menu').addEventListener('click', () => { leaveNet(); show('ov-menu'); inGame(false); $('#mode-label').textContent = 'Choose a game'; });

/* ------------------------------------------------------------ menu wiring */
$$('#lvl button').forEach((b) => { b.setAttribute('aria-pressed', b.dataset.l === G.level); b.addEventListener('click', () => { G.level = b.dataset.l; store.set('lvl', G.level); $$('#lvl button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }); });
$('#m-ai').addEventListener('click', () => { sfx.ensure(); start('ai', { first: 0 }); });
$('#m-pass').addEventListener('click', () => { sfx.ensure(); start('pass'); });
$('#m-net').addEventListener('click', () => { show('ov-net'); $('#my-name').value = store.get('name', ''); });
$('#m-rules').addEventListener('click', () => { rulesFrom = 'ov-menu'; show('ov-rules'); });
let rulesFrom = 'ov-menu';
$('#rules-btn').addEventListener('click', () => { rulesFrom = $$('.ov').find((o) => !o.hidden)?.id || null; show('ov-rules'); });
$('#menu-btn').addEventListener('click', () => { if (G.mode === 'net' && !G.over && !confirmLeave()) return; leaveNet(); show('ov-menu'); inGame(false); B.setPlayable([]); reqId++; $('#mode-label').textContent = 'Choose a game'; });
let leaveArmed = 0; function confirmLeave() { if (Date.now() - leaveArmed < 3000) return true; leaveArmed = Date.now(); toast('Tap Menu again', 'to leave the online game'); return false; }
$$('[data-back]').forEach((b) => b.addEventListener('click', () => { const from = b.closest('.ov').id; if (from === 'ov-rules') show(rulesFrom && rulesFrom !== 'ov-rules' ? rulesFrom : (G.mode ? null : 'ov-menu')); else { leaveNet(); show('ov-menu'); } }));

/* ------------------------------------------------------------ online play over the public relay */
const myId = Math.random().toString(36).slice(2, 10);
function netState(n) { const el = $('#net-state'); el.classList.toggle('ok', n > 0); el.querySelector('span').textContent = n > 0 ? `Connected to ${n} relay${n > 1 ? 's' : ''}` : 'Connecting to the relay…'; }
function leaveNet() { if (G.net) { try { G.net.relay.leave(); } catch (e) { } clearInterval(G.net.hello); clearInterval(G.net.beat); } G.net = null; }
function openRoom(code, host) {
  leaveNet(); const name = ($('#my-name').value.trim() || (host ? 'Pemain 1' : 'Pemain 2')).slice(0, 16); store.set('name', $('#my-name').value.trim());
  const net = { code, host, name, peer: null, peerName: '', last: 0, started: false };
  const bk = new URLSearchParams(location.search).get('broker');
  net.relay = joinRelay({ topic: 'zlab/congkak/' + code, id: myId, onStatus: netState, onMsg: (m) => onNet(m), ...(bk ? { brokers: [bk] } : {}) });
  net.send = (t, d) => net.relay.send(t, d);
  net.hello = setInterval(() => { if (!net.started) net.send(host ? 'host' : 'join', { name }); }, 1500);
  net.beat = setInterval(() => { if (net.started) { net.send('ping', {}); if (net.last && Date.now() - net.last > 16000) { toast('Connection lost', `${net.peerName || 'Your friend'} seems to have left`); net.last = Date.now(); status(`${net.peerName || 'Your friend'} disconnected`); } } }, 4000);
  G.net = net; netState(0); return net;
}
function onNet(m) {
  const net = G.net; if (!net) return;
  if (net.peer && m.i !== net.peer) return; // a third device: ignore
  net.last = Date.now();
  if (m.t === 'bye') { toast('Your friend left', ''); status('Your friend left the room'); return; }
  if (net.host && m.t === 'join' && !net.started) { net.peer = m.i; net.peerName = (m.d && m.d.name || 'Kawan').slice(0, 16); const first = Math.random() < .5 ? 0 : 1; net.send('start', { first, hostName: net.name, guestName: net.peerName }); net.started = true; start('net', { me: 0, first, names: [net.name, net.peerName] }); }
  else if (!net.host && m.t === 'host' && !net.started) { net.peer = m.i; net.send('join', { name: net.name }); }
  else if (!net.host && m.t === 'start' && !net.started) { net.peer = m.i; net.started = true; net.peerName = m.d.hostName; start('net', { me: 1, first: m.d.first, names: [m.d.hostName, m.d.guestName] }); }
  else if (m.t === 'move' && G.mode === 'net') { if (m.d.n !== G.moveNo + 1) return; if (G.p === G.me) return; const go = () => { if (G.busy) return setTimeout(go, 120); doMove(m.d.i, true); }; go(); }
  else if (m.t === 'rematch') netRematch(false);
  else if (m.t === 'start2' && !net.host) start('net', { me: 1, first: m.d.first, names: G.names });
}
function netRematch(mine) { const net = G.net; if (!net) return; if (net.host) { const first = Math.random() < .5 ? 0 : 1; net.send('start2', { first }); start('net', { me: 0, first, names: G.names }); } else if (mine) toast('Asked for a rematch', 'Waiting for the host'); }
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
$('#create').addEventListener('click', () => {
  const code = Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join(''); openRoom(code, true);
  $('#net-start').hidden = true; $('#net-wait').hidden = false; $('#room-code').textContent = code;
  const url = location.origin + location.pathname + '#room=' + code; $('#room-link').textContent = url; $('#room-link').dataset.url = url;
});
$('#copy-link').addEventListener('click', () => { const u = $('#room-link').dataset.url; navigator.clipboard && navigator.clipboard.writeText(u).then(() => toast('Link copied'), () => selectText($('#room-link'))); if (!navigator.clipboard) selectText($('#room-link')); });
function selectText(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Link selected', 'Copy it and send it'); }
$('#cancel-room').addEventListener('click', () => { leaveNet(); $('#net-start').hidden = false; $('#net-wait').hidden = true; });
$('#join').addEventListener('click', () => { const code = $('#join-code').value.trim().toUpperCase(); if (!/^[A-Z]{4}$/.test(code)) return toast('Enter the 4-letter code', ''); openRoom(code, false); $('#net-state span').textContent = 'Looking for the room…'; });
$('#join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#join').click(); });
// invite links: #room=ABCD
{ const m = location.hash.match(/room=([A-Z]{4})/i); if (m) { show('ov-net'); $('#my-name').value = store.get('name', ''); $('#join-code').value = m[1].toUpperCase(); } }
addEventListener('beforeunload', () => leaveNet());
window.__congkak = { G, B };
