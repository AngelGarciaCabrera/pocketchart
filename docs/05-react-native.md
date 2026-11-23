# 5. React Native (Expo y React Native CLI)

← [Volver al índice](../README.md)

En React Native el gráfico se dibuja dentro de una **WebView**. El componente `PocketChartView` se encarga de todo: carga la librería sin conexión a internet, envía los datos, ajusta el alto solo y te devuelve los eventos (`onInspect`, `onZoom`…).

## Paso 1. Instala react-native-webview

**Expo:**

```bash
npx expo install react-native-webview
```

**React Native CLI:**

```bash
npm install react-native-webview
cd ios && pod install && cd ..
```

## Paso 2. Instala PocketChart

```bash
npm install pocketchart
```

```jsx
import { PocketChartView, PocketChartGroup } from 'pocketchart/react-native';
```

Ya viene compilado (sin JSX) y con tipos TypeScript. Para actualizar: `npm install pocketchart@latest`.

**Alternativa sin npm:** copia la carpeta [`integrations/react-native/`](../integrations/react-native/) a tu app, por ejemplo a `src/components/pocketchart/`:

```
src/components/pocketchart/
├── PocketChartView.js      ← el componente
└── pocketchart-lib.js      ← la librería empaquetada como texto (generada con npm run build)
```

> `pocketchart-lib.js` se genera con `npm run build` en este repositorio. Ya viene generado. Vuelve a copiarlo si actualizas la librería.

## Paso 3. Úsalo en una pantalla

```jsx
import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import PocketChartView from './components/pocketchart/PocketChartView';

export default function FeedScreen() {
  const [series, setSeries] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    fetch('https://tu-api.com/feed-cycles')
      .then((r) => r.json())
      .then(setSeries);
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <PocketChartView
        options={{
          type: 'line',
          title: 'Feed Cycles',
          subtitle: 'Últimos 14 días',
          legend: { mode: 'single' },
          animation: { enter: 'draw' },
          loader: { type: 'wave' },
          lang: 'es',
        }}
        series={series || []}
        loading={!series}
        background="#ffffff"
        onInspect={setSel}
      />
      {sel && <Text>{sel.label}: {sel.points[0]?.y}</Text>}
    </ScrollView>
  );
}
```

### Props

| Prop | Qué hace |
|---|---|
| `options` | Cualquier opción de la [referencia](07-referencia.md) |
| `series` | Datos. Al cambiar, hay transición animada. |
| `loading` | Muestra la animación de carga |
| `background` | Color de fondo de la WebView (usa el de tu pantalla) |
| `style` | Estilo del contenedor (márgenes, etc.). El alto se calcula solo. |
| `keepView` | `true`: al cambiar `series` se conserva el zoom y la selección fija |
| `zoomRange` | Zoom controlado `{ from, to }` |
| `onInspect`, `onZoom`, `onToggle`, `onReady`, `onUpdated`, `onError` | Eventos |
| `onZoomEnd` | Una vez al terminar cada gesto de zoom o pan: `{ from, to, zoomed, source }` |
| `onInteractionStart`, `onInteractionEnd` | Para bloquear el scroll de la pantalla mientras se arrastra |
| `onFullscreenRequest` | Con `fullscreen: 'external'`, para abrir tu propio Modal |
| `onExport` | Recibe el archivo exportado (PNG, PDF, Excel). Ver *Paso 6* |
| `ref` | `ref.current.zoomTo(a, b)`, `.zoomBy(0.5)`, `.resetZoom()`, `await .getZoom()`, `.select(x)`, `.clearInspect()`, `.setData(series, { keepView: true })`, `.replay()`, `.setLoading(true)`, `.export('pdf')`, `await .toImage()`, `await .toData()` |

## Paso 4. Modo oscuro

Pasa el tema de tu app:

```jsx
import { useColorScheme } from 'react-native';

const scheme = useColorScheme();
<PocketChartView options={{ ...opciones, theme: scheme }} background={scheme === 'dark' ? '#15171b' : '#ffffff'} />
```

## Paso 5. Pantalla completa en horizontal

Dentro de una WebView no existe la pantalla completa del navegador, por eso el componente oculta ese botón. Para verlo en grande, abre un `Modal` con otro `PocketChartView` y gira la pantalla:

```jsx
import { Modal } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation'; // o react-native-orientation-locker

const abrir = async () => { setGrande(true); await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); };
const cerrar = async () => { setGrande(false); await ScreenOrientation.unlockAsync(); };

<Modal visible={grande} onRequestClose={cerrar} supportedOrientations={['landscape', 'portrait']}>
  <PocketChartView options={{ ...opciones, height: 280 }} series={series} />
</Modal>
```

## Paso 6. Exportar a PNG, PDF o Excel

Dentro de una WebView no hay descargas, así que el archivo llega a tu app en base64 por `onExport`, y tú decides si guardarlo o compartirlo. Si no pasas `onExport`, el botón de descarga no aparece.

```bash
npx expo install expo-file-system expo-sharing
```

```jsx
import * as FileSystem from 'expo-file-system/legacy'; // en SDK 53 o anterior: 'expo-file-system'
import * as Sharing from 'expo-sharing';

const guardar = async ({ filename, mime, base64 }) => {
  const uri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, { mimeType: mime }); // abre "Compartir": guardar en Archivos, WhatsApp, correo…
};

<PocketChartView ref={chartRef} options={opciones} series={series} onExport={guardar} />
<Button title="PDF" onPress={() => chartRef.current.export('pdf')} />
```

`onExport` recibe `{ filename, format, mime, base64 }`. Con React Native CLI puedes usar `react-native-fs` y `react-native-share` de la misma forma.

## Paso 7. El gráfico dentro del PDF de tu app

