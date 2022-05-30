const aws = require("aws-sdk");

exports.handler = async (event, context, callback) => {
  const BUCKET_NAME = "pracoon-www";
  let { request } = event.Records[0].cf;
  const { uri } = request || {};
  const s3 = new aws.S3({
    region: "ap-northeast-2",
  });
  // uri에서 path 분리하기.
  const match = uri.replace(/https:\/\/(\w|\.)+/g, ""); // protocol, host 제거.
  let path = match ? match.split("?")[0] : ""; // search param 제거
  console.log("PATH:" + path);
  if (!path || !path[0]) {
    console.log("NO URL");
    callback(null, request);
    return;
  }
  if (path !== "/" && /\./.test()) {
    callback(null, request);
    return;
  }
  if (path[path.length - 1] !== "/") {
    path = path + "/";
  }
  if (path[0] === "/") {
    path = path.slice(1);
  }
  path = path + "index.html";
  // index.html 파일 읽어오기
  const indexParam = {
    Bucket: BUCKET_NAME,
    Key: path,
  };
  let indexHTML = "";
  try {
    const object = await s3.getObject(indexParam).promise();
    indexHTML = object?.Body.toString("utf-8");
  } catch (err) {
    console.log(`GET ${path} ERROR: ` + err);
    callback(null, request);
    return;
  }
  console.log(path, indexHTML);

  return {
    status: 200,
    statusCode: 200,
    body: indexHTML,
    headers: {
      "Content-Type": [
        {
          key: "Content-Type",
          value: "text/html",
        },
      ],
    },
  };
};
