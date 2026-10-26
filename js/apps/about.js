/* About: animated portrait, name, kicker, thesis, meta, bio, interests and actions. */
(() => {
const EOS = window.EOS, {D, $, esc} = EOS;
EOS.register('about', {
  render: () => `
  <div class="scroll" style="flex:1"><div class="about">
    <div>
      <div class="pframe"><canvas data-portrait aria-label="Portrait of Esteban Labastidas, formed from words" role="img"></canvas></div>
      <div class="pctl"><button class="btn" data-replay>↻ Replay</button><button class="btn" data-toggle-words>Show words</button></div>
    </div>
    <div>
      <h2>Esteban<br><em>Labastidas</em></h2>
      <p class="kicker">Economist · Banker · Builder</p>
      <p class="thesis">“${esc(D.thesis.replace(/^[\s“"]+|[\s”"]+$/g,''))}”</p>
      <dl class="meta">${D.heroMeta.map(([k,v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="bio">${D.bio}</p>
      <div class="tags">${D.interests.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="acts"><button class="btn pri" data-open="research">Read the papers</button><button class="btn" data-open="projects">See projects</button><button class="btn" data-open="path">Résumé</button><button class="btn" data-open="mail">Write to me</button></div>
    </div>
  </div></div>`,
  init(w){
    const p = EOS.portrait($('[data-portrait]', w));
    const tg = $('[data-toggle-words]', w);
    $('[data-replay]', w).onclick = () => { tg.textContent = 'Show words'; p.play('anim'); };
    tg.onclick = () => { if (p.mode() === 'words'){ tg.textContent = 'Show words'; p.showPhoto(); } else { tg.textContent = 'Show photo'; p.play('words'); } };
    w._stop = p.stop;
  }
});
})();
