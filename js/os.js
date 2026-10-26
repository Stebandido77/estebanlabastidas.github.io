/* estebanOS core: window manager, dock, menubar, spotlight, clock.
   Apps register themselves with EOS.register(id, {render, init, search}) from js/apps/*.js.
   Content comes only from window.DATA (assets/data/content.js). */
(() => {
const EOS = window.EOS = window.EOS || {};
const D = window.DATA;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const phone = () => matchMedia('(max-width:899px)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
Object.assign(EOS, {D, RM, $, $$, phone, esc, apps: {}});
if ((navigator.hardwareConcurrency || 8) <= 4 || matchMedia('(pointer:coarse)').matches) document.documentElement.classList.add('lowblur');
EOS.register = (id, mod) => { EOS.apps[id] = mod; };
EOS.locked = !document.documentElement.classList.contains('unlocked') && !!document.getElementById('lock');   /* lock.js takes over */

/* ── clock ── */
const fC = new Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const fH = new Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',hour:'numeric',minute:'2-digit',hour12:false});
EOS.fH = fH;
const tick = () => { const n = new Date(); $('#clock').textContent = fC.format(n).replace(/,/g,''); $('#hclock').textContent = fH.format(n).replace(/^24/,'00'); };
tick(); setInterval(tick, 15000);

/* ── markets (fixed figures from content.js) ── */
const M = D.markets;
$('#mbmkt').innerHTML = `BanRep <b>${esc(M.banrep.label)}</b> · CPI <b>${esc(M.cpi.label)}</b> · COP <b>${esc(M.usdcop.compact)}</b>`;
$('#mbmkt').title = 'As of ' + M.asOf;
$('#hmkt').innerHTML = [['BANREP',M.banrep],['CPI YOY',M.cpi],['USD/COP',M.usdcop]].map(([k,m]) =>
  `<div><small>${k}</small><b>${esc(m.compact || m.label)}</b><em>${esc(m.short)}</em></div>`).join('');

/* ── icons ── */
const G = {
  about: `<span class="t" data-t="EL" style="font-size:24px;color:#1b150d"></span>`,
  research: `<span class="t" data-t="π" style="font-size:32px;color:#6e4d22"></span>`,
  projects: `<svg viewBox="0 0 32 32"><path d="M3 9a2 2 0 0 1 2-2h7l3 3h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#9cc0ff"/><path d="M3 13h26v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#dbe8ff"/></svg>`,
  path: `<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="24" rx="2" fill="#fff" stroke="#c9bea9"/><path d="M11 10h10M11 14h10M11 18h7" stroke="#8b2332" stroke-width="1.6" stroke-linecap="round"/><path d="M11 23h6" stroke="#b9ad97" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  notes: `<svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" rx="3" fill="#fffaf0"/><rect x="5" y="5" width="22" height="6" rx="3" fill="#f2c94c"/><path d="M9 16h14M9 20h14M9 24h9" stroke="#c9bea9" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  photos: `<svg viewBox="0 0 32 32">${[['#f2b134',0],['#e06a4f',45],['#c94a8a',90],['#7b5cc9',135],['#3f8fd6',180],['#3fb8a8',225],['#7cbf4a',270],['#c7c234',315]].map(([c,a])=>`<ellipse cx="16" cy="9.5" rx="4.2" ry="6.5" fill="${c}" opacity=".85" transform="rotate(${a} 16 16)"/>`).join('')}</svg>`,
  activity: `<svg viewBox="0 0 32 32"><rect x="6" y="7" width="20" height="19" rx="3" fill="#fff"/><path d="M6 10a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2H6z" fill="#e8c288"/><text x="16" y="23" text-anchor="middle" font-family="Montserrat,Arial" font-weight="700" font-size="10" fill="#7d2a34" data-dayn>25</text></svg>`,
  safari: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#fff"/><circle cx="16" cy="16" r="10.5" fill="none" stroke="#bfcbe0"/><path d="M16 16 22 9l-4 9z" fill="#d6463b"/><path d="M16 16 10 23l4-9z" fill="#9aa6b8"/></svg>`,
  mail: `<svg viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="17" rx="2.5" fill="#fff"/><path d="M5 10l11 8 11-8" fill="none" stroke="#5a8fe0" stroke-width="1.6"/></svg>`,
  markets: `<svg viewBox="0 0 32 32"><path d="M5 22l6-6 4 3 7-9 5 4" fill="none" stroke="#f2a24a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 26h22" stroke="rgba(242,162,74,.4)" stroke-width="1.2"/></svg>`,
  music: `<svg viewBox="0 0 32 32"><path d="M13 22.5V9.5l11-2.5v12.5" fill="none" stroke="#fff6e8" stroke-width="2" stroke-linejoin="round"/><ellipse cx="10.5" cy="22.5" rx="3" ry="2.4" fill="#fff6e8"/><ellipse cx="21.5" cy="19.5" rx="3" ry="2.4" fill="#fff6e8"/></svg>`,
  term: `<svg viewBox="0 0 32 32"><path d="M8 11l5 5-5 5" fill="none" stroke="#e8c288" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 22h9" stroke="#ece5d6" stroke-width="2.2" stroke-linecap="round"/></svg>`
};
/* nav: label in the menubar page list (navless apps live in the Dock, Pages ▾ and Spotlight) */
const APPS = [
  {id:'about',   name:'About Esteban', short:'About',    nav:'About',    cls:'i-about',  w:860, h:600},
  {id:'research',name:'Research',      short:'Research', nav:'Research', cls:'i-res',    w:1000,h:620},
  {id:'projects',name:'Projects',      short:'Projects', nav:'Projects', cls:'i-proj',   w:920, h:620},
  {id:'path',    name:'Résumé',        short:'Résumé',   nav:'Résumé',   cls:'i-path',   w:820, h:640},
  {id:'notes',   name:'Notes',         short:'Notes',    nav:'Writing',  cls:'i-notes',  w:780, h:520},
  {id:'photos',  name:'Photos',        short:'Photos',   nav:'Photos',   cls:'i-photos', w:860, h:620},
  {id:'markets', name:'Markets',       short:'Markets',  nav:'Markets',  cls:'i-mkt',    w:620, h:420},
  {id:'music',   name:'Music',         short:'Music',    nav:'Music',    cls:'i-music',  w:400, h:540, navless:true},
  {id:'activity',name:'Activity',      short:'Activity', nav:'Activity', cls:'i-act',    w:640, h:600},
  {id:'safari',  name:'Safari',        short:'Safari',   nav:'Links',    cls:'i-safari', w:820, h:540},
  {id:'mail',    name:'Mail',          short:'Mail',     nav:'Contact',  cls:'i-mail',   w:600, h:520},
  {id:'term',    name:'Terminal',      short:'Terminal', nav:'Terminal', cls:'i-term',   w:620, h:400},
];
const appById = Object.fromEntries(APPS.map(a => [a.id, a]));
const icon = (a, size) => `<span class="ic ${a.cls}" aria-hidden="true" ${size?`style="width:${size}px;height:${size}px"`:''}>${G[a.id]}</span>`;
Object.assign(EOS, {APPS, appById, icon, G});

const MOBHIDE = ['notes','photos','activity','safari','term','path','markets','music'];
EOS.renderChrome = () => {
  $('#dock').innerHTML = APPS.map(a => (a.id==='mail'?'<span class="sep" aria-hidden="true"></span>':'') +
    `<button class="dk ${MOBHIDE.includes(a.id)?'mobhide':''}" data-open="${a.id}" aria-label="${a.name}">${icon(a)}<span class="tip" aria-hidden="true">${a.name}</span></button>`).join('');
  $('#happs').innerHTML = APPS.map(a => `<button class="ha" data-open="${a.id}">${icon(a)}${a.short}</button>`).join('');
  $('#gomenu').innerHTML = APPS.map(a => `<button data-open="${a.id}" role="menuitem">${a.nav}</button>`).join('');
  $('#mnav').innerHTML = APPS.filter(a => !a.navless).map(a => `<button class="mb" data-open="${a.id}" data-nav="${a.id}">${a.nav}</button>`).join('');
  const day = new Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',day:'numeric'}).format(new Date());
  $$('[data-dayn]').forEach(e => e.textContent = day);
};
EOS.renderChrome();
$$('[data-cv]').forEach(a => a.href = D.contact.cv);

/* ── shared derived content (papers, projects) used by Research, Terminal and Spotlight ── */
const STATUS = {review:['Under editorial review','c-rev'], ssrn:['SSRN','c-ssrn'], soon:['Going to SSRN','c-ssrn'], progress:['In progress','c-prog'], published:['Published','c-pub'], wp:['Working paper','c-wp'], desk:['On the desk','c-desk']};
const PAPERS = Object.entries(D.papers).map(([id,p]) => {
  let k = p.statusClass;
  if (id==='02') k='ssrn';
  else if (/GOING TO SSRN/i.test(D.paperStatus[id]||'')) k='soon';
  else if (k==='working') k='wp';
  if (!STATUS[k]) k = /WORKING/i.test(p.status)?'wp':'progress';
  return {id, ...p, k};
});
const PIPE = D.pipeline.map((p,i) => ({id:'D'+(i+1), num:'On the desk · '+(i+1), k:'desk', subtitle:'', ...p}));
const PROJ = D.projects.map(p => { const n = p.no.replace(/\D/g,'');
  return {...p, n, c:D.projectCategories[n]||'oss', plain:p.t.replace(/<span[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'').replace('&amp;','&').trim()}; });
Object.assign(EOS, {STATUS, PAPERS, ALLP:[...PAPERS, ...PIPE], PROJ});

/* ── window manager ──
   Each window keeps its rect in state {x, y, w, h} relative to #wins and is placed with
   transform: translate3d (never left/top). Drags and resizes write state on pointermove and
   apply it once per frame. Open / minimize / close animate with the Web Animations API on
   transform + opacity only, with will-change set just for the duration. */
const wins = {}; let z = 20, spawn = 0;
const S = new Map();   /* window → {x, y, w, h, prev, min} */
EOS.wins = wins;
const area = () => $('#wins').getBoundingClientRect();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SPRING = 'cubic-bezier(.2,.9,.25,1.05)';
const T = s => `translate3d(${s.x}px,${s.y}px,0)`;
function place(w){
  const s = S.get(w);
  if (phone()) { w.style.transform = ''; return; }
  w.style.width = s.w + 'px'; w.style.height = s.h + 'px'; w.style.transform = T(s);
}
EOS.rect = (w, r) => { Object.assign(S.get(w), r); place(w); };
EOS.getRect = w => ({...S.get(w)});
const setTitle = (w, t) => { $('.ttl', w).textContent = t; };
EOS.setTitle = setTitle;
function focusWin(w){
  if (w.classList.contains('front')) return;
  w.style.zIndex = ++z; $$('.win').forEach(x => x.classList.toggle('front', x===w));
  $$('[data-nav]').forEach(b => b.classList.toggle('cur', b.dataset.nav === w.dataset.app));
}
function syncDock(){ $$('.dk').forEach(d => { const w = wins[d.dataset.open]; d.classList.toggle('run', !!w && (!w.hidden || S.get(w).min)); }); }
const topWin = () => $$('.win').filter(x => !x.hidden).sort((a,b) => b.style.zIndex - a.style.zIndex)[0];
function afterHide(w){
  w.classList.remove('front');
  syncDock();
  const vis = topWin();
  if (vis) focusWin(vis);
  else { $$('[data-nav]').forEach(b => b.classList.remove('cur')); document.body.classList.remove('app-open'); }
  if (w._stop) w._stop();
}

/* transform that lands the window, scaled down, on its Dock icon (transform-origin 0 0) */
function dockT(w){
  const s = S.get(w), d = $(`.dk[data-open="${w.dataset.app}"]`), r = d && d.getBoundingClientRect(), a = area();
  if (!r || !r.width) return `translate3d(${s.x}px,${s.y + 60}px,0) scale(.85)`;
  const k = Math.max(r.width / s.w, .04);
  return `translate3d(${r.left + r.width/2 - a.left - s.w*k/2}px,${r.top + r.height/2 - a.top - s.h*k/2}px,0) scale(${k})`;
}
const phoneFrom = () => `translate3d(${innerWidth*.3}px,${innerHeight*.36}px,0) scale(.4)`;   /* scale .4 about 50% 60% */
function animate(w, frames, opts){
  if (RM) return Promise.resolve();
  w.style.willChange = 'transform, opacity';
  const an = w.animate(frames, opts);
  return an.finished.catch(() => {}).then(() => { w.style.willChange = ''; });
}
/* end (or start) keyframes are left implicit so they track the live inline transform */
function animateIn(w, from){
  return animate(w, [{transform: from, opacity: 0}, {opacity: 1, offset: .35}], {duration: 380, easing: SPRING});
}

function initialRect(a){
  const ar = area();
  const W = Math.max(360, Math.min(a.w, ar.width - 80)), H = Math.max(260, Math.min(a.h, ar.height - 100));
  const x = Math.max(20, (ar.width - W)/2 + (spawn%5)*28 - (spawn?40:0)), y = Math.max(10, (ar.height - H - 80)/2 + (spawn%5)*24 - 20);
  spawn++;
  return {x, y, w: W, h: H};
}
function openApp(id, sel){
  const a = appById[id]; if(!a) return;
  const mod = EOS.apps[id] || {};
  let w = wins[id];
  if (!w) {
    w = document.createElement('section'); w.className = 'win'; w.dataset.app = id;
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', a.name);
    w.innerHTML = `<div class="tb"><div class="lights"><b data-x title="Close" role="button" aria-label="Close">×</b><b data-min title="Minimize" role="button" aria-label="Minimize">–</b><b data-max title="Zoom" role="button" aria-label="Zoom">+</b></div><button class="back" data-x>‹ Home</button><div class="ttl">${a.name}</div></div>${mod.render ? mod.render() : ''}`
      + ['n','s','e','w','ne','nw','se','sw'].map(d => `<i class="rz rz-${d}" data-rz="${d}" aria-hidden="true"></i>`).join('');
    S.set(w, {...(EOS.placeWindow ? EOS.placeWindow(a) : initialRect(a)), prev: null, min: false});
    place(w);
    $('#wins').appendChild(w); wins[id] = w;
    bindWin(w);
    if (mod.init) mod.init(w, sel);
    animateIn(w, phone() ? phoneFrom() : dockT(w));
    const dk = $(`.dk[data-open="${id}"]`); if (dk && !RM) { dk.classList.add('bounce'); setTimeout(()=>dk.classList.remove('bounce'),600); }
  } else if (w.hidden) {
    const s = S.get(w), wasMin = s.min;
    s.min = false; w.hidden = false; place(w);
    if (wasMin) animate(w, [{transform: dockT(w), opacity: .2}], {duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)'});
    else animateIn(w, phone() ? phoneFrom() : dockT(w));
    if (w._resume) w._resume();
  }
  if (sel && w._select) w._select(sel);
  focusWin(w); syncDock(); hideHint(); document.body.classList.add('app-open');
  return w;
}
function closeWin(w){
  if (w.hidden || w._closing) return;
  w._closing = true;
  const s = S.get(w), to = phone() ? 'scale(.96)' : `translate3d(${s.x + s.w*.02}px,${s.y + s.h*.02}px,0) scale(.96)`;
  animate(w, [{transform: to, opacity: 0}], {duration: 160, easing: 'ease-out'})
    .then(() => { w._closing = false; w.hidden = true; afterHide(w); });
}
function minimize(w){
  if (phone()) return closeWin(w);
  if (w.hidden || w._closing) return;
  w._closing = true;
  animate(w, [{transform: dockT(w), opacity: .2}], {duration: 420, easing: 'cubic-bezier(.55,0,.75,.2)'})
    .then(() => { w._closing = false; S.get(w).min = true; w.hidden = true; afterHide(w); });
}
function zoom(w){
  const s = S.get(w);
  if (s.prev) { Object.assign(s, s.prev); s.prev = null; }
  else { const r = EOS.zoomRect ? EOS.zoomRect() : (ar => ({x:0, y:0, w:ar.width, h:ar.height - 78}))(area());
    s.prev = {x:s.x, y:s.y, w:s.w, h:s.h}; Object.assign(s, r); }
  place(w); if (EOS.saveRect) EOS.saveRect(w);
}
Object.assign(EOS, {openApp, closeWin, focusWin, minimize, zoom, topWin});

function bindWin(w){
  w.addEventListener('pointerdown', () => focusWin(w));
  $$('[data-x]', w).forEach(b => b.onclick = e => { e.stopPropagation(); closeWin(w); });
  $('[data-min]', w).onclick = e => { e.stopPropagation(); minimize(w); };
  $('[data-max]', w).onclick = e => { e.stopPropagation(); zoom(w); };
  const tb = $('.tb', w);
  tb.ondblclick = e => { if(!e.target.closest('.lights,button')) zoom(w); };
  /* drag by the title bar */
  tb.addEventListener('pointerdown', e => {
    if (phone() || e.button !== 0 || e.target.closest('.lights,button')) return;
    const s = S.get(w), a = area(), ox = e.clientX - s.x, oy = e.clientY - s.y, lim = EOS.dragLimit ? EOS.dragLimit() : a.height - 44;
    let nx = s.x, ny = s.y, raf = 0, moved = false;
    tb.setPointerCapture(e.pointerId); w.style.willChange = 'transform';
    const mv = ev => { moved = true;
      nx = clamp(ev.clientX - ox, 120 - s.w, a.width - 120); ny = clamp(ev.clientY - oy, 0, lim);   /* title bar stays reachable */
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; s.x = nx; s.y = ny; w.style.transform = T(s); }); };
    const up = () => { cancelAnimationFrame(raf); if (moved) { s.x = nx; s.y = ny; s.prev = null; w.style.transform = T(s); if (EOS.saveRect) EOS.saveRect(w); }
      w.style.willChange = ''; tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); tb.removeEventListener('pointercancel', up); };
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up); tb.addEventListener('pointercancel', up);
  });
  /* resize from edges and corners */
  $$('[data-rz]', w).forEach(h => h.addEventListener('pointerdown', e => {
    if (phone() || e.button !== 0) return;
    e.stopPropagation(); focusWin(w);
    const s = S.get(w), d = h.dataset.rz, o = {x:s.x, y:s.y, w:s.w, h:s.h, px:e.clientX, py:e.clientY};
    const nr = {x:o.x, y:o.y, w:o.w, h:o.h}; let raf = 0;
    h.setPointerCapture(e.pointerId);
    const mv = ev => { const dx = ev.clientX - o.px, dy = ev.clientY - o.py;
      if (d.includes('e')) nr.w = Math.max(360, o.w + dx);
      if (d.includes('s')) nr.h = Math.max(260, o.h + dy);
      if (d.includes('w')) { nr.w = Math.max(360, o.w - dx); nr.x = o.x + o.w - nr.w; }
      if (d.includes('n')) { nr.y = clamp(o.y + dy, 0, o.y + o.h - 260); nr.h = o.y + o.h - nr.y; }
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; Object.assign(s, nr); place(w); }); };
    const up = () => { cancelAnimationFrame(raf); Object.assign(s, nr, {prev:null}); place(w); if (EOS.saveRect) EOS.saveRect(w);
      h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  }));
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openApp(o.dataset.open, o.dataset.sel); closeMenus(); }
  if (e.target.closest('[data-closeall]')) { $$('.win').forEach(w => !w.hidden && closeWin(w)); closeMenus(); }
  if (e.target.closest('[data-tile]')) { EOS.tile(); closeMenus(); }
  if (e.target.closest('[data-spot]')) { openSpot(); closeMenus(); }
});


