# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 680 preguntas originales (346 ES · 334 EN), 51 intenciones.

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
- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "¿Te refieres a…?" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold 0.3–0.95, margin 0.0–0.5, clarify 0.1–0.6 (paso 0.05), w ∈ [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3], β ∈ [0.0, 0.25, 0.5, 0.75, 1.0], percentil del detector ∈ [None, 80, 85, 90, 95, 98, 99, 100]. Las métricas "todas las preguntas" se cuentan como en `eval_holdout.py` (out_of_scope al correo = correcta). Se elige la regla con **menos equivocadas** (desempate: equivocadas en ES) entre las que cumplen correctas ≥ 65%, útiles ≥ 85%, rechazo de `out_of_scope` ≥ 85% y rechazo en el set de calibración (`oos_calib.csv`) ≥ 85%; el detector y su percentil entran en la misma grilla.
- Detector de novedad: en la capa oculta (64), un prototipo (media) por intención y un radio (percentil de las distancias coseno de sus preguntas de entrenamiento y variantes al prototipo). Si la regla iba a responder y la pregunta queda fuera del radio de la ganadora, pasa a "¿Te refieres a…?" (primero las intenciones cuyo radio sí la contiene) o, si ninguna la contiene, al correo, aunque p1 sea alta. Un key fuerte o una respuesta forzada ganan sobre el detector. El percentil se elige con la misma grilla; en la validación cruzada, prototipos y radios salen solo del pliegue de entrenamiento.

## Reglas solas (sin red)

| Regla | Preguntas dentro del alcance que la activan | Con la intención correcta | Fuera de alcance que la activan |
|---|---|---|---|
| Key fuerte | 234 de 562 | 227 | 0 |
| Key débil (sin fuerte) | 162 de 562 | 155 | 6 |
| Forzada (social u oosCues.hard) | 16 de 562 | 16 | 14 |

Los keys los escribí mirando content.js **y** el dataset, así que esta capa sale algo favorecida en la validación. La prueba sin ese sesgo es `tools/elia/eval_holdout.py` con las preguntas de Esteban.

## Keys débiles promovidos a fuertes por los datos

Un key débil actúa como fuerte si en las preguntas de entrenamiento se activa ≥ 3 veces y ≥ 95 % de ellas son de su intención. En la validación cruzada se calcula dentro de cada pliegue; la última columna dice en cuántos pliegues se promovió. La columna "todos los datos" es la lista que usa el navegador (`promoted` en `elia-model.js`).

| Intención | Key | Todos los datos | Pliegues |
|---|---|---|---|
| `contact` | contact | sí | 4/5 |
| `contact` | contacto | sí | 4/5 |
| `contact` | correo | sí | 3/5 |
| `contact` | email | sí | 4/5 |
| `desk_uncoli` | celulares | sí | 5/5 |
| `desk_uncoli` | phone | no | 1/5 |
| `desk_uncoli` | phones | no | 1/5 |
| `ews` | agents | no | 1/5 |
| `exp_ms` | consulting | no | 1/5 |
| `exp_ms` | consultor | no | 1/5 |
| `exp_ms` | consultora | sí | 5/5 |
| `exp_ms` | consultoria | no | 1/5 |
| `interests` | interests | sí | 2/5 |
| `jpm` | =morgan | sí | 3/5 |
| `languages` | speak | sí | 2/5 |
| `latest` | novedades | sí | 3/5 |
| `list_papers` | publications | sí | 3/5 |
| `location` | ciudad | sí | 2/5 |
| `mediabias` | bias | sí | 3/5 |
| `mediabias` | protestas | sí | 5/5 |
| `mediabias` | protests | sí | 5/5 |
| `mediabias` | sesgo | sí | 5/5 |
| `mediabias` | sesgos | sí | 5/5 |
| `paper_spatial` | spatial | sí | 5/5 |
| `proj_patrion` | app | sí | 5/5 |

## Aporte de cada paso (media ± desviación entre pliegues)

Cada etapa con su propia regla óptima de la grilla. "Anidada": la regla se elige con 4 pliegues y se mide en el 5.º (estimación sin optimismo).

