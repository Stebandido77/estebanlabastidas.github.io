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
| + plantillas | t 0.75 · m 0.00 · c 0.15 · w 0.3 · β 1.0 | 65.5 ± 4.0 % | 63.9 ± 6.5 % | 3.7 ± 0.9 % | 4.0 ± 1.9 % | 6.0 ± 3.0 % | 26.0 ± 4.4 % | 4.7 ± 2.5 % | 89.5 ± 6.5 % |
| + destilación | t 0.70 · m 0.00 · c 0.40 · w 0.3 · β 1.0 | 72.1 ± 2.3 % | 69.1 ± 7.8 % | 4.5 ± 2.2 % | 4.3 ± 2.4 % | 4.5 ± 2.9 % | 12.9 ± 2.6 % | 10.5 ± 2.1 % | 86.2 ± 8.5 % |
| (c) destilación sin keys débiles (con reglas sociales y guardia dura) | t 0.65 · m 0.00 · c 0.35 · w 0.3 · β 0.0 | 72.8 ± 4.0 % | 72.1 ± 2.2 % | 4.7 ± 1.6 % | 4.7 ± 2.6 % | 4.8 ± 3.2 % | 15.0 ± 2.4 % | 7.5 ± 2.4 % | 93.2 ± 9.7 % |
| + reglas sociales y guardia dura (final) | t 0.60 · m 0.25 · c 0.40 · w 0.4 · β 1.0 | 77.9 ± 2.9 % | 77.2 ± 2.6 % | 4.7 ± 1.5 % | 4.3 ± 2.5 % | 4.5 ± 3.1 % | 9.0 ± 2.1 % | 8.4 ± 2.0 % | 89.8 ± 8.1 % |

## Etapa final por idioma

Regla: threshold 0.6, margin 0.25, clarify 0.4, keyWeight 0.4, weakBonus 1.0 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| Responde bien | 77.9 ± 2.9 % | 77.2 ± 2.6 % | 78.0 ± 0.8 % | 77.3 ± 2.2 % | 77.6 ± 6.6 % | 76.8 ± 6.2 % | ≥ 80 % (referencia) |
| Responde mal | 4.7 ± 1.5 % | 4.3 ± 2.5 % | 4.5 ± 3.1 % | 4.5 ± 3.1 % | 4.9 ± 2.1 % | 4.1 ± 2.4 % | ≤ 5 % |
| "¿Te refieres a…?" | 9.0 ± 2.1 % | 13.3 ± 2.4 % | 8.0 ± 2.9 % | 12.2 ± 5.1 % | 10.1 ± 4.0 % | 14.9 ± 5.0 % |  |
|   … con la correcta entre las 3 opciones | 8.3 ± 1.9 % | 10.3 ± 2.6 % | 7.7 ± 3.3 % | 9.9 ± 4.1 % | 8.9 ± 3.3 % | 11.0 ± 3.9 % |  |
| Va a correo | 8.4 ± 2.0 % | 5.2 ± 3.4 % | 9.5 ± 1.5 % | 6.0 ± 3.3 % | 7.4 ± 4.6 % | 4.3 ± 4.2 % |  |
| Accuracy (argmax, tras reglas) | 85.2 ± 3.3 % | 85.2 ± 3.3 % | 85.6 ± 3.6 % | 85.6 ± 3.6 % | 84.6 ± 4.5 % | 84.6 ± 4.5 % |  |
| Rechazo de out_of_scope | 89.8 ± 8.1 % | 91.5 ± 9.1 % | 84.8 ± 15.7 % | 84.8 ± 15.7 % | 97.1 ± 5.7 % | 100.0 ± 0.0 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 17.3 ± 10.6 % | 25.9 ± 9.2 % | 11.3 ± 15.7 % | 20.4 ± 13.4 % | 23.7 ± 14.1 % | 29.9 ± 18.7 % |  |

**Referencia de la validación cruzada (anidada):** responde bien ✗ · responde mal ✓ · responde mal en ES ✓ · rechazo OOS ✓ → no se cumplen todas las referencias. La puerta de publicación es el holdout (arriba).

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | fuerte |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 1.00 | fuerte |
| desde dónde trabajas | `location` | `job_current` | 1.00 | débil |
| eres una inteligencia artificial | `elia` | `proj_abi` | 0.99 | red |
| usas Power BI | `stack` | `jpm` | 0.99 | red |
| what do you think about inflation forecasting | `interests` | `proj_inflation` | 0.98 | red |
| hace consultorías de valoración | `hire` | `exp_ms` | 0.97 | fuerte |
| recomiéndame un celular barato | `out_of_scope` | `desk_uncoli` | 0.97 | red |
| are you available for consulting work | `hire` | `exp_ms` | 0.97 | fuerte |
| who owns this website | `who` | `site` | 0.96 | red |
| es economista o ingeniero | `education` | `interests` | 0.96 | red |
| which stack did you use for the bvar backtests | `proj_inflation` | `stack` | 0.94 | débil |
| cuál es el mejor celular | `out_of_scope` | `desk_uncoli` | 0.93 | red |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.92 | fuerte |
| cuáles son tus hobbies | `out_of_scope` | `job_current` | 0.91 | red |
| lo que publicas en X | `writing` | `list_papers` | 0.90 | red |
| el prototipo con LLM y agentes | `ews` | `paper_llm` | 0.86 | fuerte |
| is he an economist or an engineer | `education` | `interests` | 0.85 | red |
| which paper won the FENADECO award | `paper_coca` | `list_papers` | 0.81 | débil |
| where can I read your writing | `writing` | `contact` | 0.80 | red |
| which project would you recommend I look at first | `list_projects` | `list_papers` | 0.79 | red |
| are you on X | `contact` | `location` | 0.75 | red |
| what are your responsibilities right now | `job_current` | `list_papers` | 0.73 | red |
| con qué herramientas trabajas los datos | `stack` | `job_current` | 0.72 | débil |
| qué piensas de la inflación este año | `out_of_scope` | `interests` | 0.71 | red |
| cuál es la capital de francia | `out_of_scope` | `skills_finance` | 0.65 | red |
| can I see your resume | `cv` | `list_papers` | 0.65 | débil |
| best phone for students | `out_of_scope` | `desk_uncoli` | 0.64 | red |
| how does your equity research workflow work | `proj_equitydesk` | `list_papers` | 0.64 | red |
| who is behind estebanOS | `who` | `site` | 0.60 | fuerte |
| cuáles son tus funciones actuales | `job_current` | `list_papers` | 0.60 | red |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`who` (16), `list_papers` (9), `interests` (8), `latest` (8), `hire` (7), `contact` (7), `education` (6), `stack` (5), `elia` (3), `list_projects` (3), `job_current` (3), `proj_saccr` (2), `plates` (2), `jpm` (1), `proj_pgn` (1)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 96.6 ± 2.3 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 528 | 6 |
| **real how=1** | 14 | 44 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 38 épocas (mediana de la validación cruzada), T = 0.617 (mediana).
- `assets/data/elia-model.js`: **348.0 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia y reglas sociales; tolerancia 1e-3).
- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).
