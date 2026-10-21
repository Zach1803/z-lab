/* Swapp City layout + atlas builder (shared by the bake script and the page) */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2;
  /* =========================== DATA =========================== */
  var LV = [0, 5.5, 11], CEIL = 5.15;
  var PROD = {
    kopitiam: [['Kopi O Kaw', 3.2], ['Roti Bakar Kaya', 4.5], ['Half-Boiled Eggs (2)', 3.8], ['Nasi Lemak Bungkus', 5.9], ['Teh C Peng', 3.6]],
    batik: [['Kemeja Batik Lelaki', 189], ['Sarung Batik Terengganu', 95], ['Selendang Sutera', 159], ['Baju Kurung Batik', 249]],
    gadget: [['Wireless Earbuds', 199], ['Power Bank 20,000 mAh', 89], ['USB-C Charger 65W', 119], ['Smart Watch', 459]],
    bakery: [['Roti Sosej', 3.2], ['Kaya Puff', 2.8], ['Pandan Chiffon', 18.9], ['Butter Loaf', 7.5]],
    pharmacy: [['Paracetamol 500mg (10s)', 4.9], ['Vitamin C 1000mg', 39.9], ['Minyak Angin', 6.5], ['Face Masks (50s)', 15.9]],
    optical: [['Blue-Light Glasses', 299], ['Polarised Sunglasses', 349], ['Monthly Contact Lens', 85], ['Eye Test', 0]],
    florist: [['Ros Merah Bouquet', 129], ['Orkid in Pot', 89], ['Gerbera Hand-Tied', 69]],
    drinks: [['Teh Tarik Ais', 4.2], ['Kopi Ais Gula Melaka', 6.9], ['Air Bandung', 4.5], ['Air Mata Kucing', 3.8]],
    shoes: [['Kasut Sekolah Putih', 39.9], ['Everyday Sneakers', 229], ['Selipar Jepun', 12.9], ['Block Heels', 159]],
    money: [['SGD 1 → RM', 3.46], ['USD 1 → RM', 4.21], ['THB 100 → RM', 12.8], ['IDR 100k → RM', 27.1]],
    kuih: [['Kuih Lapis (3)', 3.0], ['Onde-Onde (6)', 4.0], ['Seri Muka', 1.5], ['Karipap Pusing (3)', 3.0]],
    telco: [['Prepaid Starter Pack', 10], ['Unlimited Data 30 Days', 35], ['Screen Protector Fitting', 25]],
    jewel: [['916 Gold Ring (from)', 650], ['Pearl Earrings', 289], ['916 Gold Bangle', 2890]],
    watch: [['Classic Leather Watch', 389], ['Dive Watch', 1250], ['Kids Digital Watch', 99]],
    fashion: [['Linen Shirt', 129], ['Wide-Leg Pants', 99], ['Midi Dress', 149], ['Basic Tee', 39]],
    trad: [['Kebaya Nyonya', 289], ['Baju Kurung Moden', 199], ['Baju Melayu Satin', 179], ['Songkok', 35]],
    hijab: [['Bawal Cotton', 39], ['Chiffon Shawl', 49], ['Instant Sulam', 59], ['Inner Neck', 15]],
    denim: [['Slim Jeans', 179], ['Denim Jacket', 249], ['Denim Shorts', 89]],
    beauty: [['Matte Lipstick', 49], ['Sunscreen SPF50', 59], ['Niacinamide Serum', 79], ['Bedak Sejuk', 12]],
    sport: [['Badminton Racket', 289], ['Shuttlecocks (12)', 85], ['Running Shoes', 399], ['Home Jersey', 129]],
    toys: [['Building Blocks Set', 129], ['RC Car', 89], ['Congkak Board', 45], ['Plush Kucing', 39]],
    street: [['Heavyweight Hoodie', 189], ['Six-Panel Cap', 79], ['Graphic Tee', 89]],
    home: [['Rattan Basket', 59], ['Scented Candle', 45], ['Batik Cushion', 69], ['Ceramic Mug', 29]],
    stationery: [['A5 Notebook', 12], ['Brush Pen Set', 25], ['Watercolour Kit', 69]],
    bags: [['Leather Tote', 459], ['Bifold Wallet', 159], ['Daypack', 229]],
    music: [['Ukulele', 199], ['Kompang', 120], ['Guitar Strings', 35]],
    reflex: [['Foot Reflexology 45 min', 58], ['Shoulder & Neck 30 min', 45], ['Full Body 60 min', 120]],
    boba: [['Brown Sugar Boba', 12.9], ['Taro Milk Tea', 11.5], ['Durian Milk Tea', 14.9]],
    durian: [['Durian Crepe', 18], ['Musang King Ice Cream', 15], ['Durian Cendol', 13.9]],
    sushi: [['Salmon Nigiri (2)', 8.8], ['Bento Set', 26], ['Tamago', 4.8]],
    arcade: [['20 Game Tokens', 10], ['1-Hour Free Play', 35], ['Claw Machine Play', 2]],
    karaoke: [['Small Room · 1 hour', 28], ['Large Room · 1 hour', 68], ['Snack Platter', 25]],
    tuition: [['SPM Add Maths (monthly)', 180], ['BM Karangan Class', 120], ['Trial Class', 0]],
    clinic: [['GP Consultation', 45], ['Health Screening', 150], ['Flu Vaccination', 85]],
    repair: [['Screen Replacement', 189], ['Battery Change', 99], ['Data Recovery', 250]],
    herbal: [["Bird's Nest Drink", 25], ['Herbal Tea Pack', 18], ['Tongkat Ali Coffee', 32]],
    photo: [['Passport Photo', 15], ['Family Portrait', 199], ['4R Photo Print', 1]],
    pet: [['Cat Food 2 kg', 45], ['Cat Grooming', 60], ['Pet Bed', 89]],
    laundry: [['Wash & Fold (per kg)', 6], ['Dry Clean Baju Kurung', 18], ['Ironing (per piece)', 3]],
    market: [['Beras Wangi 10 kg', 39.9], ['Telur Gred A (30)', 15.9], ['Minyak Masak 5 kg', 32], ['Sardin Tin', 6.5]],
    dept: [['Cotton Bedsheet Set', 199], ['Non-Stick Wok', 129], ['Men’s Polo', 79], ['Kids Raya Set', 89]],
    books: [['Malaysian Cookbook', 89], ['Novel Melayu Terlaris', 35], ['SPM Model Papers', 28], ['Kids Picture Book', 22]],
    cinema: [['Standard 2D Ticket', 18], ['Recliner Seat', 35], ['Popcorn Combo', 22]],
    hawker: [['Signature Plate', 9.5], ['Large Portion', 12.5], ['Drink Add-on', 2.5]],
    info: []
  };
  var CATNAME = { kopitiam: 'Kopitiam', batik: 'Batik & Craft', gadget: 'Electronics', bakery: 'Bakery', pharmacy: 'Pharmacy', optical: 'Optical', florist: 'Florist', drinks: 'Drinks', shoes: 'Shoes', money: 'Money Changer', kuih: 'Kuih & Snacks', telco: 'Mobile & Telco', jewel: 'Jewellery', watch: 'Watches', fashion: 'Fashion', trad: 'Traditional Wear', hijab: 'Hijab & Modest', denim: 'Denim', beauty: 'Beauty', sport: 'Sports', toys: 'Toys', street: 'Streetwear', home: 'Home & Living', stationery: 'Stationery', bags: 'Bags & Leather', music: 'Music', reflex: 'Wellness', boba: 'Bubble Tea', durian: 'Dessert', sushi: 'Japanese', arcade: 'Entertainment', karaoke: 'Entertainment', tuition: 'Education', clinic: 'Clinic', repair: 'Services', herbal: 'Herbal', photo: 'Services', pet: 'Pets', laundry: 'Services', market: 'Supermarket', dept: 'Department Store', books: 'Books', cinema: 'Cinema', hawker: 'Medan Selera', info: 'Info' };
  var DESC = {
    kopitiam: 'Marble tables, kopi pulled the old way and toast with house-made kaya. The aunties know your order by your second visit.',
    batik: 'Hand-drawn and block-printed batik from Kelantan and Terengganu, cut into modern shirts, kurung and scarves.',
    gadget: 'Phones, accessories and the charger you forgot at home. Same-day screen protector fitting.',
    bakery: 'Fresh trays every hour from 10 AM. The pandan chiffon usually sells out by four.',
    pharmacy: 'Registered pharmacist on duty all day. Free blood pressure check at the counter.',
    optical: 'Eye tests by licensed optometrists, frames from RM 99 and lenses ready in an hour.',
    florist: 'Bouquets, orchids and hantaran arrangements. Order before 2 PM for same-day delivery in PJ.',
    drinks: 'Teh tarik pulled tall, kopi ais with gula Melaka and all the classic sejuk drinks.',
    shoes: 'From kasut sekolah to weekend sneakers. Free sizing for the whole family.',
    money: 'Competitive daily rates for SGD, USD, THB and more. Bring your IC or passport.',
    kuih: 'Mak Teh’s kuih, made fresh every morning: lapis, onde-onde, seri muka and karipap.',
    telco: 'Prepaid top-ups, postpaid plans and quick phone fixes, all in one counter.',
    jewel: '916 gold, pearls and wedding sets, priced by today’s gold rate.',
    watch: 'Everyday watches, divers and kids’ watches, with battery replacement while you wait.',
    fashion: 'Breathable, easy-wear clothing made for Malaysian heat and office aircond.',
    trad: 'Kebaya, baju kurung and baju Melayu for Raya, weddings and Friday prayers, with in-house alterations.',
    hijab: 'Bawal, shawls and instant hijabs in this season’s colours.',
    denim: 'Jeans in every fit, plus free hemming on the spot.',
    beauty: 'Skincare and make-up suited to humid weather, with free skin analysis.',
    sport: 'Badminton gear, running kit and jerseys. Racket stringing in 30 minutes.',
    toys: 'Toys, board games and traditional games like congkak and batu seremban.',
    street: 'Local streetwear labels and limited drops.',
    home: 'Rattan, batik and ceramics for a cosy rumah.',
    stationery: 'School supplies, art materials and planners.',
    bags: 'Leather bags and wallets, hand-stitched by local makers.',
    music: 'Ukuleles, guitars, kompang and lessons for beginners.',
    reflex: 'Foot reflexology and massage for tired shopping legs. Walk-ins welcome.',
    boba: 'Brown sugar boba cooked fresh, plus a durian milk tea you will either love or hate.',
    durian: 'Durian everything: crepes, ice cream, cendol. Not allowed on the LRT, allowed here.',
    sushi: 'Halal-certified conveyor sushi and bento sets.',
    arcade: 'Rhythm games, racing cabinets and claw machines that are definitely not rigged.',
    karaoke: 'Private karaoke rooms with the latest Malay, Chinese, Tamil and English songs.',
    tuition: 'Small-group classes for UPSR, PT3 and SPM subjects. Free trial class.',
    clinic: 'Walk-in GP clinic with panel insurance accepted.',
    repair: 'Phone and laptop repair, usually done in an hour.',
    herbal: 'Traditional herbs, bird’s nest and health drinks.',
    photo: 'Passport photos in five minutes and family portraits by appointment.',
    pet: 'Pet food, toys and grooming for cats and dogs.',
    laundry: 'Drop your laundry off when you arrive and pick it up when you leave.',
    market: 'Fresh produce, groceries and household items. Open from 9 AM.',
    dept: 'Four departments under one roof: home, fashion, kids and beauty.',
    books: 'Malay, English, Chinese and Tamil books, revision guides and a reading corner.',
    cinema: 'Eight halls including recliner seats. Showtimes daily from 11 AM.',
    hawker: 'One of the stalls at Medan Selera. Order at the counter and find a seat.',
    info: ''
  };
  var COLORS = ['#0e5a57', '#b8412e', '#2f4b9a', '#c98a14', '#6b2d73', '#1f7a43', '#a33a5b', '#245b78', '#7a5a2f', '#3d3d3d', '#d0532a', '#14706b'];
  // [name, cat, style]
  var SHOPS = {
    G: { n: [['Kopi Nanyang', 'kopitiam', 'retro'], null, ['Batik Seri', 'batik', 'serif'], ['Gadget Kita', 'gadget', 'tech'], ['Roti Hangat', 'bakery', 'script'], ['Farmasi Sihat', 'pharmacy', 'clean'], ['Optik Jaya', 'optical', 'clean'], ['Bunga Raya Florist', 'florist', 'script']],
         s: [['Teh Tarik & Co', 'drinks', 'retro'], ['Kasut Baru', 'shoes', 'bold'], null, ['Wang Tukar', 'money', 'clean'], ['Kuih Mak Teh', 'kuih', 'script'], ['Sim Pantas', 'telco', 'tech'], ['Emas Mutiara', 'jewel', 'serif'], ['Masa Watches', 'watch', 'serif']] },
    L1: { n: [null, ['Benang & Co', 'fashion', 'serif'], ['Seri Kebaya', 'trad', 'serif'], ['Tudung Ayu', 'hijab', 'script'], ['Denim Lane', 'denim', 'bold'], ['Sinar Beauty', 'beauty', 'clean'], ['Sukan Pro', 'sport', 'bold'], ['Kicap Kids', 'toys', 'fun']],
          s: [null, ['Urban Kampung', 'street', 'bold'], ['Rumah Lifestyle', 'home', 'serif'], ['Pustaka Kecil', 'stationery', 'clean'], ['Beg & Kulit', 'bags', 'serif'], ['Irama Music', 'music', 'retro'], ['Spa Kaki', 'reflex', 'script'], ['Herba Timur', 'herbal', 'serif']] },
    L2: { n: [['Bubble Boba', 'boba', 'fun'], ['Durian Lab', 'durian', 'bold'], ['Rumah Sushi', 'sushi', 'clean'], ['Arena Games', 'arcade', 'tech'], ['Suara Karaoke', 'karaoke', 'fun'], null, ['Tuisyen Cemerlang', 'tuition', 'clean'], ['Klinik Sihat', 'clinic', 'clean']],
          s: [['Fix Express', 'repair', 'tech'], ['Studio Kenangan', 'photo', 'serif'], ['Pet Mesra', 'pet', 'fun'], ['Dobi Express', 'laundry', 'clean'], ['Pustaka Kedua', 'books', 'serif'], null, ['Kasut Sukan', 'sport', 'bold'], ['Gadget Hub', 'gadget', 'tech']] }
  };
  var STALLS = [['Nasi Lemak Bonda', '#1f7a43'], ['Char Kuey Teow Penang', '#b8412e'], ['Roti Canai Mamak', '#c98a14'], ['Chicken Rice Hainan', '#d0532a'], ['Laksa Utara', '#a33a5b'], ['Cendol & ABC', '#14706b'], ['Satay Kajang', '#7a5a2f'], ['Yong Tau Foo', '#245b78']];
  var STALL_ITEMS = [[['Nasi Lemak Ayam Goreng', 9.5], ['Nasi Lemak Sambal Sotong', 11], ['Teh O Ais Limau', 3]], [['Char Kuey Teow Biasa', 9], ['CKT Udang Besar', 15], ['Air Kelapa', 5]], [['Roti Canai Kosong', 1.8], ['Roti Telur Bawang', 3.5], ['Teh Tarik', 2.8]], [['Nasi Ayam Panggang', 9.5], ['Nasi Ayam Stim', 9.5], ['Sup Sayur', 4]], [['Laksa Penang', 10], ['Laksa Kedah', 10], ['Asam Boi', 4]], [['Cendol Pulut', 6.5], ['ABC Special', 7.5], ['Cendol Durian', 9.9]], [['Satay Ayam (10)', 12], ['Satay Daging (10)', 14], ['Nasi Impit', 2]], [['Yong Tau Foo (6 pcs)', 9], ['Dry Mee + 6 pcs', 11], ['Soy Milk', 3]]];
  var MOVIES = [['BAYANG KAMPUNG', 'Horror · P13', '#3a1015'], ['MONSUN', 'Drama · U', '#123a52'], ['LAKSAMANA', 'Action · P13', '#5a3410'], ['PULANG KE KUALA', 'Comedy · U', '#1f5a2c']];

  /* =========================== ATLASES =========================== */
  var A = document.createElement('canvas'); A.width = A.height = 2048; var ac = A.getContext('2d');
  var B = document.createElement('canvas'); B.width = 2048; B.height = 4096; var bc = B.getContext('2d');
  var aIdx = 0; var SW = 512, SH = 112;
  function aCell() { var i = aIdx++, c = i % 4, r = Math.floor(i / 4); return { x: c * SW, y: r * SH, w: SW, h: SH, uv: [c * SW / 2048, r * SH / 2048, (c + 1) * SW / 2048, (r + 1) * SH / 2048] }; }
  var bOcc = []; for (var _i = 0; _i < 128; _i++) { bOcc.push(0); }
  function bAlloc(w, h) {
    for (var r = 0; r <= 16 - h; r++) { for (var c = 0; c <= 8 - w; c++) {
      var ok = true; for (var y = r; y < r + h && ok; y++) { for (var x = c; x < c + w; x++) { if (bOcc[y * 8 + x]) { ok = false; break; } } }
      if (ok) { for (y = r; y < r + h; y++) { for (x = c; x < c + w; x++) { bOcc[y * 8 + x] = 1; } } var px = c * 256, py = r * 256; return { x: px, y: py, w: w * 256, h: h * 256, uv: [(px + 2) / 2048, (py + 2) / 4096, (px + w * 256 - 2) / 2048, (py + h * 256 - 2) / 4096] }; }
    } }
    return null;
  }
  function shade(hex, f) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; var m = function (v) { return Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))); }; return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')'; }
  function fitText(ctx, text, maxW, size, font) { var s = size; do { ctx.font = font.replace('%', s + 'px'); s -= 2; } while (ctx.measureText(text).width > maxW && s > 10); return s + 2; }
  var STYLE = {
    retro: { font: '700 %  "Righteous", "Trebuchet MS", sans-serif', bg: 'dark' },
    serif: { font: '700 % "Playfair Display", Georgia, serif', bg: 'dark' },
    tech: { font: '400 % "Archivo Black", "Arial Black", sans-serif', bg: 'color' },
    script: { font: '400 % "Pacifico", "Brush Script MT", cursive', bg: 'light' },
    clean: { font: '800 % "Plus Jakarta Sans", Arial, sans-serif', bg: 'color' },
    bold: { font: '400 % "Bebas Neue", Impact, sans-serif', bg: 'dark', track: 4 },
    fun: { font: '400 % "Righteous", "Comic Sans MS", sans-serif', bg: 'color' }
  };
  function drawSign(cell, name, style, color, sub) {
    var c = ac, x = cell.x, y = cell.y, w = cell.w, h = cell.h, st = STYLE[style] || STYLE.clean;
    var bg = st.bg === 'dark' ? '#1b1d1f' : st.bg === 'light' ? '#f7f2e8' : color;
    var fg = st.bg === 'dark' ? shade(color, .55) : st.bg === 'light' ? color : '#ffffff';
    if (st.bg === 'dark') { fg = ['#f5d38a', '#ffffff', shade(color, .6)][name.length % 3]; }
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    var g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, shade(bg.charAt(0) === '#' ? bg : '#1b1d1f', .06)); g.addColorStop(1, bg.charAt(0) === '#' ? shade(bg, -.12) : bg);
    c.fillStyle = bg.charAt(0) === '#' ? g : bg; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.strokeRect(x + 3, y + 3, w - 6, h - 6);
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    var txt = style === 'bold' ? name.toUpperCase() : name;
    fitText(c, txt, w - 50, sub ? 52 : 62, st.font);
    if (st.track) { try { c.letterSpacing = st.track + 'px'; } catch (e) {} }
    c.shadowColor = st.bg === 'dark' ? fg : 'rgba(0,0,0,.25)'; c.shadowBlur = st.bg === 'dark' ? 14 : 2;
    c.fillText(txt, x + w / 2, y + h / 2 + (sub ? -10 : 2));
    c.shadowBlur = 0; try { c.letterSpacing = '0px'; } catch (e) {}
    if (sub) { c.font = '700 16px "Plus Jakarta Sans", Arial, sans-serif'; c.globalAlpha = .8; try { c.letterSpacing = '3px'; } catch (e) {} c.fillText(sub.toUpperCase(), x + w / 2, y + h - 22); c.globalAlpha = 1; try { c.letterSpacing = '0px'; } catch (e) {} }
    c.restore();
  }
  function drawWay(cell, a, b, bg, arrow) {
    var c = ac, x = cell.x, y = cell.y, w = cell.w, h = cell.h;
    c.fillStyle = bg; c.fillRect(x, y, w, h);
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.font = '800 38px "Plus Jakarta Sans", Arial, sans-serif'; c.fillText(a, x + 28, y + 40);
    c.font = '500 24px "Plus Jakarta Sans", Arial, sans-serif'; c.globalAlpha = .85; c.fillText(b, x + 28, y + 80); c.globalAlpha = 1;
    if (arrow) { c.font = '800 64px Arial, sans-serif'; c.textAlign = 'right'; c.fillText(arrow, x + w - 26, y + h / 2 + 2); }
  }
  // poster helpers
  function posterBase(r, c1, c2) { var g = bc.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, c1); g.addColorStop(1, c2); bc.fillStyle = g; bc.fillRect(r.x, r.y, r.w, r.h); }
  function pText(r, t, size, y, font, col, align) { bc.fillStyle = col || '#fff'; bc.textAlign = align || 'center'; bc.textBaseline = 'middle'; fitTextB(t, r.w - 30, size, font); bc.fillText(t, align === 'left' ? r.x + 18 : r.x + r.w / 2, r.y + y); }
  function fitTextB(t, maxW, size, font) { var s = size; do { bc.font = font.replace('%', s + 'px'); s -= 2; } while (bc.measureText(t).width > maxW && s > 8); }
  function catPoster(r, cat, color) {
    posterBase(r, shade(color, .25), shade(color, -.35));
    var x = r.x, y = r.y, w = r.w, h = r.h, cx = x + w / 2, cy = y + h * .44;
    bc.save(); bc.globalAlpha = .9;
    bc.fillStyle = 'rgba(255,255,255,.15)'; bc.beginPath(); bc.arc(cx, cy, w * .3, 0, TAU); bc.fill();
    bc.fillStyle = 'rgba(255,255,255,.85)';
    // simple product silhouettes per category family
    var fam = { fashion: 'shirt', trad: 'shirt', hijab: 'shirt', denim: 'shirt', street: 'shirt', batik: 'shirt', shoes: 'shoe', sport: 'shoe', kopitiam: 'cup', drinks: 'cup', boba: 'cup', bakery: 'bread', kuih: 'bread', durian: 'bread', gadget: 'phone', telco: 'phone', repair: 'phone', arcade: 'phone', jewel: 'ring', watch: 'ring', optical: 'ring', beauty: 'bottle', pharmacy: 'bottle', herbal: 'bottle', clinic: 'bottle' }[cat] || 'bag';
    bc.beginPath();
    if (fam === 'shirt') { bc.moveTo(cx - 50, cy - 50); bc.lineTo(cx - 20, cy - 60); bc.quadraticCurveTo(cx, cy - 45, cx + 20, cy - 60); bc.lineTo(cx + 50, cy - 50); bc.lineTo(cx + 70, cy - 20); bc.lineTo(cx + 45, cy - 8); bc.lineTo(cx + 40, cy + 60); bc.lineTo(cx - 40, cy + 60); bc.lineTo(cx - 45, cy - 8); bc.lineTo(cx - 70, cy - 20); bc.closePath(); }
    else if (fam === 'shoe') { bc.moveTo(cx - 70, cy + 30); bc.lineTo(cx - 60, cy - 20); bc.lineTo(cx - 20, cy - 25); bc.quadraticCurveTo(cx + 10, cy + 5, cx + 60, cy + 10); bc.quadraticCurveTo(cx + 80, cy + 20, cx + 75, cy + 35); bc.closePath(); }
    else if (fam === 'cup') { bc.moveTo(cx - 40, cy - 50); bc.lineTo(cx + 40, cy - 50); bc.lineTo(cx + 30, cy + 55); bc.lineTo(cx - 30, cy + 55); bc.closePath(); bc.moveTo(cx + 38, cy - 30); bc.arc(cx + 45, cy, 22, -1.2, 1.2); }
    else if (fam === 'bread') { bc.ellipse(cx, cy + 10, 70, 42, 0, 0, TAU); }
    else if (fam === 'phone') { bc.rect(cx - 34, cy - 62, 68, 124); }
    else if (fam === 'ring') { bc.arc(cx, cy, 46, 0, TAU); bc.arc(cx, cy, 32, 0, TAU, true); }
    else if (fam === 'bottle') { bc.rect(cx - 26, cy - 30, 52, 90); bc.rect(cx - 12, cy - 62, 24, 34); }
    else { bc.moveTo(cx - 55, cy - 20); bc.lineTo(cx + 55, cy - 20); bc.lineTo(cx + 48, cy + 60); bc.lineTo(cx - 48, cy + 60); bc.closePath(); bc.moveTo(cx - 25, cy - 20); bc.arc(cx, cy - 20, 25, Math.PI, 0); }
    bc.fill('evenodd'); bc.restore();
    pText(r, (CATNAME[cat] || '').toUpperCase(), 30, h * .82, '800 % "Plus Jakarta Sans", Arial, sans-serif');
    pText(r, 'NEW ARRIVALS', 15, h * .92, '700 % "Plus Jakarta Sans", Arial, sans-serif', 'rgba(255,255,255,.8)');
  }
  function salePoster(r, a, b, c1, c2) {
    posterBase(r, c1, c2);
    pText(r, a, 96, r.h * .42, '400 % "Bebas Neue", Impact, sans-serif');
    pText(r, b, 26, r.h * .72, '800 % "Plus Jakarta Sans", Arial, sans-serif');
  }
  function foodPoster(r, name, color, k) {
    posterBase(r, '#f6efe2', '#e7dcc6');
    var cx = r.x + r.w / 2, cy = r.y + r.h * .45;
    bc.fillStyle = 'rgba(0,0,0,.12)'; bc.beginPath(); bc.ellipse(cx + 6, cy + 10, 96, 70, 0, 0, TAU); bc.fill();
    bc.fillStyle = '#ffffff'; bc.beginPath(); bc.ellipse(cx, cy, 96, 70, 0, 0, TAU); bc.fill();
    bc.fillStyle = '#efe7d8'; bc.beginPath(); bc.ellipse(cx, cy, 74, 52, 0, 0, TAU); bc.fill();
    var pal = [['#f4f0e6', '#c0392b', '#3d8b3d', '#e9b949'], ['#8a5a2b', '#c0392b', '#e9c46a', '#2d6a4f'], ['#d9a75b', '#f3d9a4', '#8b4513'], ['#f3e6c8', '#d98c3c', '#3d8b3d'], ['#e07a2f', '#f2c14e', '#2d6a4f', '#ffffff'], ['#2d6a4f', '#f5e6c8', '#6b3e26', '#c0392b'], ['#7a4a1f', '#a85c2a', '#f2d16b', '#2d6a4f'], ['#f2e8cf', '#c0392b', '#3d8b3d', '#e9b949']][k % 8];
    for (var i = 0; i < 26; i++) { var a = (i * 2.399) % TAU, rr = Math.sqrt((i + .5) / 26) * 48; bc.fillStyle = pal[i % pal.length]; bc.beginPath(); bc.ellipse(cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * .85, 13 - rr * .1, 9 - rr * .07, a, 0, TAU); bc.fill(); }
    bc.fillStyle = color; bc.fillRect(r.x, r.y + r.h * .8, r.w, r.h * .2);
    pText({ x: r.x, y: r.y, w: r.w, h: r.h }, name.toUpperCase(), 22, r.h * .9, '800 % "Plus Jakarta Sans", Arial, sans-serif');
  }
  function moviePoster(r, m) {
    posterBase(r, shade(m[2], .1), '#050505');
    bc.fillStyle = 'rgba(255,255,255,.08)'; for (var i = 0; i < 6; i++) { bc.beginPath(); bc.arc(r.x + r.w * (.2 + .12 * i), r.y + r.h * .35, 30 + i * 8, 0, TAU); bc.fill(); }
    bc.fillStyle = 'rgba(0,0,0,.6)'; bc.beginPath(); bc.moveTo(r.x + r.w * .3, r.y + r.h * .75); bc.lineTo(r.x + r.w * .5, r.y + r.h * .25); bc.lineTo(r.x + r.w * .7, r.y + r.h * .75); bc.fill();
    pText(r, m[0], 40, r.h * .8, '400 % "Bebas Neue", Impact, sans-serif');
    pText(r, m[1].toUpperCase() + ' · NOW SHOWING', 13, r.h * .91, '700 % "Plus Jakarta Sans", Arial, sans-serif', 'rgba(255,255,255,.75)');
  }
  function kolam(r) {
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = r.w / 2 - 6;
    bc.clearRect(r.x, r.y, r.w, r.h);
    var cols = ['#e63946', '#f4a261', '#ffd166', '#2a9d8f', '#7b2cbf', '#ff006e', '#ffffff', '#06d6a0'];
    function petals(rad, n, len, wid, col, rot) { bc.fillStyle = col; for (var i = 0; i < n; i++) { var a = i / n * TAU + rot; bc.save(); bc.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); bc.rotate(a); bc.beginPath(); bc.ellipse(0, 0, len, wid, 0, 0, TAU); bc.fill(); bc.restore(); } }
    bc.fillStyle = '#7b2cbf'; bc.beginPath(); bc.arc(cx, cy, R, 0, TAU); bc.fill();
    bc.fillStyle = '#ff006e'; bc.beginPath(); bc.arc(cx, cy, R * .93, 0, TAU); bc.fill();
    petals(R * .82, 32, R * .1, R * .045, '#ffd166', 0);
    bc.fillStyle = '#2a9d8f'; bc.beginPath(); bc.arc(cx, cy, R * .7, 0, TAU); bc.fill();
    petals(R * .6, 16, R * .16, R * .07, '#f4a261', .1);
    petals(R * .6, 16, R * .1, R * .04, '#ffffff', .1);
    bc.fillStyle = '#e63946'; bc.beginPath(); bc.arc(cx, cy, R * .42, 0, TAU); bc.fill();
    petals(R * .32, 12, R * .12, R * .06, '#ffd166', 0);
    bc.fillStyle = '#06d6a0'; bc.beginPath(); bc.arc(cx, cy, R * .17, 0, TAU); bc.fill();
    bc.fillStyle = '#ffd166'; bc.beginPath(); bc.arc(cx, cy, R * .08, 0, TAU); bc.fill();
    // dotted rings (rice-flour dots)
    bc.fillStyle = '#ffffff'; for (var k = 0; k < 3; k++) { var rr = R * [.97, .74, .46][k], n = [90, 70, 46][k]; for (var i = 0; i < n; i++) { var a = i / n * TAU; bc.beginPath(); bc.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3.5, 0, TAU); bc.fill(); } }
    // powder grain
    var id = bc.getImageData(r.x, r.y, r.w, r.h), d = id.data;
    for (var p = 0; p < d.length; p += 4) { if (d[p + 3] > 0) { var nz = (Math.random() - .5) * 46; d[p] = Math.max(0, Math.min(255, d[p] + nz)); d[p + 1] = Math.max(0, Math.min(255, d[p + 1] + nz)); d[p + 2] = Math.max(0, Math.min(255, d[p + 2] + nz)); } }
    bc.putImageData(id, r.x, r.y);
  }
  function banner(r, a, b, c1, c2) {
    posterBase(r, c1, c2);
    bc.strokeStyle = '#f5c766'; bc.lineWidth = 6; bc.strokeRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
    for (var i = 0; i < 14; i++) { var x = r.x + 40 + i * (r.w - 80) / 13; bc.fillStyle = '#f5c766'; bc.beginPath(); bc.arc(x, r.y + 30, 6, 0, TAU); bc.fill(); bc.beginPath(); bc.arc(x, r.y + r.h - 30, 6, 0, TAU); bc.fill(); }
    pText(r, a, 92, r.h * .45, '700 % "Playfair Display", Georgia, serif', '#ffe39a');
    pText(r, b, 26, r.h * .74, '700 % "Plus Jakarta Sans", Arial, sans-serif', '#fff');
  }
  function storeScene(r, c1, label) {
    posterBase(r, shade(c1, .5), shade(c1, .15));
    for (var i = 0; i < 5; i++) { bc.fillStyle = 'rgba(255,255,255,.55)'; bc.fillRect(r.x + 20, r.y + 40 + i * (r.h - 60) / 5, r.w - 40, 6); for (var j = 0; j < 14; j++) { bc.fillStyle = COLORS[(i * 3 + j) % COLORS.length]; bc.fillRect(r.x + 24 + j * (r.w - 48) / 14, r.y + 14 + i * (r.h - 60) / 5, (r.w - 48) / 14 - 4, 24); } }
    if (label) { pText(r, label, 40, r.h * .5, '800 % "Plus Jakarta Sans", Arial, sans-serif', 'rgba(255,255,255,.9)'); }
  }
  function dirBoard(r) {
    posterBase(r, '#0e5a57', '#0b3e3c');
    bc.fillStyle = '#f5c766'; bc.beginPath(); bc.arc(r.x + 40, r.y + 40, 18, 0, TAU); bc.fill();
    pText(r, 'Swapp City', 28, 40, '600 % "Fraunces", Georgia, serif', '#fff', 'left'); bc.textAlign = 'left';
    var y = r.y + 90, lv = ['L2', 'L1', 'G'];
    lv.forEach(function (L) {
      bc.fillStyle = '#f5c766'; bc.font = '800 22px "Plus Jakarta Sans", Arial'; bc.fillText(L, r.x + 18, y); y += 22;
      var list = SHOPS[L].n.concat(SHOPS[L].s).filter(Boolean).slice(0, 10);
      bc.fillStyle = 'rgba(255,255,255,.85)'; bc.font = '500 13px "Plus Jakarta Sans", Arial';
      list.forEach(function (s, i) { bc.fillText(s[0], r.x + 18 + (i % 2) * 118, y + Math.floor(i / 2) * 18); });
      y += Math.ceil(list.length / 2) * 18 + 16;
    });
    bc.fillStyle = '#e3a72f'; bc.fillRect(r.x, r.y + r.h - 40, r.w, 40);
    pText(r, 'YOU ARE HERE · ANDA DI SINI', 15, r.h - 20, '800 % "Plus Jakarta Sans", Arial', '#2a1a00');
  }

  var UNITS = [], SIGNS = {}, POST = {};
  function buildAtlases() {
    ac.fillStyle = '#222'; ac.fillRect(0, 0, 2048, 2048);
    bc.clearRect(0, 0, 2048, 4096);
    var catSeen = {};
    ['G', 'L1', 'L2'].forEach(function (L, li) {
      ['n', 's'].forEach(function (side) {
        SHOPS[L][side].forEach(function (s, k) {
          var x0 = 8 + 10 * k, u = { level: li, side: side === 'n' ? 1 : -1, x0: x0, x1: x0 + 10, xc: x0 + 5, code: L + '-' + String(k + 1 + (side === 's' ? 8 : 0)).padStart(2, '0') };
          if (s) {
            u.name = s[0]; u.cat = s[1]; u.color = COLORS[(li * 16 + k * 2 + (side === 's' ? 5 : 0)) % COLORS.length];
            var cell = aCell(); drawSign(cell, s[0], s[2], u.color); u.sign = cell.uv;
            if (!catSeen[s[1]]) { var pr = bAlloc(1, 1); catPoster(pr, s[1], u.color); catSeen[s[1]] = pr.uv; }
            u.poster = catSeen[s[1]];
          }
          UNITS.push(u);
        });
      });
    });
    var mk = function (key, a, b, bg, arrow) { var c = aCell(); drawWay(c, a, b, bg, arrow); SIGNS[key] = c.uv; };
    mk('tandas', 'TANDAS', 'Toilets · Bilik Air', '#0e5a57', '→'); mk('surau', 'SURAU', 'Prayer Room · Ruang Solat', '#1f7a43', '←');
    mk('keluar', 'KELUAR', 'Exit · Main Entrance', '#167a3a', '→'); mk('selera', 'MEDAN SELERA', 'Food Court · Level 2', '#b8412e', '↑');
    mk('wayang', 'SWAPP CINEMAS', 'Cinema · Level 2', '#2f2f3a', '↑'); mk('parking', 'PARKIR', 'Parking B1 – B3', '#2f4b9a', '↓');
    var big = function (key, name, style, color, sub) { var c = aCell(); drawSign(c, name, style, color, sub); SIGNS[key] = c.uv; };
    big('mymart', 'MyMart', 'clean', '#c0392b', 'Supermarket · Pasar Raya'); big('kedaibesar', 'Kedai Besar', 'serif', '#0e5a57', 'Department Store');
    big('pustaka', 'Pustaka Raya', 'serif', '#6b2d73', 'Books · Buku'); big('selerasign', 'Medan Selera', 'script', '#b8412e', 'Food Court');
    big('cinema', 'SWAPP CINEMAS', 'bold', '#c98a14', 'Cinemas'); big('mall', 'Swapp City', 'serif', '#e3a72f', 'Petaling Jaya');
    big('info', 'Info & Concierge', 'clean', '#0e5a57', 'Kaunter Maklumat');
    big('kiosk1', 'Case Corner', 'fun', '#2f4b9a'); big('kiosk2', 'Kuih Cart', 'script', '#c98a14');
    STALLS.forEach(function (s, i) { var c = aCell(); drawSign(c, s[0], 'clean', s[1]); s.sign = c.uv; var p = bAlloc(1, 1); foodPoster(p, s[0], s[1], i); s.post = p.uv; });
    var kr = bAlloc(2, 2); kolam(kr); POST.kolam = kr.uv;
    var bn = bAlloc(4, 1); banner(bn, 'Selamat Hari Deepavali', 'FESTIVAL OF LIGHTS · SWAPP CITY', '#6b1d5c', '#2a0b3a'); POST.deepa = bn.uv;
    var bn2 = bAlloc(4, 1); banner(bn2, 'Mega Sale 11.11', 'UP TO 70% OFF · SELECTED STORES', '#b8412e', '#5a1208'); POST.sale = bn2.uv;
    var hd = bAlloc(2, 1); posterBase(hd, '#f2efe8', '#e2ddd2'); pText(hd, 'AKAN DIBUKA', 64, 100, '400 % "Bebas Neue", Impact', '#0e5a57'); pText(hd, 'COMING SOON · NEW STORE', 22, 160, '800 % "Plus Jakarta Sans", Arial', '#5b6766'); bc.fillStyle = '#e3a72f'; bc.fillRect(hd.x, hd.y + hd.h - 26, hd.w, 26); POST.hoard = hd.uv;
    MOVIES.forEach(function (m, i) { var p = bAlloc(1, 1); moviePoster(p, m); m.uv = p.uv; });
    var s1 = bAlloc(1, 1); salePoster(s1, 'SALE', 'UP TO 50% OFF', '#c0392b', '#7a1a10'); POST.s1 = s1.uv;
    var s2 = bAlloc(1, 1); salePoster(s2, 'NEW', 'IN STORE NOW', '#0e5a57', '#083332'); POST.s2 = s2.uv;
    var s3 = bAlloc(1, 1); salePoster(s3, '11.11', 'MEGA SALE', '#e3a72f', '#a0650a'); POST.s3 = s3.uv;
    var mm = bAlloc(2, 1); storeScene(mm, '#c0392b', ''); POST.market = mm.uv;
    var db = bAlloc(2, 1); storeScene(db, '#0e5a57', ''); POST.dept = db.uv;
    var bk = bAlloc(2, 1); storeScene(bk, '#6b2d73', ''); POST.books = bk.uv;
    var dr = bAlloc(1, 2); dirBoard(dr); POST.dir = dr.uv;
  }

  /* =========================== GEOMETRY =========================== */
  var OP = [], TR = [], ST = 13;
  function V(arr, p, n, uv, m, c, ao) { arr.push(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1], m, c[0], c[1], c[2], ao); }
  function nrm(a, b, c) { var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; var x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.sqrt(x * x + y * y + z * z) || 1; return [x / l, y / l, z / l]; }
  var TESS = 0.6, NOTESS = { 3: 1, 5: 1, 6: 1, 7: 1, 8: 1, 14: 1, 15: 1 };
  function quad1(arr, a, b, c, d, n, m, col, uv) {
    V(arr, a, n, [uv[0], uv[1]], m, col, 1); V(arr, b, n, [uv[2], uv[3]], m, col, 1); V(arr, c, n, [uv[4], uv[5]], m, col, 1);
    V(arr, a, n, [uv[0], uv[1]], m, col, 1); V(arr, c, n, [uv[4], uv[5]], m, col, 1); V(arr, d, n, [uv[6], uv[7]], m, col, 1);
  }
  // one-sided panels (hq/vq) are turned to face the open interior; panels with open air on both sides get both faces
  var SINGLE = 0;
  function interior(x, y, z) {
    if (x > 16 && x < 80 && Math.abs(z) < 6 && y > 0 && y < 18.75) { return true; }
    if (x > 95.65 && Math.abs(z) < 6 && y > 0 && y < 4.45) { return true; }
    if (x <= .35 || x >= 95.65 || Math.abs(z) >= 18) { return false; }
    for (var L = 0; L < 3; L++) {
      if (y > LV[L] + .01 && y < LV[L] + CEIL - .01) {
        var az = Math.abs(z);
        if (az < 11) { return true; }
        return x > 8 && x < 88;
      }
    }
    return false;
  }
  function quad(arr, a, b, c, d, m, col, uv, ao) {
    if (SINGLE) {
      SINGLE = 0;
      var n0 = nrm(a, b, c), cx = (a[0] + b[0] + c[0] + d[0]) / 4, cyy = (a[1] + b[1] + c[1] + d[1]) / 4, cz = (a[2] + b[2] + c[2] + d[2]) / 4;
      var f = interior(cx + n0[0] * .25, cyy + n0[1] * .25, cz + n0[2] * .25), bk = interior(cx - n0[0] * .25, cyy - n0[1] * .25, cz - n0[2] * .25);
      var u0 = uv || [0, 0, 1, 0, 1, 1, 0, 1], uf = [u0[6], u0[7], u0[4], u0[5], u0[2], u0[3], u0[0], u0[1]];
      var both = f && bk, e = both ? .002 : 0, off = function (p, k) { return [p[0] + n0[0] * e * k, p[1] + n0[1] * e * k, p[2] + n0[2] * e * k]; };
      if (f || !bk) { quad(arr, off(a, 1), off(b, 1), off(c, 1), off(d, 1), m, col, u0); }
      if (bk) { quad(arr, off(d, -1), off(c, -1), off(b, -1), off(a, -1), m, col, uf); }
      SINGLE = 1; return;
    }
    var n = nrm(a, b, c); uv = uv || [0, 0, 1, 0, 1, 1, 0, 1];
    var lu = Math.max(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]));
    var lv = Math.max(Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]), Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2]));
    var nu = NOTESS[m] ? 1 : Math.min(160, Math.max(1, Math.ceil(lu / TESS))), nv = NOTESS[m] ? 1 : Math.min(160, Math.max(1, Math.ceil(lv / TESS)));
    if (nu === 1 && nv === 1) { quad1(arr, a, b, c, d, n, m, col, uv); return; }
    var P = function (s, t) { var r = []; for (var k = 0; k < 3; k++) { r.push((a[k] * (1 - s) + b[k] * s) * (1 - t) + (d[k] * (1 - s) + c[k] * s) * t); } return r; };
    var T = function (s, t) { return [(uv[0] * (1 - s) + uv[2] * s) * (1 - t) + (uv[6] * (1 - s) + uv[4] * s) * t, (uv[1] * (1 - s) + uv[3] * s) * (1 - t) + (uv[7] * (1 - s) + uv[5] * s) * t]; };
    for (var i = 0; i < nu; i++) { for (var j = 0; j < nv; j++) {
      var s0 = i / nu, s1 = (i + 1) / nu, t0 = j / nv, t1 = (j + 1) / nv;
      var ta = T(s0, t0), tb = T(s1, t0), tc = T(s1, t1), td = T(s0, t1);
      quad1(arr, P(s0, t0), P(s1, t0), P(s1, t1), P(s0, t1), n, m, col, [ta[0], ta[1], tb[0], tb[1], tc[0], tc[1], td[0], td[1]]);
    } }
  }
  function box(arr, x0, y0, z0, x1, y1, z1, m, col, skip) {
    skip = skip || '';
    if (skip.indexOf('t') < 0) { quad(arr, [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], m, col); }
    if (skip.indexOf('b') < 0) { quad(arr, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], m, col); }
    if (skip.indexOf('n') < 0) { quad(arr, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], m, col); }
    if (skip.indexOf('s') < 0) { quad(arr, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], m, col); }
    if (skip.indexOf('e') < 0) { quad(arr, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], m, col); }
    if (skip.indexOf('w') < 0) { quad(arr, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], m, col); }
  }
  function vq(arr, x0, z0, x1, z1, y0, y1, m, col) { SINGLE = 1; quad(arr, [x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], m, col); SINGLE = 0; }
  // textured vertical quad facing (fx,fz), readable from that side
  function signAt(arr, cx, cy, cz, fx, fz, w, h, m, uv, col) {
    var rx = fz, rz = -fx, hw = w / 2, hh = h / 2;
    var BL = [cx - rx * hw, cy - hh, cz - rz * hw], BR = [cx + rx * hw, cy - hh, cz + rz * hw], TR_ = [cx + rx * hw, cy + hh, cz + rz * hw], TL = [cx - rx * hw, cy + hh, cz - rz * hw];
    var n = [fx, 0, fz]; col = col || [1, 1, 1];
    var u = uv;
    V(arr, BL, n, [u[0], u[3]], m, col, 1); V(arr, BR, n, [u[2], u[3]], m, col, 1); V(arr, TR_, n, [u[2], u[1]], m, col, 1);
    V(arr, BL, n, [u[0], u[3]], m, col, 1); V(arr, TR_, n, [u[2], u[1]], m, col, 1); V(arr, TL, n, [u[0], u[1]], m, col, 1);
  }
  function hq(arr, x0, z0, x1, z1, y, m, col, uv) { SINGLE = 1; quad(arr, [x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], m, col, uv); SINGLE = 0; }
  function cyl(arr, cx, cz, r, y0, y1, m, col, seg, cap) {
    seg = seg || 18;
    if (cap) { for (var ci = 0; ci < seg; ci++) { var b0 = ci / seg * TAU, b1 = (ci + 1) / seg * TAU; V(arr, [cx, y1, cz], [0, 1, 0], [0, 0], m, col, 1); V(arr, [cx + Math.cos(b0) * r, y1, cz + Math.sin(b0) * r], [0, 1, 0], [0, 0], m, col, 1); V(arr, [cx + Math.cos(b1) * r, y1, cz + Math.sin(b1) * r], [0, 1, 0], [0, 0], m, col, 1); } }
    for (var i = 0; i < seg; i++) {
      var a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      var p0 = [cx + c0 * r, y0, cz + s0 * r], p1 = [cx + c1 * r, y0, cz + s1 * r], p2 = [cx + c1 * r, y1, cz + s1 * r], p3 = [cx + c0 * r, y1, cz + s0 * r];
      var n0 = [c0, 0, s0], n1 = [c1, 0, s1];
      V(arr, p0, n0, [0, 0], m, col, 1); V(arr, p1, n1, [0, 0], m, col, 1); V(arr, p2, n1, [0, 0], m, col, 1);
      V(arr, p0, n0, [0, 0], m, col, 1); V(arr, p2, n1, [0, 0], m, col, 1); V(arr, p3, n0, [0, 0], m, col, 1);
    }
  }

  /* walkability */
  var GR = 0.25, GW = Math.round(96 / GR), GH = Math.round(36 / GR), WALK = [new Uint8Array(GW * GH), new Uint8Array(GW * GH), new Uint8Array(GW * GH)];
  var VOID = [16, -6, 80, 6];
  var BRIDGES = [[], [[46, -6, 50, 6]], [[32, -6, 36.5, 6], [66, -6, 70.5, 6]]];
  var ESC = [
    { xb: 26.5, xt: 16, yb: 0, yt: 5.5, z0: -2.3, z1: -0.7, dir: 1 }, { xb: 26.5, xt: 16, yb: 0, yt: 5.5, z0: 0.7, z1: 2.3, dir: -1 },
    { xb: 59.5, xt: 50, yb: 0, yt: 5.5, z0: -2.3, z1: -0.7, dir: 1 }, { xb: 59.5, xt: 50, yb: 0, yt: 5.5, z0: 0.7, z1: 2.3, dir: -1 },
    { xb: 46, xt: 36.5, yb: 5.5, yt: 11, z0: -2.3, z1: -0.7, dir: 1 }, { xb: 46, xt: 36.5, yb: 5.5, yt: 11, z0: 0.7, z1: 2.3, dir: -1 },
    { xb: 80, xt: 70.5, yb: 5.5, yt: 11, z0: -2.3, z1: -0.7, dir: 1 }, { xb: 80, xt: 70.5, yb: 5.5, yt: 11, z0: 0.7, z1: 2.3, dir: -1 }
  ];
  function slabRects(L) {
    if (L === 0) { return [[0, -18, 96, 18]]; }
    return [[0, -18, 96, -6], [0, 6, 96, 18], [0, -6, 16, 6], [80, -6, 96, 6]].concat(BRIDGES[L]);
  }
  var SOLID = [[], [], []];
  function solid(L, x0, z0, x1, z1) { SOLID[L].push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]); }
  function buildWalk() {
    for (var L = 0; L < 3; L++) {
      var W = WALK[L], sr = slabRects(L);
      for (var j = 0; j < GH; j++) { for (var i = 0; i < GW; i++) {
        var x = (i + .5) * GR, z = (j + .5) * GR - 18, ok = false, k;
        for (k = 0; k < sr.length; k++) { var r = sr[k]; if (x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) { ok = true; break; } }
        if (ok) { for (k = 0; k < SOLID[L].length; k++) { var s = SOLID[L][k]; if (x >= s[0] && x <= s[2] && z >= s[1] && z <= s[3]) { ok = false; break; } } }
        W[j * GW + i] = ok ? 1 : 0;
      } }
    }
  }
  function walkAt(L, x, z) { var i = Math.floor(x / GR), j = Math.floor((z + 18) / GR); if (i < 0 || j < 0 || i >= GW || j >= GH) { return false; } return WALK[L][j * GW + i] === 1; }
  function aoAt(L, x, z) {
    var occ = 0, tot = 0;
    for (var a = 0; a < 8; a++) { var dx = Math.cos(a * TAU / 8), dz = Math.sin(a * TAU / 8); for (var r = .25; r <= 1.0; r += .25) { tot += 1 / r; if (!walkAt(L, x + dx * r, z + dz * r)) { occ += 1 / r; } } }
    return 1 - Math.min(.55, occ / tot * .9);
  }
  function floorGrid(arr, L, x0, z0, x1, z1, y, m, col, aoOn) {
    var nx = Math.max(1, Math.round(x1 - x0)), nz = Math.max(1, Math.round(z1 - z0)), dx = (x1 - x0) / nx, dz = (z1 - z0) / nz;
    for (var i = 0; i < nx; i++) { for (var j = 0; j < nz; j++) {
      var a = x0 + i * dx, b = z0 + j * dz, c = a + dx, d = b + dz;
      var ao = null;
      quad(arr, [a, y, b], [a, y, d], [c, y, d], [c, y, b], m, col, null, ao);
    } }
  }

  var W1 = [.93, .92, .9], STEEL = [.75, .76, .78], DARK = [.12, .12, .13];
  function rectsMinusVoid(L, zlim) { // marble floor rects for corridors at level L
    if (L === 0) { return [[0, -zlim, 96, zlim]]; }
    var r = [[0, -zlim, 96, -6], [0, 6, 96, zlim], [0, -6, 16, 6], [80, -6, 96, 6]];
    return r.concat(BRIDGES[L]);
  }
  function edgeSegments(L) {
    // void boundary segments at level L, excluding bridges; returns [x0,z0,x1,z1, nx, nz] (normal into void)
    var segs = [], br = BRIDGES[L];
    function spanX(z, nz) {
      var cuts = [[16, 80]];
      br.forEach(function (b) { var nc = []; cuts.forEach(function (c) { if (b[2] <= c[0] || b[0] >= c[1]) { nc.push(c); } else { if (b[0] > c[0]) { nc.push([c[0], b[0]]); } if (b[2] < c[1]) { nc.push([b[2], c[1]]); } } }); cuts = nc; });
      cuts.forEach(function (c) { segs.push([c[0], z, c[1], z, 0, nz]); });
    }
    spanX(6, -1); spanX(-6, 1);
    segs.push([16, -6, 16, 6, 1, 0]); segs.push([80, -6, 80, 6, -1, 0]);
    br.forEach(function (b) { segs.push([b[0], -6, b[0], 6, -1, 0]); segs.push([b[2], -6, b[2], 6, 1, 0]); });
    return segs;
  }
  function escGap(x, z) { // is this point at an escalator landing on a slab edge
    for (var i = 0; i < ESC.length; i++) { var e = ESC[i]; if ((Math.abs(x - e.xt) < .05 || Math.abs(x - e.xb) < .05) && z > e.z0 - .05 && z < e.z1 + .05) { return true; } }
    return false;
  }

  function buildMall() {
    var L, k, i;
    // ---------- solids (collision) ----------
    for (L = 0; L < 3; L++) {
      solid(L, 0, 11, 8, 18); solid(L, 0, -18, 8, -11); solid(L, 88, 11, 96, 18); solid(L, 88, -18, 96, -11);
      for (k = 0; k <= 8; k++) { var px = 8 + 10 * k; solid(L, px - .14, 11, px + .14, 18); solid(L, px - .14, -18, px + .14, -11); }
      [16, 32, 48, 64, 80].forEach(function (x) { solid(L, x - .4, 6.25, x + .4, 7.05); solid(L, x - .4, -7.05, x + .4, -6.25); });
      solid(L, 0, -18, .35, 18); solid(L, 95.65, -18, 96, 18);
    }
    UNITS.forEach(function (u) {
      var s = u.side, L = u.level, zf = 11 * s;
      if (!u.name) { solid(L, u.x0, zf - .15 * s, u.x1, zf + .15 * s); return; }
      solid(L, u.x0, zf - .06 * s, u.xc - 1.3, zf + .06 * s); solid(L, u.xc + 1.3, zf - .06 * s, u.x1, zf + .06 * s);
      solid(L, u.xc - 2.2, 14.6 * s, u.xc + 2.2, 15.6 * s); // display table
      solid(L, u.x0 + .2, 17.3 * s, u.x1 - .2, 18 * s); // back shelf
      solid(L, u.x0 + .14, 12.3 * s, u.x0 + .75, 17.3 * s); solid(L, u.x1 - .75, 12.3 * s, u.x1 - .14, 17.3 * s);
      solid(L, u.x1 - 3.2, 16.2 * s, u.x1 - 1, 17.3 * s); // counter
    });
    solid(0, 16, -2.5, 25.9, 2.5); solid(0, 50, -2.5, 58.9, 2.5);
    solid(0, 66, 3.2, 69, 5.6); solid(0, 66, -5.6, 69, -3.2); // kiosks
    solid(0, 86, 7.2, 87.2, 8.4); // directory pylon
    solid(0, 90.5, -9.6, 93.5, -7.8); // info counter
    for (i = 0; i < 8; i++) { var a = i / 8 * TAU; solid(0, 36 + Math.cos(a) * 5.3 - .35, Math.sin(a) * 5.3 - .35, 36 + Math.cos(a) * 5.3 + .35, Math.sin(a) * 5.3 + .35); }
    [[30, 8.8], [42, 8.8], [30, -8.8], [42, -8.8], [74, 8.8], [74, -8.8]].forEach(function (b) { solid(0, b[0] - 1, b[1] - .3, b[0] + 1, b[1] + .3); });
    // food court
    solid(2, 0, -11, 2.3, 11);
    for (var tx = 5; tx <= 13; tx += 2.6) { for (var tz = -9; tz <= 9; tz += 2.6) { if (Math.abs(tz) < 1.2) { continue; } solid(2, tx - .5, tz - .5, tx + .5, tz + .5); } }
    solid(2, 93.6, -6, 96, 6); solid(1, 0, -6, 1.2, 6); solid(1, 94.8, -6, 96, 6); solid(0, 0, -6, 1.2, 6);
    buildWalk();

    // ---------- geometry ----------
    for (L = 0; L < 3; L++) {
      var fy = LV[L];
      // corridor floors
      rectsMinusVoid(L, 11).forEach(function (r) {
        if (L === 2 && r[0] === 0 && r[2] === 16) { floorGrid(OP, L, r[0], r[1], r[2], r[3], fy, 13, [1, 1, 1], true); return; }
        if (L === 2 && r[0] === 0) { floorGrid(OP, L, 0, r[1], 16, r[3], fy, 13, [1, 1, 1], true); floorGrid(OP, L, 16, r[1], r[2], r[3], fy, 0, [1, 1, 1], true); return; }
        floorGrid(OP, L, r[0], r[1], r[2], r[3], fy, 0, [1, 1, 1], true);
      });
      // slab undersides / ceilings
      var cy = fy + CEIL;
      if (L < 2) {
        slabRects(L + 1).forEach(function (r) { hq(OP, r[0], r[1], r[2], r[3], cy, 2, W1); });
      } else {
        [[0, -18, 96, -6], [0, 6, 96, 18], [0, -6, 16, 6], [80, -6, 96, 6]].forEach(function (r) { hq(OP, r[0], r[1], r[2], r[3], cy, 2, W1); });
      }
      // void edges: fascia + glass balustrade (upper levels)
      if (L > 0) {
        edgeSegments(L).forEach(function (sg) {
          var x0 = sg[0], z0 = sg[1], x1 = sg[2], z1 = sg[3], nx = sg[4], nz = sg[5], t = .28;
          var ox = nx * t, oz = nz * t;
          box(OP, Math.min(x0, x0 + ox), fy - .8, Math.min(z0, z0 + oz), Math.max(x1, x1 + ox), fy + .02, Math.max(z1, z1 + oz), 1, [.96, .95, .93]);
          // cove LED under fascia
          hq(OP, Math.min(x0, x0 + ox * .4), Math.min(z0, z0 + oz * .4), Math.max(x1, x1 + ox * .4), Math.max(z1, z1 + oz * .4), fy - .81, 6, [3.2, 3.0, 2.6]);
          // balustrade with gaps at escalators
          var len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.5)), dx = (x1 - x0) / n, dz = (z1 - z0) / n;
          for (var q = 0; q < n; q++) {
            var ax = x0 + dx * q, az = z0 + dz * q, bx = ax + dx, bz = az + dz, mx = (ax + bx) / 2, mz = (az + bz) / 2;
            if (escGap(mx, mz) || escGap(ax + dx * .2, az + dz * .2) || escGap(ax + dx * .8, az + dz * .8)) { continue; }
            vq(TR, ax + ox * .5, az + oz * .5, bx + ox * .5, bz + oz * .5, fy + .05, fy + 1.08, 3, [.86, .95, .93]);
            box(OP, Math.min(ax, bx) + ox * .5 - .03, fy + 1.08, Math.min(az, bz) + oz * .5 - .03, Math.max(ax, bx) + ox * .5 + .03, fy + 1.14, Math.max(az, bz) + oz * .5 + .03, 4, STEEL);
            box(OP, ax + ox * .5 - .025, fy, az + oz * .5 - .025, ax + ox * .5 + .025, fy + 1.1, az + oz * .5 + .025, 4, STEEL);
          }
        });
      }
      // columns
      [16, 32, 48, 64, 80].forEach(function (x) { [6.65, -6.65].forEach(function (z) {
        cyl(OP, x, z, .4, fy, cy, 1, [.95, .94, .91]); cyl(OP, x, z, .43, fy, fy + .12, 4, STEEL);
      }); });
      // end walls
      vq(OP, .35, -18, .35, 18, fy, cy, 1, [.9, .88, .84]);
      if (L === 0) { vq(OP, 95.65, -18, 95.65, -6, fy, cy, 1, [.9, .88, .84]); vq(OP, 95.65, 6, 95.65, 18, fy, cy, 1, [.9, .88, .84]); vq(OP, 95.65, -6, 95.65, 6, 4.45, cy, 1, [.9, .88, .84]); } else { vq(OP, 95.65, -18, 95.65, 18, fy, cy, 1, [.9, .88, .84]); }
      // back-of-house walls at corridor ends
      vq(OP, 0, 11, 8, 11, fy, cy, 1, [.92, .9, .86]); vq(OP, 0, -11, 8, -11, fy, cy, 1, [.92, .9, .86]);
      vq(OP, 88, 11, 96, 11, fy, cy, 1, [.92, .9, .86]); vq(OP, 88, -11, 96, -11, fy, cy, 1, [.92, .9, .86]);
      // wayfinding: toilets & surau doors at west end
      box(OP, 3, fy, 10.9, 5, fy + 2.4, 11, 10, [.55, .4, .28]); signAt(OP, 4, fy + 2.75, 10.88, 0, -1, 1.9, .42, 5, SIGNS.tandas);
      box(OP, 3, fy, -11, 5, fy + 2.4, -10.9, 10, [.55, .4, .28]); signAt(OP, 4, fy + 2.75, -10.88, 0, 1, 1.9, .42, 5, SIGNS.surau);
      box(OP, 90, fy, 10.9, 92, fy + 2.4, 11, 10, [.55, .4, .28]); signAt(OP, 91, fy + 2.75, 10.88, 0, -1, 1.9, .42, 5, SIGNS.tandas);
      // hanging signs
      var hs = function (x, z, key) { box(OP, x - .02, cy - .5, z - .02, x + .02, cy, z + .02, 4, STEEL); box(OP, x - .05, cy - 1.0, z - 1.05, x + .05, cy - .52, z + 1.05, 11, DARK); signAt(OP, x + .06, cy - .76, z, 1, 0, 2.05, .45, 5, SIGNS[key]); signAt(OP, x - .06, cy - .76, z, -1, 0, 2.05, .45, 5, SIGNS[key]); };
      if (L === 0) { hs(12, 8.5, 'tandas'); hs(12, -8.5, 'surau'); hs(84, 8.5, 'keluar'); hs(84, -8.5, 'parking'); hs(40, 8.5, 'selera'); hs(56, -8.5, 'wayang'); }
      if (L === 1) { hs(12, 8.5, 'tandas'); hs(12, -8.5, 'surau'); hs(40, 8.5, 'selera'); hs(84, -8.5, 'wayang'); }
      if (L === 2) { hs(24, 8.5, 'selera'); hs(72, -8.5, 'wayang'); hs(12, -8.5, 'surau'); }
    }

    // ---------- shops ----------
    UNITS.forEach(function (u, ui) {
      var L = u.level, fy = LV[L], cy = fy + CEIL, s = u.side, zf = 11 * s, zb = 18 * s, x0 = u.x0, x1 = u.x1, xc = u.xc;
      // partitions
      box(OP, x0 - .14, fy, Math.min(zf, zb), x0 + .14, cy, Math.max(zf, zb), 1, [.9, .89, .86]);
      if (u.x1 === 88) { box(OP, x1 - .14, fy, Math.min(zf, zb), x1 + .14, cy, Math.max(zf, zb), 1, [.9, .89, .86]); }
      // bulkhead above sign
      vq(OP, x0, zf, x1, zf, fy + 4.4, cy, 1, [.95, .94, .92]);
      if (!u.name) {
        // hoarding
        signAt(OP, xc, fy + 2.2, zf - .16 * s, 0, -s, 9.9, 4.4, 15, POST.hoard);
        return;
      }
      var rgb = hexRGB(u.color);
      // interior
      var wood = ui % 3 === 0;
      hq(OP, x0 + .14, Math.min(zf, zb), x1 - .14, Math.max(zf, zb), fy + .002, wood ? 10 : 12, wood ? [.62, .45, .3] : [.85, .84, .8]);
      vq(OP, x0 + .14, zb, x1 - .14, zb, fy, cy, 1, mix3(rgb, [.95, .94, .9], .78));
      signAt(OP, xc, fy + 2.4, zb - .03 * s, 0, -s, 4.6, 2.3, 7, u.poster);
      // fascia sign
      box(OP, x0 + .05, fy + 3.35, Math.min(zf, zf - .2 * s), x1 - .05, fy + 4.4, Math.max(zf, zf - .2 * s), 11, DARK);
      signAt(OP, xc, fy + 3.875, zf - .205 * s, 0, -s, 6.4, 1.4, 5, u.sign);
      // shopfront glass + mullions
      [[x0 + .05, xc - 1.3], [xc + 1.3, x1 - .05]].forEach(function (g) {
        vq(TR, g[0], zf, g[1], zf, fy + .05, fy + 3.35, 3, [.9, .96, .96]);
        var nm = Math.round((g[1] - g[0]) / 1.8);
        for (var q = 0; q <= nm; q++) { var mx = g[0] + (g[1] - g[0]) * q / nm; box(OP, mx - .03, fy, zf - .04, mx + .03, fy + 3.35, zf + .04, 4, STEEL); }
      });
      box(OP, x0, fy, zf - .05, x1, fy + .06, zf + .05, 4, STEEL);
      box(OP, x0, fy + 3.3, zf - .05, x1, fy + 3.36, zf + .05, 4, STEEL);
      // window posters
      signAt(OP, xc - 2.6, fy + 1.6, zf - .02 * s, 0, -s, .9, .9, 7, [POST.s1, POST.s2, POST.s3][ui % 3]);
      // display table with products
      box(OP, xc - 2.2, fy, 14.6 * s - .0, xc + 2.2, fy + .82, 15.6 * s, 10, [.5, .36, .24]);
      for (var p = 0; p < 10; p++) { var px = xc - 1.9 + p * .42, h = .12 + ((p * 37 + ui * 13) % 7) * .05; box(OP, px, fy + .82, Math.min(14.85 * s, 15.3 * s), px + .3, fy + .82 + h, Math.max(14.85 * s, 15.3 * s), 12, hexRGB(COLORS[(p + ui) % COLORS.length])); }
      // wall shelves
      [x0 + .14, x1 - .75].forEach(function (sx) {
        box(OP, sx, fy, Math.min(12.3 * s, 17.3 * s), sx + .6, fy + 2.4, Math.max(12.3 * s, 17.3 * s), 1, [.95, .95, .93], '');
        for (var sh = 0; sh < 4; sh++) { var sy = fy + .45 + sh * .52; for (var it = 0; it < 7; it++) { var iz = 12.6 + it * .68; box(OP, sx + .08, sy, Math.min(iz * s, (iz + .5) * s), sx + .52, sy + .3 + ((it + sh + ui) % 3) * .05, Math.max(iz * s, (iz + .5) * s), 12, hexRGB(COLORS[(it * 2 + sh + ui) % COLORS.length])); } }
      });
      box(OP, x0 + .2, fy, Math.min(17.3 * s, 18 * s), x1 - .2, fy + 2.2, Math.max(17.3 * s, 18 * s), 1, [.96, .96, .94]);
      // counter
      box(OP, x1 - 3.2, fy, Math.min(16.2 * s, 17.3 * s), x1 - 1, fy + 1.05, Math.max(16.2 * s, 17.3 * s), 1, mix3(rgb, [1, 1, 1], .2));
      box(OP, x1 - 3.25, fy + 1.05, Math.min(16.15 * s, 17.35 * s), x1 - .95, fy + 1.1, Math.max(16.15 * s, 17.35 * s), 10, [.85, .82, .76]);
    });

    // ---------- escalators ----------
    ESC.forEach(function (e) {
      var sgn = Math.sign(e.xt - e.xb), zA = e.z0, zB = e.z1;
      // steps (moving, mat 9)
      quad(OP, [e.xb, e.yb + .01, zA + .18], [e.xb, e.yb + .01, zB - .18], [e.xt, e.yt + .01, zB - .18], [e.xt, e.yt + .01, zA + .18], 9, [e.dir * sgn, 0, 0]);
      // landing plates
      hq(OP, Math.min(e.xb, e.xb - sgn * 1.1), zA + .1, Math.max(e.xb, e.xb - sgn * 1.1), zB - .1, e.yb + .012, 4, [.5, .5, .52]);
      hq(OP, Math.min(e.xt, e.xt + sgn * 1.1), zA + .1, Math.max(e.xt, e.xt + sgn * 1.1), zB - .1, e.yt + .012, 4, [.5, .5, .52]);
      // truss body
      var inc = function (zl, zr, top, bot, m, col) {
        var xa = e.xb - sgn * .6, xb = e.xt + sgn * .6, ya = e.yb, yb = e.yt;
        var a0 = [xa, ya + top, zl], a1 = [xa, ya + top, zr], b0 = [xb, yb + top, zl], b1 = [xb, yb + top, zr];
        var c0 = [xa, ya - bot, zl], c1 = [xa, ya - bot, zr], d0 = [xb, yb - bot, zl], d1 = [xb, yb - bot, zr];
        quad(OP, c0, d0, b0, a0, m, col); quad(OP, c1, a1, b1, d1, m, col); quad(OP, c0, c1, d1, d0, m, col); quad(OP, a0, b0, b1, a1, m, col);
      };
      inc(zA, zB, -.02, 1.0, 4, [.68, .69, .71]);
      // skirts
      inc(zA + .02, zA + .18, .18, 0, 4, [.8, .8, .82]); inc(zB - .18, zB - .02, .18, 0, 4, [.8, .8, .82]);
      // glass balustrades + handrails
      [zA + .1, zB - .1].forEach(function (zz) {
        var xa = e.xb - sgn * .9, xb = e.xt + sgn * .9;
        quad(TR, [xa, e.yb + .18, zz], [xb, e.yt + .18, zz], [xb, e.yt + .98, zz], [xa, e.yb + .98, zz], 3, [.86, .95, .93]);
        var hrA = [xa, e.yb + 1.0], hrB = [xb, e.yt + 1.0];
        quad(OP, [hrA[0], hrA[1], zz - .045], [hrB[0], hrB[1], zz - .045], [hrB[0], hrB[1], zz + .045], [hrA[0], hrA[1], zz + .045], 11, DARK);
        quad(OP, [hrA[0], hrA[1] - .07, zz - .045], [hrB[0], hrB[1] - .07, zz - .045], [hrB[0], hrB[1], zz - .045], [hrA[0], hrA[1], zz - .045], 11, DARK);
        quad(OP, [hrA[0], hrA[1] - .07, zz + .045], [hrB[0], hrB[1] - .07, zz + .045], [hrB[0], hrB[1], zz + .045], [hrA[0], hrA[1], zz + .045], 11, DARK);
        box(OP, Math.min(xa, xa - sgn * .25), e.yb, zz - .05, Math.max(xa, xa - sgn * .25), e.yb + 1.0, zz + .05, 4, STEEL);
        box(OP, Math.min(xb, xb + sgn * .25), e.yt, zz - .05, Math.max(xb, xb + sgn * .25), e.yt + 1.0, zz + .05, 4, STEEL);
      });
    });

    // ---------- atrium skylight ----------
    var RY = 11 + CEIL;
    [[16, -6, 80, -6], [16, 6, 80, 6], [16, -6, 16, 6], [80, -6, 80, 6]].forEach(function (w) { vq(OP, w[0], w[1], w[2], w[3], RY, RY + 1.4, 1, [.96, .95, .93]); });
    hq(OP, 14, -8, 82, 8, RY + 2.6, 8, [1, 1, 1]);
    vq(OP, 16, -6, 80, -6, RY + 1.4, RY + 2.6, 8, [1, 1, 1]); vq(OP, 16, 6, 80, 6, RY + 1.4, RY + 2.6, 8, [1, 1, 1]);
    for (var bx = 16; bx <= 80; bx += 4) { box(OP, bx - .08, RY + 1.3, -6, bx + .08, RY + 1.55, 6, 4, [.88, .89, .9]); }
    for (var bz = -6; bz <= 6; bz += 3) { box(OP, 16, RY + 1.36, bz - .06, 80, RY + 1.5, bz + .06, 4, [.88, .89, .9]); }

    // ---------- anchors & ends ----------
    // G east: entrance glass + bright outside
    var fyG = 0;
    for (var gz = -6; gz < 6; gz += 2) { vq(TR, 95.6, gz, 95.6, gz + 2, .02, 4.4, 3, [.92, .97, .98]); box(OP, 95.55, 0, gz - .04, 95.68, 4.4, gz + .04, 4, STEEL); }
    box(OP, 95.55, 4.35, -6, 95.7, 4.45, 6, 4, STEEL);
    quad(OP, [97.5, -3, -14], [97.5, -3, 14], [97.5, 9, 14], [97.5, 9, -14], 8, [1.4, 1.4, 1.4]);
    hq(OP, 95.6, -14, 97.6, 14, -.01, 1, [.55, .55, .55]);
    signAt(OP, 95.5, 4.95, 0, -1, 0, 7.6, 1.2, 5, SIGNS.mall);
    // G west: MyMart
    signAt(OP, .4, 3.9, 0, 1, 0, 8, 1.6, 5, SIGNS.mymart); signAt(OP, .4, 1.7, 0, 1, 0, 10, 3.2, 7, POST.market);
    // L1 west/east anchors
    signAt(OP, .4, 5.5 + 3.9, 0, 1, 0, 8, 1.6, 5, SIGNS.kedaibesar); signAt(OP, .4, 5.5 + 1.7, 0, 1, 0, 10, 3.2, 7, POST.dept);
    signAt(OP, 95.6, 5.5 + 3.9, 0, -1, 0, 8, 1.6, 5, SIGNS.pustaka); signAt(OP, 95.6, 5.5 + 1.7, 0, -1, 0, 10, 3.2, 7, POST.books);
    // L2 east cinema
    signAt(OP, 95.6, 11 + 4.2, 0, -1, 0, 9, 1.6, 5, SIGNS.cinema);
    MOVIES.forEach(function (m, i) { signAt(OP, 95.6, 11 + 2.0, -4.5 + i * 3, -1, 0, 2.2, 2.2, 7, m.uv); });
    box(OP, 93.6, 11, -5, 94.6, 12.1, 5, 1, [.2, .18, .2]); box(OP, 93.55, 12.1, -5.05, 94.65, 12.16, 5.05, 10, [.6, .45, .3]);
    // L2 west food court
    signAt(OP, .4, 11 + 4.4, 0, 1, 0, 8, 1.4, 5, SIGNS.selerasign);
    STALLS.forEach(function (st, i) {
      var z0 = -11 + i * 2.75, zc = z0 + 1.375;
      box(OP, .35, 11, z0 + .05, 2.3, 12.05, z0 + 2.7, 4, [.7, .71, .73]);
      box(OP, 2.0, 12.05, z0 + .05, 2.35, 12.1, z0 + 2.7, 10, [.8, .78, .72]);
      signAt(OP, 2.32, 11 + 3.1, zc, 1, 0, 2.6, .58, 5, st.sign);
      signAt(OP, .5, 11 + 2.1, zc, 1, 0, 1.5, 1.5, 7, st.post);
      box(OP, .35, 11, z0, .45 + 1.9, 11 + 3.5, z0 + .05, 1, [.85, .83, .8]);
    });
    for (var tx2 = 5; tx2 <= 13; tx2 += 2.6) { for (var tz2 = -9; tz2 <= 9; tz2 += 2.6) {
      if (Math.abs(tz2) < 1.2) { continue; }
      cyl(OP, tx2, tz2, .5, 11.74, 11.78, 10, [.6, .44, .3], 16, true); cyl(OP, tx2, tz2, .06, 11, 11.74, 4, STEEL, 8);
      for (var st2 = 0; st2 < 4; st2++) { var sa = st2 / 4 * TAU + .4; cyl(OP, tx2 + Math.cos(sa) * .75, tz2 + Math.sin(sa) * .75, .18, 11.42, 11.46, 12, [.85, .3, .2], 10, true); cyl(OP, tx2 + Math.cos(sa) * .75, tz2 + Math.sin(sa) * .75, .03, 11, 11.42, 4, STEEL, 6); }
    } }

    // ---------- G atrium: Deepavali kolam, diyas, kiosks, benches, info ----------
    hq(TR, 31.5, -4.5, 40.5, 4.5, .006, 14, [1, 1, 1], [POST.kolam[0], POST.kolam[1], POST.kolam[0], POST.kolam[3], POST.kolam[2], POST.kolam[3], POST.kolam[2], POST.kolam[1]]);
    for (i = 0; i < 8; i++) {
      var a2 = i / 8 * TAU, dx2 = 36 + Math.cos(a2) * 5.3, dz2 = Math.sin(a2) * 5.3;
      cyl(OP, dx2, dz2, .32, 0, .55, 1, [.62, .32, .18], 14); cyl(OP, dx2, dz2, .4, .55, .66, 1, [.7, .38, .2], 14, true);
      cyl(OP, dx2, dz2, .07, .66, .95, 6, [6, 3.2, .9], 8, true);
    }
    // hanging lights across atrium (L2 fascia height)
    for (var hx = 20; hx <= 78; hx += 4) {
      if ((hx >= 31 && hx <= 37.5) || (hx >= 65 && hx <= 71.5)) { continue; }
      for (var t = 0; t <= 24; t++) {
        var zz = -5.6 + t * 11.2 / 24, sag = 1.3 * (1 - Math.pow((zz) / 5.6, 2)), yy = 10.3 - sag;
        var cc = [[6, 3.2, 1], [6, 1.2, 1.6], [2, 4, 6], [1.5, 5, 2]][(t + hx) % 4];
        box(OP, hx - .06, yy - .1, zz - .06, hx + .06, yy + .02, zz + .06, 6, cc);
      }
    }
    signAt(OP, 48, 13.2, 0, -1, 0, 9, 2.25, 7, POST.deepa); signAt(OP, 48.02, 13.2, 0, 1, 0, 9, 2.25, 7, POST.deepa);
    box(OP, 47.96, 14.35, -4.5, 48.06, 14.42, 4.5, 4, STEEL);
    signAt(OP, 63, 8.6, 6.3, 0, -1, 8, 2, 7, POST.sale);
    // kiosks
    [[66, 3.2, 69, 5.6, 'kiosk1', 1], [66, -5.6, 69, -3.2, 'kiosk2', -1]].forEach(function (kq) {
      box(OP, kq[0], 0, kq[1], kq[2], 1.05, kq[3], 1, [.96, .95, .92]); box(OP, kq[0] - .05, 1.05, kq[1] - .05, kq[2] + .05, 1.1, kq[3] + .05, 10, [.55, .4, .28]);
      [[kq[0] + .1, kq[1] + .1], [kq[2] - .1, kq[1] + .1], [kq[0] + .1, kq[3] - .1], [kq[2] - .1, kq[3] - .1]].forEach(function (p) { box(OP, p[0] - .03, 1.1, p[1] - .03, p[0] + .03, 2.5, p[1] + .03, 4, STEEL); });
      box(OP, kq[0] - .2, 2.5, kq[1] - .2, kq[2] + .2, 2.95, kq[3] + .2, 1, [.96, .95, .92]);
      var zc = kq[5] > 0 ? kq[1] - .21 : kq[3] + .21;
      signAt(OP, (kq[0] + kq[2]) / 2, 2.72, zc, 0, -kq[5], 2.8, .42, 5, SIGNS[kq[4]]);
      for (var p2 = 0; p2 < 8; p2++) { box(OP, kq[0] + .2 + p2 * .33, 1.1, kq[1] + 1, kq[0] + .45 + p2 * .33, 1.3, kq[1] + 1.4, 12, hexRGB(COLORS[p2 % COLORS.length])); }
    });
    // benches
    [[30, 8.8], [42, 8.8], [30, -8.8], [42, -8.8], [74, 8.8], [74, -8.8]].forEach(function (b) {
      box(OP, b[0] - 1, .38, b[1] - .3, b[0] + 1, .45, b[1] + .3, 10, [.58, .42, .28]);
      box(OP, b[0] - .9, 0, b[1] - .25, b[0] - .8, .38, b[1] + .25, 4, STEEL); box(OP, b[0] + .8, 0, b[1] - .25, b[0] + .9, .38, b[1] + .25, 4, STEEL);
    });
    // directory pylon + info counter
    box(OP, 86, 0, 7.2, 87.2, 2.6, 8.4, 11, [.15, .2, .2]);
    signAt(OP, 86.6, 1.35, 7.18, 0, -1, 1.0, 2.0, 7, POST.dir);
    signAt(OP, 85.98, 1.35, 7.8, -1, 0, 1.0, 2.0, 7, POST.dir);
    box(OP, 90.5, 0, -9.6, 93.5, 1.1, -7.8, 1, [.94, .93, .9]); box(OP, 90.45, 1.1, -9.65, 93.55, 1.16, -7.75, 10, [.55, .4, .28]);
    signAt(OP, 92, 2.6, -10.88, 0, 1, 3.6, .8, 5, SIGNS.info);
  }
  function hexRGB(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  // make every triangle's winding agree with its shading normal (cylinders and a few boxes were wound inward)
  function fixWinding(arr) {
    for (var t = 0; t < arr.length; t += ST * 3) {
      var a = t, b = t + ST, c = t + 2 * ST;
      var ux = arr[b] - arr[a], uy = arr[b + 1] - arr[a + 1], uz = arr[b + 2] - arr[a + 2], vx = arr[c] - arr[a], vy = arr[c + 1] - arr[a + 1], vz = arr[c + 2] - arr[a + 2];
      var fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      var nx = arr[a + 3] + arr[b + 3] + arr[c + 3], ny = arr[a + 4] + arr[b + 4] + arr[c + 4], nz = arr[a + 5] + arr[b + 5] + arr[c + 5];
      if (fx * nx + fy * ny + fz * nz < 0) { for (var k = 0; k < ST; k++) { var tmp = arr[b + k]; arr[b + k] = arr[c + k]; arr[c + k] = tmp; } }
    }
  }
  root.MALL = { build: function () { buildAtlases(); buildMall(); fixWinding(OP); fixWinding(TR); return { OP: OP, TR: TR }; }, ST: ST, A: A, B: B, UNITS: UNITS, SIGNS: SIGNS, POST: POST, STALLS: STALLS, STALL_ITEMS: STALL_ITEMS, MOVIES: MOVIES, PROD: PROD, CATNAME: CATNAME, DESC: DESC, COLORS: COLORS, SHOPS: SHOPS, LV: LV, CEIL: CEIL, ESC: ESC, BRIDGES: BRIDGES, walkAt: walkAt, shade: shade, hexRGB: hexRGB, V: V };
})(typeof window !== 'undefined' ? window : globalThis);
