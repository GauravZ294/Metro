// =========================================================================
// Footer — Insert shared footer & set current year
// =========================================================================

async function loadFooter() {
  try {
    const response = await fetch('partials/footer.html');
    const footerHTML = await response.text();
    document.getElementById('footer-container').innerHTML = footerHTML;

    // Set current year
    document.getElementById('footerYear').textContent = new Date().getFullYear();

  } catch (error) {
    console.error('Failed to load footer:', error);
  }
}

// Load on page ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFooter);
} else {
  loadFooter();
}
