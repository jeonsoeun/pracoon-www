/**
 * Fluid SMC Lite 계산 예제
 * 캔들 데이터 형식: { openTime, closeTime, open, close, high, low }
 */

import type { UTCTimestamp } from 'lightweight-charts';
import type { CandleChartItem } from '../../types/chart.js';

interface SupplyDemandZone {
	type: 'supply' | 'demand';
	index: number;
	swingValue: number;
	boxTop: number;
	boxBottom: number;
	poi: number;
	bos: boolean;
	breakIndex: number | null;
	time: UTCTimestamp;
	isOverlapping: boolean;
}

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
 * 새 영역의 POI(newPoi)가 기존 영역(existingZones) 중 하나와 겹치는지 판단하여,
 * 겹치지 않으면 true (그려도 됨), 겹치면 false (겹쳐서 그리지 않음)을 반환합니다.
 * @param {number} newPoi - 새 영역의 POI
 * @param {SupplyDemandZone[]} existingZones - 기존의 supply 또는 demand 영역 배열 (각 객체에 poi 속성이 있음)
 * @param {number} atr - 현재 ATR 값
 * @returns {boolean} 겹치지 않으면 true, 겹치면 false
 */
function checkOverlapping(newPoi: number, existingZones: SupplyDemandZone[], atr: number): boolean {
	const atrThreshold = atr * 2; // 임계치 설정
	for (const zone of existingZones) {
		// 기존 영역의 POI ± 임계치 범위 안에 새 POI가 존재하면 겹친 것으로 판단
		if (newPoi >= zone.poi - atrThreshold && newPoi <= zone.poi + atrThreshold) {
			return false; // 겹침 => 그려도 안 됨
		}
	}
	return true; // 겹치는 영역이 없으므로 그려도 됨
}

/**
 * 주어진 zone에 대해 BOS 조건을 검사하여, 조건을 만족하면 해당 인덱스를 반환합니다.
 * 공급(zone.type === 'supply')이면, 이후 캔들의 종가가 boxTop 이상이면 BOS,
 * 수요(zone.type === 'demand')이면, 이후 캔들의 종가가 boxBottom 이하이면 BOS로 판단합니다.
 * @param {SupplyDemandZone} zone - 공급/수요 영역 정보
 * @param {CandleChartItem[]} candles - 캔들 데이터 배열 (시간순 오름차순)
 * @returns {number | null} BOS 조건을 만족한 캔들의 인덱스, 만족하지 않으면 null
 */
function checkBOSForZone(zone: SupplyDemandZone, candles: CandleChartItem[]): number | null {
	for (let i = zone.index + 1; i < candles.length; i++) {
		if (zone.type === 'supply') {
			// 공급: 이후 캔들의 종가가 boxTop 이상이면 BOS
			if (candles[i].close >= zone.boxTop) {
				return i;
			}
		} else if (zone.type === 'demand') {
			// 수요: 이후 캔들의 종가가 boxBottom 이하이면 BOS
			if (candles[i].close <= zone.boxBottom) {
				return i;
			}
		}
	}
	return null;
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
	const history = options.history || 20;
	const boxWidth = options.boxWidth || 2.5; // 비율: ATR에 곱할 값 (boxWidth/10)

	const atrValues = calculateATR(candles, atrPeriod);

	const swingHighs = [];
	const swingLows = [];
	const supplyZones: SupplyDemandZone[] = [];
	const demandZones: SupplyDemandZone[] = [];
	const bos = []; // Break Of Structure zones

	// 스윙 포인트 및 영역 계산 (초기 단순 구현)
	// swing point 계산은 충분한 양의 데이터가 있어야 함.
	for (let i = swingLength; i < candles.length - swingLength; i++) {
		// 스윙 하이 체크
		if (isSwing(candles, i, swingLength, 'high')) {
			swingHighs.push({ index: i, value: candles[i].high, type: 'high' });
			const atr = atrValues[i];
			if (atr !== null) {
				// 공급(상승 압력) 영역: 스윙 하이를 기준으로 박스 아래쪽
				const boxTop = candles[i].high;
				const atrBuffer = atr * (boxWidth / 10);
				const boxBottom = boxTop - atrBuffer;
				const poi = (boxTop + boxBottom) / 2;
				const isOverlapping = checkOverlapping(poi, supplyZones, atr);
				supplyZones.push({
					type: 'supply',
					index: i,
					swingValue: candles[i].high,
					boxTop,
					boxBottom,
					poi,
					bos: false,
					breakIndex: null as number | null,
					time: candles[i].time,
					isOverlapping: isOverlapping
				});
			}
		}
		// 스윙 로우 체크
		if (isSwing(candles, i, swingLength, 'low')) {
			swingLows.push({ index: i, value: candles[i].low, type: 'low' });
			const atr = atrValues[i];
			if (atr !== null) {
				// 수요(하락 압력) 영역: 스윙 로우를 기준으로 박스 위쪽
				const boxBottom = candles[i].low;
				const atrBuffer = atr * (boxWidth / 10);
				const boxTop = boxBottom + atrBuffer;
				const poi = (boxTop + boxBottom) / 2;
				const isOverlapping = checkOverlapping(poi, demandZones, atr);
				demandZones.push({
					type: 'demand',
					index: i,
					swingValue: candles[i].low,
					boxTop,
					boxBottom,
					poi,
					bos: false,
					breakIndex: null as number | null,
					time: candles[i].time,
					isOverlapping: isOverlapping
				});
			}
		}
	}

	// 오래된 영역 삭제 (history 적용)
	if (supplyZones.length > history) {
		supplyZones.splice(0, supplyZones.length - history);
	}
	if (demandZones.length > history) {
		demandZones.splice(0, demandZones.length - history);
	}

	// BOS 계산: 공급/수요 영역 이후, 가격이 해당 영역을 돌파하는지 체크
	// 공급(BOS): 이후 캔들의 종가가 supply boxTop을 돌파하면
	for (const zone of supplyZones) {
		for (let i = zone.index + 1; i < candles.length; i++) {
			if (candles[i].close >= zone.boxTop && checkBOSForZone(zone, candles) !== null) {
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
			if (candles[i].close <= zone.boxBottom && checkBOSForZone(zone, candles) !== null) {
				zone.bos = true;
				zone.breakIndex = i;
				bos.push({ ...zone });
				break;
			}
		}
	}

	const zigZag: { value: number; time: UTCTimestamp; type: string }[] = [];
	const swingHighsLowsMerged = swingHighs.concat(swingLows).sort((a, b) => a.index - b.index);

	swingHighsLowsMerged.forEach((v, i) => {
		if (i === 0 || v.type !== zigZag[zigZag.length - 1].type) {
			zigZag.push({ time: candles[v.index].time, value: v.value, type: v.type });
		} else {
			if (v.type === 'high') {
				if (v.value > zigZag[zigZag.length - 1].value) {
					zigZag.pop();
					zigZag.push({ time: candles[v.index].time, value: v.value, type: v.type });
				}
			} else {
				if (v.value < zigZag[zigZag.length - 1].value) {
					zigZag.pop();
					zigZag.push({ time: candles[v.index].time, value: v.value, type: v.type });
				}
			}
		}
	});

	return {
		swingHighs,
		swingLows,
		zigZag,
		supplyZones,
		demandZones,
		bos
	};
}
