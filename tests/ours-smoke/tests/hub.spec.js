const { test, expect } = require('@playwright/test');
const { freshDevSession, trackUnexpectedConsoleErrors } = require('./helpers');

// The desktop left/right rails repeat product names and the household name
// in their own DOM nodes (just CSS-hidden below their breakpoints, which
// Playwright's text locators still count for strict-mode matching) — so
// Home/Settings assertions are scoped to the center column's
// data-testid="hub-center" wrapper (hub.jsx's CenterColumn), which is
// identical at every width, rather than relying on viewport size.
function center(page) {
  return page.getByTestId('hub-center');
}

test.describe('Hub — Home', () => {
  test('loads with the wordmark, greeting, and all product cards', async ({ page }) => {
    const errors = trackUnexpectedConsoleErrors(page);
    await freshDevSession(page);

    await expect(center(page).getByText(/^Ours\.$/)).toBeVisible();
    await expect(center(page).getByRole('heading', { name: /what are we planning/i })).toBeVisible();

    for (const name of ['Our Pantry', 'Our Exploring', 'Our Home', 'Our Money', 'Our Chores']) {
      await expect(center(page).getByText(name, { exact: true })).toBeVisible();
    }

    expect(errors, `unexpected console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('bottom tab bar switches between Home and Settings without navigating away', async ({ page }) => {
    await freshDevSession(page);

    // The tab bar's label is a bare text node beside its icon's own element
    // (no wrapper of its own), so these two need a substring match, not exact.
    await center(page).getByText('Settings').click();
    await expect(center(page).getByText('The Preview Household', { exact: true })).toBeVisible();
    await expect(center(page).getByText('Family Code', { exact: true })).toBeVisible();

    await center(page).getByText('Home').click();
    await expect(center(page).getByRole('heading', { name: /what are we planning/i })).toBeVisible();
  });

  test('a live product card navigates to its sub-app', async ({ page }) => {
    await freshDevSession(page);
    await center(page).getByText('Our Pantry', { exact: true }).click();
    await expect(page).toHaveURL(/projects\/Pantry\//);
    await expect(page.getByText('Our Pantry', { exact: true })).toBeVisible();
  });
});

test.describe('Hub — Settings', () => {
  test('surfaces the household family code and accent color picker', async ({ page }) => {
    await freshDevSession(page, '/');
    await center(page).getByText('Settings').click();

    await expect(center(page).getByText('DEV123', { exact: true })).toBeVisible();
    await expect(center(page).getByText('Accent color', { exact: true })).toBeVisible();
    await expect(center(page).getByText('Copy code', { exact: true })).toBeVisible();
  });
});
