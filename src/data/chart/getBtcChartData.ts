import { btcDataFromBinance } from './fakeChartData.js';

export interface BinanceChartData {
	openTime: number;
	open: string;
	high: string;
	low: string;
	close: string;
	volume: string;
	closeTime: number;
	quoteAssetVolume: string;
	numberOfTrades: number;
	takerBuyBaseAssetVolume: string;
	takerBuyQuoteAssetVolume: string;
}

type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export const getBtcChartData = async (interval: Interval): Promise<BinanceChartData[]> => {
	// const response = await fetch(
	// 	`https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=${interval}&timeZone=4`
	// )
	// 	.then((res) => res.json())
	// 	.then((data) => {
	// 		return data;
	// 	})
	// 	.catch((error) => {
	// 		console.error(error);
	// 		return [];
	// 	});

	const response = btcDataFromBinance;

	const parsedData = response.map((item: (string | number)[]) => {
		return {
			openTime: item[0] as number,
			open: item[1] as string,
			high: item[2] as string,
			low: item[3] as string,
			close: item[4] as string,
			volume: item[5] as string,
			closeTime: item[6] as number,
			quoteAssetVolume: item[7] as string,
			numberOfTrades: item[8] as number,
			takerBuyBaseAssetVolume: item[9] as string,
			takerBuyQuoteAssetVolume: item[10] as string
		};
	});

	return parsedData;
};
