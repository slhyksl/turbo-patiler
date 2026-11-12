'use strict';
/* =========================================================
   TURBO PATİLER — dünyalar, karakterler ve çizimler
   ========================================================= */
const BIOME_LEN = 1000;
const BIOMES = [
  { tie: '#7a5236', rail: '#dfe6ec', id: 'mahalle', name: 'Neşeli Mahalle', sky: ['#3fa9f5', '#c4ecff'], ground: ['#86d16f', '#78c463'], road: ['#80838f', '#767985'], line: '#ffffff', curb: ['#ff4d4d', '#ffffff'], mount: ['#a6dba6', '#72c276'], sun: 'sun', decor: ['house', 'tree', 'tree', 'lamp', 'bush', 'house'], bar: ['#ff4d4d', '#ffffff'], train: ['#ffc93c', '#ff6b4a', '#a8ecff'], ramp: ['#8fa3ad', '#b6c6ce'], fx: null, key: 0 },
  { tie: '#6b3f26', rail: '#ffffff', id: 'seker', name: 'Şeker Diyarı', sky: ['#ff8fd0', '#ffe3f3'], ground: ['#ffb8dc', '#ffa8d3'], road: ['#b18cff', '#a37cf6'], line: '#fff59d', curb: ['#ff3f8e', '#ffffff'], mount: ['#ffc8e2', '#f78fbf'], sun: 'sun', decor: ['lolly', 'cane', 'cupcake', 'gumdrop', 'lolly'], bar: ['#ff3f8e', '#fff59d'], train: ['#8b5a3c', '#ff8fbf', '#fff3c4'], ramp: ['#f48fb1', '#ffd3e6'], fx: 'sprinkles', key: 3 },
  { tie: '#5d4030', rail: '#e0d4c8', id: 'orman', name: 'Vahşi Orman', sky: ['#22b8cf', '#dcf3c8'], ground: ['#3f9b45', '#368c3c'], road: ['#b08a6e', '#a37e63'], line: '#fff1d6', curb: ['#6d4c41', '#c49a7a'], mount: ['#62bb68', '#2f7d34'], sun: 'sun', decor: ['palm', 'bush', 'mushroom', 'palm', 'rock2'], bar: ['#7a4e2d', '#ffd08a'], train: ['#7a4e2d', '#9be08f', '#d7ffd0'], ramp: ['#8d6e63', '#b39a8c'], fx: 'leaves', key: -2 },
  { tie: '#4f9ad0', rail: '#ffffff', id: 'buz', name: 'Buz Ülkesi', sky: ['#6ccaf5', '#eef9ff'], ground: ['#ffffff', '#eaf4fb'], road: ['#9fd2f7', '#91c6ee'], line: '#ffffff', curb: ['#36b4ef', '#ffffff'], mount: ['#e6f3ff', '#b9dcf7'], sun: 'sun', decor: ['pine', 'crystal', 'snowman', 'pine'], bar: ['#1ea7e8', '#ffffff'], train: ['#3bb3f0', '#e3f6ff', '#ffffff'], ramp: ['#8fd3f7', '#d6f0fd'], fx: 'snow', key: 5 },
  { tie: '#3a2f8a', rail: '#00e5ff', id: 'uzay', name: 'Galaksi Yolu', sky: ['#070028', '#3a1180'], ground: ['#2b1a66', '#24155a'], road: ['#1b1b45', '#232358'], line: '#00e5ff', curb: ['#00e5ff', '#ff3df2'], mount: ['#4b2c94', '#36207a'], sun: 'planet', decor: ['spire', 'dish', 'crystal2', 'spire'], bar: ['#ff3df2', '#00e5ff'], train: ['#d0d8e0', '#7c4dff', '#00e5ff'], ramp: ['#7c4dff', '#b39dff'], fx: 'stars', key: -4 },
  { tie: '#241512', rail: '#ffab40', id: 'lav', name: 'Lav Dağı', sky: ['#3d0b0b', '#ff7a45'], ground: ['#3e2723', '#352019'], road: ['#5d4037', '#553a31'], line: '#ffab40', curb: ['#ff3d00', '#ffab40'], mount: ['#6d2c1c', '#4a1a10'], sun: 'redsun', decor: ['rock', 'geyser', 'deadtree', 'rock'], bar: ['#ff3d00', '#2a2a2a'], train: ['#4a4a4a', '#ff6d00', '#ffcc80'], ramp: ['#6d4c41', '#8d6e63'], fx: 'embers', key: 2 },
];
function hex2rgb(h) { h = h.replace('#', ''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hex(c) { return '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shadeHex(hex, amt) { const c = hex2rgb(hex), t = amt < 0 ? 0 : 255, p = Math.abs(amt); return rgb2hex([c[0] + (t - c[0]) * p, c[1] + (t - c[1]) * p, c[2] + (t - c[2]) * p]); }
const _shc = new Map();
function shade(hex, amt) { const k = hex + amt; let v = _shc.get(k); if (!v) { v = shadeHex(hex, amt); _shc.set(k, v); } return v; }

const CKEYS = ['tie', 'rail', 'sky0', 'sky1', 'ground0', 'ground1', 'road0', 'road1', 'line', 'curb0', 'curb1', 'mount0', 'mount1', 'bar0', 'bar1', 'train0', 'train1', 'train2', 'ramp0', 'ramp1', 'trainSide', 'trainRoof', 'rampSide', 'roadEdge'];
BIOMES.forEach(b => {
  const src = {
    tie: b.tie, rail: b.rail, sky0: b.sky[0], sky1: b.sky[1], ground0: b.ground[0], ground1: b.ground[1], road0: b.road[0], road1: b.road[1], line: b.line,
    curb0: b.curb[0], curb1: b.curb[1], mount0: b.mount[0], mount1: b.mount[1], bar0: b.bar[0], bar1: b.bar[1],
    train0: b.train[0], train1: b.train[1], train2: b.train[2], ramp0: b.ramp[0], ramp1: b.ramp[1],
    trainSide: shadeHex(b.train[0], -0.22), trainRoof: shadeHex(b.train[0], 0.18), rampSide: shadeHex(b.ramp[0], -0.3), roadEdge: shadeHex(b.road[0], -0.25)
  };
  b.rgb = {}; b.css = { b: b, t: 0 };
  for (const k of CKEYS) { b.rgb[k] = hex2rgb(src[k]); b.css[k] = src[k]; }
});
const PAL_BLEND = 90;
const palCache = new Map();
function palReset() { palCache.clear(); }
function biomeAt(z) { return BIOMES[Math.floor(Math.max(0, z) / BIOME_LEN) % BIOMES.length]; }
function palAt(z) {
  z = Math.max(0, z); const key = Math.floor(z / 3); let p = palCache.get(key); if (p) return p;
  const n = Math.floor(z / BIOME_LEN), local = z - n * BIOME_LEN;
  const A = BIOMES[n % BIOMES.length], B = BIOMES[(n + 1) % BIOMES.length];
  let t = 0; if (local > BIOME_LEN - PAL_BLEND) { t = (local - (BIOME_LEN - PAL_BLEND)) / PAL_BLEND; t = t * t * (3 - 2 * t); }
  if (t <= 0) p = A.css;
  else {
    p = { b: t < 0.5 ? A : B, t };
    for (const k of CKEYS) { const a = A.rgb[k], c = B.rgb[k]; p[k] = `rgb(${(a[0] + (c[0] - a[0]) * t) | 0},${(a[1] + (c[1] - a[1]) * t) | 0},${(a[2] + (c[2] - a[2]) * t) | 0})`; }
  }
  palCache.set(key, p); return p;
}

/* ---------- çizim yardımcıları ---------- */
const TAU = Math.PI * 2;
function circ(c, x, y, r, f) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); c.fillStyle = f; c.fill(); }
function ell(c, x, y, rx, ry, f, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); c.fillStyle = f; c.fill(); }
function ellS(c, x, y, rx, ry, f, rot) { ell(c, x, y, rx, ry, f, rot); c.stroke(); }
function poly(c, p, f, stroke) { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fillStyle = f; c.fill(); if (stroke) c.stroke(); }
function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function quad(c, a, b, d, e, f) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.fillStyle = f; c.fill(); }
function oline(c, w, col, oc, draw) { c.lineWidth = w * 1.45; c.strokeStyle = oc; draw(); c.stroke(); c.lineWidth = w; c.strokeStyle = col; draw(); c.stroke(); }
const CH_OL = '#2a1d4f';
function shEll(c, x, y, rx, ry, col) {
  const g = c.createRadialGradient(x - rx * 0.35, y - ry * 0.4, Math.max(0.1, rx * 0.08), x, y, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.2));
  c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); c.fillStyle = g; c.fill(); c.stroke();
}
const RAINBOW = ['#ff5252', '#ffab40', '#ffeb3b', '#69f0ae', '#40c4ff', '#b388ff'];

