# Forma — Implementation Plan (Agent Checklist)

> **Source of truth for *rules & vision*:** `app ideas.md` (same folder). This file is the *executable
> checklist*. Work top-to-bottom. Do **not** start a phase while the previous phase is fundamentally broken.
>
> **How to use:** Each `- [x]` is a discrete, verifiable task. Check it off (`- [x]`) only when its
> **Done-when** condition is met. Prefer small, scoped commits (§27 of the spec). After each **Phase**,
> post the milestone report format from spec §32.
>
> **Legend:** 🎯 = phase exit gate · 🧪 = has automated test · 📄 = produces/updates a doc ·
> ⚠️ = must not fake capability (spec §8/§53).

---

## Phase 0 — Audit & Groundwork
*Understand what exists and lock the architecture before writing app code.*

### Stage 0.1 — Repository audit 📄
- [x] Confirm project state (expected: greenfield — only `.agent/` docs + `.codegraph/`).
- [x] Record framework/build/PWA/SW/manifest/storage/UI/CSS/testing/deploy findings.
- [x] Identify reusable code, obsolete code, dependencies, risks, browser-compat limits.
- [x] Check whether any sensor APIs already exist. Check git state.
- [x] Write `docs/ARCHITECTURE.md` capturing findings + the layered architecture (spec §6).
- **Done-when:** `docs/ARCHITECTURE.md` exists and accurately describes the current repo + target layers.

### Stage 0.2 — Confirm stack & risks
- [x] Confirm/adjust the decided stack (spec §3): TypeScript · Vite · vanilla + Web Components · CSS
      tokens · Workbox/`vite-plugin-pwa` · `idb` · Vitest · Playwright · (future) Capacitor.
- [x] Any deviation from spec §3 recorded with written rationale + flagged for user sign-off.
- [x] Draft initial `docs/SENSOR_COMPATIBILITY.md` matrix skeleton (spec §11, §7). ⚠️
- **Done-when:** stack is confirmed in `docs/ARCHITECTURE.md`; no unresolved stack ambiguity.

---

## Phase 1 — Foundation (Milestone 1)
*A boot-able, installable, offline PWA shell with storage and navigation — no sensors yet.*

### Stage 1.1 — Project scaffold 🎯-prereq
- [x] `git init`; add `.gitignore` (node_modules, dist, etc.); initial commit.
- [x] Scaffold Vite + TypeScript (strict) project per repo layout (spec §4).
- [x] Configure `vite.config.ts` `base` for GitHub Pages subpath deploy.
- [x] Add lint/format (ESLint + Prettier) with a rule enforcing `domain/` imports no browser/DOM globals.
- **Done-when:** `npm run dev` serves a blank shell; `npm run build` outputs static files; lint passes.

### Stage 1.2 — App shell, routing, theme
- [x] Implement `src/app/` bootstrap + a lightweight hash/history router.
- [x] Screens stubs: `Home · Workout · Exercises · Progress · Profile` (+ hidden `SensorDiag`).
- [x] Primary nav bar; nav hides during active-workout state (spec §19).
- [x] Design tokens (`tokens.css`), reset, light/dark themes via `prefers-color-scheme` + manual toggle.
- **Done-when:** all five screens reachable; dark mode works; nav hides in a mocked "workout active" state.

### Stage 1.3 — Data layer (IndexedDB) 🧪
- [x] `src/data/` schema for entities in spec §17; `DB_VERSION = 1`.
- [x] `idb`-based repositories; **versioned migration architecture** (never assume latest schema).
- [x] Settings persistence (theme, voice on/off, units, dev-mode flag).
- [x] 🧪 Unit tests: open/upgrade, CRUD round-trip, migration from empty → v1.
- **Done-when:** data survives reload; a simulated version bump runs a migration; tests green.

### Stage 1.4 — PWA installability & offline
- [x] `manifest.webmanifest` + standard & maskable icons; theme color; standalone display.
- [x] Workbox service worker via `vite-plugin-pwa`: precache shell, **cache versioning**, safe
      prompt-to-update flow. App cache strictly separate from user data (spec §17/§18).
- [x] Verify **no** `user-scalable=no`; viewport correct (spec §20).
- **Done-when:** app installable; loads fully offline after first visit; update prompt works; no user-data
      loss on cache clear.

