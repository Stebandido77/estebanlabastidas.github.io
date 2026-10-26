# estebanOS — sitio personal de Esteban Labastidas

Un escritorio tipo macOS en el navegador: login sobre curvas de nivel de los Andes, wallpaper de
Bogotá en blanco y negro, menubar con todas las páginas, Dock, ventanas que se arrastran,
redimensionan y minimizan, búsqueda con ⌘K, música generativa y, en el celular, una pantalla de
inicio tipo iOS.

- Sitio: https://stebandido77.github.io/estebanlabastidas.github.io/
- Versión anterior ("The classic notebook"): [`/classic/`](classic/)

HTML + CSS + JavaScript sin frameworks ni build step. Funciona en GitHub Pages y también abriendo
`index.html` directamente (`file://`).

## Ver el sitio en local

Abre `index.html` en el navegador, o sirve la carpeta (recomendado, igual que en GitHub Pages):

```bash
python -m http.server 8000
# http://localhost:8000/
```

El login aparece una vez por sesión del navegador. Para verlo de nuevo: menú **EL → Lock Screen**
(⌃⌘Q) o cierra la pestaña.

## Editar el contenido

**Todo el contenido vive en [`assets/data/content.js`](assets/data/content.js)** (`window.DATA`).
Las apps solo leen de ahí; no hace falta tocar HTML ni JS.

| Quiero cambiar… | Clave en `content.js` | Dónde aparece |
|---|---|---|
| Papers | `papers`, `paperStatus` | Research, Spotlight, Terminal (`papers`) |
| Investigaciones en diseño | `pipeline` | Research → *On the desk* |
| Proyectos y su categoría | `projects`, `projectCategories` (`markets` · `research` · `oss`) | Projects (color de carpeta y filtros) |
| Experiencia, formación, credenciales, método | `traj`, `formation`, `credentials`, `methodIntro`, `pillars`, `resumeTitle` | Résumé |
| Hilos y ensayos | `voice` | Writing (Notes) |
| Láminas | `plates` | Photos |
| Línea de tiempo | `chron` | Activity |
| Favoritos | `favorites` (`[nombre, url, glifo, color]`) | Links (Safari) |
| Tesis, bio, intereses, datos del encabezado | `thesis`, `bio`, `interests`, `heroMeta`, `kicker` | About |
| Palabras del retrato | `portraitWords`, `portraitKeyWords` (en ámbar) | About |
| Correo, CV, redes | `contact`, `mail` | Contact (Mail), Terminal, menú EL |
| Frase del widget del celular | `homeTagline` | Inicio en el celular |

Los pendientes que dependen de ti están marcados con `TODO(esteban)` dentro de `content.js`
(fechas de EUDE, link del paper de EMR si es SSRN 6968222, fechas de OCT/SEP 2026 en el
Chronicle, música propia).

Algunos textos están también en `index.html` a propósito, porque deben existir sin JavaScript
(buscadores, redes sociales y usuarios sin JS): `<title>`, las metas `description` / `og:*` /
`twitter:*` y la ficha `<noscript>`. Si cambias el cargo o la descripción, actualízalos también ahí.

**El CV** está en `assets/docs/CV_Esteban_Labastidas.pdf`: reemplaza el archivo con el mismo nombre.

## Actualizar los datos de mercado

Son **fijos** (el sitio no consulta APIs). En `content.js`, clave `markets`:

```js
"markets": {
  "asOf": "20 Oct 2026",
  "banrep": {"value": 12.25, "label": "12.25%", "note": "▲ 25 bp · 30 Sep 26", "short": "▲ 25 bp"},
  "cpi":    {"value": 6.29,  "label": "6.29%",  "note": "Sep 2026", "short": "Sep"},
  "usdcop": {"value": 3163.60, "label": "3,163.60", "compact": "3,164", "note": "20 Oct 2026", "short": "20 Oct"}
}
```

1. Cambia `asOf` por la fecha de corte.
2. **BanRep:** tasa de política del Banco de la República (banrep.gov.co). Actualiza `value`,
   `label` y la nota del último movimiento.
3. **CPI:** inflación anual del IPC publicada por el DANE (dane.gov.co).
4. **USD/COP:** TRM o cierre del día. `value` es el número (ancla el gráfico simulado de Markets),
   `label` el texto con decimales y `compact` el redondeado para la menubar y el celular.

Los ves en la menubar (≥ 1280 px), en el widget del celular y en el panel *WATCH · REAL* de Markets.
**El gráfico de velas de Markets es una simulación** anclada a `usdcop.value` y siempre está rotulado
así; no son datos de mercado.

