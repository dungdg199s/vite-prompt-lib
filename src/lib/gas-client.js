const google = window.google || {
  scripts: {
    run: () => {
      throw new Error("Google Scripts API not available");
    },
  },
};

const _invoke = (url, payload) => {
  return google.scripts.run
    .withSuccessHandler((response) => {
      if (response && response.success) {
        return response.data;
      } else {
        throw new Error(response?.error || "Unknown error from server");
      }
    })
    .withFailureHandler((error) => {
      throw new Error(error.message || "Google Scripts API call failed");
    })
    .invoke("GET:" + url, payload);
};

export const gasClient = {
  get: (url, payload) => _invoke("GET:" + url, payload),
  post: (url, payload) => _invoke("POST:" + url, payload),
  put: (url, payload) => _invoke("PUT:" + url, payload),
  del: (url, payload) => _invoke("DELETE:" + url, payload),
};
