# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 592 preguntas originales (302 ES · 290 EN), 51 intenciones.

## Puerta de publicación

**Lo que decide si EL·IA se publica es el holdout, no esta validación cruzada:** `python tools/elia/eval_holdout.py` sobre `tools/elia/data/holdout.csv` (preguntas que escribe Esteban y que nunca entran al entrenamiento ni sirven para ajustar keys). Las tres metas del holdout, sobre todas sus preguntas, deben cumplirse: **correctas ≥ 65 %; correctas + "¿Te refieres a…?" con una opción válida ≥ 85 %; equivocadas ≤ 5 %.** Aviso que no bloquea si las equivocadas en ES pasan de 6 %. Una respuesta es correcta si coincide con `intent` o con alguna de `alt`; si `out_of_scope` es válida, mandar al correo también cuenta. `dev_holdout.csv` (el holdout anterior) ya se usó para decidir cambios y solo es referencia. El 80 % de respuestas correctas de la validación cruzada es una referencia, no un requisito: con pocas preguntas por intención, la cifra se mueve varios puntos según el reparto de los pliegues (73–80 % con el mismo diseño en dos semillas).

**Cambio de criterio (2026-11-19), fijado antes de ver el holdout definitivo:** la primera meta bajó de ≥ 70 % a ≥ 65 % de respuestas correctas, y se agregó el aviso de ES. Es un criterio de producto: un "¿Te refieres a…?" con la opción correcta le cuesta al visitante un clic, mientras que una respuesta equivocada hace daño; por eso se mantienen las metas de respuestas útiles (≥ 85 %) y equivocadas (≤ 5 %).

## Configuración

- Red: 4096 → 64 (ReLU, dropout 0.3) → 51 (softmax) + asks_how (sigmoide). Pérdida: CE con pesos de clase `inverse` + 0.5 × BCE(asks_how) + L2 0.0001. Adam lr 0.003, lote 64, 8 variantes por pregunta.
- Keys (content.js, regla en `common.py` y `js/elia-net.js`): coincidencia exacta, o a distancia de Levenshtein ≤ 1 si las dos palabras tienen ≥ 5 letras, o prefijo si la del key tiene ≥ 6 (contactar → contactarte). **Fuertes** (`keys`) de una sola intención: p = w·p_red + (1 − w)·[intención], basta para responder. **Débiles** (`weak`), solo si no hay fuertes: p ∝ p_red·e^β en esa intención, nunca basta sin la red. Keys de dos intenciones, o una frase de `oosCues.soft`: decide la red. asks_how siempre sale de la red.
- Guardia dura (`oosCues.hard`: clima, chiste, traduce, redacta, write my…): la pregunta va a `out_of_scope` sin pasar por la red; EL·IA nunca responde y ofrece el correo.
- Reglas sociales (`social`): ≤ 4 palabras formadas solo por frases de una lista (greeting, goodbye o thanks) y relleno → respuesta directa, sin red.
- Destilación (solo entrenamiento): profesor kNN (k = 20, τ = 0.05) sobre embeddings de `intfloat/multilingual-e5-base` de las preguntas de entrenamiento de cada pliegue; pool sin etiquetas de 6000 textos generados (plantillas × keys y títulos de todas las intenciones) más una variante de cada pregunta de entrenamiento del pliegue. Pérdida CE + 0.5 · KL(profesor ‖ red). La red exportada es la misma (y del mismo tamaño); el encoder no llega al navegador.
- Plantillas: 62 plantillas × keys (fuertes y débiles) y títulos, 40 filas por intención (+1 variante cada una), solo en entrenamiento.
- Validación cruzada estratificada de 5 pliegues solo con preguntas originales (los mismos pliegues en todas las etapas). Early stopping y temperatura con una pregunta por clase separada del entrenamiento. Las variantes y las plantillas nunca están en el pliegue evaluado.
- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "¿Te refieres a…?" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold 0.3–0.9, margin 0.0–0.5, clarify 0.1–0.6 (paso 0.05), w ∈ [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3], β ∈ [0.0, 0.25, 0.5, 0.75, 1.0]. Se elige lo que maximiza "responde bien" con responde mal ≤ 5% en todas **y en ES**, y rechazo de `out_of_scope` ≥ 85%; luego el clarify que maximiza aciertos − fallos dentro de "¿Te refieres a…?".

## Reglas solas (sin red)

| Regla | Preguntas dentro del alcance que la activan | Con la intención correcta | Fuera de alcance que la activan |
|---|---|---|---|
| Key fuerte | 218 de 534 | 209 | 0 |
| Key débil (sin fuerte) | 148 de 534 | 143 | 0 |
| Forzada (social u oosCues.hard) | 16 de 534 | 16 | 14 |

Los keys los escribí mirando content.js **y** el dataset, así que esta capa sale algo favorecida en la validación. La prueba sin ese sesgo es `tools/elia/eval_holdout.py` con las preguntas de Esteban.

## Keys débiles promovidos a fuertes por los datos

