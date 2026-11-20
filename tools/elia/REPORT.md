# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 652 preguntas originales (332 ES · 320 EN), 51 intenciones.

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
| Key fuerte | 218 de 534 | 209 | 0 |
| Key débil (sin fuerte) | 148 de 534 | 143 | 6 |
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
| Base (solo red) | ninguna cumple | nan ± nan % | nan ± nan % | nan ± nan % | nan ± nan % | | | | | |
| + keys fuertes/débiles + guardia OOS | ninguna cumple | nan ± nan % | nan ± nan % | nan ± nan % | nan ± nan % | | | | | |
| + plantillas | ninguna cumple | nan ± nan % | nan ± nan % | nan ± nan % | nan ± nan % | | | | | |
| + destilación | ninguna cumple | 63.4 ± 0.0 % | 80.9 ± 0.0 % | 2.3 ± 0.0 % | 2.9 ± 0.0 % | | | | | |
| (c) destilación sin keys débiles (con reglas sociales y guardia dura) | t 0.75 · m 0.50 · c 0.35 · w 0.4 · β 0.0 | 66.4 ± 3.7 % | 84.9 ± 2.4 % | 3.2 ± 1.9 % | 3.0 ± 2.8 % | 62.6 ± 4.7 % | 2.8 ± 2.6 % | 24.2 ± 5.4 % | 10.3 ± 2.9 % | 95.8 ± 3.8 % |
| + reglas sociales y guardia dura (sin detector) | t 0.85 · m 0.50 · c 0.40 · w 0.3 · β 1.0 | 65.7 ± 5.5 % | 85.1 ± 2.3 % | 2.8 ± 1.5 % | 2.8 ± 2.8 % | 61.9 ± 5.3 % | 2.5 ± 2.0 % | 24.8 ± 5.6 % | 10.9 ± 3.1 % | 96.6 ± 3.2 % |
| + detector de novedad (final) | t 0.85 · m 0.50 · c 0.40 · w 0.3 · β 1.0 | 65.7 ± 5.5 % | 85.1 ± 2.3 % | 2.8 ± 1.5 % | 2.8 ± 2.8 % | 61.9 ± 5.3 % | 2.5 ± 2.0 % | 24.8 ± 5.6 % | 10.9 ± 3.1 % | 96.6 ± 3.2 % |

## Frontera correctas ↔ equivocadas (anidada)

Para cada meta de correctas (todas las preguntas), la regla con menos equivocadas que la cumple en los 4 pliegues de elección, medida en el 5.º. Solo esa restricción (sin útiles ni rechazo). "Con detector" incluye la opción de no usarlo.

| Variante | Correctas ≥ | Equivocadas | Correctas logradas | Útiles | Pliegues con regla | Percentil elegido |
|---|---|---|---|---|---|---|
| sin detector | 50 % | 1.5 % | 53.3 % | 75.3 % | 5/5 | {None: 5} |
| sin detector | 55 % | 1.8 % | 56.9 % | 76.2 % | 5/5 | {None: 5} |
| sin detector | 60 % | 2.3 % | 61.0 % | 78.6 % | 5/5 | {None: 5} |
| sin detector | 65 % | 2.6 % | 66.5 % | 79.6 % | 5/5 | {None: 5} |
| sin detector | 70 % | 4.2 % | 70.3 % | 78.5 % | 5/5 | {None: 5} |
| sin detector | 75 % | 4.3 % | 75.4 % | 78.8 % | 5/5 | {None: 5} |
| con detector | 50 % | 2.2 % | 55.3 % | 70.5 % | 5/5 | {98: 3, 80: 1, None: 1} |
| con detector | 55 % | 2.5 % | 59.0 % | 69.9 % | 5/5 | {98: 3, 80: 1, None: 1} |
| con detector | 60 % | 2.9 % | 62.8 % | 71.4 % | 5/5 | {98: 4, None: 1} |
| con detector | 65 % | 3.3 % | 65.4 % | 71.8 % | 5/5 | {None: 2, 99: 1, 98: 2} |
| con detector | 70 % | 4.2 % | 70.3 % | 78.5 % | 5/5 | {None: 5} |
| con detector | 75 % | 4.3 % | 75.4 % | 78.8 % | 5/5 | {None: 5} |

## Etapa final por idioma

