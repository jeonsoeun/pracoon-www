import {
	BaselineSeries,
	LineStyle,
	type IChartApi,
	type ISeriesApi,
	type Time,
	type UTCTimestamp
} from 'lightweight-charts';

export const createRsiSeries = (
	chart: IChartApi,
	setSeries: (series: [ISeriesApi<'Baseline', Time>, ISeriesApi<'Baseline', Time>]) => void,
	paneIndex: number,
	baselineHigh: number,
	baselineLow: number
) => {
	const rsiSeriesHigh = chart.addSeries(
		BaselineSeries,
		{
			baseValue: { type: 'price', price: baselineHigh },
			baseLineVisible: true,
			baseLineStyle: LineStyle.Dotted,
			baseLineWidth: 2,
			baseLineColor: 'rgba(0, 255, 0, 1)',
			bottomFillColor1: 'rgba(0, 255, 0, 0)',
			topFillColor1: 'rgba(0, 255, 0, 0)',
			bottomFillColor2: 'rgba(0, 255, 0, 0)',
			topFillColor2: 'rgba(0, 255, 0, 0.1)',
			lineVisible: true,
			topLineColor: 'rgba(255, 0,0, 1)',
			lineWidth: 1
		},
		paneIndex
	);
	const rsiSeriesLow = chart.addSeries(
		BaselineSeries,
		{
			baseValue: { type: 'price', price: baselineLow },
			baseLineVisible: true,
			baseLineStyle: LineStyle.Dotted,
			bottomFillColor1: 'rgba(0, 0, 255, 0.1)',
			topFillColor1: 'rgba(0, 255, 0, 0)',
			bottomFillColor2: 'rgba(0, 0, 255, 0.1)',
			topFillColor2: 'rgba(0, 255, 0, 0)',
			lineVisible: false
		},
		paneIndex
	);
	setSeries([rsiSeriesHigh, rsiSeriesLow]);
};

export const setRsiSeriesData = (
	rsiSeries: [ISeriesApi<'Baseline', Time>, ISeriesApi<'Baseline', Time>] | undefined,
	data: { time: UTCTimestamp; value: number }[]
) => {
	if (!rsiSeries) return;
	const rsiSeriesHigh = rsiSeries[0];
	const rsiSeriesLow = rsiSeries[1];
	rsiSeriesHigh.setData(data);
	rsiSeriesLow.setData(data);
};
