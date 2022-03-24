<script>
  import { createChart } from "lightweight-charts";
  import { onMount } from "svelte";
  export let id = "";

  onMount(() => {
    const chart = createChart(id);
    const candlestickChart = chart.addAreaSeries();
    candlestickChart.setData([
      { time: "2018-12-22", value: 32.51 },
      { time: "2018-12-23", value: 31.11 },
      { time: "2018-12-24", value: 27.02 },
      { time: "2018-12-25", value: 27.32 },
      { time: "2018-12-26", value: 25.17 },
      { time: "2018-12-27", value: 28.89 },
      { time: "2018-12-28", value: 25.46 },
      { time: "2018-12-29", value: 23.92 },
      { time: "2018-12-30", value: 22.68 },
      { time: "2019-01-01", value: 27.67 },
      { time: "2019-01-02", value: 28.67 },
      { time: "2019-01-03", value: 22.67 },
      { time: "2019-01-04", value: 21.67 },
      { time: "2019-01-05", value: 20.67 },
      { time: "2019-01-06", value: 20.67 },
      { time: "2019-01-07", value: 22.67 },
      { time: "2019-01-08", value: 29.67 },
    ]);
  });
</script>

<div {id} class="chart" />

<style lang="scss">
  .chart {
    width: 100%;
    height: 100%;
  }
</style>