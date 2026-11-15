

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




    const tocLinks = Array.from(document.querySelectorAll('.toc a'));
    const headings = tocLinks
      .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
      .filter(Boolean);

    const setActiveHeading = (id) => {
      tocLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    };

    const updateActiveHeading = () => {
      if (!tocLinks.length || !headings.length) return;

      const threshold = window.innerHeight * 0.24;
      let activeHeading = headings[0];
      const nearPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;

      if (nearPageEnd) {
        activeHeading = headings[headings.length - 1];
      }

      if (!nearPageEnd) {
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top - threshold <= 0) {
            activeHeading = heading;
          } else {
            break;
          }
        }
      }

      if (activeHeading) {
        setActiveHeading(activeHeading.id);
      }
    };

    let ticking = false;
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActiveHeading();
        ticking = false;
      });
    };

    updateActiveHeading();
    document.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  