/** @OnlyCurrentDoc */
function ExportToJsonForWebTextPack() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var json = {};

  var KEY_ROW = 0;
  var DATA_START_ROW = 1;
  var INDEX_COL = 2;
  var START_LANG_COL = 3; /** 인덱스 제외 언어팩 시작 열 */
  var END_LANG_COL = 5; /** 메모 전 언어팩 끝나는 열 */

  // 첫 번째 행에서 Language code 적어둔 부분만 key로 추가.
  var keys = [];
  for (var i = 0; START_LANG_COL + i <= END_LANG_COL; i++) {
    keys[i] = rows[KEY_ROW][i + START_LANG_COL];
  }
  for (var k = 0; k < keys.length; k++) {
    if (keys[k]) {
      json[keys[k]] = {};
    }
  }

  // 각 행에 대해 json 객체를 채웁니다.
  for (var i = DATA_START_ROW; i < rows.length; i++) {
    var index = rows[i][INDEX_COL];
    for (var j = 0; j < keys.length; j++) {
      if (keys[j] && index) {
        var content = rows[i][j + START_LANG_COL].toString();
        var trimed = content.trim();
        json[keys[j]][index] = trimed;
      }
    }
  }

  var jsonString = JSON.stringify(json);
  var cleanJsonString = jsonString.replace(/\\b/g, ""); // Remove \b characters
  Logger.log(cleanJsonString);

  // 복붙할 수 있는 textarea. 오류가 많아서 잠시 주석 처리
  // var html = '<textarea rows="15" cols="50">' + cleanJsonString + '</textarea>'

  // 다운로드 할 수 있게 변경
  var url =
    "data:application/json;charset=utf-8," +
    encodeURIComponent(cleanJsonString);
  var html =
    '<html><body><a id="downloadLink" download="data.json" href="' +
    url +
    '">Click here to download JSON</a></body></html>';

  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(300);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "JSON Preview");
}
