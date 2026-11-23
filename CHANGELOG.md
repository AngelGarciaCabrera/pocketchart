# Cambios

## 0.8.1 — 2026-11-23
- Listo para npm: `npm install pocketchart`. Funciona con `import` y con `require` (`dist/pocketchart.cjs`).
- `pocketchart/react` y `pocketchart/react-native` vienen compilados (sin JSX) y con tipos TypeScript.
- Publicación automática en npm al publicar un release en GitHub.

## 0.8.0 — 2026-11-22
- Ejes que nunca pierden el contexto: los ejes X e Y no se salen ni se encima ninguna etiqueta (probado en 108 combinaciones de ancho, ejes y zoom); con muchos ejes, etiquetas compactas.
- Zoom: botones − y +, barra con el rango visible y "Restablecer", zoom mínimo (`zoom.minPoints`), vista nunca vacía, fechas sin ambigüedad al acercar.
- Eventos `zoomEnd` (una vez por gesto, con `source`), `interactionStart` / `interactionEnd` y `fullscreenRequest` (`fullscreen: 'external'`).
- Zoom controlado: `zoomRange` y `setData(series, { keepView: true })`. Métodos `zoomBy`, `getZoom`, `select`, `clearInspect`.
- Tooltip fijo con un toque (`tooltip.sticky`) y panel de valores bajo el gráfico (`inspector: 'bottom'`).
- Formatos sin funciones (Hermes): `format: 'compact' | 'integer' | 'decimal' | 'percent' | 'currency'` con `decimals`, `prefix`, `suffix`, `locale`, `currency` y `dataType`; plantillas de fecha (`x.format: 'MM/dd HH:mm'`, `tooltip.dateFormat`) y del tooltip (`{x} {series} {value} {unit} {total} {percent}`).
- Datos: huecos con `null`/`NaN` sin conectar, series con fechas desiguales, datos compactos `{ x: [], y: [] }`, colores CSS con nombre, alias `column`, `straight`, `stepline`, líneas punteadas sin marcadores.
- Barras en ejes de tiempo con ancho según la separación entre fechas y `bar.padding`.
- `toImage({ view, aspectRatio, height })` y `toData({ range, series })`.
- React Native: `PocketChartGroup` (varios gráficos en una WebView), props `keepView`, `zoomRange`, `onZoomEnd`, `onInteractionStart/End`, `onFullscreenRequest`; aviso si llega una función sin código (Hermes).
- Modo `lite` y entrada escalonada de varios gráficos.
- Guía nueva: docs/08-migracion-rhythm.md.

## 0.7.0 — 2026-11-22
- Ejes Y múltiples: `yAxis: { min, max, opposite, show, id, format, title }` por serie, cada uno con su escala y del color de su serie.
- Las series comparten eje por `id` o por mismo `min`/`max` y lado; varios ejes por lado se colocan uno junto a otro y el área se ajusta.
- Ocultar una serie quita su eje con transición; el zoom solo cambia X y los ejes fijos no se mueven.
- Tooltip y evento `inspect` con el valor real, la unidad y el eje de cada serie. El apilado solo junta series del mismo eje.
- `y.title` para titular el eje principal.
- Sin `yAxis` el gráfico es idéntico a la 0.6.0.

## 0.6.0 — 2026-11-22
- `toImage()`: imagen del gráfico (PNG o JPEG) en dataURL, base64 y Blob, sin descargar nada, con ancho fijo, sin título o sin leyenda. Para insertarla en el PDF que arma tu app.
- `toData()`: los datos en filas (valores reales y texto formateado) para las tablas de ese PDF.
- React Native: `await ref.current.toImage()` y `await ref.current.toData()` devuelven el resultado directamente, sin pasar por `onExport`.
- Guías con ejemplos de jsPDF (web) y expo-print (React Native).

## 0.5.0 — 2026-11-21
- Exportar: botón de descarga en la cabecera con **PNG**, **PDF** y **Excel (.xlsx)**, y CSV opcional. Todo sin dependencias.
- API `chart.export(formato, opciones)` y `chart.toBlob(formato)`, opción `export` (formatos, nombre, resolución, página del PDF, `onExport`) y evento `export`.
- React Native: prop `onExport` (el archivo llega en base64) y `ref.current.export('pdf')`.
- Atributo `export` en `<pocket-chart>`.

## 0.4.0 — 2026-11-21
- Gráficos apilados: `stack: true` (barras, áreas y líneas) y `stack: 'percent'` (al 100 %).
- Grupos de apilado por serie (`stack: 'a'`), series excluidas (`stack: false`) y negativos hacia abajo.
- Tooltip con total y porcentaje de cada parte; transición al ocultar una serie apilada.
- Atributo `stack` en `<pocket-chart>` y tres ejemplos nuevos en la demo.

## 0.3.0 — 2026-11-21
- Rendimiento: pirámide min/máx para series grandes (200.000 puntos a ~2,4 ms por fotograma en un móvil lento simulado), un solo bucle de fotogramas, cachés de texto, ejes y mini-mapa, tooltip movido con `transform`, `maxPixelRatio`.
- Las animaciones de entrada empiezan cuando el gráfico aparece en pantalla (`animation.onVisible`, `replayOnView`).
- Interfaz más limpia: cabecera, leyenda, botones y tooltip más ligeros; rejilla más tenue.
- Componentes para React y React Native, tipos de TypeScript y guías paso a paso.

## 0.2.0
- Animaciones de carga (`skeleton`, `pulse`, `wave`, `spinner`, `dots`), `load()` y `setLoading()`.
- Animaciones de entrada (`draw`, `grow`, `wave`, `pop`, `fade`) con duración, retraso, escalonado y curvas de tiempo.
- Transición animada al cambiar datos.
- Personalización completa: colores, tema claro y oscuro, trazo, marcadores, rejilla, ejes, barras y donut.

## 0.1.0
- Primera versión: línea, área, barras, dispersión, pie y donut; gestos táctiles, tooltip junto al dedo, leyenda deslizable, pantalla completa y Web Component.
