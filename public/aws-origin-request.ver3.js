/* aws-view-request.js랑 같이 사용해야 하고, 봇인지 아닌지 검사해서 봇일때 html 따로 만들어서 내려주기 */
/* 검증을 못했지만 다른 사람들이 잘 되는걸로 봐서 될 것으로 보인다. 내가 실패한 이유는 view request를 추가하지 않고 테스트해서..; */
const aws = require("aws-sdk");

exports.handler = async (event, context, callback) => {
  const BUCKET_NAME = "pracoon-www";
  let { request } = event.Records[0].cf;
  const { uri, headers } = request || {};
  // 크롤러인지 검사.
  let is_crawler = undefined;
  if ("is-crawler" in headers) {
    is_crawler = headers["is-crawler"][0].value.toLowerCase();
  }
  console.log('is_crawler:'+is_crawler)
  if (is_crawler === "true") {
    const s3 = new aws.S3({
      region: "ap-northeast-2",
    });
    // ogConfig.json 파일 읽어오기
    const configParam = {
      Bucket: BUCKET_NAME,
      Key: `ogConfig.json`,
    };
    let configStr = "";
    try {
      const configObj = await s3.getObject(configParam).promise();
      configStr = configObj?.Body;
    } catch (err) {
      console.log("CONFIG OBJ ERROR: " + err);
      callback(null, request);
      return;
    }
    const configJSON = JSON.parse(configStr);
    console.log("CONFIG STR" + configStr);
    if (configStr) {
      // uri에서 path 분리하기.
      const match = uri.replace(/https:\/\/(\w|\.)+/g, ""); // protocol, host 제거.
      const path = match ? match.split("?")[0] : ""; // search param 제거
      console.log("PATH:" + path);
      if (!path || !path[0]) {
        console.log("NOT EVENT URL");
        callback(null, request);
        return;
      }
      // 파일을 호출하면 callback호출후 return
      const isFileUri = /(\.\w+)$/.test(path);
      if (isFileUri) {
        console.log("FILE URI: " + path);
        callback(null, request);
        return;
      }
      // ogConfig.json에 해당 경로가 있는지 확인.
      if (path && configJSON[path]) {
        const config = configJSON[path];
        const defaultConfig = configJSON["default"];
        return {
          body: `
      <html>
        <head>
          <meta charset="utf-8">
          <title>${config["title"] ?? defaultConfig["title"]}</title>
          <meta property="og:type" content="website" />
          <meta property="og:title" content="${
            config["og:title"] ?? defaultConfig["og:title"]
          }" />
          <meta property="og:description" content="${
            config["og:description"] ?? defaultConfig["og:description"]
          }" />
          <meta property="og:image" content="${defaultConfig["og:url"]}${
            config["og:image"] ?? defaultConfig["og:image"]
          }" />
          <meta property="og:url" content="${
            config["og:url"] ?? defaultConfig["og:url"]
          }" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${
            config["og:title"] ?? defaultConfig["og:title"]
          }" />
          <meta name="twitter:description" content="${
            config["og:description"] ?? defaultConfig["og:description"]
          }" />
          <meta name="twitter:image" content="${defaultConfig["og:url"]}${
            config["og:image"] ?? defaultConfig["og:image"]
          }" />
        </head>
        <body>${configStr}</body>
      </html>
      `,
          status: "200",
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
