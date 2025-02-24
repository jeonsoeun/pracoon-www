import { CanvasRenderingTarget2D } from 'fancy-canvas';
import type {
	Coordinate,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	Time
} from 'lightweight-charts';
import { PluginBase } from './PluginBase.js';

//
// 인터페이스 정의: 외부에서 제공받는 데이터
//
export interface LabelData {
	text: string; // 레이블 텍스트
	price: number; // 레이블의 가격
	time: Time; // 사각형 종료 시간
}

//
// 옵션 인터페이스 및 기본값
//
export interface LabelIndicatorOptions {
	textColor?: string;
	fillColor?: string;
	lineWidth?: number;
	lineColor?: string;
	lineVisible?: boolean;
	align?: 'left' | 'center' | 'right';
	fontSize?: number;
}

const defaults: Required<LabelIndicatorOptions> = {
	textColor: 'rgb(25, 200, 100)',
	fillColor: 'rgba(25, 200, 100, 0.25)',
	lineWidth: 1,
	lineColor: 'rgb(25, 200, 100)',
	lineVisible: false,
	align: 'right',
	fontSize: 12
};

//
// 캔버스에 그리기 위한 변환 데이터 구조
//
interface LabelRendererData {
	x1: Coordinate | number; // 시작 시간의 x 좌표
	y1: Coordinate | number; // top 값의 y 좌표
	value: string; // 레이블 텍스트
}

//
// ViewData: 렌더러에 전달할 데이터와 옵션 (여러 박스를 지원)
//
interface LabelViewData {
	data: LabelRendererData[];
	options: Required<LabelIndicatorOptions>;
}

//
// 캔버스 렌더러: 각 사각형을 그리고 채우는 역할
//
class LabelIndicatorPaneRenderer implements ISeriesPrimitivePaneRenderer {
	_viewData: LabelViewData;
	constructor(viewData: LabelViewData) {
		this._viewData = viewData;
	}
	draw() {}
	drawBackground(target: CanvasRenderingTarget2D) {
		const labels = this._viewData.data;
		target.useBitmapCoordinateSpace((scope) => {
			const ctx = scope.context;
			ctx.save();
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

			// 선과 채우기 색상 설정
			// ctx.strokeStyle = this._viewData.options.lineColor;
			// ctx.lineWidth = this._viewData.options.lineWidth;
			// ctx.fillStyle = this._viewData.options.fillColor;

			// 각 박스를 반복하며 그립니다.
			for (const label of labels) {
				ctx.beginPath();
				ctx.fillText(label.value, label.x1, label.y1);
			}

			ctx.restore();
		});
	}
}

//
// Pane View: LabelData 배열을 캔버스 좌표(LabelRendererData) 배열로 변환
//
class LabelIndicatorPaneView implements ISeriesPrimitivePaneView {
	_source: LabelIndicator;
	_viewData: LabelViewData;
	constructor(source: LabelIndicator) {
		this._source = source;
		this._viewData = {
			data: [],
			options: this._source._options
		};
	}
	update() {
		const series = this._source.series;
		const timeScale = this._source.chart.timeScale();
		// LabelData 배열의 각 항목을 캔버스 좌표로 변환
		this._viewData.data = this._source._boxesData.map((boxData) => {
			const parsed = {
				x1: timeScale.timeToCoordinate(boxData.time) ?? -100,
				y1: series.priceToCoordinate(boxData.price) ?? -100,
				value: boxData.text
			};
			// console.log(boxData, parsed);

			return parsed;
		});
	}
	renderer() {
		return new LabelIndicatorPaneRenderer(this._viewData);
	}
}

//
// 플러그인 클래스: LabelIndicator (여러 박스 지원)
//
export class LabelIndicator extends PluginBase implements ISeriesPrimitive<Time> {
	_paneViews: LabelIndicatorPaneView[];
	_boxesData: LabelData[] = [];
	_options: Required<LabelIndicatorOptions>;

	constructor(options: LabelIndicatorOptions = {}) {
		super();
		this._options = { ...defaults, ...options };
		this._paneViews = [new LabelIndicatorPaneView(this)];
	}

	// 외부에서 여러 LabelData를 설정
	setLabelsData(boxesData: LabelData[]) {
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