### Stage 1.5 — Seed exercise definitions 📄
- [x] Exercise definition model (spec §12) + the 5 MVP definitions (data only, no detection yet).
- [x] Muscle-group metadata per exercise (spec §16).
- **Done-when:** Exercises screen lists the 5 MVP exercises from data.

🎯 **Phase 1 exit gate:** installable offline PWA, 5 screens, persistent settings + DB with migrations,
exercise list rendered from data. Post milestone report.

---

## Phase 2 — Sensor Layer (Milestone 2)
*Honest, abstracted access to device motion — plus the diagnostics & replay tooling everything else relies on.*

### Stage 2.1 — Sensor abstraction contract 🧪 ⚠️
- [x] `SensorManager` + adapter interface (spec §7): `available · permission · getCapabilities · start ·
      stop · subscribe · unsubscribe`; every sample tagged with `source`.
- [x] Adapters: Accelerometer, Gyroscope, Orientation (Generic Sensor API → `DeviceMotion/Orientation`
      fallback); Proximity, Barometer, GPS as optional/possibly-unsupported.
- [x] ⚠️ Feature detection is honest — no adapter reports `available` unless truly present.
- [x] 🧪 Unit tests with mocked browser APIs: availability, permission states, start/stop, error handling.
- **Done-when:** adapters expose a uniform contract; unsupported sensors report `Unsupported`; tests green.

### Stage 2.2 — Permissions flow ⚠️
- [x] Permission helper handling `granted · denied · prompt · unsupported` (spec §9).
- [x] iOS `requestPermission()` triggered from a **user gesture** ("Enable motion detection" button).
- [x] Explanatory copy before requesting; never a blank/broken screen on denial.
- **Done-when:** each permission outcome yields a clear, non-broken UI state.

### Stage 2.3 — Capability screen & live sensor test (dev) ⚠️
- [x] `SensorDiag` screen: per-sensor status using the 4-word vocabulary
      **Detected / Estimated / Unavailable / Unsupported** (spec §8), browser + permission state.
- [x] Live X/Y/Z readout for accel/gyro/orientation as the phone moves.
- [x] Detection-mode indicator (`ADVANCED / STANDARD / BASIC`) surfaced from real availability.
- [x] Gate behind a dev-mode flag (hidden from normal production nav).
- **Done-when:** on a real device, moving the phone updates live values; statuses match reality.

### Stage 2.4 — Sensor recorder & replay 🧪
- [x] Recorder: capture a timestamped sample session (exercise, duration, sample count) → persist.
- [x] Player: feed recorded samples through `SensorManager`/domain identically to live data.
- [x] Save ≥1 recorded fixture per MVP exercise for use as test data (spec §23/§24).
- [x] 🧪 Test that replaying a fixture produces the same sample stream a live run would.
- **Done-when:** a recorded session replays deterministically through the pipeline; fixtures committed.

📄 Update `docs/SENSOR_COMPATIBILITY.md` with observed real-device availability.

🎯 **Phase 2 exit gate:** abstracted sensors, honest capability reporting, working permissions on
Android + iOS, diagnostics screen, and deterministic record/replay. Post milestone report.

---

## Phase 3 — Exercise / Rep Engine (Milestone 3)
*The core IP: reliable, deterministic rep detection driven by replayable fixtures.*

### Stage 3.1 — Signal processing toolkit 🧪
- [x] `domain/signal/`: smoothing, moving average, low-/high-pass, magnitude, baseline normalization,
      hysteresis, debounce (spec §21). Pure functions, no browser deps.
- [x] 🧪 Unit tests per filter (known input → known output; noise rejection).
- **Done-when:** each filter has tests; `domain/` compiles with zero browser imports.

### Stage 3.2 — Rep state machine 🧪
- [x] `domain/rep/` generic engine: `IDLE → START_POSITION → MOVING_DOWN → BOTTOM → MOVING_UP →
      COMPLETED_REP` with per-profile config: `threshold · minMovement · minDuration · maxDuration ·
      hysteresis · cooldown · stateTimeout` (spec §10).
- [x] Guards against: double counting, random movement, tiny movements, incomplete cycles.
- [x] 🧪 Tests via fixtures: valid, partial, too-small, double, interrupted, slow, fast, noisy (spec §24).
- **Done-when:** all listed rep scenarios classified correctly on fixtures.

