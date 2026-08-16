# Forma — Sensor-Powered Fitness PWA

Forma turns a smartphone into a workout sensor and coach: place the phone, start a workout, and the
app detects movement, counts reps, controls sets/rest, tracks progress, and coaches hands-free.

> **Core idea:** honest, sensor-powered exercise detection — never faking a sensor or a metric
> (see the four-state capability vocabulary below). Full product spec: [`.agent/app ideas.md`](.agent/app%20ideas.md).
> Execution checklist: [`.agent/plan.md`](.agent/plan.md).

## Status

| Milestone | State |
|---|---|
| 1 · Foundation (PWA shell, routing, theme, IndexedDB) | ✅ |
| 2 · Sensor layer (adapters, permissions, diagnostics, record/replay) | ✅ |
| 3 · Exercise/rep engine (signal DSP, state machine, calibration, 5 profiles) | ✅ |
| 4 · Workout engine (free/sets/AMRAP/EMOM/circuit, rest timer, live wiring) | ✅ |
| 5 · Progression (XP, levels, PRs, achievements, streak, dashboard, challenges) | ✅ |
| 6 · Coach & no-touch (speech/audio/vibration, countdown, cues) | ✅ |
| 7 · QA & deploy (unit + e2e tests, a11y, docs, GH Pages) | ⏳ device verification pending |

**114 unit tests (Vitest) + 3 e2e tests (Playwright/Chromium) pass.** Real-device sensor accuracy
is validated against synthetic fixtures only; on-device verification is outstanding (needs a phone).

## Features

- **Five MVP exercises:** push-up, squat, sit-up, jumping jack, plank.
- **Honest sensor capabilities:** every sensor/metric labeled **Detected / Estimated / Unavailable /
  Unsupported**. Automatic detection-mode selection (`ADVANCED / STANDARD / BASIC`).
- **Workout modes:** Free Reps, Sets (+ rest timer with skip/+30s/pause), AMRAP, EMOM, Circuit.
- **Progression:** per-exercise levels, XP/leveling, personal records, achievements, streaks, a
  progress dashboard, muscle-volume view, and deterministic daily challenges.
- **No-touch coaching:** 3-2-1 countdown, spoken cues, beeps, and haptics — all optional; visual
  feedback always suffices.
- **Local-first & offline:** IndexedDB with versioned migrations; installable PWA that works offline.

## Tech stack

TypeScript (strict) · Vite · vanilla TS UI · CSS custom-property tokens · Workbox (`vite-plugin-pwa`) ·
`idb` · Vitest · Playwright. No UI framework — the app stays lightweight (~16 kB gzipped JS).

## Getting started

```bash
npm install
npm run dev        # dev server
npm run build      # static build → dist/
npm run preview    # serve the build
npm run typecheck  # tsc --noEmit
npm test           # Vitest unit tests
npm run lint       # ESLint (enforces domain-layer purity)

# End-to-end (real Chromium):
npx playwright install chromium
npm run build && npx playwright test
```

## Architecture (layers, dependencies point down)

```
UI → Application Services → Domain Engines → Sensor Abstraction → Platform
```

The **domain layer is pure** (no browser/DOM/sensor imports — enforced by ESLint). Sensor data flows
`Exercise → SensorManager → Adapter`, never directly to browser APIs, so a future native Android
adapter can be swapped in. Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes `dist/` on push to `master`.

> ⚠️ **Set the base path.** `vite.config.ts` `base` must equal your repo's Pages subpath
> (`/<repo-name>/`). It is currently `'/forma-workout-app/'` — change it to match your repository, or
> the deployed asset URLs will 404.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layers, invariants, data flow
- [`docs/EXERCISE_ENGINE.md`](docs/EXERCISE_ENGINE.md) — detection algorithm + how to add an exercise
- [`docs/SENSOR_COMPATIBILITY.md`](docs/SENSOR_COMPATIBILITY.md) — sensor/exercise matrix
- [`docs/TESTING.md`](docs/TESTING.md) — running tests, fixtures, sensor replay
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — future phases

## Safety

Forma is a training tool, not a medical device. It makes no medical claims and never asserts body-form
conclusions its sensors can't support.
