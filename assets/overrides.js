/* ============ Layered overrides — runs alongside the original bundle ============ */
(function () {
  // ---- 1. Inject hero background overlay + fixed nav ----
  function injectChrome() {
    if (document.getElementById('cg-nav')) return;

    var bg = document.createElement('div');
    bg.id = 'cg-hero-bg';
    document.body.appendChild(bg);

    var nav = document.createElement('header');
    nav.id = 'cg-nav';
    nav.innerHTML = [
      '<a class="cg-logo" href="#top">CG</a>',
      '<nav class="cg-links">',
      '  <a href="#top" data-cg-link="home">Home</a>',
      '  <a href="#about" data-cg-link="about">About</a>',
      '  <a href="#music" data-cg-link="music">Music</a>',
      '</nav>',
      '<a class="cg-cta" href="#contact">Get in touch</a>'
    ].join('');
    var root = document.getElementById('root');
    if (root && root.parentNode === document.body) {
      document.body.insertBefore(nav, root);
    } else {
      document.body.appendChild(nav);
    }

    // Smooth scroll for nav links — find the React-rendered targets
    nav.addEventListener('click', function (e) {
      var t = e.target.closest('a[href^="#"]');
      if (!t) return;
      var which = t.getAttribute('href').slice(1);
      e.preventDefault();
      var el = resolveTarget(which);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: which === 'top' ? 0 : document.body.scrollHeight, behavior: 'smooth' });
    });

    // Fade out hero bg when scrolling past the hero
    window.addEventListener('scroll', function () {
      var threshold = window.innerHeight * 0.85;
      bg.classList.toggle('hidden', window.scrollY > threshold);
    }, { passive: true });
  }

  function resolveTarget(which) {
    var headings = Array.prototype.slice.call(document.querySelectorAll('#root h2, #root h1'));
    function findByText(re) {
      for (var i = 0; i < headings.length; i++) {
        if (re.test(headings[i].textContent || '')) return headings[i].closest('section') || headings[i];
      }
      return null;
    }
    if (which === 'top') return document.body;
    if (which === 'about') {
      // About is the section containing "Keyboardist based in"
      var hs = document.querySelectorAll('#root h2');
      for (var i = 0; i < hs.length; i++) {
        if (/Keyboardist based in/.test(hs[i].textContent || '')) return hs[i].closest('section');
      }
      return null;
    }
    if (which === 'music') return findByText(/Watch Me Play|Sound\s*&\s*Range|Music/i);
    if (which === 'contact') {
      var hh = document.querySelectorAll('#root h2');
      for (var j = 0; j < hh.length; j++) {
        if (/Get in touch/i.test(hh[j].textContent || '')) return hh[j].closest('section');
      }
      return null;
    }
    return null;
  }

  // ---- 2. Restructure the contact section into 2 columns with a portrait ----
  var slideshowImages = [
    '/assets/slide-1.jpg',
    '/assets/slide-2.jpg',
    '/assets/slide-3.jpg',
    '/assets/slide-4.jpg'
  ];

  function injectSlideshow() {
    if (document.getElementById('cg-contact-portrait')) return true;
    var hs = document.querySelectorAll('#root h2');
    var contactSection = null;
    for (var i = 0; i < hs.length; i++) {
      if (/Get in touch/i.test(hs[i].textContent || '')) {
        contactSection = hs[i].closest('section') || hs[i].parentElement;
        break;
      }
    }
    if (!contactSection) return false;

    contactSection.id = 'cg-contact-section';
    document.body.classList.add('cg-contact-styled');

    // Wrap existing children into a left column
    var left = document.createElement('div');
    left.className = 'cg-contact-left';
    while (contactSection.firstChild) left.appendChild(contactSection.firstChild);
    contactSection.appendChild(left);

    // Build the portrait card on the right
    var box = document.createElement('div');
    box.id = 'cg-contact-portrait';
    box.setAttribute('aria-label', 'Choko Gabriel portrait');
    var slidesHtml = slideshowImages.map(function (src, idx) {
      return '<div class="cg-slide' + (idx === 0 ? ' active' : '') + '" style="background-image:url(\'' + src + '\')"></div>';
    }).join('');
    box.innerHTML = slidesHtml + '<div class="cg-dots"></div>';
    contactSection.appendChild(box);

    var slides = box.querySelectorAll('.cg-slide');
    var dotsWrap = box.querySelector('.cg-dots');
    var idx = 0;
    for (var d = 0; d < slides.length; d++) {
      var btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Go to slide ' + (d + 1));
      if (d === 0) btn.classList.add('active');
      (function (i) {
        btn.addEventListener('click', function () { go(i); reset(); });
      })(d);
      dotsWrap.appendChild(btn);
    }
    var dots = dotsWrap.querySelectorAll('button');
    function go(i) {
      slides[idx].classList.remove('active'); dots[idx].classList.remove('active');
      idx = i;
      slides[idx].classList.add('active'); dots[idx].classList.add('active');
    }
    var timer;
    function start() { timer = setInterval(function () { go((idx + 1) % slides.length); }, 4500); }
    function reset() { clearInterval(timer); start(); }
    start();
    return true;
  }

  function removeEmDashes() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf('—') !== -1) {
        node.nodeValue = node.nodeValue.replace(/—/g, '');
      }
    }
    var elements = document.querySelectorAll('[title], [aria-label]');
    for (var i = 0; i < elements.length; i++) {
      ['title', 'aria-label'].forEach(function (attribute) {
        var value = elements[i].getAttribute(attribute);
        if (value && value.indexOf('—') !== -1) {
          elements[i].setAttribute(attribute, value.replace(/—/g, ''));
        }
      });
    }
  }

  // Watch for React to render content, then inject overlays
  function init() {
    injectChrome();
    removeEmDashes();
    if (injectSlideshow()) {
      removeEmDashes();
      return;
    }
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      removeEmDashes();
      if (injectSlideshow() || tries > 60) clearInterval(iv);
    }, 250);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 100);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
