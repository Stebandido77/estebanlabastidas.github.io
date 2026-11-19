/* EL·IA (Estebania): asistente que responde sobre Esteban con una red neuronal propia, sin LLM ni API.
   Inferencia: js/elia-net.js. Pesos: assets/data/elia-model.js (se cargan al abrir la app).
   Contenido (respuestas, keys, reglas, textos de la interfaz): DATA.elia en assets/data/content.js.
   Flujo por pregunta: reglas sociales → red + keys → decide(): responder, "¿Te refieres a…?" o correo.
   Las preguntas sin respuesta se guardan en este navegador (Terminal: elia misses). */
(() => {
const EOS = window.EOS, {D, $, esc} = EOS;
const E = D.elia, NET = () => window.EliaNet;
const byId = Object.fromEntries(E.intents.map(i => [i.id, i]));
const MISS_KEY = 'eos.elia.misses', MISS_MAX = 50;
const MODEL_SRC = 'assets/data/elia-model.js';

/* ── idioma: marcas simples del español frente al inglés; si empata, el último usado ── */
const ES_W = new Set('que qué cómo como quién quien dónde donde cuál cual cuándo por para es el la los las de del un una sobre tiene hace hizo cuéntame háblame dime tu tus sus proyectos trabajo hola gracias chao adiós sí también eres estás está y o con sin más'.split(' '));
const EN_W = new Set('what how who where which when why is are the a an of about does did do tell me you your his he it its projects work hi hello thanks bye yes also with without more can'.split(' '));
let lang = /^es\b/i.test(navigator.language || '') ? 'es' : 'en';
function detect(q) {
  if (/[¿¡ñáéíóú]/i.test(q)) return 'es';
  let es = 0, en = 0;
  for (const w of q.toLowerCase().split(/[^a-záéíóúñü]+/)) { if (ES_W.has(w)) es++; if (EN_W.has(w)) en++; }
  return es > en ? 'es' : en > es ? 'en' : lang;
}
const U = k => E.ui[lang][k];

/* ── carga perezosa del modelo (script, así funciona también en file://) ── */
let modelP = null, K = null;
function loadModel() {
  if (window.ELIA_MODEL) return Promise.resolve(window.ELIA_MODEL);
  return modelP = modelP || new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = MODEL_SRC; s.async = true;
    s.onload = () => window.ELIA_MODEL ? ok(window.ELIA_MODEL) : ko(new Error('no model'));
    s.onerror = () => { modelP = null; ko(new Error('model failed to load')); };
    document.head.appendChild(s);
  });
}

/* ── preguntas sin respuesta: solo en este navegador ── */
function readMisses() { try { return JSON.parse(localStorage.getItem(MISS_KEY)) || []; } catch { return []; } }
function logMiss(q, top) {
  try {
    const m = readMisses(); m.push({q, top, lang, at: new Date().toISOString()});
    localStorage.setItem(MISS_KEY, JSON.stringify(m.slice(-MISS_MAX)));
  } catch { /* sin almacenamiento: no pasa nada */ }
}

/* ── respuesta a una pregunta (también la usa la Terminal) ── */
async function think(q) {
  const M = await loadModel();
  K = K || NET().compileKeys(E);
  const r = NET().ask(M, q, K, E);
  return {r, d: NET().decide(r, E)};
}

const appName = id => (EOS.appById[id] || {}).name || id;
function bodyOf(it, wantHow) {
  if (it.dynamic === 'chron') {
    return `<p>${esc(U('latest'))}</p><ul>${D.chron.slice(0, 3).map(c => `<li><b>${esc(c.d)}</b> — ${c.b}</li>`).join('')}</ul>`;
  }
  const how = wantHow && it.how ? it.how[lang] : null;
  return `<p>${esc(how || it.a[lang])}</p>`;
}