Un key débil actúa como fuerte si en las preguntas de entrenamiento se activa ≥ 3 veces y ≥ 95 % de ellas son de su intención. En la validación cruzada se calcula dentro de cada pliegue; la última columna dice en cuántos pliegues se promovió. La columna "todos los datos" es la lista que usa el navegador (`promoted` en `elia-model.js`).

| Intención | Key | Todos los datos | Pliegues |
|---|---|---|---|
| `ceteris_code` | github | sí | 3/5 |
| `contact` | contact | sí | 5/5 |
| `contact` | contacto | sí | 4/5 |
| `contact` | correo | sí | 3/5 |
| `contact` | email | sí | 4/5 |
| `desk_minwage` | salario minimo | no | 1/5 |
| `desk_uncoli` | celular | no | 1/5 |
| `desk_uncoli` | celulares | sí | 5/5 |
| `desk_uncoli` | phone | no | 1/5 |
| `desk_uncoli` | phones | no | 1/5 |
| `ews` | agents | no | 1/5 |
| `exp_ms` | consulting | no | 1/5 |
| `exp_ms` | consultor | no | 1/5 |
| `exp_ms` | consultora | sí | 5/5 |
| `interests` | interests | sí | 3/5 |
| `jpm` | =morgan | sí | 3/5 |
| `languages` | speak | sí | 2/5 |
| `latest` | novedades | sí | 3/5 |
| `list_papers` | publications | sí | 4/5 |
| `location` | ciudad | sí | 2/5 |
| `mediabias` | bias | sí | 3/5 |
| `mediabias` | protestas | sí | 5/5 |
| `mediabias` | protests | sí | 5/5 |
| `mediabias` | sesgo | sí | 5/5 |
| `mediabias` | sesgos | sí | 5/5 |
| `paper_spatial` | spatial | sí | 5/5 |

## Aporte de cada paso (media ± desviación entre pliegues)

Cada etapa con su propia regla óptima de la grilla. "Anidada": la regla se elige con 4 pliegues y se mide en el 5.º (estimación sin optimismo).

| Etapa | Regla elegida | Responde bien | Bien (anidada) | Responde mal | Mal (anidada) | Mal ES (anidada) | "¿Te refieres a…?" | Correo | Rechazo OOS |
|---|---|---|---|---|---|---|---|---|---|
| Base (solo red) | t 0.70 · m 0.45 · c 0.15 | 46.3 ± 3.2 % | 44.4 ± 5.9 % | 4.9 ± 2.9 % | 4.6 ± 3.6 % | 4.5 ± 3.2 % | 40.7 ± 6.6 % | 8.0 ± 1.7 % | 98.3 ± 3.3 % |
| + keys fuertes/débiles + guardia OOS | t 0.70 · m 0.00 · c 0.20 · w 0.3 · β 1.0 | 65.2 ± 1.5 % | 63.0 ± 3.4 % | 4.7 ± 2.1 % | 4.4 ± 2.9 % | 4.8 ± 3.5 % | 22.2 ± 3.3 % | 7.9 ± 0.7 % | 98.3 ± 3.3 % |
| + plantillas | t 0.80 · m 0.00 · c 0.20 · w 0.3 · β 1.0 | 62.4 ± 4.4 % | 60.7 ± 7.6 % | 3.4 ± 1.5 % | 4.3 ± 2.4 % | 5.6 ± 2.9 % | 27.5 ± 5.4 % | 6.7 ± 3.1 % | 89.7 ± 6.2 % |
| + destilación | t 0.80 · m 0.00 · c 0.20 · w 0.3 · β 1.0 | 64.4 ± 2.8 % | 68.4 ± 5.9 % | 2.6 ± 1.4 % | 3.8 ± 2.3 % | 4.2 ± 2.9 % | 30.1 ± 2.0 % | 2.8 ± 1.5 % | 91.4 ± 5.3 % |
| (c) destilación sin keys débiles (con reglas sociales y guardia dura) | t 0.60 · m 0.40 · c 0.30 · w 0.4 · β 0.0 | 73.0 ± 3.4 % | 73.4 ± 5.2 % | 4.2 ± 2.4 % | 4.7 ± 2.5 % | 6.1 ± 3.7 % | 18.4 ± 2.1 % | 4.5 ± 2.4 % | 89.7 ± 9.9 % |
| + reglas sociales y guardia dura (final) | t 0.55 · m 0.25 · c 0.20 · w 0.4 · β 1.0 | 78.5 ± 2.6 % | 77.6 ± 3.1 % | 4.9 ± 1.6 % | 4.3 ± 2.2 % | 4.6 ± 3.1 % | 14.6 ± 2.5 % | 2.1 ± 1.5 % | 88.0 ± 10.2 % |

## Etapa final por idioma

