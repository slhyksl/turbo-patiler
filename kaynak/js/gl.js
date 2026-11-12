'use strict';
/* =========================================================
   TURBO PATİLER — küçük WebGL 3B motoru (dış kütüphane yok)
   Çizgi film ışığı + kontur + sis + kıvrılan dünya
   ========================================================= */
const M4 = {
  t: new Float32Array(16),
  ident(o) { o = o || new Float32Array(16); o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; },
  persp(o, fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2); o.fill(0); o[0] = -t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o; },
  lookAt(o, ex, ey, ez, cx, cy, cz) {
    let zx = ex - cx, zy = ey - cy, zz = ez - cz; let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xz) || 1; xx /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0; o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0; o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
    o[12] = -(xx * ex + xy * ey + xz * ez); o[13] = -(yx * ex + yy * ey + yz * ez); o[14] = -(zx * ex + zy * ey + zz * ez); o[15] = 1; return o;
  },
  /* o = T * Ry * Rx * Rz * S */
  trs(o, x, y, z, ry, rx, rz, sx, sy, sz) {
    const cy = Math.cos(ry || 0), syn = Math.sin(ry || 0), cx = Math.cos(rx || 0), sxn = Math.sin(rx || 0), cz = Math.cos(rz || 0), szn = Math.sin(rz || 0);
    if (sx === undefined) sx = 1; if (sy === undefined) sy = sx; if (sz === undefined) sz = sx;
    o[0] = (cy * cz + syn * sxn * szn) * sx; o[1] = (cx * szn) * sx; o[2] = (-syn * cz + cy * sxn * szn) * sx; o[3] = 0;
    o[4] = (-cy * szn + syn * sxn * cz) * sy; o[5] = (cx * cz) * sy; o[6] = (syn * szn + cy * sxn * cz) * sy; o[7] = 0;
    o[8] = (syn * cx) * sz; o[9] = (-sxn) * sz; o[10] = (cy * cx) * sz; o[11] = 0;
    o[12] = x; o[13] = y; o[14] = z; o[15] = 1; return o;
  },
  mul(o, a, b) { const r = M4.t; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { r[i * 4 + j] = a[j] * b[i * 4] + a[4 + j] * b[i * 4 + 1] + a[8 + j] * b[i * 4 + 2] + a[12 + j] * b[i * 4 + 3]; } o.set(r); return o; },
};
const _hexc = new Map();
function hex3(h) { let v = _hexc.get(h); if (v) return v; const c = hex2rgb(h); v = [c[0] / 255, c[1] / 255, c[2] / 255]; _hexc.set(h, v); return v; }

