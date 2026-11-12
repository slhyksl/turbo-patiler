'use strict';
/* =========================================================
   TURBO PATİLER — 3B modeller (düşük poligon, çizgi film)
   Karakterler +z yönüne bakar; oyunda arkadan görünür.
   ========================================================= */
const MOD = { chars: {}, trains: new Map(), track: [], low: [], high: [], ramp: [], decor: {} };
const TILE = 24;
const sh = (h, a) => shadeHex(h, a);

/* ---------------- KARAKTERLER ---------------- */
function buildChar(ch) {
  const B = ch.body, BE = ch.belly, D = ch.dark || '#2d2d35', K = ch.kind, limb = K === 'panda' ? D : B;
  const body = new MB(), face = new MB(), hy = 1.25;
  body.sph({ p: [0, 0.56, 0], s: [0.86, 0.84, 0.8], c: B }, 20, 14);
  face.sph({ p: [0, 0.52, 0.17], s: [0.56, 0.62, 0.5], c: BE }, 16, 12);
  if (K === 'panda') face.cyl({ p: [0, 0.86, 0], s: [0.83, 0.22, 0.79], c: D }, 18);
  /* kafa: elipsoid yarıçapları */
  const RX = K === 'dino' ? 0.56 : 0.59, RY = K === 'dino' ? 0.5 : 0.54, RZ = K === 'dino' ? 0.55 : 0.54;
  const surf = (x, y) => RZ * Math.sqrt(Math.max(0.05, 1 - (x / RX) ** 2 - (y / RY) ** 2));
  const tilt = (x, y) => Math.atan2(x / (RX * RX), surf(x, y) / (RZ * RZ));
  if (K === 'robot') {
    body.box({ p: [0, hy, 0], s: [1.16, 0.96, 1.0], c: B });
    face.box({ p: [0, hy + 0.03, 0.47], s: [0.92, 0.44, 0.1], c: '#1d2733' });
    for (const sx of [-1, 1]) { face.box({ p: [sx * 0.2, hy + 0.05, 0.53], s: [0.17, 0.22, 0.04], c: '#4dfcff' }); body.cyl({ p: [sx * 0.62, hy, 0], r: [0, 0, Math.PI / 2], s: [0.36, 0.1, 0.36], c: '#7d8b99' }); }
    body.cyl({ p: [0, hy + 0.62, 0], s: [0.06, 0.32, 0.06], c: '#5b6b7a' }, 8); body.sph({ p: [0, hy + 0.82, 0], s: 0.18, c: '#ff5252' });
    face.box({ p: [0, 0.62, 0.41], s: [0.32, 0.2, 0.06], c: '#4dd0e1' });
    face.box({ p: [0, hy - 0.3, 0.5], s: [0.26, 0.05, 0.04], c: '#33414f' });
  } else {
    body.sph({ p: [0, hy, 0], s: [RX * 2, RY * 2, RZ * 2], c: B }, 22, 16);
    const muzzle = K === 'dog' || K === 'bear' || K === 'unicorn' || K === 'dino';
    if (K === 'panda') for (const sx of [-1, 1]) face.sph({ p: [sx * 0.21, hy + 0.02, surf(0.21, 0.02) - 0.05], r: [sx * 0.3, 0, sx * 0.5], s: [0.3, 0.38, 0.12], c: D });
    if (K === 'fox') for (const sx of [-1, 1]) face.sph({ p: [sx * 0.2, hy - 0.15, surf(0.2, -0.15) - 0.08], s: [0.42, 0.32, 0.22], c: '#ffffff' });
    if (muzzle) face.sph({ p: [0, hy - 0.14, surf(0, -0.14) - 0.06], s: [K === 'dino' ? 0.5 : 0.42, 0.3, 0.2], c: BE });
    for (const sx of [-1, 1]) {
      const ex = sx * 0.21, ey = 0.05, ez = surf(ex, ey), ty = tilt(ex, ey);
      face.sph({ p: [ex, hy + ey, ez - 0.035], r: [ty, -0.08, 0], s: [0.22, 0.29, 0.1], c: '#1c1428' }, 14, 10);
      face.sph({ p: [ex + 0.045, hy + ey + 0.075, ez + 0.01], s: [0.08, 0.08, 0.04], c: '#ffffff' }, 8, 6);
      face.sph({ p: [ex - 0.035, hy + ey - 0.06, ez + 0.005], s: [0.04, 0.04, 0.02], c: '#ffffff' }, 6, 5);
      if (K !== 'panda') { const cx = sx * 0.37, cy = -0.13; face.sph({ p: [cx, hy + cy, surf(cx, cy) - 0.01], r: [tilt(cx, cy), 0, 0], s: [0.19, 0.11, 0.04], c: '#ff8fb0' }, 10, 6); }
    }
    const nz = muzzle ? surf(0, -0.08) + 0.04 : surf(0, -0.07);
    if (K === 'dino' || K === 'unicorn') for (const sx of [-1, 1]) face.sph({ p: [sx * 0.07, hy - 0.08, nz], s: 0.06, c: K === 'unicorn' ? '#ff8fbf' : '#2f6b2f' }, 6, 5);
    else face.sph({ p: [0, hy - 0.07, nz], s: [0.12, 0.08, 0.07], c: K === 'cat' || K === 'bunny' ? '#ff7aa2' : '#2b2233' }, 8, 6);
    const mz = muzzle ? surf(0, -0.2) + 0.03 : surf(0, -0.19);
    for (const sx of [-1, 1]) face.sph({ p: [sx * 0.045, hy - 0.19, mz], r: [0, 0, sx * 0.5], s: [0.1, 0.035, 0.03], c: '#3a2a2a' }, 6, 4);
  }
  /* kulaklar */
  const E = ch.ear;
  for (const sx of [-1, 1]) {
    if (E === 'cat' || E === 'fox') {
      const k = E === 'fox' ? 1.25 : 1;
      body.cone({ p: [sx * 0.32, hy + 0.48 * k, 0], r: [0, 0, -sx * 0.32], s: [0.34 * k, 0.42 * k, 0.22], c: B }, 10);
      face.cone({ p: [sx * 0.31, hy + 0.45 * k, 0.08], r: [0, 0, -sx * 0.32], s: [0.2 * k, 0.28 * k, 0.06], c: E === 'fox' ? '#ffffff' : '#ff9fbb' }, 10);
      if (E === 'fox') face.cone({ p: [sx * 0.44, hy + 0.79, 0], r: [0, 0, -sx * 0.32], s: [0.17, 0.2, 0.13], c: '#3a2a2a' }, 8);
    } else if (E === 'bunny') {
      body.sph({ p: [sx * 0.21, hy + 0.76, -0.02], r: [0, 0, -sx * 0.12], s: [0.25, 0.78, 0.17], c: B });
      face.sph({ p: [sx * 0.21, hy + 0.76, 0.055], r: [0, 0, -sx * 0.12], s: [0.12, 0.58, 0.05], c: '#ff9fbb' });
    } else if (E === 'round') {
      body.sph({ p: [sx * 0.41, hy + 0.42, 0], s: [0.32, 0.32, 0.2], c: K === 'panda' ? D : B });
      if (K !== 'panda') face.sph({ p: [sx * 0.41, hy + 0.42, 0.075], s: [0.16, 0.16, 0.06], c: '#c4dcff' });
    } else if (E === 'dog') body.sph({ p: [sx * 0.56, hy - 0.02, 0], r: [0, 0, sx * 0.32], s: [0.27, 0.62, 0.18], c: sh(B, -0.28) });
    else if (E === 'horse') { body.cone({ p: [sx * 0.3, hy + 0.48, -0.03], r: [0, 0, -sx * 0.25], s: [0.2, 0.36, 0.14], c: B }, 8); face.cone({ p: [sx * 0.3, hy + 0.46, 0.04], r: [0, 0, -sx * 0.25], s: [0.1, 0.22, 0.04], c: '#ff9fbb' }, 8); }
  }
  if (E === 'spikes') {
    [[hy + 0.48, 0.15], [hy + 0.53, -0.12], [hy + 0.42, -0.38]].forEach(([y, z]) => body.cone({ p: [0, y, z], r: [0, -0.3, 0], s: [0.18, 0.28, 0.18], c: sh(B, -0.25) }, 6));
    [[0.95, -0.36], [0.68, -0.42], [0.4, -0.4]].forEach(([y, z]) => body.cone({ p: [0, y, z], r: [0, -1.0, 0], s: [0.18, 0.28, 0.18], c: sh(B, -0.25) }, 6));
  }
  /* aksesuarlar */
  switch (ch.acc) {
    case 'collar': face.cyl({ p: [0, 0.94, 0], s: [0.75, 0.1, 0.71], c: '#e53935' }, 16); face.sph({ p: [0, 0.86, 0.37], s: 0.12, c: '#ffd54f' }); break;
    case 'bow': face.sph({ p: [0.2, hy + 0.55, 0.06], s: [0.2, 0.15, 0.08], c: '#ff5fa2' }); face.sph({ p: [0.38, hy + 0.5, 0.06], s: [0.2, 0.15, 0.08], c: '#ff5fa2' }); face.sph({ p: [0.29, hy + 0.52, 0.09], s: 0.09, c: '#ff2d87' }); break;
    case 'scarf': face.cyl({ p: [0, 0.96, 0], s: [0.81, 0.17, 0.77], c: '#e53935' }, 16); face.box({ p: [0.16, 0.72, 0.37], r: [0, 0.2, 0.1], s: [0.17, 0.38, 0.06], c: '#e53935' }); face.box({ p: [0.16, 0.6, 0.39], r: [0, 0.2, 0.1], s: [0.18, 0.06, 0.07], c: '#ffffff' }); break;
    case 'beanie': body.hemi({ p: [0, hy + 0.12, -0.02], s: [1.24, 1.15, 1.16], c: '#3d7bff' }, 18, 6); face.cyl({ p: [0, hy + 0.15, -0.02], s: [1.27, 0.16, 1.19], c: '#ffd23f' }, 18); body.sph({ p: [0, hy + 0.74, -0.02], s: 0.28, c: '#ffffff' }); break;
    case 'headband': face.cyl({ p: [0, hy + 0.2, 0], s: [1.22, 0.16, 1.12], c: '#e53935' }, 18); face.sph({ p: [0, hy + 0.2, -0.56], s: 0.14, c: '#b71c1c' }); face.box({ p: [0.12, hy + 0.08, -0.62], r: [0.3, 0.2, 0.4], s: [0.12, 0.34, 0.05], c: '#e53935' }); face.box({ p: [-0.06, hy + 0.02, -0.6], r: [-0.3, 0.2, -0.3], s: [0.12, 0.3, 0.05], c: '#e53935' }); break;
    case 'horn':
      body.cone({ p: [0, hy + 0.62, 0.28], r: [0, 0.35, 0], s: [0.15, 0.52, 0.15], c: '#ffd54f' }, 10);
      for (let i = 0; i < 6; i++) { const t = 1.25 + i * 0.32; body.sph({ p: [0, hy + 0.55 * Math.sin(t), 0.56 * Math.cos(t)], s: 0.24, c: RAINBOW[i] }, 10, 8); }
      break;
    case 'crown': body.cyl({ p: [0, hy + 0.56, 0], s: [0.52, 0.16, 0.52], c: '#ffcc00' }, 10); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; body.cone({ p: [Math.cos(a) * 0.2, hy + 0.72, Math.sin(a) * 0.2], s: [0.12, 0.18, 0.12], c: '#ffcc00' }, 5); } face.sph({ p: [0, hy + 0.57, 0.27], s: 0.1, c: '#ff1744' }); break;
  }
  /* turbo sırt çantası */
  body.box({ p: [0, 0.68, -0.42], s: [0.5, 0.5, 0.26], c: '#455a64' });
  face.box({ p: [0, 0.73, -0.56], s: [0.52, 0.09, 0.03], c: '#ff5252' });
  face.sph({ p: [0, 0.85, -0.56], s: 0.09, c: '#ffd23f' });
  for (const sx of [-1, 1]) body.cyl({ p: [sx * 0.14, 0.4, -0.45], s: [0.15, 0.14, 0.15], c: '#b0bec5' }, 8);
  /* kollar, ayaklar, kuyruk */
  const arm = new MB().sph({ p: [0, -0.16, 0], s: [0.2, 0.4, 0.2], c: limb }).build();
  const foot = new MB().sph({ p: [0, 0.09, 0.05], s: [0.3, 0.2, 0.42], c: K === 'panda' ? D : sh(B, -0.08) }).build();
  const tl = new MB();
  switch (ch.tail) {
    case 'cat': for (let i = 0; i < 5; i++) tl.sph({ p: [0, i * 0.13, -i * 0.08], s: 0.17 - i * 0.008, c: i === 4 && ch.id === 'minnos' ? '#ffffff' : B }, 10, 7); break;
    case 'dog': for (let i = 0; i < 3; i++) tl.sph({ p: [0, i * 0.12, -i * 0.05], s: 0.16, c: sh(B, -0.15) }, 10, 7); break;
    case 'fox': tl.sph({ p: [0, 0.16, -0.3], r: [0, 0.7, 0], s: [0.38, 0.38, 0.8], c: B }); tl.sph({ p: [0, 0.42, -0.58], s: 0.3, c: '#ffffff' }); break;
    case 'dino': tl.cone({ p: [0, -0.05, -0.34], r: [0, -1.45, 0], s: [0.38, 0.72, 0.38], c: B }, 8); break;
    case 'cable': for (let i = 0; i < 4; i++) tl.sph({ p: [Math.sin(i) * 0.08, -i * 0.08, -i * 0.12], s: 0.08, c: '#37474f' }, 8, 6); tl.box({ p: [0.05, -0.34, -0.5], s: [0.14, 0.1, 0.14], c: '#ffca28' }); break;
    case 'rainbow': for (let i = 0; i < 6; i++) tl.sph({ p: [0, 0.05 - i * 0.07, -i * 0.11], s: 0.2 - i * 0.012, c: RAINBOW[i] }, 10, 7); break;
    default: tl.sph({ p: [0, 0, -0.05], s: 0.28, c: K === 'panda' ? D : '#ffffff' }, 10, 7);
  }
  const fl = new MB();
  for (const sx of [-1, 1]) { fl.cone({ p: [sx * 0.14, 0.12, -0.45], r: [0, Math.PI, 0], s: [0.17, 0.5, 0.17], c: '#ff9100' }, 8); fl.cone({ p: [sx * 0.14, 0.18, -0.45], r: [0, Math.PI, 0], s: [0.09, 0.32, 0.09], c: '#fff59d' }, 8); }
  return { body: body.build(), face: face.build(), arm, foot, tail: tl.build(), flame: fl.build() };
}
function charModel(ch) { let m = MOD.chars[ch.id]; if (!m) { m = buildChar(ch); MOD.chars[ch.id] = m; } return m; }
/* karakter çizimi: A = {x,y,z, ry, mode, phase, t, sq, lean, rocket, rot} */
const _m4a = new Float32Array(16), _m4b = new Float32Array(16), _m4c = new Float32Array(16);
function drawChar(r, ch, A, outW) {
  const m = charModel(ch), run = A.mode === 'run', air = A.mode === 'jump', slide = A.mode === 'slide', idle = A.mode === 'idle';
  const ph = A.phase || 0, t = A.t || 0, sq = A.sq || 1;
  const bob = run ? Math.abs(Math.sin(ph)) * 0.09 : idle ? Math.sin(t * 3) * 0.03 : 0;
  const root = M4.trs(_m4a, A.x, A.y + bob, A.z, A.ry || 0, (slide ? 0.55 : 0) + (A.rot || 0), A.lean || 0, 0.95 / Math.sqrt(sq), 0.95 * sq * (slide ? 0.6 : 1), 0.95 / Math.sqrt(sq));
  const o = { out: outW };
  r.draw(m.body, root, o); r.draw(m.face, root, null);
  const part = (mesh, px, py, pz, ry, rx, rz) => { M4.trs(_m4b, px, py, pz, ry, rx, rz, 1); M4.mul(_m4c, root, _m4b); r.draw(mesh, _m4c, o); };
  const sw = run ? Math.sin(ph) : 0;
  for (const sx of [-1, 1]) {
    const ax = air ? -2.6 : idle ? (sx > 0 ? -0.6 - Math.max(0, Math.sin(t * 4)) * 1.6 : 0.15) : sw * sx * 0.9;
    part(m.arm, sx * 0.43, 0.8, 0.02, 0, ax, sx * (air ? 0.4 : 0.25));
    const fz = run ? sw * sx * 0.2 : 0, fy = run ? Math.max(0, sw * sx) * 0.18 : air ? 0.14 : 0;
    part(m.foot, sx * 0.2, fy, fz, 0, air ? -0.5 : 0, 0);
  }
  part(m.tail, 0, 0.42, -0.38, Math.sin(t * 7) * (run ? 0.35 : 0.2), -0.15, 0);
  if (A.rocket) { M4.trs(_m4b, 0, 0, 0, 0, 0, 0, 1, 0.8 + Math.random() * 0.5, 1); M4.mul(_m4c, root, _m4b); r.draw(m.flame, _m4c, { emit: 0.9 }); }
}

