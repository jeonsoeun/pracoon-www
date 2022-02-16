exports.handler = async (event, context, callback) => {
  const bot =
    /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|kakaotalk-scrap|yeti|naverbot|kakaostory-og-reader|daum/g;
  const request = event.Records[0].cf.request;
  const userAgents = request.headers["user-agent"];
  const userAgent =
    userAgents && userAgents.length > 0
      ? userAgents[0]["value"].toLowerCase()
      : undefined;
  if (userAgent) {
    console.log("USER AGENT: " + userAgent);
    const found = userAgent.match(bot);
    console.log("USER AGENT FOUND?: " + found);
    request.headers["is-crawler"] = [
      {
        key: "is-crawler",
        value: `${!!found}`,
      },
    ];
  }
  callback(null, request);
};
