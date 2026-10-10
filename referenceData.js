/*
 * AgriHealthAI — Shared Reference Data
 * ------------------------------------
 * This module works both in the browser (window.AgriReference) and in Node
 * (module.exports) so the frontend demo engine and the optional backend share
 * one single source of truth.
 *
 * IMPORTANT / DISCLAIMER:
 * The figures below are *general, indicative reference ranges* compiled for
 * demonstration and education. They are NOT location-verified agronomic or
 * market advice. Yields, prices and costs vary widely by state, district,
 * season, variety, market and year. Always confirm with local Krishi Vigyan
 * Kendra (KVK) / agriculture extension officers and official mandi prices.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AgriReference = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var UNSPLASH = "https://images.unsplash.com/";

  function img(id, w) {
    return UNSPLASH + id + "?auto=format&fit=crop&w=" + (w || 900) + "&q=70";
  }

  /* ----------------------------------------------------------------------
   * SOIL TYPES
   * -------------------------------------------------------------------- */
  var SOILS = [
    { id: "alluvial", en: "Alluvial soil", hi: "जलोढ़ मिट्टी" },
    { id: "black", en: "Black soil (regur)", hi: "काली मिट्टी (रेगुर)" },
    { id: "red", en: "Red soil", hi: "लाल मिट्टी" },
    { id: "sandy", en: "Sandy soil", hi: "रेतीली मिट्टी" },
    { id: "loamy", en: "Loamy soil", hi: "दोमट मिट्टी" },
    { id: "clay", en: "Clay soil", hi: "चिकनी मिट्टी" },
    { id: "silt", en: "Silt / silty soil", hi: "गाद (सिल्ट) मिट्टी" },
    { id: "unknown", en: "I don't know", hi: "मुझे नहीं पता" }
  ];

  var SEASONS = [
    { id: "kharif", en: "Kharif (monsoon sowing)", hi: "खरीफ (मानसून बुवाई)" },
    { id: "rabi", en: "Rabi (winter sowing)", hi: "रबी (सर्दी की बुवाई)" },
    { id: "zaid", en: "Zaid (summer sowing)", hi: "ज़ायद (ग्रीष्मकालीन बुवाई)" }
  ];

  var WATER_LEVELS = [
    { id: "low", en: "Low — mostly rain-fed", hi: "कम — मुख्यतः वर्षा आधारित" },
    { id: "medium", en: "Medium — some irrigation", hi: "मध्यम — कुछ सिंचाई" },
    { id: "high", en: "High — assured irrigation", hi: "अधिक — सुनिश्चित सिंचाई" }
  ];

  var PREFERENCES = [
    { id: "lowLabour", en: "Lower labour requirement", hi: "कम श्रम की आवश्यकता" },
    { id: "lowInvestment", en: "Lower initial investment", hi: "कम शुरुआती निवेश" },
    { id: "shortDuration", en: "Shorter growing duration", hi: "कम अवधि" },
    { id: "highReturns", en: "Higher potential returns", hi: "उच्च संभावित लाभ" }
  ];

  var UNITS = [
    { id: "acre", en: "Acre", hi: "एकड़", toAcre: 1 },
    { id: "hectare", en: "Hectare", hi: "हेक्टेयर", toAcre: 2.47105 },
    { id: "bigha", en: "Bigha (varies by state)", hi: "बीघा (राज्य के अनुसार भिन्न)", toAcre: 0.625 }
  ];

  var STATES = [
    { id: "andhra", en: "Andhra Pradesh", hi: "आंध्र प्रदेश" },
    { id: "assam", en: "Assam", hi: "असम" },
    { id: "bihar", en: "Bihar", hi: "बिहार" },
    { id: "chhattisgarh", en: "Chhattisgarh", hi: "छत्तीसगढ़" },
    { id: "delhi", en: "Delhi", hi: "दिल्ली" },
    { id: "goa", en: "Goa", hi: "गोवा" },
    { id: "gujarat", en: "Gujarat", hi: "गुजरात" },
    { id: "haryana", en: "Haryana", hi: "हरियाणा" },
    { id: "himachal", en: "Himachal Pradesh", hi: "हिमाचल प्रदेश" },
    { id: "jharkhand", en: "Jharkhand", hi: "झारखंड" },
    { id: "karnataka", en: "Karnataka", hi: "कर्नाटक" },
    { id: "kerala", en: "Kerala", hi: "केरल" },
    { id: "madhya", en: "Madhya Pradesh", hi: "मध्य प्रदेश" },
    { id: "maharashtra", en: "Maharashtra", hi: "महाराष्ट्र" },
    { id: "odisha", en: "Odisha", hi: "ओडिशा" },
    { id: "punjab", en: "Punjab", hi: "पंजाब" },
    { id: "rajasthan", en: "Rajasthan", hi: "राजस्थान" },
    { id: "tamilnadu", en: "Tamil Nadu", hi: "तमिलनाडु" },
    { id: "telangana", en: "Telangana", hi: "तेलंगाना" },
    { id: "uttarpradesh", en: "Uttar Pradesh", hi: "उत्तर प्रदेश" },
    { id: "uttarakhand", en: "Uttarakhand", hi: "उत्तराखंड" },
    { id: "westbengal", en: "West Bengal", hi: "पश्चिम बंगाल" },
    { id: "other", en: "Other / not listed", hi: "अन्य / सूची में नहीं" }
  ];


  /* ----------------------------------------------------------------------
   * CROPS
   * yieldPerAcre  : tonnes per acre (fresh weight)  [min, max]
   * pricePerQuintal: INR per quintal (1 tonne = 10 quintal) [min, max]
   * inputCostPerAcre: INR [min, max]
   * durationDays  : days from sowing to harvest [min, max]
   * -------------------------------------------------------------------- */
  var CROPS = [
    {
      id: "rice",
      emoji: "\uD83C\uDF3E",
      name: { en: "Rice / Paddy", hi: "धान (चावल)" },
      image: img("photo-1536304993881-ff6e9eefa2a6"),
      category: "cereal",
      seasons: ["kharif"],
      soils: ["alluvial", "clay", "silt", "loamy"],
      waterNeed: "high",
      durationDays: [110, 150],
      labor: "high",
      investment: "medium",
      yieldPerAcre: [1.8, 3.0],
      pricePerQuintal: [1800, 2400],
      inputCostPerAcre: [18000, 28000],
      idealPh: [5.5, 7.0],
      desc: {
        en: "A staple cereal that thrives in warm, humid conditions with standing water or assured irrigation. Central to food security across India.",
        hi: "एक प्रमुख अनाज जो गर्म, आर्द्र जलवायु और सुनिश्चित सिंचाई में अच्छी तरह बढ़ता है। भारत में खाद्य सुरक्षा का आधार।"
      },
      tips: {
        en: ["Best with assured irrigation or reliable monsoon", "Suited to clay/alluvial soils that hold water", "Requires careful water and pest management"],
        hi: ["सुनिश्चित सिंचाई या भरोसेमंद मानसून के साथ सर्वोत्तम", "पानी रोकने वाली चिकनी/जलोढ़ मिट्टी के लिए उपयुक्त", "सावधान जल व कीट प्रबंधन आवश्यक"]
      },
      risks: {
        en: ["Waterlogging & flood risk", "Bacterial blight and stem borer", "High water requirement in dry spells"],
        hi: ["जलभराव व बाढ़ का जोखिम", "जीवाणु झुलसा व तना छेदक", "सूखे में अधिक पानी की आवश्यकता"]
      },
      sowing: { methodEn: "Transplanting of 21–25 day old seedlings (or direct seeded rice where suitable)", methodHi: "21–25 दिन पुरानी पौध का रोपण (या उपयुक्त हो तो सीधी बुवाई)", spacing: "20 × 15 cm", depth: "2–3 cm (seed)", seedRateEn: "Transplanted: ~12–16 kg/acre nursery seed", seedRateHi: "रोपाई: लगभग 12–16 किग्रा/एकड़ नर्सरी बीज" },
      irrigationIntervalDays: [4, 7],
      stages: [
        { en: "Nursery & transplanting", hi: "नर्सरी व रोपाई", from: 0, to: 25 },
        { en: "Tillering", hi: "कल्ले फूटना", from: 25, to: 55 },
        { en: "Panicle initiation", hi: "बाली बनना", from: 55, to: 85 },
        { en: "Flowering & grain filling", hi: "फूल व दाना भरना", from: 85, to: 115 },
        { en: "Maturity & harvest", hi: "पकाई व कटाई", from: 115, to: 150 }
      ]
    },
    {
      id: "wheat",
      emoji: "\uD83C\uDF3E",
      name: { en: "Wheat", hi: "गेहूँ" },
      image: img("photo-1574323347407-f5e1ad6d020b"),
      category: "cereal",
      seasons: ["rabi"],
      soils: ["alluvial", "loamy", "clay", "silt"],
      waterNeed: "medium",
      durationDays: [110, 140],
      labor: "medium",
      investment: "medium",
      yieldPerAcre: [1.6, 2.4],
      pricePerQuintal: [2000, 2600],
      inputCostPerAcre: [14000, 22000],
      idealPh: [6.0, 7.5],
      desc: {
        en: "A leading winter cereal that performs well in cool, dry growing seasons with 4–6 timely irrigations.",
        hi: "प्रमुख सर्दी की फसल जो ठंडे, शुष्क मौसम और 4–6 समय पर सिंचाई में अच्छा प्रदर्शन करती है।"
      },
      tips: {
        en: ["Sow around late Oct–Nov when temperature drops", "Crown-root initiation stage is most sensitive to water stress", "Avoid excess nitrogen which causes lodging"],
        hi: ["अक्टूबर अंत–नवंबर में तापमान गिरने पर बुवाई करें", "ताज जड़ बनने की अवस्था में जल तनाव सर्वाधिक नुकसानदेह", "अधिक नाइट्रोजन से पौधे गिरने की समस्या होती है"]
      },
      risks: {
        en: ["Terminal heat in late sowing", "Yellow rust and aphids", "Price fluctuation around harvest"],
        hi: ["देर से बुवाई में अंतिम गर्मी", "पीला रतुआ व माहू", "कटाई के समय भाव में उतार-चढ़ाव"]
      },
      sowing: { methodEn: "Line sowing with seed drill", methodHi: "सीड ड्रिल से कतार बुवाई", spacing: "20–22 cm between rows", depth: "4–5 cm", seedRateEn: "~40 kg/acre", seedRateHi: "लगभग 40 किग्रा/एकड़" },
      irrigationIntervalDays: [20, 30],
      stages: [
        { en: "Sowing & germination", hi: "बुवाई व अंकुरण", from: 0, to: 15 },
        { en: "Crown root initiation", hi: "ताज जड़ बनना", from: 15, to: 25 },
        { en: "Tillering", hi: "कल्ले फूटना", from: 25, to: 55 },
        { en: "Jointing & flowering", hi: "गाँठ व फूल", from: 55, to: 90 },
        { en: "Grain filling & harvest", hi: "दाना भरना व कटाई", from: 90, to: 140 }
      ]
    },
    {
      id: "maize",
      emoji: "\uD83C\uDF3D",
      name: { en: "Maize (Corn)", hi: "मक्का" },
      image: img("photo-1551754655-cd27e38d2076"),
      category: "cereal",
      seasons: ["kharif", "rabi", "zaid"],
      soils: ["loamy", "alluvial", "red", "sandy"],
      waterNeed: "medium",
      durationDays: [90, 120],
      labor: "medium",
      investment: "medium",
      yieldPerAcre: [1.8, 2.8],
      pricePerQuintal: [1900, 2300],
      inputCostPerAcre: [14000, 24000],
      idealPh: [5.8, 7.0],
      desc: {
        en: "A versatile cereal for grain, fodder and industrial use, well drained soils and moderate inputs.",
        hi: "अनाज, चारे व उद्योग के लिए बहुमुखी फसल; अच्छे जल निकास वाली मिट्टी और मध्यम लागत में उपयुक्त।"
      },
      tips: {
        en: ["Very responsive to timely nitrogen", "Critical water: knee-high to tasselling", "Avoid waterlogging at all stages"],
        hi: ["समय पर नाइट्रोजन देने से अच्छा लाभ", "घुटने तक ऊँचाई से भुट्टा बनने तक पानी आवश्यक", "हर अवस्था में जलभराव से बचें"]
      },
      risks: {
        en: ["Fall armyworm", "Stem lodging in winds", "Moisture stress at flowering"],
        hi: ["फॉल आर्मीवर्म", "हवा में तना गिरना", "फूल के समय नमी की कमी"]
      },
      sowing: { methodEn: "Ridge & furrow or flat line sowing", methodHi: "मेड़-नाली या सपाट कतार बुवाई", spacing: "60 × 20 cm", depth: "3–5 cm", seedRateEn: "~8–10 kg/acre", seedRateHi: "लगभग 8–10 किग्रा/एकड़" },
      irrigationIntervalDays: [8, 12],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 10 },
        { en: "Vegetative (V stages)", hi: "वानस्पतिक वृद्धि", from: 10, to: 45 },
        { en: "Tasselling & silking", hi: "भुट्टा व रेशा", from: 45, to: 70 },
        { en: "Grain filling", hi: "दाना भरना", from: 70, to: 95 },
        { en: "Maturity & harvest", hi: "पकाई व कटाई", from: 95, to: 120 }
      ]
    },
    {
      id: "chickpea",
      emoji: "\uD83E\uDED8",
      name: { en: "Chickpea (Chana)", hi: "चना" },
      image: img("photo-1610970881699-44a5587cabec"),
      category: "pulse",
      seasons: ["rabi"],
      soils: ["black", "loamy", "clay", "sandy"],
      waterNeed: "low",
      durationDays: [95, 120],
      labor: "low",
      investment: "low",
      yieldPerAcre: [0.6, 1.1],
      pricePerQuintal: [4800, 5800],
      inputCostPerAcre: [7000, 12000],
      idealPh: [6.0, 8.0],
      desc: {
        en: "A nitrogen-fixing pulse that improves soil health and needs little water — ideal for dryland rabi farming.",
        hi: "नाइट्रोजन स्थिरीकरण करने वाली दलहन जो मिट्टी सुधारती है और कम पानी में उगती है — सूखी रबी खेती के लिए उपयुक्त।"
      },
      tips: {
        en: ["Grows well on residual moisture", "Do not over-irrigate before flowering", "Seed treatment helps against wilt"],
        hi: ["बची नमी पर अच्छी वृद्धि", "फूल से पहले अधिक सिंचाई न करें", "बीजोपचार उकठा से बचाव में सहायक"]
      },
      risks: {
        en: ["Pod borer (Helicoverpa)", "Wilt in poorly drained soil", "Heat stress in late sowing"],
        hi: ["फली छेदक (हेलिकोवर्पा)", "खराब जल निकास में उकठा", "देर बुवाई में गर्मी का तनाव"]
      },
      sowing: { methodEn: "Line sowing after one pre-sowing irrigation if possible", methodHi: "संभव हो तो एक पूर्व-सिंचाई के बाद कतार बुवाई", spacing: "30 × 10 cm", depth: "5–7 cm", seedRateEn: "~18–20 kg/acre (desi), less for bold types", seedRateHi: "लगभग 18–20 किग्रा/एकड़ (देशी), मोटी किस्म में कम" },
      irrigationIntervalDays: [18, 28],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 10 },
        { en: "Vegetative", hi: "वानस्पतिक", from: 10, to: 40 },
        { en: "Flowering & podding", hi: "फूल व फली", from: 40, to: 75 },
        { en: "Pod filling & maturity", hi: "फली भरना व पकाई", from: 75, to: 120 }
      ]
    },
    {
      id: "mustard",
      emoji: "\uD83C\uDF3C",
      name: { en: "Mustard / Rapeseed", hi: "सरसों" },
      image: img("photo-1508747703725-719777637510"),
      category: "oilseed",
      seasons: ["rabi"],
      soils: ["loamy", "alluvial", "sandy", "clay"],
      waterNeed: "low",
      durationDays: [110, 140],
      labor: "low",
      investment: "low",
      yieldPerAcre: [0.4, 0.8],
      pricePerQuintal: [5200, 6200],
      inputCostPerAcre: [6000, 11000],
      idealPh: [6.0, 7.5],
      desc: {
        en: "A winter oilseed that gives edible oil and oil-cake, tolerating light soils and limited water.",
        hi: "सर्दी की तिलहन फसल जो खाद्य तेल व खली देती है; हल्की मिट्टी और सीमित पानी सहती है।"
      },
      tips: {
        en: ["Sow early to escape aphid and heat", "Very sensitive to waterlogging", "Sulphur improves oil content"],
        hi: ["माहू व गर्मी से बचने के लिए जल्दी बुवाई", "जलभराव के प्रति अति संवेदनशील", "गंधक से तेल की मात्रा बढ़ती है"]
      },
      risks: {
        en: ["Mustard aphid", "White rust", "Poor seed set in high temperature"],
        hi: ["सरसों का माहू", "सफेद रतुआ", "अधिक तापमान में कम दाना"]
      },
      sowing: { methodEn: "Line sowing in moist seedbed", methodHi: "नम क्यारी में कतार बुवाई", spacing: "30 × 10 cm", depth: "2–3 cm", seedRateEn: "~1.5–2 kg/acre", seedRateHi: "लगभग 1.5–2 किग्रा/एकड़" },
      irrigationIntervalDays: [25, 35],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 12 },
        { en: "Rosette & vegetative", hi: "पत्ती व वानस्पतिक", from: 12, to: 45 },
        { en: "Flowering", hi: "फूल", from: 45, to: 75 },
        { en: "Siliqua filling & maturity", hi: "फली भरना व पकाई", from: 75, to: 140 }
      ]
    },
    {
      id: "groundnut",
      emoji: "\uD83E\uDD5C",
      name: { en: "Groundnut (Peanut)", hi: "मूँगफली" },
      image: img("photo-1567892737950-30c4db37cd89"),
      category: "oilseed",
      seasons: ["kharif", "zaid"],
      soils: ["sandy", "loamy", "red"],
      waterNeed: "medium",
      durationDays: [100, 130],
      labor: "medium",
      investment: "medium",
      yieldPerAcre: [0.6, 1.1],
      pricePerQuintal: [5500, 6800],
      inputCostPerAcre: [11000, 18000],
      idealPh: [6.0, 7.5],
      desc: {
        en: "An oilseed and protein crop needing well-drained, light soils; adds nitrogen and fits dryland rotations.",
        hi: "तिलहन व प्रोटीन फसल जो अच्छे जल निकास वाली हल्की मिट्टी चाहती है; नाइट्रोजन जोड़ती है।"
      },
      tips: {
        en: ["Gypsum/calcium at flowering improves pod filling", "Avoid heavy soils and standing water", "Harvest promptly to avoid aflatoxin risk"],
        hi: ["फूल के समय जिप्सम/कैल्शियम से फली भरती है", "भारी मिट्टी व जलभराव से बचें", "एफ्लाटॉक्सिन से बचने हेतु समय पर कटाई"]
      },
      risks: {
        en: ["Leaf miner and thrips", "Tikka (leaf spot)", "Aflatoxin in wet harvest"],
        hi: ["पत्ती सुरंगक व थ्रिप्स", "टिक्का (पत्ती धब्बा)", "गीली कटाई में एफ्लाटॉक्सिन"]
      },
      sowing: { methodEn: "Line sowing on flat or ridge beds", methodHi: "सपाट या मेड़ में कतार बुवाई", spacing: "30 × 10 cm", depth: "4–5 cm", seedRateEn: "~30–35 kg/acre kernels", seedRateHi: "लगभग 30–35 किग्रा/एकड़ गिरी" },
      irrigationIntervalDays: [8, 12],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 10 },
        { en: "Vegetative & pegging", hi: "वानस्पतिक व सुई अवस्था", from: 10, to: 45 },
        { en: "Flowering & pod formation", hi: "फूल व फली बनना", from: 45, to: 80 },
        { en: "Pod filling & maturity", hi: "फली भरना व पकाई", from: 80, to: 130 }
      ]
    },
    {
      id: "soybean",
      emoji: "\uD83C\uDF31",
      name: { en: "Soybean", hi: "सोयाबीन" },
      image: img("photo-1599940824399-b87987ceb72a"),
      category: "oilseed",
      seasons: ["kharif"],
      soils: ["black", "loamy", "clay"],
      waterNeed: "medium",
      durationDays: [90, 110],
      labor: "low",
      investment: "medium",
      yieldPerAcre: [0.5, 0.9],
      pricePerQuintal: [4300, 5200],
      inputCostPerAcre: [10000, 16000],
      idealPh: [6.0, 7.5],
      desc: {
        en: "A high-protein rainfed oilseed that enriches soil with nitrogen and suits rainfed kharif rotations.",
        hi: "उच्च प्रोटीन वाली वर्षा आधारित तिलहन जो मिट्टी में नाइट्रोजन बढ़ाती है।"
      },
      tips: {
        en: ["Seed treatment with Rhizobium helps nodulation", "Avoid waterlogging", "Timely sowing with monsoon"],
        hi: ["राइजोबियम बीजोपचार से ग्रंथियाँ बनती हैं", "जलभराव से बचें", "मानसून के साथ समय पर बुवाई"]
      },
      risks: {
        en: ["Yellow mosaic virus (whitefly)", "Girdle beetle", "Water stress at pod fill"],
        hi: ["पीला मोज़ेक वायरस (सफेद मक्खी)", "तना भृंग", "फली भरने में जल तनाव"]
      },
      sowing: { methodEn: "Line sowing after monsoon onset", methodHi: "मानसून शुरू होने पर कतार बुवाई", spacing: "45 × 5 cm", depth: "3–4 cm", seedRateEn: "~28–30 kg/acre", seedRateHi: "लगभग 28–30 किग्रा/एकड़" },
      irrigationIntervalDays: [10, 15],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 10 },
        { en: "Vegetative", hi: "वानस्पतिक", from: 10, to: 40 },
        { en: "Flowering & podding", hi: "फूल व फली", from: 40, to: 70 },
        { en: "Pod fill & maturity", hi: "फली भरना व पकाई", from: 70, to: 110 }
      ]
    },
    {
      id: "cotton",
      emoji: "\uD83C\uDF3F",
      name: { en: "Cotton", hi: "कपास" },
      image: img("photo-1594050066251-6b6e6d8c66c8"),
      category: "cash",
      seasons: ["kharif"],
      soils: ["black", "loamy", "red"],
      waterNeed: "medium",
      durationDays: [150, 200],
      labor: "high",
      investment: "high",
      yieldPerAcre: [0.5, 1.0],
      pricePerQuintal: [6500, 8000],
      inputCostPerAcre: [22000, 40000],
      idealPh: [6.0, 8.0],
      desc: {
        en: "A major cash crop of black soils with high potential returns but intensive management and long duration.",
        hi: "काली मिट्टी की प्रमुख नकदी फसल; उच्च संभावित लाभ पर अधिक प्रबंधन व लंबी अवधि।"
      },
      tips: {
        en: ["Long duration — plan cash flow carefully", "Integration with pulses reduces risk", "Scout and manage pests early (bollworm, whitefly)"],
        hi: ["लंबी अवधि — नकदी प्रबंधन ध्यान से करें", "दलहन के साथ मिश्रण से जोखिम कम", "कीट (बॉलवर्म, सफेद मक्खी) की जल्दी निगरानी"]
      },
      risks: {
        en: ["High pest & insecticide cost", "Pink bollworm", "Market price volatility"],
        hi: ["उच्च कीट व कीटनाशक लागत", "गुलाबी सुंडी", "बाज़ार भाव में उतार-चढ़ाव"]
      },
      sowing: { methodEn: "Line sowing on flat/ridge beds", methodHi: "सपाट/मेड़ में कतार बुवाई", spacing: "60–90 × 30–45 cm", depth: "3–5 cm", seedRateEn: "~1.5–2.5 kg/acre (BT/ non-BT as permitted)", seedRateHi: "लगभग 1.5–2.5 किग्रा/एकड़" },
      irrigationIntervalDays: [7, 12],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 12 },
        { en: "Vegetative", hi: "वानस्पतिक", from: 12, to: 60 },
        { en: "Squaring & flowering", hi: "कली व फूल", from: 60, to: 120 },
        { en: "Boll development", hi: "टिंडा बनना", from: 120, to: 170 },
        { en: "Boll opening & picking", hi: "टिंडा खुलना व चुनाई", from: 170, to: 200 }
      ]
    },
    {
      id: "bajra",
      emoji: "\uD83C\uDF3E",
      name: { en: "Pearl Millet (Bajra)", hi: "बाजरा" },
      image: img("photo-1586201375761-83865001e31c"),
      category: "millet",
      seasons: ["kharif", "zaid"],
      soils: ["sandy", "loamy", "red", "black"],
      waterNeed: "low",
      durationDays: [75, 100],
      labor: "low",
      investment: "low",
      yieldPerAcre: [0.5, 1.0],
      pricePerQuintal: [2200, 2800],
      inputCostPerAcre: [5000, 9000],
      idealPh: [6.0, 8.0],
      desc: {
        en: "A hardy, drought-tolerant nutri-cereal suited to low-rainfall, light-soil regions and low budgets.",
        hi: "सूखा सहने वाला पोषक अनाज; कम वर्षा, हल्की मिट्टी और कम बजट के लिए उपयुक्त।"
      },
      tips: {
        en: ["Excellent choice for low rainfall & sandy soil", "Responds to one or two life-saving irrigations", "Low input and low risk"],
        hi: ["कम वर्षा व रेतीली मिट्टी के लिए उत्तम", "एक-दो जीवनरक्षक सिंचाई से लाभ", "कम लागत व कम जोखिम"]
      },
      risks: {
        en: ["Downy mildew", "Bird damage near harvest", "Yield limited under very low fertility"],
        hi: ["डाउनी मिल्ड्यू", "कटाई के समय पक्षी नुकसान", "अत्यंत कम उपजाऊपन में कम पैदावार"]
      },
      sowing: { methodEn: "Line sowing in moist seedbed", methodHi: "नम क्यारी में कतार बुवाई", spacing: "45 × 10–15 cm", depth: "2–3 cm", seedRateEn: "~1.5–2 kg/acre", seedRateHi: "लगभग 1.5–2 किग्रा/एकड़" },
      irrigationIntervalDays: [12, 20],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 8 },
        { en: "Vegetative", hi: "वानस्पतिक", from: 8, to: 35 },
        { en: "Flowering & grain formation", hi: "फूल व दाना", from: 35, to: 70 },
        { en: "Maturity & harvest", hi: "पकाई व कटाई", from: 70, to: 100 }
      ]
    },
    {
      id: "moong",
      emoji: "\uD83C\uDF31",
      name: { en: "Green Gram (Moong)", hi: "मूंग" },
      image: img("photo-1599940824399-b87987ceb72a"),
      category: "pulse",
      seasons: ["kharif", "zaid"],
      soils: ["loamy", "sandy", "alluvial", "black"],
      waterNeed: "low",
      durationDays: [60, 80],
      labor: "low",
      investment: "low",
      yieldPerAcre: [0.25, 0.45],
      pricePerQuintal: [7000, 8600],
      inputCostPerAcre: [4500, 8000],
      idealPh: [6.0, 7.5],
      desc: {
        en: "A short-duration protein pulse that fixes nitrogen, fits between crops, and needs very little water.",
        hi: "कम अवधि की प्रोटीन दलहन; नाइट्रोजन स्थिर करती है, फसलों के बीच उपयुक्त, कम पानी चाहिए।"
      },
      tips: {
        en: ["Great for short windows & low budgets", "Avoid excess irrigation (causes vegetative growth)", "Harvest in 2–3 pickings to reduce loss"],
        hi: ["कम समय व कम बजट के लिए बेहतरीन", "अधिक सिंचाई से बचें (अधिक पत्ते बनते हैं)", "2–3 बार चुनकर कटाई से नुकसान कम"]
      },
      risks: {
        en: ["Yellow mosaic & whitefly", "Flower drop in rain", "Low yield under shade"],
        hi: ["पीला मोज़ेक व सफेद मक्खी", "वर्षा में फूल गिरना", "छाया में कम पैदावार"]
      },
      sowing: { methodEn: "Line sowing", methodHi: "कतार बुवाई", spacing: "30 × 10 cm", depth: "3–4 cm", seedRateEn: "~8–10 kg/acre", seedRateHi: "लगभग 8–10 किग्रा/एकड़" },
      irrigationIntervalDays: [10, 15],
      stages: [
        { en: "Sowing & emergence", hi: "बुवाई व अंकुरण", from: 0, to: 7 },
        { en: "Vegetative", hi: "वानस्पतिक", from: 7, to: 30 },
        { en: "Flowering & podding", hi: "फूल व फली", from: 30, to: 55 },
        { en: "Pod filling & harvest", hi: "फली भरना व कटाई", from: 55, to: 80 }
      ]
    },
    {
      id: "tomato",
      emoji: "\uD83C\uDF45",
      name: { en: "Tomato", hi: "टमाटर" },
      image: img("photo-1592924357228-91a4daadcfea"),
      category: "vegetable",
      seasons: ["rabi", "zaid", "kharif"],
      soils: ["loamy", "red", "alluvial"],
      waterNeed: "high",
      durationDays: [100, 140],
      labor: "high",
      investment: "high",
      yieldPerAcre: [8, 16],
      pricePerQuintal: [800, 2500],
      inputCostPerAcre: [30000, 55000],
      idealPh: [6.0, 7.0],
      desc: {
        en: "A high-value vegetable with strong demand but price volatility; needs staking, regular irrigation and pest care.",
        hi: "उच्च मूल्य की सब्ज़ी, मजबूत माँग पर भाव अस्थिर; सहारा, नियमित सिंचाई व कीट देखभाल आवश्यक।"
      },
      tips: {
        en: ["Consider staking and mulching for quality", "Frequent small irrigations preferred", "Market linkage/planning matters more than yield alone"],
        hi: ["गुणवत्ता हेतु सहारा व मल्चिंग पर विचार करें", "थोड़ी-थोड़ी बार-बार सिंचाई बेहतर", "केवल पैदावार से अधिक बाज़ार जोड़ महत्वपूर्ण"]
      },
      risks: {
        en: ["Very high price volatility", "Early blight & fruit borer", "Perishable — needs quick sale/storage"],
        hi: ["अत्यधिक भाव अस्थिरता", "अगेती झुलसा व फल छेदक", "जल्दी खराब — तेज़ बिक्री/भंडारण आवश्यक"]
      },
      sowing: { methodEn: "Transplant 25–30 day old seedlings on raised beds", methodHi: "25–30 दिन पुरानी पौध उठी क्यारियों में रोपें", spacing: "60 × 45 cm", depth: "Seedling collar at soil level", seedRateEn: "~80–100 g seed/acre (nursery)", seedRateHi: "लगभग 80–100 ग्राम बीज/एकड़" },
      irrigationIntervalDays: [3, 5],
      stages: [
        { en: "Nursery & transplanting", hi: "नर्सरी व रोपाई", from: 0, to: 30 },
        { en: "Vegetative & flowering", hi: "वृद्धि व फूल", from: 30, to: 60 },
        { en: "Fruit set & development", hi: "फल बनना", from: 60, to: 100 },
        { en: "Harvest (multiple pickings)", hi: "कटाई (कई बार)", from: 100, to: 140 }
      ]
    },
    {
      id: "potato",
      emoji: "\uD83E\uDD54",
      name: { en: "Potato", hi: "आलू" },
      image: img("photo-1518977676601-b53f82aba655"),
      category: "vegetable",
      seasons: ["rabi"],
      soils: ["loamy", "alluvial", "sandy"],
      waterNeed: "medium",
      durationDays: [80, 110],
      labor: "medium",
      investment: "high",
      yieldPerAcre: [6, 12],
      pricePerQuintal: [700, 1800],
      inputCostPerAcre: [30000, 50000],
      idealPh: [5.5, 6.5],
      desc: {
        en: "A high-yielding tuber crop needing cool weather, loose soil and assured irrigation; storage is key to returns.",
        hi: "उच्च उपज वाली कंद फसल; ठंडा मौसम, भुरभुरी मिट्टी व सुनिश्चित सिंचाई चाहिए; भंडारण से लाभ तय होता है।"
      },
      tips: {
        en: ["Use certified disease-free seed tubers", "Earthing up improves tuber development", "Cold storage strongly affects final price"],
        hi: ["प्रमाणित रोगमुक्त बीज कंद उपयोग करें", "मिट्टी चढ़ाने से कंद विकास बेहतर", "शीत भंडारण अंतिम भाव को प्रभावित करता है"]
      },
      risks: {
        en: ["Late blight", "Price crash at peak harvest", "Seed cost & storage losses"],
        hi: ["पछेती झुलसा", "कटाई के चरम पर भाव गिरना", "बीज लागत व भंडारण नुकसान"]
      },
      sowing: { methodEn: "Plant seed tubers on ridges", methodHi: "मेड़ों में बीज कंद रोपें", spacing: "60 × 20 cm", depth: "5–8 cm", seedRateEn: "~600–800 kg/acre seed tubers", seedRateHi: "लगभग 600–800 किग्रा/एकड़ बीज कंद" },
      irrigationIntervalDays: [6, 10],
      stages: [
        { en: "Planting & sprouting", hi: "रोपाई व अंकुरण", from: 0, to: 20 },
        { en: "Vegetative & tuber initiation", hi: "वृद्धि व कंद बनना", from: 20, to: 55 },
        { en: "Tuber bulking", hi: "कंद बढ़ना", from: 55, to: 85 },
        { en: "Maturity & harvest", hi: "पकाई व खुदाई", from: 85, to: 110 }
      ]
    },
    {
      id: "onion",
      emoji: "\uD83E\uDDC5",
      name: { en: "Onion", hi: "प्याज" },
      image: img("photo-1508747703725-719777637510"),
      category: "vegetable",
      seasons: ["rabi", "kharif"],
      soils: ["loamy", "alluvial", "silt", "red"],
      waterNeed: "medium",
      durationDays: [100, 150],
      labor: "high",
      investment: "medium",
      yieldPerAcre: [6, 12],
      pricePerQuintal: [1000, 3000],
      inputCostPerAcre: [25000, 40000],
      idealPh: [6.0, 7.5],
      desc: {
        en: "A widely traded bulb crop with strong market demand and price swings; good storage extends selling window.",
        hi: "व्यापक रूप से कारोबार वाली कंद फसल; मजबूत माँग पर भाव उतार-चढ़ाव; भंडारण बिक्री अवधि बढ़ाता है।"
      },
      tips: {
        en: ["Cure bulbs well before storage", "Avoid excess nitrogen late in season", "Plan around harvest-time price cycles"],
        hi: ["भंडारण से पहले कंद अच्छे से सुखाएँ", "सीज़न के अंत में अधिक नाइट्रोजन से बचें", "कटाई के समय भाव चक्र का ध्यान रखें"]
      },
      risks: {
        en: ["Thrips and purple blotch", "Price volatility", "Storage rot"],
        hi: ["थ्रिप्स व बैंगनी धब्बा", "भाव अस्थिरता", "भंडारण में सड़न"]
      },
      sowing: { methodEn: "Transplant seedlings on raised beds", methodHi: "उठी क्यारियों में पौध रोपें", spacing: "15 × 10 cm", depth: "Shallow, collar level", seedRateEn: "~3–4 kg seed/acre (nursery)", seedRateHi: "लगभग 3–4 किग्रा बीज/एकड़" },
      irrigationIntervalDays: [6, 10],
      stages: [
        { en: "Nursery & transplanting", hi: "नर्सरी व रोपाई", from: 0, to: 45 },
        { en: "Vegetative", hi: "वानस्पतिक", from: 45, to: 80 },
        { en: "Bulb development", hi: "कंद विकास", from: 80, to: 120 },
        { en: "Maturity & harvest", hi: "पकाई व कटाई", from: 120, to: 150 }
      ]
    },
    {
      id: "sugarcane",
      emoji: "\uD83C\uDF3E",
      name: { en: "Sugarcane", hi: "गन्ना" },
      image: img("photo-1596040033229-a9821ebd058d"),
      category: "cash",
      seasons: ["kharif"],
      soils: ["loamy", "alluvial", "black", "clay"],
      waterNeed: "high",
      durationDays: [300, 365],
      labor: "high",
      investment: "high",
      yieldPerAcre: [28, 45],
      pricePerQuintal: [280, 360],
      inputCostPerAcre: [45000, 70000],
      idealPh: [6.0, 7.5],
      desc: {
        en: "A long-duration cash crop for assured markets (sugar mills); needs high water and heavy investment.",
        hi: "सुनिश्चित बाज़ार (चीनी मिल) हेतु लंबी अवधि की नकदी फसल; अधिक पानी व भारी निवेश चाहिए।"
      },
      tips: {
        en: ["Requires assured irrigation all year", "Mill proximity & payment reliability matter", "Plan rotations to avoid soil fatigue"],
        hi: ["पूरे वर्ष सुनिश्चित सिंचाई आवश्यक", "मिल की निकटता व भुगतान भरोसा महत्वपूर्ण", "मिट्टी थकान से बचने हेतु फसल चक्र"]
      },
      risks: {
        en: ["Very long payback period", "Mill payment delays", "High water requirement"],
        hi: ["बहुत लंबी लागत वापसी अवधि", "मिल भुगतान में देरी", "अधिक पानी की आवश्यकता"]
      },
      sowing: { methodEn: "Planting of 2–3 bud setts in furrows", methodHi: "नालियों में 2–3 आँख के टुकड़े रोपें", spacing: "90–120 cm rows", depth: "5–8 cm", seedRateEn: "~1.2–1.5 tonnes/acre setts", seedRateHi: "लगभग 1.2–1.5 टन/एकड़" },
      irrigationIntervalDays: [7, 12],
      stages: [
        { en: "Planting & germination", hi: "रोपाई व अंकुरण", from: 0, to: 45 },
        { en: "Tillering", hi: "कल्ले फूटना", from: 45, to: 120 },
        { en: "Grand growth", hi: "तेज़ वृद्धि", from: 120, to: 270 },
        { en: "Maturity & harvest", hi: "पकाई व कटाई", from: 270, to: 365 }
      ]
    }
  ];

  /* ----------------------------------------------------------------------
   * NUTRITION REFERENCE (per 100 g, approximate)
   * Values are indicative general reference figures compiled from public
   * food-composition sources. They are NOT a medical or dietary prescription.
   * -------------------------------------------------------------------- */
  var NUTRITION = [
    { id: "apple", en: "Apple", hi: "सेब", img: img("photo-1568702846914-96b305d2aaeb", 600), category: "fruit", kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, satFat: 0.0, fiber: 2.4, sugar: 10.4, sodium: 1, potassium: 107, calcium: 6, iron: 0.1, vitC: 4.6, vitA: 3, water: 86, benefit: { en: "Good source of fibre and vitamin C; supports digestion.", hi: "फाइबर व विटामिन C का अच्छा स्रोत; पाचन में सहायक।" }, storage: { en: "Store in a cool, dark place; refrigerate to extend life.", hi: "ठंडी, अंधेरी जगह रखें; फ्रिज में अधिक दिन चलता है।" } },
    { id: "banana", en: "Banana", hi: "केला", img: img("photo-1571771894821-ce9b6c11b08e", 600), category: "fruit", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, satFat: 0.1, fiber: 2.6, sugar: 12.2, sodium: 1, potassium: 358, calcium: 5, iron: 0.3, vitC: 8.7, vitA: 3, water: 75, benefit: { en: "Rich in potassium; quick energy and easy to digest.", hi: "पोटैशियम से भरपूर; तुरंत ऊर्जा व आसान पाचन।" }, storage: { en: "Keep at room temperature; refrigerate only when ripe.", hi: "सामान्य तापमान पर रखें; पकने पर ही फ्रिज में।" } },
    { id: "mango", en: "Mango", hi: "आम", img: img("photo-1553279768-865429fa0078", 600), category: "fruit", kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, satFat: 0.1, fiber: 1.6, sugar: 13.7, sodium: 1, potassium: 168, calcium: 11, iron: 0.2, vitC: 36, vitA: 54, water: 83, benefit: { en: "Provides vitamin A and C; seasonal fruit rich in antioxidants.", hi: "विटामिन A व C देता है; एंटीऑक्सिडेंट से भरपूर मौसमी फल।" }, storage: { en: "Ripen at room temperature, then refrigerate.", hi: "सामान्य तापमान पर पकाएँ, फिर फ्रिज में रखें।" } },
    { id: "orange", en: "Orange", hi: "संतरा", img: img("photo-1547514701-42782101795e", 600), category: "fruit", kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, satFat: 0.0, fiber: 2.4, sugar: 9.4, sodium: 0, potassium: 181, calcium: 40, iron: 0.1, vitC: 53, vitA: 11, water: 87, benefit: { en: "Excellent vitamin C source supporting immunity.", hi: "प्रतिरक्षा हेतु उत्कृष्ट विटामिन C स्रोत।" }, storage: { en: "Store cool; refrigerate for longer shelf life.", hi: "ठंडा रखें; अधिक दिनों हेतु फ्रिज में।" } },
    { id: "guava", en: "Guava", hi: "अमरूद", img: img("photo-1536511132770-e5058c7e8c46", 600), category: "fruit", kcal: 68, protein: 2.6, carbs: 14, fat: 1.0, satFat: 0.3, fiber: 5.4, sugar: 8.9, sodium: 2, potassium: 417, calcium: 18, iron: 0.3, vitC: 228, vitA: 31, water: 81, benefit: { en: "Very high vitamin C and fibre content.", hi: "बहुत अधिक विटामिन C व फाइबर।" }, storage: { en: "Room temperature to ripen; refrigerate when ripe.", hi: "पकने हेतु सामान्य तापमान; पकने पर फ्रिज में।" } },
    { id: "papaya", en: "Papaya", hi: "पपीता", img: img("photo-1517282009859-f000ec3b26fe", 600), category: "fruit", kcal: 43, protein: 0.5, carbs: 11, fat: 0.3, satFat: 0.1, fiber: 1.7, sugar: 7.8, sodium: 8, potassium: 182, calcium: 20, iron: 0.3, vitC: 61, vitA: 47, water: 88, benefit: { en: "Contains digestive enzymes; rich in vitamin C and A.", hi: "पाचन एंज़ाइम युक्त; विटामिन C व A से भरपूर।" }, storage: { en: "Ripen at room temperature; refrigerate cut fruit.", hi: "सामान्य तापमान पर पकाएँ; कटा फल फ्रिज में।" } },
    { id: "tomato", en: "Tomato", hi: "टमाटर", img: img("photo-1592924357228-91a4daadcfea", 600), category: "vegetable", kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, satFat: 0.0, fiber: 1.2, sugar: 2.6, sodium: 5, potassium: 237, calcium: 10, iron: 0.3, vitC: 14, vitA: 42, water: 95, benefit: { en: "Source of lycopene and vitamin C.", hi: "लाइकोपीन व विटामिन C का स्रोत।" }, storage: { en: "Room temperature; avoid refrigerating to keep flavour.", hi: "सामान्य तापमान; स्वाद हेतु फ्रिज से बचें।" } },
    { id: "potato", en: "Potato", hi: "आलू", img: img("photo-1518977676601-b53f82aba655", 600), category: "vegetable", kcal: 77, protein: 2.0, carbs: 17, fat: 0.1, satFat: 0.0, fiber: 2.2, sugar: 0.8, sodium: 6, potassium: 425, calcium: 12, iron: 0.8, vitC: 19, vitA: 0, water: 79, benefit: { en: "Energy-giving carbohydrate with potassium.", hi: "ऊर्जा देने वाला कार्बोहाइड्रेट व पोटैशियम।" }, storage: { en: "Store cool, dark and dry — not in the fridge.", hi: "ठंडी, अंधेरी व सूखी जगह रखें — फ्रिज में नहीं।" } },
    { id: "onion", en: "Onion", hi: "प्याज", img: img("photo-1508747703725-719777637510", 600), category: "vegetable", kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, satFat: 0.0, fiber: 1.7, sugar: 4.2, sodium: 4, potassium: 146, calcium: 23, iron: 0.2, vitC: 7.4, vitA: 0, water: 89, benefit: { en: "Contains sulphur compounds and antioxidants.", hi: "गंधक यौगिक व एंटीऑक्सिडेंट युक्त।" }, storage: { en: "Cool, dry, ventilated place away from potatoes.", hi: "ठंडी, सूखी, हवादार जगह; आलू से दूर।" } },
    { id: "spinach", en: "Spinach", hi: "पालक", img: img("photo-1576045057995-568f588f82fb", 600), category: "vegetable", kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, satFat: 0.1, fiber: 2.2, sugar: 0.4, sodium: 79, potassium: 558, calcium: 99, iron: 2.7, vitC: 28, vitA: 469, water: 91, benefit: { en: "Rich in iron, calcium, and vitamin A.", hi: "लोहा, कैल्शियम व विटामिन A से भरपूर।" }, storage: { en: "Refrigerate wrapped; use within a few days.", hi: "लपेटकर फ्रिज में; कुछ दिनों में उपयोग करें।" } },
    { id: "carrot", en: "Carrot", hi: "गाजर", img: img("photo-1598170845058-32b9d6a5da37", 600), category: "vegetable", kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, satFat: 0.0, fiber: 2.8, sugar: 4.7, sodium: 69, potassium: 320, calcium: 33, iron: 0.3, vitC: 5.9, vitA: 835, water: 88, benefit: { en: "High in beta-carotene (vitamin A).", hi: "बीटा-कैरोटीन (विटामिन A) से भरपूर।" }, storage: { en: "Refrigerate in a bag; keeps for weeks.", hi: "थैली में फ्रिज में; कई सप्ताह चलता है।" } },
    { id: "cabbage", en: "Cabbage", hi: "पत्तागोभी", img: img("photo-1550989460-0adf9ea622e2", 600), category: "vegetable", kcal: 25, protein: 1.3, carbs: 6, fat: 0.1, satFat: 0.0, fiber: 2.5, sugar: 3.2, sodium: 18, potassium: 170, calcium: 40, iron: 0.5, vitC: 37, vitA: 5, water: 92, benefit: { en: "Low-calorie with fibre and vitamin C.", hi: "कम कैलोरी; फाइबर व विटामिन C।" }, storage: { en: "Refrigerate whole; cut pieces within days.", hi: "साबुत फ्रिज में; कटे टुकड़े कुछ दिनों में।" } },
    { id: "greenpeas", en: "Green Peas", hi: "हरी मटर", img: img("photo-1587735243615-c03f25aaff15", 600), category: "vegetable", kcal: 81, protein: 5.4, carbs: 14, fat: 0.4, satFat: 0.1, fiber: 5.1, sugar: 5.7, sodium: 5, potassium: 244, calcium: 25, iron: 1.5, vitC: 40, vitA: 38, water: 79, benefit: { en: "Plant protein and fibre; good for satiety.", hi: "पौध प्रोटीन व फाइबर; भरपूर पेट।" }, storage: { en: "Refrigerate; freeze to store longer.", hi: "फ्रिज में; अधिक समय हेतु फ्रीज़ करें।" } },
    { id: "brinjal", en: "Brinjal (Eggplant)", hi: "बैंगन", img: img("photo-1615484477778-ca3b77940c25", 600), category: "vegetable", kcal: 25, protein: 1.0, carbs: 6, fat: 0.2, satFat: 0.0, fiber: 3.0, sugar: 3.5, sodium: 2, potassium: 229, calcium: 9, iron: 0.2, vitC: 2.2, vitA: 1, water: 92, benefit: { en: "Fibre-rich and low in calories.", hi: "फाइबर युक्त व कम कैलोरी।" }, storage: { en: "Room temperature briefly; refrigerate for longer.", hi: "थोड़ी देर सामान्य; अधिक हेतु फ्रिज में।" } },
    { id: "rice-cooked", en: "Cooked White Rice", hi: "पका सफेद चावल", img: img("photo-1536304993881-ff6e9eefa2a6", 600), category: "grain", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, satFat: 0.1, fiber: 0.4, sugar: 0.1, sodium: 1, potassium: 35, calcium: 10, iron: 0.2, vitC: 0, vitA: 0, water: 68, benefit: { en: "Easy-to-digest energy staple.", hi: "आसान पाचन वाला ऊर्जा आहार।" }, storage: { en: "Refrigerate cooked rice; reheat thoroughly and consume within a day.", hi: "पके चावल फ्रिज में; गर्म कर के एक दिन में खाएँ।" } },
    { id: "roti", en: "Wheat Roti (Chapati)", hi: "गेहूँ की रोटी", img: img("photo-1565557623262-b51c2513a641", 600), category: "grain", kcal: 297, protein: 11, carbs: 46, fat: 7, satFat: 1.0, fiber: 6, sugar: 2, sodium: 200, potassium: 150, calcium: 30, iron: 3.0, vitC: 0, vitA: 0, water: 28, benefit: { en: "Whole-wheat staple providing complex carbs, fibre and some protein.", hi: "साबुत गेहूँ का आहार; जटिल कार्ब्स, फाइबर व कुछ प्रोटीन।" }, storage: { en: "Best fresh; store in an airtight container.", hi: "ताज़ा सर्वोत्तम; वायुरोधी डिब्बे में रखें।" } },
    { id: "dal-cooked", en: "Cooked Lentil Dal (Toor/Moong)", hi: "पकी दाल (अरहर/मूंग)", img: img("photo-1546833999-b9f581a1996d", 600), category: "pulse", kcal: 116, protein: 9, carbs: 20, fat: 0.4, satFat: 0.1, fiber: 8, sugar: 2, sodium: 5, potassium: 369, calcium: 19, iron: 3.3, vitC: 1.5, vitA: 0, water: 70, benefit: { en: "Excellent plant protein and fibre source.", hi: "उत्कृष्ट पौध प्रोटीन व फाइबर स्रोत।" }, storage: { en: "Refrigerate cooked dal; use within 2 days.", hi: "पकी दाल फ्रिज में; 2 दिनों में उपयोग करें।" } },
    { id: "chana-boiled", en: "Boiled Chickpeas (Chana)", hi: "उबला चना", img: img("photo-1610970881699-44a5587cabec", 600), category: "pulse", kcal: 164, protein: 8.9, carbs: 27, fat: 2.6, satFat: 0.3, fiber: 7.6, sugar: 4.8, sodium: 7, potassium: 291, calcium: 49, iron: 2.9, vitC: 1.3, vitA: 1, water: 60, benefit: { en: "Protein and fibre rich; supports fullness.", hi: "प्रोटीन व फाइबर से भरपूर; पेट भरा रखे।" }, storage: { en: "Refrigerate; consume within 3 days.", hi: "फ्रिज में; 3 दिनों में खाएँ।" } },
    { id: "paneer", en: "Paneer (Cottage Cheese)", hi: "पनीर", img: img("photo-1631452180519-c014fe946bc7", 600), category: "dairy", kcal: 265, protein: 18, carbs: 3.4, fat: 20, satFat: 13, fiber: 0, sugar: 3.4, sodium: 22, potassium: 138, calcium: 208, iron: 0.3, vitC: 0, vitA: 60, water: 54, benefit: { en: "Concentrated protein and calcium; also higher in fat.", hi: "गाढ़ा प्रोटीन व कैल्शियम; वसा भी अधिक।" }, storage: { en: "Refrigerate in water; use within a few days.", hi: "पानी में फ्रिज में; कुछ दिनों में उपयोग करें।" } },
    { id: "milk", en: "Milk (Toned)", hi: "दूध (टोन्ड)", img: img("photo-1550583724-b2692b85b150", 600), category: "dairy", kcal: 58, protein: 3.2, carbs: 4.8, fat: 3.0, satFat: 1.9, fiber: 0, sugar: 4.8, sodium: 44, potassium: 150, calcium: 120, iron: 0.1, vitC: 1, vitA: 47, water: 88, benefit: { en: "Calcium and protein; good source of vitamin B12 and D (if fortified).", hi: "कैल्शियम व प्रोटीन; विटामिन B12 व D (यदि फोर्टिफाइड)।" }, storage: { en: "Refrigerate; use before expiry.", hi: "फ्रिज में; एक्सपायरी से पहले उपयोग करें।" } },
    { id: "curd", en: "Curd (Yoghurt)", hi: "दही", img: img("photo-1488477181946-6428a0291777", 600), category: "dairy", kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, satFat: 2.1, fiber: 0, sugar: 4.7, sodium: 46, potassium: 155, calcium: 121, iron: 0.1, vitC: 0.5, vitA: 27, water: 88, benefit: { en: "Contains probiotics supporting gut health.", hi: "आंत स्वास्थ्य हेतु प्रोबायोटिक।" }, storage: { en: "Refrigerate; consume fresh.", hi: "फ्रिज में; ताज़ा खाएँ।" } },
    { id: "egg", en: "Egg (Boiled)", hi: "अंडा (उबला)", img: img("photo-1582722872445-44dc5f7e3c8f", 600), category: "protein", kcal: 155, protein: 13, carbs: 1.1, fat: 11, satFat: 3.3, fiber: 0, sugar: 1.1, sodium: 124, potassium: 126, calcium: 50, iron: 1.2, vitC: 0, vitA: 149, water: 75, benefit: { en: "Complete protein with vitamin A and B12.", hi: "पूर्ण प्रोटीन; विटामिन A व B12।" }, storage: { en: "Refrigerate; use before expiry.", hi: "फ्रिज में; एक्सपायरी से पहले उपयोग करें।" } },
    { id: "chicken", en: "Chicken (Cooked, skinless)", hi: "चिकन (पका, बिना चमड़ी)", img: img("photo-1604503468506-a8da13d82791", 600), category: "protein", kcal: 165, protein: 31, carbs: 0, fat: 3.6, satFat: 1.0, fiber: 0, sugar: 0, sodium: 74, potassium: 256, calcium: 15, iron: 1.0, vitC: 0, vitA: 6, water: 65, benefit: { en: "Lean protein supporting muscle maintenance.", hi: "मांसपेशियों हेतु दुबला प्रोटीन।" }, storage: { en: "Refrigerate raw and cooked separately; cook thoroughly.", hi: "कच्चा व पका अलग-अलग फ्रिज में; पूरी तरह पकाएँ।" } },
    { id: "groundnut", en: "Groundnut (Roasted)", hi: "भुनी मूँगफली", img: img("photo-1567892737950-30c4db37cd89", 600), category: "nut", kcal: 567, protein: 26, carbs: 16, fat: 49, satFat: 6.9, fiber: 8.5, sugar: 4.7, sodium: 18, potassium: 705, calcium: 92, iron: 4.6, vitC: 0, vitA: 0, water: 1.6, benefit: { en: "Energy-dense with protein and healthy fats; watch portion size.", hi: "प्रोटीन व अच्छी वसा से भरपूर; मात्रा का ध्यान रखें।" }, storage: { en: "Airtight, cool and dry to prevent rancidity.", hi: "वायुरोधी, ठंडा व सूखा; बासी होने से बचाएँ।" } },
    { id: "almonds", en: "Almonds", hi: "बादाम", img: img("photo-1508061253366-f7da158b6d46", 600), category: "nut", kcal: 579, protein: 21, carbs: 22, fat: 50, satFat: 3.8, fiber: 12, sugar: 4.4, sodium: 1, potassium: 733, calcium: 269, iron: 3.7, vitC: 0, vitA: 0, water: 4.4, benefit: { en: "Healthy fats, vitamin E, protein; small portions advised.", hi: "अच्छी वसा, विटामिन E, प्रोटीन; कम मात्रा उपयुक्त।" }, storage: { en: "Airtight container in a cool place.", hi: "ठंडी जगह वायुरोधी डिब्बे में।" } }
  ];

  /* ----------------------------------------------------------------------
   * COMMON PACKAGED / JUNK FOODS (per typical serving where noted)
   * Approximate general reference values only.
   * -------------------------------------------------------------------- */
  var JUNK_FOODS = [
    { id: "chips", en: "Potato Chips", hi: "आलू चिप्स", serving: "50 g (small pack)", kcal: 274, protein: 3.5, carbs: 26, fat: 18, satFat: 6, sugar: 0.3, fiber: 2, sodium: 500, potassium: 600, calcium: 20, iron: 0.8, concern: { en: "Very high in fat and sodium; easy to over-eat.", hi: "वसा व सोडियम अधिक; जल्दी अधिक खा जाते हैं।" } },
    { id: "noodles", en: "Instant Noodles", hi: "इंस्टेंट नूडल्स", serving: "1 pack (~70 g)", kcal: 350, protein: 8, carbs: 52, fat: 13, satFat: 6, sugar: 2, fiber: 2, sodium: 1100, potassium: 150, calcium: 30, iron: 1.2, concern: { en: "High sodium and refined carbohydrate; low fibre.", hi: "सोडियम व रिफाइंड कार्ब्स अधिक; फाइबर कम।" } },
    { id: "pizza", en: "Pizza (cheese, 1 slice)", hi: "पिज़्ज़ा (चीज़, 1 स्लाइस)", serving: "1 slice (~100 g)", kcal: 266, protein: 11, carbs: 33, fat: 10, satFat: 4.5, sugar: 3.6, fiber: 2.3, sodium: 598, potassium: 172, calcium: 188, iron: 2.3, concern: { en: "Refined base with high sodium and saturated fat.", hi: "रिफाइंड बेस; सोडियम व संतृप्त वसा अधिक।" } },
    { id: "burger", en: "Burger (veg/cheese)", hi: "बर्गर (वेज/चीज़)", serving: "1 burger (~150 g)", kcal: 295, protein: 11, carbs: 30, fat: 14, satFat: 5, sugar: 6, fiber: 2, sodium: 500, potassium: 250, calcium: 120, iron: 2.5, concern: { en: "High saturated fat and sodium; often low in fibre.", hi: "संतृप्त वसा व सोडियम अधिक; फाइबर कम।" } },
    { id: "softdrink", en: "Soft Drink (Cola)", hi: "कोल्ड ड्रिंक (कोला)", serving: "330 ml can", kcal: 139, protein: 0, carbs: 36, fat: 0, satFat: 0, sugar: 35, fiber: 0, sodium: 15, potassium: 3, calcium: 2, iron: 0, concern: { en: "Very high added sugar with no nutrients.", hi: "बहुत अधिक शर्करा, कोई पोषक तत्व नहीं।" } },
    { id: "samosa", en: "Samosa (fried)", hi: "समोसा (तला)", serving: "1 piece (~60 g)", kcal: 262, protein: 4, carbs: 24, fat: 17, satFat: 4, sugar: 1, fiber: 2, sodium: 350, potassium: 180, calcium: 20, iron: 1.2, concern: { en: "Deep-fried; high fat and calorie density.", hi: "गहरे तेल में तला; वसा व कैलोरी अधिक।" } },
    { id: "biscuit", en: "Cream Biscuits", hi: "क्रीम बिस्किट", serving: "3 biscuits (~30 g)", kcal: 145, protein: 1.6, carbs: 22, fat: 5.5, satFat: 2.5, sugar: 10, fiber: 0.6, sodium: 110, potassium: 40, calcium: 15, iron: 0.5, concern: { en: "Refined flour and added sugar; limited nutrition.", hi: "रिफाइंड आटा व शर्करा; पोषण सीमित।" } },
    { id: "chocolate", en: "Milk Chocolate", hi: "मिल्क चॉकलेट", serving: "40 g bar", kcal: 214, protein: 3, carbs: 24, fat: 12, satFat: 7, sugar: 21, fiber: 1.4, sodium: 30, potassium: 150, calcium: 75, iron: 1, concern: { en: "High sugar and saturated fat; occasional treat.", hi: "शर्करा व संतृप्त वसा अधिक; कभी-कभार।" } },
    { id: "icecream", en: "Ice Cream", hi: "आइसक्रीम", serving: "100 g", kcal: 207, protein: 3.5, carbs: 24, fat: 11, satFat: 6.8, sugar: 21, fiber: 0.7, sodium: 80, potassium: 199, calcium: 128, iron: 0.1, concern: { en: "High sugar and saturated fat.", hi: "शर्करा व संतृप्त वसा अधिक।" } },
    { id: "pakora", en: "Fried Pakora / Bhajji", hi: "तला पकौड़ा/भजिया", serving: "100 g", kcal: 315, protein: 7, carbs: 27, fat: 20, satFat: 3, sugar: 2, fiber: 4, sodium: 480, potassium: 350, calcium: 60, iron: 2.0, concern: { en: "Deep-fried; absorbs a lot of oil.", hi: "गहरे तेल में तला; बहुत तेल सोखता है।" } }
  ];

  /* ----------------------------------------------------------------------
   * WELLNESS GOALS & GENERAL GUIDANCE (safe, non-medical, educational)
   * -------------------------------------------------------------------- */
  var WELLNESS_GOALS = [
    { id: "overall", en: "Improve overall health", hi: "समग्र स्वास्थ्य सुधारें" },
    { id: "eating", en: "Build healthier eating habits", hi: "स्वस्थ खान-पान की आदतें बनाएँ" },
    { id: "activity", en: "Improve daily activity", hi: "दैनिक गतिविधि बढ़ाएँ" },
    { id: "sleep", en: "Improve sleep routine", hi: "नींद की दिनचर्या सुधारें" }
  ];

  /* Daily habit tracker defaults (bilingual) */
  var HABITS = [
    { id: "water", emoji: "\uD83D\uDCA7", en: "Drink enough water", hi: "पर्याप्त पानी पिएँ" },
    { id: "veggies", emoji: "\uD83E\uDD57", en: "Eat fruit / vegetables", hi: "फल / सब्ज़ी खाएँ" },
    { id: "move", emoji: "\uD83D\uDEB6", en: "Move / exercise 30 min", hi: "30 मिनट गतिविधि करें" },
    { id: "sleep", emoji: "\uD83D\uDECF", en: "Sleep 7–8 hours", hi: "7–8 घंटे नींद लें" },
    { id: "screen", emoji: "\uD83D\uDCF5", en: "Limit screen before bed", hi: "सोने से पहले स्क्रीन कम करें" },
    { id: "meal", emoji: "\uD83C\uDF7D", en: "Eat on time, no skipping", hi: "समय पर भोजन करें" }
  ];

  return {
    UNSPLASH: UNSPLASH,
    img: img,
    SOILS: SOILS,
    SEASONS: SEASONS,
    WATER_LEVELS: WATER_LEVELS,
    PREFERENCES: PREFERENCES,
    UNITS: UNITS,
    STATES: STATES,
    CROPS: CROPS,
    NUTRITION: NUTRITION,
    JUNK_FOODS: JUNK_FOODS,
    WELLNESS_GOALS: WELLNESS_GOALS,
    HABITS: HABITS,
    _meta: {
      dataNote: {
        en: "General indicative reference ranges for education and demonstration. Not location-verified advice. Confirm with local agriculture extension officers / KVK and official mandi prices.",
        hi: "शिक्षा व प्रदर्शन हेतु सामान्य संकेतात्मक संदर्भ। स्थान-सत्यापित सलाह नहीं। स्थानीय कृषि विस्तार अधिकारी / KVK व आधिकारिक मंडी भाव से पुष्टि करें।"
      }
    }
  };
});
