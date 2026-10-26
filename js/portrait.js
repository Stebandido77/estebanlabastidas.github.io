/* Portrait: words fly in, assemble into the face, then develop into the photo.
   Every unique glyph (per font and color) is pre-rendered once into an offscreen atlas and
   particles are blitted with drawImage, grouped into 8 alpha buckets so the context state
   changes 8 times per frame instead of once per particle. When the animation ends no rAF
   is left running.
   Luminance grid comes from assets/data/portrait-lum.bin (u16 width, u16 height, then bytes);
   over file:// fetch() is unavailable, so it falls back to portrait-lum.js. */
(() => {
const EOS = window.EOS, {RM} = EOS;
const WORDS = EOS.D.portraitWords, KEY = new Set(EOS.D.portraitKeyWords);

let lumP = null;
const loadLum = () => lumP || (lumP = fetch('assets/data/portrait-lum.bin').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => new Uint8Array(b))
  .catch(() => new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'assets/data/portrait-lum.js';
    s.onload = () => { const bin = atob(window.PORTRAIT_LUM); const u = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); res(u); };
    s.onerror = rej; document.head.appendChild(s); }))
  .then(u => ({GW:u[0]|(u[1]<<8), GH:u[2]|(u[3]<<8), LUM:u.subarray(4)})));