Regla: threshold 0.55, margin 0.25, clarify 0.2, keyWeight 0.4, weakBonus 1.0 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| Responde bien | 78.5 ± 2.6 % | 77.6 ± 3.1 % | 76.9 ± 1.8 % | 76.6 ± 1.6 % | 80.0 ± 6.9 % | 78.4 ± 7.0 % | ≥ 80 % (referencia) |
| Responde mal | 4.9 ± 1.6 % | 4.3 ± 2.2 % | 4.9 ± 2.7 % | 4.6 ± 3.1 % | 4.9 ± 1.2 % | 4.1 ± 1.6 % | ≤ 5 % |
| "¿Te refieres a…?" | 14.6 ± 2.5 % | 15.7 ± 3.8 % | 16.3 ± 4.4 % | 16.7 ± 4.8 % | 12.8 ± 4.3 % | 14.7 ± 5.4 % |  |
|   … con la correcta entre las 3 opciones | 10.8 ± 2.9 % | 11.7 ± 4.0 % | 13.0 ± 4.5 % | 13.0 ± 4.5 % | 8.4 ± 2.7 % | 10.4 ± 4.1 % |  |
| Va a correo | 2.1 ± 1.5 % | 2.4 ± 2.0 % | 1.8 ± 1.3 % | 2.2 ± 1.4 % | 2.3 ± 2.2 % | 2.7 ± 2.9 % |  |
| Accuracy (argmax, tras reglas) | 83.6 ± 2.6 % | 83.6 ± 2.6 % | 83.7 ± 4.9 % | 83.7 ± 4.9 % | 83.4 ± 4.8 % | 83.4 ± 4.8 % |  |
| Rechazo de out_of_scope | 88.0 ± 10.2 % | 89.7 ± 9.9 % | 84.1 ± 15.8 % | 88.1 ± 16.8 % | 93.1 ± 8.6 % | 93.1 ± 8.6 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 23.9 ± 15.2 % | 25.6 ± 18.1 % | 21.5 ± 20.2 % | 25.5 ± 27.9 % | 25.2 ± 21.3 % | 25.2 ± 21.3 % |  |

**Referencia de la validación cruzada (anidada):** responde bien ✗ · responde mal ✓ · responde mal en ES ✓ · rechazo OOS ✓ → no se cumplen todas las referencias. La puerta de publicación es el holdout (arriba).

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | fuerte |
| what do you think about inflation forecasting | `interests` | `proj_inflation` | 1.00 | red |
| usas Power BI | `stack` | `jpm` | 1.00 | red |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 0.99 | fuerte |
| desde dónde trabajas | `location` | `job_current` | 0.99 | débil |
| eres una inteligencia artificial | `elia` | `proj_abi` | 0.99 | red |
| hace consultorías de valoración | `hire` | `exp_ms` | 0.99 | fuerte |
| who owns this website | `who` | `site` | 0.98 | red |
| are you available for consulting work | `hire` | `exp_ms` | 0.98 | fuerte |
| cuál es el mejor celular | `out_of_scope` | `desk_uncoli` | 0.98 | red |
| recomiéndame un celular barato | `out_of_scope` | `desk_uncoli` | 0.97 | red |
| es economista o ingeniero | `education` | `interests` | 0.95 | red |
| is he an economist or an engineer | `education` | `interests` | 0.91 | red |
| lo que publicas en X | `writing` | `list_papers` | 0.90 | red |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.88 | fuerte |
| which stack did you use for the bvar backtests | `proj_inflation` | `stack` | 0.85 | débil |
| qué piensas de la inflación este año | `out_of_scope` | `interests` | 0.78 | red |
| best phone for students | `out_of_scope` | `desk_uncoli` | 0.76 | red |
| what are your life goals | `out_of_scope` | `elia` | 0.76 | red |
| which project would you recommend I look at first | `list_projects` | `list_papers` | 0.73 | red |
| which paper won the FENADECO award | `paper_coca` | `list_papers` | 0.73 | débil |
| sobre qué ha investigado | `list_papers` | `interests` | 0.71 | red |
| where can I read your writing | `writing` | `contact` | 0.70 | red |
| what are your responsibilities right now | `job_current` | `list_papers` | 0.69 | red |
| dónde escribes | `writing` | `contact` | 0.68 | red |
| cuáles son tus hobbies | `out_of_scope` | `job_current` | 0.68 | red |
| a qué te has dedicado estos años | `who` | `list_papers` | 0.67 | red |
| who is behind estebanOS | `who` | `site` | 0.60 | fuerte |
| mil gracias por la info | `thanks` | `interests` | 0.58 | red |
| qué opinas de petro | `out_of_scope` | `interests` | 0.58 | red |
| what have you been up to lately | `latest` | `list_papers` | 0.58 | red |
| are you chatgpt | `elia` | `location` | 0.56 | red |
| your research using Saber 11 data | `list_papers` | `interests` | 0.56 | red |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`who` (15), `contact` (9), `latest` (9), `hire` (8), `interests` (7), `stack` (6), `education` (5), `list_papers` (5), `elia` (3), `job_current` (3), `cv` (2), `list_projects` (2), `plates` (2), `location` (2), `proj_saccr` (1)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 95.9 ± 2.4 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 526 | 8 |
| **real how=1** | 16 | 42 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 43 épocas (mediana de la validación cruzada), T = 0.725 (mediana).
- `assets/data/elia-model.js`: **348.0 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia y reglas sociales; tolerancia 1e-3).
- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).
