<script lang='ts'>
	import { onMount } from "svelte";
  import CandlestickChart from "../../components/CandlestickChart.svelte";
  import type { BinanceChartData } from "../../data/chart/getBtcChartData.js";
  import { getBtcChartData } from "../../data/chart/getBtcChartData.js";
	import type { CandleChartItem } from "../../util/chart/candleChart.js";
	import type { UTCTimestamp } from "lightweight-charts";
  
  let candleChartData = $state<CandleChartItem[]>([]);

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
  })


</script>
<div class="flex w-full min-w-full h-[500px]">
  <CandlestickChart id="line-chart" chartData={candleChartData}/>
</div>