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

      // Bring the drawer into layout first (still off-screen, per its
      // resting transform), force the browser to register that before
      // triggering the slide-in — otherwise it can just snap into
      // place with no animation.
      drawer.classList.add('is-visible');
      void drawer.offsetWidth;

      scrim.hidden = false;
      window.requestAnimationFrame(function () {
        drawer.classList.add('is-open');
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

      // Wait for the slide-out transition to finish before pulling the
      // drawer back out of layout entirely (see the is-visible note in
      // nav.css — this is what keeps it from ever widening the page).
      window.setTimeout(function () {
        scrim.hidden = true;
        drawer.classList.remove('is-visible');
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
