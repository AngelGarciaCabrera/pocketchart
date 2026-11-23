// Tipos de pocketchart/react-native
import type { ComponentType, Ref } from 'react';
import type { PocketChartOptions, Series, InspectEvent, ZoomEndEvent, ImageOptions, DataTable, DataOptions, UpdateOptions, ExportFormat, ExportOptions } from './pocketchart.js';

export interface PocketChartViewHandle {
  zoomTo(from: number | Date, to: number | Date, animate?: boolean): void;
  zoomBy(k: number): void;
  resetZoom(): void;
  getZoom(): Promise<{ from: number; to: number; zoomed: boolean }>;
  clearInspect(): void;
  select(x: number | Date): void;
  setData(series: Series[], opts?: UpdateOptions): void;
  replay(): void;
  setLoading(on: boolean, opts?: object): void;
  call(method: string, ...args: unknown[]): void;
  export(format?: ExportFormat, opts?: ExportOptions): void;
  toImage(opts?: ImageOptions): Promise<{ dataUrl: string; base64: string; mime: string; width: number; height: number }>;
  toData(opts?: DataOptions): Promise<DataTable>;
}
interface Events {
  onInspect?: (sel: InspectEvent | null) => void;
  onZoom?: (z: { from: number; to: number; zoomed: boolean }) => void;
  onZoomEnd?: (z: ZoomEndEvent) => void;
  onToggle?: (t: { key: string; visible: boolean; hidden: string[] }) => void;
  onReady?: () => void;
  onUpdated?: () => void;
  onError?: (e: unknown) => void;
  onExport?: (f: { filename: string; format: ExportFormat; mime: string; base64: string }) => void;
  onInteractionStart?: (d: { pointerType?: string }) => void;
  onInteractionEnd?: (d: { gesture?: string }) => void;
  onFullscreenRequest?: (d: { from: number; to: number; zoomed: boolean }) => void;
  onVisible?: (v: boolean) => void;
}
export interface PocketChartViewProps extends Events {
  options?: PocketChartOptions;
  series?: Series[];
  loading?: boolean;
  background?: string;
  style?: unknown;
  /** Conserva el zoom al cambiar `series`. */
  keepView?: boolean;
  zoomRange?: { from: number | Date; to: number | Date };
  ref?: Ref<PocketChartViewHandle>;
}
type GroupEvents = { [K in keyof Events]?: (key: string, data: Parameters<NonNullable<Events[K]>>[0]) => void };
export interface PocketChartGroupProps extends GroupEvents {
  charts: { key: string; options?: PocketChartOptions; series?: Series[]; loading?: boolean; keepView?: boolean }[];
  background?: string;
  gap?: number;
  style?: unknown;
  keepView?: boolean;
  ref?: Ref<{ chart(key: string): PocketChartViewHandle }>;
}
export declare const PocketChartView: ComponentType<PocketChartViewProps>;
export declare const PocketChartGroup: ComponentType<PocketChartGroupProps>;
export default PocketChartView;
