# EL·IA — reporte del modelo

Generado por `python tools/elia/train.py` el 2026-11-19. 371 preguntas originales (190 ES · 181 EN), 50 intenciones.

## Configuración

- Red: 4096 → 64 (ReLU, dropout 0.3) → 50 (softmax) + asks_how (sigmoide).
- Pérdida: CE con pesos de clase `inverse` + 0.5 × BCE(asks_how) + L2 0.0001. Adam lr 0.003, lote 64, 8 variantes por pregunta.
- Regla: responder si p1 ≥ 0.55 y p1 − p2 ≥ 0.15; "¿Te refieres a…?" si p1 ≥ 0.25; si no, ofrecer el correo. `out_of_scope` como 1.ª opción nunca responde. asks_how ≥ 0.5.
- Validación cruzada estratificada de 5 pliegues solo con preguntas originales; las variantes se generan dentro de cada pliegue a partir de su parte de entrenamiento. Early stopping y temperatura con una pregunta por clase separada del entrenamiento (nunca con el pliegue evaluado).
- Épocas por pliegue: [75, 97, 71, 60, 58] · temperatura por pliegue: [0.92, 0.81, 0.97, 0.95, 0.87].

## Métricas (media ± desviación entre pliegues)

| Métrica | Todas | ES | EN | Meta |
|---|---|---|---|---|
| Accuracy dentro del alcance (argmax) | 54.5 ± 2.6 % | 55.4 ± 2.2 % | 53.9 ± 4.7 % | ≥ 90 % |
| F1 macro (todas las clases) | 49.1 ± 3.8 % | 43.8 ± 2.8 % | 43.3 ± 4.8 % |  |
| Rechazo fuera de alcance (no responde) | 95.0 ± 6.1 % | 90.0 ± 20.0 % | 93.3 ± 13.3 % | ≥ 85 % |
| Dentro del alcance: responde bien | 42.7 ± 4.0 % | 44.1 ± 2.0 % | 41.5 ± 7.1 % |  |
| Dentro del alcance: responde mal | 11.5 ± 4.7 % | 12.7 ± 5.0 % | 10.1 ± 5.0 % |  |
| Dentro del alcance: "¿Te refieres a…?" | 23.3 ± 4.7 % | 22.5 ± 5.5 % | 24.0 ± 5.3 % |  |
|   … con la correcta entre las 3 opciones | 14.5 ± 5.2 % | 13.7 ± 3.5 % | 15.4 ± 8.4 % |  |
| Dentro del alcance: ofrece correo | 22.6 ± 3.5 % | 20.6 ± 3.0 % | 24.5 ± 5.8 % |  |
| Accuracy de asks_how | 94.0 ± 2.9 % | 91.8 ± 4.3 % | 96.7 ± 2.1 % |  |

**Resultado:** accuracy 54.5 % (meta 90 %) · rechazo 95.0 % (meta 85 %) → **no se cumplen todas las metas** (ver propuestas abajo).

## asks_how — matriz de confusión (suma de los pliegues)

| | predice how=0 | predice how=1 |
|---|---|---|
| **real how=0** | 310 | 3 |
| **real how=1** | 19 | 39 |

## Intenciones que más se confunden (argmax, suma de los pliegues)

| Real | Predicha | Veces |
|---|---|---|
| `latest` | `out_of_scope` | 4 |
| `ceteris_code` | `proj_ceteris` | 4 |
| `proj_equitydesk` | `out_of_scope` | 2 |
| `paper_bornthisway` | `mediabias` | 2 |
| `who` | `out_of_scope` | 2 |
| `certs` | `elia` | 2 |
| `interests` | `list_papers` | 2 |
| `contact` | `out_of_scope` | 2 |
| `cv` | `list_papers` | 2 |
| `out_of_scope` | `elia` | 2 |
| `ews` | `paper_banking` | 2 |
| `hire` | `location` | 2 |

## Preguntas fuera de alcance que se responderían

| Pregunta | Intención elegida | p1 |
|---|---|---|
| how do I cook pasta | `elia` | 0.71 |
| qué clima hace hoy en bogotá | `location` | 0.60 |

## Exportación

- Modelo final: 100 % de las preguntas, 71 épocas (mediana de la validación cruzada), T = 0.923 (mediana).
- `assets/data/elia-model.js`: **347.6 KB** (meta ≤ 400 KB). Pesos int8 con escala por capa.
- Cuantización: el int8 coincide con el modelo en float en el 100.0 % de las predicciones (argmax) sobre las preguntas originales.
- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas, tolerancia 1e-3).

## Curva de aprendizaje

Misma red y misma configuración; solo cambia cuántas preguntas originales hay en el entrenamiento de cada pliegue.

| Pliegues | Preguntas originales por clase en entrenamiento | Accuracy dentro del alcance | Rechazo fuera de alcance |
|---|---|---|---|
| 3 | 4.9 | 50.2 ± 3.7 % | 90.1 ± 3.1 % |
| 5 | 5.9 | 54.5 ± 2.6 % | 95.0 ± 6.1 % |
| 10 | 6.7 | 57.4 ± 5.9 % | 95.0 ± 10.0 % |

## Propuestas

- La curva sube unos 16 puntos cada vez que se duplican las preguntas por clase. Extrapolando (con solo 3 puntos, es una estimación gruesa): ~12 preguntas originales por clase para 70 %, ~18 para 80 % y ~28 para 90 %. Con unas 6 por clase hoy, la meta del 90 % pide escribir del orden de 1058 preguntas más.
- Clases con más errores en validación: `out_of_scope` (13), `elia` (8), `stack` (6), `writing` (6), `hire` (6), `site` (6), `plates` (6), `latest` (6). Antes de tocar la arquitectura, agregar 3–4 preguntas por clase con su palabra distintiva y con las formulaciones que fallaron.
- Para el rechazo: agregar a `out_of_scope` preguntas parecidas a las de la tabla de arriba (mismo vocabulario que el sitio, pero sin relación con Esteban).
