import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	AutoscaleInfo,
	Coordinate,
	DataChangedScope,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	Logical,
	Time
} from 'lightweight-charts';
import { PluginBase } from './PluginBase.js';
import { ClosestTimeIndexFinder, UpperLowerInRange } from './PluginHelper.js';

interface BandRendererData {
	x: Coordinate | number;
	upper: Coordinate | number;
	lower: Coordinate | number;
}

class BandsIndicatorPaneRenderer implements ISeriesPrimitivePaneRenderer {
	_viewData: BandViewData;
	constructor(data: BandViewData) {
		this._viewData = data;
	}
	draw() {}
	drawBackground(target: CanvasRenderingTarget2D) {
		const points: BandRendererData[] = this._viewData.data;
		target.useBitmapCoordinateSpace((scope) => {
			const ctx = scope.context;
			ctx.save();
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

			ctx.strokeStyle = this._viewData.options.lineColor;
			ctx.lineWidth = this._viewData.options.lineWidth;
			ctx.beginPath();
			const region = new Path2D();
			const lines = new Path2D();
			region.moveTo(points[0].x, points[0].upper);
			lines.moveTo(points[0].x, points[0].upper);
			for (const point of points) {
				region.lineTo(point.x, point.upper);
				lines.lineTo(point.x, point.upper);
			}
			const end = points.length - 1;
			region.lineTo(points[end].x, points[end].lower);
			lines.moveTo(points[end].x, points[end].lower);
			for (let i = points.length - 2; i >= 0; i--) {
				region.lineTo(points[i].x, points[i].lower);
				lines.lineTo(points[i].x, points[i].lower);
			}
			region.lineTo(points[0].x, points[0].upper);
			region.closePath();
			ctx.stroke(lines);
			ctx.fillStyle = this._viewData.options.fillColor;
			ctx.fill(region);

			ctx.restore();
		});
	}
}

interface BandViewData {
	data: BandRendererData[];
	options: Required<BandsIndicatorOptions>;
}

class BandsIndicatorPaneView implements ISeriesPrimitivePaneView {
	_source: BandsIndicator;
	_data: BandViewData;

	constructor(source: BandsIndicator) {
		this._source = source;
		this._data = {
			data: [],
			options: this._source._options
		};
	}

	update() {
		const series = this._source.series;
		const timeScale = this._source.chart.timeScale();
		this._data.data = this._source._bandsData.map((d) => {
			return {
				x: timeScale.timeToCoordinate(d.time) ?? -100,
				upper: series.priceToCoordinate(d.upper) ?? -100,
				lower: series.priceToCoordinate(d.lower) ?? -100
			};
		});
	}

	renderer() {
		return new BandsIndicatorPaneRenderer(this._data);
	}
}

export interface BandData {
	time: Time;
	upper: number;
	lower: number;
}

export interface BandsIndicatorOptions {
	lineColor?: string;
	fillColor?: string;
	lineWidth?: number;
}

const defaults: Required<BandsIndicatorOptions> = {
	lineColor: 'rgb(25, 200, 100)',
	fillColor: 'rgba(25, 200, 100, 0.25)',
	lineWidth: 1
};

export class BandsIndicator extends PluginBase implements ISeriesPrimitive<Time> {
	_paneViews: BandsIndicatorPaneView[];
	// 기존 series 데이터를 사용하지 않으므로 삭제
	// _seriesData: SeriesDataItemTypeMap[SeriesType][] = [];
	_bandsData: BandData[] = [];
	_options: Required<BandsIndicatorOptions>;
	_timeIndices: ClosestTimeIndexFinder<{ time: number }>;
	_upperLower: UpperLowerInRange<BandData>;

	constructor(options: BandsIndicatorOptions = {}) {
		super();
		this._options = { ...defaults, ...options };
		this._paneViews = [new BandsIndicatorPaneView(this)];
		this._timeIndices = new ClosestTimeIndexFinder([]);
		this._upperLower = new UpperLowerInRange([]);
	}

	// dataUpdated는 더 이상 series 데이터 갱신용으로 사용하지 않고, 필요 시 시간 인덱스만 업데이트하도록 변경합니다.
	dataUpdated(scope: DataChangedScope) {
		if (scope === 'full') {
			this._timeIndices = new ClosestTimeIndexFinder(this._bandsData as { time: number }[]);
		}
	}

	// 외부에서 이미 계산된 밴드 데이터를 제공받는 메서드
	setBandsData(bandData: BandData[]) {
		this._bandsData = bandData;
		this._timeIndices = new ClosestTimeIndexFinder(bandData as { time: number }[]);
		this._upperLower = new UpperLowerInRange(bandData, 4);
		this.updateAllViews();
	}

	autoscaleInfo(startTimePoint: Logical, endTimePoint: Logical): AutoscaleInfo {
		const ts = this.chart.timeScale();
		const startTime = (ts.coordinateToTime(ts.logicalToCoordinate(startTimePoint) ?? 0) ??
			0) as number;
		const endTime = (ts.coordinateToTime(ts.logicalToCoordinate(endTimePoint) ?? 5000000000) ??
			5000000000) as number;
		const startIndex = this._timeIndices.findClosestIndex(startTime, 'left');
		const endIndex = this._timeIndices.findClosestIndex(endTime, 'right');
		const range = this._upperLower.getMinMax(startIndex, endIndex);
		return {
			priceRange: {
				minValue: range.lower,
				maxValue: range.upper
			}
		};
	}

	updateAllViews() {
		this._paneViews.forEach((pw) => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}
}
