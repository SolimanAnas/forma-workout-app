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
import { getAllSettings } from '../../data/settings';
import { el, screen } from '../dom';

export async function renderActiveWorkout(outlet: HTMLElement): Promise<void> {
  const launch = takePendingLaunch();
  if (!launch) {
    window.location.hash = '#/workout';
    return;
  }

  setState({ activeWorkout: true });
  const settings = await getAllSettings();
  const coach = new VoiceCoach(settings.voiceCoach);

  const engine = createEngine(launch);
  const session = new ActiveWorkout(engine, launch.exerciseId);
  const exerciseName = getExerciseById(launch.exerciseId)?.name ?? launch.exerciseId;

  const view = el('section', { class: 'workout', 'aria-label': 'Active workout' });
  // Upper region: the rep count dominates and stays vertically centered.
  const stage = el('div', { class: 'workout__stage' });
  const title = el('div', { class: 'workout__exercise' }, [exerciseName]);
  const big = el('div', { class: 'rep-count', 'aria-live': 'polite' }, ['0']);
  const label = el('div', { class: 'rep-count__label' }, ['reps']);
  const detail = el('div', { class: 'workout__detail' }, ['']);
  stage.append(title, big, label, detail);
  view.append(stage);

  // Tap-to-count: the ENTIRE stage (big upper area) is the tap target, not just the number, so
  // reps are easy to hit mid-exercise (works alongside sensor counting).
  if (settings.tapToCount) {
    stage.classList.add('tappable');
    stage.setAttribute('role', 'button');
    stage.setAttribute('tabindex', '0');
    stage.setAttribute('aria-label', 'Tap anywhere to count a rep');
    const tap = (): void => session.simulateRep();
    stage.addEventListener('click', tap);
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tap();
      }
    });
    stage.append(el('div', { class: 'workout__hint' }, ['Tap anywhere here to count a rep']));
  }

  // Lower third: session controls.
  const controls = el('div', { class: 'workout__controls' });
  const skip = el('button', { class: 'btn', type: 'button' }, ['Skip rest']);
  const add30 = el('button', { class: 'btn', type: 'button' }, ['+30s']);
  const finish = el('button', { class: 'btn', type: 'button' }, ['Finish']);
  skip.addEventListener('click', () => session.skipRest());
  add30.addEventListener('click', () => session.addRest(30000));
  finish.addEventListener('click', () => session.finish());
  controls.append(skip, add30, finish);
  view.append(controls);

  // Decide whether the sensor can actually drive this workout: the API must exist AND motion
  // permission must be granted. Feature-detection alone isn't enough (spec §8/§53).
  const profile = getDetectionProfile(launch.exerciseId);
  const sensorAvailable = profile
    ? (getSensorManager().getAdapter(profile.sensor)?.isAvailable() ?? false)
    : false;
  const permission = launch.motionPermission ?? 'granted';
  const sensorUsable = sensorAvailable && permission === 'granted' && settings.sensorCounting;

  // Idempotent manual-rep fallback. Only needed when tap-to-count is OFF and the sensor can't
  // drive the workout — otherwise tapping already guarantees the workout is never a dead end.
  let manualAdded = false;
  const addManualControl = (note: string): void => {
    if (manualAdded || settings.tapToCount) return;
    manualAdded = true;
    const simulate = el('button', { class: 'btn btn--primary', type: 'button' }, ['＋ Rep']);
    simulate.addEventListener('click', () => session.simulateRep());
    stage.append(simulate);
    detail.textContent = note;
  };

  if (!sensorUsable && !settings.tapToCount) {
    addManualControl(
      permission === 'denied'
        ? 'Motion permission denied — add reps manually, or enable it in browser settings.'
        : !sensorAvailable
          ? 'Motion sensor unavailable — add reps manually.'
          : 'Motion sensor not ready — add reps manually.',
    );
  }

  outlet.append(view);

  // Coaching: announce phase transitions + subtle per-rep haptics/cues (spec §24, kept sparse).
  let prevPhase = '';
  let prevValue = 0;
  const paint = (s: WorkoutSnapshot): void => {
    big.textContent = String(s.primaryValue);
    label.textContent = s.primaryLabel;
    // Keep the manual-fallback note visible; otherwise show live set/rest detail.
    if (!manualAdded || s.phase === 'RESTING') detail.textContent = s.detail ?? '';
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
  // starting. In manual mode (no sensor/permission) start immediately so controls are usable.
  if (sensorUsable) {
    await runCountdown(big, label, coach);
    if (!outlet.contains(view)) return; // user navigated away mid-countdown
  }
  void session.start();

  // Watchdog: if the sensor was supposed to drive the workout but no samples arrive, the feed is
  // dead (no real hardware, blocked by a non-secure context, etc.) — reveal manual reps.
  if (sensorUsable && !settings.tapToCount) {
    window.setTimeout(() => {
      if (outlet.contains(view) && session.sampleCount === 0) {
        addManualControl('No motion detected — check phone placement, or add reps manually.');
      }
    }, 4000);
  }
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
