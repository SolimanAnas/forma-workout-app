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

/** The theme currently in effect (resolving `system` against the OS preference). */
export function effectiveTheme(): 'light' | 'dark' {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
