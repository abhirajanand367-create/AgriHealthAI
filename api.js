"use strict";
/* ==========================================================================
   AgriHealthAI — API routes
   Mounts the optional backend endpoints consumed by the front-end services.
   Every response matches the shape the client already expects, so the front
   end works identically with or without this backend.
   ========================================================================== */

var express = require("express");
var config = require("../config.js");
var cropEngine = require("../services/cropEngine.js");
var foodVision = require("../services/foodVision.js");
var nutrition = require("../services/nutrition.js");

var router = express.Router();

/* ---- health / capability probe ---- */
router.get("/health", function (req, res) {
  res.json({
    ok: true,
    service: "agrihealthai",
    version: require("../../package.json").version,
    time: new Date().toISOString(),
    features: {
      cropRecommendation: true,
      cropPlanning: true,
      foodVision: config.vision.enabled,
      nutrition: true, // reference dataset always available
      contact: true
    },
    demo: !config.vision.enabled
  });
});

/* ---- crops ---- */
router.post("/crops/recommend", function (req, res) {
  var out = cropEngine.recommend(req.body || {});
  res.json(out);
});

router.post("/crops/plan", function (req, res) {
  var body = req.body || {};
  var cropId = body.cropId;
  var plan = cropEngine.buildPlan(cropId, body.input || {});
  if (!plan) {
    return res.status(404).json({ error: "unknown-crop", cropId: cropId });
  }
  res.json(plan);
});

/* ---- food image analysis ---- */
router.post("/food/analyze", function (req, res) {
  var body = req.body || {};
  foodVision.analyze(body).then(function (out) {
    res.json(out);
  }).catch(function () {
    res.json(foodVision.demoResult("analysis-failed"));
  });
});

/* ---- nutrition reference lookup ---- */
router.get("/nutrition/:id", function (req, res) {
  res.json(nutrition.lookup(req.params.id));
});

/* ---- contact (store/log only; no mailer configured) ---- */
router.post("/contact", function (req, res) {
  var b = req.body || {};
  var name = String(b.name || "").trim();
  var email = String(b.email || "").trim();
  var topic = String(b.topic || "").trim();
  var message = String(b.message || "").trim();
  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk || !topic || message.length < 10) {
    return res.status(400).json({ ok: false, error: "validation-failed" });
  }

  // No outbound mailer is configured in this scaffold. Log server-side only.
  console.log("[contact] " + new Date().toISOString() + " | " + topic + " | " + email + " | " + name);
  res.json({
    ok: true,
    received: true,
    demo: true,
    note: "Stored on the server log only. Configure a mailer/provider to deliver messages."
  });
});

/* ---- JSON 404 for unknown API paths ---- */
router.use(function (req, res) {
  res.status(404).json({ error: "not-found", path: req.originalUrl });
});

/* ---- error handler ---- */
router.use(function (err, req, res, next) {
  console.error("[api error]", err && err.message);
  res.status(err && err.status ? err.status : 500).json({
    error: "server-error",
    message: config.nodeEnv === "production" ? undefined : String(err && err.message || err)
  });
});

module.exports = router;
