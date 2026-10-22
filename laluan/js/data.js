// Laluan — a fictional Klang Valley metro operator. Positions are rough km offsets from KLCC (x east, z south).
export const STATIONS = {
  subang:   { name: 'Subang Jaya', x: -16.0, z: 8.6, fac: ['lift', 'park', 'bus'], code: 'SJ' },
  kelana:   { name: 'Kelana Jaya', x: -12.6, z: 5.6, fac: ['lift', 'park', 'bus'] },
  tjaya:    { name: 'Taman Jaya', x: -8.6, z: 4.4, fac: ['lift', 'bus'] },
  pjsentral:{ name: 'PJ Sentral', x: -6.2, z: 3.4, fac: ['lift', 'bus', 'bike'] },
  bangsar:  { name: 'Bangsar', x: -2.9, z: 2.2, fac: ['lift', 'bike'] },
  sentral:  { name: 'KL Sentral', x: -1.7, z: 2.9, fac: ['lift', 'bus', 'rail'] },
  merdeka:  { name: 'Merdeka', x: -.4, z: 2.3, fac: ['lift'] },
  bintang:  { name: 'Bukit Bintang', x: .7, z: 1.1, fac: ['lift', 'bus'] },
  pudu:     { name: 'Pudu', x: 2.4, z: 2.0, fac: ['lift', 'bus'] },
  pandan:   { name: 'Pandan Indah', x: 5.4, z: 2.6, fac: ['lift', 'park'] },
  ampang:   { name: 'Ampang', x: 7.6, z: .2, fac: ['lift', 'park', 'bus'] },

  kepong:   { name: 'Kepong', x: -6.6, z: -9.4, fac: ['lift', 'park', 'bus'] },
  jinjang:  { name: 'Jinjang', x: -4.8, z: -7.8, fac: ['lift'] },
  segambut: { name: 'Segambut', x: -3.9, z: -5.4, fac: ['lift', 'rail'] },
  sentul:   { name: 'Sentul', x: -1.2, z: -4.3, fac: ['lift', 'bus'] },
  titiwangsa:{ name: 'Titiwangsa', x: .4, z: -3.0, fac: ['lift', 'bus'] },
  chowkit:  { name: 'Chow Kit', x: -.5, z: -1.5, fac: ['lift'] },
  klcc:     { name: 'KLCC', x: .1, z: -.1, fac: ['lift', 'bus'] },
  cheras:   { name: 'Cheras', x: 2.8, z: 4.6, fac: ['lift', 'bus'] },
  connaught:{ name: 'Taman Connaught', x: 3.6, z: 7.4, fac: ['lift', 'park'] },
  jalil:    { name: 'Bukit Jalil', x: .6, z: 9.8, fac: ['lift', 'park', 'bus'] },

  ara:      { name: 'Ara Damansara', x: -14.2, z: 1.6, fac: ['lift', 'park'] },
  mutiara:  { name: 'Mutiara Damansara', x: -12.0, z: -1.6, fac: ['lift', 'park', 'bus'] },
  utama:    { name: 'Bandar Utama', x: -10.6, z: -.4, fac: ['lift', 'bus'] },
  kiara:    { name: 'Bukit Kiara', x: -7.6, z: -1.5, fac: ['lift', 'bike'] },
  montkiara:{ name: 'Mont Kiara', x: -5.6, z: -3.4, fac: ['lift', 'bus'] },
  setapak:  { name: 'Setapak', x: 1.8, z: -5.4, fac: ['lift', 'bus'] },
  wangsa:   { name: 'Wangsa Maju', x: 4.2, z: -6.0, fac: ['lift', 'park', 'bus'] },
};

export const LINES = [
  { id: 'L1', name: 'Teratai Line', short: 'Teratai', color: '#e2457a', ends: ['Subang Jaya', 'Ampang'], stops: ['subang', 'kelana', 'tjaya', 'pjsentral', 'bangsar', 'sentral', 'merdeka', 'bintang', 'pudu', 'pandan', 'ampang'], speed: 46 },
  { id: 'L2', name: 'Kenanga Line', short: 'Kenanga', color: '#f08a1c', ends: ['Kepong', 'Bukit Jalil'], stops: ['kepong', 'jinjang', 'segambut', 'sentul', 'titiwangsa', 'chowkit', 'klcc', 'bintang', 'pudu', 'cheras', 'connaught', 'jalil'], speed: 42 },
  { id: 'L3', name: 'Cempaka Line', short: 'Cempaka', color: '#139c8e', ends: ['Kelana Jaya', 'Wangsa Maju'], stops: ['kelana', 'ara', 'mutiara', 'utama', 'kiara', 'montkiara', 'segambut', 'sentul', 'titiwangsa', 'setapak', 'wangsa'], speed: 44 },
];

// map scenery (stylised, km)
export const WATER = [
  [[9, -12], [6.5, -8.5], [4.6, -6.2], [2.4, -3.6], [.9, -1.6], [-.7, .9], [-1.2, 1.6]], // Gombak / upper Klang
  [[-1.2, 1.6], [-2.6, 4.2], [-4.4, 6.2], [-7.6, 7.6], [-11.4, 9.8], [-15, 12.2], [-21, 15]], // Klang river south-west
];
export const PARKS = [
  { x: -7.8, z: -1.0, rx: 1.4, rz: .9 }, // Bukit Kiara
  { x: -1.9, z: 1.2, rx: .8, rz: .55 },  // Lake Gardens
  { x: .7, z: -3.2, rx: .5, rz: .45 },   // Titiwangsa lake
  { x: .5, z: 11.2, rx: 1.8, rz: 1.0 },  // Bukit Jalil park
  { x: -9.3, z: 6.0, rx: .7, rz: .5 },
  { x: 6.5, z: -3.6, rx: 2.4, rz: 1.6 }, // Ampang hills
];
export const ROADS = [
  [[-21, 11], [-16, 8.8], [-12.6, 6], [-8.6, 4.6], [-5, 3.4], [-1.7, 2.9]], // Federal Hwy
  [[-21, -6], [-14, -3.6], [-10.6, -.8], [-7, -1], [-4, -2.6], [-1.4, -3.9], [2, -4.2], [8, -2.5], [12, -1]], // ring north
  [[-4, -14], [-4.4, -8], [-3.4, -4], [-2.4, 0], [-1.8, 3], [-1, 8], [0, 14]], // N-S
  [[0, 2], [3, 3.8], [7, 4.6], [12, 5.5]],
];
export const CENTRES = [ // building density
  { x: .1, z: .2, r: 1.6, h: 1.0 }, { x: -2.6, z: 2.4, r: 1.3, h: .55 }, { x: -6.6, z: 3.6, r: 1.6, h: .45 }, { x: -5.5, z: -3.6, r: 1.1, h: .55 },
  { x: -12.4, z: 5.6, r: 1.6, h: .35 }, { x: -16, z: 8.6, r: 1.8, h: .35 }, { x: -11, z: -.6, r: 1.6, h: .4 }, { x: 2.6, z: 4.8, r: 1.6, h: .35 },
  { x: -1, z: -4.4, r: 1.6, h: .35 }, { x: 4.2, z: -5.9, r: 1.4, h: .3 }, { x: 7.4, z: .4, r: 1.6, h: .3 }, { x: -6.4, z: -9.2, r: 1.8, h: .3 }, { x: .8, z: 9.6, r: 1.6, h: .3 },
];
export const BOUNDS = { x0: -22, x1: 13, z0: -14, z1: 16 };
