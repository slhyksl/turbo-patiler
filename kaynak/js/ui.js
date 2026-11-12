'use strict';
/* =========================================================
   TURBO PATİLER — menüler, ilerleme, görevler, mağaza, döngü
   ========================================================= */
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');
const UI = { cur: null, shopTab: 'chars', dailyShown: false, reviveTimer: null, freeTimer: null, countT: null, bumpT: 0 };

/* ---------------- bildirimler ---------------- */
function toast(html, cls = '', ms = 1500, icon = null) {
  const box = $('#toasts'), t = document.createElement('div');
  t.className = 'toast ' + cls; t.innerHTML = (icon ? I(icon) : '') + `<div>${html}</div>`; box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 400);
}
function banner(label, big) { const b = $('#banner'); b.innerHTML = `<span class="lab">${label}</span><span class="big">${big}</span>`; b.classList.remove('hidden', 'go'); void b.offsetWidth; b.classList.add('go'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.add('hidden'), 2400); }
const HINTS = {
  up: { t: 'YUKARI KAYDIR', s: 'Engelin üstünden zıpla!', rot: -90 },
  down: { t: 'AŞAĞI KAYDIR', s: 'Altından kayarak geç!', rot: 90 },
  side: { t: 'YANA KAYDIR', s: 'Boş şeride geç!', rot: 0 },
  ramp: { t: 'RAMPADAN ÇIK', s: 'Vagonların üstünde koş!', rot: null },
};
function showHint(k) {
  const h = $('#h-hint'); if (!k || !HINTS[k]) { hide(h); return; }
  const d = HINTS[k];
  h.innerHTML = `<div class="hcard"><b>${d.t}</b><span>${d.s}</span></div>` + (d.rot !== null ? `<div class="hand ${k}"><i class="ic" style="width:100%;height:100%;transform:rotate(${d.rot}deg)">${ICON_SVG.right}</i></div>` : '');
  show(h);
}

/* ---------------- SEVİYE / XP ---------------- */
function xpNeed(L) { return Math.round(100 * Math.pow(L, 1.45)); }
function addXP(n) {
  S.xp += n; const ups = [];
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level); S.level++; ups.push({ lv: S.level, coins: 100 * S.level, gems: S.level % 5 === 0 ? 3 : 0 });
    S.coins += 100 * S.level; if (S.level % 5 === 0) S.gems += 3;
    for (const ch of CHARS) if (ch.price.level && ch.price.level <= S.level && !S.owned.includes(ch.id)) { S.owned.push(ch.id); ups.push({ ch: ch.id }); }
  }
  return ups;
}

/* ---------------- GÖREVLER ---------------- */
const MDEF = {
  coinsRun: { t: n => `Tek koşuda ${fmt(n)} altın topla`, run: 1, f: L => 50 + L * 30, r: 5 },
  coinsTotal: { t: n => `Toplam ${fmt(n)} altın topla`, f: L => 300 + L * 200, r: 10 },
  distRun: { t: n => `Tek koşuda ${fmt(n)} metre git`, run: 1, f: L => 400 + L * 250, r: 50 },
  scoreRun: { t: n => `Tek koşuda ${fmt(n)} puan yap`, run: 1, f: L => 1500 + L * 1800, r: 100 },
  jumps: { t: n => `${n} kez zıpla`, f: L => 15 + L * 8, r: 1 },
  slides: { t: n => `${n} kez kay`, f: L => 10 + L * 6, r: 1 },
  powerups: { t: n => `${n} güç topla`, f: L => 2 + Math.floor(L * 1.2), r: 1 },
  ramps: { t: n => `${n} rampaya tırman`, f: L => 2 + L, r: 1 },
  noCoinDist: { t: n => `Altına dokunmadan ${n} metre koş`, run: 1, f: L => 120 + L * 50, r: 10 },
  runs: { t: n => `${n} koşu yap`, f: L => 2 + Math.floor(L / 2), r: 1 },
  trainTop: { t: n => `Vagon üstünde ${n} metre koş`, run: 1, f: L => 40 + L * 30, r: 10, min: 1 },
  rocketRun: { t: n => `Tek koşuda ${n} kez roketle uç`, run: 1, f: L => 1 + Math.floor(L / 4), r: 1, min: 2 },
};
function genMission(type, L) { const d = MDEF[type]; let tg = d.f(L); tg = Math.max(d.r, Math.round(tg / d.r) * d.r); return { type, target: tg, prog: 0, done: false }; }
function newMissions() { const L = S.missionSet; const pool = shuffle(Object.keys(MDEF).filter(k => (MDEF[k].min || 0) <= L)); S.missions = pool.slice(0, 3).map(k => genMission(k, L)); }
function ensureMissions() { if (!Array.isArray(S.missions) || S.missions.length !== 3 || S.missions.some(m => !MDEF[m.type])) newMissions(); }
function setReward(n) { return 300 + n * 200; }
function mEvent(type, amt) { for (const m of S.missions) if (!m.done && m.type === type) { m.prog += amt; checkM(m); } }
function mSet(type, val) { for (const m of S.missions) if (!m.done && m.type === type && val > m.prog) { m.prog = val; checkM(m); } }
function checkM(m) {
  if (m.done || m.prog < m.target) return;
  m.done = true; m.prog = m.target;
  Sound.play('mission'); toast(`Görev tamam!<small>${MDEF[m.type].t(m.target)}</small>`, 'good', 2200, 'check'); confetti(30);
  if (S.missions.every(x => x.done)) {
    const r = setReward(S.missionSet);
    S.missionSet = Math.min(29, S.missionSet + 1); S.coins += r; if (S.missionSet % 2 === 0) S.gems += 1;
    if (G.state === 'play') G.mult = 1 + S.missionSet;
    setTimeout(() => { toast(`ÇARPAN x${1 + S.missionSet}!<small>+${fmt(r)} altın ödül</small>`, 'big', 2800, 'fire'); confetti(90); Sound.play('mission'); }, 900);
    newMissions();
  }
  saveGame();
}
function runMissionsReset() { for (const m of S.missions) if (!m.done && MDEF[m.type].run) m.prog = 0; }
function missionsTick() { mSet('distRun', Math.floor(G.z)); mSet('scoreRun', Math.floor(G.score)); mSet('coinsRun', G.run.coins); mSet('noCoinDist', Math.floor(G.run.noCoinBest)); mSet('trainTop', Math.floor(G.run.trainTop)); mSet('rocketRun', G.run.rockets); }
function missionRow(m) { const pct = Math.min(100, m.prog / m.target * 100); return `<div class="mrow ${m.done ? 'done' : ''}">${I(m.done ? 'check' : 'target')}<div class="mt">${MDEF[m.type].t(m.target)}<div class="bar"><div style="width:${pct}%"></div></div></div><div class="mp">${m.done ? 'TAMAM' : fmt(Math.min(m.prog, m.target)) + '/' + fmt(m.target)}</div></div>`; }

