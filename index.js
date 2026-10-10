"use strict";
/* ==========================================================================
   AgriHealthAI — server entry point
   Serves the static front end from /public and mounts the optional JSON API
   at /api. If optional AI keys are missing, endpoints answer in clearly
   labelled DEMO mode (the front end also detects this via /api/health).

   Run:  npm install   then   npm start      (http://localhost:3000)
   ========================================================================== */

var path = require("path");
var express = require("express");
var cors = require("cors");

var config = require("./config.js");
var apiRoutes = require("./routes/api.js");

var app = express();
var PUBLIC_DIR = path.join(__dirname, "..", "public");

app.disable("x-powered-by");
app.use(cors());

// Image data URLs can be large; allow a comfortable JSON body size.
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Lightweight request log (API only, to keep static serving quiet).
app.use("/api", function (req, res, next) {
  if (config.nodeEnv !== "production") {
    console.log(new Date().toISOString() + "  " + req.method + " " + req.originalUrl);
  }
  next();
});

app.use("/api", apiRoutes);

// Static front end.
app.use(express.static(PUBLIC_DIR, { extensions: ["html"], maxAge: 0 }));

// Convenience: map any unknown non-API path to index (single-page friendly).
app.get("*", function (req, res, next) {
  if (req.path.indexOf("/api/") === 0) return next();
  res.sendFile(path.join(PUBLIC_DIR, "index.html"), function (err) {
    if (err) next();
  });
});

// Final app-level error handler (body-parse errors, uncaught route errors).
app.use(function (err, req, res, next) {
  var status = err && err.status ? err.status : 500;
  if (status >= 500) console.error("[server error]", err && err.stack || err);
  if (req.path.indexOf("/api/") === 0) {
    return res.status(status).json({ error: "server-error", message: status === 413 ? "payload-too-large" : undefined });
  }
  res.status(status).send(status === 413 ? "Payload too large" : "Server error");
});

app.listen(config.port, function () {
  console.log("──────────────────────────────────────────────");
  console.log(" AgriHealthAI server running");
  console.log("  ➜  http://localhost:" + config.port);
  console.log("  ➜  front end : " + PUBLIC_DIR);
  console.log("  ➜  api health: http://localhost:" + config.port + "/api/health");
  console.log("  ➜  mode      : " + (config.vision.enabled ? "vision API enabled" : "DEMO (no AI keys set)"));
  console.log("──────────────────────────────────────────────");
});
