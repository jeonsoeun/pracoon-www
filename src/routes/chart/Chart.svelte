<script>
  import CandlestickChart from "../../components/CandlestickChart.svelte";
  import SmallBaselineChart from "../../components/SmallBaselineChart.svelte";
</script>

<div class="chart-container">
  <div class="small-chart-container">
    <SmallBaselineChart id="baseline-chart"/>
  </div>
  <CandlestickChart id="line-chart"/>
</div>

<!-- <style lang="scss">
  .chart-container {
    padding: 20px;
    min-width: 1000px;
    height: 500px;
  }
  .small-chart-container{
    width: 200px;
    height: 130px;
  }
</style> -->