/* =========================================================
   KARAKTERLER
   ========================================================= */
const CHARS = [
  { id: 'minnos', name: 'Minnoş', kind: 'cat', body: '#ff9f43', belly: '#ffe2bf', ear: 'cat', tail: 'cat', acc: null, price: {}, perk: {}, desc: 'Turuncu, cesur ve hızlı!' },
  { id: 'karabas', name: 'Karabaş', kind: 'dog', body: '#a06a45', belly: '#f0cfa8', ear: 'dog', tail: 'dog', acc: 'collar', price: { coins: 1500 }, perk: { coin: 0.05 }, desc: 'Sadık dost · +%5 altın' },
  { id: 'pamuk', name: 'Pamuk', kind: 'bunny', body: '#fafafa', belly: '#ffe3ef', ear: 'bunny', tail: 'puff', acc: 'bow', price: { coins: 3000 }, perk: { jump: 0.12 }, desc: 'Zıp zıp! Daha yükseğe zıplar' },
  { id: 'bambu', name: 'Bambu', kind: 'panda', body: '#fafafa', belly: '#ffffff', dark: '#2d2d35', ear: 'round', tail: 'puff', acc: null, price: { coins: 5000 }, perk: { score: 0.1 }, desc: 'Sakin panda · +%10 puan' },
  { id: 'kivilcim', name: 'Kıvılcım', kind: 'fox', body: '#ff7a2f', belly: '#ffffff', ear: 'fox', tail: 'fox', acc: 'scarf', price: { coins: 8000 }, perk: { power: 1.5 }, desc: 'Kurnaz tilki · Güçler +1,5 sn' },
  { id: 'buzbuz', name: 'Buzbuz', kind: 'bear', body: '#eaf5ff', belly: '#cfe6ff', ear: 'round', tail: 'puff', acc: 'beanie', price: { coins: 12000 }, perk: { coin: 0.1 }, desc: 'Kutup ayısı · +%10 altın' },
  { id: 'ninja', name: 'Ninja Kedi', kind: 'cat', body: '#3a3d5c', belly: '#5d6185', ear: 'cat', tail: 'cat', acc: 'headband', price: { gems: 20 }, perk: { score: 0.15 }, desc: 'Gölge gibi! · +%15 puan' },
  { id: 'robo', name: 'Robo Pati', kind: 'robot', body: '#a7b4c2', belly: '#e1e8ef', ear: 'antenna', tail: 'cable', acc: null, price: { gems: 35 }, perk: { power: 2.5 }, desc: 'Bip bop! · Güçler +2,5 sn' },
  { id: 'dino', name: 'Dino Ejder', kind: 'dino', body: '#5ccc5c', belly: '#dcf7a8', ear: 'spikes', tail: 'dino', acc: null, price: { level: 8 }, perk: { coin: 0.15 }, desc: 'Seviye 8\'de açılır · +%15 altın' },
  { id: 'unicorn', name: 'Gökkuşağı', kind: 'unicorn', body: '#ffffff', belly: '#ffeaf7', ear: 'horse', tail: 'rainbow', acc: 'horn', price: { gems: 60 }, perk: { score: 0.2, coin: 0.1 }, desc: 'Sihirli! · +%20 puan +%10 altın' },
  { id: 'altin', name: 'Altın Pati', kind: 'cat', body: '#ffd23f', belly: '#fff4b8', ear: 'cat', tail: 'cat', acc: 'crown', price: { level: 15 }, perk: { coin: 0.25, score: 0.1 }, desc: 'Efsane! Seviye 15 · +%25 altın' },
];
const CHAR_BY = {}; CHARS.forEach(c => CHAR_BY[c.id] = c);

