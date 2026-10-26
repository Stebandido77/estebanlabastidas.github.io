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
EOS.register = (id, mod) => { EOS.apps[id] = mod; };

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
  about: `<span class="t" style="font-size:24px;color:#1b150d">EL</span>`,
  research: `<span class="t" style="font-size:32px;color:#6e4d22">π</span>`,
  projects: `<svg viewBox="0 0 32 32"><path d="M3 9a2 2 0 0 1 2-2h7l3 3h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#9cc0ff"/><path d="M3 13h26v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#dbe8ff"/></svg>`,
  path: `<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="24" rx="2" fill="#fff" stroke="#c9bea9"/><path d="M11 10h10M11 14h10M11 18h7" stroke="#8b2332" stroke-width="1.6" stroke-linecap="round"/><path d="M11 23h6" stroke="#b9ad97" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  notes: `<svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" rx="3" fill="#fffaf0"/><rect x="5" y="5" width="22" height="6" rx="3" fill="#f2c94c"/><path d="M9 16h14M9 20h14M9 24h9" stroke="#c9bea9" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  photos: `<svg viewBox="0 0 32 32">${[['#f2b134',0],['#e06a4f',45],['#c94a8a',90],['#7b5cc9',135],['#3f8fd6',180],['#3fb8a8',225],['#7cbf4a',270],['#c7c234',315]].map(([c,a])=>`<ellipse cx="16" cy="9.5" rx="4.2" ry="6.5" fill="${c}" opacity=".85" transform="rotate(${a} 16 16)"/>`).join('')}</svg>`,
  activity: `<svg viewBox="0 0 32 32"><rect x="6" y="7" width="20" height="19" rx="3" fill="#fff"/><path d="M6 10a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2H6z" fill="#e8c288"/><text x="16" y="23" text-anchor="middle" font-family="Montserrat,Arial" font-weight="700" font-size="10" fill="#7d2a34" data-dayn>25</text></svg>`,
  safari: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#fff"/><circle cx="16" cy="16" r="10.5" fill="none" stroke="#bfcbe0"/><path d="M16 16 22 9l-4 9z" fill="#d6463b"/><path d="M16 16 10 23l4-9z" fill="#9aa6b8"/></svg>`,
  mail: `<svg viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="17" rx="2.5" fill="#fff"/><path d="M5 10l11 8 11-8" fill="none" stroke="#5a8fe0" stroke-width="1.6"/></svg>`,
  markets: `<svg viewBox="0 0 32 32"><path d="M5 22l6-6 4 3 7-9 5 4" fill="none" stroke="#f2a24a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 26h22" stroke="rgba(242,162,74,.4)" stroke-width="1.2"/></svg>`,
  term: `<svg viewBox="0 0 32 32"><path d="M8 11l5 5-5 5" fill="none" stroke="#e8c288" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 22h9" stroke="#ece5d6" stroke-width="2.2" stroke-linecap="round"/></svg>`
};
/* nav: label used in the menubar page list */
const APPS = [
  {id:'about',   name:'About Esteban', short:'About',    nav:'About',    cls:'i-about',  w:860, h:600},
  {id:'research',name:'Research',      short:'Research', nav:'Research', cls:'i-res',    w:1000,h:620},
  {id:'projects',name:'Projects',      short:'Projects', nav:'Projects', cls:'i-proj',   w:920, h:620},
  {id:'path',    name:'Résumé',        short:'Résumé',   nav:'Résumé',   cls:'i-path',   w:820, h:640},
  {id:'notes',   name:'Notes',         short:'Notes',    nav:'Writing',  cls:'i-notes',  w:780, h:520},
  {id:'photos',  name:'Photos',        short:'Photos',   nav:'Photos',   cls:'i-photos', w:860, h:620},
  {id:'markets', name:'Markets',       short:'Markets',  nav:'Markets',  cls:'i-mkt',    w:620, h:420},
  {id:'activity',name:'Activity',      short:'Activity', nav:'Activity', cls:'i-act',    w:640, h:600},
  {id:'safari',  name:'Safari',        short:'Safari',   nav:'Links',    cls:'i-safari', w:820, h:540},
  {id:'mail',    name:'Mail',          short:'Mail',     nav:'Contact',  cls:'i-mail',   w:600, h:520},
  {id:'term',    name:'Terminal',      short:'Terminal', nav:'Terminal', cls:'i-term',   w:620, h:400},
];
const appById = Object.fromEntries(APPS.map(a => [a.id, a]));
const icon = (a, size) => `<span class="ic ${a.cls}" aria-hidden="true" ${size?`style="width:${size}px;height:${size}px"`:''}>${G[a.id]}</span>`;
Object.assign(EOS, {APPS, appById, icon, G});

