import { test, expect } from '@playwright/test';

// Serial + shared server: avoids SW/preview contention across parallel workers.
test.describe.configure({ mode: 'serial' });

test.describe('Forma PWA', () => {
  test('loads the shell and navigates between screens', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-header__brand')).toHaveText('FORMA');

    await page.locator('.app-nav__item[href="#/exercises"]').click();
    await expect(page.locator('.screen__title')).toHaveText('Exercises');
    await expect(page.locator('.exercise-list .card')).toHaveCount(5);

    await page.locator('.app-nav__item[href="#/workout"]').click();
    await expect(page.locator('button.btn--primary')).toContainText('Start');
  });

  test('registers a service worker and works offline after first load', async ({ page, context }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Wait for the SW to be ready and controlling (clientsClaim).
    await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true), null, {
      timeout: 15_000,
    });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 15_000,
    });

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-header__brand')).toHaveText('FORMA');
    await context.setOffline(false);
  });

  test('launches an active workout with a dominant rep count and hides the nav (no-touch)', async ({
    page,
  }) => {
    await page.goto('./#/workout', { waitUntil: 'domcontentloaded' });
    await page.selectOption('select[aria-label="Mode"]', 'free');
    await page.locator('button.btn--primary', { hasText: 'Start' }).click();

    await expect(page.locator('.workout .rep-count')).toBeVisible();
    await expect(page.locator('.workout__exercise')).toContainText('Push-up');
    // During an active workout the app chrome is hidden (spec §19/§33).
    await expect(page.locator('.app-nav')).toBeHidden();
  });

  test('tap-to-count increments reps and completes a workout', async ({ page }) => {
    await page.goto('./#/workout', { waitUntil: 'domcontentloaded' });
    await page.selectOption('select[aria-label="Mode"]', 'free');
    await page.locator('input[type="number"]').first().fill('2'); // target 2 reps
    await page.locator('button.btn--primary', { hasText: 'Start' }).click();

    const rep = page.locator('.rep-count.tappable');
    await expect(rep).toBeVisible();
    await page.waitForTimeout(2600); // let the 3-2-1 countdown finish
    await rep.click();
    await rep.click();

    await expect(page.locator('.screen__title')).toHaveText('Workout complete');
  });
});
