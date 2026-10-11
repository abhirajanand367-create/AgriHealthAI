/* ==========================================================================
   AgriHealthAI — scanner page
   Food image upload + honest demo vision result + nutrition panel.
   ========================================================================== */
(function () {
  "use strict";

  var t = function (k, p) { return window.translationService.t(k, p); };
  var L = function (o) { return window.translationService.label(o); };
  var esc = window.UI.escape;

  var st = { file: null, previewUrl: null, analysis: null, food: null, serving: 100 };

  var dropzone = document.getElementById("dropzone");
  var fileInput = document.getElementById("file-input");
  var uploadArea = document.getElementById("upload-area");
  var previewArea = document.getElementById("preview-area");
  var previewImg = document.getElementById("preview-img");
  var loading = document.getElementById("analyse-loading");
  var resultEmpty = document.getElementById("result-empty");
  var analysisBox = document.getElementById("analysis-result");
  var nutritionPanel = document.getElementById("nutrition-panel");
  var foodSearch = document.getElementById("food-search");
  var suggestions = document.getElementById("food-suggestions");

  /* ---------- upload ---------- */
  function openPicker() { fileInput.click(); }
  dropzone.addEventListener("click", openPicker);
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); }
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add("dragover"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove("dragover"); });
  });
  dropzone.addEventListener("drop", function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    var v = window.foodVisionService.validateFile(file);
    if (!v.ok) { window.UI.toast(t(v.errorKey), "error"); return; }
    st.file = file;
    if (st.previewUrl) URL.revokeObjectURL(st.previewUrl);
    st.previewUrl = URL.createObjectURL(file);
    previewImg.src = st.previewUrl;
    previewImg.alt = t("scanner.preview") + ": " + file.name;
    uploadArea.classList.add("hidden");
    previewArea.classList.remove("hidden");
    analysisBox.classList.add("hidden");
    nutritionPanel.classList.add("hidden");
    resultEmpty.classList.remove("hidden");
    st.analysis = null;
    window.UI.toast(t("common.success"), "success");
  }

  document.getElementById("remove-btn").addEventListener("click", function () {
    st.file = null;
    if (st.previewUrl) URL.revokeObjectURL(st.previewUrl);
    st.previewUrl = null;
    fileInput.value = "";
    previewImg.removeAttribute("src");
    previewArea.classList.add("hidden");
    uploadArea.classList.remove("hidden");
    analysisBox.classList.add("hidden");
    nutritionPanel.classList.add("hidden");
    resultEmpty.classList.remove("hidden");
  });
  document.getElementById("replace-btn").addEventListener("click", openPicker);

  /* ---------- analyse ---------- */
  document.getElementById("analyse-btn").addEventListener("click", function () {
    if (!st.file) { window.UI.toast(t("scanner.pickFirst"), "error"); return; }
    loading.classList.remove("hidden");
    analysisBox.classList.add("hidden");
    nutritionPanel.classList.add("hidden");
    resultEmpty.classList.add("hidden");
    window.foodVisionService.analyzeImage(st.file).then(function (res) {
      st.analysis = res;
      loading.classList.add("hidden");
      renderAnalysis(res);
    }).catch(function () {
      loading.classList.add("hidden");
      resultEmpty.classList.remove("hidden");
      window.UI.toast(t("scanner.errorAnalysis"), "error");
    });
  });

  function statusMeta(status) {
    if (status === "fresh") return { key: "scanner.statusFresh", cls: "badge" };
    if (status === "spoilage") return { key: "scanner.statusSpoil", cls: "badge badge--danger" };
    return { key: "scanner.statusUnknown", cls: "badge badge--warn" };
  }
  function confidenceLabel(c) {
    if (c == null) return t("scanner.lowConfidence");
    if (c >= 0.7) return t("scanner.highConfidence");
    if (c >= 0.45) return t("scanner.mediumConfidence");
    return t("scanner.lowConfidence");
  }

  function renderAnalysis(res) {
    if (!res) return;
    var sm = statusMeta(res.status);
    var freshness = (res.freshnessNotes || []).map(function (n) { return "<li>" + esc(L(n)) + "</li>"; }).join("");
    var spoilage = (res.spoilageSigns || []).map(function (n) { return "<li>" + esc(L(n)) + "</li>"; }).join("");
    var stats = res.imageStats;

    var html = '' +
      '<div class="card"><div class="card__body">' +
        '<div class="badge-row" style="margin-bottom:12px">' +
          '<span class="' + sm.cls + '">' + esc(t(sm.key)) + '</span>' +
          '<span class="badge badge--muted">' + esc(t("scanner.confidence")) + ": " + esc(confidenceLabel(res.confidence)) + '</span>' +
          '<span class="badge badge--warn">' + esc(t("common.demoBadge")) + '</span>' +
        '</div>' +
        '<h3>' + esc(t("scanner.resultTitle")) + '</h3>' +
        '<p class="small muted" style="margin-bottom:6px"><strong>' + esc(t("scanner.likelyFood")) + ':</strong> ' +
          (res.likelyFood ? esc(L(res.likelyFood)) : "—") + '</p>' +
        '<p class="small" style="margin-bottom:6px"><strong>' + esc(t("scanner.freshness")) + '</strong></p>' +
        '<ul class="small muted">' + (freshness || "<li>—</li>") + '</ul>' +
        (spoilage ? '<p class="small" style="margin-bottom:6px"><strong>' + esc(t("scanner.spoilage")) + '</strong></p><ul class="small muted">' + spoilage + '</ul>' : "") +
        '<p class="small" style="margin-bottom:6px"><strong>' + esc(t("scanner.storageRec")) + '</strong> ' + esc(L(res.storage)) + '</p>' +
        '<p class="small" style="margin-bottom:6px"><strong>' + esc(t("scanner.preservation")) + '</strong> ' + esc(L(res.preservation)) + '</p>' +
        (stats ? '<hr class="hr">' +
          '<p class="small" style="margin:0"><strong>' + esc(L({ en: "Local image measurement (computed in your browser)", hi: "स्थानीय छवि माप (आपके ब्राउज़र में गणना)" })) + ':</strong> ' +
          esc(L({ en: "brightness", hi: "चमक" })) + " " + stats.brightness + "%, " +
          esc(L({ en: "dominant tone", hi: "प्रमुख रंग" })) + " " + esc(stats.dominant) + '</p>' : "") +
      '</div></div>';

    // If we could not determine the food, ask the user to confirm/select
    if (!st.food) {
      html += '' +
        '<div class="notice notice--info" style="margin-top:16px">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>' +
          '<span><strong>' + esc(t("scanner.confirmTitle")) + '</strong> ' + esc(t("scanner.confirmText")) + '</span>' +
        '</div>' +
        '<div style="margin-top:16px"><button class="btn btn--primary" type="button" id="jump-food">' + esc(t("scanner.confirmSelect")) + '</button></div>';
    }

    analysisBox.innerHTML = html;
    analysisBox.classList.remove("hidden");

    var jump = document.getElementById("jump-food");
    if (jump) jump.addEventListener("click", function () {
      foodSearch.focus();
      foodSearch.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------- food suggestions / confirm ---------- */
  function renderSuggestions(query) {
    var list;
    if (query && query.trim()) {
      list = window.nutritionService.search(query).slice(0, 12);
      if (!list.length) {
        suggestions.innerHTML = '<span class="small muted">' + esc(t("health.notFound")) + '</span>';
        return;
      }
    } else {
      var ids = ["apple", "banana", "tomato", "spinach", "rice-cooked", "roti", "dal-cooked", "paneer", "egg", "chips", "noodles", "pizza"];
      list = ids.map(function (id) { return window.nutritionService.findById(id); }).filter(Boolean);
    }
    suggestions.innerHTML = list.map(function (f) {
      return '<button type="button" class="chip" data-food="' + f.id + '">' + esc(L({ en: f.en, hi: f.hi })) + '</button>';
    }).join("");
  }

  foodSearch.addEventListener("input", window.UI.debounce(function () {
    renderSuggestions(foodSearch.value);
  }, 150));

  suggestions.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-food]");
    if (!btn) return;
    chooseFood(btn.getAttribute("data-food"));
  });

  function chooseFood(id) {
    var item = window.nutritionService.findById(id);
    if (!item) { window.UI.toast(t("scanner.nutritionUnavailable"), "warn"); return; }
    st.food = item;
    st.serving = 100;
    renderNutrition();
    window.UI.toast(t("common.success"), "success");
  }

  /* ---------- nutrition ---------- */
  function nutrientCard(label, value, unit, key) {
    return '<div class="stat"><span class="stat__label">' + esc(label) + '</span>' +
      '<span class="stat__value" data-nk="' + key + '" data-unit="' + esc(unit) + '">' +
        esc(window.UI.formatNumber(value, value != null && value < 10 ? 1 : 0)) + ' <small>' + esc(unit) + '</small></span></div>';
  }

  function updateNutritionNumbers() {
    if (!st.food) return;
    var p = window.nutritionService.perServing(st.food, st.serving);
    window.UI.qsa("[data-nk]").forEach(function (el) {
      var k = el.getAttribute("data-nk");
      var unit = el.getAttribute("data-unit");
      var v = p[k];
      el.innerHTML = esc(window.UI.formatNumber(v, v != null && v < 10 ? 1 : 0)) + " <small>" + esc(unit) + "</small>";
    });
  }

  function renderNutrition() {
    if (!st.food) { nutritionPanel.classList.add("hidden"); return; }
    var f = st.food;
    var p = window.nutritionService.perServing(f, st.serving);
    var macro = window.nutritionService.macroEnergy(window.nutritionService.perServing(f, 100));
    var cur = window.translationService.current();

    var isJunk = f.type === "junk";

    var bars = ["protein", "carbs", "fat"].map(function (k) {
      var label = k === "protein" ? t("scanner.protein") : k === "carbs" ? t("scanner.carbs") : t("scanner.fat");
      var v = macro[k];
      return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><span class="small">' + esc(label) + '</span><span class="small muted">' + v + '%</span></div>' +
        '<div class="nutrient-bar"><span style="width:' + v + '%"></span></div></div>';
    }).join("");

    nutritionPanel.innerHTML = '' +
      '<div class="card"><div class="card__body">' +
        '<div class="badge-row" style="margin-bottom:8px"><span class="badge badge--info">' + esc(t("common.demoBadge")) + '</span>' +
          (isJunk ? '<span class="badge badge--warn">' + esc(t("health.recoveryTitle")) + '</span>' : "") + '</div>' +
        '<h3>' + esc(t("scanner.nutritionTitle")) + ': ' + esc(L({ en: f.en, hi: f.hi })) + '</h3>' +
        '<p class="small muted">' + esc(t("scanner.nutritionSub")) + '</p>' +

        '<div class="field" style="max-width:260px;margin-bottom:16px">' +
          '<label for="serving-input">' + esc(t("scanner.servingGrams")) + '</label>' +
          '<input class="input" id="serving-input" type="number" min="1" step="1" value="' + st.serving + '">' +
        '</div>' +

        '<div class="grid grid--3" style="gap:10px">' +
          nutrientCard(t("scanner.energy"), p.energy, t("units.kcal"), "energy") +
          nutrientCard(t("scanner.protein"), p.protein, t("units.g"), "protein") +
          nutrientCard(t("scanner.carbs"), p.carbs, t("units.g"), "carbs") +
          nutrientCard(t("scanner.fat"), p.fat, t("units.g"), "fat") +
          nutrientCard(t("scanner.satFat"), p.satFat, t("units.g"), "satFat") +
          nutrientCard(t("scanner.fibre"), p.fibre, t("units.g"), "fibre") +
          nutrientCard(t("scanner.sugar"), p.sugar, t("units.g"), "sugar") +
          nutrientCard(t("scanner.sodium"), p.sodium, t("units.mg"), "sodium") +
          nutrientCard(t("scanner.potassium"), p.potassium, t("units.mg"), "potassium") +
          nutrientCard(t("scanner.calcium"), p.calcium, t("units.mg"), "calcium") +
          nutrientCard(t("scanner.iron"), p.iron, t("units.mg"), "iron") +
          nutrientCard(t("scanner.vitC"), p.vitC, t("units.mg"), "vitC") +
          nutrientCard(t("scanner.vitA"), p.vitA, "\u00B5g", "vitA") +
          nutrientCard(t("scanner.water"), p.water, t("units.g"), "water") +
        '</div>' +

        '<p class="small muted" style="margin-top:12px">' + esc(t("scanner.servingNote")) + '</p>' +

        '<hr class="hr">' +
        '<h4>' + esc(t("scanner.chartEnergy")) + '</h4>' + bars +

        '<hr class="hr">' +
        '<p class="small" style="margin-bottom:4px"><strong>' + esc(t("scanner.benefits")) + '</strong></p>' +
        '<p class="small muted">' + esc(L(f.benefit || { en: "—", hi: "—" })) + '</p>' +
        '<p class="small" style="margin-bottom:4px"><strong>' + esc(t("scanner.storageGuide")) + '</strong></p>' +
        '<p class="small muted">' + esc(L(f.storage || { en: "—", hi: "—" })) + '</p>' +
        '<p class="small" style="margin-bottom:4px"><strong>' + esc(t("scanner.preservationMethods")) + '</strong></p>' +
        '<p class="small muted">' + esc(L({
          en: "Refrigeration for most fresh items; freezing, drying, pickling or canning where suitable. Follow safe food-handling practices.",
          hi: "अधिकतर ताज़ी चीज़ों के लिए फ्रिज; उपयुक्त हो तो फ्रीज़िंग, सुखाना, अचार या कैनिंग। सुरक्षित खाद्य-संचालन अपनाएँ।"
        })) + '</p>' +
        '<p class="small muted" style="margin-top:10px"><strong>' + esc(t("scanner.source")) + ':</strong> ' + esc(t("scanner.sourceDemo")) + '</p>' +
      '</div></div>';

    nutritionPanel.classList.remove("hidden");
    var servingInput = document.getElementById("serving-input");
    if (servingInput) servingInput.addEventListener("input", function () {
      var v = parseFloat(servingInput.value);
      st.serving = isNaN(v) || v <= 0 ? 100 : v;
      updateNutritionNumbers();
    });
  }

  /* ---------- language change ---------- */
  window.translationService.on(function () {
    renderSuggestions(foodSearch.value);
    if (st.analysis) renderAnalysis(st.analysis);
    if (st.food) renderNutrition();
    document.title = t("scanner.title") + " — " + t("meta.titleSuffix");
  });

  renderSuggestions("");
  document.title = t("scanner.title") + " — " + t("meta.titleSuffix");
})();
