/* ============================================
   Ирк_студия — JavaScript
   Бургер · Reveal · Карусель · Скролл · Оверлей
   ============================================ */

(function () {
  'use strict';

  /* ---------- Утилиты ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }


  /* ---------- 1. Плавный скролл (поддержка fallback) ---------- */
  // scroll-behavior: smooth уже задан в CSS,
  // но добавляем offset под sticky nav
  var navH = 56;
  function getNavHeight() {
    var nav = $('nav.nav');
    return nav ? nav.offsetHeight : 56;
  }

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - getNavHeight();
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });


  /* ---------- 2. Бургер-меню ---------- */
  var burger = $('.burger');
  var mobileMenu = $('[data-mobile-menu]');

  function openMenu() {
    if (!burger || !mobileMenu) return;
    mobileMenu.classList.add('is-open');
    burger.classList.add('is-active');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!burger || !mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    if (mobileMenu && mobileMenu.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (burger) {
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });
  }

  // Закрывать при клике по ссылкам внутри меню
  if (mobileMenu) {
    $$('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });
  }

  // Закрывать при клике вне меню
  document.addEventListener('click', function (e) {
    if (!mobileMenu || !mobileMenu.classList.contains('is-open')) return;
    if (mobileMenu.contains(e.target)) return;
    if (burger && burger.contains(e.target)) return;
    closeMenu();
  });

  // Закрывать по Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  // Закрывать при ресайзе на десктопную ширину
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) closeMenu();
  });


  /* ---------- 3. Reveal on scroll (IntersectionObserver) ---------- */
  var revealEls = $$('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: показываем все сразу
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }


  /* ---------- 4. Карусель отзывов (только desktop >= 1024px) ---------- */
  var DESKTOP_BP = 1024;
  var carouselInit = false;
  var currentPage = 0;

  function initCarousel() {
    if (carouselInit) return;
    if (window.innerWidth < DESKTOP_BP) return;

    var pages = $$('.reviews-page');
    var dots = $$('.carousel-dot');
    var btnPrev = $('#carousel-prev');
    var btnNext = $('#carousel-next');
    var totalPages = pages.length;

    if (!pages.length) return;
    carouselInit = true;

    function goTo(idx) {
      // Wrap around
      currentPage = (idx + totalPages) % totalPages;

      pages.forEach(function (p, i) {
        p.classList.toggle('is-active', i === currentPage);
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === currentPage);
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', function () { goTo(currentPage - 1); });
    }
    if (btnNext) {
      btnNext.addEventListener('click', function () { goTo(currentPage + 1); });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-dot'), 10);
        goTo(idx);
      });
    });

    // Touch/swipe support
    var carousel = $('.reviews-carousel');
    if (carousel) {
      var touchStartX = 0;
      carousel.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      carousel.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          goTo(dx < 0 ? currentPage + 1 : currentPage - 1);
        }
      }, { passive: true });
    }

    // Init state
    goTo(0);
  }

  // Инициализация при загрузке и при ресайзе
  initCarousel();
  window.addEventListener('resize', initCarousel);


  /* ---------- 5. Float CTA — скрывать при скролле к контактам ---------- */
  var floatCta = $('.float-cta');
  var contactsSection = $('#contacts');

  if (floatCta && contactsSection && 'IntersectionObserver' in window) {
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        floatCta.style.opacity = entry.isIntersecting ? '0' : '1';
        floatCta.style.pointerEvents = entry.isIntersecting ? 'none' : '';
      });
    }, { threshold: 0.1 });
    ctaObserver.observe(contactsSection);
  }


  /* ---------- 6. Активная ссылка в навигации при скролле ---------- */
  var navLinks = $$('.nav__links a');
  var sections = navLinks.map(function (a) {
    var id = a.getAttribute('href');
    return id ? document.querySelector(id) : null;
  }).filter(Boolean);

  if (navLinks.length && sections.length && 'IntersectionObserver' in window) {
    var activeSet = new Set();

    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activeSet.add(entry.target.id);
        } else {
          activeSet.delete(entry.target.id);
        }
      });

      // Найти первую активную секцию
      var activeId = null;
      sections.forEach(function (sec) {
        if (!activeId && activeSet.has(sec.id)) activeId = sec.id;
      });

      navLinks.forEach(function (a) {
        var href = a.getAttribute('href');
        a.style.color = (href === '#' + activeId) ? 'var(--accent)' : '';
      });
    }, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    sections.forEach(function (sec) { navObserver.observe(sec); });
  }

})();
