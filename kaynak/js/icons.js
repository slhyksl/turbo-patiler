'use strict';
/* =========================================================
   TURBO PATİLER — el çizimi ikon seti (SVG)
   Arayüzde satır içi SVG, oyunda önceden çizilmiş bitmap olarak kullanılır.
   ========================================================= */
const OL = '#1d1442';
const s4 = `stroke="${OL}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const s3 = `stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const hl = (d, w = 4) => `<path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".75"/>`;
function gearPath() { let t = ''; for (let i = 0; i < 8; i++) t += `<rect x="27" y="3" width="10" height="14" rx="3" fill="#b8c4d0" ${s4} transform="rotate(${i * 45} 32 32)"/>`; return t; }
const ICON_SRC = {
  coin: `<circle cx="32" cy="35" r="25" fill="#d97b00" ${s4}/><circle cx="32" cy="31" r="25" fill="#ffc21a" ${s4}/><circle cx="32" cy="31" r="17" fill="#ffd84d" stroke="#e39a00" stroke-width="3"/><path d="M32 20l3.3 6.7 7.4 1.1-5.4 5.2 1.3 7.3L32 36.8l-6.6 3.5 1.3-7.3-5.4-5.2 7.4-1.1z" fill="#ffb000" stroke="#d98a00" stroke-width="1.5" stroke-linejoin="round"/>${hl('M16 24a17 17 0 0 1 11-10')}`,
  gem: `<path d="M13 24L23 11h18l10 13-19 31z" fill="#2fb8ff" ${s4}/><path d="M23 11h18l-5 13h-8z" fill="#a6ecff"/><path d="M13 24h38M23 11l5 13 4 31 4-31 5-13" stroke="#137fc4" stroke-width="2.5" fill="none" stroke-linejoin="round"/><path d="M13 24L23 11h18l10 13-19 31z" fill="none" ${s4}/>${hl('M19 22l5-6', 3.5)}`,
  cart: `<path d="M18 19h39l-6 21H23z" fill="#36c2ff" ${s4}/><path d="M24 26h27M25 33h24" stroke="#9be3ff" stroke-width="3" stroke-linecap="round"/><path d="M5 11h9l9 33h29" fill="none" stroke="${OL}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="27" cy="52" r="5.5" fill="#fff" ${s4}/><circle cx="47" cy="52" r="5.5" fill="#fff" ${s4}/>`,
  target: `<circle cx="30" cy="34" r="24" fill="#ff4d5e" ${s4}/><circle cx="30" cy="34" r="16" fill="#fff" ${s3}/><circle cx="30" cy="34" r="8" fill="#ff4d5e" ${s3}/><path d="M31 33L54 10" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M49 8l8-2-2 8-6 1z" fill="#ffc21a" ${s3}/>${hl('M14 26a17 17 0 0 1 8-8', 3.5)}`,
  gift: `<rect x="10" y="29" width="44" height="27" rx="4" fill="#ff4d8b" ${s4}/><rect x="7" y="20" width="50" height="12" rx="3" fill="#ff7aa8" ${s4}/><rect x="28" y="20" width="8" height="36" fill="#ffc21a" ${s3}/><path d="M32 20c-3-11-16-13-15-4 1 5 9 5 15 4zM32 20c3-11 16-13 15-4-1 5-9 5-15 4z" fill="#ffc21a" ${s3}/>${hl('M13 36v10', 3.5)}`,
  paw: `<ellipse cx="32" cy="42" rx="14" ry="12" fill="#ff9f43" ${s4}/><circle cx="16" cy="27" r="6.5" fill="#ff9f43" ${s4}/><circle cx="26" cy="17" r="6.5" fill="#ff9f43" ${s4}/><circle cx="38" cy="17" r="6.5" fill="#ff9f43" ${s4}/><circle cx="48" cy="27" r="6.5" fill="#ff9f43" ${s4}/>${hl('M23 38a9 9 0 0 1 6-5', 3.5)}`,
  gear: gearPath() + `<circle cx="32" cy="32" r="18" fill="#d4dde6" ${s4}/><circle cx="32" cy="32" r="7" fill="#5b6b7a" ${s4}/>${hl('M20 26a13 13 0 0 1 7-7', 3.5)}`,
  pause: `<rect x="15" y="12" width="12" height="40" rx="4" fill="#fff" ${s4}/><rect x="37" y="12" width="12" height="40" rx="4" fill="#fff" ${s4}/>`,
  play: `<path d="M20 10l34 22-34 22z" fill="#fff" ${s4}/>`,
  ad: `<rect x="7" y="16" width="50" height="36" rx="8" fill="#7c4dff" ${s4}/><rect x="13" y="22" width="38" height="24" rx="5" fill="#a8ecff" ${s3}/><path d="M28 27v14l11-7z" fill="#fff" ${s3}/><path d="M25 16l-7-9M39 16l7-9" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`,
  magnet: `<path d="M12 12v20a20 20 0 0 0 40 0V12H39v20a7 7 0 0 1-14 0V12z" fill="#ff4d4d" ${s4}/><path d="M12 12h13v10H12zM39 12h13v10H39z" fill="#e6ecf2" ${s4}/>${hl('M17 34a15 15 0 0 0 5 9', 3.5)}`,
  double: `<circle cx="24" cy="26" r="17" fill="#ffc21a" ${s4}/><circle cx="24" cy="26" r="11" fill="#ffd84d" stroke="#e39a00" stroke-width="2.5"/><circle cx="40" cy="40" r="17" fill="#ffc21a" ${s4}/><circle cx="40" cy="40" r="11" fill="#ffd84d" stroke="#e39a00" stroke-width="2.5"/><path d="M40 33v14M33 40h14" stroke="#d98a00" stroke-width="4" stroke-linecap="round"/>${hl('M29 32a11 11 0 0 1 6-6', 3)}`,
  rocket: `<path d="M24 42c0 8 4 14 8 18 4-4 8-10 8-18z" fill="#ffb300" ${s3}/><path d="M28 44c0 5 2 8 4 10 2-2 4-5 4-10z" fill="#fff3a0"/><path d="M32 5c10 8 14 21 11 36H21C18 26 22 13 32 5z" fill="#f2f5f9" ${s4}/><path d="M21 31l-9 10v7l11-6zM43 31l9 10v7l-11-6z" fill="#ff4d5e" ${s4}/><circle cx="32" cy="23" r="6" fill="#36c2ff" ${s3}/>${hl('M26 14a20 20 0 0 0-2 12', 3)}`,
  spring: `<path d="M16 46l4 8 6-8 6 8 6-8 6 8 4-8" stroke="${OL}" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 37c0-7 2-15 6-19l11 4c5 2 11 4 18 6 8 2 13 5 13 10v3H8z" fill="#2ee59d" ${s4}/><rect x="6" y="38" width="52" height="8" rx="4" fill="#fff" ${s4}/><path d="M24 24l-3 6M31 26l-3 6M38 28l-2 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  shield: `<path d="M32 5l23 8v16c0 15-10 25-23 31C19 54 9 44 9 29V13z" fill="#36c2ff" ${s4}/><path d="M32 12l16 6v11c0 11-7 18-16 23z" fill="#8fe0ff"/><path d="M32 18l3.5 7 7.5 1.1-5.5 5.3 1.3 7.6L32 35.4 25.2 39l1.3-7.6L21 26.1l7.5-1.1z" fill="#fff" ${s3}/>`,
  home: `<path d="M14 29v25h36V29L32 14z" fill="#ffc21a" ${s4}/><rect x="27" y="38" width="10" height="16" rx="2" fill="#ff6b4a" ${s3}/><path d="M7 31L32 10l25 21" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 31L32 10l25 21" stroke="#ff4d5e" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  trophy: `<path d="M18 13H9c0 10 4 15 11 15M46 13h9c0 10-4 15-11 15" stroke="${OL}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M18 7h28v16c0 10-6 16-14 16s-14-6-14-16z" fill="#ffc21a" ${s4}/><rect x="28" y="38" width="8" height="9" fill="#e39a00" ${s3}/><rect x="18" y="47" width="28" height="9" rx="3" fill="#8b5a3c" ${s4}/>${hl('M24 13v9', 3.5)}`,
  star: `<path d="M32 5l8 17 18 2.5-13 12.5 3.3 18L32 46.5 15.7 55 19 37 6 24.5 24 22z" fill="#ffc21a" ${s4}/>${hl('M24 26l3-6', 3.5)}`,
  lock: `<path d="M21 29v-8a11 11 0 0 1 22 0v8" stroke="${OL}" stroke-width="10" fill="none"/><path d="M21 29v-8a11 11 0 0 1 22 0v8" stroke="#b8c4d0" stroke-width="4" fill="none"/><rect x="13" y="28" width="38" height="28" rx="7" fill="#ffc21a" ${s4}/><circle cx="32" cy="40" r="4" fill="${OL}"/><path d="M32 42v7" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`,
  check: `<circle cx="32" cy="32" r="25" fill="#59d22b" ${s4}/><path d="M20 33l8 8 17-17" stroke="${OL}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 33l8 8 17-17" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  close: `<path d="M17 17l30 30M47 17L17 47" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M17 17l30 30M47 17L17 47" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  music: `<path d="M23 46V15l27-6v31" stroke="${OL}" stroke-width="5" fill="none" stroke-linejoin="round"/><ellipse cx="17" cy="47" rx="8" ry="6.5" fill="#ff4d8b" ${s4}/><ellipse cx="44" cy="41" rx="8" ry="6.5" fill="#ff4d8b" ${s4}/>`,
  sound: `<path d="M9 25h10l14-12v38L19 39H9z" fill="#36c2ff" ${s4}/><path d="M41 23a12 12 0 0 1 0 18M47 16a21 21 0 0 1 0 32" stroke="${OL}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  off: `<path d="M10 54L54 10" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M10 54L54 10" stroke="#ff4d5e" stroke-width="5" stroke-linecap="round"/>`,
  bolt: `<path d="M37 4L12 36h17l-5 24 27-34H35z" fill="#ffc21a" ${s4}/>${hl('M30 14l-8 11', 3.5)}`,
  bag: `<path d="M22 18v-4a10 10 0 0 1 20 0v4" stroke="${OL}" stroke-width="5" fill="none"/><rect x="11" y="17" width="42" height="40" rx="11" fill="#ff9f43" ${s4}/><rect x="20" y="36" width="24" height="15" rx="4" fill="#ffc98f" ${s3}/><path d="M11 28h42" stroke="${OL}" stroke-width="3"/>`,
  abc: `<rect x="8" y="8" width="48" height="48" rx="10" fill="#ffc21a" ${s4}/><path d="M22 47l10-30 10 30M26 37h12" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<circle cx="32" cy="32" r="25" fill="#59d22b" ${s4}/><path d="M32 18v28M18 32h28" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M32 18v28M18 32h28" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
  left: `<path d="M40 10L18 32l22 22" stroke="${OL}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 10L18 32l22 22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  right: `<path d="M24 10l22 22-22 22" stroke="${OL}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 10l22 22-22 22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  fire: `<path d="M32 4c4 10 17 15 17 31a17 17 0 0 1-34 0c0-9 4-13 9-17 0 6 2 9 4 9 0-9 0-15 4-23z" fill="#ff7a1a" ${s4}/><path d="M32 30c3 5 8 7 8 14a8 8 0 0 1-16 0c0-5 4-7 8-14z" fill="#ffd23f"/>`,
  clock: `<circle cx="32" cy="33" r="24" fill="#fff" ${s4}/><path d="M32 19v15l9 6" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  road: `<path d="M22 6h20l14 52H8z" fill="#7d8190" ${s4}/><path d="M32 10v8M32 26v8M32 42v10" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  vacuum: `<ellipse cx="32" cy="46" rx="26" ry="10" fill="#37474f" ${s4}/><rect x="6" y="30" width="52" height="16" fill="#546e7a"/><path d="M6 30v16M58 30v16" stroke="${OL}" stroke-width="4"/><ellipse cx="32" cy="30" rx="26" ry="10" fill="#78909c" ${s4}/><rect x="24" y="14" width="16" height="14" rx="3" fill="#455a64" ${s3}/><circle cx="32" cy="11" r="5" fill="#ff1744" ${s3}/><circle cx="18" cy="38" r="2.5" fill="#ff1744"/><circle cx="32" cy="40" r="2.5" fill="#ff1744"/><circle cx="46" cy="38" r="2.5" fill="#ff1744"/>`,
};
const ICON_SVG = {};
for (const k in ICON_SRC) ICON_SVG[k] = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">${ICON_SRC[k]}</svg>`;
/* arayüz için satır içi ikon */
function I(name, cls) { return `<i class="ic ${cls || ''}">${ICON_SVG[name] || ''}</i>`; }
/* oyun için bitmap ikon (bir kez çizilir, sonra hızlıca kopyalanır) */
const ICON_BMP = {};
function loadIconBitmaps(done) {
  const names = ['coin', 'gem', 'magnet', 'double', 'rocket', 'spring', 'shield', 'star'];
  let left = names.length;
  for (const n of names) {
    const img = new Image(), S = 128;
    img.onload = () => { const cv = document.createElement('canvas'); cv.width = S; cv.height = S; cv.getContext('2d').drawImage(img, 0, 0, S, S); ICON_BMP[n] = cv; if (--left === 0 && done) done(); };
    img.onerror = () => { if (--left === 0 && done) done(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICON_SVG[n]);
  }
}