function petEars(c, ch, x, hy, u, t, behind) {
  const e = ch.ear, b = ch.body, inner = '#ffb3c7';
  if (behind) {
    if (e === 'cat' || e === 'fox') {
      const k = e === 'fox' ? 1.15 : 1;
      for (const s of [-1, 1]) {
        const p = [x + s * u * 0.56 * k, hy - u * 0.1, x + s * u * 0.47 * k, hy - u * 0.8 * k, x + s * u * 0.1, hy - u * 0.5];
        poly(c, p, b, true);
        const cx = (p[0] + p[2] + p[4]) / 3, cy = (p[1] + p[3] + p[5]) / 3, q = [];
        for (let i = 0; i < 6; i += 2) { q.push(lerp(p[i], cx, 0.45), lerp(p[i + 1], cy, 0.45)); }
        poly(c, q, e === 'fox' ? '#ffffff' : (ch.kind === 'cat' && ch.id === 'ninja' ? '#e05a7a' : inner));
        if (e === 'fox') { poly(c, [lerp(p[2], p[0], 0.25), lerp(p[3], p[1], 0.25), p[2], p[3], lerp(p[2], p[4], 0.25), lerp(p[3], p[5], 0.25)], '#3a2a2a'); }
      }
    } else if (e === 'bunny') {
      for (const s of [-1, 1]) { ellS(c, x + s * u * 0.25, hy - u * 0.9, u * 0.15, u * 0.46, b, s * 0.15); ell(c, x + s * u * 0.25, hy - u * 0.88, u * 0.07, u * 0.34, inner, s * 0.15); }
    } else if (e === 'round') {
      const ec = ch.kind === 'panda' ? ch.dark : b;
      for (const s of [-1, 1]) { ellS(c, x + s * u * 0.46, hy - u * 0.42, u * 0.2, u * 0.2, ec); if (ch.kind !== 'panda') circ(c, x + s * u * 0.46, hy - u * 0.42, u * 0.1, ch.belly === '#cfe6ff' ? '#b8d8ff' : inner); }
    } else if (e === 'horse') {
      for (const s of [-1, 1]) { poly(c, [x + s * u * 0.44, hy - u * 0.28, x + s * u * 0.42, hy - u * 0.78, x + s * u * 0.16, hy - u * 0.48], b, true); poly(c, [x + s * u * 0.39, hy - u * 0.36, x + s * u * 0.39, hy - u * 0.66, x + s * u * 0.24, hy - u * 0.48], inner); }
    } else if (e === 'antenna') {
      c.save(); c.lineWidth = u * 0.06; c.strokeStyle = '#5b6b7a'; c.beginPath(); c.moveTo(x, hy - u * 0.48); c.lineTo(x, hy - u * 0.86); c.stroke(); c.restore();
      circ(c, x, hy - u * 0.9, u * 0.1, Math.sin(t * 5) > 0 ? '#ff5252' : '#ffeb3b');
      for (const s of [-1, 1]) ellS(c, x + s * u * 0.62, hy, u * 0.1, u * 0.2, '#7d8b99');
    } else if (e === 'spikes') {
      for (const i of [-1, 0, 1]) { const ox = x + i * u * 0.24, oy = hy - u * 0.46 + Math.abs(i) * u * 0.08; poly(c, [ox - u * 0.12, oy, ox, oy - u * 0.3, ox + u * 0.12, oy], shade(b, -0.25), true); }
    }
  } else if (e === 'dog') {
    for (const s of [-1, 1]) ellS(c, x + s * u * 0.58, hy + u * 0.04, u * 0.17, u * 0.36, shade(b, -0.28), s * 0.35);
  }
}

function petFace(c, ch, x, hy, u, t, blink) {
  const k = ch.kind;
  if (k === 'robot') {
    c.fillStyle = '#1d2733'; rr(c, x - u * 0.46, hy - u * 0.24, u * 0.92, u * 0.44, u * 0.16); c.fill();
    c.fillStyle = '#4dfcff';
    if (!blink) { rr(c, x - u * 0.32, hy - u * 0.14, u * 0.18, u * 0.22, u * 0.07); c.fill(); rr(c, x + u * 0.14, hy - u * 0.14, u * 0.18, u * 0.22, u * 0.07); c.fill(); }
    else { c.fillRect(x - u * 0.32, hy - u * 0.02, u * 0.18, u * 0.04); c.fillRect(x + u * 0.14, hy - u * 0.02, u * 0.18, u * 0.04); }
    c.save(); c.lineWidth = u * 0.05; c.strokeStyle = '#33414f'; c.beginPath(); c.arc(x, hy + u * 0.22, u * 0.12, 0.3, Math.PI - 0.3); c.stroke(); c.restore();
    return;
  }
  if (k === 'panda') { ell(c, x - u * 0.24, hy + u * 0.03, u * 0.17, u * 0.21, ch.dark, 0.5); ell(c, x + u * 0.24, hy + u * 0.03, u * 0.17, u * 0.21, ch.dark, -0.5); }
  if (k === 'fox') { ell(c, x - u * 0.24, hy + u * 0.24, u * 0.27, u * 0.2, '#ffffff', 0.3); ell(c, x + u * 0.24, hy + u * 0.24, u * 0.27, u * 0.2, '#ffffff', -0.3); }
  if (k === 'dog' || k === 'bear' || k === 'unicorn') ell(c, x, hy + u * 0.25, u * 0.24, u * 0.16, ch.belly);
  if (k === 'dino') ell(c, x, hy + u * 0.23, u * 0.3, u * 0.18, ch.belly);
  const ey = hy + u * 0.02, ex = u * 0.23;
  for (const s of [-1, 1]) {
    const X = x + s * ex;
    if (blink) { c.save(); c.lineWidth = u * 0.05; c.strokeStyle = '#2b2233'; c.beginPath(); c.arc(X, ey - u * 0.02, u * 0.09, 0.25, Math.PI - 0.25); c.stroke(); c.restore(); }
    else {
      ell(c, X, ey, u * 0.115, u * 0.145, k === 'panda' ? '#151520' : '#2b2233');
      if (ch.id === 'ninja') ell(c, X, ey + u * 0.02, u * 0.07, u * 0.09, '#ffd23f');
      circ(c, X + u * 0.04, ey - u * 0.055, u * 0.048, '#fff'); circ(c, X - u * 0.03, ey + u * 0.05, u * 0.022, '#fff');
    }
  }
  if (k !== 'panda') { ell(c, x - u * 0.4, hy + u * 0.2, u * 0.09, u * 0.055, 'rgba(255,100,140,0.5)'); ell(c, x + u * 0.4, hy + u * 0.2, u * 0.09, u * 0.055, 'rgba(255,100,140,0.5)'); }
  const ny = hy + u * 0.17;
  c.save(); c.lineWidth = u * 0.04; c.strokeStyle = '#3a2a2a';
  if (k === 'cat' || k === 'bunny') {
    poly(c, [x - u * 0.05, ny - u * 0.025, x + u * 0.05, ny - u * 0.025, x, ny + u * 0.035], '#ff7aa2');
    c.beginPath(); c.arc(x - u * 0.055, ny + u * 0.045, u * 0.055, 0, Math.PI); c.stroke();
    c.beginPath(); c.arc(x + u * 0.055, ny + u * 0.045, u * 0.055, 0, Math.PI); c.stroke();
  } else if (k === 'dino' || k === 'unicorn') {
    circ(c, x - u * 0.07, ny + u * 0.02, u * 0.03, k === 'unicorn' ? '#ff8fbf' : '#2f6b2f'); circ(c, x + u * 0.07, ny + u * 0.02, u * 0.03, k === 'unicorn' ? '#ff8fbf' : '#2f6b2f');
    c.beginPath(); c.arc(x, ny + u * 0.06, u * 0.12, 0.35, Math.PI - 0.35); c.stroke();
  } else {
    ell(c, x, ny, u * 0.08, u * 0.055, '#2b2233');
    c.beginPath(); c.moveTo(x, ny + u * 0.05); c.lineTo(x, ny + u * 0.09); c.stroke();
    c.beginPath(); c.arc(x - u * 0.06, ny + u * 0.09, u * 0.06, 0, Math.PI * 0.9); c.stroke();
    c.beginPath(); c.arc(x + u * 0.06, ny + u * 0.09, u * 0.06, Math.PI * 0.1, Math.PI); c.stroke();
    if (k === 'dog') ell(c, x, ny + u * 0.19, u * 0.05, u * 0.06, '#ff6f91');
  }
  c.restore();
}

