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
 * Wilder 방식의 ATR 계산 (초기값은 단순 평균, 이후는 Wilder 평활법)
 */
function calculateATR(candles: CandleChartItem[], period = 50) {
	const trValues: number[] = [];
	for (let i = 0; i < candles.length; i++) {
		if (i === 0) {
			trValues.push(candles[i].high - candles[i].low);
		} else {
			const current = candles[i];
			const prevClose = candles[i - 1].close;
			const tr = Math.max(
				current.high - current.low,
				Math.abs(current.high - prevClose),
				Math.abs(current.low - prevClose)
			);
			trValues.push(tr);
		}
	}

	const atrValues: (number | null)[] = [];
	for (let i = 0; i < candles.length; i++) {
		if (i === period - 1) {
			// 초기 ATR: 첫 period의 TR 평균
			let sum = 0;
			for (let j = 0; j < period; j++) {
				sum += trValues[j];
			}
			atrValues.push(sum / period);
		} else if (i >= period) {
			const prevATR = atrValues[atrValues.length - 1] as number;
			atrValues.push((prevATR * (period - 1) + trValues[i]) / period);
		} else {
			atrValues.push(null);
		}
	}

	return atrValues;
}

/**
 * 기존 영역과의 중복 여부를 판단 (POI가 기존 영역의 POI ± (atr*2) 범위 안이면 겹치는 것으로 판단)
 */
function canDrawZone(newPoi: number, existingZones: SupplyDemandZone[], atr: number): boolean {
	const atrThreshold = atr * 2;
	for (const zone of existingZones) {
		if (zone.bos) continue;
		if (newPoi >= zone.poi - atrThreshold && newPoi <= zone.poi + atrThreshold) {
			return false;
		}
	}
	return true;
}

/**
 * Pine Script의 pivothigh/pivotlow와 동일한 방식: 좌우 length개 캔들 비교
 */
function findPivots(candles: CandleChartItem[], length: number) {
	const swingHighs: { index: number; value: number }[] = [];
	const swingLows: { index: number; value: number }[] = [];

	// 양쪽으로 length만큼 비교
	for (let i = length; i < candles.length - length; i++) {
		let isHigh = true;
		let isLow = true;

		for (let j = i - length; j <= i + length; j++) {
			if (j === i) continue;
			if (j < 0 || j >= candles.length) continue;
			if (candles[j].high > candles[i].high) isHigh = false;
			if (candles[j].low < candles[i].low) isLow = false;
		}

		if (isHigh) swingHighs.push({ index: i, value: candles[i].high });
		if (isLow) swingLows.push({ index: i, value: candles[i].low });
	}

	return { swingHighs, swingLows };
}

/**
 * BOS (Break Of Structure) 판별: 공급의 경우 박스 상단 돌파, 수요의 경우 박스 하단 돌파시 BOS 처리
 */
function checkBOSForZones(
	zones: SupplyDemandZone[],
	candles: CandleChartItem[],
	bosZones: SupplyDemandZone[]
) {
	for (let i = 0; i < zones.length; i++) {
		const zone = zones[i];
		if (zone.bos) continue;
		for (let j = zone.index + 1; j < candles.length; j++) {
			const isBreak =
				(zone.type === 'supply' && candles[j].close >= zone.boxTop) ||
				(zone.type === 'demand' && candles[j].close <= zone.boxBottom);
			if (isBreak) {
				zone.bos = true;
				zone.breakIndex = j;
				// 원본은 배열에 복사본을 추가함
				bosZones.push({ ...zone });
				break;
			}
		}
	}
}

/**
 * Fluid SMC Lite 계산 함수
 * 원본 Pine 스크립트의 방식대로 스윙 포인트를 배열 앞에 추가(unshift)하고, history를 관리하며 공급/수요 영역 및 BOS, ZigZag를 생성함.
 */
