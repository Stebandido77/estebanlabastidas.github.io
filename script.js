/* ========================================
   Esteban Labastidas — Personal Website
   Minimal JavaScript for navigation,
   mobile menu, and scroll animations
   ======================================== */

(function () {
  'use strict';

  /* --- Nav scroll effect --- */
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', function () {
    nav.classList.toggle('nav--scrolled', window.scrollY > 60);
  });

  /* --- Mobile menu toggle --- */
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');

  toggle.addEventListener('click', function () {
    const isOpen = links.classList.toggle('nav__links--open');
    toggle.classList.toggle('nav__toggle--active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('nav__links--open');
      toggle.classList.remove('nav__toggle--active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* --- Fade-in on scroll (IntersectionObserver) --- */
  var sections = document.querySelectorAll('.fade-in');
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
