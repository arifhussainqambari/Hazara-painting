/* ═══════════════════════════════════════════════
   HAZARA — Shared interactions & animations
   ═══════════════════════════════════════════════ */

// ── PAGE TRANSITION WIPE ──
const wipe = document.getElementById('wipe');
if (wipe) {
  wipe.classList.add('out'); // reveal page on load

  // intercept internal links → wipe in, then navigate
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank') return;
    a.addEventListener('click', e => {
      e.preventDefault();
      wipe.classList.remove('out');
      wipe.classList.add('in');
      setTimeout(() => {
        try { window.location.href = href; } catch (err) { /* blocked in sandboxed previews */ }
        // Failsafe: if navigation didn't happen (sandboxed preview frames block it),
        // release the wipe instead of leaving the page stuck behind it.
        setTimeout(() => {
          wipe.classList.remove('in');
          wipe.classList.add('out');
        }, 1500);
      }, 850);
    });
  });
}

// restore state when navigating back (bfcache)
window.addEventListener('pageshow', e => {
  if (e.persisted && wipe) {
    wipe.classList.remove('in');
    wipe.classList.add('out');
  }
});

// ── CUSTOM CURSOR ──
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = -100, my = -100, rx = -100, ry = -100;

// zones where the terracotta cursor is too dark to read → flip to ivory
const DARK_ZONES = '#cta, footer, .marquee-wrap.dark, .btn-dark, .btn-accent, .btn-grad, .nav-cta, .intro-tag, .dark-zone';

if (cursor && ring) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    const overDark = e.target instanceof Element && e.target.closest(DARK_ZONES);
    cursor.classList.toggle('light', !!overDark);
    ring.classList.toggle('light', !!overDark);
  });

  (function ringLoop() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(ringLoop);
  })();

  // hover targets
  const bindCursor = () => {
    document.querySelectorAll('a, button, input, textarea, select, [data-cursor]').forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = '1';
      el.addEventListener('mouseenter', () => {
        if (el.dataset.cursor === 'view') {
          cursor.classList.add('view');
          cursor.querySelector('.cursor-label').textContent = el.dataset.cursorLabel || 'View';
        } else {
          cursor.classList.add('expand');
        }
        ring.style.opacity = '0';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('expand', 'view');
        ring.style.opacity = '1';
      });
    });
  };
  bindCursor();
}

// ── NAV: scrolled state + burger ──
const nav = document.querySelector('nav');
const burger = document.querySelector('.nav-burger');
const navLinks = document.querySelector('.nav-links');

function updateNav() {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}
updateNav();

if (burger && navLinks) {
  burger.setAttribute('aria-expanded', 'false');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', navLinks.classList.contains('open') ? 'true' : 'false');
  });
}

// suppress transitions while resizing + reset mobile menu when leaving mobile width
let resizeTimer;
window.addEventListener('resize', () => {
  document.body.classList.add('resizing');
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => document.body.classList.remove('resizing'), 250);
  if (window.innerWidth > 860) {
    if (navLinks) navLinks.classList.remove('open');
    if (burger) burger.classList.remove('open');
  }
});

// ── SCROLL REVEALS ──
// Fail-safe: if IntersectionObserver is unavailable (very old browsers,
// some embedded webviews), skip animation and show everything immediately.
const REVEAL_SEL = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .clip-reveal, .clip-reveal-up';
const HAS_IO = 'IntersectionObserver' in window;

if (HAS_IO) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(REVEAL_SEL).forEach(el => revealObserver.observe(el));
} else {
  document.querySelectorAll(REVEAL_SEL).forEach(el => el.classList.add('visible'));
}

// ── COUNTERS ──
if (HAS_IO) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur = 1800;
      const start = performance.now();
      const tick = now => {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(ease * target) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));
} else {
  // no observer → show final values immediately
  document.querySelectorAll('[data-count]').forEach(el => {
    el.textContent = el.dataset.count + (el.dataset.suffix || '');
  });
}

// ── WORD-BY-WORD HIGHLIGHT (elements with .words-highlight) ──
const wordsSections = document.querySelectorAll('.words-highlight');
wordsSections.forEach(sec => {
  const spans = sec.querySelectorAll('.w');
  const update = () => {
    const rect = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = 1 - (rect.bottom / (vh + rect.height));
    const threshold = Math.floor(progress * spans.length * 1.9);
    spans.forEach((w, i) => w.classList.toggle('lit', i < threshold));
  };
  sec._updateWords = update;
  update();
});

// ── PARALLAX (elements with [data-parallax="speed"]) ──
const parallaxEls = document.querySelectorAll('[data-parallax]');

// ── MAGNETIC BUTTONS ──
document.querySelectorAll('[data-magnetic]').forEach(el => {
  const strength = 0.35;
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
    el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
    setTimeout(() => el.style.transition = '', 500);
  });
});

// ── UNIFIED SCROLL HANDLER ──
window.addEventListener('scroll', () => {
  updateNav();
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    el.style.transform = `translateY(${y * speed}px)`;
  });
  wordsSections.forEach(sec => sec._updateWords());
}, { passive: true });
