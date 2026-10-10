"use strict";
/* ==========================================================================
   AgriHealthAI — backend food vision service
   - If a vision API is configured (VISION_API_URL / VISION_API_KEY), it calls
     an OpenAI-compatible chat-completions endpoint with the image and asks for
     a STRICT JSON reply, then maps it to the client's expected shape.
   - Otherwise it returns an honest DEMO result: status "unknown", no food
     claim, general (safe) storage/preservation guidance.
   It never invents a confident food identity or a medical claim.
   ========================================================================== */

var config = require("../config.js");

function demoResult(reason) {
  return {
    demo: true,
    source: "backend-demo-vision",
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
    imageStats: null,
    disclaimerKey: "scanner.safetyText",
    note: reason || "demo"
  };
}

var SYSTEM_PROMPT = [
  "You are a careful food-image assistant.",
  "Analyse the photo and reply with STRICT JSON only (no markdown) using this schema:",
  "{",
  '  "status": "fresh" | "spoilage" | "unknown",',
  '  "confidence": number between 0 and 1,',
  '  "likelyFood": { "en": string, "hi": string } | null,',
  '  "candidates": [ { "name": { "en": string, "hi": string }, "confidence": number } ],',
  '  "freshnessNotes": [ { "en": string, "hi": string } ],',
  '  "spoilageSigns": [ { "en": string, "hi": string } ],',
  '  "storage": { "en": string, "hi": string },',
  '  "preservation": { "en": string, "hi": string }',
  "}",
  "Provide the human-readable strings in BOTH English (en) and Hindi (hi).",
  "If you cannot identify the food, set likelyFood to null and status to \"unknown\".",
  "Never give medical, dosage or guaranteed-safety claims."
].join("\n");

function extractJson(text) {
  if (!text) return null;
  var s = String(text).trim();
  // strip code fences
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  var start = s.indexOf("{");
  var end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try { return JSON.parse(s.slice(start, end + 1)); } catch (e) { return null; }
}

function s(v, fallback) { return typeof v === "string" && v.trim() ? v.trim() : (fallback || ""); }
function bilingual(v) {
  if (v && typeof v === "object") return { en: s(v.en, "—"), hi: s(v.hi || v.en, "—") };
  if (typeof v === "string" && v) return { en: v, hi: v };
  return null;
}
function bilingualList(v) {
  if (!Array.isArray(v)) return [];
  return v.map(bilingual).filter(Boolean);
}
function clamp01(n) { n = parseFloat(n); if (isNaN(n)) return null; return Math.max(0, Math.min(1, n)); }
function normStatus(v) { return ["fresh", "spoilage", "unknown"].indexOf(v) !== -1 ? v : "unknown"; }

function mapModelResult(parsed) {
  var candidates = Array.isArray(parsed.candidates) ? parsed.candidates.map(function (c) {
    var name = bilingual(c && (c.name || c.food || c.label));
    if (!name) return null;
    return { name: name, confidence: clamp01(c && c.confidence) };
  }).filter(Boolean) : [];

  return {
    demo: false,
    source: "vision-api",
    status: normStatus(parsed.status),
    confidence: clamp01(parsed.confidence),
    likelyFood: bilingual(parsed.likelyFood),
    candidates: candidates,
    freshnessNotes: bilingualList(parsed.freshnessNotes),
    spoilageSigns: bilingualList(parsed.spoilageSigns),
    storage: bilingual(parsed.storage) || demoResult().storage,
    preservation: bilingual(parsed.preservation) || demoResult().preservation,
    imageStats: null,
    disclaimerKey: "scanner.safetyText"
  };
}

function withTimeout(promise, ms) {
  var timer;
  var timeout = new Promise(function (_, reject) {
    timer = setTimeout(function () { reject(new Error("vision-timeout")); }, ms);
  });
  return Promise.race([promise, timeout]).finally(function () { clearTimeout(timer); });
}

function callVisionApi(dataUrl, mimeType) {
  var body = {
    model: config.vision.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse this food photo and return the JSON." },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }
    ],
    max_tokens: 700,
    temperature: 0.2
  };

  return withTimeout(
    fetch(config.vision.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + config.vision.key
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.text().then(function (txt) {
        if (!res.ok) throw new Error("vision-http-" + res.status);
        var data = null;
        try { data = JSON.parse(txt); } catch (e) { throw new Error("vision-bad-json"); }
        var content = data && data.choices && data.choices[0] &&
          data.choices[0].message && data.choices[0].message.content;
        var parsed = extractJson(content);
        if (!parsed) throw new Error("vision-no-json");
        return mapModelResult(parsed);
      });
    }),
    config.vision.timeoutMs || 30000
  );
}

/**
 * analyze({ image, mimeType })
 * `image` is a data URL (data:<mime>;base64,....) from the client.
 * Resolves to the client's expected result shape.
 */
function analyze(payload) {
  payload = payload || {};
  var image = payload.image;

  if (!image || typeof image !== "string" || image.indexOf("data:") !== 0) {
    return Promise.resolve(demoResult("no-image"));
  }

  if (!config.vision.enabled) {
    return Promise.resolve(demoResult("vision-not-configured"));
  }

  return callVisionApi(image, payload.mimeType).catch(function () {
    var r = demoResult("vision-call-failed");
    r.fallbackReason = "vision-unavailable";
    return r;
  });
}

module.exports = { analyze: analyze, demoResult: demoResult };
