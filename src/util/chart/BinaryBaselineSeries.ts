import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	type Time,
	type LineData,
	LineStyle,
	type ICustomSeriesPaneView,
	type CustomSeriesOptions,
	type LineWidth,
	type CustomSeriesPricePlotValues,
	type WhitespaceData,
	type ICustomSeriesPaneRenderer,
	type PriceToCoordinateConverter,
	type PaneRendererCustomData,
	customSeriesDefaultOptions
} from 'lightweight-charts';
import { setLineStyle } from './drawLine.js';

//
// 인터페이스 정의
//

export interface BinaryBaselineSeriesOptions extends CustomSeriesOptions {
	lineWidth?: LineWidth;
	lineStyle?: LineStyle;
	baseUpperValue?: number;
	baseLowerValue?: number;
	baseLineFillColor?: string;
	topFillColor?: string;
	bottomFillColor?: string;
}
//
// 렌더러 클래스
//
class BinaryBaselineSeriesRenderer implements ICustomSeriesPaneRenderer {
	_data: PaneRendererCustomData<Time, LineData> | null = null;
	_option: BinaryBaselineSeriesOptions | null = null;

	update({
		data,
		option
	}: {
		data: PaneRendererCustomData<Time, LineData>;
		option: BinaryBaselineSeriesOptions;
	}) {
		this._data = data;
		this._option = option;
	}
	// draw main line and base line
	draw(target: CanvasRenderingTarget2D, priceToCoordinate: PriceToCoordinateConverter) {
		target.useBitmapCoordinateSpace((scope) => {
			const visibleRange = this._data?.visibleRange;
			if (
				this._data === null ||
				this._data.bars.length === 0 ||
				!visibleRange ||
				this._option === null
			) {
				return;
			}
			const ctx = scope.context;
			const canvasWidth = scope.bitmapSize.width;

			// ② 데이터 포인트 계산 (x, y 좌표에 horizontal/vertical pixel ratio 적용)
			console.log('bars', this._data.bars);
			const points = this._data.bars
				.filter((_, i) => i >= visibleRange.from && i <= visibleRange.to)
				.map((bar) => {
					const coordinatedValue = priceToCoordinate(bar.originalData.value);
					return {
						x: bar.x * scope.horizontalPixelRatio,
						y: coordinatedValue ? coordinatedValue * scope.verticalPixelRatio : -100
					};
				});

			// ③ 베이스라인 y 좌표 계산 (데이터 영역 내의 y 좌표)
			const coordinatedBaseUpperValue = this._option?.baseUpperValue
				? priceToCoordinate(this._option.baseUpperValue)
				: null;
			const coordinatedBaseLowerValue = this._option?.baseLowerValue
				? priceToCoordinate(this._option.baseLowerValue)
				: null;
			const baseUpperY =
				coordinatedBaseUpperValue !== null
					? coordinatedBaseUpperValue * scope.verticalPixelRatio
					: null;
			const baseLowerY =
				coordinatedBaseLowerValue !== null
					? coordinatedBaseLowerValue * scope.verticalPixelRatio
					: null;

			// ④ 데이터 라인 그리기
			const linePath = new Path2D();
			ctx.beginPath();
			linePath.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				linePath.lineTo(points[i].x, points[i].y);
			}
			ctx.closePath();
			ctx.strokeStyle = this._option?.color ?? ctx.strokeStyle;
			ctx.lineWidth = this._option?.lineWidth ?? ctx.lineWidth;
			ctx.stroke(linePath);

			// ⑤ 보조 함수: 두 점 사이에서 베이스라인과의 교차점 계산 (선형 보간)
			function getIntersection(
				p1: { x: number; y: number },
				p2: { x: number; y: number },
				baseY: number
			) {
				const t = (baseY - p1.y) / (p2.y - p1.y);
				const x = p1.x + t * (p2.x - p1.x);
				return { x, y: baseY };
			}

			// ⑥ fill 영역 구성 함수 (isAbove === true: 상단 영역, false: 하단 영역)
			function buildFillRegions(
				points: { x: number; y: number }[],
				baseY: number,
				isAbove: boolean
			) {
				const regions = [];
				let currentPath = null;
				// 내부 여부 판단: 상단은 y값이 baseY보다 작아야 함, 하단은 baseY보다 커야 함.
				const isInside = (p: { x: number; y: number }) => (isAbove ? p.y < baseY : p.y > baseY);

				// 만약 첫 포인트가 내부에 있다면, 보이는 좌측 경계(0)에서 교차했다고 가정
				if (isInside(points[0])) {
					currentPath = new Path2D();
					currentPath.moveTo(0, baseY); // 보이는 좌측 경계
					currentPath.lineTo(points[0].x, points[0].y);
				}
				ctx.beginPath();
				for (let i = 0; i < points.length - 1; i++) {
					const p1 = points[i];
					const p2 = points[i + 1];
					const p1Inside = isInside(p1);
					const p2Inside = isInside(p2);

					if (p1Inside && p2Inside) {
						// 구간이 모두 내부면 계속 연결
						if (!currentPath) {
							currentPath = new Path2D();
							currentPath.moveTo(p1.x, baseY);
							currentPath.lineTo(p1.x, p1.y);
						}
						currentPath.lineTo(p2.x, p2.y);
					} else if (p1Inside && !p2Inside) {
						// 내부에서 외부로 나갈 때: 교차점 계산 후 경로 마감
						const inter = getIntersection(p1, p2, baseY);
						if (currentPath) {
							currentPath.lineTo(inter.x, inter.y);
							regions.push(currentPath);
							currentPath = null;
						}
					} else if (!p1Inside && p2Inside) {
						// 외부에서 내부로 들어올 때: 교차점 계산 후 새 경로 시작
						const inter = getIntersection(p1, p2, baseY);
						currentPath = new Path2D();
						currentPath.moveTo(inter.x, inter.y);
						currentPath.lineTo(p2.x, p2.y);
					}
					// 양쪽 모두 외부인 경우는 아무것도 하지 않음
				}

				// 만약 열린 경로가 남아 있다면, 마지막 포인트 x에서 마감
				if (currentPath) {
					currentPath.lineTo(points[points.length - 1].x, baseY);
					regions.push(currentPath);
				}
				return regions;
			}
			ctx.closePath();

			// ⑦ 상단(베이스라인 위) 영역 채우기
			if (baseUpperY !== null) {
				const topRegions = buildFillRegions(points, baseUpperY, true);
				for (const region of topRegions) {
					ctx.fillStyle = this._option?.topFillColor ?? ctx.fillStyle;
					ctx.fill(region);
				}
			}

			// ⑧ 하단(베이스라인 아래) 영역 채우기
			if (baseLowerY !== null) {
				const bottomRegions = buildFillRegions(points, baseLowerY, false);
				for (const region of bottomRegions) {
					ctx.fillStyle = this._option?.bottomFillColor ?? ctx.fillStyle;
					ctx.fill(region);
				}
			}
			ctx.beginPath();
			// ⑨ 베이스라인 그리기 (보이는 좌측 ~ 우측)
			setLineStyle(ctx, this._option?.baseLineStyle ?? LineStyle.LargeDashed);
			ctx.strokeStyle = this._option?.baseLineColor ?? ctx.strokeStyle;
			ctx.lineWidth = this._option?.baseLineWidth ?? ctx.lineWidth;
			ctx.fillStyle = this._option?.baseLineFillColor ?? ctx.fillStyle;
			const baseLinePath = new Path2D();
			const baseLineFillPath = new Path2D();
			if (baseUpperY !== null) {
				baseLinePath.moveTo(0, baseUpperY);
				baseLinePath.lineTo(canvasWidth, baseUpperY);
			}
			if (baseLowerY !== null) {
				baseLinePath.moveTo(0, baseLowerY);
				baseLinePath.lineTo(canvasWidth, baseLowerY);
			}
			if (baseUpperY !== null && baseLowerY !== null) {
				baseLineFillPath.moveTo(0, baseUpperY);
				baseLineFillPath.lineTo(0, baseLowerY);
				baseLineFillPath.lineTo(canvasWidth, baseLowerY);
				baseLineFillPath.lineTo(canvasWidth, baseUpperY);
				baseLineFillPath.lineTo(0, baseUpperY);
			}
			ctx.closePath();
			ctx.stroke(baseLinePath);
			ctx.fill(baseLineFillPath);
		});
	}
}

