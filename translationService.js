/* ==========================================================================
   AgriHealthAI — translationService
   Thin, typed wrapper over the i18n engine so components and services share
   one API. Also localises reference-data objects ({en, hi}).
   ========================================================================== */
(function () {
  "use strict";

  function t(key, params) { return window.i18n.t(key, params); }
  function current() { return window.i18n.getLang(); }
  function set(lang) { window.i18n.setLang(lang); }
  function apply(root) { window.i18n.apply(root); }
  function onChange(fn) { window.i18n.on(fn); }

  /** Localised label from a {en,hi} object (or a plain string). */
  function label(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    var l = current();
    return obj[l] != null ? obj[l] : (obj.en != null ? obj.en : "");
  }

  /** Return the localised form of a reference collection (SOILS, SEASONS, etc.) */
  function localizedList(list) {
    return list.map(function (it) {
      return Object.assign({}, it, { label: label(it) });
    });
  }

  window.translationService = {
    t: t, current: current, set: set, apply: apply, onChange: onChange, on: onChange,
    label: label, localizedList: localizedList
  };
})();