function petHeadAcc(c, ch, x, hy, u, t, back) {
  switch (ch.acc) {
    case 'bow': { const bx = x + u * 0.34, by = hy - u * 0.5; poly(c, [bx, by, bx - u * 0.22, by - u * 0.14, bx - u * 0.22, by + u * 0.14], '#ff5fa2', true); poly(c, [bx, by, bx + u * 0.22, by - u * 0.14, bx + u * 0.22, by + u * 0.14], '#ff5fa2', true); circ(c, bx, by, u * 0.07, '#ff2d87'); break; }
    case 'beanie': {
      c.fillStyle = '#3d7bff'; c.beginPath(); c.ellipse(x, hy - u * 0.18, u * 0.64, u * 0.52, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffd23f'; rr(c, x - u * 0.66, hy - u * 0.26, u * 1.32, u * 0.17, u * 0.08); c.fill(); c.stroke();
      circ(c, x, hy - u * 0.72, u * 0.14, '#ffffff'); break;
    }
    case 'headband': {
      c.save(); c.beginPath(); c.ellipse(x, hy, u * 0.62, u * 0.58, 0, 0, TAU); c.clip(); c.fillStyle = '#e53935'; c.fillRect(x - u, hy - u * 0.38, u * 2, u * 0.15); c.restore();
      const w = Math.sin(t * 9) * u * 0.06, sx = back ? x : x + u * 0.58;
      c.fillStyle = '#e53935';
      c.beginPath(); c.moveTo(sx, hy - u * 0.3); c.quadraticCurveTo(sx + u * 0.3, hy - u * 0.2 + w, sx + u * 0.5, hy + w * 2); c.lineTo(sx + u * 0.42, hy + u * 0.06 + w * 2); c.quadraticCurveTo(sx + u * 0.22, hy - u * 0.12, sx, hy - u * 0.24); c.fill();
      c.beginPath(); c.moveTo(sx, hy - u * 0.3); c.quadraticCurveTo(sx + u * 0.2, hy - u * 0.05 - w, sx + u * 0.2, hy + u * 0.25 - w); c.lineTo(sx + u * 0.12, hy + u * 0.25 - w); c.quadraticCurveTo(sx + u * 0.12, hy, sx, hy - u * 0.24); c.fill();
      if (back) circ(c, x, hy - u * 0.3, u * 0.08, '#b71c1c');
      break;
    }
    case 'horn': {
      if (!back) { poly(c, [x - u * 0.1, hy - u * 0.48, x + u * 0.1, hy - u * 0.48, x, hy - u * 1.02], '#ffd54f', true); c.save(); c.lineWidth = u * 0.03; c.strokeStyle = '#f59e0b'; for (let i = 1; i < 4; i++) { const yy = hy - u * 0.48 - i * u * 0.13; c.beginPath(); c.moveTo(x - u * 0.09 * (1 - i * 0.22), yy + u * 0.03); c.lineTo(x + u * 0.09 * (1 - i * 0.22), yy - u * 0.03); c.stroke(); } c.restore(); }
      else poly(c, [x - u * 0.07, hy - u * 0.5, x + u * 0.07, hy - u * 0.5, x, hy - u * 0.85], '#ffd54f', true);
      for (let i = 0; i < 6; i++) { const a = -2.3 + i * 0.28; const r = u * 0.58; circ(c, x + Math.cos(a) * r * (back ? 0.2 : 1) + (back ? 0 : 0), hy + Math.sin(a) * r + (back ? i * u * 0.12 : 0), u * 0.13, RAINBOW[i]); }
      break;
    }
    case 'crown': {
      const cy = hy - u * 0.5, w = u * 0.3;
      poly(c, [x - w, cy, x - w, cy - u * 0.28, x - w * 0.5, cy - u * 0.12, x, cy - u * 0.34, x + w * 0.5, cy - u * 0.12, x + w, cy - u * 0.28, x + w, cy], '#ffcc00', true);
      circ(c, x, cy - u * 0.1, u * 0.05, '#ff1744'); circ(c, x - w * 0.6, cy - u * 0.07, u * 0.035, '#2979ff'); circ(c, x + w * 0.6, cy - u * 0.07, u * 0.035, '#00e676'); break;
    }
  }
}

function petNeckAcc(c, ch, x, by, u, t) {
  if (ch.acc === 'collar') { c.save(); c.lineWidth = u * 0.09; c.strokeStyle = '#e53935'; c.beginPath(); c.ellipse(x, by - u * 0.32, u * 0.3, u * 0.08, 0, 0.1, Math.PI - 0.1); c.stroke(); c.restore(); circ(c, x, by - u * 0.2, u * 0.07, '#ffd54f'); }
  if (ch.acc === 'scarf') {
    c.fillStyle = '#e53935'; rr(c, x - u * 0.36, by - u * 0.42, u * 0.72, u * 0.15, u * 0.07); c.fill(); c.stroke();
    const w = Math.sin(t * 6) * u * 0.05; c.fillStyle = '#e53935'; rr(c, x + u * 0.1, by - u * 0.32, u * 0.14, u * 0.32 + w, u * 0.05); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(x + u * 0.1, by - u * 0.12 + w, u * 0.14, u * 0.04);
  }
}

function petTailFront(c, ch, x, by, u, t) {
  const ol = CH_OL, wag = Math.sin(t * 5) * 0.18;
  c.save(); c.translate(x + u * 0.32, by + u * 0.12); c.rotate(wag);
  switch (ch.tail) {
    case 'cat': oline(c, u * 0.1, ch.body, ol, () => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(u * 0.5, -u * 0.02, u * 0.4, -u * 0.5); }); break;
    case 'dog': oline(c, u * 0.1, shade(ch.body, -0.15), ol, () => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(u * 0.3, -u * 0.05, u * 0.32, -u * 0.32); }); break;
    case 'fox': ellS(c, u * 0.32, -u * 0.18, u * 0.4, u * 0.19, ch.body, -0.8); ell(c, u * 0.56, -u * 0.47, u * 0.15, u * 0.1, '#fff', -0.8); break;
    case 'dino': poly(c, [0, -u * 0.12, u * 0.62, u * 0.08, 0, u * 0.16], ch.body, true); break;
    case 'cable': c.lineWidth = u * 0.05; c.strokeStyle = '#37474f'; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(u * 0.3, u * 0.2, u * 0.4, -u * 0.3, u * 0.55, -u * 0.1); c.stroke(); circ(c, u * 0.57, -u * 0.1, u * 0.06, '#ffca28'); break;
    case 'rainbow': for (let i = 0; i < 5; i++) { c.lineWidth = u * 0.07; c.strokeStyle = RAINBOW[i]; c.beginPath(); c.moveTo(0, i * u * 0.03); c.quadraticCurveTo(u * 0.45, -u * 0.05 + i * u * 0.05, u * 0.38, -u * 0.45 + i * u * 0.06); c.stroke(); } break;
    case 'puff': circ(c, u * 0.08, u * 0.02, u * 0.13, ch.kind === 'panda' ? '#2d2d35' : '#ffffff'); break;
  }
  c.restore();
}

