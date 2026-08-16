import { describe, expect, it } from 'vitest';
import { mountShell } from '../../src/app/shell';
import { renderExercises } from '../../src/ui/screens/exercises';
import { capabilityBadge, permissionBadge } from '../../src/ui/components/status-badge';

/**
 * Accessibility invariants (spec §20). These enforce label/role/text guarantees in jsdom.
 * Full audits (color contrast, screen-reader, Lighthouse) require a real browser (Phase 7 device work).
 */
describe('accessibility invariants', () => {
  it('the shell nav is labeled and every item has a text label (not icon-only)', () => {
    const root = document.createElement('div');
    mountShell(root);
    const nav = root.querySelector('.app-nav');
    expect(nav?.getAttribute('aria-label')).toBe('Primary');

    const items = root.querySelectorAll('.app-nav__item');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      // Icon is decorative; a text label must accompany it.
      expect(item.querySelector('.app-nav__icon')?.getAttribute('aria-hidden')).toBe('true');
      expect(item.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it('screens expose an aria-label region and a heading', () => {
    const o = document.createElement('main');
    renderExercises(o);
    const section = o.querySelector('section.screen');
    expect(section?.getAttribute('aria-label')).toBe('Exercises');
    expect(o.querySelector('h1.screen__title')).not.toBeNull();
  });

  it('status is conveyed with text + icon, never color alone', () => {
    const cap = capabilityBadge('unsupported');
    expect(cap.textContent).toContain('Unsupported');
    expect(cap.querySelector('[aria-hidden="true"]')).not.toBeNull();

    const perm = permissionBadge('denied');
    expect(perm.textContent).toContain('Denied');
  });
});
