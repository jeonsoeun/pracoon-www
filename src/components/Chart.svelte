<script lang="ts">
	import { onMount } from 'svelte';
	import { getBtcChartData } from '../data/chart/getBtcChartData.js';
	import type { CandleChartItem } from '../types/chart.js';
	import {
		BaselineSeries,
		CandlestickSeries,
		createChart,
		CrosshairMode,
		HistogramSeries,
		LineSeries,
		type IChartApi,
		type ISeriesApi,
		type LineData,
		type Time,
		type UTCTimestamp
	} from 'lightweight-charts';
	import { calculateBollingerBands } from '../util/chart/calculateBollingerBands.js';
	import { calculateFluidSMCLite } from '../util/chart/calculateFluidSmcLite.js';
	import { type BandData, BandsIndicator } from '../util/chart/BandIndicatorPlugin.js';
	import { type BoxData, BoxIndicator } from '../util/chart/BoxIndicatorPlugin.js';
	import { LabelIndicator, type LabelData } from '../util/chart/LabelPlugin.js';
	import { calculateRSI } from '../util/chart/calculateRsi.js';
	import { BinaryBaselineSeries } from '../util/chart/BinaryBaselineSeries.js';
	const chartId = 'chart';

	let candleChartData = $state<CandleChartItem[]>([]);
	let volumeData = $state<{ time: UTCTimestamp; value: number; color: string }[]>([]);
	let candleSeries = $state<ISeriesApi<'Candlestick', Time>>();
	let volumeSeries = $state<ISeriesApi<'Histogram', Time>>();
	let bollingerSmcBandSeries = $state<ISeriesApi<'Line', Time>>(); // 볼린저 밴드(중간)
	let bollingerBandIndicator = $state<BandsIndicator>(); // 볼린저 밴드 상하와 중간 배경색
	let fluidSmcLiteZigZagSeries = $state<ISeriesApi<'Line', Time>>(); // Fluid SMC Lite
	let bollingerBandColor = $state<string>('rgba(255, 99, 71, 0.5)');
	let bollingerBandColorBg = $state<string>('rgba(255, 99, 71, 0.1)');
	let fluidSmcLiteSupplyColor = $state<string>('rgba(245, 66, 155, 0.5)');
	let fluidSmcLiteDemandColor = $state<string>('rgba(66, 135, 245, 0.5)');
	let fluidSmcLiteZigZagColor = $state<string>('rgba(252, 186, 3, 0.5)');
	let fluidSmcLiteSupplyBoxIndicator = $state<BoxIndicator>();
	let fluidSmcLiteDemandBoxIndicator = $state<BoxIndicator>();
	let fluidSmcLiteBosIndicator = $state<LabelIndicator>();
	let fluidSmcLiteStructureIndicator = $state<LabelIndicator>();
	let chartMain = $state<IChartApi | undefined>(undefined);
	let rsiSeries = $state<ISeriesApi<'Custom', Time> | undefined>();

	onMount(() => {
		getBtcChartData('4h').then((data) => {
			candleChartData = data.map((item) => {
				const time = new Date(item.openTime);
				const volume = Number(item.volume);
				const color = item.close > item.open ? '#26a69a' : '#ef5350';
				volumeData.push({
					time: (time.getTime() / 1000) as UTCTimestamp,
					value: volume,
					color: color
				});
				return {
					time: (time.getTime() / 1000) as UTCTimestamp,
					open: Number(item.open),
					high: Number(item.high),
					low: Number(item.low),
					close: Number(item.close)
				};
			});
		});
		//차트 세팅
		chartMain = createChart(chartId, {
			crosshair: {
				mode: CrosshairMode.Normal
			},
			autoSize: true,
			layout: {
				panes: {
					enableResize: false
				}
			}
		});

		// 세팅 캔들 차트
		candleSeries = chartMain.addSeries(CandlestickSeries, {
			upColor: '#26a69a',
			downColor: '#ef5350',
			borderVisible: false,
			wickUpColor: '#26a69a',
			wickDownColor: '#ef5350'
		});

		candleSeries.setData(candleChartData);

		// 세팅 볼륨 차트
		volumeSeries = chartMain.addSeries(HistogramSeries, {}, 1);

		// 세팅 볼린저밴드 차트
		bollingerSmcBandSeries = chartMain.addSeries(LineSeries, {
			color: bollingerBandColor,
			lineWidth: 1,
			priceLineVisible: false,
			crosshairMarkerVisible: false
		});
		bollingerBandIndicator = new BandsIndicator({
			lineColor: bollingerBandColor,
			fillColor: bollingerBandColorBg
		});
		bollingerSmcBandSeries.attachPrimitive(bollingerBandIndicator);

		// 세팅 Fluid SMC Lite 차트
		fluidSmcLiteZigZagSeries = chartMain.addSeries(LineSeries, {
			color: fluidSmcLiteZigZagColor,
			lineWidth: 1,
			priceLineVisible: false,
			crosshairMarkerVisible: false
		});
		fluidSmcLiteSupplyBoxIndicator = new BoxIndicator({
			fillColor: fluidSmcLiteSupplyColor,
			lineColor: 'rgba(0,0,0,0)'
		});
		fluidSmcLiteDemandBoxIndicator = new BoxIndicator({
			fillColor: fluidSmcLiteDemandColor,
			lineColor: 'rgba(0,0,0,0)'
		});
		fluidSmcLiteBosIndicator = new LabelIndicator({
			textColor: 'rgba(0,0,0,0.5)',
			fontSize: 12
		});
		fluidSmcLiteStructureIndicator = new LabelIndicator({
			textColor: 'rgba(0,0,0,0.4)',
			fontSize: 10
		});
		fluidSmcLiteZigZagSeries.attachPrimitive(fluidSmcLiteSupplyBoxIndicator);
		fluidSmcLiteZigZagSeries.attachPrimitive(fluidSmcLiteDemandBoxIndicator);
		fluidSmcLiteZigZagSeries.attachPrimitive(fluidSmcLiteBosIndicator);
		fluidSmcLiteZigZagSeries.attachPrimitive(fluidSmcLiteStructureIndicator);

		// RSI 차트
		const rsiSeriesView = new BinaryBaselineSeries();
		rsiSeries = chartMain.addCustomSeries(
			rsiSeriesView,
			{
				baseUpperValue: 70,
				baseLowerValue: 30,
				baseLineVisible: true
			},
			2
		);

		// // 차트 클릭하면 좌표 알려줘
		// const canvas = chartMain?.chartElement().getElementsByTagName('canvas')?.[0];
		// canvas.addEventListener('click', function (event) {
		// 	// 캔버스의 위치와 크기를 가져옴
		// 	const rect = canvas.getBoundingClientRect();
		// 	// 클릭한 좌표를 캔버스 기준 좌표로 변환
		// 	const x = event.clientX - rect.left;
		// 	const y = event.clientY - rect.top;

		// 	// 콘솔에 좌표 출력
		// 	console.log(`Clicked at: x = ${x}, y = ${y}`);
		// });
	});

	$effect(() => {
		if (candleChartData) {
			if (candleSeries) {
				candleSeries.setData(candleChartData);
				candleSeries.priceScale().applyOptions({
					autoScale: false,
					scaleMargins: {
						top: 0.1,
						bottom: 0.2
					}
				});
			}
			if (volumeData && volumeSeries) volumeSeries.setData(volumeData);
			// 볼린저 밴드 계산;
			const bollingerBands = calculateBollingerBands(candleChartData);
			if (bollingerBands && bollingerSmcBandSeries) {
				const upperLowerData: BandData[] = bollingerBands.smaData.map((v, i) => {
					return {
						time: v.time,
						upper: bollingerBands.upperBandData[i].value,
						lower: bollingerBands.lowerBandData[i].value
					};
				});
				bollingerSmcBandSeries.setData(bollingerBands.smaData);
				bollingerBandIndicator?.setBandsData(upperLowerData);
			}
			// 세팅 Fluid SMC Lite 박스 그리기
			const smcLite = calculateFluidSMCLite(candleChartData, {
				swingLength: 10, // 오리지널과 동일한 값으로 설정
				atrPeriod: 50,
				history: 20,
				boxWidth: 2.5
			});

			if (smcLite && fluidSmcLiteZigZagSeries) {
				// ZigZag 라인 데이터 설정
				fluidSmcLiteZigZagSeries.setData(smcLite.zigZag);

				// 공급 영역 박스 데이터 설정
				const supplyData: BoxData[] = smcLite.supplyZones
					.filter((v) => !v.bos) // BOS되지 않은 영역만 필터링
					.map((v) => {
						return {
							startTime: v.time,
							endTime: Infinity as UTCTimestamp,
							top: v.boxTop,
							bottom: v.boxBottom
						};
					});

				// 수요 영역 박스 데이터 설정
				const demandData: BoxData[] = smcLite.demandZones
					.filter((v) => !v.bos) // BOS되지 않은 영역만 필터링
					.map((v) => {
						return {
							startTime: v.time,
							endTime: Infinity as UTCTimestamp,
							top: v.boxTop,
							bottom: v.boxBottom
						};
					});

				// BOS 표시 데이터 설정
				const bosList: LabelData[] = smcLite.supplyBOS.concat(smcLite.demandBOS).map((v) => {
					return {
						time: v.time,
						price: v.swingValue,
						text: 'BOS'
					};
				});

				// 데이터 적용
				fluidSmcLiteSupplyBoxIndicator?.setBoxesData(supplyData);
				fluidSmcLiteDemandBoxIndicator?.setBoxesData(demandData);
				// fluidSmcLiteBosIndicator?.setLabelsData(bosList);
				fluidSmcLiteStructureIndicator?.setLabelsData(smcLite.swingLabels);
			}

			// RSI 계산
			const rsiData = calculateRSI(candleChartData, 14);
			if (rsiData && rsiSeries) {
				rsiSeries.setData(rsiData);
			}
		}
	});
</script>

<div class="flex h-[500px] w-full min-w-full">
	<!-- <CandlestickChart id="line-chart" chartData={candleChartData}/> -->
	<div id={chartId} class="h-full w-full"></div>
</div>
