# Referencia completa

← [Volver al índice](../README.md)

Librería de gráficos **mobile-first**, ligera (~21 KB gzip) y sin dependencias. Se usa igual desde HTML puro, React, Vue, Angular, Svelte o dentro de una WebView (React Native, Flutter, Capacitor).

## Qué resuelve

| Problema típico en móvil | Qué hace PocketChart |
|---|---|
| Etiquetas del eje X cortadas (`11/19 0…`) | Calcula cuántas caben según el ancho real, las desplaza hacia dentro en los bordes y nunca las corta |
| Scroll horizontal para ver todo el rango | Pellizco para zoom, arrastre para moverse, inercia y un mini-mapa cuando hay zoom |
| Tooltip lejos del gráfico o bajo el dedo | El tooltip flota junto al punto, por encima del dedo, y se reubica si no cabe |
| Chips de series en varias filas apretadas | Leyenda en una sola fila deslizable; los chips muestran el valor del punto inspeccionado |
| Series con unidades distintas mezcladas | `yAxis` por serie: cada magnitud con su escala y su eje del color de la serie. O `legend.mode: 'single'`: una serie a la vez |
| Curvas que inventan picos | Curva monótona: nunca pasa por encima ni por debajo de los datos reales |
| Pantalla completa que no funciona en iPhone | Usa la API nativa (y bloquea en horizontal en Android); en iOS usa un modo a pantalla completa propio |
| Miles de puntos lentos | Reducción min/máx por píxel: dibuja 8.760 puntos sin perder picos |

## Gestos

- **Tocar**: muestra el valor (otro toque en el mismo punto lo cierra).
- **Mantener y arrastrar**: recorre los puntos (con vibración suave en Android).
- **Arrastrar en horizontal**: recorre los puntos; si hay zoom, desplaza el gráfico.
- **Arrastrar en vertical**: hace scroll de la página (el gráfico no la secuestra).
- **Pellizcar**: zoom en el eje X anclado entre los dedos.
- **Doble toque**: acerca 3× o restablece.
- **Mantener un chip**: ver sólo esa serie (otra vez, ver todas).
- Escritorio: rueda + Ctrl para zoom, scroll horizontal para moverse, teclado (← → + − 0 Esc).

## Instalación

```html
<script src="dist/pocketchart.min.js"></script>   <!-- expone window.PocketChart y registra <pocket-chart> -->
```

```js
import { create, register } from './dist/pocketchart.esm.js';
```

## Uso

### Etiqueta HTML (cualquier tecnología)

```html
<pocket-chart type="line" title="Feed Cycles" legend-mode="single" height="260">
  <script type="application/json">
    { "series": [
      { "name": "Gallons", "unit": "gal", "data": [["2026-11-14T00:00", 351.4], ["2026-11-14T02:00", 355.6]] },
      { "name": "FeedTemp", "unit": "°F", "data": [["2026-11-14T00:00", 68.1], ["2026-11-14T02:00", 68.9]] }
    ] }
  </script>
</pocket-chart>
```

Desde un framework, asigna la propiedad `config`:

```jsx
// React
const ref = useRef();
useEffect(() => { ref.current.config = { type: 'bar', series, categories }; }, [series]);
return <pocket-chart ref={ref} />;
```

```vue
<!-- Vue -->
<pocket-chart :config="{ type: 'area', series }" @inspect="onInspect" />
```

### JavaScript

```js
const chart = PocketChart.create('#grafico', {
  type: 'area',
  title: 'Consumo eléctrico',
  series: [{ name: 'Consumo', unit: 'kWh', data: [[Date, valor], ...] }],
});
chart.on('inspect', (sel) => { /* { x, label, points: [{ series, x, y, data }] } o null */ });
chart.on('zoom', ({ from, to, zoomed }) => {});
chart.on('toggle', ({ key, visible, hidden }) => {});
chart.on('ready', () => {});      // terminó la animación de entrada
chart.load(promesaOFuncion);     // carga con animación
chart.setLoading(true, { type: 'dots' });
chart.replay();
chart.setData(nuevasSeries);
chart.update({ type: 'bar' });
chart.zoomTo(desde, hasta);
chart.resetZoom();
chart.toggleFullscreen();
chart.destroy();
```

