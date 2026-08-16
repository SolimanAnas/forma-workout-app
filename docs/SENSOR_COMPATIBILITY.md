# Forma — Sensor Compatibility Matrix

> Skeleton created in Phase 0. **Availability columns are filled from real-device testing** (Phase 2.3 /
> Phase 7.2), not assumptions. Until verified, entries read `?`. Never mark a sensor available without
> feature-detecting it at runtime (spec §8/§53).

## Status Vocabulary

| Status | Meaning |
|---|---|
| **Detected** | A real sensor directly measured the value. |
| **Estimated** | Derived/inferred from other signals — labeled as such in UI. |
| **Unavailable** | API exists on platform but not accessible now (permission/hardware off). |
| **Unsupported** | Platform/browser has no such API. |

## Sensor API Support (to be verified on real devices)

| Sensor | Primary API | Fallback API | Android Chrome | Android Firefox | iOS Safari | Desktop Chromium |
|---|---|---|---|---|---|---|
| Accelerometer | `Accelerometer` / `LinearAccelerationSensor` | `DeviceMotionEvent` | ? | ? | ? | ? |
| Gyroscope | `Gyroscope` | `DeviceMotionEvent.rotationRate` | ? | ? | ? | ? |
| Orientation | `DeviceOrientationEvent` | — | ? | ? | ? | ? |
| Proximity | `ProximitySensor` / `deviceproximity` | — | ? | ? | ? | ? |
| Barometer | `Barometer` (Generic Sensor) | — | ? | ? | ? | ? |
| GPS | `Geolocation` | — | ? | ? | ? | ? |

**Permission notes:**
- iOS 13+ requires `DeviceMotionEvent.requestPermission()` / `DeviceOrientationEvent.requestPermission()`
  called from a **user gesture**. Other browsers generally do not.
- Generic Sensor API requires a **secure context (HTTPS)** and may need Permissions Policy.

## Per-Exercise Detection Matrix (spec §11)

| Exercise | Preferred | Optional | Fallback | Minimum | Known failure conditions |
|---|---|---|---|---|---|
| Push-up | Accelerometer + Gyroscope | Proximity | Motion/Orientation | Motion sensor | Phone slips; very slow reps exceed `maxDuration` |
| Squat | Accelerometer + Gyroscope + Orientation | — | Motion/Orientation | Motion sensor | Phone in loose pocket adds noise |
| Sit-up / Crunch | Accelerometer + Gyroscope + Orientation | — | Motion/Orientation | Motion sensor | Torso vs phone placement mismatch |
| Jumping Jack | Accelerometer + Gyroscope + Orientation | — | Motion | Motion sensor | Cadence too fast → merged cycles |
| Plank | Gyroscope + Orientation | Accelerometer | Orientation | Orientation | Cannot verify true body form — duration/stability only |

## Detection Mode Selection

The app auto-selects the best available mode and displays it:

- **ADVANCED** — accel + gyro + proximity (all Detected).
- **STANDARD** — accel + gyro (proximity Unavailable/Unsupported).
- **BASIC** — single motion source only.

## Test Log

_(Append real-device results here during Phase 2.3 and Phase 7.2: device, OS, browser, per-sensor status,
notes.)_
