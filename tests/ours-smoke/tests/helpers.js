// Shared helpers for the ours smoke suite.
//
// The app is Babel-in-browser React with no build step, so every page load
// pays a real JS-transpile cost — give it a moment before asserting.
// Auth runs through the localhost-only `?dev=1` bypass (see firebase-auth.jsx)
// so tests never touch real Firebase or need credentials.

/** Land on a page under the dev bypass. Each Playwright test already gets a
 * brand-new browser context (so localStorage starts empty) — don't clear it
 * with addInitScript here, since that script would keep firing on every
 * later same-test navigation too (e.g. clicking a product card does a real
 * page load) and wipe out the `ours_dev_bypass` flag right before it's read. */
async function freshDevSession(page, path = '/') {
  await page.goto(`${path}?dev=1`);
}

/** Only error-level console messages, with Firestore permission-denied noise
 * filtered out — those are expected under the dev-bypass mock user, which
 * has no real household in Firestore, and every call already fails closed
 * in the app (caught and logged, never thrown). */
function trackUnexpectedConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/permission-denied|insufficient permissions/i.test(text)) return;
    errors.push(text);
  });
  return errors;
}

module.exports = { freshDevSession, trackUnexpectedConsoleErrors };
