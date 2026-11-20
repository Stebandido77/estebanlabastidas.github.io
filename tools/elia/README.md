# EL·IA — mantenimiento

EL·IA (o Estebania) responde preguntas sobre Esteban con una red neuronal pequeña entrenada aquí,
en NumPy. No usa LLM ni API: en el navegador corre `js/elia-net.js` (JavaScript puro) con los pesos
de `assets/data/elia-model.js`, y todo el contenido vive en `assets/data/content.js` → `elia`.

## Qué se edita y si hay que reentrenar

| Quiero… | Dónde | ¿Reentrenar? |
|---|---|---|
| Cambiar una respuesta (`a`, `how`), sus botones (`open`) o enlaces (`links`) | `content.js` → `elia.intents` | No |
| Llenar un `TODO(esteban)` | `content.js` | No |
| Agregar o quitar keys fuertes (`keys`) o débiles (`weak`) | `content.js` → cada intención | No (pero `test_parity.mjs` fallará hasta reentrenar, porque `parity.json` se genera con los keys del entrenamiento) |
| Cambiar `oosCues` (`hard`/`soft`), `social`, `chips` o `ui` | `content.js` → `elia` | No |
| Agregar preguntas de entrenamiento | `tools/elia/data/questions.csv` | Sí |
| Agregar una intención nueva | `content.js` (intención con `t`, `a`, keys) **y** ≥ 5 preguntas en `questions.csv` | Sí |
| Cambiar umbrales a mano (`threshold`, `margin`, `clarify`, `keyWeight`, `weakBonus`) | `content.js` → `elia` | No, pero `train.py` los vuelve a escribir al reentrenar |

Los keys se comparan con el texto normalizado (minúsculas, sin tildes, solo letras y números), así
que escríbelos así: `"sa ccr"`, `"bre b"`, `"codigo fuente"`. Cada palabra coincide si es igual, si
está a una letra de distancia (palabras de 5+ letras; dos letras vecinas traspuestas cuentan como una:
"ahbilidad" → "habilidad") o como prefijo cuando la palabra del key tiene 6+ letras ("contactar" reconoce
"contactarte").

- **Fuertes** (`keys`): alias que solo pueden ser de esa intención (`uncoli`, `pulso`, `calypso`).
  Si aparecen los de una sola intención, deciden casi solos.
- **Débiles** (`weak`): palabras genéricas (`celular`, `budget`, `mapa`). Solo suben un poco la
- **Promovidos por los datos:** un débil actúa como fuerte si en las preguntas de entrenamiento se
  activa ≥ 3 veces y ≥ 95 % de ellas son de su intención (`train.py` guarda la lista en
  `elia-model.js`). Los de `noPromote` (`github`, `repo`, `codigo`, `code`) nunca suben.
- **Combinaciones** (`combo`): una palabra de cada grupo, en cualquier orden ("ceteris" + "github").
  probabilidad; nunca bastan sin la red.
- Si aparecen keys de dos intenciones, decide solo la red, salvo que todas menos una sean
  **generales** (`"general": true`: `ai_work`, `skills_overview`, `who`): entonces gana la específica
  ("tu perfil de github" → `contact`, no `who`; "qué es EL·IA" → `elia`, no `ai_work`). Un key fuerte
  general sí gana sobre cualquier débil.
- `oosCues.soft` ("qué opinas de", "el mejor", "recommend"…): se anulan los keys y decide la red.
  Sirve para "cuál es el mejor celular", pero deja pasar "cuál es tu mejor proyecto". No aplica si la
  pregunta habla de Esteban (`esteban`, `tu`, `tus`, `your`, `his`): "la mejor habilidad de Esteban" sí
  usa los keys.
- `oosCues.hard` ("chiste", "clima", "traduce", "redacta", "write my"…): EL·IA nunca responde; la
  pregunta se trata como fuera de alcance y se ofrece escribirle a Esteban.

## Menú de temas

Si la decisión es "¿Te refieres a…?" pero la primera opción tiene probabilidad por debajo de `menuBelow`
(content.js, lo elige `train.py` en la grilla; `null` lo apaga), la red no tiene idea y mostrar 3
intenciones sería adivinar. En su lugar EL·IA dice "No lo tengo claro. ¿Sobre qué tema quieres saber?"
con chips fijos (`elia.menu.chips`: Experiencia, Proyectos, Papers, Habilidades, Trabajo con IA, Lo más
reciente, Contacto) y el botón "Escribir a Esteban". "Ninguna de estas", en el "¿Te refieres a…?" normal,
también lleva a este menú. En la evaluación, el menú cuenta como útil solo si la intención válida es uno
de los chips. La misma regla está en `train.py` (`Outcomes`), `eval_holdout.py` y `js/elia-net.js`
(`decide`, `menuOptions`), con paridad.

## Detector de novedad (probado y descartado)

