/* ==========================================================================
   AgriHealthAI — UI helpers
   Toasts, accessible confirm dialogs, focus trapping, safe images,
   formatting, reveals and small DOM utilities used by every page.
   ========================================================================== */
(function () {
  "use strict";

  var t = function (k, p) { return window.i18n ? window.i18n.t(k, p) : k; };

  /* ---------- escape ---------- */
  function escape(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- toasts ---------- */
  function toastRoot() {
    var r = document.getElementById("toast-root");
    if (!r) { r = document.createElement("div"); r.id = "toast-root"; document.body.appendChild(r); }
    return r;
  }
  function toast(message, type, ms) {
    var el = document.createElement("div");
    el.className = "toast" + (type ? " toast--" + type : "");
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.innerHTML = '<span>' + escape(message) + '</span>' +
      '<button type="button" aria-label="' + escape(t("common.close")) + '">&times;</button>';
    var close = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    el.querySelector("button").addEventListener("click", close);
    toastRoot().appendChild(el);
    setTimeout(close, ms || 4200);
    return el;
  }

  /* ---------- confirm dialog (accessible) ---------- */
  function confirmDialog(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var prevFocus = document.activeElement;
      var backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      var title = opts.title || t("common.confirm");
      var text = opts.text || "";
      var okText = opts.okText || t("common.confirm");
      var cancelText = opts.cancelText || t("common.cancel");
      var danger = opts.danger ? " btn--danger" : " btn--primary";
      backdrop.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="cd-title">' +
          '<h3 id="cd-title">' + escape(title) + '</h3>' +
          (text ? '<p class="muted">' + escape(text) + '</p>' : "") +
          '<div class="modal__actions">' +
            '<button type="button" class="btn btn--secondary" data-act="cancel">' + escape(cancelText) + '</button>' +
            '<button type="button" class="btn' + danger + '" data-act="ok">' + escape(okText) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(backdrop);

      var okBtn = backdrop.querySelector('[data-act="ok"]');
      var cancelBtn = backdrop.querySelector('[data-act="cancel"]');
      okBtn.focus();

      function done(val) {
        document.removeEventListener("keydown", onKey);
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
        resolve(val);
      }
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); done(false); }
        if (e.key === "Tab") {
          var focusables = backdrop.querySelectorAll("button");
          if (!focusables.length) return;
          var first = focusables[0], last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      okBtn.addEventListener("click", function () { done(true); });
      cancelBtn.addEventListener("click", function () { done(false); });
      backdrop.addEventListener("click", function (e) { if (e.target === backdrop) done(false); });
      document.addEventListener("keydown", onKey);
    });
  }

  /* ---------- open modal (content provided) ---------- */
  function openModal(innerHTML, opts) {
    opts = opts || {};
    var prevFocus = document.activeElement;
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = '<div class="modal' + (opts.wide ? " modal--wide" : "") + '" role="dialog" aria-modal="true">' + innerHTML + '</div>';
    document.body.appendChild(backdrop);
    var modal = backdrop.querySelector(".modal");
    var closeBtn = backdrop.querySelector("[data-modal-close]");
    if (closeBtn) closeBtn.focus();
    function close() {
      document.removeEventListener("keydown", onKey);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        var f = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    backdrop.addEventListener("click", function (e) { if (e.target === backdrop) close(); });
    var closeEls = backdrop.querySelectorAll("[data-modal-close]");
    for (var i = 0; i < closeEls.length; i++) closeEls[i].addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return { close: close, el: modal, backdrop: backdrop };
  }

  /* ---------- image fallback ---------- */
  function fallbackSVG(label) {
    var txt = escape((label || t("a11y.imageFallback")).slice(0, 26));
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">' +
      '<rect width="640" height="400" fill="#DDF3E5"/>' +
      '<path d="M0 320 Q160 240 320 320 T640 320 V400 H0 Z" fill="#21865B" opacity="0.25"/>' +
      '<circle cx="480" cy="110" r="42" fill="#21865B" opacity="0.35"/>' +
      '<text x="50%" y="56%" font-family="Inter,Arial,sans-serif" font-size="22" fill="#14543B" text-anchor="middle">' + txt + '</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }
  function installImageFallback() {
    document.addEventListener("error", function (e) {
      var el = e.target;
      if (!el || el.tagName !== "IMG" || el.dataset.fallbackApplied) return;
      el.dataset.fallbackApplied = "1";
      el.src = fallbackSVG(el.alt);
      el.classList.add("img-fallback");
    }, true);
  }

  /* ---------- formatting ---------- */
  function formatNumber(n, digits) {
    if (n == null || isNaN(n)) return "—";
    var d = digits == null ? 0 : digits;
    return Number(n).toLocaleString(window.i18n && window.i18n.getLang() === "hi" ? "hi-IN" : "en-IN", {
      minimumFractionDigits: d, maximumFractionDigits: d
    });
  }
  function formatINR(n, digits) {
    if (n == null || isNaN(n)) return "—";
    return "\u20B9" + formatNumber(Math.round(n), digits || 0);
  }
  function formatRange(a, b, fmt) {
    fmt = fmt || formatNumber;
    if (a == null && b == null) return "—";
    if (a != null && b != null && a !== b) return fmt(a) + " – " + fmt(b);
    return fmt(a != null ? a : b);
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function round(n, step) { step = step || 1; return Math.round(n / step) * step; }

  /* ---------- reveal on scroll ---------- */
  function reveal(selector) {
    var els = document.querySelectorAll(selector || ".reveal");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* ---------- misc DOM ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (k === "html") node.innerHTML = attrs[k];
      else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms || 200);
    };
  }

  window.UI = {
    escape: escape,
    toast: toast,
    confirm: confirmDialog,
    openModal: openModal,
    fallbackSVG: fallbackSVG,
    installImageFallback: installImageFallback,
    formatNumber: formatNumber,
    formatINR: formatINR,
    formatRange: formatRange,
    clamp: clamp,
    round: round,
    reveal: reveal,
    el: el, qs: qs, qsa: qsa,
    download: download,
    debounce: debounce
  };

  installImageFallback();
})();
