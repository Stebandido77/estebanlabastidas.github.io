// Comprueba que la inferencia en JS (js/elia-net.js) dé las mismas probabilidades que Python
// (tools/elia/train.py, con los pesos ya cuantizados) para las 50 preguntas de parity.json.
//   node tools/elia/test_parity.mjs
// Sale con código 1 si alguna probabilidad difiere en más de 1e-3.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const require = createRequire(import.meta.url);
const net = require(fileURLToPath(new URL('js/elia-net.js', root)));

const ctx = {window: {}};
vm.runInNewContext(readFileSync(new URL('assets/data/elia-model.js', root), 'utf8'), ctx);
const M = ctx.window.ELIA_MODEL;
const ref = JSON.parse(readFileSync(new URL('tools/elia/parity.json', root), 'utf8'));

const TOL = 1e-3;
let worst = 0, worstQ = '', fails = 0, top1 = 0;
ref.questions.forEach((q, i) => {
  const r = net.predict(M, q);
  let d = Math.abs(r.how - ref.how[i]);
  r.probs.forEach((p, k) => { d = Math.max(d, Math.abs(p - ref.probs[i][k])); });
  const pyTop = ref.probs[i].indexOf(Math.max(...ref.probs[i]));
  if (M.intents[pyTop] === r.ranked[0][0]) top1++;
  if (d > worst) { worst = d; worstQ = q; }
  if (d > TOL) { fails++; console.log(`✗ ${q}  (diferencia ${d.toExponential(2)})`); }
});
console.log(`${ref.questions.length} preguntas · misma intención top-1: ${top1}/${ref.questions.length} · ` +
  `diferencia máxima ${worst.toExponential(2)} ("${worstQ}") · tolerancia ${TOL}`);
console.log(fails ? `FALLA: ${fails} preguntas fuera de tolerancia` : 'OK: JS y Python coinciden');
process.exit(fails ? 1 : 0);
