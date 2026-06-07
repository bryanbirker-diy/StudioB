# Pantry — Feature Backlog

Items are ranked by value vs. effort. The matrix gives the quick view; full specs follow below.

---

## Priority Matrix

| # | Feature | Value | Effort | Status |
|---|---------|-------|--------|--------|
| 1 | Persistent tab state | Medium | XS | Ready to build |
| 2 | Duplicate recipe warning | Medium | XS | Ready to build |
| 3 | ICS calendar export | High | S | Ready to build |
| 4 | Recipe search / filter | High | S | Ready to build |
| 5 | Ingredient-based recipe suggestions | High | M | Ready to build |
| 6 | Party tricks — recipes you bring | Medium | M | Spec complete |
| 7 | Firebase cloud sync | Critical | L | Plan first |
| 8 | Meal history | Medium | M | After sync |
| 9 | Serving size / quantity on ingredients | Low | M | After sync |
| 10 | Pantry tab (in-stock tracker) | Medium | L | After sync |
| 11 | Multi-device QR / share link | Medium | M | Superseded by Firebase |
| 12 | iOS Reminders automation hook | Low | L | Clipboard covers it for now |
| 13 | Ours suite dashboard | Vision | XL | Longer term |

**Effort key:** XS = under an hour · S = half a day · M = 1–2 days · L = several days · XL = weeks

---

## 🚀 Quick wins

### 1 · Persistent tab state
App always opens on the Plan tab. Should remember the last viewed tab across
page reloads. Single `localStorage` read/write — five lines of code.

### 2 · Duplicate recipe warning
If the user adds a recipe with the same name as an existing one, show a
warning before saving. Prevents quiet duplicates as the library grows.

### 3 · ICS calendar export
A button that downloads the current week's meal plan as a standard `.ics`
calendar file. The user imports it into Google Calendar, Apple Calendar, or
any other calendar app — the entire plan lands in one tap, with meal names
as event titles and dates mapped to the correct day.

No API keys, no login, no ongoing maintenance. Works forever.

- "📅 Export to Calendar" button on the Plan tab
- Each filled slot becomes a calendar event (name + sides as description)
- Going out slots include the label as the event title
- Wing it slots export as "Wing it 🤷" or are skipped — user's choice

### 4 · Recipe search / filter
As the recipe library grows, a search box on the recipe picker and recipe
list becomes important. Simple name filter would cover most cases. Small
input at the top of both places, filters in real time.

---

## 🌟 High value builds

### 5 · Ingredient-based recipe suggestions
When a user is filling a slot, the picker should surface recipes that share
ingredients with recipes already planned that week. Helps reduce waste and
simplifies the grocery list by encouraging ingredient overlap.

- Show overlap count on each recipe card in the picker ("shares 3 ingredients")
- Sort suggested recipes to the top of the picker list
- Could show a small "good match" badge on the calendar slot

### 6 · Party tricks — recipes you bring
A tagged category of recipes for things you bring to events: fruit trays,
veggie boards, buffalo dip, etc. These are still full recipes (ingredients
flow to the grocery list) but are flagged as "party tricks" and surfaced
specifically in the Going out flow.

When a slot is set to "Going out" with a label, a second optional step
appears: "Bringing anything?" — filtered to party trick recipes only.
The calendar cell shows both: "🎉 Ang's Birthday · Buffalo Dip".
Grocery list attributes the ingredients to the event name.

Implementation notes:
- Add a "type" field to recipes: 'dinner' (default) or 'party'
- Recipe form gets a toggle: "This is something I bring places"
- Party trick recipes are hidden from regular meal slot picker
- Going out flow gets a step 2 for bringing something (optional)

CSV / export-import impact (must handle before shipping):
- CSV gains a 4th column: name, sides, ingredients, type
- type value is either blank/"dinner" (regular) or "party"
- Export must write the type column for all recipes
- Import must read the type column and default to 'dinner' if blank or missing
  (ensures all existing CSV files from before this feature still import cleanly)
- Example row: "Buffalo Dip,,cream cheese; hot sauce; cheddar,party"
- Effort: Medium — touches recipe form, slot sheet, calendar display,
  grocery list attribution, and export/import

---

## 🏗️ Foundation — persistence & sync

### 7 · Firebase cloud sync
**This is the item that ends volatility.** Right now everything — recipes,
meal plans, all of it — lives in the browser's localStorage. Clear browser
data, switch devices, or open the app on your phone and it's all gone.
CSV export is a manual safety net, not a real solution.

