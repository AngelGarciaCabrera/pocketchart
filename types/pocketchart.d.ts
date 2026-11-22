// Tipos de PocketChart para TypeScript.

export type ChartType = 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'donut';
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
export type Curve = 'smooth' | 'linear' | 'step';

export interface MarkerOptions { show?: 'auto' | boolean; size?: number; shape?: MarkerShape }

export interface Series {
  name?: string;
  id?: string | number;
  data: DataPoint[];
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
  format?: (value: number, series: Series) => string;
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
  x?: { type?: 'auto' | 'time' | 'linear' | 'category'; format?: (v: number, mode: 'tick' | 'full') => string };
  y?: { min?: number | null; max?: number | null; zero?: boolean | null; format?: (v: number) => string };
  smooth?: boolean;
  /** Apila barras, áreas y líneas: `true` suma los valores, `'percent'` los reparte al 100 %. */
  stack?: boolean | 'percent';
  legend?: { show?: 'auto' | boolean; mode?: 'multi' | 'single' };
  zoom?: boolean;
  pan?: boolean;
  navigator?: 'auto' | boolean;
  fullscreen?: boolean;
  hover?: boolean;
  animate?: boolean;
  theme?: 'auto' | 'light' | 'dark';
  lang?: 'auto' | 'es' | 'en';
  locale?: string | null;
  hint?: boolean;
  maxPixelRatio?: number;
  tooltip?: { format?: (sel: InspectEvent) => string };
  animation?: false | {
    enter?: EnterAnimation; duration?: number; easing?: Easing; delay?: number; stagger?: number | null;
    update?: number; onVisible?: boolean; replayOnView?: boolean;
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
  bar?: { radius?: number; width?: number };
  grid?: { show?: boolean; dashed?: boolean };
  axis?: { x?: boolean; y?: boolean };
  donut?: { thickness?: number };
  /** Exportar a PNG, PDF, Excel o CSV. `false` oculta el botón. */
  export?: boolean | ExportOptions;
}

export interface InspectEvent {
  x?: number;
  label: string;
  points: { series: string; x?: number; y: number | null; color?: string; data?: unknown }[];
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
}

export declare class PocketChart {
  constructor(el: HTMLElement | string, options?: PocketChartOptions);
  readonly isZoomed: boolean;
  on<K extends keyof ChartEvents>(event: K, fn: (data: ChartEvents[K]) => void): this;
  off<K extends keyof ChartEvents>(event: K, fn: (data: ChartEvents[K]) => void): this;
  update(options: PocketChartOptions): this;
  setData(series: Series[]): this;
  setLoading(on?: boolean, opts?: { type?: LoaderType; text?: string }): this;
  load(src: Promise<Series[] | PocketChartOptions> | (() => Promise<Series[] | PocketChartOptions>), loader?: { type?: LoaderType; text?: string }): Promise<this>;
  replay(): this;
  zoomTo(from: number, to: number, animate?: boolean): void;
  resetZoom(): void;
  setSeriesVisible(key: string, visible: boolean): void;
  toggleFullscreen(force?: boolean): void;
  /** Genera el archivo y lo descarga (o lo pasa a `export.onExport`). Con `{ download: false }` sólo lo devuelve. */
  export(format?: ExportFormat, opts?: ExportOptions & { download?: boolean }): Promise<ExportResult>;
  /** Genera el archivo sin descargarlo. */
  toBlob(format?: ExportFormat, opts?: ExportOptions): Promise<Blob>;
  /** Imagen del gráfico para insertarla en tu propio PDF o informe (no descarga nada). */
  toImage(opts?: ImageOptions): Promise<ImageResult>;
  /** Datos en filas para las tablas de tu PDF o informe. */
  toData(): DataTable;
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
