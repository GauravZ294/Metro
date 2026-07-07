// =========================================================================
// Navigation — Insert shared header & handle interactions
// =========================================================================

async function loadNavBar() {
  try {
    const response = await fetch('partials/nav.html');
    const navHTML = await response.text();
    document.getElementById('nav-container').innerHTML = navHTML;

    // Set active link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });

    // Mobile menu toggle
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
      });

      // Close on link click
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

  } catch (error) {
    console.error('Failed to load nav:', error);
  }
}

// Load on page ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNavBar);
} else {
  loadNavBar();
}
