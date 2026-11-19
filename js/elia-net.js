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

  /* ── Capa de palabras clave (la misma regla que tools/elia/common.py) ──
     Un key coincide si sus palabras aparecen seguidas en la pregunta normalizada; cada palabra debe
     ser igual o, si las dos tienen ≥ 5 letras, estar a distancia de Levenshtein ≤ 1.
     Si coinciden keys de una sola intención, se devuelve esa; si de dos o más, null (decide la red). */
  function near(a, b) {
    if (a === b) return true;
    if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++d > 1) return false; return d === 1; }
    const s = a.length < b.length ? a : b, l = a.length < b.length ? b : a;
    let i = 0;
    while (i < s.length && s[i] === l[i]) i++;
    return s.slice(i) === l.slice(i + 1);
  }

  /* intents: DATA.elia.intents → [[id, [[palabras del key], …]], …] */
  function compileKeys(intents) {
    const out = [];
    for (const it of intents) {
      const ks = (it.keys || []).map(k => normalize(k)).filter(Boolean).map(k => k.split(' '));
      if (ks.length) out.push([it.id, ks]);
    }
    return out;
  }

  function keyHits(text, compiled) {
    const q = normalize(text).split(' ').filter(Boolean), hits = [];
    for (const [id, keys] of compiled) {
      const hit = keys.some(kt => {
        for (let s = 0; s + kt.length <= q.length; s++) if (kt.every((w, j) => near(w, q[s + j]))) return true;
        return false;
      });
      if (hit) hits.push(id);
    }
    return hits;
  }

  function matchKeys(text, compiled) {
    const h = keyHits(text, compiled);
    return h.length === 1 ? h[0] : null;
  }

  /* Mezcla la salida de la red con la intención del key (cfg.keyMode / cfg.keyWeight de content.js):
       mix    p = w · p_red + (1 − w) · [intención del key]
       bonus  p ∝ p_red · e^w en la intención del key
     asks_how no cambia: siempre sale de la red. */
  function hybrid(M, r, keyId, cfg) {
    const k = keyId ? M.intents.indexOf(keyId) : -1;
    if (k < 0 || !cfg.keyMode || cfg.keyMode === 'none') return Object.assign({}, r, {key: null});
    let probs;
    if (cfg.keyMode === 'mix') probs = r.probs.map((p, j) => cfg.keyWeight * p + (j === k ? 1 - cfg.keyWeight : 0));
    else {
      probs = r.probs.map((p, j) => j === k ? p * Math.exp(cfg.keyWeight) : p);
      const s = probs.reduce((a, b) => a + b, 0);
      probs = probs.map(p => p / s);
    }
    const ranked = M.intents.map((id, j) => [id, probs[j]]).sort((p, q) => q[1] - p[1]);
    return {probs, how: r.how, ranked, key: keyId};
  }

  /* Red + keys: lo que usa la app. compiled = compileKeys(DATA.elia.intents), cfg = DATA.elia. */
  function ask(M, text, compiled, cfg) {
    return hybrid(M, predict(M, text), matchKeys(text, compiled), cfg);
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

  const api = {normalize, tokens, fnv1a, featurize, predict, decide, near, compileKeys, keyHits, matchKeys, hybrid, ask};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EliaNet = api;
})(typeof window !== 'undefined' ? window : globalThis);