## Animaciones

### Mientras carga

```js
const chart = PocketChart.create('#grafico', { type: 'line', loader: { type: 'wave', text: 'Cargando ventas…' } });

// Opción A: le pasas la promesa (o una función que la devuelva) y se encarga de todo
chart.load(() => fetch('/api/ventas').then((r) => r.json()));   // si falla, muestra un error y se reintenta con un toque

// Opción B: control manual
chart.setLoading(true, { type: 'spinner' });
chart.setData(series);          // quita la carga y lanza la animación de entrada
```

| `loader.type` | Qué muestra |
|---|---|
| `skeleton` | Silueta del gráfico (línea, barras, puntos o anillo) con un brillo que la recorre |
| `pulse` | La misma silueta latiendo |
| `wave` | Tres ondas en movimiento con los colores del tema |
| `spinner` | Círculo girando con texto |
| `dots` | Tres puntos que rebotan |

También: `loading: true` en las opciones para empezar en carga, o el atributo `loading` / `loader="dots"` en `<pocket-chart>`.

### Al terminar de cargar (entrada)

```js
animation: {
  enter: 'wave',          // draw | grow | wave | pop | fade | none
  duration: 800,          // ms
  easing: 'back',         // linear | easeIn | easeOut | easeOutCubic | easeInOut | back | elastic | bounce | (t) => t
  delay: 0,               // ms
  stagger: 600,           // ms entre el primer y el último punto (wave/pop)
  update: 450,            // ms de transición cuando llegan datos nuevos (0 = sin transición)
  onVisible: true,        // cada gráfico anima su entrada cuando aparece en pantalla, no al cargar la página
  replayOnView: false,    // true = repetir la entrada cada vez que vuelve a verse
}
```

| `enter` | Línea / área | Barras | Dispersión | Pie / donut |
|---|---|---|---|---|
| `draw` | Se dibuja de izquierda a derecha | Se descubren de izquierda a derecha | Igual | Barrido circular |
| `grow` | Sube desde la base | Crecen todas a la vez | Aparecen creciendo | El anillo crece desde el centro |
| `wave` | Sube en ola de izquierda a derecha | Crecen en cascada | En cascada | Porción a porción |
| `pop` | Ola con rebote y marcadores que saltan | Cascada con rebote | Saltan | Porciones con rebote |
| `fade` | Fundido | Fundido | Fundido | Fundido |

`chart.replay()` repite la entrada. `setData()` anima de los valores viejos a los nuevos. Eventos: `visible` (entra o sale de pantalla), `ready` (terminó la entrada), `updated` (terminó la transición), `error`. Si el usuario tiene activado "reducir movimiento" en su sistema, todas las animaciones se desactivan solas.

## Estilo completo

```js
PocketChart.create('#grafico', {
  colors: ['#0b6e99', '#2bb3c0', '#f2a65a'],          // colores de las series (en orden)
  colorsDark: ['#38a3d1', '#4fd0dc', '#f6b97a'],      // opcional, para tema oscuro
  theme: 'auto',                                      // auto | light | dark
  style: {                                            // tema claro (también: line = bordes finos del tooltip)
    bg: '#fbf8f1', fg: '#2b2620', muted: '#7a6f60',
    grid: 'rgba(0,0,0,.08)', axis: 'rgba(0,0,0,.3)',
    chip: '#f1ebdd', chipOn: '#e6dcc4', tip: '#fffdf7',
    font: 'Georgia, serif', radius: 16,
  },
  styleDark: { bg: '#0d1b2a', fg: '#e0e6ef' },         // mismas claves para oscuro
  line: { width: 2.5, curve: 'smooth', dash: null },   // curve: smooth | linear | step · dash: [6, 4]
  markers: { show: 'auto', size: 4, shape: 'diamond' },// show: auto | true | false · circle | square | diamond
  area: { opacity: 0.3 },
  bar: { radius: 8, width: 0.7 },
  grid: { show: true, dashed: true },
  axis: { x: true, y: true },
  donut: { thickness: 0.3 },
  series: [
    // cada serie puede sobrescribir: color, colorDark, type, curve, lineWidth, dash, fillOpacity, markers, radius
    { name: 'Meta', data, color: '#999', dash: [6, 4], lineWidth: 1.5, markers: { show: false } },
  ],
});
```

