# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 371 preguntas originales (190 ES · 181 EN), 50 intenciones.

## Configuración

- Red: 4096 → 64 (ReLU, dropout 0.3) → 50 (softmax) + asks_how (sigmoide). Pérdida: CE con pesos de clase `inverse` + 0.5 × BCE(asks_how) + L2 0.0001. Adam lr 0.003, lote 64, 8 variantes por pregunta.
- Keys: `keys` de cada intención en content.js. Coincidencia exacta, o a distancia de Levenshtein ≤ 1 si las dos palabras tienen ≥ 5 letras. Si coinciden keys de dos intenciones, decide la red. asks_how siempre sale de la red.
- Plantillas: 30 plantillas × keys y títulos, 30 filas por intención (+1 variante cada una), solo en entrenamiento.
- Validación cruzada estratificada de 5 pliegues solo con preguntas originales (los mismos pliegues en todas las etapas). Early stopping y temperatura con una pregunta por clase separada del entrenamiento. Las variantes y las plantillas nunca están en el pliegue evaluado.
- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "¿Te refieres a…?" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold 0.3–0.9, margin 0.0–0.5, clarify 0.1–0.6 (paso 0.05) y la mezcla con keys (`mix` w ∈ 0.3–0.9, `bonus` β ∈ 0.5–4). Se elige lo que maximiza "responde bien" con responde mal ≤ 5% y rechazo de `out_of_scope` ≥ 85%; luego el clarify que maximiza aciertos − fallos dentro de "¿Te refieres a…?".

## Capa de keys sola (sin red, todas las preguntas dentro del alcance)

Con key único: 247 de 331 (75%); de esos, 240 con la intención correcta y 7 con otra. Las 2 preguntas fuera de alcance con key quedan para la red y la regla.
Los keys los escribí mirando content.js **y** el dataset, y los corregí una vez tras un diagnóstico (quité `metro`, que a una letra coincide con "petro", y `website`, y agregué `agentes`/`github`). Por eso esta capa está algo favorecida en la validación; la prueba real son preguntas nuevas.

## Aporte de cada paso (media ± desviación entre pliegues, todas las preguntas)

Cada etapa con su propia regla óptima de la grilla. "Anidada": la regla se elige con 4 pliegues y se mide en el 5.º, que es la estimación honesta; la otra columna elige y mide en los mismos datos.

| Etapa | Regla elegida | Accuracy (argmax) | Responde bien | Responde bien (anidada) | Responde mal | Responde mal (anidada) | "¿Te refieres a…?" | Correo | Rechazo OOS |
|---|---|---|---|---|---|---|---|---|---|
| Base (solo red) | t 0.75 · m 0.00 · c 0.25 | 54.5 ± 2.6 % | 31.5 ± 5.1 % | 31.5 ± 5.1 % | 4.5 ± 2.6 % | 4.5 ± 2.6 % | 41.4 ± 4.6 % | 22.6 ± 3.5 % | 100.0 ± 0.0 % |
| + keys | t 0.65 · m 0.00 · c 0.25 · mix 0.3 | 81.0 ± 2.4 % | 77.4 ± 1.8 % | 77.1 ± 1.6 % | 4.8 ± 1.4 % | 5.5 ± 3.3 % | 9.4 ± 1.4 % | 8.4 ± 2.7 % | 92.5 ± 6.1 % |
| + keys + plantillas | t 0.60 · m 0.00 · c 0.30 · mix 0.4 | 85.9 ± 2.7 % | 82.6 ± 3.0 % | 82.3 ± 3.4 % | 4.8 ± 1.5 % | 4.5 ± 2.7 % | 5.7 ± 2.6 % | 6.9 ± 1.3 % | 90.0 ± 5.0 % |

## Etapa final (+ keys + plantillas) por idioma

Regla: threshold 0.6, margin 0.0, clarify 0.3, keys `mix` 0.4 (ya escritos en content.js).

