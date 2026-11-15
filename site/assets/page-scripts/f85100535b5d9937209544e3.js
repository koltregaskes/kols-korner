

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



  