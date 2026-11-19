/* EL·IA: inferencia de la red neuronal, en JavaScript puro y sin dependencias.
   Lo usan js/apps/elia.js (en el navegador) y tools/elia/test_parity.mjs (en Node).
   Las features DEBEN coincidir con tools/elia/common.py (ver la especificación allí):
     normalizar → n-gramas (palabras 1–2, caracteres 3–5) → FNV-1a 32 bits mod 4096 → log(1+x) → L2.
   Red: x (4096) → oculta 64 ReLU → softmax(logits / T) sobre las intenciones,
        y de la misma capa oculta → sigmoide para asks_how.
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

  const api = {normalize, tokens, fnv1a, featurize, predict, decide};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EliaNet = api;
})(typeof window !== 'undefined' ? window : globalThis);
