import { takePendingLaunch } from '../../app/workout-context';
import { setState } from '../../app/state';
import { createEngine } from '../../services/workout-factory';
import { ActiveWorkout } from '../../services/active-workout';
import { getSensorManager } from '../../sensors/SensorManager';
import { getDetectionProfile } from '../../domain/exercise/detection-profiles';
import { getExerciseById } from '../../domain/exercise/definitions';
import type { WorkoutSnapshot } from '../../domain/workout/types';
import { saveWorkout } from '../../data/workouts';
import { recordWorkout } from '../../services/progression-service';
import { VoiceCoach } from '../../services/voice-coach';
import { COACH } from '../../domain/coach/messages';
import { getSetting } from '../../data/settings';
import { el, screen } from '../dom';

export async function renderActiveWorkout(outlet: HTMLElement): Promise<void> {
  const launch = takePendingLaunch();
  if (!launch) {
    window.location.hash = '#/workout';
    return;
  }

  setState({ activeWorkout: true });
  const coach = new VoiceCoach(await getSetting('voiceCoach'));

  const engine = createEngine(launch);
  const session = new ActiveWorkout(engine, launch.exerciseId);
  const exerciseName = getExerciseById(launch.exerciseId)?.name ?? launch.exerciseId;

  const view = el('section', { class: 'workout', 'aria-label': 'Active workout' });
  const title = el('div', { class: 'workout__exercise' }, [exerciseName]);
  const big = el('div', { class: 'rep-count', 'aria-live': 'polite' }, ['0']);
  const label = el('div', { class: 'rep-count__label' }, ['reps']);
  const detail = el('div', { class: 'workout__detail' }, ['']);
  view.append(title, big, label, detail);

  // Controls.
  const controls = el('div', { class: 'workout__controls' });
  const skip = el('button', { class: 'btn', type: 'button' }, ['Skip rest']);
  const add30 = el('button', { class: 'btn', type: 'button' }, ['+30s']);
  const finish = el('button', { class: 'btn', type: 'button' }, ['Finish']);
  skip.addEventListener('click', () => session.skipRest());
  add30.addEventListener('click', () => session.addRest(30000));
  finish.addEventListener('click', () => session.finish());
  controls.append(skip, add30, finish);
  view.append(controls);

  // Manual rep control when the driving sensor isn't available (e.g. desktop) or in dev mode.
  const profile = getDetectionProfile(launch.exerciseId);
  const sensorAvailable = profile
    ? (getSensorManager().getAdapter(profile.sensor)?.isAvailable() ?? false)
    : false;
  if (!sensorAvailable) {
    const simulate = el('button', { class: 'btn btn--primary', type: 'button' }, [
      '＋ Rep (no sensor)',
    ]);
    simulate.addEventListener('click', () => session.simulateRep());
    view.append(simulate);
    detail.textContent = 'Motion sensor unavailable — use manual reps.';
  }

  outlet.append(view);

  // Coaching: announce phase transitions + subtle per-rep haptics/cues (spec §24, kept sparse).
  let prevPhase = '';
  let prevValue = 0;
  const paint = (s: WorkoutSnapshot): void => {
    big.textContent = String(s.primaryValue);
    label.textContent = s.primaryLabel;
    if (sensorAvailable || s.phase === 'RESTING') detail.textContent = s.detail ?? '';
    view.dataset.phase = s.phase;

    if (prevPhase && s.phase !== prevPhase) {
      if (s.phase === 'RESTING') {
        coach.speak(`${COACH.setComplete()}. ${COACH.rest()}`);
        coach.vibrate([120, 60, 120]);
      } else if (prevPhase === 'RESTING' && s.phase === 'ACTIVE_SET') {
        coach.speak(COACH.go());
      }
    }
    if (s.phase === 'ACTIVE_SET' && s.primaryValue > prevValue) {
      coach.beep();
      coach.vibrate(30);
    }
    prevPhase = s.phase;
    prevValue = s.primaryValue;
  };
  session.onUpdate(paint);
  session.onFinish(() => {
    coach.speak(COACH.finished());
    coach.vibrate([200, 80, 200]);
    void showResults();
  });

  const showResults = async (): Promise<void> => {
    const res = session.result();
    await saveWorkout({
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: Date.now(),
      mode: res.mode,
      exercises: [{ exerciseId: launch.exerciseId, reps: res.totalReps }],
      totalReps: res.totalReps,
      durationSec: Math.round(res.durationMs / 1000),
      xpEarned: 0,
    });

    const outcome = await recordWorkout(res, launch.exerciseId);

    const results = screen('Workout complete', exerciseName);
    const summary = el('div', { class: 'card' }, [
      stat('Total reps', String(res.totalReps)),
      stat('Duration', `${Math.round(res.durationMs / 1000)}s`),
      stat('XP earned', `+${outcome.xpEarned}`),
      stat('Level', String(outcome.level)),
    ]);
    results.append(summary);

    if (outcome.leveledUp) {
      results.append(el('div', { class: 'card highlight' }, [`⬆ Level up! You're now level ${outcome.level}.`]));
    }
    if (outcome.newPRs.length > 0) {
      results.append(el('div', { class: 'card highlight' }, [`🏅 New personal record: ${outcome.newPRs.join(', ')}`]));
    }
    if (outcome.newAchievements.length > 0) {
      results.append(el('div', { class: 'card highlight' }, [`🎉 Achievement unlocked: ${outcome.newAchievements.join(', ')}`]));
    }
    if (outcome.streak > 1) {
      results.append(el('div', { class: 'exercise-item__meta' }, [`🔥 ${outcome.streak}-day streak`]));
    }

    results.append(el('a', { class: 'btn btn--primary', href: '#/home' }, ['Done']));
    outlet.replaceChildren(results);
  };

  // Lifecycle: release sensors + restore nav when leaving.
  const onLeave = (): void => {
    if (!outlet.contains(view) && !outlet.querySelector('.workout')) {
      session.stop();
      setState({ activeWorkout: false });
      window.removeEventListener('hashchange', onLeave);
    }
  };
  window.addEventListener('hashchange', onLeave);

  // No-Touch mode: on a real sensor-driven workout, run a hands-free 3-2-1 countdown before
  // starting. In manual mode (no sensor / tests) start immediately so controls are usable.
  if (sensorAvailable) {
    await runCountdown(big, label, coach);
    if (!outlet.contains(view)) return; // user navigated away mid-countdown
  }
  void session.start();
}

async function runCountdown(big: HTMLElement, label: HTMLElement, coach: VoiceCoach): Promise<void> {
  label.textContent = '';
  coach.speak(COACH.getReady());
  for (let n = 3; n >= 1; n--) {
    big.textContent = String(n);
    coach.beep(660, 100);
    coach.vibrate(40);
    await delay(700);
  }
  big.textContent = '0';
  label.textContent = 'reps';
  coach.speak(COACH.start());
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'field' }, [
    el('span', {}, [label]),
    el('strong', {}, [value]),
  ]);
}