/* Karakter önden (menü/mağaza) */
function drawPetFront(c, ch, x, y, H, t) {
  const u = H / 2.15, bob = Math.sin(t * 3.2) * u * 0.035, blink = (t % 3.4) > 3.24;
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = Math.max(1.4, u * 0.045); c.strokeStyle = CH_OL;
  ell(c, x, y, u * 0.6, u * 0.1, 'rgba(0,0,0,0.22)');
  const by = y - u * 0.48 + bob, hy = y - u * 1.22 + bob;
  petTailFront(c, ch, x, by, u, t);
  const footC = ch.kind === 'panda' ? ch.dark : shade(ch.body, -0.1);
  ellS(c, x - u * 0.2, y - u * 0.07, u * 0.16, u * 0.1, footC); ellS(c, x + u * 0.2, y - u * 0.07, u * 0.16, u * 0.1, footC);
  shEll(c, x, by, u * 0.42, u * 0.42, ch.body);
  ell(c, x, by + u * 0.07, u * 0.27, u * 0.28, ch.belly);
  if (ch.kind === 'robot') { c.fillStyle = '#4dd0e1'; rr(c, x - u * 0.13, by - u * 0.06, u * 0.26, u * 0.16, u * 0.04); c.fill(); circ(c, x, by + u * 0.2, u * 0.05, Math.sin(t * 4) > 0 ? '#ff5252' : '#69f0ae'); }
  if (ch.kind === 'dino') for (let i = 0; i < 3; i++) ell(c, x, by - u * 0.1 + i * u * 0.13, u * 0.2 - i * u * 0.02, u * 0.025, shade(ch.belly, -0.12));
  const w = Math.sin(t * 4) * 0.3, armC = ch.kind === 'panda' ? ch.dark : ch.body;
  ellS(c, x - u * 0.42, by - u * 0.02, u * 0.1, u * 0.2, armC, 0.6 + w * 0.3);
  ellS(c, x + u * 0.43, by - u * 0.1, u * 0.1, u * 0.2, armC, -0.9 - w);
  petNeckAcc(c, ch, x, by, u, t);
  petEars(c, ch, x, hy, u, t, true);
  if (ch.kind === 'robot') { c.fillStyle = ch.body; rr(c, x - u * 0.6, hy - u * 0.52, u * 1.2, u * 1.0, u * 0.3); c.fill(); c.stroke(); }
  else shEll(c, x, hy, u * 0.62, u * 0.58, ch.body);
  petEars(c, ch, x, hy, u, t, false);
  petFace(c, ch, x, hy, u, t, blink);
  petHeadAcc(c, ch, x, hy, u, t, false);
  c.restore();
}

