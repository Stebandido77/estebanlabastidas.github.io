// Comprueba que la inferencia en JS (js/elia-net.js) dé lo mismo que Python (tools/elia/train.py,
// con los pesos ya cuantizados) para las preguntas de parity.json:
//   1. red sola: 50 preguntas, probabilidades de intención y asks_how;
//   2. híbrido: ~60 preguntas con keys, guardia oosCues y reglas sociales; reglas activadas y
//      probabilidades tras la mezcla;
//   3. normalización de textos con signos, tildes y M&A.
//   node tools/elia/test_parity.mjs
// Sale con código 1 si alguna probabilidad difiere en más de 1e-3 o si una regla no coincide.
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

// 2. híbrido: keys fuertes/débiles, oosCues (soft anula keys, hard fuerza out_of_scope) y reglas sociales
const H = ref.hybrid, K = net.compileKeys(E, M.promoted);
if (E.keyWeight !== H.keyWeight || E.weakBonus !== H.weakBonus) {
  fails++;
  console.log(`✗ content.js tiene keyWeight=${E.keyWeight} weakBonus=${E.weakBonus}; parity.json espera ${H.keyWeight} ${H.weakBonus}`);
}
let hw = 0, ruleOk = 0;
H.questions.forEach((q, i) => {
  const r = net.ask(M, q, K, {keyWeight: H.keyWeight, weakBonus: H.weakBonus});
  const js = [r.kind === 'strong' ? r.key : null, r.kind === 'weak' ? r.key : null, r.forced];
  const py = [H.strong[i], H.weak[i], H.forced[i]];
  if (JSON.stringify(js) === JSON.stringify(py)) ruleOk++;
  else { fails++; console.log(`✗ reglas: ${q}  (JS ${JSON.stringify(js)} · Python ${JSON.stringify(py)})`); }
  const d = maxDiff(r.probs, H.probs[i]);
  hw = Math.max(hw, d);
  if (d > TOL) { fails++; console.log(`✗ híbrido: ${q}  (diferencia ${d.toExponential(2)})`); }
});
console.log(`híbrido (keyWeight ${H.keyWeight} · weakBonus ${H.weakBonus}): ${H.questions.length} preguntas · ` +
  `mismas reglas (fuerte/débil/forzada): ${ruleOk}/${H.questions.length} · diferencia máxima ${hw.toExponential(2)} · tolerancia ${TOL}`);

// 2b. decisión completa (answer / clarify / menu / miss y opciones) con la regla exportada: menú de temas y,
//     si el modelo trae detector, distancias a los prototipos
const O = ref.decide;
if (!O) { fails++; console.log('✗ parity.json no trae "decide": reentrena'); }
else {
  if (!!O.dist !== !!M.ood) { fails++; console.log('✗ el detector de elia-model.js y el de parity.json no coinciden: reentrena'); }
  if (E.threshold !== O.threshold || E.margin !== O.margin || E.clarify !== O.clarify || (E.menuBelow ?? null) !== (O.menuBelow ?? null)) {
    fails++; console.log('✗ content.js tiene otra regla que parity.json (threshold/margin/clarify/menuBelow)');
  }
  const cfg = {keyWeight: H.keyWeight, weakBonus: H.weakBonus, threshold: O.threshold, margin: O.margin, clarify: O.clarify,
               menuBelow: O.menuBelow, menu: E.menu};
  let dw = 0, decOk = 0;
  O.questions.forEach((q, i) => {
    const r = net.ask(M, q, K, cfg);
    if (O.dist) dw = Math.max(dw, maxDiff(r.dist, O.dist[i]));
    const d = net.decide(r, cfg);
    const opts = d === 'menu' ? net.menuOptions(M, cfg) : net.options(r);
    if (d === O.decision[i] && !!r.blocked === O.blocked[i] && (!['clarify', 'menu'].includes(d) || JSON.stringify(opts) === JSON.stringify(O.options[i]))) decOk++;
    else { fails++; console.log(`✗ decisión: ${q}  (JS ${d} ${!!r.blocked} ${opts} · Python ${O.decision[i]} ${O.blocked[i]} ${O.options[i]})`); }
  });
  if (dw > TOL) { fails++; console.log(`✗ detector: distancia máxima ${dw.toExponential(2)} > ${TOL}`); }
  const cnt = k => O.decision.filter(x => x === k).length;
  console.log(`decisión y menú (menuBelow ${O.menuBelow}${M.ood ? ', detector p' + M.ood.pct : ', sin detector'}): ${O.questions.length} preguntas · ` +
    `misma decisión y opciones: ${decOk}/${O.questions.length} · answer ${cnt('answer')} · clarify ${cnt('clarify')} · menu ${cnt('menu')} · miss ${cnt('miss')}`);
}

// 3. normalización (incluye "m&a" → mna)
let nOk = 0;
for (const [t, want] of ref.normalize || []) {
  const got = net.normalize(t);
  if (got === want) nOk++;
  else { fails++; console.log(`✗ normalize: ${JSON.stringify(t)}  (JS ${JSON.stringify(got)} · Python ${JSON.stringify(want)})`); }
}
console.log(`normalización: ${nOk}/${(ref.normalize || []).length} iguales`);

console.log(fails ? `FALLA: ${fails} comprobaciones fuera de tolerancia` : 'OK: JS y Python coinciden');
process.exit(fails ? 1 : 0);
