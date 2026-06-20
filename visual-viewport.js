// visual-viewport.js — platform-wide iOS soft-keyboard fix.
//
// The problem: on iOS Safari the *layout* viewport does NOT shrink when the
// soft keyboard opens. Instead the page is scrolled up to reveal the focused
// input, which drags any `position: fixed` overlay (modal backdrops, bottom
// sheets) partly off the top of the screen. `100vh`/`vh` units don't help
// because they measure the layout viewport, not the visible region.
//
// The fix: mirror `window.visualViewport` (the actual visible region above the
// keyboard) onto CSS custom properties on <html>. Overlays then anchor to the
// visual viewport instead of the layout viewport and stay put.
//
//   --vvh / --vvw  visible height / width
//   --vvt / --vvl  visible region's offset from the layout viewport top / left
//   --kb           current soft-keyboard height (0 when closed)
//
// No-op (graceful fallback to innerHeight) on browsers without the API.
(function () {
  var root = document.documentElement;
  var vv = window.visualViewport;

  function setVars(h, w, top, left) {
    root.style.setProperty('--vvh', h + 'px');
    root.style.setProperty('--vvw', w + 'px');
    root.style.setProperty('--vvt', top + 'px');
    root.style.setProperty('--vvl', left + 'px');
    // Keyboard height = how much taller the layout viewport is than the
    // visible region below its top edge.
    var kb = Math.max(0, window.innerHeight - h - top);
    root.style.setProperty('--kb', kb + 'px');
    // Flag the document while the keyboard is up so CSS can react if needed.
    root.classList.toggle('kb-open', kb > 80);
  }

  if (!vv) {
    var fallback = function () {
      setVars(window.innerHeight, window.innerWidth, 0, 0);
    };
    window.addEventListener('resize', fallback);
    fallback();
    return;
  }

  var raf = null;
  function update() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      setVars(vv.height, vv.width, vv.offsetTop, vv.offsetLeft);
    });
  }

  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  window.addEventListener('orientationchange', update);
  update();
})();