**Está apagado.** En la ronda 7 (pasos 1 a 4) la validación cruzada anidada no lo eligió en ningún pliegue
de ningún paso: al umbral que pedía equivocadas ≤ 3 % ya casi no quedaban respuestas que bloquear, y
desde el paso 3 la frontera con y sin detector es la misma (p. ej. 1,2 % equivocadas con correctas ≥ 65 %
en los dos casos). Solo en el paso 1 bajaba las equivocadas 0,4–0,7 puntos, a cambio de 8–11 puntos de
útiles. Queda en el código; `train.py --ood` lo vuelve a la grilla.

La red puede estar muy segura de preguntas que no se parecen a nada de lo que vio. Por eso el modelo
guarda, en la capa oculta (64 dimensiones), un **prototipo** por intención (la media de sus preguntas de
entrenamiento y sus variantes) y un **radio** (un percentil de sus distancias coseno al prototipo). Si
EL·IA iba a responder y la pregunta queda fuera del radio de la intención ganadora, no responde: muestra
"¿Te refieres a…?" con las intenciones cuyo radio sí la contiene (primero esas) o, si ninguna la
contiene, ofrece el correo. Un key fuerte o una regla forzada siguen ganando. El percentil lo elige
`train.py` en la validación cruzada anidada (`ood.pct` en `elia-model.js`; con `--ood`, y `--ood-grid` cambia la
grilla). La misma regla está en `train.py` (`Outcomes`), `eval_holdout.py` y
`js/elia-net.js` (`decide`, `options`); `test_parity.mjs` compara distancias, decisiones y opciones.

## Corpus externo de out_of_scope (solo entrenamiento)

`data/oos_external.csv` tiene 300 preguntas fuera de alcance (150 EN + 150 ES) que se suman a cada
pliegue de entrenamiento y al modelo final, pero **nunca** a la validación, al profesor de la destilación
ni a los prototipos del detector. Lo genera `py -3.12 tools/elia/build_oos.py` (semilla fija):

- **Fuente:** el split `oos` de **CLINC150** — Larson et al. (2019), *An Evaluation Dataset for Intent
  Classification and Out-of-Scope Prediction*, EMNLP-IJCNLP. https://github.com/clinc/oos-eval.
  **Licencia: Creative Commons Attribution 3.0 Unported (CC BY 3.0)**, verificada en el archivo `LICENSE`
  del repositorio el 2026-11-19. Permite copiar, adaptar y redistribuir, incluso con fines comerciales,
  siempre que se cite la fuente e indiquen los cambios. Cambios hechos aquí: muestra de 300 frases,
  filtradas (sin keys de EL·IA ni reglas sociales, ≥ 3 palabras) y la mitad traducida al español.
