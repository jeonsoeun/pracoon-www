import type { UTCTimestamp } from 'lightweight-charts';

type Candle = {
	time: UTCTimestamp; // UTC timestamp
	open: number;
	high: number;
	low: number;
	close: number;
};

type RSIResult = {
	time: UTCTimestamp;
	value: number;
};

export function calculateRSI(candles: Candle[], period: number = 14): RSIResult[] {
	if (candles.length < period + 1) {
		console.error('Not enough data to calculate RSI');
		return [];
	}

	const rsiResults: RSIResult[] = [];

	// Arrays for gains and losses
	const gains: number[] = [];
	const losses: number[] = [];

	// Calculate initial gains and losses for the first period
	for (let i = 1; i <= period; i++) {
		const change = candles[i].close - candles[i - 1].close;
		gains.push(change > 0 ? change : 0);
		losses.push(change < 0 ? Math.abs(change) : 0);
	}

	// Initial average gain and loss (simple average)
	let avgGain = gains.reduce((a, b) => a + b, 0) / period;
	let avgLoss = losses.reduce((a, b) => a + b, 0) / period;

	// Compute initial RSI value
	let rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
	let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

	// Assign RSI to the candle at index = period (as the first calculated RSI)
	rsiResults.push({ time: candles[period].time, value: rsi });

	// Calculate RSI for subsequent candles using smoothing
	for (let i = period + 1; i < candles.length; i++) {
		const change = candles[i].close - candles[i - 1].close;
		const currentGain = change > 0 ? change : 0;
		const currentLoss = change < 0 ? Math.abs(change) : 0;

		// Smoothing: calculate the new average gain and loss
		avgGain = (avgGain * (period - 1) + currentGain) / period;
		avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

		rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
		rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

		rsiResults.push({ time: candles[i].time, value: rsi });
	}

	return rsiResults;
}