/* ---------------- GÜNÜN KELİMESİ ---------------- */
const WORDS = ['TURBO', 'PATİ', 'KOŞU', 'HIZLI', 'ROKET', 'ŞİMŞEK', 'SÜPER', 'ZIPLA', 'ALTIN', 'YILDIZ', 'KEDİ', 'ŞEKER'];
function wordToday() { const d = dayNum(); if (S.word.day !== d) { S.word = { day: d, w: WORDS[((d % WORDS.length) + WORDS.length) % WORDS.length], got: 0, done: false }; saveGame(); } return S.word; }
function wordHTML() { const W = wordToday(); return W.w.split('').map((ch, i) => `<b class="${i < W.got ? 'got' : ''}">${i < W.got ? ch : '?'}</b>`).join(''); }
function letterCollected() {
  const W = wordToday(); if (W.done) return;
  const ch = W.w[W.got]; W.got++; Sound.play('letter'); toast(`Harf buldun: ${ch}<small>Günün kelimesi: ${W.got}/${W.w.length}</small>`, 'good', 1800, 'abc');
  if (W.got >= W.w.length) { W.done = true; S.coins += 1000; S.gems += 3; setTimeout(() => { toast(`KELİME TAMAM: ${W.w}<small>+1.000 altın, +3 elmas</small>`, 'big', 3200, 'star'); confetti(110); Sound.play('mission'); }, 700); }
  saveGame(); $('#h-word').innerHTML = wordHTML();
}

/* ---------------- GÜNLÜK HEDİYE ---------------- */
const DAILY = [{ c: 200 }, { c: 400 }, { g: 1 }, { c: 800 }, { sh: 2 }, { c: 1500 }, { g: 5, c: 1000 }];
function rewardIcon(r) { return r.sh ? 'shield' : r.g && !r.c ? 'gem' : r.g ? 'gift' : 'coin'; }
function rewardTxt(r, m = 1) { const a = []; if (r.c) a.push(fmt(r.c * m)); if (r.g) a.push(`${r.g * m} elmas`); if (r.sh) a.push(`${r.sh * m} kalkan`); return a.join(' + '); }
function dailyState() { const today = dayNum(), claimed = S.daily.claimed === today; const next = claimed ? S.daily.streak : (S.daily.claimed === today - 1 ? S.daily.streak + 1 : 1); return { today, claimed, next, idx: (next - 1) % 7 }; }
function openDaily() {
  const st = dailyState(), streak = st.claimed ? st.next : st.next - 1;
  const days = DAILY.map((r, i) => { const done = i < st.idx || (i === st.idx && st.claimed); return `<div class="day ${i < st.idx ? 'past' : ''} ${i === st.idx ? (st.claimed ? 'got' : 'today') : ''} ${i === 6 ? 'big' : ''}"><small>${i + 1}. GÜN</small>${I(rewardIcon(r))}<b>${rewardTxt(r)}</b>${done ? `<span class="tick">${ICON_SVG.check}</span>` : ''}</div>`; }).join('');
  openModal(`<div class="ph pink">${I('gift', 't')}<div class="title">GÜNLÜK HEDİYE</div><button class="xbtn" data-act="close">${I('close')}</button></div><div class="pb">
  <p class="note c">Her gün gir, hediyeler büyüsün!${streak > 0 ? ` Serin: <b>${streak} gün</b>` : ''}</p>
  <div class="days">${days}</div>
  <div class="row-btns">${st.claimed ? '<p class="note c">Yarın yeni hediye seni bekliyor!</p>' : `<button class="btn b-lime lg" data-act="daily1">AL</button><button class="btn b-ad lg" data-act="daily2">${I('ad')}2 KATI</button>`}</div></div>`, 'p-daily');
}
function claimDaily(mult) {
  const st = dailyState(); if (st.claimed) return;
  const r = DAILY[st.idx];
  if (r.c) S.coins += r.c * mult; if (r.g) S.gems += r.g * mult; if (r.sh) S.items.shield += r.sh * mult;
  S.daily.claimed = st.today; S.daily.streak = st.next; saveGame();
  Sound.play('buy'); confetti(60); toast(`Hediye alındı!<small>${rewardTxt(r, mult)}</small>`, 'good', 2000, rewardIcon(r));
  openDaily(); refreshMenu();
}

/* ---------------- MODAL ---------------- */
function openModal(html, cls) { const m = $('#modal'), p = $('#panel'); p.className = 'panel ' + (cls || ''); p.innerHTML = html; show(m); UI.cur = cls; const b = p.querySelector('.pb'); if (b) b.scrollTop = 0; }
function closeModal() { hide($('#modal')); UI.cur = null; clearInterval(UI.freeTimer); }

