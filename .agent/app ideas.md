# Forma — Sensor-Powered Fitness PWA · Product & Engineering Spec

> **Role of this document:** the authoritative product vision + engineering constitution for Forma.
> It defines *what* to build and the *rules* to build it by. The step-by-step, checkable execution
> plan lives in **`plan.md`** (same folder). Keep the two in sync: this file changes when the
> *vision or rules* change; `plan.md` changes as *work* gets done.

> **How to use as an agent:** Do **not** rush into implementation. Audit first (§3), confirm the
> architecture (§46), then execute `plan.md` phase by phase. Never fake sensor capability (§53).

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Platform Strategy](#2-platform-strategy)
3. [Tech Stack (Decided)](#3-tech-stack-decided)
4. [Repository Layout (Decided)](#4-repository-layout-decided)
5. [First Task — Audit Before Coding](#5-first-task--audit-before-coding)
6. [Layered Architecture](#6-layered-architecture)
7. [Sensor Abstraction Layer](#7-sensor-abstraction-layer)
8. [Status Vocabulary (Honest Capabilities)](#8-status-vocabulary-honest-capabilities)
9. [Sensor Permissions & Placement & Calibration](#9-sensor-permissions--placement--calibration)
10. [Rep Detection Engine](#10-rep-detection-engine)
11. [MVP Exercises](#11-mvp-exercises)
12. [Exercise Data Model](#12-exercise-data-model)
13. [Workout Engine & Modes](#13-workout-engine--modes)
14. [Progression, XP & Records](#14-progression-xp--records)
15. [Coaching, No-Touch Mode & Feedback](#15-coaching-no-touch-mode--feedback)
16. [Dashboard, Challenges & Body Tracking](#16-dashboard-challenges--body-tracking)
17. [Data Layer (Local-First)](#17-data-layer-local-first)
18. [PWA Requirements](#18-pwa-requirements)
19. [UI / UX](#19-ui--ux)
20. [Accessibility](#20-accessibility)
21. [Performance & Signal Processing](#21-performance--signal-processing)
22. [Safety, Security & Privacy](#22-safety-security--privacy)
23. [Debugging Tools & Sensor Replay](#23-debugging-tools--sensor-replay)
24. [Testing Strategy](#24-testing-strategy)
25. [Non-Functional Targets (Definition of Good)](#25-non-functional-targets-definition-of-good)
26. [Milestones](#26-milestones)
27. [Git Workflow](#27-git-workflow)
28. [Documentation Deliverables](#28-documentation-deliverables)
29. [How to Add a New Exercise](#29-how-to-add-a-new-exercise)
30. [Future Roadmap](#30-future-roadmap)
31. [MVP Guardrails & Acceptance Criteria](#31-mvp-guardrails--acceptance-criteria)
32. [Agent Working Behavior](#32-agent-working-behavior)

---

## 1. Product Vision

Build a modern fitness app where **the smartphone itself acts as a workout sensor and coach**.

> The user puts the phone in the right position, starts a workout, and performs exercises while the
> app automatically **detects movement, counts reps, validates reps, controls sets/rest, tracks
> performance, and gives feedback** — no tapping required mid-set.

This is **not** another manual workout logger. The differentiating core IP is **sensor-powered
exercise detection** built from device motion sensors:

- Accelerometer, Gyroscope, Device Orientation *(primary — motion detection)*
- Proximity, Barometer/pressure *(optional — used only where genuinely exposed)*
- GPS *(outdoor activities only — future phase)*

**Iron rule:** never assume a sensor exists. Every sensor gets: (1) feature detection, (2) permission
handling, (3) availability detection, (4) graceful fallback, (5) clear user feedback, (6) a capability
status surfaced to the app and honestly labeled (see §8).

The architecture must let a **future native Android bridge** supply sensors the browser can't — without
rewriting exercise algorithms.

---

## 2. Platform Strategy

**Primary platform: PWA.** Targets, in priority order:

1. Android Chrome / modern Chromium *(primary real-world target)*
2. Desktop Chromium *(development, sensor replay, automated tests)*
3. iOS Safari *(best-effort; requires user-gesture `requestPermission()` — see §9)*

Must be: installable, offline-capable, mobile-first, responsive, fast, accessible, touch-friendly,
dark-mode compatible, and fully usable with no network.

**Later — Android wrapper / native sensor bridge.** The same codebase must be packageable for Android
(via Capacitor, see §3) with native sensors exposed through the existing sensor abstraction. Do **not**
build the native bridge in the MVP. Instead keep the clean chain:

```text
Application → Exercise Engine → Sensor Abstraction Layer → Browser Adapter → (future) Native Adapter
```

Exercise algorithms must **never** import a browser API directly.

---

## 3. Tech Stack (Decided)

> The original brief left the stack open; these are the resolved defaults. An auditing agent may
> propose a change **only** with a written rationale in `docs/ARCHITECTURE.md` and user sign-off.

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) | The rep/signal engine is math-heavy and long-lived; types prevent whole classes of bugs and document the domain. |
| Build | **Vite** | Fast, zero-config PWA-friendly, trivially GitHub-Pages compatible (static output, configurable `base`). |
| UI | **Vanilla TS + Web Components / lit-html-style templates** (no heavy framework) | "Lightweight" is a hard requirement; the app is screen-based, not a huge SPA. Keep bundle small and dependency count low. |
| Styling | **Plain CSS with CSS custom properties** (design tokens) + a small reset | Dark mode, theming, reduced-motion via media queries; no runtime CSS-in-JS cost. |
| Service Worker | **Workbox** (via `vite-plugin-pwa`) | Safe precache + runtime caching, cache versioning, controlled updates. |
| Storage | **IndexedDB via `idb`** | Tiny promise wrapper; explicit versioned migrations (§17). |
| Testing | **Vitest** (unit/engine) + **Playwright** (PWA/offline/e2e) | Vitest for fast headless engine tests incl. sensor replay; Playwright for install/offline/SW. |
| Future Android | **Capacitor** | Wraps the same web build; native sensor plugin implements the Native Adapter. Not in MVP. |
| Charts | Hand-rolled lightweight SVG/Canvas, only where it aids understanding | Avoid a charting dependency for the MVP. |

**Hard constraints:** no framework lock-in in the domain layer; keep total production dependencies
minimal; everything must build to static files servable from a subpath on GitHub Pages.

---

## 4. Repository Layout (Decided)

```text
/
├─ index.html
├─ vite.config.ts                 # base path for GitHub Pages, PWA plugin config
├─ public/
│  ├─ manifest.webmanifest
│  └─ icons/                       # maskable + standard app icons
├─ src/
│  ├─ app/                         # bootstrap, router, top-level shell
│  ├─ ui/
│  │  ├─ screens/                  # Home, Workout, Exercises, Progress, Profile, SensorDiag
│  │  ├─ components/               # reusable UI (RepCounter, RestTimer, StatusBadge, ...)
│  │  └─ styles/                   # tokens.css, reset.css, themes
│  ├─ services/                    # WorkoutService, ProgressService, AchievementService, VoiceCoach
│  ├─ domain/                      # PURE, no browser APIs, fully unit-testable
│  │  ├─ exercise/                 # ExerciseEngine + detection profiles per exercise
│  │  ├─ rep/                      # RepEngine state machine + signal filters
│  │  ├─ workout/                  # WorkoutEngine (sets/AMRAP/EMOM/circuit)
│  │  ├─ progression/              # ProgressionEngine, XP, PR logic
│  │  └─ signal/                   # smoothing, low/high-pass, magnitude, hysteresis, debounce
│  ├─ sensors/                     # Sensor Abstraction Layer
│  │  ├─ SensorManager.ts
│  │  ├─ adapters/browser/         # Accelerometer, Gyroscope, Orientation, Proximity, Barometer, GPS
│  │  ├─ adapters/native/          # (future) Capacitor-backed adapters — stubbed in MVP
│  │  └─ replay/                   # recorder + player (drives domain from recorded samples)
│  ├─ data/                        # IndexedDB schema, migrations, repositories
│  └─ platform/                    # capability/env detection, permission helpers
├─ tests/                          # vitest + fixtures (recorded sensor sessions)
├─ e2e/                            # playwright
└─ docs/                           # ARCHITECTURE, IMPLEMENTATION_PLAN, SENSOR_COMPATIBILITY, ...
```

**No monolithic `app.js`.** The `domain/` folder must have zero imports from `sensors/`, `ui/`, or any
`window`/DOM/browser global — enforced by lint rule and unit-test-only compilation.

---

## 5. First Task — Audit Before Coding

Before modifying anything, inspect the repo and record findings in `docs/ARCHITECTURE.md`:

1. Framework, build system, existing PWA architecture, service worker, manifest, storage, UI/CSS
   architecture, testing framework, deployment config.
2. Classify the project: **empty / existing PWA / existing fitness project / reusable shell.**
   *(Current known state: effectively greenfield — only `.agent/` docs exist. Confirm before acting.)*
3. Identify reusable components, obsolete code, dependencies, risks, browser-compat limits.
4. Check whether any sensor APIs are already implemented. Check current git state.

Do **not** destroy existing working functionality without understanding it. Then create:

```text
docs/ARCHITECTURE.md
docs/IMPLEMENTATION_PLAN.md   (may reference/point at .agent/plan.md)
docs/SENSOR_COMPATIBILITY.md
```

---

## 6. Layered Architecture

Strict, one-directional dependencies (top depends on bottom, never the reverse):

```text
UI  (screens · components · state)
        ↓
Application Services  (WorkoutService · ProgressService · AchievementService · VoiceCoach)
        ↓
Domain Engines  (ExerciseEngine · RepEngine · FormEngine · WorkoutEngine · ProgressionEngine)
        ↓
Sensor Abstraction  (Accelerometer · Gyroscope · Orientation · Proximity · Barometer · GPS)
        ↓
Platform  (Browser adapters · future Android bridge)
```

If a future/existing project already has a different architecture, **adapt intelligently** rather than
blindly restructuring everything.

---

## 7. Sensor Abstraction Layer

```text
SensorManager
├─ AccelerometerAdapter
├─ GyroscopeAdapter
├─ OrientationAdapter
├─ ProximityAdapter
├─ BarometerAdapter
└─ GPSAdapter
```

Every adapter exposes a **consistent contract**:

```text
available: boolean            // feature-detected, honest
permission: PermissionState   // 'granted' | 'denied' | 'prompt' | 'unsupported'
getCapabilities(): {...}       // rate, axes, units, source label
start() / stop()
subscribe(cb) / unsubscribe(cb)
```

**Browser API notes (implementation guidance, not assumptions):**

- Prefer the **Generic Sensor API** (`Accelerometer`, `Gyroscope`, `LinearAccelerationSensor`) where
  available; fall back to `DeviceMotionEvent` / `DeviceOrientationEvent`.
- **iOS 13+** requires `DeviceMotionEvent.requestPermission()` / `DeviceOrientationEvent.requestPermission()`
  called from a **user gesture** (see §9). Handle its absence gracefully on other browsers.
- **Proximity / Barometer** are frequently unavailable in browsers — treat as optional enhancers only.
- Adapters normalize units (m/s², rad/s, degrees) and tag every sample with a `source` label so the UI
  can show whether data is *Detected* vs *Estimated* (§8).

Exercise algorithms must **never** call `new DeviceMotionEvent(...)` or any browser API. Flow is always
`Exercise → SensorManager → Adapter`.

---

## 8. Status Vocabulary (Honest Capabilities)

The app must always distinguish and display these four states — **never fake precision** (§53, §22):

| Status | Meaning | Example UI |
|---|---|---|
| **Detected** | A real sensor directly measured this. | `Proximity ✓ Available` |
| **Estimated** | Derived/inferred from other signals; label it as such. | "Movement quality (estimated)" |
| **Unavailable** | Sensor exists on platform but not accessible right now (permission/hardware off). | `Proximity ⚠ Not available` |
| **Unsupported** | Platform/browser has no such API. | `Barometer ✕ Not supported` |

Rule of thumb: say **"Movement quality"** (estimated) — never **"Your back is straight"** unless the
sensors truly support that conclusion. Detection mode must be shown to the user, e.g. `ADVANCED` (accel+gyro+proximity)
vs `STANDARD` (accel+gyro, proximity unavailable) vs `BASIC` (single motion source).

---

## 9. Sensor Permissions & Placement & Calibration

**Permissions.** Explain *why* before requesting, handle all outcomes, never leave a blank/broken screen.

> "Motion sensors are used to automatically detect your exercise movements and count repetitions."

Handle: `granted`, `denied`, `prompt required`, `unsupported`. On iOS the request **must** be triggered
from a tap (a "Enable motion detection" button on the placement screen).

**Placement assistant.** Per-exercise, reusable placement config tells the user where to put the phone
(e.g. push-up: on the floor in front of the head, 10–30 cm) and confirms orientation/sensor active
before starting.

**Calibration.** A short 3-2-1 capture of: baseline orientation, baseline acceleration, movement range,
device orientation, exercise-specific thresholds. Improve reliability **without** making the workout
cumbersome — do not overfit. Calibration data is persisted (§17) and reusable per exercise/device.

---

## 10. Rep Detection Engine

A reusable, **state-machine-based** engine. Each exercise supplies its own transitions/thresholds:

```text
IDLE → START_POSITION → MOVING_DOWN → BOTTOM → MOVING_UP → COMPLETED_REP → START_POSITION
```

The engine must **prevent**: double counting, random-movement counting, tiny movements as reps, and
incomplete cycles counting as full reps. Every profile exposes configurable:

`threshold · minMovement · minDuration · maxDuration · hysteresis · cooldown · stateTimeout`

**Forbidden:** naïve `if (y > threshold) reps++`. Use proper movement states + hysteresis + debouncing.

**Rep quality** (only where sensors genuinely support it): Range, Completion, Tempo, Stability,
Consistency → an overall quality %. If a metric can't be reliably measured, **omit it** rather than
inventing a number, and label the aggregate as *estimated movement quality*.

---

## 11. MVP Exercises

Build a **high-quality engine on five exercises** — not dozens. Each ships with a detection profile,
fallback mode, placement config, calibration, tests, and recorded fixture sessions.

| Exercise | Type | Preferred sensors | Fallback | Key tracked |
|---|---|---|---|---|
| **Push-up** | rep | Accel + Gyro (+Proximity if real) | motion/orientation | reps, depth%, extension%, tempo, partials, quality |
| **Squat** | rep | Accel + Gyro + Orientation | motion/orientation | reps, range, tempo, partials, invalid moves |
| **Sit-up / Crunch** | rep | Accel + Gyro + Orientation | motion/orientation | reps, range, tempo, quality |
| **Jumping Jack** | rep (cyclic) | Accel + Gyro + Orientation | motion | reps, cadence, tempo, duration |
| **Plank** | duration | Gyro + Orientation (+Accel) | orientation | duration, stability, excessive-movement warnings |

Notes: If proximity is unavailable, push-up must **not** fail — fall back and clearly show the detection
mode. Plank is **not** rep-based; do not claim precise body-form analysis unless sensors support it.

---

## 12. Exercise Data Model

Adding a new exercise must **not** require rewriting the core. Conceptual definition:

```ts
{
  id: "pushup",
  name: "Push-up",
  category: "strength",
  muscleGroups: { primary: ["chest"], secondary: ["triceps", "shoulders", "core"] },
  type: "repetition",            // "repetition" | "duration" | "cyclic"
  requiredSensors: [...],
  preferredSensors: [...],
  fallbackSensors: [...],
  difficulty: 1,
  detectionProfile: "pushup",    // → domain/exercise profile
  progressionProfile: "strength-reps",
  placement: "floor-in-front",   // → placement config
}
```

Future exercises (Phase 2+, do **not** build in MVP): burpees, lunges, mountain climbers, calf raises,
jump squats, high knees, pull-ups, dips, bicycle crunches, russian twists, leg raises, wall sit,
step-ups, running, walking, stairs.

---

## 13. Workout Engine & Modes

The **workout engine is independent of the exercise engine.** Supported modes:

- **Free Reps** — unlimited; live count, last-rep validity, tempo; pause/resume/finish; result summary
  with valid/partial split and PR detection.
- **Sets** — e.g. `4 × 12`; auto-detect completed sets; rest between sets.
- **AMRAP** — e.g. 5-min as-many-rounds-as-possible over a movement list.
- **EMOM** — every-minute-on-the-minute.
- **Circuit** — ordered list mixing rep- and duration-based movements.

**Rest timer** after each set: countdown, next-up preview, **Skip / +30s / Pause / Resume**, audio +
vibration where supported.

---

## 14. Progression, XP & Records

- **Level-based entry** — never force users to self-assess. Offer a **Quick Assessment** (one max-quality
  set) → estimate a starting level → propose a starting workout. Progression is performance-driven.
- **Progression engine** — per-exercise, independent, **configurable** (not hard-coded in UI): successful
  workouts nudge reps/sets upward, then level up.
- **Personal records** — max reps, best set, most reps in time, fastest completion, best quality,
  longest duration, highest workout volume.
- **XP / gamification** — XP, levels, achievements (First Workout, 100/1,000 Reps, First PR, 7-/30-Day
  Streak, 10 Workouts), streaks. Keep **optional and non-intrusive**.

---

## 15. Coaching, No-Touch Mode & Feedback

**No-Touch Workout Mode** is a headline feature: once started, the user shouldn't touch the phone. The
app announces the exercise → countdown → detects reps → gives feedback → detects completion → starts rest
→ announces next → … → finishes → shows results.

**Voice Coach** — reusable, sparse coaching lines ("Get ready", "Start", "Good rep", "Halfway",
"Three more", "Set complete", "Rest", "Next: squats"). Uses Speech Synthesis + audio cues + vibration +
large visual feedback. **Audio is never mandatory**; visual feedback always suffices. Voice Coach ON/OFF
toggle. Avoid excessive speech.

---

## 16. Dashboard, Challenges & Body Tracking

- **Progress dashboard** — today's workout time, exercises, reps, best improvement, XP; plus history,
  per-exercise progression, PRs, volume, streak, levels. Lightweight charts **only** where they truly aid
  understanding.
- **Daily challenges** — generated from existing exercise definitions (e.g. 100 push-ups, max in 5 min,
  50 squats, 3-min plank, 10-min AMRAP, 100 total reps) with record tracking.
- **Body / muscle tracking** — each exercise carries muscle-group metadata; dashboard can show approximate
  volume per muscle group. **Training guidance, not medical/physiological precision** (§22).

---

## 17. Data Layer (Local-First)

Works with **no account**. **IndexedDB** stores: user profile, exercise history, workout history, PRs,
XP, levels, settings, calibration data.

**Entities:** `User, Exercise, ExerciseCapability, Workout, WorkoutExercise, WorkoutSet, Rep, RepQuality,
PersonalRecord, ProgressionLevel, Achievement, DailyChallenge, SensorCalibration, AppSettings.`

Rules: don't over-normalize for IndexedDB; stable IDs; **versioned schema with real migrations**
(`DB_VERSION = 1` + migration architecture — never assume latest schema). Design so cloud sync can be
added later (Supabase/Firebase/custom) **without** making auth mandatory for MVP. Keep **user data and
app cache strictly separate** — a cache clear must never touch user data.

---

## 18. PWA Requirements

manifest.webmanifest · service worker · offline caching · standard + maskable icons · installability ·
standalone display · theme color · splash where supported · **cache versioning** · **safe update
mechanism** (prompt-to-reload, controlled SW activation).

Do **not** ship an unsafe "clear all cache" that could wipe user data. App cache ≠ user data (§17).

---

## 19. UI / UX

Priorities: extremely clear, **large workout numbers**, minimal distractions, high readability during
exercise, one-handed operation, large buttons, dark mode, strong visual progress, minimal interaction
mid-workout.

Primary nav: `HOME · WORKOUT · EXERCISES · PROGRESS · PROFILE`. **Hide nav during active workouts.** On
the exercise screen, the **rep count dominates** the viewport; quality/tempo/coach line secondary; a single
large PAUSE control.

---

## 20. Accessibility

Follow WCAG. **Never** `<meta name="viewport" content="user-scalable=no">`. Support: large touch targets,
keyboard navigation, screen-reader labels, sufficient contrast, **reduced motion**, text scaling, clear
status messages. **Never convey information by color alone** (pair with icon/text — ties into the status
vocabulary in §8).

---

## 21. Performance & Signal Processing

Sensor data is noisy. Use deterministic DSP first: smoothing, moving average, low-/high-pass filtering,
magnitude, baseline normalization, hysteresis, debouncing, state machines. **Do not** reach for ML because
it sounds impressive — first build algorithms that are explainable, debuggable, fast, offline, and
battery-conscious. ML is a later phase.

Keep the pipeline decoupled and throttle UI:

```text
Sensor sampling → Signal processing → Exercise state → UI updates (throttled)
```

Never re-render the whole app on every sensor event. Optimize for mobile CPU, battery, memory, low
latency, smooth UI.

---

## 22. Safety, Security & Privacy

- **Safety:** it's a training tool — no medical claims, no diagnosis. Include a general, non-alarmist
  disclaimer ("Stop exercising if you experience significant pain, dizziness, chest pain, unusual
  shortness of breath, or other concerning symptoms.").
- **Privacy:** sensor data is potentially sensitive → **keep workout/sensor data local by default**. Never
  upload raw sensor streams unless the user explicitly enables a future cloud feature. No analytics may
  capture raw sensor streams. Don't expose private workout data unnecessarily.

---

## 23. Debugging Tools & Sensor Replay

Developer-only (hidden from normal production nav):

- **Sensor capability screen** — live per-sensor status (Detected/Estimated/Unavailable/Unsupported),
  browser, permission state.
- **Sensor test** — live X/Y/Z values as the phone moves.
- **Sensor recorder** — record a short session (exercise, duration, sample count) and persist it.
- **Sensor replay** — **critical**: feed recorded samples back through the detection engine to iterate on
  algorithms without physically re-performing exercises. Recorded fixtures double as regression tests
  (§24).

---

## 24. Testing Strategy

- **Sensor adapters:** availability, permission, start, stop, error handling.
- **Rep engine (Vitest, via replay fixtures):** valid rep, partial rep, too-small movement, double
  movement, interrupted movement, slow rep, fast rep, noisy data.
- **Workout engine:** sets, rest, AMRAP, EMOM, circuit, pause, resume, skip.
- **Progression:** level calculation, PR detection, XP, progression.
- **PWA (Playwright):** offline loading, service worker, installability, cache updates.
- **Real-device checklist:** Android Chrome, Android Firefox (if relevant), iOS Safari, multiple
  orientations, varied sensor availability. The engine is **not** "done" on desktop alone — but recorded
  fixtures let desktop CI exercise the real algorithms.

---

## 25. Non-Functional Targets (Definition of Good)

> Concrete, checkable targets added to make "fast/lightweight/reliable" testable. Tune with data; treat as
> directional gates, not dogma.

| Area | Target |
|---|---|
| Initial JS payload (gzipped) | ≤ ~150 KB for the app shell |
| First load (mid-range Android, cached) | Interactive < 2 s |
| Sensor→UI latency | Rep registered visibly < ~150 ms after real completion |
| Rep-count accuracy (clean fixtures) | ≥ 95% correct on the five MVP exercises' recorded sets |
| Offline | Full workout flow works with network disabled |
| Accessibility | Passes automated axe checks; manual keyboard + screen-reader pass on key screens |
| Battery | No busy-loops; sensors stopped when not in a workout/diagnostic |
| Lighthouse PWA | Installable + offline criteria green |

---

## 26. Milestones

Implement in order; don't advance while the current milestone is fundamentally broken.

1. **Foundation** — PWA shell, routing/nav, theme, IndexedDB, manifest, service worker, settings, basic
   exercise data.
2. **Sensor Layer** — abstraction, permissions, capability detection, diagnostics, sensor visualization,
   recorder + replay.
3. **Exercise Engine** — push-up, squat, sit-up, jumping jack, plank (each with fixtures + tests).
4. **Workout Engine** — free reps, sets, rest, AMRAP, EMOM, circuit.
5. **Progression** — assessment, levels, XP, PRs, history, progress dashboard.
6. **Coach** — voice, vibration, no-touch workouts, coaching feedback.
7. **QA** — automated tests, sensor replay coverage, mobile testing, offline, accessibility, performance.

The detailed, checkable breakdown of these milestones is **`plan.md`**.

---

## 27. Git Workflow

`git status` before major changes. Never destroy unrelated user changes. Logical, scoped commits — no
giant unrelated commits. Example messages:

```text
feat: add sensor abstraction layer
feat: add push-up detection engine
feat: add workout set engine
feat: add progression system
fix: improve push-up rep hysteresis
test: add sensor replay tests
```

*(Repo currently has no git initialized — initialize it as the first Foundation task.)*

---

## 28. Documentation Deliverables

Maintain: `README.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`,
`docs/SENSOR_COMPATIBILITY.md`, `docs/EXERCISE_ENGINE.md`, `docs/TESTING.md`, `docs/ROADMAP.md`.

Document: architecture, sensor limitations, exercise algorithms, how to add an exercise, how to run tests,
how to test sensors, how to build, how to deploy (GitHub Pages).

---

## 29. How to Add a New Exercise

The final architecture should make adding e.g. **Burpee** a matter of:

```text
1. Create exercise definition (§12)
2. Create detection profile (state machine + thresholds)
3. Configure sensors (required/preferred/fallback)
4. Add placement + calibration config
5. Add tests + recorded fixture session
6. Add instructional/muscle metadata
```

**Not:** "rewrite the workout engine."

---

## 30. Future Roadmap

- **Phase 2 (exercises):** burpees, lunges, mountain climbers, jump squats, pull-ups, dips, leg raises,
  wall sit, running, walking, stairs.
- **Phase 3 (cloud/social):** cloud sync, accounts, cross-device sync, social challenges, leaderboards,
  friends, workout sharing.
- **Phase 4 (advanced):** ML movement recognition, camera-based form analysis, personalized workout
  generation, AI coaching, **native Android sensor bridge**, wearable integration.

Do not implement these until the architecture is genuinely ready.

---

## 31. MVP Guardrails & Acceptance Criteria

**The MVP must prove one thing:** *Can the phone reliably detect exercise movements?* Prioritize: sensor
reliability → rep accuracy → UX → offline → architecture → testing.

**Do NOT** spend the initial phase on: social networks, complex accounts, payments, huge exercise
libraries, AI chatbots, fancy animations, cloud infrastructure. The sensor engine is the core IP.

**Acceptance — for each of push-ups, squats, sit-ups, jumping jacks**, the user can: open app → select
exercise → grant motion permission → position phone → calibrate → start → perform reps → see automatic rep
counting → get valid/partial feedback → finish set → see results → save workout offline.

**Plank:** app measures duration + basic position feedback where supported.

**Workout:** the user can complete `3 × 10 Push-ups` **without manually incrementing the counter.**

---

## 32. Agent Working Behavior

Act as a **senior engineer, not a code generator.**

**Before implementation:** audit → plan → identify risks → confirm architecture → implement incrementally.
**During:** keep changes modular, test frequently, don't break existing functionality, avoid unnecessary
dependencies, keep it lightweight, document important decisions.

**After each milestone, report:**

```text
MILESTONE:  Status:
Implemented: - …
Tests:       - …
Known limitations: - …
Next:        - …
```

When you hit a real technical limitation, **do not** invent a workaround and pretend it solves the
problem. Instead state: **Problem · Why it happens · Available options · Recommended solution**, then
continue with the safest practical architecture.

**Never fake sensor capabilities (§8, §53 origin rule):** never claim "Proximity detected" if unexposed;
never claim "Your back is straight" unless sensors truly support it. Always distinguish
Detected / Estimated / Unavailable / Unsupported.

---

*End of spec. Execution checklist → `plan.md`.*
