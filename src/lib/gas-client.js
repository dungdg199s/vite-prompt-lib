import { mockScriptsApi } from "./google-app-script-mock";

const _invoke = (method, url, payload) => {
  return new Promise((resolve, reject) => {
    let scriptsApi = window.google?.script?.run;

    if (!scriptsApi) {
      scriptsApi = mockScriptsApi;
      console.warn(
        "Google Scripts API is not available. Using mock API for testing purposes.",
      );
    }

    console.log(`${method}: ${url}`, payload);

    scriptsApi
      .withSuccessHandler((response) => {
        if (response?.success) {
          resolve(response.data);
          return;
        }

        reject(new Error(response?.error || "Unknown error from server"));
      })
      .withFailureHandler((error) => {
        reject(new Error(error?.message || "Google Scripts API call failed"));
      })
      .invoke(method, url, payload);
  });
};

export const gasClient = {
  get: (url, payload) => _invoke("GET", url, payload),
  post: (url, payload) => _invoke("POST", url, payload),
  put: (url, payload) => _invoke("PUT", url, payload),
  del: (url, payload) => _invoke("DELETE", url, payload),
};
