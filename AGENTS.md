# Forma — Agent Instructions

## Project Overview
Sensor-powered fitness PWA that uses smartphone motion sensors to automatically detect exercises, count reps, and provide coaching.

## Tech Stack
- TypeScript (strict)
- Vite + Workbox (PWA)
- Vanilla TS + Web Components
- IndexedDB via `idb`
- Vitest (unit) + Playwright (e2e)

## Architecture Rules
1. **Domain layer is pure** — no browser/DOM imports in `src/domain/`
2. **Sensor flow**: Exercise → SensorManager → Adapter (never direct browser API calls)
3. **Honest capabilities**: Always label Detected / Estimated / Unavailable / Unsupported
4. **Local-first**: No mandatory account/cloud; user data stays on device

## Code Style
- ES modules (import/export)
- Destructure imports when possible
- Run `npm run typecheck` after changes
- Run `npm test` for relevant tests

## Git Workflow
- Logical, scoped commits
- `git status` before major changes
- Never destroy unrelated changes
