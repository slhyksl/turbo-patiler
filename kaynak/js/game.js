'use strict';
/* =========================================================
   TURBO PATİLER — oyun motoru (3 şerit, sahte-3B perspektif)
   ========================================================= */
const LANE_W = 2.2, RH = 3.3, DZP = 6, SEG = 3, VB = 0.0004, GEN_AHEAD = 108;
const GRAV = 32, JUMP_V = 11.2, LANE_SPEED = 19, BLOCK_H = 2.4, ROCKET_Y = 7;
const cv = document.getElementById('bg');
const ctx = cv.getContext('2d', { alpha: false });
const glc = document.getElementById('game'), fxc = document.getElementById('fx'), fxx = fxc.getContext('2d');
let R = null, USE3D = false;
const V = { W: 1, H: 1, dpr: 1, k: 50, horizonY: 0, feetY: 0, camY: 4.5, F: 300, maxDz: 100 };

function resize() {
  V.W = window.innerWidth; V.H = window.innerHeight; V.dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr);
  cv.style.width = V.W + 'px'; cv.style.height = V.H + 'px';
  V.k = Math.min(0.92 * V.W, 1.0 * V.H) / (3 * LANE_W);
  V.feetY = V.H * 0.8;
  V.horizonY = clamp(V.feetY - 4.4 * V.k, V.H * 0.15, V.H * 0.42);
  V.camY = (V.feetY - V.horizonY) / V.k;
  V.F = V.k * DZP;
  V.maxDz = Math.min(GEN_AHEAD - 4, Math.sqrt(V.camY / VB) - 3);
  if (G.state === 'menu') G.camH = V.camY;
  fxc.width = Math.round(V.W * V.dpr); fxc.height = Math.round(V.H * V.dpr); fxc.style.width = V.W + 'px'; fxc.style.height = V.H + 'px';
  glc.style.width = V.W + 'px'; glc.style.height = V.H + 'px';
  if (R) R.size(V.W, V.H, Math.min(V.dpr, 1.5));
  makeSkyBits();
}

/* ---------------- durum ---------------- */
const G = {
  state: 'menu', z: 0, speed: 0, lane: 1, fromLane: 1, x: 0, prevX: 0, prevZ: 0, y: 0, vy: 0, ground: 0, onGround: true,
  coyote: 0, slide: 0, slideQ: false, jumpBuf: 0, invuln: 0, ignore: null, ignoreT: 0, stumbleT: 99, chaserZ: -9, chaserX: 0, slowT: 0,
  power: { magnet: 0, double: 0, rocket: 0, spring: 0 }, powerMax: { magnet: 1, double: 1, rocket: 1, spring: 1 }, shield: false,
  obs: [], items: [], parts: [], sparts: [], amb: [], genZ: 0, lanes: [], pendingMoving: null, nextPow: 0, nextGem: 0, letterZ: Infinity,
  coins: 0, gemsRun: 0, score: 0, mult: 1, revives: 0, adRevive: false, run: {}, time: 0, curve: 0, camX: 0, camH: 4.5,
  shake: 0, flash: 0, sq: 1, biome: 0, deathT: 0, phase: 0, ch: null, perk: {}, tut: null, timeScale: 1, frame: 0, coinT: 0
};

/* ---------------- projeksiyon ---------------- */
let PX = 0, PY = 0, PS = 0;
function P(x, y, rz) {
  const dz = rz + DZP; if (dz < 0.15) return false;
  PS = V.F / dz;
  PX = V.W * 0.5 + (x + G.curve * dz * dz - G.camX) * PS;
  PY = V.horizonY + (G.camH - y + VB * dz * dz) * PS;
  return true;
}
function speedAt(z) { return Math.min(28, 12 + Math.sqrt(Math.max(0, z)) * 0.25); }

/* ---------------- koşu başlatma ---------------- */
function startRun() {
  const ch = CHAR_BY[S.sel] || CHARS[0];
  Object.assign(G, {
    state: 'play', ch, perk: ch.perk || {}, z: 0, speed: 12, lane: 1, fromLane: 1, x: 0, prevX: 0, prevZ: 0, y: 0, vy: 0, ground: 0, onGround: true,
    coyote: 0, slide: 0, slideQ: false, jumpBuf: 0, invuln: 0, ignoreLane: -1, ignoreT: 0, stumbleT: 4.2, chaserZ: -2.4, chaserX: 0, slowT: 0,
    shield: false, genZ: 32, pendingMoving: null, coins: 0, gemsRun: 0, score: 0, revives: 0, adRevive: false, time: 0, deathT: 0, phase: 0,
    biome: 0, letterSpawned: false, doubled: false, revivePrompt: false, timeScale: 1, coinT: 0
  });
  G.power = { magnet: 0, double: 0, rocket: 0, spring: 0 };
  G.obs = []; G.items = []; G.parts = [];
  G.lanes = [{ until: 0, kind: null }, { until: 0, kind: null }, { until: 0, kind: null }];
  G.mult = 1 + Math.min(29, S.missionSet);
  G.nextPow = rand(150, 240); G.nextGem = rand(350, 600);
  const W = wordToday(); G.letterZ = W.done ? Infinity : rand(220, 650);
  G.run = { coins: 0, jumps: 0, slides: 0, powerups: 0, ramps: 0, rockets: 0, noCoin: 0, noCoinBest: 0, trainTop: 0 };
  G.tut = null;
  if (!S.tutorialDone) {
    G.tut = { hint: '' };
    placeObs('low', 1, 58); placeObs('high', 1, 104); placeBlock(1, 150, 16, false, false); placeBlock(0, 212, 22, true, false);
    for (let z = 34; z < 54; z += 2.2) G.items.push({ t: 'coin', x: 0, y: 0.75, z, lane: 1, gy: 0 });
    for (let z = 54.5; z < 62; z += 1.6) { const k = (z - 58) / 3.6; G.items.push({ t: 'coin', x: 0, y: 0.75 + 1.5 * Math.max(0, 1 - k * k), z, lane: 1 }); }
    for (let z = 96; z < 112; z += 2) G.items.push({ t: 'coin', x: 0, y: 0.6, z, lane: 1, gy: 0 });
    for (let z = 200; z < 238; z += 2) { const g = groundInfo(0, z); G.items.push({ t: 'coin', x: -LANE_W, y: g.h + 0.75, z, lane: 0, gy: g.h }); }
    G.genZ = 262;
  }
  runMissionsReset();
  Sound.setKey(BIOMES[0].key); Sound.intensity = 1;
  Ads.start();
}

