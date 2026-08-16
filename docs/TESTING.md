# Testing

## Commands

```bash
npm test            # Vitest unit/integration (jsdom)
npm run test:watch  # watch mode
npm run typecheck   # tsc --noEmit (also type-checks tests)
npm run lint        # ESLint incl. domain-purity rule

# End-to-end (real Chromium):
npx playwright install chromium   # one-time
npm run build && npx playwright test
```

## Layout

- `tests/domain/` — pure engine tests (signal, rep engine, progression, workout, calibration).
- `tests/services/` — detection, progression pipeline, voice coach.
- `tests/data/` — IndexedDB schema, migrations (empty→v1→v2), repositories.
- `tests/sensors/` — adapters (mocked browser APIs), detection-mode, record/replay, fixtures.
- `tests/ui/` — screen render smoke tests, workout flow, accessibility invariants.
- `tests/fixtures/recordings/` — committed **synthetic** sensor recordings (see the folder README).
- `e2e/` — Playwright specs (shell nav, offline/service-worker, no-touch workout launch).

IndexedDB tests use `fake-indexeddb` (wired in `tests/setup.ts`).

## Sensor replay

The rep engine is validated by replaying recorded sample streams through the real detection code
(`ReplayPlayer` → `RepDetector`), so algorithms can be improved without re-performing exercises. The
committed fixtures are synthetic placeholders; capture real recordings on-device via the Sensor
Recorder (dev tools) and drop them in `tests/fixtures/recordings/` to validate real-world accuracy.

## Current coverage

114 unit/integration tests + 3 e2e tests pass. Not covered here (needs a physical device / connected
browser): live sensor rep counting, real speech/vibration output, Lighthouse, and full axe audits.
