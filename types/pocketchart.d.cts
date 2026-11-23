// Tipos de PocketChart para TypeScript.

export type ChartType = 'line' | 'area' | 'bar' | 'column' | 'scatter' | 'pie' | 'donut';
export type XValue = number | string | Date;
export type DataPoint =
  | number
  | null
  | [XValue, number | null]
  | [XValue, number | null, number]
  | { x?: XValue; y?: number | null; value?: number; label?: string; name?: string; r?: number };

export type Easing = 'linear' | 'easeIn' | 'easeOut' | 'easeOutCubic' | 'easeInOut' | 'back' | 'elastic' | 'bounce' | ((t: number) => number);
export type EnterAnimation = 'draw' | 'grow' | 'wave' | 'pop' | 'fade' | 'none';
export type LoaderType = 'skeleton' | 'pulse' | 'wave' | 'spinner' | 'dots';
export type MarkerShape = 'circle' | 'square' | 'diamond';
/** También acepta los nombres del backend: `straight` (= linear) y `stepline` (= step). */
export type Curve = 'smooth' | 'linear' | 'step' | 'straight' | 'stepline' | 'monotone';

/** Formato numérico sin funciones (funciona en React Native con Hermes). */
export type NumberStyle = 'compact' | 'integer' | 'number' | 'decimal' | 'decimal1' | 'decimal2' | 'percent' | 'currency';
export interface NumberFormatOptions {
  /** 'compact' 1200 → 1.2k · 'currency' $1,234.50 · 'percent' 45 → 45% · 'integer' 1,234 · 'decimal' 1,234.50 */
  format?: NumberStyle | { style: NumberStyle; decimals?: number; prefix?: string; suffix?: string; locale?: string; currency?: string };
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Configuración regional, p. ej. 'en-US' o 'es-BO'. */
  locale?: string;
  /** Código de moneda para 'currency' (por defecto 'USD'). */
  currency?: string;
  /** Redondeo por tipo de dato del backend. */
  dataType?: 'number' | 'decimal1' | 'decimal2';
}
/** Plantilla de fecha: yyyy yy MMMM MMM MM M dd d EEE HH H hh h mm m ss s a, y 'texto literal'. Ej.: 'MM/dd HH:mm'. */
export type DateTemplate = string;
/** Datos compactos: arreglos de x e y separados (o xStart + xStep). Mucho menos texto por el puente de una WebView. */
export interface CompactData { x?: ArrayLike<number | string>; y: ArrayLike<number | null>; xStart?: XValue; xStep?: number }

export interface MarkerOptions { show?: 'auto' | boolean; size?: number; shape?: MarkerShape }

/** Eje Y propio de una serie. Series con el mismo `id`, o con el mismo `min`/`max` y lado, comparten eje. */
export interface YAxisOptions extends Omit<NumberFormatOptions, 'format'> {
  /** Límite inferior fijo. Con `min` y `max` el eje no cambia con los datos ni con el zoom. */
  min?: number | null;
  max?: number | null;
  /** `true` dibuja el eje a la derecha. */
  opposite?: boolean;
  /** `false` conserva la escala propia pero no dibuja el eje. */
  show?: boolean;
  /** Agrupa varias series en un mismo eje. */
  id?: string | number;
  /** Formato de las etiquetas del eje y del tooltip de la serie: función o estilo declarativo. */
  format?: ((v: number) => string) | NumberFormatOptions['format'];
  /** Ocultar una serie no cambia la escala de este eje (por defecto true). */
  stable?: boolean;
  /** Texto corto encima del eje (p. ej. la unidad). */
  title?: string;
  /** Incluir el 0 en un eje automático. */
  zero?: boolean | null;
}

