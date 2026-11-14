// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const PORT = 5601; // distinct from the dev launch.json's :5600, so this suite never fights a running preview
const OURS_DIR = path.join(__dirname, '..', '..', 'ours');

module.exports = defineConfig({
  testDir: './tests',
  // The app is Babel-in-browser React loaded from CDN scripts — running many
  // pages at once on one core starves the transpile/render of CPU and makes
  // navigation-wait timeouts flaky. Serial keeps the suite small and stable.
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  // Every navigation here is a full page load of CDN-hosted React/Babel/
  // Firebase scripts with no build step — generous enough that a slow CI
  // runner or cold cache doesn't flake an otherwise-correct assertion.
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx serve "${OURS_DIR}" -p ${PORT} --no-clipboard`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
