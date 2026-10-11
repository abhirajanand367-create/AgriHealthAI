/* Privacy page: clear locally stored data. */
(function () {
  "use strict";
  var t = function (k, p) { return window.translationService.t(k, p); };

  document.getElementById("clear-local").addEventListener("click", function () {
    window.UI.confirm({
      title: t("privacy.clearConfirmTitle"),
      text: t("privacy.clearConfirmText"),
      okText: t("common.confirm"),
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      window.storageService.clearAll();
      window.UI.toast(t("privacy.cleared"), "success");
    });
  });

  function syncTitle() { document.title = t("privacy.title") + " — " + t("meta.titleSuffix"); }
  syncTitle();
  window.translationService.on(syncTitle);
})();