/* ---------------- YOL (raylı karo) ---------------- */
function buildTrack(b, alt) {
  const mb = new MB(), c = b.css;
  mb.box({ p: [0, -0.06, TILE / 2], s: [RH * 2, 0.12, TILE], c: c.road0 });
  for (let z = 0; z < TILE; z += 1.5) for (const lx of [-LANE_W, 0, LANE_W]) mb.box({ p: [lx, 0.03, z + 0.75], s: [1.76, 0.08, 0.42], c: c.tie });
  for (const lx of [-LANE_W, 0, LANE_W]) for (const rx of [-0.56, 0.56]) mb.box({ p: [lx + rx, 0.13, TILE / 2], s: [0.13, 0.14, TILE], c: c.rail });
  for (let z = 0, i = 0; z < TILE; z += 3, i++) for (const sx of [-1, 1]) mb.box({ p: [sx * (RH + 0.28), 0.08, z + 1.5], s: [0.56, 0.18, 3], c: i % 2 ? c.curb0 : c.curb1 });
  for (const sx of [-1, 1]) mb.box({ p: [sx * (RH + 0.56 + 35), -0.08, TILE / 2], s: [70, 0.12, TILE], c: alt ? c.ground1 : c.ground0 });
  return mb.build();
}
/* ---------------- ENGELLER ---------------- */
function buildLow(b) {
  const mb = new MB(), c = b.css;
  for (const sx of [-1, 1]) mb.box({ p: [sx * 0.72, 0.3, 0.25], s: [0.14, 0.6, 0.14], c: '#5b6470' });
  for (let i = 0; i < 5; i++) mb.box({ p: [-0.76 + i * 0.38, 0.73, 0.25], s: [0.38, 0.52, 0.22], c: i % 2 ? c.bar1 : c.bar0 });
  mb.box({ p: [0, 1.02, 0.25], s: [1.94, 0.07, 0.24], c: '#ffffff' });
  return mb.build();
}
function buildHigh(b) {
  const mb = new MB(), c = b.css;
  for (const sx of [-1, 1]) { mb.box({ p: [sx * 0.9, 1.3, 0.2], s: [0.18, 2.6, 0.18], c: '#6a7480' }); mb.sph({ p: [sx * 0.5, 2.62, 0.2], s: 0.22, c: '#ffeb3b' }, 10, 7); }
  for (let i = 0; i < 5; i++) mb.box({ p: [-0.66 + i * 0.33, 1.9, 0.2], s: [0.33, 1.08, 0.22], c: i % 2 ? c.bar1 : c.bar0 });
  mb.box({ p: [0, 2.48, 0.2], s: [1.8, 0.08, 0.24], c: '#ffffff' });
  return mb.build();
}
function buildRamp(b) {
  const mb = new MB(), c = b.css, ang = Math.atan2(BLOCK_H, 6);
  mb.wedge({ p: [0, 0, 3], s: [1.9, BLOCK_H, 6], c: c.ramp0 });
  for (let i = 0; i < 4; i++) { const z = 0.75 + i * 1.5; mb.box({ p: [0, BLOCK_H * z / 6 + 0.03, z], r: [0, -ang, 0], s: [1.5, 0.06, 0.45], c: c.ramp1 }); }
  for (const sx of [-1, 1]) mb.box({ p: [sx * 0.9, BLOCK_H * 0.5 + 0.06, 3], r: [0, -ang, 0], s: [0.12, 0.12, 6.4], c: c.trainSide });
  return mb.build();
}
function buildTrain(b, len, moving) {
  const mb = new MB(), c = b.css, H = BLOCK_H;
  mb.box({ p: [0, (H + 0.26) / 2, len / 2], s: [1.9, H - 0.26, len], c: c.train0 });
  mb.box({ p: [0, H + 0.03, len / 2], s: [1.72, 0.08, len - 0.3], c: c.trainRoof });
  mb.box({ p: [0, H + 0.16, len / 2], s: [0.9, 0.24, Math.min(2.4, len * 0.3)], c: c.train1 });
  for (const sx of [-1, 1]) {
    mb.box({ p: [sx * 0.955, 0.78, len / 2], s: [0.03, 0.22, len - 0.2], c: c.train1 });
    for (let z = 0.7; z < len - 1.2; z += 2.6) mb.box({ p: [sx * 0.96, 1.62, z + 0.85], s: [0.04, 0.68, 1.6], c: c.train2 });
    for (const z of [1.2, len - 1.2]) mb.cyl({ p: [sx * 0.82, 0.26, z], r: [0, 0, Math.PI / 2], s: [0.46, 0.14, 0.46], c: '#2a2540' }, 10);
  }
  mb.box({ p: [0, 1.75, -0.02], s: [1.5, 0.74, 0.05], c: c.train2 });
  mb.box({ p: [-0.35, 1.75, -0.05], r: [0, 0, 0.5], s: [0.22, 0.7, 0.02], c: '#ffffff' });
  mb.box({ p: [0, 1.15, -0.02], s: [1.92, 0.18, 0.04], c: c.train1 });
  for (const sx of [-1, 1]) mb.cyl({ p: [sx * 0.62, 0.62, -0.03], r: [0, Math.PI / 2, 0], s: [0.28, 0.06, 0.28], c: moving ? '#fffde0' : '#fff59d' }, 10);
  mb.box({ p: [0, 0.32, -0.05], s: [1.94, 0.18, 0.1], c: '#2a2540' });
  if (moving) for (const sx of [-1, 1]) {
    mb.box({ p: [sx * 0.33, 1.78, -0.06], s: [0.42, 0.28, 0.03], c: '#ffffff' });
    mb.box({ p: [sx * 0.29, 1.74, -0.08], s: [0.15, 0.15, 0.03], c: '#1d1442' });
    mb.box({ p: [sx * 0.33, 2.02, -0.07], r: [0, 0, sx * 0.35], s: [0.48, 0.08, 0.03], c: '#1d1442' });
  }
  return mb.build();
}
function trainMesh(bi, len, moving) { const k = bi * 1000 + len * 2 + (moving ? 1 : 0); let m = MOD.trains.get(k); if (!m) { m = buildTrain(BIOMES[bi], len, moving); MOD.trains.set(k, m); } return m; }

