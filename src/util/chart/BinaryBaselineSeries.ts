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
			if (this._data === null) return;
			const points = this._data.bars.map((bar) => {
				const coordinatedValue = priceToCoordinate(bar.originalData.value);
				return {
					x: bar.x * scope.horizontalPixelRatio,
					y: coordinatedValue ? coordinatedValue * scope.verticalPixelRatio : -100
				};
			});

			const coordinatedBaseUpperValue = this._option?.baseUpperValue
				? priceToCoordinate(this._option?.baseUpperValue)
				: null;
			const coordinatedBaseLowerValue = this._option?.baseLowerValue
				? priceToCoordinate(this._option?.baseLowerValue)
				: null;
			const baseUpperPoint = coordinatedBaseUpperValue
				? coordinatedBaseUpperValue * scope.verticalPixelRatio
				: null;
			const baseLowerPoint = coordinatedBaseLowerValue
				? coordinatedBaseLowerValue * scope.verticalPixelRatio
				: null;

			const ctx = scope.context;
			ctx.strokeStyle = this._option?.color ?? ctx.strokeStyle;
			ctx.lineWidth = this._option?.lineWidth ?? ctx.lineWidth;

			// 라인 그리기
			const line = new Path2D();
			ctx.beginPath();
			line.moveTo(points[0].x, points[0].y);
			for (const point of points) {
				line.lineTo(point.x, point.y);
			}
			ctx.stroke(line);
			ctx.closePath();

			// 베이스 라인보다 위로 가거나 아래로 갈때 색칠
			const topRegion = new Path2D(); // upper than higher baseLine
			const bottomRegion = new Path2D(); // lower than lower baseLine
			if (baseUpperPoint) topRegion.moveTo(points[0].x, baseUpperPoint);
			if (baseLowerPoint) bottomRegion.moveTo(points[0].x, baseLowerPoint);
			for (const point of points) {
				if (baseUpperPoint && point.y < baseUpperPoint) {
					ctx.beginPath();
					topRegion.lineTo(point.x, point.y);
				}
				if (baseLowerPoint && point.y > baseLowerPoint) {
					ctx.beginPath();
					bottomRegion.lineTo(point.x, point.y);
				}
				if (baseUpperPoint && point.y > baseUpperPoint) {
					topRegion.lineTo(point.x, baseUpperPoint);
					ctx.closePath();
					ctx.fillStyle = this._option?.topFillColor ?? ctx.fillStyle;
					ctx.fill(topRegion);
				}
				if (baseLowerPoint && point.y < baseLowerPoint) {
					bottomRegion.lineTo(point.x, baseLowerPoint);
					ctx.closePath();
					ctx.fillStyle = this._option?.bottomFillColor ?? ctx.fillStyle;
					ctx.fill(bottomRegion);
				}
			}

			ctx.beginPath();
			setLineStyle(ctx, this._option?.baseLineStyle ?? LineStyle.LargeDashed);
			// draw baseLine
			const canvasWidth = scope.bitmapSize.width;
			ctx.strokeStyle = this._option?.baseLineColor ?? ctx.strokeStyle;
			ctx.lineWidth = this._option?.baseLineWidth ?? ctx.lineWidth;
			ctx.fillStyle = this._option?.baseLineFillColor ?? ctx.fillStyle;

			const baseLines = new Path2D(); // draw base line
			const baseLineRegion = new Path2D(); // fill between of two baseLine
			if (baseUpperPoint) {
				baseLines.moveTo(0, baseUpperPoint);
				baseLines.lineTo(canvasWidth, baseUpperPoint);
				baseLineRegion.moveTo(0, baseUpperPoint);
				baseLineRegion.lineTo(canvasWidth, baseUpperPoint);
			}
			if (baseLowerPoint) {
				baseLines.moveTo(0, baseLowerPoint);
				baseLines.lineTo(canvasWidth, baseLowerPoint);
				baseLineRegion.lineTo(canvasWidth, baseLowerPoint);
			}
			if (baseUpperPoint && baseLowerPoint) {
				baseLineRegion.lineTo(0, baseLowerPoint);
				baseLineRegion.lineTo(0, baseUpperPoint);
				ctx.fill(baseLineRegion);
			}
			ctx.stroke(baseLines);
			ctx.closePath();
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
			baseLineFillColor: 'rgba(0,0,0,0)',
			baseLineStyle: LineStyle.LargeDashed,
			baseLineWidth: 1,
			topFillColor: 'rgba(0,0,0,0.5)',
			bottomFillColor: 'rgba(0,0,0,0.2)'
		};
	}
}
