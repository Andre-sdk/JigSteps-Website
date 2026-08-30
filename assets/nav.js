/* ============================================================
   JigSteps — shared mobile navigation (hamburger + side drawer)
   Wires up the hamburger button already sitting in .topbar and the
   empty drawer markup already sitting after .beta-strip on every
   page. Nothing here needs page-specific edits: it reads whatever
   links already exist on the page and copies them in.
   ============================================================ */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var topbar = document.querySelector('.topbar');
    var toggle = document.getElementById('navToggle');
    var drawer = document.getElementById('navDrawer');
    var scrim = document.getElementById('navScrim');
    var closeBtn = document.getElementById('navClose');
    var linksHost = drawer ? drawer.querySelector('.nav-drawer-links') : null;

    if (!topbar || !toggle || !drawer || !scrim || !closeBtn || !linksHost) return;

    // Clone the page's own top-bar nav into the drawer, so the links,
    // hrefs, and "active page" highlight are always already correct —
    // one less place to keep in sync by hand.
    var sourceNav = topbar.querySelector('nav');
    if (sourceNav) {
      var navClone = sourceNav.cloneNode(true);
      navClone.removeAttribute('id');
      linksHost.appendChild(navClone);
    }

    // Equipment/Guide pages have their own in-page "contents" sidebar
    // (nav.toc). Fold a copy of it into the drawer under its own
    // heading. Pages without one simply skip this block.
    var toc = document.querySelector('nav.toc');
    var tocHost = document.getElementById('navDrawerToc');
    if (toc && tocHost) {
      var label = document.createElement('div');
      label.className = 'nav-drawer-toc-label';
      label.textContent = 'On this page';

      var tocClone = toc.cloneNode(true);
      tocClone.removeAttribute('id');
      tocClone.classList.remove('toc');

      tocHost.appendChild(label);
      tocHost.appendChild(tocClone);
      tocHost.hidden = false;
    }

    var lastFocused = null;

    function openDrawer() {
      lastFocused = document.activeElement;
      drawer.classList.add('is-open');
      scrim.hidden = false;
      // Next frame, so the transition actually runs.
      window.requestAnimationFrame(function () {
        scrim.classList.add('is-open');
      });
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      document.addEventListener('keydown', onKeydown);

      var firstLink = linksHost.querySelector('a') || closeBtn;
      firstLink.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      scrim.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      document.removeEventListener('keydown', onKeydown);

      window.setTimeout(function () {
        scrim.hidden = true;
      }, 220);

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        toggle.focus();
      }
    }

    function onKeydown(e) {
      if (e.key === 'Escape') closeDrawer();
    }

    toggle.addEventListener('click', function () {
      if (drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
    closeBtn.addEventListener('click', closeDrawer);
    scrim.addEventListener('click', closeDrawer);

    // Tapping any link inside the drawer closes it (the browser will
    // navigate straight after; this just avoids it staying "open" if
    // the link is an in-page "#" anchor).
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeDrawer();
    });
  });
})();
