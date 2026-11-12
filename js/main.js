/* actiself – kleine Helfer: Mobilmenü, Dropdowns, Scroll-Einblendungen, SVG-Linien, Inhaltsverzeichnis */
(function () {
  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = window.matchMedia('(max-width: 1080px)');

  /* Mobilmenü */
  var btn = document.querySelector('.menu-btn');
  if (btn) {
    btn.setAttribute('role', 'button');
    var label = btn.querySelector('.menu-label');
    var setOpen = function (open) {
      body.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Schließen' : 'Menü';
    };
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      setOpen(!body.classList.contains('nav-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); closePanels(); }
    });
    document.querySelectorAll('.main-nav a').forEach(function (a) {
      a.addEventListener('click', function () { if (a.getAttribute('href').indexOf('#') > -1) setOpen(false); });
    });
    mqMobile.addEventListener && mqMobile.addEventListener('change', function () { setOpen(false); });
  }

  /* Dropdowns: Tastatur & Touch auf großen Bildschirmen */
  var panels = document.querySelectorAll('.has-panel');
  function closePanels(except) {
    panels.forEach(function (p) {
      if (p !== except) { p.classList.remove('open'); p.querySelector('.nav-link').setAttribute('aria-expanded', 'false'); }
    });
  }
  panels.forEach(function (p) {
    var link = p.querySelector('.nav-link');
    p.addEventListener('mouseenter', function () { if (!mqMobile.matches) link.setAttribute('aria-expanded', 'true'); });
    p.addEventListener('mouseleave', function () { if (!mqMobile.matches) { p.classList.remove('open'); link.setAttribute('aria-expanded', 'false'); } });
    link.addEventListener('click', function (e) {
      if (mqMobile.matches) return;
      // Touch-Geräte ohne Hover: erster Tipp öffnet, zweiter folgt dem Link
      if (window.matchMedia('(hover: none)').matches && !p.classList.contains('open')) {
        e.preventDefault();
        closePanels(p);
        p.classList.add('open');
        link.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.has-panel')) closePanels(); });

  /* Einblenden beim Scrollen – jedes Element nur einmal */
  if (!reduce && 'IntersectionObserver' in window) {
    var draws = document.querySelectorAll('[data-draw]');
    draws.forEach(function (path) {
      try {
        var len = Math.ceil(path.getTotalLength());
        path.style.strokeDasharray = len + ' ' + len;
        path.style.strokeDashoffset = len;
      } catch (err) { /* nicht messbar: einfach sichtbar lassen */ }
    });
    doc.classList.add('js-reveal');

    var groups = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-in');
        if (el.hasAttribute('data-draw')) el.style.strokeDashoffset = '0';
        el.querySelectorAll && el.querySelectorAll('[data-draw]').forEach(function (p) { p.style.strokeDashoffset = '0'; });
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    document.querySelectorAll('[data-reveal], .program, svg[data-drawgroup]').forEach(function (el) {
      // leichte Staffelung von Geschwistern
      var parent = el.parentElement;
      var key = parent ? (parent.dataset.k || (parent.dataset.k = Math.random().toString(36).slice(2))) : 'x';
      groups[key] = (groups[key] || 0) + 1;
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(groups[key] - 1, 5) * 0.08 + 's');
      io.observe(el);
    });

    // Sicherheitsnetz: nach 4 s alles zeigen, falls etwas nicht beobachtet wurde
    window.addEventListener('load', function () {
      setTimeout(function () {
        document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.add('is-in');
        });
      }, 4000);
    });
  }

  /* Inhaltsverzeichnis: aktiven Abschnitt markieren, mobil zuklappen */
  var toc = document.querySelector('.toc-box');
  if (toc) {
    if (window.matchMedia('(max-width: 1000px)').matches) toc.removeAttribute('open');
    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    var targets = links.map(function (a) { return document.getElementById(decodeURIComponent(a.hash.slice(1))); });
    if ('IntersectionObserver' in window) {
      var current = null;
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var i = targets.indexOf(en.target);
            if (i > -1) {
              if (current) current.classList.remove('is-active');
              current = links[i];
              current.classList.add('is-active');
            }
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      targets.forEach(function (t) { if (t) tio.observe(t); });
    }
    links.forEach(function (a) {
      a.addEventListener('click', function () { if (window.matchMedia('(max-width: 1000px)').matches) toc.removeAttribute('open'); });
    });
  }
})();
