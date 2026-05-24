(() => {
  const root = document.documentElement;
  const storageKey = 'kk-theme';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applyTheme = (theme) => {
    const safeTheme = theme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', safeTheme);
    document.body.classList.toggle('theme-light', safeTheme === 'light');
    document.body.classList.toggle('theme-dark', safeTheme !== 'light');
    document.querySelectorAll('[data-theme-label]').forEach((label) => {
      label.textContent = safeTheme === 'light' ? 'Light' : 'Dark';
    });
  };

  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem(storageKey) || 'dark';
  } catch {
    savedTheme = 'dark';
  }
  applyTheme(savedTheme);

  document.addEventListener('click', (event) => {
    const themeButton = event.target.closest('[data-theme-toggle]');
    if (themeButton) {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Storage may be unavailable in private contexts.
      }
      return;
    }

    const navButton = event.target.closest('[data-nav-toggle]');
    if (navButton) {
      const header = navButton.closest('[data-site-header]');
      const isOpen = header?.dataset.navOpen === 'true';
      if (header) header.dataset.navOpen = isOpen ? 'false' : 'true';
      navButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      return;
    }

    const tagButton = event.target.closest('[data-tag-filter]');
    if (tagButton) {
      event.preventDefault();
      const cloud = tagButton.closest('[data-tag-cloud]');
      const tag = tagButton.dataset.tagFilter;
      document.querySelectorAll('[data-tag-section]').forEach((section) => {
        section.hidden = tag !== 'all' && section.dataset.tagSection !== tag;
      });
      cloud?.querySelectorAll('[data-tag-filter]').forEach((button) => {
        button.classList.toggle('active', button === tagButton);
      });
      if (tag !== 'all') {
        document.getElementById(tag)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }
  });

  document.querySelectorAll('[data-site-header]').forEach((header) => {
    const navButton = header.querySelector('[data-nav-toggle]');
    header.querySelectorAll('.site-nav a').forEach((link) => {
      link.addEventListener('click', () => {
        header.dataset.navOpen = 'false';
        navButton?.setAttribute('aria-expanded', 'false');
      });
    });
  });

  if (!reduceMotion) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach((element) => fadeObserver.observe(element));
    window.setTimeout(() => {
      document.querySelectorAll('.fade-in-up:not(.is-visible)').forEach((element) => element.classList.add('is-visible'));
    }, 900);
  } else {
    document.querySelectorAll('.fade-in-up').forEach((element) => element.classList.add('is-visible'));
  }

  const progress = document.querySelector('[data-reading-progress]');
  const tocLinks = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
  const headings = tocLinks
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const updateArticleChrome = () => {
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
    }

    if (!headings.length) return;
    const threshold = window.innerHeight * 0.24;
    let active = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - threshold <= 0) active = heading;
      else break;
    }
    tocLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${active.id}`));
  };

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateArticleChrome();
      ticking = false;
    });
  };

  updateArticleChrome();
  document.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
})();