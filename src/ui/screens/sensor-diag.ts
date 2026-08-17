import { getSensorManager } from '../../sensors/SensorManager';
import type { SensorCapabilities, SensorKind, SensorSample } from '../../sensors/types';
import { queryMotionPermission, requestMotionPermission } from '../../sensors/permissions';
import { SensorRecorder } from '../../sensors/replay/recorder';
import type { SensorRecording } from '../../sensors/replay/recording';
import { CameraBrightnessSource, cameraSupported } from '../../sensors/camera/camera-source';
import { CameraRepDetector, attachCameraDetector } from '../../services/camera-detection';
import { saveRecording } from '../../data/recordings';
import { EXERCISE_DEFINITIONS } from '../../domain/exercise/definitions';
import { getDetectionProfile } from '../../domain/exercise/detection-profiles';
import { analyzeReps } from '../../services/detection';
import { capabilityBadge, permissionBadge } from '../components/status-badge';
import { el, screen } from '../dom';

const LIVE_KINDS: SensorKind[] = ['accelerometer', 'gyroscope', 'orientation'];

/** Developer diagnostics: honest capabilities, permission flow, live values, and the tuning recorder. */
export function renderSensorDiag(outlet: HTMLElement): void {
  const manager = getSensorManager();
  const view = screen('Sensor diagnostics', 'Developer tools.');

  // Detection mode + browser.
  view.append(
    el('div', { class: 'card' }, [
      row('Detection mode', el('strong', {}, [manager.detectionMode()])),
      row('Browser', el('span', { class: 'mono' }, [navigator.userAgent])),
    ]),
  );

  view.append(permissionSection());
  view.append(cameraSection(outlet));
  view.append(recorderSection(outlet));
  view.append(capabilitySection(manager.listCapabilities()));
  view.append(liveSection(outlet));

  outlet.append(view);
}

/**
 * Camera-based rep detection (prototype, spec §50). Works with the phone flat on the floor / front
 * camera up — counts reps from how much your body darkens the frame as you approach. This is the
 * only floor-placement option a PWA has (browsers expose no proximity sensor).
 */
function cameraSection(outlet: HTMLElement): HTMLElement {
  const card = el('div', { class: 'card' }, [
    el('div', { class: 'exercise-item__name' }, ['Camera rep detector (beta)']),
    el('p', { class: 'exercise-item__meta' }, [
      'Prop the phone flat on the floor, front camera facing up, then do push-ups over it. ' +
        'Counts reps from how much your body darkens the frame.',
    ]),
  ]);

  if (!cameraSupported()) {
    card.append(el('div', { class: 'exercise-item__meta' }, ['Camera unavailable (needs HTTPS + a front camera).']));
    return card;
  }

  const count = el('div', { class: 'mono', style: 'font-size:2.6rem;font-weight:800' }, ['0']);
  const barFill = el('div', { class: 'bar__fill', style: 'width:0%' });
  const bar = el('div', { class: 'bar' }, [barFill]);
  const status = el('div', { class: 'exercise-item__meta' }, ['Camera off.']);
  const toggle = el('button', { class: 'btn btn--primary', type: 'button' }, ['Start camera']);
  card.append(count, bar, status, toggle);

  let source: CameraBrightnessSource | null = null;
  let unsubscribe: (() => void) | null = null;

  const stop = (): void => {
    unsubscribe?.();
    unsubscribe = null;
    source?.stop();
    source = null;
    toggle.textContent = 'Start camera';
    status.textContent = 'Camera off.';
    barFill.style.width = '0%';
  };

  const start = async (): Promise<void> => {
    const src = new CameraBrightnessSource();
    const detector = new CameraRepDetector();
    try {
      await src.start();
    } catch {
      status.textContent = 'Camera denied or unavailable.';
      return;
    }
    source = src;
    toggle.textContent = 'Stop camera';
    status.textContent = 'Counting… move over the camera.';
    unsubscribe = attachCameraDetector(
      src,
      detector,
      (c) => {
        count.textContent = String(c);
      },
      (_sample, signal) => {
        barFill.style.width = `${Math.max(0, Math.min(100, (signal / 25) * 100))}%`;
      },
    );
  };

  toggle.addEventListener('click', () => {
    if (source) stop();
    else void start();
  });

  const onLeave = (): void => {
    if (!outlet.contains(card)) {
      stop();
      window.removeEventListener('hashchange', onLeave);
    }
  };
  window.addEventListener('hashchange', onLeave);

  return card;
}

