// inject.js – выполняется на странице, имеет доступ к глобальным объектам

(function() {
  // ---- Перехват fetch ----
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(async (response) => {
      const clone = response.clone();
      let body = '';
      try {
        body = await clone.text();
      } catch (e) {
        body = '[Не удалось прочитать тело]';
      }
      window.postMessage({
        type: 'AJAX_RESPONSE',
        payload: {
          url: response.url,
          status: response.status,
          method: args[1]?.method || 'GET',
          responseBody: body,
          timestamp: new Date().toISOString()
        }
      }, '*');
      return response;
    });
  };

  // ---- Перехват XMLHttpRequest ----
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._method = method;
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this.addEventListener('load', function() {
      let responseBody = '';
      try {
        responseBody = this.responseText;
      } catch (e) {
        responseBody = '[Не удалось прочитать тело]';
      }
      window.postMessage({
        type: 'AJAX_RESPONSE',
        payload: {
          url: this._url,
          status: this.status,
          method: this._method,
          responseBody: responseBody,
          timestamp: new Date().toISOString()
        }
      }, '*');
    });
    return originalXHRSend.apply(this, [body]);
  };
})();