/* Karakter arkadan (oyun içi) */
function drawPetBack(c, ch, x, y, s, A) {
  const u = s * 0.78, t = A.t;
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = Math.max(1, u * 0.05); c.strokeStyle = CH_OL;
  if (A.rot) c.rotate(A.rot);
  if (A.mode === 'slide') c.scale(1.2, 0.52);
  const run = A.mode === 'run', air = A.mode === 'jump', ph = A.phase;
  const bob = run ? Math.abs(Math.sin(ph)) * u * 0.08 : 0;
  const by = -u * 0.48 - bob, hy = -u * 1.2 - bob;
  const footC = ch.kind === 'panda' ? ch.dark : shade(ch.body, -0.12);
  if (run) { const a = Math.sin(ph); ellS(c, -u * 0.2, -u * 0.08 - Math.max(0, a) * u * 0.2, u * 0.15, u * 0.11, footC); ellS(c, u * 0.2, -u * 0.08 - Math.max(0, -a) * u * 0.2, u * 0.15, u * 0.11, footC); }
  else if (air) { ellS(c, -u * 0.22, -u * 0.2, u * 0.14, u * 0.1, footC); ellS(c, u * 0.22, -u * 0.16, u * 0.14, u * 0.1, footC); }
  else { ellS(c, -u * 0.2, -u * 0.07, u * 0.15, u * 0.1, footC); ellS(c, u * 0.2, -u * 0.07, u * 0.15, u * 0.1, footC); }
  const sw = run ? Math.sin(ph) * 0.5 : (air ? 1 : 0), armC = ch.kind === 'panda' ? ch.dark : ch.body;
  if (air) { ellS(c, -u * 0.46, by - u * 0.22, u * 0.1, u * 0.21, armC, 2.4); ellS(c, u * 0.46, by - u * 0.22, u * 0.1, u * 0.21, armC, -2.4); }
  else { ellS(c, -u * 0.42, by - u * 0.02 - sw * u * 0.05, u * 0.1, u * 0.2, armC, 0.4 + sw * 0.5); ellS(c, u * 0.42, by - u * 0.02 + sw * u * 0.05, u * 0.1, u * 0.2, armC, -0.4 + sw * 0.5); }
  shEll(c, 0, by, u * 0.42, u * 0.42, ch.body);
  if (ch.kind === 'panda') { c.save(); c.beginPath(); c.ellipse(0, by, u * 0.42, u * 0.42, 0, 0, TAU); c.clip(); c.fillStyle = ch.dark; c.fillRect(-u * 0.5, by - u * 0.45, u, u * 0.24); c.restore(); }
  if (ch.kind === 'fox' || ch.kind === 'cat') ell(c, 0, by - u * 0.05, u * 0.05, u * 0.25, shade(ch.body, -0.08));
  petNeckAcc(c, ch, 0, by, u, t);
  petEars(c, ch, 0, hy, u, t, true);
  if (ch.kind === 'robot') { c.fillStyle = ch.body; rr(c, -u * 0.6, hy - u * 0.52, u * 1.2, u * 1.0, u * 0.3); c.fill(); c.stroke(); for (const s2 of [-1, 1]) circ(c, s2 * u * 0.3, hy + u * 0.25, u * 0.05, '#6b7a89'); c.fillStyle = '#8796a5'; rr(c, -u * 0.25, hy - u * 0.25, u * 0.5, u * 0.35, u * 0.08); c.fill(); }
  else shEll(c, 0, hy, u * 0.6, u * 0.56, ch.body);
  if (ch.ear === 'dog') for (const s2 of [-1, 1]) ellS(c, s2 * u * 0.56, hy + u * 0.06, u * 0.17, u * 0.34, shade(ch.body, -0.28), s2 * 0.3);
  if (ch.kind === 'dino') for (let i = 0; i < 4; i++) { const yy = hy - u * 0.45 + i * u * 0.32; poly(c, [-u * 0.09, yy, 0, yy - u * 0.2, u * 0.09, yy], shade(ch.body, -0.25), true); }
  petHeadAcc(c, ch, 0, hy, u, t, true);
  /* turbo sırt çantası */
  const jy = by - u * 0.1;
  c.fillStyle = '#455a64'; rr(c, -u * 0.25, jy - u * 0.22, u * 0.5, u * 0.42, u * 0.12); c.fill(); c.stroke();
  c.fillStyle = '#ff5252'; c.fillRect(-u * 0.24, jy - u * 0.05, u * 0.48, u * 0.08);
  poly(c, [-u * 0.2, jy + u * 0.2, -u * 0.08, jy + u * 0.2, -u * 0.06, jy + u * 0.3, -u * 0.22, jy + u * 0.3], '#b0bec5'); poly(c, [u * 0.08, jy + u * 0.2, u * 0.2, jy + u * 0.2, u * 0.22, jy + u * 0.3, u * 0.06, jy + u * 0.3], '#b0bec5'); circ(c, 0, jy - u * 0.14, u * 0.06, '#ffd23f');
  if (A.rocket) {
    for (const s2 of [-1, 1]) { const fx = s2 * u * 0.14, fy = jy + u * 0.3, L = u * (0.7 + Math.random() * 0.35); poly(c, [fx - u * 0.09, fy, fx + u * 0.09, fy, fx, fy + L], '#ff9100'); poly(c, [fx - u * 0.05, fy, fx + u * 0.05, fy, fx, fy + L * 0.6], '#fff59d'); }
  }
  /* kuyruk */
  const sway = Math.sin(t * 7) * (run ? 0.25 : 0.12);
  c.save(); c.translate(0, by + u * 0.25); c.rotate(sway);
  switch (ch.tail) {
    case 'cat': oline(c, u * 0.1, ch.body, CH_OL, () => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(u * 0.35, u * 0.05, u * 0.3, -u * 0.45); }); break;
    case 'dog': oline(c, u * 0.1, shade(ch.body, -0.15), CH_OL, () => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(u * 0.05, -u * 0.25, u * 0.12, -u * 0.35); }); break;
    case 'fox': ellS(c, u * 0.08, -u * 0.12, u * 0.2, u * 0.4, ch.body, 0.3); ell(c, u * 0.17, -u * 0.44, u * 0.11, u * 0.12, '#fff', 0.3); break;
    case 'dino': poly(c, [-u * 0.18, -u * 0.1, u * 0.18, -u * 0.1, 0, u * 0.42], ch.body, true); break;
    case 'cable': c.lineWidth = u * 0.05; c.strokeStyle = '#37474f'; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(u * 0.2, u * 0.2, -u * 0.2, u * 0.3, u * 0.1, u * 0.45); c.stroke(); circ(c, u * 0.1, u * 0.47, u * 0.06, '#ffca28'); break;
    case 'rainbow': for (let i = 0; i < 6; i++) { c.lineWidth = u * 0.07; c.strokeStyle = RAINBOW[i]; c.beginPath(); c.moveTo(-u * 0.12 + i * u * 0.045, 0); c.quadraticCurveTo(-u * 0.1 + i * u * 0.05, u * 0.3, u * 0.1 + i * u * 0.04, u * 0.48); c.stroke(); } break;
    case 'puff': circ(c, 0, 0, u * 0.14, ch.kind === 'panda' ? ch.dark : '#ffffff'); c.stroke(); break;
  }
  c.restore();
  c.restore();
}

/* Kovalayan robot: SÜPÜRGEÇ */
function drawVacuum(c, x, y, s, t) {
  const u = s;
  c.save(); c.translate(x, y);
  ell(c, 0, 0, u * 1.6, u * 0.36, 'rgba(0,0,0,0.28)');
  for (const sd of [-1, 1]) { c.save(); c.translate(sd * u * 1.2, -u * 0.12); c.scale(1, 0.35); c.rotate(t * 14 * sd); for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); c.fillStyle = '#ffd54f'; c.fillRect(0, -u * 0.035, u * 0.45, u * 0.07); } c.restore(); }
  ell(c, 0, -u * 0.18, u * 1.35, u * 0.42, '#1f292e');
  c.fillStyle = '#37474f'; c.fillRect(-u * 1.35, -u * 0.8, u * 2.7, u * 0.62);
  for (let i = 0; i < 9; i++) { const lx = -u * 1.1 + i * u * 0.275; const on = (Math.floor(t * 10) + i) % 9 < 2; circ(c, lx, -u * 0.5, u * 0.07, on ? '#ff1744' : '#5d1010'); }
  ell(c, 0, -u * 0.8, u * 1.35, u * 0.42, '#607d8b');
  ell(c, 0, -u * 0.84, u * 1.05, u * 0.3, '#78909c');
  c.fillStyle = '#455a64'; c.fillRect(-u * 0.55, -u * 1.55, u * 1.1, u * 0.75);
  ell(c, 0, -u * 1.55, u * 0.55, u * 0.18, '#546e7a');
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * u * 0.55, -u * 1.25); c.rotate(sd * (0.9 + Math.sin(t * 6) * 0.3));
    c.fillStyle = '#90a4ae'; c.fillRect(-u * 0.06, -u * 0.06, u * 0.75, u * 0.12);
    c.translate(u * 0.75, 0); c.rotate(Math.sin(t * 8) * 0.4); c.fillStyle = '#ffd54f'; c.fillRect(0, -u * 0.16, u * 0.08, u * 0.32); c.fillRect(0, -u * 0.16, u * 0.25, u * 0.07); c.fillRect(0, u * 0.09, u * 0.25, u * 0.07);
    c.restore();
  }
  const on = Math.sin(t * 16) > 0;
  if (on) circ(c, 0, -u * 1.85, u * 0.5, 'rgba(255,23,68,0.25)');
  ell(c, 0, -u * 1.78, u * 0.2, u * 0.22, on ? '#ff1744' : '#b71c1c');
  for (let i = 0; i < 4; i++) { const a = t * 3 + i * 1.6; circ(c, Math.cos(a) * u * 1.5, u * 0.05 - Math.abs(Math.sin(a * 1.3)) * u * 0.2, u * (0.18 + 0.06 * Math.sin(a)), 'rgba(200,200,200,0.35)'); }
  c.restore();
}

