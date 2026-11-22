# Cambios

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
