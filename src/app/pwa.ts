import { registerSW } from 'virtual:pwa-register';
import { el } from '../ui/dom';

/**
 * Wires the service-worker update flow. `registerType: 'prompt'` means updates never apply
 * silently — the user chooses to reload. App cache and user data (IndexedDB) stay separate,
 * so an update never touches workout data (spec §18/§31).
 */
export function setupPWA(): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      showBanner('A new version is available.', 'Reload', () => void updateSW(true));
    },
    onOfflineReady() {
      // Informational — auto-dismiss so it never sits over the primary CTA.
      showBanner('Ready to work offline.', 'Dismiss', undefined, 5000);
    },
  });
}

function showBanner(
  text: string,
  actionLabel: string,
  onAction?: () => void,
  autoDismissMs?: number,
): void {
  document.querySelector('.pwa-banner')?.remove();

  const button = el('button', { class: 'btn', type: 'button' }, [actionLabel]);
  const banner = el('div', { class: 'pwa-banner', role: 'status' }, [
    el('span', { class: 'pwa-banner__text' }, [text]),
    button,
  ]);
  button.addEventListener('click', () => {
    banner.remove();
    onAction?.();
  });
  document.body.append(banner);
  if (autoDismissMs) {
    window.setTimeout(() => banner.remove(), autoDismissMs);
  }
}
