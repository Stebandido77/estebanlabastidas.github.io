/* EL·IA: inferencia de la red neuronal, en JavaScript puro y sin dependencias.
   Lo usan js/apps/elia.js (en el navegador) y tools/elia/test_parity.mjs (en Node).
   Las features DEBEN coincidir con tools/elia/common.py (ver la especificación allí):
     normalizar → n-gramas (palabras 1–2, caracteres 3–5) → FNV-1a 32 bits mod 4096 → log(1+x) → L2.
   Red: x (4096) → oculta 64 ReLU → softmax(logits / T) sobre las intenciones,
        y de la misma capa oculta → sigmoide para asks_how.
   Encima va la capa de palabras clave (keys de cada intención en content.js): ver ask().
   Los pesos llegan en window.ELIA_MODEL (assets/data/elia-model.js), cuantizados a int8 con una
   escala por capa: peso real = q × escala. */
(function (root) {
  'use strict';

  function normalize(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function tokens(norm, charN) {
    const words = norm ? norm.split(' ') : [], out = [];
    for (const w of words) out.push('w:' + w);
    for (let i = 0; i + 1 < words.length; i++) out.push('b:' + words[i] + ' ' + words[i + 1]);
    if (norm) {
      const s = ' ' + norm + ' ';
      for (const n of charN) for (let i = 0; i + n <= s.length; i++) out.push('c:' + s.slice(i, i + n));
    }
    return out;
  }

  /* FNV-1a de 32 bits. Tras normalizar el texto es ASCII, así que cada carácter es un byte UTF-8. */
  function fnv1a(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }

  /* vector disperso: {idx: [...], val: [...]} con log(1+conteo) y norma L2 = 1 */
  function featurize(text, dim, charN) {
    const counts = new Map();
    for (const t of tokens(normalize(text), charN)) { const k = fnv1a(t) % dim; counts.set(k, (counts.get(k) || 0) + 1); }
    const idx = [], val = []; let ss = 0;
    for (const [k, c] of counts) { const v = Math.log1p(c); idx.push(k); val.push(v); ss += v * v; }
    const n = Math.sqrt(ss);
    for (let i = 0; i < val.length; i++) val[i] /= n || 1;
    return {idx, val};
  }

  function decodeInt8(b64) {
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Int8Array(u.buffer);
  }

  function load(M) {
    if (M._net) return M._net;
    const net = {M, H: M.hidden, K: M.intents.length,
      W1: decodeInt8(M.W1.q), s1: M.W1.s, W2: decodeInt8(M.W2.q), s2: M.W2.s, Wh: decodeInt8(M.Wh.q), sh: M.Wh.s};
    Object.defineProperty(M, '_net', {value: net});
    return net;
  }

  /* → {probs: [K], how: 0..1, ranked: [[intentId, p], …] de mayor a menor} */
  function predict(M, text) {
    const net = load(M), {H, K} = net, x = featurize(text, M.dim, M.charN);
    const a = new Float64Array(H);
    for (let t = 0; t < x.idx.length; t++) {
      const row = x.idx[t] * H, v = x.val[t];
      for (let j = 0; j < H; j++) a[j] += v * net.W1[row + j];
    }
    for (let j = 0; j < H; j++) { const z = M.b1[j] + net.s1 * a[j]; a[j] = z > 0 ? z : 0; }
    const logits = new Float64Array(K);
    for (let j = 0; j < H; j++) { if (!a[j]) continue; const row = j * K; for (let k = 0; k < K; k++) logits[k] += a[j] * net.W2[row + k]; }
    let mx = -Infinity;
    for (let k = 0; k < K; k++) { logits[k] = (M.b2[k] + net.s2 * logits[k]) / M.T; if (logits[k] > mx) mx = logits[k]; }
    let sum = 0; const probs = new Array(K);
    for (let k = 0; k < K; k++) { probs[k] = Math.exp(logits[k] - mx); sum += probs[k]; }
    for (let k = 0; k < K; k++) probs[k] /= sum;
    let hz = 0;
    for (let j = 0; j < H; j++) hz += a[j] * net.Wh[j];
    const how = 1 / (1 + Math.exp(-(M.bh + net.sh * hz)));
    const ranked = M.intents.map((id, k) => [id, probs[k]]).sort((p, q) => q[1] - p[1]);
    return {probs, how, ranked};
  }

  /* ── Keys, guardia de fuera de alcance y reglas sociales (la misma especificación que tools/elia/common.py) ──
     Una frase coincide si sus palabras aparecen seguidas en la pregunta normalizada; cada palabra debe ser
     igual, empezar por la del key si esta tiene ≥ 6 letras, o, si las dos tienen ≥ 5 letras, estar a
     distancia de Levenshtein ≤ 1.
     forcedIntent: regla social → greeting | goodbye | thanks; si no, una frase de oosCues.hard → out_of_scope
       (EL·IA nunca responde). En los dos casos no se usa la red para decidir.
     keyIntent: con una frase de oosCues (soft o hard) → nada; si no, keys fuertes de una sola intención → [id, 'strong'];
       si no hay fuertes, débiles de una sola → [id, 'weak']; dos o más intenciones → nada (decide la red).
     socialIntent: ≤ 4 palabras cubiertas solo por frases de UNA lista social (la más larga primero,
       coincidencia exacta) y palabras de relleno → greeting | goodbye | thanks. */
  /* a = palabra del key, b = palabra de la pregunta */
  function near(a, b) {
    if (a === b) return true;
    if (a.length >= 6 && b.startsWith(a)) return true;   /* contactar → contactarte, contratar → contratarlo */
    if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++d > 1) return false; return d === 1; }
    const s = a.length < b.length ? a : b, l = a.length < b.length ? b : a;
    let i = 0;
    while (i < s.length && s[i] === l[i]) i++;
    return s.slice(i) === l.slice(i + 1);
  }

  const words = t => normalize(t).split(' ').filter(Boolean);
  const phrases = list => (list || []).map(words).filter(p => p.length);
  /* keys de una intención → [{w: palabras, exact}]; "=resume" es exacto: sin distancia de una letra ni prefijo */
  const keyPhrases = list => (list || []).map(k => {
    const exact = k.startsWith('=');
    return {w: words(exact ? k.slice(1) : k), exact};
  }).filter(p => p.w.length);
  function contains(q, kt, exact) {
    const eq = exact ? (a, b) => a === b : near;
    for (let s = 0; s + kt.length <= q.length; s++) if (kt.every((w, j) => eq(w, q[s + j]))) return true;
    return false;
  }

  /* elia = DATA.elia → {strong: [[id, frases]], weak: [[id, frases]], hard: frases, soft: frases, social} */
  function compileKeys(elia) {
    const cues = elia.oosCues || {};
    const K = {strong: [], weak: [], hard: phrases(cues.hard), soft: phrases(cues.soft), social: null};
    for (const it of elia.intents) {
      const s = keyPhrases(it.keys), w = keyPhrases(it.weak);
      if (s.length) K.strong.push([it.id, s]);
      if (w.length) K.weak.push([it.id, w]);
    }
    const so = elia.social || {};
    K.social = {lists: SOCIAL.map(id => [id, phrases(so[id]).sort((a, b) => b.length - a.length)]),
                filler: new Set(phrases(so.filler).flat())};
    return K;
  }
  const SOCIAL = ['greeting', 'goodbye', 'thanks'];

  function keyHits(text, list) {
    const q = words(text);
    return list.filter(([, keys]) => keys.some(k => contains(q, k.w, k.exact))).map(([id]) => id);
  }

  function keyIntent(text, K) {
    const q = words(text);
    if (K.hard.concat(K.soft).some(c => contains(q, c))) return [null, null];
    for (const kind of ['strong', 'weak']) {
      const h = keyHits(text, K[kind]);
      if (h.length === 1) return [h[0], kind];
      if (h.length) return [null, null];
    }
    return [null, null];
  }

  function socialIntent(text, K) {
    const q = words(text);
    if (!q.length || q.length > 4) return null;
    const found = new Set();
    let i = 0;
    while (i < q.length) {
      let best = null;
      for (const [id, ps] of K.social.lists) {
        const m = ps.find(p => p.every((w, j) => q[i + j] === w));
        if (m && (!best || m.length > best[1].length)) best = [id, m];
      }
      if (best) { found.add(best[0]); i += best[1].length; }
      else if (K.social.filler.has(q[i])) i++;
      else return null;
    }
    return found.size === 1 ? [...found][0] : null;
  }

  function forcedIntent(text, K) {
    const s = socialIntent(text, K);
    if (s) return s;
    const q = words(text);
    return K.hard.some(c => contains(q, c)) ? 'out_of_scope' : null;
  }

  /* Combina la red con las reglas (cfg = DATA.elia):
       forzada p = [intención]                     (social u oosCues.hard → out_of_scope, sin red)
       fuerte  p = keyWeight · p_red + (1 − keyWeight) · [intención]
       débil   p ∝ p_red · e^weakBonus en la intención          (nunca basta sin la red)
     asks_how no cambia: siempre sale de la red. */
  function hybrid(M, r, rule, cfg) {
    const idx = id => (id ? M.intents.indexOf(id) : -1);
    let probs = r.probs.slice();
    const k = idx(rule.key), s = idx(rule.forced);
    if (k >= 0 && rule.kind === 'strong' && cfg.keyWeight < 1) {
      probs = probs.map((p, j) => cfg.keyWeight * p + (j === k ? 1 - cfg.keyWeight : 0));
    } else if (k >= 0 && rule.kind === 'weak' && cfg.weakBonus > 0) {
      probs[k] *= Math.exp(cfg.weakBonus);
      const sum = probs.reduce((a, b) => a + b, 0);
      probs = probs.map(p => p / sum);
    }
    if (s >= 0) probs = probs.map((_, j) => (j === s ? 1 : 0));
    const ranked = M.intents.map((id, j) => [id, probs[j]]).sort((p, q) => q[1] - p[1]);
    return {probs, how: r.how, ranked, key: rule.key, kind: rule.kind, forced: rule.forced};
  }

  /* Lo que usa la app: K = compileKeys(DATA.elia), cfg = DATA.elia. */
  function ask(M, text, K, cfg) {
    const [key, kind] = keyIntent(text, K);
    return hybrid(M, predict(M, text), {key, kind, forced: forcedIntent(text, K)}, cfg);
  }

  /* Regla de decisión (la misma que usa tools/elia/train.py para el reporte):
       answer   la 1.ª no es out_of_scope, p1 ≥ threshold y p1 − p2 ≥ margin
       clarify  no se responde, la 1.ª no es out_of_scope y p1 ≥ clarify  → "¿Te refieres a…?"
       miss     todo lo demás → ofrecer escribirle a Esteban */
  function decide(r, cfg) {
    const [[id, p1], [, p2]] = r.ranked;
    if (id !== 'out_of_scope' && p1 >= cfg.threshold && p1 - p2 >= cfg.margin) return 'answer';
    if (id !== 'out_of_scope' && p1 >= cfg.clarify) return 'clarify';
    return 'miss';
  }

  const api = {normalize, tokens, fnv1a, featurize, predict, decide, near, compileKeys, keyHits, keyIntent, socialIntent, forcedIntent, hybrid, ask};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EliaNet = api;
})(typeof window !== 'undefined' ? window : globalThis);
