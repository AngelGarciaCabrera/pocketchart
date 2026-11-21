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

## Paso 2. Copia los dos archivos del componente

Copia la carpeta [`integrations/react-native/`](../integrations/react-native/) a tu app, por ejemplo a `src/components/pocketchart/`:

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
| `onInspect`, `onZoom`, `onToggle`, `onReady`, `onUpdated`, `onError` | Eventos |
| `onExport` | Recibe el archivo exportado (PNG, PDF, Excel). Ver *Paso 6* |
| `ref` | `ref.current.resetZoom()`, `.replay()`, `.setLoading(true)`, `.export('pdf')`, `.call('zoomTo', a, b)` |

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

## Formatos con funciones

Las funciones (`y.format`, `tooltip.format`…) se envían a la WebView como texto. Escríbelas **sin usar variables de fuera de la función**:

```jsx
options={{ y: { format: (v) => '$' + v.toFixed(2) } }}          // ✅
options={{ y: { format: (v) => moneda + v.toFixed(2) } }}        // ❌ `moneda` no existe dentro de la WebView
```

## Consejos de rendimiento

- Envía sólo los puntos que necesitas: la WebView recibe los datos como JSON.
- Para datos en tiempo real, agrupa las actualizaciones (por ejemplo, una cada 500 ms) en vez de llamar a `setData` por cada lectura.
- Con listas largas de gráficos (`FlatList`), usa `initialNumToRender` bajo. La animación de entrada empieza cuando cada gráfico aparece en pantalla.

## Alternativa: Expo DOM components / React Native Web

Si tu app también corre en web (Expo Router con web o React Native Web), en la versión web puedes usar directamente el componente de [React](04-react.md).
