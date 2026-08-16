# Exercise / Rep Detection Engine

How Forma turns noisy motion data into reliable rep counts (spec §15–16, §37). Deterministic and
explainable — no ML.

## Pipeline

```
Adapter sample → SensorManager (normalize + tag source) → RepDetector (services)
   → oriented scalar = direction × (axisValue − baseline)
   → LowPassFilter (EMA) → RepEngine state machine → RepResult
```

The **domain** engine (`src/domain/rep/`, `src/domain/signal/`) is pure and works on plain numbers;
the **services** `RepDetector` (`src/services/detection.ts`) bridges sensor samples into it.

## Signal toolkit (`src/domain/signal/`)

`magnitude3`, `movingAverage`, `LowPassFilter` (EMA low-pass), `HighPassFilter`, `SchmittTrigger`
(hysteresis), plus stats (`mean/variance/stddev/range/clamp`).

## Rep state machine (`src/domain/rep/engine.ts`)

States: `REST → ACTIVE → REST`. One rep per oscillation, guarded by:

- **Hysteresis** (Schmitt trigger: `enterThreshold` / `exitThreshold`) — prevents chatter.
- **Amplitude gate** (`minAmplitude`) — rejects tiny movements.
- **Duration window** (`minDurationMs` / `maxDurationMs`) — rejects too-fast / too-slow reps.
- **Cooldown** (`cooldownMs`) — prevents double counting.
- **Interrupt timeout** — discards movements that never return to rest.

Each completed cycle emits a `RepResult { valid, reason?, amplitude, durationMs, quality }`. Quality
is an **estimated** 0–100 score from range + tempo — omitted, never faked, when unmeasurable.

## Detection profiles (`src/domain/exercise/detection-profiles.ts`)

Per exercise: driving `sensor`, `axis`, `baseline`, `direction`, `expectedAmplitude`, `targetDurationMs`,
and rep thresholds (seeded from amplitude). Calibration (`src/domain/calibration/`) refines `baseline`
at runtime. Plank is duration-based (`analyzePlank`): hold time + estimated stability, no rep counting
and no body-form claims.

## Accuracy

Validated against committed **synthetic** fixtures (`tests/fixtures/recordings/`) — each rep exercise
counts its exact cycle count; plank counts zero. Real-device accuracy (spec §25 ≥95%) is validated in
Phase 7 with recordings captured via the Sensor Recorder.

## How to add a new exercise

1. Add a definition to `src/domain/exercise/definitions.ts` (id, muscles, sensors, `detectionProfile`,
   `placement`).
2. Add a `DetectionProfile` in `detection-profiles.ts` (axis, baseline, thresholds).
3. Add a `PlacementConfig` in `placement.ts`.
4. Record/commit a fixture and add a test asserting the expected count.
5. (Optional) tune thresholds against the fixture via replay.

No workout-engine or UI changes required — the engine is data-driven.
