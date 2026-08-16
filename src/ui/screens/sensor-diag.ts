import { getSensorManager } from '../../sensors/SensorManager';
import type { SensorCapabilities, SensorKind, SensorSample } from '../../sensors/types';
import { queryMotionPermission, requestMotionPermission } from '../../sensors/permissions';
import { capabilityBadge, permissionBadge } from '../components/status-badge';
import { el, screen } from '../dom';

const LIVE_KINDS: SensorKind[] = ['accelerometer', 'gyroscope', 'orientation'];

/** Developer diagnostics: honest capabilities, permission flow, and live sensor values (spec §11). */
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
  view.append(capabilitySection(manager.listCapabilities()));
  view.append(liveSection(outlet));

  outlet.append(view);
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