/* ---------- mesh oluşturucu ---------- */
const PRIM = {};
(function () {
  const box = []; const F = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (const n of F) {
    const u = n[0] !== 0 ? [0, 1, 0] : [1, 0, 0], v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [n[0] * 0.5 + (u[0] * a + v[0] * b) * 0.5, n[1] * 0.5 + (u[1] * a + v[1] * b) * 0.5, n[2] * 0.5 + (u[2] * a + v[2] * b) * 0.5]);
    box.push([cs[0], cs[1], cs[2]], [cs[0], cs[2], cs[3]]);
  }
  PRIM.box = { tris: box, c: [0, 0, 0] };
})();
function primCyl(seg, r0, r1) {
  const tris = [], y0 = -0.5, y1 = 0.5;
  for (let i = 0; i < seg; i++) {
    const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
    const b0 = [Math.cos(a0) * r0, y0, Math.sin(a0) * r0], b1 = [Math.cos(a1) * r0, y0, Math.sin(a1) * r0];
    const t0 = [Math.cos(a0) * r1, y1, Math.sin(a0) * r1], t1 = [Math.cos(a1) * r1, y1, Math.sin(a1) * r1];
    if (r1 > 0) { tris.push([b0, b1, t1], [b0, t1, t0]); tris.push([[0, y1, 0], t0, t1]); } else tris.push([b0, b1, [0, y1, 0]]);
    if (r0 > 0) tris.push([[0, y0, 0], b1, b0]);
  }
  return { tris, c: [0, r1 > 0 ? 0 : -0.25, 0] };
}
function primHemi(su, sv) {
  const tris = [], P = (u, v) => { const th = u / su * TAU, ph = v / sv * Math.PI * 0.5; return [Math.cos(th) * Math.sin(ph) * 0.5, Math.cos(ph) * 0.5, Math.sin(th) * Math.sin(ph) * 0.5]; };
  for (let v = 0; v < sv; v++) for (let u = 0; u < su; u++) { const a = P(u, v), b = P(u + 1, v), c = P(u + 1, v + 1), d = P(u, v + 1); if (v > 0) tris.push([a, b, c]); tris.push([a, c, d]); }
  for (let u = 0; u < su; u++) tris.push([[0, 0, 0], P(u + 1, sv), P(u, sv)]);
  return { tris, c: [0, 0.2, 0], smooth: true };
}
function primSphere(su, sv) {
  const tris = [], P = (u, v) => { const th = u / su * TAU, ph = v / sv * Math.PI; return [Math.cos(th) * Math.sin(ph) * 0.5, Math.cos(ph) * 0.5, Math.sin(th) * Math.sin(ph) * 0.5]; };
  for (let v = 0; v < sv; v++) for (let u = 0; u < su; u++) { const a = P(u, v), b = P(u + 1, v), c = P(u + 1, v + 1), d = P(u, v + 1); if (v > 0) tris.push([a, b, c]); if (v < sv - 1) tris.push([a, c, d]); }
  return { tris, c: [0, 0, 0], smooth: true };
}
PRIM.wedge = { tris: (() => { const A = [-0.5, 0, -0.5], B = [0.5, 0, -0.5], C = [0.5, 0, 0.5], D = [-0.5, 0, 0.5], E = [0.5, 1, 0.5], Fp = [-0.5, 1, 0.5]; return [[A, B, C], [A, C, D], [A, B, E], [A, E, Fp], [D, C, E], [D, E, Fp], [A, D, Fp], [B, C, E]]; })(), c: [0, 0.3, 0.2] };
PRIM.octa = { tris: (() => { const t = [0, 0.5, 0], b = [0, -0.5, 0], r = []; for (let i = 0; i < 6; i++) { const a0 = i / 6 * TAU, a1 = (i + 1) / 6 * TAU; const p0 = [Math.cos(a0) * 0.4, 0.15, Math.sin(a0) * 0.4], p1 = [Math.cos(a1) * 0.4, 0.15, Math.sin(a1) * 0.4]; r.push([t, p0, p1], [b, p0, p1]); } return r; })(), c: [0, 0, 0] };
const PC = new Map();
function prim(name, a, b, c) {
  const k = name + ':' + a + ':' + b + ':' + c; let p = PC.get(k); if (p) return p;
  if (name === 'cyl') p = primCyl(a || 12, b === undefined ? 0.5 : b, c === undefined ? 0.5 : c);
  else if (name === 'sph') p = primSphere(a || 12, b || 8);
  else if (name === 'hemi') p = primHemi(a || 12, b || 5);
  else p = PRIM[name];
  PC.set(k, p); return p;
}
class MB {
  constructor() { this.d = []; this.m = new Float32Array(16); this.base = M4.ident(); }
  /* o: {p:[x,y,z], r:[ry,rx,rz], s:[sx,sy,sz] | number, c:'#hex', flat:bool} */
  add(pr, o) {
    const s = o.s === undefined ? [1, 1, 1] : (typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s), p = o.p || [0, 0, 0], r = o.r || [0, 0, 0];
    const m = M4.trs(this.m, p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]); if (this.baseOn) M4.mul(m, this.base, m);
    const col = hex3(o.c || '#ff00ff'), smooth = pr.smooth && !o.flat;
    const T = v => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
    const N = v => { const x = v[0] / s[0], y = v[1] / s[1], z = v[2] / s[2]; const nx = m[0] / s[0] * x + m[4] / s[1] * y + m[8] / s[2] * z, ny = m[1] / s[0] * x + m[5] / s[1] * y + m[9] / s[2] * z, nz = m[2] / s[0] * x + m[6] / s[1] * y + m[10] / s[2] * z; const l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; };
    const ctr = T(pr.c);
    for (const t of pr.tris) {
      let a = T(t[0]), b = T(t[1]), c = T(t[2]);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue; nx /= l; ny /= l; nz /= l;
      const mx = (a[0] + b[0] + c[0]) / 3 - ctr[0], my = (a[1] + b[1] + c[1]) / 3 - ctr[1], mz = (a[2] + b[2] + c[2]) / 3 - ctr[2];
      let na, nb, nc, tt = t;
      if (nx * mx + ny * my + nz * mz < 0) { const q = b; b = c; c = q; nx = -nx; ny = -ny; nz = -nz; tt = [t[0], t[2], t[1]]; }
      if (smooth) { na = N(tt[0]); nb = N(tt[1]); nc = N(tt[2]); } else { na = nb = nc = [nx, ny, nz]; }
      this.d.push(a[0], a[1], a[2], na[0], na[1], na[2], col[0], col[1], col[2], b[0], b[1], b[2], nb[0], nb[1], nb[2], col[0], col[1], col[2], c[0], c[1], c[2], nc[0], nc[1], nc[2], col[0], col[1], col[2]);
    }
    return this;
  }
  box(o) { return this.add(prim('box'), o); }
  cyl(o, seg, r0, r1) { return this.add(prim('cyl', seg || 12, r0, r1), o); }
  sph(o, su, sv) { return this.add(prim('sph', su || 14, sv || 10), o); }
  cone(o, seg) { return this.add(prim('cyl', seg || 10, 0.5, 0), o); }
  hemi(o, su, sv) { return this.add(prim('hemi', su || 14, sv || 5), o); }
  wedge(o) { return this.add(prim('wedge'), o); }
  octa(o) { return this.add(prim('octa'), o); }
  push(px, py, pz, ry, rx, rz, sc) { M4.trs(this.base, px, py, pz, ry || 0, rx || 0, rz || 0, sc || 1); this.baseOn = true; return this; }
  pop() { this.baseOn = false; return this; }
  build() { const a = new Float32Array(this.d); return { data: a, count: a.length / 9, bufs: {} }; }
}

