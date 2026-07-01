const gasServer = new GasServer(AppRouters);

function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle(process.env.WEB_APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function invoke(method, requestUrl, payload) {
  const result = gasServer.invoke(method, requestUrl, payload);
  return result;
}
