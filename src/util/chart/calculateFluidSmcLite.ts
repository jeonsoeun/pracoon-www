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
 * ATR(평균 실제 범위)을 계산하는 함수
 */
function calculateATR(candles: CandleChartItem[], period = 50) {
	const atrValues = [];
	for (let i = 0; i < candles.length; i++) {
		if (i === 0) {
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

	// 지수 이동 평균(EMA)으로 ATR smoothing (원본 Pine 코드와 더 유사하게)
	const smoothedATR = [];
	const multiplier = 2 / (period + 1);

	for (let i = 0; i < candles.length; i++) {
		if (i === 0) {
			smoothedATR.push(atrValues[0]);
		} else if (i < period) {
			let sum = 0;
			for (let j = 0; j <= i; j++) {
				sum += atrValues[j];
			}
			smoothedATR.push(sum / (i + 1));
		} else {
			const prevATR = smoothedATR[i - 1];
			smoothedATR.push(atrValues[i] * multiplier + prevATR * (1 - multiplier));
		}
	}

	return smoothedATR;
}

/**
 * Pine Script의 pivothigh/pivotlow 함수와 유사한 구현
 */
function findPivots(candles: CandleChartItem[], length: number) {
	const swingHighs = [];
	const swingLows = [];

	// 좌우로 length만큼의 캔들을 비교해야 하므로, 범위를 제한
	for (let i = length; i < candles.length - length; i++) {
		let isHigh = true;
		let isLow = true;

		// 좌우 length 캔들과 비교하여 피봇 포인트인지 확인
		for (let j = i - length; j <= i + length; j++) {
			if (j === i) continue; // 자기 자신은 비교하지 않음

			// 범위를 벗어나는 인덱스는 무시
			if (j < 0 || j >= candles.length) continue;

			// 고점 비교: 주변에 더 높은 고점이 있으면 스윙 하이가 아님
			if (candles[j].high > candles[i].high) {
				isHigh = false;
			}

			// 저점 비교: 주변에 더 낮은 저점이 있으면 스윙 로우가 아님
			if (candles[j].low < candles[i].low) {
				isLow = false;
			}
		}

		if (isHigh) {
			swingHighs.push({ index: i, value: candles[i].high });
		}

		if (isLow) {
			swingLows.push({ index: i, value: candles[i].low });
		}
	}

	return { swingHighs, swingLows };
}

/**
 * 새 영역의 POI가 기존 영역과 겹치는지 확인
 */
function checkOverlapping(newPoi: number, existingZones: SupplyDemandZone[], atr: number): boolean {
	const atrThreshold = atr * 2;

	for (const zone of existingZones) {
		// 이미 BOS된 영역은 고려하지 않음 (파인스크립트 버전과 일치)
		if (zone.bos) continue;

		// 기존 영역의 POI ± 임계치 범위 안에 새 POI가 존재하면 겹친 것으로 판단
		if (newPoi >= zone.poi - atrThreshold && newPoi <= zone.poi + atrThreshold) {
			return false; // 겹침 => 그려도 안 됨
		}
	}

	return true; // 겹치는 영역이 없으므로 그려도 됨
}

/**
 * 영역의 BOS 상태를 확인
 */
function checkBOSForZones(
	zones: SupplyDemandZone[],
	candles: CandleChartItem[],
	bosZones: SupplyDemandZone[]
) {
	// 각 영역에 대해 BOS 상태 확인
	for (let i = 0; i < zones.length; i++) {
		const zone = zones[i];

		// 이미 BOS된 영역은 건너뜀
		if (zone.bos) continue;

		for (let j = zone.index + 1; j < candles.length; j++) {
			const isBreak =
				(zone.type === 'supply' && candles[j].close >= zone.boxTop) ||
				(zone.type === 'demand' && candles[j].close <= zone.boxBottom);

			if (isBreak) {
				// BOS 발생: 원본 영역의 상태를 변경하고 BOS 배열에 복사
				zone.bos = true;
				zone.breakIndex = j;

				// BOS 영역 복사본 생성 및 추가
				const bosZone = { ...zone };
				bosZones.push(bosZone);

				break;
			}
		}
	}
}

/**
 * Fluid SMC Lite 계산 및 렌더링 준비 함수
 */
export function calculateFluidSMCLite(
	candles: CandleChartItem[],
	options: { swingLength?: number; atrPeriod?: number; history?: number; boxWidth?: number } = {}
) {
	const swingLength = options.swingLength || 10;
	const atrPeriod = options.atrPeriod || 50;
	const history = options.history || 20;
	const boxWidth = options.boxWidth || 2.5;

	// ATR 계산
	const atrValues = calculateATR(candles, atrPeriod);

	// 스윙 포인트 찾기 (Pine의 pivothigh/pivotlow와 동등한 방식으로)
	const { swingHighs, swingLows } = findPivots(candles, swingLength);

	// 공급/수요 영역 배열 (최대 history 개수만 유지)
	const supplyZones: SupplyDemandZone[] = [];
	const demandZones: SupplyDemandZone[] = [];
	const supplyBOS: SupplyDemandZone[] = [];
	const demandBOS: SupplyDemandZone[] = [];

	// 스윙 하이에서 공급 영역 생성
	for (const high of swingHighs) {
		const i = high.index;
		const atr = atrValues[i];

		if (atr !== null && atr !== undefined) {
			const boxTop = high.value;
			const atrBuffer = atr * (boxWidth / 10);
			const boxBottom = boxTop - atrBuffer;
			const poi = (boxTop + boxBottom) / 2;

			// 겹치는지 확인
			const isOverlapping = !checkOverlapping(poi, supplyZones, atr);

			// 겹치지 않는 경우만 추가 (파인스크립트 버전과 일치)
			if (!isOverlapping) {
				// 배열 크기 관리: history 개수를 초과하면 가장 오래된 항목 제거
				if (supplyZones.length >= history) {
					supplyZones.pop(); // 가장 오래된 항목 제거 (배열 끝)
				}

				// 새 항목을 배열 앞에 추가 (f_array_add_pop 함수 동작과 동일)
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
					isOverlapping
				});
			}
		}
	}

	// 스윙 로우에서 수요 영역 생성
	for (const low of swingLows) {
		const i = low.index;
		const atr = atrValues[i];

		if (atr !== null && atr !== undefined) {
			const boxBottom = low.value;
			const atrBuffer = atr * (boxWidth / 10);
			const boxTop = boxBottom + atrBuffer;
			const poi = (boxTop + boxBottom) / 2;

			// 겹치는지 확인
			const isOverlapping = !checkOverlapping(poi, demandZones, atr);

			// 겹치지 않는 경우만 추가 (파인스크립트 버전과 일치)
			if (!isOverlapping) {
				// 배열 크기 관리: history 개수를 초과하면 가장 오래된 항목 제거
				if (demandZones.length >= history) {
					demandZones.pop(); // 가장 오래된 항목 제거 (배열 끝)
				}

				// 새 항목을 배열 앞에 추가 (f_array_add_pop 함수 동작과 동일)
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
					isOverlapping
				});
			}
		}
	}

	// BOS 확인 및 처리
	checkBOSForZones(supplyZones, candles, supplyBOS);
	checkBOSForZones(demandZones, candles, demandBOS);

	// ZigZag 계산
	const zigZag: { value: number; time: UTCTimestamp; type: string }[] = [];
	const swingAll = [
		...swingHighs.map((h) => ({ ...h, type: 'high' })),
		...swingLows.map((l) => ({ ...l, type: 'low' }))
	].sort((a, b) => a.index - b.index);

	// ZigZag 라인 생성 로직 (파인스크립트 버전과 유사하게 구현)
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
			// 같은 유형의 연속 스윙인 경우, 극점만 유지
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
	}

	// 처리된 결과 반환
	return {
		swingHighs,
		swingLows,
		zigZag,
		supplyZones: supplyZones.filter((z) => !z.isOverlapping && !z.bos), // 렌더링 필터링
		demandZones: demandZones.filter((z) => !z.isOverlapping && !z.bos), // 렌더링 필터링
		supplyBOS,
		demandBOS
	};
}
