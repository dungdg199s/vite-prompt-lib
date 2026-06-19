const GasServer = {
  handlers: {},
  describle: (name, callback) => {
    GasServer.handlers[name] = callback;
  },
  invoke: (name, payload) => {
    const handler = GasServer.handlers[name];
    if (!handler) {
      throw new Error(`Handler not found for name: ${name}`);
    }
    return handler(payload);
  },
};

/* HANDLERS_IS_REPLACE */

function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("My Apps Script Web App")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function invoke(name, payload) {
  try {
    const result = GasServer.invoke(name, payload);
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
