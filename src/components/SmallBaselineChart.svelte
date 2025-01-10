<script lang="ts">
	import type { IChartApi, UTCTimestamp } from "lightweight-charts";
  import { createChart } from "lightweight-charts";
  import { onMount } from "svelte";
  export let id = "";

  const resize = (chart:IChartApi) => {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        const chartBoxEl = document.querySelector(`#${id}`);
        if(chartBoxEl){
        const width = chartBoxEl.clientWidth;
        const height = chartBoxEl.clientHeight;
        chart.resize(width, height, true);
        }
      });
    }
  };

  onMount(() => {
    const chart = createChart(id);
    chart.applyOptions({
      timeScale: {
        visible: false,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      crosshair: {
        vertLine: {
          visible: false,
        },
        horzLine: {
          visible: false,
        },
      },
      rightPriceScale: {
        visible: false,
      },
    });
    // seriesApi에서 series별로 설정할 수 있는 값 설정
    const baselineSeries = chart.addBaselineSeries({
      /** Baseline 그래프의 기준이 되는 baseValue 설정 */
      baseValue: {
        type: "price",
        price: 30,
      },
      /** Baseline 그래프에서 baseValue보다 위쪽 그래프 색 설정. 아래쪽 그래프는 bottom~~ 으로 설정 */
      topFillColor1: "rgba(23,172,232,0.4)",
      topFillColor2: "rgba(23,172,232,0.1)",
      topLineColor: "rgba(23,172,232,1)",
      /** 마지막 데이터 위치로 그어지는 가로선 표시여부  */
      priceLineVisible: false,
      lineWidth: 2,
    });
    // 데이터 표시
    const data = [
      { time: "2019-01-22", value: 32.51 },
      { time: "2019-01-23", value: 31.11 },
      { time: "2019-01-24", value: 27.02 },
      { time: "2019-01-25", value: 27.32 },
      { time: "2019-01-26", value: 25.17 },
      { time: "2019-01-27", value: 28.89 },
      { time: "2019-01-28", value: 25.46 },
      { time: "2019-01-29", value: 23.92 },
      { time: "2019-01-30", value: 22.68 },
      { time: "2019-02-01", value: 27.67 },
      { time: "2019-02-02", value: 28.67 },
      { time: "2019-02-03", value: 22.67 },
      { time: "2019-02-04", value: 21.67 },
      { time: "2019-02-05", value: 20.67 },
      { time: "2019-02-06", value: 20.67 },
      { time: "2019-02-07", value: 22.67 },
      { time: "2019-02-08", value: 29.67 },
      { time: "2019-02-09", value: 21.67 },
      { time: "2019-02-25", value: 78.3 },
      { time: "2019-02-28", value: 78.7 },
      { time: "2019-03-01", value: 77.22 },
      { time: "2019-03-02", value: 76.64 },
      { time: "2019-03-03", value: 76.5 },
      { time: "2019-03-04", value: 76.64 },
      { time: "2019-03-05", value: 75.46 },
      { time: "2019-03-08", value: 76.42 },
      { time: "2019-03-09", value: 77.76 },
      { time: "2019-03-10", value: 77.68 },
      { time: "2019-03-11", value: 26.6 },
      { time: "2019-03-12", value: 26.78 },
      { time: "2019-03-15", value: 26.28 },
      { time: "2019-03-16", value: 75.88 },
      { time: "2019-03-17", value: 26.38 },
      { time: "2019-03-18", value: 77.0 },
      { time: "2019-03-19", value: 77.4 },
      { time: "2019-03-22", value: 77.4 },
      { time: "2019-03-23", value: 78.2 },
      { time: "2019-03-24", value: 78.68 },
      { time: "2019-03-25", value: 78.66 },
      { time: "2019-03-26", value: 77.88 },
      { time: "2019-03-29", value: 78.02 },
      { time: "2019-03-30", value: 78.68 },
      { time: "2019-04-02", value: 78.14 },
      { time: "2019-04-03", value: 78.3 },
      { time: "2019-04-06", value: 24.06 },
      { time: "2019-04-07", value: 24.5 },
      { time: "2019-04-08", value: 24.76 },
      { time: "2019-04-10", value: 82.1 },
      { time: "2019-04-13", value: 83.72 },
      { time: "2019-04-14", value: 83.55 },
      { time: "2019-04-15", value: 84.92 },
      { time: "2019-04-16", value: 83.32 },
      { time: "2019-04-17", value: 83.04 },
      { time: "2019-04-20", value: 83.92 },
      { time: "2019-04-21", value: 84.24 },
      { time: "2019-04-22", value: 84.0 },
      { time: "2019-04-23", value: 84.26 },
      { time: "2019-04-24", value: 84.0 },
      { time: "2019-04-27", value: 83.8 },
      { time: "2019-04-28", value: 84.32 },
      { time: "2019-04-29", value: 83.88 },
      { time: "2019-04-30", value: 84.58 },
      { time: "2019-05-01", value: 81.2 },
      { time: "2019-05-03", value: 84.35 },
      { time: "2019-05-04", value: 85.66 },
      { time: "2019-05-05", value: 86.51 },
    ];
    const DATA_NUM = 65;
    const fromStr =
      data.length >= 10 ? data[data.length - DATA_NUM].time : data[0].time;
    const toStr =
      data.length > 0 ? data[data.length - 1].time : new Date().toUTCString();
    // 이게 지나가면 data의 time 양식이 {year, day, month }로 바뀐다. 그래서 이것보다 위에서 fromStr, toStr 데이터를 만듦.
    baselineSeries.setData(data);
    // 그래프를 어디서 부터 어디까지 보여줄지 설정. 가장 최근부터 10일(240시간) 보여주기
    chart.timeScale().setVisibleRange({
      from: new Date(fromStr).getTime() / 1000 as UTCTimestamp,
      to: new Date(toStr).getTime() / 1000 as UTCTimestamp,
    });
    // 차트가 부모 박스 크기에 맞게 사이즈가 조정되기 때문에 이후에 부모 박스 크기가 바꾸면 다시 그려주도록 해야 사이즈 조절이 된다.
    window.addEventListener("resize", () => resize(chart));
  });
</script>

<div {id} class="w-full h-full" ></div>