| Etapa | Regla elegida | Correctas (anidada) | Útiles (anidada) | Equivocadas (anidada) | Equivocadas ES (anidada) | Responde bien | Responde mal | "¿Te refieres a…?" | Correo | Rechazo OOS |
|---|---|---|---|---|---|---|---|---|---|---|
| Base (solo red) | ninguna cumple | nan ± nan % | nan ± nan % | nan ± nan % | nan ± nan % | | | | | |
| + keys fuertes/débiles + guardia OOS | ninguna cumple | nan ± nan % | nan ± nan % | nan ± nan % | nan ± nan % | | | | | |
| + plantillas | ninguna cumple | nan ± nan % | nan ± nan % | nan ± nan % | nan ± nan % | | | | | |
| + destilación | t 0.80 · m 0.50 · c 0.20 · w 0.3 · β 1.0 | 67.1 ± 4.6 % | 81.6 ± 1.6 % | 3.2 ± 2.1 % | 3.7 ± 3.5 % | 63.2 ± 4.9 % | 1.4 ± 1.4 % | 27.3 ± 7.3 % | 8.0 ± 3.0 % | 94.0 ± 3.5 % |
| (c) destilación sin keys débiles (con reglas sociales y guardia dura) | t 0.80 · m 0.50 · c 0.25 · w 0.3 · β 0.0 | 66.8 ± 5.3 % | 81.6 ± 3.3 % | 2.5 ± 2.1 % | 3.3 ± 2.8 % | 62.3 ± 6.7 % | 1.4 ± 1.4 % | 26.4 ± 7.1 % | 9.8 ± 1.8 % | 98.3 ± 3.5 % |
| + reglas sociales y guardia dura (sin detector) | t 0.80 · m 0.50 · c 0.25 · w 0.3 · β 0.25 | 67.0 ± 4.6 % | 84.7 ± 4.6 % | 1.5 ± 1.7 % | 1.7 ± 2.2 % | 63.0 ± 6.2 % | 1.4 ± 1.4 % | 26.6 ± 6.9 % | 8.9 ± 2.4 % | 98.3 ± 3.5 % |
| + detector de novedad (final) | t 0.80 · m 0.50 · c 0.25 · w 0.3 · β 0.25 | 67.0 ± 4.6 % | 84.7 ± 4.6 % | 1.5 ± 1.7 % | 1.7 ± 2.2 % | 63.0 ± 6.2 % | 1.4 ± 1.4 % | 26.6 ± 6.9 % | 8.9 ± 2.4 % | 98.3 ± 3.5 % |

## Frontera correctas ↔ equivocadas (anidada)

Para cada meta de correctas (todas las preguntas), la regla con menos equivocadas que la cumple en los 4 pliegues de elección, medida en el 5.º. Solo esa restricción (sin útiles ni rechazo). "Con detector" incluye la opción de no usarlo.

| Variante | Correctas ≥ | Equivocadas | Correctas logradas | Útiles | Pliegues con regla | Percentil elegido |
|---|---|---|---|---|---|---|
| sin detector | 50 % | 1.0 % | 53.3 % | 77.0 % | 5/5 | {None: 5} |
| sin detector | 55 % | 1.0 % | 55.5 % | 79.5 % | 5/5 | {None: 5} |
| sin detector | 60 % | 1.2 % | 61.8 % | 79.2 % | 5/5 | {None: 5} |
| sin detector | 65 % | 1.5 % | 68.2 % | 79.1 % | 5/5 | {None: 5} |
| sin detector | 70 % | 1.9 % | 69.8 % | 78.6 % | 5/5 | {None: 5} |
| sin detector | 75 % | 2.5 % | 74.5 % | 80.3 % | 5/5 | {None: 5} |
| con detector | 50 % | 1.2 % | 55.4 % | 69.3 % | 5/5 | {85: 1, 80: 1, None: 3} |
| con detector | 55 % | 1.3 % | 56.9 % | 62.6 % | 5/5 | {85: 1, 80: 3, None: 1} |
| con detector | 60 % | 1.3 % | 62.2 % | 74.1 % | 5/5 | {99: 4, None: 1} |
| con detector | 65 % | 2.1 % | 67.9 % | 75.3 % | 5/5 | {99: 2, None: 3} |
| con detector | 70 % | 1.9 % | 69.8 % | 78.6 % | 5/5 | {None: 5} |
| con detector | 75 % | 2.5 % | 74.5 % | 80.3 % | 5/5 | {None: 5} |

## Etapa final por idioma

