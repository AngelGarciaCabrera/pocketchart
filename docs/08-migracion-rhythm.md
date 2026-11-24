# Migrar los gráficos de la app (v0.9.0)

Cada punto de la lista de requisitos y cómo se resuelve en PocketChart 0.9.0.

## A. Ejes que nunca pierden el contexto

| # | Requisito | Cómo |
|---|---|---|
| 1 | Ejes fijos, etiquetas sin cortes ni solapes, 3+ ejes Y legibles | Automático. Los ejes X e Y se dibujan fuera del área que se mueve. Con muchos ejes en pantalla estrecha, las etiquetas pasan a formato compacto (`5,000 → 5k`). Si aun así no caben, sólo se dibujan los más cercanos al gráfico. Una prueba automática lo verifica en 108 combinaciones (anchos de 280 a 844 px, de 0 a 5 ejes y tres niveles de zoom): ninguna etiqueta se sale ni se encima |
| 2 | Límites del backend fijos | `yAxis: { min, max }` con los dos valores: el eje no cambia con zoom ni pan. Sin límites, el eje se ajusta a lo visible |
| 3 | Pan limitado y zoom mínimo | Automático. `zoom: { minPoints: 5 }` para elegir el mínimo de puntos visibles. La vista nunca queda vacía en un hueco |
| 4 | Rango visible e indicador | Con zoom aparecen la barra "inicio – fin" con **Restablecer** y el mini-mapa (`rangeBar`, `navigator`) |
| 5 | Fechas sin ambigüedad | `x.format: 'MM/dd HH:mm'`. Al acercar pasa solo a `HH:mm` y `HH:mm:ss`. Sin plantilla, el 1 de enero muestra el año y la primera etiqueta lleva el día si no hay medianoche a la vista |
| 6 | Tooltip con el valor real y la unidad | Automático, también para ejes con `show: false` |
| 7 | Ocultar series no cambia escalas | Automático con `yAxis` (`stable: true` por defecto). Sin `yAxis`: `y: { stable: true }` |

## B. Datos

| # | Requisito | Cómo |
|---|---|---|
| 8 | Huecos | `null`, `NaN` o texto vacío cortan la línea, no cuentan para el eje y no dibujan barra. No hace falta convertir a `NaN` |
| 9 | Series desiguales (1 a 200.000 puntos) | Automático. El tooltip elige la fecha más cercana entre todas las series |
| 10 | Línea punteada | `dash: [5, 4]` en la serie. Sin marcadores salvo `markers: { show: true }` |
| 11 | Curvas por serie | `curve: 'smooth' \| 'straight' \| 'stepline'` (los nombres del backend) |
| 12 | Colores con nombre | `color: 'blue'`, `'grey'`… |
| 13 | Barras agrupadas | Varias series `type: 'column'` sin `stack` van lado a lado |
| 14 | Tipos mezclados | `type` por serie (`line`, `column`, `area`), cada una con su `yAxis` |
| 15 | Redondeo por tipo | `dataType: 'number' \| 'decimal1' \| 'decimal2'` en la serie o en el eje |

## C. Formatos sin funciones (Hermes)

| # | Requisito | Cómo |
|---|---|---|
| 16 | Formato declarativo | `format: 'compact' \| 'integer' \| 'decimal' \| 'percent' \| 'currency'` + `decimals`, `prefix`, `suffix`, `locale`, `currency`. En `y`, `yAxis`, serie y `tooltip` |
| 17 | Compacto y moneda | `'compact'` → 1.2k · `'currency'` → $1,234.50 |
| 18 | Fechas con plantilla | `x.format: 'MM/dd HH:mm'`, `tooltip.dateFormat: 'hh:mm a, MM/dd/yy'` |
| 19 | Plantilla del tooltip | `tooltip.template: '{series}: {value} {unit}'`, `header`, `footer: 'Total: {total}'`, también `{x}` y `{percent}` |

