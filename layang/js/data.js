// Layang Air (fictional) — network data. Coordinates and block times are realistic; fares and schedules are invented.
export const HUB = { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7072, tz: 8 };
export const DEST = [
  { code: 'PEN', city: 'Penang', country: 'Malaysia', lat: 5.2971, lon: 100.2770, mins: 60, fare: 99, tz: 8, region: 'Malaysia', tag: 'Hawker capital' },
  { code: 'KCH', city: 'Kuching', country: 'Malaysia', lat: 1.4847, lon: 110.3470, mins: 105, fare: 149, tz: 8, region: 'Malaysia', tag: 'Gateway to Borneo' },
  { code: 'BKI', city: 'Kota Kinabalu', country: 'Malaysia', lat: 5.9372, lon: 116.0510, mins: 155, fare: 179, tz: 8, region: 'Malaysia', tag: 'Under Mount Kinabalu' },
  { code: 'SBW', city: 'Sibu', country: 'Malaysia', lat: 2.2616, lon: 111.9850, mins: 115, fare: 159, tz: 8, region: 'Malaysia', tag: 'Up the Rajang' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915, mins: 60, fare: 129, tz: 8, region: 'Asia', tag: 'Across the causeway' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lon: 100.7501, mins: 125, fare: 229, tz: 7, region: 'Asia', tag: 'Street food and temples' },
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', lat: -6.1256, lon: 106.6559, mins: 120, fare: 219, tz: 7, region: 'Asia', tag: 'The big durian' },
  { code: 'DPS', city: 'Bali', country: 'Indonesia', lat: -8.7482, lon: 115.1672, mins: 180, fare: 289, tz: 8, region: 'Asia', tag: 'Rice terraces and surf' },
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8188, lon: 106.6520, mins: 120, fare: 239, tz: 7, region: 'Asia', tag: 'Motorbikes and phở' },
  { code: 'MNL', city: 'Manila', country: 'Philippines', lat: 14.5086, lon: 121.0194, mins: 225, fare: 349, tz: 8, region: 'Asia', tag: 'Island-hop from here' },
  { code: 'HKG', city: 'Hong Kong', country: 'China', lat: 22.3080, lon: 113.9185, mins: 230, fare: 459, tz: 8, region: 'Asia', tag: 'Harbour lights' },
  { code: 'PEK', city: 'Beijing', country: 'China', lat: 40.0799, lon: 116.6031, mins: 390, fare: 899, tz: 8, region: 'Asia', tag: 'Hutongs and history' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407, mins: 390, fare: 949, tz: 9, region: 'Asia', tag: 'Palaces and night markets' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', lat: 35.7720, lon: 140.3929, mins: 420, fare: 1099, tz: 9, region: 'Asia', tag: 'Sakura season' },
  { code: 'DEL', city: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1000, mins: 330, fare: 799, tz: 5.5, region: 'Asia', tag: 'Forts and chaat' },
  { code: 'MAA', city: 'Chennai', country: 'India', lat: 12.9941, lon: 80.1709, mins: 240, fare: 549, tz: 5.5, region: 'Asia', tag: 'Temples by the sea' },
  { code: 'PER', city: 'Perth', country: 'Australia', lat: -31.9385, lon: 115.9672, mins: 330, fare: 899, tz: 8, region: 'Australia', tag: 'Indian Ocean sunsets' },
  { code: 'SYD', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753, mins: 485, fare: 1399, tz: 10, region: 'Australia', tag: 'Bridge and beaches' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', lat: -37.6690, lon: 144.8410, mins: 480, fare: 1349, tz: 10, region: 'Australia', tag: 'Laneways and coffee' },
  { code: 'DXB', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657, mins: 440, fare: 1299, tz: 4, region: 'Middle East', tag: 'Desert and skyline' },
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lon: 39.1565, mins: 560, fare: 1899, tz: 3, region: 'Middle East', tag: 'Umrah and Red Sea' },
  { code: 'LHR', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543, mins: 845, fare: 2899, tz: 1, region: 'Europe', tag: 'Our longest flight' },
  { code: 'CDG', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479, mins: 805, fare: 2799, tz: 2, region: 'Europe', tag: 'Cafés and boulevards' },
  { code: 'IST', city: 'Istanbul', country: 'Türkiye', lat: 41.2753, lon: 28.7519, mins: 690, fare: 2199, tz: 3, region: 'Europe', tag: 'Where continents meet' }
];
export const ALL = [HUB, ...DEST];
export const byCode = (c) => ALL.find((d) => d.code === c);

// deterministic pseudo-random from a string
export function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }

export const AIRCRAFT = {
  long: { name: 'Airbus A330-900', short: 'A330neo', seats: 'Business 28 · Economy 260', biz: { rows: [1, 7], letters: ['A', '', 'D', 'G', '', 'K'] }, eco: { rows: [11, 42], letters: ['A', 'C', '', 'D', 'E', 'F', 'G', '', 'H', 'K'] }, exits: [11, 27], skip: [13] },
  short: { name: 'Airbus A321neo', short: 'A321neo', seats: 'Business 12 · Economy 180', biz: { rows: [1, 3], letters: ['A', 'C', '', 'D', 'F'] }, eco: { rows: [11, 40], letters: ['A', 'B', 'C', '', 'D', 'E', 'F'] }, exits: [11, 25], skip: [13] }
};
export const FARES = [
  { id: 'lite', name: 'Economy Lite', mult: 1, perks: ['7 kg cabin bag', 'Seat at check-in', 'No changes'] },
  { id: 'value', name: 'Economy Value', mult: 1.28, perks: ['25 kg checked bag', 'Standard seat choice', 'Change for RM 150'] },
  { id: 'flex', name: 'Economy Flex', mult: 1.62, perks: ['35 kg checked bag', 'Any economy seat', 'Free changes'] },
  { id: 'biz', name: 'Business', mult: 3.4, perks: ['2 × 32 kg bags', 'Lie-flat seat', 'Lounge and priority'] }
];
