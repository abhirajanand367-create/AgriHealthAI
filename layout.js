/* ==========================================================================
   AgriHealthAI — shared layout (navbar + footer + language switch)
   Injected on every page into #site-nav and #site-footer so navigation and
   the language toggle stay consistent. All text uses data-i18n keys.
   ========================================================================== */
(function () {
  "use strict";

  var PAGES = [
    { id: "home", href: "index.html", key: "nav.home" },
    { id: "agriculture", href: "agriculture.html", key: "nav.agriculture" },
    { id: "scanner", href: "scanner.html", key: "nav.scanner" },
    { id: "health", href: "health.html", key: "nav.health" },
    { id: "about", href: "about.html", key: "nav.about" },
    { id: "contact", href: "contact.html", key: "nav.contact" }
  ];

  var LOGO_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 21c0-5 3-8 8-9-1 5-4 8-8 9Z" fill="currentColor" opacity=".85"/>' +
    '<path d="M12 21c0-5-3-8-8-9 1 5 4 8 8 9Z" fill="currentColor" opacity=".6"/>' +
    '<rect x="10.8" y="3" width="2.4" height="8" rx="1.2" fill="currentColor"/>' +
    '<rect x="8.4" y="5" width="7.2" height="2.4" rx="1.2" fill="currentColor"/>' +
    '</svg>';

  function currentPage() {
    var p = document.body.getAttribute("data-page");
    if (p) return p;
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file || file === "") file = "index.html";
    var found = PAGES.filter(function (x) { return x.href === file; })[0];
    return found ? found.id : "home";
  }

  function renderNav(mount) {
    var page = currentPage();
    var links = PAGES.map(function (p) {
      var aria = p.id === page ? ' aria-current="page"' : "";
      return '<a class="nav-link" href="' + p.href + '" data-i18n="' + p.key + '"' + aria + "></a>";
    }).join("");

    var mobileLinks = PAGES.map(function (p) {
      var aria = p.id === page ? ' aria-current="page"' : "";
      return '<a class="nav-link" href="' + p.href + '" data-i18n="' + p.key + '"' + aria + "></a>";
    }).join("");

    mount.innerHTML =
      '<a class="skip-link" href="#main" data-i18n="a11y.skip"></a>' +
      '<header class="navbar">' +
        '<div class="container navbar__inner">' +
          '<a class="brand" href="index.html" aria-label="AgriHealthAI">' +
            '<span class="brand__mark">' + LOGO_SVG + '</span>' +
            '<span><span class="brand__name">AgriHealthAI</span>' +
            '<span class="brand__sub" data-i18n="nav.brandSub"></span></span>' +
          '</a>' +
          '<nav class="nav-links" aria-label="Primary">' + links + '</nav>' +
          '<div class="nav-actions nav-actions--desktop">' +
            '<div class="lang-switch" role="group" aria-label="Language">' +
              '<button type="button" data-lang="en" data-i18n="nav.english"></button>' +
              '<button type="button" data-lang="hi" data-i18n="nav.hindi"></button>' +
            '</div>' +
            '<a class="btn btn--primary btn--sm" href="agriculture.html" data-i18n="nav.getStarted"></a>' +
          '</div>' +
          '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-panel" data-i18n-attr="aria-label:nav.menu">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
          '</button>' +
        '</div>' +
      '</header>' +
      '<div class="mobile-panel" id="mobile-panel">' +
        '<nav aria-label="Mobile">' + mobileLinks + '</nav>' +
        '<div class="mobile-panel__group">' +
          '<div class="lang-switch" role="group" aria-label="Language">' +
            '<button type="button" data-lang="en" data-i18n="nav.english"></button>' +
            '<button type="button" data-lang="hi" data-i18n="nav.hindi"></button>' +
          '</div>' +
          '<a class="btn btn--primary" href="agriculture.html" data-i18n="nav.getStarted"></a>' +
        '</div>' +
      '</div>';

    // language switch wiring
    var switches = mount.querySelectorAll(".lang-switch button");
    Array.prototype.forEach.call(switches, function (btn) {
      btn.addEventListener("click", function () {
        window.translationService.set(btn.getAttribute("data-lang"));
      });
    });

    // mobile toggle
    var toggle = mount.querySelector(".nav-toggle");
    var panel = mount.querySelector("#mobile-panel");
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("data-i18n-attr", "aria-label:" + (open ? "nav.close" : "nav.menu"));
      window.translationService.apply(toggle.parentNode ? mount : mount);
      document.body.style.overflow = open ? "hidden" : "";
    });
    // close panel on link click / resize
    Array.prototype.forEach.call(panel.querySelectorAll("a"), function (a) {
      a.addEventListener("click", function () {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 980 && panel.classList.contains("open")) {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });

    // reflect current language on the switch
    syncLang(mount);
  }

  function syncLang(mount) {
    var l = window.translationService.current();
    Array.prototype.forEach.call(mount.querySelectorAll(".lang-switch button"), function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === l ? "true" : "false");
    });
    Array.prototype.forEach.call(mount.querySelectorAll(".lang-switch"), function (g) {
      g.setAttribute("aria-label", window.translationService.t("nav.langLabel"));
    });
  }

  function renderFooter(mount) {
    mount.innerHTML =
      '<footer class="footer">' +
        '<div class="container">' +
          '<div class="footer__grid">' +
            '<div>' +
              '<a class="brand" href="index.html">' +
                '<span class="brand__mark">' + LOGO_SVG + '</span>' +
                '<span><span class="brand__name">AgriHealthAI</span>' +
                '<span class="brand__sub" data-i18n="nav.brandSub"></span></span>' +
              '</a>' +
              '<p class="footer__tagline" style="margin-top:14px" data-i18n="footer.tagline"></p>' +
              '<p class="small" style="color:#9dc0aa" data-i18n="footer.about"></p>' +
            '</div>' +
            '<div>' +
              '<h4 data-i18n="footer.explore"></h4>' +
              '<ul>' +
                '<li><a href="index.html" data-i18n="footer.homeLink"></a></li>' +
                '<li><a href="agriculture.html" data-i18n="footer.agriLink"></a></li>' +
                '<li><a href="scanner.html" data-i18n="footer.scannerLink"></a></li>' +
                '<li><a href="health.html" data-i18n="footer.healthLink"></a></li>' +
              '</ul>' +
            '</div>' +
            '<div>' +
              '<h4 data-i18n="footer.learn"></h4>' +
              '<ul>' +
                '<li><a href="about.html" data-i18n="footer.aboutLink"></a></li>' +
                '<li><a href="contact.html" data-i18n="footer.contactLink"></a></li>' +
                '<li><a href="privacy.html" data-i18n="footer.privacyLink"></a></li>' +
                '<li><a href="about.html#disclaimers" data-i18n="footer.disclaimerLink"></a></li>' +
              '</ul>' +
            '</div>' +
            '<div>' +
              '<h4 data-i18n="footer.contact"></h4>' +
              '<p class="small" style="color:#9dc0aa" data-i18n="footer.contactPlaceholder"></p>' +
              '<p class="small" style="color:#9dc0aa" data-i18n="footer.disclaimerShort"></p>' +
            '</div>' +
          '</div>' +
          '<div class="footer__bottom">' +
            '<span data-i18n="footer.rights"></span>' +
            '<span>&copy; <span id="footer-year"></span> AgriHealthAI</span>' +
          '</div>' +
        '</div>' +
      '</footer>';

    var y = mount.querySelector("#footer-year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function init() {
    var navMount = document.getElementById("site-nav");
    var footMount = document.getElementById("site-footer");
    if (navMount) renderNav(navMount);
    if (footMount) renderFooter(footMount);
    window.translationService.apply(document);
  }

  // keep switches in sync on language change
  document.addEventListener("langchange", function () {
    var navMount = document.getElementById("site-nav");
    if (navMount) syncLang(navMount);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.layout = { init: init, PAGES: PAGES };
})();
