

    const html = document.documentElement;
    const siteHeader = document.querySelector('.site-header');
    const navToggle = document.querySelector('.site-nav-toggle');
    const navLinks = document.getElementById('site-nav-links');

    html.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
    try {
      localStorage.removeItem('theme');
    } catch (error) {
      // Ignore storage access errors and keep the page in dark mode.
    }

    if (siteHeader && navToggle && navLinks) {
      const setNavOpen = (isOpen) => {
        siteHeader.dataset.navOpen = isOpen ? 'true' : 'false';
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      };

      navToggle.addEventListener('click', () => {
        const isOpen = siteHeader.dataset.navOpen === 'true';
        setNavOpen(!isOpen);
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setNavOpen(false));
      });

      document.addEventListener('click', (event) => {
        if (siteHeader.dataset.navOpen !== 'true') return;
        if (siteHeader.contains(event.target)) return;
        setNavOpen(false);
      });

      const desktopQuery = window.matchMedia('(min-width: 769px)');
      const resetNav = (event) => {
        if (event.matches) {
          setNavOpen(false);
        }
      };

      if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener('change', resetNav);
      } else if (desktopQuery.addListener) {
        desktopQuery.addListener(resetNav);
      }
    }


    // Entrance animations
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });
      document.querySelectorAll('.fade-in-up').forEach(el => fadeObserver.observe(el));

      // Ensure below-the-fold sections never stay hidden if the observer misses them.
      window.setTimeout(() => {
        document.querySelectorAll('.fade-in-up:not(.is-visible)').forEach((el) => {
          el.classList.add('is-visible');
        });
      }, 900);
    }

  