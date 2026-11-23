# 4. React (Vite, Create React App, Next.js)

← [Volver al índice](../README.md)

## Paso 1. Instala la librería

```bash
npm install pocketchart
```

> ¿Aún no está en GitHub? Copia `dist/pocketchart.esm.js` a `src/lib/` y cambia el `import` del componente a `./lib/pocketchart.esm.js`.

## Paso 2. Copia el componente

Copia [`integrations/react/PocketChart.jsx`](../integrations/react/PocketChart.jsx) a tu proyecto, por ejemplo a `src/components/PocketChart.jsx`. No tiene más dependencias que React.

## Paso 3. Úsalo

```jsx
import { useEffect, useState } from 'react';
import PocketChart from './components/PocketChart';

export default function Ventas() {
  const [series, setSeries] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/ventas')
      .then((r) => r.json())
      .then((data) => { setSeries(data); setCargando(false); });
  }, []);

  return (
    <PocketChart
      type="bar"
      title="Ventas mensuales"
      categories={['Ene', 'Feb', 'Mar', 'Abr']}
      series={series}
      loading={cargando}
      options={{
        animation: { enter: 'wave', easing: 'back' },
        loader: { type: 'skeleton' },
        colors: ['#0b6e99', '#f2a65a'],
      }}
      onInspect={(sel) => console.log(sel)}
    />
  );
}
```

### Props del componente

| Prop | Tipo | Qué hace |
|---|---|---|
| `series` | `Series[]` | Datos. Al cambiar, el gráfico hace una transición animada. |
| `loading` | `boolean` | Muestra la animación de carga. Al pasar a `false`, se dibuja con su entrada. |
| `options` | `object` | Cualquier opción de la [referencia](07-referencia.md). |
| `type`, `title`, `subtitle`, `height`, `theme`, `categories`… | | Atajos: cualquier opción se puede pasar también como prop suelta. |
| `onInspect`, `onZoom`, `onToggle`, `onReady`, `onUpdated`, `onError`, `onVisible`, `onExport` | `función` | Eventos |
| `className`, `style` | | Para el contenedor |
| `ref` | | Da acceso a la instancia: `ref.current.resetZoom()`, `.replay()`, `.toggleFullscreen()`, `.export('png' \| 'pdf' \| 'xlsx')` |

El componente compara las opciones por su contenido. Escribir `options={{...}}` en línea no redibuja el gráfico en cada render.

## Paso 4. Usar métodos con `ref`

```jsx
const chartRef = useRef(null);

<PocketChart ref={chartRef} type="line" series={series} />
<button onClick={() => chartRef.current.resetZoom()}>Ver todo</button>
<button onClick={() => chartRef.current.replay()}>Repetir animación</button>
<button onClick={() => chartRef.current.export('pdf')}>Descargar PDF</button>
<button onClick={() => chartRef.current.export('xlsx')}>Descargar Excel</button>

// Para tu propio PDF: imagen y datos, sin descargar nada
const img = await chartRef.current.toImage({ width: 700, header: false });
const { columns, formatted } = chartRef.current.toData();
```

## Next.js

El gráfico sólo se crea en el navegador (dentro de `useEffect`), así que funciona con SSR. En el App Router marca el archivo del componente como cliente:

```jsx
'use client';
```

Si prefieres no renderizarlo en el servidor:

```jsx
import dynamic from 'next/dynamic';
const PocketChart = dynamic(() => import('../components/PocketChart'), { ssr: false });
```

## Alternativa sin componente: la etiqueta `<pocket-chart>`

```jsx
import { register } from 'pocketchart';
register();             // registra <pocket-chart> una vez

function Grafico({ series }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.config = { type: 'area', series }; }, [series]);
  return <pocket-chart ref={ref} title="Consumo" />;
}
```

## TypeScript

```ts
import type { Series, PocketChartOptions } from 'pocketchart';
```

Los tipos están en [`types/pocketchart.d.ts`](../types/pocketchart.d.ts).
