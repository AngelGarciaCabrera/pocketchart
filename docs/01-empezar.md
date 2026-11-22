# 1. Empezar (cualquier tecnología)

← [Volver al índice](../README.md)

PocketChart es **un solo archivo JavaScript** sin dependencias. Cualquier proyecto que muestre una página web puede usarlo: una web, una app React, una app móvil con WebView, un panel interno…

## Paso 1. Consigue la librería

Elige **una** de estas opciones:

| Opción | Cuándo usarla | Qué haces |
|---|---|---|
| **A. Copiar el archivo** | Lo más simple. Sirve siempre. | Copia `dist/pocketchart.min.js` (o `dist/pocketchart.esm.js`) a tu proyecto. |
| **B. CDN desde GitHub** | Webs sin herramientas de compilación. | Sube este repositorio a GitHub, crea una etiqueta `v0.6.0` y usa la URL de jsDelivr (abajo). |
| **C. npm desde GitHub** | Proyectos con `package.json` (React, Vue, Vite…). | `npm install github:AngelGarciaCabrera/pocketchart` |
| **D. npm público** | Cuando lo publiques en npmjs.com. | `npm install pocketchart` |

URL de CDN (opción B), una vez subido el repositorio y creada la etiqueta:

```html
<script src="https://cdn.jsdelivr.net/gh/AngelGarciaCabrera/pocketchart@v0.6.0/dist/pocketchart.min.js"></script>
```

> Si tu repositorio tiene otro nombre o usuario, cambia `AngelGarciaCabrera/pocketchart` en las URLs.

## Paso 2. Prepara un contenedor

El gráfico ocupa el **ancho** de su contenedor. El alto del área de dibujo se fija con `height` (por defecto, 260 px).

```html
<div id="grafico"></div>
```

## Paso 3. Crea el gráfico

```js
const chart = PocketChart.create('#grafico', {
  type: 'line',                 // line | area | bar | scatter | pie | donut
  title: 'Ventas',
  series: [
    { name: '2026', data: [12, 19, 8, 15, 22] },
  ],
  categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
});
```

Eso es todo: el gráfico ya tiene gestos, tooltip, leyenda, modo oscuro automático y animación de entrada.

## Paso 4. Formatos de datos

Usa el que te resulte más cómodo. Se detecta solo:

```js
data: [12, 19, 8]                                   // sólo valores (usa `categories` para las etiquetas)
data: [['2026-11-14T00:00', 351.4], ...]            // [fecha ISO, valor] → eje de tiempo
data: [[1763078400000, 351.4], ...]                 // [milisegundos, valor] → eje de tiempo
data: [[new Date(), 351.4], ...]                    // [Date, valor]
data: [{ x: 1.6, y: 5.8 }, ...]                     // objetos
data: [{ label: 'Comida', value: 420 }, ...]        // pie / donut
data: [12, null, 8]                                 // null = hueco en la línea
```

Cada serie admite además `unit` (se muestra en el tooltip), `color` y `type` (para mezclar barras y líneas).

## Paso 5. Carga de datos con animación

```js
const chart = PocketChart.create('#grafico', { type: 'area', title: 'Consumo', loader: { type: 'skeleton' } });

chart.load(() => fetch('/api/consumo').then((r) => r.json()));
// Muestra la animación de carga → dibuja el gráfico con su animación de entrada.
// Si la petición falla, muestra un error y se reintenta con un toque.
```

La función puede devolver un **array de series** o un **objeto de opciones** (`{ series, categories, ... }`).

## Paso 6. Escuchar lo que hace el usuario

```js
chart.on('inspect', (sel) => {
  // sel = { label: '14 nov, 08:00', points: [{ series: 'Gallons', y: 352.3 }] }  o null al cerrar
});
chart.on('zoom', ({ from, to, zoomed }) => {});
chart.on('ready', () => {});   // terminó la animación de entrada
```

## Siguiente paso

Elige la guía de tu tecnología:

- [HTML sin código](02-html.md)
- [JavaScript](03-javascript.md)
- [React y Next.js](04-react.md)
- [React Native](05-react-native.md)
- [Vue, Angular, Svelte, Flutter y otros](06-otros.md)
- [Referencia completa de opciones](07-referencia.md)
