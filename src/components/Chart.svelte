<script lang='ts'>
	import { onMount } from "svelte";
  import { getBtcChartData } from "../data/chart/getBtcChartData.js";
	import type { CandleChartItem } from "../types/chart.js";
	import { createChart, CrosshairMode,type IChartApi, type ISeriesApi, type Time, type UTCTimestamp } from "lightweight-charts";
	import { calculateBollingerBands } from "../util/chart/calculateBollingerBands.js";
	import { calculateFluidSMCLite } from "../util/chart/calculateFluidSmcLite.js";
	import { drawBox } from "../util/chart/drawBox.js";
  
  const chartId = "chart"
  
  let candleChartData = $state<CandleChartItem[]>([]);
  let candleSeries = $state<ISeriesApi<"Candlestick", Time>>();
  let bollingerUpperBandSeries = $state<ISeriesApi<"Line", Time>>(); // 볼린저 밴드(상단)
  let bollingerLowerBandSeries = $state<ISeriesApi<"Line", Time>>(); // 볼린저 밴드(하단)
  let bollingerSmcBandSeries = $state<ISeriesApi<"Line", Time>>(); // 이동 평균선
  let fluidSmcLiteZigZagSeries = $state<ISeriesApi<"Line", Time>>(); // Fluid SMC Lite
  let bollingerBandColor = $state<string>('rgba(255, 99, 71, 99)')
  let fluidSmcLiteSupplyColor = $state<string>('rgba(245, 66, 155, 99)')
  let fluidSmcLiteDemandColor = $state<string>('rgba(66, 135, 245, 99)')
  let fluidSmcLiteZigZagColor = $state<string>('rgba(252, 186, 3, 99)')
  let chartMain = $state<IChartApi|undefined>(undefined)

  onMount(()=>{
    getBtcChartData('4h').then((data) => {
      candleChartData = data.map((item) => {
        const time = new Date(item.openTime)
        return {
          time: time.getTime()/1000 as UTCTimestamp,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        };
      });
    });
    //차트 세팅
    chartMain = createChart(chartId, {
      crosshair: {
        mode: CrosshairMode.Normal
      }
    })
  
    // 세팅 캔들 차트
    candleSeries = chartMain.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    candleSeries.setData(candleChartData)

    // 세팅 볼린저밴드 차트
    bollingerUpperBandSeries = chartMain.addLineSeries({
      color: bollingerBandColor,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,

    })
    bollingerLowerBandSeries = chartMain.addLineSeries({
      color: bollingerBandColor,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    })
    bollingerSmcBandSeries = chartMain.addLineSeries({
      color: bollingerBandColor,
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    })
    // 세팅 Fluid SMC Lite 차트
    fluidSmcLiteZigZagSeries = chartMain.addLineSeries({
        color: fluidSmcLiteZigZagColor,
        lineWidth: 1,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      })
    
  })

 $effect(() => {
    if(candleChartData){
      if(candleSeries)
      candleSeries.setData(candleChartData)
      // 볼린저 밴드 계산
      const bollingerBands = calculateBollingerBands(candleChartData)
      if(bollingerBands && bollingerUpperBandSeries && bollingerLowerBandSeries && bollingerSmcBandSeries){
        bollingerUpperBandSeries.setData(bollingerBands.upperBandData)
        bollingerLowerBandSeries.setData(bollingerBands.lowerBandData)
        bollingerSmcBandSeries.setData(bollingerBands.smaData)
      }
      // 세팅 Fluid SMC Lite 박스 그리기
    const smcLite = calculateFluidSMCLite(candleChartData)
    const canvas = chartMain?.chartElement().getElementsByTagName('canvas')?.[0]
    if(smcLite && fluidSmcLiteZigZagSeries){
      
      smcLite.supplyZones.map(v=>{
        // drawBox(canvas, v.)
      })
      // candleSeries?.priceToCoordinate()
    }
    }
  });


</script>
<div class="flex w-full min-w-full h-[500px]">
  <!-- <CandlestickChart id="line-chart" chartData={candleChartData}/> -->
  <div id={chartId} class="w-full h-full" ></div>
</div>