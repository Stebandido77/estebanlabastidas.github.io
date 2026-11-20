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
- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "¿Te refieres a…?" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold 0.3–0.95, margin 0.0–0.5, clarify 0.1–0.6 (paso 0.05), w ∈ [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3], β ∈ [0.0, 0.25, 0.5, 0.75, 1.0], percentil del detector ∈ [None, 80, 85, 90, 95, 98, 99, 100]. Las métricas "todas las preguntas" se cuentan como en `eval_holdout.py` (out_of_scope al correo = correcta). Se elige lo que maximiza 2 · correctas + "¿Te refieres a…?" con la opción correcta, con equivocadas ≤ 3% en todas **y en ES**, y rechazo de `out_of_scope` ≥ 85%.
- Detector de novedad: en la capa oculta (64), un prototipo (media) por intención y un radio (percentil de las distancias coseno de sus preguntas de entrenamiento y variantes al prototipo). Si la regla iba a responder y la pregunta queda fuera del radio de la ganadora, pasa a "¿Te refieres a…?" (primero las intenciones cuyo radio sí la contiene) o, si ninguna la contiene, al correo, aunque p1 sea alta. Un key fuerte o una respuesta forzada ganan sobre el detector. El percentil se elige con la misma grilla; en la validación cruzada, prototipos y radios salen solo del pliegue de entrenamiento.

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

| Etapa | Regla elegida | Correctas (anidada) | Útiles (anidada) | Equivocadas (anidada) | Equivocadas ES (anidada) | Responde bien | Responde mal | "¿Te refieres a…?" | Correo | Rechazo OOS |
|---|---|---|---|---|---|---|---|---|---|---|
| Base (solo red) | t 0.80 · m 0.50 · c 0.15 | 39.6 ± 10.0 % | 75.6 ± 3.1 % | 2.9 ± 2.7 % | 3.4 ± 2.4 % | 40.0 ± 3.3 % | 2.9 ± 2.3 % | 49.1 ± 6.0 % | 8.0 ± 1.7 % | 98.3 ± 3.3 % |
| + keys fuertes/débiles + guardia OOS | t 0.80 · m 0.50 · c 0.15 · w 0.3 · β 1.0 | 49.2 ± 6.9 % | 83.1 ± 3.5 % | 2.8 ± 2.3 % | 3.4 ± 2.7 % | 50.2 ± 2.9 % | 2.7 ± 2.3 % | 41.8 ± 5.3 % | 5.3 ± 1.4 % | 98.3 ± 3.3 % |
| + plantillas | ninguna cumple | nan ± nan % | nan ± nan % | nan ± nan % | nan ± nan % | | | | | |
| + destilación | t 0.95 · m 0.50 · c 0.25 · w 0.3 · β 1.0 | 47.0 ± 4.3 % | 83.5 ± 2.7 % | 3.0 ± 1.5 % | 4.7 ± 2.7 % | 45.7 ± 3.9 % | 1.9 ± 1.0 % | 47.9 ± 3.4 % | 4.5 ± 0.8 % | 94.7 ± 4.3 % |
| (c) destilación sin keys débiles (con reglas sociales y guardia dura) | t 0.95 · m 0.50 · c 0.25 · w 0.3 · β 0.0 | 48.1 ± 9.5 % | 85.8 ± 3.2 % | 2.6 ± 1.9 % | 3.5 ± 3.0 % | 44.8 ± 4.8 % | 1.9 ± 1.0 % | 50.3 ± 4.4 % | 3.0 ± 1.3 % | 98.3 ± 3.3 % |
| + reglas sociales y guardia dura (sin detector) | t 0.95 · m 0.50 · c 0.25 · w 0.3 · β 1.0 | 50.3 ± 8.2 % | 86.4 ± 3.0 % | 2.7 ± 2.2 % | 3.5 ± 3.0 % | 48.2 ± 4.0 % | 1.9 ± 1.0 % | 47.1 ± 3.6 % | 2.8 ± 1.4 % | 98.3 ± 3.3 % |
| + detector de novedad (final) | t 0.95 · m 0.50 · c 0.25 · w 0.3 · β 1.0 | 50.3 ± 8.2 % | 86.4 ± 3.0 % | 2.7 ± 2.2 % | 3.5 ± 3.0 % | 48.2 ± 4.0 % | 1.9 ± 1.0 % | 47.1 ± 3.6 % | 2.8 ± 1.4 % | 98.3 ± 3.3 % |

## Etapa final por idioma

