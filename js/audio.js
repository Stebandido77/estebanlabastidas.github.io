/* Background music (§5). Nothing plays without a click or key press.
   A. Generative (default): ambient lo-fi built with the Web Audio API — a detuned sine/triangle
      pad on a slow minor-9 progression through a soft low-pass, a faint pink-noise vinyl pulse,
      occasional pentatonic "piano" notes, and a convolution reverb with a generated impulse.
   B. Files (optional): if DATA.music.playlist points to a playlist.json with .mp3 tracks,
      <audio> elements play them with a 3 s crossfade.
   Master never exceeds -18 dB; 2 s fade in, 1 s fade out; fades to silence while the tab is hidden.
   UI: speaker in the menubar, the Music app, the ♪ toggle on the login, and `music` in Terminal. */
(() => {
const EOS = window.EOS, {D, $} = EOS;
const KEY = 'eos.music', MAX = Math.pow(10, -18/20);   /* -18 dB */
const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

/* generative "tracks": a progression (four-voice chords, MIDI) and a pentatonic for the piano */
const PRESETS = [
  {title: 'Sabana at dusk',      chords: [[50,53,60,64], [46,53,57,62], [43,50,57,58], [45,52,55,60]], penta: [62,65,67,69,72,74,77]},   /* Dm9 · B♭maj7 · Gm9 · Am7 */
  {title: 'Cordillera, 2,640 m', chords: [[41,48,52,55], [48,52,55,59], [50,53,57,60], [46,50,53,60]], penta: [60,62,65,67,69,72,74]},   /* Fmaj9 · Cmaj7 · Dm7 · B♭add9 */
  {title: 'Monserrate, 6 a.m.',  chords: [[43,50,53,57], [39,46,50,55], [46,50,53,57], [41,48,53,57]], penta: [62,65,67,70,72,74,77]},   /* Gm9 · E♭maj7 · B♭ · F */
];

let ctx = null, master = null, analyser = null, padBus = null, padFilter = null, wet = null, voices = [], noiseGain = null;
let playing = false, armed = false, vol = Number(store.get(KEY + '.vol') || 0.8), preset = 0, chordIx = 0, chordT = 0, noteT = 0;
let files = null, fileIx = 0, audios = [], fileGains = [];
const subs = new Set(), emit = () => subs.forEach(f => f());

function impulse(c, seconds, decay){
  const len = Math.round(c.sampleRate * seconds), b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, decay); }
  return b;
}
function pinkNoise(c, seconds){
  const len = Math.round(c.sampleRate * seconds), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
  for (let i = 0; i < len; i++){ const w = Math.random()*2 - 1;   /* Paul Kellet's pink filter */
    b0 = .99886*b0 + w*.0555179; b1 = .99332*b1 + w*.0750759; b2 = .96900*b2 + w*.1538520; b3 = .86650*b3 + w*.3104856;
    b4 = .55000*b4 + w*.5329522; b5 = -.7616*b5 - w*.0168980; d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*.5362) * .11; b6 = w*.115926;
    if (Math.random() < .00004) d[i] += (Math.random() < .5 ? -1 : 1) * .6;   /* sparse vinyl crackle */ }
  return b;
}