/* menus */
function closeMenus(){ $$('.mb.open').forEach(m=>m.classList.remove('open')); }
EOS.closeMenus = closeMenus;
$$('[data-menu]').forEach(m => {
  m.addEventListener('click', e => { if (e.target.closest('.menu')) return; const o = m.classList.contains('open'); closeMenus(); if(!o) m.classList.add('open'); });
  m.addEventListener('keydown', e => { if ((e.key==='Enter'||e.key===' ') && e.target===m) { e.preventDefault(); m.click(); const f = $('.menu button, .menu a', m); f && f.focus(); } });
});
document.addEventListener('pointerdown', e => { if (!e.target.closest('[data-menu]')) closeMenus(); });

/* ── spotlight ── */
let IDX = null;
const buildIndex = () => [
  ...APPS.map(a => ({g:a.name, s:'Application', a:a.id, k:a.name+' '+a.short+' '+a.nav})),
  ...['research','projects','path','photos','notes'].flatMap(id => (EOS.apps[id] && EOS.apps[id].search) ? EOS.apps[id].search() : []),
];
let spotSel = 0, spotRes = [], spotPrev = null;
function openSpot(){ IDX = IDX || buildIndex(); spotPrev = document.activeElement; $('#spot').classList.add('on'); $('#spotq').value=''; renderSpot(); setTimeout(()=>$('#spotq').focus(),20); }
function closeSpot(){ if (!$('#spot').classList.contains('on')) return; $('#spot').classList.remove('on'); spotPrev && spotPrev.focus && spotPrev.focus({preventScroll:true}); }
EOS.openSpot = openSpot;
function renderSpot(){
  const q = $('#spotq').value.trim().toLowerCase();
  spotRes = (q ? IDX.filter(i => i.k.toLowerCase().includes(q)) : IDX.slice(0,APPS.length)).slice(0,12); spotSel = 0;
  $('#spotr').innerHTML = spotRes.map((r,i) => `<li><button class="${i?'':'on'}" data-r="${i}" role="option" aria-selected="${!i}">${icon(appById[r.a],28)}<span>${esc(r.g)}</span><small>${esc(r.s)}</small></button></li>`).join('') || '<li style="padding:12px 16px;color:var(--text-2)">No results</li>';
  $$('[data-r]').forEach(b => b.onclick = () => pick(+b.dataset.r));
}
function pick(i){ const r = spotRes[i]; if(!r) return; closeSpot(); openApp(r.a, r.sel); }
$('#spotq').addEventListener('input', renderSpot);
$('#spotq').addEventListener('keydown', e => {
  if (e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); spotSel = Math.max(0, Math.min(spotRes.length-1, spotSel + (e.key==='ArrowDown'?1:-1)));
    $$('[data-r]').forEach((b,i)=>{ b.classList.toggle('on',i===spotSel); b.setAttribute('aria-selected', i===spotSel); if (i===spotSel) b.scrollIntoView({block:'nearest'}); }); }
  if (e.key==='Enter') pick(spotSel); if (e.key==='Escape') closeSpot();
  if (e.key==='Tab') e.preventDefault();   /* focus stays trapped in the search field */
});
$('#spot').addEventListener('pointerdown', e => { if (e.target.id==='spot') closeSpot(); });
document.addEventListener('keydown', e => {
  if (EOS.locked) return;
  if ((e.metaKey||e.ctrlKey) && (e.key==='k'||e.key===' ')) { e.preventDefault(); openSpot(); }
  if (e.key==='Escape') { closeSpot(); closeMenus(); }
});
function hideHint(){ const h=$('#hint'); if(h) h.style.opacity='0'; }

