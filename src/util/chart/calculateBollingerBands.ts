import type { CandleChartItem } from '../../types/chart.js';

export function calculateBollingerBands(candles: CandleChartItem[], period = 20, multiplier = 2) {
	if (candles.length < period) {
		console.error('캔들 개수가 기간보다 적습니다.');
		return;
	}

	const upperBandData = [];
	const lowerBandData = [];
	const smaData = [];

	for (let i = period - 1; i < candles.length; i++) {
		const slice = candles.slice(i - period + 1, i + 1);
		const closes = slice.map((c) => c.close);

		// 이동 평균(SMA) 계산
		const sma = closes.reduce((sum, price) => sum + price, 0) / period;

		// 표준 편차(Standard Deviation) 계산
		const variance = closes.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
		const stdDev = Math.sqrt(variance);

		// 볼린저 밴드 계산
		const upperBand = sma + stdDev * multiplier;
		const lowerBand = sma - stdDev * multiplier;

		upperBandData.push({
			time: candles[i].time,
			value: upperBand
		});
		lowerBandData.push({
			time: candles[i].time,
			value: lowerBand
		});
		smaData.push({
			time: candles[i].time,
			value: sma
		});
	}

	return {
		upperBandData,
		lowerBandData,
		smaData
	};
}
