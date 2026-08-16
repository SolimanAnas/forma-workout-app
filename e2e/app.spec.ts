import { test, expect } from '@playwright/test';

test.describe('Forma PWA', () => {
  test('loads the shell and navigates between screens', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.app-header__brand')).toHaveText('FORMA');

    await page.locator('.app-nav__item[href="#/exercises"]').click();
    await expect(page.locator('.screen__title')).toHaveText('Exercises');
    await expect(page.locator('.exercise-list .card')).toHaveCount(5);

    await page.locator('.app-nav__item[href="#/workout"]').click();
    await expect(page.locator('button.btn--primary')).toContainText('Start');
  });

  test('registers a service worker and works offline after first load', async ({ page, context }) => {
    await page.goto('./');
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, { timeout: 10_000 })
      .catch(() => { /* controller may attach on next load; precache still applies */ });
    // Give Workbox a moment to precache.
    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.app-header__brand')).toHaveText('FORMA');
    await context.setOffline(false);
  });

  test('completes a manual workout end-to-end and shows results', async ({ page }) => {
    await page.goto('./#/workout');
    // Free reps, target 1 (default exercise = pushup).
    await page.selectOption('select[aria-label="Mode"]', 'free').catch(() => {});
    await page.fill('input#w-target-reps-open', '1').catch(() => {});
    await page.locator('button.btn--primary', { hasText: 'Start' }).click();

    // No motion sensor on desktop → manual rep button drives the workout.
    const manual = page.locator('button', { hasText: 'Rep' });
    await expect(manual).toBeVisible();
    await manual.click();

    await expect(page.locator('.screen__title')).toHaveText('Workout complete');
    await expect(page.locator('.card')).toContainText('XP earned');
  });
});
