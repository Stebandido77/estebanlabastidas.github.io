# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 417 preguntas originales (214 ES · 203 EN), 50 intenciones.

## Puerta de publicación

**Lo que decide si EL·IA se publica es el holdout, no esta validación cruzada:** `python tools/elia/eval_holdout.py` sobre `tools/elia/data/holdout.csv` (preguntas que escribe Esteban y que nunca entran al entrenamiento ni sirven para ajustar keys). Metas del holdout: **≥ 75 % de respuestas correctas y ≤ 5 % de respuestas equivocadas.** El 80 % de respuestas correctas de la validación cruzada es una referencia, no un requisito: con pocas preguntas por intención, la cifra se mueve varios puntos según el reparto de los pliegues (73–80 % con el mismo diseño en dos semillas).

## Configuración

- Red: 4096 → 64 (ReLU, dropout 0.3) → 50 (softmax) + asks_how (sigmoide). Pérdida: CE con pesos de clase `inverse` + 0.5 × BCE(asks_how) + L2 0.0001. Adam lr 0.003, lote 64, 8 variantes por pregunta.
- Keys (content.js, regla en `common.py` y `js/elia-net.js`): coincidencia exacta, o a distancia de Levenshtein ≤ 1 si las dos palabras tienen ≥ 5 letras. **Fuertes** (`keys`) de una sola intención: p = w·p_red + (1 − w)·[intención], basta para responder. **Débiles** (`weak`), solo si no hay fuertes: p ∝ p_red·e^β en esa intención, nunca basta sin la red. Keys de dos intenciones, o una frase de `oosCues.soft`: decide la red. asks_how siempre sale de la red.
- Guardia dura (`oosCues.hard`: clima, chiste, traduce, redacta, write my…): la pregunta va a `out_of_scope` sin pasar por la red; EL·IA nunca responde y ofrece el correo.
- Reglas sociales (`social`): ≤ 4 palabras formadas solo por frases de una lista (greeting, goodbye o thanks) y relleno → respuesta directa, sin red.
- Plantillas: 30 plantillas × keys (fuertes y débiles) y títulos, 30 filas por intención (+1 variante cada una), solo en entrenamiento.
- Validación cruzada estratificada de 5 pliegues solo con preguntas originales (los mismos pliegues en todas las etapas). Early stopping y temperatura con una pregunta por clase separada del entrenamiento. Las variantes y las plantillas nunca están en el pliegue evaluado.
- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "¿Te refieres a…?" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold 0.3–0.9, margin 0.0–0.5, clarify 0.1–0.6 (paso 0.05), w ∈ [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3], β ∈ [0.0, 0.25, 0.5, 0.75, 1.0]. Se elige lo que maximiza "responde bien" con responde mal ≤ 5% en todas **y en ES**, y rechazo de `out_of_scope` ≥ 85%; luego el clarify que maximiza aciertos − fallos dentro de "¿Te refieres a…?".

## Reglas solas (sin red)

| Regla | Preguntas dentro del alcance que la activan | Con la intención correcta | Fuera de alcance que la activan |
|---|---|---|---|
| Key fuerte | 215 de 367 | 203 | 0 |
| Key débil (sin fuerte) | 58 de 367 | 56 | 0 |
| Forzada (social u oosCues.hard) | 16 de 367 | 16 | 14 |

Los keys los escribí mirando content.js **y** el dataset, así que esta capa sale algo favorecida en la validación. La prueba sin ese sesgo es `tools/elia/eval_holdout.py` con las preguntas de Esteban.

## Aporte de cada paso (media ± desviación entre pliegues)

Cada etapa con su propia regla óptima de la grilla. "Anidada": la regla se elige con 4 pliegues y se mide en el 5.º (estimación sin optimismo).

| Etapa | Regla elegida | Responde bien | Bien (anidada) | Responde mal | Mal (anidada) | Mal ES (anidada) | "¿Te refieres a…?" | Correo | Rechazo OOS |
|---|---|---|---|---|---|---|---|---|---|
| Base (solo red) | t 0.60 · m 0.00 · c 0.15 | 38.3 ± 6.1 % | 35.8 ± 7.9 % | 4.8 ± 2.8 % | 4.8 ± 3.4 % | 3.8 ± 2.7 % | 40.1 ± 5.9 % | 16.7 ± 3.8 % | 90.0 ± 20.0 % |
| + keys fuertes/débiles + guardia OOS | t 0.65 · m 0.00 · c 0.40 · w 0.3 · β 1.0 | 66.4 ± 4.6 % | 63.4 ± 5.1 % | 4.9 ± 2.1 % | 5.6 ± 3.0 % | 5.0 ± 5.2 % | 7.1 ± 3.7 % | 21.5 ± 5.1 % | 92.0 ± 16.0 % |
| + plantillas | t 0.60 · m 0.30 · c 0.15 · w 0.4 · β 1.0 | 75.1 ± 4.6 % | 74.6 ± 4.3 % | 3.9 ± 1.3 % | 4.6 ± 2.1 % | 4.9 ± 3.6 % | 16.1 ± 4.1 % | 4.9 ± 3.2 % | 88.0 ± 11.7 % |
| + reglas sociales y guardia dura (final) | t 0.60 · m 0.30 · c 0.30 · w 0.4 · β 1.0 | 78.3 ± 3.8 % | 78.1 ± 3.3 % | 3.9 ± 1.3 % | 4.1 ± 1.9 % | 4.9 ± 3.6 % | 9.6 ± 3.4 % | 8.1 ± 4.6 % | 96.0 ± 8.0 % |

