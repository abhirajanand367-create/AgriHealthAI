"use strict";
/* Backend configuration. Reads secrets from environment variables only. */

require("dotenv").config();

function env(name, fallback) {
  var v = process.env[name];
  return v == null || v === "" ? (fallback || "") : v;
}

module.exports = {
  port: parseInt(env("PORT", "3000"), 10),
  nodeEnv: env("NODE_ENV", "development"),
  vision: {
    url: env("VISION_API_URL"),
    key: env("VISION_API_KEY"),
    model: env("VISION_MODEL", "gpt-4o-mini"),
    timeoutMs: parseInt(env("VISION_TIMEOUT_MS", "30000"), 10),
    get enabled() { return !!this.key && !!this.url; }
  },
  nutrition: {
    url: env("NUTRITION_API_URL"),
    key: env("NUTRITION_API_KEY"),
    get enabled() { return !!this.key && !!this.url; }
  },
  agri: {
    url: env("AGRI_DATA_API_URL"),
    key: env("AGRI_DATA_API_KEY"),
    get enabled() { return !!this.key && !!this.url; }
  }
};