/** Record a real sensor session, see how the current profile scores it, and export it for tuning. */
function recorderSection(outlet: HTMLElement): HTMLElement {
  const manager = getSensorManager();
  const card = el('div', { class: 'card' }, [
    el('div', { class: 'exercise-item__name' }, ['Sensor recorder (tuning)']),
    el('p', { class: 'exercise-item__meta' }, [
      'Record a set of a known rep count, then export the JSON to tune detection thresholds.',
    ]),
  ]);

  const exercise = el('select', { 'aria-label': 'Exercise to record' }) as HTMLSelectElement;
  for (const ex of EXERCISE_DEFINITIONS) {
    exercise.append(el('option', { value: ex.id }, [ex.name]));
  }
  card.append(row('Exercise', exercise));

  const status = el('div', { class: 'exercise-item__meta' }, ['Ready.']);
  const toggle = el('button', { class: 'btn btn--primary', type: 'button' }, ['● Record']);
  const result = el('div', {});
  card.append(status, toggle, result);

  let recorder: SensorRecorder | null = null;
  let ticker = 0;

  const stopTicker = (): void => {
    if (ticker) window.clearInterval(ticker);
    ticker = 0;
  };

  const startRecording = async (): Promise<void> => {
    await requestMotionPermission(); // gesture-triggered (iOS)
    recorder = new SensorRecorder(manager, LIVE_KINDS, exercise.value);
    try {
      await recorder.start();
    } catch {
      status.textContent = 'Could not start sensors — check permission/secure context.';
      recorder = null;
      return;
    }
    toggle.textContent = '■ Stop';
    result.replaceChildren();
    const started = Date.now();
    ticker = window.setInterval(() => {
      const secs = ((Date.now() - started) / 1000).toFixed(1);
      status.textContent = `Recording… ${secs}s · ${recorder?.sampleCount ?? 0} samples`;
    }, 200);
  };

  const stopRecording = async (): Promise<void> => {
    stopTicker();
    if (!recorder) return;
    const recording = recorder.stop();
    recorder = null;
    toggle.textContent = '● Record';
    status.textContent = `Captured ${recording.sampleCount} samples over ${(recording.durationMs / 1000).toFixed(1)}s.`;
    await saveRecording(recording).catch(() => {});
    showResult(recording, result);
  };

  toggle.addEventListener('click', () => {
    if (recorder) void stopRecording();
    else void startRecording();
  });

  // Release sensors if the user navigates away mid-recording.
  const onLeave = (): void => {
    if (!outlet.contains(card)) {
      stopTicker();
      recorder?.stop();
      recorder = null;
      window.removeEventListener('hashchange', onLeave);
    }
  };
  window.addEventListener('hashchange', onLeave);

  return card;
}

function showResult(recording: SensorRecording, container: HTMLElement): void {
  const profile = recording.exerciseId ? getDetectionProfile(recording.exerciseId) : undefined;
  const detected = profile ? analyzeReps(profile, recording.samples).validCount : null;

  const exportBtn = el('button', { class: 'btn', type: 'button' }, ['⬇ Export JSON']);
  exportBtn.addEventListener('click', () => downloadRecording(recording));

  container.replaceChildren(
    el('div', { class: 'sensor-row' }, [
      el('span', {}, ['Current profile detects']),
      el('strong', {}, [detected === null ? 'n/a' : `${detected} reps`]),
    ]),
    exportBtn,
  );
}

