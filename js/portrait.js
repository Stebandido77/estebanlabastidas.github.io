/* Portrait: words fly in, assemble into the face, then develop into the photo.
   Luminance grid comes from assets/data/portrait-lum.bin (u16 width, u16 height, then bytes);
   over file:// fetch() is unavailable, so it falls back to portrait-lum.js. */
(() => {
const EOS = window.EOS, {RM} = EOS;
const WORDS = ['Economist','Banker','Builder','M&A','Valuation','Grupo Aval','Strategy','Investor Relations','Inflation','Forecasting','Bayesian','TVP-BVAR-SV','Density','SA-CCR','Calypso','Derivatives','Capital markets','Uniandes','Javeriana','CMSA®','FMVA®','Python','R','VBA','LaTeX','Bogotá','Sekia','SSRN','Emerging markets','Writer','@Stbandido_','pulso','GEIH','andina','TES','Patrion','JPMorgan','Management Solutions','Models','Markets','Spatial','Econometrics','Colombia','DCF','WACC','Comps','Board','Curves','Ceteris Paribus','Saber 11'];
const KEY = new Set(['Economist','Banker','Builder','M&A','Valuation','Inflation']);

let lumP = null;
const loadLum = () => lumP || (lumP = fetch('assets/data/portrait-lum.bin').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => new Uint8Array(b))
  .catch(() => new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'assets/data/portrait-lum.js';
    s.onload = () => { const bin = atob(window.PORTRAIT_LUM); const u = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); res(u); };
    s.onerror = rej; document.head.appendChild(s); }))
  .then(u => ({GW:u[0]|(u[1]<<8), GH:u[2]|(u[3]<<8), LUM:u.subarray(4)})));
let photoP = null;
const loadPhoto = () => photoP || (photoP = new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/img/portrait.jpg'; }));

EOS.portrait = cv => {
  let parts = [], W = 0, H = 0, t0 = 0, raf = 0, mode = 'anim', L = null, PHOTO = null, fonts = null;
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
              parts.push({ch, f:it, tx:px, ty:py, a,
                col: key && a>.25 ? [199,154,94] : [236,229,214], am: it ? .8 : 1,
                sx: px + (Math.random()-.5)*W*1.8, sy: py + (Math.random()-.5)*H*1.4 - H*.2, dl: Math.random()*.55 + (py/H)*.45 }); }
          }
          px += cw;
        }
        px += fs*.38;
      }
    }
    parts.sort((a,b)=>a.f-b.f); ctx.textBaseline = 'top'; return true;
  }
  const ease = t => 1 - Math.pow(1-t, 3);
  function frame(now){
    if (!t0) t0 = now; let t = (now - t0)/1000;
    if (RM) t = 9;
    ctx.clearRect(0,0,W,H); ctx.fillStyle = '#0b0a08'; ctx.fillRect(0,0,W,H);
    /* develop: scanline from top reveals the photo */
    const dev = mode==='words' ? 0 : Math.max(0, Math.min(1, (t - 2.6)/1.5));
    const scanY = ease(dev) * (H + 40) - 20;
    if (dev > 0 && PHOTO){
      const iw = PHOTO.naturalWidth, ih = PHOTO.naturalHeight, cropH = iw*5/4, sy0 = (ih - cropH)*.15;
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,Math.max(0,scanY)); ctx.clip();
      ctx.globalAlpha = Math.min(1, dev*1.6); ctx.drawImage(PHOTO, 0, sy0, iw, cropH, 0, 0, W, H); ctx.restore(); ctx.globalAlpha = 1;
    }
    let f = -1;
    if (dev < 1) for (const p of parts){
      const lt = Math.max(0, Math.min(1, (t - p.dl)/1.3)), e = ease(lt);
      if (lt <= 0) continue;
      const x = p.sx + (p.tx - p.sx)*e, y = p.sy + (p.ty - p.sy)*e;
      let al = p.a*p.am*Math.min(1, lt*1.8);
      if (dev > 0 && y < scanY) al *= Math.max(0, 1 - (scanY - y)/60) * .9;
      if (al < .02) continue;
      if (p.f !== f){ ctx.font = fonts[p.f]; f = p.f; }
      ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${al})`;
      ctx.fillText(p.ch, x, y);
    }
    if (dev > 0 && dev < 1){ ctx.fillStyle = 'rgba(232,194,136,.9)'; ctx.fillRect(0, scanY, W, 1.5); ctx.fillStyle='rgba(232,194,136,.12)'; ctx.fillRect(0, scanY-18, W, 18); }
    const done = mode==='words' ? t > 2.4 : t > 4.3;
    if (!done && !RM) raf = requestAnimationFrame(frame); else raf = 0;
  }
  function play(m){ cancelAnimationFrame(raf); raf = 0; mode = m||'anim'; t0 = 0; if (build()) raf = requestAnimationFrame(frame); }
  function jumpTo(m){ cancelAnimationFrame(raf); mode = m; build(); t0 = performance.now() - (m==='words'?2400:4300); raf = requestAnimationFrame(frame); }
  Promise.all([loadLum(), loadPhoto(), document.fonts ? document.fonts.ready : null])
    .then(([l, ph]) => { L = l; PHOTO = ph; setTimeout(() => play(), 240); })
    .catch(() => {});
  let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!raf && L) jumpTo(mode); }, 150); }).observe(cv);
  return {play, showPhoto: () => jumpTo('anim'), mode: () => mode, stop: () => { cancelAnimationFrame(raf); raf = 0; }};
};
})();