export interface Series extends Omit<NumberFormatOptions, 'format'> {
  name?: string;
  id?: string | number;
  /** Pares, objetos o datos compactos { x: [], y: [] }. null/NaN = hueco (corta la línea). */
  data?: DataPoint[] | CompactData;
  /** Datos compactos en la propia serie (alternativa a `data`). */
  x?: ArrayLike<number | string>;
  y?: ArrayLike<number | null>;
  unit?: string;
  type?: Exclude<ChartType, 'pie' | 'donut'>;
  color?: string;
  colorDark?: string;
  curve?: Curve;
  smooth?: boolean;
  lineWidth?: number;
  dash?: number[];
  fillOpacity?: number;
  markers?: MarkerOptions;
  radius?: number;
  /** Grupo de apilado: `true` usa el grupo común, un texto crea un grupo propio, `false` la excluye. */
  stack?: boolean | string;
  /** Formato del valor en tooltip y leyenda: función o estilo declarativo. */
  format?: ((value: number, series: Series) => string) | NumberFormatOptions['format'];
  /** Escala Y propia. Sin `yAxis` en ninguna serie el gráfico usa un solo eje, como siempre. */
  yAxis?: YAxisOptions;
}

export interface StyleOptions {
  bg?: string; fg?: string; muted?: string; grid?: string; axis?: string;
  chip?: string; chipOn?: string; tip?: string; line?: string; font?: string; radius?: number | string;
}

export type ExportFormat = 'png' | 'pdf' | 'xlsx' | 'csv';
export interface ExportOptions {
  /** Botón de descarga en la cabecera (por defecto true). */
  button?: boolean;
  /** Formatos del menú (por defecto png, pdf y xlsx). */
  formats?: ExportFormat[];
  /** Nombre del archivo sin extensión (por defecto, el título). */
  filename?: string | null;
  /** Resolución de la imagen (por defecto 3). */
  scale?: number;
  /** Fondo de la imagen (por defecto, el del tema). */
  background?: string | null;
  pdf?: { page?: 'a4' | 'letter' | 'fit'; orientation?: 'auto' | 'portrait' | 'landscape'; margin?: number };
  /** Sustituye a la descarga del navegador (por ejemplo, para subir el archivo o usarlo en una WebView). */
  onExport?: ((blob: Blob, filename: string, format: ExportFormat) => void | Promise<void>) | null;
}
export interface ExportResult { blob: Blob; filename: string; format: ExportFormat }
export interface ImageOptions {
  format?: 'png' | 'jpeg';
  /** Resolución (por defecto la de `export.scale`, 3). */
  scale?: number;
  /** Ancho total de la imagen en px CSS (por defecto, el del gráfico en pantalla). */
  width?: number;
  /** Alto del área de dibujo en px CSS (por defecto, el de pantalla). */
  plotHeight?: number;
  /** Alto total fijo de la imagen en px CSS. */
  height?: number;
  /** Relación de aspecto fija (ancho / alto), p. ej. 2 para 2:1. */
  aspectRatio?: number;
  /** 'current' = lo que se ve (con zoom), 'full' = todo el rango de datos. */
  view?: 'current' | 'full';
  /** Incluir título y subtítulo (por defecto true). */
  header?: boolean;
  /** Incluir la leyenda (por defecto true). */
  legend?: boolean;
  padding?: number;
  /** Color de fondo, o 'transparent' (sólo PNG). */
  background?: string;
  quality?: number;
}
export interface ImageResult { dataUrl: string; base64: string; blob: Blob; mime: string; width: number; height: number }
export interface DataTable { columns: string[]; rows: (string | number | Date | null)[][]; formatted: string[][] }

