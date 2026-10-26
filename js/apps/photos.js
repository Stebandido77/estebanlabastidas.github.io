/* Photos ("The Eye"): plate grid and a viewer with previous/next navigation. */
(() => {
const EOS = window.EOS, {D, $, $$, esc, setTitle} = EOS;
const small = src => src.replace(/\.jpg$/, '-1400.jpg');   /* tools/plates.py; the original is only for "Open full size" */
EOS.register('photos', {
  render: () => `<div class="wb"><div class="scroll" style="flex:1" data-pg></div></div>`,
  init(w){
    const host = $('[data-pg]', w), P = D.plates;
    const grid = () => { host.innerHTML = `<div class="pgrid${P.length <= 4 ? ' fit' : ''}">${P.map((p,i) => `<button data-i="${i}"><img src="${small(p.img)}" alt="" loading="lazy" decoding="async"><span>${esc(p.t)}</span></button>`).join('')}</div>`;
      $$('[data-i]', host).forEach(b => b.onclick = () => view(+b.dataset.i)); setTitle(w, 'Photos — The Eye'); };
    const view = i => { const p = P[i];
      host.innerHTML = `<div class="pview" style="height:100%"><div class="sbar"><button class="btn" data-back>‹ All plates</button><span style="flex:1"></span><button class="btn" data-prev aria-label="Previous">‹</button><button class="btn" data-next aria-label="Next">›</button><a class="btn" href="${p.img}" target="_blank" rel="noopener">Open full size ↗</a></div>
        <div class="im"><img src="${small(p.img)}" alt="${esc(p.t)}" decoding="async"></div>
        <div class="cap"><div><small>${esc(p.k)} · ${esc(p.tags)}</small><h4>${esc(p.t)}</h4><p>${esc(p.d)}</p></div></div></div>`;
      $('[data-back]', host).onclick = grid;
      $('[data-prev]', host).onclick = () => view((i+P.length-1)%P.length);
      $('[data-next]', host).onclick = () => view((i+1)%P.length);
      setTitle(w, p.t); };
    grid();
  },
  search: () => D.plates.map(p => ({g:p.t, s:'Plate · The Eye', a:'photos', k:p.t+' '+p.tags})),
});
})();