/* ---------------- MENÜ ---------------- */
function perkText(ch) { const p = ch.perk || {}, a = []; if (p.coin) a.push(`+%${Math.round(p.coin * 100)} altın`); if (p.score) a.push(`+%${Math.round(p.score * 100)} puan`); if (p.power) a.push(`güçler +${String(p.power).replace('.', ',')} sn`); if (p.jump) a.push('süper zıplama'); return a.length ? a.join(' · ') : 'Klasik koşucu'; }
function refreshMenu() {
  $('#m-coins').textContent = fmt(S.coins); $('#m-gems').textContent = fmt(S.gems); $('#m-level').textContent = S.level;
  $('#m-xp').style.width = Math.min(100, S.xp / xpNeed(S.level) * 100) + '%'; $('#m-xptxt').textContent = `${fmt(S.xp)}/${fmt(xpNeed(S.level))}`;
  $('#m-best').innerHTML = `${I('trophy')} Rekor: ${fmt(S.best)}`; $('#m-mult').textContent = 'x' + (1 + S.missionSet);
  const ch = CHAR_BY[S.sel] || CHARS[0];
  $('#m-petname').textContent = ch.name; $('#m-perk').textContent = perkText(ch);
  $('#m-dailydot').classList.toggle('hidden', S.daily.claimed === dayNum());
  $('#m-word').innerHTML = wordToday().done ? `<span class="chip">${I('check')} Günün kelimesi tamam</span>` : `<span class="chip">${I('abc')}</span>${wordHTML()}`;
  const many = S.owned.length > 1; $('#ar-l').classList.toggle('hidden', !many); $('#ar-r').classList.toggle('hidden', !many);
}
function cycleChar(d) { const own = CHARS.filter(c => S.owned.includes(c.id)); let i = own.findIndex(c => c.id === S.sel); i = (i + d + own.length) % own.length; S.sel = own[i].id; saveGame(); refreshMenu(); petPop = 1; }
function showMenu() {
  clearTimeout(UI.reviveTimer);
  UI.menuAt = performance.now(); G.state = 'menu'; G.obs = []; G.items = []; G.parts = []; G.tut = null; G.timeScale = 1; G.stumbleT = 99; G.chaserZ = -9; G.power.rocket = 0;
  hide($('#hud')); showHint(''); closeModal(); const m = $('#menu'); show(m); m.classList.add('menu-in'); setTimeout(() => m.classList.remove('menu-in'), 700); refreshMenu();
  Sound.intensity = 0;
  if (S.daily.claimed !== dayNum() && !UI.dailyShown && S.stats.runs > 0) { UI.dailyShown = true; setTimeout(() => { if (G.state === 'menu' && !UI.cur) openDaily(); }, 600); }
}
let playing = false;
async function play() {
  if (playing) return; playing = true;
  Sound.init(); closeModal(); hide($('#menu'));
  await Ads.interstitial();
  startRun(); playing = false; G.flash = 0.35;
  show($('#hud')); hudReset();
  if (!G.tut) showBoosters(); else banner('İLK KOŞU', 'Hadi bakalım!');
}
function showBoosters() {
  const b = $('#boosters'); let h = '';
  if (S.items.headstart > 0) h += `<button class="btn b-purp" data-act="use-head">${I('rocket')}Turbo Başla <em>x${S.items.headstart}</em></button>`;
  if (S.items.shield > 0) h += `<button class="btn b-blue" data-act="use-shield">${I('shield')}Kalkanla Başla <em>x${S.items.shield}</em></button>`;
  if (!h) return hide(b);
  b.innerHTML = h; show(b); clearTimeout(b._t); b._t = setTimeout(() => hide(b), 4500);
}

