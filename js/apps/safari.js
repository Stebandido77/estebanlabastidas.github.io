/* Safari ("Links"): favorites grid. */
(() => {
const EOS = window.EOS, {D, esc} = EOS;
EOS.register('safari', {
  render: () => `<div class="sbar"><span style="color:var(--text-2)" aria-hidden="true">‹ ›</span><div class="url">🔒 stebandido77.github.io</div><span></span></div>
  <div class="scroll" style="flex:1"><div class="fav"><h3>Favorites</h3><div class="g">${D.favorites.map(([n,u,g,c]) => `<a href="${u}" target="_blank" rel="noopener"><i style="background:${c};color:#fff" aria-hidden="true">${g}</i>${esc(n)}</a>`).join('')}</div></div></div>`,
});
})();
