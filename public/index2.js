/** @format */

const aws = require("aws-sdk");

exports.handler = async (event, context, callback) => {
  const BUCKET_NAME = "pracoon-www";
  let { request } = event.Records[0].cf;
  const { uri, headers } = request || {};
  // 크롤러인지 검사.
  // let is_crawler = undefined;
  // if ("is-crawler" in headers) {
  //   is_crawler = headers["is-crawler"][0].value.toLowerCase();
  // }
  // if (is_crawler === "true") {
  // 이벤트 페이지 인지 검사.
  const match = /event\/\S+/g.exec(uri);
  const path = match[0].split("?")[0];
  console.log("PATH:" + path);
  if (!path || !path[0]) {
    console.log("NOT EVENT URL");
  }
  const isFileUri = /(\.\w+)$/.test(path);
  if (path && !isFileUri) {
    // return {
    //   body: `
    //   <html>
    //     <head>
    //       <meta charset="utf-8">
    //       <title>${"타이틀"}</title>
    //       <meta property="og:locale" content="ko_KR" />
    //       <meta property="og:type" content="website" />
    //       <meta property="og:title" content="${"타이틀"}" />
    //       <meta property="og:description" content="${"description"}" />
    //       <meta property="og:image" content="${"https://d2ea53l1kq1p10.cloudfront.net/event/evt1/meta-1.png"}" />
    //       <meta property="og:url" content="${"https://d2ea53l1kq1p10.cloudfront.net"}" />
    //       <meta name="twitter:card" content="summary_large_image" />
    //       <meta name="twitter:title" content="${"타이틀"}" />
    //       <meta name="twitter:description" content="${"description"}" />
    //       <meta name="twitter:image" content="${"https://d2ea53l1kq1p10.cloudfront.net/event/evt1/meta-1.png"}" />
    //     </head>
    //     <body></body>
    //   </html>
    //   `,
    //   status: "200",
    //   headers: {
    //     "Content-Type": [
    //       {
    //         key: "Content-Type",
    //         value: "text/html",
    //       },
    //     ],
    //   },
    // };
    const s3 = new aws.S3({
      region: "ap-northeast-2",
    });

    // // 원본 html 가져오기
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
      const configObj = await s3.getObject(configParam).promise();
      const configStr = configObj?.Body;
      console.log("CONFIG STR" + configStr);
      if (configStr) {
        return {
          body: `
      <html>
        <head>
          <meta charset="utf-8">
          <title>${"타이틀"}</title>
          <meta property="og:locale" content="ko_KR" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="${"타이틀"}" />
          <meta property="og:description" content="${"description"}" />
          <meta property="og:image" content="${"https://d2ea53l1kq1p10.cloudfront.net/event/evt1/meta-1.png"}" />
          <meta property="og:url" content="${"https://d2ea53l1kq1p10.cloudfront.net"}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${"타이틀"}" />
          <meta name="twitter:description" content="${"description"}" />
          <meta name="twitter:image" content="${"https://d2ea53l1kq1p10.cloudfront.net/event/evt1/meta-1.png"}" />
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
        //     const configJSON = JSON.parse(configStr);
        //     let newHtmlStr = rootHtmlStr;
        //     if (configJSON.img) {
        //       newHtmlStr = newHtmlStr.replace(
        //         /(?<=<meta property=\"og:image\" content=\"https:\/\/\S+)\/\S+(?=\")/,
        //         configJSON.img
        //       );
        //     }
        //     if (configJSON?.title) {
        //       newHtmlStr = newHtmlStr.replace(
        //         /(?<=<meta property=\"og:title\" content=\")\S+(?=\")/,
        //         configJSON.title
        //       );
        //     }
        //     console.log("NEW HTML:" + newHtmlStr);
        //     await s3
        //       .putObject(
        //         {
        //           Bucket: BUCKET_NAME,
        //           Key: `${path}/index.html`,
        //           Body: newHtmlStr,
        //           ContentType: "text/html",
        //           ACL: "public-read",
        //         },
        //         (err, data) => {
        //           if (err) {
        //             console.error("PUT OBJECT err" + err);
        //           }
        //           console.log("PUT OBJECT: " + data);
        //         }
        //       )
        //       .promise();
        //     return {
        //       status: 200,
        //       statusCode: 200,
        //       body: newHtmlStr,
        //       headers: {
        //   "Content-Type": [
        //     {
        //       key: "Content-Type",
        //       value: "text/html",
        //     },
        //   ],

        //   }
      }
    }
  }
  callback(null, request);
};
