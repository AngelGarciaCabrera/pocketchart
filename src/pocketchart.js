/*!
 * PocketChart v0.8.0 — gráficos mobile-first, sin dependencias.
 * Canvas 2D + Pointer Events. Funciona en vanilla JS, como Web Component
 * (<pocket-chart>) y dentro de cualquier framework o WebView.
 */

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const PALETTE = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'],
};

const I18N = {
  en: {
    reset: 'Reset zoom', fullscreen: 'Fullscreen', exit: 'Close', zoomIn: 'Zoom in', zoomOut: 'Zoom out', resetShort: 'Reset', tapHint: 'Tap the chart to see values',
    download: 'Download', category: 'Category', date: 'Date', png: 'Image (PNG)', pdf: 'PDF document', xlsx: 'Excel (.xlsx)', csv: 'CSV',
    hintTouch: 'Pinch to zoom · Tap to see values',
    hintMouse: 'Scroll with Ctrl to zoom · Drag to inspect',
    rotate: 'Rotate your phone for more room', total: 'Total', chart: 'Chart',
    loading: 'Loading…', error: 'Could not load the data', retry: 'Tap to retry',
  },
  es: {
    reset: 'Restablecer zoom', fullscreen: 'Pantalla completa', exit: 'Cerrar', zoomIn: 'Acercar', zoomOut: 'Alejar', resetShort: 'Restablecer', tapHint: 'Toca el gráfico para ver los valores',
    download: 'Descargar', category: 'Categoría', date: 'Fecha', png: 'Imagen (PNG)', pdf: 'Documento PDF', xlsx: 'Excel (.xlsx)', csv: 'CSV',
    hintTouch: 'Pellizca para hacer zoom · Toca para ver los valores',
    hintMouse: 'Ctrl + rueda para zoom · Arrastra para inspeccionar',
    rotate: 'Gira el teléfono para ver más', total: 'Total', chart: 'Gráfico',
    loading: 'Cargando…', error: 'No se pudieron cargar los datos', retry: 'Toca para reintentar',
  },
};

const DEFAULTS = {
  type: 'line',            // line | area | bar | scatter | pie | donut
  title: '',
  subtitle: '',
  series: [],
  categories: null,
  height: 260,             // alto del área de dibujo en px (en fullscreen ocupa toda la pantalla)
  x: { type: 'auto', format: null, label: '' },   // auto | time | linear | category
  y: { min: null, max: null, zero: null, format: null, label: '' },
  smooth: true,
  stack: false,            // false | true (apiladas) | 'percent' (100 %). Cada serie puede usar `stack: 'grupo'` o `stack: false`
  legend: { show: 'auto', mode: 'multi' },        // mode: multi (varias a la vez) | single (una a la vez)
  zoom: true,              // true | false | { minPoints: 4 } (puntos visibles como mínimo al acercar)
  pan: true,
  navigator: 'auto',       // mini-mapa para navegar cuando hay zoom
  zoomControls: 'auto',    // botones − y + en la cabecera ('auto' = si hay zoom y no es pie/donut)
  rangeBar: 'auto',        // barra con el rango visible y "Restablecer" ('auto' = sólo con zoom)
  zoomRange: null,         // zoom controlado: { from, to } (números, fechas o textos de fecha)
  inspector: false,        // 'bottom' = panel de valores bajo el gráfico
  lite: false,             // modo ligero para pantallas con varios gráficos
  fullscreen: true,        // true | false | 'external' (emite 'fullscreenRequest' para que la app abra su propio modal)
  hover: true,             // con ratón, inspeccionar al pasar por encima
  animate: true,
  theme: 'auto',           // auto | light | dark
  lang: 'auto',            // auto | es | en
  locale: null,            // para fechas y números (por defecto, el del navegador)
  hint: true,
  tooltip: { format: null, template: null, header: null, footer: null, dateFormat: null, sticky: false, show: 'auto' },
  /* --- Exportar --- */
  export: {
    button: true,          // botón de descarga en la cabecera
    formats: ['png', 'pdf', 'xlsx'], // también 'csv'
    filename: null,        // por defecto, el título del gráfico
    scale: 3,              // resolución de la imagen (3 = nítida al imprimir)
    background: null,      // color de fondo de la imagen (por defecto, el del tema)
    pdf: { page: 'a4', margin: 28 }, // page: a4 | letter | fit (página del tamaño del gráfico)
    onExport: null,        // función(blob, nombre, formato): sustituye a la descarga (útil en WebView)
  },
  maxPixelRatio: 2,        // límite de resolución del lienzo: 2 se ve nítido y dibuja ~2,25× menos píxeles que 3

  /* --- Animación --- */
  animation: {
    enter: 'draw',         // draw | grow | wave | pop | fade | none
    duration: 750,         // ms de cada punto/serie
    easing: 'easeOutCubic',// linear | easeIn | easeOut | easeOutCubic | easeInOut | back | elastic | bounce | función(t)
    delay: 0,              // ms antes de empezar
    stagger: null,         // ms de escalonado entre el primer y el último punto (wave/pop). null = automático
    update: 450,           // ms de transición al cambiar datos (0 = sin transición)
    onVisible: true,       // espera a que el gráfico se vea en pantalla para animar la entrada
    replayOnView: false,   // repetir la entrada cada vez que el gráfico vuelve a verse
    chartStagger: 120,     // ms entre las entradas de varios gráficos que aparecen a la vez
  },
  loading: false,          // true para empezar en estado de carga
  loader: { type: 'skeleton', text: null }, // skeleton | pulse | wave | spinner | dots

  /* --- Estilo --- */
  colors: null,            // ['#hex', ...] colores de las series (tema claro)
  colorsDark: null,        // ídem para tema oscuro (si falta, se usa `colors`)
  style: {},               // { bg, fg, muted, grid, axis, chip, chipOn, tip, font, radius }
  styleDark: {},           // mismas claves para el tema oscuro
  line: { width: 2, curve: 'smooth', dash: null },        // curve: smooth | linear | step
  markers: { show: 'auto', size: 3.5, shape: 'circle' }, // show: auto | true | false · shape: circle | square | diamond
  area: { opacity: 0.28 },
  bar: { radius: 4, width: 0.7, padding: null },          // width: fracción del hueco disponible · padding: hueco libre (0..1), alternativa a width
  grid: { show: true, dashed: false },
  axis: { x: true, y: true },
  donut: { thickness: 0.38 },
};

const EASINGS = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  bounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};
const STYLE_VARS = { bg: 'bg', fg: 'fg', muted: 'muted', grid: 'grid', axis: 'axis', chip: 'chip', chipOn: 'chip-on', tip: 'tip', tooltip: 'tip', font: 'font', radius: 'radius' };

const TIME_STEPS = [
  1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5,
  864e5, 1728e5, 2592e5, 6048e5, 12096e5,
  'M1', 'M3', 'M6', 'Y1', 'Y2', 'Y5', 'Y10',
];

const CSS = `
.pc-root{--pc-bg:var(--pocket-bg,#ffffff);--pc-fg:var(--pocket-fg,#16181d);--pc-muted:var(--pocket-muted,#6b7280);
--pc-grid:var(--pocket-grid,rgba(22,24,29,.06));--pc-axis:var(--pocket-axis,rgba(22,24,29,.18));
--pc-chip:var(--pocket-chip,rgba(22,24,29,.05));--pc-chip-on:var(--pocket-chip-on,rgba(22,24,29,.07));--pc-tip:var(--pocket-tip,#ffffff);
--pc-line:var(--pocket-line,rgba(22,24,29,.08));
--pc-shadow:0 4px 18px rgba(16,18,24,.10),0 1px 2px rgba(16,18,24,.06);--pc-radius:var(--pocket-radius,0px);
--pc-font:var(--pocket-font,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
${PALETTE.light.map((c, i) => `--pc-c${i + 1}:var(--pocket-c${i + 1},${c});`).join('')}
position:relative;display:block;box-sizing:border-box;background:var(--pc-bg);color:var(--pc-fg);font-family:var(--pc-font);
font-size:14px;line-height:1.35;-webkit-tap-highlight-color:transparent;border-radius:var(--pc-radius);-webkit-font-smoothing:antialiased}
.pc-root[data-pc-theme=dark]{--pc-bg:var(--pocket-bg-dark,#15171b);--pc-fg:var(--pocket-fg-dark,#ecedef);--pc-muted:var(--pocket-muted-dark,#9aa0aa);
--pc-grid:var(--pocket-grid-dark,rgba(236,237,239,.07));--pc-axis:var(--pocket-axis-dark,rgba(236,237,239,.2));
--pc-chip:var(--pocket-chip-dark,rgba(236,237,239,.06));--pc-chip-on:var(--pocket-chip-on-dark,rgba(236,237,239,.1));--pc-tip:var(--pocket-tip-dark,#1f2227);
--pc-line:var(--pocket-line-dark,rgba(236,237,239,.1));
--pc-shadow:0 8px 24px rgba(0,0,0,.45),0 1px 2px rgba(0,0,0,.3);
${PALETTE.dark.map((c, i) => `--pc-c${i + 1}:var(--pocket-c${i + 1}-dark,${c});`).join('')}color-scheme:dark}
.pc-root *{box-sizing:border-box}
.pc-head{display:flex;align-items:center;gap:8px;padding:0 0 10px;position:relative}
.pc-menu{position:absolute;right:0;top:40px;z-index:5;min-width:170px;background:var(--pc-tip);color:var(--pc-fg);border:1px solid var(--pc-line);border-radius:12px;box-shadow:var(--pc-shadow);padding:5px;display:flex;flex-direction:column}
.pc-menu[hidden]{display:none}
.pc-menu button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;font-size:13.5px;text-align:left;padding:0 12px;height:40px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px}
.pc-menu button:hover,.pc-menu button:focus-visible{background:var(--pc-chip);outline:none}
.pc-menu small{color:var(--pc-muted);font-size:11.5px;letter-spacing:.02em}
.pc-titles{flex:1;min-width:0}
.pc-title{font-size:15px;font-weight:600;margin:0;letter-spacing:-.005em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-sub{font-size:12.5px;color:var(--pc-muted);margin:1px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-actions{display:flex;gap:2px;flex-shrink:0;margin-right:-6px}
.pc-btn{appearance:none;border:0;background:transparent;color:var(--pc-muted);height:34px;min-width:34px;padding:0 8px;border-radius:9px;
display:inline-flex;align-items:center;justify-content:center;gap:6px;font:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:background .15s,color .15s}
.pc-btn:hover,.pc-btn:active{background:var(--pc-chip);color:var(--pc-fg)}
.pc-btn:focus-visible,.pc-chip:focus-visible,.pc-plot:focus-visible{outline:2px solid var(--pc-c1);outline-offset:2px}
.pc-btn svg{width:17px;height:17px}
.pc-legend{display:flex;gap:4px;overflow-x:auto;scroll-snap-type:x proximity;padding:0 2px 10px;margin:0 -2px;scrollbar-width:none;
-webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 24px),transparent)}
.pc-legend::-webkit-scrollbar{display:none}
.pc-chip{appearance:none;border:0;flex:0 0 auto;scroll-snap-align:start;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px;
border-radius:8px;background:transparent;color:var(--pc-muted);font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;
user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;transition:background .15s,color .15s}
.pc-chip[aria-pressed=true]{color:var(--pc-fg)}
.pc-legend[data-single] .pc-chip[aria-pressed=true]{background:var(--pc-chip-on)}
.pc-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.pc-chip[aria-pressed=false] .pc-dot{background:transparent!important;box-shadow:inset 0 0 0 1.5px var(--pc-muted)}
.pc-chip[aria-pressed=false]{opacity:.75}
.pc-chip-val{font-variant-numeric:tabular-nums;color:var(--pc-fg);font-weight:600}
.pc-chip-val:empty{display:none}
.pc-plot{position:relative;contain:layout paint;touch-action:pan-y;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;outline:none;border-radius:6px}
.pc-plot canvas{display:block;width:100%;height:100%}
.pc-tip{position:absolute;left:0;top:0;pointer-events:none;background:var(--pc-tip);color:var(--pc-fg);border-radius:10px;box-shadow:var(--pc-shadow);
border:1px solid var(--pc-line);padding:7px 10px;font-size:12.5px;min-width:110px;max-width:min(240px,80%);opacity:0;transition:opacity .12s;z-index:3;
will-change:transform,opacity;contain:layout style}
.pc-tip.pc-on{opacity:1}
.pc-tip-h{font-weight:500;font-size:11.5px;color:var(--pc-muted);margin-bottom:3px;white-space:nowrap}
.pc-tip-r{display:flex;align-items:center;gap:7px;white-space:nowrap;padding:1px 0}
.pc-tip-n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--pc-muted)}
.pc-tip-t{border-top:1px solid var(--pc-grid);margin-top:3px;padding-top:4px}
.pc-tip-v{font-weight:600;font-variant-numeric:tabular-nums}
.pc-hint{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);background:var(--pc-fg);color:var(--pc-bg);font-size:11.5px;font-weight:500;
padding:5px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .4s;max-width:92%;overflow:hidden;text-overflow:ellipsis}
.pc-hint.pc-on{opacity:.85}
.pc-nav{position:relative;height:34px;margin-top:8px;touch-action:none;cursor:grab;border-radius:6px;overflow:hidden}
.pc-nav canvas{display:block;width:100%;height:100%}
.pc-range{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:var(--pc-muted);min-height:30px}
.pc-range[hidden]{display:none}
.pc-range-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.pc-range .pc-btn{height:30px;font-size:12.5px;color:var(--pc-fg);background:var(--pc-chip);padding:0 10px}
.pc-range .pc-btn svg{width:14px;height:14px}
.pc-insp{margin-top:8px;border-top:1px solid var(--pc-line);padding-top:8px;font-size:12.5px}
.pc-insp[hidden]{display:none}
.pc-insp-h{font-size:11.5px;font-weight:500;color:var(--pc-muted);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-insp-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:2px 12px}
.pc-insp .pc-tip-r{min-width:0}
.pc-rotate{display:none;text-align:center;font-size:12px;color:var(--pc-muted);padding:6px 0 0}
.pc-root.pc-fs{position:fixed;inset:0;z-index:2147483000;border-radius:0;display:flex;flex-direction:column;
padding:max(12px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}
.pc-root.pc-fs .pc-plot{flex:1;height:auto!important;min-height:0}
@media (orientation:portrait){.pc-root.pc-fs .pc-rotate{display:block}}
.pc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){.pc-tip,.pc-hint,.pc-chip,.pc-btn{transition:none}}
.pc-plot canvas,.pc-nav canvas{touch-action:inherit}
`;

const ICONS = {
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
};

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, extra) {
  const out = { ...base };
  for (const k in extra) {
    if (extra[k] === undefined) continue;
    out[k] = isObj(base[k]) && isObj(extra[k]) ? merge(base[k], extra[k]) : extra[k];
  }
  return out;
}
/* ------------------------------------------------------------------ */
/* Exportar: ZIP (para .xlsx) y PDF sin dependencias                   */
/* ------------------------------------------------------------------ */
const enc = (str) => new TextEncoder().encode(str);
let CRC_T;
function crc32(b) {
  if (!CRC_T) { CRC_T = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } }
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
/** ZIP sin compresión (suficiente para un .xlsx; Excel lo abre sin problema). */
function zipStore(files) {
  const parts = [], central = []; let off = 0;
  const u16 = (v) => [v & 255, (v >>> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  files.forEach(({ name, data }) => {
    const nm = enc(name), crc = crc32(data), sz = data.length;
    const common = [...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0)];
    const local = new Uint8Array([...u32(0x04034b50), ...common]);
    parts.push(local, nm, data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nm);
    off += local.length + nm.length + sz;
  });
  const csz = central.reduce((n, b) => n + b.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(csz), ...u32(off), ...u16(0)]);
  return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
const xmlEsc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
function colName(i) { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; }
/** Libro .xlsx con una hoja. `rows`: filas de celdas { v, t: 's' | 'n' | 'd' }. */
function buildXlsx(sheetName, rows, widths) {
  const sheet = rows.map((row, r) => `<row r="${r + 1}">${row.map((c, i) => {
    if (!c || c.v == null || c.v === '') return '';
    const ref = colName(i) + (r + 1);
    if (c.t === 'n' || c.t === 'd') return isFinite(c.v) ? `<c r="${ref}"${c.t === 'd' ? ' s="2"' : r === 0 ? ' s="1"' : ''}><v>${c.v}</v></c>` : '';
    return `<c r="${ref}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEsc(c.v)}</t></is></c>`;
  }).join('')}</row>`).join('');
  const cols = widths && widths.length ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const name = xmlEsc((sheetName || 'Datos').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Datos');
  return zipStore([
    { name: '[Content_Types].xml', data: enc(X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>') },
    { name: '_rels/.rels', data: enc(X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
    { name: 'xl/workbook.xml', data: enc(X + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc(X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>') },
    { name: 'xl/styles.xml', data: enc(X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>') },
    { name: 'xl/worksheets/sheet1.xml', data: enc(X + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${sheet}</sheetData></worksheet>`) },
  ]);
}
/** PDF de una página con una imagen JPEG. */
function buildPdf(jpeg, imgW, imgH, opt, title) {
  const PAGES = { a4: [595.28, 841.89], letter: [612, 792] };
  const m = opt.margin ?? 28;
  let pw, ph;
  if (opt.page === 'fit' || !PAGES[opt.page]) { pw = imgW + m * 2; ph = imgH + m * 2; }
  else { [pw, ph] = PAGES[opt.page]; if (opt.orientation === 'landscape' || (opt.orientation !== 'portrait' && imgW > imgH)) [pw, ph] = [ph, pw]; }
  const k = Math.min((pw - m * 2) / imgW, (ph - m * 2) / imgH, opt.page === 'fit' ? 1 : Infinity);
  const w = imgW * k, h = imgH * k, x = (pw - w) / 2, y = ph - m - h;
  const f = (n) => +n.toFixed(2);
  const hex = (str) => 'FEFF' + Array.from(String(str)).map((ch) => { const c = ch.codePointAt(0); const u = c > 0xffff ? String.fromCharCode(0xd800 + ((c - 0x10000) >> 10), 0xdc00 + ((c - 0x10000) & 0x3ff)) : ch; return Array.from(u).map((z) => z.charCodeAt(0).toString(16).padStart(4, '0')).join(''); }).join('');
  const content = `q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(y)} cm /Im0 Do Q`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(pw)} ${f(ph)}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    null, // imagen (binaria)
    `<< /Title <${hex(title || 'Chart')}> /Producer (PocketChart) >>`,
  ];
  const chunks = [], offs = []; let len = 0;
  const push = (b) => { const u = typeof b === 'string' ? enc(b) : b; chunks.push(u); len += u.length; };
  push(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 0xe2, 0xe3, 0xcf, 0xd3, 10])); // %PDF-1.4 + bytes binarios
  objs.forEach((o, i) => {
    offs.push(len);
    if (o) push(`${i + 1} 0 obj\n${o}\nendobj\n`);
    else { push(`${i + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${opt._pxW} /Height ${opt._pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`); push(jpeg); push('\nendstream\nendobj\n'); }
  });
  const xref = len;
  push(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: 'application/pdf' });
}
const canvasBlob = (c, type, q) => new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), type, q));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Alias del backend ---------- */
const TYPE_ALIAS = { column: 'bar', columns: 'bar', bars: 'bar', spline: 'line', areaspline: 'area', points: 'scatter' };
const CURVE_ALIAS = { smooth: 'smooth', monotone: 'smooth', spline: 'smooth', curved: 'smooth', linear: 'linear', straight: 'linear', step: 'step', stepline: 'step', stepped: 'step' };
const normType = (t) => (t && TYPE_ALIAS[t]) || t;
const normCurve = (c) => (c && CURVE_ALIAS[c]) || null;

