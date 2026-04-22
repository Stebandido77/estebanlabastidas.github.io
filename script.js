/* ═══════════════════════════════════════════════════════════════════════
   ESTEBAN LABASTIDAS · THE QUANT'S NOTEBOOK
   Vol. II · MMXXVI — vanilla JS, no dependencies
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── 01 · HERO LOAD ────────────────────────────────────────────── */
  const hero = document.querySelector('.hero');
  if (hero) {
    // Small delay so the stroke-dashoffset transition fires after paint
    requestAnimationFrame(() => {
      setTimeout(() => hero.classList.add('is-loaded'), 80);
    });
  }

  /* ─── 02 · TICKER ROTATION ──────────────────────────────────────── */
  const ticker = document.getElementById('ticker');
  if (ticker) {
    const items = Array.from(ticker.querySelectorAll('.ticker-item'));
    let idx = 0;
    if (items.length > 1 && !prefersReducedMotion) {
      setInterval(() => {
        items[idx].classList.remove('is-active');
        idx = (idx + 1) % items.length;
        items[idx].classList.add('is-active');
      }, 5000);
    }
  }

  /* ─── 03 · READING PROGRESS ─────────────────────────────────────── */
  const progress = document.getElementById('progress');
  const mainEl = document.getElementById('main');
  if (progress && mainEl) {
    let ticking = false;
    const updateProgress = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
      progress.style.width = (pct * 100) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    updateProgress();
  }

  /* ─── 04 · SCROLL SPY + MOOD SWITCHER ──────────────────────────── */
  const chapters = document.querySelectorAll('.chapter');
  const sideLinks = document.querySelectorAll('.chapters li');

  if (chapters.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const mood = entry.target.dataset.mood;

          // active sidebar item
          sideLinks.forEach((li) => {
            const a = li.querySelector('a');
            li.classList.toggle('is-active', a && a.getAttribute('href') === '#' + id);
          });

          // mood switch (paper vs navy) drives masthead + sidebar colors
          if (mood === 'paper') body.classList.add('is-paper');
          else body.classList.remove('is-paper');

          body.setAttribute('data-active-chapter', id);
        }
      });
    }, {
      rootMargin: '-35% 0px -55% 0px',
      threshold: 0
    });

    chapters.forEach((c) => spy.observe(c));
  }

  /* ─── 05 · REVEALS (staggered) ─────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.revealDelay || 0;
          entry.target.style.setProperty('--reveal-delay', delay);
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => revealObs.observe(el));
  } else if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ─── 06 · PAPER SIDE-PANEL ────────────────────────────────────── */
  const panel        = document.getElementById('panel');
  const panelOverlay = document.getElementById('panelOverlay');
  const panelClose   = document.getElementById('panelClose');
  const panelNum     = document.getElementById('panelNum');
  const panelStatus  = document.getElementById('panelStatus');
  const panelTitle   = document.getElementById('panelTitle');
  const panelSub     = document.getElementById('panelSubtitle');
  const panelVenue   = document.getElementById('panelVenue');
  const panelAbs     = document.getElementById('panelAbstract');
  const panelTags    = document.getElementById('panelTags');

  let papersData = {};
  const dataScript = document.getElementById('papersData');
  if (dataScript) {
    try { papersData = JSON.parse(dataScript.textContent); }
    catch (e) { console.warn('[notebook] papers data failed to parse', e); }
  }

  const openPanel = (id) => {
    const d = papersData[id];
    if (!d || !panel) return;
    panelNum.textContent    = d.num;
    panelStatus.textContent = d.status;
    panelStatus.setAttribute('data-class', d.statusClass || '');
    panelTitle.textContent  = d.title;
    panelSub.textContent    = d.subtitle || '';
    panelVenue.textContent  = d.venue;
    panelAbs.textContent    = d.abstract;
    panelTags.textContent   = d.tags;

    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    panelOverlay.classList.add('is-open');
    panelOverlay.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
  };

  const closePanel = () => {
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    panelOverlay.classList.remove('is-open');
    panelOverlay.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
  };

  document.querySelectorAll('.paper__row[data-paper]').forEach((btn) => {
    btn.addEventListener('click', () => openPanel(btn.dataset.paper));
  });

  if (panelClose)   panelClose.addEventListener('click', closePanel);
  if (panelOverlay) panelOverlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel && panel.classList.contains('is-open')) closePanel();
  });

  /* ─── 07 · MOBILE DRAWER ────────────────────────────────────────── */
  const sidebar = document.getElementById('sidebar');
  const drawer  = document.getElementById('drawerToggle');

  if (sidebar && drawer) {
    const closeDrawer = () => {
      sidebar.classList.remove('is-open');
      drawer.classList.remove('is-active');
      drawer.setAttribute('aria-expanded', 'false');
    };
    drawer.addEventListener('click', () => {
      const open = sidebar.classList.toggle('is-open');
      drawer.classList.toggle('is-active', open);
      drawer.setAttribute('aria-expanded', String(open));
    });
    sidebar.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeDrawer();
    });
  }

  /* ─── 08 · CONSOLE EASTER EGG ──────────────────────────────────── */
  try {
    const banner = [
      '',
      '    ✶  THE QUANT\'S NOTEBOOK  ✶',
      '    ─────────────────────────────',
      '    Vol. II · MMXXVI · Bogotá',
      '',
      '    Hand-coded in vanilla HTML / CSS / JS.',
      '    No frameworks, no build step, no deps.',
      '',
      '    If you are reading this from a browser',
      '    devtools window — hello. You probably',
      '    know what the % character does inside a',
      '    TVP-BVAR-SV prior. Let\'s talk.',
      '',
      '    → estebanlabastidasm@javeriana.edu.co',
      '    → x.com/Stbandido_',
      ''
    ].join('\n');
    console.log('%c' + banner, 'font-family: ui-monospace, Menlo, monospace; color: #b8925a; line-height: 1.5;');
  } catch (_) { /* noop */ }

})();