Firebase Realtime Database is a Google-hosted cloud store that works
directly from static HTML files — no backend server needed, no monthly
hosting bill at family scale. Data persists across devices and sessions
permanently.

**What gets synced:**
- Recipes — the library survives browser clears and works on every device
- Meal plans — the current week plan is the same on phone, tablet, and PC
- Plan history — past weeks are retrievable (enables Meal history, item 8)

**Auth model decision (must choose before building):**
- **Household code** — share a short PIN, anyone who knows it gets access.
  No accounts, no login friction. Simple and personal. Good for a family
  with one shared set of data.
- **Google sign-in** — proper accounts. More setup but unlocks Google
  Calendar live sync for free (already authenticated). Better if multiple
  family members want individual views eventually.

Recommended: Google sign-in. It solves auth, solves Calendar, and
positions the whole Ours suite properly as it grows.

**Migration path:**
- On first load with Firebase enabled, check localStorage — if data exists,
  offer a one-time "Save my recipes to the cloud" import
- After that, localStorage becomes a local cache only; cloud is the source of truth

**Effort:** Large — Firebase project setup, SDK wiring, data model migration,
offline caching config. Worth planning as its own session.

---

## 🔮 Longer term

### 8 · Meal history
Track which recipes appeared in past plans so you can see what you've been
cooking and avoid repeating the same week. Requires cloud sync (item 7)
to be meaningful — otherwise history disappears with the browser.

### 9 · Serving size / quantity on ingredients
Optional per-ingredient quantities for users who want a more precise
grocery list (e.g. "2 lbs chicken breast" instead of just "chicken breast").
Power-user feature — low priority until the core is stable.

### 10 · Pantry tab (in-stock tracker)
A simple in-stock tracker. Mark items as "in pantry" so the grocery list
can automatically exclude them without manual checking each time. Needs
cloud sync to be useful across devices.

### 11 · Multi-device without cloud (QR / share link)
Generate a shareable link or QR code that encodes the current recipe
library so it can be loaded on another device without a database.
Largely superseded by Firebase (item 7) — only worth building if Firebase
is deprioritized long-term.

### 12 · iOS Reminders / automation hook
The grocery list "Prepare list" button currently copies to clipboard.
A future version could trigger a shortcut or automation to push remaining
items directly into iOS Reminders as individual checklist items. Requires
iOS Shortcuts integration or a webhook. Low priority — clipboard paste into
any notes app works well enough.

---

## 🏠 Bigger picture — "Ours" family suite

### Brand concept
A family planning suite called **Ours** — the name subtly doubles as *Hours*,
signalling both ownership ("our family's things") and time ("how you spend
your hours"). The wordplay doesn't need to be announced — a tagline like
*"How you spend your hours"* or a quiet clock element in the logo plants it.

Our Pantry becomes the first module in the suite. Others follow the same
naming pattern and share the same design system (earth tones, Kalam/Caveat
fonts, sketchy borders, warm paper background).

### The suite modules (vision)
- **Our Pantry** ✅ — meal planning (built)
- **Our Time** — family calendar, who's where, shared schedule
- **Our Goals** — savings targets, milestones, bucket list
- **Our Budget** — where the money goes each month
- **Our Health** — habits, appointments, wellness tracking

### The landing page ("Ours" dashboard)
The root `index.html` currently redirects to Pantry — this becomes the
suite landing page. A clean card grid, one card per module, same visual
language throughout. Tap a card to enter that app.

Each module lives in its own `projects/` folder in the same repo. One
design system (`wireframe-base.css`), one push to deploy everything to
GitHub Pages.

Firebase (item 7) powers the whole suite — one project, one auth system,
one place where all family data lives.

### Design note on the Hours wordplay
Keep it subtle. Options:
- The "O" in Ours has a faint clock-face texture
- Tagline under the logo: "How you spend your hours."
- The dot/period after each module name is styled as a small clock dot
The user should feel it before they notice it.

### Technical architecture
- Monorepo: all modules in `my_universe` repo under `projects/`
- Shared CSS: `wireframe-base.css` at repo root, referenced by all modules
- Each module is self-contained (its own index.html, store.js, app.jsx)
- Firebase added once, shared across all modules via a single config
- Effort to build the dashboard shell: Small. Full suite: Long term.

---

## ✅ Shipped

- **Going out labels** — slot can be titled (e.g. "Ang's Birthday", "Going to Jane's")
