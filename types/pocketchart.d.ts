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
  format?: (value: number, series: Series) => string;
}

export interface StyleOptions {
  bg?: string; fg?: string; muted?: string; grid?: string; axis?: string;
  chip?: string; chipOn?: string; tip?: string; line?: string; font?: string; radius?: number | string;
}

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
