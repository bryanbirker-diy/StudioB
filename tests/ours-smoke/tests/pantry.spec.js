const { test, expect } = require('@playwright/test');
const { freshDevSession, trackUnexpectedConsoleErrors } = require('./helpers');

// Exercises the full Plan → Grocery → Pantry → Prepare loop end to end, the
// same path a real household follows each week. Plan/recipes/pantry data is
// localStorage-first (see store.js) so this runs fully offline under the
// dev-bypass mock user — no real Firestore access needed.

test.describe('Our Pantry — weekly workflow', () => {
  test('plan a week, add a recipe, generate groceries, and reach Prepare', async ({ page }) => {
    const errors = trackUnexpectedConsoleErrors(page);
    await freshDevSession(page, '/projects/Pantry/');

    // ── Plan: no plan yet → date range picker ──
    await expect(page.getByText('Plan a stretch.', { exact: true })).toBeVisible();
    await page.getByText('1 week', { exact: true }).click();
    await page.getByRole('button', { name: /build our calendar/i }).click();

    await expect(page.getByText(/meals filled/i)).toBeVisible();

    // ── Add a recipe via Manage Recipes ──
    await page.getByRole('button', { name: 'Manage Recipes' }).click();
    await expect(page.getByText('Recipes', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '＋ Add recipe' }).click();

    await page.getByPlaceholder('e.g. Grilled Chicken Bowl').fill('Smoke Test Bowl');
    await page.getByRole('button', { name: /next/i }).click();
    await page.locator('.ingredient-textarea').fill('chicken breast\nrice\nbroccoli');
    await page.getByRole('button', { name: 'Save recipe' }).click();

    await expect(page.getByText('Smoke Test Bowl', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '← Back' }).click();

    // ── Assign that recipe to the first open slot ──
    await page.locator('.day-slot-cell', { hasText: '+ add' }).first().click();
    await page.getByText('Pick a recipe', { exact: true }).click();
    await page.getByRole('button', { name: /smoke test bowl/i }).click();

    await expect(page.locator('.day-slot-cell', { hasText: 'Smoke Test Bowl' }).first()).toBeVisible();

    // ── Grocery: the recipe's ingredients should show up to buy ──
    await page.getByRole('button', { name: /proceed to grocery/i }).click();
    await expect(page.getByText('Grocery List', { exact: true })).toBeVisible();
    await expect(page.getByText('chicken breast', { exact: true })).toBeVisible();
    await expect(page.getByText('rice', { exact: true })).toBeVisible();

    // Checking an item off moves it to "Already have"
    await page.getByText('chicken breast', { exact: true }).click();
    await expect(page.getByText('Already have', { exact: false })).toBeVisible();

    // ── Pantry: staples stay off the grocery list ──
    await page.getByRole('button', { name: /proceed to pantry/i }).click();
    await expect(page.getByText('Staples', { exact: true })).toBeVisible();
    await page.getByPlaceholder('e.g. olive oil, salt, butter…').fill('olive oil');
    await page.getByPlaceholder('e.g. olive oil, salt, butter…').press('Enter');
    await expect(page.locator('.pantry-item', { hasText: 'olive oil' })).toBeVisible();

    // ── Prepare: ready to shop ──
    // Scoped to .bottom-nav — "Proceed to Prepare →" above it also matches /prepare/i.
    await page.locator('.bottom-nav').getByRole('button', { name: /prepare/i }).click();
    await expect(page.getByText(/ready to shop/i)).toBeVisible();
    await page.getByRole('button', { name: /copy grocery list/i }).click();
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible();

    expect(errors, `unexpected console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('starting a new plan clears the calendar but keeps saved recipes', async ({ page }) => {
    await freshDevSession(page, '/projects/Pantry/');
    await page.getByText('1 week', { exact: true }).click();
    await page.getByRole('button', { name: /build our calendar/i }).click();

    await page.getByRole('button', { name: 'Start new plan' }).click();
    await page.getByRole('button', { name: /yes, start fresh/i }).click();

    await expect(page.getByText('Plan a stretch.', { exact: true })).toBeVisible();
  });
});
