/* ==========================================================================
   AgriHealthAI — storageService
   Consent-friendly local persistence (browser localStorage) with a single
   namespace prefix so everything can be cleared together.
   NOTE: data lives only in THIS browser. It is not synced between devices
   and is never sent to a server in demo mode.
   ========================================================================== */
(function () {
  "use strict";

  var PREFIX = "ah_";

  function ls() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function fullKey(key) { return PREFIX + key; }

  function get(key, fallback) {
    var s = ls();
    if (!s) return fallback;
    try {
      var raw = s.getItem(fullKey(key));
      if (raw == null) return fallback;
      return raw;
    } catch (e) { return fallback; }
  }

  function set(key, value) {
    var s = ls();
    if (!s) return false;
    try { s.setItem(fullKey(key), value); return true; } catch (e) { return false; }
  }

  function remove(key) {
    var s = ls();
    if (!s) return;
    try { s.removeItem(fullKey(key)); } catch (e) {}
  }

  function getJSON(key, fallback) {
    var raw = get(key, null);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function setJSON(key, value) {
    try { return set(key, JSON.stringify(value)); } catch (e) { return false; }
  }

  function clearAll() {
    var s = ls();
    if (!s) return;
    var doomed = [];
    for (var i = 0; i < s.length; i++) {
      var k = s.key(i);
      if (k && k.indexOf(PREFIX) === 0) doomed.push(k);
    }
    doomed.forEach(function (k) { try { s.removeItem(k); } catch (e) {} });
  }

  function keys() {
    var s = ls();
    var out = [];
    if (!s) return out;
    for (var i = 0; i < s.length; i++) {
      var k = s.key(i);
      if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
    }
    return out;
  }

  function isAvailable() { return !!ls(); }

  window.storageService = {
    get: get, set: set, remove: remove,
    getJSON: getJSON, setJSON: setJSON,
    clearAll: clearAll, keys: keys, isAvailable: isAvailable,
    PREFIX: PREFIX
  };
})();
