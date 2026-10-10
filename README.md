# AgriHealthAI

**Smart Agriculture. Better Food. Healthier Choices.**
A bilingual (English + हिन्दी) web platform that helps with **crop planning**, **food awareness & nutrition**, and **everyday healthy habits** (FitHomey).

Light, premium SaaS-style UI built with **HTML5 + CSS3 + vanilla JavaScript** — no framework, no build step. An **optional** Node/Express backend adds real AI (food vision) and serves the API.

> **Honesty first.** Nothing here invents AI results, sensor data, profits, testimonials or user counts. Every advisory/financial number is an **estimate from general reference ranges**, clearly labelled **DEMO** until real data/keys are connected. Nitrate/fertiliser/pesticide specifics are deliberately avoided in favour of "confirm with your local KVK / agriculture extension officer".

---

## 1. What works right now (no backend, no keys)

The front end is fully functional on its own in **DEMO MODE**:

| Module | Features |
|---|---|
| **Agriculture** | Input form (state, area + unit, season, soil, water, budget, preferences) with validation → ranked crop recommendations with transparent **match reasons** → side-by-side **compare** → full **cultivation plan** (land prep, seed, sowing, spacing, irrigation, fertiliser, weed, pest, harvest, storage, growth-stage timeline, day-wise task calendar) → **print / download / save** plan. Net profit = estimated gross revenue − estimated total cost. |
| **Food Scanner** | Drag-and-drop / file upload (JPEG/PNG/WebP, ≤6 MB) with preview → honest demo vision result (status **“Unable to Determine”**, plus a **real, local image measurement**: brightness + dominant tone) → user confirms the food → full **nutrition panel** (energy, macros, micros) scaled by serving size, macro-energy split, benefit/storage/preservation guidance. |
| **Health & FitHomey** | Lifestyle **guidance** by goal (overall/eating/activity/sleep, non-medical) → junk-food **recovery** guidance (balanced next meals, hydration, movement, long-term habits — never detox/fasting/punishment) → **FitHomey habit tracker** with daily habit checklist, sleep log, 7-day chart, streak and reset/clear (saved in `localStorage`). |
| **Info** | Home, About, Contact (validated), Privacy & data handling. |
| **i18n** | One translation dictionary (`en` + `hi`), instant switching, persisted in `localStorage`, inputs preserved across language changes. |

The front end auto-detects a backend by probing `GET /api/health`. If it isn't reachable, it silently uses the built-in demo engines.

---

## 2. Run it

### Option A — just open it (simplest)
Open `public/index.html` directly in a browser. Works offline; backend features are disabled (demo mode).

### Option B — Node static server (no install needed)
Requires Node 18+.
```bash
node server/static-server.js
# → http://localhost:3000   (front end only, demo mode)
```

### Option C — Node full server (API + optional real AI)
Requires Node 18+.
```bash
cp .env.example .env      # then edit as needed (keys optional)
npm install
npm start                 # or: npm run dev
# → http://localhost:3000
# → API health: http://localhost:3000/api/health
```

### Option D — Python (no Node at all)
Serve the static front end from the `public/` folder:
```bash
cd public
python -m http.server 3000
# → http://localhost:3000
```

---

## 3. Project structure

```
AgriHealth AI/
├─ public/                      # the entire front end (deployable as static hosting)
│  ├─ index.html                # Home
│  ├─ agriculture.html          # AI Crop Planning Assistant
│  ├─ scanner.html              # Food Scanner & Nutrition
│  ├─ health.html               # Health & FitHomey
│  ├─ about.html  contact.html  privacy.html
│  ├─ assets/favicon.svg
│  ├─ css/main.css              # design system + responsive + print styles
│  └─ js/
│     ├─ shared/referenceData.js     # single source of truth (crops, nutrition, states, habits) — used by browser AND Node
│     ├─ core/config.js  core/ui.js
│     ├─ i18n/translations.js  i18n/index.js
│     ├─ components/layout.js        # injects navbar + footer + language switch
│     ├─ services/
│     │  ├─ storageService.js  apiClient.js  translationService.js
│     │  ├─ cropService.js            # recommend + plan (backend-aware)
│     │  ├─ nutritionService.js       # reference lookup + serving scaling
│     │  ├─ foodVisionService.js      # upload + honest demo vision
│     │  └─ healthGuidanceService.js  # wellness + recovery guidance
│     └─ pages/  home.js agriculture.js scanner.js health.js about.js contact.js privacy.js
├─ server/                      # OPTIONAL backend
│  ├─ index.js                  # Express app (serves public/ + /api)
│  ├─ static-server.js          # dependency-free static server
│  ├─ config.js                 # reads secrets from env vars only
│  ├─ routes/api.js
│  └─ services/  cropEngine.js  foodVision.js  nutrition.js
├─ package.json
└─ .env.example
```

