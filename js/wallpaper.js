/* Wallpaper: Bogotá in black & white.
   The licensed photo (assets/img/wallpaper-*.webp) fades in over a procedural skyline,
   which stays as the fallback while it loads or if it fails. Film grain is a 160 px noise
   tile on its own layer, nudged with a transform every ~120 ms (compositor only). */
(() => {
const EOS = window.EOS, {RM, $} = EOS;
const cv = $('#city'), img = $('#wallimg'), grainEl = $('#grain');
let photoOk = false;

/* ── procedural skyline (ported from the reference) ── */
function renderCity(){
  const x = cv.getContext('2d');
  const R = (s => () => (s = (s*16807) % 2147483647) / 2147483647)(42);
  const nz = (() => { const p = Array.from({length:256}, R); return v => { const i = Math.floor(v), f = v - i, u = f*f*(3-2*f); return p[i & 255]*(1-u) + p[(i+1) & 255]*u; }; })();
  const ridge = v => nz(v)*.55 + nz(v*2.3+7)*.28 + nz(v*5.1+3)*.12 + nz(v*11+1)*.05;
  const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
  cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
  const b = x; b.setTransform(dpr,0,0,dpr,0,0);
  const hz = H*.76;                                             /* horizon (city base) */
  /* sky */
  const sky = b.createLinearGradient(0,0,0,hz);
  sky.addColorStop(0,'#141414'); sky.addColorStop(.5,'#5a5a5a'); sky.addColorStop(1,'#c4c4c4');
  b.fillStyle = sky; b.fillRect(0,0,W,H);
  /* soft clouds */
  for (let i = 0; i < 26; i++){ const cx = R()*W, cy = R()*hz*.55, rr = 80 + R()*260;
    const g = b.createRadialGradient(cx,cy,0,cx,cy,rr); g.addColorStop(0,`rgba(210,210,210,${.05+R()*.07})`); g.addColorStop(1,'rgba(210,210,210,0)');
    b.fillStyle = g; b.beginPath(); b.ellipse(cx,cy,rr*1.8,rr*.5,0,0,7); b.fill(); }
  /* Cerros Orientales — far ridge, near ridge with Monserrate */
  const mont = (yb, amp, sc, off, col) => { b.fillStyle = col; b.beginPath(); b.moveTo(0,H);
    for (let px = 0; px <= W; px += 3){ const u = px/W; const y = yb - ridge(u*sc+off)*amp - Math.exp(-(((u-.66)/.09)**2))*amp*.55; b.lineTo(px,y); }
    b.lineTo(W,H); b.closePath(); b.fill(); };
  mont(hz-H*.10, H*.20, 3.2, 11, '#4d4d4d');
  mont(hz-H*.04, H*.22, 4.1, 3, '#2f2f2f');
  /* Monserrate sanctuary on the peak */
  const mx = W*.66, my = hz - H*.04 - ridge(.66*4.1+3)*H*.22 - H*.22*.55 - 2;
  b.fillStyle = '#d8d8d8'; b.fillRect(mx-7, my-9, 14, 9); b.fillRect(mx-2, my-17, 4, 8); b.fillRect(mx+5, my-14, 3, 5);
  /* haze between mountain and city */
  const hzG = b.createLinearGradient(0,hz-H*.12,0,hz); hzG.addColorStop(0,'rgba(150,150,150,0)'); hzG.addColorStop(1,'rgba(170,170,170,.35)');
  b.fillStyle = hzG; b.fillRect(0,hz-H*.12,W,H*.12);
  /* skyline */
  const lights = [];
  const bldg = (x0, w, h, shade, crown) => { const y0 = hz - h; b.fillStyle = shade; b.fillRect(x0, y0, w, h + H);
    if (crown === 'bacata'){ b.beginPath(); b.moveTo(x0, y0); b.lineTo(x0+w*.55, y0-h*.10); b.lineTo(x0+w, y0); b.fill(); }
    if (crown === 'colpatria'){ b.fillRect(x0+w*.18, y0-h*.05, w*.64, h*.05); b.fillRect(x0+w*.45, y0-h*.12, w*.1, h*.07); }
    for (let yy = y0+6; yy < hz-4; yy += 7) for (let xx = x0+3; xx < x0+w-3; xx += 6) if (R() < .22) lights.push([xx,yy]); };
  /* back row */
  for (let px = -20; px < W; ){ const w = 18 + R()*46, h = H*(.04 + R()*.10); bldg(px, w, h, '#232323'); px += w + R()*6; }
  /* landmarks: BD Bacatá, Torre Colpatria, Atrio */
  bldg(W*.42, W*.026, H*.34, '#161616', 'bacata');
  bldg(W*.50, W*.034, H*.30, '#191919', 'colpatria');
  bldg(W*.56, W*.022, H*.24, '#181818'); bldg(W*.585, W*.018, H*.20, '#1c1c1c');
  /* front row */
  for (let px = -20; px < W; ){ const w = 24 + R()*70, h = H*(.02 + R()*.08); bldg(px, w, h, '#0f0f0f'); px += w + R()*4; }
  b.fillStyle = 'rgba(235,235,235,.55)'; lights.forEach(([lx,ly]) => b.fillRect(lx, ly, 2, 2));
  /* ground + vignette */
  b.fillStyle = '#0b0b0b'; b.fillRect(0,hz,W,H-hz);
  const v = b.createRadialGradient(W/2,H*.45,Math.min(W,H)*.3,W/2,H*.45,Math.max(W,H)*.8);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.6)'); b.fillStyle = v; b.fillRect(0,0,W,H);
}

/* ── photo ── */
/* the procedural skyline is drawn only if the photo fails or is still loading once the desktop
   is visible (after the login), so it never competes with the first paint */
let drawn = false;
const city = () => { if (photoOk || drawn) return; drawn = true; renderCity(); };
const showPhoto = () => { photoOk = true; img.classList.add('on'); setTimeout(() => { cv.hidden = true; cv.width = cv.height = 0; }, 450); };
const whenVisible = fn => EOS.locked ? document.addEventListener('eos:unlock', fn, {once:true}) : fn();
/* the photo is requested here, not by the parser: behind the login it starts 800 ms after the
   page's load event (or when the user enters, if sooner) so it never competes with the first
   paint; on an open desktop it starts now */
img.addEventListener('load', showPhoto, {once:true});
img.addEventListener('error', () => { img.remove(); whenVisible(city); }, {once:true});
let requested = false;
const request = () => { if (requested) return; requested = true; img.srcset = img.dataset.srcset; img.src = img.dataset.src; };
if (EOS.locked) {
  document.addEventListener('eos:unlock', request, {once:true});
  const later = () => setTimeout(request, 800);
  document.readyState === 'complete' ? later() : addEventListener('load', later, {once:true});
} else request();
whenVisible(() => setTimeout(city, 400));
let rt; addEventListener('resize', () => { if (photoOk || !drawn) return; clearTimeout(rt); rt = setTimeout(renderCity, 150); });

/* ── film grain: built in idle time once the desktop is visible ── */
whenVisible(() => (window.requestIdleCallback || (f => setTimeout(f, 200)))(() => {
  const g = document.createElement('canvas'); g.width = g.height = 160;
  const gx = g.getContext('2d'), id = gx.createImageData(160,160), px = new Uint32Array(id.data.buffer);
  for (let i = 0; i < px.length; i++){ const v = (Math.random()*256)|0; px[i] = (16 << 24) | (v << 16) | (v << 8) | v; }   /* gray, alpha 16 */
  gx.putImageData(id,0,0);
  grainEl.style.backgroundImage = `url(${g.toDataURL()})`;
  if (!RM) setInterval(() => { if (!document.hidden) grainEl.style.transform = `translate3d(${(Math.random()*160)|0}px,${(Math.random()*160)|0}px,0)`; }, 120);
}));
})();
