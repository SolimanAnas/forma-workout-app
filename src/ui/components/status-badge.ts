import type { CapabilityStatus, PermissionState } from '../../sensors/types';
import { el } from '../dom';

const CAPABILITY_LABEL: Record<CapabilityStatus, { text: string; tone: string; icon: string }> = {
  detected: { text: 'Detected', tone: 'ok', icon: '✓' },
  estimated: { text: 'Estimated', tone: 'accent', icon: '≈' },
  unavailable: { text: 'Unavailable', tone: 'warn', icon: '⚠' },
  unsupported: { text: 'Unsupported', tone: 'muted', icon: '✕' },
};

const PERMISSION_LABEL: Record<PermissionState, { text: string; tone: string; icon: string }> = {
  granted: { text: 'Granted', tone: 'ok', icon: '✓' },
  denied: { text: 'Denied', tone: 'danger', icon: '✕' },
  prompt: { text: 'Needs permission', tone: 'warn', icon: '?' },
  unsupported: { text: 'Unsupported', tone: 'muted', icon: '✕' },
};

/** Honest status badge — icon + text (never color alone, per spec §20). */
export function capabilityBadge(status: CapabilityStatus): HTMLElement {
  const { text, tone, icon } = CAPABILITY_LABEL[status];
  return badge(icon, text, tone);
}

export function permissionBadge(state: PermissionState): HTMLElement {
  const { text, tone, icon } = PERMISSION_LABEL[state];
  return badge(icon, text, tone);
}

function badge(icon: string, text: string, tone: string): HTMLElement {
  return el('span', { class: `badge badge--${tone}` }, [
    el('span', { 'aria-hidden': 'true' }, [icon]),
    ` ${text}`,
  ]);
}
