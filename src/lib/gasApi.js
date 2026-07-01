import { mockScriptsApi } from "./gasApiMock";

let caches = {};
const isCacheEnabled = false;

const _invoke = (method, url, payload) => {
  return new Promise((resolve, reject) => {
    let scriptsApi = window.google?.script?.run;

    if (!scriptsApi) {
      scriptsApi = mockScriptsApi;
    }

    const object = url.split("/")[2];
    if (isCacheEnabled && object) {
      if (method !== "GET") {
        caches[object] = {};
      } else {
        if (isCacheEnabled && caches[object] && caches[object][url]) {
          console.log(`_invoke_cache ${method}: ${url}`, caches);
          resolve(caches[object][url]);
          return;
        }
      }
    }

    scriptsApi
      .withSuccessHandler((response) => {
        if (isCacheEnabled && object && method === "GET") {
          if (!caches[object]) {
            caches[object] = {};
          }
          caches[object][url] = response;
        }
        console.log(`_invoke ${method}: ${url}`, payload, response);
        resolve(response);
      })
      .withFailureHandler((error) => {
        console.error(`_invoke_error ${method}: ${url}`, payload, error);
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