## Música

Por defecto la música es **generativa**: se crea en el navegador con Web Audio, sin archivos ni
licencias. Nunca suena sola: arranca con el parlante de la menubar, la app Music, el comando
`music` en la Terminal o el botón ♪ del login.

### Agregar pistas propias

1. Usa solo música con licencia que permita uso web (CC0 o licencia explícita) y guarda el
   crédito y la licencia.
2. Sube los `.mp3` a `assets/audio/`.
3. Crea `assets/audio/playlist.json`:
   ```json
   {"tracks": [
     {"title": "Nombre de la pista", "src": "assets/audio/pista.mp3", "credit": "Autor · CC0"}
   ]}
   ```
4. En `content.js` cambia `"music": {"playlist": null}` por
   `"music": {"playlist": "assets/audio/playlist.json"}`.

Con playlist, las pistas se reproducen en orden con un crossfade de 3 s. Sin playlist, se usa el
motor generativo.

## Atajos

| Atajo | Acción |
|---|---|
| ⌘K / Ctrl+K | Spotlight (↑ ↓ para moverse, Enter abre, Esc cierra) |
| ⌥W | Cerrar la ventana activa |
| ⌥M | Minimizar la ventana activa |
| ⌥` | Alternar entre ventanas |
| ⌃⌘Q | Bloquear (volver al login) |
| Doble clic en la barra de título | Zoom a la zona de trabajo |

⌘W, ⌘M y ⌘` también están conectados, pero Safari y Chrome los reservan para la pestaña o la
ventana del navegador, así que casi nunca llegan a la página. Por eso existen las variantes con ⌥.
Los mismos comandos están en el menú **EL → Window**.

## Estructura

```
index.html                 shell: login, menubar, Dock, home del celular, <noscript>
css/os.css                 tokens, wallpaper, login, menubar, Dock, ventanas, Spotlight
css/apps.css               estilos de cada app
js/os.js                   window manager, layout, menús, Spotlight, reloj
js/wallpaper.js            foto de Bogotá en B/N + skyline procedural de respaldo + grano
js/lock.js                 login estilo macOS (curvas de nivel)
js/apps/*.js               una app por archivo
js/portrait.js             retrato de palabras → foto
js/audio.js                motor de música
assets/data/content.js     TODO el contenido
assets/data/portrait-lum*  luminancia del retrato (.bin, y .js para file://)
assets/img/                retrato, wallpaper, og.jpg
assets/visualizations/     láminas (originales y -1400.jpg)
classic/                   el sitio anterior
tools/                     scripts de mantenimiento (no se publican como parte del sitio)
```

## Herramientas (`tools/`)

| Script | Para qué |
|---|---|
| `python tools/wallpaper.py foto.jpg` | Genera el wallpaper en B/N (`wallpaper-2560/1440/900.webp` y `.jpg`) |
| `python tools/plates.py` | Genera las versiones `-1400.jpg` de las láminas |
| `python tools/og.py` | Genera `assets/img/og.jpg` (1200×630) con Instrument Serif de `tools/fonts/` |
| `python tools/lum_js.py` | Regenera `portrait-lum.js` si cambia `portrait-lum.bin` |
| `node tools/perf.mjs` | Mide fluidez en Chrome headless (ver abajo) |

`tools/perf.mjs` no tiene dependencias (Node ≥ 22 y Chrome instalado). Con el sitio servido en
`http://localhost:8765/`:

```bash
node tools/perf.mjs                    # escritorio 1440×900
node tools/perf.mjs --mobile --cpu=4   # 390×844, CPU 4× más lenta
node tools/perf.mjs --audio            # música: nada suena sin gesto, pausa, invitación
node tools/perf.mjs --axe              # accesibilidad (axe) en login, escritorio y cada app
node tools/perf.mjs --file             # prueba con file://
```

## Créditos y licencias

- **Wallpaper:** "Bogotá, Monserrate, 2023-06 CN-02.jpg", de Steffen Schmitz (Carschten), Wikimedia
  Commons, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Las versiones en B/N son
  una adaptación bajo la misma licencia. Ver `assets/img/WALLPAPER-CREDIT.md`.
- **Fuentes:** Instrument Serif, Montserrat, JetBrains Mono y Archivo, vía Google Fonts (SIL OFL 1.1).
  `tools/fonts/` incluye Instrument Serif con su `OFL.txt`, que solo usa `tools/og.py`.
