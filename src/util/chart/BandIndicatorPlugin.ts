import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	Coordinate,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	Time
} from 'lightweight-charts';
import { PluginBase } from './PluginBase.js';

//
// 인터페이스 정의
//
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

//
// 렌더러 클래스
//
class BandsIndicatorPaneRenderer implements ISeriesPrimitivePaneRenderer {
	_viewData: BandViewData;
	constructor(data: BandViewData) {
		this._viewData = data;
	}
	draw() {}
	drawBackground(target: CanvasRenderingTarget2D) {
		const points = this._viewData.data;
		target.useBitmapCoordinateSpace((scope) => {
			const ctx = scope.context;
			ctx.save();
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

			ctx.strokeStyle = this._viewData.options.lineColor;
			ctx.lineWidth = this._viewData.options.lineWidth;
			ctx.fillStyle = this._viewData.options.fillColor;

			ctx.beginPath();
			const region = new Path2D();
			const lines = new Path2D();
			// 상한선을 따라 이동
			region.moveTo(points[0].x, points[0].upper);
			lines.moveTo(points[0].x, points[0].upper);
			for (const point of points) {
				region.lineTo(point.x, point.upper);
				lines.lineTo(point.x, point.upper);
			}
			const end = points.length - 1;
			region.lineTo(points[end].x, points[end].lower);
			lines.moveTo(points[end].x, points[end].lower);
			// 하한선을 따라 역방향으로 이동
			for (let i = points.length - 2; i >= 0; i--) {
				region.lineTo(points[i].x, points[i].lower);
				lines.lineTo(points[i].x, points[i].lower);
			}
			region.lineTo(points[0].x, points[0].upper);
			region.closePath();

			ctx.fill(region);
			ctx.stroke(lines);

			ctx.restore();
		});
	}
}

//
// ViewData 인터페이스 및 Pane View
//
interface BandRendererData {
	x: Coordinate | number;
	upper: Coordinate | number;
	lower: Coordinate | number;
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

//
// 플러그인 클래스: BandsIndicator
//
export class BandsIndicator extends PluginBase implements ISeriesPrimitive<Time> {
	_paneViews: BandsIndicatorPaneView[];
	_bandsData: BandData[] = [];
	_options: Required<BandsIndicatorOptions>;

	constructor(options: BandsIndicatorOptions = {}) {
		super();
		this._options = { ...defaults, ...options };
		this._paneViews = [new BandsIndicatorPaneView(this)];
	}

	// 외부에서 밴드 데이터를 제공받는 메서드
	setBandsData(bandData: BandData[]) {
		this._bandsData = bandData;
		this.updateAllViews();
	}

	updateAllViews() {
		this._paneViews.forEach((pw) => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}
}
