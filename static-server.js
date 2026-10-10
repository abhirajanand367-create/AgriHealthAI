"use strict";
/* ==========================================================================
   AgriHealthAI — dependency-free static server
   Serves ONLY the front end from /public using Node's built-in http module.
   No npm install required. The front end will run in DEMO mode because this
   server exposes no /api endpoints (the probe simply fails and falls back).

   Run:  node server/static-server.js      (then open http://localhost:3000)
   ========================================================================== */

var http = require("http");
var fs = require("fs");
var path = require("path");

var PORT = parseInt(process.env.PORT || "3000", 10);
var PUBLIC_DIR = path.join(__dirname, "..", "public");

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
  res.end(body);
}

var server = http.createServer(function (req, res) {
  var urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return send(res, 400, "Bad request");
  }

  if (urlPath === "/") urlPath = "/index.html";

  // Resolve safely inside PUBLIC_DIR (prevent path traversal).
  var filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (filePath.indexOf(PUBLIC_DIR) !== 0) {
    return send(res, 403, "Forbidden");
  }

  fs.stat(filePath, function (err, stat) {
    if (err || !stat.isFile()) {
      // Unknown API path -> clear JSON 404; otherwise fall back to index.
      if (urlPath.indexOf("/api/") === 0) {
        return send(res, 404, JSON.stringify({ ok: false, error: "no-api-on-static-server" }), MIME[".json"]);
      }
      var fallback = path.join(PUBLIC_DIR, "index.html");
      return fs.readFile(fallback, function (e2, buf) {
        if (e2) return send(res, 404, "Not found");
        send(res, 200, buf, MIME[".html"]);
      });
    }
    fs.readFile(filePath, function (e2, buf) {
      if (e2) return send(res, 500, "Read error");
      var type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      send(res, 200, buf, type);
    });
  });
});

server.listen(PORT, function () {
  console.log("AgriHealthAI static server → http://localhost:" + PORT);
  console.log("Serving: " + PUBLIC_DIR + "   (front end runs in DEMO mode)");
});