/* ---------------- HUD ---------------- */
const HC = {};
function setTxt(id, v) { if (HC[id] !== v) { HC[id] = v; document.getElementById(id).textContent = v; return true; } return false; }
function hudReset() {
  for (const k in HC) delete HC[k];
  $('#h-word').innerHTML = wordToday().done ? '' : wordHTML();
  hide($('#h-gemsbox'));
  $('#h-powers').innerHTML = ['magnet', 'double', 'spring', 'rocket'].map(k => `<div class="pw hidden" id="pw-${k}"><div>${I(k)}</div></div>`).join('') + `<div class="pw shield hidden" id="pw-shield"><div>${I('shield')}</div></div>`;
}
function hudTick() {
  setTxt('h-score', fmt(G.score)); setTxt('h-mult', 'x' + G.mult);
  if (setTxt('h-coins', fmt(G.coins)) && performance.now() - UI.bumpT > 140) { UI.bumpT = performance.now(); const b = $('#h-coinbox'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  if (G.gemsRun > 0 && HC.gemsShown !== 1) { HC.gemsShown = 1; show($('#h-gemsbox')); }
  if (G.gemsRun > 0) setTxt('h-gems', String(G.gemsRun));
  for (const k of ['magnet', 'double', 'spring', 'rocket']) {
    const v = G.power[k], el = document.getElementById('pw-' + k); if (!el) continue;
    const on = v > 0; if (HC['pw' + k] !== on) { HC['pw' + k] = on; el.classList.toggle('hidden', !on); }
    if (on) el.style.setProperty('--p', (v / G.powerMax[k]).toFixed(3));
  }
  const sh = document.getElementById('pw-shield'); if (sh && HC.pwsh !== G.shield) { HC.pwsh = G.shield; sh.classList.toggle('hidden', !G.shield); }
}

/* ---------------- DURAKLAT / GERİ SAYIM ---------------- */
function toggleBtns() { return `<div class="toggles"><button class="btn b-blue" data-act="tg-music">${I('music')}${S.set.music ? 'Müzik açık' : 'Müzik kapalı'}</button><button class="btn b-blue" data-act="tg-sfx">${I('sound')}${S.set.sfx ? 'Ses açık' : 'Ses kapalı'}</button></div>`; }
function pauseGame() {
  if (G.state !== 'play') return;
  G.state = 'pause'; Ads.stop(); hide($('#boosters'));
  openModal(`<div class="ph purp">${I('pause', 't')}<div class="title">MOLA</div></div><div class="pb">
  <p class="note c"><b>${fmt(G.score)}</b> puan · <b>${fmt(G.z)}</b> metre</p>
  ${S.missions.map(missionRow).join('')}
  ${toggleBtns()}</div>
  <div class="pf"><button class="btn b-yel sq" data-act="quit" aria-label="Menü">${I('home')}</button><button class="btn b-lime lg" data-act="resume">${I('play')}DEVAM</button></div>`, 'p-pause');
}
function countdown(n, cb) {
  const el = $('#count'); show(el); G.state = 'count';
  const tick = () => { if (n <= 0) { hide(el); cb(); return; } el.textContent = n; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); Sound.play('count'); n--; UI.countT = setTimeout(tick, 650); };
  tick();
}
function resumeGame() { closeModal(); countdown(3, () => { G.state = 'play'; Sound.play('go'); Ads.start(); }); }

/* ---------------- ÖLÜM → DEVAM ET ---------------- */
function onDeathDone() {
  const cost = Math.pow(2, G.revives);
  if (G.adRevive && S.gems < cost) { endRun(); return; }
  G.state = 'revive'; showHint(''); hide($('#boosters'));
  openModal(`<div class="ph red"><div class="title">${G.deathType === 'caught' ? 'YAKALANDIN!' : 'ÇARPTIN!'}</div></div><div class="pb">
  <div class="ring"><svg class="r" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="rbg"/><circle cx="50" cy="50" r="42" class="rfg"/></svg><div class="mid"><canvas id="rv-pet"></canvas></div></div>
  <p class="note c" style="margin-top:-4px">Kaldığın yerden devam etmek ister misin?</p>
  <div class="col-btns">
  ${!G.adRevive ? `<button class="btn b-ad wide" data-act="rv-ad" style="font-size:21px">${I('ad')}İzle ve devam et</button>` : ''}
  <button class="btn b-blue wide" data-act="rv-gem" style="font-size:21px" ${S.gems < cost ? 'disabled' : ''}>${I('gem')}${cost} elmasla devam</button>
  <button class="btn b-gray sm" data-act="rv-no" style="align-self:center">Hayır, bitir</button></div></div>`, 'p-revive');
  const rc = $('#rv-pet'); if (rc) petThumb(rc, G.ch, 88, 3.3);
  clearTimeout(UI.reviveTimer); UI.reviveTimer = setTimeout(() => { if (G.state === 'revive') endRun(); }, 6000);
}
function endRun() {
  clearTimeout(UI.reviveTimer);
  G.state = 'over'; Ads.stop(); showHint(''); hide($('#boosters'));
  const bonus = Math.round(G.coins * (G.perk.coin || 0));
  G.coinsEarned = G.coins + bonus; G.bonusCoins = bonus;
  S.coins += G.coinsEarned; S.gems += G.gemsRun;
  const sc = Math.floor(G.score); G.newBest = sc > S.best && S.stats.runs > 0; if (sc > S.best) S.best = sc; S.bestDist = Math.max(S.bestDist, Math.floor(G.z));
  S.stats.runs++; S.stats.dist += Math.floor(G.z);
  mEvent('runs', 1);
  runMissionsReset();
  const xp = Math.floor(G.z / 8) + G.coins; G.xpGain = xp; G.ups = addXP(xp);
  saveGame();
  showGameOver(true);
}
function rollUp(el, to, ms) { if (!el) return; const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function showGameOver(first) {
  hide($('#hud'));
  const sc = Math.floor(G.score), ups = first ? G.ups : [];
  let up = '';
  const lvs = ups.filter(u => u.lv);
  if (lvs.length) { const cs = lvs.reduce((a, u) => a + u.coins, 0), gs = lvs.reduce((a, u) => a + u.gems, 0); up += `<div class="lvlup">${I('star')}SEVİYE ${lvs[lvs.length - 1].lv}! <span>+${fmt(cs)} altın${gs ? ` +${gs} elmas` : ''}</span></div>`; }
  for (const u of ups) if (u.ch) up += `<div class="lvlup">${I('paw')}Yeni karakter: ${CHAR_BY[u.ch].name}!</div>`;
  if (first && ups.length) setTimeout(() => { confetti(90); Sound.play('mission'); }, 500);
  if (first && G.newBest) setTimeout(() => confetti(130), 200);
  const coinsShown = G.coinsEarned * (G.doubled ? 2 : 1);
  openModal(`${G.newBest ? '<div class="ribbon">YENİ REKOR!</div>' : ''}<div class="ph yel">${I('trophy', 't')}<div class="title">SONUÇ</div></div><div class="pb">
  <div class="go-num" id="go-num">${first ? 0 : fmt(sc)}</div>
  <p class="note c" style="margin-top:0">puan · çarpan x${G.mult}</p>
  <div class="stats"><div class="stat">${I('road')}<b>${fmt(G.z)}</b><small>METRE</small></div><div class="stat">${I('coin')}<b id="go-coins">+${fmt(coinsShown)}</b><small>${G.bonusCoins ? 'BONUS DAHİL' : 'ALTIN'}</small></div><div class="stat">${I('gem')}<b>+${G.gemsRun}</b><small>ELMAS</small></div></div>
  ${G.coinsEarned >= 10 && !G.doubled ? `<button class="btn b-ad wide" data-act="go-double">${I('ad')}Altınları 2 katına çıkar</button>` : ''}
  <div class="lvlrow"><div class="lvl-star" style="width:40px;height:40px">${ICON_SVG.star}<b style="font-size:14px">${S.level}</b></div><div class="xpbar"><div style="width:${Math.min(100, S.xp / xpNeed(S.level) * 100)}%"></div><span>+${fmt(G.xpGain)} XP</span></div></div>
  ${up}
  <div class="sub">${I('target')}Görevler · çarpan x${1 + S.missionSet}</div>
  ${S.missions.map(missionRow).join('')}</div>
  <div class="pf"><button class="btn b-yel sq" data-act="home" aria-label="Menü">${I('home')}</button><button class="btn b-blue sq" data-act="shop" aria-label="Mağaza">${I('cart')}</button><button class="btn b-lime lg" data-act="again">${I('play')}TEKRAR</button></div>`, 'p-over');
  if (first) rollUp($('#go-num'), sc, 900);
}

/* ---------------- MAĞAZA ---------------- */
const UPG = [
  { id: 'magnet', name: 'Mıknatıs', d: 'Altınlar sana uçar' },
  { id: 'double', name: 'Çift Altın', d: 'Her altın 2 sayılır' },
  { id: 'spring', name: 'Yaylı Ayakkabı', d: 'Vagonların üstüne zıpla' },
  { id: 'rocket', name: 'Turbo Roket', d: 'Gökyüzünde altın topla' },
];
const UPG_COST = [400, 900, 1800, 3500, 6000, 10000];
function upgDur(id, l) { return id === 'rocket' ? (5 + l * 0.8) : (8 + l * 1.6); }
function freeState() { const d = dayNum(); if (S.free.day !== d) S.free = { day: d, coins: 0, gems: 0, lastCoins: 0, lastGems: 0 }; return S.free; }
function mmss(s) { s = Math.ceil(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
const sec = v => v.toFixed(1).replace('.', ',');
function shopHTML() {
  const tabs = [['chars', 'paw', 'Karakter'], ['upg', 'bolt', 'Güçler'], ['items', 'bag', 'Eşya'], ['free', 'gift', 'Bedava']];
  let body = '';
  if (UI.shopTab === 'chars') {
    body = '<div class="grid">' + CHARS.map(ch => {
      const own = S.owned.includes(ch.id), sel = S.sel === ch.id; let btn;
      if (sel) btn = `<button class="btn b-gray sm" disabled>Seçili</button>`;
      else if (own) btn = `<button class="btn b-lime sm" data-act="sel" data-id="${ch.id}">Seç</button>`;
      else if (ch.price.level) btn = `<button class="btn b-gray sm" disabled>${I('lock')}Seviye ${ch.price.level}</button>`;
      else if (ch.price.gems) btn = `<button class="btn b-blue sm" data-act="buyc" data-id="${ch.id}">${I('gem')}${ch.price.gems}</button>`;
      else btn = `<button class="btn b-yel sm" data-act="buyc" data-id="${ch.id}">${I('coin')}${fmt(ch.price.coins)}</button>`;
      return `<div class="card ${sel ? 'sel' : ''} ${own ? '' : 'lock'}"><div class="cbg"><canvas class="cpet" data-id="${ch.id}"></canvas></div><div class="cname">${ch.name}</div><span class="chip">${perkText(ch)}</span>${btn}</div>`;
    }).join('') + '</div>';
  } else if (UI.shopTab === 'upg') {
    body = UPG.map(u => {
      const l = S.upg[u.id] || 0, max = l >= 6;
      const pips = Array.from({ length: 6 }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('');
      return `<div class="urow"><div class="uic">${I(u.id)}</div><div class="ut"><b>${u.name}</b><small>${u.d} · ${sec(upgDur(u.id, l))} sn${max ? '' : ' → ' + sec(upgDur(u.id, l + 1)) + ' sn'}</small><div class="pips">${pips}</div></div>${max ? '<button class="btn b-gray sm" disabled>Maks</button>' : `<button class="btn b-yel sm" data-act="upg" data-id="${u.id}">${I('coin')}${fmt(UPG_COST[l])}</button>`}</div>`;
    }).join('');
  } else if (UI.shopTab === 'items') {
    body = `<div class="urow"><div class="uic">${I('shield')}</div><div class="ut"><b>Başlangıç Kalkanı</b><small>Bir çarpmayı affeder · Sende: ${S.items.shield}</small></div><button class="btn b-yel sm" data-act="item" data-id="shield">${I('coin')}350</button></div>
    <div class="urow"><div class="uic">${I('rocket')}</div><div class="ut"><b>Turbo Başlangıç</b><small>Koşuya roketle uçarak başla · Sende: ${S.items.headstart}</small></div><button class="btn b-yel sm" data-act="item" data-id="headstart">${I('coin')}1.000</button></div>
    <div class="urow"><div class="uic">${I('gem')}</div><div class="ut"><b>Elmas bozdur</b><small>5 elmas ver, 2.000 altın al</small></div><button class="btn b-blue sm" data-act="exch">${I('gem')}5</button></div>`;
  } else {
    const f = freeState(), now = Date.now();
    const cL = Math.max(0, 120 - (now - f.lastCoins) / 1000), gL = Math.max(0, 300 - (now - f.lastGems) / 1000);
    const cBtn = f.coins >= 10 ? '<button class="btn b-gray sm" disabled>Yarın</button>' : cL > 0 ? `<button class="btn b-gray sm" disabled>${I('clock')}${mmss(cL)}</button>` : `<button class="btn b-ad sm" data-act="free-c">${I('ad')}İzle</button>`;
    const gBtn = f.gems >= 4 ? '<button class="btn b-gray sm" disabled>Yarın</button>' : gL > 0 ? `<button class="btn b-gray sm" disabled>${I('clock')}${mmss(gL)}</button>` : `<button class="btn b-ad sm" data-act="free-g">${I('ad')}İzle</button>`;
    body = `<p class="note c">Kısa bir reklam izle, ödülü hemen kap. Tamamen isteğe bağlı!</p>
    <div class="urow"><div class="uic">${I('coin')}</div><div class="ut"><b>+250 Altın</b><small>Bugün ${f.coins}/10</small></div>${cBtn}</div>
    <div class="urow"><div class="uic">${I('gem')}</div><div class="ut"><b>+1 Elmas</b><small>Bugün ${f.gems}/4</small></div>${gBtn}</div>`;
  }
  return `<div class="ph">${I('cart', 't')}<div class="title">MAĞAZA</div><button class="xbtn" data-act="close">${I('close')}</button></div><div class="pb">
  <div class="pills"><div class="res">${I('coin')}<b>${fmt(S.coins)}</b></div><div class="res">${I('gem')}<b>${fmt(S.gems)}</b></div></div>
  <div class="tabs">${tabs.map(t => `<button class="tab ${t[0] === UI.shopTab ? 'on' : ''}" data-act="tab" data-tab="${t[0]}">${I(t[1])}${t[2]}</button>`).join('')}</div>${body}</div>`;
}
function openShop(tab) {
  if (tab) UI.shopTab = tab;
  const p = $('#panel'), old = p.querySelector('.pb'), st = UI.cur === 'p-shop' && old ? old.scrollTop : 0;
  openModal(shopHTML(), 'p-shop'); const pb = p.querySelector('.pb'); if (pb) pb.scrollTop = st;
  p.querySelectorAll('canvas.cpet').forEach(cv2 => petThumb(cv2, CHAR_BY[cv2.dataset.id], 108, 0.4));
  clearInterval(UI.freeTimer);
  if (UI.shopTab === 'free') UI.freeTimer = setInterval(() => { if (UI.cur === 'p-shop' && UI.shopTab === 'free') openShop(); }, 1000);
}
function spend(coins, gems) {
  if (coins && S.coins < coins) { Sound.play('deny'); toast('Altının yetmiyor<small>Koş, topla, tekrar gel!</small>', 'warn', 1600, 'coin'); return false; }
  if (gems && S.gems < gems) { Sound.play('deny'); toast('Elmasın yetmiyor<small>Görevler ve hediyeler elmas verir</small>', 'warn', 1800, 'gem'); return false; }
  S.coins -= coins || 0; S.gems -= gems || 0; Sound.play('buy'); return true;
}

/* ---------------- AYARLAR / GÖREVLER ---------------- */
function openSettings(confirmReset) {
  openModal(`<div class="ph purp">${I('gear', 't')}<div class="title">AYARLAR</div><button class="xbtn" data-act="close">${I('close')}</button></div><div class="pb">
  ${toggleBtns()}
  <div class="sub">${I('play')}Nasıl oynanır?</div>
  <div class="howto"><div>${I('right')}<span><b>Sağa / sola kaydır:</b> şerit değiştir</span></div><div><i class="ic" style="transform:rotate(-90deg)">${ICON_SVG.right}</i><span><b>Yukarı kaydır:</b> zıpla</span></div><div><i class="ic" style="transform:rotate(90deg)">${ICON_SVG.right}</i><span><b>Aşağı kaydır:</b> kay, havadaysan hızla in</span></div><div>${I('road')}<span><b>Rampalar</b> seni vagonların üstüne çıkarır</span></div><div>${I('vacuum')}<span>Yandan çarparsan <b>Süpürgeç</b> peşine düşer. İkinci kez çarpma!</span></div></div>
  <div class="sub">${I('trophy')}İstatistik</div>
  <div class="howto"><div>Koşu: <b>${fmt(S.stats.runs)}</b> · Toplam yol: <b>${fmt(S.stats.dist)} m</b></div><div>Toplanan altın: <b>${fmt(S.stats.coins)}</b> · Zıplama: <b>${fmt(S.stats.jumps)}</b></div><div>En uzun koşu: <b>${fmt(S.bestDist)} m</b></div></div>
  <div class="sub">${I('shield')}Ebeveyn bilgisi</div>
  <div class="howto small"><div>Oyun kişisel bilgi istemez, toplamaz. İlerleme yalnızca bu cihazda tutulur. Reklam oyunun ortasına girmez; sadece koşu aralarında ya da çocuk ödül için kendisi seçtiğinde çıkar. Gerçek parayla satın alma yoktur.</div></div>
  <div class="row-btns">${confirmReset ? '<button class="btn b-gray sm" data-act="settings">Vazgeç</button><button class="btn b-red sm" data-act="reset2">Evet, her şeyi sil</button>' : '<button class="btn b-gray sm" data-act="reset1">İlerlemeyi sıfırla</button>'}</div>
  <div class="ver">Turbo Patiler · oyun sürümü ${WEB_VERSION}${APP_INFO.app ? ` · uygulama ${APP_INFO.app}` : ''} · Reklam: ${Ads.provider === 'test' ? 'test modu' : Ads.provider}</div></div>`, 'p-settings');
}
function openMissions() {
  openModal(`<div class="ph purp">${I('target', 't')}<div class="title">GÖREVLER</div><button class="xbtn" data-act="close">${I('close')}</button></div><div class="pb">
  <div class="mult-big">${I('fire')}x${1 + S.missionSet}</div>
  <p class="note c">Puan çarpanın. 3 görevi bitir: <b>x${Math.min(30, 2 + S.missionSet)}</b> ve <b>${fmt(setReward(S.missionSet))} altın</b>!</p>
  ${S.missions.map(missionRow).join('')}
  <p class="note c s">"Tek koşuda" yazan görevler tek bir koşuda bitmeli.</p>
  <div class="sub">${I('abc')}Günün kelimesi</div><div class="word" style="display:flex;justify-content:center">${wordHTML()}</div>
  <p class="note c s">Koşarken yıldızlı harfleri topla, her koşuda bir harf çıkar. Kelimeyi bitirene 1.000 altın ve 3 elmas!</p></div>`, 'p-missions');
}

/* ---------------- TIKLAMALAR ---------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  Sound.init(); Sound.play('click');
  const a = el.dataset.act, id = el.dataset.id;
  switch (a) {
    case 'play': play(); break;
    case 'shop': openShop('upg'); break;
    case 'chars': openShop('chars'); break;
    case 'free': openShop('free'); break;
    case 'missions': openMissions(); break;
    case 'daily': openDaily(); break;
    case 'settings': openSettings(false); break;
    case 'prev': cycleChar(-1); break;
    case 'next': cycleChar(1); break;
    case 'close': closeModal(); if (G.state === 'menu') refreshMenu(); else if (G.state === 'over') showGameOver(false); break;
    case 'tab': UI.shopTab = el.dataset.tab; openShop(); break;
    case 'sel': S.sel = id; saveGame(); openShop(); refreshMenu(); petPop = 1; break;
    case 'buyc': { const ch = CHAR_BY[id]; if (spend(ch.price.coins, ch.price.gems)) { S.owned.push(id); S.sel = id; saveGame(); confetti(70); toast(`${ch.name} artık senin!`, 'big', 2000, 'paw'); openShop(); refreshMenu(); petPop = 1; } break; }
    case 'upg': { const l = S.upg[id] || 0; if (l < 6 && spend(UPG_COST[l], 0)) { S.upg[id] = l + 1; saveGame(); toast(`${POW[id].name} güçlendi!<small>Seviye ${l + 1}/6</small>`, 'good', 1300, id); openShop(); } break; }
    case 'item': { const cost = id === 'shield' ? 350 : 1000; if (spend(cost, 0)) { S.items[id]++; saveGame(); openShop(); } break; }
    case 'exch': if (spend(0, 5)) { S.coins += 2000; saveGame(); openShop(); } break;
    case 'free-c': case 'free-g': Ads.rewarded().then(ok => { if (!ok) { toast('Şu an reklam yok<small>Birazdan tekrar dene</small>', 'warn', 1500, 'ad'); return; } const f = freeState(); if (a === 'free-c') { S.coins += 250; f.coins++; f.lastCoins = Date.now(); } else { S.gems += 1; f.gems++; f.lastGems = Date.now(); } saveGame(); Sound.play('buy'); confetti(40); openShop(); refreshMenu(); }); break;
    case 'daily1': claimDaily(1); break;
    case 'daily2': Ads.rewarded().then(ok => { if (ok) claimDaily(2); else toast('Şu an reklam yok<small>Normal hediyeni alabilirsin</small>', 'warn', 1500, 'ad'); }); break;
    case 'tg-music': S.set.music = !S.set.music; saveGame(); Sound.apply(); el.lastChild.textContent = S.set.music ? 'Müzik açık' : 'Müzik kapalı'; break;
    case 'tg-sfx': S.set.sfx = !S.set.sfx; saveGame(); Sound.apply(); el.lastChild.textContent = S.set.sfx ? 'Ses açık' : 'Ses kapalı'; break;
    case 'reset1': openSettings(true); break;
    case 'reset2': S = defaultSave(); ensureMissions(); saveGame(); closeModal(); showMenu(); toast('İlerleme sıfırlandı', '', 1500); break;
    case 'resume': resumeGame(); break;
    case 'quit': closeModal(); endRun(); break;
    case 'rv-ad': clearTimeout(UI.reviveTimer); $('#panel').classList.add('wait'); Ads.rewarded().then(ok => { if (ok) { G.adRevive = true; closeModal(); show($('#hud')); doRevive(); } else { toast('Şu an reklam yok', 'warn', 1500, 'ad'); G.adRevive = true; onDeathDone(); } }); break;
    case 'rv-gem': { const cost = Math.pow(2, G.revives); if (S.gems >= cost) { clearTimeout(UI.reviveTimer); S.gems -= cost; saveGame(); closeModal(); show($('#hud')); doRevive(); } break; }
    case 'rv-no': endRun(); break;
    case 'go-double': Ads.rewarded().then(ok => { if (ok && !G.doubled) { G.doubled = true; S.coins += G.coinsEarned; saveGame(); const c = $('#go-coins'); if (c) c.textContent = '+' + fmt(G.coinsEarned * 2); el.remove(); Sound.play('buy'); confetti(60); toast(`+${fmt(G.coinsEarned)} ekstra altın!`, 'good', 1500, 'coin'); } }); break;
    case 'again': play(); break;
    case 'home': showMenu(); break;
    case 'use-head': if (G.state === 'play' && S.items.headstart > 0) { S.items.headstart--; saveGame(); startRocket(6 + (S.upg.rocket || 0) * 0.5); hide($('#boosters')); } break;
    case 'use-shield': if (G.state === 'play' && S.items.shield > 0 && !G.shield) { S.items.shield--; G.shield = true; saveGame(); Sound.play('power'); el.remove(); if (!$('#boosters').children.length) hide($('#boosters')); toast('Kalkan hazır!', 'good', 1100, 'shield'); } break;
    case 'pause': pauseGame(); break;
  }
});

/* ---------------- GİRDİ (kaydırma + klavye) ---------------- */
let ptr = null;
function setupInput() {
  window.addEventListener('pointerdown', e => {
    Sound.init();
    if (G.state !== 'play' || e.target.closest('button') || e.target.closest('.panel')) return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY };
  }, { passive: true });
  window.addEventListener('pointermove', e => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, th = Math.max(16, Math.min(V.W, V.H) * 0.04);
    if (Math.hypot(dx, dy) > th) { act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); ptr.x = e.clientX; ptr.y = e.clientY; }
  }, { passive: true });
  const end = e => { if (ptr && e.pointerId === ptr.id) ptr = null; };
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  window.addEventListener('keydown', e => {
    const k = e.key;
    if (G.state === 'play') {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') act('left');
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') act('right');
      else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') act('up');
      else if (k === 'ArrowDown' || k === 's' || k === 'S') act('down');
      else if (k === 'p' || k === 'P' || k === 'Escape') pauseGame();
      if (k.startsWith('Arrow') || k === ' ') e.preventDefault();
    } else if (G.state === 'menu' && !UI.cur) {
      if (k === 'Enter' || k === ' ') { e.preventDefault(); play(); }
      else if (k === 'ArrowLeft' && S.owned.length > 1) cycleChar(-1);
      else if (k === 'ArrowRight' && S.owned.length > 1) cycleChar(1);
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.state === 'play') pauseGame(); Sound.suspend(); } else Sound.resumeCtx(); });
  window.addEventListener('blur', () => { if (G.state === 'play') pauseGame(); });
}

/* ---------------- DÖNGÜ ---------------- */
const petCv = $('#menu-pet'); let petCtx = null;
let petPop = 0, petW = 1, petH = 1, petD = 1, RP = null, RT = null;
function sizePet() { const r = petCv.getBoundingClientRect(); petD = Math.min(2, window.devicePixelRatio || 1); petW = Math.max(1, r.width); petH = Math.max(1, r.height); if (!USE3D) { petCv.width = Math.round(petW * petD); petCv.height = Math.round(petH * petD); } }
function nrm(v) { const l = Math.hypot(...v); return v.map(x => x / l); }
function mkR(canvas) { try { const r = new R3(canvas); r.env.L = nrm([0.35, 0.85, 0.6]); r.env.fogR = [500, 900, 0.99]; r.env.sky = [1, 0.97, 0.92]; r.env.gnd = [0.55, 0.5, 0.62]; return r; } catch (e) { return null; } }
function petRenderer() { if (!USE3D) return null; if (!RP) RP = mkR(petCv); return RP; }
function thumbRenderer() { if (!USE3D) return null; if (!RT) RT = mkR(document.createElement('canvas')); return RT; }
function pet3D(r, ch, w, h, d, t, mode, sq, zoom) {
  r.size(w, h, d); r.clear(); const z = zoom || 1; r.camera(0.62 / z, w / h, 0, 1.0, 4.4, 0, 0.88, 0, 0.3, 50); r.bend[0] = 0; r.bend[1] = 0; r.begin();
  r.draw(MOD.disc, M4.trs(MM, 0, 0.01, 0, 0, 0, 0, 1.5, 1, 1.2), { a: 0.22, emit: 1 });
  drawChar(r, ch, { x: 0, y: 0, z: 0, ry: mode === 'still' ? 0.35 : Math.sin(t * 0.7) * 0.5, mode: mode === 'still' ? 'idle' : mode, t, sq: sq || 1 }, 0.03);
}
function petThumb(canvas, ch, size, t) {
  const r = thumbRenderer(), d = Math.min(2, window.devicePixelRatio || 1); canvas.width = size * d; canvas.height = size * d; const c = canvas.getContext('2d');
  if (r) { pet3D(r, ch, size, size, d, t, 'still', 1, 1.05); c.drawImage(r.cv, 0, 0, canvas.width, canvas.height); }
  else { c.scale(d, d); drawPetFront(c, ch, size / 2, size * 0.94, size * 0.84, t); }
}
let lastT = performance.now(), petSized = false;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - lastT) / 1000; lastT = now; if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0;
  update(dt); render();
  if (G.state === 'play' || G.state === 'count' || G.state === 'pause') hudTick();
  if (G.state === 'menu' && !$('#menu').classList.contains('hidden')) {
    if (!petSized) { sizePet(); petSized = true; }
    petPop = Math.max(0, petPop - dt * 3);
    const sq = 1 + Math.sin(petPop * Math.PI) * 0.12, ch = CHAR_BY[S.sel] || CHARS[0], rp = petRenderer();
    if (rp) pet3D(rp, ch, petW, petH, petD, now / 1000, 'idle', sq);
    else {
      petCtx = petCtx || petCv.getContext('2d'); const w = petCv.width, h = petCv.height; petCtx.setTransform(1, 0, 0, 1, 0, 0); petCtx.clearRect(0, 0, w, h);
      petCtx.save(); petCtx.translate(w / 2, h * 0.9); petCtx.scale(1 / sq, sq); petCtx.translate(-w / 2, -h * 0.9);
      drawPetFront(petCtx, ch, w / 2, h * 0.9, h * 0.8, now / 1000); petCtx.restore();
    }
  }
}
function decorateStatic() {
  $('#m-star').insertAdjacentHTML('afterbegin', ICON_SVG.star);
  $('#m-coinres').insertAdjacentHTML('afterbegin', I('coin')); $('#m-gemres').insertAdjacentHTML('afterbegin', I('gem'));
  document.querySelectorAll('.res-plus').forEach(b => b.innerHTML = ICON_SVG.plus);
  $('#m-gear').innerHTML = I('gear'); $('#sb-gift').innerHTML = I('gift'); $('#sb-target').innerHTML = I('target'); $('#sb-paw').innerHTML = I('paw'); $('#sb-cart').innerHTML = I('cart');
  $('#m-paw').innerHTML = ICON_SVG.paw; $('#ar-l').innerHTML = ICON_SVG.left; $('#ar-r').innerHTML = ICON_SVG.right;
  $('#b-play').insertAdjacentHTML('afterbegin', I('play'));
  $('#h-pausebtn').innerHTML = I('pause'); $('#h-coinic').outerHTML = I('coin'); $('#h-gemic').outerHTML = I('gem');
}
/* ---------------- ANDROID UYGULAMASI ----------------
   APK içindeyken MainActivity "AndroidApp" köprüsünü ekler. Tarayıcıda bu kısım hiçbir şey yapmaz.
   Geri tuşu, arka plana geçiş ve uzaktan gelen güncellemeler burada karşılanır. */
