/**
 * PocketChart para React Native (Expo o CLI) usando react-native-webview.
 *
 *   npx expo install react-native-webview      # Expo
 *   npm i react-native-webview && cd ios && pod install   # React Native CLI
 *
 *   <PocketChartView
 *     options={{ type: 'area', title: 'Consumo', animation: { enter: 'grow' } }}
 *     series={series}
 *     loading={cargando}
 *     onInspect={(sel) => setSeleccion(sel)}
 *   />
 *
 * El alto se ajusta solo al contenido (cabecera + leyenda + gráfico).
 *
 * Exportar (PNG, PDF, Excel): pasa `onExport` y recibirás { filename, format, mime, base64 }
 * para guardarlo o compartirlo (por ejemplo con expo-file-system y expo-sharing).
 * Sin `onExport`, el botón de descarga se oculta: dentro de una WebView no hay descargas.
 *
 * Para tu propio PDF (resumen, tablas…): `await ref.current.toImage({ width: 700 })` devuelve
 * { base64, dataUrl, width, height } y `await ref.current.toData()` las filas de datos.
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import LIB from './pocketchart-lib'; // generado por `npm run build` (contiene dist/pocketchart.min.js como texto)

const html = (bg) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;padding:0;background:${bg};-webkit-user-select:none;user-select:none}</style></head>
<body><div id="c"></div>
<script>${LIB}</script>
<script>
(function(){
  var send = function(type, data){ window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data })); };
  var chart = null, lastH = 0;
  var reviveFns = function(o){
    // Las funciones no cruzan el puente: se envían como texto con el prefijo "fn:" y se reconstruyen aquí.
    if (o && typeof o === 'object') for (var k in o) {
      var v = o[k];
      if (typeof v === 'string' && v.indexOf('fn:') === 0) o[k] = (0, eval)('(' + v.slice(3) + ')');
      else if (v && typeof v === 'object') reviveFns(v);
    }
    return o;
  };
  window.__pc = function(msg){
    msg = reviveFns(msg);
    if (msg.type === 'init') {
      if (msg.exportBridge && msg.options.export !== false) {
        // Dentro de la WebView no hay descargas: el archivo se envía a React Native en base64.
        msg.options.export = Object.assign({}, msg.options.export || {}, { onExport: function(blob, filename, format){
          var r = new FileReader();
          r.onload = function(){ var u = String(r.result); send('export', { filename: filename, format: format, mime: blob.type, base64: u.slice(u.indexOf(',') + 1) }); };
          r.readAsDataURL(blob);
        } });
      } else if (!msg.exportBridge) msg.options.export = false;
      chart = PocketChart.create('#c', msg.options);
      ['inspect','zoom','toggle','ready','updated','error'].forEach(function(e){ chart.on(e, function(d){ send(e, d); }); });
    } else if (chart) {
      if (msg.type === 'update') chart.update(msg.options);
      else if (msg.type === 'setData') chart.setData(msg.series);
      else if (msg.type === 'setLoading') chart.setLoading(msg.on, msg.opts || {});
      else if (msg.type === 'call' && typeof chart[msg.method] !== 'function') {
        if (msg.id) send('result', { id: msg.id, error: 'Método desconocido: ' + msg.method });
      }
      else if (msg.type === 'call') {
        // Con id, el resultado vuelve a React Native (ref.current.toImage(), toData()…).
        Promise.resolve().then(function(){ return chart[msg.method].apply(chart, msg.args || []); }).then(function(v){
          if (!msg.id) return;
          if (v === chart) v = null;
          else if (v && typeof v === 'object' && v.blob) { v = Object.assign({}, v); delete v.blob; }
          send('result', { id: msg.id, value: v });
        }, function(err){
          var m = String(err && err.message || err);
          if (msg.id) send('result', { id: msg.id, error: m }); else send('error', m);
        });
      }
    }
  };
  new ResizeObserver(function(){
    var h = Math.ceil(document.getElementById('c').getBoundingClientRect().height); // alto real del contenido
    if (h !== lastH) { lastH = h; send('size', h); }
  }).observe(document.body);
  send('loaded');
})();
</script></body></html>`;

// Serializa opciones convirtiendo funciones a texto ("fn:...")
const serialize = (o) => JSON.stringify(o, (k, v) => (typeof v === 'function' ? 'fn:' + v.toString() : v));

export const PocketChartView = forwardRef(function PocketChartView(
  { options = {}, series, loading = false, background = 'transparent', style, onInspect, onZoom, onToggle, onReady, onUpdated, onError, onExport },
  ref
) {
  const web = useRef(null);
  const pending = useRef(new Map()); // llamadas que esperan respuesta de la WebView
  const [height, setHeight] = useState((options.height || 260) + 80);
  const [ready, setReady] = useState(false);
  const handlers = { inspect: onInspect, zoom: onZoom, toggle: onToggle, ready: onReady, updated: onUpdated, error: onError, export: onExport };
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const post = useCallback((msg) => {
    web.current?.injectJavaScript(`window.__pc(${serialize(msg)});true;`);
  }, []);

  // Fuente de la página: se crea una vez
  const source = useMemo(() => ({ html: html(background) }), [background]);

  const optsKey = serialize(options);
  useEffect(() => {
    if (!ready) return;
    post({ type: 'update', options });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optsKey]);

  useEffect(() => { if (ready && series) post({ type: 'setData', series }); }, [series]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) post({ type: 'setLoading', on: !!loading }); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Llamada con respuesta: devuelve una promesa con el resultado del método dentro de la WebView.
  const request = useCallback((method, ...args) => new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    const timer = setTimeout(() => { pending.current.delete(id); reject(new Error(`PocketChart: ${method} no respondió`)); }, 20000);
    pending.current.set(id, { resolve, reject, timer });
    post({ type: 'call', method, args, id });
  }), [post]);

  // Métodos: ref.current.resetZoom(), ref.current.replay(), ref.current.call('zoomTo', a, b)
  useImperativeHandle(ref, () => ({
    resetZoom: () => post({ type: 'call', method: 'resetZoom' }),
    replay: () => post({ type: 'call', method: 'replay' }),
    setLoading: (on, opts) => post({ type: 'setLoading', on, opts }),
    call: (method, ...args) => post({ type: 'call', method, args }),
    // El archivo llega a la prop onExport: ref.current.export('pdf')
    export: (format = 'png', opts) => post({ type: 'call', method: 'export', args: [format, opts || {}] }),
    // Para tu propio PDF: imagen en base64 y datos en filas, sin descargar ni compartir nada.
    toImage: (opts) => request('toImage', opts || {}),
    toData: () => request('toData'),
  }), [post, request]);

  const onMessage = useCallback((e) => {
    let msg; try { msg = JSON.parse(e.nativeEvent.data); } catch (_) { return; }
    if (msg.type === 'loaded') {
      // En una WebView la pantalla completa del navegador no existe: por defecto se oculta el botón.
      post({ type: 'init', exportBridge: !!handlersRef.current.export, options: { fullscreen: false, ...options, series: series || [], loading } });
      setReady(true);
    } else if (msg.type === 'size') setHeight(msg.data);
    else if (msg.type === 'result') {
      const p = pending.current.get(msg.data.id); if (!p) return;
      pending.current.delete(msg.data.id); clearTimeout(p.timer);
      if (msg.data.error) p.reject(new Error(msg.data.error)); else p.resolve(msg.data.value);
    }
    else handlersRef.current[msg.type]?.(msg.data);
  }, [options, series, loading, post]);

  return (
    <View style={[{ height }, style]}>
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={source}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        style={{ backgroundColor: 'transparent' }}
        // Deja que el scroll vertical llegue a tu ScrollView y los gestos horizontales al gráfico
        nestedScrollEnabled
        setBuiltInZoomControls={false}
      />
    </View>
  );
});

export default PocketChartView;
