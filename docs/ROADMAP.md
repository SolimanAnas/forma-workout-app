# Roadmap

The MVP (Milestones 1–7) proves the core: **can the phone reliably detect exercise movements?** These
future items are deliberately deferred until the architecture is ready (spec §50) — the data-driven
engine is designed so exercises plug in without core rewrites.

## Immediate follow-ups (finish Phase 7 on-device)

- Capture real sensor recordings per exercise; validate ≥95% rep accuracy (spec §25).
- Real-device sensor matrix: Android Chrome/Firefox, iOS Safari, orientations, varied availability.
- Lighthouse PWA audit + full axe accessibility pass in a real browser.
- Confirm the GitHub Pages `base` path and live install/offline behavior.

## Phase 2 — more exercises

Burpees, lunges, mountain climbers, jump squats, pull-ups, dips, leg raises, wall sit, running,
walking, stairs. Each: definition + detection profile + placement + fixture + tests.

## Phase 3 — cloud & social (optional, opt-in)

Cloud sync, accounts, cross-device sync, social challenges, leaderboards, friends, workout sharing.
Local-first stays the default; no mandatory account. Raw sensor streams are never uploaded.

## Phase 4 — advanced

ML movement recognition, camera-based form analysis, personalized workout generation, AI coaching,
**native Android sensor bridge** (via the existing sensor abstraction), wearable integration.

## Known product gaps to close

- EMOM & Circuit engines exist and are tested but lack a multi-exercise setup UI.
- Quick-assessment onboarding flow (domain ready) isn't surfaced yet.
- Desktop browsers feature-detect the motion API without real data — consider a manual/dev rep mode.