- **Traducción:** `Helsinki-NLP/opus-mt-en-es` (MarianMT, licencia Apache-2.0), corre local con
  `transformers`; la columna `source` dice de qué frase de CLINC150 sale cada fila. Se descartan las
  traducciones que activan un key de EL·IA y las que perdieron la forma de pregunta (empiezan por "lo
  que", "lo poco", "lo cual", "lo mucho" o "lo bien", o dejaron sueltas *what/how/is/are*); se reponen
  con las frases siguientes del pool, así que siempre quedan 150 ES.
- `train.py --ext-oos ''` entrena sin el corpus; `--ext-aug` fija las variantes por frase (1).

`data/oos_calib.csv` (100 frases: 50 EN + 50 ES, con el mismo filtro) es un **set de calibración**:
viene de la misma fuente pero de frases que no están en `oos_external.csv` (`build_oos.py` lo
verifica), y nunca entra al entrenamiento, al profesor ni a los prototipos. `train.py` lo predice con el
modelo de cada pliegue, exige ≥ 85 % de rechazo también ahí al elegir la regla, y reporta el % rechazado
y el % al correo, por percentil del detector. `eval_holdout.py --file tools/elia/data/oos_calib.csv` lo
mide en el modelo exportado. **Ojo:** el español de la calibración también sale de traducciones; la
medida limpia en español es `dev_holdout.csv` más las preguntas personales escritas a mano en
`questions.csv`.

## Reentrenar

Requisitos: Python 3 con NumPy y Node (para leer `content.js`). Para la destilación, además, un
segundo intérprete con `sentence-transformers` y `torch` (por defecto `py -3.12`; cámbialo con
`--embed-python`) y el modelo `intfloat/multilingual-e5-base` en la caché de Hugging Face: corre sin
conexión y solo durante el entrenamiento. Sin eso, `--distill 0` entrena sin destilación.

```sh
python tools/elia/augment.py          # valida questions.csv contra content.js
python tools/elia/train.py            # ~50 min: validación cruzada (con destilación), modelo, regla y REPORT.md
node tools/elia/test_parity.mjs       # JS y Python dan lo mismo (tolerancia 1e-3)
python tools/elia/eval_holdout.py     # métricas sobre tus preguntas de prueba
```

`train.py` escribe `assets/data/elia-model.js`, `tools/elia/parity.json`, `tools/elia/REPORT.md` y los
umbrales (`threshold`, `margin`, `clarify`, `keyWeight`, `weakBonus`) en `content.js`.

**La puerta de publicación es el holdout, no el reporte.** `eval_holdout.py` debe cumplir las tres
metas, sobre todas las preguntas (sale con código 1 si no):

- correctas ≥ 65 %;
- correctas + "¿Te refieres a…?" con una opción válida ≥ 85 %;
- equivocadas ≤ 5 %.

Además avisa, sin bloquear, si las equivocadas en español pasan de 6 %. La primera meta era 70 % y
bajó a 65 % el 2026-11-19, antes de escribir el holdout definitivo: un "¿Te refieres a…?" con la
opción correcta cuesta un clic; una respuesta equivocada hace daño.

Una respuesta es correcta si coincide con `intent` o con alguna intención de `alt` (separadas por
`|`); si `out_of_scope` es válida, mandar al correo también cuenta. El reporte de la
validación cruzada es una referencia (≥ 80 % correctas, ≤ 5 % equivocadas también en español, ≥ 85 %
de rechazo fuera de alcance, en la columna "anidada"): con pocas preguntas por intención, se mueve
varios puntos según cómo caigan los pliegues.

Archivos:

| Archivo | Qué hace |
|---|---|
| `data/questions.csv` | Preguntas escritas a mano (`text,intent,lang,how`). `how=1` si preguntan cómo se hizo algo |
| `data/holdout.csv` | Tus preguntas de prueba (`text,intent,lang,alt`). Nunca entran al entrenamiento ni sirven para ajustar keys. Es la puerta |
| `data/dev_holdout.csv` | El holdout anterior, ya usado para decidir cambios: solo referencia (`eval_holdout.py --dev`) |
| `data/live_tests.csv` | Preguntas reales hechas en el sitio que salieron mal (`text,intent,lang,alt`). Regresión: nunca entran al entrenamiento (`eval_holdout.py --live`) |
| `data/dev_holdout2.csv` | El holdout del 2026-11-19 (100 preguntas, columnas `text,intent,lang,alt,how`); no pasó la puerta y ya se vio: solo desarrollo (`eval_holdout.py --dev2`) |
| `data/oos_external.csv` | 300 preguntas fuera de alcance de CLINC150 (EN y traducidas al ES), solo entrenamiento (ver arriba) |
| `build_oos.py` | Genera `oos_external.csv` (descarga CLINC150 y traduce con opus-mt-en-es) |
| `data/draft_batch*.csv` | Borradores de preguntas nuevas para revisar antes de pasarlas a `questions.csv` |
| `common.py` | Normalización, features (hashing FNV-1a), keys y reglas sociales. Debe coincidir con `js/elia-net.js` |
| `augment.py` | Variantes con typos (teclado, letras omitidas, repetidas o traspuestas, y un typo agresivo en palabras largas con probabilidad `--typo-p`), sin tildes y sinónimos (solo entrenamiento) |
| `templates.py` | Plantillas "qué es {X}", con el nombre al inicio ("esteban sabe {X}?") e imperativas ("dame {X} de Esteban") × keys (solo entrenamiento) |
| `train.py` | Entrenamiento, grilla de la regla, exportación y reporte |
| `embed.py` | Embeddings del profesor (e5-base) para la destilación; caché en `.cache/` (ignorada) |
| `test_parity.mjs` | Paridad Python ↔ JS |
| `eval_holdout.py` | Evalúa el modelo exportado sobre `holdout.csv` |

Si una pregunta del holdout te hace cambiar keys o preguntas, pásala a `questions.csv` y escribe
preguntas nuevas para el holdout: si no, el holdout deja de medir preguntas nunca vistas.

## Preguntas sin respuesta

Cuando EL·IA no sabe, ofrece escribirle a Esteban y guarda la pregunta en `localStorage` de ese
navegador (máximo 50). En la Terminal: `elia misses` las lista y `elia clear` las borra. Solo se ven
en el navegador donde se hicieron: sirven para probar el sitio tú mismo, no como analítica.

## Enviar desde EL·IA sin abrir Mail (opcional)

Por defecto, el botón "Escribir a Esteban" abre Mail con el borrador listo. Para que además se pueda
enviar desde el chat, configura un servicio de formularios y pon su URL en `content.js`:

**Formspree**
1. Crea un formulario en https://formspree.io y copia su endpoint (`https://formspree.io/f/xxxxxxx`).
2. En `content.js`: `"formEndpoint": "https://formspree.io/f/xxxxxxx"`.

**Web3Forms**
1. Crea una access key en https://web3forms.com (llega a tu correo).
2. En `content.js`: `"formEndpoint": "https://api.web3forms.com/submit"` y
   `"formAccessKey": "tu-access-key"` (es pública por diseño; Web3Forms la asocia a tu correo).

EL·IA envía `{message, email, source: "EL·IA"}` en JSON. Con `formEndpoint: null` no aparece el botón.