### Stage 3.3 — Calibration system
- [x] 3-2-1 capture of baseline orientation/acceleration, movement range, thresholds (spec §9).
- [x] Persist calibration per exercise/device; reuse without being cumbersome (no overfitting).
- **Done-when:** calibrating then running uses stored baselines; skippable with sane defaults.

### Stage 3.4 — Five detection profiles 🧪 ⚠️
- [x] **Push-up** — depth%, extension%, tempo, partials; proximity only if truly exposed, else fallback +
      shown detection mode. ⚠️
- [x] **Squat** — range, tempo, partials, invalid-move rejection.
- [x] **Sit-up/Crunch** — range, tempo, quality.
- [x] **Jumping Jack** — cyclic cadence/tempo/duration.
- [x] **Plank** — duration + stability + excessive-movement warnings (no fake form claims). ⚠️
- [x] Rep quality only where sensors support it; aggregate labeled *estimated* (spec §10/§8).
- [x] 🧪 Each profile validated against its recorded fixtures; accuracy target ≥95% (spec §25).
- **Done-when:** each of the 5 detects reps/duration from live use **and** replay within accuracy target.

### Stage 3.5 — Placement assistant
- [x] Per-exercise placement config + pre-start orientation/sensor-active confirmation (spec §9).
- **Done-when:** each exercise shows correct placement guidance before starting.

📄 Update `docs/EXERCISE_ENGINE.md` (algorithms, thresholds, how detection works).

🎯 **Phase 3 exit gate:** all 5 exercises reliably detected via live + replay; fixtures act as regression
tests. Post milestone report.

---

## Phase 4 — Workout Engine (Milestone 4)
*Compose exercises into full sessions — engine independent of the exercise engine (spec §13).*

### Stage 4.1 — Free Reps mode 🧪
- [x] Live count, last-rep validity, tempo; pause/resume/finish; result summary (valid/partial split).
- [x] 🧪 Tests: counting, pause/resume integrity, finish summary.
- **Done-when:** a free-reps session runs end-to-end and saves offline.

### Stage 4.2 — Sets + Rest timer 🧪
- [x] Sets (`N × M`) with auto-detected set completion (spec §13).
- [x] Rest timer: countdown, next-up preview, **Skip / +30s / Pause / Resume**, audio+vibration where
      supported.
- [x] 🧪 Tests: set advance, rest controls, skip.
- **Done-when:** `3 × 10` completes without manual rep increment (spec §31 acceptance).

### Stage 4.3 — AMRAP / EMOM / Circuit 🧪
- [x] AMRAP (time-boxed rounds), EMOM (per-minute), Circuit (mixed rep + duration movements).
- [x] 🧪 Tests for each mode incl. pause/resume/skip.
- **Done-when:** each mode runs a full session and persists results.

🎯 **Phase 4 exit gate:** all workout modes functional and persisted; the `3×10` acceptance path passes.
Post milestone report.

---

## Phase 5 — Progression, Records & Dashboard (Milestone 5)

### Stage 5.1 — Quick assessment & levels 🧪
- [ ] One max-quality set → estimate starting level → propose starting workout (spec §14).
- [ ] Per-exercise, **configurable** progression engine (rules not hard-coded in UI).
- [ ] 🧪 Tests: level calculation, progression steps, level-up.
- **Done-when:** assessment yields a level + starting workout; successful workouts advance progression.

### Stage 5.2 — Personal records & XP 🧪
- [ ] PRs: max reps, best set, most reps in time, fastest completion, best quality, longest duration,
      highest volume (spec §14).
- [ ] XP, levels, achievements, streaks — **optional & non-intrusive** (spec §14).
- [ ] 🧪 Tests: PR detection, XP accrual, achievement/streak triggers.
- **Done-when:** completing a qualifying workout records PRs, XP, and eligible achievements.

### Stage 5.3 — Progress dashboard & challenges
- [ ] Dashboard: today (time/exercises/reps/best/XP) + history, per-exercise progression, PRs, volume,
      streak, levels; lightweight charts only where they help (spec §16).
- [ ] Daily challenges generated from exercise definitions with record tracking (spec §16).
- [ ] Muscle-group volume view (guidance, not medical) (spec §16/§22).
- **Done-when:** dashboard reflects real saved data; a daily challenge is playable + tracked.