/* =========================================================
   ÇEVRE SÜSLERİ (yol kenarı)
   ========================================================= */
function drawDecor(c, type, x, y, s, h, t) {
  if (s < 1.2) return;
  switch (type) {
    case 'house': {
      const w = 2.4 * s, hh = (1.7 + h * 0.9) * s, cols = ['#ffe08a', '#ffb199', '#b8e6ff', '#cdeeb0', '#f7c6ff'];
      c.fillStyle = cols[Math.floor(h * 5)]; c.fillRect(x - w / 2, y - hh, w, hh);
      poly(c, [x - w / 2 - 0.25 * s, y - hh, x + w / 2 + 0.25 * s, y - hh, x, y - hh - 1.1 * s], h > 0.5 ? '#e5533d' : '#8b5a3c');
      c.fillStyle = '#fff7c2'; c.fillRect(x - w * 0.36, y - hh * 0.75, w * 0.22, w * 0.2); c.fillRect(x + w * 0.14, y - hh * 0.75, w * 0.22, w * 0.2);
      c.fillStyle = '#7a4a2a'; c.fillRect(x - w * 0.1, y - hh * 0.42, w * 0.2, hh * 0.42); break;
    }
    case 'tree': c.fillStyle = '#8b5a3c'; c.fillRect(x - 0.13 * s, y - 1.3 * s, 0.26 * s, 1.3 * s); circ(c, x, y - 1.95 * s, 0.85 * s, '#3fae49'); circ(c, x - 0.48 * s, y - 1.55 * s, 0.6 * s, '#4cc357'); circ(c, x + 0.48 * s, y - 1.6 * s, 0.6 * s, '#37a142'); circ(c, x - 0.25 * s, y - 2.25 * s, 0.3 * s, '#74de7c'); break;
    case 'bush': circ(c, x - 0.4 * s, y - 0.35 * s, 0.45 * s, '#3fae49'); circ(c, x + 0.4 * s, y - 0.35 * s, 0.45 * s, '#37a142'); circ(c, x, y - 0.55 * s, 0.55 * s, '#4cc357'); if (h > 0.5) { circ(c, x - 0.2 * s, y - 0.7 * s, 0.09 * s, '#ff5c8a'); circ(c, x + 0.3 * s, y - 0.5 * s, 0.09 * s, '#ffd23f'); } break;
    case 'lamp': c.fillStyle = '#455a64'; c.fillRect(x - 0.06 * s, y - 2.7 * s, 0.12 * s, 2.7 * s); circ(c, x, y - 2.8 * s, 0.55 * s, 'rgba(255,240,150,0.25)'); circ(c, x, y - 2.8 * s, 0.2 * s, '#fff59d'); break;
    case 'lolly': {
      c.fillStyle = '#ffffff'; c.fillRect(x - 0.07 * s, y - 2.2 * s, 0.14 * s, 2.2 * s);
      const col = ['#ff5fa2', '#7c4dff', '#00c2ff', '#ffb300'][Math.floor(h * 4)]; const cy = y - 2.6 * s;
      circ(c, x, cy, 0.8 * s, col); c.lineWidth = 0.13 * s; c.strokeStyle = 'rgba(255,255,255,0.85)';
      for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(x, cy, i * 0.22 * s, t * 2 + i, t * 2 + i + 4); c.stroke(); } break;
    }
    case 'cane': c.lineCap = 'butt'; c.lineWidth = 0.32 * s; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 2.3 * s); c.arc(x + 0.45 * s, y - 2.3 * s, 0.45 * s, Math.PI, 0); c.stroke(); c.setLineDash([0.3 * s, 0.3 * s]); c.strokeStyle = '#ff3b5c'; c.stroke(); c.setLineDash([]); break;
    case 'cupcake': poly(c, [x - 0.7 * s, y - 1.0 * s, x + 0.7 * s, y - 1.0 * s, x + 0.5 * s, y, x - 0.5 * s, y], '#ff8fbf'); circ(c, x - 0.4 * s, y - 1.15 * s, 0.4 * s, '#fff3f8'); circ(c, x + 0.4 * s, y - 1.15 * s, 0.4 * s, '#fff3f8'); circ(c, x, y - 1.45 * s, 0.48 * s, '#fffaf0'); circ(c, x, y - 2.0 * s, 0.17 * s, '#e53935'); break;
    case 'gumdrop': { const col = ['#69f0ae', '#ff5fa2', '#ffd23f', '#40c4ff'][Math.floor(h * 4)]; c.beginPath(); c.ellipse(x, y, 0.75 * s, 1.0 * s, 0, Math.PI, 0); c.fillStyle = col; c.fill(); circ(c, x - 0.3 * s, y - 0.6 * s, 0.1 * s, 'rgba(255,255,255,0.8)'); circ(c, x + 0.2 * s, y - 0.3 * s, 0.07 * s, 'rgba(255,255,255,0.8)'); break; }
    case 'palm': {
      const tx = x + (h - 0.5) * 1.4 * s, ty = y - 3.2 * s;
      c.lineWidth = 0.28 * s; c.strokeStyle = '#8b5a3c'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x, y - 1.8 * s, tx, ty); c.stroke();
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55 + Math.sin(t + i) * 0.05; ell(c, tx + Math.cos(a) * 0.8 * s, ty + Math.sin(a) * 0.5 * s + 0.2 * s, 0.95 * s, 0.22 * s, i % 2 ? '#2f9e44' : '#40c057', a); }
      circ(c, tx, ty + 0.15 * s, 0.18 * s, '#6d4c41'); break;
    }
    case 'mushroom': c.fillStyle = '#fff3e0'; c.fillRect(x - 0.2 * s, y - 1.0 * s, 0.4 * s, 1.0 * s); c.beginPath(); c.ellipse(x, y - 1.0 * s, 0.9 * s, 0.7 * s, 0, Math.PI, 0); c.fillStyle = '#e53935'; c.fill(); circ(c, x - 0.4 * s, y - 1.3 * s, 0.13 * s, '#fff'); circ(c, x + 0.25 * s, y - 1.45 * s, 0.16 * s, '#fff'); circ(c, x + 0.55 * s, y - 1.12 * s, 0.1 * s, '#fff'); break;
    case 'rock': case 'rock2': { const col = type === 'rock' ? '#3b2b28' : '#8a8f99'; poly(c, [x - 1.0 * s, y, x - 0.8 * s, y - 0.8 * s, x - 0.1 * s, y - 1.2 * s, x + 0.7 * s, y - 0.9 * s, x + 1.0 * s, y], col); if (type === 'rock') { c.lineWidth = 0.08 * s; c.strokeStyle = '#ff6d00'; c.beginPath(); c.moveTo(x - 0.4 * s, y - 0.8 * s); c.lineTo(x - 0.1 * s, y - 0.4 * s); c.lineTo(x + 0.2 * s, y - 0.7 * s); c.stroke(); } else poly(c, [x - 0.6 * s, y - 0.7 * s, x - 0.1 * s, y - 1.05 * s, x + 0.2 * s, y - 0.8 * s], '#aab0ba'); break; }
    case 'pine': c.fillStyle = '#6d4c41'; c.fillRect(x - 0.12 * s, y - 0.6 * s, 0.24 * s, 0.6 * s); for (let i = 0; i < 3; i++) { const yy = y - 0.5 * s - i * 0.8 * s, w = (1.1 - i * 0.28) * s; poly(c, [x - w, yy, x + w, yy, x, yy - 1.2 * s], '#1f7a4d'); poly(c, [x - w * 0.35, yy - 0.8 * s, x + w * 0.35, yy - 0.8 * s, x, yy - 1.2 * s], '#ffffff'); } break;
    case 'crystal': poly(c, [x - 0.5 * s, y, x - 0.3 * s, y - 1.8 * s, x, y - 2.3 * s, x + 0.2 * s, y - 1.6 * s, x + 0.4 * s, y], 'rgba(120,210,255,0.85)'); poly(c, [x + 0.2 * s, y, x + 0.6 * s, y - 1.2 * s, x + 0.9 * s, y], 'rgba(170,230,255,0.9)'); poly(c, [x - 0.2 * s, y - 1.6 * s, x, y - 2.3 * s, x + 0.05 * s, y - 1.5 * s], 'rgba(255,255,255,0.8)'); break;
    case 'snowman': circ(c, x, y - 0.55 * s, 0.6 * s, '#ffffff'); circ(c, x, y - 1.4 * s, 0.42 * s, '#f5fbff'); circ(c, x - 0.13 * s, y - 1.5 * s, 0.05 * s, '#222'); circ(c, x + 0.13 * s, y - 1.5 * s, 0.05 * s, '#222'); poly(c, [x, y - 1.42 * s, x + 0.35 * s, y - 1.36 * s, x, y - 1.32 * s], '#ff8f00'); c.fillStyle = '#222'; c.fillRect(x - 0.32 * s, y - 1.85 * s, 0.64 * s, 0.08 * s); c.fillRect(x - 0.2 * s, y - 2.25 * s, 0.4 * s, 0.42 * s); break;
    case 'spire': { const col = h > 0.5 ? '#00e5ff' : '#ff3df2'; circ(c, x, y - 2.2 * s, 1.0 * s, col === '#00e5ff' ? 'rgba(0,229,255,0.15)' : 'rgba(255,61,242,0.15)'); poly(c, [x - 0.35 * s, y, x, y - 3.8 * s, x + 0.35 * s, y], '#1d1450'); c.lineWidth = 0.08 * s; c.strokeStyle = col; c.beginPath(); c.moveTo(x - 0.35 * s, y); c.lineTo(x, y - 3.8 * s); c.lineTo(x + 0.35 * s, y); c.stroke(); circ(c, x, y - 3.85 * s, 0.14 * s, col); break; }
    case 'dish': c.fillStyle = '#90a4ae'; c.fillRect(x - 0.07 * s, y - 1.6 * s, 0.14 * s, 1.6 * s); ell(c, x, y - 1.9 * s, 0.85 * s, 0.4 * s, '#cfd8dc', -0.5); circ(c, x + 0.15 * s, y - 2.0 * s, 0.1 * s, Math.sin(t * 4 + h * 9) > 0 ? '#ff1744' : '#00e5ff'); break;
    case 'crystal2': poly(c, [x - 0.6 * s, y, x - 0.4 * s, y - 1.4 * s, x - 0.1 * s, y], '#b388ff'); poly(c, [x - 0.2 * s, y, x + 0.1 * s, y - 2.0 * s, x + 0.4 * s, y], '#7c4dff'); poly(c, [x + 0.3 * s, y, x + 0.55 * s, y - 1.1 * s, x + 0.8 * s, y], '#e1bee7'); break;
    case 'geyser': { poly(c, [x - 1.0 * s, y, x - 0.3 * s, y - 1.0 * s, x + 0.3 * s, y - 1.0 * s, x + 1.0 * s, y], '#2a1a16'); circ(c, x, y - 1.0 * s, 0.6 * s, 'rgba(255,90,0,0.3)'); ell(c, x, y - 1.0 * s, 0.32 * s, 0.1 * s, '#ff9100'); for (let i = 0; i < 4; i++) { const ph = (t * 1.6 + i * 0.25 + h) % 1; circ(c, x + Math.sin(i * 7 + h * 10) * 0.4 * s * ph, y - 1.0 * s - ph * 2.2 * s + ph * ph * 1.2 * s, (0.16 - ph * 0.1) * s, ph < 0.5 ? '#ffab40' : '#ff3d00'); } break; }
    case 'deadtree': c.lineWidth = 0.18 * s; c.strokeStyle = '#1e1412'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 2.0 * s); c.moveTo(x, y - 1.2 * s); c.lineTo(x - 0.7 * s, y - 1.9 * s); c.moveTo(x, y - 1.6 * s); c.lineTo(x + 0.6 * s, y - 2.3 * s); c.moveTo(x - 0.4 * s, y - 1.6 * s); c.lineTo(x - 0.5 * s, y - 2.2 * s); c.stroke(); break;
  }
}

/* güç simgeleri */
const POW = {
  magnet: { name: 'Mıknatıs', col: '#ff5252' },
  double: { name: '2x Altın', col: '#ffb300' },
  spring: { name: 'Yaylı Ayakkabı', col: '#00c853' },
  rocket: { name: 'Turbo Roket', col: '#7c4dff' },
  shield: { name: 'Kalkan', col: '#00b0ff' },
};