const WEB_VERSION = 1; // version.txt ile aynı tutulur; her güncellemede 1 artar
const APP = window.AndroidApp || null;
const APP_INFO = { app: '' };
try { if (APP && APP.appVersion) APP_INFO.app = String(APP.appVersion()); } catch (e) { }
function appCall(fn) { try { if (APP && APP[fn]) return APP[fn](); } catch (e) { } return null; }
/* Geri tuşu: true dönerse oyun işi halletti; false dönerse (ana menüde) uygulama kapanır. */
window.appBack = function () {
  Sound.init();
  if (!$('#adov').classList.contains('hidden')) return true;            // reklam oynarken yok say
  if (G.state === 'count' || G.state === 'dying') return true;
  if (G.state === 'play') { pauseGame(); return true; }
  if (G.state === 'pause') { Sound.play('click'); resumeGame(); return true; }
  if (G.state === 'revive') { if (!$('#panel').classList.contains('wait')) endRun(); return true; }
  if (G.state === 'over') { if (UI.cur === 'p-over') showMenu(); else { closeModal(); showGameOver(false); } Sound.play('click'); return true; }
  if (UI.cur) { closeModal(); refreshMenu(); Sound.play('click'); return true; }
  return false;
};
window.appPause = function () { if (G.state === 'play') pauseGame(); Sound.suspend(); };
window.appResume = function () { Sound.resumeCtx(); };
/* Yeni sürüm arka planda indi: oyuncu menüde boştayken kısa bir uyarıyla yeniden yüklenir.
   Koşu sırasında asla yenilenmez; uygulama bir dahaki açılışta da yeni sürümle açılır. */
