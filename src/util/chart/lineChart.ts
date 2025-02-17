import { createChart } from 'lightweight-charts';

export interface LineChartItem {
	time: string;
	value: number;
}

export const displayLineChart = (elementId: string, chartData: LineChartItem[]) => {
	const chart = createChart(elementId);
	const lineChart = chart.addLineSeries();
	lineChart.setData(chartData);
};