Regla: threshold 0.95, margin 0.5, clarify 0.25, keyWeight 0.3, weakBonus 1.0 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| **Correctas, todas las preguntas** (como el holdout) | 49.5 ± 3.6 % | 50.3 ± 8.2 % | 49.4 ± 3.9 % | 49.9 ± 6.5 % | 49.5 ± 8.9 % | 50.3 ± 13.1 % | ≥ 65 % |
| **Útiles, todas las preguntas** | 87.8 ± 1.9 % | 86.4 ± 3.0 % | 87.6 ± 3.1 % | 86.6 ± 4.0 % | 87.8 ± 4.0 % | 86.1 ± 4.7 % | ≥ 88 % (interna) |
| **Equivocadas, todas las preguntas** | 1.9 ± 1.0 % | 2.7 ± 2.2 % | 2.7 ± 1.8 % | 3.5 ± 3.0 % | 1.1 ± 0.9 % | 2.0 ± 1.5 % | ≤ 3 % (interna) |
| Bloqueadas por el detector | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % |  |
| Responde bien (dentro del alcance) | 48.2 ± 4.0 % | 49.3 ± 8.6 % | 48.8 ± 3.2 % | 49.8 ± 6.3 % | 47.3 ± 8.2 % | 48.4 ± 13.0 % | ≥ 80 % (referencia) |
| Responde mal (dentro del alcance) | 1.9 ± 1.0 % | 2.6 ± 2.1 % | 2.7 ± 2.0 % | 3.1 ± 2.7 % | 1.2 ± 1.0 % | 2.2 ± 1.7 % | ≤ 5 % |
| "¿Te refieres a…?" | 47.1 ± 3.6 % | 44.6 ± 11.4 % | 45.9 ± 5.9 % | 43.8 ± 11.1 % | 48.4 ± 7.6 % | 45.8 ± 14.7 % |  |
|   … con la correcta entre las 3 opciones | 42.4 ± 3.6 % | 40.1 ± 10.6 % | 42.3 ± 7.1 % | 40.5 ± 11.0 % | 42.6 ± 6.8 % | 40.0 ± 13.7 % |  |
| Va a correo | 2.8 ± 1.4 % | 3.4 ± 2.5 % | 2.6 ± 1.9 % | 3.4 ± 2.7 % | 3.1 ± 2.1 % | 3.5 ± 3.2 % |  |
| Accuracy (argmax, tras reglas) | 85.2 ± 3.3 % | 84.1 ± 4.1 % | 85.6 ± 3.6 % | 84.0 ± 5.3 % | 84.6 ± 4.5 % | 83.8 ± 4.7 % |  |
| Rechazo de out_of_scope | 98.3 ± 3.3 % | 96.5 ± 4.3 % | 97.1 ± 5.7 % | 93.8 ± 7.6 % | 100.0 ± 0.0 % | 100.0 ± 0.0 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 36.1 ± 11.9 % | 37.7 ± 15.0 % | 40.8 ± 26.8 % | 40.8 ± 26.8 % | 29.9 ± 18.7 % | 32.8 ± 21.3 % |  |

**Referencia de la validación cruzada (anidada):** equivocadas ≤ 3 % ✓ · útiles ≥ 88 % ✗ · equivocadas en ES ≤ 3 % ✗ · rechazo OOS ✓ → no se cumplen todas las referencias. La puerta de publicación es el holdout (arriba).

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | fuerte |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 1.00 | fuerte |
| desde dónde trabajas | `location` | `job_current` | 1.00 | débil |
| eres una inteligencia artificial | `elia` | `proj_abi` | 0.99 | red |
| usas Power BI | `stack` | `jpm` | 0.99 | red |
| hace consultorías de valoración | `hire` | `exp_ms` | 0.98 | fuerte |
| what do you think about inflation forecasting | `interests` | `proj_inflation` | 0.98 | red |
| are you available for consulting work | `hire` | `exp_ms` | 0.97 | fuerte |
| recomiéndame un celular barato | `out_of_scope` | `desk_uncoli` | 0.97 | red |
| who owns this website | `who` | `site` | 0.96 | red |
| es economista o ingeniero | `education` | `interests` | 0.96 | red |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`who` (29), `list_papers` (26), `contact` (21), `interests` (19), `education` (16), `latest` (15), `hire` (13), `job_current` (10), `location` (10), `skills_finance` (9), `list_projects` (7), `paper_spatial` (6), `stack` (6), `elia` (6), `writing` (5)

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