## D. Interacción en la WebView

| # | Requisito | Cómo |
|---|---|---|
| 20 | Pellizco y pan fiables | Pointer Events con respaldo `touch*` si el navegador cancela los punteros |
| 21 | Botones + − y restablecer | `zoomControls: 'auto'` (cabecera) y **Restablecer** en la barra de rango |
| 22 | `zoomEnd` único | `onZoomEnd={({ from, to, source }) => …}` |
| 23 | Zoom controlado | Prop `zoomRange={{ from, to }}` y prop `keepView` (o `setData(series, { keepView: true })`) |
| 24 | Bloquear scroll | `onInteractionStart` / `onInteractionEnd` |
| 25 | Valor fijo con un toque | `tooltip: { sticky: true }` y `ref.current.clearInspect()` |
| 26 | Panel de valores | `inspector: 'bottom'` (sin selección muestra el último dato) |

## E. Pantalla completa, exportar y rendimiento

| # | Requisito | Cómo |
|---|---|---|
| 27 | Pantalla completa | `fullscreen: 'external'` + `onFullscreenRequest` para abrir tu Modal con `zoomRange` |
| 28 | Imagen con vista y aspecto | `toImage({ view: 'current' \| 'full', width: 700, aspectRatio: 2 })` |
| 29 | Datos visibles o todos | `toData({ range: 'visible' \| 'all', series: 'visible' \| 'all' })` |
| 30 | Varios gráficos | `PocketChartGroup` (una WebView, una carga de la librería) y `lite: true` |
| 31 | Datos compactos | `{ name, x: [...], y: [...] }` o `xStart` + `xStep` |
| 32 | Entrada escalonada | Automática (`animation.chartStagger`, 120 ms) |

## F. Barras apiladas en eje de tiempo

| # | Requisito | Cómo |
|---|---|---|
| 33 | Ancho automático y centrado | Automático en ejes de tiempo, con `bar: { padding: 0.25 }` |
| 34 | Total y orden al ocultar | Total en el tooltip (o `footer`), y el orden y los colores se mantienen |

## G. Bandas de fondo (0.9.0)

| # | Requisito | Cómo |
|---|---|---|
| 35 | Luces encendidas, riego… detrás del gráfico | Serie `type: 'band'` con `band: { threshold, opacity, edge, hold, labels }`, o `bands: [{ from, to, color }]` fijas. Ver *Bandas de fondo* en la referencia |

## Ejemplo: Feed History

```jsx
<PocketChartView
  keepView
  onZoomEnd={({ from, to }) => recargar(from, to)}
  onInteractionStart={() => setScroll(false)}
  onInteractionEnd={() => setScroll(true)}
  options={{
    type: 'line',
    x: { format: 'MM/dd' },
    tooltip: { dateFormat: 'hh:mm a, MM/dd/yy', sticky: true },
    inspector: 'bottom',
    zoom: { minPoints: 5 },
  }}
  series={[
    { name: 'LightsON', type: 'band', color: '#FFD60A', band: { labels: ['Off', 'On'] }, data: { x: horas, y: luces } },
    { name: 'pH', color: 'blue', curve: 'straight', data: ph, yAxis: { min: 0, max: 14, title: 'pH', format: 'decimal1' } },
    { name: 'pH set', color: 'grey', dash: [5, 4], curve: 'stepline', data: phSet, yAxis: { min: 0, max: 14, show: false } },
    { name: 'EC', color: 'red', unit: 'µS/cm', data: ec, yAxis: { min: 0, max: 5000, opposite: true, title: 'EC', format: 'compact' } },
    { name: 'Entrada', type: 'column', unit: 'L', data: entrada, yAxis: { id: 'vol', min: 0, title: 'L', format: 'integer' } },
    { name: 'Salida', type: 'column', unit: 'L', data: salida, yAxis: { id: 'vol' } },
  ]}
/>
```