/* ---------------- dünya üretimi ---------------- */
function laneActive(l, z) { return G.lanes[l].until > z; }
function laneKind(l, z) { return G.lanes[l].until > z ? G.lanes[l].kind : null; }
function placeObs(t, l, z) { G.obs.push({ t, lane: l, x: (l - 1) * LANE_W, z0: z, z1: z + 0.5 }); G.lanes[l] = { until: z + 3, kind: null }; }
function placeBlock(l, z, len, ramp, moving) {
  const x = (l - 1) * LANE_W; let z0 = z;
  if (ramp) { G.obs.push({ t: 'ramp', lane: l, x, z0: z, z1: z + 6, used: false }); z0 = z + 6; }
  const b = { t: 'block', lane: l, x, z0, z1: z0 + len, ramped: !!ramp, moving: !!moving, vz: moving ? -9 : 0, horn: false, look: randi(0, 2) };
  G.obs.push(b);
  if (!moving) G.lanes[l] = { until: b.z1 + 7, kind: ramp ? 'ramp' : 'block' };
  return b;
}
function groundInfo(L, z) {
  let h = 0, hard = false;
  for (const o of G.obs) {
    if (o.dead || o.lane !== L || z < o.z0 || z > o.z1) continue;
    if (o.t === 'ramp') h = Math.max(h, BLOCK_H * (z - o.z0) / (o.z1 - o.z0));
    else if (o.t === 'block') { if (o.ramped) h = BLOCK_H; else hard = true; }
  }
  return { h, hard };
}
function chooseType(l, z, placed) {
  const opts = [['low', 3]];
  if (z > 120) opts.push(['high', 2.6]);
  if (z > 80) {
    const midBusy = !!laneKind(1, z) || placed.some(p => p.l === 1 && (p.type === 'block' || p.type === 'ramp'));
    const sideHard = laneKind(0, z) === 'block' || laneKind(2, z) === 'block' || placed.some(p => p.l !== 1 && p.type === 'block');
    if (l === 1) { if (!sideHard) opts.push(['block', 3]); }
    else if (!midBusy) opts.push(['block', 3]);
    opts.push(['ramp', 1.7]);
  }
  return wpick(opts);
}
function genStep() {
  const z = G.genZ, d = clamp(z / 5000, 0, 1);
  const sp = speedAt(z), T = Math.max(0.9, 1.65 - z / 4000);
  const gap = Math.max(15, sp * T);
  if (G.pendingMoving && z >= G.pendingMoving.z) { const pm = G.pendingMoving; G.pendingMoving = null; placeBlock(pm.lane, z, pm.len, false, true); G.lanes[pm.lane] = { until: z + pm.len + 6, kind: 'block' }; }
  else if (!G.pendingMoving && z > 1100 && Math.random() < 0.07 + 0.08 * d) {
    const l = Math.random() < 0.5 ? 0 : 2;
    if (!laneActive(l, z) && !laneKind(1, z)) { const len = randi(10, 16), zm = z + 48; G.pendingMoving = { lane: l, z: zm, len }; G.lanes[l] = { until: zm + len + 6, kind: 'block' }; }
  }
  let n = 1; const r = Math.random();
  if (z > 220) { if (r < 0.3 + 0.3 * d) n = 2; if (z > 900 && r < 0.08 + 0.14 * d) n = 3; }
  const free = shuffle([0, 1, 2].filter(l => !laneActive(l, z)));
  const placed = [];
  for (const l of free) {
    if (placed.length >= n) break;
    placed.push({ l, type: chooseType(l, z, placed) });
  }
  for (const p of placed) if (p.type === 'block') {
    const adj = p.l === 1 ? [0, 2] : [1];
    if (!adj.some(a => !laneActive(a, z) && !placed.some(q => q.l === a))) p.type = 'ramp';
  }
  const hardAt = l => laneKind(l, z) === 'block' || placed.some(p => p.l === l && p.type === 'block');
  if (hardAt(0) && hardAt(1) && hardAt(2)) { const p = placed.find(p => p.type === 'block'); if (p) p.type = 'ramp'; }
  for (const p of placed) {
    if (p.type === 'low' || p.type === 'high') placeObs(p.type, p.l, z);
    else if (p.type === 'block') placeBlock(p.l, z, randi(8, 16) + Math.floor(d * 12), false, false);
    else placeBlock(p.l, z, randi(14, 26) + Math.floor(d * 10), true, false);
  }
  genCoins(z, gap, placed);
  const mid = z + gap * 0.5;
  if (mid > G.nextPow) { spawnPickup('pow', mid); G.nextPow = mid + rand(260, 420); }
  else if (mid > G.nextGem) { spawnPickup('gem', mid); G.nextGem = mid + rand(500, 900); }
  else if (mid > G.letterZ && !G.letterSpawned) { spawnPickup('letter', mid); G.letterSpawned = true; }
  G.genZ += gap;
}
function genCoins(z, gap, placed) {
  if (Math.random() < 0.16) return;
  const cand = [0, 1, 2].filter(l => laneKind(l, z + 2) !== 'block' && !(G.pendingMoving && G.pendingMoving.lane === l));
  if (!cand.length) return;
  const rp = placed.find(p => p.type === 'ramp' && cand.includes(p.l));
  const L = rp && Math.random() < 0.65 ? rp.l : pick(cand);
  const n = rp && rp.l === L ? randi(10, 16) : randi(6, 11);
  let cz = z - gap * 0.45;
  for (let i = 0; i < n; i++, cz += 1.9) {
    const g = groundInfo(L, cz); if (g.hard) continue;
    let y = g.h + 0.75;
    for (const o of G.obs) if (o.t === 'low' && o.lane === L && Math.abs(o.z0 - cz) < 3.6) { const k = (cz - o.z0) / 3.6; y += 1.5 * (1 - k * k); }
    G.items.push({ t: 'coin', x: (L - 1) * LANE_W, y, z: cz, lane: L, gy: g.h });
  }
}
function spawnPickup(kind, z) {
  for (const L of shuffle([0, 1, 2])) {
    const g = groundInfo(L, z); if (g.hard) continue;
    if (G.obs.some(o => o.lane === L && (o.t === 'low' || o.t === 'high') && Math.abs(o.z0 - z) < 4)) continue;
    const it = { t: kind, x: (L - 1) * LANE_W, y: g.h + 1.0, z, lane: L };
    if (kind === 'pow') it.p = wpick([['magnet', 3], ['double', 2.2], ['rocket', 1.6], ['spring', 2], ['shield', G.shield ? 0.01 : 1.6]]);
    if (kind === 'letter') { const W = wordToday(); if (W.done) return; it.ch = W.w[W.got]; }
    G.items.push(it); return;
  }
}
function clearAhead(dist) {
  for (const o of G.obs) if (!o.dead && o.z0 < G.z + dist && o.z1 > G.z - 2) { o.dead = true; if (o.z0 - G.z < 60) poof(o); }
}

/* ---------------- oyuncu eylemleri ---------------- */
function act(a) {
  if (G.state !== 'play') return;
  if (a === 'left' || a === 'right') {
    const nl = clamp(G.lane + (a === 'left' ? -1 : 1), 0, 2);
    if (nl !== G.lane) { G.fromLane = G.lane; G.lane = nl; Sound.play('whoosh'); }
    else { G.shake = Math.max(G.shake, 0.08); Sound.play('bump'); }
  } else if (a === 'up') {
    if (G.power.rocket > 0) return;
    if (G.onGround || G.coyote > 0) doJump(); else G.jumpBuf = 0.2;
  } else if (a === 'down') {
    if (G.power.rocket > 0) return;
    if (!G.onGround && G.y > G.ground + 0.1) { G.vy = Math.min(G.vy, -24); G.slideQ = true; }
    else startSlide();
  }
}
function doJump() {
  const m = (G.power.spring > 0 ? 1.5 : 1) * (1 + (G.perk.jump || 0));
  G.vy = JUMP_V * m; G.sq = 1.2; G.onGround = false; G.coyote = 0; G.slide = 0; G.jumpBuf = 0;
  Sound.play(G.power.spring > 0 ? 'spring' : 'jump');
  G.run.jumps++; S.stats.jumps++; mEvent('jumps', 1);
  dust(5);
}
function startSlide() {
  if (G.slide <= 0) { G.run.slides++; S.stats.slides++; mEvent('slides', 1); Sound.play('slide'); }
  G.slide = 0.7;
}
function stumble() {
  if (G.stumbleT < 7) { die('caught'); return; }
  G.stumbleT = 0; G.slowT = 0.6; G.shake = 0.25; Sound.play('stumble'); vib(40);
  toast('Süpürgeç peşinde!<small>Bir daha çarpma!</small>', 'warn', 1500, 'vacuum');
}
function bounceLane(o) { return G.fromLane !== o.lane ? G.fromLane : clamp(o.lane + (G.x > o.x ? 1 : -1), 0, 2); }
function hit(o, side) {
  if (G.ignoreT > 0 && o.lane === G.ignoreLane) { if (G.lane === o.lane) G.lane = bounceLane(o); return; }
  if (side) { G.lane = bounceLane(o); G.x = G.prevX; if (G.invuln > 0) return; G.ignoreLane = o.lane; G.ignoreT = 0.5; stumble(); return; }
  if (G.invuln > 0) return;
  if (G.shield) { G.shield = false; o.dead = true; G.invuln = 1.0; poof(o); Sound.play('shield'); G.shake = 0.25; toast('Kalkan seni korudu!', 'good', 1200, 'shield'); return; }
  die(o.moving ? 'train' : 'crash');
}
function die(type) {
  G.state = 'dying'; G.deathT = 0; G.deathType = type; G.vy = 5; G.shake = 0.5; G.flash = 0.45; G.slide = 0;
  Sound.play(type === 'caught' ? 'caught' : 'crash'); vib(120); Ads.stop();
  for (let i = 0; i < 10; i++) G.parts.push({ x: G.x, y: G.y + 1.3, z: G.z + 0.3, vx: rand(-3, 3), vy: rand(2, 6), vz: rand(-2, 2), life: 0.9, max: 0.9, col: '#ffeb3b', size: 0.14, g: 6, star: true });
}
function activatePower(p) {
  const lvl = S.upg[p] || 0, b = G.perk.power || 0;
  Sound.play('power'); G.run.powerups++; S.stats.powerups++; mEvent('powerups', 1);
  if (p === 'shield') { G.shield = true; toast('Kalkan!', 'good', 1100, 'shield'); return; }
  if (p === 'rocket') { startRocket(5 + lvl * 0.8 + b * 0.6); toast('Turbo Roket!', 'good', 1100, 'rocket'); return; }
  const d = 8 + lvl * 1.6 + b; G.power[p] = d; G.powerMax[p] = d;
  toast(`${POW[p].name}!`, 'good', 1100, p);
}
function startRocket(dur) {
  G.power.rocket = dur; G.powerMax.rocket = dur; G.slide = 0; G.run.rockets++; Sound.play('rocket');
  let L = G.lane; const z0 = G.z + 14, z1 = G.z + G.speed * 1.2 * dur - 4;
  for (let z = z0, i = 0; z < z1; z += 2.2, i++) {
    if (i % 12 === 0 && i > 0 && Math.random() < 0.75) L = clamp(L + (Math.random() < 0.5 ? -1 : 1), 0, 2);
    G.items.push({ t: 'coin', x: (L - 1) * LANE_W, y: ROCKET_Y + 0.3, z, lane: L, air: true });
  }
}

