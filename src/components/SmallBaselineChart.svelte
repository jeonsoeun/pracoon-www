<script>
  import { createChart } from "lightweight-charts";
  import { onMount } from "svelte";
  export let id = "";

  const resize = (chart) => {
    if(window.requestAnimationFrame) {
      window.requestAnimationFrame(()=>{
        const chartBoxEl = document.querySelector(`#${id}`);
        const width = chartBoxEl.clientWidth;
        const height = chartBoxEl.clientHeight;
        chart.resize(width,height, true)
      })
    }
  }

  onMount(() => {
    const chart = createChart(id);
    chart.applyOptions({
      timeScale: {
        visible: false,
      },
      priceScale: {
        visible: false,
      },
      grid: {
        horzLines: {
          visible:false
        },
        vertLines: {
          visible: false
        }
      },
      crosshair: {
        vertLine: {
          visible: false,
        },
        horzLine: {
          visible: false
        }
      },
      rightPriceScale: {
        visible: false
      }
    })
    // seriesApi에서 series별로 설정할 수 있는 값 설정
    const baselineSeries = chart.addBaselineSeries({
      /** Baseline 그래프의 기준이 되는 baseValue 설정 */
      baseValue: {
        type: "price",
        price: 25,
      },
      /** Baseline 그래프에서 baseValue보다 위쪽 그래프 색 설정. 아래쪽 그래프는 bottom~~ 으로 설정 */
      topFillColor1: 'rgba(23,172,232,0.4)',
      topFillColor2: 'rgba(23,172,232,0.1)',
      topLineColor: 'rgba(23,172,232,1)',
      /** 마지막 데이터 위치로 그어지는 가로선 표시여부  */
      priceLineVisible: false
    });
    // 데이터 표시
    const data = [
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
      { time: "2019-01-09", value: 21.67 },
    ]
    const fromStr = data.length >= 10 ? data[data.length - 10].time : data[0].time;
    const toStr = data.length > 0 ? data[data.length - 1].time : (new Date()).toUtcString();
    console.log(fromStr, toStr)
    baselineSeries.setData(data);
    // 그래프를 어디서 부터 어디까지 보여줄지 설정. 가장 최근부터 10일(240시간) 보여주기
    console.log(fromStr,toStr)
    chart.timeScale().setVisibleRange({
      from: (new Date(fromStr)).getTime()/1000,
      to: (new Date(toStr)).getTime()/1000
    })
    // 차트가 부모 박스 크기에 맞게 사이즈가 조정되기 때문에 이후에 부모 박스 크기가 바꾸면 다시 그려주도록 해야 사이즈 조절이 된다.
    window.addEventListener('resize',()=>resize(chart))
  });

</script>

<div {id} class="chart" />

<style lang="scss">
  .chart {
    width: 100%;
    height: 100%;
  }
</style>