/* ---------- Colores con nombre CSS (blue, red, grey…) → #rrggbb ---------- */
let COLOR_CTX = null;
const COLOR_CACHE = new Map();
function toHex(c) {
  if (typeof c !== 'string') return c;
  const k = c.trim();
  if (/^#[0-9a-f]{6}$/i.test(k)) return k;
  if (COLOR_CACHE.has(k)) return COLOR_CACHE.get(k);
  let out = k;
  try {
    if (!COLOR_CTX && typeof document !== 'undefined') COLOR_CTX = document.createElement('canvas').getContext('2d');
    if (COLOR_CTX) { COLOR_CTX.fillStyle = '#000000'; COLOR_CTX.fillStyle = k; out = COLOR_CTX.fillStyle; }
  } catch (e) { /* sin canvas: se deja tal cual */ }
  COLOR_CACHE.set(k, out);
  return out;
}

/* ---------- Formato numérico declarativo (sin funciones: funciona con Hermes) ----------
 * format: 'compact' | 'integer' | 'number' | 'decimal' | 'decimal1' | 'decimal2' | 'percent' | 'currency'
 * más decimals, prefix, suffix, locale, currency. También `dataType: 'number' | 'decimal1' | 'decimal2'`. */
const NUM_STYLES = ['compact', 'integer', 'number', 'decimal', 'decimal1', 'decimal2', 'percent', 'currency'];
const DATA_TYPES = { number: 0, integer: 0, decimal1: 1, decimal2: 2 };
function numSpec(o) {
  if (!o || typeof o !== 'object') return null;
  const f = o.format;
  if (isObj(f)) return { ...f, style: f.style || f.type || 'decimal' };
  const str = typeof f === 'string' && NUM_STYLES.includes(f) ? f : null;
  const dt = o.dataType ?? o.round;
  if (!str && dt == null && o.decimals == null && o.prefix == null && o.suffix == null && o.currency == null) return null;
  return { style: str || (dt != null ? 'decimal' : 'auto'), decimals: o.decimals ?? (dt != null ? DATA_TYPES[dt] : undefined), prefix: o.prefix, suffix: o.suffix, locale: o.locale, currency: o.currency };
}
const NF_CACHE = new Map();
function numFormatter(spec, locale) {
  const key = JSON.stringify(spec) + '|' + locale;
  let f = NF_CACHE.get(key);
  if (f) return f;
  const st = spec.style, loc = spec.locale || locale || undefined, pre = spec.prefix || '', suf = spec.suffix || '';
  const nf = (o) => { try { return new Intl.NumberFormat(loc, o); } catch (e) { return new Intl.NumberFormat(undefined, o); } };
  if (st === 'currency') {
    const d = spec.decimals ?? 2, n = nf({ style: 'currency', currency: spec.currency || 'USD', minimumFractionDigits: d, maximumFractionDigits: d });
    f = (v) => pre + n.format(v) + suf;
  } else if (st === 'compact') {
    const n = nf({ maximumFractionDigits: spec.decimals ?? 1 });
    f = (v) => {
      const a = Math.abs(v);
      const [k, u] = a >= 1e12 ? [1e12, 'T'] : a >= 1e9 ? [1e9, 'B'] : a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'k'] : [1, ''];
      return pre + n.format(v / k) + u + suf;
    };
  } else if (st === 'auto') {
    const ns = [0, 1, 2].map((d) => nf({ maximumFractionDigits: d }));
    f = (v) => { const a = Math.abs(v); return pre + (a >= 100 ? ns[0] : a >= 10 ? ns[1] : ns[2]).format(v) + suf; };
  } else {
    const fixed = st === 'decimal' || st === 'decimal1' || st === 'decimal2';
    const d = spec.decimals ?? (st === 'decimal1' ? 1 : st === 'decimal2' ? 2 : st === 'decimal' ? 2 : 0);
    const n = nf({ minimumFractionDigits: fixed ? d : 0, maximumFractionDigits: d });
    f = st === 'percent' ? (v) => pre + n.format(v) + '%' + suf : (v) => pre + n.format(v) + suf;
  }
  NF_CACHE.set(key, f);
  return f;
}

/* ---------- Fechas con plantilla: 'MM/dd HH:mm', 'hh:mm a, MM/dd/yy', 'dd MMM yyyy'… ---------- */
const DATE_TOKENS = /'[^']*'|yyyy|yy|MMMM|MMM|MM|M|dd|d|EEEE|EEE|HH|H|hh|h|mm|m|ss|s|SSS|a/g;
const MONTH_NAMES = new Map();
function monthName(m, long, locale) {
  const k = (locale || '') + (long ? 'L' : 'S');
  let arr = MONTH_NAMES.get(k);
  if (!arr) {
    let df; try { df = new Intl.DateTimeFormat(locale, { month: long ? 'long' : 'short' }); } catch (e) { df = new Intl.DateTimeFormat(undefined, { month: long ? 'long' : 'short' }); }
    arr = Array.from({ length: 12 }, (_, i) => df.format(new Date(2026, i, 15)).replace('.', ''));
    MONTH_NAMES.set(k, arr);
  }
  return arr[m];
}
function dayName(d, long, locale) {
  try { return new Intl.DateTimeFormat(locale, { weekday: long ? 'long' : 'short' }).format(d).replace('.', ''); } catch (e) { return ''; }
}
const p2 = (n) => (n < 10 ? '0' : '') + n;
function fmtDate(t, pat, locale) {
  const d = new Date(t);
  if (isNaN(d)) return '';
  return pat.replace(DATE_TOKENS, (k) => {
    switch (k) {
      case 'yyyy': return String(d.getFullYear());
      case 'yy': return p2(d.getFullYear() % 100);
      case 'MMMM': return monthName(d.getMonth(), true, locale);
      case 'MMM': return monthName(d.getMonth(), false, locale);
      case 'MM': return p2(d.getMonth() + 1);
      case 'M': return String(d.getMonth() + 1);
      case 'dd': return p2(d.getDate());
      case 'd': return String(d.getDate());
      case 'EEEE': return dayName(d, true, locale);
      case 'EEE': return dayName(d, false, locale);
      case 'HH': return p2(d.getHours());
      case 'H': return String(d.getHours());
      case 'hh': return p2(d.getHours() % 12 || 12);
      case 'h': return String(d.getHours() % 12 || 12);
      case 'mm': return p2(d.getMinutes());
      case 'm': return String(d.getMinutes());
      case 'ss': return p2(d.getSeconds());
      case 's': return String(d.getSeconds());
      case 'SSS': return String(d.getMilliseconds()).padStart(3, '0');
      case 'a': return d.getHours() < 12 ? 'AM' : 'PM';
      default: return k.slice(1, -1); // texto literal entre comillas simples
    }
  });
}
/** Resolución de una plantilla de fecha: el paso más fino que distingue (ms). */
function dateRes(pat) {
  const p = pat.replace(/'[^']*'/g, '');
  if (/s/.test(p)) return 1e3;
  if (/m/.test(p)) return 6e4;
  if (/[Hh]/.test(p)) return 36e5;
  if (/[dE]/.test(p)) return 864e5;
  if (/M/.test(p)) return 28 * 864e5;
  return 365 * 864e5;
}
/** Convierte from/to de un rango (número, Date o texto de fecha) a número. */
const toNum = (v) => (v instanceof Date ? v.getTime() : typeof v === 'string' ? (isNaN(+v) ? Date.parse(v) : +v) : +v);
/** Entrada escalonada de varios gráficos que aparecen a la vez. */
let ENTER_LAST = -Infinity;

function niceStep(span, count) {
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n >= 7.5 ? 10 : n >= 3.5 ? 5 : n >= 1.5 ? 2 : 1) * mag;
}
function lowerBound(pts, x) { // primer índice con pts[i].x >= x
  let lo = 0, hi = pts.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].x < x) lo = m + 1; else hi = m; }
  return lo;
}
function nearestIndex(pts, x) {
  if (!pts.length) return -1;
  const i = lowerBound(pts, x);
  if (i <= 0) return 0;
  if (i >= pts.length) return pts.length - 1;
  return x - pts[i - 1].x <= pts[i].x - x ? i - 1 : i;
}

/** Curva monótona (sin "sobrepasos" falsos como en la captura original). */
function monotonePath(ctx, p, moveFirst = true) {
  const n = p.length;
  if (!n) return;
  if (moveFirst) ctx.moveTo(p[0][0], p[0][1]); else ctx.lineTo(p[0][0], p[0][1]);
  if (n < 3) { for (let i = 1; i < n; i++) ctx.lineTo(p[i][0], p[i][1]); return; }
  const dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0] || 1e-6; m[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else t[i] = 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    ctx.bezierCurveTo(p[i][0] + h, p[i][1] + t[i] * h, p[i + 1][0] - h, p[i + 1][1] - t[i + 1] * h, p[i + 1][0], p[i + 1][1]);
  }
}

/* ------------------------------------------------------------------ */
/* Clase principal                                                     */
/* ------------------------------------------------------------------ */

const styledRoots = new WeakSet();
function injectStyles(node) {
  const root = node.getRootNode ? node.getRootNode() : document;
  const target = root === document || !root.host ? document.head : root;
  const key = target === document.head ? document : root;
  if (styledRoots.has(key)) return;
  const st = document.createElement('style');
  st.setAttribute('data-pocketchart', '');
  st.textContent = CSS;
  target.appendChild(st);
  styledRoots.add(key);
}

