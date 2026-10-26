/* Login screen: macOS-style, over generative contours of the Andes.
   Value-noise fbm + a N–S cordillera ridge + the sabana basin, drawn with marching squares.
   Shown once per session (sessionStorage); "Lock Screen ⌃⌘Q" brings it back.
   When the user enters, the login fades out, the desktop opens behind it, and the node
   and its rAF are removed. */
(() => {
const EOS = window.EOS, {RM, $, phone} = EOS;
const KEY = 'eos.unlocked';
const template = $('#lock').cloneNode(true);
let lock = null, topo = null, tx = null, raf = 0, clockTimer = 0, locked = false;

/* ── noise field ── */
const PERM = new Uint8Array(512);
(() => { const p = [...Array(256).keys()]; let sd = 7; for (let i = 255; i > 0; i--) { sd = (sd*16807) % 2147483647; const j = sd % (i+1); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]; })();
const fade = t => t*t*(3-2*t);
const vn = (x, y) => { const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y);
  const a = PERM[PERM[xi]+yi]/255, b = PERM[PERM[xi+1]+yi]/255, c = PERM[PERM[xi]+yi+1]/255, d = PERM[PERM[xi+1]+yi+1]/255, u = fade(xf), v = fade(yf);
  return a + (b-a)*u + (c-a)*v + (a-b-c+d)*u*v; };
const noise = (x, y, t) => (vn(x+t*.05, y)*.55 + vn(x*2.1 - t*.03 + 11, y*2.1 + 7)*.28 + vn(x*4.3 + 3, y*4.3 - t*.04)*.17) * 0.85;
const ridge = (x, y) => Math.exp(-Math.pow((x - 1.8 - y*0.35)*1.2, 2)) * .32;   /* a cordillera running N–S */

/* ── contours ── */
const tm = {x:-1e4, y:-1e4};
let tW = 0, tH = 0, coarse = false, frameMs = 0, F = null, SB = null, sbKey = '';
function drawTopo(now){
  const r = topo.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  if (r.width !== tW || r.height !== tH) { tW = r.width; tH = r.height; topo.width = Math.round(tW*dpr); topo.height = Math.round(tH*dpr); }
  tx.setTransform(dpr,0,0,dpr,0,0); tx.clearRect(0,0,tW,tH);
  const narrow = tW < 900, cs = coarse ? 14 : narrow ? 9 : 11;
  const cols = Math.ceil(tW/cs)+1, rows = Math.ceil(tH/cs)+1, sc = 3.6/Math.max(tW,tH), t = RM ? 0 : now/1000;
  const bx = tW*(narrow?0.28:0.62), by = tH*(narrow?0.56:0.6);                                   /* Bogotá marker */
  if (!F || F.length !== cols*rows) F = new Float32Array(cols*rows);
  const key = `${cols}x${rows}x${cs}x${tW}x${tH}`;
  if (key !== sbKey) {   /* static terms, once per size: the cordillera and the sabana (a high, flat basin) */
    sbKey = key; SB = new Float32Array(cols*rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const X = i*cs, Y = j*cs;
      SB[j*cols+i] = ridge(X*sc, Y*sc) - Math.exp(-((X-bx)**2 + (Y-by)**2)/14000) * .10; }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const X = i*cs, Y = j*cs, dx = X - tm.x, dy = Y - tm.y, d2 = dx*dx + dy*dy;
    F[j*cols+i] = noise(X*sc, Y*sc, t) + SB[j*cols+i] + (d2 < 65000 ? Math.exp(-d2/9000) * .22 : 0);   /* the cursor lifts the terrain */
  }
  const L = 18;
  for (let k = 1; k < L; k++) {
    const lv = 0.12 + k*(0.9/L), major = k % 5 === 0;
    tx.beginPath();
    for (let j = 0; j < rows-1; j++) for (let i = 0; i < cols-1; i++) {
      const a = F[j*cols+i], b = F[j*cols+i+1], c = F[(j+1)*cols+i+1], d = F[(j+1)*cols+i];
      const id = (a>lv?8:0)|(b>lv?4:0)|(c>lv?2:0)|(d>lv?1:0); if (id === 0 || id === 15) continue;
      const x = i*cs, y = j*cs, lp = (p,q) => (lv-p)/((q-p) || 1e-6);
      const T = [x+cs*lp(a,b), y], Rt = [x+cs, y+cs*lp(b,c)], B = [x+cs*lp(d,c), y+cs], Lf = [x, y+cs*lp(a,d)];
      const seg = (p,q) => { tx.moveTo(p[0],p[1]); tx.lineTo(q[0],q[1]); };
      switch (id) {
        case 1: case 14: seg(Lf,B); break;  case 2: case 13: seg(B,Rt); break;
        case 3: case 12: seg(Lf,Rt); break; case 4: case 11: seg(T,Rt); break;
        case 5: seg(Lf,T); seg(B,Rt); break; case 6: case 9: seg(T,B); break;
        case 7: case 8: seg(Lf,T); break;    case 10: seg(T,Rt); seg(Lf,B); break;
      }
    }
    const h = k/L;
    tx.strokeStyle = major ? `rgba(232,194,136,${.35+.4*h})` : `rgba(199,154,94,${.08+.22*h})`;
    tx.lineWidth = major ? 1.1 : .7; tx.stroke();
  }
  const m = $('#lkmark', lock); m.style.left = bx+'px'; m.style.top = by+'px';
}

/* ── loop: adapts on phones that cannot hold 50 fps (coarser grid, 30 fps) ── */
let last = 0, probe = [];
function loop(now){
  if (!locked) return;
  raf = requestAnimationFrame(loop);
  if (frameMs && now - last < frameMs) return;
  if (last && probe.length < 45) { probe.push(now - last); if (probe.length === 45 && phone()) {
    const avg = probe.reduce((a,b) => a+b, 0) / probe.length;
    if (avg > 20) { coarse = true; frameMs = 33; } } }
  last = now; drawTopo(now);
}
let rmPending = false;
const redrawOnce = () => { if (rmPending) return; rmPending = true; requestAnimationFrame(() => { rmPending = false; if (locked) drawTopo(0); }); };

/* ── clock ── */
const fLD = new Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',weekday:'long',month:'long',day:'numeric'});
const lkTick = () => { const n = new Date(); $('#lkdate', lock).textContent = fLD.format(n); $('#lktime', lock).textContent = EOS.fH.format(n).replace(/^24/,'00'); };

/* ── lock / unlock ── */
function mount(){
  locked = true; EOS.locked = true;
  topo = $('#topo', lock); tx = topo.getContext('2d'); tW = tH = 0; last = 0; probe = [];
  lkTick(); clockTimer = setInterval(lkTick, 10000);
  lock.addEventListener('pointermove', e => { tm.x = e.clientX; tm.y = e.clientY; if (RM) redrawOnce(); });
  lock.addEventListener('pointerleave', () => { tm.x = tm.y = -1e4; if (RM) redrawOnce(); });
  lock.addEventListener('pointerdown', e => { if (!e.target.closest('.lk-login')) setTimeout(() => $('#lkpw', lock).focus({preventScroll:true}), 0); });
  $('#lklogin', lock).addEventListener('submit', e => { e.preventDefault(); unlock(); });
  if (RM) redrawOnce(); else raf = requestAnimationFrame(loop);
  setTimeout(() => lock && $('#lkpw', lock).focus({preventScroll:true}), 300);
}
function unlock(){
  if (!locked) return; locked = false; EOS.locked = false;
  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  const el = lock;
  el.classList.add('up');
  document.dispatchEvent(new CustomEvent('eos:unlock'));
  setTimeout(() => { if (!Object.keys(EOS.wins).length) EOS.enter(); }, RM ? 0 : 280);
  setTimeout(() => { cancelAnimationFrame(raf); raf = 0; clearInterval(clockTimer); el.remove(); if (lock === el) lock = null; }, RM ? 0 : 850);
}
function relock(){
  if (locked) return;
  try { sessionStorage.removeItem(KEY); } catch (e) {}
  document.documentElement.classList.remove('unlocked');
  if (lock) lock.remove();
  lock = template.cloneNode(true);
  document.body.insertBefore(lock, $('.menubar'));
  mount();
}
EOS.unlock = unlock; EOS.lock = relock;

document.addEventListener('keydown', e => {
  if (locked) {
    if (e.key === 'Enter' && !e.target.closest('.lk-login')) { e.preventDefault(); unlock(); }
    if (e.key === 'Tab') {   /* keep focus inside the login */
      const f = [$('#lkpw', lock), $('.lk-pw button', lock)], i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? f.length-1 : 1)) % f.length].focus();
    }
    return;
  }
  if (e.ctrlKey && e.metaKey && (e.key === 'q' || e.key === 'Q')) { e.preventDefault(); relock(); }
});
document.addEventListener('click', e => { if (e.target.closest('[data-lock]')) { EOS.closeMenus(); relock(); } });

if (document.documentElement.classList.contains('unlocked')) { $('#lock').remove(); EOS.locked = false; }
else { lock = $('#lock'); mount(); }
})();
