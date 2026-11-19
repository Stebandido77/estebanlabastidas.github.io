# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 381 preguntas originales (195 ES · 186 EN), 50 intenciones.

## Configuración

- Red: 4096 → 64 (ReLU, dropout 0.3) → 50 (softmax) + asks_how (sigmoide). Pérdida: CE con pesos de clase `inverse` + 0.5 × BCE(asks_how) + L2 0.0001. Adam lr 0.003, lote 64, 8 variantes por pregunta.
- Keys (content.js, regla en `common.py` y `js/elia-net.js`): coincidencia exacta, o a distancia de Levenshtein ≤ 1 si las dos palabras tienen ≥ 5 letras. **Fuertes** (`keys`) de una sola intención: p = w·p_red + (1 − w)·[intención], basta para responder. **Débiles** (`weak`), solo si no hay fuertes: p ∝ p_red·e^β en esa intención, nunca basta sin la red. Keys de dos intenciones, o una frase de `oosCues`: decide la red. asks_how siempre sale de la red.
- Reglas sociales (`social`): ≤ 4 palabras formadas solo por frases de una lista (greeting, goodbye o thanks) y relleno → respuesta directa, sin red.
- Plantillas: 30 plantillas × keys fuertes y títulos, 30 filas por intención (+1 variante cada una), solo en entrenamiento.
- Validación cruzada estratificada de 5 pliegues solo con preguntas originales (los mismos pliegues en todas las etapas). Early stopping y temperatura con una pregunta por clase separada del entrenamiento. Las variantes y las plantillas nunca están en el pliegue evaluado.
- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "¿Te refieres a…?" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold 0.3–0.9, margin 0.0–0.5, clarify 0.1–0.6 (paso 0.05), w ∈ [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3], β ∈ [0.0, 0.25, 0.5, 0.75, 1.0]. Se elige lo que maximiza "responde bien" con responde mal ≤ 5% en todas **y en ES**, y rechazo de `out_of_scope` ≥ 85%; luego el clarify que maximiza aciertos − fallos dentro de "¿Te refieres a…?".

## Reglas solas (sin red)

| Regla | Preguntas dentro del alcance que la activan | Con la intención correcta | Fuera de alcance que la activan |
|---|---|---|---|
| Key fuerte | 212 de 331 | 201 | 0 |
| Key débil (sin fuerte) | 49 de 331 | 47 | 0 |
| Social | 16 de 331 | 16 | 0 |

Los keys los escribí mirando content.js **y** el dataset, así que esta capa sale algo favorecida en la validación. La prueba sin ese sesgo es `tools/elia/eval_holdout.py` con las preguntas de Esteban.

## Aporte de cada paso (media ± desviación entre pliegues)

Cada etapa con su propia regla óptima de la grilla. "Anidada": la regla se elige con 4 pliegues y se mide en el 5.º (estimación sin optimismo).

| Etapa | Regla elegida | Responde bien | Bien (anidada) | Responde mal | Mal (anidada) | Mal ES (anidada) | "¿Te refieres a…?" | Correo | Rechazo OOS |
|---|---|---|---|---|---|---|---|---|---|
| Base (solo red) | t 0.55 · m 0.50 · c 0.20 | 35.9 ± 8.8 % | 36.8 ± 9.4 % | 4.6 ± 2.0 % | 4.9 ± 2.6 % | 3.6 ± 4.4 % | 36.7 ± 10.7 % | 22.9 ± 3.4 % | 96.0 ± 4.9 % |
| + keys fuertes/débiles + guardia OOS | t 0.65 · m 0.45 · c 0.25 · w 0.3 · β 1.0 | 68.1 ± 4.6 % | 67.8 ± 4.4 % | 4.8 ± 2.4 % | 5.2 ± 2.9 % | 4.6 ± 5.8 % | 14.1 ± 3.9 % | 13.0 ± 0.9 % | 96.0 ± 4.9 % |
| + plantillas | t 0.70 · m 0.45 · c 0.35 · w 0.3 · β 0.0 | 73.2 ± 4.8 % | 69.4 ± 5.9 % | 3.9 ± 1.2 % | 3.7 ± 2.9 % | 5.2 ± 4.6 % | 10.5 ± 3.7 % | 12.3 ± 3.1 % | 92.0 ± 7.5 % |
| + reglas sociales (final) | t 0.60 · m 0.45 · c 0.35 · w 0.4 · β 1.0 | 77.4 ± 3.8 % | 73.3 ± 6.2 % | 3.6 ± 1.5 % | 3.7 ± 2.9 % | 4.7 ± 3.7 % | 9.7 ± 2.9 % | 9.3 ± 3.5 % | 90.0 ± 8.9 % |

