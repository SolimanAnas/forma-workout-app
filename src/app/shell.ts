import { el } from '../ui/dom';
import { subscribe, getState } from './state';
import { ROUTE_CHANGED } from './router';
import { applyTheme, effectiveTheme } from '../ui/theme';
import { setSetting } from '../data/settings';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: 'home', label: 'Home', icon: '🏠' },
  { path: 'workout', label: 'Workout', icon: '💪' },
  { path: 'gym', label: 'Gym', icon: '🏋️' },
  { path: 'exercises', label: 'Exercises', icon: '📋' },
  { path: 'settings', label: 'Settings', icon: '⚙️' },
];

/** Builds the app shell (header + outlet + bottom nav) and returns the router outlet. */
export function mountShell(root: HTMLElement): HTMLElement {
  const outlet = el('main', { class: 'app-main', id: 'outlet' });

  const nav = el('nav', { class: 'app-nav', 'aria-label': 'Primary' });
  const links = NAV_ITEMS.map((item) => {
    const link = el('a', { class: 'app-nav__item', href: `#/${item.path}` }, [
      el('span', { class: 'app-nav__icon', 'aria-hidden': 'true' }, [item.icon]),
      el('span', {}, [item.label]),
    ]);
    link.dataset.path = item.path;
    return link;
  });
  nav.append(...links);

  // Quick theme toggle (dark ⇄ light), persisted.
  const themeBtn = el('button', { class: 'app-header__theme', type: 'button' });
  const syncThemeBtn = (): void => {
    const dark = effectiveTheme() === 'dark';
    themeBtn.textContent = dark ? '☀️' : '🌙';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };
  themeBtn.addEventListener('click', () => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    void setSetting('theme', next);
    syncThemeBtn();
  });
  syncThemeBtn();

  const header = el('header', { class: 'app-header' }, [
    el('span', { class: 'app-header__brand' }, ['FORMA']),
    themeBtn,
  ]);

  const shell = el('div', { class: 'app-shell' }, [header, outlet, nav]);
  root.replaceChildren(shell);

  // Highlight active nav item from the route-changed event detail. The exercise detail page
  // belongs under the Workout tab.
  window.addEventListener(ROUTE_CHANGED, (event) => {
    const path = (event as CustomEvent<{ path: string }>).detail.path;
    const current = path === 'exercise' ? 'workout' : path;
    for (const link of links) {
      if (link.dataset.path === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  });

  // Hide chrome during an active workout (spec §19/§33).
  const applyChrome = (): void => {
    nav.hidden = getState().activeWorkout;
  };
  subscribe(applyChrome);
  applyChrome();

  return outlet;
}
