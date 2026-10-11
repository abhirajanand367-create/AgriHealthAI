/* Home page behaviour: title sync, scroll reveals. */
(function () {
  "use strict";

  function syncTitle() {
    document.title = window.translationService.t("meta.title");
  }

  syncTitle();
  window.translationService.on(syncTitle);
  document.addEventListener("langchange", syncTitle);

  window.UI.reveal(".reveal");
})();
