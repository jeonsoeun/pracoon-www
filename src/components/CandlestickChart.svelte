<script lang='ts'>
  import { onMount } from "svelte";
	import { createChart,type ISeriesApi, type Time } from "lightweight-charts";
  import type { CandleChartItem } from "../types/chart.js";
  interface Props {
    id: string;
    chartData: CandleChartItem[];
  }
  
  let {id, chartData}: Props = $props();
  let candleSeries = $state<ISeriesApi<"Candlestick", Time>>();

  onMount(()=>{
    const chartMain = createChart(id)
    candleSeries = chartMain.addCandlestickSeries()
    candleSeries.setData(chartData)
  })

 $effect(() => {
    if(candleSeries && chartData){
      candleSeries.setData(chartData)
    }
  });
</script>

<div {id} class="w-full h-full" ></div>