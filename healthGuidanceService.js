/* ==========================================================================
   AgriHealthAI — healthGuidanceService
   SAFE, non-medical, educational wellness guidance + junk-food "recovery"
   (returning to balance, never detox/fasting/punishment) + habit helpers.
   ========================================================================== */
(function () {
  "use strict";

  function lang() { return window.i18n ? window.i18n.getLang() : "en"; }
  function L(o) { return o == null ? "" : (typeof o === "string" ? o : (o[lang()] != null ? o[lang()] : o.en)); }

  var GOAL_GUIDANCE = {
    overall: [
      { en: "Pick one or two small changes at a time rather than changing everything at once.", hi: "एक बार में सब बदलने के बजाय एक-दो छोटे बदलाव चुनें।" },
      { en: "Build a rough daily rhythm: regular meals, movement, water and a consistent bedtime.", hi: "एक साधारण दिनचर्या बनाएँ: नियमित भोजन, गतिविधि, पानी और एक समान सोने का समय।" },
      { en: "Aim to include vegetables or fruit with most meals.", hi: "अधिकतर भोजन के साथ सब्ज़ी या फल शामिल करने का प्रयास करें।" },
      { en: "If you have a health condition or take medicines, talk to a qualified professional before big changes.", hi: "कोई स्वास्थ्य समस्या हो या दवा लेते हों, बड़े बदलाव से पहले योग्य पेशेवर से बात करें।" }
    ],
    eating: [
      { en: "Try the plate idea: half vegetables/fruit, a quarter whole grains, a quarter protein (dal, beans, egg, dairy, lean meat).", hi: "थाली का तरीका आज़माएँ: आधा सब्ज़ी/फल, चौथाई साबुत अनाज, चौथाई प्रोटीन (दाल, बीन्स, अंडा, दूध, दुबला मांस)।" },
      { en: "Choose whole grains (whole wheat, brown rice, millets) more often than refined ones.", hi: "रिफाइंड की अपेक्षा साबुत अनाज (साबुत गेहूँ, ब्राउन राइस, मिलेट्स) अधिक चुनें।" },
      { en: "Keep water as your main drink; limit sugary drinks.", hi: "पानी को मुख्य पेय रखें; मीठे पेय कम करें।" },
      { en: "Eat slowly and stop when comfortably full, not overly full.", hi: "धीरे खाएँ और संतोषजनक भरने पर रुकें, ज़रूरत से ज़्यादा नहीं।" },
      { en: "Plan a simple weekly menu so healthy choices are the easy choices.", hi: "साप्ताहिक मेन्यू बनाएँ ताकि स्वस्थ विकल्प आसान हों।" }
    ],
    activity: [
      { en: "Start from where you are: even a 10-minute walk counts and can build up.", hi: "जहाँ हैं वहीं से शुरू करें: 10 मिनट की सैर भी गिनती है और बढ़ाई जा सकती है।" },
      { en: "Aim for regular moderate movement most days — walking, cycling, dancing, household work or games.", hi: "अधिकतर दिन नियमित मध्यम गतिविधि का लक्ष्य रखें — सैर, साइकल, नृत्य, घर का काम या खेल।" },
      { en: "Add some strength/balance work a couple of times a week (chair squats, wall push-ups, stretching).", hi: "सप्ताह में दो बार शक्ति/संतुलन व्यायाम जोड़ें (कुर्सी स्क्वाट, दीवार पुश-अप, स्ट्रेचिंग)।" },
      { en: "Break up long sitting with short standing or walking breaks.", hi: "लंबे समय बैठने के बीच खड़े होने या चलने का छोटा ब्रेक लें।" },
      { en: "Rest and stop if you feel unwell, dizzy or in pain.", hi: "अस्वस्थ, चक्कर या दर्द महसूस हो तो रुकें और आराम करें।" }
    ],
    sleep: [
      { en: "Keep a similar bedtime and wake time, even on weekends where possible.", hi: "जहाँ संभव हो, सोने-जागने का समय एक समान रखें, छुट्टियों में भी।" },
      { en: "Wind down for 30–60 minutes: dim light, no heavy meals, and reduce screens before bed.", hi: "सोने से 30–60 मिनट पहले ढीला करें: कम रोशनी, भारी भोजन नहीं, और स्क्रीन कम करें।" },
      { en: "Keep the room dark, quiet and cool, and reserve the bed for sleep.", hi: "कमरा अंधेरा, शांत व ठंडा रखें, और बिस्तर केवल सोने के लिए रखें।" },
      { en: "Limit caffeine in the late afternoon and evening.", hi: "देर दोपहर व शाम को कैफ़ीन कम करें।" },
      { en: "If sleep problems persist, speak to a qualified professional.", hi: "नींद की समस्या बनी रहे तो योग्य पेशेवर से बात करें।" }
    ]
  };

  var BASE_HYDRATION = { en: "Drink water regularly through the day, and more in heat or after activity. Water is usually the best choice. Plain buttermilk, lemon water or unsweetened tea also count.", hi: "दिनभर नियमित पानी पिएँ, गर्मी या गतिविधि के बाद अधिक। पानी आमतौर पर सर्वोत्तम है। सादा छाछ, नींबू पानी या बिना चीनी की चाय भी गिनती है।" };
  var BASE_MOVEMENT = { en: "A short walk — even 10–15 minutes — after a heavy meal can help you feel better and supports digestion and blood-sugar balance. Pick movement you enjoy and can repeat.", hi: "भारी भोजन के बाद छोटी सैर — 10–15 मिनट भी — अच्छा महसूस कराती है और पाचन व रक्त-शर्करा संतुलन में सहायक है। वह गतिविधि चुनें जो पसंद हो और दोहराई जा सके।" };

  var NEXT_MEALS = {
    general: { en: "For your next meal, try a simple balanced plate: vegetables, a whole grain or millet, and a protein such as dal, beans, curd or egg.", hi: "अगले भोजन में साधारण संतुलित थाली आज़माएँ: सब्ज़ी, साबुत अनाज या मिलेट, और दाल, बीन्स, दही या अंडा जैसा प्रोटीन।" },
    salty: { en: "Packaged snacks are salty, so keep the next meals lower in salt: fresh fruit, unsalted nuts, curd, and lightly salted home-cooked food.", hi: "पैक्ड स्नैक्स में नमक अधिक होता है, इसलिए अगले भोजन कम नमक वाले रखें: ताज़ा फल, बिना नमक मेवे, दही और हल्का नमक वाला घर का खाना।" },
    sugary: { en: "After a sugary treat or drink, favour fibre and protein: fruit with curd, a vegetable sabzi with roti, or chana — they help steady energy.", hi: "मीठे के बाद फाइबर व प्रोटीन चुनें: दही के साथ फल, रोटी के साथ सब्ज़ी, या चना — ये ऊर्जा स्थिर रखते हैं।" },
    fried: { en: "Balance fried food with lighter, fresher meals: salads, boiled/steamed vegetables, dal, and fruit. Keep the next meal a bit lighter, not skipped.", hi: "तले भोजन को हल्के, ताज़े भोजन से संतुलित करें: सलाद, उबली/भाप में पकी सब्ज़ी, दाल और फल। अगला भोजन थोड़ा हल्का रखें, छोड़ें नहीं।" }
  };

  var LONG_TERM = [
    { en: "Frequency matters more than one meal: aim for mostly balanced choices most of the time.", hi: "एक भोजन से ज़्यादा आवृत्ति मायने रखती है: ज़्यादातर समय संतुलित विकल्प चुनें।" },
    { en: "Keep treat foods enjoyable and occasional — no guilt, no punishment.", hi: "पसंदीदा खाना कभी-कभार आनंद के साथ खाएँ — कोई अपराध-भाव नहीं, कोई सज़ा नहीं।" },
    { en: "Cook more at home and plan meals so healthy options are easy to reach.", hi: "घर पर अधिक पकाएँ और भोजन की योजना बनाएँ ताकि स्वस्थ विकल्प आसान हों।" },
    { en: "Track simple habits (like FitHomey) to notice patterns, not to judge yourself.", hi: "साधारण आदतें (जैसे फिटहोमी) ट्रैक करें ताकि पैटर्न दिखें, खुद को आँकने के लिए नहीं।" }
  ];

  function goalGuidance(goalId) {
    return {
      demo: true,
      source: "educational-content",
      goal: goalId || "overall",
      points: (GOAL_GUIDANCE[goalId] || GOAL_GUIDANCE.overall)
    };
  }

  function concernsFor(item) {
    if (!item) return [];
    var out = [];
    if (item.concern) out.push(item.concern);
    var notes = [];
    if (item.sodium != null && item.sodium >= 400) notes.push({ en: "High sodium: frequent intake can be hard on blood pressure over time.", hi: "सोडियम अधिक: लगातार सेवन समय के साथ रक्तचाप पर भार डाल सकता है।" });
    if (item.sugar != null && item.sugar >= 15) notes.push({ en: "High sugar: often adds energy without nutrients; go easy on frequency.", hi: "शर्करा अधिक: अक्सर बिना पोषण के ऊर्जा जोड़ती है; आवृत्ति कम रखें।" });
    if (item.satFat != null && item.satFat >= 5) notes.push({ en: "High saturated fat: best kept occasional.", hi: "संतृप्त वसा अधिक: कभी-कभार ही उपयुक्त।" });
    if (item.fat != null && item.fat >= 15) notes.push({ en: "Energy-dense (high fat): portions add up quickly.", hi: "ऊर्जा-घनत्व अधिक (वसा): मात्रा जल्दी बढ़ जाती है।" });
    if (item.fiber != null && item.fiber < 2) notes.push({ en: "Low fibre: pair with fibre-rich foods to feel fuller.", hi: "फाइबर कम: भरपूर महसूस हेतु फाइबर-युक्त खाना साथ लें।" });
    return out.concat(notes);
  }

  function recoveryFor(item) {
    var nextKey = "general";
    if (item) {
      if (item.id === "softdrink" || item.id === "chocolate" || item.id === "icecream") nextKey = "sugary";
      else if (item.id === "chips" || item.id === "noodles") nextKey = "salty";
      else if (item.id === "samosa" || item.id === "pakora" || item.id === "pizza" || item.id === "burger") nextKey = "fried";
      if (item.sugar != null && item.sugar >= 15) nextKey = "sugary";
    }
    return {
      demo: true,
      source: "educational-content",
      item: item || null,
      concerns: concernsFor(item),
      nextMeal: NEXT_MEALS[nextKey],
      nextMealsList: [
        { en: "Vegetable sabzi + roti + a bowl of dal or curd.", hi: "सब्ज़ी + रोटी + एक कटोरी दाल या दही।" },
        { en: "Fruit and a handful of nuts, or chana.", hi: "फल और एक मुट्ठी मेवे, या चना।" },
        { en: "Salad or steamed vegetables with a whole grain.", hi: "सलाद या भाप में पकी सब्ज़ी के साथ साबुत अनाज।" }
      ],
      hydration: BASE_HYDRATION,
      movement: BASE_MOVEMENT,
      longTerm: LONG_TERM
    };
  }

  function getGuidance() {
    return Promise.resolve({ demo: true, source: "educational-content" });
  }

  window.healthGuidanceService = {
    goalGuidance: goalGuidance,
    recoveryFor: recoveryFor,
    concernsFor: concernsFor,
    getGuidance: getGuidance,
    GOAL_IDS: ["overall", "eating", "activity", "sleep"]
  };
})();
