/**
 * Fluid SMC Lite 계산 예제
 * 캔들 데이터 형식: { openTime, closeTime, open, close, high, low }
 */

import type { CandleChartItem } from '../../types/chart.js';

/**
 * ATR(평균 실제 범위)을 계산하는 함수 (단순 SMA 방식)
 * @param {Array} candles - 캔들 배열
 * @param {number} period - ATR 기간 (기본 50)
 * @returns {Array} 각 캔들에 대한 ATR 값 (인덱스와 동일)
 */
function calculateATR(candles: CandleChartItem[], period = 50) {
	const atrValues = [];
	for (let i = 0; i < candles.length; i++) {
		if (i === 0) {
			// 첫 캔들은 이전 값이 없으므로 단순 high - low
			atrValues.push(candles[i].high - candles[i].low);
		} else {
			const current = candles[i];
			const prevClose = candles[i - 1].close;
			const tr = Math.max(
				current.high - current.low,
				Math.abs(current.high - prevClose),
				Math.abs(current.low - prevClose)
			);
			atrValues.push(tr);
		}
	}
	// 단순 이동 평균으로 ATR smoothing
	const smoothedATR = [];
	for (let i = 0; i < candles.length; i++) {
		if (i < period - 1) {
			smoothedATR.push(null); // 충분한 데이터가 없으면 null
		} else {
			let sum = 0;
			for (let j = i - period + 1; j <= i; j++) {
				sum += atrValues[j];
			}
			smoothedATR.push(sum / period);
		}
	}
	return smoothedATR;
}

/**
 * 캔들 배열에서 주어진 인덱스가 스윙 하이(또는 로우)인지 판단
 * @param {Array} candles - 캔들 배열
 * @param {number} idx - 확인할 인덱스
 * @param {number} swingLength - 좌우 길이
 * @param {string} type - 'high' 또는 'low'
 * @returns {boolean}
 */
function isSwing(
	candles: CandleChartItem[],
	idx: number,
	swingLength: number,
	type: 'high' | 'low' = 'high'
) {
	const currentValue = type === 'high' ? candles[idx].high : candles[idx].low;
	for (let j = idx - swingLength; j <= idx + swingLength; j++) {
		// 인덱스 범위 체크
		if (j < 0 || j >= candles.length || j === idx) continue;
		if (type === 'high' && candles[j].high > currentValue) return false;
		if (type === 'low' && candles[j].low < currentValue) return false;
	}
	return true;
}

/**
 * Fluid SMC Lite 계산 함수
 * @param {Array} candles - 캔들 데이터 배열 (시간순 오름차순)
 * @param {Object} options - 설정값 (swingLength, atrPeriod, history, boxWidth)
 * @returns {Object} 계산 결과: { swingHighs, swingLows, supplyZones, demandZones, bos }
 */
export function calculateFluidSMCLite(
	candles: CandleChartItem[],
	options: { swingLength?: number; atrPeriod?: number; history?: number; boxWidth?: number } = {
		swingLength: 10,
		atrPeriod: 50,
		history: 20,
		boxWidth: 2.5
	}
) {
	const swingLength = options.swingLength || 10;
	const atrPeriod = options.atrPeriod || 50;
	// const history = options.history || 20;
	const boxWidth = options.boxWidth || 2.5; // 비율: ATR에 곱할 값 (boxWidth/10)

	const atrValues = calculateATR(candles, atrPeriod);

	const swingHighs = [];
	const swingLows = [];
	const supplyZones = [];
	const demandZones = [];
	const bos = []; // Break Of Structure zones

	// 스윙 포인트 및 영역 계산 (초기 단순 구현)
	// swing point 계산은 충분한 양의 데이터가 있어야 함.
	for (let i = swingLength; i < candles.length - swingLength; i++) {
		// 스윙 하이 체크
		if (isSwing(candles, i, swingLength, 'high')) {
			swingHighs.push({ index: i, value: candles[i].high });
			const atr = atrValues[i];
			if (atr !== null) {
				// 공급(상승 압력) 영역: 스윙 하이를 기준으로 박스 아래쪽
				const boxTop = candles[i].high;
				const atrBuffer = atr * (boxWidth / 10);
				const boxBottom = boxTop - atrBuffer;
				const poi = (boxTop + boxBottom) / 2;
				supplyZones.push({
					type: 'supply',
					index: i,
					swingValue: candles[i].high,
					boxTop,
					boxBottom,
					poi,
					// break 조건: 이후 캔들 중 종가가 박스 위쪽을 돌파하면 BOS
					bos: false,
					breakIndex: null as number | null
				});
			}
		}
		// 스윙 로우 체크
		if (isSwing(candles, i, swingLength, 'low')) {
			swingLows.push({ index: i, value: candles[i].low });
			const atr = atrValues[i];
			if (atr !== null) {
				// 수요(하락 압력) 영역: 스윙 로우를 기준으로 박스 위쪽
				const boxBottom = candles[i].low;
				const atrBuffer = atr * (boxWidth / 10);
				const boxTop = boxBottom + atrBuffer;
				const poi = (boxTop + boxBottom) / 2;
				demandZones.push({
					type: 'demand',
					index: i,
					swingValue: candles[i].low,
					boxTop,
					boxBottom,
					poi,
					bos: false,
					breakIndex: null as number | null
				});
			}
		}
	}

	// BOS 계산: 공급/수요 영역 이후, 가격이 해당 영역을 돌파하는지 체크
	// 공급(BOS): 이후 캔들의 종가가 supply boxTop을 돌파하면
	for (const zone of supplyZones) {
		for (let i = zone.index + 1; i < candles.length; i++) {
			if (candles[i].close > zone.boxTop) {
				zone.bos = true;
				zone.breakIndex = i;
				bos.push({ ...zone });
				break;
			}
		}
	}
	// 수요(BOS): 이후 캔들의 종가가 demand boxBottom을 하향 돌파하면
	for (const zone of demandZones) {
		for (let i = zone.index + 1; i < candles.length; i++) {
			if (candles[i].close < zone.boxBottom) {
				zone.bos = true;
				zone.breakIndex = i;
				bos.push({ ...zone });
				break;
			}
		}
	}

	return {
		swingHighs,
		swingLows,
		supplyZones,
		demandZones,
		bos
	};
}
