/* Notes ("Writing"): X threads and essays. */
(() => {
const EOS = window.EOS, {D, $, $$, esc} = EOS;
EOS.register('notes', {
  render: () => `<div class="wb"><div class="nlist scroll" data-nl></div><div class="note scroll" data-nt></div></div>`,
  init(w){
    let cur = D.voice[0].id;
    const draw = () => {
      $('[data-nl]', w).innerHTML = D.voice.map(v => `<button class="row ${v.id===cur?'on':''}" data-id="${v.id}"><div class="t">${esc(v.t)}</div><div class="s">${esc(v.d)} · ${esc(v.b)}</div></button>`).join('');
      const v = D.voice.find(x => x.id===cur);
      $('[data-nt]', w).innerHTML = `<div class="d">${esc(v.d)}</div><h3>${esc(v.t)}</h3><p>${esc(v.b)}</p><div class="stats">${esc(v.s)}</div><a class="btn pri" href="${v.url}" target="_blank" rel="noopener">Read on X ↗</a>`;
      $$('.row', w).forEach(b => b.onclick = () => { cur = b.dataset.id; draw(); });
    };
    draw();
  },
  search: () => D.voice.map(v => ({g:v.t, s:'Note · X', a:'notes', k:v.t+' '+v.b})),
});
})();
