import { createChart, type UTCTimestamp } from 'lightweight-charts';

export interface CandleChartItem {
	time: UTCTimestamp;
	open: number;
	close: number;
	high: number;
	low: number;
}

export const displayCandleChart = (elementId: string, chartData: CandleChartItem[]) => {
	const chart = createChart(elementId);
	const candlestickChart = chart.addCandlestickSeries();
	candlestickChart.setData(chartData);
};