export function calculateFluidSMCLite(
	candles: CandleChartItem[],
	options: { swingLength?: number; atrPeriod?: number; history?: number; boxWidth?: number } = {}
) {
	const swingLength = options.swingLength || 10;
	const atrPeriod = options.atrPeriod || 50;
	const history = options.history || 20;
	const boxWidth = options.boxWidth || 2.5;

	// Wilder 방식 ATR 계산
	const atrValues = calculateATR(candles, atrPeriod);
	// 스윙 포인트 찾기
	const { swingHighs, swingLows } = findPivots(candles, swingLength);

	// 원본은 새로운 스윙 포인트를 배열 앞에 추가하므로, 최신순(역순)으로 처리
	const supplyZones: SupplyDemandZone[] = [];
	const demandZones: SupplyDemandZone[] = [];
	const supplyBOS: SupplyDemandZone[] = [];
	const demandBOS: SupplyDemandZone[] = [];

	// 스윙 하이 -> 공급 영역
	const revSwingHighs = swingHighs.slice().reverse();
	for (const high of revSwingHighs) {
		const i = high.index;
		const atr = atrValues[i];
		if (atr === null || atr === undefined) continue;
		const boxTop = high.value;
		const atrBuffer = atr * (boxWidth / 10);
		const boxBottom = boxTop - atrBuffer;
		const poi = (boxTop + boxBottom) / 2;

		if (canDrawZone(poi, supplyZones, atr)) {
			if (supplyZones.length >= history) {
				supplyZones.pop();
			}
			supplyZones.unshift({
				type: 'supply',
				index: i,
				swingValue: high.value,
				boxTop,
				boxBottom,
				poi,
				bos: false,
				breakIndex: null,
				time: candles[i].time,
				isOverlapping: false
			});
		}
	}

	// 스윙 로우 -> 수요 영역
	const revSwingLows = swingLows.slice().reverse();
	for (const low of revSwingLows) {
		const i = low.index;
		const atr = atrValues[i];
		if (atr === null || atr === undefined) continue;
		const boxBottom = low.value;
		const atrBuffer = atr * (boxWidth / 10);
		const boxTop = boxBottom + atrBuffer;
		const poi = (boxTop + boxBottom) / 2;

		if (canDrawZone(poi, demandZones, atr)) {
			if (demandZones.length >= history) {
				demandZones.pop();
			}
			demandZones.unshift({
				type: 'demand',
				index: i,
				swingValue: low.value,
				boxTop,
				boxBottom,
				poi,
				bos: false,
				breakIndex: null,
				time: candles[i].time,
				isOverlapping: false
			});
		}
	}

	// BOS 처리
	checkBOSForZones(supplyZones, candles, supplyBOS);
	checkBOSForZones(demandZones, candles, demandBOS);

	// ZigZag: 스윙 포인트들을 시간순 정렬하여 연속된 다른 타입만 남김
	const zigZag: { value: number; time: UTCTimestamp; type: string }[] = [];
	const swingAll = [
		...swingHighs.map((h) => ({ ...h, type: 'high' })),
		...swingLows.map((l) => ({ ...l, type: 'low' }))
	].sort((a, b) => a.index - b.index);
	const swingHighsLabels: { time: UTCTimestamp; price: number; text: 'HH' | 'HL' }[] = [];
	const swingLowsLabels: { time: UTCTimestamp; price: number; text: 'LL' | 'LH' }[] = [];

	let prevType = '';
	for (const swing of swingAll) {
		if (prevType === '' || swing.type !== prevType) {
			zigZag.push({
				time: candles[swing.index].time,
				value: swing.value,
				type: swing.type
			});
			prevType = swing.type;
		} else {
			const lastZZ = zigZag[zigZag.length - 1];
			if (
				(swing.type === 'high' && swing.value > lastZZ.value) ||
				(swing.type === 'low' && swing.value < lastZZ.value)
			) {
				zigZag.pop();
				zigZag.push({
					time: candles[swing.index].time,
					value: swing.value,
					type: swing.type
				});
			}
		}
		if (swing.type === 'high') {
			swingHighsLabels.push({
				time: candles[swing.index].time,
				price: swing.value,
				text:
					swingHighsLabels.length > 1 &&
					swingHighsLabels[swingHighsLabels.length - 1].price < swing.value
						? 'HH'
						: 'HL'
			});
		} else {
			swingLowsLabels.push({
				time: candles[swing.index].time,
				price: swing.value - swing.value * 0.005,
				text:
					swingLowsLabels.length > 1 &&
					swingLowsLabels[swingLowsLabels.length - 1].price > swing.value
						? 'LL'
						: 'LH'
			});
		}
	}

	return {
		swingHighs,
		swingLows,
		zigZag,
		// BOS가 발생하지 않은 영역만 렌더링 대상
		supplyZones: supplyZones.filter((z) => !z.bos),
		demandZones: demandZones.filter((z) => !z.bos),
		supplyBOS,
		demandBOS,
		swingLabels: [...swingHighsLabels, ...swingLowsLabels]
	};
}
