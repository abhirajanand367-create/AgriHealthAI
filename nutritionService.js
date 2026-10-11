/* ==========================================================================
   AgriHealthAI — nutritionService
   Approximate reference nutrition lookup (per 100 g) with serving scaling.
   DEMO MODE: values come from the shared reference dataset and are clearly
   labelled as approximate. Connect a real nutrition API on the backend for
   authoritative per-product values.
   ========================================================================== */
(function () {
  "use strict";

  var ref = window.AgriReference;

  // common-name synonyms -> reference id
  var SYNONYMS = {
    "apples": "apple", "seb": "apple",
    "kela": "banana", "bananas": "banana",
    "aam": "mango",
    "santra": "orange", "oranges": "orange", "mosambi": "orange",
    "amrud": "guava", "amrood": "guava",
    "papita": "papaya",
    "tamatar": "tomato", "tomatoes": "tomato",
    "aloo": "potato", "potatoes": "potato",
    "pyaz": "onion", "onions": "onion",
    "palak": "spinach",
    "gajar": "carrot", "carrots": "carrot",
    "patta gobhi": "cabbage",
    "matar": "greenpeas", "peas": "greenpeas", "green peas": "greenpeas",
    "baingan": "brinjal", "eggplant": "brinjal", "aubergine": "brinjal",
    "chawal": "rice-cooked", "rice": "rice-cooked", "steamed rice": "rice-cooked",
    "roti": "roti", "chapati": "roti", "phulka": "roti", "wheat roti": "roti",
    "dal": "dal-cooked", "daal": "dal-cooked", "lentil": "dal-cooked",
    "chana": "chana-boiled", "chickpeas": "chana-boiled", "chole": "chana-boiled",
    "paneer": "paneer", "cottage cheese": "paneer",
    "doodh": "milk", "dudh": "milk",
    "dahi": "curd", "yogurt": "curd", "yoghurt": "curd",
    "anda": "egg", "eggs": "egg", "boiled egg": "egg",
    "murga": "chicken", "chiken": "chicken",
    "moongphali": "groundnut", "peanut": "groundnut", "peanuts": "groundnut",
    "badam": "almonds", "almond": "almonds",
    // junk
    "chips": "chips", "wafer": "chips", "potato chips": "chips", "lays": "chips",
    "noodles": "noodles", "maggi": "noodles", "ramen": "noodles", "instant noodles": "noodles",
    "pizza": "pizza", "cheese pizza": "pizza",
    "burger": "burger", "hamburger": "burger",
    "coke": "softdrink", "cola": "softdrink", "soft drink": "softdrink", "soda": "softdrink", "pepsi": "softdrink", "cold drink": "softdrink",
    "samosa": "samosa", "samosas": "samosa",
    "biscuit": "biscuit", "biscuits": "biscuit", "cookie": "biscuit", "cookies": "biscuit",
    "chocolate": "chocolate", "choc": "chocolate",
    "icecream": "icecream", "ice cream": "icecream", "kulfi": "icecream",
    "pakora": "pakora", "pakoda": "pakora", "bhajji": "pakora", "bhajia": "pakora", "fried snack": "pakora"
  };

  function norm(s) {
    return String(s || "").toLowerCase().trim().replace(/\s+/g, " ");
  }

  function allFoods() {
    var fresh = ref.NUTRITION.map(function (f) { return Object.assign({ type: "fresh" }, f); });
    var junk = ref.JUNK_FOODS.map(function (f) { return Object.assign({ type: "junk" }, f); });
    return fresh.concat(junk);
  }

  function findById(id) {
    return allFoods().filter(function (f) { return f.id === id; })[0] || null;
  }

  function search(query) {
    var q = norm(query);
    if (!q) return [];
    var foods = allFoods();
    var seen = {};
    var results = [];
    function push(f) { if (f && !seen[f.id]) { seen[f.id] = 1; results.push(f); } }

    // exact id / synonym
    if (SYNONYMS[q]) push(findById(SYNONYMS[q]));
    // starts with / contains in names
    foods.forEach(function (f) {
      if (norm(f.en).indexOf(q) === 0 || norm(f.hi).indexOf(q) === 0) push(f);
    });
    foods.forEach(function (f) {
      if (norm(f.en).indexOf(q) !== -1 || norm(f.hi).indexOf(q) !== -1) push(f);
    });
    // synonym key containment
    Object.keys(SYNONYMS).forEach(function (k) {
      if (k.indexOf(q) !== -1) push(findById(SYNONYMS[k]));
    });
    return results;
  }

  function firstMatch(query) {
    var r = search(query);
    return r.length ? r[0] : null;
  }

  /** Scale a per-100g record to a given serving size in grams. */
  function perServing(item, grams) {
    grams = parseFloat(grams);
    if (!item) return null;
    if (isNaN(grams) || grams <= 0) grams = 100;
    var f = grams / 100;
    function s(v) { return v == null ? null : Math.round(v * f * 10) / 10; }
    return {
      grams: grams,
      energy: s(item.kcal),
      protein: s(item.protein),
      carbs: s(item.carbs),
      fat: s(item.fat),
      satFat: s(item.satFat),
      fibre: s(item.fiber),
      sugar: s(item.sugar),
      sodium: s(item.sodium),
      potassium: s(item.potassium),
      calcium: s(item.calcium),
      iron: s(item.iron),
      vitC: s(item.vitC),
      vitA: s(item.vitA),
      water: s(item.water)
    };
  }

  /** Energy contribution of macros (4/9/4 rule) for a chart. */
  function macroEnergy(p) {
    if (!p) return null;
    var proteinKcal = (p.protein || 0) * 4;
    var carbKcal = (p.carbs || 0) * 4;
    var fatKcal = (p.fat || 0) * 9;
    var total = proteinKcal + carbKcal + fatKcal;
    if (total <= 0) return { protein: 0, carbs: 0, fat: 0, total: 0 };
    return {
      protein: Math.round((proteinKcal / total) * 100),
      carbs: Math.round((carbKcal / total) * 100),
      fat: Math.round((fatKcal / total) * 100),
      total: Math.round(total)
    };
  }

  function getNutrition(idOrQuery) {
    return window.apiClient.probe().then(function (hasBackend) {
      if (hasBackend) {
        return window.apiClient.get("/api/nutrition/" + encodeURIComponent(idOrQuery)).catch(function () {
          return localNutrition(idOrQuery);
        });
      }
      return localNutrition(idOrQuery);
    });
  }

  function localNutrition(idOrQuery) {
    var item = findById(idOrQuery) || firstMatch(idOrQuery);
    if (!item) return { demo: true, source: "local-reference", found: false, item: null };
    return {
      demo: true,
      source: "local-reference",
      found: true,
      item: item,
      per100g: perServing(item, 100),
      macroEnergy: macroEnergy(perServing(item, 100))
    };
  }

  window.nutritionService = {
    all: allFoods,
    search: search,
    findById: findById,
    firstMatch: firstMatch,
    perServing: perServing,
    macroEnergy: macroEnergy,
    getNutrition: getNutrition,
    localNutrition: localNutrition,
    SYNONYMS: SYNONYMS
  };
})();