## Opciones

| Opción | Por defecto | Descripción |
|---|---|---|
| `type` | `'line'` | `line`, `area`, `bar`, `scatter`, `pie`, `donut`. Cada serie puede tener su propio `type` (mixtos) |
| `series` | `[]` | `{ name, data, unit?, color?, type?, smooth?, stack?, format?, yAxis? }` |
| `toImage()`, `toData()` | | Imagen y datos del gráfico para tu propio PDF. Ver *Insertar el gráfico en el PDF de tu app* |
| `export` | ver *Exportar* | Botón de descarga y formatos (PNG, PDF, Excel, CSV). `false` lo oculta |
| `stack` | `false` | `true` apila barras, áreas y líneas; `'percent'` las apila al 100 %. Ver *Apilado* |
| `data` | | `[y, ...]`, `[[x, y], ...]` o `[{ x, y }]` / `[{ label, value }]`. `x` puede ser `Date`, ISO, epoch ms, número o texto |
| `categories` | `null` | Etiquetas del eje X para datos `[y, ...]` |
| `title`, `subtitle` | `''` | Cabecera |
| `height` | `260` | Alto del área de dibujo (en pantalla completa ocupa todo) |
| `x.type` | `'auto'` | `time`, `linear`, `category` (se detecta solo) |
| `x.format(v, 'tick'\|'full')` | | Formato propio del eje X |
| `y.min`, `y.max`, `y.zero` | auto | Límites; `zero` fuerza incluir el 0 (activo por defecto en barras y áreas) |
| `y.format(v)` | | Formato de valores |
| `y.title` | | Texto encima del eje Y principal |
| `series[].yAxis` | | `{ min?, max?, opposite?, show?, id?, format?, title?, zero? }`. Escala Y propia de la serie. Ver *Ejes Y múltiples* |
| `legend.mode` | `'multi'` | `single` = una serie a la vez |
| `legend.show` | `'auto'` | Se muestra si hay más de una serie |
| `zoom`, `pan`, `hover`, `fullscreen`, `animate`, `hint` | `true` | Activar o desactivar comportamientos (`animate: false` apaga todas las animaciones) |
| `animation` | ver arriba | Entrada, curva de tiempo, duración, retraso, escalonado y transición al actualizar |
| `loading`, `loader` | `false`, `skeleton` | Estado de carga y su animación |
| `colors`, `colorsDark`, `style`, `styleDark` | | Colores y tema (ver *Estilo completo*) |
| `line`, `markers`, `area`, `bar`, `grid`, `axis`, `donut` | | Trazo, marcadores, relleno, barras, rejilla, ejes y grosor del donut |
| `navigator` | `'auto'` | Mini-mapa: `auto` (sólo con zoom), `true`, `false` |
| `maxPixelRatio` | `2` | Resolución máxima del lienzo |
| `theme` | `'auto'` | `light`, `dark`; `auto` sigue al sistema y a `data-theme` en `<html>` |
| `lang` | `'auto'` | `es`, `en` para textos de la interfaz |
| `locale` | navegador | Formato de fechas y números |
| `tooltip.format(sel)` | | Devuelve HTML propio para el tooltip |

## Exportar (PNG, PDF, Excel)

Cada gráfico trae un botón de descarga en la cabecera con tres opciones: **Imagen (PNG)**, **Documento PDF** y **Excel (.xlsx)**. No necesita librerías extra: la imagen se dibuja en el navegador y el PDF y el Excel se generan en el propio archivo de PocketChart.

