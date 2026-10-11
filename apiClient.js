/* ==========================================================================
   AgriHealthAI — apiClient
   Thin fetch wrapper with timeouts + a cached backend-availability probe.
   Services use this to talk to the optional backend, and fall back to the
   local demo engine when no backend is configured/reachable.
   ========================================================================== */
(function () {
  "use strict";

  var cfg = window.AGRI_CONFIG || {};
  var base = (cfg.apiBase || "").replace(/\/$/, "");
  var probeResult = null; // null = unknown, true/false once known
  var probePromise = null;

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (v) { clearTimeout(timer); resolve(v); },
                   function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function isFileProtocol() {
    return typeof location !== "undefined" && location.protocol === "file:";
  }

  function probe() {
    if (probeResult !== null) return Promise.resolve(probeResult);
    if (probePromise) return probePromise;
    // file:// pages cannot reach a same-origin API -> demo mode
    if (isFileProtocol() && !base) {
      probeResult = false;
      return Promise.resolve(false);
    }
    probePromise = withTimeout(
      fetch(base + "/api/health", { method: "GET", headers: { "Accept": "application/json" } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("bad status")); })
        .then(function (j) { probeResult = !!(j && j.ok); return probeResult; }),
      cfg.probeTimeoutMs || 1200
    ).catch(function () { probeResult = false; return false; });
    return probePromise;
  }

  function request(method, path, body) {
    var opts = {
      method: method,
      headers: { "Accept": "application/json" },
      signal: undefined
    };
    if (body != null) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    var controller;
    if (typeof AbortController !== "undefined") {
      controller = new AbortController();
      opts.signal = controller.signal;
    }
    var p = fetch(base + path, opts).then(function (res) {
      return res.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = { raw: txt }; }
        if (!res.ok) {
          var err = new Error((data && data.error) || ("HTTP " + res.status));
          err.status = res.status;
          err.payload = data;
          throw err;
        }
        return data;
      });
    });
    return withTimeout(p, cfg.requestTimeoutMs || 20000).catch(function (e) {
      if (controller && e && e.message === "timeout") controller.abort();
      throw e;
    });
  }

  window.apiClient = {
    probe: probe,
    get: function (path) { return request("GET", path); },
    post: function (path, body) { return request("POST", path, body); },
    isBackendConfigured: function () { return !!base || (!isFileProtocol()); },
    base: function () { return base; }
  };
})();