/* ---------------- fizik ve çarpışma ---------------- */
function collide() {
  const px = G.x, pz = G.z, ph = G.slide > 0 ? 0.75 : 1.5;
  let ground = 0;
  for (const o of G.obs) {
    if (o.dead || o.z1 < pz - 0.4 || o.z0 > pz + 0.4) continue;
    const adx = Math.abs(px - o.x); if (adx >= 1.25) continue;
    const side = Math.abs(G.prevX - o.x) >= 1.25;
    if (o.t === 'block') {
      if (G.y >= BLOCK_H - 0.45) { if (adx < 1.05) ground = Math.max(ground, BLOCK_H); continue; }
      hit(o, side);
    } else if (o.t === 'ramp') {
      const h = BLOCK_H * clamp((pz - o.z0) / (o.z1 - o.z0), 0, 1);
      if (G.y >= h - 0.75) {
        if (adx < 1.05) { ground = Math.max(ground, h); if (!o.used) { o.used = true; G.run.ramps++; S.stats.ramps++; mEvent('ramps', 1); } }
        continue;
      }
      hit(o, true);
    } else if (o.t === 'low') { if (G.y >= 1.0) continue; hit(o, side); }
    else if (o.t === 'high') { if (G.y + ph <= 1.3 || G.y >= 2.55) continue; hit(o, side); }
    if (G.state !== 'play') return;
  }
  G.ground = ground;
}
function vertical(dt) {
  const g = G.ground;
  if (G.vy > 0 || G.y > g + 0.02) {
    G.vy -= GRAV * dt * (G.vy < 0 ? 1.15 : 1); G.y += G.vy * dt;
    G.onGround = false; G.coyote -= dt;
    if (G.y <= g) { const hard = G.vy < -9; G.y = g; G.vy = 0; G.onGround = true; G.sq = hard ? 0.72 : 0.86; if (hard) { Sound.play('land'); dust(6); } }
  } else { G.y = g; G.vy = 0; G.onGround = true; }
  if (G.onGround) {
    G.coyote = 0.1;
    if (G.jumpBuf > 0) doJump();
    else if (G.slideQ) { G.slideQ = false; startSlide(); }
  }
}
function items(dt) {
  const mag = G.power.magnet > 0, top = G.y + (G.slide > 0 ? 0.95 : 1.75);
  for (const it of G.items) {
    if (it.dead) continue;
    const rz = it.z - G.z;
    if (rz < -2) { it.dead = true; continue; }
    if (rz > 20) continue;
    if (mag && it.t === 'coin' && rz < 16 && !it.mag && (!it.air || G.power.rocket > 0)) it.mag = true;
    if (it.mag) { const k = Math.min(1, dt * 14); it.x += (G.x - it.x) * k; it.y += (G.y + 0.8 - it.y) * k; it.z += (G.z + 0.3 - it.z) * k; }
    if (Math.abs(it.x - G.x) < 0.9 && Math.abs(it.z - G.z) < 0.9 && it.y > G.y - 0.45 && it.y < top + 0.35) collect(it);
  }
}
function collect(it) {
  it.dead = true;
  if (it.t === 'coin') {
    const v = G.power.double > 0 ? 2 : 1;
    G.coins += v; G.run.coins += v; S.stats.coins += v; G.run.noCoin = 0; mEvent('coinsTotal', v);
    Sound.coinStreak = G.time - G.coinT < 0.4 ? Sound.coinStreak + 1 : 0; G.coinT = G.time; Sound.play('coin');
    sparkle(it, '#ffe066', 3);
  } else if (it.t === 'gem') { G.gemsRun++; Sound.play('gem'); sparkle(it, '#40c4ff', 12); toast('+1 Elmas!', 'good', 1200, 'gem'); }
  else if (it.t === 'pow') { activatePower(it.p); sparkle(it, POW[it.p].col, 14); }
  else if (it.t === 'letter') { letterCollected(); sparkle(it, '#ffd23f', 16); }
}

/* ---------------- parçacıklar ---------------- */
function sparkle(it, col, n) { for (let i = 0; i < n; i++) G.parts.push({ x: it.x, y: it.y, z: it.z, vx: rand(-2.5, 2.5), vy: rand(1, 4), vz: G.speed + rand(-1, 3), life: 0.45, max: 0.45, col, size: 0.11, g: 6, s4: true }); }
function dust(n) { for (let i = 0; i < n; i++) G.parts.push({ x: G.x + rand(-0.4, 0.4), y: G.ground + 0.05, z: G.z - 0.2, vx: rand(-1.5, 1.5), vy: rand(0.3, 1.2), vz: rand(-3, -1), life: 0.5, max: 0.5, col: 'rgba(255,255,255,0.7)', size: 0.12, g: 1 }); }
function poof(o) { for (let i = 0; i < 14; i++) G.parts.push({ x: o.x + rand(-0.9, 0.9), y: rand(0.2, 2), z: o.z0 + rand(0, 1), vx: rand(-3, 3), vy: rand(1, 5), vz: rand(-2, 2), life: 0.7, max: 0.7, col: i % 2 ? '#ffffff' : '#ffd23f', size: 0.15, g: 8 }); }
function confetti(n) { const cols = ['#ff5252', '#ffd23f', '#69f0ae', '#40c4ff', '#b388ff', '#ff8ccf']; for (let i = 0; i < n; i++) G.sparts.push({ x: V.W * rand(0.2, 0.8), y: V.H * rand(-0.05, 0.25), vx: rand(-160, 160), vy: rand(-280, 40), r: rand(0, 6), vr: rand(-8, 8), life: rand(1.4, 2.4), col: pick(cols), w: rand(6, 11), h: rand(4, 7) }); }
function updParts(dt) {
  for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt + (G.state === 'play' ? 0 : 0); p.vy -= p.g * dt; p.life -= dt; }
  if (G.parts.length) G.parts = G.parts.filter(p => p.life > 0);
  if (G.parts.length > 260) G.parts.splice(0, G.parts.length - 260);
  for (const p of G.sparts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.vx *= 0.99; p.r += p.vr * dt; p.life -= dt; }
  if (G.sparts.length) G.sparts = G.sparts.filter(p => p.life > 0 && p.y < V.H + 40);
}

/* ---------------- ana güncelleme ---------------- */
function update(dt) {
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.5);
  updParts(dt);
  updAmbient(dt);
  if (G.state === 'play') updatePlay(dt * G.timeScale);
  else if (G.state === 'dying') updateDying(dt);
  else if (G.state === 'menu') { G.time += dt; G.z += 7 * dt; G.x = 0; G.y = 0; G.camX += (0 - G.camX) * Math.min(1, dt * 2); G.camH += (V.camY - G.camH) * Math.min(1, dt * 2); }
  G.curve = Math.sin(G.z / 420) * 0.00055 + Math.sin(G.z / 173) * 0.00022;
}
function updatePlay(dt) {
  G.time += dt;
  let tgt = speedAt(G.z); if (G.slowT > 0) { G.slowT -= dt; tgt *= 0.75; } if (G.power.rocket > 0) tgt *= 1.2;
  G.speed += (tgt - G.speed) * Math.min(1, dt * 2);
  G.prevZ = G.z; G.prevX = G.x;
  G.z += G.speed * dt;
  const tx = (G.lane - 1) * LANE_W, dx = tx - G.x, st = LANE_SPEED * dt;
  G.x = Math.abs(dx) <= st ? tx : G.x + Math.sign(dx) * st;
  G.invuln = Math.max(0, G.invuln - dt); G.jumpBuf -= dt; G.stumbleT += dt; G.ignoreT -= dt;
  for (const k of ['magnet', 'double', 'spring']) if (G.power[k] > 0) G.power[k] = Math.max(0, G.power[k] - dt);
  for (const o of G.obs) if (o.moving && !o.dead) { o.z0 += o.vz * dt; o.z1 += o.vz * dt; if (!o.horn && o.z0 - G.z < 60) { o.horn = true; Sound.play('horn'); } }
  if (G.power.rocket > 0) {
    G.power.rocket -= dt; G.y += (ROCKET_Y - G.y) * Math.min(1, dt * 3); G.vy = 0; G.onGround = false; G.slide = 0;
    if (Math.random() < 0.5) G.parts.push({ x: G.x + rand(-0.25, 0.25), y: G.y + 0.1, z: G.z + 0.1, vx: rand(-0.5, 0.5), vy: -4, vz: G.speed * 0.8, life: 0.25, max: 0.25, col: Math.random() < 0.5 ? '#ff9100' : '#fff59d', size: 0.09, g: 0 });
    if (G.power.rocket <= 0) { G.power.rocket = 0; G.invuln = Math.max(G.invuln, 1.8); clearAhead(G.speed * 1.8 + 10); }
  } else { collide(); if (G.state !== 'play') return; vertical(dt); }
  if (G.slide > 0) G.slide -= dt;
  items(dt);
  while (G.genZ < G.z + GEN_AHEAD) genStep();
  if (++G.frame % 30 === 0) { G.obs = G.obs.filter(o => !o.dead && o.z1 > G.z - 14); G.items = G.items.filter(i => !i.dead && i.z > G.z - 6); }
  G.score += G.speed * dt * G.mult * (1 + (G.perk.score || 0));
  if (G.onGround && G.ground >= BLOCK_H - 0.01) G.run.trainTop += G.speed * dt;
  G.run.noCoin += G.speed * dt; if (G.run.noCoin > G.run.noCoinBest) G.run.noCoinBest = G.run.noCoin;
  const cz = G.stumbleT < 7 ? -2.4 : -9;
  G.chaserZ += (cz - G.chaserZ) * Math.min(1, dt * (G.stumbleT < 7 ? 5 : 1.2)); G.chaserX += (G.x - G.chaserX) * Math.min(1, dt * 4);
  const b = Math.floor(G.z / BIOME_LEN);
  if (b !== G.biome) { G.biome = b; const B = BIOMES[b % BIOMES.length]; banner('YENİ DÜNYA', B.name); Sound.setKey(B.key); Sound.play('biome'); Ads.happy(); }
  G.phase += dt * G.speed * 0.55; G.sq += (1 - G.sq) * Math.min(1, dt * 9);
  G.camX += (G.x * 0.6 - G.camX) * Math.min(1, dt * 6);
  G.camH += (V.camY + G.y * (G.power.rocket > 0 || G.y > 3 ? 0.8 : 0.45) - G.camH) * Math.min(1, dt * 4);
  missionsTick();
  if (G.tut) tutorialTick();
}
function updateDying(dt) {
  G.deathT += dt;
  G.chaserZ += (-0.9 - G.chaserZ) * Math.min(1, dt * 3); G.chaserX += (G.x - G.chaserX) * Math.min(1, dt * 4);
  G.vy -= GRAV * dt; G.y = Math.max(G.ground, G.y + G.vy * dt);
  if (G.deathT > 1.1 && !G.revivePrompt) { G.revivePrompt = true; onDeathDone(); }
}
function doRevive() {
  G.state = 'play'; G.revivePrompt = false; G.revives++; G.invuln = 2.5; G.stumbleT = 99; G.chaserZ = -9;
  for (const o of G.obs) if (o.z0 < G.z + 32 && o.z1 > G.z - 3) o.dead = true;
  G.y = 0; G.vy = 0; G.ground = 0; G.slide = 0; G.x = (G.lane - 1) * LANE_W; G.speed = Math.max(12, G.speed * 0.8);
  Sound.play('revive'); Ads.start();
}
function tutorialTick() {
  let hint = '', near = null, nd = 99;
  if (G.z < 260) {
    for (const o of G.obs) { if (o.dead || o.lane !== G.lane) continue; const d = o.z0 - G.z; if (d > 0 && d < 24 && d < nd) { nd = d; near = o; } }
    if (near) {
      if (near.t === 'low' && G.y < 0.6) hint = 'up';
      else if (near.t === 'high' && G.slide <= 0) hint = 'down';
      else if (near.t === 'block' && !near.ramped) hint = 'side';
      else if (near.t === 'ramp') hint = 'ramp';
    }
  }
  G.timeScale = hint && near && near.t !== 'ramp' && nd < 11 ? 0.35 : 1;
  if (hint !== G.tut.hint) { G.tut.hint = hint; showHint(hint); }
  if (G.z > 270) { G.tut = null; G.timeScale = 1; showHint(''); S.tutorialDone = true; saveGame(); toast('Harika! Artık hazırsın', 'good', 1800, 'star'); }
}