Si tu app ya genera su propio PDF (resumen, tablas…), no uses el PDF de PocketChart: pide sólo la imagen con `toImage()` y los datos con `toData()`. No descargan ni comparten nada; devuelven una promesa.

```bash
npx expo install expo-print expo-sharing
```

```jsx
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const chartRef = useRef(null);

const generarInforme = async () => {
  const img = await chartRef.current.toImage({ width: 700, header: false, background: '#ffffff' });
  const { columns, formatted } = await chartRef.current.toData();

  const html = `
    <h1>Informe de ventas</h1>
    <p>${resumen}</p>
    <img src="${img.dataUrl}" style="width:100%" />
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
      <tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr>
      ${formatted.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}
    </table>`;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
};

<PocketChartView ref={chartRef} options={opciones} series={series} />
```

`toImage()` devuelve `{ base64, dataUrl, width, height, mime }`. Usa `base64` si tu librería de PDF lo pide así. Si además quieres que el botón de descarga sólo ofrezca la imagen, pasa `options={{ export: { formats: ['png'] } }}` junto con `onExport`.

## Formatos con funciones

Las funciones (`y.format`, `yAxis.format`, `tooltip.format`…) se envían a la WebView como texto. Escríbelas **sin usar variables de fuera de la función**:

```jsx
options={{ y: { format: (v) => '$' + v.toFixed(2) } }}          // ✅
options={{ y: { format: (v) => moneda + v.toFixed(2) } }}        // ❌ `moneda` no existe dentro de la WebView
```

## Ejes Y múltiples

Cada serie puede tener su propia escala con `yAxis`. Funciona igual que en la web (ver *Ejes Y múltiples* en la referencia):

```jsx
<PocketChartView
  options={{
    type: 'line',
    categories: dias,
    series: [
      { name: 'pH', data: ph, yAxis: { min: 0, max: 14, title: 'pH', format: (v) => v.toFixed(1) } },
      { name: 'EC', unit: 'µS/cm', data: ec, yAxis: { min: 0, max: 5000, opposite: true, title: 'EC' } },
      { name: 'Volumen', type: 'bar', unit: 'L', data: litros, yAxis: { show: false } },
    ],
  }}
  onInspect={(sel) => console.log(sel?.points.map((p) => [p.series, p.y, p.yAxis?.max]))}
/>
```

`yAxis.format` viaja a la WebView como texto con el prefijo `fn:`, igual que `y.format`, así que tampoco puede usar variables de fuera de la función.

## Zoom con datos del backend

```jsx
const [series, setSeries] = useState(inicial);
const [scroll, setScroll] = useState(true);

<ScrollView scrollEnabled={scroll}>
  <PocketChartView
    options={{ type: 'line', x: { format: 'MM/dd HH:mm' }, tooltip: { sticky: true }, inspector: 'bottom' }}
    series={series}
    keepView                                            // los datos nuevos no cambian el zoom
    onZoomEnd={async ({ from, to }) => setSeries(await pedirDatos(from, to))}
    onInteractionStart={() => setScroll(false)}         // sin scroll mientras se arrastra el gráfico
    onInteractionEnd={() => setScroll(true)}
  />
</ScrollView>
```

`onZoomEnd` llega una sola vez al soltar el gesto. Para fijar el zoom desde la app usa la prop `zoomRange={{ from, to }}` o `ref.current.zoomTo(from, to)`. Otros métodos: `getZoom()`, `select(x)`, `clearInspect()`, `setData(series, { keepView: true })`.

## Hermes: formatos sin funciones

Con Hermes el texto de las funciones no se conserva y no puede viajar a la WebView. Usa los formatos declarativos (`format: 'compact'`, `'currency'`, `x.format: 'MM/dd HH:mm'`, `tooltip.template`). Si llega una función sin código, se descarta y recibes un aviso en `onError`.

## Pantalla completa con tu propio Modal

```jsx
<PocketChartView options={{ ...opts, fullscreen: 'external' }} onFullscreenRequest={({ from, to }) => abrirModal({ from, to })} />
// En el Modal: <PocketChartView options={opts} series={series} zoomRange={{ from, to }} />
```

El gráfico acepta cambios de tamaño (giro, Modal) sin recargar ni perder el zoom.

## Varios gráficos en una pantalla

`PocketChartGroup` carga la librería una sola vez para todos (por ejemplo, los 5 gráficos de Environments):

```jsx
import { PocketChartGroup } from './PocketChartView';

<PocketChartGroup
  charts={[{ key: 'temp', options: optsTemp, series: temp }, { key: 'hum', options: optsHum, series: hum }]}
  onZoomEnd={(key, z) => recargar(key, z)}
/>
```

Los eventos reciben `(key, datos)`; `ref.current.chart('temp')` da los mismos métodos que `PocketChartView`. Con `lite: true` en las opciones, cada gráfico entra sin animación y con menos resolución. Sin `lite`, los gráficos que aparecen juntos entran uno tras otro (`animation.chartStagger`).

## Datos grandes

Envía arreglos separados en lugar de pares: `{ name: 'Temp', x: fechas, y: valores }` (o `xStart` + `xStep` para datos regulares). Son casi la mitad de texto por el puente.

## Consejos de rendimiento

- Envía sólo los puntos que necesitas: la WebView recibe los datos como JSON.
- Para datos en tiempo real, agrupa las actualizaciones (por ejemplo, una cada 500 ms) en vez de llamar a `setData` por cada lectura.
- Con listas largas de gráficos (`FlatList`), usa `initialNumToRender` bajo. La animación de entrada empieza cuando cada gráfico aparece en pantalla.

## Alternativa: Expo DOM components / React Native Web

Si tu app también corre en web (Expo Router con web o React Native Web), en la versión web puedes usar directamente el componente de [React](04-react.md).