## Etapa final por idioma

Regla: threshold 0.6, margin 0.3, clarify 0.3, keyWeight 0.4, weakBonus 1.0 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| Responde bien | 78.3 ± 3.8 % | 78.1 ± 3.3 % | 78.2 ± 4.8 % | 78.2 ± 3.2 % | 78.4 ± 4.9 % | 77.9 ± 4.8 % | ≥ 80 % (referencia) |
| Responde mal | 3.9 ± 1.3 % | 4.1 ± 1.9 % | 4.8 ± 3.2 % | 4.9 ± 3.6 % | 2.9 ± 2.2 % | 3.1 ± 2.1 % | ≤ 5 % |
| "¿Te refieres a…?" | 9.6 ± 3.4 % | 9.5 ± 4.9 % | 8.6 ± 3.6 % | 9.0 ± 4.3 % | 11.0 ± 6.8 % | 10.2 ± 7.7 % |  |
|   … con la correcta entre las 3 opciones | 7.5 ± 2.8 % | 6.5 ± 3.4 % | 5.8 ± 1.9 % | 5.2 ± 3.2 % | 9.3 ± 5.2 % | 7.9 ± 4.7 % |  |
| Va a correo | 8.1 ± 4.6 % | 8.4 ± 5.6 % | 8.4 ± 4.9 % | 7.9 ± 4.6 % | 7.7 ± 5.9 % | 8.8 ± 7.9 % |  |
| Accuracy (argmax, tras reglas) | 84.4 ± 4.2 % | 84.4 ± 4.2 % | 82.9 ± 6.3 % | 82.9 ± 6.3 % | 85.6 ± 2.4 % | 85.6 ± 2.4 % |  |
| Rechazo de out_of_scope | 96.0 ± 8.0 % | 98.0 ± 4.0 % | 96.7 ± 6.7 % | 96.7 ± 6.7 % | 95.0 ± 10.0 % | 100.0 ± 0.0 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 8.0 ± 11.7 % | 10.0 ± 11.0 % | 11.7 ± 14.5 % | 11.7 ± 14.5 % | 5.7 ± 11.4 % | 10.7 ± 13.2 % |  |

**Referencia de la validación cruzada (anidada):** responde bien ✗ · responde mal ✓ · responde mal en ES ✓ · rechazo OOS ✓ → no se cumplen todas las referencias. La puerta de publicación es el holdout (arriba).

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | fuerte |
| hace consultorías de valoración | `hire` | `exp_ms` | 1.00 | débil |
| what do you think about inflation forecasting | `interests` | `proj_inflation` | 0.97 | red |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 0.96 | fuerte |
| eres una inteligencia artificial | `elia` | `proj_abi` | 0.96 | red |
| who is behind estebanOS | `who` | `site` | 0.92 | fuerte |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.86 | débil |
| desde dónde trabajas | `location` | `job_current` | 0.73 | fuerte |
| el prototipo con LLM y agentes | `ews` | `paper_llm` | 0.72 | fuerte |
| qué piensas de la inflación este año | `out_of_scope` | `interests` | 0.70 | red |
| what city is Esteban from | `location` | `who` | 0.69 | débil |
| de qué país eres | `location` | `elia` | 0.69 | red |
| which paper won the FENADECO award | `paper_coca` | `list_papers` | 0.67 | fuerte |
| which stack did you use for the bvar backtests | `proj_inflation` | `stack` | 0.65 | fuerte |
| quiero contratarte | `hire` | `proj_saccr` | 0.65 | red |
| how do I cook pasta | `out_of_scope` | `elia` | 0.64 | red |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`who` (11), `list_papers` (6), `education` (5), `contact` (4), `ceteris_code` (4), `interests` (3), `hire` (3), `latest` (3), `location` (3), `jpm` (2), `paper_spatial` (2), `job_current` (2), `writing` (2), `elia` (2), `proj_pulso` (1)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 95.7 ± 2.1 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 354 | 5 |
| **real how=1** | 13 | 45 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 70 épocas (mediana de la validación cruzada), T = 1.027 (mediana).
- `assets/data/elia-model.js`: **347.6 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia y reglas sociales; tolerancia 1e-3).
- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).
