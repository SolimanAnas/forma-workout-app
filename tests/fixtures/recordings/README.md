# Sensor recording fixtures

**These are SYNTHETIC placeholders**, not real device captures. Each file is a short (~0.5–1 s)
accelerometer stream with an exercise-flavored periodic pattern, generated so the replay pipeline
and (later) the detection engine have committed, deterministic data to run against in CI.

Per the honesty rule (spec §8/§53) they are named `*.synthetic.json` and their samples carry
`"source": "replay"` so nothing mistakes them for measured data.

**Phase 7** replaces these with real recordings captured on-device via the Sensor Recorder, at which
point the detection-accuracy targets (spec §25) are validated against genuine motion.

Format: see `src/sensors/replay/recording.ts` (`SensorRecording`).
