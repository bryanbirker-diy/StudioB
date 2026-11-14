# ours — smoke tests

Playwright smoke tests for the `ours` app. These are the regression gate that
runs before every deploy to prod (see `.github/workflows/deploy-ours.yml`) —
not full coverage, just the paths where a broken deploy would be loudest:

- **Hub** — the landing page loads, all product cards render, Home ↔ Settings
  navigation works, Settings shows the family code and accent picker.
- **Our Pantry** — the whole weekly loop: build a plan, add a recipe, assign
  it to a slot, generate a grocery list from it, mark an item on hand, add a
  staple, reach Prepare and copy the list. Plus: starting a new plan clears
  the calendar but keeps saved recipes.

## Why this works without a real Firebase login

`ours` gates everything behind Google sign-in, but on `localhost` it has a
dev bypass (`?dev=1`, see `firebase-auth.jsx`) that skips Firebase entirely
and renders the app as a mock "Preview Household" user. Pantry's data (plan,
recipes, pantry lists) is localStorage-first with a Firestore sync layer on
top (`projects/Pantry/store.js`) — so the whole Plan → Grocery → Pantry →
Prepare loop works offline, under the mock user, with no real credentials.
Firestore sync calls fail closed (permission-denied, caught and logged) and
are filtered out of the console-error assertions on purpose — that's expected
noise under the mock user, not a real bug.

## Running locally

```bash
npm install
npx playwright install chromium
npm test
```

This starts its own static server on port `5601` (separate from the `:5600`
dev preview in `.claude/launch.json`, so it never collides with a server
you've already got running) and tears it down when the run finishes.

```bash
npm run test:headed   # watch it run in a real browser window
npm run report        # open the last HTML report
```

## Adding to this suite

Scope it to what breaks loudly in prod — the next product mod (Chores,
Exploring, Home, Money) gets its own `*.spec.js` here the same way Pantry
did, once it has a workflow worth gating a deploy on.
