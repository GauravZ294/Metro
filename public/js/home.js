// =========================================================================
// Home Page — Interactions & Service Board
// =========================================================================

// Update board clock
function updateBoardClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('boardClock');
  if (clockEl) clockEl.textContent = `${hours}:${minutes}`;
}

// Render departure board
function renderDepartureBoard() {
  const departures = [
    { dest: 'Vastral Gam', plat: '2A', eta: '2 min', stat: 'ontime' },
    { dest: 'Thaltej Gam', plat: '1B', eta: '5 min', stat: 'ontime' },
    { dest: 'Motera Stadium', plat: '3C', eta: '8 min', stat: 'ontime' },
    { dest: 'Gyaspur Depot', plat: '2B', eta: '11 min', stat: 'delay' },
    { dest: 'Central Interchange', plat: '1A', eta: '14 min', stat: 'ontime' },
  ];

  const boardRows = document.getElementById('boardRows');
  if (!boardRows) return;

  boardRows.innerHTML = departures.map((dep, idx) => `
    <div class="board-row" style="animation:fadeInDown 0.4s ease ${idx * 0.05}s both;">
      <span class="dest">${dep.dest}</span>
      <span class="plat">${dep.plat}</span>
      <span class="eta">${dep.eta}</span>
      <span class="stat stat-${dep.stat}">
        ${dep.stat === 'ontime' ? 'On time' : 'Delayed'}
      </span>
    </div>
  `).join('');
}

// Service ticker
function populateTicker() {
  const alerts = [
    'Line 1 (Red): Operating normally with 4-minute intervals',
    'Line 2 (Blue): Operating normally with 5-minute intervals',
    'All accessibility services available',
    'Download SG Metro app for real-time updates',
    'New contactless payment system now available'
  ];

  const track = document.getElementById('serviceTickerTrack');
  if (!track) return;

  track.innerHTML = alerts.map(alert => 
    `<span>${alert}</span>`
  ).join('');

  // Duplicate for seamless loop
  const items = track.querySelectorAll('span');
  items.forEach(item => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });
}

// Visibility observer for reveal animations
function setupRevealObserver() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) {
    // Add reveal class to sections if not present
    document.querySelectorAll('.card, .section-head').forEach(el => {
      el.classList.add('reveal');
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateBoardClock();
  setInterval(updateBoardClock, 10000);
  
  renderDepartureBoard();
  populateTicker();
  setupRevealObserver();

  // Update nav status color based on time
  const statusDot = document.getElementById('navStatusDot');
  const hour = new Date().getHours();
  if (statusDot) {
    if (hour >= 22 || hour < 5) {
      statusDot.classList.add('warn');
      document.getElementById('navStatusText').textContent = 'Night service running';
    }
  }
});
