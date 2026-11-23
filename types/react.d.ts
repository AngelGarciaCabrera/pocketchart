// Tipos de pocketchart/react
import type { ComponentType, Ref } from 'react';
import type { PocketChart, PocketChartOptions, ChartEvents } from './pocketchart.js';
type Handlers = { [K in keyof ChartEvents as `on${Capitalize<K & string>}`]?: (d: ChartEvents[K]) => void };
export type PocketChartProps = PocketChartOptions & Handlers & { className?: string; style?: object; ref?: Ref<PocketChart> };
declare const PocketChartReact: ComponentType<PocketChartProps>;
export default PocketChartReact;
export { PocketChartReact as PocketChart };
