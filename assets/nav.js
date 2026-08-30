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

  // Guide and Equipment each have their own in-page contents list
  // (nav.toc). Rather than hand-duplicate that list into every page,
  // or only show it once you've already landed on the page, each of
  // these links gets a small arrow that reveals it right underneath —
  // browsable and tappable from anywhere on the site. If you're
  // already on that page, the list comes straight from this page's
  // own nav.toc; otherwise it's fetched from that page the first time
  // its arrow is tapped, so there's still only one place that ever
  // needs editing when a heading changes.
  var EXPANDABLE_PAGES = [
    { file: 'guide.html', label: 'Guide' },
    { file: 'equipment.html', label: 'Equipment' }
  ];

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
    var navClone = null;
    if (sourceNav) {
      navClone = sourceNav.cloneNode(true);
      navClone.removeAttribute('id');
      linksHost.appendChild(navClone);
    }

    if (navClone) {
      for (var i = 0; i < EXPANDABLE_PAGES.length; i += 1) {
        attachExpandable(navClone, EXPANDABLE_PAGES[i]);
      }
    }

    // ---------------- Guide/Equipment expandable rows ----------------

    function attachExpandable(nav, pageInfo) {
      var links = nav.querySelectorAll('a');
      var link = null;
      for (var i = 0; i < links.length; i += 1) {
        var href = links[i].getAttribute('href') || '';
        if (href.indexOf(pageInfo.file) !== -1) {
          link = links[i];
          break;
        }
      }
      if (!link) return;

      var item = document.createElement('div');
      item.className = 'nav-drawer-item';

      var row = document.createElement('div');
      row.className = 'nav-drawer-row';

      var sublist = document.createElement('div');
      sublist.className = 'nav-drawer-sublist';
      sublist.id = 'navSub-' + pageInfo.file.replace('.html', '');
      sublist.hidden = true;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-drawer-expand';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', sublist.id);
      btn.setAttribute('aria-label', 'Show ' + pageInfo.label + ' contents');
      btn.innerHTML =
        '<svg class="nav-drawer-expand-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';

      link.parentNode.insertBefore(item, link);
      row.appendChild(link);
      row.appendChild(btn);
      item.appendChild(row);
      item.appendChild(sublist);

      var loaded = false;
      var loading = false;

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        if (isOpen) {
          item.classList.remove('is-open');
          sublist.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
          return;
        }

        item.classList.add('is-open');
        sublist.hidden = false;
        btn.setAttribute('aria-expanded', 'true');

        if (loaded || loading) return;
        loading = true;
        loadSublist(pageInfo, sublist, function () {
          loaded = true;
          loading = false;
        });
      });
    }

    function currentFile() {
      var name = location.pathname.split('/').pop();
      return name || 'index.html';
    }

    // Builds the list content for one page's contents into `sublist`.
    // `sameOrigin` false means these links came from a *different*
    // page's nav.toc, so their #anchor-only hrefs need that page's
    // filename put back in front — otherwise tapping one would try to
    // jump to an anchor on whichever page the drawer is currently open
    // on, not the page the list actually describes.
    function fillSublist(sublist, toc, pageFile, sameOrigin) {
      var clone = toc.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.remove('toc');

      if (!sameOrigin) {
        var links = clone.querySelectorAll('a');
        for (var i = 0; i < links.length; i += 1) {
          var href = links[i].getAttribute('href');
          if (href && href.charAt(0) === '#') {
            links[i].setAttribute('href', pageFile + href);
          }
        }
      }

      while (clone.firstChild) {
        sublist.appendChild(clone.firstChild);
      }
    }

    function loadSublist(pageInfo, sublist, done) {
      if (currentFile() === pageInfo.file) {
        var localToc = document.querySelector('nav.toc');
        if (localToc) {
          fillSublist(sublist, localToc, pageInfo.file, true);
        } else {
          sublist.textContent = 'No contents found.';
        }
        done();
        return;
      }

      var status = document.createElement('div');
      status.className = 'nav-drawer-sublist-status';
      status.textContent = 'Loading…';
      sublist.appendChild(status);

      fetch(pageInfo.file)
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var toc = doc.querySelector('nav.toc');
          status.remove();
          if (toc) {
            fillSublist(sublist, toc, pageInfo.file, false);
          } else {
            sublist.textContent = 'No contents found.';
          }
          done();
        })
        .catch(function () {
          status.textContent = 'Could not load contents — open the page directly instead.';
          done();
        });
    }

    // ---------------- Drawer open/close ----------------

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
    // the link is an in-page "#" anchor). The expand arrows are
    // <button>s, not links, so they're untouched by this and never
    // close the drawer.
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeDrawer();
    });
  });
})();