export class PocketChart {
  constructor(el, options = {}) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) throw new Error('PocketChart: contenedor no encontrado');
    this.el = el;
    this.opts = merge(DEFAULTS, options);
    this._handlers = {};
    this._hidden = new Set();
    this._ptrs = new Map();
    this._g = null;          // estado del gesto actual
    this._inspect = null;
    this._yCur = null;
    this._enter = null;      // animación de entrada en curso { t0 }
    this._enterPending = true;
    this._morph = null;      // transición entre datos { t0, dur }
    this._loading = this.opts.loading ? { t0: performance.now(), ...this.opts.loader, ...(isObj(this.opts.loading) ? this.opts.loading : {}) } : null;
    this._raf = 0;
    injectStyles(el);
    this._build();
    this._ingest();
    if (this.opts.zoomRange) this._applyZoomRange(this.opts.zoomRange);
    this._resolveTheme();
    this._bind();
    this._resize();
  }

  /* ---------- API pública ---------- */
  on(evt, fn) { (this._handlers[evt] ||= []).push(fn); return this; }
  off(evt, fn) { this._handlers[evt] = (this._handlers[evt] || []).filter((f) => f !== fn); return this; }
  _emit(evt, data) { (this._handlers[evt] || []).forEach((f) => f(data)); this.root.dispatchEvent(new CustomEvent('pocket:' + evt, { detail: data, bubbles: true, composed: true })); }

  update(options = {}, uo = {}) {
    if ('keepView' in options) { uo = { ...uo, keepView: options.keepView }; options = { ...options }; delete options.keepView; }
    const keepView = uo.keepView ?? (!options.series && !options.type);
    const prev = options.series && !this._loading ? this._snapshot() : null;
    const wasLoading = !!this._loading;
    const selX = this._inspect && !this._isPie ? this._inspect.x : null;
    this.opts = merge(this.opts, options);
    const view = this._view, zeLast = this._zeLast;
    this._ingest();
    if (keepView && view) { this._view = this._clampView(view); this._zeLast = zeLast; } // datos nuevos sin saltos ni perder el zoom
    if (options.zoomRange) this._applyZoomRange(options.zoomRange);
    if (selX != null && keepView && this.opts.tooltip.sticky) this._pendingSel = selX; // la selección fija sobrevive a los datos nuevos
    if (options.series) {
      this._error = null;
      if (wasLoading && !options.loading) { this._loading = null; this.root.removeAttribute('aria-busy'); this._enterPending = true; }
      else if (prev) this._startMorph(prev);
    } else if (options.animation && options.animation.enter && !wasLoading) this.replay();
    if ('loading' in options) {
      if (options.loading && !this._loading) this.setLoading(true, isObj(options.loading) ? options.loading : {});
      else if (!options.loading && this._loading) this.setLoading(false);
    }
    this._renderHeader();
    this._renderLegend();
    this._resolveTheme();
    this._resize();
    return this;
  }
  /** `uo.keepView: true` conserva el zoom (y la selección fija) al llegar datos nuevos. */
  setData(series, uo = {}) { return this.update({ series }, uo); }
  _applyZoomRange(z) {
    const a = toNum(z.from ?? z[0]), b = toNum(z.to ?? z[1]);
    if (!isFinite(a) || !isFinite(b)) return;
    this._view = this._clampView([Math.min(a, b), Math.max(a, b)]);
    this._zeLast = this._view.slice(); // zoom controlado: no se notifica de vuelta
    this._renderHeader(); this._layoutNav(); this.invalidate();
  }

  /** Muestra (o quita) el estado de carga. `opts`: { type, text }. */
  setLoading(on = true, opts = {}) {
    if (on) {
      this._loading = { t0: performance.now(), ...this.opts.loader, ...opts };
      this._error = null; this._enter = null; this._enterPending = true;
      this.$tip.classList.remove('pc-on'); this._inspect = null;
      this.root.setAttribute('aria-busy', 'true');
      this._loop();
    } else if (this._loading) {
      this._loading = null;
      this.root.removeAttribute('aria-busy');
      this._startEnter();
    }
    return this;
  }

  /**
   * Carga datos asíncronos con su animación de carga y de entrada.
   * `src`: promesa o función que devuelve una promesa con `series` o con un objeto de opciones.
   */
  async load(src, loaderOpts) {
    this._lastSrc = src;
    this.setLoading(true, loaderOpts);
    try {
      const res = await (typeof src === 'function' ? src() : src);
      const opts = Array.isArray(res) ? { series: res } : res;
      this.update(opts);
      if (this._loading) this.setLoading(false);
      return this;
    } catch (err) {
      this._loading = null;
      this.root.removeAttribute('aria-busy');
      this._error = { message: (err && err.message) || String(err) };
      this._emit('error', err);
      this.invalidate();
      throw err;
    }
  }

  /** Repite la animación de entrada (útil para previsualizar estilos). */
  replay() { this._enterPending = true; this._startEnter(true); return this; }

  _ease(name) { return typeof name === 'function' ? name : EASINGS[name] || EASINGS.easeOutCubic; }
  get _anim() { return this.opts.animation || {}; }
  get _animOn() { return this.opts.animate !== false && this.opts.animation !== false && !reduceMotion(); }

  _startEnter(force) {
    if (!this._enterPending && !force) return;
    if (this._loading || !this.$canvas._w) return;
    if (this._anim.onVisible !== false && !this._visible && !force) return; // se lanzará al entrar en pantalla
    this._enterPending = false;
    const a = this._anim;
    if (!this._animOn || a.enter === 'none' || this.opts.lite) { this._enter = null; this._emit('ready'); this._showHint(); this.invalidate(); return; }
    // Varios gráficos que aparecen a la vez entran uno detrás de otro (más fluido y se lee mejor).
    const now = performance.now(), gap = a.chartStagger ?? 120;
    const t0 = force || !gap ? now : Math.max(now, ENTER_LAST + gap);
    if (!force) ENTER_LAST = t0;
    this._enter = { t0 };
    this._loop();
  }

  /** Duración total de la entrada, incluido el retraso y el escalonado. */
  _enterTotal() { const a = this._anim; return (a.delay || 0) + (a.duration ?? 750) + this._stagger(); }
  _stagger() {
    const a = this._anim, d = a.duration ?? 750;
    if (a.enter !== 'wave' && a.enter !== 'pop') return 0;
    return a.stagger ?? d * (a.enter === 'wave' ? 0.9 : 0.6);
  }
  /** Progreso suavizado (0..1) de la entrada para la posición relativa `f` (0 = izquierda, 1 = derecha). */
  _p(f = 0) {
    if (!this._enter) return 1;
    const a = this._anim, d = a.duration ?? 750;
    let ease = a.easing;
    if (a.enter === 'pop' && (ease == null || ease === DEFAULTS.animation.easing)) ease = 'back';
    const t = (this._now - this._enter.t0 - (a.delay || 0) - this._stagger() * clamp(f, 0, 1)) / d;
    return t <= 0 ? 0 : t >= 1 ? 1 : this._ease(ease)(t);
  }

  _snapshot() {
    const m = new Map();
    (this._series || []).forEach((s) => { const xs = new Map(); s.points.forEach((q) => xs.set(q.x, this._v(q))); m.set(s.key, { xs, pts: s.points.map((q) => this._v(q)) }); });
    if (this._pie) m.set('__pie', this._pie.map((p) => this._pv(p)));
    return m;
  }

  _startMorph(prev) {
    const dur = this._anim.update ?? 450;
    if (!this._animOn || !dur) return;
    this._series.forEach((s) => {
      const old = prev.get(s.key);
      s.points.forEach((q, i) => {
        if (!old) { q.y0 = null; return; }
        q.y0 = old.xs.has(q.x) ? old.xs.get(q.x) : old.pts.length === s.points.length ? old.pts[i] : null;
      });
    });
    const op = prev.get('__pie');
    if (op && this._pie) this._pie.forEach((p, i) => { p.v0 = op[i] ?? 0; });
    this._morph = { t0: performance.now(), dur };
    this._enter = null;
    this._loop();
  }

  /** Valor animado de un punto (transición entre datos). */
  _v(q) {
    if (q.y == null || !this._morph || q.y0 === undefined) return q.y;
    const k = this._morphK ?? 1, from = q.y0 == null ? this._baseVal ?? 0 : q.y0;
    return from + (q.y - from) * k;
  }
  _pv(p) {
    if (!this._morph || p.v0 === undefined) return p.value;
    const k = this._morphK ?? 1; return p.v0 + (p.value - p.v0) * k;
  }

  /** Bucle de animación mientras haya carga, entrada o transición en curso. */
  _loop() { this.invalidate(); }
  resetZoom(source) { this.zoomTo(this._full[0], this._full[1], true, typeof source === 'string' ? source : 'reset'); return this; }
  /** Acerca (k < 1) o aleja (k > 1) alrededor del centro de la vista. */
  zoomBy(k, source = 'api') {
    const [a, b] = this._view, c = (a + b) / 2, h = (b - a) * k / 2;
    this.zoomTo(c - h, c + h, true, source); return this;
  }
  /** Rango visible actual: { from, to, zoomed }. */
  getZoom() { return { from: this._view[0], to: this._view[1], zoomed: !!this.isZoomed }; }
  /** `a` y `b` aceptan números, fechas o textos de fecha. */
  zoomTo(a, b, animate = true, source = 'api') {
    a = toNum(a); b = toNum(b);
    if (!isFinite(a) || !isFinite(b)) return this;
    const target = this._clampView([Math.min(a, b), Math.max(a, b)]);
    cancelAnimationFrame(this._zoomRaf);
    if (!animate || reduceMotion()) { this._setView(target); this._zoomEnd(source); return this; }
    const from = this._view.slice(), t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 260), e = 1 - Math.pow(1 - k, 3);
      this._setView([from[0] + (target[0] - from[0]) * e, from[1] + (target[1] - from[1]) * e]);
      if (k < 1) this._zoomRaf = requestAnimationFrame(step); else this._zoomEnd(source);
    };
    this._zoomRaf = requestAnimationFrame(step);
    return this;
  }
  /** Un solo evento 'zoomEnd' al terminar cada gesto o animación (para pedir datos al backend). */
  _zoomEnd(source) {
    const v = this._view, l = this._zeLast, eps = (this._full[1] - this._full[0]) * 1e-9;
    if (l && Math.abs(l[0] - v[0]) <= eps && Math.abs(l[1] - v[1]) <= eps) return;
    this._zeLast = v.slice();
    this._emit('zoomEnd', { from: v[0], to: v[1], zoomed: !!this.isZoomed, source });
  }
  /** Quita la selección (tooltip fijo y panel de valores). */
  clearInspect() { this._clearInspect(); return this; }
  /** Selecciona el punto más cercano a `x` (número, fecha o índice de categoría), como si se tocara. */
  select(x) {
    x = toNum(x);
    if (!this._plotRect || this._enterPending) { this._pendingSel = x; return this; }
    if (x < this._view[0] || x > this._view[1]) { const h = (this._view[1] - this._view[0]) / 2; this._setView([x - h, x + h]); }
    const hit = this._hitAtX(x);
    if (hit) this._applyInspect(hit, this._plotRect.y + 10, false);
    return this;
  }
  setSeriesVisible(key, visible) {
    const was = new Set(this._hidden);
    if (visible) this._hidden.delete(key); else this._hidden.add(key);
    this._restack(was);
    this._renderLegend(); this._clearInspect(); this.invalidate();
  }
  toggleFullscreen(force) {
    const on = force ?? !this.root.classList.contains('pc-fs');
    const native = this.root.requestFullscreen || this.root.webkitRequestFullscreen;
    if (on) {
      if (native && !this._fsFallback) {
        Promise.resolve(native.call(this.root, { navigationUI: 'hide' }))
          .then(() => { try { screen.orientation?.lock?.('landscape')?.catch(() => {}); } catch (e) {} })
          .catch(() => this._setFallbackFs(true));
      } else this._setFallbackFs(true);
    } else {
      if (document.fullscreenElement === this.root) document.exitFullscreen?.();
      else if (document.webkitFullscreenElement === this.root) document.webkitExitFullscreen?.();
      this._setFallbackFs(false);
    }
  }
  /** Pide un redibujado. Varias llamadas en el mismo fotograma se agrupan en una sola. */
  invalidate() { this._dirty = true; this._kick(); }
  _kick() { if (!this._raf && !this._destroyed) this._raf = requestAnimationFrame(() => this._frame()); }
  _frame() {
    this._raf = 0;
    if (this._destroyed) return;
    const now = performance.now();
    let busy = !!this._loading;
    if (this._enter) {
      if (now - this._enter.t0 > this._enterTotal()) { this._enter = null; this._emit('ready'); this._showHint(); } else busy = true;
    }
    if (this._morph) {
      if (now - this._morph.t0 > this._morph.dur) { this._morph = null; this._series.forEach((s) => s.points.forEach((q) => delete q.y0)); this._pie?.forEach((p) => delete p.v0); this._emit('updated'); } else busy = true;
    }
    this._dirty = false;
    this._render();
    if (this._zoomEvt) { this._zoomEvt = false; this._emit('zoom', { from: this._view[0], to: this._view[1], zoomed: this.isZoomed }); }
    if (busy || this._dirty) this._kick();
  }
  destroy() {
    this._ro?.disconnect(); this._io?.disconnect(); this._mo?.disconnect(); this._mq?.removeEventListener?.('change', this._onTheme);
    document.removeEventListener('fullscreenchange', this._onFsChange);
    document.removeEventListener('webkitfullscreenchange', this._onFsChange);
    document.removeEventListener('keydown', this._onKeyFs);
    if (this._menuAway) document.removeEventListener('pointerdown', this._menuAway, true);
    cancelAnimationFrame(this._raf); cancelAnimationFrame(this._zoomRaf); this._destroyed = true; cancelAnimationFrame(this._yRaf);
    this.root.remove();
  }
  /* ---------- Exportar ---------- */
  get _exportOpts() {
    const E = this.opts.export;
    if (E === false || E == null) return null;
    const d = DEFAULTS.export, e = isObj(E) ? E : {};
    return { ...d, ...e, formats: (e.formats || d.formats).filter((f) => ['png', 'pdf', 'xlsx', 'csv'].includes(f)), pdf: { ...d.pdf, ...(e.pdf || {}) } };
  }

  _toggleMenu(force) {
    let m = this.root.querySelector('.pc-menu');
    const open = force ?? (!m || m.hidden);
    if (!open) { if (m) m.hidden = true; document.removeEventListener('pointerdown', this._menuAway, true); return; }
    const EX = this._exportOpts; if (!EX) return;
    if (!m) {
      m = document.createElement('div'); m.className = 'pc-menu'; m.setAttribute('role', 'menu');
      this.root.querySelector('.pc-head').appendChild(m);
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-fmt]'); if (!b) return;
        this._toggleMenu(false);
        this.export(b.dataset.fmt).catch((err) => this._emit('error', err));
      });
      m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { this._toggleMenu(false); this.$actions.querySelector('[data-act=dl]')?.focus(); } });
      this._menuAway = (e) => { if (!e.composedPath().some((n) => n === m || (n.dataset && n.dataset.act === 'dl'))) this._toggleMenu(false); };
    }
    m.innerHTML = EX.formats.map((f) => `<button role="menuitem" data-fmt="${f}">${esc(this.t[f])}<small>${f.toUpperCase()}</small></button>`).join('');
    m.hidden = false;
    m.querySelector('button')?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', this._menuAway, true);
  }

  _fileName(ext) {
    const EX = this._exportOpts || DEFAULTS.export;
    const base = (EX.filename || this.opts.title || 'grafico').toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'grafico';
    return `${base}.${ext}`;
  }

  /** Dibuja el gráfico en su estado final (sin tooltip ni animación) en otro lienzo. */
  _snapshotCanvas(scale, w, h) {
    const c = this.$canvas, W0 = c._w, H0 = c._h, W = w || W0, H = h || H0;
    const off = document.createElement('canvas');
    off.width = Math.round(W * scale); off.height = Math.round(H * scale);
    const ctx = off.getContext('2d'); ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const keep = { ctx: this.ctx, _inspect: this._inspect, _enter: this._enter, _enterPending: this._enterPending, _morph: this._morph, _yCur: this._yCur, _morphK: this._morphK, _padCur: this._padCur, _lastT: this._lastT };
    const axCur = (this._axisList || []).map((a) => a.cur);
    (this._axisList || []).forEach((a) => (a.cur = null));
    try {
      Object.assign(this, { ctx, _inspect: null, _enter: null, _enterPending: false, _morph: null, _yCur: null, _padCur: null });
      c._w = W; c._h = H; this._catW = null; // tamaño propio (p. ej. ancho de una hoja de PDF)
      this._render();
    } finally { c._w = W0; c._h = H0; this._catW = null; (this._axisList || []).forEach((a, i) => (a.cur = axCur[i])); Object.assign(this, keep); this.invalidate(); }
    return off;
  }

  /** Imagen completa: título, subtítulo, leyenda y gráfico. */
  _composeImage(scale, io = {}) {
    const EX = this._exportOpts || DEFAULTS.export, C = this._colors, o = io.header === false ? { ...this.opts, title: '', subtitle: '' } : this.opts;
    scale = scale || EX.scale || 3;
    const pad = io.padding ?? 16, font = C.font;
    // Ancho total pedido → ancho del área de dibujo. El alto es el del gráfico (o `plotHeight`).
    const W = io.width ? Math.max(120, io.width - pad * 2) : this.$canvas._w;
    const mc = document.createElement('canvas').getContext('2d');
    // Leyenda: elementos visibles, en varias líneas si hace falta
    const items = this._legendItems().filter((it) => !this._hidden.has(it.key));
    const showLegend = io.legend !== false && items.length > 1 && o.legend.show !== false;
    mc.font = `500 12.5px ${font}`;
    const lines = []; let line = [], lw = 0;
    if (showLegend) items.forEach((it) => {
      const w = 14 + mc.measureText(it.name).width + 16;
      if (line.length && lw + w > W) { lines.push(line); line = []; lw = 0; }
      line.push({ ...it, w }); lw += w;
    });
    if (line.length) lines.push(line);
    let y = pad;
    const titleH = o.title ? 22 : 0, subH = o.subtitle ? 18 : 0;
    const head = titleH + subH + (titleH || subH ? 10 : 0);
    const legH = lines.length * 22 + (lines.length ? 8 : 0);
    const TW = W + pad * 2;
    // Alto total fijo (`height`) o relación de aspecto fija (`aspectRatio` = ancho / alto) para el PDF de la app.
    const fixedH = io.height || (io.aspectRatio ? TW / io.aspectRatio : 0);
    const H = fixedH ? Math.max(80, fixedH - pad * 2 - head - legH) : io.plotHeight || this.$canvas._h;
    const TH = fixedH ? Math.max(fixedH, pad * 2 + head + legH + 80) : pad + head + legH + H + pad;
    // `view: 'full'` = todo el rango de datos aunque haya zoom; 'current' (por defecto) = lo que se ve.
    const keepView = this._view;
    if (io.view === 'full') this._view = this._full.slice();
    let plot;
    try { plot = this._snapshotCanvas(scale, W, H); } finally { this._view = keepView; }
    const out = document.createElement('canvas');
    out.width = Math.round(TW * scale); out.height = Math.round(TH * scale);
    const ctx = out.getContext('2d'); ctx.scale(scale, scale);
    const bg = io.background !== undefined ? io.background : EX.background || C.bg || '#fff';
    if (bg && bg !== 'transparent') { ctx.fillStyle = bg; ctx.fillRect(0, 0, TW, TH); }
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    if (o.title) { ctx.fillStyle = C.fg; ctx.font = `600 16px ${font}`; ctx.fillText(o.title, pad, y); y += titleH; }
    if (o.subtitle) { ctx.fillStyle = C.muted; ctx.font = `13px ${font}`; ctx.fillText(o.subtitle, pad, y); y += subH; }
    if (head) y += 10;
    ctx.font = `500 12.5px ${font}`; ctx.textBaseline = 'middle';
    lines.forEach((ln) => {
      let x = pad;
      ln.forEach((it) => {
        ctx.fillStyle = it.color; ctx.beginPath(); ctx.arc(x + 4, y + 9, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.fg; ctx.fillText(it.name, x + 14, y + 9.5); x += it.w;
      });
      y += 22;
    });
    if (lines.length) y += 8;
    ctx.drawImage(plot, pad, y, W, H);
    return out;
  }

  /** Tabla de datos (la misma que se exporta a Excel y CSV). */
  _dataRows(opt = {}) {
    if (this._isPie) {
      const s = this._series[0];
      return [[{ v: this.t.category, t: 's' }, { v: s?.name || this.t.total, t: 's' }], ...this._pie.map((p) => [{ v: p.label, t: 's' }, { v: p.value, t: 'n' }])];
    }
    // range: 'all' (por defecto) | 'visible' (sólo el rango con zoom) · series: 'all' | 'visible'
    const sers = opt.series === 'visible' ? this._visibleSeries() : this._series;
    const [v0, v1] = opt.range === 'visible' ? this._view : [-Infinity, Infinity];
    const xs = new Map();
    sers.forEach((s) => s.points.forEach((q) => { if (q.x >= v0 && q.x <= v1) xs.set(q.x, true); }));
    const keys = [...xs.keys()].sort((a, b) => a - b);
    const look = sers.map((s) => { const m = new Map(); s.points.forEach((q) => m.set(q.x, q.v)); return m; });
    const xCell = (x) => this._xType === 'time' ? { v: 25569 + (x - new Date(x).getTimezoneOffset() * 6e4) / 864e5, t: 'd', raw: x }
      : this._xType === 'category' ? { v: this._cats[x] ?? String(x), t: 's' } : { v: x, t: 'n' };
    const head = [{ v: this.opts.x.label || (this._xType === 'time' ? this.t.date : this._xType === 'category' ? this.t.category : 'X'), t: 's' },
      ...sers.map((s) => ({ v: s.unit ? `${s.name} (${s.unit})` : s.name, t: 's' }))];
    return [head, ...keys.map((x, i) => [xCell(x), ...look.map((m) => ({ v: m.get(x), t: 'n' }))])];
  }

  /**
   * Imagen del gráfico para insertarla en tu propio documento (PDF de la app, correo, informe).
   * No descarga nada. `opts`: { format: 'png'|'jpeg', scale, width, plotHeight, header, legend, padding, background, quality }.
   * Devuelve { dataUrl, base64, blob, width, height, mime } (ancho y alto en px CSS, sin multiplicar por `scale`).
   */
  async toImage(opts = {}) {
    const EX = this._exportOpts || DEFAULTS.export, scale = opts.scale || EX.scale || 3;
    const jpeg = opts.format === 'jpeg' || opts.format === 'jpg', mime = jpeg ? 'image/jpeg' : 'image/png';
    const img = this._composeImage(scale, jpeg && opts.background === 'transparent' ? { ...opts, background: undefined } : opts);
    const dataUrl = img.toDataURL(mime, opts.quality ?? 0.92);
    const blob = await canvasBlob(img, mime, opts.quality ?? 0.92);
    return { dataUrl, base64: dataUrl.slice(dataUrl.indexOf(',') + 1), blob, mime, width: img.width / scale, height: img.height / scale };
  }

  /**
   * Los datos del gráfico como tabla, para las tablas de tu PDF o informe.
   * Devuelve { columns, rows, formatted }: `rows` con valores reales (fechas como Date),
   * `formatted` con los mismos datos ya formateados como texto (como en el tooltip).
   */
  toData(opt = {}) {
    const t = this._dataRows(opt), head = t[0];
    const valueOf = (c) => (c == null || c.v == null ? null : c.t === 'd' ? new Date(c.raw) : c.v);
    const sers = this._isPie ? [this._series[0]] : opt.series === 'visible' ? this._visibleSeries() : this._series;
    const rows = t.slice(1).map((r) => r.map(valueOf));
    const formatted = t.slice(1).map((r) => r.map((c, i) => {
      if (i === 0) return c.t === 'd' ? this._fmtXFull(c.raw) : c.t === 'n' ? this._nf(4).format(c.v) : String(c.v ?? '');
      return c.v == null ? '' : this._fmtY(c.v, sers[i - 1] && { ...sers[i - 1], unit: '' }); // la unidad ya va en la columna
    }));
    return { columns: head.map((c) => String(c.v)), rows, formatted };
  }

  /**
   * Genera el archivo y lo descarga (o se lo pasa a `export.onExport`).
   * `format`: 'png' | 'pdf' | 'xlsx' | 'csv'. Devuelve una promesa con { blob, filename, format }.
   */
  async export(format = 'png', opts = {}) {
    const EX = { ...(this._exportOpts || DEFAULTS.export), ...opts };
    const blob = await this.toBlob(format, EX);
    const filename = opts.filename ? String(opts.filename) : this._fileName(format);
    const res = { blob, filename, format };
    if (opts.download === false) return res;
    if (typeof EX.onExport === 'function') await EX.onExport(blob, filename, format);
    else {
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    this._emit('export', { format, filename, size: blob.size });
    return res;
  }

  /** Sólo genera el archivo, sin descargarlo. */
  async toBlob(format = 'png', opts = {}) {
    const EX = { ...(this._exportOpts || DEFAULTS.export), ...opts };
    if (format === 'png') return canvasBlob(this._composeImage(EX.scale), 'image/png');
    if (format === 'pdf') {
      const img = this._composeImage(EX.scale || 3);
      const jpeg = new Uint8Array(await (await canvasBlob(img, 'image/jpeg', 0.95)).arrayBuffer());
      const s = EX.scale || 3;
      return buildPdf(jpeg, img.width / s, img.height / s, { ...DEFAULTS.export.pdf, ...(EX.pdf || {}), _pxW: img.width, _pxH: img.height }, this.opts.title);
    }
    const rows = this._dataRows(EX);
    if (format === 'xlsx') {
      const widths = rows[0].map((_, i) => clamp(Math.max(...rows.slice(0, 200).map((r) => (r[i] && r[i].t === 'd' ? 17 : String(r[i]?.v ?? '').length + 2))), 8, 40));
      return buildXlsx(this.opts.title || this.t.chart, rows, widths);
    }
    if (format === 'csv') {
      const cell = (c) => { if (!c || c.v == null) return ''; const v = c.t === 'd' ? new Date(c.raw).toISOString() : String(c.v); return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
      return new Blob(['﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    }
    throw new Error(`Formato no soportado: ${format}`);
  }

  get isZoomed() { return this._view && (this._view[0] > this._full[0] + 1e-9 || this._view[1] < this._full[1] - 1e-9); }
  get lang() {
    let l = this.opts.lang;
    if (l === 'auto') l = (this.opts.locale || (typeof navigator !== 'undefined' && navigator.language) || 'en').slice(0, 2);
    return I18N[l] ? l : 'en';
  }
  get t() { return I18N[this.lang]; }

  /* ---------- Construcción del DOM ---------- */
  _build() {
    const r = document.createElement('div');
    r.className = 'pc-root';
    r.innerHTML = `
      <div class="pc-head"><div class="pc-titles"></div><div class="pc-actions"></div></div>
      <div class="pc-legend" role="group"></div>
      <div class="pc-plot" tabindex="0"><canvas role="img"></canvas><div class="pc-tip" aria-hidden="true"></div><div class="pc-hint"></div></div>
      <div class="pc-insp" hidden aria-live="polite"></div>
      <div class="pc-range" hidden><span class="pc-range-t"></span><button class="pc-btn" data-act="reset"></button></div>
      <div class="pc-nav" hidden><canvas aria-hidden="true"></canvas></div>
      <div class="pc-rotate"></div>
      <table class="pc-sr"></table>`;
    this.el.appendChild(r);
    this.root = r;
    this.$titles = r.querySelector('.pc-titles');
    this.$actions = r.querySelector('.pc-actions');
    this.$legend = r.querySelector('.pc-legend');
    this.$plot = r.querySelector('.pc-plot');
    this.$canvas = this.$plot.querySelector('canvas');
    this.$tip = r.querySelector('.pc-tip');
    this.$hint = r.querySelector('.pc-hint');
    this.$nav = r.querySelector('.pc-nav');
    this.$navCanvas = this.$nav.querySelector('canvas');
    this.$rotate = r.querySelector('.pc-rotate');
    this.$insp = r.querySelector('.pc-insp');
    this.$range = r.querySelector('.pc-range');
    this.$rangeT = r.querySelector('.pc-range-t');
    this.$table = r.querySelector('.pc-sr');
    this.ctx = this.$canvas.getContext('2d');
    this.navCtx = this.$navCanvas.getContext('2d');
  }

  _renderHeader() {
    const o = this.opts, t = this.t;
    this.$titles.innerHTML = (o.title ? `<h3 class="pc-title">${esc(o.title)}</h3>` : '') + (o.subtitle ? `<p class="pc-sub">${esc(o.subtitle)}</p>` : '');
    const fs = this.root.classList.contains('pc-fs');
    let html = '';
    const zc = !this._isPie && o.zoom && (o.zoomControls === true || o.zoomControls === 'auto');
    if (zc) html += `<button class="pc-btn" data-act="zout" aria-label="${t.zoomOut}" title="${t.zoomOut}"${this.isZoomed ? '' : ' disabled style="opacity:.35"'}>${ICONS.minus}</button><button class="pc-btn" data-act="zin" aria-label="${t.zoomIn}" title="${t.zoomIn}">${ICONS.plus}</button>`;
    if (this.isZoomed && !this._isPie && !this._rangeOn) html += `<button class="pc-btn" data-act="reset" aria-label="${t.reset}" title="${t.reset}">${ICONS.reset}</button>`;
    const EX = this._exportOpts;
    if (EX && EX.button !== false && EX.formats.length) html += `<button class="pc-btn" data-act="dl" aria-haspopup="menu" aria-label="${t.download}" title="${t.download}">${ICONS.download}</button>`;
    if (o.fullscreen) html += `<button class="pc-btn" data-act="fs" aria-label="${fs ? t.exit : t.fullscreen}" title="${fs ? t.exit : t.fullscreen}">${fs ? ICONS.close : ICONS.expand}</button>`;
    if (html !== this._actionsHtml) { this.$actions.innerHTML = html; this._actionsHtml = html; }
    this.root.querySelector('.pc-head').hidden = !o.title && !o.subtitle && !html;
    this.$rotate.textContent = t.rotate;
    this.$range.querySelector('.pc-btn').innerHTML = `${ICONS.reset}<span>${esc(t.resetShort)}</span>`;
    this.$range.querySelector('.pc-btn').setAttribute('aria-label', t.reset);
    this.$insp.hidden = this.opts.inspector !== 'bottom' || this._isPie;
    this.$canvas.setAttribute('aria-label', [o.title || t.chart, o.subtitle].filter(Boolean).join('. '));
  }

  _legendItems() {
    if (this._isPie) {
      return this._pie.map((p, i) => ({ key: 'p' + i, name: p.label, color: this._color(i) }));
    }
    return this._series.map((s) => ({ key: s.key, name: s.name, color: s.color }));
  }

  _renderLegend() {
    const items = this._legendItems();
    const show = this.opts.legend.show === 'auto' ? items.length > 1 : !!this.opts.legend.show;
    this.$legend.hidden = !show;
    this.$legend.toggleAttribute('data-single', this.opts.legend.mode === 'single');
    if (!show) { this.$legend.innerHTML = ''; return; }
    this.$legend.innerHTML = items.map((it) => `<button class="pc-chip" data-key="${esc(it.key)}" aria-pressed="${!this._hidden.has(it.key)}">
      <span class="pc-dot" style="background:${it.color}"></span><span>${esc(it.name)}</span><span class="pc-chip-val"></span></button>`).join('');
  }

  /* ---------- Datos ---------- */
  _ingest() {
    const o = this.opts;
    this._isPie = o.type === 'pie' || o.type === 'donut';
    this._type = normType(o.type);
    // Datos compactos: { x: [...], y: [...] } (o xStart + xStep) en lugar de pares; mucho menos texto por el puente de una WebView.
    const compact = (s) => {
      const D = isObj(s.data) && s.data.y ? s.data : s.y && s.y.length != null && !s.data ? s : null;
      if (!D) return s;
      const ys = D.y, xs = D.x, n = ys.length, x0 = D.xStart != null ? toNum(D.xStart) : 0, dx = D.xStep ?? 1;
      const data = new Array(n);
      for (let i = 0; i < n; i++) data[i] = [xs ? xs[i] : D.xStart != null ? x0 + i * dx : i, ys[i]];
      if (!xs && D.xStart == null) for (let i = 0; i < n; i++) data[i] = ys[i];
      return { ...s, data };
    };
    const raw = (o.series || []).map((s) => (Array.isArray(s) ? { data: s } : compact(s)));
    // Tipo de eje X
    let xType = o.x.type;
    const sample = raw.map((r) => r.data && r.data.find && r.data.find((d) => d != null)).find((d) => d != null);
    const sx = sample == null ? null : typeof sample === 'number' ? null : Array.isArray(sample) ? sample[0] : sample.x;
    if (xType === 'auto') {
      if (o.categories) xType = 'category';
      else if (sx instanceof Date || (typeof sx === 'string' && !isNaN(Date.parse(sx)) && /\d{4}-\d{2}/.test(sx))) xType = 'time';
      else if (typeof sx === 'string') xType = 'category';
      else if (sx == null) xType = 'category';
      else if (typeof sx === 'number' && sx > 1e11 && sx < 1e13) xType = 'time'; // milisegundos epoch
      else xType = 'linear';
    }
    this._xType = xType;
    const cats = o.categories ? o.categories.slice() : [];
    const catIdx = new Map(cats.map((c, i) => [String(c), i]));
    const toX = (x, i) => {
      if (x == null) return i;
      if (xType === 'category') {
        if (typeof x === 'number' && !o.categories) return x;
        const k = String(x);
        if (!catIdx.has(k)) { catIdx.set(k, cats.length); cats.push(k); }
        return catIdx.get(k);
      }
      if (x instanceof Date) return x.getTime();
      if (typeof x === 'string') return xType === 'time' ? Date.parse(x) : parseFloat(x);
      return +x;
    };
    this._series = raw.map((s, si) => {
      const pts = (s.data || []).map((d, i) => {
        let x, y, label, r;
        if (d == null || typeof d === 'number') { x = i; y = d; }
        else if (Array.isArray(d)) { x = d[0]; y = d[1]; r = d[2]; }
        else { x = d.x ?? d.label ?? d.name ?? i; y = d.y ?? d.value; label = d.label ?? d.name; r = d.r; }
        x = d == null || typeof d === 'number' ? i : toX(x, i);
        // Huecos: null, undefined, NaN o texto no numérico cortan la línea; nunca se convierten en 0.
        const yy = y == null || y === '' || isNaN(+y) || !isFinite(+y) ? null : +y;
        return { x, y: yy, v: yy, label, r, raw: d, i };
      }).filter((p) => isFinite(p.x));
      if (xType !== 'category') pts.sort((a, b) => a.x - b.x);
      // Separación mínima entre puntos de esta serie (ancho de barras en ejes de tiempo, tolerancia del tooltip).
      let sdx = Infinity;
      for (let i = 1; i < pts.length; i++) { const dd = pts[i].x - pts[i - 1].x; if (dd > 0 && dd < sdx) sdx = dd; }
      const sm = s.smooth ?? s.curveType;
      const curve = normCurve(s.curve) || normCurve(typeof sm === 'string' ? sm : null) || (sm === false || (sm == null && o.smooth === false) ? 'linear' : normCurve(o.line && o.line.curve) || 'smooth');
      return {
        key: s.id != null ? String(s.id) : 's' + si,
        name: s.name ?? `Serie ${si + 1}`,
        type: normType(s.type) || (this._isPie ? 'line' : this._type),
        color: s.color ? toHex(s.color) : null,
        slot: si,
        _dx: sdx,
        num: numSpec(s),
        curve,
        lineWidth: s.lineWidth, dash: s.dash, fillOpacity: s.fillOpacity, markers: s.markers, radius: s.radius,
        stackOpt: s.stack,
        yAxisOpt: isObj(s.yAxis) ? s.yAxis : null,
        unit: s.unit || '',
        format: s.format || null,
        points: pts,
      };
    });
    this._cats = cats;
    // Colores: siguen a la entidad (índice de la serie), nunca a su posición visible.
    this._series.forEach((s) => { s.color = s.color || this._color(s.slot); });
    // Modo "single": sólo una serie visible a la vez (útil con unidades distintas).
    if (o.legend.mode === 'single' && !this._isPie) {
      const visible = this._series.filter((s) => !this._hidden.has(s.key));
      if (visible.length !== 1) { this._hidden = new Set(this._series.slice(1).map((s) => s.key)); }
    }
    if (this._isPie) {
      const s = this._series[0];
      this._pie = (s?.points || []).map((p, i) => ({ label: p.label ?? cats[p.x] ?? `#${i + 1}`, value: Math.max(0, p.y || 0), i }));
    }
    // Dominio X completo
    let x0 = Infinity, x1 = -Infinity, minDx = Infinity;
    this._series.forEach((s) => {
      const p = s.points;
      if (!p.length) return;
      x0 = Math.min(x0, p[0].x); x1 = Math.max(x1, p[p.length - 1].x);
      for (let i = 1; i < p.length; i++) { const d = p[i].x - p[i - 1].x; if (d > 0 && d < minDx) minDx = d; }
    });
    if (!isFinite(x0)) { x0 = 0; x1 = 1; }
    const tUnit = xType === 'time' ? 36e5 : 1; // con un solo punto en un eje de tiempo: una hora de margen
    if (!isFinite(minDx)) minDx = (x1 - x0) || tUnit;
    this._minDx = minDx;
    const barS = this._series.filter((s) => s.type === 'bar');
    // Barras: el ancho sigue a la separación entre fechas de las propias barras (no a la de una línea densa).
    const bdx = barS.reduce((m, s) => Math.min(m, s._dx), Infinity);
    this._barDx = xType === 'category' ? 1 : isFinite(bdx) ? bdx : minDx;
    this._series.forEach((s) => { if (!isFinite(s._dx)) s._dx = s.type === 'bar' ? this._barDx : minDx; });
    if (xType === 'category' || barS.length) { const h = xType === 'category' ? minDx / 2 : this._barDx / 2; x0 -= h; x1 += h; }
    if (x1 === x0) { x0 -= tUnit; x1 += tUnit; }
    this._full = [x0, x1];
    // Zoom mínimo: siempre quedan a la vista al menos `zoom.minPoints` puntos.
    const Z = isObj(o.zoom) ? o.zoom : {};
    const minPts = Math.max(2, Z.minPoints ?? 4);
    this._minSpan = Math.min(x1 - x0, Math.max((x1 - x0) / 1e5, minDx * (minPts - 1), Z.minSpan || 0));
    this._view = [x0, x1];
    this._zeLast = this._view.slice();
    this._dataVer = (this._dataVer || 0) + 1;
    this._catW = null; this._navKey = null;
    this._yCur = null;
    this._inspect = null;
    this._buildAxes();
    this._computeStacks();
    this._renderHeader();
    this._renderLegend();
    this._renderTable();
  }

  /* ---------- Apilado ----------
   * Cada punto guarda su valor real en `v`; `y` pasa a ser la cima acumulada y `below` apunta
   * al punto de la serie de debajo (misma x, mismo signo). Así las animaciones y el zoom
   * funcionan igual que sin apilar: la base de un segmento es la cima animada del de abajo. */
  _computeStacks() {
    const o = this.opts, pct = o.stack === 'percent';
    const groups = new Map();
    this._stacked = false; this._stackAxes = null;
    (this._series || []).forEach((s) => {
      s.points.forEach((q) => { q.y = q.v; q.below = null; q.edge = false; });
      s._pyr = undefined; s.stackKey = null;
      if (this._isPie || s.type === 'scatter' || s.stackOpt === false) return;
      const name = typeof s.stackOpt === 'string' ? s.stackOpt : s.stackOpt === true || o.stack ? 'all' : null;
      if (!name) return;
      s.stackKey = s.type + ':' + name + (this._multi ? '@' + s.axis.key : '');
      if (this._multi) {
        // Apilar sólo tiene sentido en un mismo eje: un grupo que mezcla ejes se separa por eje.
        const g = (this._stackAxes ||= new Map()), k = s.type + ':' + name;
        if (g.has(k) && g.get(k) !== s.axis.key && !this._stackWarned) { this._stackWarned = true; console.warn(`PocketChart: el grupo apilado "${name}" mezcla ejes Y; se apila por separado en cada eje.`); }
        if (!g.has(k)) g.set(k, s.axis.key);
      }
      this._stacked = true;
      if (this._hidden.has(s.key)) return;
      if (!groups.has(s.stackKey)) groups.set(s.stackKey, []);
      groups.get(s.stackKey).push(s);
    });
    this._pct = pct && this._stacked;
    groups.forEach((g) => {
      const tot = new Map(), pos = new Map(), neg = new Map();
      if (pct) g.forEach((s) => s.points.forEach((q) => { if (q.v != null) tot.set(q.x, (tot.get(q.x) || 0) + Math.abs(q.v)); }));
      g.forEach((s) => s.points.forEach((q) => {
        if (q.v == null) return;
        const m = q.v >= 0 ? pos : neg, prev = m.get(q.x), sum = (prev ? prev.sum : 0) + q.v;
        q.below = prev ? prev.q : null;
        q.y = pct ? sum * 100 / (tot.get(q.x) || 1) : sum;
        m.set(q.x, { sum, q });
      }));
      pos.forEach((e) => (e.q.edge = true)); neg.forEach((e) => (e.q.edge = true));
    });
    this._dataVer = (this._dataVer || 0) + 1;
  }

  /* ---------- Ejes Y ----------
   * Sin `yAxis` en ninguna serie hay un solo eje (el de siempre, `opts.y`) y se dibuja igual que antes.
   * Con `yAxis`, cada serie usa su escala; las que comparten `id`, o `min`, `max` y lado, comparten eje. */
  _buildAxes() {
    const o = this.opts, axes = new Map();
    this._multi = !this._isPie && (this._series || []).some((s) => s.yAxisOpt);
    (this._series || []).forEach((s) => {
      const Y = s.yAxisOpt;
      let key, def;
      if (!Y) {
        key = '__default';
        def = { min: o.y.min, max: o.y.max, opposite: false, show: (o.axis || {}).y !== false, format: typeof o.y.format === 'function' ? o.y.format : null, num: numSpec(o.y), zero: o.y.zero, title: o.y.title || '', stable: o.y.stable ?? true };
      } else {
        const fixed = Y.min != null && Y.max != null && +Y.max > +Y.min;
        key = Y.id != null ? 'id:' + Y.id : fixed ? `mm:${+Y.min}|${+Y.max}|${Y.opposite ? 'R' : 'L'}` : 'auto:' + s.key;
        def = { min: Y.min ?? null, max: Y.max ?? null, opposite: !!Y.opposite, show: Y.show !== false, format: typeof Y.format === 'function' ? Y.format : null, num: numSpec(Y), zero: Y.zero ?? null, title: Y.title || '', stable: Y.stable ?? true };
      }
      let ax = axes.get(key);
      if (!ax) axes.set(key, (ax = { key, id: Y && Y.id != null ? Y.id : key === '__default' ? 'default' : key, ...def, series: [], cur: null }));
      else { if (!ax.format && def.format) ax.format = def.format; if (!ax.num && def.num) ax.num = def.num; if (!ax.title && def.title) ax.title = def.title; }
      ax.series.push(s); s.axis = ax;
    });
    this._axisList = [...axes.values()];
    this._axisList.forEach((ax) => { ax.nf = ax.num ? numFormatter(ax.num, this._locale) : null; });
    this._yNum = numSpec(o.y); this._yNf = this._yNum ? numFormatter(this._yNum, this._locale) : null;
    this._tipNf = numSpec(o.tooltip) ? numFormatter(numSpec(o.tooltip), this._locale) : null;
    (this._series || []).forEach((s) => { s.nf = s.num ? numFormatter(s.num, this._locale) : null; });
    this._padCur = null;
  }

  /** Activa la escala de un eje: a partir de aquí _sy, _pixelPoints y las barras la usan. */
  _useAxis(ax) {
    if (!ax || !ax.cur) return;
    this._yCur = ax.cur; this._baseVal = clamp(0, ax.cur[0], ax.cur[1]);
  }

  /** Dominio objetivo de un eje (mismas reglas que el eje único, por eje). */
  _axisTarget(ax) {
    const [v0, v1] = this._view;
    // Escala estable: ocultar una serie no cambia la escala de su eje (sólo los apilados se recalculan).
    const vis = ax.series.filter((s) => !this._hidden.has(s.key) || (ax.stable && !s.stackKey));
    const key = v0 + '|' + v1 + '|' + this._dataVer + '|' + vis.map((s) => s.key).join(',');
    if (ax._tc && ax._tc.key === key) return ax._tc.val;
    let lo, hi;
    if (ax.min != null && ax.max != null && +ax.max > +ax.min) { lo = +ax.min; hi = +ax.max; } // fijo: ni zoom ni datos lo cambian
    else {
      lo = Infinity; hi = -Infinity;
      vis.forEach((s) => {
        const p = s.points;
        const a = Math.max(0, lowerBound(p, v0) - 1), b = Math.min(p.length, lowerBound(p, v1) + 1);
        const mm = this._rangeMinMax(s, a, b);
        if (mm[0] < lo) lo = mm[0]; if (mm[1] > hi) hi = mm[1];
      });
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      const zero = ax.zero ?? vis.some((s) => s.type === 'bar' || s.type === 'area' || s.stackKey);
      if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
      const pct = this._pct && vis.some((s) => s.stackKey);
      if (pct) { lo = Math.min(lo, 0) < -1e-9 ? -100 : 0; hi = 100; }
      if (ax.min != null) lo = +ax.min;
      if (ax.max != null) hi = +ax.max;
      if (hi === lo) { hi += Math.abs(hi) * 0.1 || 1; lo -= zero && lo === 0 ? 0 : Math.abs(lo) * 0.1 || 1; }
      const pad = pct ? 0 : (hi - lo) * 0.06;
      if (ax.max == null) hi += pad;
      if (ax.min == null && !(zero && lo === 0)) lo -= pad;
    }
    ax._tc = { key, val: [lo, hi] };
    return ax._tc.val;
  }

  _fmtAxisTick(ax, v, step) {
    if (ax.format) return ax.format(v);
    if (ax.compact) return this._compactTick(ax, v, step);
    if (ax.nf) return ax.nf(v);
    if (ax.key === '__default') return this._fmtYTick(v, step);
    const t = this._fmtTick(v, step, true);
    return this._pct && ax.series.some((s) => s.stackKey) ? t + '%' : t;
  }

  /** Etiqueta compacta (5k, 1.25M) con los decimales justos para que dos marcas nunca se lean igual. */
  _compactTick(ax, v, step) {
    const m = Math.max(...(ax.ticks || [v]).map(Math.abs), Math.abs(v));
    const k = m >= 1e9 ? 1e9 : m >= 1e6 ? 1e6 : m >= 1e3 ? 1e3 : 1;
    const dec = clamp(Math.ceil(-Math.log10(step / k) - 1e-9), 0, 4);
    return numFormatter({ ...(ax.num || {}), style: 'compact', decimals: dec }, this._locale)(v);
  }

  /** Ejes, cuadrícula y eje X cuando hay varios ejes Y. Deja activo el eje principal. */
  _renderAxesMulti(W, H) {
    const ctx = this.ctx, C = this._colors, G = this.opts.grid || {}, AX = this.opts.axis || {};
    const dt = Math.min(64, this._now - (this._lastT || this._now)); this._lastT = this._now;
    const snap = !this._animOn || this._enter, k = 1 - Math.exp(-dt / 55);
    let moving = false;
    const ease = (cur, t, tol) => { const d = t - cur; if (Math.abs(d) > tol) { moving = true; return cur + d * k; } return t; };
    const yCount = Math.max(2, Math.floor(H / 56));
    const active = this._axisList.filter((ax) => ax.series.some((s) => !this._hidden.has(s.key)));
    if (this._axW !== W) { this._axW = W; this._axisList.forEach((ax) => (ax.compact = false)); } // al girar o redimensionar se recalcula
    ctx.font = `11px ${C.font}`;
    active.forEach((ax) => {
      const t = this._axisTarget(ax);
      if (!ax.cur || snap) ax.cur = t.slice();
      else for (let i = 0; i < 2; i++) ax.cur[i] = ease(ax.cur[i], t[i], (t[1] - t[0]) * 0.002);
      ax.step = niceStep(t[1] - t[0], yCount);
      ax.ticks = [];
      for (let v = Math.ceil(ax.cur[0] / ax.step) * ax.step; v <= ax.cur[1] + ax.step * 1e-6; v += ax.step) ax.ticks.push(Math.abs(v) < ax.step * 1e-9 ? 0 : v);
      ax.labels = ax.ticks.map((v) => this._fmtAxisTick(ax, v, ax.step));
      ax.w = ax.show ? Math.max(32, Math.max(...ax.labels.map((l) => this._mw(l)), this._mw(this._fmtAxisTick(ax, t[0], ax.step)), this._mw(this._fmtAxisTick(ax, t[1], ax.step))) + 12) : 0;
      ax.color = (ax.series.find((s) => !this._hidden.has(s.key)) || ax.series[0]).color;
    });
    // Muchos ejes en una pantalla estrecha: etiquetas compactas (5,000 → 5k) para que el gráfico conserve espacio.
    const sumW = () => active.reduce((n, a) => n + (a.show && !a.squeezed ? a.w : 0), 0);
    if (sumW() > W * 0.42) active.forEach((ax) => {
      if (!ax.show || ax.format || ax.compact) return;
      ax.compact = true;
      ax.labels = ax.ticks.map((v) => this._compactTick(ax, v, ax.step));
      ax.w = Math.max(28, Math.max(...ax.labels.map((l) => this._mw(l))) + 12, ax.title ? Math.min(46, this._mw(ax.title) + 8) : 0);
    });
    // Aun compactos, si los ejes no caben (pantalla muy estrecha) se dibujan sólo los más cercanos a cada lado:
    // nunca se salen del lienzo ni dejan el gráfico sin espacio. Los demás siguen en el tooltip y el panel.
    active.forEach((ax) => (ax.squeezed = false));
    while (sumW() > W * 0.6) {
      const shown = active.filter((a) => a.show && !a.squeezed);
      const l = shown.filter((a) => !a.opposite), rr = shown.filter((a) => a.opposite);
      const victim = l.length > 1 && (l.length >= rr.length || rr.length < 2) ? l[l.length - 1] : rr.length > 1 ? rr[rr.length - 1] : null;
      if (!victim) break;
      victim.squeezed = true; victim.w = 0;
    }
    const left = active.filter((a) => a.show && !a.squeezed && !a.opposite), right = active.filter((a) => a.show && !a.squeezed && a.opposite);
    const tgt = { l: left.length ? left.reduce((n, a) => n + a.w, 0) : 8, r: right.length ? right.reduce((n, a) => n + a.w, 0) : 8 };
    // El área de dibujo se reajusta con transición cuando aparece o desaparece un eje.
    if (!this._padCur || snap) this._padCur = { ...tgt };
    else { this._padCur.l = ease(this._padCur.l, tgt.l, 0.3); this._padCur.r = ease(this._padCur.r, tgt.r, 0.3); }
    if (moving) this.invalidate();
    const titled = [...left, ...right].some((a) => a.title);
    const top = titled ? 24 : 10;
    const r = this._plotRect = { x: this._padCur.l, y: top, w: Math.max(10, W - this._padCur.l - this._padCur.r), h: Math.max(10, H - top - 26) };
    const axisIn = this._enter ? clamp((this._now - this._enter.t0) / 300, 0, 1) : 1;
    ctx.globalAlpha = axisIn;
    // Cuadrícula: sigue al primer eje de la izquierda (o al primero visible)
    const primary = this._primary = left[0] || active.find((a) => a.show) || active[0];
    if (primary) {
      this._useAxis(primary);
      primary.ticks.forEach((v) => {
        const y = Math.round(this._sy(v)) + 0.5;
        if (y < r.y - 4 || y > r.y + r.h + 4) return;
        if (G.show !== false || v === 0) {
          ctx.strokeStyle = v === 0 ? C.axis : C.grid; ctx.lineWidth = 1;
          ctx.setLineDash(G.dashed && v !== 0 ? [4, 4] : []);
          ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }
    // Cada eje: línea, marcas y etiquetas con el color de su serie
    const drawAxis = (ax, edge, side) => {
      this._useAxis(ax);
      ctx.strokeStyle = ax.color; ctx.fillStyle = ax.color; ctx.lineWidth = 1;
      const x = Math.round(edge) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke();
      ctx.textBaseline = 'middle'; ctx.textAlign = side < 0 ? 'right' : 'left';
      ax.ticks.forEach((v, i) => {
        const y = Math.round(this._sy(v)) + 0.5;
        if (y < r.y - 4 || y > r.y + r.h + 4) return;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * 3, y); ctx.stroke();
        ctx.fillText(ax.labels[i], x + side * 6, y);
      });
      if (ax.title) {
        ctx.save(); ctx.font = `600 10.5px ${C.font}`; ctx.textBaseline = 'top';
        ctx.fillText(this._fitText(ax.title, Math.max(ax.w - 4, 24)), x + side * 2, 4);
        ctx.restore();
      }
    };
    let off = 0;
    left.forEach((ax) => { drawAxis(ax, r.x - off, -1); off += ax.w; });
    off = 0;
    right.forEach((ax) => { drawAxis(ax, r.x + r.w + off, 1); off += ax.w; });
    ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h + 0.5); ctx.lineTo(r.x + r.w, r.y + r.h + 0.5); ctx.stroke();
    ctx.textAlign = 'right';
    if (AX.x !== false) this._renderXAxis(W, H);
    ctx.globalAlpha = 1;
    if (primary) this._useAxis(primary);
    return r;
  }

  /** Recalcula el apilado tras mostrar u ocultar series, con transición. */
  _restack(wasHidden) {
    if (!this._stacked) return;
    const prev = this._snapshot();
    this._computeStacks();
    this._startMorph(prev);
    if (!this._morph) return;
    // Las series que reaparecen crecen desde la cima de la serie de debajo.
    this._series.forEach((s) => {
      if (!wasHidden.has(s.key) || this._hidden.has(s.key)) return;
      s.points.forEach((q) => { if (q.y != null) q.y0 = q.below ? (q.below.y0 ?? q.below.y) : null; });
    });
  }

  _color(i) { return this._palette ? this._palette[i % this._palette.length] : PALETTE.light[i % 8]; }

  _renderTable() {
    const rows = [];
    if (this._isPie) this._pie.forEach((p) => rows.push(`<tr><th>${esc(p.label)}</th><td>${this._fmtY(p.value)}</td></tr>`));
    else {
      const ref = this._series[0]?.points || [];
      rows.push(`<tr><th></th>${this._series.map((s) => `<th>${esc(s.name)}</th>`).join('')}</tr>`);
      ref.slice(0, 300).forEach((p) => rows.push(`<tr><th>${esc(this._fmtXFull(p.x))}</th>${this._series.map((s) => {
        const q = s.points[nearestIndex(s.points, p.x)]; return `<td>${q && q.x === p.x ? this._fmtY(q.v, s) : ''}</td>`;
      }).join('')}</tr>`));
    }
    this.$table.innerHTML = `<caption>${esc(this.opts.title || this.t.chart)}</caption>${rows.join('')}`;
  }

  /* ---------- Tema ---------- */
  _resolveTheme() {
    let th = this.opts.theme;
    if (th === 'auto') {
      const attr = document.documentElement.getAttribute('data-theme');
      th = attr === 'dark' || attr === 'light' ? attr : (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    this.root.setAttribute('data-pc-theme', th);
    this._theme = th;
    // Estilo por opciones → variables CSS (--pocket-*), así también afecta a leyenda y tooltip.
    const st = this.root.style;
    (this._vars || []).forEach((n) => st.removeProperty(n));
    this._vars = [];
    const apply = (obj, suffix) => Object.keys(obj || {}).forEach((k) => {
      if (obj[k] == null || obj[k] === '') return;
      const n = `--pocket-${STYLE_VARS[k] || k}${suffix}`;
      st.setProperty(n, k === 'radius' && typeof obj[k] === 'number' ? obj[k] + 'px' : String(obj[k]));
      this._vars.push(n);
    });
    apply(this.opts.style, ''); apply(this.opts.styleDark, '-dark');
    const cs = getComputedStyle(this.root);
    const v = (n) => cs.getPropertyValue(n).trim();
    this._colors = { bg: v('--pc-bg'), fg: v('--pc-fg'), muted: v('--pc-muted'), grid: v('--pc-grid'), axis: v('--pc-axis'), font: v('--pc-font') || 'system-ui' };
    const custom = th === 'dark' ? this.opts.colorsDark || this.opts.colors : this.opts.colors;
    this._mwc = null; this._navKey = null;
    this._palette = custom && custom.length ? custom.map(toHex) : Array.from({ length: 8 }, (_, i) => v(`--pc-c${i + 1}`) || PALETTE[th][i]);
    this._series?.forEach((s) => {
      const src = this.opts.series[s.slot] || {};
      s.color = toHex((th === 'dark' && src.colorDark) || src.color || this._color(s.slot));
    });
    this._renderLegend();
    this.invalidate();
  }

  /* ---------- Formatos ---------- */
  get _locale() { return this.opts.locale || undefined; }
  _nf(maxFrac) { const k = 'n' + maxFrac; return (this._nfc ||= {})[k] ||= new Intl.NumberFormat(this._locale, { maximumFractionDigits: maxFrac }); }
  _df(opts) { const k = JSON.stringify(opts); return (this._dfc ||= {})[k] ||= new Intl.DateTimeFormat(this._locale, opts); }
  _fmtY(v, s) {
    if (v == null) return '–';
    const own = s && s.axis && s.axis.key !== '__default';
    const yf = typeof this.opts.y.format === 'function' ? this.opts.y.format : null;
    const f = (s && typeof s.format === 'function' && s.format) || (own || this._tipNf ? null : yf);
    if (f) return f(v, s);
    const u = (t) => (s && s.unit ? `${t} ${s.unit}` : t);
    // Formatos declarativos: serie > tooltip > eje > y
    if (s && s.nf) return u(s.nf(v));
    if (this._tipNf) return u(this._tipNf(v));
    if (own && s.axis.format) return u(s.axis.format(v)); // formato del eje + unidad
    if (own && s.axis.nf) return u(s.axis.nf(v));
    if (!own && this._yNf) return u(this._yNf(v));
    if (!own && yf) return yf(v, s);
    const a = Math.abs(v);
    const txt = a >= 1e6 ? this._nf(1).format(v / 1e6) + 'M' : a >= 1e4 ? this._nf(1).format(v / 1e3) + 'k' : this._nf(a < 10 ? 2 : a < 100 ? 2 : 1).format(v);
    return s && s.unit ? `${txt} ${s.unit}` : txt;
  }
  _fmtTick(v, step, raw) {
    const f = raw ? null : typeof this.opts.y.format === 'function' ? this.opts.y.format : null;
    if (f) return f(v);
    if (!raw && this._yNf) return this._yNf(v);
    const a = Math.max(Math.abs(v), Math.abs(step));
    if (a >= 1e6) return this._nf(2).format(v / 1e6) + 'M';
    if (a >= 1e4) return this._nf(1).format(v / 1e3) + 'k';
    const dec = Math.max(0, -Math.floor(Math.log10(step)));
    return this._nf(Math.min(dec, 6)).format(v);
  }
  _fmtYTick(v, step) { const t = this._fmtTick(v, step); return this._pct && !this.opts.y.format && !this._yNf ? t + '%' : t; }
  _fmtXFull(x) {
    const X = this.opts.x, T = this.opts.tooltip || {};
    if (this._xType === 'time' && typeof T.dateFormat === 'string') return fmtDate(x, T.dateFormat, this._locale);
    if (typeof X.format === 'function') return X.format(x, 'full');
    if (this._xType === 'time') {
      if (typeof X.format === 'string') return fmtDate(x, X.format, this._locale);
      // Nunca ambiguo: segundos si los datos los necesitan y el año si no es el actual o el rango cruza años.
      const fine = this._minDx < 864e5, secs = this._minDx < 6e4;
      const [f0, f1] = this._full, y0 = new Date(f0).getFullYear();
      const year = y0 !== new Date(f1).getFullYear() || y0 !== new Date().getFullYear();
      const o = fine ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' };
      if (fine && secs) o.second = '2-digit';
      if (fine && year) o.year = 'numeric';
      return this._df(o).format(x);
    }
    if (this._xType === 'category') return this._cats[Math.round(x)] ?? String(Math.round(x));
    return this._nf(4).format(x);
  }

  /* ---------- Eventos ---------- */
  _bind() {
    const p = this.$plot;
    this._visible = typeof IntersectionObserver === 'undefined';
    if (!this._visible) {
      this._io = new IntersectionObserver((entries) => {
        const e = entries[entries.length - 1];
        const vis = e.isIntersecting && e.intersectionRatio >= 0.2;
        if (vis === this._visible) return;
        this._visible = vis;
        this._emit('visible', vis);
        if (vis) { if (this._enterPending) this._startEnter(); }
        else if (this._anim.replayOnView && !this._loading && this._animOn && this._anim.enter !== 'none') { this._enterPending = true; this._enter = null; }
      }, { threshold: [0, 0.2, 0.5] });
      this._io.observe(this.$plot);
    }
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(p);
    this._onTheme = () => this._resolveTheme();
    if (typeof matchMedia === 'function') { this._mq = matchMedia('(prefers-color-scheme: dark)'); this._mq.addEventListener?.('change', this._onTheme); }
    this._mo = new MutationObserver(this._onTheme);
    this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    p.addEventListener('pointerdown', (e) => this._down(e));
    p.addEventListener('pointermove', (e) => this._move(e));
    p.addEventListener('pointerup', (e) => this._up(e));
    p.addEventListener('pointercancel', (e) => this._cancel(e));
    p.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !this._ptrs.size && this.opts.hover && !this.opts.tooltip.sticky) this._clearInspect(); });
    p.addEventListener('contextmenu', (e) => e.preventDefault());
    p.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    p.addEventListener('keydown', (e) => this._key(e));

    this.$legend.addEventListener('click', (e) => {
      const b = e.target.closest('.pc-chip'); if (!b) return;
      if (this._chipLong) { this._chipLong = false; return; }
      this._toggleKey(b.dataset.key, false);
    });
    // Mantener pulsado un chip = ver sólo esa serie
    let lt;
    this.$legend.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.pc-chip'); if (!b) return;
      lt = setTimeout(() => { this._chipLong = true; this._toggleKey(b.dataset.key, true); navigator.vibrate?.(8); }, 480);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => this.$legend.addEventListener(ev, () => clearTimeout(lt)));
    this.$legend.addEventListener('scroll', () => clearTimeout(lt), { passive: true });

    this.$actions.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'reset') this.resetZoom('reset');
      if (b.dataset.act === 'zin') this.zoomBy(0.5, 'button');
      if (b.dataset.act === 'zout') this.zoomBy(2, 'button');
      if (b.dataset.act === 'fs') {
        // 'external': la app abre su propio modal (p. ej. un Modal de React Native) con el mismo rango.
        if (this.opts.fullscreen === 'external') this._emit('fullscreenRequest', { from: this._view[0], to: this._view[1], zoomed: !!this.isZoomed });
        else this.toggleFullscreen();
      }
      if (b.dataset.act === 'dl') this._toggleMenu();
    });
    this._onFsChange = () => {
      const on = document.fullscreenElement === this.root || document.webkitFullscreenElement === this.root;
      this.root.classList.toggle('pc-fs', on || !!this._fsFallback);
      this._renderHeader(); this._resize();
    };
    document.addEventListener('fullscreenchange', this._onFsChange);
    document.addEventListener('webkitfullscreenchange', this._onFsChange);
    this._onKeyFs = (e) => { if (e.key === 'Escape' && this._fsFallback) this.toggleFullscreen(false); };
    document.addEventListener('keydown', this._onKeyFs);

    this.$range.addEventListener('click', (e) => { if (e.target.closest('[data-act=reset]')) this.resetZoom('reset'); });
    // Respaldo con eventos touch*: si el navegador cancela los punteros a mitad de un gesto
    // (pasa en algunas WebView de iOS y Android), el gesto sigue con los eventos táctiles.
    if ('ontouchstart' in window) {
      p.addEventListener('touchstart', (e) => this._touch(e, 'start'), { passive: false });
      p.addEventListener('touchmove', (e) => this._touch(e, 'move'), { passive: false });
      p.addEventListener('touchend', (e) => this._touch(e, 'end'), { passive: false });
      p.addEventListener('touchcancel', (e) => this._touch(e, 'end'), { passive: false });
    }
    this._bindNav();
  }

  _touch(e, kind) {
    if (this._isPie) return;
    this._lastTouches = e.touches;
    const g = this._g;
    if (kind === 'start' && e.touches.length >= 2 && this.opts.zoom && e.cancelable) e.preventDefault(); // sin zoom de la página
    if (kind === 'move' && g && (g.mode === 'pan' || g.mode === 'pinch' || g.mode === 'scrub') && e.cancelable) e.preventDefault(); // sin scroll mientras se arrastra
    if (!this._tt) return;
    const fake = (t) => ({ pointerId: 't' + t.identifier, clientX: t.clientX, clientY: t.clientY, pointerType: 'touch' });
    if (kind === 'start') for (const t of e.changedTouches) this._down(fake(t));
    else if (kind === 'move') for (const t of e.changedTouches) this._move(fake(t));
    else { for (const t of e.changedTouches) this._up(fake(t)); if (!e.touches.length) this._tt = false; }
  }

  _setFallbackFs(on) {
    this._fsFallback = on;
    this.root.classList.toggle('pc-fs', on);
    if (on) { this._prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
    else document.documentElement.style.overflow = this._prevOverflow || '';
    this._renderHeader(); this._resize();
  }

  _toggleKey(key, solo) {
    const was = new Set(this._hidden);
    const items = this._legendItems().map((i) => i.key);
    if (solo || this.opts.legend.mode === 'single') {
      const onlyThis = items.filter((k) => k !== key);
      const already = !solo ? false : onlyThis.every((k) => this._hidden.has(k)) && !this._hidden.has(key);
      this._hidden = already ? new Set() : new Set(onlyThis);
    } else if (this._hidden.has(key)) this._hidden.delete(key);
    else if (items.filter((k) => !this._hidden.has(k)).length > 1) this._hidden.add(key);
    else return; // nunca dejar el gráfico vacío
    this._restack(was);
    this._emit('toggle', { key, visible: !this._hidden.has(key), hidden: [...this._hidden] });
    this._renderLegend(); this._clearInspect(); this.invalidate();
  }

  _hideHint() { if (this.$hint.classList.contains('pc-on')) this.$hint.classList.remove('pc-on'); clearTimeout(this._hintT); }

  _local(e, fresh) {
    // getBoundingClientRect fuerza un cálculo de layout: sólo se pide al empezar el gesto.
    if (fresh || !this._rect || !this._ptrs.size) this._rect = this.$plot.getBoundingClientRect();
    const r = this._rect; return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  _interact(on, info) {
    if (on === !!this._interacting) return;
    this._interacting = on;
    this._emit(on ? 'interactionStart' : 'interactionEnd', info || {});
  }

  _down(e) {
    this._hideHint();
    if (this._inertia) { cancelAnimationFrame(this._inertia); this._inertia = 0; this._zoomEnd('pan'); }
    this._interact(true, { pointerType: e.pointerType });
    try { this.$plot.setPointerCapture(e.pointerId); } catch (_) {}
    const pt = this._local(e, true);
    this._ptrs.set(e.pointerId, { ...pt, sx: pt.x, sy: pt.y });
    if (this._ptrs.size === 1) {
      this._g = { mode: 'pending', t0: performance.now(), x0: pt.x, y0: pt.y, type: e.pointerType, view0: this._view.slice(), hist: [] };
      if (e.pointerType !== 'mouse') {
        this._g.lp = setTimeout(() => {
          if (this._g && this._g.mode === 'pending') { this._g.mode = 'scrub'; navigator.vibrate?.(10); this._inspectAt(pt.x, pt.y, true); }
        }, 320);
      }
    } else if (this._ptrs.size === 2 && !this._isPie && this.opts.zoom) {
      clearTimeout(this._g?.lp);
      const [a, b] = [...this._ptrs.values()];
      const mid = (a.x + b.x) / 2;
      this._g = { mode: 'pinch', d0: Math.max(40, Math.abs(a.x - b.x)), view0: this._view.slice(), anchor: this._invX(mid), mid0: mid };
      this._clearInspect();
    }
  }

  _move(e) {
    const pt = this._local(e);
    if (!this._ptrs.has(e.pointerId)) {
      if (e.pointerType === 'mouse' && this.opts.hover && !e.buttons) this._inspectAt(pt.x, pt.y, false);
      return;
    }
    const p = this._ptrs.get(e.pointerId); p.x = pt.x; p.y = pt.y;
    const g = this._g; if (!g) return;
    if (g.mode === 'pending') {
      const dx = pt.x - g.x0, dy = pt.y - g.y0;
      if (Math.hypot(dx, dy) > 8) {
        clearTimeout(g.lp);
        if (Math.abs(dx) > Math.abs(dy) * 0.8 || g.type === 'mouse') {
          g.mode = !this._isPie && this.isZoomed && this.opts.pan ? 'pan' : 'scrub';
          if (g.mode === 'pan') this._clearInspect();
        } else g.mode = 'none';
      }
    }
    if (g.mode === 'scrub') this._inspectAt(pt.x, pt.y, g.type !== 'mouse');
    else if (g.mode === 'pan') {
      const span = g.view0[1] - g.view0[0];
      const d = -(pt.x - g.x0) / this._plotRect.w * span;
      this._setView([g.view0[0] + d, g.view0[1] + d]);
      g.hist.push({ t: performance.now(), x: pt.x }); if (g.hist.length > 6) g.hist.shift();
    } else if (g.mode === 'pinch' && this._ptrs.size >= 2) {
      const [a, b] = [...this._ptrs.values()];
      const d = Math.max(20, Math.abs(a.x - b.x)), mid = (a.x + b.x) / 2;
      const span0 = g.view0[1] - g.view0[0];
      const span = clamp(span0 * g.d0 / d, this._minSpan, this._full[1] - this._full[0]);
      const frac = (mid - this._plotRect.x) / this._plotRect.w;
      const v0 = g.anchor - frac * span;
      this._setView([v0, v0 + span]);
    }
  }

  _up(e) {
    const g = this._g;
    this._ptrs.delete(e.pointerId);
    if (!g) return;
    clearTimeout(g.lp);
    if (this._ptrs.size === 1 && g.mode === 'pinch') {
      // Al levantar un dedo del pellizco seguimos arrastrando con el otro.
      const [p] = [...this._ptrs.values()];
      this._g = { mode: 'pan', x0: p.x, y0: p.y, view0: this._view.slice(), hist: [], type: 'touch', src: 'pinch' };
      return;
    }
    if (this._ptrs.size) return;
    const pt = this._local(e);
    if (g.mode === 'pending' && performance.now() - g.t0 < 350) this._tap(pt.x, pt.y, g.type);
    const src = g.src || (g.mode === 'pinch' ? 'pinch' : 'pan');
    if (g.mode === 'pan' || g.mode === 'pinch') { if (!(g.mode === 'pan' && g.hist.length > 1 && this._startInertia(g.hist, src))) this._zoomEnd(src); }
    if (g.mode === 'scrub' && g.type === 'mouse' && !this.opts.hover && !this.opts.tooltip.sticky) this._clearInspect();
    this._g = null;
    this._interact(false, { gesture: g.mode });
  }

  _cancel(e) {
    const g = this._g;
    // El navegador se quedó el gesto (pasa en algunas WebView): seguimos con los eventos táctiles.
    if (e.pointerType === 'touch' && g && (g.mode === 'pan' || g.mode === 'pinch' || g.mode === 'scrub') && this._lastTouches && this._lastTouches.length && !this._tt) {
      clearTimeout(g.lp);
      this._tt = true; this._ptrs.clear(); this._g = null;
      const fake = (t) => ({ pointerId: 't' + t.identifier, clientX: t.clientX, clientY: t.clientY, pointerType: 'touch' });
      for (const t of this._lastTouches) this._down(fake(t));
      if (g.mode === 'scrub' && this._g) this._g.mode = 'scrub';
      return;
    }
    this._ptrs.delete(e.pointerId); clearTimeout(g?.lp);
    if (!this._ptrs.size) {
      if (g && (g.mode === 'pan' || g.mode === 'pinch')) this._zoomEnd(g.src || g.mode);
      this._g = null; this._interact(false, { gesture: g ? g.mode : 'none' });
    }
  }

  _tap(x, y, type) {
    if (this._error) { if (typeof this._lastSrc === 'function') this.load(this._lastSrc).catch(() => {}); return; }
    if (this._loading) return;
    const now = performance.now();
    const dbl = this._lastTap && now - this._lastTap.t < 300 && Math.hypot(x - this._lastTap.x, y - this._lastTap.y) < 30;
    this._lastTap = dbl ? null : { t: now, x, y };
    if (dbl && !this._isPie && this.opts.zoom) {
      if (this.isZoomed) this.resetZoom('doubletap');
      else { const c = this._invX(x), span = (this._full[1] - this._full[0]) / 3; this.zoomTo(c - span / 2, c + span / 2, true, 'doubletap'); }
      this._clearInspect();
      return;
    }
    if (type === 'mouse' && this.opts.hover) return;
    const prev = this._inspect;
    const hit = this._hitTest(x, y);
    if (!hit || (prev && hit.id === prev.id)) this._clearInspect();
    else this._inspectAt(x, y, type !== 'mouse');
  }

  _startInertia(hist, src = 'pan') {
    const a = hist[0], b = hist[hist.length - 1];
    const dt = b.t - a.t; if (dt <= 0 || dt > 120) return false;
    let v = (b.x - a.x) / dt; // px/ms
    if (reduceMotion() || Math.abs(v) < 0.02) return false;
    let last = performance.now();
    const done = () => { this._inertia = 0; this._zoomEnd(src); };
    const step = (now) => {
      const dtt = now - last; last = now;
      v *= Math.pow(0.94, dtt / 16);
      if (Math.abs(v) < 0.02) return done();
      const span = this._view[1] - this._view[0];
      const d = -v * dtt / this._plotRect.w * span;
      this._setView([this._view[0] + d, this._view[1] + d]);
      if (this._view[0] <= this._full[0] || this._view[1] >= this._full[1]) return done();
      this._inertia = requestAnimationFrame(step);
    };
    this._inertia = requestAnimationFrame(step);
    return true;
  }

  _wheel(e) {
    if (this._isPie || !this.opts.zoom) return;
    const pt = this._local(e);
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const k = Math.exp(e.deltaY * 0.01);
      const span = clamp((this._view[1] - this._view[0]) * k, this._minSpan, this._full[1] - this._full[0]);
      const anchor = this._invX(pt.x), frac = (pt.x - this._plotRect.x) / this._plotRect.w;
      this._setView([anchor - frac * span, anchor - frac * span + span]);
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && this.isZoomed) {
      e.preventDefault();
      const span = this._view[1] - this._view[0], d = e.deltaX / this._plotRect.w * span;
      this._setView([this._view[0] + d, this._view[1] + d]);
    } else return;
    clearTimeout(this._wheelT);
    this._wheelT = setTimeout(() => this._zoomEnd('wheel'), 250); // un solo zoomEnd al dejar la rueda
  }

  _key(e) {
    if (this._isPie) {
      const n = this._pie.length; if (!n) return;
      let i = this._inspect ? this._inspect.slice : -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (i - 1 + n) % n;
      else if (e.key === 'Escape') return this._clearInspect();
      else return;
      e.preventDefault(); this._selectSlice(i); return;
    }
    const ref = this._refSeries(); if (!ref) return;
    const pts = ref.points;
    let i = this._inspect ? nearestIndex(pts, this._inspect.x) : nearestIndex(pts, (this._view[0] + this._view[1]) / 2) - 1;
    const span = this._view[1] - this._view[0], c = (this._view[0] + this._view[1]) / 2;
    switch (e.key) {
      case 'ArrowRight': i = Math.min(pts.length - 1, i + 1); break;
      case 'ArrowLeft': i = Math.max(0, i - 1); break;
      case '+': case '=': this.zoomTo(c - span / 3, c + span / 3, true, 'keyboard'); e.preventDefault(); return;
      case '-': this.zoomTo(c - span, c + span, true, 'keyboard'); e.preventDefault(); return;
      case '0': this.resetZoom('keyboard'); e.preventDefault(); return;
      case 'Escape': this._clearInspect(); return;
      default: return;
    }
    e.preventDefault();
    const x = pts[i].x;
    if (x < this._view[0] || x > this._view[1]) this.zoomTo(x - span / 2, x + span / 2, false, 'keyboard');
    this._inspectAt(this._sx(x), this._plotRect.y + 20, false);
  }

  /** Limita una vista: dentro del rango de datos, con el zoom mínimo y nunca vacía. */
  _clampView(v) {
    const [f0, f1] = this._full;
    const span = clamp(v[1] - v[0], this._minSpan, f1 - f0);
    let a = clamp(v[0], f0, f1 - span);
    // En huecos grandes de datos, la vista se centra en el punto más cercano para no quedar vacía.
    const ref = (this._series || []).filter((s) => !this._hidden.has(s.key) && s.points.length).sort((x, y) => y.points.length - x.points.length)[0];
    if (ref && span < f1 - f0) {
      const p = ref.points, i = lowerBound(p, a);
      if (i >= p.length || p[i].x > a + span) {
        const c = i >= p.length ? p[p.length - 1].x : i > 0 && a - p[i - 1].x < p[i].x - (a + span) ? p[i - 1].x : p[i].x;
        a = clamp(c - span / 2, f0, f1 - span);
      }
    }
    return [a, a + span];
  }
  _setView(v) {
    const wasZoomed = this.isZoomed;
    this._view = this._clampView(v);
    if (wasZoomed !== this.isZoomed) { this._renderHeader(); this._layoutNav(); }
    if (this._inspect) this._refreshInspect();
    this._zoomEvt = true; // el evento se emite una vez por fotograma
    this.invalidate();
  }

  /* ---------- Navegador (mini-mapa) ---------- */
  _bindNav() {
    const n = this.$nav;
    let drag = null;
    n.addEventListener('pointerdown', (e) => {
      n.setPointerCapture(e.pointerId);
      this._interact(true, { pointerType: e.pointerType });
      const r = n.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width;
      const [f0, f1] = this._full, full = f1 - f0, span = this._view[1] - this._view[0];
      const x = f0 + fx * full;
      if (x < this._view[0] || x > this._view[1]) this._setView([x - span / 2, x + span / 2]);
      drag = { x: e.clientX, v0: this._view.slice(), w: r.width };
    });
    n.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const full = this._full[1] - this._full[0], d = (e.clientX - drag.x) / drag.w * full;
      this._setView([drag.v0[0] + d, drag.v0[1] + d]);
    });
    const end = () => { if (!drag) return; drag = null; this._zoomEnd('navigator'); this._interact(false, { gesture: 'navigator' }); };
    n.addEventListener('pointerup', end); n.addEventListener('pointercancel', end);
  }

  get _rangeOn() { const R = this.opts.rangeBar; return !this._isPie && (R === true || (R === 'auto' && !!this.isZoomed)); }
  _layoutNav() {
    if (this.$range.hidden === this._rangeOn) { this.$range.hidden = !this._rangeOn; this._rangeTxt = null; }
    const want = this.opts.navigator === true || (this.opts.navigator === 'auto' && this.isZoomed);
    const show = want && !this._isPie;
    if (this.$nav.hidden === !show) return;
    this.$nav.hidden = !show;
    if (show) this._sizeCanvas(this.$navCanvas, this.navCtx);
  }

  /* ---------- Tamaño y escalas ---------- */
  _resize() {
    const fs = this.root.classList.contains('pc-fs');
    if (!fs) this.$plot.style.height = (this._isPie ? Math.max(220, this.opts.height) : this.opts.height) + 'px';
    else this.$plot.style.height = '';
    this._sizeCanvas(this.$canvas, this.ctx);
    if (!this.$nav.hidden) this._sizeCanvas(this.$navCanvas, this.navCtx);
    this._layoutNav();
    if (this._loading) this._loop();
    else if (this._enterPending && this.$canvas._w) this._startEnter();
    this.invalidate();
  }

  _sizeCanvas(c, ctx) {
    const dpr = Math.min(this.opts.lite ? Math.min(1.5, this.opts.maxPixelRatio || 2) : this.opts.maxPixelRatio || 2, window.devicePixelRatio || 1);
    const w = c.parentElement.clientWidth, h = c.parentElement.clientHeight;
    if (!w || !h) return;
    if (c._w === w && c._h === h && c._dpr === dpr) return; // reasignar width borra y recrea el lienzo
    c._dpr = dpr;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    c._w = w; c._h = h;
  }

  _showHint() {
    if (!this.opts.hint || this.opts.lite || this._hintShown || this._isPie) return;
    this._hintShown = true;
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    this.$hint.textContent = coarse ? this.t.hintTouch : this.t.hintMouse;
    this.$hint.classList.add('pc-on');
    this._hintT = setTimeout(() => this._hideHint(), 3800);
  }

  _sx(x) { const r = this._plotRect; return r.x + (x - this._view[0]) / (this._view[1] - this._view[0]) * r.w; }
  _invX(px) { const r = this._plotRect; return this._view[0] + (px - r.x) / r.w * (this._view[1] - this._view[0]); }
  _sy(y) { const r = this._plotRect, [a, b] = this._yCur; return r.y + r.h - (y - a) / (b - a) * r.h; }

  _visibleSeries() { return this._series.filter((s) => !this._hidden.has(s.key)); }
  _refSeries() { const v = this._visibleSeries(); return v.find((s) => s.type !== 'scatter') || v[0]; }

  _yTarget() {
    const o = this.opts.y, vis = o.stable ? this._series.filter((s) => !this._hidden.has(s.key) || !s.stackKey) : this._visibleSeries();
    const [v0, v1] = this._view;
    const key = v0 + '|' + v1 + '|' + this._dataVer + '|' + vis.map((s) => s.key).join(',');
    if (this._ytc && this._ytc.key === key && this._ytc.o === o) return this._ytc.val;
    let lo = Infinity, hi = -Infinity;
    vis.forEach((s) => {
      const p = s.points;
      const a = Math.max(0, lowerBound(p, v0) - 1), b = Math.min(p.length, lowerBound(p, v1) + 1);
      const mm = this._rangeMinMax(s, a, b);
      if (mm[0] < lo) lo = mm[0]; if (mm[1] > hi) hi = mm[1];
    });
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    const zero = o.zero ?? vis.some((s) => s.type === 'bar' || s.type === 'area' || s.stackKey);
    if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (this._pct) { lo = Math.min(lo, 0) < -1e-9 ? -100 : 0; hi = 100; }
    if (o.min != null) lo = o.min;
    if (o.max != null) hi = o.max;
    if (hi === lo) { hi += Math.abs(hi) * 0.1 || 1; lo -= zero && lo === 0 ? 0 : Math.abs(lo) * 0.1 || 1; }
    const pad = this._pct ? 0 : (hi - lo) * 0.06;
    if (o.max == null) hi += pad;
    if (o.min == null && !(zero && lo === 0)) lo -= pad;
    this._ytc = { key, o, val: [lo, hi] };
    return this._ytc.val;
  }

  /* ---------- Pirámide min/máx para series grandes ----------
   * Nivel L agrupa 2^L puntos y guarda el índice del mínimo y del máximo.
   * Así, con 200.000 puntos, cada fotograma recorre unos pocos miles en vez de todos. */
  _pyr(s) {
    if (s._pyr !== undefined) return s._pyr;
    const p = s.points, n = p.length;
    if (n < 4096) return (s._pyr = null);
    const levels = [];
    let prevMin = null, prevMax = null, prevGap = null, prevN = n;
    for (let L = 1; (n >> L) >= 64; L++) {
      const m = Math.ceil(prevN / 2);
      const mins = new Int32Array(m), maxs = new Int32Array(m), gap = new Uint8Array(m);
      for (let j = 0; j < m; j++) {
        let mi = -1, ma = -1, g = 0;
        for (let c = 2 * j; c < 2 * j + 2 && c < prevN; c++) {
          let cmi, cma;
          if (!prevMin) { const y = p[c].y; if (y == null) { g = 1; continue; } cmi = cma = c; }
          else { cmi = prevMin[c]; cma = prevMax[c]; if (prevGap[c]) g = 1; if (cmi < 0) continue; }
          if (mi < 0 || p[cmi].y < p[mi].y) mi = cmi;
          if (ma < 0 || p[cma].y > p[ma].y) ma = cma;
        }
        mins[j] = mi; maxs[j] = ma; gap[j] = g;
      }
      levels.push({ size: 1 << L, mins, maxs, gap });
      prevMin = mins; prevMax = maxs; prevGap = gap; prevN = m;
    }
    return (s._pyr = levels.length ? levels : null);
  }

  /** Mínimo y máximo de y en [a, b) usando la pirámide cuando conviene. */
  _rangeMinMax(s, a, b) {
    const p = s.points;
    let lo = Infinity, hi = -Infinity;
    const raw = (i0, i1) => { for (let i = i0; i < i1; i++) { const y = p[i].y; if (y == null) continue; if (y < lo) lo = y; if (y > hi) hi = y; } };
    const pyr = b - a > 2048 ? this._pyr(s) : null;
    if (!pyr) { raw(a, b); return [lo, hi]; }
    let li = 0;
    while (li + 1 < pyr.length && (b - a) / pyr[li + 1].size > 512) li++;
    const lv = pyr[li], sz = lv.size;
    const j0 = Math.ceil(a / sz), j1 = Math.floor(b / sz);
    raw(a, Math.min(b, j0 * sz));
    for (let j = j0; j < j1; j++) {
      if (lv.mins[j] < 0) continue;
      const ymi = p[lv.mins[j]].y, yma = p[lv.maxs[j]].y;
      if (ymi < lo) lo = ymi; if (yma > hi) hi = yma;
    }
    raw(Math.max(a, j1 * sz), b);
    return [lo, hi];
  }

  /** Ancho de un texto con caché (measureText es caro si se llama cientos de veces por fotograma). */
  _mw(t) {
    const m = this._mwc || (this._mwc = new Map());
    const k = this.ctx.font + '\u0000' + t;
    let w = m.get(k);
    if (w === undefined) { if (m.size > 3000) m.clear(); w = this.ctx.measureText(t).width; m.set(k, w); }
    return w;
  }

  /* ---------- Render ---------- */
  _render() {
    const c = this.$canvas, ctx = this.ctx;
    const W = c._w, H = c._h;
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.font = `11px ${this._colors.font}`;
    this._now = performance.now();
    if (this._loading) { this._renderLoading(W, H); return; }
    if (this._error) { this._renderError(W, H); return; }
    if (this._enterPending) return; // aún no ha empezado la entrada: no mostrar el estado final
    this._morphK = this._morph ? this._ease('easeInOut')(clamp((this._now - this._morph.t0) / this._morph.dur, 0, 1)) : 1;
    if (this._isPie) { this._renderPie(W, H); return; }

    let r;
    if (this._multi) r = this._renderAxesMulti(W, H);
    else {
    // Eje Y animado suavemente hacia su objetivo (se adapta al zoom y a las series visibles).
    const target = this._yTarget();
    const dt = Math.min(64, this._now - (this._lastT || this._now)); this._lastT = this._now;
    if (!this._yCur || !this._animOn || this._enter) this._yCur = target.slice();
    else {
      const k = 1 - Math.exp(-dt / 55); let moving = false;
      for (let i = 0; i < 2; i++) {
        const d = target[i] - this._yCur[i];
        if (Math.abs(d) > (target[1] - target[0]) * 0.002) { this._yCur[i] += d * k; moving = true; } else this._yCur[i] = target[i];
      }
      if (moving) this.invalidate();
    }
    const [ya, yb] = this._yCur;
    const yCount = Math.max(2, Math.floor(H / 56));
    const yStep = niceStep(target[1] - target[0], yCount);
    const yTicks = [];
    for (let v = Math.ceil(ya / yStep) * yStep; v <= yb + yStep * 1e-6; v += yStep) yTicks.push(Math.abs(v) < yStep * 1e-9 ? 0 : v);
    const yLabels = yTicks.map((v) => this._fmtYTick(v, yStep));
    // El ancho del eje usa la etiqueta más larga del dominio objetivo, así no "tiembla" durante la animación.
    const yW = Math.max(18, ...yLabels.map((l) => this._mw(l)), this._mw(this._fmtYTick(target[0], yStep)), this._mw(this._fmtYTick(target[1], yStep)));
    r = this._plotRect = { x: yW + 10, y: 10, w: Math.max(10, W - yW - 10 - 8), h: Math.max(10, H - 10 - 26) };

    const C = this._colors;
    // Rejilla + etiquetas Y
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const G = this.opts.grid || {}, AX = this.opts.axis || {};
    const showY = AX.y !== false;
    if (!showY) { r.x = 8; r.w = Math.max(10, W - 16); }
    const axisIn = this._enter ? clamp((this._now - this._enter.t0) / 300, 0, 1) : 1; // ejes aparecen con un fundido breve
    ctx.globalAlpha = axisIn;
    yTicks.forEach((v, i) => {
      const y = Math.round(this._sy(v)) + 0.5;
      if (y < r.y - 4 || y > r.y + r.h + 4) return;
      if (G.show !== false || v === 0) {
        ctx.strokeStyle = v === 0 ? C.axis : C.grid; ctx.lineWidth = 1;
        ctx.setLineDash(G.dashed && v !== 0 ? [4, 4] : []);
        ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (showY) { ctx.fillStyle = C.muted; ctx.fillText(yLabels[i], r.x - 8, y); }
    });
    // Línea base inferior
    ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h + 0.5); ctx.lineTo(r.x + r.w, r.y + r.h + 0.5); ctx.stroke();
    if (AX.x !== false) this._renderXAxis(W, H);
    ctx.globalAlpha = 1;
    }

    // Series (recortadas al área de dibujo + animación de entrada)
    const A = this._anim;
    const enterType = this._enter ? A.enter : null;
    this._baseVal = clamp(0, this._yCur[0], this._yCur[1]);
    const M = this._multi, on = (s) => { if (M) this._useAxis(s.axis); return s; }; // cada serie, en su eje
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, 0, enterType === "draw" ? r.w * this._p(0) : r.w, H);
    ctx.clip();
    if (enterType === 'fade') ctx.globalAlpha = this._p(0);
    const vis = this._visibleSeries();
    const bars = vis.filter((s) => s.type === 'bar');
    // Las barras apiladas del mismo grupo comparten hueco; las demás van una al lado de otra.
    const slots = new Map();
    bars.forEach((s) => { const k = s.stackKey || s.key; if (!slots.has(k)) slots.set(k, slots.size); });
    bars.forEach((s) => this._drawBars(on(s), slots.get(s.stackKey || s.key), slots.size));
    vis.filter((s) => s.type === 'area').forEach((s) => this._drawLine(on(s), true));
    vis.filter((s) => s.type === 'line').forEach((s) => this._drawLine(on(s), false));
    vis.filter((s) => s.type === 'scatter').forEach((s) => this._drawScatter(on(s)));
    ctx.restore();
    if (M && this._primary) this._useAxis(this._primary);

    this._drawInspect();
    if (!this.$nav.hidden) this._renderNav();
    if (!this.$range.hidden) this._updateRange();
    if (!this.$insp.hidden) this._updateInspector();
    if (this._pendingSel != null && !this._enter) { const x = this._pendingSel; this._pendingSel = null; this.select(x); }
  }

  /** Rango visible (inicio – fin) junto al botón de restablecer. */
  _updateRange() {
    const [a, b] = this._view;
    // Si la plantilla de fecha no distingue un rango tan corto (p. ej. 'MM/dd HH:mm' con 90 s), se usa el formato automático con segundos.
    const pat = this._xType === 'time' && (typeof this.opts.tooltip.dateFormat === 'string' ? this.opts.tooltip.dateFormat : typeof this.opts.x.format === 'string' ? this.opts.x.format : null);
    const auto = pat && dateRes(pat) * 4 > b - a;
    const f = (x) => this._xType === 'category' ? (this._cats[clamp(Math.round(x), 0, this._cats.length - 1)] ?? '')
      : auto ? this._df({ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(x) : this._fmtXFull(x);
    const txt = this._xType === 'category' ? `${f(Math.ceil(a))} – ${f(Math.floor(b))}` : `${f(a)} – ${f(b)}`;
    if (txt !== this._rangeTxt) { this._rangeTxt = txt; this.$rangeT.textContent = txt; }
  }

  /** Panel de valores bajo el gráfico: la selección o, sin ella, el último dato. */
  _updateInspector() {
    let ins = this._inspect;
    if (!ins) {
      let lx = -Infinity;
      this._visibleSeries().forEach((s) => { for (let i = s.points.length - 1; i >= 0; i--) if (s.points[i].y != null) { if (s.points[i].x > lx) lx = s.points[i].x; break; } });
      ins = isFinite(lx) ? this._rowsAt(lx, this._visibleSeries()) : null;
    }
    const key = (ins ? ins.id : '-') + '|' + this._dataVer + '|' + [...this._hidden].join(',') + '|' + this._theme;
    if (key === this._inspKey) return;
    this._inspKey = key;
    if (!ins) { this.$insp.innerHTML = `<div class="pc-insp-h">${esc(this.t.tapHint)}</div>`; return; }
    const byKey = new Map(ins.rows.map((r) => [r.s.key, r]));
    const rows = this._visibleSeries().map((s) => {
      const r = byKey.get(s.key);
      return `<div class="pc-tip-r"><span class="pc-dot" style="background:${s.color}"></span><span class="pc-tip-n">${esc(s.name)}</span><span class="pc-tip-v">${esc(r ? this._fmtY(r.q.v, s) : '–')}</span></div>`;
    }).join('');
    this.$insp.innerHTML = `<div class="pc-insp-h">${esc(this._fmtXFull(ins.x))}</div><div class="pc-insp-g">${rows}</div>`;
  }

  _renderXAxis(W, H) {
    const ctx = this.ctx, r = this._plotRect, C = this._colors;
    const [v0, v1] = this._view;
    const ticks = [];
    if (this._xType === 'time') {
      // x.format como plantilla ('MM/dd HH:mm'): se usa mientras el paso lo permita; al acercar más
      // se pasa solo a HH:mm o HH:mm:ss para que no haya etiquetas repetidas o ambiguas.
      const pat = typeof this.opts.x.format === 'string' ? this.opts.x.format : null;
      const ms = (s) => (typeof s === 'number' ? s : s[0] === 'M' ? +s.slice(1) * 2592e6 : +s.slice(1) * 31536e6);
      const sample = pat ? fmtDate(new Date(2026, 9, 28, 23, 59, 59).getTime(), pat, this._locale) : this._df({ day: 'numeric', month: 'short' }).format(Date.UTC(2026, 8, 28));
      const lw = this._mw(sample) + 18;
      const pxPerMs = r.w / (v1 - v0);
      // Ancho real de la etiqueta según el paso (con segundos es más larga): así caben al menos dos.
      const ref = new Date(2026, 9, 28, 23, 59, 59).getTime();
      const lwSec = this._mw(this._df({ hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(ref)) + 14;
      const lwMin = this._mw(this._df({ hour: '2-digit', minute: '2-digit' }).format(ref)) + 14;
      const need = (s) => (pat ? lw : ms(s) < 6e4 ? lwSec : ms(s) < 864e5 ? Math.max(lwMin, lw - 4) : lw);
      let step = TIME_STEPS.find((s) => ms(s) * pxPerMs >= need(s)) || 'Y10';
      if (pat && ms(step) < dateRes(pat)) { // la plantilla no distingue ese paso: etiquetas automáticas (más cortas)
        const lw2 = this._mw('00:00:00') + 18;
        step = TIME_STEPS.find((s) => ms(s) * pxPerMs >= lw2) || 'Y10';
      }
      const tk = this._timeTicks(v0, v1, step);
      if (pat && ms(step) >= dateRes(pat)) tk.forEach((t) => { t.label = fmtDate(t.v, pat, this._locale); t.strong = false; });
      ticks.push(...tk);
    } else if (this._xType === 'category') {
      const band = r.w / (v1 - v0);
      if (this._catW == null) this._catW = Math.max(10, ...this._cats.map((c) => this._mw(String(c))));
      const lw = Math.min(90, this._catW) + 12;
      const k = Math.max(1, Math.ceil(lw / band));
      for (let i = Math.max(0, Math.ceil(v0)); i <= Math.min(this._cats.length - 1, Math.floor(v1)); i++) {
        if (i % k === 0) ticks.push({ v: i, label: this._fitText(String(this._cats[i]), band * k - 8) });
      }
      if (!this._cats.length) for (let i = Math.ceil(v0); i <= v1; i++) if (i % k === 0) ticks.push({ v: i, label: String(i + 1) });
    } else {
      const lw = this._mw(this._nf(2).format(v1)) + 22;
      const step = niceStep(v1 - v0, Math.max(2, Math.floor(r.w / lw)));
      for (let v = Math.ceil(v0 / step) * step; v <= v1; v += step) ticks.push({ v, label: this.opts.x.format ? this.opts.x.format(v, 'tick') : this._fmtTick(v, step) });
    }
    ctx.textBaseline = 'top'; ctx.fillStyle = C.muted;
    let lastRight = -Infinity;
    ticks.forEach((t) => {
      const x = this._sx(t.v);
      if (x < r.x - 1 || x > r.x + r.w + 1) return;
      ctx.font = `${t.strong ? 600 : 400} 11px ${C.font}`;
      const w = this._mw(t.label);
      // Nunca cortar etiquetas en los bordes: se desplazan hacia dentro.
      const cx = clamp(x, w / 2 + 2, W - w / 2 - 2);
      if (cx - w / 2 < lastRight + 6) return;
      ctx.font = `${t.strong ? 600 : 400} 11px ${C.font}`;
      ctx.fillStyle = t.strong ? C.fg : C.muted;
      ctx.textAlign = 'center';
      ctx.fillText(t.label, cx, r.y + r.h + 8);
      lastRight = cx + w / 2;
    });
    ctx.font = `11px ${C.font}`;
  }

  _fitText(s, max) {
    if (this._mw(s) <= max) return s;
    while (s.length > 1 && this._mw(s + '…') > max) s = s.slice(0, -1);
    return s + '…';
  }

  _timeTicks(v0, v1, step) {
    const out = [];
    const lc = this._tlc || (this._tlc = new Map());
    if (lc.size > 4000) lc.clear();
    const dfRaw = (o) => this._df(o);
    // Las etiquetas de fecha se formatean una vez y se reutilizan mientras se arrastra.
    const df = (o) => ({ format: (t) => { const k = Object.keys(o).join(',') + (+t); let v = lc.get(k); if (v === undefined) { v = dfRaw(o).format(t); lc.set(k, v); } return v; } });
    if (typeof step === 'number') {
      if (step < 864e5) {
        const off = (t) => -new Date(t).getTimezoneOffset() * 6e4;
        let t = Math.ceil((v0 + off(v0)) / step) * step - off(v0);
        for (let n = 0; t <= v1 && n < 500; t += step, n++) {
          const d = new Date(t), mid = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
          const label = mid ? df({ day: 'numeric', month: 'short' }).format(t)
            : df(step < 6e4 ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : { hour: '2-digit', minute: '2-digit' }).format(t);
          out.push({ v: t, label, strong: mid });
        }
        // Sin medianoche a la vista, la primera etiqueta lleva también el día (si no, "08:00" no dice de qué día es).
        if (out.length && !out.some((o) => o.strong) && !this._rangeOn) { // con zoom, el día ya va en la barra de rango
          out[0].label = df(step < 6e4 ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(out[0].v);
          out[0].strong = true;
        }
      } else {
        const days = Math.round(step / 864e5);
        const d = new Date(v0); d.setHours(0, 0, 0, 0);
        if (days === 7 || days === 14) { while (d.getDay() !== 1) d.setDate(d.getDate() + 1); } // lunes
        else if (days > 1) { while ((d.getDate() - 1) % days) d.setDate(d.getDate() + 1); }
        for (let n = 0; d.getTime() <= v1 && n < 500; n++) {
          if (d.getTime() >= v0) {
            const first = d.getDate() === 1;
            const jan = first && d.getMonth() === 0; // el 1 de enero muestra el año
            out.push({ v: d.getTime(), label: jan ? String(d.getFullYear()) : first ? df({ month: 'short' }).format(d) : df({ day: 'numeric', month: 'short' }).format(d), strong: first });
          }
          d.setDate(d.getDate() + days);
        }
      }
    } else {
      const k = +step.slice(1), months = step[0] === 'M' ? k : k * 12;
      const d = new Date(v0); d.setHours(0, 0, 0, 0); d.setDate(1);
      while ((d.getFullYear() * 12 + d.getMonth()) % months) d.setMonth(d.getMonth() + 1);
      for (let n = 0; d.getTime() <= v1 && n < 500; n++) {
        if (d.getTime() >= v0) {
          const jan = d.getMonth() === 0;
          out.push({ v: d.getTime(), label: jan || months >= 12 ? String(d.getFullYear()) : df({ month: 'short' }).format(d), strong: jan && months < 12 });
        }
        d.setMonth(d.getMonth() + months);
      }
    }
    return out;
  }

  /** Valor Y que se dibuja: aplica la transición de datos y la entrada (grow / wave / pop). */
  _ay(q, px) {
    let y = this._v(q);
    if (y == null) return null;
    const t = this._enter && this._anim.enter;
    if (t === 'grow' || t === 'wave' || t === 'pop') {
      const r = this._plotRect, f = t === 'grow' ? 0 : (px - r.x) / r.w;
      y = this._baseVal + (y - this._baseVal) * this._p(f);
    }
    return y;
  }

  /** Puntos visibles en píxeles, con reducción min/máx por columna cuando hay demasiados. */
  _pixelPoints(s) {
    const p = s.points, [v0, v1] = this._view, r = this._plotRect;
    const a = Math.max(0, lowerBound(p, v0) - 1), b = Math.min(p.length, lowerBound(p, v1) + 1);
    // Transformaciones en línea (más rápidas que llamar a _sx/_sy por punto)
    const kx = r.w / (v1 - v0), ox = r.x - v0 * kx;
    const ya = this._yCur[0], ky = r.h / (this._yCur[1] - ya), oy = r.y + r.h;
    const anim = !!(this._enter || this._morph);
    const segs = []; let cur = [];
    const n = b - a, dense = n > r.w * 1.5;
    const push = (q) => { const px = q.x * kx + ox; const y = anim ? this._ay(q, px) : q.y; cur.push([px, oy - (y - ya) * ky, q]); };
    if (!dense) {
      for (let i = a; i < b; i++) {
        if (p[i].y == null) { if (cur.length) segs.push(cur); cur = []; continue; }
        push(p[i]);
      }
      if (cur.length) segs.push(cur);
      return { segs, dense };
    }
    // Reducción min/máx por columna de píxel. Con series enormes se parte de la pirámide
    // (unos 4 grupos por píxel) en vez de recorrer todos los puntos.
    let col = -1, bf = null, bmin = null, bmax = null, bl = null;
    const flush = () => {
      if (!bf) return;
      const lo = bmin.x <= bmax.x ? bmin : bmax, hi = lo === bmin ? bmax : bmin;
      push(bf);
      if (lo !== bf) push(lo);
      if (hi !== lo && hi !== bf) push(hi);
      if (bl !== hi && bl !== lo && bl !== bf) push(bl);
      bf = null;
    };
    const feed = (q) => {
      const c = (q.x * kx + ox) | 0;
      if (c !== col || !bf) { flush(); col = c; bf = bmin = bmax = bl = q; }
      else { if (q.y < bmin.y) bmin = q; if (q.y > bmax.y) bmax = q; bl = q; }
    };
    const gap = () => { flush(); col = -1; if (cur.length) segs.push(cur); cur = []; };
    const pyr = this._pyr(s);
    let lv = null;
    if (pyr) for (const L of pyr) { if (n / L.size >= r.w * 4) lv = L; else break; }
    if (!lv) {
      for (let i = a; i < b; i++) { const q = p[i]; if (q.y == null) gap(); else feed(q); }
    } else {
      const sz = lv.size, j1 = Math.ceil(b / sz);
      for (let j = Math.floor(a / sz); j < j1; j++) {
        const mi = lv.mins[j], ma = lv.maxs[j];
        if (mi < 0) { gap(); continue; }
        if (mi <= ma) { feed(p[mi]); if (ma !== mi) feed(p[ma]); } else { feed(p[ma]); feed(p[mi]); }
        if (lv.gap[j] && lv.size <= 64) gap();
      }
    }
    flush(); if (cur.length) segs.push(cur);
    return { segs, dense };
  }


  _tracePath(seg, curve, moveFirst = true) {
    const ctx = this.ctx;
    if (curve === 'smooth') return monotonePath(ctx, seg, moveFirst);
    seg.forEach((q, i) => {
      if (i === 0) { if (moveFirst) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); return; }
      if (curve === 'step') { const mx = (seg[i - 1][0] + q[0]) / 2; ctx.lineTo(mx, seg[i - 1][1]); ctx.lineTo(mx, q[1]); }
      ctx.lineTo(q[0], q[1]);
    });
  }

  _drawLine(s, area) {
    const ctx = this.ctx, r = this._plotRect, o = this.opts;
    const { segs, dense } = this._pixelPoints(s);
    const curve = dense ? 'linear' : s.curve;
    const base = this._sy(this._baseVal);
    const lw = s.lineWidth ?? o.line.width ?? 2;
    segs.forEach((seg) => {
      if (area) {
        const op = s.fillOpacity ?? o.area.opacity ?? 0.28;
        if (s.stackKey) {
          // Banda entre esta serie y la de debajo (relleno uniforme para que se lean las capas).
          const low = seg.map((q) => [q[0], q[2].below ? this._sy(this._enter || this._morph ? this._ay(q[2].below, q[0]) : q[2].below.y) : base]).reverse();
          ctx.beginPath();
          ctx.moveTo(seg[0][0], seg[0][1]);
          this._tracePath(seg, curve, false);
          this._tracePath(low, curve, false);
          ctx.closePath();
          ctx.fillStyle = this._alpha(s.color, Math.min(1, op * 2)); ctx.fill();
        } else {
        const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
        g.addColorStop(0, this._alpha(s.color, op)); g.addColorStop(1, this._alpha(s.color, op * 0.08));
        ctx.beginPath();
        ctx.moveTo(seg[0][0], base); ctx.lineTo(seg[0][0], seg[0][1]);
        this._tracePath(seg, curve, false);
        ctx.lineTo(seg[seg.length - 1][0], base); ctx.closePath();
        ctx.fillStyle = g; ctx.fill();
        }
      }
      if (lw <= 0) return;
      ctx.beginPath();
      this._tracePath(seg, curve);
      ctx.setLineDash(s.dash || o.line.dash || []);
      ctx.strokeStyle = s.color; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.setLineDash([]);
    });
    // Marcadores: automáticos cuando hay espacio de sobra, o forzados por opción.
    const M = { ...o.markers, ...(s.markers || {}) };
    const total = segs.reduce((n, sg) => n + sg.length, 0);
    // Las líneas punteadas (consignas, setpoints) no llevan marcadores salvo que se pidan.
    const dashed = (s.dash || o.line.dash || []).length > 0;
    const show = M.show === true || (M.show === 'auto' && !dashed && !dense && total && r.w / total > 14);
    if (show && !dense) segs.forEach((seg) => seg.forEach((q) => this._marker(q[0], q[1], (M.size ?? 3.5) * this._popScale(q[0]), s.color, 2, M.shape)));
  }

  /** Escala extra de marcadores durante la entrada "pop". */
  _popScale(px) {
    if (!this._enter || this._anim.enter !== 'pop') return 1;
    const r = this._plotRect; return Math.max(0, this._p((px - r.x) / r.w));
  }

  _drawScatter(s) {
    const { segs } = this._pixelPoints(s);
    const M = { ...this.opts.markers, ...(s.markers || {}) };
    const t = this._enter && this._anim.enter;
    const total = segs.reduce((k, sg) => k + sg.length, 0);
    if (total > 1500 && !t) {
      // Muchos puntos: un solo trazado sin anillo (mucho más rápido)
      const ctx = this.ctx, rad = Math.max(1.5, Math.min(3, M.size ?? 3));
      ctx.beginPath();
      segs.forEach((seg) => seg.forEach((q) => { ctx.moveTo(q[0] + rad, q[1]); ctx.arc(q[0], q[1], rad, 0, Math.PI * 2); }));
      ctx.fillStyle = this._alpha(s.color, 0.7); ctx.fill();
      return;
    }
    segs.forEach((seg) => seg.forEach((q) => {
      let k = 1;
      if (t === 'pop' || t === 'wave' || t === 'grow') k = Math.max(0, this._p(t === 'grow' ? 0 : (q[0] - this._plotRect.x) / this._plotRect.w));
      // en scatter, crecer = aparecer en su sitio (no desde la base)
      const y = t === 'grow' || t === 'wave' || t === 'pop' ? this._sy(this._v(q[2])) : q[1];
      this._marker(q[0], y, (q[2].r || Math.max(4, M.size ?? 4)) * k, this._alpha(s.color, 0.85), 1.5, M.shape);
    }));
  }

  _drawBars(s, bi, nb) {
    const ctx = this.ctx, r = this._plotRect, B = this.opts.bar || {};
    const unit = this._xType === 'category' ? 1 : this._barDx || this._minDx;
    const band = unit / (this._view[1] - this._view[0]) * r.w;
    const frac = B.padding != null ? clamp(1 - B.padding, 0.05, 1) : (B.width ?? 0.7) * (nb > 1 ? 1.12 : 1);
    const group = band * Math.min(frac, 1);
    const gap = nb > 1 ? 2 : 0;
    const bw = Math.max(1, group / nb - gap);
    const base = this._sy(this._baseVal);
    const p = s.points, [v0, v1] = this._view;
    const a = Math.max(0, lowerBound(p, v0 - unit) - 1), b = Math.min(p.length, lowerBound(p, v1 + unit) + 1);
    ctx.fillStyle = s.color;
    const hl = this._inspect && this._inspect.x;
    const R = s.radius ?? B.radius ?? 4;
    for (let i = a; i < b; i++) {
      const q = p[i]; if (q.y == null) continue;
      const cx = this._sx(q.x);
      const x = cx - group / 2 + bi * (bw + gap) + gap / 2;
      const val = this._ay(q, cx), bv = q.below ? this._ay(q.below, cx) : this._baseVal;
      const y = this._sy(val), yb = q.below ? this._sy(bv) : base;
      let top = Math.min(y, yb), h = Math.abs(yb - y);
      if (h < 0.5) continue;
      if (q.below && h > 2.5) { h -= 1; if (val < bv) top += 1; } // fina separación entre segmentos
      ctx.globalAlpha = (hl != null && hl !== q.x ? 0.45 : 1) * (this._enter && this._anim.enter === 'fade' ? this._p(0) : 1);
      const rad = s.stackKey && !q.edge ? 0 : Math.min(R, bw / 2, h);
      ctx.beginPath();
      if (ctx.roundRect && rad > 0) ctx.roundRect(x, top, bw, h, val >= bv ? [rad, rad, 0, 0] : [0, 0, rad, rad]); else ctx.rect(x, top, bw, h);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _dot(x, y, rad, color, ring = 2) { this._marker(x, y, rad, color, ring, 'circle'); }

  _marker(x, y, rad, color, ring = 2, shape = 'circle') {
    if (rad <= 0.2) return;
    const ctx = this.ctx;
    const path = (rr) => {
      ctx.beginPath();
      if (shape === 'square') ctx.rect(x - rr, y - rr, rr * 2, rr * 2);
      else if (shape === 'diamond') { ctx.moveTo(x, y - rr * 1.25); ctx.lineTo(x + rr * 1.25, y); ctx.lineTo(x, y + rr * 1.25); ctx.lineTo(x - rr * 1.25, y); ctx.closePath(); }
      else ctx.arc(x, y, rr, 0, Math.PI * 2);
    };
    path(rad + ring); ctx.fillStyle = this._colors.bg; ctx.fill();
    path(rad); ctx.fillStyle = color; ctx.fill();
  }

  _alpha(hex, a) {
    const m = /^#?([0-9a-f]{6})$/i.exec(toHex(String(hex)).trim());
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ---------- Inspección ---------- */
  _hitTest(px, py) {
    if (this._isPie) { const i = this._sliceAt(px, py); return i < 0 ? null : { id: 'p' + i }; }
    const r = this._plotRect; if (!r) return null;
    if (px < r.x - 20 || px > r.x + r.w + 20 || py > r.y + r.h + 24) return null;
    const vis = this._visibleSeries();
    const ref = this._refSeries(); if (!ref) return null;
    if (vis.every((s) => s.type === 'scatter')) {
      let best = null, bd = 44 * 44;
      vis.forEach((s) => (this._multi && this._useAxis(s.axis), s).points.forEach((q) => {
        if (q.y == null || q.x < this._view[0] || q.x > this._view[1]) return;
        const d = (this._sx(q.x) - px) ** 2 + (this._sy(q.y) - py) ** 2;
        if (d < bd) { bd = d; best = { s, q }; }
      }));
      if (this._multi && this._primary) this._useAxis(this._primary);
      return best && { id: best.s.key + ':' + best.q.i, x: best.q.x, rows: [{ s: best.s, q: best.q }], scatter: true };
    }
    // Series con distinta cantidad de puntos y fechas desiguales: se elige la fecha más cercana
    // entre todas las series visibles, y cada serie aporta su punto si está a menos de medio paso propio.
    const tx = clamp(this._invX(px), this._view[0], this._view[1]);
    let x = null, bd = Infinity;
    vis.forEach((s) => {
      if (s.type === 'scatter') return;
      const j = nearestIndex(s.points, tx); if (j < 0) return;
      const q = s.points[j]; if (q.y == null && s.points.length > 1) return;
      const d = Math.abs(q.x - tx); if (d < bd) { bd = d; x = q.x; }
    });
    if (x == null) { const i = nearestIndex(ref.points, tx); if (i < 0) return null; x = ref.points[i].x; }
    return this._rowsAt(x, vis);
  }

  /** Selección en la fecha `x` exacta de un punto (o la más cercana). */
  _hitAtX(tx) {
    const vis = this._visibleSeries();
    let x = null, bd = Infinity;
    vis.forEach((s) => { const j = nearestIndex(s.points, tx); if (j < 0) return; const d = Math.abs(s.points[j].x - tx); if (d < bd) { bd = d; x = s.points[j].x; } });
    return x == null ? null : this._rowsAt(x, vis);
  }

  _rowsAt(x, vis) {
    const rows = vis.map((s) => {
      const j = nearestIndex(s.points, x); const q = s.points[j];
      const tol = Math.max(this._minDx, Math.min(s._dx || this._minDx, (this._view[1] - this._view[0]) / 4)) / 2;
      return q && Math.abs(q.x - x) <= tol + 1e-9 ? { s, q } : null;
    }).filter(Boolean);
    return { id: 'x' + x, x, rows };
  }

  _inspectAt(px, py, touch) {
    if (this._isPie) { const i = this._sliceAt(px, py); if (i >= 0) this._selectSlice(i, touch); else this._clearInspect(); return; }
    const hit = this._hitTest(px, py);
    if (!hit) return;
    this._applyInspect(hit, py, touch);
  }

  _applyInspect(hit, py, touch) {
    const changed = !this._inspect || this._inspect.id !== hit.id;
    this._inspect = { ...hit, py, touch };
    if (changed) { if (touch) navigator.vibrate?.(3); this._emit('inspect', { x: hit.x, label: this._fmtXFull(hit.x), points: hit.rows.map((r) => ({ series: r.s.name, id: r.s.key, x: r.q.x, y: r.q.v, data: r.q.raw, color: r.s.color, formatted: this._fmtY(r.q.v, r.s), ...(this._multi ? { unit: r.s.unit, yAxis: { id: r.s.yAxisOpt && r.s.yAxisOpt.id != null ? r.s.yAxisOpt.id : null, min: r.s.axis.cur ? r.s.axis.cur[0] : r.s.axis.min, max: r.s.axis.cur ? r.s.axis.cur[1] : r.s.axis.max, opposite: r.s.axis.opposite } } : {}) })) }); }
    this.invalidate();
  }

  _refreshInspect() {
    const i = this._inspect; if (!i || this._isPie) return;
    if (i.x < this._view[0] || i.x > this._view[1]) this._clearInspect();
  }

  _clearInspect() {
    if (!this._inspect) return;
    this._inspect = null; this._chipFor = null;
    this.$tip.classList.remove('pc-on');
    this.$legend.querySelectorAll('.pc-chip-val').forEach((e) => (e.textContent = ''));
    this._emit('inspect', null);
    this.invalidate();
  }

  _drawInspect() {
    const ins = this._inspect;
    if (!ins) return;
    const ctx = this.ctx, r = this._plotRect, C = this._colors;
    const x = this._sx(ins.x);
    if (!ins.scatter) {
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, r.y); ctx.lineTo(Math.round(x) + 0.5, r.y + r.h); ctx.stroke(); ctx.restore();
    }
    let top = Infinity;
    ins.rows.forEach(({ s, q }) => {
      if (q.y == null) return;
      if (this._multi) this._useAxis(s.axis);
      const y = this._sy(this._v(q));
      top = Math.min(top, y);
      if (s.type !== 'bar') this._dot(this._sx(q.x), y, 5, s.color, 2.5);
    });
    if (this._multi && this._primary) this._useAxis(this._primary);
    // Valores en vivo dentro de los chips de la leyenda (sólo cuando cambia el punto: tocar el DOM es caro)
    if (this._chipFor !== ins.id) {
      this._chipFor = ins.id;
      const byKey = new Map(ins.rows.map((rw) => [rw.s.key, rw]));
      this.$legend.querySelectorAll('.pc-chip').forEach((b) => {
        const rw = byKey.get(b.dataset.key);
        const el = b.querySelector('.pc-chip-val'), v = rw ? this._fmtY(rw.q.v, rw.s) : '';
        if (el.textContent !== v) el.textContent = v;
      });
    }
    const TS = this.opts.tooltip.show;
    if (TS === true || (TS !== false && this.opts.inspector !== 'bottom')) this._placeTip(this._tipHtml(ins), x, isFinite(top) ? top : r.y + r.h / 2, ins.touch ? ins.py : null);
  }

  /** Valores de una selección para plantillas: total, porcentaje y textos ya formateados. */
  _tipVars(ins) {
    const rows = ins.rows.filter((r) => r.q.v != null);
    const st = rows.filter((r) => r.s.stackKey);
    const grp = st.length > 1 ? st : rows;
    const total = grp.reduce((n, r) => n + r.q.v, 0);
    const ref = grp[0] && grp[0].s;
    const totalTxt = ref ? this._fmtY(total, { ...ref, unit: '' }) : '';
    return { total, totalTxt, unit: ref ? ref.unit : '', x: this._fmtXFull(ins.x), sumAbs: grp.reduce((n, r) => n + Math.abs(r.q.v), 0) };
  }
  _fill(tpl, vars) { return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : '')); }

  _tipHtml(ins) {
    const T = this.opts.tooltip || {};
    const f = typeof T.format === 'function' ? T.format : null;
    if (T.template || T.header || T.footer) return this._tipTemplate(ins, T);
    if (f) return f({ x: ins.x, label: this._fmtXFull(ins.x), points: ins.rows.map((r) => ({ series: r.s.name, color: r.s.color, x: r.q.x, y: r.q.v, data: r.q.raw, share: r.s.stackKey && this._pct ? r.q.y - (r.q.below ? r.q.below.y : 0) : undefined })) });
    const head = ins.scatter ? `${esc(ins.rows[0].s.name)}` : esc(this._fmtXFull(ins.x));
    // Con series apiladas, el orden del tooltip sigue al dibujo: la capa de arriba, primero.
    const list = !ins.scatter && this._stacked && ins.rows.every((r) => r.s.stackKey) ? ins.rows.slice().reverse() : ins.rows;
    const rows = list.map(({ s, q }) => `<div class="pc-tip-r"><span class="pc-dot" style="background:${s.color}"></span><span class="pc-tip-n">${esc(ins.scatter ? (q.label ?? `x ${this._nf(2).format(q.x)}`) : s.name)}</span><span class="pc-tip-v">${esc(this._fmtY(q.v, s))}${s.stackKey && this._pct && q.v != null ? ` <span class="pc-tip-n">· ${this._nf(1).format(q.y - (q.below ? q.below.y : 0))} %</span>` : ''}</span></div>`).join('');
    // Total de las series apiladas en ese punto
    const st = ins.scatter ? [] : ins.rows.filter((r) => r.s.stackKey && r.q.v != null);
    const total = st.length > 1 ? `<div class="pc-tip-r pc-tip-t"><span class="pc-tip-n">${esc(this.t.total)}</span><span class="pc-tip-v">${esc(this._fmtY(st.reduce((n, r) => n + r.q.v, 0), st[0].s))}</span></div>` : '';
    return `<div class="pc-tip-h">${head}</div>${rows}${total}`;
  }

  /** Tooltip con plantillas de texto: {x}, {series}, {value}, {unit}, {total}, {percent}. */
  _tipTemplate(ins, T) {
    const V = this._tipVars(ins);
    const head = T.header ? this._fill(T.header, { x: V.x, total: V.totalTxt, unit: V.unit }) : ins.scatter ? ins.rows[0].s.name : V.x;
    const list = !ins.scatter && this._stacked && ins.rows.every((r) => r.s.stackKey) ? ins.rows.slice().reverse() : ins.rows;
    const tpl = T.template || '{series}|{value} {unit}';
    const rows = list.map(({ s, q }) => {
      const vars = { x: V.x, series: s.name, value: q.v == null ? '–' : this._fmtY(q.v, { ...s, unit: '' }), unit: q.v == null ? '' : s.unit, total: V.totalTxt,
        percent: q.v == null || !V.sumAbs ? '' : this._nf(1).format(Math.abs(q.v) / V.sumAbs * 100) + '%' };
      const txt = this._fill(tpl, vars).replace(/\s+$/, '');
      const cut = txt.indexOf('|'); // "nombre|valor" separa en dos columnas
      const body = cut >= 0 ? `<span class="pc-tip-n">${esc(txt.slice(0, cut))}</span><span class="pc-tip-v">${esc(txt.slice(cut + 1).trim())}</span>` : `<span class="pc-tip-n" style="color:inherit">${esc(txt)}</span>`;
      return `<div class="pc-tip-r"><span class="pc-dot" style="background:${s.color}"></span>${body}</div>`;
    }).join('');
    const showTotal = T.footer || (ins.rows.filter((r) => r.s.stackKey && r.q.v != null).length > 1);
    const foot = showTotal ? (() => {
      const txt = this._fill(T.footer || `${this.t.total}|{total} {unit}`, { x: V.x, total: V.totalTxt, unit: V.unit }).replace(/\s+$/, ''), cut = txt.indexOf('|');
      return `<div class="pc-tip-r pc-tip-t">${cut >= 0 ? `<span class="pc-tip-n">${esc(txt.slice(0, cut))}</span><span class="pc-tip-v">${esc(txt.slice(cut + 1).trim())}</span>` : `<span class="pc-tip-n" style="color:inherit">${esc(txt)}</span>`}</div>`;
    })() : '';
    return `<div class="pc-tip-h">${esc(head)}</div>${rows}${foot}`;
  }

  /** Coloca el tooltip junto al punto, por encima del dedo, sin salirse del gráfico. */
  _placeTip(html, ax, ay, fingerY) {
    const tip = this.$tip;
    // Sólo se mide cuando cambia el contenido; moverlo usa transform (no provoca layout).
    if (tip._html !== html) { tip.innerHTML = html; tip._html = html; tip._tw = tip.offsetWidth; tip._th = tip.offsetHeight; }
    const W = this.$canvas._w, H = this.$canvas._h;
    const tw = tip._tw, th = tip._th;
    const lift = fingerY != null ? 56 : 14; // deja libre la zona que tapa el dedo
    const anchorTop = Math.min(ay, fingerY != null ? fingerY : ay);
    let top = anchorTop - th - lift, left;
    if (top >= 2) left = ax - tw / 2;
    else {
      // No cabe arriba: va a un lado del punto, hacia donde hay más espacio.
      top = clamp(ay - th / 2, 2, H - th - 2);
      left = ax > W / 2 ? ax - tw - 22 : ax + 22;
    }
    left = clamp(left, 2, Math.max(2, W - tw - 2));
    const tf = `translate3d(${Math.round(left)}px,${Math.round(top)}px,0)`;
    if (tip._tf !== tf) { tip.style.transform = tf; tip._tf = tf; }
    if (!tip.classList.contains('pc-on')) tip.classList.add('pc-on');
  }

  /* ---------- Estados de carga y error ---------- */
  _renderLoading(W, H) {
    const ctx = this.ctx, C = this._colors, L = this._loading;
    const t = this._now - L.t0;
    const accent = L.color || this._color(0);
    const type = L.type || 'skeleton';
    const text = L.text === undefined || L.text === null ? (type === 'skeleton' || type === 'pulse' ? '' : this.t.loading) : L.text;
    const kind = this._isPie ? 'pie' : normType(this.opts.type) === 'bar' ? 'bar' : this.opts.type === 'scatter' ? 'scatter' : 'line';
    // Silueta genérica del gráfico (para skeleton y pulse)
    const ghost = () => {
      ctx.beginPath();
      if (kind === 'pie') {
        const g = this._pieGeom(W, H);
        ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
        if (this.opts.type === 'donut') ctx.arc(g.cx, g.cy, g.ir, Math.PI * 2, 0, true);
      } else if (kind === 'bar') {
        const n = 8, gw = (W - 40) / n;
        for (let i = 0; i < n; i++) { const h = (0.3 + 0.6 * Math.abs(Math.sin(i * 1.7 + 0.6))) * (H - 40); const x = 30 + i * gw + gw * 0.18; if (ctx.roundRect) ctx.roundRect(x, H - 26 - h, gw * 0.64, h, [4, 4, 0, 0]); else ctx.rect(x, H - 26 - h, gw * 0.64, h); }
      } else if (kind === 'scatter') {
        for (let i = 0; i < 26; i++) { const x = 30 + ((i * 37) % 100) / 100 * (W - 50), y = 14 + ((i * 53) % 100) / 100 * (H - 50); ctx.moveTo(x + 5, y); ctx.arc(x, y, 5, 0, Math.PI * 2); }
      } else {
        const pts = Array.from({ length: 9 }, (_, i) => [30 + i * (W - 40) / 8, H * (0.62 - 0.22 * Math.sin(i * 0.9 + 0.4) - 0.1 * Math.cos(i * 2.1))]);
        ctx.moveTo(30, H - 26); ctx.lineTo(pts[0][0], pts[0][1]); monotonePath(ctx, pts, false); ctx.lineTo(W - 10, H - 26); ctx.closePath();
      }
    };
    // Rejilla tenue
    if (kind !== 'pie' && (type === 'skeleton' || type === 'pulse')) {
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) { const y = Math.round(14 + i * (H - 40) / 3) + 0.5; ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 10, y); ctx.stroke(); }
      ctx.fillStyle = C.grid;
      for (let i = 0; i < 4; i++) ctx.fillRect(4, 10 + i * (H - 40) / 3, 18, 8);
    }
    if (type === 'skeleton') {
      const pos = ((t % 1500) / 1500) * (W + 300) - 150;
      const g = ctx.createLinearGradient(pos - 150, 0, pos + 150, 0);
      g.addColorStop(0, C.grid); g.addColorStop(0.5, this._alpha(accent, 0.22)); g.addColorStop(1, C.grid);
      ghost(); ctx.fillStyle = g; ctx.fill('evenodd');
    } else if (type === 'pulse') {
      ctx.globalAlpha = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t / 260));
      ghost(); ctx.fillStyle = this._alpha(accent, 0.25); ctx.fill('evenodd');
      ctx.globalAlpha = 1;
    } else if (type === 'wave') {
      const mid = H / 2 - 6, amp = Math.min(28, H / 7);
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        for (let x = 10; x <= W - 10; x += 4) {
          const y = mid + Math.sin(x / 38 - t / (260 + k * 90) + k) * amp * (1 - k * 0.25) * Math.sin(Math.PI * (x - 10) / (W - 20));
          if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = this._alpha(accent, 1 - k * 0.32); ctx.lineWidth = 2.5 - k * 0.6; ctx.lineCap = 'round'; ctx.stroke();
      }
    } else if (type === 'spinner') {
      const cx = W / 2, cy = H / 2 - (text ? 10 : 0), r = 18;
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = C.grid; ctx.stroke();
      const a = (t / 1000) * Math.PI * 2.2, len = Math.PI * (0.5 + 0.35 * Math.sin(t / 380));
      ctx.beginPath(); ctx.arc(cx, cy, r, a, a + len); ctx.strokeStyle = accent; ctx.stroke();
    } else if (type === 'dots') {
      const cy = H / 2 - (text ? 10 : 0);
      for (let i = 0; i < 3; i++) {
        const ph = Math.max(0, Math.sin(t / 180 - i * 0.7));
        ctx.beginPath(); ctx.arc(W / 2 + (i - 1) * 20, cy - ph * 10, 5, 0, Math.PI * 2);
        ctx.fillStyle = this._alpha(this._color(i), 0.5 + ph * 0.5); ctx.fill();
      }
    }
    if (text) {
      ctx.fillStyle = C.muted; ctx.font = `500 13px ${C.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, type === 'wave' ? H - 18 : H / 2 + 26);
      ctx.font = `11px ${C.font}`;
    }
  }

  _renderError(W, H) {
    const ctx = this.ctx, C = this._colors;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.fg; ctx.font = `600 14px ${C.font}`;
    ctx.fillText(this.t.error, W / 2, H / 2 - 8);
    if (typeof this._lastSrc === 'function') { ctx.fillStyle = C.muted; ctx.font = `13px ${C.font}`; ctx.fillText(this.t.retry, W / 2, H / 2 + 14); }
    ctx.font = `11px ${C.font}`;
  }

  /* ---------- Pie / donut ---------- */
  _pieGeom(W, H) {
    const rad = Math.max(30, Math.min(W, H) / 2 - 10);
    const th = clamp(this.opts.donut?.thickness ?? 0.38, 0.05, 1);
    return { cx: W / 2, cy: H / 2, r: rad, ir: this.opts.type === 'donut' ? rad * (1 - th) : 0 };
  }

  _pieArcs() {
    const vis = this._pie.filter((p, i) => !this._hidden.has('p' + i));
    const total = vis.reduce((a, p) => a + this._pv(p), 0) || 1;
    const draw = this._enter && this._anim.enter === 'draw' ? this._p(0) : 1;
    let a = -Math.PI / 2;
    const arcs = [];
    this._pie.forEach((p, i) => {
      if (this._hidden.has('p' + i)) return;
      const v = this._pv(p);
      const sweep = (v / total) * Math.PI * 2 * draw;
      arcs.push({ i, a0: a, a1: a + sweep, p, pct: v / total });
      a += sweep;
    });
    return { arcs, total };
  }

  _renderPie(W, H) {
    const ctx = this.ctx, C = this._colors;
    const g = this._pieGeom(W, H);
    const { arcs, total } = this._pieArcs();
    const sel = this._inspect ? this._inspect.slice : -1;
    const et = this._enter && this._anim.enter;
    const fade = et === 'fade' ? this._p(0) : 1;
    arcs.forEach(({ i, a0, a1 }, k) => {
      const mid = (a0 + a1) / 2, off = i === sel ? 8 : 0;
      const cx = g.cx + Math.cos(mid) * off, cy = g.cy + Math.sin(mid) * off;
      const sc = et === 'grow' ? this._p(0) : et === 'wave' || et === 'pop' ? this._p(arcs.length > 1 ? k / (arcs.length - 1) : 0) : 1;
      if (sc <= 0) return;
      const R = g.r * sc, IR = g.ir * sc;
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a1);
      if (IR) ctx.arc(cx, cy, IR, a1, a0, true); else ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.globalAlpha = (sel >= 0 && sel !== i ? 0.55 : 1) * fade;
      ctx.fillStyle = this._color(i); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.bg; ctx.lineWidth = 2; ctx.stroke();
    });
    if (g.ir) {
      ctx.globalAlpha = this._enter ? this._p(0) : 1;
      const p = sel >= 0 ? this._pie[sel] : null;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = C.muted; ctx.font = `500 12px ${C.font}`;
      ctx.fillText(this._fitText(p ? p.label : this.t.total, g.ir * 1.6), g.cx, g.cy - 14);
      ctx.fillStyle = C.fg; ctx.font = `700 ${Math.round(clamp(g.ir / 3.2, 16, 30))}px ${C.font}`;
      ctx.fillText(this._fmtY(p ? this._pv(p) : total, this._series[0]), g.cx, g.cy + 6);
      if (p) { ctx.fillStyle = C.muted; ctx.font = `500 12px ${C.font}`; ctx.fillText(this._nf(1).format((this._pv(p) / total) * 100) + ' %', g.cx, g.cy + 28); }
      ctx.font = `11px ${C.font}`;
      ctx.globalAlpha = 1;
    }
    if (sel >= 0 && !g.ir) {
      const a = arcs.find((x) => x.i === sel);
      if (a) {
        const mid = (a.a0 + a.a1) / 2;
        const ax = g.cx + Math.cos(mid) * g.r * 0.6, ay = g.cy + Math.sin(mid) * g.r * 0.6;
        const p = this._pie[sel];
        this._placeTip(`<div class="pc-tip-h">${esc(p.label)}</div><div class="pc-tip-r"><span class="pc-dot" style="background:${this._color(sel)}"></span><span class="pc-tip-n">${this._nf(1).format(a.pct * 100)} %</span><span class="pc-tip-v">${esc(this._fmtY(p.value, this._series[0]))}</span></div>`, ax, ay, null);
      }
    } else this.$tip.classList.remove('pc-on');
  }

  _sliceAt(px, py) {
    const g = this._pieGeom(this.$canvas._w, this.$canvas._h);
    const dx = px - g.cx, dy = py - g.cy, d = Math.hypot(dx, dy);
    if (d > g.r + 10 || d < g.ir - 6) return -1;
    let ang = Math.atan2(dy, dx);
    if (ang < -Math.PI / 2) ang += Math.PI * 2;
    const hit = this._pieArcs().arcs.find((a) => ang >= a.a0 && ang < a.a1);
    return hit ? hit.i : -1;
  }

  _selectSlice(i, touch) {
    const was = this._inspect && this._inspect.slice;
    this._inspect = { slice: i, id: 'p' + i };
    if (was !== i) {
      if (touch) navigator.vibrate?.(3);
      const p = this._pie[i];
      this._emit('inspect', { label: p.label, points: [{ series: p.label, y: p.value }] });
      this.$legend.querySelectorAll('.pc-chip').forEach((b) => { b.querySelector('.pc-chip-val').textContent = b.dataset.key === 'p' + i ? this._fmtY(p.value, this._series[0]) : ''; });
    }
    this.invalidate();
  }

  _renderNav() {
    const c = this.$navCanvas, ctx = this.navCtx, W = c._w, H = c._h;
    if (!W) return;
    const C = this._colors;
    const s = this._refSeries();
    const [f0, f1] = this._full;
    // El fondo del mini-mapa (la serie completa) se dibuja una sola vez y se reutiliza como imagen.
    const key = [W, H, c._dpr, this._dataVer, s && s.key, s && s.color, C.grid].join('|');
    if (this._navKey !== key) {
      this._navKey = key;
      const off = this._navOff || (this._navOff = document.createElement('canvas'));
      off.width = c.width; off.height = c.height;
      const o = off.getContext('2d');
      o.setTransform(c._dpr || 1, 0, 0, c._dpr || 1, 0, 0);
      o.fillStyle = C.grid; o.fillRect(0, 0, W, H);
      if (s && s.points.length) {
        const mm = this._rangeMinMax(s, 0, s.points.length);
        let lo = mm[0], hi = mm[1];
        if (!isFinite(lo)) { lo = 0; hi = 1; }
        if (hi === lo) hi = lo + 1;
        const X = (x) => (x - f0) / (f1 - f0) * W, Y = (y) => H - 4 - (y - lo) / (hi - lo) * (H - 8);
        // min/máx por columna: el mini-mapa conserva los picos aunque haya 200.000 puntos
        o.beginPath();
        const p = s.points;
        let col = -1, cmin = 0, cmax = 0, started = false;
        const flush = () => { if (col < 0) return; if (!started) { o.moveTo(col, Y(cmin)); started = true; } else o.lineTo(col, Y(cmin)); o.lineTo(col, Y(cmax)); };
        for (let i = 0; i < p.length; i++) {
          const y = p[i].y; if (y == null) continue;
          const cx = Math.round(X(p[i].x));
          if (cx !== col) { flush(); col = cx; cmin = cmax = y; } else { if (y < cmin) cmin = y; if (y > cmax) cmax = y; }
        }
        flush();
        o.strokeStyle = this._alpha(s.color, 0.7); o.lineWidth = 1.25; o.lineJoin = 'round'; o.stroke();
      }
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(this._navOff, 0, 0); ctx.restore();
    const a = (this._view[0] - f0) / (f1 - f0) * W, b = (this._view[1] - f0) / (f1 - f0) * W;
    ctx.fillStyle = this._alpha(C.bg.startsWith('#') ? C.bg : '#ffffff', 0.72);
    ctx.fillRect(0, 0, a, H); ctx.fillRect(b, 0, W - b, H);
    ctx.strokeStyle = s ? s.color : C.axis; ctx.lineWidth = 2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(a + 1, 1, Math.max(6, b - a - 2), H - 2, 6); else ctx.rect(a + 1, 1, b - a - 2, H - 2); ctx.stroke();
    // asas
    ctx.fillStyle = s ? s.color : C.axis;
    [a + 1, b - 1].forEach((x) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 2, H / 2 - 8, 4, 16, 2); else ctx.rect(x - 2, H / 2 - 8, 4, 16); ctx.fill(); });
  }
}

/* ------------------------------------------------------------------ */
/* Web Component: <pocket-chart>                                       */
/* ------------------------------------------------------------------ */

const HTMLEl = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class PocketChartElement extends HTMLEl {
  static get observedAttributes() { return ['type', 'title', 'subtitle', 'height', 'theme', 'lang', 'legend-mode', 'stack', 'export', 'animation', 'easing', 'duration', 'loader', 'loading']; }
  constructor() { super(); this._cfg = null; }
  /** Configuración completa como objeto (para frameworks). */
  set config(v) { this._cfg = v; this._mount(); }
  get config() { return this._cfg; }
  get chart() { return this._chart; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const st = document.createElement('style'); st.textContent = ':host{display:block}'; this.shadowRoot.appendChild(st);
      this._wrap = document.createElement('div'); this.shadowRoot.appendChild(this._wrap);
    }
    if (!this._cfg) {
      const s = this.querySelector('script[type="application/json"]');
      if (s) try { this._cfg = JSON.parse(s.textContent); } catch (e) { console.warn('pocket-chart: JSON inválido', e); }
    }
    this._mount();
  }
  disconnectedCallback() { this._chart?.destroy(); this._chart = null; }
  attributeChangedCallback() { if (this._chart) this._mount(); }
  _attrs() {
    const a = {};
    ['type', 'title', 'subtitle', 'theme', 'lang'].forEach((k) => { if (this.hasAttribute(k)) a[k] = this.getAttribute(k); });
    if (this.hasAttribute('height')) a.height = +this.getAttribute('height');
    if (this.hasAttribute('legend-mode')) a.legend = { mode: this.getAttribute('legend-mode') };
    if (this.hasAttribute('export')) { const v = this.getAttribute('export'); a.export = v === 'false' ? false : v ? { formats: v.split(/[\s,]+/).filter(Boolean) } : true; }
    if (this.hasAttribute('stack')) { const v = this.getAttribute('stack'); a.stack = v === 'percent' ? 'percent' : v !== 'false'; }
    const an = {};
    if (this.hasAttribute('animation')) an.enter = this.getAttribute('animation');
    if (this.hasAttribute('easing')) an.easing = this.getAttribute('easing');
    if (this.hasAttribute('duration')) an.duration = +this.getAttribute('duration');
    if (Object.keys(an).length) a.animation = an;
    if (this.hasAttribute('loader')) a.loader = { type: this.getAttribute('loader') };
    if (this.hasAttribute('loading') || this._hadLoading) { this._hadLoading = true; a.loading = this.hasAttribute('loading') && this.getAttribute('loading') !== 'false'; }
    return a;
  }
  _mount() {
    if (!this._wrap) return;
    const cfg = merge(this._cfg || {}, this._attrs());
    if (this._chart) this._chart.update(cfg);
    else {
      this._chart = new PocketChart(this._wrap, cfg);
      this._chart.on('inspect', (d) => this.dispatchEvent(new CustomEvent('inspect', { detail: d })));
      this._chart.on('zoom', (d) => this.dispatchEvent(new CustomEvent('zoom', { detail: d })));
      ['toggle', 'ready', 'updated', 'error', 'export', 'zoomEnd', 'interactionStart', 'interactionEnd', 'fullscreenRequest', 'visible'].forEach((ev) => this._chart.on(ev, (d) => this.dispatchEvent(new CustomEvent(ev, { detail: d }))));
    }
  }
}

export function register(tag = 'pocket-chart') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, class extends PocketChartElement {});
}

export function create(el, options) { return new PocketChart(el, options); }
export const palette = PALETTE;
export default { create, PocketChart, PocketChartElement, register, palette };
