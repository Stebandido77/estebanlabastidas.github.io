// Comprueba que la inferencia en JS (js/elia-net.js) dé lo mismo que Python (tools/elia/train.py,
// con los pesos ya cuantizados) para las preguntas de parity.json:
//   1. red sola: 50 preguntas, probabilidades de intención y asks_how;
//   2. híbrido: 45 preguntas con keys, intención del key (o ninguna) y probabilidades tras la mezcla.
//   node tools/elia/test_parity.mjs
// Sale con código 1 si alguna probabilidad difiere en más de 1e-3 o si un key no coincide.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const require = createRequire(import.meta.url);
const net = require(fileURLToPath(new URL('js/elia-net.js', root)));

const load = (path) => { const ctx = {window: {}}; vm.runInNewContext(readFileSync(new URL(path, root), 'utf8'), ctx); return ctx.window; };
const M = load('assets/data/elia-model.js').ELIA_MODEL;
const E = load('assets/data/content.js').DATA.elia;
const ref = JSON.parse(readFileSync(new URL('tools/elia/parity.json', root), 'utf8'));

const TOL = 1e-3;
let fails = 0;
const maxDiff = (a, b) => a.reduce((d, p, k) => Math.max(d, Math.abs(p - b[k])), 0);

// 1. red sola
let worst = 0, worstQ = '', top1 = 0;
ref.questions.forEach((q, i) => {
  const r = net.predict(M, q);
  const d = Math.max(Math.abs(r.how - ref.how[i]), maxDiff(r.probs, ref.probs[i]));
  if (M.intents[ref.probs[i].indexOf(Math.max(...ref.probs[i]))] === r.ranked[0][0]) top1++;
  if (d > worst) { worst = d; worstQ = q; }
  if (d > TOL) { fails++; console.log(`✗ red: ${q}  (diferencia ${d.toExponential(2)})`); }
});
console.log(`red: ${ref.questions.length} preguntas · misma intención top-1: ${top1}/${ref.questions.length} · ` +
  `diferencia máxima ${worst.toExponential(2)} ("${worstQ}")`);

// 2. híbrido (keys de content.js + regla mix/bonus)
const H = ref.hybrid, keys = net.compileKeys(E.intents);
if (E.keyMode !== H.mode || E.keyWeight !== H.w) {
  fails++; console.log(`✗ content.js tiene keyMode=${E.keyMode} keyWeight=${E.keyWeight}; parity.json espera ${H.mode} ${H.w}`);
}
let hw = 0, keyOk = 0;
H.questions.forEach((q, i) => {
  const r = net.ask(M, q, keys, {keyMode: H.mode, keyWeight: H.w});
  if (r.key === H.key[i]) keyOk++;
  else { fails++; console.log(`✗ key: ${q}  (JS ${r.key} · Python ${H.key[i]})`); }
  const d = maxDiff(r.probs, H.probs[i]);
  hw = Math.max(hw, d);
  if (d > TOL) { fails++; console.log(`✗ híbrido: ${q}  (diferencia ${d.toExponential(2)})`); }
});
console.log(`híbrido (${H.mode} ${H.w}): ${H.questions.length} preguntas · mismo key: ${keyOk}/${H.questions.length} · ` +
  `diferencia máxima ${hw.toExponential(2)} · tolerancia ${TOL}`);

console.log(fails ? `FALLA: ${fails} comprobaciones fuera de tolerancia` : 'OK: JS y Python coinciden');
process.exit(fails ? 1 : 0);