/* ---------------- TOPLANABİLİRLER ---------------- */
function buildItems() {
  MOD.coin = new MB().cyl({ r: [0, Math.PI / 2, 0], s: [0.7, 0.1, 0.7], c: '#f0a000' }, 16).cyl({ r: [0, Math.PI / 2, 0], s: [0.5, 0.13, 0.5], c: '#ffd84d' }, 16).build();
  MOD.gem = new MB().octa({ s: [0.8, 1.0, 0.8], c: '#2fb8ff' }).build();
  MOD.ball = new MB().sph({ s: 1, c: '#ffffff' }, 16, 12).build();
  MOD.disc = new MB().cyl({ s: [1, 0.02, 1], c: '#000000' }, 20).build();
  MOD.orb = new MB().sph({ s: 0.16, c: '#ff4d5e' }, 8, 6).build();
  /* Süpürgeç */
  const v = new MB();
  v.cyl({ p: [0, 0.38, 0], s: [2.7, 0.56, 2.7], c: '#37474f' }, 20);
  v.cyl({ p: [0, 0.72, 0], s: [2.6, 0.14, 2.6], c: '#607d8b' }, 20);
  v.hemi({ p: [0, 0.78, 0], s: [1.2, 0.9, 1.2], c: '#455a64' });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; v.sph({ p: [Math.cos(a) * 1.36, 0.42, Math.sin(a) * 1.36], s: 0.14, c: '#ff1744' }, 6, 5); }
  for (const sx of [-1, 1]) { v.box({ p: [sx * 0.95, 1.05, 0.1], r: [0, 0, sx * 0.5], s: [0.9, 0.12, 0.12], c: '#90a4ae' }); v.box({ p: [sx * 1.38, 1.3, 0.1], s: [0.1, 0.36, 0.3], c: '#ffd54f' }); }
  MOD.vac = v.build();
  MOD.siren = new MB().sph({ p: [0, 1.3, 0], s: 0.4, c: '#ff1744' }, 10, 8).build();
  const br = new MB(); for (let i = 0; i < 3; i++) br.box({ r: [i * Math.PI / 3, 0, 0], s: [0.9, 0.05, 0.12], c: '#ffd54f' }); MOD.brush = br.build();
}

