import { gasServer } from "./gas-server";

export function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle(process.env.WEB_APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

export function invoke(name, payload) {
  try {
    const result = gasServer.invoke(name, payload);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}