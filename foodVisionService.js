/* ==========================================================================
   AgriHealthAI — foodVisionService
   Food image analysis. DEMO MODE performs only a transparent LOCAL
   measurement (image quality / colour statistics) and returns an honest
   "Unable to Determine" result — it does NOT pretend to identify food or
   detect spoilage. Connect a vision model on the backend for real analysis.
   ========================================================================== */
(function () {
  "use strict";

  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(new Error("read-failed")); };
      fr.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("image-decode-failed")); };
      img.src = src;
    });
  }

  /** Real, objective local measurement — not a food claim. */
  function measureImage(img) {
    var w = 96, h = 96;
    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    var data;
    try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    var rSum = 0, gSum = 0, bSum = 0, lum = 0, n = w * h;
    for (var i = 0; i < data.length; i += 4) {
      rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
      lum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    }
    var r = rSum / n, g = gSum / n, b = bSum / n;
    var brightness = Math.round((lum / n) / 255 * 100);
    var dominant = "neutral";
    if (r > g + 18 && r > b + 18) dominant = "reddish";
    else if (g > r + 14 && g > b + 14) dominant = "greenish";
    else if (b > r + 14 && b > g + 10) dominant = "bluish";
    else if (r > 150 && g > 130 && b < 110) dominant = "yellowish";
    else if (r > 180 && g > 180 && b > 180) dominant = "light";
    return {
      brightness: brightness,
      dominant: dominant,
      rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b) }
    };
  }

  function demoResult(stats) {
    return {
      demo: true,
      source: "local-demo-vision",
      status: "unknown", // fresh | spoilage | unknown
      confidence: 0.25,
      likelyFood: null,
      candidates: [],
      freshnessNotes: [
        { en: "No vision model is connected, so freshness could not be assessed.", hi: "कोई विज़न मॉडल जुड़ा नहीं है, इसलिए ताज़गी का आकलन नहीं हो सका।" }
      ],
      spoilageSigns: [],
      storage: {
        en: "General guidance: keep fresh food cool and covered, refrigerate perishables, and follow the label for packaged food.",
        hi: "सामान्य सलाह: ताज़ा भोजन ठंडा व ढककर रखें, जल्दी खराब होने वाली चीज़ें फ्रिज में रखें, और पैक्ड भोजन पर लेबल देखें।"
      },
      preservation: {
        en: "Common methods: refrigeration, freezing, drying, pickling, canning and vacuum packing — choose based on the food and how soon you will eat it.",
        hi: "आम तरीके: फ्रिज, फ्रीज़िंग, सुखाना, अचार, कैनिंग व वैक्यूम पैक — भोजन और खाने के समय के अनुसार चुनें।"
      },
      imageStats: stats,
      disclaimerKey: "scanner.safetyText"
    };
  }

  function analyzeImage(file) {
    if (!file) return Promise.reject(new Error("no-file"));
    return readAsDataURL(file).then(function (dataUrl) {
      return loadImage(dataUrl).then(function (img) {
        var stats = measureImage(img);
        return window.apiClient.probe().then(function (hasBackend) {
          if (!hasBackend) {
            var r = demoResult(stats);
            r.preview = dataUrl;
            return r;
          }
          return window.apiClient.post("/api/food/analyze", {
            image: dataUrl,
            mimeType: file.type
          }).then(function (res) {
            res.preview = dataUrl;
            return res;
          }).catch(function () {
            var f = demoResult(stats);
            f.preview = dataUrl;
            f.fallbackReason = "backend-unavailable";
            return f;
          });
        });
      });
    });
  }

  /** Files accepted by the UI. */
  var ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  var MAX_BYTES = 6 * 1024 * 1024;

  function validateFile(file) {
    if (!file) return { ok: false, errorKey: "scanner.pickFirst" };
    if (ACCEPTED.indexOf(file.type) === -1) return { ok: false, errorKey: "scanner.errorType" };
    if (file.size > MAX_BYTES) return { ok: false, errorKey: "scanner.errorSize" };
    return { ok: true };
  }

  window.foodVisionService = {
    analyzeImage: analyzeImage,
    validateFile: validateFile,
    readAsDataURL: readAsDataURL,
    ACCEPTED: ACCEPTED,
    MAX_BYTES: MAX_BYTES
  };
})();