function downloadRecording(recording: SensorRecording): void {
  const blob = new Blob([JSON.stringify(recording)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', {
    href: url,
    download: `${recording.exerciseId ?? 'recording'}-${recording.id}.json`,
  });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function permissionSection(): HTMLElement {
  const state = queryMotionPermission();
  const badgeSlot = el('span', {}, [permissionBadge(state)]);
  const card = el('div', { class: 'card' }, [
    el('div', { class: 'exercise-item__name' }, ['Motion permission']),
    el('p', { class: 'exercise-item__meta' }, [
      'Motion sensors are used to automatically detect your exercise movements and count reps.',
    ]),
    row('Status', badgeSlot),
  ]);

  if (state === 'prompt') {
    const button = el('button', { class: 'btn btn--primary', type: 'button' }, [
      'Enable motion detection',
    ]);
    button.addEventListener('click', async () => {
      button.disabled = true;
      const result = await requestMotionPermission();
      badgeSlot.replaceChildren(permissionBadge(result));
      if (result !== 'prompt') button.remove();
      else button.disabled = false;
    });
    card.append(button);
  }
  return card;
}

function capabilitySection(caps: SensorCapabilities[]): HTMLElement {
  const list = el('div', { class: 'card' }, [
    el('div', { class: 'exercise-item__name' }, ['Device sensor capabilities']),
  ]);
  for (const cap of caps) {
    const meta = cap.available
      ? `${cap.source ?? '—'}${cap.unit ? ` · ${cap.unit}` : ''}`
      : 'not accessible';
    list.append(
      el('div', { class: 'sensor-row' }, [
        el('div', {}, [
          el('div', { class: 'sensor-row__name' }, [cap.kind]),
          el('div', { class: 'exercise-item__meta' }, [meta]),
        ]),
        capabilityBadge(cap.status),
      ]),
    );
  }
  return list;
}

function liveSection(outlet: HTMLElement): HTMLElement {
  const manager = getSensorManager();
  const readouts = new Map<SensorKind, HTMLElement>();
  const latest = new Map<SensorKind, SensorSample>();
  const unsubscribers: (() => void)[] = [];
  let rafId = 0;
  let running = false;

  const card = el('div', { class: 'card' }, [
    el('div', { class: 'exercise-item__name' }, ['Live sensor test']),
    el('p', { class: 'exercise-item__meta' }, ['Move the phone to see live values.']),
  ]);

  for (const kind of LIVE_KINDS) {
    const value = el('pre', { class: 'mono live-values' }, ['—']);
    readouts.set(kind, value);
    card.append(el('div', { class: 'sensor-row' }, [el('div', {}, [kind]), value]));
  }

  const toggle = el('button', { class: 'btn', type: 'button' }, ['Start']);
  card.append(toggle);

  // Throttle UI to animation frames — never re-render on every sensor event (spec §38).
  const paint = (): void => {
    for (const [kind, node] of readouts) {
      const s = latest.get(kind);
      node.textContent = s
        ? `x ${fmt(s.x)}  y ${fmt(s.y)}  z ${fmt(s.z)}${s.value !== undefined ? `  v ${fmt(s.value)}` : ''}`
        : 'no data';
    }
    if (running) rafId = requestAnimationFrame(paint);
  };

  const stop = (): void => {
    running = false;
    cancelAnimationFrame(rafId);
    for (const unsub of unsubscribers) unsub();
    unsubscribers.length = 0;
    for (const kind of LIVE_KINDS) manager.stop(kind);
    toggle.textContent = 'Start';
  };

  const start = async (): Promise<void> => {
    running = true;
    toggle.textContent = 'Stop';
    for (const kind of LIVE_KINDS) {
      const adapter = manager.getAdapter(kind);
      if (!adapter?.isAvailable()) continue;
      try {
        await manager.start(kind);
        unsubscribers.push(manager.subscribe(kind, (s) => latest.set(kind, s)));
      } catch {
        // Adapter unavailable at runtime — leave its readout as "no data".
      }
    }
    rafId = requestAnimationFrame(paint);
  };

  toggle.addEventListener('click', () => {
    if (running) stop();
    else void start();
  });

  // Ensure sensors are released when navigating away.
  const onLeave = (): void => {
    if (!outlet.contains(card)) {
      stop();
      window.removeEventListener('hashchange', onLeave);
    }
  };
  window.addEventListener('hashchange', onLeave);

  return card;
}

function row(label: string, control: Node): HTMLElement {
  return el('div', { class: 'field' }, [el('span', {}, [label]), control]);
}

function fmt(n: number | undefined): string {
  return n === undefined ? '—' : n.toFixed(2).padStart(6);
}
