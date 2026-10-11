/* ==========================================================================
   AgriHealthAI — agriculture page
   Crop planning assistant: form -> recommendations -> cultivation plan.
   All recommendations use cropService (backend if available, else the
   transparent local demo engine over general reference ranges).
   ========================================================================== */
(function () {
  "use strict";

  var ref = window.AgriReference;
  var t = function (k, p) { return window.translationService.t(k, p); };
  var L = function (o) { return window.translationService.label(o); };
  var esc = window.UI.escape;

  var state = {
    inputs: null,
    result: null,
    comparing: [],
    plan: null,
    activeCropId: null
  };

  /* ---------- selects ---------- */
  function fillSelect(sel, list, selectedId, placeholder) {
    if (!sel) return;
    var html = "";
    if (placeholder != null) html += '<option value="">' + esc(placeholder) + "</option>";
    list.forEach(function (it) {
      html += '<option value="' + it.id + '"' + (it.id === selectedId ? " selected" : "") + ">" + esc(L(it)) + "</option>";
    });
    sel.innerHTML = html;
  }

  function captureForm() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : ""; };
    var prefs = window.UI.qsa("#f-prefs input:checked").map(function (i) { return i.value; });
    return {
      state: g("f-state"),
      district: g("f-district"),
      landArea: g("f-land"),
      unit: g("f-unit"),
      season: g("f-season"),
      soil: g("f-soil"),
      water: g("f-water"),
      budget: g("f-budget"),
      preferences: prefs
    };
  }

  function buildForm(current) {
    current = current || {};
    fillSelect(document.getElementById("f-state"), ref.STATES, current.state, t("agri.statePlaceholder"));
    fillSelect(document.getElementById("f-unit"), ref.UNITS, current.unit || "acre", null);
    fillSelect(document.getElementById("f-season"), ref.SEASONS, current.season, t("agri.seasonPlaceholder"));
    fillSelect(document.getElementById("f-soil"), ref.SOILS, current.soil || "unknown", null);
    fillSelect(document.getElementById("f-water"), ref.WATER_LEVELS, current.water || "", t("agri.waterPlaceholder"));

    var prefWrap = document.getElementById("f-prefs");
    var chosen = current.preferences || [];
    prefWrap.innerHTML = ref.PREFERENCES.map(function (p) {
      var checked = chosen.indexOf(p.id) !== -1;
      return '<label class="radio-card' + (checked ? " checked" : "") + '">' +
        '<input type="checkbox" name="pref" value="' + p.id + '"' + (checked ? " checked" : "") + '>' +
        '<span>' + esc(L(p)) + "</span></label>";
    }).join("");
    Array.prototype.forEach.call(prefWrap.querySelectorAll("input"), function (inp) {
      inp.addEventListener("change", function () {
        inp.closest(".radio-card").classList.toggle("checked", inp.checked);
      });
    });

    if (current.district != null) document.getElementById("f-district").value = current.district;
    if (current.landArea != null) document.getElementById("f-land").value = current.landArea;
    if (current.budget != null) document.getElementById("f-budget").value = current.budget;
  }

  /* ---------- validation ---------- */
  function clearErrors() {
    window.UI.qsa(".field--error").forEach(function (f) { f.classList.remove("field--error"); });
  }
  function setError(name) {
    var f = document.querySelector('.field[data-field="' + name + '"]');
    if (f) f.classList.add("field--error");
  }
  function validate(data) {
    clearErrors();
    var ok = true;
    if (!data.state) { setError("state"); ok = false; }
    if (!data.landArea || isNaN(parseFloat(data.landArea)) || parseFloat(data.landArea) <= 0) { setError("landArea"); ok = false; }
    if (!data.unit) { setError("unit"); ok = false; }
    if (!data.season) { setError("season"); ok = false; }
    if (!data.water) { setError("water"); ok = false; }
    if (data.budget !== "" && (isNaN(parseFloat(data.budget)) || parseFloat(data.budget) < 0)) { setError("budget"); ok = false; }
    if (!data.preferences || data.preferences.length === 0) { setError("preferences"); ok = false; }
    if (!ok) {
      window.UI.toast(t("common.required"), "error");
      var firstErr = document.querySelector(".field--error");
      if (firstErr && firstErr.scrollIntoView) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return ok;
  }

  /* ---------- rendering: crop cards ---------- */
  function pct(n) { return Math.round(n) + "%"; }

  function cropCard(crop, index) {
    var fin = crop.financials;
    var isComparing = state.comparing.indexOf(crop.id) !== -1;
    var reasons = (crop.reasons || []).slice(0, 4).map(function (r) {
      var cls = (r.tag === "soilWarn" || r.tag === "waterWarn" || r.tag === "budgetWarn") ? "badge badge--warn" : "badge";
      return '<span class="' + cls + '">' + esc(L(r.text)) + "</span>";
    }).join("");

    var riskBadges = (crop.risks[window.translationService.current()] || crop.risks.en || []).map(function (r) {
      return '<span class="badge badge--danger">' + esc(r) + "</span>";
    }).join("");

    var yieldRange = window.UI.formatRange(fin.yieldTonnes.min, fin.yieldTonnes.max, function (v) { return window.UI.formatNumber(v, 1); }) + " " + t("units.tonnes");

    return '' +
      '<article class="card crop-card" data-crop="' + crop.id + '">' +
        '<div class="crop-card__media">' +
          '<img src="' + esc(crop.image) + '" alt="' + esc(L(crop.name)) + '" loading="lazy">' +
          '<span class="crop-rank">#' + (index + 1) + '</span>' +
          '<span class="crop-score">' + esc(t("agri.matchScore", { score: crop.matchScore })) + '</span>' +
        '</div>' +
        '<div class="crop-card__body">' +
          '<h3><span class="crop-card__emoji" aria-hidden="true">' + crop.emoji + '</span> ' + esc(L(crop.name)) + '</h3>' +
          '<p class="small muted">' + esc(L(crop.desc)) + '</p>' +
          '<div class="badge-row" style="margin-bottom:6px">' + reasons + '</div>' +
          '<div class="crop-stats">' +
            '<div class="mini"><span>' + esc(t("agri.landArea")) + '</span><strong>' + fin.areaAcres + ' ' + esc(t("units.acres")) + '</strong></div>' +
            '<div class="mini"><span>' + esc(t("agri.waterNeed")) + '</span><strong>' + esc(L({ en: waterLabel(crop.waterNeed, "en"), hi: waterLabel(crop.waterNeed, "hi") })) + '</strong></div>' +
            '<div class="mini"><span>' + esc(t("agri.duration")) + '</span><strong>' + crop.durationDays[0] + '–' + crop.durationDays[1] + ' ' + esc(t("units.days")) + '</strong></div>' +
            '<div class="mini"><span>' + esc(t("agri.yieldRange")) + '</span><strong>' + esc(yieldRange) + '</strong></div>' +
            '<div class="mini"><span>' + esc(t("agri.inputCost")) + '</span><strong>' + esc(window.UI.formatRange(fin.totalCost.min, fin.totalCost.max, window.UI.formatINR)) + '</strong></div>' +
            '<div class="mini"><span>' + esc(t("agri.labour")) + '</span><strong>' + esc(L({ en: levelEn(crop.labour), hi: levelHi(crop.labour) })) + '</strong></div>' +
          '</div>' +
          '<div class="profit-line"><b>' + esc(t("agri.netProfit")) + ':</b> ' +
            esc(window.UI.formatRange(fin.netProfit.min, fin.netProfit.max, window.UI.formatINR)) + '</div>' +
          '<details class="small">' +
            '<summary style="cursor:pointer;font-weight:600;color:var(--green-800)">' + esc(t("agri.showDetails")) + '</summary>' +
            '<div style="margin-top:10px">' +
              '<div class="mini" style="display:flex;justify-content:space-between;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:8px 11px;margin-bottom:6px"><span>' + esc(t("agri.grossRevenue")) + '</span><strong>' + esc(window.UI.formatRange(fin.grossRevenue.min, fin.grossRevenue.max, window.UI.formatINR)) + '</strong></div>' +
              '<div class="mini" style="display:flex;justify-content:space-between;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:8px 11px;margin-bottom:6px"><span>' + esc(t("agri.totalCost")) + '</span><strong>' + esc(window.UI.formatRange(fin.totalCost.min, fin.totalCost.max, window.UI.formatINR)) + '</strong></div>' +
              '<div class="mini" style="display:flex;justify-content:space-between;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:8px 11px;margin-bottom:6px"><span>' + esc(t("agri.netProfit")) + '</span><strong>' + esc(window.UI.formatRange(fin.netProfit.min, fin.netProfit.max, window.UI.formatINR)) + '</strong></div>' +
              '<p class="muted" style="margin:8px 0 0">' + esc(t("agri.assumptionsText")) + '</p>' +
            '</div>' +
          '</details>' +
          '<div class="badge-row" style="margin:12px 0 4px">' +
            '<span class="badge badge--muted">' + esc(t("agri.risks")) + '</span>' + riskBadges +
          '</div>' +
          '<div class="crop-card__actions">' +
            '<button class="btn btn--primary btn--sm" type="button" data-act="select">' + esc(t("agri.selectCrop")) + '</button>' +
            '<button class="btn ' + (isComparing ? "btn--warn" : "btn--secondary") + ' btn--sm" type="button" data-act="compare">' +
              esc(isComparing ? t("agri.removeCompare") : t("agri.addCompare")) + '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function waterLabel(id, lang) {
    var w = ref.WATER_LEVELS.filter(function (x) { return x.id === id; })[0];
    if (!w) return id;
    var s = (lang === "hi" ? w.hi : w.en).split("—")[0].trim();
    return s;
  }
  function levelEn(id) { return id === "low" ? "Low" : id === "high" ? "High" : "Medium"; }
  function levelHi(id) { return id === "low" ? "कम" : id === "high" ? "अधिक" : "मध्यम"; }

  function renderResults(result) {
    state.result = result;
    var section = document.getElementById("results-section");
    var grid = document.getElementById("crops-grid");
    var count = document.getElementById("results-count");
    section.classList.remove("hidden");

    if (!result || !result.crops || !result.crops.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>' +
        '<h3>' + esc(t("agri.noResultsTitle")) + '</h3><p>' + esc(t("agri.noResultsText")) + '</p></div>';
      count.textContent = "";
      return;
    }
    count.textContent = t("agri.resultsCount", { count: result.crops.length });
    grid.innerHTML = result.crops.map(cropCard).join("");
  }

  /* ---------- compare ---------- */
  function updateCompareBar() {
    var bar = document.getElementById("compare-bar");
    var cnt = document.getElementById("compare-count");
    if (state.comparing.length > 0) {
      bar.classList.add("show");
      cnt.textContent = t("common.compareSelected") + ": " + state.comparing.length;
    } else {
      bar.classList.remove("show");
    }
  }

  function openCompare() {
    if (!state.result) return;
    var crops = state.result.crops.filter(function (c) { return state.comparing.indexOf(c.id) !== -1; });
    if (crops.length < 2) { window.UI.toast(t("agri.comparisonSub", { count: crops.length }), "info"); }

    // build union of metric labels
    function row(label, fn) {
      return "<tr><th>" + esc(label) + "</th>" + crops.map(function (c) { return "<td>" + fn(c) + "</td>"; }).join("") + "</tr>";
    }
    var head = "<tr><th>" + esc(t("agri.metric")) + "</th>" + crops.map(function (c) {
      return "<td><strong>" + esc(L(c.name)) + "</strong></td>";
    }).join("") + "</tr>";

    var body = head +
      row(t("agri.duration"), function (c) { return c.durationDays[0] + "–" + c.durationDays[1] + " " + esc(t("units.days")); }) +
      row(t("agri.waterNeed"), function (c) { return esc(L({ en: waterLabel(c.waterNeed, "en"), hi: waterLabel(c.waterNeed, "hi") })); }) +
      row(t("agri.labour"), function (c) { return esc(L({ en: levelEn(c.labour), hi: levelHi(c.labour) })); }) +
      row(t("agri.yieldRange"), function (c) { return esc(window.UI.formatRange(c.financials.yieldTonnes.min, c.financials.yieldTonnes.max, function (v) { return window.UI.formatNumber(v, 1); }) + " " + t("units.tonnes")); }) +
      row(t("agri.grossRevenue"), function (c) { return esc(window.UI.formatRange(c.financials.grossRevenue.min, c.financials.grossRevenue.max, window.UI.formatINR)); }) +
      row(t("agri.totalCost"), function (c) { return esc(window.UI.formatRange(c.financials.totalCost.min, c.financials.totalCost.max, window.UI.formatINR)); }) +
      row(t("agri.netProfit"), function (c) { return "<strong>" + esc(window.UI.formatRange(c.financials.netProfit.min, c.financials.netProfit.max, window.UI.formatINR)) + "</strong>"; }) +
      row(t("agri.score"), function (c) { return esc(c.matchScore + "%"); });

    window.UI.openModal(
      '<h3>' + esc(t("agri.comparisonTitle")) + '</h3>' +
      '<p class="small muted">' + esc(t("agri.comparisonSub", { count: crops.length })) + '</p>' +
      '<div class="table-wrap"><table>' + body + '</table></div>' +
      '<p class="small muted" style="margin-top:12px">' + esc(t("agri.assumptionsText")) + '</p>' +
      '<div class="modal__actions"><button class="btn btn--secondary" data-modal-close>' + esc(t("common.close")) + '</button></div>',
      { wide: true }
    );
  }

  /* ---------- plan ---------- */
  function renderPlan(plan) {
    state.plan = plan;
    var section = document.getElementById("plan-section");
    var content = document.getElementById("plan-content");
    section.classList.remove("hidden");

    var f = plan.financials;
    var c = plan.crop;
    var cur = window.translationService.current();

    function guideBlock(titleKey, obj) {
      return '<div class="card"><div class="card__body"><h3>' + esc(t(titleKey)) + '</h3><p class="muted" style="margin:0">' + esc(L(obj)) + '</p></div></div>';
    }

    var stages = plan.guide.stages.map(function (s, i) {
      return '<div class="tl-item"><span class="when">' + esc(t("agri.dayRange", { from: s.from, to: s.to })) + '</span><h4>' + esc(L(s.name)) + '</h4></div>';
    }).join("");

    var tasks = plan.tasks.map(function (task, i) {
      var stageLabel = "";
      return '<details class="acc"><summary class="acc__head">' +
        '<span class="badge">' + esc(t("agri.dayRange", { from: task.from, to: task.to })) + '</span>' +
        '<span>' + esc(L(task.what)) + '</span>' +
        '<svg class="chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>' +
        '</summary><div class="acc__body"><dl>' +
          '<dt>' + esc(t("agri.taskWhat")) + '</dt><dd>' + esc(L(task.what)) + '</dd>' +
          '<dt>' + esc(t("agri.taskWhen")) + '</dt><dd>' + esc(t("agri.dayRange", { from: task.from, to: task.to })) + '</dd>' +
          '<dt>' + esc(t("agri.taskHow")) + '</dt><dd>' + esc(L(task.how)) + '</dd>' +
          '<dt>' + esc(t("agri.taskWhy")) + '</dt><dd>' + esc(L(task.why)) + '</dd>' +
          '<dt>' + esc(t("agri.taskAvoid")) + '</dt><dd>' + esc(L(task.avoid)) + '</dd>' +
        '</dl></div></details>';
    }).join("");

    content.innerHTML = '' +
      '<div class="plan-printable">' +
        '<div class="card" style="overflow:hidden;margin-bottom:26px"><div class="grid" style="grid-template-columns:.9fr 1.1fr;gap:0">' +
          '<img src="' + esc(c.image) + '" alt="' + esc(L(c.name)) + '" style="height:100%;min-height:220px;object-fit:cover">' +
          '<div class="card__body" style="padding:26px">' +
            '<div class="badge-row"><span class="badge badge--warn">' + esc(t("common.demoBadge")) + '</span></div>' +
            '<h2 style="margin-top:10px">' + c.emoji + ' ' + esc(L(c.name)) + '</h2>' +
            '<p class="muted">' + esc(L(c.desc)) + '</p>' +
            '<div class="badge-row">' +
              '<span class="badge badge--info">' + esc(t("agri.duration")) + ": " + c.durationDays[0] + '–' + c.durationDays[1] + " " + esc(t("units.days")) + '</span>' +
              '<span class="badge badge--info">' + esc(t("agri.waterNeed")) + ": " + esc(L({ en: waterLabel(c.waterNeed, "en"), hi: waterLabel(c.waterNeed, "hi") })) + '</span>' +
              '<span class="badge badge--info">pH: ' + c.idealPh[0] + '–' + c.idealPh[1] + '</span>' +
            '</div>' +
            '<p class="small muted" style="margin-top:12px">' + esc(L(plan.note)) + '</p>' +
          '</div>' +
        '</div></div>' +

        '<div class="section-head left" style="margin-bottom:14px"><h3>' + esc(t("agri.netProfit")) + '</h3></div>' +
        '<div class="grid grid--3" style="margin-bottom:30px">' +
          '<div class="stat"><span class="stat__label">' + esc(t("agri.grossRevenue")) + '</span><span class="stat__value">' + esc(window.UI.formatRange(f.grossRevenue.min, f.grossRevenue.max, window.UI.formatINR)) + '</span></div>' +
          '<div class="stat"><span class="stat__label">' + esc(t("agri.totalCost")) + '</span><span class="stat__value">' + esc(window.UI.formatRange(f.totalCost.min, f.totalCost.max, window.UI.formatINR)) + '</span></div>' +
          '<div class="stat"><span class="stat__label">' + esc(t("agri.netProfit")) + '</span><span class="stat__value">' + esc(window.UI.formatRange(f.netProfit.min, f.netProfit.max, window.UI.formatINR)) + '</span></div>' +
        '</div>' +
        '<div class="notice notice--info" style="margin-bottom:30px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><span>' + esc(t("agri.assumptionsText")) + '</span></div>' +

        '<div class="section-head left" style="margin-bottom:14px"><h3>' + esc(t("agri.planTitle")) + '</h3><p class="muted">' + esc(t("agri.planIntro")) + '</p></div>' +
        '<div class="grid grid--2" style="margin-bottom:30px">' +
          guideBlock("agri.sectionLandPrep", plan.guide.landPrep) +
          guideBlock("agri.sectionSeed", plan.guide.seed) +
          guideBlock("agri.sectionSowing", plan.guide.sowing) +
          guideBlock("agri.sectionSpacing", plan.guide.spacing) +
          guideBlock("agri.sectionIrrigation", plan.guide.irrigation) +
          guideBlock("agri.sectionFertiliser", plan.guide.fertiliser) +
          guideBlock("agri.sectionWeed", plan.guide.weed) +
          guideBlock("agri.sectionPest", plan.guide.pest) +
          guideBlock("agri.sectionHarvest", plan.guide.harvest) +
          guideBlock("agri.sectionStorage", plan.guide.storage) +
        '</div>' +

        '<div class="section-head left" style="margin-bottom:14px"><h3>' + esc(t("agri.sectionStages")) + '</h3></div>' +
        '<div class="timeline" style="margin-bottom:30px">' + stages + '</div>' +

        '<div class="section-head left" style="margin-bottom:14px"><h3>' + esc(t("agri.calendarTitle")) + '</h3><p class="muted">' + esc(t("agri.calendarSub")) + '</p></div>' +
        '<div>' + tasks + '</div>' +

        '<div class="notice" style="margin-top:24px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z"/></svg><span>' + esc(t("agri.expertNote")) + '</span></div>' +
      '</div>' +

      '<div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:26px">' +
        '<button class="btn btn--primary" type="button" id="plan-print">' + esc(t("agri.printPlan")) + '</button>' +
        '<button class="btn btn--secondary" type="button" id="plan-download">' + esc(t("agri.downloadPlan")) + '</button>' +
        '<button class="btn btn--secondary" type="button" id="plan-save">' + esc(t("agri.savePlan")) + '</button>' +
        '<button class="btn btn--secondary" type="button" id="plan-edit">' + esc(t("agri.editInputs")) + '</button>' +
        '<button class="btn btn--ghost" type="button" id="plan-startover">' + esc(t("agri.startOver")) + '</button>' +
      '</div>';

    // wire plan actions
    document.getElementById("plan-print").addEventListener("click", function () { window.print(); });
    document.getElementById("plan-download").addEventListener("click", function () { downloadPlan(plan); });
    document.getElementById("plan-save").addEventListener("click", function () {
      window.storageService.setJSON("savedPlan", { cropId: c.id, input: state.inputs, savedAt: Date.now() });
      window.UI.toast(t("agri.savedPlan"), "success");
    });
    document.getElementById("plan-edit").addEventListener("click", function () {
      document.getElementById("form-section").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("plan-startover").addEventListener("click", startOver);

    section.scrollIntoView({ behavior: "smooth" });
  }

  function downloadPlan(plan) {
    var lines = [];
    var c = plan.crop;
    lines.push("AgriHealthAI — " + t("agri.planTitle"));
    lines.push("CROP: " + L(c.name));
    lines.push("(DEMO / ESTIMATE — confirm with local KVK / agriculture officer)");
    lines.push("");
    lines.push(t("agri.duration") + ": " + c.durationDays[0] + "-" + c.durationDays[1] + " " + t("units.days"));
    lines.push(t("agri.waterNeed") + ": " + waterLabel(c.waterNeed, window.translationService.current()));
    lines.push("Ideal pH: " + c.idealPh[0] + "-" + c.idealPh[1]);
    lines.push("");
    lines.push(t("agri.grossRevenue") + ": " + window.UI.formatRange(plan.financials.grossRevenue.min, plan.financials.grossRevenue.max, window.UI.formatINR));
    lines.push(t("agri.totalCost") + ": " + window.UI.formatRange(plan.financials.totalCost.min, plan.financials.totalCost.max, window.UI.formatINR));
    lines.push(t("agri.netProfit") + ": " + window.UI.formatRange(plan.financials.netProfit.min, plan.financials.netProfit.max, window.UI.formatINR));
    lines.push("");
    [["agri.sectionLandPrep", plan.guide.landPrep], ["agri.sectionSeed", plan.guide.seed], ["agri.sectionSowing", plan.guide.sowing],
     ["agri.sectionSpacing", plan.guide.spacing], ["agri.sectionIrrigation", plan.guide.irrigation], ["agri.sectionFertiliser", plan.guide.fertiliser],
     ["agri.sectionWeed", plan.guide.weed], ["agri.sectionPest", plan.guide.pest], ["agri.sectionHarvest", plan.guide.harvest], ["agri.sectionStorage", plan.guide.storage]
    ].forEach(function (pair) {
      lines.push("== " + t(pair[0]) + " ==");
      lines.push(L(pair[1]));
      lines.push("");
    });
    lines.push("== " + t("agri.sectionStages") + " ==");
    plan.guide.stages.forEach(function (s) { lines.push("  " + t("agri.dayRange", { from: s.from, to: s.to }) + "  " + L(s.name)); });
    lines.push("");
    lines.push("== " + t("agri.calendarTitle") + " ==");
    plan.tasks.forEach(function (task) {
      lines.push("- " + L(task.what) + "  (" + t("agri.dayRange", { from: task.from, to: task.to }) + ")");
      lines.push("   " + t("agri.taskHow") + ": " + L(task.how));
      lines.push("   " + t("agri.taskWhy") + ": " + L(task.why));
      lines.push("   " + t("agri.taskAvoid") + ": " + L(task.avoid));
    });
    lines.push("");
    lines.push(t("agri.expertNote"));
    window.UI.download("agrihealthai-" + c.id + "-plan.txt", lines.join("\r\n"));
  }

  /* ---------- flow ---------- */
  function startOver() {
    state.plan = null;
    state.activeCropId = null;
    document.getElementById("plan-section").classList.add("hidden");
    form.reset();
    buildForm({});
    clearErrors();
    window.UI.toast(t("common.startOver"), "info");
    document.getElementById("form-section").scrollIntoView({ behavior: "smooth" });
  }

  function selectCrop(cropId) {
    state.activeCropId = cropId;
    var planSection = document.getElementById("plan-section");
    var content = document.getElementById("plan-content");
    planSection.classList.remove("hidden");
    content.innerHTML = '<div class="loading-block"><div class="spinner"></div><p>' + esc(t("common.loading")) + '</p></div>';
    planSection.scrollIntoView({ behavior: "smooth" });
    window.cropService.getPlan(cropId, state.inputs).then(function (plan) {
      if (!plan) { content.innerHTML = '<div class="empty-state"><p>' + esc(t("common.error")) + '</p></div>'; return; }
      // keep a snapshot of inputs for the plan
      plan._inputs = state.inputs;
      renderPlan(plan);
    }).catch(function () {
      content.innerHTML = '<div class="empty-state"><p>' + esc(t("scanner.errorAnalysis")) + '</p></div>';
    });
  }

  var form = document.getElementById("agri-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = captureForm();
    if (!validate(data)) return;
    state.inputs = data;

    var btn = document.getElementById("agri-submit");
    btn.disabled = true;
    var resultsSection = document.getElementById("results-section");
    resultsSection.classList.remove("hidden");
    var grid = document.getElementById("crops-grid");
    grid.innerHTML = '<div class="loading-block" style="grid-column:1/-1"><div class="spinner"></div><p>' + esc(t("common.loading")) + '</p></div>';
    document.getElementById("results-count").textContent = "";
    resultsSection.scrollIntoView({ behavior: "smooth" });

    window.cropService.recommendCrops(data).then(function (result) {
      renderResults(result);
      updateCompareBar();
    }).catch(function () {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>' + esc(t("common.error")) + '</p></div>';
    }).then(function () {
      btn.disabled = false;
    });
  });

  document.getElementById("agri-reset").addEventListener("click", startOver);
  document.getElementById("plan-back").addEventListener("click", function () {
    document.getElementById("results-section").scrollIntoView({ behavior: "smooth" });
  });

  // delegated crop actions
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var card = e.target.closest(".crop-card");
    if (!card) return;
    var cropId = card.getAttribute("data-crop");
    var act = btn.getAttribute("data-act");
    if (act === "select") selectCrop(cropId);
    if (act === "compare") {
      var i = state.comparing.indexOf(cropId);
      if (i === -1) { state.comparing.push(cropId); } else { state.comparing.splice(i, 1); }
      // re-render results to reflect button state
      if (state.result) renderResults(state.result);
      updateCompareBar();
    }
  });

  document.getElementById("compare-clear").addEventListener("click", function () {
    state.comparing = [];
    if (state.result) renderResults(state.result);
    updateCompareBar();
  });
  document.getElementById("compare-open").addEventListener("click", openCompare);

  // language change: rebuild dynamic UI, preserving inputs
  window.translationService.on(function () {
    var current = captureForm();
    buildForm(current);
    if (state.result) renderResults(state.result);
    if (state.plan && !document.getElementById("plan-section").classList.contains("hidden")) {
      renderPlan(state.plan);
    }
    document.title = t("agri.title") + " — " + t("meta.titleSuffix");
  });

  buildForm({});
  document.title = t("agri.title") + " — " + t("meta.titleSuffix");

  // restore a previously saved plan on demand
  var saved = window.storageService.getJSON("savedPlan", null);
  if (saved && saved.input) {
    var bar = document.createElement("div");
    bar.className = "notice no-print";
    bar.style.marginTop = "16px";
    bar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h14v18l-7-4-7 4Z"/></svg>' +
      '<span>' + esc(t("agri.savedPlan")) + ' <button class="btn btn--sm btn--secondary" type="button" id="restore-plan">' + esc(t("common.viewDetails")) + '</button></span>';
    document.getElementById("form-section").querySelector(".container").appendChild(bar);
    bar.querySelector("#restore-plan").addEventListener("click", function () {
      state.inputs = saved.input;
      buildForm(saved.input);
      selectCrop(saved.cropId);
    });
  }
})();
