/**
 * Componente React para PocketChart.
 *
 *   <PocketChart
 *     type="line"
 *     title="Ventas"
 *     series={series}
 *     loading={cargando}
 *     options={{ animation: { enter: 'wave' } }}
 *     onInspect={(sel) => console.log(sel)}
 *   />
 *
 * Funciona en React 17+, Vite, Create React App y Next.js (sólo se crea en el navegador).
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { create } from 'pocketchart'; // o la ruta a dist/pocketchart.esm.js si lo copiaste al proyecto

const EVENTS = {
  onInspect: 'inspect',
  onZoom: 'zoom',
  onToggle: 'toggle',
  onReady: 'ready',
  onUpdated: 'updated',
  onError: 'error',
  onVisible: 'visible',
  onExport: 'export',
};

// Clave estable de las opciones: las funciones (formatos) no cambian la clave,
// así un objeto nuevo en cada render no redibuja el gráfico.
const keyOf = (o) => JSON.stringify(o, (k, v) => (typeof v === 'function' ? `fn:${v.toString().length}` : v));

export const PocketChart = forwardRef(function PocketChart(props, ref) {
  const { series, loading, options = {}, className, style, ...rest } = props;
  const el = useRef(null);
  const chart = useRef(null);
  const handlers = useRef({});

  // Props sueltas (type, title, height, theme…) se mezclan con `options`
  const direct = {};
  for (const k in rest) if (!(k in EVENTS)) direct[k] = rest[k];
  const opts = { ...options, ...direct };
  const optsKey = keyOf(opts);

  // Últimos manejadores de eventos sin volver a crear el gráfico
  for (const k in EVENTS) handlers.current[k] = props[k];

  // Crear una sola vez
  useEffect(() => {
    const c = create(el.current, { ...opts, series: series || [], loading: !!loading });
    for (const [prop, evt] of Object.entries(EVENTS)) c.on(evt, (d) => handlers.current[prop]?.(d));
    chart.current = c;
    return () => { c.destroy(); chart.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambios de opciones
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    chart.current?.update(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optsKey]);

  // Datos nuevos → transición animada
  const firstData = useRef(true);
  useEffect(() => {
    if (firstData.current) { firstData.current = false; return; }
    if (series) chart.current?.setData(series);
  }, [series]);

  // Estado de carga
  useEffect(() => { chart.current?.setLoading(!!loading); }, [loading]);

  // Acceso a la instancia: ref.current.resetZoom(), .replay(), .load(), etc.
  useImperativeHandle(ref, () => chart.current, []);

  return <div ref={el} className={className} style={style} />;
});

export default PocketChart;
