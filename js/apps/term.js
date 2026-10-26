/* Terminal: help, whoami, open <app>, apps, papers, projects, cv, contact, clear. */
(() => {
const EOS = window.EOS, {D, $, esc} = EOS;
EOS.termCommands = {};   /* other modules can add commands (e.g. music) */
EOS.register('term', {
  render: () => `<div class="term" data-term></div>`,
  init(w){
    const t = $('[data-term]', w);
    const line = h => { const d=document.createElement('div'); d.innerHTML=h; t.appendChild(d); };
    const CMD = {
      help: () => `<span class="m">commands:</span> whoami · open &lt;app&gt; · apps · papers · projects · cv · contact · ${Object.keys(EOS.termCommands).map(k => k+' · ').join('')}clear`,
      whoami: () => `<span class="k">Esteban David Labastidas Martínez</span> — economist, banker, builder. Bogotá.`,
      apps: () => EOS.APPS.map(a=>a.id).join('  '),
      papers: () => EOS.PAPERS.map(p=>`${esc(p.num)}  ${esc(p.title)}`).join('<br>'),
      projects: () => EOS.PROJ.map(p=>`${esc(p.no)}  ${esc(p.plain)}`).join('<br>'),
      cv: () => `<a href="${D.contact.cv}" target="_blank" rel="noopener" style="color:var(--amber-hi)">CV_Esteban_Labastidas.pdf ↗</a>`,
      contact: () => { EOS.openApp('mail'); return 'opening Mail…'; },
      clear: () => { t.innerHTML=''; return null; }
    };
    const prompt = () => { const d=document.createElement('div'); d.className='in'; d.innerHTML=`<span class="p">esteban@bogota ~ %</span><input aria-label="Command" spellcheck="false" autocomplete="off">`; t.appendChild(d);
      const i=$('input',d); i.focus({preventScroll:true});
      i.onkeydown = e => { if(e.key!=='Enter') return; const v=i.value.trim(); d.innerHTML=`<span class="p">esteban@bogota ~ %</span> ${esc(v)}`;
        const [c,arg]=v.toLowerCase().split(/\s+/); let out;
        const ext = EOS.termCommands[c];
        if(c==='open'){ if(EOS.appById[arg]){ EOS.openApp(arg); out=`opening ${EOS.appById[arg].name}…`; } else out=`<span class="m">no such app. try</span> apps`; }
        else if(!c) out=null; else out = CMD[c] ? CMD[c]() : ext ? ext(arg) : `<span class="m">zsh: command not found: ${esc(c)} — try</span> help`;
        if(out!=null) line(out); prompt(); t.scrollTop=t.scrollHeight; }; };
    line(`<span class="m">Last login: ${new Date().toDateString()} · type</span> <span class="k">help</span>`); prompt();
    t.addEventListener('click', () => { const i=$('input',t); i&&i.focus(); });
  }
});
})();
