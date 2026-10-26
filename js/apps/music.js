/* Music: mini player with a generative cover — the inflation curve from the wallpaper,
   breathing with the music through the AnalyserNode. The cover animates only while the
   window is visible and music is playing; otherwise it draws one still frame. */
(() => {
const EOS = window.EOS, {$, esc, RM} = EOS;
/* the inflation curve from the original wallpaper, in a 780×320 box */
const CURVE = [[0,248],[40,250],[80,258],[111,265],[160,260],[200,220],[240,140],[265,90],[290,70],[320,80],[360,125],[400,160],[430,175],[460,192],[490,200],[520,205],[555,207],[600,208],[630,209],[666,210],[722,222],[779,237]];
EOS.register('music', {
  render: () => `<div class="mus">
    <div class="mus-cover"><canvas data-cover role="img" aria-label="Generative cover: the inflation curve moving with the music"></canvas></div>
    <div class="mus-meta"><b data-title></b><small data-credit></small></div>
    <div class="mus-ctl">
      <button class="btn" data-next aria-label="Next track">⏭</button>
      <button class="btn pri mus-play" data-play aria-label="Play"></button>
      <label class="mus-vol"><span class="sr">Volume</span><input type="range" min="0" max="100" data-vol></label>
    </div>
    <p class="mus-note">Ambient generated live in your browser with the Web Audio API. Nothing plays until you press play.</p>
  </div>`,
  init(w){
    const A = EOS.audio, cv = $('[data-cover]', w), x = cv.getContext('2d'), vol = $('[data-vol]', w), pb = $('[data-play]', w);
    let raf = 0, buf = null, phase = 0;
    const ui = () => { $('[data-title]', w).textContent = A.title; $('[data-credit]', w).textContent = A.credit;
      pb.textContent = A.playing ? '❚❚ Pause' : '▶ Play'; pb.setAttribute('aria-label', A.playing ? 'Pause' : 'Play'); vol.value = Math.round(A.volume*100);
      if (A.playing) start(); else { stop(); draw(0); } };
    function draw(energy){
      const W = cv.clientWidth, H = cv.clientHeight, d = Math.min(devicePixelRatio || 1, 2); if (!W) return;
      if (cv.width !== Math.round(W*d)) { cv.width = Math.round(W*d); cv.height = Math.round(H*d); }
      x.setTransform(d,0,0,d,0,0);
      const g = x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#2a0f14'); g.addColorStop(1,'#1a140c'); x.fillStyle = g; x.fillRect(0,0,W,H);
      x.strokeStyle = 'rgba(232,194,136,.08)'; x.lineWidth = 1;
      for (let i = 1; i < 8; i++){ x.beginPath(); x.moveTo(0, H*i/8); x.lineTo(W, H*i/8); x.stroke(); }
      const sx = W/780, sy = H/320*.9;
      for (let k = 3; k >= 0; k--){   /* echoes behind the main line */
        x.beginPath();
        CURVE.forEach(([cx, cy], i) => { const wob = Math.sin(phase*1.3 + i*.7 + k) * energy * 26 * (1 + k*.4);
          const px = cx*sx, py = (cy + wob)*sy + H*.06 + k*6*energy; i ? x.lineTo(px, py) : x.moveTo(px, py); });
        x.strokeStyle = k ? `rgba(199,154,94,${.12 - k*.025})` : '#e8c288'; x.lineWidth = k ? 1 : 2; x.stroke();
      }
      x.fillStyle = 'rgba(236,229,214,.85)'; x.font = 'italic 400 22px "Instrument Serif", Georgia, serif'; x.fillText('estebanOS', 16, H - 18);
      x.fillStyle = 'rgba(232,194,136,.8)'; x.font = '500 10px "JetBrains Mono", monospace'; x.fillText('INFLATION · LIVE MIX', 16, 24);
    }
    function loop(){
      raf = 0;
      if (w.hidden || document.hidden || !A.playing) return;
      let e = 0; const an = A.analyser;
      if (an){ buf = buf || new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(buf); for (let i = 0; i < 24; i++) e += buf[i]; e = e / (24*255); }
      phase += .03 + e*.08; draw(Math.min(1, e*1.8));
      raf = requestAnimationFrame(loop);
    }
    const start = () => { if (!raf && !RM) raf = requestAnimationFrame(loop); else if (RM) draw(.3); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    pb.onclick = () => A.toggle();
    $('[data-next]', w).onclick = () => A.next();
    vol.oninput = () => A.setVolume(vol.value/100);
    const unsub = A.subscribe(ui);
    w._stop = stop; w._resume = ui;
    new ResizeObserver(() => { if (!raf) draw(0); }).observe(cv);
    ui();
    w._unsub = unsub;
  }
});
})();
