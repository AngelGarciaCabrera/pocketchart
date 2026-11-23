// ../../../../../mnt/attach/project-files/pocketchart/integrations/react/PocketChart.jsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { create } from "pocketchart";
import { jsx } from "react/jsx-runtime";
var EVENTS = {
  onInspect: "inspect",
  onZoom: "zoom",
  onToggle: "toggle",
  onReady: "ready",
  onUpdated: "updated",
  onError: "error",
  onVisible: "visible",
  onExport: "export",
  onZoomEnd: "zoomEnd",
  onInteractionStart: "interactionStart",
  onInteractionEnd: "interactionEnd",
  onFullscreenRequest: "fullscreenRequest"
};
var keyOf = (o) => JSON.stringify(o, (k, v) => typeof v === "function" ? `fn:${v.toString().length}` : v);
var PocketChart = forwardRef(function PocketChart2(props, ref) {
  const { series, loading, options = {}, className, style, ...rest } = props;
  const el = useRef(null);
  const chart = useRef(null);
  const handlers = useRef({});
  const direct = {};
  for (const k in rest) if (!(k in EVENTS)) direct[k] = rest[k];
  const opts = { ...options, ...direct };
  const optsKey = keyOf(opts);
  for (const k in EVENTS) handlers.current[k] = props[k];
  useEffect(() => {
    const c = create(el.current, { ...opts, series: series || [], loading: !!loading });
    for (const [prop, evt] of Object.entries(EVENTS)) c.on(evt, (d) => handlers.current[prop]?.(d));
    chart.current = c;
    return () => {
      c.destroy();
      chart.current = null;
    };
  }, []);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    chart.current?.update(opts);
  }, [optsKey]);
  const firstData = useRef(true);
  useEffect(() => {
    if (firstData.current) {
      firstData.current = false;
      return;
    }
    if (series) chart.current?.setData(series);
  }, [series]);
  useEffect(() => {
    chart.current?.setLoading(!!loading);
  }, [loading]);
  useImperativeHandle(ref, () => chart.current, []);
  return /* @__PURE__ */ jsx("div", { ref: el, className, style });
});
var PocketChart_default = PocketChart;
export {
  PocketChart,
  PocketChart_default as default
};