/* =========================================================
   ÇİZİM
   ========================================================= */
let skyStars = [], hills = [[], []], vignette = null;
function makeSkyBits() {
  skyStars = []; for (let i = 0; i < 90; i++) skyStars.push([Math.random(), Math.random(), Math.random() * 1.6 + 0.4, Math.random() * 6]);
  for (let l = 0; l < 2; l++) { hills[l] = []; for (let i = 0; i <= 14; i++) hills[l].push(0.35 + 0.65 * hash01(i * 13 + l * 101)); }
  vignette = null;
}
function rgba(col, a) { if (col[0] === '#') { const c = hex2rgb(col); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; } return col.replace('rgb(', 'rgba(').replace(')', `,${a})`); }
function drawSky(c, pal) {
  const hy = V.horizonY;
  const g = c.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, pal.sky0); g.addColorStop(1, pal.sky1);
  c.fillStyle = g; c.fillRect(-30, -30, V.W + 60, hy + 31);
  const B = pal.b, m = Math.min(V.W, V.H);
  if (B.fx === 'stars' || B.sun === 'redsun') for (const s of skyStars) { const a = 0.4 + 0.6 * Math.abs(Math.sin(G.time * 1.5 + s[3])); c.globalAlpha = a * (B.fx === 'stars' ? 1 : 0.35); circ(c, s[0] * V.W, s[1] * hy * 0.95, s[2], '#ffffff'); }
  c.globalAlpha = 1;
  const sx = V.W * 0.78 - G.camX * 3, sy = hy * 0.42;
  if (B.sun === 'sun') { const sg = c.createRadialGradient(sx, sy, m * 0.05, sx, sy, m * 0.2); sg.addColorStop(0, 'rgba(255,250,200,0.55)'); sg.addColorStop(1, 'rgba(255,250,200,0)'); c.fillStyle = sg; c.fillRect(sx - m * 0.2, sy - m * 0.2, m * 0.4, m * 0.4); circ(c, sx, sy, m * 0.065, '#fff7b8'); circ(c, sx - m * 0.012, sy - m * 0.012, m * 0.05, '#fffbe0'); }
  else if (B.sun === 'planet') { circ(c, sx, sy, m * 0.08, '#ff7ad9'); circ(c, sx - m * 0.02, sy - m * 0.02, m * 0.05, '#ffa6e8'); c.save(); c.strokeStyle = 'rgba(255,230,120,0.9)'; c.lineWidth = m * 0.012; c.beginPath(); c.ellipse(sx, sy, m * 0.14, m * 0.035, -0.3, 0, TAU); c.stroke(); c.restore(); circ(c, V.W * 0.2, hy * 0.3, m * 0.025, '#80deea'); }
  else if (B.sun === 'redsun') { circ(c, sx, hy * 0.75, m * 0.16, 'rgba(255,80,0,0.25)'); circ(c, sx, hy * 0.75, m * 0.1, '#ff5722'); }
  if (B.fx !== 'stars' && B.sun !== 'redsun') {
    for (let i = 0; i < 5; i++) {
      const cx = ((hash01(i * 7) * 1.4 + G.time * 0.006 * (1 + i * 0.2)) % 1.4 - 0.2) * V.W - G.camX * 2, cy = hy * (0.12 + hash01(i * 3 + 1) * 0.55), r = m * (0.035 + hash01(i + 9) * 0.03);
      for (const [col, oy] of [['rgba(180,200,235,0.55)', r * 0.22], ['rgba(255,255,255,0.95)', 0]]) {
        c.fillStyle = col; c.beginPath(); c.arc(cx, cy + oy, r, 0, TAU); c.arc(cx + r * 1.1, cy + r * 0.2 + oy, r * 0.8, 0, TAU); c.arc(cx - r * 1.1, cy + r * 0.25 + oy, r * 0.7, 0, TAU); c.arc(cx + r * 0.4, cy - r * 0.5 + oy, r * 0.75, 0, TAU); c.fill();
      }
    }
  }
}
function drawHills(c, pal) {
  const hy = V.horizonY;
  for (let l = 0; l < 2; l++) {
    const amp = hy * (l === 0 ? 0.3 : 0.17), off = -G.camX * (l === 0 ? 4 : 8) - V.W * 0.1, step = V.W * 1.2 / 14;
    c.fillStyle = l === 0 ? pal.mount0 : pal.mount1;
    c.beginPath(); c.moveTo(-50, hy + 2);
    let px = off, py = hy - hills[l][0] * amp; c.lineTo(px, py);
    for (let i = 1; i <= 14; i++) { const nx = off + i * step, ny = hy - hills[l][i] * amp; c.quadraticCurveTo(px + step * 0.5, Math.min(py, ny) - amp * 0.15, nx, ny); px = nx; py = ny; }
    c.lineTo(V.W + 50, hy + 2); c.closePath(); c.fill();
  }
}
const LANES_X = [-LANE_W, 0, LANE_W];
function drawRoad(c) {
  const z0 = G.z, first = Math.floor((z0 - DZP + 0.4) / SEG), last = Math.floor((z0 + V.maxDz - DZP) / SEG);
  for (let i = last; i >= first; i--) {
    let ra = i * SEG - z0, rb = ra + SEG;
    if (ra + DZP < 0.4) ra = 0.4 - DZP;
    if (rb <= ra) continue;
    P(0, 0, rb); const xb = PX, yb = PY, sb = PS;
    P(0, 0, ra); const xa = PX, ya = PY, sa = PS;
    if (ya <= yb + 0.01) continue;
    const pal = palAt(i * SEG), alt = (i & 1) === 0;
    c.fillStyle = alt ? pal.ground0 : pal.ground1; c.fillRect(-30, yb, V.W + 60, ya - yb + 1);
    const ea = RH * sa, eb = RH * sb, ca = (RH + 0.45) * sa, cb = (RH + 0.45) * sb;
    quad(c, [xa - ca, ya], [xa + ca, ya], [xb + cb, yb], [xb - cb, yb], alt ? pal.curb0 : pal.curb1);
    quad(c, [xa - ea, ya], [xa + ea, ya], [xb + eb, yb], [xb - eb, yb], pal.road0);
    if (sa < 1.6) continue;
    if (sa > 4) {
      c.fillStyle = pal.tie;
      for (const off of [0.25, 1.75]) {
        const s0 = i * SEG + off - z0, s1 = s0 + 0.45; if (s0 + DZP < 0.5) continue;
        P(0, 0, s1); const x1 = PX, y1 = PY, q1 = PS; P(0, 0, s0); const x0 = PX, y0 = PY, q0 = PS;
        for (const lx of LANES_X) { c.beginPath(); c.moveTo(x0 + (lx - 0.88) * q0, y0); c.lineTo(x0 + (lx + 0.88) * q0, y0); c.lineTo(x1 + (lx + 0.88) * q1, y1); c.lineTo(x1 + (lx - 0.88) * q1, y1); c.closePath(); c.fill(); }
      }
    }
    c.fillStyle = pal.rail;
    for (const lx of LANES_X) for (const rx of [-0.56, 0.56]) { const X = lx + rx, wa = 0.075 * sa, wb = 0.075 * sb; c.beginPath(); c.moveTo(xa + X * sa - wa, ya); c.lineTo(xa + X * sa + wa, ya); c.lineTo(xb + X * sb + wb, yb); c.lineTo(xb + X * sb - wb, yb); c.closePath(); c.fill(); }
  }
}
function drawFog(c, dz, a) {
  P(0, 0, dz - DZP); const ly = PY, top = V.horizonY - V.H * 0.12; if (ly <= top + 2) return;
  const col = palAt(G.z).sky1, g = c.createLinearGradient(0, top, 0, ly), hk = clamp((V.horizonY - top) / (ly - top), 0.01, 0.99);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(hk, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(-30, top, V.W + 60, ly - top);
}
/* çizim listesi */
const DL = []; let DLn = 0;
function dl(dz, kind, o, a, b) { let e = DL[DLn]; if (!e) { e = {}; DL[DLn] = e; } e.dz = dz; e.kind = kind; e.o = o; e.a = a; e.b = b; DLn++; }
function fadeA(dz) { return clamp((V.maxDz - dz) / 16, 0, 1); }
function quadO(c, a, b, d, e, f) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.fillStyle = f; c.fill(); c.stroke(); }
function setLW(c, rz) { P(0, 0, Math.max(rz, -DZP + 0.4)); c.lineWidth = clamp(PS * 0.045, 0.5, 3.2); }
function shadowQuad(c, x0, x1, za, zb) {
  za = Math.max(za, -DZP + 0.45); if (zb <= za) return;
  P(x0, 0.02, za); const a = [PX, PY]; P(x1, 0.02, za); const b = [PX, PY]; P(x1, 0.02, zb); const d = [PX, PY]; P(x0, 0.02, zb); const e = [PX, PY];
  quad(c, a, b, d, e, 'rgba(10,5,30,0.22)');
}
function drawBox(c, x0, x1, y0, y1, ra, rb, front, top, side) {
  P(x0, y0, ra); const nbl = [PX, PY]; P(x1, y0, ra); const nbr = [PX, PY]; P(x0, y1, ra); const ntl = [PX, PY]; P(x1, y1, ra); const ntr = [PX, PY];
  P(x0, y1, rb); const ftl = [PX, PY]; P(x1, y1, rb); const ftr = [PX, PY]; P(x0, y0, rb); const fbl = [PX, PY]; P(x1, y0, rb); const fbr = [PX, PY];
  if (side) { if (x1 < G.camX) quadO(c, ntr, ftr, fbr, nbr, side); else if (x0 > G.camX) quadO(c, ntl, ftl, fbl, nbl, side); }
  if (top && G.camH > y1) quadO(c, ntl, ntr, ftr, ftl, top);
  if (front) quadO(c, nbl, nbr, ntr, ntl, front);
  return { nbl, nbr, ntl, ntr };
}
function stripes(c, f, a, b) {
  const x = f.ntl[0], y = f.ntl[1], w = f.nbr[0] - x, h = f.nbr[1] - y; if (w < 2) return;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = b;
  const n = 5, sw = w / n; for (let i = -1; i < n + 1; i += 2) { c.beginPath(); c.moveTo(x + i * sw, y + h); c.lineTo(x + (i + 1) * sw, y + h); c.lineTo(x + (i + 1) * sw + h * 0.6, y); c.lineTo(x + i * sw + h * 0.6, y); c.closePath(); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, w, h * 0.16);
  c.restore(); c.strokeRect(x, y, w, h);
}
function drawLow(c, o) {
  const ra = o.z0 - G.z; if (ra + DZP < 0.5) return; const rb = ra + 0.3, p = palAt(o.z0), x0 = o.x - 0.95, x1 = o.x + 0.95;
  shadowQuad(c, x0, x1 + 0.3, ra + 0.15, rb + 0.6);
  setLW(c, ra);
  drawBox(c, x0 + 0.12, x0 + 0.3, 0, 0.5, ra + 0.05, rb - 0.05, '#5b6470', '#7b8591', '#46505a');
  drawBox(c, x1 - 0.3, x1 - 0.12, 0, 0.5, ra + 0.05, rb - 0.05, '#5b6470', '#7b8591', '#46505a');
  const f = drawBox(c, x0, x1, 0.45, 1.0, ra, rb, p.bar0, p.bar1, p.bar0);
  stripes(c, f, p.bar0, p.bar1);
}
function drawHigh(c, o) {
  const ra = o.z0 - G.z; if (ra + DZP < 0.5) return; const rb = ra + 0.35, p = palAt(o.z0), x0 = o.x - 0.98, x1 = o.x + 0.98;
  shadowQuad(c, x0, x1 + 0.5, ra + 0.2, rb + 1.2);
  setLW(c, ra);
  drawBox(c, x0, x0 + 0.2, 0, 2.6, ra, rb, '#6a7480', '#8a949f', '#525c66');
  drawBox(c, x1 - 0.2, x1, 0, 2.6, ra, rb, '#6a7480', '#8a949f', '#525c66');
  const f = drawBox(c, x0 + 0.2, x1 - 0.2, 1.35, 2.45, ra + 0.05, rb - 0.05, p.bar0, p.bar1, p.bar0);
  stripes(c, f, p.bar0, p.bar1);
  if (P(o.x, 2.78, ra)) { const on = Math.sin(G.time * 8 + o.z0) > 0, r = 0.13 * PS; for (const [dx, lit] of [[-0.5, on], [0.5, !on]]) { if (lit) circ(c, PX + dx * PS, PY, r * 2.2, 'rgba(255,235,59,0.3)'); c.beginPath(); c.arc(PX + dx * PS, PY, r, 0, TAU); c.fillStyle = lit ? '#ffeb3b' : '#8d7a00'; c.fill(); c.stroke(); } }
}
function drawRamp(c, o) {
  const p = palAt(o.z0), x0 = o.x - 0.95, x1 = o.x + 0.95, len = o.z1 - o.z0;
  const za = Math.max(o.z0, G.z - DZP + 0.4);
  if (o.z1 <= za) return;
  setLW(c, za - G.z);
  if (x1 < G.camX || x0 > G.camX) {
    const sx = x1 < G.camX ? x1 : x0;
    P(sx, 0, za - G.z); const a = [PX, PY]; P(sx, BLOCK_H * (za - o.z0) / len, za - G.z); const b = [PX, PY]; P(sx, BLOCK_H, o.z1 - G.z); const d = [PX, PY]; P(sx, 0, o.z1 - G.z); const e = [PX, PY];
    quadO(c, a, b, d, e, p.rampSide);
  }
  for (let k = 3; k >= 0; k--) {
    let zs = o.z0 + k * len / 4, ze = zs + len / 4; if (ze <= za) continue; zs = Math.max(zs, za);
    const hs = BLOCK_H * (zs - o.z0) / len, he = BLOCK_H * (ze - o.z0) / len;
    P(x0, hs, zs - G.z); const a = [PX, PY]; P(x1, hs, zs - G.z); const b = [PX, PY]; P(x1, he, ze - G.z); const d = [PX, PY]; P(x0, he, ze - G.z); const e = [PX, PY];
    quadO(c, a, b, d, e, k % 2 ? p.ramp0 : p.ramp1);
    if (P(o.x, (hs + he) / 2 + 0.02, (zs + ze) / 2 - G.z) && PS > 4) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.moveTo(PX - 0.35 * PS, PY + 0.12 * PS); c.lineTo(PX, PY - 0.12 * PS); c.lineTo(PX + 0.35 * PS, PY + 0.12 * PS); c.lineTo(PX + 0.35 * PS, PY + 0.26 * PS); c.lineTo(PX, PY + 0.02 * PS); c.lineTo(PX - 0.35 * PS, PY + 0.26 * PS); c.closePath(); c.fill(); }
  }
}
function drawBlock(c, o) {
  const p = palAt(o.z0), x0 = o.x - 0.95, x1 = o.x + 0.95, H = BLOCK_H;
  const ra = Math.max(o.z0 - G.z, -DZP + 0.4), rb = Math.min(o.z1 - G.z, V.maxDz - DZP);
  if (rb <= ra) return;
  const passed = o.z1 - G.z < 0.5 && Math.abs(o.x - G.x) < 1.6 && G.state !== 'menu';
  if (passed) c.globalAlpha *= 0.45;
  shadowQuad(c, x0 + 0.1, x1 + 0.5, ra + 0.2, rb + 0.9);
  setLW(c, ra);
  const f = drawBox(c, x0, x1, 0, H, ra, rb, null, p.trainRoof, p.trainSide);
  const sideX = x1 < G.camX ? x1 : (x0 > G.camX ? x0 : null);
  if (sideX !== null) {
    const lw = c.lineWidth; c.lineWidth = lw * 0.7;
    for (let zz = o.z0 + 0.7; zz < o.z1 - 1.2; zz += 2.6) {
      const a0 = zz - G.z, a1 = a0 + 1.7; if (a1 < ra || a0 > rb) continue;
      const b0 = Math.max(a0, ra), b1 = Math.min(a1, rb);
      P(sideX, 1.25, b0); const q1 = [PX, PY]; P(sideX, 2.0, b0); const q2 = [PX, PY]; P(sideX, 2.0, b1); const q3 = [PX, PY]; P(sideX, 1.25, b1); const q4 = [PX, PY];
      quadO(c, q1, q2, q3, q4, p.train2);
      P(sideX, 1.85, b0); const h1 = [PX, PY]; P(sideX, 1.85, b1); const h2 = [PX, PY];
      c.save(); c.globalAlpha *= 0.5; quad(c, q2, q3, h2, h1, '#ffffff'); c.restore();
    }
    P(sideX, 0.4, ra); const s1 = [PX, PY]; P(sideX, 0.65, ra); const s2 = [PX, PY]; P(sideX, 0.65, rb); const s3 = [PX, PY]; P(sideX, 0.4, rb); const s4 = [PX, PY];
    quadO(c, s1, s2, s3, s4, p.train1);
    for (const zz of [o.z0 + 1.6, o.z1 - 1.6]) { const rz = zz - G.z; if (rz < ra || rz > rb) continue; if (P(sideX, 0.22, rz)) { c.beginPath(); c.ellipse(PX, PY, 0.17 * PS, 0.26 * PS, 0, 0, TAU); c.fillStyle = '#2a2540'; c.fill(); c.stroke(); } }
    c.lineWidth = lw;
  }
  if (G.camH > H && rb - ra > 4) {
    const mz = clamp((o.z0 + o.z1) / 2 - G.z, ra + 1.4, rb - 1.4);
    drawBox(c, o.x - 0.45, o.x + 0.45, H, H + 0.28, mz - 1.1, mz + 1.1, p.train1, shade2(p.train1), p.trainSide);
  }
  if (o.z0 - G.z > -DZP + 0.4) {
    const g = c.createLinearGradient(0, f.ntl[1], 0, f.nbl[1]); g.addColorStop(0, p.trainRoof); g.addColorStop(1, p.train0);
    quadO(c, f.nbl, f.nbr, f.ntr, f.ntl, g);
    const w = f.nbr[0] - f.nbl[0], h = f.nbl[1] - f.ntl[1], X = f.ntl[0], Y = f.ntl[1];
    if (w > 6) {
      c.fillStyle = p.train2; rr(c, X + w * 0.1, Y + h * 0.1, w * 0.8, h * 0.32, w * 0.07); c.fill(); c.stroke();
      c.save(); rr(c, X + w * 0.1, Y + h * 0.1, w * 0.8, h * 0.32, w * 0.07); c.clip(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(X + w * 0.2, Y + h * 0.1); c.lineTo(X + w * 0.36, Y + h * 0.1); c.lineTo(X + w * 0.22, Y + h * 0.42); c.lineTo(X + w * 0.06, Y + h * 0.42); c.fill(); c.restore();
      if (o.moving) {
        for (const sd of [-1, 1]) { const ex = X + w * 0.5 + sd * w * 0.2, ey = Y + h * 0.27; ell(c, ex, ey, w * 0.09, h * 0.08, '#fff'); circ(c, ex - sd * w * 0.02, ey + h * 0.01, w * 0.045, '#222'); c.save(); c.lineWidth = w * 0.035; c.strokeStyle = '#1d1442'; c.beginPath(); c.moveTo(ex - w * 0.11, ey - h * 0.1 + (sd > 0 ? h * 0.05 : 0)); c.lineTo(ex + w * 0.11, ey - h * 0.1 + (sd > 0 ? 0 : h * 0.05)); c.stroke(); c.restore(); }
      }
      c.fillStyle = p.train1; c.fillRect(X, Y + h * 0.55, w, h * 0.1); c.strokeRect(X, Y + h * 0.55, w, h * 0.1);
      const on = !o.moving || Math.sin(G.time * 18) > 0;
      if (o.moving && on) { circ(c, X + w * 0.18, Y + h * 0.8, w * 0.22, 'rgba(255,250,180,0.35)'); circ(c, X + w * 0.82, Y + h * 0.8, w * 0.22, 'rgba(255,250,180,0.35)'); }
      for (const hx of [0.18, 0.82]) { c.beginPath(); c.arc(X + w * hx, Y + h * 0.8, w * 0.075, 0, TAU); c.fillStyle = on ? '#fff59d' : '#b0a060'; c.fill(); c.stroke(); }
      c.fillStyle = 'rgba(20,10,40,0.45)'; c.fillRect(X, Y + h * 0.92, w, h * 0.08);
    }
  }
  if (passed) c.globalAlpha /= 0.45;
}
function shade2(col) { return col[0] === '#' ? shade(col, 0.25) : col; }
function drawItem(c, it) {
  const rz = it.z - G.z;
  if (it.t === 'coin') {
    if (it.gy !== undefined && !it.mag && rz < 30 && P(it.x, it.gy + 0.02, rz)) ell(c, PX, PY, 0.28 * PS, 0.09 * PS, 'rgba(10,5,30,0.2)');
    if (!P(it.x, it.y, rz)) return; const r = 0.36 * PS; if (r < 0.7) return;
    const sp = Math.cos(G.time * 6 + it.z * 0.4), w = Math.max(0.16, Math.abs(sp)) * r * 2;
    if (r < 3 || !ICON_BMP.coin) { ell(c, PX, PY, w / 2, r, '#ffc21a'); return; }
    c.drawImage(ICON_BMP.coin, PX - w / 2, PY - r, w, r * 2);
  } else if (it.t === 'gem') {
    if (!P(it.x, it.y + Math.sin(G.time * 3 + it.z) * 0.15, rz)) return; const r = 0.5 * PS, k = 0.6 + 0.4 * Math.abs(Math.cos(G.time * 2.5));
    circ(c, PX, PY, r * 1.4, 'rgba(64,196,255,0.22)');
    if (ICON_BMP.gem) c.drawImage(ICON_BMP.gem, PX - r * k, PY - r, r * 2 * k, r * 2);
  } else if (it.t === 'pow') {
    if (!P(it.x, it.y + Math.sin(G.time * 3 + it.z) * 0.18, rz)) return; const r = 0.62 * PS, pw = POW[it.p];
    circ(c, PX, PY, r * (1.3 + 0.1 * Math.sin(G.time * 6)), rgba(pw.col, 0.22));
    const g = c.createRadialGradient(PX - r * 0.3, PY - r * 0.35, r * 0.1, PX, PY, r); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.6, rgba(pw.col, 0.35)); g.addColorStop(1, rgba(pw.col, 0.75));
    c.beginPath(); c.arc(PX, PY, r, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(1.5, r * 0.09); c.strokeStyle = '#ffffff'; c.stroke();
    const bmp = ICON_BMP[it.p]; if (bmp) c.drawImage(bmp, PX - r * 0.78, PY - r * 0.78, r * 1.56, r * 1.56);
    ell(c, PX - r * 0.35, PY - r * 0.5, r * 0.22, r * 0.11, 'rgba(255,255,255,0.8)', -0.5);
  } else if (it.t === 'letter') {
    if (!P(it.x, it.y + Math.sin(G.time * 3) * 0.2, rz)) return; const r = 0.75 * PS;
    circ(c, PX, PY, r * 1.3, 'rgba(255,210,63,0.28)');
    c.save(); c.translate(PX, PY); c.rotate(Math.sin(G.time * 2) * 0.2);
    if (ICON_BMP.star) c.drawImage(ICON_BMP.star, -r, -r, r * 2, r * 2);
    if (r > 5) { c.font = `900 ${Math.round(r * 0.72)}px 'Rubik',sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = r * 0.16; c.strokeStyle = '#1d1442'; c.strokeText(it.ch, 0, r * 0.12); c.fillStyle = '#fff'; c.fillText(it.ch, 0, r * 0.12); }
    c.restore();
  }
}
function drawPlayer(c) {
  if (G.state === 'menu') return;
  if (P(G.x, G.ground, 0)) { const sh = clamp(1 - (G.y - G.ground) / 6, 0.3, 1); ell(c, PX, PY, 0.55 * PS * sh, 0.16 * PS * sh, 'rgba(10,5,30,0.3)'); }
  if (!P(G.x, G.y, 0)) return;
  const dead = G.state === 'dying' || G.state === 'revive' || G.state === 'over';
  if (G.invuln > 0 && G.state === 'play' && Math.floor(G.time * 12) % 2 === 0) c.globalAlpha = 0.5;
  const mode = dead ? 'fall' : (G.power.rocket > 0 ? 'jump' : (G.slide > 0 ? 'slide' : (G.onGround ? 'run' : 'jump')));
  const lean = clamp(((G.lane - 1) * LANE_W - G.x) * 0.12, -0.3, 0.3);
  c.save(); c.translate(PX, PY); const sq = dead ? 1 : G.sq; c.scale(1 / Math.sqrt(sq), sq); c.translate(-PX, -PY);
  drawPetBack(c, G.ch, PX, PY, PS, { t: G.time, phase: G.phase, mode, rocket: G.power.rocket > 0, rot: dead ? Math.sin(Math.min(G.deathT, 1) * 3) * 0.3 : lean });
  c.restore();
  c.globalAlpha = 1;
  if (dead && ICON_BMP.star && P(G.x, G.y + 1.9, 0)) { for (let i = 0; i < 3; i++) { const a = G.time * 4 + i * 2.1, r = 0.2 * PS; c.drawImage(ICON_BMP.star, PX + Math.cos(a) * 0.5 * PS - r, PY + Math.sin(a) * 0.15 * PS - r, r * 2, r * 2); } }
  if (G.shield && P(G.x, G.y + 0.8, 0)) { const r = 1.05 * PS * (1 + 0.04 * Math.sin(G.time * 6)); const g = c.createRadialGradient(PX, PY, r * 0.6, PX, PY, r); g.addColorStop(0, 'rgba(120,220,255,0.05)'); g.addColorStop(1, 'rgba(120,220,255,0.35)'); circ(c, PX, PY, r, g); c.save(); c.lineWidth = Math.max(2, PS * 0.06); c.strokeStyle = 'rgba(190,240,255,0.95)'; c.beginPath(); c.arc(PX, PY, r, 0, TAU); c.stroke(); c.restore(); ell(c, PX - r * 0.45, PY - r * 0.55, r * 0.22, r * 0.1, 'rgba(255,255,255,0.8)', -0.6); }
  if (G.power.magnet > 0 && P(G.x, G.y + 0.8, 0)) { for (let i = 0; i < 4; i++) { const a = G.time * 5 + i * 1.57; circ(c, PX + Math.cos(a) * 0.9 * PS, PY + Math.sin(a) * 0.35 * PS, 0.07 * PS, '#ff4d5e'); } }
}
function star4(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }
function drawPart(c, p) {
  if (!P(p.x, p.y, p.z - G.z)) return; const a = clamp(p.life / p.max, 0, 1);
  c.globalAlpha = a;
  if (p.star && ICON_BMP.star) { const r = Math.max(4, p.size * 2 * PS); c.drawImage(ICON_BMP.star, PX - r, PY - r, r * 2, r * 2); }
  else if (p.s4) { c.fillStyle = p.col; star4(c, PX, PY, Math.max(2, p.size * PS * (0.6 + a))); }
  else circ(c, PX, PY, Math.max(1, p.size * PS), p.col);
  c.globalAlpha = 1;
}

/* ortam efektleri (kar, şeker, yaprak, kıvılcım, yıldız) */
function updAmbient(dt) {
  const fx = biomeAt(G.z).fx;
  if (G.amb.length < 46) G.amb.push({ x: Math.random(), y: Math.random(), s: rand(0.5, 1.4), r: rand(0, 6), c: pick(['#ff5252', '#ffd23f', '#69f0ae', '#40c4ff', '#ffffff', '#b388ff']) });
  const sp = (G.state === 'play' ? G.speed : 7) / 14;
  for (const a of G.amb) {
    if (fx === 'snow' || fx === 'sprinkles') { a.y += dt * 0.12 * a.s; a.x += Math.sin(G.time + a.r) * dt * 0.02; }
    else if (fx === 'leaves') { a.y += dt * 0.08 * a.s; a.x += dt * 0.05 * Math.sin(G.time * 0.7 + a.r); a.r += dt * 2; }
    else if (fx === 'embers') { a.y -= dt * 0.1 * a.s; a.x += Math.sin(G.time * 2 + a.r) * dt * 0.02; }
    else if (fx === 'stars') { const dx = a.x - 0.5, dy = a.y - V.horizonY / V.H; a.x += dx * dt * 1.6 * sp; a.y += dy * dt * 1.6 * sp; if (Math.abs(dx) > 0.7 || a.y > 1.1 || a.y < -0.1) { a.x = 0.5 + rand(-0.15, 0.15); a.y = V.horizonY / V.H + rand(-0.1, 0.1); } }
    if (a.y > 1.05) { a.y = -0.05; a.x = Math.random(); } if (a.y < -0.06) { a.y = 1.04; a.x = Math.random(); }
    if (a.x < -0.05) a.x += 1.1; if (a.x > 1.05) a.x -= 1.1;
  }
}
function drawAmbient(c) {
  const fx = biomeAt(G.z).fx; if (!fx) return;
  const m = Math.min(V.W, V.H) / 500;
  for (const a of G.amb) {
    const x = a.x * V.W, y = a.y * V.H;
    if (fx === 'snow') circ(c, x, y, 2.5 * a.s * m, 'rgba(255,255,255,0.9)');
    else if (fx === 'sprinkles') { c.save(); c.translate(x, y); c.rotate(a.r + G.time); c.fillStyle = a.c; rr(c, -4 * m, -1.5 * m, 8 * m, 3 * m, 1.5 * m); c.fill(); c.restore(); }
    else if (fx === 'leaves') ell(c, x, y, 5 * m * a.s, 2.5 * m * a.s, a.s > 1 ? '#7cb342' : '#558b2f', a.r);
    else if (fx === 'embers') circ(c, x, y, 2 * a.s * m, a.s > 1 ? '#ffab40' : '#ff3d00');
    else if (fx === 'stars') { const dx = x - V.W / 2, dy = y - V.horizonY, d = Math.hypot(dx, dy) + 1; c.strokeStyle = 'rgba(200,230,255,0.7)'; c.lineWidth = 1.5 * m; c.beginPath(); c.moveTo(x, y); c.lineTo(x - dx / d * 14 * m * a.s, y - dy / d * 14 * m * a.s); c.stroke(); }
  }
}
function drawScreenFX(c) {
  if (G.state === 'play') {
    const fast = G.power.rocket > 0 ? 1 : clamp((G.speed - 20) / 8, 0, 1);
    if (fast > 0) {
      c.strokeStyle = `rgba(255,255,255,${0.18 + 0.2 * fast})`; c.lineWidth = 2; const n = Math.round(4 + 10 * fast);
      for (let i = 0; i < n; i++) { const left = i % 2 === 0, x = left ? rand(0, V.W * 0.14) : V.W - rand(0, V.W * 0.14), y = rand(V.H * 0.2, V.H), L = rand(30, 90) * (0.6 + fast); const dx = x - V.W / 2, dy = y - V.horizonY, d = Math.hypot(dx, dy) + 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx / d * L, y + dy / d * L); c.stroke(); }
    }
  }
  if (!vignette) { vignette = c.createRadialGradient(V.W / 2, V.H * 0.55, Math.min(V.W, V.H) * 0.45, V.W / 2, V.H * 0.55, Math.max(V.W, V.H) * 0.8); vignette.addColorStop(0, 'rgba(15,8,40,0)'); vignette.addColorStop(1, 'rgba(15,8,40,0.32)'); }
  c.fillStyle = vignette; c.fillRect(0, 0, V.W, V.H);
  if ((G.state === 'play' || G.state === 'dying') && G.stumbleT < 7) {
    const a = 0.25 + 0.15 * Math.sin(G.time * 10); const g = c.createRadialGradient(V.W / 2, V.H / 2, Math.min(V.W, V.H) * 0.35, V.W / 2, V.H / 2, Math.max(V.W, V.H) * 0.75);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(255,0,40,${a})`); c.fillStyle = g; c.fillRect(0, 0, V.W, V.H);
  }
  if (G.flash > 0) { c.fillStyle = `rgba(255,255,255,${G.flash})`; c.fillRect(0, 0, V.W, V.H); }
  for (const p of G.sparts) { c.save(); c.globalAlpha = clamp(p.life, 0, 1); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
}

function render() { if (USE3D) render3D(); else render2D(); }
function render2D() {
  palReset();
  const c = ctx; c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  c.save();
  if (G.shake > 0) c.translate((Math.random() - 0.5) * G.shake * 26, (Math.random() - 0.5) * G.shake * 26);
  const pal = palAt(G.z);
  drawSky(c, pal); drawHills(c, pal);
  c.fillStyle = palAt(G.z + V.maxDz).ground0; c.fillRect(-30, V.horizonY, V.W + 60, V.H - V.horizonY + 40);
  drawRoad(c);
  DLn = 0;
  const maxR = V.maxDz - DZP;
  const i0 = Math.floor((G.z - 4) / 7), i1 = Math.floor((G.z + maxR) / 7);
  for (let i = i0; i <= i1; i++) {
    const zw = i * 7, rz = zw - G.z; if (rz + DZP < 0.8 || rz > maxR) continue;
    for (const side of [-1, 1]) {
      const h = hash01(i * 2 + (side > 0 ? 1 : 0)); if (h < 0.15) continue;
      const B = biomeAt(zw), type = B.decor[Math.floor(hash01(i * 7 + side * 3 + 11) * B.decor.length)];
      dl(rz + DZP, 'decor', type, side * (RH + 1.7 + h * 3.6), zw);
    }
  }
  dl(Math.min(64, V.maxDz - 8), 'fog', null, 0.4); dl(36, 'fog', null, 0.16);
  if (G.state !== 'menu') {
    for (const o of G.obs) {
      if (o.dead) continue; const r0 = o.z0 - G.z, r1 = o.z1 - G.z;
      if (r1 + DZP < 0.4 || r0 > maxR) continue;
      let key = r0 + DZP; if (o.t === 'block' || o.t === 'ramp') key = Math.max(r0, Math.min(0.02, r1)) + DZP + (o.t === 'block' ? 0.01 : 0);
      dl(key, 'obs', o);
    }
    for (const it of G.items) { if (it.dead) continue; const rz = it.z - G.z; if (rz + DZP < 0.5 || rz > maxR) continue; dl(rz + DZP, 'item', it); }
    for (const p of G.parts) { const dz = p.z - G.z + DZP; if (dz > 2.5) dl(dz, 'part', p); }
    dl(DZP, 'player', null);
    if (G.chaserZ > -5.2) dl(G.chaserZ + DZP, 'chaser', null);
  }
  const arr = DL.slice(0, DLn); arr.sort((a, b) => b.dz - a.dz);
  c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OL;
  for (const e of arr) {
    c.globalAlpha = fadeA(e.dz);
    switch (e.kind) {
      case 'decor': if (P(e.a, 0, e.b - G.z)) drawDecor(c, e.o, PX, PY, PS, hash01(e.b * 3 + (e.a > 0 ? 1 : 0)), G.time); break;
      case 'fog': c.globalAlpha = 1; drawFog(c, e.dz, e.a); break;
      case 'obs': { const o = e.o; c.strokeStyle = OL; if (o.t === 'block') drawBlock(c, o); else if (o.t === 'ramp') drawRamp(c, o); else if (o.t === 'low') drawLow(c, o); else drawHigh(c, o); break; }
      case 'item': drawItem(c, e.o); break;
      case 'part': drawPart(c, e.o); break;
      case 'player': c.globalAlpha = 1; drawPlayer(c); break;
      case 'chaser': c.globalAlpha = 1; if (P(G.chaserX, 0, G.chaserZ)) drawVacuum(c, PX, PY, PS * 0.8, G.time); break;
    }
  }
  c.globalAlpha = 1;
  drawAmbient(c);
  c.restore();
  drawScreenFX(c);
}

/* =========================================================
   3B ÇİZİM
   ========================================================= */
function init3D() {
  try { R = new R3(glc); makeSprites(); buildWorld(); USE3D = true; R.size(V.W || innerWidth, V.H || innerHeight, Math.min(V.dpr || 1, 1.5)); }
  catch (e) { console.warn('3B kapalı:', e); USE3D = false; R = null; glc.style.display = 'none'; fxc.style.display = 'none'; }
}
const _pc = new Map();
function col3(str) {
  let v = _pc.get(str); if (v) return v;
  if (str[0] === '#') v = hex3(str); else { const m = str.match(/[\d.]+/g) || [255, 255, 255]; v = [m[0] / 255, m[1] / 255, m[2] / 255]; }
  _pc.set(str, v); return v;
}
const MM = new Float32Array(16);
function cam3D() {
  const asp = V.W / V.H, port = asp < 1, fov = (port ? 68 : 50) * Math.PI / 180, th = Math.tan(fov / 2);
  const D = Math.max(port ? 6.5 : 8.6, 3.1 / (th * asp)), elev = (port ? 30 : 25) * Math.PI / 180, ch = D * Math.tan(elev);
  const pitch = elev - Math.atan(0.6 * th);
  return { fov, asp, D, ch, pitch, th };
}
function render3D() {
  palReset();
  const C = cam3D(), pal = palAt(G.z);
  V.horizonY = V.H / 2 * (1 - Math.tan(C.pitch) / C.th);
  /* arka plan (gökyüzü + tepeler) */
  const c = ctx; c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  drawSky(c, pal); drawHills(c, pal);
  const gg = c.createLinearGradient(0, V.horizonY, 0, V.H); gg.addColorStop(0, pal.sky1); gg.addColorStop(0.12, palAt(G.z + 80).ground0); gg.addColorStop(1, pal.ground0);
  c.fillStyle = gg; c.fillRect(-30, V.horizonY, V.W + 60, V.H - V.horizonY + 40);
  /* kamera */
  const shk = G.shake > 0 ? G.shake * 0.35 : 0;
  const yo = G.camH - V.camY, ex = G.camX + (Math.random() - 0.5) * shk, ey = C.ch + yo + (Math.random() - 0.5) * shk, ez = -C.D;
  R.clear(); R.camera(C.fov, C.asp, ex, ey, ez, ex, ey - Math.sin(C.pitch) * 20, ez + Math.cos(C.pitch) * 20, 0.3, 200);
  R.bend[0] = G.curve * 1.2; R.bend[1] = 0.00028;
  const e = R.env, fogc = col3(pal.sky1), gc = col3(pal.ground0);
  e.fog = fogc; e.sky = [Math.min(1, fogc[0] * 0.6 + 0.45), Math.min(1, fogc[1] * 0.6 + 0.45), Math.min(1, fogc[2] * 0.6 + 0.45)]; e.gnd = [gc[0] * 0.7, gc[1] * 0.7, gc[2] * 0.7]; e.fogR = [28, 112 + C.D * 0.3, 0.8];
  R.begin();
  const far = 118, near = -C.D - 2, T = [], S = [];
  /* yol karoları */
  for (let t = Math.floor((G.z + near) / TILE); t <= Math.floor((G.z + far) / TILE); t++) {
    const bi = Math.floor(Math.max(0, t * TILE) / BIOME_LEN) % BIOMES.length;
    R.draw(MOD.track[bi][t & 1], M4.trs(MM, 0, 0, t * TILE - G.z, 0, 0, 0, 1));
  }
  /* süsler */
  const i0 = Math.floor((G.z + near) / 7), i1 = Math.floor((G.z + far - 4) / 7);
  for (let i = i0; i <= i1; i++) {
    const zw = i * 7, rz = zw - G.z; if (zw < -20) continue;
    for (const side of [-1, 1]) {
      const h = hash01(i * 2 + (side > 0 ? 1 : 0)); if (h < 0.15) continue;
      const B = biomeAt(zw), type = B.decor[Math.floor(hash01(i * 7 + side * 3 + 11) * B.decor.length)], vs = MOD.decor[type]; if (!vs) continue;
      const h2 = hash01(i * 13 + side * 5 + 3), mesh = vs[Math.floor(h2 * vs.length)], sc = 0.85 + h2 * 0.45;
      const ry = type === 'house' ? (side < 0 ? Math.PI / 2 : -Math.PI / 2) : h * TAU;
      R.draw(mesh, M4.trs(MM, side * (RH + 2.3 + h * 5), 0, rz, ry, 0, 0, sc), rz < 60 ? { out: 0.05 } : null);
    }
  }
  if (G.state !== 'menu') {
    /* engeller */
    for (const o of G.obs) {
      if (o.dead) continue; const r0 = o.z0 - G.z, r1 = o.z1 - G.z; if (r1 < near || r0 > far) continue;
      const bi = Math.floor(Math.max(0, o.z0) / BIOME_LEN) % BIOMES.length, len = o.z1 - o.z0;
      let mesh, sz = 1;
      if (o.t === 'low') mesh = MOD.low[bi]; else if (o.t === 'high') mesh = MOD.high[bi];
      else if (o.t === 'ramp') { mesh = MOD.ramp[bi]; sz = len / 6; }
      else mesh = trainMesh(bi, Math.max(4, Math.round(len)), o.moving);
      M4.trs(MM, o.x, 0, r0, 0, 0, 0, 1, 1, sz);
      const passed = o.t === 'block' && r1 < 0.4 && Math.abs(o.x - G.camX) < 1.6;
      if (passed) T.push({ z: r0, mesh, m: MM.slice(), o: { a: 0.35 } });
      else R.draw(mesh, MM, r0 < 70 ? { out: 0.05 } : null);
      if (r0 > near + 2) { const sl = o.t === 'block' ? len + 0.6 : o.t === 'ramp' ? 0 : 0.8; if (sl) T.push({ z: r0 + 50, mesh: MOD.disc, m: M4.trs(new Float32Array(16), o.x + 0.2, 0.05, r0 + len / 2, 0, 0, 0, 2.3, 1, sl), o: { a: 0.22, emit: 1 } }); }
    }
    /* toplanabilirler */
    for (const it of G.items) {
      if (it.dead) continue; const rz = it.z - G.z; if (rz < near || rz > far) continue;
      if (it.t === 'coin') {
        R.draw(MOD.coin, M4.trs(MM, it.x, it.y, rz, G.time * 4 + it.z * 0.3, 0, 0, 1), rz < 45 ? { out: 0.03 } : null);
        if (it.gy !== undefined && !it.mag && rz < 30) T.push({ z: rz + 60, mesh: MOD.disc, m: M4.trs(new Float32Array(16), it.x, it.gy + 0.06, rz, 0, 0, 0, 0.55), o: { a: 0.18, emit: 1 } });
      } else if (it.t === 'gem') {
        R.draw(MOD.gem, M4.trs(MM, it.x, it.y + Math.sin(G.time * 3 + it.z) * 0.15, rz, G.time * 2.5, 0, 0, 1), { out: 0.035 });
        S.push({ img: SPR.soft, x: it.x, y: it.y, z: rz, w: 0.9, h: 0.9, a: 0.45, col: [0.4, 0.8, 1] });
      } else if (it.t === 'pow') {
        const by = it.y + Math.sin(G.time * 3 + it.z) * 0.18, pc = col3(POW[it.p].col);
        T.push({ z: rz, mesh: MOD.ball, m: M4.trs(new Float32Array(16), it.x, by, rz, 0, 0, 0, 1.25), o: { a: 0.42, tint: [pc[0], pc[1], pc[2], 0.7], emit: 0.3 } });
        if (ICON_BMP[it.p]) S.push({ img: ICON_BMP[it.p], x: it.x, y: by, z: rz - 0.1, w: 0.48, h: 0.48 });
      } else if (it.t === 'letter') {
        S.push({ img: SPR.soft, x: it.x, y: it.y, z: rz + 0.1, w: 1.1, h: 1.1, a: 0.5, col: [1, 0.85, 0.3] });
        S.push({ img: letterSprite(it.ch), x: it.x, y: it.y + Math.sin(G.time * 3) * 0.2, z: rz, w: 0.65, h: 0.65, rot: Math.sin(G.time * 2) * 0.2 });
      }
    }
    /* oyuncu */
    const dead = G.state === 'dying' || G.state === 'revive' || G.state === 'over';
    const mode = dead ? 'fall' : (G.power.rocket > 0 ? 'jump' : (G.slide > 0 ? 'slide' : (G.onGround ? 'run' : 'jump')));
    const blink = G.invuln > 0 && G.state === 'play' && Math.floor(G.time * 12) % 2 === 0;
    if (!blink) drawChar(R, G.ch, { x: G.x, y: G.y, z: 0, mode, phase: G.phase, t: G.time, sq: dead ? 1 : G.sq, lean: clamp(((G.lane - 1) * LANE_W - G.x) * 0.1, -0.3, 0.3), rocket: G.power.rocket > 0, rot: dead ? -Math.min(G.deathT, 0.4) * 1.5 : 0 }, 0.035);
    const shs = clamp(1 - (G.y - G.ground) / 7, 0.3, 1);
    T.push({ z: 40, mesh: MOD.disc, m: M4.trs(new Float32Array(16), G.x, G.ground + 0.06, 0, 0, 0, 0, 1.1 * shs, 1, 0.9 * shs), o: { a: 0.3, emit: 1 } });
    if (G.shield) T.push({ z: -0.5, mesh: MOD.ball, m: M4.trs(new Float32Array(16), G.x, G.y + 0.85, 0, 0, 0, 0, 2.3 + Math.sin(G.time * 6) * 0.05), o: { a: 0.22, tint: [0.5, 0.85, 1, 1], emit: 0.5 } });
    if (G.power.magnet > 0) for (let i = 0; i < 4; i++) { const a = G.time * 5 + i * 1.57; R.draw(MOD.orb, M4.trs(MM, G.x + Math.cos(a) * 0.9, G.y + 0.8, Math.sin(a) * 0.5, 0, 0, 0, 1), { emit: 0.4 }); }
    if (dead && ICON_BMP.star) for (let i = 0; i < 3; i++) { const a = G.time * 4 + i * 2.1; S.push({ img: ICON_BMP.star, x: G.x + Math.cos(a) * 0.55, y: G.y + 2.0, z: Math.sin(a) * 0.4, w: 0.22, h: 0.22 }); }
    /* Süpürgeç */
    if (G.chaserZ > -C.D + 0.8) {
      const cz = G.chaserZ - 1.3;
      R.draw(MOD.vac, M4.trs(MM, G.chaserX, 0, cz, 0, 0, 0, 0.9), { out: 0.04 });
      const on = Math.sin(G.time * 16) > 0;
      R.draw(MOD.siren, M4.trs(MM, G.chaserX, 0, cz, 0, 0, 0, 0.9), { emit: on ? 0.9 : 0.1, tint: on ? [1, 0.2, 0.3, 0.3] : [0.4, 0, 0, 0.5] });
      for (const sx of [-1, 1]) R.draw(MOD.brush, M4.trs(MM, G.chaserX + sx * 1.12, 0.1, cz + 0.65, G.time * 14 * sx, 0, 0, 0.9), null);
    }
    /* parçacıklar */
    for (const p of G.parts) {
      const rz = p.z - G.z; if (rz < -1.5) continue; const a = clamp(p.life / p.max, 0, 1), sz = Math.max(0.08, p.size * 2.2);
      if (p.star) S.push({ img: ICON_BMP.star || SPR.dot, x: p.x, y: p.y, z: rz, w: sz, h: sz, a });
      else S.push({ img: p.s4 ? SPR.spark : SPR.soft, x: p.x, y: p.y, z: rz, w: sz * (p.s4 ? 1.4 : 1), h: sz * (p.s4 ? 1.4 : 1), a, col: col3(p.col), rot: p.s4 ? G.time * 3 : 0 });
    }
    /* saydam geçiş */
    T.sort((a, b) => b.z - a.z);
    for (const q of T) R.draw(q.mesh, q.m, q.o);
    S.sort((a, b) => b.z - a.z);
    R.sprites(S);
  }
  /* ön efektler */
  const f = fxx; f.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); f.clearRect(0, 0, V.W, V.H);
  drawAmbient(f); drawScreenFX(f);
}