- **PNG:** título, subtítulo, leyenda y gráfico, sin tooltip y con la animación terminada, a resolución ×3.
- **PDF:** la misma imagen en una página A4 (horizontal si el gráfico es ancho), lista para imprimir.
- **Excel:** un `.xlsx` real con una columna por serie. Las fechas son fechas de Excel, los números son números (no texto) y la primera fila queda fija. En gráficos apilados se exportan los valores reales, no los acumulados.
- **CSV:** disponible añadiéndolo a `formats` o con `chart.export('csv')`.

```js
create('#ventas', {
  export: {
    formats: ['png', 'pdf', 'xlsx', 'csv'], // los que salen en el menú
    filename: 'ventas-2026',               // sin extensión (por defecto, el título)
    scale: 3,                              // resolución de la imagen
    background: '#ffffff',                 // fondo de la imagen (por defecto, el del tema)
    pdf: { page: 'a4', orientation: 'auto', margin: 28 }, // page: a4 | letter | fit
  },
});

// Desde tu propio botón
await chart.export('pdf');
await chart.export('xlsx', { filename: 'reporte-noviembre' });

// Sólo el archivo, sin descargar (por ejemplo, para subirlo a tu API)
const { blob } = await chart.export('png', { download: false });
const blob2 = await chart.toBlob('xlsx');

// Hacer otra cosa en lugar de descargar
create('#ventas', { export: { onExport: (blob, nombre, formato) => subir(blob, nombre) } });

// Sin botón
create('#ventas', { export: false });
```

El evento `export` avisa cada vez que se genera un archivo: `{ format, filename, size }`.

> El PDF de `export('pdf')` contiene **sólo el gráfico**. Si tu app arma un PDF propio con más secciones (resumen, tablas, firmas…), sigue armándolo en tu app y usa `toImage()` y `toData()` para meter el gráfico y sus datos (ver abajo).

## Insertar el gráfico en el PDF de tu app

`toImage()` devuelve la imagen sin descargar nada, lista para cualquier generador de PDF (jsPDF, pdfmake, PDFKit, expo-print, el backend…). `toData()` devuelve los mismos datos en filas para tus tablas.

```js
const img = await chart.toImage({
  width: 700,          // ancho fijo, para que salga igual en cualquier pantalla
  header: false,       // sin título: tu PDF ya tiene sus encabezados
  background: '#fff',  // o 'transparent' (sólo PNG)
});
// img = { dataUrl, base64, blob, width, height, mime }

const { columns, rows, formatted } = chart.toData();
// columns: ['Categoría', 'Tienda (USD)', 'Online (USD)']
// rows: valores reales (fechas como Date) · formatted: el mismo texto que el tooltip
```

