/* Research: library sidebar filtered by status, paper list and detail; includes "On the desk". */
(() => {
const EOS = window.EOS, {$, $$, esc, STATUS, ALLP} = EOS;
EOS.register('research', {
  render(){
    const cats = [['all','All papers',ALLP.length],...['review','ssrn','soon','progress','published','wp','desk'].map(k => [k, k==='desk'?'On the desk':STATUS[k][0], ALLP.filter(p=>p.k===k).length]).filter(c=>c[2])];
    return `<div class="wb">
      <div class="side"><h5>Library</h5>${cats.map(([k,n,c],i) => `<button data-cat="${k}" class="${i?'':'on'}">${esc(n)}<span>${c}</span></button>`).join('')}</div>
      <div class="list scroll" data-list></div>
      <div class="detail scroll" data-detail></div>
    </div>`;
  },
  init(w, sel){
    let cat = 'all', cur = sel || ALLP[0].id;
    const list = $('[data-list]', w), det = $('[data-detail]', w);
    const draw = () => {
      const items = ALLP.filter(p => cat==='all' || p.k===cat);
      if (!items.find(p => p.id===cur)) cur = items[0] && items[0].id;
      list.innerHTML = items.map(p => `<button class="row ${p.id===cur?'on':''}" data-id="${p.id}"><div class="h"><span>${esc(p.num)}</span><span class="chip ${STATUS[p.k][1]}">${esc(STATUS[p.k][0])}</span></div><div class="t">${esc(p.title)}</div><div class="s">${esc(p.subtitle||p.venue||'')}</div></button>`).join('');
      const p = ALLP.find(x => x.id===cur);
      det.innerHTML = p ? `<div class="h"><span>${esc(p.num)}</span><span class="chip ${STATUS[p.k][1]}">${esc(p.k==='review'?p.status:STATUS[p.k][0])}</span></div>
        <h3>${esc(p.title)}</h3>${p.subtitle?`<p class="sub">${esc(p.subtitle)}</p>`:''}<p class="venue">${esc(p.venue)}</p>
        <p class="abs">${esc(p.abstract)}</p><p class="tg">${esc(p.tags)}</p>
        ${p.link?`<a class="btn pri" href="${p.link}" target="_blank" rel="noopener">${esc(p.linkLabel||'Read ↗')}</a>`:''}` : '';
      det.scrollTop = 0;
      $$('.row', list).forEach(b => b.onclick = () => { cur = b.dataset.id; draw(); });
    };
    $$('[data-cat]', w).forEach(b => b.onclick = () => { cat = b.dataset.cat; $$('[data-cat]', w).forEach(x => x.classList.toggle('on', x===b)); draw(); });
    w._select = id => { cat='all'; $$('[data-cat]', w).forEach((x,i)=>x.classList.toggle('on',!i)); cur=id; draw(); };
    draw();
  },
  search: () => ALLP.map(p => ({g:p.title, s:'Paper · '+(STATUS[p.k][0]), a:'research', sel:p.id, k:p.title+' '+p.tags+' '+(p.abstract||'')})),
});
})();
