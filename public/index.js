/** @format */
const aws = require("aws-sdk");

exports.handler = async (event, context, callback) => {
  const BUCKET_NAME = "pracoon-www";
  let { request } = event.Records[0].cf;
  const { uri, headers, origin } = request || {};
  // 크롤러인지 검사.

  // event 페이지가 맞나 검사.
  const match = /event\/\S+/g.exec(uri);
  const path = match[0].split("?")[0];
  console.log("PATH:" + path);
  if (!path || !path[0]) {
    console.log("NOT EVENT URL");
    callback(null, request);
    return;
  }
  if (path) {
    const s3 = new aws.S3({
      region: "ap-northeast-2",
    });

    // 만들어둔 event index.html이 있는지 확인
    const eventIndexParams = {
      Bucket: BUCKET_NAME,
      Key: `${path}/index.html`,
    };
    // 만들어둔 event index.html이 있을 경우 return
    let html = "";
    let eventIndexObj = null;
    try {
      eventIndexObj = await s3.getObject(eventIndexParams).promise();
    } catch (err) {
      console.error("ERR PATH/index.html:" + err);
    }
    console.log("Event Index: \n" + eventIndexObj?.Body.toString('utf-8'));
    if (eventIndexObj?.Body) {
      request.uri = uri + "/index.html";
      console.log("REQUEST URI:" + uri + "/index.html");
      callback(null, request);
      return;
    }
    // 저장된 정보가 없으면 /index.html 가져와서configJson에 맞게 수정
    let configStr = "";
    const configS3Obj = await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: `${path}/config.json`,
      })
      .promise();
    configStr = configS3Obj.Body;
    console.log(path + "/CONFIG_JSON:\n" + configStr);
    if (configStr) {
      const configJson = JSON.parse(configStr);
      let rootHtml = "";
      const rootIndexObj = await s3
        .getObject(
          {
            Bucket: BUCKET_NAME,
            Key: `index.html`,
          },
          (err, data) => {
            if (err) {
              console.log(err);
              return;
            }
            const objectData = data.Body.toString("utf-8");
            rootHtml = objectData;
          }
        )
        .promise();
      rootHtml = rootIndexObj.Body.toString("utf-8");
      console.log("GET ROOT_HTML:\n" + rootHtml);
      if (rootHtml) {
        // 데이터 바꾸기.
        let newHtml = rootHtml;
        if (configJson?.img) {
          newHtml = newHtml.replace(
            /(?<=<meta property=\"og:image\" content=\"https:\/\/\S+)\/\S+(?=\")/,
            configJson.img
          );
        }
        if (configJson?.title) {
          newHtml = newHtml.replace(
            /(?<=<meta property=\"og:title\" content=\")\S+(?=\")/,
            configJson.title
          );
        }
        console.log("NEW HTML:\n" + newHtml);
        // index.html 생성
        await s3
          .putObject(
            {
              Bucket: BUCKET_NAME,
              Key: `${path}/index.html`,
              Body: newHtml,
              ContentType: "text/html",
              ACL: "public-read",
            },
            (err, data) => {
              if (err) {
                console.log(err);
              }
              console.log(data);
            }
          )
          .promise();
        request.uri = uri + "/index.html";
        callback(null, request);
        return;
      }
    }
  }
};