---

## 4. API endpoints (optional backend)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Capability probe used by the front end. |
| POST | `/api/crops/recommend` | Crop recommendations from form input (same shape as the demo engine). |
| POST | `/api/crops/plan` | `{ cropId, input }` → full cultivation plan. |
| POST | `/api/food/analyze` | `{ image: <dataUrl>, mimeType }` → food/freshness analysis (real model if configured, else honest demo). |
| GET | `/api/nutrition/:id` | Reference nutrition lookup (id or free-text; id, EN or HI names, common synonyms). |
| POST | `/api/contact` | Validated contact message (logged server-side; no mailer configured). |

All responses match the shapes the front end expects, so the UI is identical with or without the backend.

---

## 5. Environment variables

Copy `.env.example` → `.env`. **Keys are read server-side only and never sent to the browser.**

| Variable | Needed for |
|---|---|
| `PORT`, `NODE_ENV` | Server basics (defaults `3000`, `development`). |
| `VISION_API_URL`, `VISION_API_KEY`, `VISION_MODEL`, `VISION_TIMEOUT_MS` | Real food-image analysis (any OpenAI-compatible chat-completions endpoint). If unset → honest demo result. |
| `NUTRITION_API_URL`, `NUTRITION_API_KEY` | Reserved for a real nutrition database (e.g. USDA FoodData Central). The bundled reference dataset is used otherwise. |
| `AGRI_DATA_API_URL`, `AGRI_DATA_API_KEY` | Reserved for a real agronomy/market-price provider. |

---

## 6. Required APIs / credentials for FULL functionality

The site is complete in demo mode. To go live with real intelligence you would add:

1. **Food vision** — an OpenAI-compatible vision endpoint (`VISION_*`). The backend already calls it and validates/normalises strict JSON.
2. **Nutrition database** — e.g. USDA FoodData Central or IFCT (`NUTRITION_*`); replace `server/services/nutrition.js`.
3. **Agronomy / mandi price data** — a state/district-level yield, cost and price source (`AGRI_*`); replace the reference ranges in `cropEngine.js`/`referenceData.js`.
4. **Contact delivery** — an email/CRM provider for `/api/contact` (currently logs only).
5. **Hosting** — any static host for `public/`; a Node host for the optional API.

---

## 7. Data honesty & safety

- **No fabrication:** the demo vision engine returns **“unknown”** and never guesses a food or declares it fresh/spoiled. Nutrition and financial values are labelled **DEMO / estimate**.
- **Financials:** `Net profit = estimated gross revenue − estimated total cultivation cost`, shown as a **range** with assumptions. Market prices and yields vary by district/season/year — always verify with official mandi prices.
- **Agronomy:** no invented chemical doses; guidance points to soil tests and local KVK/extension officers.
- **Health:** general, non-medical educational information only; it is not diagnosis or treatment.
- **Privacy:** language, saved plan and FitHomey tracker live in `localStorage` on your device. Nothing is uploaded unless you explicitly use a backend feature.

---

## 8. Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses `fetch`, `Promise`, CSS Grid/Flexbox and `IntersectionObserver` (with a graceful fallback). Fully responsive and print-friendly (clean printable crop plan).

---

## 9. Suggested next steps

- Wire a real vision + nutrition provider and remove the "demo" badges where real data exists.
- Add district-level agronomy/price datasets and a proper data-refresh pipeline.
- Persist contact messages to a database and send email notifications.
- Add automated tests (recommendation/plan shape, i18n key coverage) and a CI check.
- Add PWA/offline support so the site works in low-connectivity rural areas.

---

© AgriHealthAI. Estimates and general guidance only — not professional agronomic, financial, medical or dietary advice.
