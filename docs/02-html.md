# 2. HTML (sin escribir JavaScript)

← [Volver al índice](../README.md)

Ideal para webs estáticas, CMS (WordPress, Webflow), plantillas de servidor (PHP, Django, Laravel, Rails) o correos de informes que se abren en el navegador.

## Paso 1. Carga el archivo

Al final del `<body>` o en el `<head>`:

```html
<script src="pocketchart.min.js"></script>
<!-- o desde el CDN: https://cdn.jsdelivr.net/gh/AngelGarciaCabrera/pocketchart@v0.8.1/dist/pocketchart.min.js -->
```

Esto registra automáticamente la etiqueta `<pocket-chart>`.

## Paso 2. Escribe la etiqueta con tus datos

Los datos van en un bloque JSON dentro de la etiqueta:

```html
<pocket-chart type="line" title="Feed Cycles" subtitle="Últimos 14 días" height="260"
              legend-mode="single" animation="draw" loader="wave">
  <script type="application/json">
    {
      "series": [
        { "name": "Gallons",  "unit": "gal", "data": [["2026-11-14T00:00", 351.4], ["2026-11-14T02:00", 355.6]] },
        { "name": "FeedTemp", "unit": "°F",  "data": [["2026-11-14T00:00", 68.1],  ["2026-11-14T02:00", 68.9]] }
      ]
    }
  </script>
</pocket-chart>
```

Todo lo que acepta `PocketChart.create()` puede ir dentro del JSON (colores, animaciones, estilo…).

## Atributos disponibles

| Atributo | Ejemplo | Para qué |
|---|---|---|
| `type` | `bar` | Tipo de gráfico |
| `title`, `subtitle` | `Ventas` | Cabecera |
| `height` | `300` | Alto del área de dibujo en px |
| `theme` | `dark` | `auto`, `light` o `dark` |
| `lang` | `es` | Idioma de los textos de la interfaz |
| `legend-mode` | `single` | Una serie a la vez |
| `export` | `png pdf xlsx` | Formatos del botón de descarga; `false` lo oculta |
| `stack` | `percent` | Apila las series (sin valor) o al 100 % (`percent`) |
| `animation` | `wave` | Animación de entrada |
| `easing` | `back` | Curva de tiempo |
| `duration` | `900` | Duración en ms |
| `loader` | `dots` | Animación de carga |
| `loading` | *(sin valor)* | Muestra el estado de carga |

Si cambias un atributo con JavaScript, el gráfico se actualiza solo.

## Paso 3 (opcional). Cambiar los colores con CSS

```html
<style>
  pocket-chart {
    --pocket-c1: #0b6e99;          /* color de la serie 1 (hasta --pocket-c8) */
    --pocket-bg: #ffffff;
    --pocket-font: "Inter", system-ui;
    --pocket-bg-dark: #0d1b2a;     /* versiones para modo oscuro con sufijo -dark */
  }
</style>
```

## Paso 4 (opcional). Datos desde tu servidor

Con plantillas de servidor, imprime el JSON directamente:

```php
<pocket-chart type="bar" title="Ventas">
  <script type="application/json"><?= json_encode(['series' => $series, 'categories' => $meses]) ?></script>
</pocket-chart>
```

O asígnalos después desde JavaScript:

```html
<pocket-chart id="ventas" type="bar" title="Ventas" loading></pocket-chart>
<script>
  fetch('/api/ventas').then((r) => r.json()).then((series) => {
    const el = document.getElementById('ventas');
    el.config = { series };          // pinta con animación
    el.removeAttribute('loading');
  });
</script>
```

## Eventos

```html
<script>
  document.querySelector('pocket-chart').addEventListener('inspect', (e) => console.log(e.detail));
</script>
```

Eventos: `inspect`, `zoom`, `toggle`, `ready`, `updated`, `error`, `export`.

Para descargar desde tu propio botón: `document.querySelector('pocket-chart').chart.export('pdf')`.

Ejemplo completo: [`examples/html.html`](../examples/html.html).
