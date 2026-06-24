import { gasServer } from "./gas-server";

export function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle(process.env.WEB_APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

export function invoke(method, requestUrl, payload) {
    const result = gasServer.invoke(method, requestUrl, payload);
    return result;
}
