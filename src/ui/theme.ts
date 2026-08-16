import type { ThemePref } from '../data/settings';

/**
 * Applies a theme preference by setting (or clearing) `data-theme` on <html>.
 * CSS in tokens.css resolves the actual palette (spec §19/§20 — theme-aware).
 */
export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = pref;
  }
}