export interface PocketChartOptions {
  type?: ChartType;
  title?: string;
  subtitle?: string;
  series?: Series[];
  categories?: string[] | null;
  height?: number;
  /** `x.format` como plantilla ('MM/dd HH:mm') se usa en el eje; al acercar más pasa solo a HH:mm:ss. */
  x?: { type?: 'auto' | 'time' | 'linear' | 'category'; format?: ((v: number, mode: 'tick' | 'full') => string) | DateTemplate; label?: string };
  y?: Omit<NumberFormatOptions, 'format'> & { min?: number | null; max?: number | null; zero?: boolean | null; format?: ((v: number) => string) | NumberFormatOptions['format']; title?: string; stable?: boolean };
  smooth?: boolean;
  /** Apila barras, áreas y líneas: `true` suma los valores, `'percent'` los reparte al 100 %. */
  stack?: boolean | 'percent';
  legend?: { show?: 'auto' | boolean; mode?: 'multi' | 'single' };
  /** `minPoints`: puntos visibles como mínimo al acercar (por defecto 4). */
  zoom?: boolean | { minPoints?: number; minSpan?: number };
  pan?: boolean;
  navigator?: 'auto' | boolean;
  /** Botones − y + en la cabecera. */
  zoomControls?: 'auto' | boolean;
  /** Barra con el rango visible y "Restablecer" ('auto' = sólo con zoom). */
  rangeBar?: 'auto' | boolean;
  /** Zoom controlado. */
  zoomRange?: { from: XValue; to: XValue } | null;
  /** Panel de valores bajo el gráfico (fecha y cada serie). */
  inspector?: false | 'bottom';
  /** Modo ligero para pantallas con varios gráficos (sin animación de entrada, menos resolución). */
  lite?: boolean;
  /** 'external': el botón emite 'fullscreenRequest' y tu app abre su propio modal. */
  fullscreen?: boolean | 'external';
  hover?: boolean;
  animate?: boolean;
  theme?: 'auto' | 'light' | 'dark';
  lang?: 'auto' | 'es' | 'en';
  locale?: string | null;
  hint?: boolean;
  maxPixelRatio?: number;
  tooltip?: Omit<NumberFormatOptions, 'format'> & {
    /** Función que devuelve el HTML completo, o un estilo numérico declarativo para los valores. */
    format?: ((sel: InspectEvent) => string) | NumberFormatOptions['format'];
    /** Fila por serie: {x} {series} {value} {unit} {total} {percent}. Con "|" se separa nombre y valor en dos columnas. */
    template?: string;
    /** Cabecera, p. ej. '{x}'. */
    header?: string;
    /** Fila final, p. ej. 'Total: {total}'. */
    footer?: string;
    /** Plantilla de la fecha del tooltip, p. ej. 'hh:mm a, MM/dd/yy'. */
    dateFormat?: DateTemplate;
    /** Un toque selecciona y el valor queda fijo hasta tocar de nuevo o `clearInspect()`. */
    sticky?: boolean;
    /** Mostrar el tooltip flotante ('auto' = no si `inspector: 'bottom'`). */
    show?: 'auto' | boolean;
  };
  animation?: false | {
    enter?: EnterAnimation; duration?: number; easing?: Easing; delay?: number; stagger?: number | null;
    update?: number; onVisible?: boolean; replayOnView?: boolean;
    /** ms entre las entradas de varios gráficos que aparecen a la vez (por defecto 120). */
    chartStagger?: number;
  };
  loading?: boolean | { type?: LoaderType; text?: string; color?: string };
  loader?: { type?: LoaderType; text?: string | null; color?: string };
  colors?: string[] | null;
  colorsDark?: string[] | null;
  style?: StyleOptions;
  styleDark?: StyleOptions;
  line?: { width?: number; curve?: Curve; dash?: number[] | null };
  markers?: MarkerOptions;
  area?: { opacity?: number };
  /** `padding`: hueco libre entre barras (0..1). En ejes de tiempo el ancho sigue a la separación entre fechas. */
  bar?: { radius?: number; width?: number; padding?: number | null };
  grid?: { show?: boolean; dashed?: boolean };
  axis?: { x?: boolean; y?: boolean };
  donut?: { thickness?: number };
  /** Exportar a PNG, PDF, Excel o CSV. `false` oculta el botón. */
  export?: boolean | ExportOptions;
}

