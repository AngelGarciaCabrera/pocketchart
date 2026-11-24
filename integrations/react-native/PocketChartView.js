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
 *     keepView                                   // datos nuevos sin perder el zoom
 *     onZoomEnd={({ from, to, source }) => pedirDatos(from, to)}
 *     onInteractionStart={() => setScroll(false)} // bloquea el scroll de la pantalla mientras se arrastra
 *     onInteractionEnd={() => setScroll(true)}
 *   />
 *
 * Varios gráficos en una sola WebView (una sola carga de la librería):
 *
 *   <PocketChartGroup charts={[{ key: 'temp', options, series }, { key: 'hum', options, series }]}
 *     onZoomEnd={(key, z) => …} />
 *
 * Hermes no conserva el texto de las funciones: usa los formatos declarativos
 * (format: 'compact' | 'currency' | …, x.format: 'MM/dd HH:mm', tooltip.template…).
 *
 * Exportar (PNG, PDF, Excel): pasa `onExport` y recibirás { filename, format, mime, base64 }.
 * Para tu propio PDF: `await ref.current.toImage({ width: 700, aspectRatio: 2 })` y `await ref.current.toData()`.
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import LIB from './pocketchart-lib'; // generado por `npm run build` (contiene dist/pocketchart.min.js como texto)

const EVENTS = ['inspect', 'zoom', 'zoomEnd', 'toggle', 'ready', 'updated', 'error', 'interactionStart', 'interactionEnd', 'fullscreenRequest', 'visible'];

