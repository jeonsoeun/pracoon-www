import { CanvasRenderingTarget2D } from 'fancy-canvas';
import type {
	Coordinate,
	ISeriesPrimitive,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	Time
} from 'lightweight-charts';
import { PluginBase } from './PluginBase.js';

//
// 인터페이스 정의: 외부에서 제공받는 데이터
//
export interface BoxData {
	top: number; // 사각형의 위쪽 값 (가격)
	bottom: number; // 사각형의 아래쪽 값 (가격)
	startTime: Time; // 사각형 시작 시간
	endTime: Time; // 사각형 종료 시간
}

//
// 옵션 인터페이스 및 기본값
//
export interface BoxIndicatorOptions {
	lineColor?: string;
	fillColor?: string;
	lineWidth?: number;
}

const defaults: Required<BoxIndicatorOptions> = {
	lineColor: 'rgb(25, 200, 100)',
	fillColor: 'rgba(25, 200, 100, 0.25)',
	lineWidth: 1
};

//
// 캔버스에 그리기 위한 변환 데이터 구조
//
interface BoxRendererData {
	x1: Coordinate | number; // 시작 시간의 x 좌표
	x2: Coordinate | number; // 종료 시간의 x 좌표
	y1: Coordinate | number; // top 값의 y 좌표
	y2: Coordinate | number; // bottom 값의 y 좌표
}

//
// ViewData: 렌더러에 전달할 데이터와 옵션 (여러 박스를 지원)
//
interface BoxViewData {
	data: BoxRendererData[];
	options: Required<BoxIndicatorOptions>;
}

//
// 캔버스 렌더러: 각 사각형을 그리고 채우는 역할
//
class BoxIndicatorPaneRenderer implements IPrimitivePaneRenderer {
	_viewData: BoxViewData;
	constructor(viewData: BoxViewData) {
		this._viewData = viewData;
	}
	draw() {}
	drawBackground(target: CanvasRenderingTarget2D) {
		const boxes = this._viewData.data;
		target.useBitmapCoordinateSpace((scope) => {
			const ctx = scope.context;
			ctx.save();
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

			// 선과 채우기 색상 설정
			ctx.strokeStyle = this._viewData.options.lineColor;
			ctx.lineWidth = this._viewData.options.lineWidth;
			ctx.fillStyle = this._viewData.options.fillColor;

			// 각 박스를 반복하며 그립니다.
			for (const box of boxes) {
				ctx.beginPath();
				ctx.rect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
				ctx.fill();
				ctx.stroke();
			}

			ctx.restore();
		});
	}
}

//
// Pane View: BoxData 배열을 캔버스 좌표(BoxRendererData) 배열로 변환
//
class BoxIndicatorPaneView implements IPrimitivePaneView {
	_source: BoxIndicator;
	_viewData: BoxViewData;
	constructor(source: BoxIndicator) {
		this._source = source;
		this._viewData = {
			data: [],
			options: this._source._options
		};
	}
	update() {
		if (this._source._boxesData.length === 0) return;
		const series = this._source.series;
		const timeScale = this._source.chart.timeScale();
		// BoxData 배열의 각 항목을 캔버스 좌표로 변환
		this._viewData.data = this._source._boxesData.map((boxData) => {
			const x2Parsed =
				boxData.endTime === Infinity
					? timeScale.width()
					: timeScale.timeToCoordinate(boxData.endTime);
			const parsed = {
				x1: timeScale.timeToCoordinate(boxData.startTime) ?? -100,
				x2: x2Parsed ?? -100,
				y1: series.priceToCoordinate(boxData.top) ?? -100,
				y2: series.priceToCoordinate(boxData.bottom) ?? -100
			};
			// console.log(boxData, parsed);

			return parsed;
		});
	}
	renderer() {
		return new BoxIndicatorPaneRenderer(this._viewData);
	}
}

//
// 플러그인 클래스: BoxIndicator (여러 박스 지원)
//
export class BoxIndicator extends PluginBase implements ISeriesPrimitive<Time> {
	_paneViews: BoxIndicatorPaneView[];
	_boxesData: BoxData[] = [];
	_options: Required<BoxIndicatorOptions>;

	constructor(options: BoxIndicatorOptions = {}) {
		super();
		this._options = { ...defaults, ...options };
		this._paneViews = [new BoxIndicatorPaneView(this)];
	}

	// 외부에서 여러 BoxData를 설정
	setBoxesData(boxesData: BoxData[]) {
		this._boxesData = boxesData;
		this.updateAllViews();
	}

	updateAllViews() {
		this._paneViews.forEach((view) => view.update());
	}

	paneViews() {
		return this._paneViews;
	}
}