window.onAppUpdateReady = function (v) { UI.updReady = +v || 1; };
function updateTick() {
  if (!UI.updReady || UI.updGoing || G.state !== 'menu' || UI.cur || performance.now() - (UI.menuAt || 0) < 2500) return;
  UI.updGoing = true;
  toast('Yeni sürüm geldi!<small>Oyun yenileniyor…</small>', 'good', 1600, 'gift');
  setTimeout(() => { saveGame(); if (G.state === 'menu' && !UI.cur) appCall('applyUpdate'); else UI.updGoing = false; }, 1700);
}
setInterval(updateTick, 1000);

async function boot() {
  loadSave(); if (!CHAR_BY[S.sel]) S.sel = 'minnos'; ensureMissions(); wordToday();
  decorateStatic();
  init3D();
  resize(); window.addEventListener('resize', () => { resize(); petSized = false; });
  setupInput();
  const t0 = performance.now();
  await Promise.all([new Promise(r => loadIconBitmaps(r)), Ads.init(), Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))])]);
  Ads.loaded();
  const wait = Math.max(0, 1100 - (performance.now() - t0));
  setTimeout(() => { const l = $('#loading'); l.classList.add('fadeout'); setTimeout(() => hide(l), 350); showMenu(); appCall('bootOk'); }, wait);
  requestAnimationFrame(loop);
}
boot();