/* ---------------- ÇEVRE SÜSLERİ ---------------- */
function buildDecor() {
  const D = MOD.decor, add = (k, mb) => { (D[k] = D[k] || []).push(mb.build()); };
  for (const col of ['#ffe08a', '#ffb199', '#b8e6ff', '#cdeeb0']) {
    const m = new MB();
    m.box({ p: [0, 1.0, 0], s: [2.6, 2.0, 2.4], c: col });
    m.wedge({ p: [0, 2.0, -0.65], s: [2.9, 1.0, 1.3], c: col === '#b8e6ff' ? '#8b5a3c' : '#e5533d' });
    m.wedge({ p: [0, 2.0, 0.65], r: [Math.PI, 0, 0], s: [2.9, 1.0, 1.3], c: col === '#b8e6ff' ? '#8b5a3c' : '#e5533d' });
    m.box({ p: [0, 0.55, 1.22], s: [0.55, 1.05, 0.05], c: '#7a4a2a' });
    for (const sx of [-1, 1]) m.box({ p: [sx * 0.78, 1.3, 1.22], s: [0.5, 0.45, 0.05], c: '#fff7c2' });
    m.box({ p: [0.7, 2.7, -0.4], s: [0.3, 0.7, 0.3], c: '#8d6e63' });
    add('house', m);
  }
  { const m = new MB(); m.cyl({ p: [0, 0.75, 0], s: [0.32, 1.5, 0.32], c: '#8b5a3c' }, 7); m.sph({ p: [0, 2.15, 0], s: 1.75, c: '#3fae49', flat: true }, 7, 5); m.sph({ p: [-0.55, 1.75, 0.25], s: 1.15, c: '#4cc357', flat: true }, 7, 5); m.sph({ p: [0.55, 1.85, -0.2], s: 1.2, c: '#37a142', flat: true }, 7, 5); add('tree', m); }
  { const m = new MB(); m.cyl({ p: [0, 1.4, 0], s: [0.13, 2.8, 0.13], c: '#455a64' }, 6); m.sph({ p: [0, 2.9, 0], s: 0.42, c: '#fff59d' }, 8, 6); add('lamp', m); }
  { const m = new MB(); [[-0.45, 0.4, 0, 0.95, '#3fae49'], [0.45, 0.4, 0.1, 0.95, '#37a142'], [0, 0.6, -0.1, 1.15, '#4cc357']].forEach(([x, y, z, s, c]) => m.sph({ p: [x, y, z], s, c, flat: true }, 7, 5)); m.sph({ p: [-0.25, 0.95, 0.4], s: 0.18, c: '#ff5c8a' }, 6, 4); m.sph({ p: [0.35, 0.8, 0.45], s: 0.18, c: '#ffd23f' }, 6, 4); add('bush', m); }
  for (const col of ['#ff5fa2', '#7c4dff', '#00c2ff', '#ffb300']) { const m = new MB(); m.cyl({ p: [0, 1.1, 0], s: [0.14, 2.2, 0.14], c: '#ffffff' }, 6); m.cyl({ p: [0, 2.65, 0], r: [0, Math.PI / 2, 0], s: [1.6, 0.22, 1.6], c: col }, 18); m.cyl({ p: [0, 2.65, 0], r: [0, Math.PI / 2, 0], s: [1.1, 0.25, 1.1], c: '#ffffff' }, 18); m.cyl({ p: [0, 2.65, 0], r: [0, Math.PI / 2, 0], s: [0.65, 0.28, 0.65], c: col }, 14); add('lolly', m); }
  { const m = new MB(); for (let i = 0; i < 6; i++) m.cyl({ p: [0, 0.2 + i * 0.36, 0], s: [0.3, 0.36, 0.3], c: i % 2 ? '#ff3b5c' : '#ffffff' }, 8); for (let i = 0; i < 4; i++) { const a = i / 3 * Math.PI; m.sph({ p: [0.42 - Math.cos(a) * 0.42, 2.25 + Math.sin(a) * 0.42, 0], s: 0.32, c: i % 2 ? '#ff3b5c' : '#ffffff' }, 8, 6); } add('cane', m); }
  { const m = new MB(); m.cyl({ p: [0, 0.45, 0], s: [1.25, 0.9, 1.25], c: '#ff8fbf' }, 12, 0.4, 0.5); m.sph({ p: [0, 1.05, 0], s: [1.35, 0.7, 1.35], c: '#fff3f8' }); m.sph({ p: [0, 1.4, 0], s: [0.85, 0.6, 0.85], c: '#fffaf0' }); m.sph({ p: [0, 1.8, 0], s: 0.32, c: '#e53935' }); add('cupcake', m); }
  for (const col of ['#69f0ae', '#ff5fa2', '#ffd23f', '#40c4ff']) add('gumdrop', new MB().hemi({ s: [1.5, 1.8, 1.5], c: col }));
  { const m = new MB(); for (let i = 0; i < 4; i++) m.cyl({ p: [i * 0.12, 0.45 + i * 0.85, 0], r: [0, 0, -0.12], s: [0.32 - i * 0.03, 0.9, 0.32 - i * 0.03], c: i % 2 ? '#8b5a3c' : '#a0704a' }, 7); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; m.sph({ p: [0.45 + Math.cos(a) * 0.8, 3.55, Math.sin(a) * 0.8], r: [-a + Math.PI / 2, 0.35, 0], s: [0.45, 0.12, 1.9], c: i % 2 ? '#2f9e44' : '#40c057', flat: true }, 8, 4); } add('palm', m); }
  { const m = new MB(); m.cyl({ p: [0, 0.55, 0], s: [0.45, 1.1, 0.45], c: '#fff3e0' }, 10); m.hemi({ p: [0, 1.0, 0], s: [1.7, 1.2, 1.7], c: '#e53935' }); [[0.3, 1.45, 0.45], [-0.4, 1.35, 0.4], [0.05, 1.6, -0.1], [0.55, 1.2, -0.3]].forEach(p => m.sph({ p, s: 0.22, c: '#ffffff' }, 6, 5)); add('mushroom', m); }
  for (const [k, col] of [['rock', '#3b2b28'], ['rock2', '#8a8f99']]) { const m = new MB(); m.sph({ p: [0, 0.4, 0], s: [2.0, 1.3, 1.6], c: col, flat: true }, 6, 4); m.sph({ p: [0.7, 0.25, 0.4], s: [0.9, 0.6, 0.8], c: sh(col, 0.12), flat: true }, 5, 4); if (k === 'rock') m.box({ p: [-0.2, 0.7, 0.62], r: [0.4, 0, 0.3], s: [0.6, 0.08, 0.05], c: '#ff6d00' }); add(k, m); }
  { const m = new MB(); m.cyl({ p: [0, 0.35, 0], s: [0.3, 0.7, 0.3], c: '#6d4c41' }, 6); for (let i = 0; i < 3; i++) { const y = 0.9 + i * 0.85, w = 2.2 - i * 0.55; m.cone({ p: [0, y, 0], s: [w, 1.3, w], c: '#1f7a4d' }, 8); m.cone({ p: [0, y + 0.42, 0], s: [w * 0.4, 0.46, w * 0.4], c: '#ffffff' }, 8); } add('pine', m); }
  { const m = new MB(); m.cone({ p: [0, 1.15, 0], s: [0.7, 2.3, 0.7], c: '#8fd8ff' }, 5); m.cone({ p: [0.55, 0.65, 0.2], r: [0, 0, -0.35], s: [0.45, 1.4, 0.45], c: '#c1ecff' }, 5); m.cone({ p: [-0.5, 0.55, -0.1], r: [0, 0, 0.4], s: [0.4, 1.2, 0.4], c: '#a6e2ff' }, 5); add('crystal', m); }
  { const m = new MB(); m.sph({ p: [0, 0.6, 0], s: 1.2, c: '#ffffff' }); m.sph({ p: [0, 1.45, 0], s: 0.82, c: '#f5fbff' }); for (const sx of [-1, 1]) m.sph({ p: [sx * 0.14, 1.55, 0.36], s: 0.08, c: '#222222' }, 6, 4); m.cone({ p: [0, 1.45, 0.52], r: [0, Math.PI / 2, 0], s: [0.14, 0.4, 0.14], c: '#ff8f00' }, 6); m.cyl({ p: [0, 1.85, 0], s: [0.75, 0.08, 0.75], c: '#222222' }, 10); m.cyl({ p: [0, 2.08, 0], s: [0.48, 0.45, 0.48], c: '#222222' }, 10); add('snowman', m); }
  for (const col of ['#00e5ff', '#ff3df2']) { const m = new MB(); m.cone({ p: [0, 2.2, 0], s: [0.85, 4.4, 0.85], c: '#2a1d6b' }, 6); m.cyl({ p: [0, 1.2, 0], s: [0.72, 0.12, 0.72], c: col }, 6); m.cyl({ p: [0, 2.4, 0], s: [0.45, 0.12, 0.45], c: col }, 6); m.sph({ p: [0, 4.45, 0], s: 0.32, c: col }, 8, 6); add('spire', m); }
  { const m = new MB(); m.cyl({ p: [0, 0.8, 0], s: [0.16, 1.6, 0.16], c: '#90a4ae' }, 6); m.hemi({ p: [0, 1.9, 0], r: [0, Math.PI - 0.7, 0], s: [1.7, 0.55, 1.7], c: '#cfd8dc' }); m.sph({ p: [0, 2.05, 0.2], s: 0.18, c: '#ff1744' }, 6, 4); add('dish', m); }
  { const m = new MB(); m.cone({ p: [-0.35, 0.7, 0], r: [0, 0, 0.25], s: [0.5, 1.4, 0.5], c: '#b388ff' }, 5); m.cone({ p: [0.1, 1.0, 0], s: [0.6, 2.0, 0.6], c: '#7c4dff' }, 5); m.cone({ p: [0.5, 0.55, 0.1], r: [0, 0, -0.3], s: [0.45, 1.1, 0.45], c: '#e1bee7' }, 5); add('crystal2', m); }
  { const m = new MB(); m.cyl({ p: [0, 0.6, 0], s: [2.2, 1.2, 2.2], c: '#2a1a16' }, 8, 0.5, 0.18); m.cyl({ p: [0, 1.22, 0], s: [0.7, 0.06, 0.7], c: '#ff9100' }, 8); m.sph({ p: [0, 1.55, 0], s: 0.42, c: '#ffab40' }, 8, 6); m.sph({ p: [0.25, 2.0, 0.1], s: 0.26, c: '#ff6d00' }, 6, 5); add('geyser', m); }
  { const m = new MB(); m.cyl({ p: [0, 1.0, 0], s: [0.22, 2.0, 0.22], c: '#1e1412' }, 6); m.cyl({ p: [-0.35, 1.7, 0], r: [0, 0, 0.7], s: [0.12, 1.0, 0.12], c: '#1e1412' }, 5); m.cyl({ p: [0.35, 2.0, 0], r: [0, 0, -0.6], s: [0.12, 0.9, 0.12], c: '#1e1412' }, 5); add('deadtree', m); }
}
function buildWorld() {
  buildItems(); buildDecor();
  BIOMES.forEach((b, i) => { MOD.track[i] = [buildTrack(b, false), buildTrack(b, true)]; MOD.low[i] = buildLow(b); MOD.high[i] = buildHigh(b); MOD.ramp[i] = buildRamp(b); });
}
