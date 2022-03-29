/** `/event/`* 또는 `/event_kr/*` 경로 일때 /event[_kr]/config.json 을 확인해서 meta 값 변경. */

const aws = require("aws-sdk");

exports.handler = async (event, context, callback) => {
  const BUCKET_NAME = ""; /** TODO:버킷이름 추가 */
  let { request } = event.Records[0].cf;
  const { uri, headers } = request || {};
  // 이벤트 페이지 인지 검사.
  const match = /(event|event_kr)\/\S+/g.exec(uri);
  const path = match ? match[0].split("?")[0] : '';
  console.log("PATH:" + path);
  if (!path || !path[0]) {
    console.log("NOT EVENT URL");
    callback(null, request);
    return;
  }
  const isFileUri = /(\.\w+)$/.test(path);
  if (path && !isFileUri) {
    const s3 = new aws.S3({
      region: "ap-northeast-2",
    });

    // 원본 html 가져오기
    const rootHtmlParam = {
      Bucket: BUCKET_NAME,
      Key: `index.html`,
    };
    const rootHtmlObj = await s3
      .getObject(rootHtmlParam, (err, data) => {
        if (err) {
          console.error("ERR ROOT HTML:" + err);
        } else {
          console.log("ROOT HTML:" + data.Body.toString("utf-8"));
        }
      })
      .promise();
    if (rootHtmlObj?.Body) {
      const rootHtmlStr = rootHtmlObj?.Body.toString("utf-8");
      // config.json 파일 읽어오기
      const configParam = {
        Bucket: BUCKET_NAME,
        Key: `${path}/config.json`,
      };
      let configStr = ''
      try {
        const configObj = await s3.getObject(configParam).promise();
        configStr = configObj?.Body;
      } catch (err) {
        console.log('CONFIG OBJ ERROR: ' + err);
        callback(null, request);
        return;
      }
      console.log("CONFIG STR" + configStr);
      if (configStr) {
        const configJSON = JSON.parse(configStr);
        let newHtmlStr = rootHtmlStr;
        if (configJSON.img) {
          newHtmlStr = newHtmlStr.replace(
            /(?<=<meta property=\"og:image\" content=\"https:\/\/\S+)\/\S+(?=\")/,
            configJSON.img
          );
        }
        if (configJSON?.title) {
          newHtmlStr = newHtmlStr.replace(
            /(?<=<meta property=\"og:title\" content=\")\S+(?=\")/,
            configJSON.title
          );
        }
        console.log("NEW HTML: \n" + newHtmlStr);
        return {
          status: 200,
          statusCode: 200,
          body: newHtmlStr,
          headers: {
            "Content-Type": [
              {
                key: "Content-Type",
                value: "text/html",
              },
            ],
          },
        };
      }
    }
  }
  callback(null, request);
};