const MOBHIDE = ['notes','photos','activity','safari','term','path','markets'];
EOS.renderChrome = () => {
  $('#dock').innerHTML = APPS.map(a => (a.id==='mail'?'<span class="sep" aria-hidden="true"></span>':'') +
    `<button class="dk ${MOBHIDE.includes(a.id)?'mobhide':''}" data-open="${a.id}" aria-label="${a.name}">${icon(a)}<span class="tip" aria-hidden="true">${a.name}</span></button>`).join('');
  $('#happs').innerHTML = APPS.map(a => `<button class="ha" data-open="${a.id}">${icon(a)}${a.short}</button>`).join('');
  $('#gomenu').innerHTML = APPS.map(a => `<button data-open="${a.id}" role="menuitem">${a.nav}</button>`).join('');
  $('#mnav').innerHTML = APPS.map(a => `<button class="mb" data-open="${a.id}" data-nav="${a.id}">${a.nav}</button>`).join('');
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

/* ── window manager ── */
const wins = {}; let z = 20, spawn = 0;
EOS.wins = wins;
const setTitle = (w, t) => { $('.ttl', w).textContent = t; };
EOS.setTitle = setTitle;
function focusWin(w){
  w.style.zIndex = ++z; $$('.win').forEach(x => x.classList.toggle('front', x===w));
  $$('[data-nav]').forEach(b => b.classList.toggle('cur', b.dataset.nav === w.dataset.app));
}
function syncDock(){ $$('.dk').forEach(d => d.classList.toggle('run', !!wins[d.dataset.open] && !wins[d.dataset.open].hidden)); }
function openApp(id, sel){
  const a = appById[id]; if(!a) return;
  const mod = EOS.apps[id] || {};
  let w = wins[id];
  if (!w) {
    w = document.createElement('section'); w.className = 'win opening'; w.dataset.app = id;
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', a.name);
    w.innerHTML = `<div class="tb"><div class="lights"><b data-x title="Close" role="button" aria-label="Close">×</b><b data-min title="Minimize" role="button" aria-label="Minimize">–</b><b data-max title="Zoom" role="button" aria-label="Zoom">+</b></div><button class="back" data-x>‹ Home</button><div class="ttl">${a.name}</div></div>${mod.render ? mod.render() : ''}`;
    const area = $('#wins').getBoundingClientRect();
    const W = Math.min(a.w, area.width - 80), H = Math.min(a.h, area.height - 100);
    const L = Math.max(20, (area.width - W)/2 + (spawn%5)*28 - (spawn?40:0)), T = Math.max(10, (area.height - H - 80)/2 + (spawn%5)*24 - 20);
    spawn++;
    Object.assign(w.style, {width:Math.max(W,360)+'px', height:Math.max(H,260)+'px', left:L+'px', top:T+'px'});
    $('#wins').appendChild(w); wins[id] = w;
    bindWin(w);
    if (mod.init) mod.init(w, sel);
    requestAnimationFrame(() => requestAnimationFrame(() => w.classList.remove('opening')));
    const dk = $(`.dk[data-open="${id}"]`); if (dk && !RM) { dk.classList.add('bounce'); setTimeout(()=>dk.classList.remove('bounce'),600); }
  } else {
    if (w.hidden) { w.hidden = false; w.classList.add('opening'); requestAnimationFrame(() => requestAnimationFrame(() => w.classList.remove('opening'))); }
    if (sel && w._select) w._select(sel);
  }
  focusWin(w); syncDock(); hideHint(); document.body.classList.add('app-open');
  return w;
}
function closeWin(w){
  w.classList.add('closing');
  setTimeout(() => { w.hidden = true; w.classList.remove('closing'); syncDock();
    const vis = $$('.win').filter(x=>!x.hidden).sort((a,b)=>b.style.zIndex-a.style.zIndex)[0];
    if (vis) focusWin(vis); else { $$('[data-nav]').forEach(b => b.classList.remove('cur')); document.body.classList.remove('app-open'); }
    if (w._stop) w._stop(); }, RM?0:180);
}
Object.assign(EOS, {openApp, closeWin, focusWin});
function bindWin(w){
  w.addEventListener('pointerdown', () => focusWin(w));
  $$('[data-x]', w).forEach(b => b.onclick = e => { e.stopPropagation(); closeWin(w); });
  $('[data-min]', w).onclick = e => { e.stopPropagation(); closeWin(w); };
  $('[data-max]', w).onclick = e => { e.stopPropagation(); w.classList.toggle('max'); };
  const tb = $('.tb', w);
  tb.ondblclick = e => { if(!e.target.closest('.lights')) w.classList.toggle('max'); };
  tb.addEventListener('pointerdown', e => {
    if (phone() || e.target.closest('.lights,button') || w.classList.contains('max')) return;
    const area = $('#wins').getBoundingClientRect(), r = w.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    tb.setPointerCapture(e.pointerId); w.style.transition = 'none';
    const mv = ev => { w.style.left = Math.min(area.width-80, Math.max(-r.width+120, ev.clientX - area.left - ox))+'px'; w.style.top = Math.min(area.height-60, Math.max(0, ev.clientY - area.top - oy))+'px'; };
    const up = () => { w.style.transition=''; tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
  });
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openApp(o.dataset.open, o.dataset.sel); closeMenus(); }
  if (e.target.closest('[data-closeall]')) { $$('.win').forEach(w => !w.hidden && closeWin(w)); closeMenus(); }
  if (e.target.closest('[data-tile]')) { tile(); closeMenus(); }
  if (e.target.closest('[data-spot]')) { openSpot(); closeMenus(); }
});
function tile(){
  const vis = $$('.win').filter(w=>!w.hidden); const area = $('#wins').getBoundingClientRect(); const n = vis.length; if(!n) return;
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n/cols), W = (area.width-40)/cols, H = (area.height-100)/rows;
  vis.forEach((w,i) => { w.classList.remove('max'); Object.assign(w.style,{left:20+(i%cols)*W+'px', top:10+Math.floor(i/cols)*H+'px', width:W-12+'px', height:H-12+'px'}); });
}

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
  ...APPS.flatMap(a => (EOS.apps[a.id] && EOS.apps[a.id].search) ? EOS.apps[a.id].search() : []),
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

/* ── entering the desktop (called directly, or by the login screen) ── */
EOS.defaultWindows = () => {
  const area = $('#wins').getBoundingClientRect();
  if (area.width >= 1280){
    openApp('markets'); const m = wins.markets;
    const mw = Math.min(620, area.width*.40), mh = Math.min(420, area.height*.52);
    Object.assign(m.style, {width:mw+'px', height:mh+'px', left:(area.width - mw - 28)+'px', top:'56px'});
    openApp('about'); const a = wins.about;
    const aw = Math.min(860, area.width - mw - 90), ah = Math.min(600, area.height - 110);
    Object.assign(a.style, {width:aw+'px', height:ah+'px', left:'28px', top:Math.max(18,(area.height - ah - 80)/2)+'px'});
  } else openApp('about');
};
EOS.enter = () => { if (!phone()) EOS.defaultWindows(); };
document.addEventListener('DOMContentLoaded', () => { if (!EOS.locked) EOS.enter(); });
})();
