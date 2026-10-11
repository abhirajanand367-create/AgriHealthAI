/* ==========================================================================
   AgriHealthAI — cropService
   Crop recommendation + cultivation planning.
   - Uses the optional backend (/api/crops/*) when available.
   - Otherwise runs a transparent LOCAL DEMO engine over general reference
     ranges (AgriReference). All financial output is clearly an ESTIMATE.
   Net profit = estimated gross revenue − estimated total cultivation cost.
   ========================================================================== */
(function () {
  "use strict";

  var ref = window.AgriReference;

  function lang() { return window.i18n ? window.i18n.getLang() : "en"; }
  function L(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[lang()] != null ? obj[lang()] : (obj.en != null ? obj.en : "");
  }

  /* ---------- normalise + area ---------- */
  function unitToAcre(unitId) {
    var u = ref.UNITS.filter(function (x) { return x.id === unitId; })[0];
    return u ? u.toAcre : 1;
  }
  function normalize(inputs) {
    inputs = inputs || {};
    var area = parseFloat(inputs.landArea);
    if (isNaN(area) || area <= 0) area = 1;
    var acres = area * unitToAcre(inputs.unit);
    var budget = inputs.budget === "" || inputs.budget == null ? null : parseFloat(inputs.budget);
    if (isNaN(budget)) budget = null;
    return {
      state: inputs.state || "",
      district: inputs.district || "",
      landArea: area,
      unit: inputs.unit || "acre",
      areaAcres: acres,
      season: inputs.season || "",
      soil: inputs.soil || "unknown",
      water: inputs.water || "medium",
      budget: budget,
      preferences: Array.isArray(inputs.preferences) ? inputs.preferences.slice() : []
    };
  }

  /* ---------- scoring ---------- */
  var WATER_RANK = { low: 1, medium: 2, high: 3 };

  function scoreCrop(crop, inp) {
    var score = 50;
    var reasons = [];

    // season
    if (crop.seasons.indexOf(inp.season) !== -1) {
      score += 18;
      reasons.push({ tag: "season", text: {
        en: "Fits the " + seasonEn(inp.season) + " season you selected.",
        hi: "आपके चुने " + seasonHi(inp.season) + " मौसम के अनुकूल।"
      } });
    }

    // soil
    if (inp.soil && inp.soil !== "unknown") {
      if (crop.soils.indexOf(inp.soil) !== -1) {
        score += 14;
        reasons.push({ tag: "soilGood", text: {
          en: "Grows well in " + soilEn(inp.soil) + ".",
          hi: soilHi(inp.soil) + " में अच्छी वृद्धि।"
        } });
      } else {
        score -= 18;
        reasons.push({ tag: "soilWarn", text: {
          en: "Not the best fit for " + soilEn(inp.soil) + " — may need extra soil management.",
          hi: soilHi(inp.soil) + " के लिए सर्वोत्तम नहीं — अतिरिक्त मिट्टी प्रबंधन चाहिए।"
        } });
      }
    }

    // water
    var need = WATER_RANK[crop.waterNeed] || 2;
    var have = WATER_RANK[inp.water] || 2;
    if (need <= have) {
      score += need === have ? 10 : 6;
      reasons.push({ tag: "waterGood", text: {
        en: "Water requirement (" + waterEn(crop.waterNeed) + ") matches what you can provide.",
        hi: "पानी की आवश्यकता (" + waterHi(crop.waterNeed) + ") आपकी उपलब्धता से मेल खाती है।"
      } });
    } else {
      score -= (need - have) * 16;
      reasons.push({ tag: "waterWarn", text: {
        en: "Needs more water than you indicated — risky without better irrigation.",
        hi: "आपके बताए से अधिक पानी चाहिए — बेहतर सिंचाई के बिना जोखिम।"
      } });
    }

    // budget
    var costMid = mid(crop.inputCostPerAcre) * inp.areaAcres;
    if (inp.budget != null) {
      if (costMid <= inp.budget) {
        score += 9;
        reasons.push({ tag: "budgetGood", text: {
          en: "Estimated cost fits inside your budget.",
          hi: "अनुमानित लागत आपके बजट में फिट बैठती है।"
        } });
      } else {
        var over = (costMid - inp.budget) / Math.max(inp.budget, 1);
        score -= Math.min(22, Math.round(over * 30));
        reasons.push({ tag: "budgetWarn", text: {
          en: "Estimated cost is above your budget — consider a smaller area.",
          hi: "अनुमानित लागत आपके बजट से अधिक है — कम क्षेत्र पर विचार करें।"
        } });
      }
    }

    // preferences
    var prefs = inp.preferences || [];
    prefs.forEach(function (p) {
      if (p === "lowLabour" && crop.labor === "low") { score += 6; reasons.push({ tag: "pref", text: { en: "Suits your preference for lower labour.", hi: "कम श्रम की आपकी प्राथमिकता के अनुकूल।" } }); }
      if (p === "lowInvestment" && crop.investment === "low") { score += 6; reasons.push({ tag: "pref", text: { en: "Suits your preference for lower initial investment.", hi: "कम शुरुआती निवेश की आपकी प्राथमिकता के अनुकूल।" } }); }
      if (p === "shortDuration" && crop.durationDays[1] <= 110) { score += 6; reasons.push({ tag: "pref", text: { en: "Short duration — frees land sooner.", hi: "कम अवधि — ज़मीन जल्दी खाली होती है।" } }); }
    });
    if (prefs.indexOf("highReturns") !== -1) {
      var rev = mid(crop.yieldPerAcre) * 10 * mid(crop.pricePerQuintal) * inp.areaAcres;
      if (rev - costMid > 0) { score += 5; reasons.push({ tag: "pref", text: { en: "Has potential for higher returns (with higher risk).", hi: "उच्च लाभ की संभावना (अधिक जोखिम के साथ)।" } }); }
    }

    return { score: Math.max(0, Math.min(100, Math.round(score))), reasons: reasons };
  }

  function mid(range) { return (range[0] + range[1]) / 2; }

  function seasonEn(id) { var s = ref.SEASONS.filter(function (x) { return x.id === id; })[0]; return s ? s.en : id; }
  function seasonHi(id) { var s = ref.SEASONS.filter(function (x) { return x.id === id; })[0]; return s ? s.hi : id; }
  function soilEn(id) { var s = ref.SOILS.filter(function (x) { return x.id === id; })[0]; return s ? s.en : id; }
  function soilHi(id) { var s = ref.SOILS.filter(function (x) { return x.id === id; })[0]; return s ? s.hi : id; }
  function waterEn(id) { var s = ref.WATER_LEVELS.filter(function (x) { return x.id === id; })[0]; return s ? s.en.split("—")[0].trim() : id; }
  function waterHi(id) { var s = ref.WATER_LEVELS.filter(function (x) { return x.id === id; })[0]; return s ? s.hi.split("—")[0].trim() : id; }

  /* ---------- financials ---------- */
  function financials(crop, areaAcres) {
    var yMin = crop.yieldPerAcre[0] * areaAcres;
    var yMax = crop.yieldPerAcre[1] * areaAcres;
    var yMid = (yMin + yMax) / 2;
    var pMin = crop.pricePerQuintal[0], pMax = crop.pricePerQuintal[1], pMid = (pMin + pMax) / 2;
    var cMin = crop.inputCostPerAcre[0] * areaAcres;
    var cMax = crop.inputCostPerAcre[1] * areaAcres;
    var cMid = (cMin + cMax) / 2;

    var q = function (t) { return t * 10; }; // tonnes -> quintals
    var grossMin = Math.max(0, q(yMin) * pMin);
    var grossMax = Math.max(0, q(yMax) * pMax);
    var grossMid = q(yMid) * pMid;

    return {
      areaAcres: Math.round(areaAcres * 100) / 100,
      yieldTonnes: { min: yMin, mid: yMid, max: yMax },
      yieldQuintal: { min: q(yMin), mid: q(yMid), max: q(yMax) },
      pricePerQuintal: { min: pMin, mid: pMid, max: pMax },
      grossRevenue: { min: grossMin, mid: grossMid, max: grossMax },
      totalCost: { min: cMin, mid: cMid, max: cMax },
      netProfit: { min: grossMin - cMax, mid: grossMid - cMid, max: grossMax - cMin },
      costBreakdown: {
        seed: { min: cMin * 0.15, max: cMax * 0.15 },
        fertiliser: { min: cMin * 0.25, max: cMax * 0.25 },
        labour: { min: cMin * 0.35, max: cMax * 0.35 },
        irrigation: { min: cMin * 0.25, max: cMax * 0.25 }
      }
    };
  }

  /* ---------- recommend ---------- */
  var SEASON_FALLBACK = "zaid";

  function localRecommend(rawInputs) {
    var inp = normalize(rawInputs);
    var pool = ref.CROPS.filter(function (c) { return c.seasons.indexOf(inp.season) !== -1; });
    var relaxed = false;
    if (pool.length < 3) { // relax to all crops if season window is very narrow
      pool = ref.CROPS.slice();
      relaxed = true;
    }

    var scored = pool.map(function (crop) {
      var s = scoreCrop(crop, inp);
      var fin = financials(crop, inp.areaAcres);
      return {
        id: crop.id,
        name: crop.name,
        emoji: crop.emoji,
        image: crop.image,
        category: crop.category,
        seasons: crop.seasons,
        waterNeed: crop.waterNeed,
        labour: crop.labor,
        investment: crop.investment,
        durationDays: crop.durationDays,
        yieldPerAcre: crop.yieldPerAcre,
        pricePerQuintal: crop.pricePerQuintal,
        idealPh: crop.idealPh,
        desc: crop.desc,
        tips: crop.tips,
        risks: crop.risks,
        matchScore: s.score,
        reasons: s.reasons,
        financials: fin,
        relaxedSeason: relaxed
      };
    }).sort(function (a, b) { return b.matchScore - a.matchScore; });

    // de-duplicate & cap
    return {
      demo: true,
      source: "local-demo-engine",
      input: {
        areaAcres: Math.round(inp.areaAcres * 100) / 100,
        unit: inp.unit,
        season: inp.season,
        soil: inp.soil,
        water: inp.water,
        budget: inp.budget,
        preferences: inp.preferences,
        state: inp.state
      },
      crops: scored.slice(0, 8)
    };
  }

  /* ======================================================================
   * Cultivation plan
   * ==================================================================== */
  function harvestIndicators(crop) {
    var cat = crop.category;
    var map = {
      cereal: { en: "Grains become hard and the straw/cob dries and turns golden; grain no longer dents with a thumbnail. Confirm grain moisture before threshing.", hi: "दाने कड़े हो जाते हैं और तना/भुट्टा सूखकर सुनहरा हो जाता है; नाखून से दाना दबता नहीं। मड़ाई से पहले दाने की नमी जाँचें।" },
      millet: { en: "Earheads dry out and grains become hard. Harvest before over-drying to reduce shattering.", hi: "बालियाँ सूख जाती हैं और दाने कड़े हो जाते हैं। अधिक सूखने से पहले कटाई करें ताकि दाना झड़े नहीं।" },
      pulse: { en: "Pods turn brown/dry and rattle when shaken; seeds are hard. Harvest in the morning to reduce shattering.", hi: "फलियाँ भूरी/सूखी होकर हिलाने पर खनकती हैं; दाने कड़े। झड़ने से बचने हेतु सुबह कटाई करें।" },
      oilseed: { en: "Pods/siliquae turn brown and seeds darken; seeds rattle inside. Avoid delayed harvest to prevent shattering.", hi: "फलियाँ भूरी हो जाती हैं और दाने गहरे; हिलाने पर खनकते हैं। झड़ने से बचने हेतु देर न करें।" },
      vegetable: { en: "Produce reaches the size, colour and firmness the market wants. Harvest in the cool part of the day and handle gently.", hi: "उपज बाज़ार के अनुसार आकार, रंग व कड़ापन पा लेती है। ठंडे समय में कटाई करें और सावधानी से संभालें।" },
      cash: { en: "Crop-specific maturity: for cotton, bolls open showing lint; for sugarcane, stalks mature and lower leaves dry. Confirm with local guidance.", hi: "फसल-विशेष परिपक्वता: कपास में टिंडे खुलकर रेशा दिखे; गन्ने में डंठल परिपक्व व निचली पत्तियाँ सूखें। स्थानीय सलाह से पुष्टि करें।" }
    };
    return map[cat] || map.cereal;
  }

  function buildTasks(crop) {
    var irr = crop.irrigationIntervalDays || [10, 15];
    var spacing = crop.sowing.spacing || "As recommended locally";
    var tasks = [
      { from: -20, to: -1, stage: "land", what: { en: "Prepare the land and incorporate organic matter", hi: "ज़मीन तैयार करें और जैविक खाद मिलाएँ" },
        how: { en: "Plough 2–3 times to a fine tilth, break clods, level the field and add well-rotted farmyard manure / compost as per your soil test. Get a soil test if you have not done one.", hi: "2–3 बार जुताई करके भुरभुरी मिट्टी बनाएँ, ढेले तोड़ें, खेत समतल करें और मृदा परीक्षण के अनुसार सड़ी गोबर खाद/कंपोस्ट मिलाएँ। परीक्षण न हुआ हो तो कराएँ।" },
        why: { en: "Good tilth and organic matter improve germination, root growth and water-holding.", hi: "अच्छी तैयारी व जैविक खाद से अंकुरण, जड़ वृद्धि व जल धारण बेहतर होता है।" },
        avoid: { en: "Do not work very wet soil (it compacts) and avoid burning crop residue.", hi: "बहुत गीली मिट्टी में काम न करें (वह दब जाती है) और फसल अवशेष न जलाएँ।" } },
      { from: -5, to: 0, stage: "seed", what: { en: "Select certified seed and treat it", hi: "प्रमाणित बीज चुनें और उपचार करें" },
        how: { en: "Use certified seed of a variety recommended for your district and season. Apply seed treatment as advised by your local agriculture office: " + L(crop.sowing.seedRateEn || "") + ".", hi: "अपने ज़िले व मौसम के लिए सुझाई प्रमाणित किस्म का बीज लें। स्थानीय कृषि कार्यालय की सलाह से बीजोपचार करें: " + L(crop.sowing.seedRateHi || "") + "।" },
        why: { en: "Certified, treated seed gives better establishment and fewer early diseases.", hi: "प्रमाणित, उपचारित बीज से बेहतर जमाव व कम रोग होते हैं।" },
        avoid: { en: "Avoid home-saved seed of unknown quality and expired packets.", hi: "अज्ञात गुणवत्ता का घर का बीज व एक्सपायर पैकेट न लें।" } },
      { from: 0, to: 3, stage: "sowing", what: { en: "Sow / transplant at the right time", hi: "सही समय पर बुवाई / रोपाई करें" },
        how: { en: L(crop.sowing.methodEn) + " Keep rows " + spacing + (crop.sowing.depth ? " and depth " + crop.sowing.depth + "." : "."), hi: L(crop.sowing.methodHi) + " कतारों की दूरी " + spacing + (crop.sowing.depth ? " और गहराई " + crop.sowing.depth + " रखें।" : " रखें।") },
        why: { en: "Timely sowing with correct spacing uses light, water and nutrients efficiently.", hi: "सही समय व दूरी पर बुवाई से प्रकाश, पानी व पोषक तत्व कुशलता से उपयोग होते हैं।" },
        avoid: { en: "Avoid very deep sowing and uneven spacing.", hi: "बहुत गहरी बुवाई व असामान्य दूरी से बचें।" } },
      { from: 5, to: crop.durationDays[1], stage: "irrigation", what: { en: "Follow an irrigation schedule and check soil moisture", hi: "सिंचाई कार्यक्रम अपनाएँ और मिट्टी की नमी जाँचें" },
        how: { en: "Irrigate roughly every " + irr[0] + "–" + irr[1] + " days depending on soil and weather. Check moisture by hand near the roots. Give extra care at critical stages (see growth stages).", hi: "मिट्टी व मौसम के अनुसार लगभग हर " + irr[0] + "–" + irr[1] + " दिन में सिंचाई करें। जड़ों के पास हाथ से नमी जाँचें। महत्वपूर्ण अवस्थाओं में विशेष ध्यान दें।" },
        why: { en: "Timely, adequate water at the right stages strongly affects yield.", hi: "सही अवस्थाओं में समय पर पर्याप्त पानी उपज को काफ़ी प्रभावित करता है।" },
        avoid: { en: "Avoid flooding/waterlogging and long dry spells, especially at flowering and grain/pod filling.", hi: "जलभराव व लंबी सूखी अवधि से बचें, ख़ासकर फूल व दाना/फली भरने के समय।" } },
      { from: 10, to: crop.durationDays[1] - 10, stage: "fertiliser", what: { en: "Manage nutrients based on a soil test", hi: "मृदा परीक्षण के आधार पर पोषक तत्व प्रबंधन करें" },
        how: { en: "Apply nitrogen in split doses and phosphorus/potassium as per your soil-test recommendation. Keep a copy of the soil card. Add organic matter regularly.", hi: "नाइट्रोजन कई बार में बाँटकर दें और फॉस्फोरस/पोटाश मृदा परीक्षण की सिफ़ारिश के अनुसार। मृदा कार्ड संभालकर रखें। नियमित जैविक खाद जोड़ें।" },
        why: { en: "Balanced nutrition (not just more fertiliser) improves yield and soil health.", hi: "संतुलित पोषण (केवल अधिक खाद नहीं) से उपज व मिट्टी की सेहत सुधरती है।" },
        avoid: { en: "Do not apply urea on dry soil or exceed recommended doses; avoid guessing doses.", hi: "सूखी मिट्टी पर यूरिया न डालें और सिफ़ारिश से अधिक मात्रा न दें; अंदाज़े से मात्रा तय न करें।" } },
      { from: 15, to: 50, stage: "weed", what: { en: "Keep the field weed-free early on", hi: "शुरुआत में खेत खरपतवार-मुक्त रखें" },
        how: { en: "Do 1–2 timely hand/mechanical weedings and, if needed, use locally recommended pre/post-emergence practices. Mulching helps in vegetables.", hi: "1–2 समय पर हाथ/यंत्र से निराई करें और ज़रूरत पर स्थानीय स्तर पर सुझाए उपाय अपनाएँ। सब्ज़ियों में मल्चिंग सहायक है।" },
        why: { en: "Weeds compete for water, light and nutrients right when the crop is establishing.", hi: "शुरुआती अवस्था में खरपतवार पानी, प्रकाश व पोषक तत्व छीन लेते हैं।" },
        avoid: { en: "Avoid herbicide use without correct identification and local guidance.", hi: "सही पहचान व स्थानीय सलाह के बिना खरपतवारनाशी न छिड़कें।" } },
      { from: 20, to: crop.durationDays[1], stage: "pest", what: { en: "Scout weekly for pests and diseases", hi: "साप्ताहिक कीट व रोग निगरानी करें" },
        how: { en: "Inspect leaves, stems and fruits weekly and watch for the key risks listed for this crop. Identify the problem first, then use integrated pest management (IPM) and local advisories.", hi: "सप्ताह में पत्ती, तना व फल देखें और इस फसल के मुख्य जोखिमों पर नज़र रखें। पहले समस्या पहचानें, फिर समेकित कीट प्रबंधन (IPM) व स्थानीय सलाह अपनाएँ।" },
        why: { en: "Early detection allows cheaper, safer, more effective control.", hi: "जल्दी पहचान से सस्ता, सुरक्षित व प्रभावी नियंत्रण संभव है।" },
        avoid: { en: "Avoid calendar-based spraying and mixing chemicals without expert advice.", hi: "बिना विशेषज्ञ सलाह के नियमित छिड़काव व रसायन मिलाने से बचें।" } },
      { from: crop.durationDays[0], to: crop.durationDays[1], stage: "harvest", what: { en: "Harvest at the right maturity", hi: "सही परिपक्वता पर कटाई करें" },
        how: { en: harvestIndicators(crop).en + " Harvest in dry conditions and use clean equipment.", hi: harvestIndicators(crop).hi + " सूखे मौसम में साफ़ उपकरण से कटाई करें।" },
        why: { en: "Right-time harvest protects both quality and market value.", hi: "सही समय की कटाई गुणवत्ता व बाज़ार भाव दोनों बचाती है।" },
        avoid: { en: "Avoid harvesting too early (poor quality) or too late (loss/shattering).", hi: "बहुत जल्दी (घटिया गुणवत्ता) या बहुत देर (नुकसान/झड़न) से कटाई न करें।" } },
      { from: crop.durationDays[0], to: crop.durationDays[1] + 15, stage: "storage", what: { en: "Dry, clean and store properly", hi: "सुखाएँ, साफ़ करें और ठीक से भंडारें" },
        how: { en: "Dry produce to safe moisture, clean and grade it, then store in clean, dry, ventilated conditions. Use airtight/cold storage where appropriate and check regularly for pests.", hi: "उपज को सुरक्षित नमी तक सुखाएँ, साफ़ करके श्रेणीबद्ध करें, फिर साफ़, सूखी, हवादार जगह भंडारें। उपयुक्त हो तो वायुरोधी/शीत भंडारण करें और नियमित जाँच करें।" },
        why: { en: "Good post-harvest handling prevents losses and can improve the price you get.", hi: "अच्छी कटाई-पश्चात देखभाल नुकसान रोकती है और भाव सुधार सकती है।" },
        avoid: { en: "Avoid storing damp produce or mixing infested and clean lots.", hi: "नम उपज भंडारण व कीटग्रस्त व साफ़ माल मिलाने से बचें।" } }
    ];
    return tasks;
  }

  function buildPlan(cropId, rawInputs) {
    var crop = ref.CROPS.filter(function (c) { return c.id === cropId; })[0];
    if (!crop) return null;
    var inp = normalize(rawInputs);
    var fin = financials(crop, inp.areaAcres);
    var irr = crop.irrigationIntervalDays || [10, 15];

    var guide = {
      landPrep: {
        en: "Prepare a fine, level seedbed 2–3 weeks before sowing. Plough 2–3 times, remove stubble, and add well-rotted farmyard manure / compost as per your soil test. A soil test (available at local labs / KVK) tells you exactly what nutrients your field needs. " + soilNote(crop, inp).en,
        hi: "बुवाई से 2–3 सप्ताह पहले भुरभुरी, समतल क्यारी तैयार करें। 2–3 बार जुताई करें, ठूँठ हटाएँ, और मृदा परीक्षण के अनुसार सड़ी गोबर खाद/कंपोस्ट मिलाएँ। मृदा परीक्षण (स्थानीय प्रयोगशाला / KVK) बताता है कि खेत को क्या चाहिए। " + soilNote(crop, inp).hi
      },
      seed: {
        en: "Choose a certified variety recommended for your district and season. Seed rate: " + L(crop.sowing.seedRateEn) + ". Confirm the best variety with your local KVK / seed dealer, as varieties differ by region.",
        hi: "अपने ज़िले व मौसम के लिए सुझाई प्रमाणित किस्म चुनें। बीज दर: " + L(crop.sowing.seedRateHi) + "। सर्वोत्तम किस्म की पुष्टि स्थानीय KVK / बीज विक्रेता से करें, क्योंकि किस्में क्षेत्र अनुसार बदलती हैं।"
      },
      sowing: {
        en: L(crop.sowing.methodEn) + " Ideal season: " + crop.seasons.map(function (s) { return SEASON_EN[s]; }).join(", ") + ". Match sowing to the onset of your season and local advisory.",
        hi: L(crop.sowing.methodHi) + " उपयुक्त मौसम: " + crop.seasons.map(function (s) { return SEASON_HI[s]; }).join(", ") + "। बुवाई को मौसम की शुरुआत व स्थानीय परामर्श से मिलाएँ।"
      },
      spacing: {
        en: "Spacing: " + (crop.sowing.spacing || "as locally recommended") + ". Depth: " + (crop.sowing.depth || "as locally recommended") + ". Correct spacing improves light, air and nutrient use.",
        hi: "दूरी: " + (crop.sowing.spacing || "स्थानीय सिफ़ारिश अनुसार") + "। गहराई: " + (crop.sowing.depth || "स्थानीय सिफ़ारिश अनुसार") + "। सही दूरी से प्रकाश, हवा व पोषक तत्व बेहतर उपयोग होते हैं।"
      },
      irrigation: {
        en: "This crop typically needs irrigation every " + irr[0] + "–" + irr[1] + " days (" + waterEn(crop.waterNeed).toLowerCase() + " water requirement). Judge by soil moisture and weather, not a fixed calendar. Give extra care at flowering and grain/pod/fruit filling.",
        hi: "इस फसल को आमतौर पर हर " + irr[0] + "–" + irr[1] + " दिन में सिंचाई चाहिए (" + waterHi(crop.waterNeed) + " आवश्यकता)। तय कैलेंडर नहीं, मिट्टी की नमी व मौसम देखकर निर्णय करें। फूल व दाना/फली/फल भरने पर विशेष ध्यान दें।"
      },
      fertiliser: {
        en: "Base your fertiliser plan on a soil test. Apply nitrogen in split doses; give phosphorus and potassium as recommended. Add organic matter (compost/FYM, green manure) to build soil health. Your local KVK can convert the soil test into an exact field plan.",
        hi: "खाद योजना मृदा परीक्षण पर आधारित रखें। नाइट्रोजन कई बार में बाँटकर दें; फॉस्फोरस व पोटाश सिफ़ारिश अनुसार। मिट्टी की सेहत हेतु जैविक खाद (कंपोस्ट/गोबर, हरी खाद) जोड़ें। स्थानीय KVK परीक्षण को सटीक खेत योजना में बदल सकता है।"
      },
      weed: {
        en: "Keep the field weed-free for the first 30–45 days. Do 1–2 timely hand or mechanical weedings. Use mulch where suitable (especially vegetables). Identify weeds before using any herbicide.",
        hi: "पहले 30–45 दिन खेत खरपतवार-मुक्त रखें। 1–2 समय पर हाथ या यंत्र से निराई करें। उपयुक्त हो तो मल्चिंग करें (ख़ासकर सब्ज़ियों में)। कोई खरपतवारनाशी उपयोग से पहले पहचान करें।"
      },
      pest: {
        en: "Scout weekly for the key risks: " + crop.risks.en.join("; ") + ". Identify the pest/disease first, then use integrated pest management (IPM) and follow local advisories. Ask your KVK before any chemical use.",
        hi: "सप्ताह में मुख्य जोखिमों की निगरानी करें: " + crop.risks.hi.join("; ") + "। पहले कीट/रोग पहचानें, फिर समेकित कीट प्रबंधन (IPM) अपनाएँ और स्थानीय परामर्श मानें। कोई रसायन उपयोग से पहले KVK से पूछें।"
      },
      stages: crop.stages.map(function (s) {
        return { name: s, from: s.from, to: s.to };
      }),
      harvest: harvestIndicators(crop),
      storage: {
        en: "Dry to safe moisture, clean and grade produce, then store in clean, dry, ventilated space. Use airtight or cold storage where appropriate. Check stored lots regularly for insects, moisture and mould; sell at a planned time to avoid distress sale.",
        hi: "उपज को सुरक्षित नमी तक सुखाएँ, साफ़ करके श्रेणीबद्ध करें, फिर साफ़, सूखी, हवादार जगह भंडारें। उपयुक्त हो तो वायुरोधी/शीत भंडारण करें। कीट, नमी व फफूंद के लिए नियमित जाँच करें; मजबूरी में बिक्री से बचने हेतु नियोजित समय पर बेचें।"
      }
    };

    return {
      demo: true,
      source: "local-demo-engine",
      crop: {
        id: crop.id, name: crop.name, emoji: crop.emoji, image: crop.image,
        category: crop.category, durationDays: crop.durationDays, waterNeed: crop.waterNeed,
        labour: crop.labor, investment: crop.investment, idealPh: crop.idealPh,
        desc: crop.desc, risks: crop.risks
      },
      input: {
        areaAcres: Math.round(inp.areaAcres * 100) / 100,
        unit: inp.unit, season: inp.season, soil: inp.soil, water: inp.water, state: inp.state
      },
      financials: fin,
      guide: guide,
      tasks: buildTasks(crop),
      note: { en: "Demo plan from general reference guidance. Adapt to your field and confirm with your local agriculture extension officer / KVK.", hi: "सामान्य संदर्भ मार्गदर्शन से डेमो योजना। अपने खेत के अनुसार ढालें और स्थानीय कृषि विस्तार अधिकारी / KVK से पुष्टि करें।" }
    };
  }

  var SEASON_EN = { kharif: "Kharif", rabi: "Rabi", zaid: "Zaid" };
  var SEASON_HI = { kharif: "खरीफ", rabi: "रबी", zaid: "ज़ायद" };

  function soilNote(crop, inp) {
    if (inp.soil === "unknown") {
      return { en: "Soil type wasn't specified — get a soil test to confirm suitability for " + crop.name.en + ".", hi: "मिट्टी का प्रकार नहीं बताया गया — " + crop.name.hi + " के लिए उपयुक्तता की पुष्टि मृदा परीक्षण से करें।" };
    }
    if (crop.soils.indexOf(inp.soil) !== -1) {
      return { en: crop.name.en + " is generally suited to " + soilEn(inp.soil) + "; maintain organic matter and drainage.", hi: crop.name.hi + " सामान्यतः " + soilHi(inp.soil) + " के लिए उपयुक्त है; जैविक पदार्थ व जल निकास बनाए रखें।" };
    }
    return { en: crop.name.en + " is not ideal for " + soilEn(inp.soil) + "; improve structure with organic matter and seek local advice.", hi: crop.name.hi + " " + soilHi(inp.soil) + " के लिए आदर्श नहीं; जैविक पदार्थ से संरचना सुधारें और स्थानीय सलाह लें।" };
  }

  /* ======================================================================
   * Public API (backend-aware)
   * ==================================================================== */
  function recommendCrops(inputs) {
    return window.apiClient.probe().then(function (hasBackend) {
      if (!hasBackend) return localRecommend(inputs);
      return window.apiClient.post("/api/crops/recommend", inputs).catch(function () {
        // network/validation failure -> graceful demo fallback
        var r = localRecommend(inputs);
        r.fallbackReason = "backend-unavailable";
        return r;
      });
    });
  }

  function getPlan(cropId, inputs) {
    return window.apiClient.probe().then(function (hasBackend) {
      if (!hasBackend) return buildPlan(cropId, inputs);
      return window.apiClient.post("/api/crops/plan", { cropId: cropId, input: inputs }).catch(function () {
        var p = buildPlan(cropId, inputs);
        if (p) p.fallbackReason = "backend-unavailable";
        return p;
      });
    });
  }

  window.cropService = {
    recommendCrops: recommendCrops,
    getPlan: getPlan,
    localRecommend: localRecommend,
    buildPlan: buildPlan,
    financials: financials,
    normalize: normalize
  };
})();
