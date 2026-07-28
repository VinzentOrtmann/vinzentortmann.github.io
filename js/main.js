(() => {
  'use strict';

  /* ---------- Nav scroll state + mobile toggle ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav__links');

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // The closed off-canvas drawer is hidden via `visibility` in the stylesheet's
  // media query, which keeps it out of the tab order without any JS-side state
  // that could desync from the breakpoint.
  // The stylesheet delays `visibility` so the drawer can animate out, but a
  // transition may never finish (background tabs throttle them), which would
  // leave the closed drawer tabbable. `inert` is applied immediately instead and
  // costs nothing visually, so the tab order never depends on the animation.
  const closeDrawer = () => {
    navLinks.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.inert = true;
    // Closing must not leave focus stranded on a now-hidden link.
    if (navLinks.contains(document.activeElement)) navToggle.focus();
  };

  const openDrawer = () => {
    navLinks.classList.add('is-open');
    navToggle.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navLinks.inert = false;
    navLinks.querySelector('a').focus();
  };

  // If the viewport grows back to the desktop layout the drawer becomes a plain
  // visible nav, so a leftover inert flag would make it unreachable. Reading the
  // toggle's computed display asks the stylesheet directly rather than
  // duplicating the breakpoint in JS.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && getComputedStyle(navToggle).display === 'none') navLinks.inert = false;
  }, true);

  navToggle.addEventListener('click', () => {
    navLinks.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', (e) => {
    if (!navLinks.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    // Keep Tab inside the open drawer; the toggle doubles as its close control.
    const items = [navToggle, ...navLinks.querySelectorAll('a')];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Stat counters ---------- */
  const statNums = document.querySelectorAll('.stat__num');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const startVal = 0;

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(startVal + (target - startVal) * eased);
      el.textContent = val.toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (statNums.length) {
    const statIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNums.forEach(el => statIo.observe(el));
  }

  /* ---------- Typed role text ---------- */
  const typedEl = document.getElementById('typedRole');
  const roles = ['Gameplay Programmer', 'Engine Programmer', 'Level Designer', 'Systems Programmer'];
  if (typedEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let roleIndex = 0, charIndex = 0, deleting = false;

    const type = () => {
      const current = roles[roleIndex];
      if (!deleting) {
        charIndex++;
        typedEl.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(type, 1800);
          return;
        }
      } else {
        charIndex--;
        typedEl.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      setTimeout(type, deleting ? 40 : 70);
    };
    setTimeout(type, 1200);
  }

  /* ---------- Video lightbox ---------- */
  const modal = document.getElementById('videoModal');
  const videos = modal.querySelectorAll('video');
  const closeBtn = modal.querySelector('.video-modal__close');
  let lastFocused = null;

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
    videos.forEach(v => { v.pause(); });
    document.body.style.overflow = '';
    if (lastFocused) { lastFocused.focus(); lastFocused = null; }
  };

  const openModal = (targetId) => {
    videos.forEach(v => {
      const isTarget = v.id === targetId;
      v.hidden = !isTarget;
      if (isTarget && !v.src) {
        v.src = v.dataset.src;
      }
      if (isTarget) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.inert = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  document.querySelectorAll('[data-video-target]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.videoTarget));
  });
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    // trap focus inside the dialog
    const focusable = [closeBtn, ...modal.querySelectorAll('video:not([hidden])')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

})();