function build(){
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0;
  analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .82;
  master.connect(analyser); analyser.connect(ctx.destination);
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, 3.2, 2.6);
  wet = ctx.createGain(); wet.gain.value = .38; wet.connect(verb); verb.connect(master);
  /* pad */
  padBus = ctx.createGain(); padBus.gain.value = .5;
  padFilter = ctx.createBiquadFilter(); padFilter.type = 'lowpass'; padFilter.frequency.value = 900; padFilter.Q.value = .4;
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .05; lfoG.gain.value = 260; lfo.connect(lfoG); lfoG.connect(padFilter.frequency); lfo.start();
  padBus.connect(padFilter); padFilter.connect(master); padFilter.connect(wet);
  voices = [0,1,2,3].map(i => { const g = ctx.createGain(); g.gain.value = .11; g.connect(padBus);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(); o1.type = 'sine'; o2.type = 'triangle'; o2.detune.value = 7 - i*3; o1.detune.value = -4;
    const g2 = ctx.createGain(); g2.gain.value = .45; o1.connect(g); o2.connect(g2); g2.connect(g); o1.start(); o2.start();
    return {o1, o2}; });
  /* vinyl: filtered pink noise with a very faint pulse */
  const n = ctx.createBufferSource(); n.buffer = pinkNoise(ctx, 4); n.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
  noiseGain = ctx.createGain(); noiseGain.gain.value = .022;
  const pulse = ctx.createOscillator(), pulseG = ctx.createGain(); pulse.frequency.value = 1.25; pulseG.gain.value = .009; pulse.connect(pulseG); pulseG.connect(noiseGain.gain); pulse.start();
  n.connect(hp); hp.connect(lp); lp.connect(noiseGain); noiseGain.connect(master); n.start();
  setChord(true);
}
function setChord(now){
  const c = PRESETS[preset].chords[chordIx % 4], t = ctx.currentTime;
  voices.forEach((v, i) => { const f = midi(c[i]); [v.o1, v.o2].forEach(o => now ? o.frequency.setValueAtTime(f, t) : o.frequency.setTargetAtTime(f, t, 1.2)); });
}
function piano(t){
  const p = PRESETS[preset].penta, f = midi(p[Math.floor(Math.random()*p.length)] + (Math.random() < .25 ? 12 : 0));
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + 2.2);
  const o = ctx.createOscillator(), h = ctx.createOscillator(), hg = ctx.createGain(); o.type = 'sine'; h.type = 'sine'; h.frequency.value = f*2; hg.gain.value = .18;
  o.frequency.value = f; o.connect(g); h.connect(hg); hg.connect(g); g.connect(master); g.connect(wet);
  o.start(t); h.start(t); o.stop(t + 2.3); h.stop(t + 2.3);
}
/* lookahead scheduler for chord changes (~8 s) and occasional notes; runs only while playing */
let sched = 0;
function tick(){
  if (!playing || files) return;
  const t = ctx.currentTime;
  if (t >= chordT){ chordIx++; setChord(false); chordT = t + 8; }
  while (noteT < t + .3){ piano(Math.max(noteT, t + .02)); noteT += 1.4 + Math.random()*3.6; }
  sched = setTimeout(tick, 120);
}

/* ── B: files with crossfade ── */
async function loadPlaylist(){
  if (!D.music || !D.music.playlist) return null;
  try { const r = await fetch(D.music.playlist); if (!r.ok) return null; const j = await r.json(); return (j.tracks || []).filter(t => t.src).length ? j.tracks.filter(t => t.src) : null; }
  catch (e) { return null; }
}
function fileStart(ix, fade){
  const a = new Audio(files[ix].src); a.crossOrigin = 'anonymous'; a.preload = 'auto';
  const g = ctx.createGain(); g.gain.value = 0; ctx.createMediaElementSource(a).connect(g); g.connect(master);
  a.addEventListener('timeupdate', () => { if (a.duration && a.duration - a.currentTime < 3 && a === audios[audios.length-1]) next(); });
  a.play().catch(() => {}); const t = ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + fade);
  audios.push(a); fileGains.push(g);
}

