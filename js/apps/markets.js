/* Markets: Bloomberg-style intraday chart. The candles are a SIMULATED feed (random walk
   anchored to the real USD/COP close in content.js) and are always labeled as such.
   The side panel shows the real, fixed figures from DATA.markets. */
(() => {
const EOS = window.EOS, {D, $, esc, RM} = EOS;
const M = D.markets;
EOS.register('markets', {
  render: () => `<div class="wb"><div class="mkchart"><canvas data-bbg role="img" aria-label="Simulated USD/COP intraday candlestick chart. Not market data."></canvas></div>
    <aside class="mkside"><h5>WATCH · REAL</h5>
      <div><span>BanRep policy rate</span><b>${esc(M.banrep.label)}</b><em>${esc(M.banrep.note)}</em></div>
      <div><span>CPI YoY · DANE</span><b>${esc(M.cpi.label)}</b><em>${esc(M.cpi.note)}</em></div>
      <div><span>USD/COP close</span><b>${esc(M.usdcop.label)}</b><em>${esc(M.usdcop.note)}</em></div>
      <p>The chart is a simulated feed anchored to the ${esc(M.usdcop.short)} close. It is not market data.</p></aside></div>`,
  init(w){
    const cv = $('[data-bbg]', w), x = cv.getContext('2d');
    const ANCHOR = M.usdcop.value, N = 110, BAR_MS = 2400, TICK_MS = 200;
    const AMB = '#f2a24a', AMB_D = 'rgba(242,162,74,.55)', UP = '#e8c288', DN = '#b04a56', GRID = 'rgba(242,162,74,.08)', TXT = 'rgba(242,162,74,.85)', DIM = 'rgba(236,229,214,.45)';
    const rnd = Math.random;
    let W = 0, H = 0, dpr = 1, mouse = null, raf = 0;
    const bars = [];
    function mk(o){ let c = o, hi = o, lo = o; const v = o*0.0007; for (let k = 0; k < 8; k++){ c += (rnd()-.5)*v*1.8 + (ANCHOR-c)*.006; hi = Math.max(hi,c); lo = Math.min(lo,c); } return {o, c, hi, lo, vol:.25+rnd()*.9}; }
    let p = ANCHOR - 9; for (let i = 0; i < N; i++){ const b = mk(p); bars.push(b); p = b.c; }
    let live = {o:p, c:p, hi:p, lo:p, vol:.15}, lastBar = 0, lastTick = 0;
    function tick(now){
      if (now - lastTick > TICK_MS){ lastTick = now; const v = live.o*0.00028; live.c += (rnd()-.5)*v*2 + (ANCHOR-live.c)*.003; live.hi = Math.max(live.hi, live.c); live.lo = Math.min(live.lo, live.c); live.vol += rnd()*.05; }
      if (now - lastBar > BAR_MS){ lastBar = now; bars.push(live); bars.shift(); live = {o:live.c, c:live.c, hi:live.c, lo:live.c, vol:.12}; }
    }
    const fmt = v => v.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    const fT = new Intl.DateTimeFormat('en-US', {timeZone:'America/Bogota', hour:'2-digit', minute:'2-digit', hour12:false});
    function draw(){
      const r = {width:cv.clientWidth, height:cv.clientHeight}; dpr = Math.min(devicePixelRatio||1, 2);   /* layout size, unaffected by open/close transforms */
      if (!r.width) return;
      if (r.width !== W || r.height !== H){ W = r.width; H = r.height; cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); }
      x.setTransform(dpr,0,0,dpr,0,0); x.fillStyle = '#070605'; x.fillRect(0,0,W,H);
      const small = W < 560, padL = small ? 12 : 18, axisW = small ? 56 : 70;
      const top = 96, vBot = H - 30, cBot = vBot - Math.max(40, H*.16) - 10, vTop = cBot + 10;
      const all = [...bars, live], n = all.length;
      let lo = Infinity, hi = -Infinity; all.forEach(b => { lo = Math.min(lo, b.lo); hi = Math.max(hi, b.hi); });
      const pad = (hi-lo)*.12 || 1; lo -= pad; hi += pad;
      const X0 = padL, X1 = W - axisW, bw = (X1-X0)/n, Y = v => top + (1-(v-lo)/(hi-lo))*(cBot-top);
      x.font = `500 ${small?10:11}px "JetBrains Mono", monospace`; x.textBaseline = 'middle';
      /* grid + right axis */
      for (let k = 0; k <= 6; k++){ const v = lo + (hi-lo)*k/6, y = Y(v);
        x.strokeStyle = GRID; x.setLineDash([2,4]); x.beginPath(); x.moveTo(X0,y); x.lineTo(X1,y); x.stroke(); x.setLineDash([]);
        x.fillStyle = DIM; x.textAlign = 'left'; x.fillText(fmt(v), X1+8, y); }
      const now = new Date();
      x.textAlign = 'center';
      for (let i = n-1; i >= 0; i -= small ? 30 : 20){ const t = new Date(now - (n-1-i)*60000); x.fillStyle = DIM; x.fillText(fT.format(t), X0 + bw*i + bw/2, vBot + 16);
        x.strokeStyle = GRID; x.setLineDash([2,4]); x.beginPath(); x.moveTo(X0+bw*i+bw/2, top); x.lineTo(X0+bw*i+bw/2, vBot); x.stroke(); x.setLineDash([]); }
      /* moving averages */
      const cum = [0]; all.forEach((b,i) => cum.push(cum[i] + b.c));   /* prefix sums: each MA point is O(1) */
      const ma = (len, col) => { x.strokeStyle = col; x.lineWidth = 1.2; x.beginPath(); for (let i = 0; i < n; i++){ const k = Math.max(0, i-len+1), m = (cum[i+1]-cum[k])/(i+1-k); i ? x.lineTo(X0+bw*i+bw/2, Y(m)) : x.moveTo(X0+bw*i+bw/2, Y(m)); } x.stroke(); };
      ma(50, 'rgba(236,229,214,.25)'); ma(20, AMB_D);
      /* candles + volume */
      const vmax = Math.max(...all.map(b=>b.vol));
      all.forEach((b,i) => { const up = b.c >= b.o, cx = X0 + bw*i + bw/2, w = Math.max(1.5, bw*.62);
        x.strokeStyle = up ? UP : DN; x.fillStyle = up ? UP : DN; x.lineWidth = 1;
        x.beginPath(); x.moveTo(cx, Y(b.hi)); x.lineTo(cx, Y(b.lo)); x.stroke();
        const yt = Y(Math.max(b.o,b.c)), yb = Y(Math.min(b.o,b.c)), h = Math.max(1, yb-yt);
        up ? x.strokeRect(cx-w/2, yt, w, h) : x.fillRect(cx-w/2, yt, w, h);
        x.globalAlpha = .3; x.fillRect(cx-w/2, vBot - (b.vol/vmax)*(vBot-vTop), w, (b.vol/vmax)*(vBot-vTop)); x.globalAlpha = 1; });
      /* last price */
      const ly = Y(live.c);
      x.strokeStyle = AMB; x.setLineDash([4,3]); x.beginPath(); x.moveTo(X0, ly); x.lineTo(X1, ly); x.stroke(); x.setLineDash([]);
      x.fillStyle = AMB; x.fillRect(X1+2, ly-10, axisW-4, 20); x.fillStyle = '#070605'; x.textAlign = 'left'; x.font = `600 ${small?10:11}px "JetBrains Mono", monospace`; x.fillText(fmt(live.c), X1+7, ly);
      /* header */
      const first = all[0].o, chg = live.c - first, pct = chg/first*100, col = chg >= 0 ? UP : DN;
      x.textBaseline = 'alphabetic'; x.textAlign = 'left';
      x.font = `600 ${small?10:12}px "JetBrains Mono", monospace`;
      const fn = 'EL <GO>'; const fnw = x.measureText(fn).width + 14;
      x.fillStyle = AMB; x.fillRect(padL, 14, fnw, 20); x.fillStyle = '#070605'; x.fillText(fn, padL+7, 28);
      x.fillStyle = TXT; x.fillText(small ? 'USDCOP Curncy  GP' : 'USDCOP Curncy   GP   Intraday · 1 min', padL + fnw + 12, 28);
      x.textAlign = 'right'; x.fillStyle = 'rgba(224,110,122,.95)'; x.fillText(small ? 'SIMULATED' : 'SIMULATED FEED · NOT MARKET DATA', W - padL, 28);
      x.textAlign = 'left'; x.font = `500 ${small?24:32}px "JetBrains Mono", monospace`; x.fillStyle = '#ece5d6'; x.fillText(fmt(live.c), padL, 72);
      const pw = x.measureText(fmt(live.c)).width;
      x.font = `500 ${small?12:15}px "JetBrains Mono", monospace`; x.fillStyle = col; x.fillText(`${chg>=0?'+':''}${fmt(chg)}  ${chg>=0?'+':''}${pct.toFixed(2)}%`, padL + pw + 14, 72);
      if (!small){ x.fillStyle = DIM; x.font = '500 10.5px "JetBrains Mono", monospace';
        x.fillText(`H ${fmt(Math.max(...all.map(b=>b.hi)))}   L ${fmt(Math.min(...all.map(b=>b.lo)))}   MA20 ━  MA50 ━`, padL, 90); }
      /* crosshair */
      if (mouse && mouse.x > X0 && mouse.x < X1 && mouse.y > top && mouse.y < cBot){
        x.strokeStyle = 'rgba(242,162,74,.4)'; x.setLineDash([3,3]); x.beginPath(); x.moveTo(mouse.x, top); x.lineTo(mouse.x, vBot); x.moveTo(X0, mouse.y); x.lineTo(X1, mouse.y); x.stroke(); x.setLineDash([]);
        const v = lo + (1-(mouse.y-top)/(cBot-top))*(hi-lo); x.fillStyle = 'rgba(242,162,74,.9)'; x.fillRect(X1+2, mouse.y-10, axisW-4, 20);
        x.fillStyle = '#070605'; x.textBaseline = 'middle'; x.font = `600 ${small?10:11}px "JetBrains Mono", monospace`; x.fillText(fmt(v), X1+7, mouse.y); }
    }
    cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse = {x:e.clientX - r.left, y:e.clientY - r.top}; if (RM) draw(); });
    cv.addEventListener('pointerleave', () => { mouse = null; if (RM) draw(); });
    /* ~15 fps: a 66 ms timer advances the feed and asks for one frame; nothing runs while the
       window is hidden or minimized or the tab is in the background */
    let timer = 0;
    function step(){
      timer = 0;
      if (document.hidden || w.hidden) return;
      tick(performance.now());
      raf = requestAnimationFrame(() => { raf = 0; draw(); });
      timer = setTimeout(step, 66);
    }
    const resume = () => { if (RM) { requestAnimationFrame(draw); return; } if (!timer) step(); };
    w._stop = () => { clearTimeout(timer); cancelAnimationFrame(raf); timer = raf = 0; };
    w._resume = resume;
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !w.hidden) resume(); });
    resume();
  }
});
})();
