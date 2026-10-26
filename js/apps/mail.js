/* Mail ("Contact"): compose with Copy and "Open in Mail". */
(() => {
const EOS = window.EOS, {D, $, esc} = EOS;
const EMAIL = D.contact.email;
EOS.register('mail', {
  render: () => `<div class="mail">
    <div class="f"><label for="m-to">To:</label><input id="m-to" value="${EMAIL}" readonly><button class="btn" data-copy>Copy</button></div>
    <div class="f"><label for="m-sub">Subject:</label><input id="m-sub" value="${esc(D.mail.subject)}"><span></span></div>
    <textarea id="m-body" aria-label="Message">${esc(D.mail.body)}</textarea>
    <div class="foot"><small>${esc(D.mail.note)}</small>
      <span style="display:flex;gap:8px"><a class="btn" href="${D.contact.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a><a class="btn pri" data-send href="mailto:${EMAIL}">Open in Mail</a></span></div>
  </div>`,
  init(w){
    const upd = () => { $('[data-send]', w).href = `mailto:${EMAIL}?subject=${encodeURIComponent($('#m-sub',w).value)}&body=${encodeURIComponent($('#m-body',w).value)}`; };
    $('#m-sub', w).oninput = upd; $('#m-body', w).oninput = upd; upd();
    $('[data-copy]', w).onclick = async e => { const b=e.currentTarget; try{ await navigator.clipboard.writeText(EMAIL); b.textContent='Copied'; }catch{ const i=$('#m-to',w); i.select(); b.textContent='Selected'; } setTimeout(()=>b.textContent='Copy',1500); };
  }
});
})();
