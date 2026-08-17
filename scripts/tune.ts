/**
 * Auto-tune an exercise's detection thresholds against a recorded session.
 *
 * Usage:
 *   npm run tune -- <recording.json> --reps <trueCount> [--exercise <id>]
 *
 * It grid-searches axis/direction/amplitude/timing using the SAME detection engine the app uses
 * (imported from src/), then prints the best-fitting DetectionProfile to paste into
 * src/domain/exercise/detection-profiles.ts.
 */
import { readFileSync } from 'node:fs';
import { analyzeReps } from '../src/services/detection';
import { getDetectionProfile, type DetectionProfile } from '../src/domain/exercise/detection-profiles';
import type { SensorRecording } from '../src/sensors/replay/recording';

interface Args {
  file: string;
  reps: number;
  exercise?: string;
}

function parseArgs(argv: string[]): Args {
  const file = argv[0];
  if (!file || file.startsWith('--')) {
    throw new Error('Usage: npm run tune -- <recording.json> --reps <trueCount> [--exercise <id>]');
  }
  let reps = NaN;
  let exercise: string | undefined;
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--reps') reps = Number(argv[++i]);
    else if (argv[i] === '--exercise') exercise = argv[++i];
  }
  if (!Number.isFinite(reps)) throw new Error('Provide the true rep count with --reps <N>');
  return { file, reps, exercise };
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

const AXES = ['x', 'y', 'z'] as const;
type Axis = (typeof AXES)[number];

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const recording = JSON.parse(readFileSync(args.file, 'utf-8')) as SensorRecording;
  const exerciseId = args.exercise ?? recording.exerciseId ?? 'pushup';
  const base = getDetectionProfile(exerciseId);
  const sensor = base?.sensor ?? 'accelerometer';
  const type = base?.type ?? 'repetition';

  const samples = recording.samples.filter((s) => s.kind === sensor);
  if (samples.length < 4) {
    console.error(`Recording has too few '${sensor}' samples (${samples.length}).`);
    process.exit(1);
  }

  // Per-axis baseline (mean) + observed peak deviation, to seed amplitude candidates.
  const stats: Record<Axis, { baseline: number; peak: number }> = { x: baseStat('x'), y: baseStat('y'), z: baseStat('z') };
  function baseStat(axis: Axis): { baseline: number; peak: number } {
    const vals = samples.map((s) => s[axis] ?? 0);
    const baseline = mean(vals);
    const peak = Math.max(...vals.map((v) => Math.abs(v - baseline)), 0.1);
    return { baseline, peak };
  }

  const AMP_SCALES = [0.45, 0.6, 0.75, 0.9, 1.05];
  const MIN_DUR = [80, 120, 200, 300];
  const MAX_DUR = [1500, 3000, 5000];
  const COOLDOWN = [120, 200, 300, 450];

  let best: { profile: DetectionProfile; count: number; err: number; attempts: number } | null = null;

  for (const axis of AXES) {
    const { baseline, peak } = stats[axis];
    for (const dir of [1, -1] as const) {
      for (const scale of AMP_SCALES) {
        const amp = peak * scale;
        for (const minDur of MIN_DUR) {
          for (const maxDur of MAX_DUR) {
            for (const cooldown of COOLDOWN) {
              const profile: DetectionProfile = {
                id: exerciseId,
                type,
                sensor,
                axis,
                baseline,
                direction: dir,
                expectedAmplitude: round(amp),
                targetDurationMs: base?.targetDurationMs ?? 2000,
                rep: {
                  enterThreshold: round(amp * 0.5),
                  exitThreshold: round(amp * 0.15),
                  minAmplitude: round(amp * 0.4),
                  minDurationMs: minDur,
                  maxDurationMs: maxDur,
                  cooldownMs: cooldown,
                },
              };
              const { validCount, attempts } = analyzeReps(profile, samples, baseline);
              const err = Math.abs(validCount - args.reps) * 100 + Math.abs(attempts - args.reps);
              if (!best || err < best.err) best = { profile, count: validCount, err, attempts };
            }
          }
        }
      }
    }
  }

  if (!best) {
    console.error('No candidate produced a result.');
    process.exit(1);
  }

  const p = best.profile;
  console.log(`\nExercise: ${exerciseId}   true reps: ${args.reps}   detected: ${best.count}   (attempts ${best.attempts})`);
  console.log(best.count === args.reps ? '✓ exact match' : `Δ ${best.count - args.reps} reps`);
  console.log('\nSuggested profile (paste into src/domain/exercise/detection-profiles.ts):\n');
  console.log(`  '${exerciseId}': {
    id: '${exerciseId}',
    type: '${p.type}',
    sensor: '${p.sensor}',
    axis: '${p.axis}',
    baseline: ${round(p.baseline)},
    direction: ${p.direction},
    expectedAmplitude: ${p.expectedAmplitude},
    targetDurationMs: ${p.targetDurationMs},
    rep: {
      enterThreshold: ${p.rep.enterThreshold},
      exitThreshold: ${p.rep.exitThreshold},
      minAmplitude: ${p.rep.minAmplitude},
      minDurationMs: ${p.rep.minDurationMs},
      maxDurationMs: ${p.rep.maxDurationMs},
      cooldownMs: ${p.rep.cooldownMs},
    },
  },`);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

run();
