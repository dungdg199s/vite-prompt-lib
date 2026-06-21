export class GasServer {
  handlers = {};

  describe = (name, callback) => {
    this.handlers[name] = callback;
  };

  invoke = (name, payload) => {
    const handler = this.handlers[name];
    if (!handler) {
      throw new Error(`Handler not found for name: ${name}`);
    }
    return handler(payload);
  };

  get(url, callback) {
    this.describe("GET:" + url, (payload) => {
      const request = this._parseRequest(url, payload);
      return callback(request);
    });
  }

  post(url, callback) {
    this.describe("POST:" + url, (payload) => {
      const request = this._parseRequest(url, payload);
      return callback(request);
    });
  }

  delete(url, callback) {
    this.describe("DELETE:" + url, (payload) => {
      const request = this._parseRequest(url, payload);
      return callback(request);
    });
  }

  put(url, callback) {
    this.describe("PUT:" + url, (payload) => {
      const request = this._parseRequest(url, payload);
      return callback(request);
    });
  }

  _parseRequest(url, payload) {
    const parsedUrl = new URL(url, "http://localhost");
    const path = parsedUrl.pathname;

    const queryParams = {};
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      queryParams[key] = value;
    }

    const pathVars = {};
    const patternSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const pathSegments = path.split("/").filter(Boolean);

    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i].startsWith(":")) {
        const varName = patternSegments[i].substring(1);
        pathVars[varName] = pathSegments[i];
      }
    }

    const request = {
      path: pathVars,
      params: queryParams,
      body: payload,
    };

    return request;
  }
}

export const gasServer = new GasServer();
