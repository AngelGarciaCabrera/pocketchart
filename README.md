# PocketChart

Gráficos **pensados para el móvil**: se navegan con el pulgar, el tooltip nunca queda bajo el dedo y las etiquetas no se cortan.
Ligera (~21 KB gzip), **sin dependencias**, y funciona en HTML, JavaScript, React, React Native, Vue, Angular, Flutter y más.

<p>
  <img alt="Tamaño" src="https://img.shields.io/badge/gzip-~21%20KB-2a78d6">
  <img alt="Dependencias" src="https://img.shields.io/badge/dependencias-0-1baf7a">
  <img alt="Licencia" src="https://img.shields.io/badge/licencia-MIT-6b7280">
</p>

**Tipos:** línea · área · barras · apiladas (también al 100 %) · dispersión · pie · donut (y combinaciones de línea y barras, con ejes Y múltiples)

**Exportar:** botón de descarga en cada gráfico con PNG, PDF y Excel (.xlsx), sin dependencias.

## Por qué

| Problema en el móvil | Qué hace PocketChart |
|---|---|
| Eje X con etiquetas cortadas | Calcula cuántas caben y nunca corta las de los bordes |
| Scroll horizontal incómodo | Pellizco para zoom, arrastre con inercia y mini-mapa |
| Tooltip lejos del gráfico o tapado por el dedo | Flota junto al punto, por encima del dedo |
| Leyenda de varias filas apretadas | Una fila deslizable que además muestra el valor tocado |
| Series con unidades distintas | Modo «una serie a la vez», sin doble eje |
| Miles de puntos lentos | 200.000 puntos con zoom fluido |

## Empezar en 30 segundos

```html
<script src="https://cdn.jsdelivr.net/gh/AngelGarciaCabrera/pocketchart@v0.8.1/dist/pocketchart.min.js"></script>

<pocket-chart type="line" title="Ventas" animation="draw">
  <script type="application/json">
    { "categories": ["Ene", "Feb", "Mar", "Abr"],
      "series": [{ "name": "2026", "data": [12, 19, 8, 15] }] }
  </script>
</pocket-chart>
```

O con JavaScript:

```js
const chart = PocketChart.create('#grafico', {
  type: 'area',
  title: 'Consumo',
  loader: { type: 'skeleton' },
  animation: { enter: 'grow' },
});
chart.load(() => fetch('/api/consumo').then((r) => r.json()));
```

Con npm:

```bash
npm install pocketchart
```

```js
import { create } from 'pocketchart';                              // JavaScript (ESM o require)
import PocketChart from 'pocketchart/react';                       // React
import { PocketChartView } from 'pocketchart/react-native';         // React Native (WebView)
```

## Guías paso a paso

| | Guía |
|---|---|
| 1 | [Empezar (cualquier tecnología)](docs/01-empezar.md): instalar, formatos de datos, carga y eventos |
| 2 | [HTML sin código](docs/02-html.md): etiqueta `<pocket-chart>`, atributos y CSS |
| 3 | [JavaScript](docs/03-javascript.md): `<script>`, módulos, Vite, tiempo real |
| 4 | [React y Next.js](docs/04-react.md): componente `<PocketChart />` listo para copiar |
| 5 | [React Native](docs/05-react-native.md): componente `<PocketChartView />` con WebView, Expo y CLI |
| 6 | [Vue, Angular, Svelte, Flutter y otros](docs/06-otros.md) |
| 7 | [Referencia completa](docs/07-referencia.md): opciones, animaciones, estilo, gestos y rendimiento |
| 8 | [Migrar los gráficos de la app](docs/08-migracion-rhythm.md): los 34 requisitos y la opción que resuelve cada uno |

## Gestos

**Toca** para ver un valor · **mantén y arrastra** para recorrer · **pellizca** para zoom · **doble toque** para acercar o restablecer · **mantén un chip** de la leyenda para ver sólo esa serie.

## Estructura del repositorio

```
pocketchart/
├── src/pocketchart.js                  Código fuente (un solo archivo)
├── dist/
│   ├── pocketchart.min.js              Para <script> (registra <pocket-chart>)
│   └── pocketchart.esm.js              Para import
├── types/pocketchart.d.ts              Tipos de TypeScript
├── integrations/
│   ├── react/PocketChart.jsx           Componente React
│   └── react-native/                   Componente React Native (WebView)
├── examples/                           Ejemplos HTML y JavaScript listos para abrir
├── demo/                               Demo interactiva con panel de personalización
└── docs/                               Guías
```

## Desarrollo

```bash
npm install        # instala esbuild
npm run build      # genera dist/ e integrations/react-native/pocketchart-lib.js
npx serve .        # abre http://localhost:3000/demo/ o /examples/
```

Para publicar una versión: actualiza `version` en `package.json` y `CHANGELOG.md`, ejecuta `npm run build`, haz commit y publica un release en GitHub con la etiqueta `vX.Y.Z`. La acción `.github/workflows/publish.yml` lo sube a npm (necesita el secreto `NPM_TOKEN`). jsDelivr lo sirve solo desde GitHub y desde npm.

## Licencia

[MIT](LICENSE)
