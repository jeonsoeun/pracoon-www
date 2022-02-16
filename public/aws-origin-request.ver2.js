// 이 방법을 쓰면 근데.. 구글은 되는데 페북이랑 카카오가 안된다.
const aws = require("aws-sdk");

exports.handler = async (event, context, callback) => {
  const BUCKET_NAME = "pracoon-www";
  let { request } = event.Records[0].cf;
  const { uri } = request || {};
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
        // 기존 /index.html의 og tag들을 수정
        const rootHtmlStr = rootHtmlObj?.Body.toString("utf-8");
        let newHtmlStr = rootHtmlStr;
        if (config["og:image"]) {
          newHtmlStr = newHtmlStr.replace(
            /(?<=<meta property=\"og:image\" content=\"https:\/\/\S+)\/\S+(?=\")/,
            config["og:image"]
          ).replace(
            /(?<=<meta name=\"twitter:image\" content=\"https:\/\/\S+)\/\S+(?=\")/,
            config["og:image"]
          );
        }
        if (config["og:title"]) {
          newHtmlStr = newHtmlStr.replace(
            /(?<=<meta property=\"og:title\" content=\")\S+(?=\")/,
            config["og:title"]
          ).replace(
            /(?<=<meta name=\"twitter:title\" content=\")\S+(?=\")/,
            config["og:title"]
          );
        }
        if (config["og:description"]) {
          newHtmlStr = newHtmlStr.replace(
            /(?<=<meta property=\"og:description\" content=\")\S+(?=\")/,
            config["og:description"]
          ).replace(
            /(?<=<meta name=\"twitter:description\" content=\")\S+(?=\")/,
            config["og:description"]
          );
        }
        if (config["og:url"]) {
          newHtmlStr = newHtmlStr.replace(
            /(?<=<meta property=\"og:url\" content=\")\S+(?=\")/,
            config["og:url"]
          );
        }
        if (config["title"]) {
          newHtmlStr = newHtmlStr.replace(
            /(?<=<title>)\S+(?=<\/title>)/,
            config["title"]
          );
        }
        console.log('NEW HTML \n'+newHtmlStr)
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
