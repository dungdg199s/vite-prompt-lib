const GasServer = (function () {
  class GasServer {
    constructor(routers) {
      this.routes = routers || [];
    }

    invoke(method, requestUrl, payload) {
      const route = this.routes.find((route) => {
        if (route.method !== method) {
          return false;
        }
        return this._matchPath(route.path, requestUrl) !== null;
      });

      if (!route) {
        throw new Error(`Handler not found for method: ${method} and URL: ${requestUrl}`);
      }

      const request = this._parseRequest(route.path, requestUrl, payload);

      return route.handler(request);
    }

    /**
     *
     * @param {string} pathPattern
     * @param {string} requestUrl
     * @param {any} payload
     * @returns {Object} - The parsed request object
     */
    _parseRequest(pathPattern, requestUrl, payload) {
      const parsedPatternUrl = this._splitUrl(pathPattern);
      const parsedRequestUrl = this._splitUrl(requestUrl);

      const queryParams = this._parseQuery(parsedRequestUrl.search);

      const pathVars = this._matchPath(parsedPatternUrl.pathname, parsedRequestUrl.pathname);

      const request = {
        params: pathVars || {},
        query: queryParams,
        body: payload,
      };

      return request;
    }

    /**
     *
     * @param {*} rawUrl
     * @returns
     */
    _splitUrl(rawUrl) {
      const normalizedUrl = String(rawUrl || "");
      const hashIndex = normalizedUrl.indexOf("#");
      const urlWithoutHash = hashIndex >= 0 ? normalizedUrl.slice(0, hashIndex) : normalizedUrl;
      const queryStartIndex = urlWithoutHash.indexOf("?");

      return {
        pathname: queryStartIndex >= 0 ? urlWithoutHash.slice(0, queryStartIndex) : urlWithoutHash,
        search: queryStartIndex >= 0 ? urlWithoutHash.slice(queryStartIndex + 1) : "",
      };
    }

    _parseQuery(search) {
      if (!search) {
        return {};
      }

      const queryParams = {};
      const pairs = String(search).split("&").filter(Boolean);

      for (const pair of pairs) {
        const equalsIndex = pair.indexOf("=");
        const rawKey = equalsIndex >= 0 ? pair.slice(0, equalsIndex) : pair;
        const rawValue = equalsIndex >= 0 ? pair.slice(equalsIndex + 1) : "";
        const decodedKey = this._safeDecode(rawKey.replace(/\+/g, " "));
        const decodedValue = this._safeDecode(rawValue.replace(/\+/g, " "));
        queryParams[decodedKey] = decodedValue;
      }

      return queryParams;
    }

    _safeDecode(value) {
      try {
        return decodeURIComponent(value);
      } catch (_error) {
        return value;
      }
    }

    _matchPath(pathPattern, requestPath) {
      const patternSegments = String(pathPattern).split("/").filter(Boolean);
      const requestSegments = String(requestPath).split("/").filter(Boolean);

      if (patternSegments.length !== requestSegments.length) {
        return null;
      }

      const params = {};

      for (let i = 0; i < patternSegments.length; i += 1) {
        const patternSegment = patternSegments[i];
        const requestSegment = requestSegments[i];

        if (patternSegment.startsWith(":")) {
          params[patternSegment.slice(1)] = this._safeDecode(requestSegment);
          continue;
        }

        if (patternSegment !== requestSegment) {
          return null;
        }
      }

      return params;
    }
  }
  return GasServer;
})();
