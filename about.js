/* About page: title sync + reveals. */
(function () {
  "use strict";
  function syncTitle() { document.title = window.translationService.t("about.title") + " — " + window.translationService.t("meta.titleSuffix"); }
  syncTitle();
  window.translationService.on(syncTitle);
  window.UI.reveal(".reveal");
})();