/* ── layout (§4): work area, smart placement, remembered rects, arrange, shortcuts ── */
/* the rectangle windows open and stay in, in #wins coordinates:
   12 px under the menubar, 16 px above the Dock, 24 px from each side */
function workArea(){
  const wr = area(), mb = $('.menubar').getBoundingClientRect(), dk = $('#dock').getBoundingClientRect();
  const top = mb.bottom + 12 - wr.top, bottom = (dk.height ? dk.top : innerHeight) - 16 - wr.top;
  return {x: 24, y: Math.max(0, top), w: wr.width - 48, h: bottom - Math.max(0, top)};
}
EOS.workArea = workArea;
const fits = (r, wa) => r && r.w >= 360 && r.h >= 260 && r.x >= wa.x - 1 && r.y >= wa.y - 1 && r.x + r.w <= wa.x + wa.w + 1 && r.y + r.h <= wa.y + wa.h + 1;
const overlap = (r, o) => Math.max(0, Math.min(r.x+r.w, o.x+o.w) - Math.max(r.x, o.x)) * Math.max(0, Math.min(r.y+r.h, o.y+o.h) - Math.max(r.y, o.y));
const KEY = 'eos.rects';
const loadRects = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
EOS.saveRect = w => { try { const all = loadRects(), s = S.get(w); all[w.dataset.app] = {x:Math.round(s.x), y:Math.round(s.y), w:Math.round(s.w), h:Math.round(s.h)}; localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} };
const sizeFor = (a, wa) => ({w: Math.max(360, Math.min(a.w, wa.w)), h: Math.max(260, Math.min(a.h, wa.h))});
const visibleRects = () => $$('.win').filter(w => !w.hidden).map(w => S.get(w));
/* first window: centered. Next ones: the candidate position (on a grid over the work area) with
   the least overlap with visible windows, nearest the center on ties. When even the best spot
   would cover more than 35% of the new window (no real gap), cascade 28 px from the front one */
