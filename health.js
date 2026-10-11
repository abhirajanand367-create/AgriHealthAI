/* ==========================================================================
   AgriHealthAI — health page
   Tabs: lifestyle guidance, junk-food "recovery", FitHomey habit tracker.
   All guidance is general educational wellness info (non-medical).
   ========================================================================== */
(function () {
  "use strict";

  var ref = window.AgriReference;
  var t = function (k, p) { return window.translationService.t(k, p); };
  var L = function (o) { return window.translationService.label(o); };
  var esc = window.UI.escape;

  var GOALS = ["overall", "eating", "activity", "sleep"];
  var activeGoal = "overall";
  var lastRecovery = null;

  /* ---------------- tabs ---------------- */
  function activateTab(name) {
    var tabs = window.UI.qsa(".tabs .tab");
    tabs.forEach(function (tb) {
      var on = tb.getAttribute("data-tab") === name;
      tb.setAttribute("aria-selected", on ? "true" : "false");
    });
    ["lifestyle", "recovery", "tracker"].forEach(function (p) {
      var panel = document.getElementById("panel-" + p);
      if (panel) panel.classList.toggle("hidden", p !== name);
    });
  }
  window.UI.qsa(".tabs .tab").forEach(function (tb) {
    tb.addEventListener("click", function () { activateTab(tb.getAttribute("data-tab")); });
    tb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var idx = window.UI.qsa(".tabs .tab").indexOf(tb);
        var next = window.UI.qsa(".tabs .tab")[(idx + (e.key === "ArrowRight" ? 1 : -1) + 3) % 3];
        next.focus(); activateTab(next.getAttribute("data-tab"));
      }
    });
  });

  /* ---------------- lifestyle ---------------- */
  function renderGoals() {
    var wrap = document.getElementById("goal-cards");
    wrap.innerHTML = GOALS.map(function (g) {
      var checked = g === activeGoal;
      return '<label class="radio-card' + (checked ? " checked" : "") + '">' +
        '<input type="radio" name="goal" value="' + g + '"' + (checked ? " checked" : "") + '>' +
        '<span>' + esc(t("health.goal" + g.charAt(0).toUpperCase() + g.slice(1))) + '</span></label>';
    }).join("");
    window.UI.qsa("#goal-cards input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        activeGoal = inp.value;
        window.UI.qsa("#goal-cards .radio-card").forEach(function (c) { c.classList.remove("checked"); });
        inp.closest(".radio-card").classList.add("checked");
        renderGuidance();
      });
    });
  }
  function renderGuidance() {
    var g = window.healthGuidanceService.goalGuidance(activeGoal);
    document.getElementById("goal-guidance").innerHTML =
      '<div class="card"><div class="card__body">' +
        '<div class="badge-row" style="margin-bottom:10px"><span class="badge badge--info">' + esc(t("health.guidanceTitle")) + '</span></div>' +
        '<ul style="margin:0">' + g.points.map(function (p) { return '<li style="margin-bottom:8px">' + esc(L(p)) + '</li>'; }).join("") + '</ul>' +
      '</div></div>';
  }

  /* ---------------- recovery ---------------- */
  function renderJunkSuggestions() {
    var ids = ["chips", "noodles", "pizza", "burger", "softdrink", "samosa", "biscuit", "chocolate", "icecream"];
    document.getElementById("junk-suggestions").innerHTML = ids.map(function (id) {
      var f = window.nutritionService.findById(id);
      return f ? '<button type="button" class="chip" data-junk="' + id + '">' + esc(L({ en: f.en, hi: f.hi })) + '</button>' : "";
    }).join("");
  }

  document.getElementById("junk-suggestions").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-junk]");
    if (!btn) return;
    lookupJunk(btn.getAttribute("data-junk"));
  });
  document.getElementById("junk-find").addEventListener("click", function () {
    lookupJunk(document.getElementById("junk-search").value);
  });
  document.getElementById("junk-search").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); lookupJunk(this.value); }
  });

  function lookupJunk(query) {
    var item = window.nutritionService.findById(query) || window.nutritionService.firstMatch(query);
    if (!item) {
      document.getElementById("junk-result").innerHTML =
        '<div class="notice notice--warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><span>' +
        esc(t("health.notFound")) + '</span></div>';
      lastRecovery = null;
      return;
    }
    var recovery = window.healthGuidanceService.recoveryFor(item);
    lastRecovery = { item: item, recovery: recovery };
    renderRecovery(item, recovery);
  }

  function renderRecovery(item, recovery) {
    var p = window.nutritionService.perServing(item, 100);
    function mini(label, value, unit) {
      return '<div class="stat"><span class="stat__label">' + esc(label) + '</span><span class="stat__value">' +
        esc(window.UI.formatNumber(value, value != null && value < 10 ? 1 : 0)) + ' <small>' + esc(unit) + '</small></span></div>';
    }
    var concerns = (recovery.concerns || []).map(function (c) { return '<li style="margin-bottom:6px">' + esc(L(c)) + '</li>'; }).join("");
    var nextMeals = (recovery.nextMealsList || []).map(function (c) { return '<li style="margin-bottom:6px">' + esc(L(c)) + '</li>'; }).join("");
    var longTerm = (recovery.longTerm || []).map(function (c) { return '<li style="margin-bottom:6px">' + esc(L(c)) + '</li>'; }).join("");

    document.getElementById("junk-result").innerHTML =
      '<div class="grid grid--2" style="align-items:start">' +
        '<div class="card"><div class="card__body">' +
          '<h3>' + esc(t("health.nutritionFor")) + ': ' + esc(L({ en: item.en, hi: item.hi })) + '</h3>' +
          (item.serving ? '<p class="small muted">' + esc(t("scanner.servingSize")) + ": " + esc(item.serving) + '</p>' : '<p class="small muted">' + esc(t("common.per100g")) + '</p>') +
          '<div class="grid grid--3" style="gap:10px">' +
            mini(t("scanner.energy"), p.energy, t("units.kcal")) +
            mini(t("scanner.protein"), p.protein, t("units.g")) +
            mini(t("scanner.carbs"), p.carbs, t("units.g")) +
            mini(t("scanner.fat"), p.fat, t("units.g")) +
            mini(t("scanner.sugar"), p.sugar, t("units.g")) +
            mini(t("scanner.sodium"), p.sodium, t("units.mg")) +
          '</div>' +
          '<p class="small muted" style="margin-top:12px">' + esc(t("scanner.sourceDemo")) + '</p>' +
        '</div></div>' +
        '<div class="card"><div class="card__body">' +
          '<h3>' + esc(t("health.concernsTitle")) + '</h3>' +
          (concerns ? '<ul style="margin:0">' + concerns + '</ul>' : '<p class="muted">—</p>') +
        '</div></div>' +
        '<div class="card"><div class="card__body">' +
          '<h3>' + esc(t("health.nextMealsTitle")) + '</h3>' +
          '<p class="muted">' + esc(L(recovery.nextMeal)) + '</p>' +
          '<ul style="margin:0">' + nextMeals + '</ul>' +
        '</div></div>' +
        '<div class="card"><div class="card__body">' +
          '<h3>' + esc(t("health.hydrationTitle")) + '</h3>' +
          '<p class="muted">' + esc(L(recovery.hydration)) + '</p>' +
          '<h3 style="margin-top:16px">' + esc(t("health.movementTitle")) + '</h3>' +
          '<p class="muted">' + esc(L(recovery.movement)) + '</p>' +
          '<h3 style="margin-top:16px">' + esc(t("health.longTermTitle")) + '</h3>' +
          '<ul style="margin:0">' + longTerm + '</ul>' +
        '</div></div>' +
      '</div>';
  }

  /* ---------------- FitHomey tracker ---------------- */
  var TRACK_KEY = "fitHomey";

  function ds(d) {
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }
  function todayStr() { return ds(new Date()); }

  function loadTracker() {
    var data = window.storageService.getJSON(TRACK_KEY, null);
    if (!data || typeof data !== "object" || !data.days) data = { days: {} };
    return data;
  }
  function saveTracker(data) { window.storageService.setJSON(TRACK_KEY, data); }

  function dayRecord(data, dateStr) {
    if (!data.days[dateStr]) data.days[dateStr] = { habits: {}, bedtime: "", hours: "" };
    return data.days[dateStr];
  }

  function doneCount(rec) {
    return ref.HABITS.filter(function (h) { return rec && rec.habits && rec.habits[h.id]; }).length;
  }

  function renderTracker() {
    var data = loadTracker();
    var today = todayStr();
    var rec = dayRecord(data, today);
    var total = ref.HABITS.length;
    var done = doneCount(rec);

    // habit list
    document.getElementById("habit-list").innerHTML = ref.HABITS.map(function (h) {
      var on = rec.habits[h.id] ? "checked" : "";
      return '<label class="radio-card' + (rec.habits[h.id] ? " checked" : "") + '" style="margin-bottom:10px">' +
        '<input type="checkbox" data-habit="' + h.id + '"' + (on ? " checked" : "") + '>' +
        '<span><span aria-hidden="true">' + h.emoji + '</span> ' + esc(L({ en: h.en, hi: h.hi })) + '</span></label>';
    }).join("");
    window.UI.qsa("#habit-list input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var d = loadTracker();
        var r = dayRecord(d, today);
        r.habits[inp.getAttribute("data-habit")] = inp.checked;
        saveTracker(d);
        inp.closest(".radio-card").classList.toggle("checked", inp.checked);
        renderTracker();
      });
    });

    // progress
    var pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById("today-count").textContent = done + "/" + total;
    document.getElementById("today-bar").style.width = pct + "%";
    document.getElementById("today-msg").textContent = done === total && total > 0 ? t("health.allDone") : t("health.habitsDone", { done: done, total: total });

    // sleep fields
    var bt = document.getElementById("sleep-bedtime");
    var hrs = document.getElementById("sleep-hours");
    bt.value = rec.bedtime || "";
    hrs.value = rec.hours || "";
    bt.onchange = hrs.onchange = function () {
      var d = loadTracker();
      var r = dayRecord(d, today);
      r.bedtime = bt.value; r.hours = hrs.value;
      saveTracker(d);
    };

    // weekly chart + streak
    renderWeekly(data);
    renderStreak(data);
  }

  function renderWeekly(data) {
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var key = ds(d);
      var rec = data.days[key];
      var dc = doneCount(rec);
      days.push({ key: key, done: dc, pct: ref.HABITS.length ? Math.round(dc / ref.HABITS.length * 100) : 0, isToday: i === 0 });
    }
    document.getElementById("weekly-chart").innerHTML = days.map(function (day) {
      var h = Math.max(6, day.pct);
      var lbl = new Date(day.key + "T00:00:00").toLocaleDateString(window.translationService.current() === "hi" ? "hi-IN" : "en-IN", { weekday: "short" });
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">' +
        '<div title="' + day.pct + '%" style="width:100%;max-width:34px;height:' + h + '%;background:' + (day.isToday ? "var(--green-600)" : "var(--green-100)") + ';border-radius:8px 8px 0 0;transition:height .3s"></div>' +
        '<span class="small ' + (day.isToday ? "" : "muted") + '" style="margin-top:6px">' + esc(lbl) + '</span>' +
      '</div>';
    }).join("");
  }

  function renderStreak(data) {
    var streak = 0;
    var cursor = new Date();
    // allow today to be incomplete without breaking an existing streak
    var todayPct = ref.HABITS.length ? doneCount(data.days[ds(cursor)]) / ref.HABITS.length : 0;
    if (todayPct < 1) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      var rec = data.days[ds(cursor)];
      var pct = ref.HABITS.length ? doneCount(rec) / ref.HABITS.length : 0;
      if (pct >= 1) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
    document.getElementById("streak-text").textContent = streak > 0 ? t("health.dayStreak", { n: streak }) : t("health.noStreak");
  }

  document.getElementById("reset-day").addEventListener("click", function () {
    var data = loadTracker();
    var rec = dayRecord(data, todayStr());
    rec.habits = {};
    saveTracker(data);
    renderTracker();
    window.UI.toast(t("health.resetDay"), "info");
  });

  document.getElementById("clear-tracker").addEventListener("click", function () {
    window.UI.confirm({
      title: t("health.clearConfirmTitle"),
      text: t("health.clearConfirmText"),
      okText: t("common.confirm"),
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      window.storageService.remove(TRACK_KEY);
      renderTracker();
      window.UI.toast(t("common.success"), "success");
    });
  });

  /* ---------------- language change ---------------- */
  window.translationService.on(function () {
    renderGoals();
    renderGuidance();
    renderJunkSuggestions();
    if (lastRecovery) renderRecovery(lastRecovery.item, lastRecovery.recovery);
    renderTracker();
    document.title = t("health.title") + " — " + t("meta.titleSuffix");
  });

  /* ---------------- init ---------------- */
  renderGoals();
  renderGuidance();
  renderJunkSuggestions();
  renderTracker();
  document.title = t("health.title") + " — " + t("meta.titleSuffix");
})();