Regla: threshold 0.8, margin 0.5, clarify 0.25, keyWeight 0.3, weakBonus 0.25 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| **Correctas, todas las preguntas** (como el holdout) | 66.4 ± 4.5 % | 67.0 ± 4.6 % | 65.6 ± 2.0 % | 66.8 ± 2.6 % | 67.4 ± 8.7 % | 67.4 ± 8.7 % | ≥ 65 % |
| **Útiles, todas las preguntas** | 85.9 ± 2.9 % | 84.7 ± 4.6 % | 83.9 ± 5.1 % | 83.0 ± 6.9 % | 88.0 ± 2.4 % | 86.5 ± 2.7 % | ≥ 88 % (interna) |
| **Equivocadas, todas las preguntas** | 1.5 ± 1.7 % | 1.5 ± 1.7 % | 1.7 ± 2.2 % | 1.7 ± 2.2 % | 1.2 ± 1.2 % | 1.2 ± 1.2 % | ≤ 3 % (interna) |
| Bloqueadas por el detector | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % |  |
| Responde bien (dentro del alcance) | 63.0 ± 6.2 % | 63.4 ± 6.5 % | 62.8 ± 4.3 % | 63.5 ± 5.3 % | 63.5 ± 9.5 % | 63.5 ± 9.5 % | ≥ 80 % (referencia) |
| Responde mal (dentro del alcance) | 1.4 ± 1.4 % | 1.4 ± 1.4 % | 1.6 ± 2.0 % | 1.6 ± 2.0 % | 1.1 ± 0.9 % | 1.1 ± 0.9 % | ≤ 5 % |
| "¿Te refieres a…?" | 26.6 ± 6.9 % | 23.9 ± 7.8 % | 25.8 ± 5.0 % | 22.8 ± 6.3 % | 27.3 ± 9.2 % | 24.8 ± 10.0 % |  |
|   … con la correcta entre las 3 opciones | 23.6 ± 6.3 % | 21.4 ± 7.2 % | 22.1 ± 4.2 % | 19.5 ± 6.2 % | 24.7 ± 9.3 % | 23.0 ± 10.0 % |  |
| Va a correo | 8.9 ± 2.4 % | 11.3 ± 5.7 % | 9.8 ± 3.4 % | 12.1 ± 7.7 % | 8.1 ± 2.1 % | 10.6 ± 4.3 % |  |
| Accuracy (argmax, tras reglas) | 82.0 ± 2.7 % | 82.0 ± 2.7 % | 80.3 ± 4.3 % | 80.3 ± 4.3 % | 83.6 ± 2.7 % | 83.6 ± 2.7 % |  |
| Rechazo de out_of_scope | 98.3 ± 3.5 % | 98.3 ± 3.5 % | 97.5 ± 5.0 % | 97.5 ± 5.0 % | 98.7 ± 2.7 % | 98.7 ± 2.7 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 16.0 ± 6.5 % | 14.3 ± 6.1 % | 20.4 ± 11.1 % | 17.2 ± 11.6 % | 12.7 ± 6.5 % | 12.7 ± 6.5 % |  |

**Referencia de la validación cruzada (anidada):** equivocadas ≤ 3 % ✓ · útiles ≥ 88 % ✗ · equivocadas en ES ≤ 3 % ✓ · rechazo OOS ✓ → no se cumplen todas las referencias. La puerta de publicación es el holdout (arriba).

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 1.00 | fuerte |
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | débil |
| hace consultorías de valoración | `hire` | `exp_ms` | 1.00 | fuerte |
| who owns this website | `who` | `site` | 1.00 | red |
| desde dónde trabajas | `location` | `job_current` | 0.98 | débil |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.98 | fuerte |
| are you available for consulting work | `hire` | `exp_ms` | 0.95 | fuerte |
| what shows are you watching lately | `out_of_scope` | `latest` | 0.91 | red |
| what do you think about inflation forecasting | `interests` | `proj_inflation` | 0.90 | red |
| practicas algún deporte | `out_of_scope` | `desk_breb` | 0.86 | red |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`who` (26), `interests` (15), `stack` (14), `list_papers` (14), `education` (13), `hire` (13), `contact` (12), `latest` (12), `job_current` (9), `location` (9), `skills_finance` (7), `cv` (5), `elia` (5), `list_projects` (5), `paper_spatial` (4)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 96.8 ± 0.6 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 615 | 5 |
| **real how=1** | 17 | 43 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 54 épocas (mediana de la validación cruzada), T = 0.687 (mediana).
- `assets/data/elia-model.js`: **348.0 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia y reglas sociales; tolerancia 1e-3).
- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).