Regla: threshold 0.85, margin 0.5, clarify 0.4, keyWeight 0.3, weakBonus 1.0 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| **Correctas, todas las preguntas** (como el holdout) | 65.9 ± 4.8 % | 65.7 ± 5.5 % | 64.8 ± 6.7 % | 64.3 ± 6.1 % | 66.9 ± 3.3 % | 67.2 ± 5.3 % | ≥ 65 % |
| **Útiles, todas las preguntas** | 85.1 ± 2.0 % | 85.1 ± 2.3 % | 84.9 ± 2.8 % | 84.8 ± 3.6 % | 85.3 ± 2.7 % | 85.3 ± 2.7 % | ≥ 88 % (interna) |
| **Equivocadas, todas las preguntas** | 2.6 ± 1.7 % | 2.8 ± 1.5 % | 2.8 ± 2.8 % | 2.8 ± 2.8 % | 2.5 ± 0.8 % | 2.8 ± 0.6 % | ≤ 3 % (interna) |
| Bloqueadas por el detector | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % | 0.0 ± 0.0 % |  |
| Responde bien (dentro del alcance) | 61.9 ± 5.3 % | 62.0 ± 6.7 % | 60.8 ± 8.0 % | 60.8 ± 8.0 % | 62.8 ± 3.0 % | 63.2 ± 5.7 % | ≥ 80 % (referencia) |
| Responde mal (dentro del alcance) | 2.5 ± 2.0 % | 2.6 ± 1.8 % | 3.0 ± 3.2 % | 3.0 ± 3.2 % | 1.9 ± 1.1 % | 2.3 ± 0.6 % | ≤ 5 % |
| "¿Te refieres a…?" | 24.8 ± 5.6 % | 24.8 ± 6.0 % | 24.8 ± 6.3 % | 25.4 ± 5.1 % | 25.0 ± 5.9 % | 24.2 ± 7.1 % |  |
|   … con la correcta entre las 3 opciones | 23.5 ± 5.6 % | 23.7 ± 6.0 % | 24.4 ± 6.5 % | 25.0 ± 5.4 % | 22.7 ± 5.1 % | 22.3 ± 7.0 % |  |
| Va a correo | 10.9 ± 3.1 % | 10.6 ± 4.0 % | 11.4 ± 3.7 % | 10.8 ± 5.3 % | 10.3 ± 5.4 % | 10.3 ± 5.4 % |  |
| Accuracy (argmax, tras reglas) | 81.2 ± 4.5 % | 81.0 ± 4.5 % | 79.6 ± 5.6 % | 79.2 ± 6.0 % | 82.8 ± 5.7 % | 82.8 ± 5.7 % |  |
| Rechazo de out_of_scope | 96.6 ± 3.2 % | 96.6 ± 3.2 % | 98.3 ± 3.3 % | 98.3 ± 3.3 % | 95.1 ± 4.1 % | 95.1 ± 4.1 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 12.6 ± 7.4 % | 14.3 ± 8.9 % | 15.7 ± 8.4 % | 19.7 ± 13.0 % | 9.7 ± 9.4 % | 9.7 ± 9.4 % |  |

**Referencia de la validación cruzada (anidada):** equivocadas ≤ 3 % ✓ · útiles ≥ 88 % ✗ · equivocadas en ES ≤ 3 % ✓ · rechazo OOS ✓ → no se cumplen todas las referencias. La puerta de publicación es el holdout (arriba).

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | fuerte |
| eres una inteligencia artificial | `elia` | `proj_abi` | 1.00 | red |
| usas Power BI | `stack` | `jpm` | 1.00 | red |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 1.00 | fuerte |
| is he an economist or an engineer | `education` | `interests` | 1.00 | red |
| desde dónde trabajas | `location` | `job_current` | 1.00 | débil |
| what are you bad at | `out_of_scope` | `elia` | 1.00 | débil |
| who owns this website | `who` | `site` | 0.99 | red |
| are you available for consulting work | `hire` | `exp_ms` | 0.98 | fuerte |
| hace consultorías de valoración | `hire` | `exp_ms` | 0.98 | fuerte |
| lo que publicas en X | `writing` | `list_papers` | 0.97 | red |
| en qué eres malo | `out_of_scope` | `elia` | 0.95 | débil |
| what are your life goals | `out_of_scope` | `elia` | 0.94 | red |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.94 | fuerte |
| which paper won the FENADECO award | `paper_coca` | `list_papers` | 0.94 | débil |
| what do you think about inflation forecasting | `interests` | `proj_inflation` | 0.90 | red |
| what's one thing you'd change about yourself | `out_of_scope` | `who` | 0.89 | débil |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`who` (25), `list_papers` (18), `interests` (15), `contact` (13), `hire` (13), `education` (12), `latest` (11), `location` (7), `job_current` (6), `stack` (6), `cv` (6), `list_projects` (6), `plates` (4), `proj_saccr` (3), `proj_andina` (3)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 96.6 ± 1.9 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 588 | 6 |
| **real how=1** | 16 | 42 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 43 épocas (mediana de la validación cruzada), T = 0.669 (mediana).
- `assets/data/elia-model.js`: **348.0 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia y reglas sociales; tolerancia 1e-3).
- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).
