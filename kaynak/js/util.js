'use strict';
/* =========================================================
   TURBO PATİLER — yardımcılar, kayıt, ses ve reklam katmanı
   ========================================================= */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function wpick(list) { let s = 0; for (const e of list) s += e[1]; let r = Math.random() * s; for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; } return list[list.length - 1][0]; }
function hash01(n) { let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function fmt(n) { n = Math.floor(n); return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dayNum() { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
function vib(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

/* ---------------- KAYIT ---------------- */
const SAVE_KEY = 'turbo_patiler_v1';
function defaultSave() {
  return {
    v: 1, coins: 0, gems: 3, best: 0, bestDist: 0, xp: 0, level: 1,
    owned: ['minnos'], sel: 'minnos',
    upg: { magnet: 0, double: 0, rocket: 0, spring: 0 },
    items: { shield: 1, headstart: 1 },
    missionSet: 0, missions: [],
    stats: { runs: 0, coins: 0, dist: 0, jumps: 0, slides: 0, powerups: 0, ramps: 0 },
    daily: { claimed: -1, streak: 0 },
    word: { day: -1, w: '', got: 0, done: false },
    free: { day: -1, coins: 0, gems: 0, lastCoins: 0, lastGems: 0 },
    set: { music: true, sfx: true },
    tutorialDone: false
  };
}
let S = defaultSave();
function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
function merge(base, o) { for (const k in o) { if (isObj(base[k]) && isObj(o[k])) merge(base[k], o[k]); else if (o[k] !== undefined) base[k] = o[k]; } return base; }
function loadSave() { try { const r = localStorage.getItem(SAVE_KEY); if (r) S = merge(defaultSave(), JSON.parse(r)); } catch (e) { S = defaultSave(); } }
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }

/* ---------------- SES (WebAudio, dosya gerektirmez) ---------------- */
const Sound = {
  ctx: null, master: null, music: null, sfx: null, noiseBuf: null,
  timer: null, step: 0, nextTime: 0, key: 0, intensity: 0, coinStreak: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(comp);
    this.music = c.createGain(); this.music.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.apply();
    const len = c.sampleRate; const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    this.nextTime = c.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  apply() { if (!this.ctx) return; this.music.gain.value = S.set.music ? 0.32 : 0; this.sfx.gain.value = S.set.sfx ? 0.7 : 0; },
  duck(on) { if (!this.ctx) return; this.master.gain.setTargetAtTime(on ? 0 : 0.9, this.ctx.currentTime, 0.05); },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => { }); },
  resumeCtx() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); },
  setKey(k) { this.key = k; },
  tone(f, dur, o = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const v = o.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || this.sfx); osc.start(t); osc.stop(t + dur + 0.03);
  },
  noise(dur, o = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.freq || 2000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(o.vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfx); src.start(t); src.stop(t + dur + 0.03);
  },
  play(n) {
    if (!this.ctx || !S.set.sfx) return;
    const T = this;
    switch (n) {
      case 'coin': { const f = 1046 * Math.pow(1.0595, Math.min(this.coinStreak, 12)); T.tone(f, 0.07, { type: 'square', vol: 0.05 }); T.tone(f * 1.5, 0.12, { type: 'square', vol: 0.045, delay: 0.045 }); break; }
      case 'gem': [1046, 1318, 1568, 2093].forEach((f, i) => T.tone(f, 0.14, { type: 'triangle', vol: 0.14, delay: i * 0.05 })); break;
      case 'jump': T.tone(300, 0.16, { type: 'square', vol: 0.07, to: 640 }); break;
      case 'spring': T.tone(200, 0.32, { vol: 0.22, to: 950 }); T.tone(400, 0.3, { type: 'triangle', vol: 0.06, to: 1700 }); break;
      case 'slide': T.noise(0.28, { vol: 0.2, freq: 1600, to: 300, type: 'bandpass' }); break;
      case 'land': T.noise(0.07, { vol: 0.12, freq: 500 }); break;
      case 'whoosh': T.noise(0.13, { vol: 0.12, freq: 2400, to: 700, type: 'bandpass' }); break;
      case 'bump': T.tone(120, 0.08, { type: 'square', vol: 0.08 }); break;
      case 'stumble': T.tone(220, 0.25, { type: 'sawtooth', vol: 0.15, to: 80 }); T.noise(0.15, { vol: 0.2, freq: 600 }); break;
      case 'crash': T.noise(0.6, { vol: 0.45, freq: 1300, to: 80 }); T.tone(130, 0.45, { type: 'square', vol: 0.18, to: 35 }); break;
      case 'caught': T.tone(420, 0.55, { type: 'sawtooth', vol: 0.12, to: 60 }); T.noise(0.5, { vol: 0.3, freq: 900, to: 100 }); break;
      case 'power': [523, 659, 784, 1046].forEach((f, i) => T.tone(f, 0.1, { type: 'square', vol: 0.07, delay: i * 0.06 })); break;
      case 'rocket': T.tone(90, 0.7, { type: 'sawtooth', vol: 0.12, to: 700 }); T.noise(0.8, { vol: 0.22, freq: 400, to: 3000 }); break;
      case 'shield': T.noise(0.3, { vol: 0.25, freq: 4000, type: 'highpass' }); T.tone(1200, 0.3, { type: 'triangle', vol: 0.12, to: 300 }); break;
      case 'click': T.tone(700, 0.05, { type: 'triangle', vol: 0.12 }); break;
      case 'buy': [784, 988, 1175, 1568].forEach((f, i) => T.tone(f, 0.09, { type: 'square', vol: 0.06, delay: i * 0.05 })); break;
      case 'deny': T.tone(180, 0.12, { type: 'square', vol: 0.1 }); T.tone(150, 0.15, { type: 'square', vol: 0.1, delay: 0.12 }); break;
      case 'mission': [523, 659, 784, 1046, 1318].forEach((f, i) => T.tone(f, 0.2, { type: 'triangle', vol: 0.14, delay: i * 0.08 })); break;
      case 'letter': T.tone(1568, 0.15, { vol: 0.15 }); T.tone(2093, 0.25, { vol: 0.12, delay: 0.08 }); break;
      case 'revive': T.tone(220, 0.6, { vol: 0.2, to: 1200 }); break;
      case 'horn': T.tone(330, 0.45, { type: 'square', vol: 0.07 }); T.tone(415, 0.45, { type: 'square', vol: 0.06 }); break;
      case 'biome': [392, 523, 659, 784].forEach((f, i) => T.tone(f, 0.22, { type: 'triangle', vol: 0.11, delay: i * 0.09 })); break;
      case 'count': T.tone(880, 0.12, { type: 'square', vol: 0.08 }); break;
      case 'go': T.tone(1320, 0.25, { type: 'square', vol: 0.08 }); break;
    }
  },
  /* --- sonsuz, neşeli müzik döngüsü (C-G-Am-F) --- */
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const spb = 60 / 132 / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) { this.playStep(this.step, this.nextTime); this.nextTime += spb; this.step = (this.step + 1) % 128; }
  },
  mtone(f, t, dur, type, vol) {
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.music); osc.start(t); osc.stop(t + dur + 0.02);
  },
  playStep(s, t) {
    if (!S.set.music) return;
    const bar = Math.floor(s / 16) % 4, st = s % 16, half = s >= 64;
    const roots = [0, 7, 9, 5], chords = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
    const base = 48 + this.key, mf = m => 440 * Math.pow(2, (m - 69) / 12);
    if (st % 4 === 0 || st === 14) this.mtone(mf(base - 12 + roots[bar]), t, 0.2, 'triangle', 0.24);
    if (st % 2 === 0) { const ch = chords[bar]; this.mtone(mf(base + 12 + ch[(st / 2) % 3] + (st >= 8 ? 12 : 0)), t, 0.11, 'square', 0.035); }
    const MEL = [{ 0: 4, 3: 7, 6: 12, 8: 11, 10: 7, 12: 4, 14: 2 }, { 0: 2, 3: 7, 6: 11, 8: 14, 10: 11, 12: 7, 14: 5 }, { 0: 4, 3: 9, 6: 12, 8: 16, 10: 12, 12: 9, 14: 7 }, { 0: 5, 3: 9, 6: 12, 8: 9, 10: 7, 12: 5, 14: 4 }];
    if (half || this.intensity > 0) { const m = MEL[bar][st]; if (m !== undefined) this.mtone(mf(base + 24 + m), t, 0.22, 'triangle', 0.075); }
    if (this.intensity > 0) {
      const c = this.ctx;
      if (st % 4 === 0) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.16); }
      if (st === 4 || st === 12) this.noise(0.12, { vol: 0.13, freq: 1200, type: 'highpass', dest: this.music, delay: t - c.currentTime });
      if (st % 2 === 1) this.noise(0.03, { vol: 0.04, freq: 7000, type: 'highpass', dest: this.music, delay: t - c.currentTime });
    }
  }
};

