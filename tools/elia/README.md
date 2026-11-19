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
| Cambiar `oosCues`, `social`, `chips` o `ui` | `content.js` → `elia` | No |
| Agregar preguntas de entrenamiento | `tools/elia/data/questions.csv` | Sí |
| Agregar una intención nueva | `content.js` (intención con `t`, `a`, keys) **y** ≥ 5 preguntas en `questions.csv` | Sí |
| Cambiar umbrales a mano (`threshold`, `margin`, `clarify`, `keyWeight`, `weakBonus`) | `content.js` → `elia` | No, pero `train.py` los vuelve a escribir al reentrenar |

Los keys se comparan con el texto normalizado (minúsculas, sin tildes, solo letras y números), así
que escríbelos así: `"sa ccr"`, `"bre b"`, `"codigo fuente"`.

- **Fuertes** (`keys`): alias que solo pueden ser de esa intención (`uncoli`, `pulso`, `calypso`).
  Si aparecen los de una sola intención, deciden casi solos.
- **Débiles** (`weak`): palabras genéricas (`celular`, `budget`, `mapa`). Solo suben un poco la
  probabilidad; nunca bastan sin la red.
- Si aparecen keys de dos intenciones, o una frase de `oosCues` ("qué opinas de", "write my"…),
  decide solo la red.

## Reentrenar

Requisitos: Python 3 con NumPy y Node (para leer `content.js`). Nada más.

```sh
python tools/elia/augment.py          # valida questions.csv contra content.js
python tools/elia/train.py            # ~10 min: validación cruzada, modelo, regla y REPORT.md
node tools/elia/test_parity.mjs       # JS y Python dan lo mismo (tolerancia 1e-3)
python tools/elia/eval_holdout.py     # métricas sobre tus preguntas de prueba
```

`train.py` escribe `assets/data/elia-model.js`, `tools/elia/parity.json`, `tools/elia/REPORT.md` y los
umbrales (`threshold`, `margin`, `clarify`, `keyWeight`, `weakBonus`) en `content.js`. Revisa el
reporte antes de publicar: las metas son ≥ 80 % de respuestas correctas, ≤ 5 % equivocadas (también
en español) y ≥ 85 % de rechazo de preguntas fuera de alcance, en la columna "anidada".

Archivos:

| Archivo | Qué hace |
|---|---|
| `data/questions.csv` | Preguntas escritas a mano (`text,intent,lang,how`). `how=1` si preguntan cómo se hizo algo |
| `data/holdout.csv` | Tus preguntas de prueba (`text,intent,lang`). Nunca entran al entrenamiento ni sirven para ajustar keys |
| `data/draft_batch1.csv` | Borrador de preguntas nuevas para revisar antes de pasarlas a `questions.csv` |
| `common.py` | Normalización, features (hashing FNV-1a), keys y reglas sociales. Debe coincidir con `js/elia-net.js` |
| `augment.py` | Variantes con typos, sin tildes y sinónimos (solo entrenamiento) |
| `templates.py` | Plantillas "qué es {X}" × keys (solo entrenamiento) |
| `train.py` | Entrenamiento, grilla de la regla, exportación y reporte |
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