const html = (bg, gap) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;padding:0;overflow:hidden;background:${bg};-webkit-user-select:none;user-select:none}.pc-item+.pc-item{margin-top:${gap}px}</style></head>
<body><div id="root"></div>
<script>${LIB}</script>
<script>
(function(){
  var EVENTS = ${JSON.stringify(EVENTS)};
  var send = function(type, data, key){ window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data, key: key })); };
  var charts = {}, lastH = 0;
  var reviveFns = function(o){
    // Las funciones viajan como texto con el prefijo "fn:". Con Hermes ese texto no es código válido:
    // se descarta (avisando) y se usan los formatos declarativos.
    if (o && typeof o === 'object') for (var k in o) {
      var v = o[k];
      if (typeof v === 'string' && v.indexOf('fn:') === 0) {
        try {
          if (/\\[(bytecode|native code)\\]/.test(v)) throw new Error('sin código');
          o[k] = (0, eval)('(' + v.slice(3) + ')'); if (typeof o[k] !== 'function') throw new Error('no es una función');
        }
        catch (e) { delete o[k]; send('error', 'PocketChart: la función "' + k + '" no se pudo usar en la WebView (Hermes no conserva su código). Usa un formato declarativo.'); }
      }
      else if (v && typeof v === 'object') reviveFns(v);
    }
    return o;
  };
  var create = function(key, msg){
    var el = document.createElement('div'); el.className = 'pc-item'; el.id = 'pc-' + key;
    document.getElementById('root').appendChild(el);
    if (msg.exportBridge && msg.options.export !== false) {
      // Dentro de la WebView no hay descargas: el archivo se envía a React Native en base64.
      msg.options.export = Object.assign({}, msg.options.export || {}, { onExport: function(blob, filename, format){
        var r = new FileReader();
        r.onload = function(){ var u = String(r.result); send('export', { filename: filename, format: format, mime: blob.type, base64: u.slice(u.indexOf(',') + 1) }, key); };
        r.readAsDataURL(blob);
      } });
    } else if (!msg.exportBridge) msg.options.export = false;
    var chart = PocketChart.create(el, msg.options);
    EVENTS.forEach(function(e){ chart.on(e, function(d){ send(e, d, key); }); });
    charts[key] = chart;
  };
  window.__pc = function(msg){
    msg = reviveFns(msg);
    var key = msg.key || 'main', chart = charts[key];
    if (msg.type === 'init') { if (!chart) create(key, msg); return; }
    if (msg.type === 'remove') { if (chart) { chart.destroy(); var el = document.getElementById('pc-' + key); if (el) el.remove(); delete charts[key]; } return; }
    if (!chart) return;
    if (msg.type === 'update') chart.update(msg.options, msg.uo || {});
    else if (msg.type === 'setData') chart.setData(msg.series, msg.uo || {});
    else if (msg.type === 'setLoading') chart.setLoading(msg.on, msg.opts || {});
    else if (msg.type === 'call' && typeof chart[msg.method] !== 'function') {
      if (msg.id) send('result', { id: msg.id, error: 'Método desconocido: ' + msg.method }, key);
    }
    else if (msg.type === 'call') {
      // Con id, el resultado vuelve a React Native (ref.current.toImage(), toData(), getZoom()…).
      Promise.resolve().then(function(){ return chart[msg.method].apply(chart, msg.args || []); }).then(function(v){
        if (!msg.id) return;
        if (v === chart) v = null;
        else if (v && typeof v === 'object' && v.blob) { v = Object.assign({}, v); delete v.blob; }
        send('result', { id: msg.id, value: v }, key);
      }, function(err){
        var m = String(err && err.message || err);
        if (msg.id) send('result', { id: msg.id, error: m }, key); else send('error', m, key);
      });
    }
  };
  new ResizeObserver(function(){
    var h = Math.ceil(document.getElementById('root').getBoundingClientRect().height); // alto real del contenido
    if (h !== lastH) { lastH = h; send('size', h); }
  }).observe(document.body);
  send('loaded');
})();
</script></body></html>`;

// Serializa opciones convirtiendo funciones a texto ("fn:..."). Con Hermes, mejor no pasar funciones.
const serialize = (o) => JSON.stringify(o, (k, v) => (typeof v === 'function' ? 'fn:' + v.toString() : v));

/** Puente común: WebView, mensajes y llamadas con respuesta. */
function useBridge() {
  const web = useRef(null);
  const pending = useRef(new Map()); // llamadas que esperan respuesta de la WebView
  const post = useCallback((msg) => { web.current?.injectJavaScript(`window.__pc(${serialize(msg)});true;`); }, []);
  const request = useCallback((key, method, ...args) => new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    const timer = setTimeout(() => { pending.current.delete(id); reject(new Error(`PocketChart: ${method} no respondió`)); }, 20000);
    pending.current.set(id, { resolve, reject, timer });
    post({ type: 'call', key, method, args, id });
  }), [post]);
  const settle = useCallback((data) => {
    const p = pending.current.get(data.id); if (!p) return;
    pending.current.delete(data.id); clearTimeout(p.timer);
    if (data.error) p.reject(new Error(data.error)); else p.resolve(data.value);
  }, []);
  /** Métodos de un gráfico (los mismos para PocketChartView y para cada gráfico de un grupo). */
  const api = useCallback((key) => ({
    resetZoom: () => post({ type: 'call', key, method: 'resetZoom', args: ['api'] }),
    zoomTo: (from, to, animate = true) => post({ type: 'call', key, method: 'zoomTo', args: [from instanceof Date ? from.getTime() : from, to instanceof Date ? to.getTime() : to, animate] }),
    zoomBy: (k) => post({ type: 'call', key, method: 'zoomBy', args: [k] }),
    getZoom: () => request(key, 'getZoom'),
    clearInspect: () => post({ type: 'call', key, method: 'clearInspect' }),
    select: (x) => post({ type: 'call', key, method: 'select', args: [x instanceof Date ? x.getTime() : x] }),
    setData: (series, opts) => post({ type: 'setData', key, series, uo: opts || {} }),
    replay: () => post({ type: 'call', key, method: 'replay' }),
    setLoading: (on, opts) => post({ type: 'setLoading', key, on, opts }),
    call: (method, ...args) => post({ type: 'call', key, method, args }),
    // El archivo llega a la prop onExport: ref.current.export('pdf')
    export: (format = 'png', opts) => post({ type: 'call', key, method: 'export', args: [format, opts || {}] }),
    // Para tu propio PDF: imagen en base64 y datos en filas, sin descargar ni compartir nada.
    toImage: (opts) => request(key, 'toImage', opts || {}),
    toData: (opts) => request(key, 'toData', opts || {}),
  }), [post, request]);
  return { web, post, settle, api };
}

const webProps = {
  originWhitelist: ['*'],
  scrollEnabled: false,
  bounces: false,
  overScrollMode: 'never',
  javaScriptEnabled: true,
  style: { backgroundColor: 'transparent' },
  // Deja que el scroll vertical llegue a tu ScrollView y los gestos horizontales al gráfico
  nestedScrollEnabled: true,
  setBuiltInZoomControls: false,
};

const toHandlers = (p) => ({
  inspect: p.onInspect, zoom: p.onZoom, zoomEnd: p.onZoomEnd, toggle: p.onToggle, ready: p.onReady, updated: p.onUpdated,
  error: p.onError, export: p.onExport, interactionStart: p.onInteractionStart, interactionEnd: p.onInteractionEnd,
  fullscreenRequest: p.onFullscreenRequest, visible: p.onVisible,
});

export const PocketChartView = forwardRef(function PocketChartView(props, ref) {
  const { options = {}, series, loading = false, background = 'transparent', style, keepView = false, zoomRange } = props;
  const { web, post, settle, api } = useBridge();
  const [height, setHeight] = useState((options.height || 260) + 80);
  const [ready, setReady] = useState(false);
  const handlersRef = useRef(toHandlers(props));
  handlersRef.current = toHandlers(props);

  // Fuente de la página: se crea una vez
  const source = useMemo(() => ({ html: html(background, 0) }), [background]);

  const optsKey = serialize(options);
  useEffect(() => { if (ready) post({ type: 'update', options, uo: { keepView: true } }); }, [optsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && series) post({ type: 'setData', series, uo: { keepView } }); }, [series]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) post({ type: 'setLoading', on: !!loading }); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps
  const zrKey = zoomRange ? `${+zoomRange.from}|${+zoomRange.to}` : '';
  useEffect(() => { if (ready && zoomRange) post({ type: 'update', options: { zoomRange: { from: +zoomRange.from, to: +zoomRange.to } } }); }, [zrKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Métodos: ref.current.resetZoom(), zoomTo(a, b), getZoom(), clearInspect(), select(x), toImage(), toData()…
  useImperativeHandle(ref, () => api('main'), [api]);

  const onMessage = useCallback((e) => {
    let msg; try { msg = JSON.parse(e.nativeEvent.data); } catch (_) { return; }
    if (msg.type === 'loaded') {
      // En una WebView la pantalla completa del navegador no existe: por defecto se oculta el botón
      // (usa fullscreen: 'external' + onFullscreenRequest para abrir tu propio Modal).
      const zr = zoomRange ? { zoomRange: { from: +zoomRange.from, to: +zoomRange.to } } : {};
      post({ type: 'init', key: 'main', exportBridge: !!handlersRef.current.export, options: { fullscreen: false, ...options, ...zr, series: series || [], loading } });
      setReady(true);
    } else if (msg.type === 'size') setHeight(msg.data);
    else if (msg.type === 'result') settle(msg.data);
    else handlersRef.current[msg.type]?.(msg.data);
  }, [options, series, loading, zoomRange, post, settle]);

  return (
    <View style={[{ height }, style]}>
      <WebView ref={web} source={source} onMessage={onMessage} {...webProps} />
    </View>
  );
});

/**
 * Varios gráficos en una sola WebView: la librería se carga una vez (ideal para pantallas con 5 gráficos).
 * `charts`: [{ key, options, series, loading, keepView }]. Los eventos reciben (key, datos).
 * ref.current.chart(key) devuelve los mismos métodos que PocketChartView.
 */
export const PocketChartGroup = forwardRef(function PocketChartGroup(props, ref) {
  const { charts = [], background = 'transparent', gap = 16, style, keepView = false } = props;
  const { web, post, settle, api } = useBridge();
  const [height, setHeight] = useState(charts.length * 340);
  const [ready, setReady] = useState(false);
  const handlersRef = useRef(toHandlers(props));
  handlersRef.current = toHandlers(props);
  const sent = useRef(new Map()); // key → lo último enviado (opciones, series, carga)

  const source = useMemo(() => ({ html: html(background, gap) }), [background, gap]);

  useEffect(() => {
    if (!ready) return;
    const seen = new Set();
    charts.forEach((c) => {
      const key = String(c.key); seen.add(key);
      const prev = sent.current.get(key), optsKey = serialize(c.options || {});
      if (!prev) {
        post({ type: 'init', key, exportBridge: !!handlersRef.current.export, options: { fullscreen: false, ...(c.options || {}), series: c.series || [], loading: !!c.loading } });
      } else {
        if (prev.optsKey !== optsKey) post({ type: 'update', key, options: c.options || {}, uo: { keepView: true } });
        if (prev.series !== c.series && c.series) post({ type: 'setData', key, series: c.series, uo: { keepView: c.keepView ?? keepView } });
        if (prev.loading !== !!c.loading) post({ type: 'setLoading', key, on: !!c.loading });
      }
      sent.current.set(key, { optsKey, series: c.series, loading: !!c.loading });
    });
    [...sent.current.keys()].forEach((k) => { if (!seen.has(k)) { post({ type: 'remove', key: k }); sent.current.delete(k); } });
  }, [ready, charts, keepView, post]);

  useImperativeHandle(ref, () => ({ chart: (key) => api(String(key)) }), [api]);

  const onMessage = useCallback((e) => {
    let msg; try { msg = JSON.parse(e.nativeEvent.data); } catch (_) { return; }
    if (msg.type === 'loaded') { sent.current.clear(); setReady(true); }
    else if (msg.type === 'size') setHeight(msg.data);
    else if (msg.type === 'result') settle(msg.data);
    else handlersRef.current[msg.type]?.(msg.key, msg.data);
  }, [settle]);

  return (
    <View style={[{ height }, style]}>
      <WebView ref={web} source={source} onMessage={onMessage} {...webProps} />
    </View>
  );
});

export default PocketChartView;