EOS.placeWindow = a => {
  const wa = workArea(), saved = loadRects()[a.id];
  if (fits(saved, wa)) return {...saved};
  const sz = sizeFor(a, wa), others = visibleRects();
  const center = {x: wa.x + (wa.w - sz.w)/2, y: wa.y + (wa.h - sz.h)/2, ...sz};
  if (!others.length) return center;
  const xs = [], ys = [], nx = 12, ny = 8;
  for (let i = 0; i <= nx; i++) xs.push(wa.x + (wa.w - sz.w)*i/nx);
  for (let j = 0; j <= ny; j++) ys.push(wa.y + (wa.h - sz.h)*j/ny);
  let best = null, bo = Infinity, bd = Infinity;
  for (const y of ys) for (const x of xs) {
    const r = {x, y, ...sz}, o = others.reduce((t, q) => t + overlap(r, q), 0), d = (x - center.x)**2 + (y - center.y)**2;
    if (o < bo - 1 || (o <= bo + 1 && d < bd)) { best = r; bo = o; bd = d; }
  }
  if (bo < sz.w*sz.h*.35) return best;
  const t = topWin(), f = t ? S.get(t) : center;
  let x = f.x + 28, y = f.y + 28;
  if (x + sz.w > wa.x + wa.w) x = wa.x + (x - wa.x) % Math.max(28, wa.w - sz.w + 1);
  if (y + sz.h > wa.y + wa.h) y = wa.y + (y - wa.y) % Math.max(28, wa.h - sz.h + 1);
  return {x, y, ...sz};
};
EOS.zoomRect = () => { const wa = workArea(); return {x: wa.x, y: wa.y, w: wa.w, h: wa.h}; };
/* Window → Arrange: tile the visible windows inside the work area */
EOS.tile = () => {
  const vis = $$('.win').filter(w => !w.hidden), n = vis.length; if (!n) return;
  const wa = workArea(), g = 12, cols = Math.ceil(Math.sqrt(n * wa.w / wa.h / 1.4)), rows = Math.ceil(n / cols);
  const W = (wa.w - g*(cols-1)) / cols, H = (wa.h - g*(rows-1)) / rows;
  vis.forEach((w, i) => { EOS.rect(w, {x: wa.x + (i % cols)*(W + g), y: wa.y + Math.floor(i / cols)*(H + g), w: W, h: H, prev: null}); EOS.saveRect(w); });
};
/* keep every window inside the work area when the browser window changes size */
let rzT; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (phone()) { Object.values(wins).forEach(place); return; } const wa = workArea();
  for (const w of Object.values(wins)) { const s = S.get(w), nw = Math.min(s.w, wa.w), nh = Math.min(s.h, wa.h);
    EOS.rect(w, {w: nw, h: nh, x: clamp(s.x, wa.x, wa.x + wa.w - nw), y: clamp(s.y, wa.y, wa.y + wa.h - nh)}); } }, 120); });