## Etapa final por idioma

Regla: threshold 0.6, margin 0.45, clarify 0.35, keyWeight 0.4, weakBonus 1.0 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| Responde bien | 77.4 ± 3.8 % | 73.3 ± 6.2 % | 77.0 ± 3.4 % | 73.5 ± 4.8 % | 77.4 ± 7.0 % | 72.7 ± 10.5 % | ≥ 80 % |
| Responde mal | 3.6 ± 1.5 % | 3.7 ± 2.9 % | 4.7 ± 2.2 % | 4.7 ± 3.7 % | 2.2 ± 2.0 % | 2.5 ± 2.1 % | ≤ 5 % |
| "¿Te refieres a…?" | 9.7 ± 2.9 % | 13.5 ± 2.9 % | 8.5 ± 4.4 % | 11.4 ± 4.7 % | 11.1 ± 4.8 % | 16.0 ± 7.5 % |  |
|   … con la correcta entre las 3 opciones | 8.1 ± 3.9 % | 10.4 ± 4.9 % | 7.3 ± 4.6 % | 10.2 ± 5.1 % | 9.0 ± 6.1 % | 10.6 ± 8.6 % |  |
| Va a correo | 9.3 ± 3.5 % | 9.6 ± 5.7 % | 9.9 ± 7.2 % | 10.4 ± 7.9 % | 9.2 ± 5.1 % | 8.8 ± 5.0 % |  |
| Accuracy (argmax, tras reglas) | 83.4 ± 4.8 % | 83.1 ± 4.7 % | 83.7 ± 3.2 % | 83.1 ± 3.4 % | 83.1 ± 7.2 % | 83.1 ± 7.2 % |  |
| Rechazo de out_of_scope | 90.0 ± 8.9 % | 92.0 ± 7.5 % | 95.6 ± 8.9 % | 97.8 ± 4.4 % | 90.0 ± 13.3 % | 90.0 ± 13.3 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 12.0 ± 4.0 % | 14.0 ± 8.0 % | 16.2 ± 9.6 % | 18.4 ± 9.4 % | 6.2 ± 7.6 % | 7.3 ± 9.0 % |  |

**Resultado (anidada):** responde bien ✗ · responde mal ✓ · responde mal en ES ✓ · rechazo OOS ✓ → **no se cumplen todas las metas.**

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | fuerte |
| who's the guy behind this site | `who` | `site` | 1.00 | fuerte |
| hace consultorías de valoración | `hire` | `exp_ms` | 0.99 | débil |
| redacta mi ensayo de microeconomía | `out_of_scope` | `proj_ceteris` | 0.99 | red |
| can you write my essay | `out_of_scope` | `writing` | 0.98 | red |
| de dónde eres | `location` | `elia` | 0.88 | red |
| write my essay about the minimum wage | `out_of_scope` | `desk_minwage` | 0.88 | red |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 0.87 | fuerte |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.86 | débil |
| quiero contratarte | `hire` | `proj_saccr` | 0.84 | red |
| dónde escribes | `writing` | `location` | 0.74 | red |
| hazme un presupuesto para mi casa | `out_of_scope` | `proj_pgn` | 0.73 | red |
| eres una inteligencia artificial | `elia` | `proj_abi` | 0.72 | red |
| where did you go to university | `education` | `job_current` | 0.70 | débil |
| write me a python script to scrape a website | `out_of_scope` | `stack` | 0.67 | red |
| which stack did you use for the bvar backtests | `proj_inflation` | `stack` | 0.66 | fuerte |
| which paper won the FENADECO award | `paper_coca` | `list_papers` | 0.61 | fuerte |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`ceteris_code` (5), `who` (4), `education` (4), `interests` (4), `contact` (4), `list_papers` (4), `latest` (4), `paper_spatial` (3), `hire` (3), `ews` (2), `jpm` (2), `proj_pgn` (2), `job_current` (2), `writing` (2), `location` (2)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 96.0 ± 3.0 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 316 | 7 |
| **real how=1** | 8 | 50 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 50 épocas (mediana de la validación cruzada), T = 1.055 (mediana).
- `assets/data/elia-model.js`: **347.6 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia y reglas sociales; tolerancia 1e-3).
- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).
