/* Projects: Finder with categories, colored folders per category and a detail panel. */
(() => {
const EOS = window.EOS, {$, $$, esc, PROJ} = EOS;
const folder = c => `<svg viewBox="0 0 64 52" aria-hidden="true"><path d="M2 9a4 4 0 0 1 4-4h17l6 6h29a4 4 0 0 1 4 4v31a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="${c[0]}"/><path d="M2 17h60v29a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="${c[1]}"/></svg>`;
const FC = {markets:['#9a7440','#d4a868'], research:['#7d2a34','#b04a56'], oss:['#2b5bc0','#4d82e6']};
EOS.register('projects', {
  render: () => `<div class="wb split proj">
    <div class="side"><h5>Favorites</h5>
      <button data-pc="all" class="on">All projects<span>${PROJ.length}</span></button>
      <button data-pc="markets">Banking &amp; markets<span>${PROJ.filter(p=>p.c==='markets').length}</span></button>
      <button data-pc="research">Research systems<span>${PROJ.filter(p=>p.c==='research').length}</span></button>
      <button data-pc="oss">Products &amp; open source<span>${PROJ.filter(p=>p.c==='oss').length}</span></button>
      <h5>Elsewhere</h5>
      <button data-ext="${EOS.D.contact.github}">GitHub ↗</button>
      <button data-ext="${EOS.D.contact.kaggle}">Kaggle ↗</button>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0"><div class="grid scroll" style="flex:1" data-grid></div><div class="pdet" data-pdet></div></div>
  </div>`,
  init(w, sel){
    let c = 'all', cur = sel || PROJ[0].n;
    const grid = $('[data-grid]', w), det = $('[data-pdet]', w);
    const draw = () => {
      const items = PROJ.filter(p => c==='all' || p.c===c);
      if (!items.find(p => p.n===cur)) cur = items[0].n;
      grid.innerHTML = items.map(p => `<button class="fi ${p.n===cur?'on':''}" data-n="${p.n}">${folder(FC[p.c])}<span class="nm">${esc(p.plain.split(' — ')[0].replace(/ \(ABI\)/,''))}</span></button>`).join('');
      const p = PROJ.find(x => x.n===cur);
      det.innerHTML = `<div class="no">${esc(p.no)}</div><h3>${p.t.replace('project__live','live')}</h3><div class="tg">${esc(p.tags)}</div><p>${p.b.replace(/class="project__link"/g,'')}</p>`;
      $$('.fi', grid).forEach(b => { b.onclick = () => { cur = b.dataset.n; draw(); }; });
    };
    $$('[data-pc]', w).forEach(b => b.onclick = () => { c = b.dataset.pc; $$('[data-pc]', w).forEach(x => x.classList.toggle('on', x===b)); draw(); });
    $$('[data-ext]', w).forEach(b => b.onclick = () => { const a=document.createElement('a'); a.href=b.dataset.ext; a.target='_blank'; a.rel='noopener'; a.click(); });
    w._select = n => { c='all'; $$('[data-pc]', w).forEach((x,i)=>x.classList.toggle('on',!i)); cur=n; draw(); };
    draw();
  },
  search: () => PROJ.map(p => ({g:p.plain, s:'Project · '+p.no, a:'projects', sel:p.n, k:p.plain+' '+p.tags+' '+p.b})),
});
})();