🎯 **Phase 5 exit gate:** performance-driven progression, records, and an honest dashboard all backed by
persisted data. Post milestone report.

---

## Phase 6 — Coach & No-Touch Mode (Milestone 6)

### Stage 6.1 — Voice coach & cues
- [ ] Reusable sparse coaching lines (spec §15) via Speech Synthesis + audio cues + vibration.
- [ ] Voice Coach ON/OFF; audio never mandatory; visual feedback always sufficient.
- **Done-when:** coaching plays during a workout and is fully disable-able without breaking the flow.

### Stage 6.2 — No-Touch workout mode
- [ ] Full hands-free loop: announce → countdown → detect reps → feedback → detect completion → rest →
      announce next → … → finish → results (spec §15).
- [ ] Large in-workout visual feedback; rep count dominates screen (spec §19/§34).
- **Done-when:** a multi-exercise workout completes start→finish without touching the phone.

🎯 **Phase 6 exit gate:** end-to-end no-touch workout with optional voice. Post milestone report.

---

## Phase 7 — QA, Hardening & Deploy (Milestone 7)

### Stage 7.1 — Automated test coverage 🧪
- [ ] Vitest suites: sensor adapters, rep engine (all scenarios), workout engine (all modes),
      progression (spec §24).
- [ ] Playwright: offline loading, service worker, installability, cache updates.
- [ ] All committed fixtures wired as regression tests.
- **Done-when:** CI-style `npm test` + e2e pass locally and green.

### Stage 7.2 — Real-device & sensor matrix ⚠️ 📄
- [ ] Execute real-device checklist: Android Chrome, Android Firefox (if relevant), iOS Safari, multiple
      orientations, varied sensor availability (spec §24).
- [ ] Finalize `docs/SENSOR_COMPATIBILITY.md` with observed results + known failure conditions. ⚠️
- **Done-when:** matrix reflects real observations; MVP exercises verified on ≥1 Android device.

### Stage 7.3 — Accessibility & performance
- [ ] axe automated pass; manual keyboard + screen-reader pass on key screens; reduced-motion respected;
      no color-only info (spec §20).
- [ ] Meet NFR targets (spec §25): bundle size, load, sensor→UI latency, offline, Lighthouse PWA green,
      sensors stopped when idle.
- **Done-when:** a11y checks pass; NFR targets met or deviations documented with rationale.

### Stage 7.4 — Docs & deploy 📄
- [ ] Complete `README.md` + `docs/{ARCHITECTURE,IMPLEMENTATION_PLAN,SENSOR_COMPATIBILITY,EXERCISE_ENGINE,
      TESTING,ROADMAP}.md` (spec §28): how to add an exercise, run tests, test sensors, build, deploy.
- [ ] GitHub Pages deploy (correct `base`, static output verified live).
- **Done-when:** app is deployed to GitHub Pages and installable from the live URL; docs complete.

🎯 **Phase 7 exit gate = MVP acceptance (spec §31):** for push-ups/squats/sit-ups/jumping-jacks the full
open→select→permission→placement→calibrate→start→auto-count→feedback→finish→results→save-offline path
works; plank tracks duration + basic feedback; `3 × 10 Push-ups` completes with no manual increment.

---

## Cross-Cutting Rules (apply in every phase)
- [ ] ⚠️ **Never fake sensor capability** — always label Detected / Estimated / Unavailable / Unsupported.
- [ ] Keep `domain/` pure (no browser/DOM imports); flow is always `Exercise → SensorManager → Adapter`.
- [ ] Local-first: no mandatory account/cloud; keep user data and app cache separate.
- [ ] No medical claims; include safety disclaimer.
- [ ] Scoped commits; `git status` before major changes; don't break working functionality.
- [ ] Don't over-engineer the MVP — sensor reliability & rep accuracy come first.
- [ ] After each phase, post the milestone report (spec §32): Status / Implemented / Tests / Known
      limitations / Next.

---

## Future (do NOT build until architecture is ready — spec §30)
- [ ] Phase 2 exercises (burpees, lunges, mountain climbers, pull-ups, running, …)
- [ ] Phase 3 cloud/social (sync, accounts, leaderboards, sharing)
- [ ] Phase 4 advanced (ML recognition, camera form analysis, AI coaching, **native Android sensor
      bridge**, wearables)
