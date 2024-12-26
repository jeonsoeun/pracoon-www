# pracoon-www

주소: https://d2ea53l1kq1p10.cloudfront.net/editor

테스팅용 웹페이지. [svelte](https://svelte.dev/)로 제작되었다.

## 실행
#### [Rollup](https://rollupjs.org)으로 실행(개발용):

```bash
npm run dev
```
#### SPA(single-page-app) mode(확인용):
``` bash
npm run start
```

## 빌드
``` bash
npm run build
```

## 페이지 구조
### home
경로: `/`  
홈화면. 아직 아무것도 없음.
### editor
경로: `/editor`  
[Quill](https://quilljs.com/) Editor를 테스트해본 페이지. 구글 Docs에서 복사했을때 스타일이 유지되도록 했다.
추후에 이미지를 넣었을때 이미지를 base64로 변환해서 인라인으로 붙이는 작업을 해볼 예정이다.

### chart
경로: `/chart`
[LightweightChart](https://tradingview.github.io/lightweight-charts/) 를 이용해서 "baseline chart"와 "candlebar chart"를 테스트해보았다.  
baseline chart는 작고 가로축, 세로축, 배경격자무늬를 다 가리고 두께를 줄여서 화면 상단부에 작게 들어가기 좋게 만들었다.  
candlebar chart는 데이터 양식이 어떻게 들어가는지만 테스트했다.


### svelte로 제작한 이유?
회사 admin tool이 svelte로 제작되어 있다했는데, 해당 코드를 바로 손댈 수 없어서 체험해보려고 만들었다.
