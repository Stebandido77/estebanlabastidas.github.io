# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 592 preguntas originales (302 ES · 290 EN), 51 intenciones.

## Puerta de publicación

**Lo que decide si EL·IA se publica es el holdout, no esta validación cruzada:** `python tools/elia/eval_holdout.py` sobre `tools/elia/data/holdout.csv` (preguntas que escribe Esteban y que nunca entran al entrenamiento ni sirven para ajustar keys). Las tres metas del holdout, sobre todas sus preguntas, deben cumplirse: **correctas ≥ 70 %; correctas + "¿Te refieres a…?" con una opción válida ≥ 85 %; equivocadas ≤ 5 %.** Una respuesta es correcta si coincide con `intent` o con alguna de `alt`; si `out_of_scope` es válida, mandar al correo también cuenta. `dev_holdout.csv` (el holdout anterior) ya se usó para decidir cambios y solo es referencia. El 80 % de respuestas correctas de la validación cruzada es una referencia, no un requisito: con pocas preguntas por intención, la cifra se mueve varios puntos según el reparto de los pliegues (73–80 % con el mismo diseño en dos semillas).

## Configuración

- Red: 4096 → 64 (ReLU, dropout 0.3) → 51 (softmax) + asks_how (sigmoide). Pérdida: CE con pesos de clase `inverse` + 0.5 × BCE(asks_how) + L2 0.0001. Adam lr 0.003, lote 64, 8 variantes por pregunta.
- Keys (content.js, regla en `common.py` y `js/elia-net.js`): coincidencia exacta, o a distancia de Levenshtein ≤ 1 si las dos palabras tienen ≥ 5 letras, o prefijo si la del key tiene ≥ 6 (contactar → contactarte). **Fuertes** (`keys`) de una sola intención: p = w·p_red + (1 − w)·[intención], basta para responder. **Débiles** (`weak`), solo si no hay fuertes: p ∝ p_red·e^β en esa intención, nunca basta sin la red. Keys de dos intenciones, o una frase de `oosCues.soft`: decide la red. asks_how siempre sale de la red.
- Guardia dura (`oosCues.hard`: clima, chiste, traduce, redacta, write my…): la pregunta va a `out_of_scope` sin pasar por la red; EL·IA nunca responde y ofrece el correo.
- Reglas sociales (`social`): ≤ 4 palabras formadas solo por frases de una lista (greeting, goodbye o thanks) y relleno → respuesta directa, sin red.
- Plantillas: 62 plantillas × keys (fuertes y débiles) y títulos, 40 filas por intención (+1 variante cada una), solo en entrenamiento.
- Validación cruzada estratificada de 5 pliegues solo con preguntas originales (los mismos pliegues en todas las etapas). Early stopping y temperatura con una pregunta por clase separada del entrenamiento. Las variantes y las plantillas nunca están en el pliegue evaluado.
- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "¿Te refieres a…?" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold 0.3–0.9, margin 0.0–0.5, clarify 0.1–0.6 (paso 0.05), w ∈ [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3], β ∈ [0.0, 0.25, 0.5, 0.75, 1.0]. Se elige lo que maximiza "responde bien" con responde mal ≤ 5% en todas **y en ES**, y rechazo de `out_of_scope` ≥ 85%; luego el clarify que maximiza aciertos − fallos dentro de "¿Te refieres a…?".

## Reglas solas (sin red)

| Regla | Preguntas dentro del alcance que la activan | Con la intención correcta | Fuera de alcance que la activan |
|---|---|---|---|
| Key fuerte | 181 de 534 | 163 | 0 |
| Key débil (sin fuerte) | 169 de 534 | 163 | 0 |
| Forzada (social u oosCues.hard) | 16 de 534 | 16 | 14 |

Los keys los escribí mirando content.js **y** el dataset, así que esta capa sale algo favorecida en la validación. La prueba sin ese sesgo es `tools/elia/eval_holdout.py` con las preguntas de Esteban.

## Aporte de cada paso (media ± desviación entre pliegues)

Cada etapa con su propia regla óptima de la grilla. "Anidada": la regla se elige con 4 pliegues y se mide en el 5.º (estimación sin optimismo).

| Etapa | Regla elegida | Responde bien | Bien (anidada) | Responde mal | Mal (anidada) | Mal ES (anidada) | "¿Te refieres a…?" | Correo | Rechazo OOS |
|---|---|---|---|---|---|---|---|---|---|
| Base (solo red) | t 0.75 · m 0.00 · c 0.15 | 43.2 ± 3.1 % | 42.7 ± 7.5 % | 3.8 ± 2.9 % | 4.6 ± 3.4 % | 4.9 ± 3.5 % | 44.6 ± 6.7 % | 8.4 ± 1.3 % | 98.3 ± 3.3 % |
| + keys fuertes/débiles + guardia OOS | t 0.75 · m 0.00 · c 0.20 · w 0.3 · β 1.0 | 51.9 ± 2.6 % | 50.8 ± 3.4 % | 4.5 ± 2.0 % | 4.9 ± 2.7 % | 5.5 ± 3.3 % | 35.5 ± 4.1 % | 8.0 ± 1.2 % | 98.3 ± 3.3 % |
| + plantillas | t 0.80 · m 0.00 · c 0.10 · w 0.9 · β 1.0 | 58.8 ± 6.2 % | 55.2 ± 9.5 % | 3.4 ± 1.7 % | 3.6 ± 1.6 % | 5.2 ± 2.7 % | 34.6 ± 7.5 % | 3.2 ± 1.8 % | 88.0 ± 3.8 % |
| + reglas sociales y guardia dura (final) | t 0.80 · m 0.00 · c 0.10 · w 0.9 · β 1.0 | 61.4 ± 6.5 % | 58.2 ± 10.1 % | 3.4 ± 1.7 % | 3.6 ± 1.6 % | 5.2 ± 2.7 % | 32.5 ± 7.6 % | 2.7 ± 1.9 % | 95.0 ± 6.7 % |

