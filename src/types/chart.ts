import type { UTCTimestamp } from 'lightweight-charts';

export interface CandleChartItem {
	time: UTCTimestamp;
	open: number;
	close: number;
	high: number;
	low: number;
}

export interface LineChartItem {
	time: UTCTimestamp;
	value: number;
}
