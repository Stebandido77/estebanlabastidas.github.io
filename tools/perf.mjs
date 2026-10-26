// Performance harness for estebanOS — no dependencies (Node ≥ 22, Chrome installed).
// Drives headless Chrome over the DevTools protocol and reports frame rates from rAF
// timestamps plus long tasks, for the interactions named in the brief (§3, §7).
//
//   node tools/perf.mjs [url] [--mobile] [--cpu=4] [--file]
//
// --mobile  390×844 @3x with touch, like an iPhone; --cpu=N throttles the CPU N×
// --file    open index.html over file:// and only run the smoke test
// --audio   music checks: no sound without a gesture, login ♪, Music app, pause/suspend
// --axe     accessibility audit (axe-core) of the login, desktop and each app
// --shot=name [--size=WxH]  screenshot after entering (side-by-side QA with the reference)
// --gpu     use the GPU (closer to a real device; without it canvas raster is software)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flag = n => args.find(a => a.startsWith('--' + n));
const MOBILE = !!flag('mobile'), FILE = !!flag('file');
const CPU = Number((flag('cpu') || '--cpu=1').split('=')[1]);
const URL_ = FILE ? pathToFileURL(resolve('index.html')).href : (args.find(a => !a.startsWith('--')) || 'http://localhost:8765/');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333 + Math.floor(Math.random() * 500);
const SIZE = (flag('size') || '').split('=')[1];   /* --size=1280x720 */
const [W, H] = SIZE ? SIZE.split('x').map(Number) : MOBILE ? [390, 844] : [1440, 900];

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'eos-'))}`,
  `--window-size=${W},${H}`, ...(flag('gpu') ? ['--enable-gpu', '--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] : []), '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(), events = [];
async function connect() {
  for (let i = 0; i < 50; i++) { try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = t.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(200); }
  throw new Error('chrome did not start');
}
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
const mouse = (type, x, y, buttons = 1) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1, pointerType: 'mouse' });
const key = async (k, code, vk) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, text: k === 'Enter' ? String.fromCharCode(13) : undefined }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); };

/* in-page frame recorder: rAF intervals + long tasks */
const REC = `window.__rec = { start(){ this.ts=[]; this.lt=[]; this.on=true; const f=t=>{ if(!this.on) return; this.ts.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f);
  this.po = new PerformanceObserver(l => l.getEntries().forEach(e => this.lt.push(e.duration))); this.po.observe({type:'longtask'}); },
  stop(){ this.on=false; this.po.disconnect(); const d=this.ts.slice(1).map((v,i)=>v-this.ts[i]); d.sort((a,b)=>a-b);
    const span=(this.ts.at(-1)-this.ts[0])||1; return { frames:d.length, fps:+(d.length*1000/span).toFixed(1), p95ms:+(d[Math.floor(d.length*.95)]||0).toFixed(1),
      worstMs:+(d.at(-1)||0).toFixed(1), dropped:d.filter(x=>x>1000/60*1.5).length, longTasks:this.lt.length, longestTaskMs:+Math.max(0,...this.lt).toFixed(0) }; } };`;
const PROFILE = !!flag('profile');
const measure = async (label, fn) => {
  if (PROFILE) { await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 }); await send('Profiler.start'); }
  await evaluate('__rec.start()'); await fn(); const r = await evaluate('__rec.stop()'); console.log(label.padEnd(30), JSON.stringify(r));
  if (PROFILE) { const { profile } = await send('Profiler.stop'); const self = new Map(), dt = profile.timeDeltas, by = new Map(profile.nodes.map(n => [n.id, n]));
    profile.samples.forEach((id, i) => { const n = by.get(id), cf = n.callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000); });
    console.log('   top self time (ms):', [...self].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(' | ')); }
  return r; };
/* counts rAF callbacks scheduled by the page itself while idle */
const IDLE = `window.__idle = () => new Promise(res => { let n = 0; const o = window.requestAnimationFrame; window.requestAnimationFrame = cb => { n++; return o.call(window, cb); };
  setTimeout(() => { window.requestAnimationFrame = o; res(n); }, 3000); });`;

try {
  ws = new WebSocket(await connect());
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } else if (d.method) events.push(d); });
  await send('Page.enable'); await send('Runtime.enable');
  if (MOBILE) { await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 3, mobile: true }); await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); }
  else await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  if (CPU > 1) await send('Emulation.setCPUThrottlingRate', { rate: CPU });
  if (flag('nojs')) await send('Emulation.setScriptExecutionDisabled', { value: true });   /* --nojs: check the <noscript> fallback */
  if (flag('loadprofile')) { await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 100 }); await send('Profiler.start'); }
  await send('Page.navigate', { url: URL_ });
  await sleep(1500);
  if (flag('loadprofile')) { const { profile } = await send('Profiler.stop'); const self = new Map(), by = new Map(profile.nodes.map(n => [n.id, n]));
    profile.samples.forEach((id, i) => { const cf = by.get(id).callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (profile.timeDeltas[i] || 0) / 1000); });
    console.log('load profile, top self time (ms):', [...self].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(' | ')); }
  if (!flag('nojs')) await evaluate(REC + IDLE);
  const CSS = flag('css'); if (CSS) await evaluate(`document.head.insertAdjacentHTML('beforeend', ${JSON.stringify('<style>' + CSS.slice(6) + '</style>')})`);   /* --css=... for experiments */
  const EV = flag('eval'); if (EV) await evaluate(EV.slice(7));   /* --eval=... for experiments */
  console.log(`# ${URL_}  ${W}×${H}${MOBILE ? ' mobile' : ''}  cpu ${CPU}×`);

  if (flag('audio')) {
    const st = () => evaluate(`({playing: EOS.audio.playing, ctx: !!EOS.audio.analyser, state: EOS.audio.analyser && EOS.audio.analyser.context.state,
      energy: (() => { const a = EOS.audio.analyser; if (!a) return 0; const b = new Uint8Array(a.frequencyBinCount); a.getByteFrequencyData(b); return b.reduce((x, y) => x + y, 0); })(),
      invite: EOS.audio.invite, speaker: document.getElementById('snd').className})`);
    console.log('before any gesture  ', JSON.stringify(await st()));
    const [bx, by] = await evaluate(`(() => { const r = document.getElementById('lksnd').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; })()`);
    await mouse('mousePressed', bx, by); await mouse('mouseReleased', bx, by, 0);
    console.log('♪ armed on login    ', JSON.stringify(await evaluate(`({armed: EOS.audio.armed, label: document.querySelector('#lksnd span').textContent})`)));
    await key('Enter', 'Enter', 13); await sleep(2500);
    console.log('entered (2.5 s)     ', JSON.stringify(await st()));
    await evaluate(`EOS.openApp('music')`); await sleep(600);
    await measure('music + Music app (3 s)', () => sleep(3000));
    console.log('Music app           ', JSON.stringify(await evaluate(`({title: document.querySelector('[data-app=music] [data-title]').textContent, button: document.querySelector('[data-app=music] [data-play]').textContent})`)));
    await evaluate(`document.querySelector('[data-app=music] [data-next]').click()`); await sleep(300);
    console.log('next →              ', await evaluate(`EOS.audio.title`));
    await evaluate(`EOS.audio.pause()`); await sleep(1400);
    console.log('paused (1.4 s)      ', JSON.stringify(await st()));
    console.log('terminal `music`    ', await evaluate(`EOS.termCommands.music()`));
    await sleep(400); console.log('                    ', JSON.stringify(await st()));
    await send('Page.reload');   /* leave while it plays: next visit invites, never autoplays */ await sleep(1500);
    console.log('next visit (no autoplay, invite)', JSON.stringify(await evaluate(`({playing: EOS.audio.playing, invite: EOS.audio.invite, speaker: document.getElementById('snd').className})`)));
  } else if (flag('axe')) {
    /* axe-core (from Lighthouse's npx cache, or AXE=path) over the login, the desktop and every app */
    const { readFileSync, readdirSync, existsSync } = await import('node:fs');
    const cache = join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    const axePath = process.env.AXE || (existsSync(cache) ? readdirSync(cache).map(d => join(cache, d, 'node_modules', 'axe-core', 'axe.min.js')).find(existsSync) : null);
    if (!axePath) throw new Error('axe-core not found: set AXE=path/to/axe.min.js');
    await evaluate(readFileSync(axePath, 'utf8'));
    const run = async label => { const r = await evaluate(`axe.run(document, {resultTypes: ['violations']}).then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.any[0] ? ' — ' + n.any[0].message.slice(0, 110) : ''))})))`);
      console.log(`${label.padEnd(12)} ${r.length ? '' : 'no violations'}`); r.forEach(v => console.log(`   ${v.impact} ${v.id} ×${v.n}`, ...v.nodes.map(n => '\n      ' + n))); };
    await run('login');
    await key('Enter', 'Enter', 13); await sleep(1500);
    await run('desktop');
    for (const a of await evaluate(`EOS.APPS.map(a => a.id)`)) { await evaluate(`Object.values(EOS.wins).forEach(w => w.hidden || EOS.closeWin(w)); EOS.openApp('${a}')`); await sleep(1200); await run(a); }
  } else if (flag('shot')) {   /* --shot=name: enter, let the animations finish, capture */
    await key('Enter', 'Enter', 13); await sleep(7000);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const out = join(tmpdir(), `eos-${flag('shot').split('=')[1] || 'shot'}-${W}x${H}.png`); (await import('node:fs')).writeFileSync(out, Buffer.from(data, 'base64')); console.log('screenshot:', out);
  } else if (flag('nojs')) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const out = join(tmpdir(), 'eos-nojs.png'); (await import('node:fs')).writeFileSync(out, Buffer.from(data, 'base64')); console.log('screenshot:', out);
  } else if (FILE) {
    await key('Enter', 'Enter', 13); await sleep(6000);
    console.log(JSON.stringify(await evaluate(`({ errors: window.__errs || null, lock: !!document.getElementById('lock'), wins: Object.keys(EOS.wins),
      portraitDrawn: (() => { const c = document.querySelector('[data-portrait]'); if (!c) return null; try { const d = c.getContext('2d').getImageData(c.width/2|0, c.height/3|0, 1, 1).data; return d[0]+d[1]+d[2] > 60; } catch (e) { return 'photo drawn (canvas tainted under file://)'; } })(),
      wallpaper: document.getElementById('wallimg')?.classList.contains('on') })`)));
    const ex = events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception?.description);
    console.log('exceptions:', ex.length ? ex : 'none');
  } else {
    await measure('login contours (2 s)', () => sleep(2000));
    await key('Enter', 'Enter', 13); await sleep(300);
    if (MOBILE) await evaluate(`EOS.openApp('about')`);   /* phones start on the home screen */
    await measure('portrait animation (4.5 s)', () => sleep(4500));
    await sleep(2500);   /* let the portrait finish (it waits for fonts, photo and luminance first) */
    const REP = flag('report'); if (REP) console.log('report:', JSON.stringify(await evaluate(REP.slice(9))));   /* --report=expr, printed after the portrait */
    if (!MOBILE) {
      await evaluate(`EOS.wins.markets && EOS.closeWin(EOS.wins.markets)`); await sleep(400);
      const r = await evaluate(`(() => { const b = EOS.wins.about.querySelector('.ttl').getBoundingClientRect(); return [b.left + b.width/2, b.top + b.height/2]; })()`);
      await measure('drag About (1.5 s)', async () => { let [x, y] = r; await mouse('mousePressed', x, y);
        for (let i = 0; i < 90; i++) { x += Math.sin(i / 9) * 9; y += Math.cos(i / 11) * 4; await mouse('mouseMoved', x, y); await sleep(16); }
        await mouse('mouseReleased', x, y, 0); });
    }
    await measure('open/close 5 apps', async () => { for (const a of ['research', 'projects', 'path', 'photos', 'notes']) { await evaluate(`EOS.openApp('${a}')`); await sleep(420); await evaluate(`EOS.closeWin(EOS.wins['${a}'])`); await sleep(260); } });
    let mini = null;
    if (await evaluate(`!!EOS.minimize`)) await measure('minimize/restore Research', async () => { await evaluate(`EOS.openApp('research')`); await sleep(450); await evaluate(`EOS.minimize(EOS.wins.research)`); await sleep(500); mini = await evaluate(`({hidden: EOS.wins.research.hidden, dockDot: document.querySelector('.dk[data-open=research]').classList.contains('run')})`); await evaluate(`EOS.openApp('research')`); await sleep(450); });
    if (mini) console.log('minimized state:', JSON.stringify(mini), '→ restored hidden =', await evaluate('EOS.wins.research.hidden'));
    await evaluate(`Object.values(EOS.wins).forEach(w => !w.hidden && w.dataset.app !== 'about' && EOS.closeWin(w))`); await sleep(800);
    console.log('idle rAF callbacks (3 s, Markets closed):', await evaluate('__idle()'));
    await evaluate(`EOS.openApp('markets')`); await sleep(500);
    console.log('idle rAF callbacks (3 s, Markets open):', await evaluate('__idle()'));
  }
} catch (e) { console.error(e); process.exitCode = 1; }
finally { try { await send('Browser.close'); } catch {} chrome.kill(); }
