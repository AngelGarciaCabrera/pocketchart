# 3. JavaScript (vanilla, Vite, Webpack)

← [Volver al índice](../README.md)

## Opción A: con `<script>` (sin compilar)

```html
<div id="grafico"></div>
<script src="pocketchart.min.js"></script>
<script>
  const chart = PocketChart.create('#grafico', {
    type: 'area',
    title: 'Consumo eléctrico',
    series: [{ name: 'Consumo', unit: 'kWh', data: puntos }],
  });
</script>
```

## Opción B: como módulo (Vite, Webpack, Parcel, esbuild)

### Paso 1. Instala

```bash
npm install github:AngelGarciaCabrera/pocketchart
# o copia dist/pocketchart.esm.js dentro de tu proyecto
```

### Paso 2. Importa y crea

```js
import { create } from 'pocketchart';            // o: from './lib/pocketchart.esm.js'

const chart = create(document.querySelector('#grafico'), {
  type: 'bar',
  title: 'Ventas mensuales',
  categories: ['Ene', 'Feb', 'Mar'],
  series: [{ name: '2026', data: [40, 52, 47] }],
});
```

Con TypeScript, los tipos están en [`types/pocketchart.d.ts`](../types/pocketchart.d.ts) y se cargan solos al instalar el paquete.

## Paso 3. Actualizar, cargar y destruir

```js
// Datos nuevos: pasa de los valores viejos a los nuevos con una transición
chart.setData([{ name: '2026', data: [44, 50, 61] }]);

// Cambiar cualquier opción
chart.update({ type: 'line', animation: { enter: 'wave' } });

// Carga asíncrona con animación
chart.load(async () => {
  const r = await fetch('/api/ventas');
  return r.json();             // [series] o { series, categories }
});

// Control manual del estado de carga
chart.setLoading(true, { type: 'dots', text: 'Actualizando…' });
chart.setLoading(false);       // vuelve a dibujar con la animación de entrada

// Navegación
chart.zoomTo(desde, hasta);
chart.resetZoom();
chart.toggleFullscreen();

// Al quitar el gráfico de la página (SPA, cambio de vista)
chart.destroy();
```

## Paso 4. Datos en tiempo real

```js
const series = [{ name: 'Temperatura', unit: '°C', data: [] }];
const chart = create('#vivo', { type: 'line', series, animation: { update: 250 } });

socket.on('lectura', ({ t, valor }) => {
  series[0].data.push([t, valor]);
  if (series[0].data.length > 5000) series[0].data.shift();
  chart.setData(series);
});
```

Con series grandes (más de 4.096 puntos) la librería crea sola un índice de mínimos y máximos. Puede dibujar 200.000 puntos con fluidez.

## Paso 5. Formatos propios

```js
create('#grafico', {
  y: { format: (v) => v.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }) },
  x: { format: (v, modo) => modo === 'tick' ? `S${v}` : `Semana ${v}` },
  tooltip: {
    format: (sel) => `<b>${sel.label}</b><br>${sel.points.map((p) => `${p.series}: ${p.y}`).join('<br>')}`,
  },
});
```

Ejemplo completo: [`examples/javascript.html`](../examples/javascript.html).
