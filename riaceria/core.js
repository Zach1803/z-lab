/* Taman Ria Ceria building + animatronic meshes (shared by the Blender bake and the page) */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2, clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; }, mix = function (a, b, t) { return a + (b - a) * t; };
  /* ============================== ATLAS ============================== */
  var AT = document.createElement('canvas'); AT.width = AT.height = 2048; var ax = AT.getContext('2d', { willReadFrequently: true }), occ = [];
  for (var _o = 0; _o < 64; _o++) { occ.push(0); }
  function alloc(w, h) { for (var r = 0; r <= 8 - h; r++) { for (var c = 0; c <= 8 - w; c++) { var ok = true; for (var y = r; y < r + h && ok; y++) { for (var x = c; x < c + w; x++) { if (occ[y * 8 + x]) { ok = false; break; } } } if (ok) { for (y = r; y < r + h; y++) { for (x = c; x < c + w; x++) { occ[y * 8 + x] = 1; } } var px = c * 256, py = r * 256; return { x: px, y: py, w: w * 256, h: h * 256, uv: [(px + 2) / 2048, (py + 2) / 2048, (px + w * 256 - 2) / 2048, (py + h * 256 - 2) / 2048] }; } } } return null; }
  function fitT(t, maxW, size, font) { var s = size; do { ax.font = font.replace('%', s + 'px'); s -= 2; } while (ax.measureText(t).width > maxW && s > 8); }
  function txt(r, t, size, y, font, col, align) { ax.fillStyle = col; ax.textAlign = align || 'center'; ax.textBaseline = 'middle'; fitT(t, r.w - 30, size, font); ax.fillText(t, align === 'left' ? r.x + 16 : r.x + r.w / 2, r.y + y); }
  function grime(r, amt) { var id = ax.getImageData(r.x, r.y, r.w, r.h), d = id.data; for (var i = 0; i < d.length; i += 4) { var n = (Math.random() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; } ax.putImageData(id, r.x, r.y); ax.fillStyle = 'rgba(80,50,20,.18)'; for (var k = 0; k < 10; k++) { ax.beginPath(); ax.arc(r.x + Math.random() * r.w, r.y + Math.random() * r.h, 5 + Math.random() * 40, 0, TAU); ax.fill(); } }
  function crayonFig(cx, cy, s, col, kind) {
    ax.strokeStyle = col; ax.lineWidth = 4; ax.lineCap = 'round';
    function j() { return (Math.random() - .5) * 3; }
    function circ(x, y, r) { ax.beginPath(); for (var i = 0; i <= 14; i++) { var a = i / 14 * TAU; ax.lineTo(x + Math.cos(a) * r + j(), y + Math.sin(a) * r + j()); } ax.stroke(); }
    function line(a, b, c, d) { ax.beginPath(); ax.moveTo(a + j(), b + j()); ax.lineTo(c + j(), d + j()); ax.stroke(); }
    circ(cx, cy - s * .55, s * .22); circ(cx, cy, s * .32);
    line(cx - s * .15, cy + s * .3, cx - s * .2, cy + s * .7); line(cx + s * .15, cy + s * .3, cx + s * .2, cy + s * .7);
    line(cx - s * .3, cy - s * .05, cx - s * .55, cy + s * .2); line(cx + s * .3, cy - s * .05, cx + s * .55, cy + s * .2);
    if (kind === 'tapir') { line(cx, cy - s * .5, cx + s * .05, cy - s * .2); }
    if (kind === 'bird') { line(cx, cy - s * .55, cx + s * .35, cy - s * .5); line(cx, cy - s * .7, cx + s * .25, cy - s * .78); }
    if (kind === 'ape') { line(cx - s * .3, cy - s * .55, cx + s * .3, cy - s * .55); }
    ax.fillStyle = '#000'; ax.beginPath(); ax.arc(cx - s * .07, cy - s * .58, 3, 0, TAU); ax.arc(cx + s * .07, cy - s * .58, 3, 0, TAU); ax.fill();
  }
  var UV = {};
  function buildAtlas() {
    ax.fillStyle = '#777'; ax.fillRect(0, 0, 2048, 2048);
    var r;
    r = alloc(4, 1); var g = ax.createLinearGradient(r.x, r.y, r.x, r.y + r.h); g.addColorStop(0, '#ffcf3a'); g.addColorStop(1, '#f2a91a'); ax.fillStyle = g; ax.fillRect(r.x, r.y, r.w, r.h);
    ax.fillStyle = '#e2372b'; for (var i = 0; i < 24; i++) { ax.beginPath(); ax.arc(r.x + 22 + i * 43, r.y + 18, 8, 0, TAU); ax.fill(); ax.beginPath(); ax.arc(r.x + 22 + i * 43, r.y + r.h - 18, 8, 0, TAU); ax.fill(); }
    txt(r, 'RIA CERIA BAND', 150, 120, '800 % "Baloo 2", "Arial Black", sans-serif', '#e2372b'); txt(r, 'MAKAN · MAIN · MENYANYI', 34, 205, '800 % "Baloo 2", Arial, sans-serif', '#7a2a10'); grime(r, 26); UV.banner = r.uv;
    r = alloc(1, 2); ax.fillStyle = '#14a3a0'; ax.fillRect(r.x, r.y, r.w, r.h); ax.fillStyle = '#ffc928'; ax.beginPath(); ax.arc(r.x + 128, r.y + 170, 90, 0, TAU); ax.fill();
    crayonFig(r.x + 128, r.y + 190, 120, '#222', 'tapir'); txt(r, 'JOM MAKAN!', 48, 360, '800 % "Baloo 2", Arial, sans-serif', '#fff'); txt(r, 'Nasi Lemak Ceria RM8.90', 22, 410, '800 % "Nunito", Arial, sans-serif', '#fff8e7'); grime(r, 30); UV.jom = r.uv;
    r = alloc(1, 2); ax.fillStyle = '#e2372b'; ax.fillRect(r.x, r.y, r.w, r.h); for (i = 0; i < 9; i++) { ax.fillStyle = ['#ffc928', '#14a3a0', '#fff'][i % 3]; ax.beginPath(); ax.ellipse(r.x + 30 + (i * 53) % 220, r.y + 40 + Math.floor(i / 4) * 70, 22, 28, 0, 0, TAU); ax.fill(); }
    txt(r, 'SELAMAT', 52, 300, '800 % "Baloo 2", Arial, sans-serif', '#fff'); txt(r, 'HARI JADI!', 52, 350, '800 % "Baloo 2", Arial, sans-serif', '#ffc928'); txt(r, 'Book your party today', 22, 420, '800 % "Nunito", Arial', '#fff'); grime(r, 30); UV.bday = r.uv;
    // kids drawings
    var kinds = ['tapir', 'bird', 'ape', 'tapir'];
    UV.kids = [];
    for (var k = 0; k < 4; k++) {
      r = alloc(1, 1); ax.fillStyle = '#f6f2e6'; ax.fillRect(r.x, r.y, r.w, r.h);
      crayonFig(r.x + 80, r.y + 140, 90, ['#333', '#d22', '#e80', '#2a2'][k], kinds[k]);
      crayonFig(r.x + 180, r.y + 160, 50, '#36c', 'kid');
      ax.fillStyle = '#d22'; ax.font = '700 22px "Comic Sans MS", cursive'; ax.textAlign = 'left'; ax.fillText(['saya & pak tenuk', 'kak kenyalang', 'mak orang ;)', 'dia ikut saya balik'][k], r.x + 14, r.y + 34);
      grime(r, 16); UV.kids.push(r.uv);
    }
    r = alloc(2, 1); ax.fillStyle = '#2a5a2a'; ax.fillRect(r.x, r.y, r.w, r.h); txt(r, 'KEBUN KANCIL', 60, 90, '800 % "Baloo 2", Arial', '#ffe17a'); ax.fillStyle = '#c62014'; ax.fillRect(r.x + 40, r.y + 140, r.w - 80, 70); txt(r, 'TUTUP · CLOSED', 46, 176, '800 % "Baloo 2", Arial', '#fff'); grime(r, 24); UV.cove = r.uv;
    r = alloc(2, 1); ax.fillStyle = '#ddd'; ax.fillRect(r.x, r.y, r.w, r.h); ax.fillStyle = '#c62014'; ax.fillRect(r.x, r.y, r.w, 70); txt(r, 'STAFF ONLY', 52, 36, '800 % "Arial Black", Arial', '#fff'); txt(r, 'Spare parts · Do not power on', 30, 150, '700 % Arial', '#222'); grime(r, 30); UV.staff = r.uv;
    r = alloc(1, 1); ax.fillStyle = '#efe8d2'; ax.fillRect(r.x, r.y, r.w, r.h); ax.fillStyle = '#333'; ax.font = '20px "Special Elite", "Courier New"'; ax.textAlign = 'left';
    ['NIGHT CHECKLIST', '[ ] check cameras', '[ ] save power', '[ ] doors only if', '    you must', '[ ] watch the cove', '[ ] do NOT sleep', '', 'they come back'].forEach(function (l, i) { ax.fillText(l, r.x + 16, r.y + 30 + i * 26); });
    grime(r, 18); UV.clip = r.uv;
    r = alloc(1, 1); ax.fillStyle = '#111'; ax.fillRect(r.x, r.y, r.w, r.h); ax.fillStyle = '#d22'; ax.font = '700 60px "Special Elite", "Courier New"'; ax.textAlign = 'center'; ax.fillText('STAY', r.x + 128, r.y + 110); ax.fillText('6 AM', r.x + 128, r.y + 180); grime(r, 30); UV.stay = r.uv;
    r = alloc(1, 1); ax.fillStyle = '#ffc928'; ax.fillRect(r.x, r.y, r.w, r.h); txt(r, 'TANDAS', 54, 100, '800 % "Baloo 2", Arial', '#222'); txt(r, '→', 80, 180, '800 % Arial', '#222'); UV.wc = r.uv;
  }

  /* ============================== GEOMETRY ============================== */
  var ST = 13;
  function V(a, p, n, uv, m, c, ao) { a.push(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1], m, c[0], c[1], c[2], ao == null ? 1 : ao); }
  function nrm(a, b, c) { var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; var x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; }
  var TESS = 0.4, NOTESS = { 5: 1, 12: 1, 14: 1 };
  function quad1(a, p0, p1, p2, p3, m, c, uv, n) { V(a, p0, n, [uv[0], uv[1]], m, c); V(a, p1, n, [uv[2], uv[3]], m, c); V(a, p2, n, [uv[4], uv[5]], m, c); V(a, p0, n, [uv[0], uv[1]], m, c); V(a, p2, n, [uv[4], uv[5]], m, c); V(a, p3, n, [uv[6], uv[7]], m, c); }
  function quad(a, p0, p1, p2, p3, m, c, uv, n) {
    n = n || nrm(p0, p1, p2); uv = uv || [0, 0, 1, 0, 1, 1, 0, 1]; c = c || [1, 1, 1];
    var D = function (p, q) { return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); };
    var nu = NOTESS[m] || a !== WORLD ? 1 : Math.min(80, Math.max(1, Math.ceil(Math.max(D(p0, p1), D(p3, p2)) / TESS))), nv = NOTESS[m] || a !== WORLD ? 1 : Math.min(80, Math.max(1, Math.ceil(Math.max(D(p0, p3), D(p1, p2)) / TESS)));
    if (nu === 1 && nv === 1) { quad1(a, p0, p1, p2, p3, m, c, uv, n); return; }
    var P = function (s, t) { var r = []; for (var k = 0; k < 3; k++) { r.push((p0[k] * (1 - s) + p1[k] * s) * (1 - t) + (p3[k] * (1 - s) + p2[k] * s) * t); } return r; };
    var T = function (s, t) { return [(uv[0] * (1 - s) + uv[2] * s) * (1 - t) + (uv[6] * (1 - s) + uv[4] * s) * t, (uv[1] * (1 - s) + uv[3] * s) * (1 - t) + (uv[7] * (1 - s) + uv[5] * s) * t]; };
    for (var i = 0; i < nu; i++) { for (var j = 0; j < nv; j++) {
      var s0 = i / nu, s1 = (i + 1) / nu, t0 = j / nv, t1 = (j + 1) / nv, ta = T(s0, t0), tb = T(s1, t0), tc = T(s1, t1), td = T(s0, t1);
      quad1(a, P(s0, t0), P(s1, t0), P(s1, t1), P(s0, t1), m, c, [ta[0], ta[1], tb[0], tb[1], tc[0], tc[1], td[0], td[1]], n);
    } }
  }
  // both faces of a thin panel, 2 mm apart so each side gets its own bake
  function quad2(a, p0, p1, p2, p3, m, c, uv) {
    var n = nrm(p0, p1, p2), e = .002, o = function (p, k) { return [p[0] + n[0] * e * k, p[1] + n[1] * e * k, p[2] + n[2] * e * k]; };
    uv = uv || [0, 0, 1, 0, 1, 1, 0, 1];
    quad(a, o(p0, 1), o(p1, 1), o(p2, 1), o(p3, 1), m, c, uv, n);
    quad(a, o(p3, -1), o(p2, -1), o(p1, -1), o(p0, -1), m, c, [uv[6], uv[7], uv[4], uv[5], uv[2], uv[3], uv[0], uv[1]], [-n[0], -n[1], -n[2]]);
  }
  function box(a, x0, y0, z0, x1, y1, z1, m, c) {
    quad(a, [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], m, c, null, [0, 1, 0]); quad(a, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], m, c, null, [0, 0, 1]);
    quad(a, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], m, c, null, [0, 0, -1]); quad(a, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], m, c, null, [1, 0, 0]);
    quad(a, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], m, c, null, [-1, 0, 0]); quad(a, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], m, c, null, [0, -1, 0]);
  }
  function signQ(a, cx, cy, cz, fx, fz, w, h, uv) { var rx = fz, rz = -fx, hw = w / 2, hh = h / 2; quad(a, [cx - rx * hw, cy - hh, cz - rz * hw], [cx + rx * hw, cy - hh, cz + rz * hw], [cx + rx * hw, cy + hh, cz + rz * hw], [cx - rx * hw, cy + hh, cz - rz * hw], 5, [1, 1, 1], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], [fx, 0, fz]); }
  var ICO = (function () { var v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], f = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]]; for (var it = 0; it < 3; it++) { var nf = [], cache = {}; f.forEach(function (t) { var m = function (a, b) { var key = a < b ? a + '_' + b : b + '_' + a; if (cache[key] != null) { return cache[key]; } var p = [(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2], l = Math.hypot(p[0], p[1], p[2]); v.push([p[0] / l, p[1] / l, p[2] / l]); cache[key] = v.length - 1; return cache[key]; }; var ab = m(t[0], t[1]), bc = m(t[1], t[2]), ca = m(t[2], t[0]); nf.push([t[0], ab, ca], [ab, t[1], bc], [ca, bc, t[2]], [ab, bc, ca]); }); f = nf; } return { v: v, f: f }; })();
  function blob(a, cx, cy, cz, rx, ry, rz, m, c) { ICO.f.forEach(function (t) { for (var k = 0; k < 3; k++) { var p = ICO.v[t[k]]; var n = [p[0] / rx, p[1] / ry, p[2] / rz], l = Math.hypot(n[0], n[1], n[2]); V(a, [cx + p[0] * rx, cy + p[1] * ry, cz + p[2] * rz], [n[0] / l, n[1] / l, n[2] / l], [p[0], p[1]], m, c); } }); }
  function limb(a, p0, p1, r0, r1, m, c, seg) {
    seg = seg || 12; var d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(d[0], d[1], d[2]); d = [d[0] / L, d[1] / L, d[2] / L];
    var up = Math.abs(d[1]) > .9 ? [1, 0, 0] : [0, 1, 0], u = nrm([0, 0, 0], d, up); u = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]; var ul = Math.hypot(u[0], u[1], u[2]); u = [u[0] / ul, u[1] / ul, u[2] / ul];
    var w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    for (var i = 0; i < seg; i++) {
      var a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
      var n0 = [u[0] * Math.cos(a0) + w[0] * Math.sin(a0), u[1] * Math.cos(a0) + w[1] * Math.sin(a0), u[2] * Math.cos(a0) + w[2] * Math.sin(a0)], n1 = [u[0] * Math.cos(a1) + w[0] * Math.sin(a1), u[1] * Math.cos(a1) + w[1] * Math.sin(a1), u[2] * Math.cos(a1) + w[2] * Math.sin(a1)];
      var A = [p0[0] + n0[0] * r0, p0[1] + n0[1] * r0, p0[2] + n0[2] * r0], B = [p0[0] + n1[0] * r0, p0[1] + n1[1] * r0, p0[2] + n1[2] * r0], C = [p1[0] + n1[0] * r1, p1[1] + n1[1] * r1, p1[2] + n1[2] * r1], D = [p1[0] + n0[0] * r1, p1[1] + n0[1] * r1, p1[2] + n0[2] * r1];
      V(a, A, n0, [0, 0], m, c); V(a, B, n1, [0, 0], m, c); V(a, C, n1, [0, 1], m, c); V(a, A, n0, [0, 0], m, c); V(a, C, n1, [0, 1], m, c); V(a, D, n0, [0, 1], m, c);
    }
    blob(a, p0[0], p0[1], p0[2], r0, r0, r0, m, c); blob(a, p1[0], p1[1], p1[2], r1, r1, r1, m, c);
  }
  function cylY(a, cx, y0, cz, r, h, m, c, seg) { seg = seg || 16; for (var i = 0; i < seg; i++) { var a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU; var n0 = [Math.cos(a0), 0, Math.sin(a0)], n1 = [Math.cos(a1), 0, Math.sin(a1)]; var A = [cx + n0[0] * r, y0, cz + n0[2] * r], B = [cx + n1[0] * r, y0, cz + n1[2] * r]; V(a, A, n0, [0, 0], m, c); V(a, B, n1, [0, 0], m, c); V(a, [B[0], y0 + h, B[2]], n1, [0, 0], m, c); V(a, A, n0, [0, 0], m, c); V(a, [B[0], y0 + h, B[2]], n1, [0, 0], m, c); V(a, [A[0], y0 + h, A[2]], n0, [0, 0], m, c); V(a, [cx, y0 + h, cz], [0, 1, 0], [0, 0], m, c); V(a, [A[0], y0 + h, A[2]], [0, 1, 0], [0, 0], m, c); V(a, [B[0], y0 + h, B[2]], [0, 1, 0], [0, 0], m, c); } }

  var HT = 3.0;
  var WALLS = [ // x0,z0,x1,z1, color
    [-10, 22, 10, 22, 0], [-10, 2, -10, 8, 0], [-10, 8, -10, 10, 0], [-10, 16, -10, 22, 0], [10, 2, 10, 14, 0], [10, 14, 10, 17, 0], [10, 19, 10, 22, 0],
    [-10, 2, -6, 2, 0], [-2, 2, 2, 2, 0], [6, 2, 10, 2, 0],
    [-16, 8, -10, 8, 1], [-16, 18, -10, 18, 1], [-16, 8, -16, 18, 1],
    [10, 14, 16, 14, 2], [10, 22, 16, 22, 2], [16, 14, 16, 22, 2],
    [-6, -14, -6, -7.8, 3], [-6, -6.2, -6, 2, 3], [-2, -10, -2, 2, 3], [-2, -14, -2, -13.4, 4], [-2, -11.6, -2, -10, 4], [-6, -14, -2, -14, 3],
    [6, -14, 6, -4, 3], [6, -2, 6, 2, 3], [2, -10, 2, 2, 3], [2, -14, 2, -13.4, 4], [2, -11.6, 2, -10, 4], [2, -14, 6, -14, 3],
    [-2, -14, 2, -14, 4], [-2, -10, 2, -10, 4],
    [-10, -9, -6, -9, 3], [-10, -5, -6, -5, 3], [-10, -9, -10, -5, 3],
    [6, -6, 12, -6, 3], [12, -6, 12, 2, 3], [10, 2, 12, 2, 3]
  ];
  var WCOL = [[.86, .78, .6], [.5, .62, .42], [.5, .5, .52], [.72, .7, .64], [.66, .64, .6]];
  var FLOORS = [[-10, 2, 10, 22], [-16, 8, -10, 18], [10, 14, 16, 22], [-6, -14, -2, 2], [2, -14, 6, 2], [-2, -14, 2, -10], [-10, -9, -6, -5], [6, -6, 12, 2]];
  var WORLD = [], DOOR = [], FAN = [], CHARS = {};
  function wall(a, x0, z0, x1, z1, col) {
    var lowH = 1.15, n = nrm([x0, 0, z0], [x1, 0, z1], [x1, 1, z1]);
    quad2(a, [x0, 0, z0], [x1, 0, z1], [x1, lowH, z1], [x0, lowH, z0], 1, [col[0] * .45, col[1] * .7 + .1, col[2] * .75 + .1], [x0 + z0, 0, x1 + z1, 0, x1 + z1, lowH, x0 + z0, lowH]);
    quad2(a, [x0, lowH, z0], [x1, lowH, z1], [x1, HT, z1], [x0, HT, z0], 1, col, [x0 + z0, lowH, x1 + z1, lowH, x1 + z1, HT, x0 + z0, HT]);
  }
  function buildWorld() {
    var a = WORLD;
    WALLS.forEach(function (w) { wall(a, w[0], w[1], w[2], w[3], WCOL[w[4]]); });
    FLOORS.forEach(function (f) { quad(a, [f[0], 0, f[1]], [f[0], 0, f[3]], [f[2], 0, f[3]], [f[2], 0, f[1]], 0, [1, 1, 1], [f[0], f[1], f[0], f[3], f[2], f[3], f[2], f[1]], [0, 1, 0]); quad(a, [f[0], HT, f[1]], [f[2], HT, f[1]], [f[2], HT, f[3]], [f[0], HT, f[3]], 2, [1, 1, 1], [f[0], f[1], f[2], f[1], f[2], f[3], f[0], f[3]], [0, -1, 0]); });
    // stage
    box(a, -8, 0, 16, 8, .8, 21.6, 3, [.5, .3, .18]);
    box(a, -8.05, .78, 15.95, 8.05, .84, 21.65, 3, [.35, .2, .12]);
    signQ(a, 0, 2.6, 21.95, 0, -1, 9, 2.25, UV.banner);
    for (var i = 0; i < 14; i++) { var x = -7.5 + i * 1.15; box(a, x, 2.92, 15.6, x + .5, 3.0, 15.9, 6, [i % 2 ? 2.5 : .3, i % 2 ? .4 : 1.6, .3]); }
    // speakers
    box(a, -9.6, 0, 17, -8.4, 2.2, 18.4, 4, [.08, .08, .09]); box(a, 8.4, 0, 17, 9.6, 2.2, 18.4, 4, [.08, .08, .09]);
    // dining tables with cloths, hats, plates
    [[-6, 4.5, 11], [0, 4.5, 11], [6, 4.5, 11]].forEach(function (t) {
      var x = t[0];
      box(a, x - .9, .72, t[1], x + .9, .78, t[2], 7, [.9, .2, .2]);
      quad(a, [x - .9, .78, t[1]], [x - .9, .5, t[1]], [x - .9, .5, t[2]], [x - .9, .78, t[2]], 7, [.9, .2, .2]);
      quad(a, [x + .9, .78, t[2]], [x + .9, .5, t[2]], [x + .9, .5, t[1]], [x + .9, .78, t[1]], 7, [.9, .2, .2]);
      for (var z = t[1] + .5; z < t[2] - .3; z += 1.1) {
        [-1, 1].forEach(function (sd) {
          box(a, x + sd * 1.25 - .22, 0, z - .22, x + sd * 1.25 + .22, .45, z + .22, 3, [.4, .26, .16]);
          box(a, x + sd * (1.25 + .2) - .03, .45, z - .22, x + sd * (1.25 + .2) + .03, 1.0, z + .22, 3, [.4, .26, .16]);
          cylY(a, x + sd * .55, .78, z, .16, .015, 13, [.95, .95, .92], 12);
          limb(a, [x + sd * .55, .8, z + .15], [x + sd * .55, 1.08, z + .15], .08, .005, 13, [[.95, .8, .1], [.1, .6, .9], [.9, .2, .5]][Math.floor(z * 3) % 3], 8);
        });
      }
    });
    // balloons
    for (i = 0; i < 9; i++) { var bx = -9 + i * 2.2, bz = 14.5 + (i % 3) * .3, by = 2.2 + (i % 2) * .3; blob(a, bx, by, bz, .2, .25, .2, 13, [[.9, .1, .1], [1, .8, .1], [.1, .6, .8]][i % 3]); limb(a, [bx, by - .25, bz], [bx, .85, bz], .005, .005, 4, [.9, .9, .9], 3); }
    // posters
    signQ(a, -9.95, 1.9, 5, 1, 0, 1.1, 2.2, UV.jom); signQ(a, 9.95, 1.9, 6, -1, 0, 1.1, 2.2, UV.bday);
    signQ(a, -9.95, 2.2, 13, 1, 0, 2.2, 1.1, UV.cove);
    signQ(a, -5.95, 1.8, -2, 1, 0, 1.0, 2.0, UV.jom); signQ(a, 5.95, 1.8, -8, -1, 0, 1.0, 2.0, UV.bday);
    signQ(a, -2.05, 1.7, -3, -1, 0, .9, .9, UV.kids[0]); signQ(a, 2.05, 1.7, -5, 1, 0, .9, .9, UV.kids[1]);
    signQ(a, 10.05, 2.3, 18, 1, 0, 2, 1, UV.staff); signQ(a, -6.05, 2.4, -7, -1, 0, 1.6, .8, UV.staff);
    signQ(a, 5.95, 2.5, -3, -1, 0, .8, .8, UV.wc);
    // office: desk, monitor, fan, papers, drawings
    box(a, -1.6, .74, -13.9, 1.6, .8, -12.9, 3, [.38, .3, .22]);
    box(a, -1.55, 0, -13.85, -1.45, .74, -12.95, 4, [.3, .3, .3]); box(a, 1.45, 0, -13.85, 1.55, .74, -12.95, 4, [.3, .3, .3]);
    box(a, -.45, .8, -13.75, .45, 1.45, -13.15, 4, [.75, .72, .62]);
    quad(a, [-.36, .9, -13.149], [.36, .9, -13.149], [.36, 1.38, -13.149], [-.36, 1.38, -13.149], 12, [1, 1, 1], [0, 0, 1, 0, 1, 1, 0, 1], [0, 0, 1]);
    box(a, -1.4, .8, -13.6, -.9, .82, -13.2, 7, [.95, .95, .9]); box(a, .9, .8, -13.5, 1.3, .86, -13.2, 7, [.9, .2, .2]);
    box(a, .95, .8, -13.85, 1.15, 1.25, -13.65, 4, [.2, .2, .22]); // fan stand
    signQ(a, -1.0, 1.75, -13.97, 0, 1, .7, .7, UV.kids[2]); signQ(a, -.15, 1.85, -13.97, 0, 1, .7, .7, UV.kids[3]); signQ(a, .75, 1.75, -13.97, 0, 1, .7, .7, UV.clip);
    signQ(a, 1.4, 2.2, -13.97, 0, 1, .5, .5, UV.stay);
    // cups/papers on desk
    cylY(a, -.8, .8, -13.2, .05, .1, 7, [.9, .9, .9], 10);
    // backstage: shelves with spare heads
    box(a, 14.6, 0, 15, 15.9, 1.8, 21.5, 3, [.35, .26, .18]);
    [[15.2, 1.95, 16.2, [.12, .12, .13]], [15.2, 1.95, 18, [.95, .55, .15]], [15.2, 1.95, 19.8, [.1, .1, .1]]].forEach(function (h) { blob(a, h[0], h[1], h[2], .25, .25, .25, 8, h[3]); blob(a, h[0] - .2, h[1] + .05, h[2] - .08, .04, .04, .04, 9, [1, 1, 1]); blob(a, h[0] - .2, h[1] + .05, h[2] + .08, .04, .04, .04, 9, [1, 1, 1]); });
    box(a, 11, .0, 20, 13, .8, 21.6, 4, [.25, .25, .27]);
    limb(a, [11.5, .8, 20.6], [12.6, .82, 20.9], .06, .05, 10, [.7, .7, .72]); limb(a, [12.2, .82, 20.5], [12.3, 1.3, 20.6], .05, .05, 10, [.7, .7, .72]);
    // closet: mops, boxes
    box(a, -9.8, 0, -8.8, -8.8, 1.2, -7.8, 3, [.55, .42, .25]); box(a, -9.7, 1.2, -8.7, -9, 1.7, -8.0, 3, [.6, .46, .3]);
    limb(a, [-7.2, 0, -8.6], [-7.5, 1.4, -8.8], .02, .02, 3, [.6, .5, .3], 6); blob(a, -7.2, .1, -8.6, .15, .1, .15, 7, [.8, .8, .7]);
    // kitchen counters
    box(a, 6.2, 0, -5.8, 11.8, .9, -4.8, 4, [.7, .71, .73]); box(a, 11, 0, -4.8, 11.8, .9, 1.8, 4, [.7, .71, .73]);
    // cove curtains
    for (var c2 = 0; c2 < 2; c2++) {
      var z0 = c2 ? 13.2 : 10, z1 = c2 ? 16 : 12.8, nq = 10;
      for (var q = 0; q < nq; q++) { var za = z0 + (z1 - z0) * q / nq, zb = z0 + (z1 - z0) * (q + 1) / nq, xa = -10 + Math.sin(q * 1.6) * .08, xb = -10 + Math.sin((q + 1) * 1.6) * .08; quad2(a, [xa, 0, za], [xb, 0, zb], [xb, HT, zb], [xa, HT, za], 11, [1, 1, 1], [za, 0, zb, 0, zb, 1, za, 1]); }
    }
    box(a, -10.2, 0, 10, -10, .4, 16, 3, [.3, .2, .12]);
    // light fixtures (bulbs)
    [[-3, 2.95, 16], [3, 2.95, 16], [0, 2.95, 8], [-13, 2.95, 13], [-4, 2.95, -4], [4, 2.95, -4], [13, 2.95, 18], [-8, 2.95, -7], [9, 2.95, -2]].forEach(function (p, i) { limb(a, [p[0], 3, p[2]], [p[0], 2.75, p[2]], .015, .015, 4, [.2, .2, .2], 4); blob(a, p[0], 2.7, p[2], .07, .09, .07, 14, [i, 0, 0]); });
    // door frames
    [-2, 2].forEach(function (x) { box(a, x - .12, 0, -13.5, x + .12, 2.3, -13.4, 4, [.25, .25, .27]); box(a, x - .12, 0, -11.6, x + .12, 2.3, -11.5, 4, [.25, .25, .27]); box(a, x - .12, 2.2, -13.5, x + .12, HT, -11.5, 1, WCOL[4]); });
    // door panel mesh (local: centred at 0, spans z -.9..+.9, y 0..2.2)
    box(DOOR, -.06, 0, -.92, .06, 2.22, .92, 15, [1, 1, 1]);
    // fan blades (local, axis z)
    for (i = 0; i < 3; i++) { var an = i / 3 * TAU; quad(FAN, [0, 0, 0], [Math.cos(an) * .2, Math.sin(an) * .2, 0], [Math.cos(an + .5) * .2, Math.sin(an + .5) * .2, 0], [Math.cos(an + .25) * .05, Math.sin(an + .25) * .05, 0], 4, [.25, .25, .27], null, [0, 0, 1]); }
    limb(FAN, [0, 0, -.05], [0, 0, .02], .05, .05, 4, [.2, .2, .22], 8);
  }

  /* ---------- animatronics (local, facing +z) ---------- */
  var BLK = [.07, .07, .08], WHT = [.82, .8, .74], MET = [.62, .62, .65];
  function buildChars() {
    var a;
    // Pak Tenuk (tapir)
    a = []; CHARS.tenuk = { mesh: a, head: 1.95 };
    [-1, 1].forEach(function (s) { limb(a, [s * .26, .08, 0], [s * .26, .85, 0], .17, .15, 8, BLK); blob(a, s * .26, .07, .06, .19, .09, .24, 8, BLK); });
    blob(a, 0, 1.25, 0, .5, .5, .4, 8, BLK); blob(a, 0, 1.17, 0, .53, .27, .42, 8, WHT);
    [-1, 1].forEach(function (s) { limb(a, [s * .5, 1.55, 0], [s * .52, 1.08, .3], .13, .11, 8, BLK); blob(a, s * .5, 1.04, .34, .1, .09, .1, 8, BLK); });
    cylY(a, 0, 1.0, .46, .32, .08, 3, [.55, .35, .2], 18); quad(a, [-.3, 1.085, .2], [.3, 1.085, .2], [.3, 1.085, .72], [-.3, 1.085, .72], 8, [.86, .8, .66], null, [0, 1, 0]);
    limb(a, [0, 1.65, 0], [0, 1.82, 0], .08, .08, 10, MET);
    blob(a, 0, 1.97, .05, .31, .28, .33, 8, BLK);
    limb(a, [0, 1.96, .3], [0, 1.82, .5], .15, .11, 8, [.1, .1, .1]); limb(a, [0, 1.82, .5], [0, 1.66, .58], .11, .07, 8, [.12, .11, .11]);
    [-1, 1].forEach(function (s) { blob(a, s * .23, 2.2, -.03, .09, .11, .05, 8, BLK); blob(a, s * .235, 2.2, -.0, .055, .075, .03, 8, WHT); blob(a, s * .14, 2.03, .3, .045, .045, .03, 9, [1, 1, 1]); });
    for (var t = 0; t < 6; t++) { blob(a, -.1 + t * .04, 1.79, .5, .015, .03, .01, 10, MET); }
    // Kak Kenyalang (hornbill)
    a = []; CHARS.keny = { mesh: a, head: 2.08 };
    [-1, 1].forEach(function (s) { limb(a, [s * .16, .05, 0], [s * .16, 1.0, 0], .055, .06, 10, [.3, .3, .32]); blob(a, s * .16, .04, .1, .1, .04, .18, 8, [.85, .65, .2]); });
    blob(a, 0, 1.38, 0, .42, .56, .4, 8, BLK); blob(a, 0, 1.18, .14, .3, .33, .28, 8, WHT);
    blob(a, 0, .86, -.36, .3, .42, .08, 8, WHT); blob(a, 0, .78, -.37, .31, .08, .09, 8, BLK);
    [-1, 1].forEach(function (s) { blob(a, s * .46, 1.38, -.05, .12, .46, .3, 8, BLK); limb(a, [s * .48, 1.05, .1], [s * .4, .85, .32], .06, .05, 8, MET); });
    limb(a, [0, 1.85, 0], [0, 2.0, 0], .11, .1, 10, WHT);
    blob(a, 0, 2.08, 0, .23, .23, .25, 8, BLK);
    limb(a, [0, 2.03, .2], [0, 1.96, .55], .12, .07, 10, [.95, .78, .2]); limb(a, [0, 1.96, .55], [0, 1.9, .8], .07, .015, 10, [.95, .45, .15]);
    limb(a, [0, 2.2, .12], [0, 2.27, .38], .1, .07, 10, [.9, .35, .12]); limb(a, [0, 2.27, .38], [0, 2.36, .58], .07, .03, 10, [.92, .55, .15]);
    [-1, 1].forEach(function (s) { blob(a, s * .13, 2.11, .15, .06, .06, .04, 8, [.75, .1, .08]); blob(a, s * .15, 2.11, .17, .035, .035, .03, 9, [1, 1, 1]); });
    for (t = 0; t < 7; t++) { blob(a, -.06 + t * .02, 1.97, .4 + t * .02, .01, .02, .01, 10, MET); }
    // Mak Orang (orangutan)
    a = []; CHARS.orang = { mesh: a, head: 1.82 };
    var OR = [.62, .26, .07];
    [-1, 1].forEach(function (s) { limb(a, [s * .27, .08, 0], [s * .26, .7, 0], .16, .17, 8, OR); blob(a, s * .27, .06, .1, .17, .07, .22, 8, [.25, .15, .1]); });
    blob(a, 0, 1.18, 0, .58, .56, .46, 8, OR);
    [-1, 1].forEach(function (s) { limb(a, [s * .55, 1.55, 0], [s * .72, .95, .12], .15, .12, 8, OR); limb(a, [s * .72, .95, .12], [s * .74, .45, .25], .12, .1, 8, OR); blob(a, s * .74, .38, .27, .1, .12, .1, 8, [.22, .14, .1]); });
    blob(a, 0, 1.84, .14, .26, .26, .25, 8, OR);
    blob(a, 0, 1.8, .27, .52, .34, .08, 8, [.3, .22, .18]); blob(a, 0, 1.78, .33, .19, .22, .1, 8, [.2, .14, .12]);
    [-1, 1].forEach(function (s) { blob(a, s * .08, 1.88, .41, .04, .035, .02, 9, [1, 1, 1]); });
    blob(a, 0, 1.68, .41, .09, .04, .03, 10, [.05, .02, .02]);
    limb(a, [.72, .95, .12], [.62, 1.3, .45], .02, .02, 4, [.15, .15, .15], 6); blob(a, .6, 1.34, .47, .06, .08, .06, 4, [.2, .2, .22]);
    // Si Kancil (mouse deer)
    a = []; CHARS.kancil = { mesh: a, head: 1.28 };
    var BR = [.42, .26, .14];
    [-1, 1].forEach(function (s) { limb(a, [s * .12, .04, 0], [s * .12, .6, 0], .045, .07, 8, BR); blob(a, s * .12, .03, .05, .05, .03, .08, 8, [.1, .07, .05]); });
    blob(a, 0, .86, 0, .25, .31, .22, 8, BR); blob(a, 0, 1.03, .16, .11, .12, .07, 8, WHT);
    limb(a, [-.24, 1.0, 0], [-.3, .66, .18], .05, .04, 8, BR); limb(a, [.24, 1.0, 0], [.3, .66, .18], .035, .03, 8, MET); blob(a, .3, .63, .2, .04, .05, .04, 10, MET);
    blob(a, 0, 1.28, .08, .15, .14, .2, 8, BR); limb(a, [0, 1.24, .22], [0, 1.18, .4], .07, .04, 8, [.18, .12, .08]);
    [-1, 1].forEach(function (s) { blob(a, s * .13, 1.45, -.03, .05, .14, .03, 8, BR); blob(a, s * .09, 1.31, .22, .045, .045, .03, 9, [1, 1, 1]); });
    for (t = 0; t < 8; t++) { blob(a, -.05 + t * .015, 1.15, .35, .008, .02, .008, 10, MET); }
    blob(a, .1, .9, .2, .1, .14, .03, 10, MET);
  }

  function fixWinding(arr) {
    for (var t = 0; t < arr.length; t += ST * 3) {
      var a = t, b = t + ST, c = t + 2 * ST;
      var ux = arr[b] - arr[a], uy = arr[b + 1] - arr[a + 1], uz = arr[b + 2] - arr[a + 2], vx = arr[c] - arr[a], vy = arr[c + 1] - arr[a + 1], vz = arr[c + 2] - arr[a + 2];
      var fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      var nx = arr[a + 3] + arr[b + 3] + arr[c + 3], ny = arr[a + 4] + arr[b + 4] + arr[c + 4], nz = arr[a + 5] + arr[b + 5] + arr[c + 5];
      if (fx * nx + fy * ny + fz * nz < 0) { for (var k = 0; k < ST; k++) { var tmp = arr[b + k]; arr[b + k] = arr[c + k]; arr[c + k] = tmp; } }
    }
  }
  root.RC = { build: function () { buildAtlas(); buildWorld(); buildChars(); fixWinding(WORLD); fixWinding(DOOR); fixWinding(FAN); for (var k in CHARS) fixWinding(CHARS[k].mesh); },
    AT: AT, UV: UV, WORLD: WORLD, DOOR: DOOR, FAN: FAN, CHARS: CHARS, ST: ST, HT: HT };
})(typeof window !== 'undefined' ? window : globalThis);
