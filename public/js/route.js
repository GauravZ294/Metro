// =========================================================================
// Route Planner — Google Maps Integration & Backend Routes
// =========================================================================

let map, routePolyline, routeMarkers = [], routes = [];
const API_BASE = window.location.origin;





// Initialize Google Map
window.initGoogleMap = function () {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (typeof google === 'undefined' || !google.maps) {
    showMapFallback();
    loadMetroRoutes();
    setupPlannerHandlers();
    return;
  }

  map = new google.maps.Map(mapEl, {
    center: { lat: 23.028, lng: 72.57 },
    zoom: 12,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#0a101c' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#d8dee9' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#0a101c' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#16233d' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1d2f4d' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0a101c' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1d2f4d' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#a9bcd6' }] }
    ]
  });

  loadMetroRoutes();
  setupPlannerHandlers();
};

// Load metro routes from backend
async function loadMetroRoutes() {
  try {
    const response = await fetch(`${API_BASE}/api/routes`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    routes = await response.json();

    const select = document.getElementById('routeSelect');
    select.innerHTML += routes.map(route =>
      `<option value="${route.id}">${route.name}</option>`
    ).join('');

  } catch (error) {
    console.error('Failed to load routes:', error);
    showError('Could not load route data. Please check backend server.');
  }
}

// Setup planner event handlers
function setupPlannerHandlers() {
  const planBtn = document.getElementById('planBtn');
  const routeSelect = document.getElementById('routeSelect');

  planBtn.addEventListener('click', planJourney);
  routeSelect.addEventListener('change', () => {
    if (routeSelect.value) displayRoute(routeSelect.value);
  });

  // Allow Enter key to plan
  document.querySelectorAll('#origin, #destination').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') planJourney();
    });
  });
}

// Plan journey
async function planJourney() {
  const origin = document.getElementById('origin').value.trim();
  const destination = document.getElementById('destination').value.trim();
  const departTime = document.getElementById('departTime').value;
  const accessibility = document.getElementById('accessibility').value;

  if (!origin || !destination) {
    showError('Please enter both origin and destination');
    return;
  }

  try {
    // Call backend route planning API
    const response = await fetch(`${API_BASE}/api/plan-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, departTime, accessibility })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    displayJourneyResult(result);
  } catch (error) {
    console.error('Route planning error:', error);
    showError('Could not plan route. Try different stations.');
  }
}

// Display journey result
function displayJourneyResult(result) {
  const detailsEl = document.getElementById('routeDetails');
  const contentEl = document.getElementById('detailsContent');

  if (!result.success) {
    showError(result.message || 'Route not found');
    return;
  }

  // Clear map
  if (routePolyline) routePolyline.setMap(null);
  routeMarkers.forEach(m => m.setMap(null));
  routeMarkers = [];

  // Draw path on map
  const path = result.route.points.map(p => ({ lat: p.lat, lng: p.lng }));
  routePolyline = new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: result.route.color || '#3fb6f2',
    strokeOpacity: 0.85,
    strokeWeight: 5,
    map
  });

  // Place markers
  const bounds = new google.maps.LatLngBounds();
  result.route.points.forEach((point, idx) => {
    const marker = new google.maps.Marker({
      position: { lat: point.lat, lng: point.lng },
      map,
      title: point.label,
      label: { text: String(idx + 1), fontSize: '11px', fontWeight: 'bold', color: '#fff' }
    });
    routeMarkers.push(marker);
    bounds.extend(marker.getPosition());
  });

  map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });

  // Display details
  contentEl.innerHTML = `
    <h3 style="margin-bottom:12px;">${result.route.name}</h3>
    <div style="display:grid;gap:8px;font-size:0.9rem;color:var(--frost-dim);">
      <div><strong>Journey Time:</strong> ${result.journeyTime}</div>
      <div><strong>Total Fare:</strong> ₹${result.fare}</div>
      <div><strong>Stops:</strong> ${result.stops}</div>
      <div><strong>Next Train:</strong> ${result.nextTrain}</div>
      ${result.accessibility ? `<div><strong>Accessibility:</strong> ${result.accessibility}</div>` : ''}
    </div>
  `;

  detailsEl.style.display = 'block';
  document.getElementById('errorMsg').style.display = 'none';
}

// Display single route
function displayRoute(routeId) {
  const route = routes.find(r => r.id === routeId);
  if (!route) return;

  if (routePolyline) routePolyline.setMap(null);
  routeMarkers.forEach(m => m.setMap(null));
  routeMarkers = [];

  const path = route.points.map(p => ({ lat: p.lat, lng: p.lng }));
  routePolyline = new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: route.lineColor,
    strokeOpacity: 0.8,
    strokeWeight: 5,
    map
  });

  const bounds = new google.maps.LatLngBounds();
  route.points.forEach((point, idx) => {
    const marker = new google.maps.Marker({
      position: { lat: point.lat, lng: point.lng },
      map,
      title: point.label,
      label: { text: String(idx + 1), fontSize: '11px', fontWeight: 'bold', color: '#fff' }
    });
    routeMarkers.push(marker);
    bounds.extend(marker.getPosition());
  });

  map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
}

// Show error
function showError(message) {
  const errorEl = document.getElementById('errorMsg');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  document.getElementById('routeDetails').style.display = 'none';
}