Ejemplo con [jsPDF](https://github.com/parallax/jsPDF):

```js
import { jsPDF } from 'jspdf';

const doc = new jsPDF({ unit: 'pt', format: 'a4' });
doc.setFontSize(18); doc.text('Informe de ventas', 40, 50);
doc.setFontSize(11); doc.text(resumen, 40, 72);

const img = await chart.toImage({ width: 700, header: false, background: '#fff' });
const w = 515, h = w * img.height / img.width;          // ancho útil de un A4 con márgenes
doc.addImage(img.dataUrl, 'PNG', 40, 90, w, h);

// … tus tablas con chart.toData().formatted (por ejemplo con jspdf-autotable)
doc.save('informe.pdf');
```

Si sólo quieres que el usuario descargue la imagen, deja en el menú únicamente el PNG: `export: { formats: ['png'] }`.

## Apilado

```js
// Barras apiladas: cada mes muestra las partes y el total
create('#ventas', { type: 'bar', stack: true, categories: meses, series: [tienda, online, mayoristas] });

// Áreas apiladas
create('#energia', { type: 'area', stack: true, series: [solar, eolica, red] });

// Al 100 %: compara el reparto, no el total
create('#tickets', { type: 'bar', stack: 'percent', categories: ['T1', 'T2', 'T3', 'T4'], series: [alta, media, baja] });
```

- Funciona con `bar`, `area` y `line`. Las series de distinto tipo no se apilan entre sí.
- **Grupos:** con `stack: 'a'` y `stack: 'b'` en cada serie tienes dos columnas apiladas, una al lado de otra.
- **Excluir una serie:** `stack: false` en la serie (por ejemplo, una línea de meta encima de las barras).
- Los valores negativos se apilan hacia abajo, por separado de los positivos.
- El tooltip muestra la capa de arriba primero, el **Total** y, al 100 %, el porcentaje de cada parte. El evento `inspect` devuelve los valores reales, no los acumulados.
- Al ocultar una serie desde la leyenda, las demás se recolocan con una transición.
- En HTML: `<pocket-chart type="bar" stack>` o `stack="percent"`.

## Ejes Y múltiples

Cuando un gráfico mezcla magnitudes distintas (pH de 0 a 14, EC de 0 a 5000, litros), cada serie puede tener su propia escala con `yAxis`:

```js
create('#feed', {
  type: 'line',
  categories: dias,
  series: [
    { name: 'pH', data: ph, yAxis: { min: 0, max: 14, title: 'pH', format: (v) => v.toFixed(1) } },
    { name: 'EC', unit: 'µS/cm', data: ec, yAxis: { min: 0, max: 5000, opposite: true, title: 'EC' } },
    { name: 'Volumen', type: 'bar', unit: 'L', data: litros, yAxis: { show: false } },
  ],
});
```

| `yAxis` | Por defecto | Qué hace |
|---|---|---|
| `min`, `max` | auto | Con los dos, el eje queda fijo: no cambia con los datos ni con el zoom |
| `opposite` | `false` | `true` lo dibuja a la derecha |
| `show` | `true` | `false` conserva la escala propia pero no dibuja el eje |
| `id` | | Series con el mismo `id` comparten eje |
| `format(v)` | | Formato de las etiquetas del eje y del valor en el tooltip |
| `title` | | Texto corto encima del eje |
| `zero` | auto | Incluir el 0 en un eje automático |

Reglas:

- **Agrupación:** comparten eje las series con el mismo `id`, o con el mismo `min`, `max` y lado. Si no, cada serie tiene el suyo.
- **Varios ejes por lado:** se colocan uno junto a otro (unos 32 px cada uno) y el área del gráfico se estrecha.
- **Color:** el eje toma el color de su (primera) serie.
- **Ocultar una serie** desde la leyenda quita su eje, y el área se reajusta con una transición.
- **Rejilla:** sigue al primer eje de la izquierda.
- **Zoom:** solo cambia X. Los ejes con `min`/`max` fijos no se mueven; los automáticos se ajustan a lo visible.
- **Tooltip:** muestra el valor real con la `unit` y el `format` del eje de cada serie.
- **Tipos mezclados:** línea, barra y área pueden convivir, cada una en su eje.
- **Apilado:** solo apila series del mismo eje. Si un grupo mezcla ejes, se apila por separado en cada eje y se avisa una vez en la consola.
- **Evento `inspect`:** con ejes múltiples, cada punto incluye `unit` y `yAxis: { id, min, max, opposite }`, con el dominio actual del eje.
- **Sin `yAxis`** en ninguna serie, el gráfico es exactamente igual que antes (un solo eje).
- `y.title` pone un título encima del eje principal también sin ejes múltiples.

## Personalizar el estilo

Variables CSS (en cualquier contenedor padre, incluido el `<pocket-chart>`):

```css
pocket-chart {
  --pocket-bg: #fff;  --pocket-fg: #111;  --pocket-muted: #667;
  --pocket-grid: rgba(0,0,0,.08);  --pocket-radius: 16px;
  --pocket-font: "Inter", system-ui;
  --pocket-c1: #2a78d6;  /* ... hasta --pocket-c8; versiones oscuras con sufijo -dark */
}
```

La paleta por defecto tiene 8 colores validados para daltonismo en claro y oscuro. El color sigue a la serie: ocultar una serie no repinta las demás.

## Rendimiento

Medido con Chromium emulando un Pixel 7 con la CPU 4× más lenta (equivale a un Android de gama media-baja). Tiempo de dibujar un fotograma:

| Caso | v0.2 | v0.3 |
|---|---|---|
| 8.760 puntos, vista completa | 3,5 ms | 1,8 ms |
| 200.000 puntos, vista completa | 33 ms | 2,4 ms |
| 200.000 puntos, arrastrando con zoom | 17–25 ms | 2,6–3,5 ms |
| Arrastrar + tooltip, fotograma completo (incluye pintar) | 42 ms | 25 ms |

Cómo se consigue:
- **Pirámide min/máx**: con series de más de 4.096 puntos se precalculan grupos de 2, 4, 8… puntos con su mínimo y su máximo. Cada fotograma recorre unos 4 grupos por píxel en vez de todos los datos, y los picos no se pierden.
- **Un solo bucle de fotogramas**: todas las peticiones de redibujado (gestos, animaciones, carga) se agrupan en un único `requestAnimationFrame`.
- **Sin cálculos repetidos**: se guardan en caché los anchos de texto, las etiquetas de fechas, el rango del eje Y por vista y el fondo del mini-mapa.
- **Sin forzar layout**: el tooltip se mueve con `transform` y sólo se mide cuando cambia su contenido. La posición del lienzo se lee una vez por gesto y la leyenda sólo se toca cuando cambia el punto inspeccionado.
- **Resolución del lienzo limitada a 2×** (`maxPixelRatio`), que dibuja unas 2,25 veces menos píxeles que 3× sin pérdida visible.
- **Animaciones por tiempo, no por fotograma**: el eje Y y la inercia se mueven igual a 60, 90 o 120 Hz.
- Los eventos `zoom` se emiten una vez por fotograma, y la dispersión con más de 1.500 puntos se dibuja en un solo trazado.

## Arquitectura

```
src/pocketchart.js        Fuente única (ES module)
  ├─ PocketChart          Núcleo: datos → escalas → render Canvas 2D (DPR-aware)
  │   ├─ ingest           Normaliza cualquier formato de datos, detecta tipo de eje
  │   ├─ escalas/ticks    Ticks "bonitos", ejes de tiempo con pasos de calendario
  │   ├─ render           Rejilla, ejes, barras/áreas/líneas/puntos, pie/donut
  │   ├─ gestos           Pointer Events: tap, long-press, scrub, pan+inercia, pinch, rueda, teclado
  │   ├─ inspección       Hit-test por X (o 2D en scatter), tooltip HTML anclado
  │   └─ accesibilidad    role="img", tabla oculta para lectores de pantalla, teclado
  └─ <pocket-chart>       Web Component con Shadow DOM (atributos, JSON embebido o .config)
dist/pocketchart.min.js   IIFE para <script>
dist/pocketchart.esm.js   ES module para bundlers
demo/index.html           Demo móvil
```

Decisiones:
- **Canvas en vez de SVG**: rinde con miles de puntos en móviles modestos; el DOM sólo se usa para la cabecera, leyenda y tooltip (texto nítido y accesible).
- **Web Component como capa universal**: cualquier framework o WebView lo usa sin adaptadores.
- **Ejes Y opcionales**: por defecto hay un solo eje. Con `yAxis` en las series cada magnitud tiene su escala; cada eje usa el color de su serie para que se lea bien en pantallas pequeñas. Con `legend.mode: 'single'` se ve una serie a la vez.

## Construir

```bash
npm i -D esbuild
node build.mjs
```

## Próximos pasos sugeridos

- Paquete npm + envoltorios finos `@pocketchart/react` y `@pocketchart/vue` (tipado TS)
- Barras apiladas, líneas de referencia/umbrales, anotaciones
- Puente para React Native (`react-native-webview` con mensajes `inspect`/`zoom`)
- Exportar a PNG y compartir
- Tests visuales con Playwright en varios tamaños de móvil
