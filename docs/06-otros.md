# 6. Vue, Angular, Svelte, Flutter y otros

← [Volver al índice](../README.md)

La idea es siempre la misma: **crea** el gráfico cuando el contenedor existe, **actualízalo** cuando cambian los datos y **destrúyelo** al salir.

## Vue 3

```vue
<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { create } from 'pocketchart';

const props = defineProps({ series: Array, options: Object });
const el = ref(null);
let chart;

onMounted(() => { chart = create(el.value, { ...props.options, series: props.series }); });
watch(() => props.series, (s) => chart?.setData(s), { deep: true });
watch(() => props.options, (o) => chart?.update(o), { deep: true });
onBeforeUnmount(() => chart?.destroy());
</script>

<template><div ref="el" /></template>
```

O con la etiqueta: llama a `register()` una vez (por ejemplo en `main.js`) y, en `vite.config.js`, indica que `pocket-chart` es un elemento propio:

```js
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === 'pocket-chart' } } })
```

```js
import { register } from 'pocketchart';
register();
```

```vue
<pocket-chart :config="{ type: 'area', series }" @inspect="alInspeccionar" />
```

## Angular

```ts
import { Component, ElementRef, Input, OnChanges, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { create, PocketChart, Series, PocketChartOptions } from 'pocketchart';

@Component({ selector: 'app-pocket-chart', standalone: true, template: '<div #host></div>' })
export class PocketChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host') host!: ElementRef<HTMLDivElement>;
  @Input() series: Series[] = [];
  @Input() options: PocketChartOptions = {};
  private chart?: PocketChart;

  ngAfterViewInit() { this.chart = create(this.host.nativeElement, { ...this.options, series: this.series }); }
  ngOnChanges() { this.chart?.update({ ...this.options, series: this.series }); }
  ngOnDestroy() { this.chart?.destroy(); }
}
```

## Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { create } from 'pocketchart';
  export let series = [];
  export let options = {};
  let el, chart;
  onMount(() => { chart = create(el, { ...options, series }); return () => chart.destroy(); });
  $: chart && chart.setData(series);
</script>

<div bind:this={el}></div>
```

## Flutter

Usa [`webview_flutter`](https://pub.dev/packages/webview_flutter) con la misma idea que en [React Native](05-react-native.md):

1. Copia `dist/pocketchart.min.js` a `assets/` y decláralo en `pubspec.yaml`.
2. Carga un HTML con `<div id="c"></div>`, el script y `PocketChart.create('#c', ...)`.
3. Envía datos con `controller.runJavaScript("chart.setData(${jsonEncode(series)})")`.
4. Recibe eventos con un `JavaScriptChannel` y `chart.on('inspect', d => Pocket.postMessage(JSON.stringify(d)))`.

## Ionic / Capacitor / Cordova

Son aplicaciones web: usa la guía de [JavaScript](03-javascript.md) o de tu framework (React, Vue, Angular).

## Android nativo (Kotlin) o iOS (Swift)

Igual que Flutter: un `WebView` / `WKWebView` con un HTML local que cargue `pocketchart.min.js`. Envía los datos con `evaluateJavascript` y recibe los eventos con un `JavascriptInterface` (Android) o `WKScriptMessageHandler` (iOS).

## Plantillas de servidor (PHP, Django, Laravel, Rails, ASP.NET)

Usa la etiqueta `<pocket-chart>` e imprime los datos en el JSON. Lo tienes en la guía de [HTML](02-html.md#paso-4-opcional-datos-desde-tu-servidor).