/* ---------- çizici ---------- */
const VS = `attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;
uniform mat4 uM;uniform mat4 uV;uniform mat4 uPr;uniform vec2 uBend;uniform vec3 uCam;uniform float uOut;
varying vec3 vC;varying vec3 vN;varying float vD;varying vec3 vW;
void main(){vec3 n=normalize((uM*vec4(aN,0.0)).xyz);vec4 w=uM*vec4(aP,1.0);w.xyz+=n*uOut;float dz=max(w.z-uCam.z,0.0);w.x+=uBend.x*dz*dz;w.y-=uBend.y*dz*dz;
vW=w.xyz;vN=n;vC=aC;vec4 v=uV*w;vD=-v.z;gl_Position=uPr*v;}`;
const FS = `precision mediump float;varying vec3 vC;varying vec3 vN;varying float vD;varying vec3 vW;
uniform vec3 uL;uniform vec3 uSky;uniform vec3 uGnd;uniform vec3 uFog;uniform vec3 uFogR;uniform vec3 uCamF;
uniform float uA;uniform vec4 uTint;uniform float uEmit;uniform float uOutF;uniform vec3 uOC;
void main(){vec3 base=mix(vC,uTint.rgb,uTint.a);vec3 c;
if(uOutF>0.0){c=uOC;}else{vec3 n=normalize(vN);float d=dot(n,uL);float t=d>0.55?1.0:(d>0.12?0.78:0.58);
vec3 amb=mix(uGnd,uSky,n.y*0.5+0.5);c=base*(amb*0.42+t*0.68);vec3 vv=normalize(uCamF-vW);float rim=pow(1.0-max(dot(n,vv),0.0),3.0);c+=rim*0.16*uSky;c=mix(c,base,uEmit);}
float f=clamp((vD-uFogR.x)/(uFogR.y-uFogR.x),0.0,1.0);c=mix(c,uFog,f);float a=uA*(1.0-smoothstep(uFogR.z,1.0,f));
gl_FragColor=vec4(c*a,a);}`;
const SVS = `attribute vec2 aQ;uniform vec3 uPos;uniform vec2 uSz;uniform mat4 uV;uniform mat4 uPr;uniform vec2 uBend;uniform vec3 uCam;uniform float uRot;
varying vec2 vU;varying float vD;void main(){vec3 p=uPos;float dz=max(p.z-uCam.z,0.0);p.x+=uBend.x*dz*dz;p.y-=uBend.y*dz*dz;vec4 v=uV*vec4(p,1.0);
float c=cos(uRot),s=sin(uRot);vec2 q=vec2(aQ.x*c-aQ.y*s,aQ.x*s+aQ.y*c);v.xy+=q*uSz;vD=-v.z;vU=aQ*vec2(0.5,-0.5)+0.5;gl_Position=uPr*v;}`;
const SFS = `precision mediump float;varying vec2 vU;varying float vD;uniform sampler2D uT;uniform vec4 uCol;uniform vec3 uFog;uniform vec3 uFogR;
void main(){vec4 t=texture2D(uT,vU)*uCol;float f=clamp((vD-uFogR.x)/(uFogR.y-uFogR.x),0.0,1.0);t.rgb=mix(t.rgb,uFog*t.a,f*0.7);t*=1.0-smoothstep(uFogR.z,1.0,f);gl_FragColor=t;}`;
let R3N = 0;
class R3 {
  constructor(canvas) {
    const opt = { alpha: true, antialias: true, premultipliedAlpha: true, depth: true };
    const gl = canvas.getContext('webgl', opt) || canvas.getContext('experimental-webgl', opt);
    if (!gl) throw new Error('webgl yok');
    this.gl = gl; this.cv = canvas; this.id = 'r' + (R3N++); this.texs = new Map();
    this.p = this.prog(VS, FS, ['aP', 'aN', 'aC'], ['uM', 'uV', 'uPr', 'uBend', 'uCam', 'uOut', 'uCamF', 'uOutF', 'uL', 'uSky', 'uGnd', 'uFog', 'uFogR', 'uA', 'uTint', 'uEmit', 'uOC']);
    this.s = this.prog(SVS, SFS, ['aQ'], ['uPos', 'uSz', 'uV', 'uPr', 'uBend', 'uCam', 'uRot', 'uT', 'uCol', 'uFog', 'uFogR']);
    this.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    this.V = M4.ident(); this.Pr = M4.ident(); this.M = M4.ident(); this.cam = [0, 0, 0]; this.bend = [0, 0];
    this.env = { L: [0.4, 0.8, -0.45], sky: [0.8, 0.9, 1], gnd: [0.45, 0.5, 0.4], fog: [0.8, 0.9, 1], fogR: [40, 110, 0.82], oc: hex3('#1d1442') };
    const l = Math.hypot(...this.env.L); this.env.L = this.env.L.map(v => v / l);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.frontFace(gl.CW); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.lost = false; canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; }); canvas.addEventListener('webglcontextrestored', () => location.reload());
  }
  prog(vs, fs, attrs, unis) {
    const gl = this.gl, sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const o = { p, a: {}, u: {} }; for (const a of attrs) o.a[a] = gl.getAttribLocation(p, a); for (const u of unis) o.u[u] = gl.getUniformLocation(p, u); return o;
  }
  size(w, h, dpr) { const W = Math.round(w * dpr), H = Math.round(h * dpr); if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; } this.gl.viewport(0, 0, W, H); }
  clear() { const gl = this.gl; gl.clearColor(0, 0, 0, 0); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); }
  camera(fovy, asp, ex, ey, ez, tx, ty, tz, near, far) { M4.persp(this.Pr, fovy, asp, near || 0.3, far || 200); M4.lookAt(this.V, ex, ey, ez, tx, ty, tz); this.cam[0] = ex; this.cam[1] = ey; this.cam[2] = ez; }
  begin() {
    const gl = this.gl, p = this.p, u = p.u, e = this.env; gl.useProgram(p.p);
    gl.uniformMatrix4fv(u.uV, false, this.V); gl.uniformMatrix4fv(u.uPr, false, this.Pr); gl.uniform2f(u.uBend, this.bend[0], this.bend[1]); gl.uniform3fv(u.uCam, this.cam); gl.uniform3fv(u.uCamF, this.cam);
    gl.uniform3fv(u.uL, e.L); gl.uniform3fv(u.uSky, e.sky); gl.uniform3fv(u.uGnd, e.gnd); gl.uniform3fv(u.uFog, e.fog); gl.uniform3fv(u.uFogR, e.fogR); gl.uniform3fv(u.uOC, e.oc);
    gl.enableVertexAttribArray(p.a.aP); gl.enableVertexAttribArray(p.a.aN); gl.enableVertexAttribArray(p.a.aC);
    this.mode = 'm'; this.lastBuf = null;
  }
  /* o: {a: alpha, tint:[r,g,b,amt], emit, out: kontur kalınlığı} */
  draw(mesh, m, o) {
    if (!mesh || !mesh.count) return;
    const gl = this.gl, p = this.p, u = p.u;
    if (this.mode !== 'm') this.begin();
    let b = mesh.bufs[this.id];
    if (!b) { b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW); mesh.bufs[this.id] = b; this.lastBuf = null; }
    if (this.lastBuf !== b) { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.vertexAttribPointer(p.a.aP, 3, gl.FLOAT, false, 36, 0); gl.vertexAttribPointer(p.a.aN, 3, gl.FLOAT, false, 36, 12); gl.vertexAttribPointer(p.a.aC, 3, gl.FLOAT, false, 36, 24); this.lastBuf = b; }
    gl.uniformMatrix4fv(u.uM, false, m);
    const a = o && o.a !== undefined ? o.a : 1, t = o && o.tint;
    gl.uniform1f(u.uA, a); gl.uniform4f(u.uTint, t ? t[0] : 0, t ? t[1] : 0, t ? t[2] : 0, t ? t[3] : 0); gl.uniform1f(u.uEmit, o && o.emit || 0);
    if (a < 1) { gl.enable(gl.BLEND); gl.depthMask(false); } else { gl.disable(gl.BLEND); gl.depthMask(true); }
    const out = o && o.out;
    if (out && a >= 1) { gl.cullFace(gl.FRONT); gl.uniform1f(u.uOut, out); gl.uniform1f(u.uOutF, 1); gl.drawArrays(gl.TRIANGLES, 0, mesh.count); }
    gl.cullFace(gl.BACK); gl.uniform1f(u.uOut, 0); gl.uniform1f(u.uOutF, 0); gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }
  tex(canvas) {
    let t = this.texs.get(canvas); if (t) return t; const gl = this.gl; t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.texs.set(canvas, t); return t;
  }
  sprites(list) {
    if (!list.length) return;
    const gl = this.gl, s = this.s, u = s.u, e = this.env;
    gl.disableVertexAttribArray(this.p.a.aN); gl.disableVertexAttribArray(this.p.a.aC);
    gl.useProgram(s.p); this.mode = 's'; this.lastBuf = null;
    gl.uniformMatrix4fv(u.uV, false, this.V); gl.uniformMatrix4fv(u.uPr, false, this.Pr); gl.uniform2f(u.uBend, this.bend[0], this.bend[1]); gl.uniform3fv(u.uCam, this.cam); gl.uniform3fv(u.uFog, e.fog); gl.uniform3fv(u.uFogR, e.fogR); gl.uniform1i(u.uT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); gl.enableVertexAttribArray(s.a.aQ); gl.vertexAttribPointer(s.a.aQ, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.depthMask(false); gl.disable(gl.CULL_FACE); gl.activeTexture(gl.TEXTURE0);
    let lastT = null;
    for (const q of list) { const t = this.tex(q.img); if (t !== lastT) { gl.bindTexture(gl.TEXTURE_2D, t); lastT = t; } gl.uniform3f(u.uPos, q.x, q.y, q.z); gl.uniform2f(u.uSz, q.w, q.h); gl.uniform1f(u.uRot, q.rot || 0); const a = q.a === undefined ? 1 : q.a, c = q.col || [1, 1, 1]; gl.uniform4f(u.uCol, c[0] * a, c[1] * a, c[2] * a, a); gl.drawArrays(gl.TRIANGLES, 0, 6); }
    gl.disableVertexAttribArray(s.a.aQ); gl.enable(gl.CULL_FACE); gl.depthMask(true);
  }
}
/* sprite dokuları */
const SPR = {};
function makeSprites() {
  const mk = (s, f) => { const c = document.createElement('canvas'); c.width = c.height = s; f(c.getContext('2d'), s); return c; };
  SPR.soft = mk(64, (c, s) => { const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); });
  SPR.dot = mk(32, (c, s) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 1, 0, TAU); c.fill(); });
  SPR.spark = mk(64, (c, s) => { c.fillStyle = '#fff'; const m = s / 2; c.beginPath(); c.moveTo(m, 2); c.quadraticCurveTo(m, m, s - 2, m); c.quadraticCurveTo(m, m, m, s - 2); c.quadraticCurveTo(m, m, 2, m); c.quadraticCurveTo(m, m, m, 2); c.fill(); });
  SPR.letters = {};
}
function letterSprite(ch) {
  if (SPR.letters[ch]) return SPR.letters[ch];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  if (ICON_BMP.star) x.drawImage(ICON_BMP.star, 0, 0, 128, 128);
  x.font = "900 50px 'Rubik',sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#1d1442'; x.strokeText(ch, 64, 72); x.fillStyle = '#fff'; x.fillText(ch, 64, 72);
  SPR.letters[ch] = c; return c;
}
