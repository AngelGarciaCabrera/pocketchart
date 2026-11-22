/*!
 * PocketChart v0.3.0 — gráficos mobile-first, sin dependencias.
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
    reset: 'Reset zoom', fullscreen: 'Fullscreen', exit: 'Close',
    download: 'Download', category: 'Category', date: 'Date', png: 'Image (PNG)', pdf: 'PDF document', xlsx: 'Excel (.xlsx)', csv: 'CSV',
    hintTouch: 'Pinch to zoom · Touch and hold to inspect',
    hintMouse: 'Scroll with Ctrl to zoom · Drag to inspect',
    rotate: 'Rotate your phone for more room', total: 'Total', chart: 'Chart',
    loading: 'Loading…', error: 'Could not load the data', retry: 'Tap to retry',
  },
  es: {
    reset: 'Restablecer zoom', fullscreen: 'Pantalla completa', exit: 'Cerrar',
    download: 'Descargar', category: 'Categoría', date: 'Fecha', png: 'Imagen (PNG)', pdf: 'Documento PDF', xlsx: 'Excel (.xlsx)', csv: 'CSV',
    hintTouch: 'Pellizca para hacer zoom · Mantén pulsado para inspeccionar',
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
  zoom: true,
  pan: true,
  navigator: 'auto',       // mini-mapa para navegar cuando hay zoom
  fullscreen: true,
  hover: true,             // con ratón, inspeccionar al pasar por encima
  animate: true,
  theme: 'auto',           // auto | light | dark
  lang: 'auto',            // auto | es | en
  locale: null,            // para fechas y números (por defecto, el del navegador)
  hint: true,
  tooltip: { format: null },
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
  bar: { radius: 4, width: 0.7 },                         // width: fracción del hueco disponible
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
    this._resolveTheme();
    this._bind();
    this._resize();
  }

  /* ---------- API pública ---------- */
  on(evt, fn) { (this._handlers[evt] ||= []).push(fn); return this; }
  off(evt, fn) { this._handlers[evt] = (this._handlers[evt] || []).filter((f) => f !== fn); return this; }
  _emit(evt, data) { (this._handlers[evt] || []).forEach((f) => f(data)); this.root.dispatchEvent(new CustomEvent('pocket:' + evt, { detail: data, bubbles: true, composed: true })); }

  update(options = {}) {
    const keepView = !options.series && !options.type;
    const prev = options.series && !this._loading ? this._snapshot() : null;
    const wasLoading = !!this._loading;
    this.opts = merge(this.opts, options);
    const view = this._view;
    this._ingest();
    if (keepView && view) this._view = view;
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
  setData(series) { return this.update({ series }); }

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
    if (!this._animOn || a.enter === 'none') { this._enter = null; this._emit('ready'); this._showHint(); this.invalidate(); return; }
    this._enter = { t0: performance.now() };
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
  resetZoom() { this.zoomTo(this._full[0], this._full[1]); }
  zoomTo(a, b, animate = true) {
    const [f0, f1] = this._full;
    const span = clamp(b - a, this._minSpan, f1 - f0);
    let v0 = clamp(a, f0, f1 - span);
    const target = [v0, v0 + span];
    if (!animate || reduceMotion()) { this._setView(target); return; }
    const from = this._view.slice(), t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 260), e = 1 - Math.pow(1 - k, 3);
      this._setView([from[0] + (target[0] - from[0]) * e, from[1] + (target[1] - from[1]) * e]);
      if (k < 1) this._zoomRaf = requestAnimationFrame(step);
    };
    cancelAnimationFrame(this._zoomRaf);
    this._zoomRaf = requestAnimationFrame(step);
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
    const W = io.width ? Math.max(120, io.width - pad * 2) : this.$canvas._w, H = io.plotHeight || this.$canvas._h;
    const plot = this._snapshotCanvas(scale, W, H);
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
    const TW = W + pad * 2, TH = pad + head + legH + H + pad;
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
  _dataRows() {
    if (this._isPie) {
      const s = this._series[0];
      return [[{ v: this.t.category, t: 's' }, { v: s?.name || this.t.total, t: 's' }], ...this._pie.map((p) => [{ v: p.label, t: 's' }, { v: p.value, t: 'n' }])];
    }
    const xs = new Map();
    this._series.forEach((s) => s.points.forEach((q) => xs.set(q.x, true)));
    const keys = [...xs.keys()].sort((a, b) => a - b);
    const look = this._series.map((s) => { const m = new Map(); s.points.forEach((q) => m.set(q.x, q.v)); return m; });
    const xCell = (x) => this._xType === 'time' ? { v: 25569 + (x - new Date(x).getTimezoneOffset() * 6e4) / 864e5, t: 'd', raw: x }
      : this._xType === 'category' ? { v: this._cats[x] ?? String(x), t: 's' } : { v: x, t: 'n' };
    const head = [{ v: this.opts.x.label || (this._xType === 'time' ? this.t.date : this._xType === 'category' ? this.t.category : 'X'), t: 's' },
      ...this._series.map((s) => ({ v: s.unit ? `${s.name} (${s.unit})` : s.name, t: 's' }))];
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
  toData() {
    const t = this._dataRows(), head = t[0];
    const valueOf = (c) => (c == null || c.v == null ? null : c.t === 'd' ? new Date(c.raw) : c.v);
    const sers = this._isPie ? [this._series[0]] : this._series;
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
    const rows = this._dataRows();
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
    this.$table = r.querySelector('.pc-sr');
    this.ctx = this.$canvas.getContext('2d');
    this.navCtx = this.$navCanvas.getContext('2d');
  }

  _renderHeader() {
    const o = this.opts, t = this.t;
    this.$titles.innerHTML = (o.title ? `<h3 class="pc-title">${esc(o.title)}</h3>` : '') + (o.subtitle ? `<p class="pc-sub">${esc(o.subtitle)}</p>` : '');
    const fs = this.root.classList.contains('pc-fs');
    let html = '';
    if (this.isZoomed && !this._isPie) html += `<button class="pc-btn" data-act="reset" aria-label="${t.reset}" title="${t.reset}">${ICONS.reset}</button>`;
    const EX = this._exportOpts;
    if (EX && EX.button !== false && EX.formats.length) html += `<button class="pc-btn" data-act="dl" aria-haspopup="menu" aria-label="${t.download}" title="${t.download}">${ICONS.download}</button>`;
    if (o.fullscreen) html += `<button class="pc-btn" data-act="fs" aria-label="${fs ? t.exit : t.fullscreen}" title="${fs ? t.exit : t.fullscreen}">${fs ? ICONS.close : ICONS.expand}</button>`;
    if (html !== this._actionsHtml) { this.$actions.innerHTML = html; this._actionsHtml = html; }
    this.root.querySelector('.pc-head').hidden = !o.title && !o.subtitle && !html;
    this.$rotate.textContent = t.rotate;
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
    const raw = (o.series || []).map((s) => (Array.isArray(s) ? { data: s } : s));
    // Tipo de eje X
    let xType = o.x.type;
    const sample = raw[0]?.data?.find((d) => d != null);
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
        const yy = y == null || isNaN(+y) ? null : +y;
        return { x, y: yy, v: yy, label, r, raw: d, i };
      }).filter((p) => isFinite(p.x));
      if (xType !== 'category') pts.sort((a, b) => a.x - b.x);
      return {
        key: s.id != null ? String(s.id) : 's' + si,
        name: s.name ?? `Serie ${si + 1}`,
        type: s.type || (this._isPie ? 'line' : o.type),
        color: s.color || null,
        slot: si,
        curve: s.curve || ((s.smooth ?? o.smooth) === false ? 'linear' : (o.line && o.line.curve) || 'smooth'),
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
    if (!isFinite(minDx)) minDx = (x1 - x0) || 1;
    this._minDx = minDx;
    const hasBars = this._series.some((s) => s.type === 'bar');
    if (xType === 'category' || hasBars) { x0 -= minDx / 2; x1 += minDx / 2; }
    if (x1 === x0) { x0 -= 1; x1 += 1; }
    this._full = [x0, x1];
    this._minSpan = Math.max((x1 - x0) / 2000, minDx * 2.5);
    this._view = [x0, x1];
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
        def = { min: o.y.min, max: o.y.max, opposite: false, show: (o.axis || {}).y !== false, format: o.y.format || null, zero: o.y.zero, title: o.y.title || '' };
      } else {
        const fixed = Y.min != null && Y.max != null && +Y.max > +Y.min;
        key = Y.id != null ? 'id:' + Y.id : fixed ? `mm:${+Y.min}|${+Y.max}|${Y.opposite ? 'R' : 'L'}` : 'auto:' + s.key;
        def = { min: Y.min ?? null, max: Y.max ?? null, opposite: !!Y.opposite, show: Y.show !== false, format: Y.format || null, zero: Y.zero ?? null, title: Y.title || '' };
      }
      let ax = axes.get(key);
      if (!ax) axes.set(key, (ax = { key, id: Y && Y.id != null ? Y.id : key === '__default' ? 'default' : key, ...def, series: [], cur: null }));
      else { if (!ax.format && def.format) ax.format = def.format; if (!ax.title && def.title) ax.title = def.title; }
      ax.series.push(s); s.axis = ax;
    });
    this._axisList = [...axes.values()];
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
    const vis = ax.series.filter((s) => !this._hidden.has(s.key));
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
    if (ax.key === '__default') return this._fmtYTick(v, step);
    const t = this._fmtTick(v, step, true);
    return this._pct && ax.series.some((s) => s.stackKey) ? t + '%' : t;
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
    const left = active.filter((a) => a.show && !a.opposite), right = active.filter((a) => a.show && a.opposite);
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
    this._palette = custom && custom.length ? custom.slice() : Array.from({ length: 8 }, (_, i) => v(`--pc-c${i + 1}`) || PALETTE[th][i]);
    this._series?.forEach((s) => {
      const src = this.opts.series[s.slot] || {};
      s.color = (th === 'dark' && src.colorDark) || src.color || this._color(s.slot);
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
    const f = (s && s.format) || (own ? null : this.opts.y.format);
    if (f) return f(v, s);
    if (own && s.axis.format) { const t = s.axis.format(v); return s.unit ? `${t} ${s.unit}` : t; } // formato del eje + unidad
    const a = Math.abs(v);
    const txt = a >= 1e6 ? this._nf(1).format(v / 1e6) + 'M' : a >= 1e4 ? this._nf(1).format(v / 1e3) + 'k' : this._nf(a < 10 ? 2 : a < 100 ? 2 : 1).format(v);
    return s && s.unit ? `${txt} ${s.unit}` : txt;
  }
  _fmtTick(v, step, raw) {
    const f = raw ? null : this.opts.y.format;
    if (f) return f(v);
    const a = Math.max(Math.abs(v), Math.abs(step));
    if (a >= 1e6) return this._nf(2).format(v / 1e6) + 'M';
    if (a >= 1e4) return this._nf(1).format(v / 1e3) + 'k';
    const dec = Math.max(0, -Math.floor(Math.log10(step)));
    return this._nf(Math.min(dec, 6)).format(v);
  }
  _fmtYTick(v, step) { const t = this._fmtTick(v, step); return this._pct && !this.opts.y.format ? t + '%' : t; }
  _fmtXFull(x) {
    if (this.opts.x.format) return this.opts.x.format(x, 'full');
    if (this._xType === 'time') {
      const fine = this._minDx < 864e5;
      return this._df(fine ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(x);
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
    p.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !this._ptrs.size && this.opts.hover) this._clearInspect(); });
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
      if (b.dataset.act === 'reset') this.resetZoom();
      if (b.dataset.act === 'fs') this.toggleFullscreen();
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

    this._bindNav();
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

  _down(e) {
    this._hideHint();
    cancelAnimationFrame(this._inertia);
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
      this._g = { mode: 'pan', x0: p.x, y0: p.y, view0: this._view.slice(), hist: [], type: 'touch' };
      return;
    }
    if (this._ptrs.size) return;
    const pt = this._local(e);
    if (g.mode === 'pending' && performance.now() - g.t0 < 350) this._tap(pt.x, pt.y, g.type);
    if (g.mode === 'pan' && g.hist.length > 1) this._startInertia(g.hist);
    if (g.mode === 'scrub' && g.type === 'mouse' && !this.opts.hover) this._clearInspect();
    this._g = null;
  }

  _cancel(e) { this._ptrs.delete(e.pointerId); clearTimeout(this._g?.lp); if (!this._ptrs.size) this._g = null; }

  _tap(x, y, type) {
    if (this._error) { if (typeof this._lastSrc === 'function') this.load(this._lastSrc).catch(() => {}); return; }
    if (this._loading) return;
    const now = performance.now();
    const dbl = this._lastTap && now - this._lastTap.t < 300 && Math.hypot(x - this._lastTap.x, y - this._lastTap.y) < 30;
    this._lastTap = dbl ? null : { t: now, x, y };
    if (dbl && !this._isPie && this.opts.zoom) {
      if (this.isZoomed) this.resetZoom();
      else { const c = this._invX(x), span = (this._full[1] - this._full[0]) / 3; this.zoomTo(c - span / 2, c + span / 2); }
      this._clearInspect();
      return;
    }
    if (type === 'mouse' && this.opts.hover) return;
    const prev = this._inspect;
    const hit = this._hitTest(x, y);
    if (!hit || (prev && hit.id === prev.id)) this._clearInspect();
    else this._inspectAt(x, y, type !== 'mouse');
  }

  _startInertia(hist) {
    const a = hist[0], b = hist[hist.length - 1];
    const dt = b.t - a.t; if (dt <= 0 || dt > 120) return;
    let v = (b.x - a.x) / dt; // px/ms
    if (reduceMotion()) return;
    let last = performance.now();
    const step = (now) => {
      const dtt = now - last; last = now;
      v *= Math.pow(0.94, dtt / 16);
      if (Math.abs(v) < 0.02) return;
      const span = this._view[1] - this._view[0];
      const d = -v * dtt / this._plotRect.w * span;
      this._setView([this._view[0] + d, this._view[1] + d]);
      if (this._view[0] <= this._full[0] || this._view[1] >= this._full[1]) return;
      this._inertia = requestAnimationFrame(step);
    };
    this._inertia = requestAnimationFrame(step);
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
    }
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
      case '+': case '=': this.zoomTo(c - span / 3, c + span / 3); e.preventDefault(); return;
      case '-': this.zoomTo(c - span, c + span); e.preventDefault(); return;
      case '0': this.resetZoom(); e.preventDefault(); return;
      case 'Escape': this._clearInspect(); return;
      default: return;
    }
    e.preventDefault();
    const x = pts[i].x;
    if (x < this._view[0] || x > this._view[1]) this.zoomTo(x - span / 2, x + span / 2, false);
    this._inspectAt(this._sx(x), this._plotRect.y + 20, false);
  }

  _setView(v) {
    const [f0, f1] = this._full;
    let span = clamp(v[1] - v[0], this._minSpan, f1 - f0);
    let a = clamp(v[0], f0, f1 - span);
    const wasZoomed = this.isZoomed;
    this._view = [a, a + span];
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
    const end = () => { drag = null; };
    n.addEventListener('pointerup', end); n.addEventListener('pointercancel', end);
  }

  _layoutNav() {
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
    const dpr = Math.min(this.opts.maxPixelRatio || 2, window.devicePixelRatio || 1);
    const w = c.parentElement.clientWidth, h = c.parentElement.clientHeight;
    if (!w || !h) return;
    if (c._w === w && c._h === h && c._dpr === dpr) return; // reasignar width borra y recrea el lienzo
    c._dpr = dpr;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    c._w = w; c._h = h;
  }

  _showHint() {
    if (!this.opts.hint || this._hintShown || this._isPie) return;
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
    const o = this.opts.y, vis = this._visibleSeries();
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
  }

  _renderXAxis(W, H) {
    const ctx = this.ctx, r = this._plotRect, C = this._colors;
    const [v0, v1] = this._view;
    const ticks = [];
    if (this._xType === 'time') {
      const sample = this._df({ day: 'numeric', month: 'short' }).format(Date.UTC(2026, 8, 28));
      const lw = this._mw(sample) + 18;
      const pxPerMs = r.w / (v1 - v0);
      let step = TIME_STEPS.find((s) => (typeof s === 'number' ? s : s[0] === 'M' ? +s.slice(1) * 2592e6 : +s.slice(1) * 31536e6) * pxPerMs >= lw) || 'Y10';
      ticks.push(...this._timeTicks(v0, v1, step));
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
    const df = (o) => ({ format: (t) => { const k = (o.hour ? 'h' : o.day ? 'd' : o.month ? 'm' : 'y') + (o.second ? 's' : '') + (+t); let v = lc.get(k); if (v === undefined) { v = dfRaw(o).format(t); lc.set(k, v); } return v; } });
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
      } else {
        const days = Math.round(step / 864e5);
        const d = new Date(v0); d.setHours(0, 0, 0, 0);
        if (days === 7 || days === 14) { while (d.getDay() !== 1) d.setDate(d.getDate() + 1); } // lunes
        else if (days > 1) { while ((d.getDate() - 1) % days) d.setDate(d.getDate() + 1); }
        for (let n = 0; d.getTime() <= v1 && n < 500; n++) {
          if (d.getTime() >= v0) {
            const first = d.getDate() === 1;
            out.push({ v: d.getTime(), label: first ? df({ month: 'short' }).format(d) : df({ day: 'numeric', month: 'short' }).format(d), strong: first });
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
    const show = M.show === true || (M.show === 'auto' && !dense && total && r.w / total > 14);
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
    const unit = this._xType === 'category' ? 1 : this._minDx;
    const band = unit / (this._view[1] - this._view[0]) * r.w;
    const group = band * (B.width ?? 0.7) * (nb > 1 ? 1.12 : 1);
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
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
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
    const i = nearestIndex(ref.points, clamp(this._invX(px), this._view[0], this._view[1]));
    if (i < 0) return null;
    const x = ref.points[i].x;
    const rows = vis.map((s) => { const j = nearestIndex(s.points, x); const q = s.points[j]; return q && Math.abs(q.x - x) < this._minDx / 2 ? { s, q } : null; }).filter(Boolean);
    return { id: 'x' + x, x, rows };
  }

  _inspectAt(px, py, touch) {
    if (this._isPie) { const i = this._sliceAt(px, py); if (i >= 0) this._selectSlice(i, touch); else this._clearInspect(); return; }
    const hit = this._hitTest(px, py);
    if (!hit) return;
    const changed = !this._inspect || this._inspect.id !== hit.id;
    this._inspect = { ...hit, py, touch };
    if (changed) { if (touch) navigator.vibrate?.(3); this._emit('inspect', { x: hit.x, label: this._fmtXFull(hit.x), points: hit.rows.map((r) => ({ series: r.s.name, x: r.q.x, y: r.q.v, data: r.q.raw, ...(this._multi ? { unit: r.s.unit, yAxis: { id: r.s.yAxisOpt && r.s.yAxisOpt.id != null ? r.s.yAxisOpt.id : null, min: r.s.axis.cur ? r.s.axis.cur[0] : r.s.axis.min, max: r.s.axis.cur ? r.s.axis.cur[1] : r.s.axis.max, opposite: r.s.axis.opposite } } : {}) })) }); }
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
    this._placeTip(this._tipHtml(ins), x, isFinite(top) ? top : r.y + r.h / 2, ins.touch ? ins.py : null);
  }

  _tipHtml(ins) {
    const f = this.opts.tooltip.format;
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
    const kind = this._isPie ? 'pie' : this.opts.type === 'bar' ? 'bar' : this.opts.type === 'scatter' ? 'scatter' : 'line';
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
      ['toggle', 'ready', 'updated', 'error'].forEach((ev) => this._chart.on(ev, (d) => this.dispatchEvent(new CustomEvent(ev, { detail: d }))));
    }
  }
}

export function register(tag = 'pocket-chart') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, class extends PocketChartElement {});
}

export function create(el, options) { return new PocketChart(el, options); }
export const palette = PALETTE;
export default { create, PocketChart, PocketChartElement, register, palette };
