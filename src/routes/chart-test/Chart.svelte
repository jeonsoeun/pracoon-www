<script>
  import CandlestickChart from "../../components/CandlestickChart.svelte";
  import SmallBaselineChart from "../../components/SmallBaselineChart.svelte";
</script>

<div class="p-5 min-w-[1000px] h-[500px]">
  <div class="w-[200px] h-[130px]">
    <SmallBaselineChart id="baseline-chart"/>
  </div>
  <CandlestickChart id="line-chart"/>
</div>