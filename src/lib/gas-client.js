import { mockScriptsApi } from "./google-app-script-mock";

let caches = {};

const _invoke = (method, url, payload) => {
  console.log(`_invoke ${method}: ${url}`, payload);

  return new Promise((resolve, reject) => {
    let scriptsApi = window.google?.script?.run;

    if (!scriptsApi) {
      scriptsApi = mockScriptsApi;
      console.warn(
        "Google Scripts API is not available. Using mock API for testing purposes.",
      );
    }

    const object = url.split("/")[2];
    console.log(url.split("/"));

    if (object) {
      if (method !== "GET") {
        caches[object] = {};
      } else {
        if (caches[object] && caches[object][url]) {
          console.log(`_invoke_cache ${method}: ${url}`, caches);
          resolve(caches[object][url]);
          return;
        }
      }
    }

    scriptsApi
      .withSuccessHandler((response) => {
        if (object && method === "GET") {
          if (!caches[object]) {
            caches[object] = {};
          }
          caches[object][url] = response;
        }
        resolve(response);
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