## Etapa final por idioma

Regla: threshold 0.8, margin 0.0, clarify 0.1, keyWeight 0.9, weakBonus 1.0 (ya escritos en content.js). Columnas "anidada": la estimación honesta.

| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |
|---|---|---|---|---|---|---|---|
| Responde bien | 61.4 ± 6.5 % | 58.2 ± 10.1 % | 63.4 ± 7.2 % | 60.4 ± 8.6 % | 58.9 ± 9.3 % | 55.3 ± 13.4 % | ≥ 80 % (referencia) |
| Responde mal | 3.4 ± 1.7 % | 3.6 ± 1.6 % | 4.9 ± 2.8 % | 5.2 ± 2.7 % | 1.9 ± 1.1 % | 1.9 ± 1.1 % | ≤ 5 % |
| "¿Te refieres a…?" | 32.5 ± 7.6 % | 35.6 ± 11.4 % | 29.2 ± 9.9 % | 31.9 ± 11.3 % | 36.4 ± 9.5 % | 40.0 ± 13.9 % |  |
|   … con la correcta entre las 3 opciones | 27.3 ± 6.9 % | 30.4 ± 10.8 % | 25.3 ± 9.1 % | 28.1 ± 11.4 % | 29.4 ± 6.7 % | 33.0 ± 11.2 % |  |
| Va a correo | 2.7 ± 1.9 % | 2.7 ± 1.9 % | 2.5 ± 1.8 % | 2.5 ± 1.8 % | 2.8 ± 2.2 % | 2.8 ± 2.2 % |  |
| Accuracy (argmax, tras reglas) | 83.1 ± 3.2 % | 81.0 ± 2.0 % | 82.1 ± 4.5 % | 80.8 ± 3.0 % | 83.8 ± 4.1 % | 81.1 ± 4.3 % |  |
| Rechazo de out_of_scope | 95.0 ± 6.7 % | 96.7 ± 6.7 % | 94.3 ± 11.4 % | 94.3 ± 11.4 % | 97.1 ± 5.7 % | 100.0 ± 0.0 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 34.2 ± 11.4 % | 35.9 ± 13.9 % | 47.0 ± 28.6 % | 47.0 ± 28.6 % | 19.7 ± 11.5 % | 22.6 ± 14.7 % |  |

**Referencia de la validación cruzada (anidada):** responde bien ✗ · responde mal ✓ · responde mal en ES ✗ · rechazo OOS ✓ → no se cumplen todas las referencias. La puerta de publicación es el holdout (arriba).

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 | Origen |
|---|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 | débil |
| eres una inteligencia artificial | `elia` | `proj_abi` | 1.00 | red |
| where can I write to him | `contact` | `writing` | 1.00 | débil |
| who owns this website | `who` | `site` | 0.99 | red |
| desde dónde trabajas | `location` | `job_current` | 0.99 | débil |
| dónde le escribo | `contact` | `writing` | 0.99 | red |
| quién está detrás de este sitio | `who` | `site` | 0.98 | red |
| hace consultorías de valoración | `hire` | `exp_ms` | 0.98 | red |
| quién es el dueño de esta página | `who` | `site` | 0.97 | red |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 0.97 | fuerte |
| recomiéndame un celular barato | `out_of_scope` | `desk_uncoli` | 0.97 | red |
| what do you think about inflation forecasting | `interests` | `proj_inflation` | 0.96 | red |
| cuál es el mejor celular | `out_of_scope` | `desk_uncoli` | 0.96 | red |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.93 | débil |
| are you available for consulting work | `hire` | `exp_ms` | 0.93 | red |
| es economista o ingeniero | `education` | `interests` | 0.93 | red |
| usas Power BI | `stack` | `jpm` | 0.91 | red |
| dónde hizo el pregrado | `education` | `plates` | 0.91 | débil |
| lo que publicas en X | `writing` | `list_papers` | 0.86 | red |
| best phone for students | `out_of_scope` | `desk_uncoli` | 0.83 | red |
| what city is Esteban from | `location` | `who` | 0.80 | débil |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`who` (22), `contact` (18), `list_papers` (18), `interests` (15), `hire` (12), `latest` (11), `job_current` (10), `education` (8), `stack` (7), `list_projects` (6), `location` (6), `skills_finance` (6), `cv` (5), `writing` (4), `languages` (4)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 96.6 ± 1.5 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 523 | 11 |
| **real how=1** | 9 | 49 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 58 épocas (mediana de la validación cruzada), T = 1.175 (mediana).
- `assets/data/elia-model.js`: **347.7 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia y reglas sociales; tolerancia 1e-3).
- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).
