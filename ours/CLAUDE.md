# ours — project instructions

## Service worker cache: always bump on same-origin file changes

`sw.js` is a **cache-first** service worker (see `PRECACHE` list + fetch handler).
Returning PWA/installed users will keep serving the *old* cached files until the
`CACHE` name changes — the `activate` handler only purges old caches when the
name differs from what's currently installed.

**Rule:** any time you edit or add a same-origin file that the app serves —
`*.jsx`, `*.js`, `*.css`, `*.html`, `shared/theme.css`, files under
`projects/**`, etc. — bump `CACHE` in `ours/sw.js` (e.g. `ours-v6` → `ours-v7`)
as part of that change, before it ships. If a new module/page is added, also
add its files to the `PRECACHE` array.

Do this automatically, without being asked — the user always wants PWA/installed
users to receive updates, not stale cached code.

Skip the bump only for changes that don't touch cached files: README/docs edits,
`.github/workflows/*`, or anything outside `ours/` entirely.