EOS.dragLimit = () => { const wa = workArea(); return wa.y + wa.h - 44; };   /* the title bar never goes under the Dock */
/* shortcuts: ⌘/Ctrl when the browser lets them through (⌘W, ⌘M and ⌘` are usually taken by the
   browser or the OS), and ⌥ as a fallback that always works: ⌥W close · ⌥M minimize · ⌥` cycle */
const editable = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
document.addEventListener('keydown', e => {
  if (EOS.locked || phone()) return;
  const mod = e.metaKey || e.ctrlKey || (e.altKey && !editable(e.target));
  if (!mod || e.shiftKey && e.code !== 'Backquote') return;
  const t = topWin();
  if (e.code === 'KeyW' && t) { e.preventDefault(); closeWin(t); }
  else if (e.code === 'KeyM' && t) { e.preventDefault(); minimize(t); }
  else if (e.code === 'Backquote') { const vis = $$('.win').filter(w => !w.hidden).sort((a,b) => a.style.zIndex - b.style.zIndex);
    if (vis.length > 1) { e.preventDefault(); focusWin(e.shiftKey ? vis[vis.length-2] : vis[0]); } }
});
document.addEventListener('click', e => {
  const c = e.target.closest('[data-win]'); if (!c) return;
  const t = topWin(); closeMenus();
  ({close: () => t && closeWin(t), min: () => t && minimize(t), zoom: () => t && zoom(t),
    cycle: () => { const v = $$('.win').filter(w => !w.hidden).sort((a,b) => a.style.zIndex - b.style.zIndex); if (v.length > 1) focusWin(v[0]); }})[c.dataset.win]();
});

/* ── entering the desktop (called directly, or by the login screen) ── */
EOS.defaultWindows = () => {
  const wa = workArea(), saved = loadRects();
  if (area().width >= 1280){   /* About on the left, in front; Markets top right */
    const mw = Math.min(620, wa.w*.40), mh = Math.min(420, wa.h*.62);
    const m = openApp('markets'); if (!fits(saved.markets, wa)) EOS.rect(m, {w:mw, h:mh, x:wa.x + wa.w - mw, y:wa.y});
    const aw = Math.min(860, wa.w - mw - 24), ah = Math.min(600, wa.h);
    const a = openApp('about'); if (!fits(saved.about, wa)) EOS.rect(a, {w:aw, h:ah, x:wa.x, y:wa.y + (wa.h - ah)/2});
  } else openApp('about');
};
EOS.enter = () => { if (!phone()) EOS.defaultWindows(); };
document.addEventListener('DOMContentLoaded', () => { if (!EOS.locked) EOS.enter(); });
})();