/* ── transport ── */
const level = () => MAX * vol * (document.hidden ? 0 : 1);
function ramp(to, secs){ const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(to, t + secs); }
let suspendT = 0;
async function play(){
  if (playing) return;
  playing = true; store.set(KEY, '1'); clearTimeout(suspendT);
  if (!ctx) build();
  const resumed = ctx.resume();   /* inside the user's gesture */
  emit();
  if (files === null && D.music && D.music.playlist && !audios.length) files = await loadPlaylist();
  await resumed;
  if (!playing) return;
  if (files) { if (!audios.length) fileStart(fileIx, .1); else audios.forEach(a => a.play().catch(() => {})); }
  else { chordT = ctx.currentTime + 8; noteT = ctx.currentTime + 1.5; tick(); }
  ramp(level(), 2);
}
function pause(){
  if (!playing) return;
  playing = false; store.set(KEY, '0'); clearTimeout(sched); emit();
  ramp(0, 1);
  suspendT = setTimeout(() => { audios.forEach(a => a.pause()); ctx.suspend(); }, 1100);
}
function next(){
  if (files && ctx){ const old = audios.shift(), og = fileGains.shift(); if (old){ const t = ctx.currentTime; og.gain.setValueAtTime(og.gain.value, t); og.gain.linearRampToValueAtTime(0, t + 3); setTimeout(() => old.pause(), 3100); }
    fileIx = (fileIx + 1) % files.length; fileStart(fileIx, 3); emit(); return; }
  preset = (preset + 1) % PRESETS.length; chordIx = 0;
  if (ctx){ setChord(false); chordT = ctx.currentTime + 8; }
  emit();
}
function setVolume(v){ vol = Math.max(0, Math.min(1, v)); store.set(KEY + '.vol', String(vol)); if (ctx && playing) ramp(level(), .15); emit(); }
document.addEventListener('visibilitychange', () => {
  if (!ctx || !playing) return;
  if (document.hidden) { ramp(0, .4); suspendT = setTimeout(() => { if (document.hidden) ctx.suspend(); }, 500); }
  else { clearTimeout(suspendT); ctx.resume().then(() => ramp(level(), 1)); }
});

EOS.audio = {
  play, pause, next, setVolume,
  toggle: () => playing ? pause() : play(),
  get playing(){ return playing; }, get volume(){ return vol; }, get analyser(){ return analyser; },
  get title(){ return files ? (files[fileIx].title || 'Track ' + (fileIx + 1)) : PRESETS[preset].title; },
  get credit(){ return files ? (files[fileIx].credit || '') : 'Generative · Web Audio'; },
  get invite(){ return !playing && store.get(KEY) === '1'; },   /* was on last visit: invite, never autoplay */
  get armed(){ return armed; },
  subscribe: f => { subs.add(f); return () => subs.delete(f); },
};

/* ── menubar speaker: click toggles, long press or right click opens the volume slider ── */
const snd = $('#snd'), pop = $('#sndpop'), range = $('#sndvol');
const paint = () => { snd.classList.toggle('on', playing); snd.classList.toggle('invite', EOS.audio.invite);
  snd.setAttribute('aria-pressed', playing); snd.setAttribute('aria-label', playing ? 'Pause music' : 'Play music'); range.value = Math.round(vol*100); };
subs.add(paint); paint();
let lp = 0, longed = false;
snd.addEventListener('pointerdown', e => { if (e.button !== 0) return; longed = false; lp = setTimeout(() => { longed = true; pop.hidden = false; }, 500); });
snd.addEventListener('pointerup', () => clearTimeout(lp));
snd.addEventListener('pointerleave', () => clearTimeout(lp));
snd.addEventListener('click', e => { e.stopPropagation(); if (longed) { longed = false; return; } EOS.audio.toggle(); });
snd.addEventListener('contextmenu', e => { e.preventDefault(); pop.hidden = !pop.hidden; if (!pop.hidden) range.focus(); });
snd.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); pop.hidden = false; range.focus(); } });
range.addEventListener('input', () => setVolume(range.value / 100));
document.addEventListener('pointerdown', e => { if (!pop.hidden && !e.target.closest('#sndpop,#snd')) pop.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; snd.focus(); } });

/* ── login: ♪ arms the music; entering starts it within that same gesture ── */
const lk = $('#lksnd');
if (lk) {
  const lkPaint = () => { lk.setAttribute('aria-pressed', armed); lk.querySelector('span').textContent = armed ? 'sound on' : 'sound off'; };
  lk.addEventListener('pointerdown', e => e.stopPropagation());
  lk.addEventListener('click', e => { e.stopPropagation(); armed = !armed; lkPaint(); if (armed && !ctx) { build(); ctx.suspend(); } });
  lkPaint();
}
document.addEventListener('eos:unlock', () => { if (armed) play(); });

/* ── Terminal ── */
EOS.termCommands.music = () => { EOS.audio.toggle(); return playing ? `<span class="k">♪</span> playing “${EOS.audio.title}”` : '<span class="m">music paused</span>'; };
})();