EOS.register('elia', {
  render: () => `<div class="elia">
    <div class="elia-log scroll" role="log" aria-live="polite" aria-label="${esc(E.ui.en.log)}"></div>
    <div class="elia-chips" role="group" aria-label="${esc(E.ui.en.chipsLabel)}"></div>
    <form class="elia-in" autocomplete="off">
      <input name="q" aria-label="${esc(E.ui.en.input)}" placeholder="${esc(E.ui[lang].placeholder)}" maxlength="300" spellcheck="false">
      <button class="btn pri" type="submit">${esc(E.ui[lang].send)}</button>
    </form>
    <p class="elia-note">${esc(E.ui[lang].note)}</p>
  </div>`,

  init(w, sel) {
    const log = $('.elia-log', w), form = $('.elia-in', w), input = form.q, chips = $('.elia-chips', w);

    const add = (who, html) => {
      const d = document.createElement('div');
      d.className = 'msg ' + who;
      d.innerHTML = html;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
      return d;
    };
    const say = html => add('bot', html);
    const renderChips = () => {
      chips.innerHTML = E.chips[lang].map(c => `<button class="chip" type="button">${esc(c)}</button>`).join('');
      input.placeholder = U('placeholder');
      $('button[type=submit]', form).textContent = U('send');
      $('.elia-note', w).textContent = U('note');
    };

    /* botones de una respuesta: cómo / resumen, abrir apps, enlaces */
    function answer(it, wantHow) {
      const m = say(`<div class="a">${bodyOf(it, wantHow)}</div><div class="acts"></div>`);
      const acts = $('.acts', m), a = $('.a', m);
      if (it.how) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn';
        let showingHow = !!wantHow;
        const label = () => { b.textContent = showingHow ? U('overview') : U('how'); };
        label();
        b.onclick = () => { showingHow = !showingHow; a.innerHTML = bodyOf(it, showingHow); label(); };
        acts.appendChild(b);
      }
      for (const [app, s] of it.open || []) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn';
        b.textContent = `${U('open')} ${appName(app)}`;
        b.onclick = () => EOS.openApp(app, s);
        acts.appendChild(b);
      }
      for (const [label, url] of it.links || []) {
        const l = document.createElement('a');
        l.className = 'btn'; l.href = url; l.target = '_blank'; l.rel = 'noopener';
        l.textContent = label + ' ↗';
        acts.appendChild(l);
      }
      if (!acts.children.length) acts.remove();
    }

    const mailDraft = q => ({subject: U('mailSubject'), body: q ? U('mailBody').replace('{q}', q) : ''});

    function offerMail(q, oos) {
      const m = say(`<p>${esc(oos ? U('oos') : U('miss'))}</p><div class="acts"></div>`);
      const acts = $('.acts', m);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn pri'; b.textContent = U('writeEsteban');
      b.onclick = () => EOS.openApp('mail', mailDraft(q));
      acts.appendChild(b);
      if (E.formEndpoint) {
        const f = document.createElement('button');
        f.type = 'button'; f.className = 'btn'; f.textContent = U('sendHere');
        f.onclick = () => { f.remove(); sendForm(m, q); };
        acts.appendChild(f);
      }
    }

    /* formulario opcional (Formspree / Web3Forms): ver tools/elia/README.md */
    function sendForm(m, q) {
      const f = document.createElement('form');
      f.className = 'elia-form';
      f.innerHTML = `<label>${esc(U('formMsg'))}<textarea name="message" rows="3" required>${esc(q)}</textarea></label>
        <label>${esc(U('formEmail'))}<input name="email" type="email" autocomplete="email"></label>
        <div class="acts"><button class="btn pri" type="submit">${esc(U('send'))}</button></div>`;
      m.appendChild(f);
      f.onsubmit = async e => {
        e.preventDefault();
        const btn = $('button', f); btn.disabled = true;
        const data = {message: f.message.value, email: f.email.value, source: 'EL·IA'};
        if (E.formAccessKey) data.access_key = E.formAccessKey;
        try {
          const res = await fetch(E.formEndpoint, {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify(data)});
          if (!res.ok) throw new Error(res.status);
          f.outerHTML = `<p>${esc(U('formOk'))}</p>`;
        } catch {
          btn.disabled = false;
          f.insertAdjacentHTML('beforeend', `<p class="err">${esc(U('formErr'))}</p>`);
        }
      };
      f.message.focus();
    }

    async function ask(q) {
      q = q.trim().slice(0, 300);
      if (!q) return;
      lang = detect(q);
      renderChips();
      add('me', `<p>${esc(q)}</p>`);
      const wait = say(`<p class="dots">${esc(U('thinking'))}</p>`);
      let res;
      try { res = await think(q); } catch { wait.innerHTML = `<p>${esc(U('loadErr'))}</p>`; return; }
      wait.remove();
      const {r, d} = res, top = r.ranked[0][0];
      const wantHow = r.how >= E.howThreshold;
      if (d === 'answer') return answer(byId[top], wantHow);
      if (d === 'clarify') {
        const opts = r.ranked.filter(([id]) => id !== 'out_of_scope').slice(0, 3);
        const m = say(`<p>${esc(U('clarify'))}</p><div class="acts"></div>`);
        const acts = $('.acts', m);
        for (const [id] of opts) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'btn'; b.textContent = byId[id].t[lang];
          b.onclick = () => { add('me', `<p>${esc(byId[id].t[lang])}</p>`); answer(byId[id], wantHow); };
          acts.appendChild(b);
        }
        const none = document.createElement('button');
        none.type = 'button'; none.className = 'btn'; none.textContent = U('none');
        none.onclick = () => { logMiss(q, top); offerMail(q, false); };
        acts.appendChild(none);
        return;
      }
      logMiss(q, top);
      offerMail(q, top === 'out_of_scope');
    }

    form.onsubmit = e => { e.preventDefault(); const q = input.value; input.value = ''; ask(q); };
    chips.onclick = e => { const c = e.target.closest('.chip'); if (c) ask(c.textContent); };
    w._select = s => { if (s && s.q) ask(s.q); };

    renderChips();
    say(`<p>${esc(byId.greeting.a[lang])}</p>`);
    /* Carga diferida de los pesos (~350 KB): al primer foco en el campo, al acercarse a un chip o
       cuando el navegador quede libre después de cargar la página; nunca compite con el arranque. */
    const warm = () => loadModel().catch(() => {});
    input.addEventListener('focus', warm, {once: true});
    chips.addEventListener('pointerenter', warm, {once: true});
    const idle = () => (window.requestIdleCallback ? requestIdleCallback(warm, {timeout: 8000}) : setTimeout(warm, 3000));
    if (document.readyState === 'complete') idle(); else addEventListener('load', idle, {once: true});
    if (sel && sel.q) ask(sel.q);
    /* el campo recibe el foco solo si EL·IA quedó al frente (al abrirla desde el Dock o Spotlight),
       no cuando abre junto con About al entrar al escritorio */
    else setTimeout(() => { if (w.classList.contains('front') && !matchMedia('(max-width:899px)').matches) input.focus({preventScroll: true}); }, 30);
  },

  search: () => [{g: 'Ask EL·IA', s: 'Assistant', a: 'elia', k: 'elia estebania ask assistant chat bot pregunta preguntar asistente'}],
});

/* ── Terminal: ask <pregunta> · elia misses · elia clear ── */
EOS.termCommands.ask = (_, rest) => {
  if (!rest) return '<span class="m">usage:</span> ask &lt;question&gt;';
  EOS.openApp('elia', {q: rest});
  return 'asking EL·IA…';
};
EOS.termCommands.elia = arg => {
  if (arg === 'misses') {
    const m = readMisses();
    return m.length ? m.map(x => `${esc(x.at.slice(0, 10))}  <span class="k">${esc(x.q)}</span>  <span class="m">(${esc(x.top)})</span>`).join('<br>')
      : '<span class="m">no unanswered questions in this browser</span>';
  }
  if (arg === 'clear') { try { localStorage.removeItem(MISS_KEY); } catch {} return 'cleared'; }
  EOS.openApp('elia');
  return 'opening EL·IA… <span class="m">(also: elia misses · elia clear · ask &lt;question&gt;)</span>';
};
})();