| Métrica | Todas | ES | EN | Meta |
|---|---|---|---|---|
| Responde bien | 82.6 ± 3.0 % | 82.9 ± 2.3 % | 81.9 ± 5.9 % | ≥ 80 % |
| Responde mal | 4.8 ± 1.5 % | 5.2 ± 3.1 % | 4.2 ± 3.1 % | ≤ 5 % |
| "¿Te refieres a…?" | 5.7 ± 2.6 % | 4.8 ± 3.0 % | 7.1 ± 5.6 % |  |
|   … con la correcta entre las 3 opciones | 4.2 ± 3.1 % | 3.5 ± 3.4 % | 5.3 ± 4.6 % |  |
| Va a correo | 6.9 ± 1.3 % | 7.1 ± 3.0 % | 6.8 ± 2.8 % |  |
| Accuracy (argmax, tras keys) | 85.9 ± 2.7 % | 85.9 ± 2.0 % | 85.8 ± 5.5 % |  |
| Rechazo de out_of_scope | 90.0 ± 5.0 % | 91.0 ± 11.1 % | 91.7 ± 10.5 % | ≥ 85 % |
| out_of_scope que cae en "¿Te refieres a…?" | 10.0 ± 9.4 % | 23.0 ± 20.4 % | 0.0 ± 0.0 % |  |

**Resultado:** responde bien 82.6 % (anidada 82.3 %; meta 80 %) · responde mal 4.8 % (meta ≤ 5 %) · rechazo 90.0 % (meta 85 %) → **se cumplen las metas.**

## Respuestas equivocadas en validación (etapa final)

| Pregunta | Real | Respondió | p1 |
|---|---|---|---|
| el hilo de salario minimo e informalidad | `writing` | `desk_minwage` | 1.00 |
| who's the guy behind this site | `who` | `site` | 1.00 |
| hace consultorías de valoración | `hire` | `exp_ms` | 0.99 |
| cómo combinaste el LLM con los modelos econométricos en el paper | `ews` | `paper_llm` | 0.99 |
| cómo funciona el sistema de agentes para invertir en acciones | `proj_equitydesk` | `ews` | 0.98 |
| can you write my essay | `out_of_scope` | `writing` | 0.97 |
| where do you work | `job_current` | `elia` | 0.94 |
| eres una inteligencia artificial | `elia` | `proj_abi` | 0.94 |
| cuál es el mejor celular | `out_of_scope` | `desk_uncoli` | 0.92 |
| estás en bogotá | `location` | `paper_spatial` | 0.86 |
| dónde escribes | `writing` | `location` | 0.82 |
| qué opinas de petro | `out_of_scope` | `plates` | 0.76 |
| mil gracias por la info | `thanks` | `desk_dmg` | 0.75 |
| de dónde eres | `location` | `elia` | 0.70 |
| where are you based | `location` | `elia` | 0.67 |
| show me your research | `list_papers` | `interests` | 0.67 |
| which stack did you use for the bvar backtests | `proj_inflation` | `stack` | 0.65 |
| translate this to german | `out_of_scope` | `site` | 0.63 |
| which paper won the FENADECO award | `paper_coca` | `list_papers` | 0.61 |
| hi | `greeting` | `who` | 0.60 |

## Intenciones que más se quedan sin responder ("¿Te refieres a…?" o correo)

`goodbye` (5), `greeting` (4), `who` (3), `education` (3), `jpm` (2), `interests` (2), `writing` (2), `hire` (2), `location` (2), `elia` (2), `thanks` (2), `list_papers` (2), `list_projects` (2), `proj_equitydesk` (1), `proj_pgn` (1)

## asks_how (red de la etapa final, suma de los pliegues)

Accuracy 95.7 ± 2.7 %.

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 305 | 8 |
| **real how=1** | 8 | 50 |

## Exportación

- Modelo final: 100 % de las preguntas y las plantillas, 56 épocas (mediana de la validación cruzada), T = 0.974 (mediana).
- `assets/data/elia-model.js`: **347.6 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; coincide con el modelo en float en el 100.0 % de las predicciones.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 45 con keys, tolerancia 1e-3).