/* ---------------- REKLAM KATMANI ----------------
   Poki veya CrazyGames SDK'sı sayfaya eklendiğinde otomatik onu kullanır.
   Hiçbiri yoksa "TEST" modunda sahte bir reklam ekranı gösterir.
   - Ödüllü reklam: oyuncu isterse (devam et, 2x altın, bedava altın/elmas)
   - Geçiş reklamı: yalnızca oyun aralarında, sık olmayacak şekilde        */
const Ads = {
  provider: 'test', busy: false, lastInter: 0, runsSinceInter: 0, skipNext: false,
  sdk() { return window.CrazyGames && window.CrazyGames.SDK; },
  async init() {
    try {
      if (window.PokiSDK) { await window.PokiSDK.init(); this.provider = 'poki'; }
      else if (this.sdk()) { await this.sdk().init(); this.provider = 'crazy'; }
    } catch (e) { if (window.PokiSDK) this.provider = 'poki'; }
  },
  loaded() { try { if (this.provider === 'poki') window.PokiSDK.gameLoadingFinished(); if (this.provider === 'crazy') this.sdk().game.loadingStop(); } catch (e) { } },
  start() { try { if (this.provider === 'poki') window.PokiSDK.gameplayStart(); if (this.provider === 'crazy') this.sdk().game.gameplayStart(); } catch (e) { } },
  stop() { try { if (this.provider === 'poki') window.PokiSDK.gameplayStop(); if (this.provider === 'crazy') this.sdk().game.gameplayStop(); } catch (e) { } },
  happy() { try { if (this.provider === 'poki' && window.PokiSDK.happyTime) window.PokiSDK.happyTime(1); if (this.provider === 'crazy') this.sdk().game.happytime(); } catch (e) { } },
  rewarded() {
    return new Promise(res => {
      if (this.busy) return res(false);
      this.busy = true; Sound.duck(true);
      let fin = false;
      const done = ok => { if (fin) return; fin = true; this.busy = false; Sound.duck(false); if (ok) this.skipNext = true; res(!!ok); };
      try {
        if (this.provider === 'poki') window.PokiSDK.rewardedBreak().then(ok => done(ok)).catch(() => done(false));
        else if (this.provider === 'crazy') this.sdk().ad.requestAd('rewarded', { adStarted() { }, adFinished() { done(true); }, adError() { done(false); } });
        else TestAd.show(true, done);
      } catch (e) { done(false); }
    });
  },
  interstitial() {
    return new Promise(res => {
      if (this.skipNext) { this.skipNext = false; return res(); }
      if (this.busy) return res();
      if (this.provider === 'test') {
        this.runsSinceInter++;
        if (S.stats.runs < 3 || this.runsSinceInter < 3 || Date.now() - this.lastInter < 150000) return res();
      }
      this.busy = true; Sound.duck(true);
      let fin = false;
      const done = () => { if (fin) return; fin = true; this.busy = false; Sound.duck(false); this.lastInter = Date.now(); this.runsSinceInter = 0; res(); };
      try {
        if (this.provider === 'poki') window.PokiSDK.commercialBreak().then(done).catch(done);
        else if (this.provider === 'crazy') this.sdk().ad.requestAd('midgame', { adStarted() { }, adFinished: done, adError: done });
        else TestAd.show(false, done);
      } catch (e) { done(); }
    });
  }
};
const TestAd = {
  show(rewarded, cb) {
    const el = $('#adov'); let n = rewarded ? 3 : 2;
    el.innerHTML = `<div class="ad-box"><div class="ad-tag">REKLAM · TEST MODU</div>${I('ad')}<div class="ad-txt">${rewarded ? 'Ödüllü reklam' : 'Kısa reklam arası'}</div><div class="ad-sub">Oyunu yayınlayınca burada gerçek reklam çıkar</div><div class="ad-count">${n}</div></div>`;
    el.classList.remove('hidden');
    const iv = setInterval(() => { n--; if (n <= 0) { clearInterval(iv); el.classList.add('hidden'); cb(true); } else { const c = el.querySelector('.ad-count'); if (c) c.textContent = n; } }, 1000);
  }
};
