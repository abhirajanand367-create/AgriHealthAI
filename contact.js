/* Contact page: topic select, validation, demo-safe submit. */
(function () {
  "use strict";
  var t = function (k, p) { return window.translationService.t(k, p); };
  var esc = window.UI.escape;

  var TOPICS = [
    { id: "general", key: "contact.topicGeneral" },
    { id: "feedback", key: "contact.topicFeedback" },
    { id: "bug", key: "contact.topicBug" },
    { id: "data", key: "contact.topicData" }
  ];

  var topicSel = document.getElementById("c-topic");

  function fillTopics() {
    var current = topicSel.value;
    topicSel.innerHTML = '<option value="">' + esc(t("contact.topic")) + "</option>" +
      TOPICS.map(function (o) { return '<option value="' + o.id + '">' + esc(t(o.key)) + "</option>"; }).join("");
    if (current) topicSel.value = current;
  }

  function clearErrors() { window.UI.qsa(".field--error").forEach(function (f) { f.classList.remove("field--error"); }); }
  function setError(name) {
    var f = document.querySelector('.field[data-field="' + name + '"]');
    if (f) f.classList.add("field--error");
  }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  document.getElementById("contact-form").addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();
    var name = document.getElementById("c-name").value.trim();
    var email = document.getElementById("c-email").value.trim();
    var topic = topicSel.value;
    var message = document.getElementById("c-message").value.trim();
    var ok = true;
    if (!name) { setError("name"); ok = false; }
    if (!emailOk(email)) { setError("email"); ok = false; }
    if (!topic) { setError("topic"); ok = false; }
    if (message.length < 10) { setError("message"); ok = false; }
    if (!ok) {
      var first = document.querySelector(".field--error");
      if (first && first.scrollIntoView) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var btn = document.getElementById("contact-send");
    btn.disabled = true;
    var original = btn.querySelector("span") ? btn.querySelector("span").textContent : btn.textContent;
    if (btn.querySelector("span")) btn.querySelector("span").textContent = t("common.sending");

    // Demo mode: validate + confirm locally. A backend would POST here instead.
    window.apiClient.probe().then(function (hasBackend) {
      if (hasBackend) {
        return window.apiClient.post("/api/contact", { name: name, email: email, topic: topic, message: message });
      }
      return null;
    }).catch(function () { return null; }).then(function () {
      btn.disabled = false;
      if (btn.querySelector("span")) btn.querySelector("span").textContent = original;
      window.UI.toast(t("contact.successMsg"), "success");
      document.getElementById("contact-form").reset();
      clearErrors();
    });
  });

  function syncTitle() { document.title = t("contact.title") + " — " + t("meta.titleSuffix"); }

  fillTopics();
  syncTitle();
  window.translationService.on(function () { fillTopics(); syncTitle(); });
})();
