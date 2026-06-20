// visual-viewport.js — platform-wide iOS soft-keyboard fixes.
//
// Two cooperating concerns, both safe no-ops outside iOS:
//
// 1. VIEWPORT VARS — mirror window.visualViewport (the visible region above the
//    keyboard) onto CSS custom properties on <html> so position:fixed overlays
//    can size/anchor to what's actually visible rather than the layout viewport:
//      --vvh / --vvw  visible height / width
//      --vvt / --vvl  visible region's offset from the layout viewport top/left
//      --kb           soft-keyboard height (0 when closed)
//
// 2. BODY SCROLL-LOCK — while any `.modal-backdrop` is mounted, pin the body so
//    iOS cannot scroll the page under the keyboard. Without this, dismissing the
//    keyboard (X out / back without committing) leaves the page stuck in a
//    shifted state that needs a pinch-to-snap to recover. The exact scroll
//    position is captured on lock and restored on unlock.
(function () {
  var root = document.documentElement;

  /* ── 1. Visual-viewport CSS vars ─────────────────────────────── */
  var vv = window.visualViewport;

  function setVars(h, w, top, left) {
    root.style.setProperty('--vvh', h + 'px');
    root.style.setProperty('--vvw', w + 'px');
    root.style.setProperty('--vvt', top + 'px');
    root.style.setProperty('--vvl', left + 'px');
    var kb = Math.max(0, window.innerHeight - h - top);
    root.style.setProperty('--kb', kb + 'px');
    root.classList.toggle('kb-open', kb > 80);
  }

  // Debounce helper: runs fn now if possible, else coalesces bursts. Falls
  // back to setTimeout so it still fires when requestAnimationFrame is throttled
  // (e.g. background tabs / headless), and always runs the initial call inline.
  function debounced(fn) {
    var pending = false;
    return function () {
      if (pending) return;
      pending = true;
      var run = function () { pending = false; fn(); };
      if (window.requestAnimationFrame) requestAnimationFrame(run);
      else setTimeout(run, 16);
    };
  }

  if (vv) {
    var applyVars = function () { setVars(vv.height, vv.width, vv.offsetTop, vv.offsetLeft); };
    var updateVars = debounced(applyVars);
    vv.addEventListener('resize', updateVars);
    vv.addEventListener('scroll', updateVars);
    window.addEventListener('orientationchange', updateVars);
    applyVars(); // initial set, synchronous
  } else {
    var fallback = function () { setVars(window.innerHeight, window.innerWidth, 0, 0); };
    window.addEventListener('resize', fallback);
    fallback();
  }

  /* ── 2. Body scroll-lock driven by .modal-backdrop presence ──── */
  var locked = false;
  var savedY = 0;

  function lock() {
    if (locked) return;
    savedY = window.scrollY || window.pageYOffset || 0;
    var b = document.body.style;
    b.position = 'fixed';
    b.top = -savedY + 'px';
    b.left = '0';
    b.right = '0';
    b.width = '100%';
    locked = true;
  }

  function unlock() {
    if (!locked) return;
    var b = document.body.style;
    b.position = '';
    b.top = '';
    b.left = '';
    b.right = '';
    b.width = '';
    locked = false;
    window.scrollTo(0, savedY);
  }

  function applyLock() {
    if (document.querySelector('.modal-backdrop')) lock();
    else unlock();
  }

  // Synchronous (not rAF-debounced): the check is a single cheap querySelector
  // and modal mount/unmount is infrequent. Running inline guarantees the lock
  // engages even when requestAnimationFrame is throttled.
  if (window.MutationObserver) {
    new MutationObserver(applyLock).observe(document.documentElement, {
      childList: true, subtree: true,
    });
  }
  applyLock(); // initial check
})();