export interface InspectEvent {
  x?: number;
  label: string;
  points: {
    series: string; id?: string; x?: number; y: number | null; color?: string; data?: unknown;
    /** Valor ya formateado, con unidad. */
    formatted?: string;
    /** Solo con ejes múltiples. */
    unit?: string;
    /** Solo con ejes múltiples: eje de la serie y su dominio actual. */
    yAxis?: { id: string | number | null; min: number; max: number; opposite: boolean };
  }[];
}

export interface ChartEvents {
  inspect: InspectEvent | null;
  zoom: { from: number; to: number; zoomed: boolean };
  toggle: { key: string; visible: boolean; hidden: string[] };
  ready: undefined;
  updated: undefined;
  visible: boolean;
  error: unknown;
  export: { format: ExportFormat; filename: string; size: number };
  /** Una sola vez al terminar cada gesto o animación de zoom. */
  zoomEnd: ZoomEndEvent;
  interactionStart: { pointerType?: string };
  interactionEnd: { gesture?: string };
  fullscreenRequest: { from: number; to: number; zoomed: boolean };
}
export interface ZoomEndEvent {
  from: number; to: number; zoomed: boolean;
  source: 'pinch' | 'pan' | 'wheel' | 'button' | 'reset' | 'doubletap' | 'keyboard' | 'navigator' | 'api';
}
export interface UpdateOptions { /** Conserva el zoom (y la selección fija) al llegar datos nuevos. */ keepView?: boolean }
export interface DataOptions { range?: 'all' | 'visible'; series?: 'all' | 'visible' }

export declare class PocketChart {
  constructor(el: HTMLElement | string, options?: PocketChartOptions);
  readonly isZoomed: boolean;
  on<K extends keyof ChartEvents>(event: K, fn: (data: ChartEvents[K]) => void): this;
  off<K extends keyof ChartEvents>(event: K, fn: (data: ChartEvents[K]) => void): this;
  update(options: PocketChartOptions, uo?: UpdateOptions): this;
  setData(series: Series[], uo?: UpdateOptions): this;
  setLoading(on?: boolean, opts?: { type?: LoaderType; text?: string }): this;
  load(src: Promise<Series[] | PocketChartOptions> | (() => Promise<Series[] | PocketChartOptions>), loader?: { type?: LoaderType; text?: string }): Promise<this>;
  replay(): this;
  zoomTo(from: XValue, to: XValue, animate?: boolean, source?: string): this;
  zoomBy(k: number): this;
  resetZoom(): this;
  getZoom(): { from: number; to: number; zoomed: boolean };
  clearInspect(): this;
  select(x: XValue): this;
  setSeriesVisible(key: string, visible: boolean): void;
  toggleFullscreen(force?: boolean): void;
  /** Genera el archivo y lo descarga (o lo pasa a `export.onExport`). Con `{ download: false }` sólo lo devuelve. */
  export(format?: ExportFormat, opts?: ExportOptions & { download?: boolean }): Promise<ExportResult>;
  /** Genera el archivo sin descargarlo. */
  toBlob(format?: ExportFormat, opts?: ExportOptions): Promise<Blob>;
  /** Imagen del gráfico para insertarla en tu propio PDF o informe (no descarga nada). */
  toImage(opts?: ImageOptions): Promise<ImageResult>;
  /** Datos en filas para las tablas de tu PDF o informe. */
  toData(opts?: DataOptions): DataTable;
  invalidate(): void;
  destroy(): void;
}

export declare class PocketChartElement extends HTMLElement {
  config: PocketChartOptions | null;
  readonly chart: PocketChart | undefined;
}

export declare function create(el: HTMLElement | string, options?: PocketChartOptions): PocketChart;
export declare function register(tag?: string): void;
export declare const palette: { light: string[]; dark: string[] };

declare const _default: { create: typeof create; PocketChart: typeof PocketChart; PocketChartElement: typeof PocketChartElement; register: typeof register; palette: typeof palette };
export default _default;

declare global {
  interface HTMLElementTagNameMap { 'pocket-chart': PocketChartElement }
  interface Window { PocketChart: typeof _default }
}