/* the Google Fonts sheet loads without blocking render; wait for it, then for both serif faces */
let fontP = null;
const fontsReady = () => fontP || (fontP = new Promise(res => {
  const go = () => Promise.all(['400 20px "Instrument Serif"', 'italic 400 20px "Instrument Serif"'].map(f => document.fonts.load(f))).then(res, res);
  const l = document.querySelector('link[href*="fonts.googleapis"]');
  if (!document.fonts || !l || l.rel === 'stylesheet') return document.fonts ? go() : res();
  l.addEventListener('load', go, {once: true}); l.addEventListener('error', res, {once: true}); setTimeout(go, 2500);
}));
let photoP = null;
const loadPhoto = () => photoP || (photoP = new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/img/portrait.jpg'; }));

EOS.portrait = cv => {
  let parts = [], W = 0, H = 0, t0 = 0, raf = 0, mode = 'anim', L = null, PHOTO = null, fonts = null, atlas = null, settled = null, idleDrawn = false;
  const BUCKETS = 8, bucket = Array.from({length: BUCKETS}, () => []);
  const ctx = cv.getContext('2d');
  function build(){
    W = cv.clientWidth; H = cv.clientHeight; if (!W || !L) return false;
    const {GW, GH, LUM} = L;
    const d = Math.min(devicePixelRatio||1, 2); cv.width = Math.round(W*d); cv.height = Math.round(H*d); ctx.setTransform(d,0,0,d,0,0);
    const s = Math.max(W/GW, H/GH), ox = (W-GW*s)/2, oy = (H-GH*s)/2;
    const rows = W < 260 ? 34 : 42, fs = H/rows; let wi = 0; parts = []; const cache = {};
    fonts = [`400 ${fs*1.02}px "Instrument Serif", Georgia, serif`, `italic 400 ${fs*1.02}px "Instrument Serif", Georgia, serif`];
    for (let row=0; row<rows; row++){
      let px = -((row*29)%50)*fs*.12; const py = row*fs;
      while (px < W){
        const word = WORDS[wi % WORDS.length]; wi++; const it = wi%2, key = KEY.has(word);
        ctx.font = fonts[it];
        for (const ch of word){
          const k = it+ch, cw = cache[k] || (cache[k] = ctx.measureText(ch).width);
          const gx = Math.floor((px+cw/2-ox)/s), gy = Math.floor((py+fs/2-oy)/s);
          if (gx>=0 && gy>=0 && gx<GW && gy<GH){
            const l = LUM[gy*GW+gx]/255;
            if (l > .05){ const a = Math.pow(l,1.2);
              parts.push({ch, f:it, tx:px, ty:py, a, amber: key && a>.25, am: it ? .8 : 1,
                sx: px + (Math.random()-.5)*W*1.8, sy: py + (Math.random()-.5)*H*1.4 - H*.2, dl: Math.random()*.55 + (py/H)*.45 }); }
          }
          px += cw;
        }
        px += fs*.38;
      }
    }
    settled = null; buildAtlas(d, fs); return true;
  }
  /* one cell per unique (font, color, char); g = {sx, sy, sw, sh} in device px, w/h in css px */
  function buildAtlas(d, fs){
    const glyphs = new Map(), pad = 2, ch = Math.ceil(fs*1.35) + pad*2, maxW = 1024;
    let x = 0, y = 0;
    for (const p of parts){
      const k = p.f + (p.amber ? 'a' : 'c') + p.ch;
      let g = glyphs.get(k);
      if (!g){ ctx.font = fonts[p.f]; const cw = Math.ceil(ctx.measureText(p.ch).width) + pad*2;
        if (x + cw > maxW){ x = 0; y += ch; }
        g = {x, y, w: cw, h: ch, f: p.f, amber: p.amber, ch: p.ch}; glyphs.set(k, g); x += cw; }
      p.g = g;
    }
    atlas = document.createElement('canvas'); atlas.width = Math.ceil(maxW*d); atlas.height = Math.ceil((y + ch)*d);
    const a = atlas.getContext('2d'); a.setTransform(d,0,0,d,0,0); a.textBaseline = 'top';
    for (const g of glyphs.values()){
      a.font = fonts[g.f]; a.fillStyle = g.amber ? 'rgb(199,154,94)' : 'rgb(236,229,214)'; a.fillText(g.ch, g.x + pad, g.y + pad);
      g.sx = g.x*d; g.sy = g.y*d; g.sw = g.w*d; g.sh = g.h*d; g.ox = pad;
    }
  }
  const ease = t => 1 - Math.pow(1-t, 3);
  const ARRIVED = 2.35;   /* max delay (.55 + .45) + 1.3 s flight: every particle is in place */
  function blit(target, list){
    for (let i = 0; i < BUCKETS; i++){ const b = list[i]; if (!b.length) continue;
      target.globalAlpha = (i + .5)/BUCKETS;
      for (let j = 0; j < b.length; j += 3){ const g = b[j]; target.drawImage(atlas, g.sx, g.sy, g.sw, g.sh, b[j+1] - g.ox, b[j+2] - g.ox, g.w, g.h); } }
    target.globalAlpha = 1;
  }
  const push = (p, x, y, al) => { if (al >= .02) bucket[Math.min(BUCKETS-1, (al*BUCKETS)|0)].push(p.g, x, y); };
  /* all particles at rest, full alpha, rendered once into an offscreen canvas */
  function renderSettled(){
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const x = c.getContext('2d'), d = cv.width / W; x.setTransform(d,0,0,d,0,0);
    for (const b of bucket) b.length = 0;
    for (const p of parts) push(p, p.tx, p.ty, p.a*p.am);
    blit(x, bucket); return c;
  }
  /* the end state, painted directly: only the photo (or only the words in "Show words").
     Called when the animation ends, when it is stopped, and by a timer, so it never depends
     on a last rAF that the browser may skip (scrolling on iOS, background tab, low power). */
  let safety = 0;
  function finish(){
    cancelAnimationFrame(raf); raf = 0; clearTimeout(safety);
    if (!L || !W || !atlas) return;
    ctx.globalAlpha = 1; ctx.fillStyle = '#0b0a08'; ctx.fillRect(0,0,W,H);
    if (mode !== 'words' && PHOTO){
      const iw = PHOTO.naturalWidth, ih = PHOTO.naturalHeight, cropH = iw*5/4, sy0 = (ih - cropH)*.15;
      ctx.drawImage(PHOTO, 0, sy0, iw, cropH, 0, 0, W, H);
    } else ctx.drawImage(settled || (settled = renderSettled()), 0, 0, W, H);
  }
  const arm = () => { clearTimeout(safety); safety = setTimeout(finish, (mode === 'words' ? 2400 : 4300) + 600); };
  function frame(now){
    if (!t0) t0 = now; let t = (now - t0)/1000;
    if (RM) t = 9;
    if (t > (mode === 'words' ? 2.4 : 4.3)) { finish(); return; }
    const dev = mode==='words' ? 0 : Math.max(0, Math.min(1, (t - 2.6)/1.5));   /* develop: a scanline reveals the photo */
    const done = mode==='words' ? t > 2.4 : t > 4.3;
    const next = () => { raf = (!done && !RM) ? requestAnimationFrame(frame) : 0; };
    const arrived = t >= ARRIVED;
    if (arrived && !dev && idleDrawn && !done){ next(); return; }   /* nothing moves until the scan starts */
    ctx.fillStyle = '#0b0a08'; ctx.fillRect(0,0,W,H);
    const scanY = ease(dev) * (H + 40) - 20;
    if (dev > 0 && PHOTO){
      const iw = PHOTO.naturalWidth, ih = PHOTO.naturalHeight, cropH = iw*5/4, sy0 = (ih - cropH)*.15;
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,Math.max(0,scanY)); ctx.clip();
      ctx.globalAlpha = Math.min(1, dev*1.6); ctx.drawImage(PHOTO, 0, sy0, iw, cropH, 0, 0, W, H); ctx.restore(); ctx.globalAlpha = 1;
    }
    if (dev < 1){
      for (const b of bucket) b.length = 0;
      if (arrived){
        settled = settled || renderSettled();
        for (const b of bucket) b.length = 0;
        const top = Math.max(0, scanY);
        if (dev > 0){ ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, H - top); ctx.clip(); }
        ctx.drawImage(settled, 0, 0, W, H);
        if (dev > 0){ ctx.restore();
          /* fade band above the scanline: parts are ordered by row, so scan just that slice */
          let lo = 0, hi = parts.length; while (lo < hi){ const m = (lo+hi) >> 1; if (parts[m].ty < scanY - 60) lo = m + 1; else hi = m; }
          for (let i = lo; i < parts.length && parts[i].ty < scanY; i++){ const p = parts[i]; push(p, p.tx, p.ty, p.a*p.am*(1 - (scanY - p.ty)/60)*.9); }
          blit(ctx, bucket); }
        idleDrawn = true;
      } else {
        for (const p of parts){
          const lt = Math.max(0, Math.min(1, (t - p.dl)/1.3));
          if (lt <= 0) continue;
          const e = ease(lt);
          push(p, p.sx + (p.tx - p.sx)*e, p.sy + (p.ty - p.sy)*e, p.a*p.am*Math.min(1, lt*1.8));
        }
        blit(ctx, bucket);
      }
    }
    if (dev > 0 && dev < 1){ ctx.fillStyle = 'rgba(232,194,136,.9)'; ctx.fillRect(0, scanY, W, 1.5); ctx.fillStyle='rgba(232,194,136,.12)'; ctx.fillRect(0, scanY-18, W, 18); }
    next();
  }
  function play(m){ cancelAnimationFrame(raf); raf = 0; mode = m||'anim'; t0 = 0; idleDrawn = false; if (build()) { raf = requestAnimationFrame(frame); arm(); } }
  function jumpTo(m){ mode = m; idleDrawn = false; if (build()) finish(); }
  Promise.all([loadLum(), loadPhoto(), fontsReady()])
    .then(([l, ph]) => { L = l; PHOTO = ph; setTimeout(() => play(), 240); })
    .catch(() => {});
  let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!raf && L) jumpTo(mode); }, 150); }).observe(cv);
  return {play, showPhoto: () => jumpTo('anim'), mode: () => mode, stop: finish};
};
})();