//
// 플러그인 클래스: BinaryBaseline
//
export class BinaryBaselineSeries
	implements ICustomSeriesPaneView<Time, LineData, BinaryBaselineSeriesOptions>
{
	// _paneViews: BinaryBaselinePaneView[];
	// _lineData: LineData[] = [];
	// _options: BinaryBaselineSeriesOptions;
	_renderer: BinaryBaselineSeriesRenderer;
	constructor() {
		this._renderer = new BinaryBaselineSeriesRenderer();
	}

	priceValueBuilder(plotRow: LineData): CustomSeriesPricePlotValues {
		return [plotRow.value];
	}

	isWhitespace(data: LineData | WhitespaceData): data is WhitespaceData {
		return (data as Partial<LineData>).value === undefined;
	}

	renderer(): BinaryBaselineSeriesRenderer {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, LineData>,
		seriesOptions: BinaryBaselineSeriesOptions
	): void {
		console.log('update', data, seriesOptions);
		this._renderer.update({
			data: data,
			option: seriesOptions
		});
	}

	defaultOptions(): BinaryBaselineSeriesOptions {
		return {
			...customSeriesDefaultOptions,
			color: 'rgb(130, 20, 200)',
			lineWidth: 2,
			lineStyle: LineStyle.Solid,
			baseLineColor: 'rgb(100, 100, 100)',
			baseLineFillColor: 'rgba(189, 80, 180, 0.1)',
			baseLineStyle: LineStyle.LargeDashed,
			baseLineWidth: 1,
			topFillColor: 'rgba(0, 100, 200, 0.4)',
			bottomFillColor: 'rgba(200, 100, 0, 0.4)'
		};
	}
}
