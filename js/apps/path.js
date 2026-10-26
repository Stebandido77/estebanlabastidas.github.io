/* Résumé ("The Path"): paper-mode document with experience, formation, credentials and method. */
(() => {
const EOS = window.EOS, {D, esc} = EOS;
EOS.register('path', {
  render: () => `<div class="sbar" style="justify-content:space-between"><span style="color:var(--text-2);font-size:12px">Résumé — Esteban Labastidas</span><a class="btn" href="${D.contact.cv}" target="_blank" rel="noopener">Download PDF ↗</a></div>
  <div class="doc scroll" tabindex="0" role="region" aria-label="Résumé"><div class="page">
    <div class="eb">The Path · MMXXVI</div>
    <h2>${D.resumeTitle}</h2>
    <h3>Experience</h3>
    ${D.traj.map(t => `<div class="job"><div class="d">${esc(t.d)}</div><div><h4>${t.r}</h4><div class="o">${esc(t.o)}</div><p>${t.b}</p></div></div>`).join('')}
    <h3>Formation</h3>
    ${D.formation.map(f => `<div class="job"><div class="d">${f.m}</div><div><h4>${f.d}</h4><div class="o">${esc(f.o)}</div></div></div>`).join('')}
    <h3>Credentials</h3>
    ${D.credentials.map(c => `<div class="job"><div class="d">${esc(c.d)}</div><div><h4>${c.t}</h4><div class="o">${esc(c.o)}</div></div></div>`).join('')}
    <h3>The method</h3>
    <p style="font-size:13.5px;line-height:1.7;color:#3b352b;margin:14px 0 4px">${esc(D.methodIntro)}</p>
    <div class="pill4">${D.pillars.map(p => `<div><b><i>${esc(p.l)}</i>${esc(p.n)}</b><p>${p.b}</p><small>${esc(p.t)}</small></div>`).join('')}</div>
  </div></div>`,
  search: () => D.traj.map(t => ({g:t.r.replace(/&amp;/g,'&'), s:'Experience · '+t.o, a:'path', k:t.r+' '+t.o+' '+t.b})),
});
})();
