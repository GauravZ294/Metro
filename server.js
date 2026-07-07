/**
 * SG METRO — Advanced Backend Server
 * Features:
 * - REST API for metro routes and trip planning
 * - Google Maps integration
 * - Feedback & report management
 * - Real-time service status
 * - CORS, security, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDemoKey1234567890ABCDEF';
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

// =========================================================================
// METRO ROUTES DATA
// =========================================================================

const metroRoutes = [
  {
    id: 'route1',
    name: 'Red Line — Thaltej Gam ↔ Vastral Gam',
    lineColor: '#e0616e',
    duration: '40 min',
    frequency: '4 min',
    stations: 12,
    capacity: 65000,
    points: [
      { lat: 23.0314, lng: 72.5142, label: 'Thaltej Gam', accessible: true },
      { lat: 23.0290, lng: 72.5268, label: 'Shyamal Cross Road', accessible: true },
      { lat: 23.0280, lng: 72.5410, label: 'Lokhandwala', accessible: true },
      { lat: 23.0271, lng: 72.5568, label: 'Ghatlodia', accessible: true },
      { lat: 23.0255, lng: 72.5764, label: 'Nehru Bridge', accessible: true },
      { lat: 23.0284, lng: 72.5882, label: 'Vastral Gam', accessible: true }
    ]
  },
  {
    id: 'route2',
    name: 'Blue Line — Gyaspur Depot ↔ Motera Stadium',
    lineColor: '#5e9bd6',
    duration: '28 min',
    frequency: '5 min',
    stations: 9,
    capacity: 52000,
    points: [
      { lat: 23.3271, lng: 72.6162, label: 'Gyaspur Depot', accessible: true },
      { lat: 23.3160, lng: 72.6050, label: 'Railway Station', accessible: true },
      { lat: 23.2921, lng: 72.6020, label: 'Kankaria East', accessible: true },
      { lat: 23.0726, lng: 72.5940, label: 'Motera Stadium', accessible: true }
    ]
  },
  {
    id: 'route3',
    name: 'Teal Line — Downtown ↔ SG Airport',
    lineColor: '#5fd0c4',
    duration: '35 min',
    frequency: '3 min',
    stations: 7,
    capacity: 48000,
    points: [
      { lat: 23.0800, lng: 72.7200, label: 'SG Airport T1', accessible: true },
      { lat: 23.0750, lng: 72.7050, label: 'Airport Terminal 2', accessible: true },
      { lat: 23.0620, lng: 72.6800, label: 'Downtown Hub', accessible: true },
      { lat: 23.0550, lng: 72.6650, label: 'Metro Gate', accessible: true }
    ]
  },
  {
    id: 'route4',
    name: 'Amber Line — Urban Connector',
    lineColor: '#f0ad4e',
    duration: '24 min',
    frequency: '6 min',
    stations: 8,
    capacity: 45000,
    points: [
      { lat: 23.0200, lng: 72.5000, label: 'North Plaza', accessible: true },
      { lat: 23.0280, lng: 72.5300, label: 'Tech Park', accessible: true },
      { lat: 23.0350, lng: 72.5600, label: 'Medical College', accessible: true },
      { lat: 23.0450, lng: 72.5900, label: 'South Campus', accessible: false }
    ]
  },
  {
    id: 'route5',
    name: 'Violet Line — Cultural Heritage Loop',
    lineColor: '#b18cd9',
    duration: '18 min',
    frequency: '7 min',
    stations: 6,
    capacity: 35000,
    points: [
      { lat: 23.0400, lng: 72.5400, label: 'Heritage Museum', accessible: true },
      { lat: 23.0500, lng: 72.5700, label: 'Art Gallery', accessible: true },
      { lat: 23.0300, lng: 72.5900, label: 'Temple Complex', accessible: true },
      { lat: 23.0100, lng: 72.5600, label: 'Historical Park', accessible: true }
    ]
  }
];

// Service status
const serviceStatus = {
  updated: new Date(),
  status: 'normal',
  message: 'All lines operating normally',
  alerts: []
};

// =========================================================================
// MIDDLEWARE
// =========================================================================

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'AIzaSyDemoKey1234567890ABCDEF'
      ? GOOGLE_MAPS_API_KEY
      : '',
    googleOAuthClientId: GOOGLE_OAUTH_CLIENT_ID
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} — ${req.method} ${req.path}`);
  next();
});

// =========================================================================
// ROUTES API
// =========================================================================

/**
 * GET /api/routes
 * Returns all available metro routes
 */
app.get('/api/routes', (req, res) => {
  try {
    const routeSummary = metroRoutes.map(r => ({
      id: r.id,
      name: r.name,
      lineColor: r.lineColor,
      stations: r.stations,
      duration: r.duration,
      frequency: r.frequency
    }));
    res.json(routeSummary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routes', details: error.message });
  }
});

/**
 * GET /api/routes/:id
 * Returns detailed information for a specific route
 */
app.get('/api/routes/:id', (req, res) => {
  try {
    const route = metroRoutes.find(r => r.id === req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch route details', details: error.message });
  }
});

/**
 * POST /api/plan-route
 * Advanced trip planning with Google Maps integration
 */
app.post('/api/plan-route', (req, res) => {
  try {
    const { origin, destination, departTime, accessibility } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination required' });
    }

    // Find best matching route based on origin/destination
    // In production, this would use Google Maps Geocoding + Directions API
    const bestRoute = findBestRoute(origin, destination);

    if (!bestRoute) {
      return res.status(404).json({
        success: false,
        message: 'No direct route found between these stations'
      });
    }

    // Filter by accessibility if specified
    let filteredPoints = bestRoute.points;
    if (accessibility) {
      filteredPoints = bestRoute.points.filter(p => p.accessible);
    }

    const response = {
      success: true,
      route: {
        name: bestRoute.name,
        lineColor: bestRoute.lineColor,
        points: filteredPoints
      },
      journeyTime: bestRoute.duration,
      fare: calculateFare(origin, destination, bestRoute),
      stops: filteredPoints.length,
      nextTrain: getNextTrain(bestRoute),
      accessibility: accessibility ? 'Wheelchair accessible route' : null
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Route planning failed', details: error.message });
  }
});

// =========================================================================
// FEEDBACK & REPORTS API
// =========================================================================

/**
 * POST /api/feedback
 * Submit passenger feedback
 */
app.post('/api/feedback', (req, res) => {
  try {
    const { name, email, message, category } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message required' });
    }

    // In production: save to database
    const feedbackRecord = {
      id: `FB-${Date.now()}`,
      timestamp: new Date(),
      name: name || 'Anonymous',
      email,
      message,
      category: category || 'general',
      status: 'received'
    };

    console.log('Feedback received:', feedbackRecord);

    // Send confirmation
    res.json({
      status: 'success',
      message: 'Thank you for your feedback!',
      ticketId: feedbackRecord.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
  }
});

/**
 * POST /api/report
 * Submit incident reports or suggestions
 */
app.post('/api/report', (req, res) => {
  try {
    const { reportType, name, email, station, description, severity } = req.body;

    if (!reportType || !station || !description) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Generate ticket number
    const ticketId = `SG-${Date.now().toString().slice(-8)}`;

    const report = {
      ticketId,
      reportType,
      name: name || 'Anonymous',
      email: email || 'anonymous@sgmetro.local',
      station,
      description,
      severity: severity || 'medium',
      timestamp: new Date(),
      status: 'open',
      priority: severity === 'critical' ? 'high' : severity === 'high' ? 'medium' : 'low'
    };

    console.log('Report submitted:', report);

    // In production: escalate critical reports immediately
    if (severity === 'critical') {
      // Trigger alert notification
      console.warn('⚠️ CRITICAL REPORT — Escalating to duty manager');
    }

    res.json({
      status: 'success',
      message: 'Report submitted successfully',
      ticketId: report.ticketId,
      estimatedResponse: '2 hours'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report', details: error.message });
  }
});

// =========================================================================
// SERVICE STATUS API
// =========================================================================

/**
 * GET /api/status
 * Returns current service status for all lines
 */
app.get('/api/status', (req, res) => {
  try {
    const lineStatus = metroRoutes.map(route => ({
      lineId: route.id,
      lineName: route.name,
      status: 'operational',
      frequency: route.frequency,
      delayMinutes: 0,
      message: 'Operating normally',
      lastUpdated: new Date()
    }));

    res.json({
      overall: serviceStatus.status,
      lines: lineStatus,
      alerts: serviceStatus.alerts,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status', details: error.message });
  }
});

// =========================================================================
// DEPARTURE BOARD API
// =========================================================================

/**
 * GET /api/departures/:stationId
 * Returns next departures from a station
 */
app.get('/api/departures/:stationId', (req, res) => {
  try {
    const stationId = req.params.stationId;

    // Find station in routes
    let station = null;
    let fromRoute = null;

    for (let route of metroRoutes) {
      station = route.points.find(p => p.label.toLowerCase().replace(/\s/g, '-') === stationId);
      if (station) {
        fromRoute = route;
        break;
      }
    }

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Generate mock departures
    const departures = [];
    const routesFromStation = metroRoutes.filter(r =>
      r.points.some(p => p.label === station.label)
    );

    routesFromStation.forEach((route, idx) => {
      departures.push({
        destination: route.points[route.points.length - 1].label,
        line: route.name,
        platform: `${idx + 1}A`,
        nextArrival: `${2 + idx * 3} min`,
        status: 'on-time',
        crowding: Math.floor(Math.random() * 100)
      });
    });

    res.json({
      station: station.label,
      departures,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departures', details: error.message });
  }
});

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Find best route between origin and destination
 */
function findBestRoute(origin, destination) {
  const originLower = origin.toLowerCase();
  const destLower = destination.toLowerCase();

  for (let route of metroRoutes) {
    const hasOrigin = route.points.some(p => p.label.toLowerCase().includes(originLower));
    const hasDestination = route.points.some(p => p.label.toLowerCase().includes(destLower));

    if (hasOrigin && hasDestination) {
      return route;
    }
  }

  return metroRoutes[0]; // Fallback to first route
}

/**
 * Calculate fare based on distance (simplified)
 */
function calculateFare(origin, destination, route) {
  const distance = calculateDistance(origin, destination, route);
  if (distance < 3) return 20;
  if (distance < 6) return 30;
  if (distance < 10) return 40;
  if (distance < 15) return 50;
  return 60;
}

/**
 * Calculate distance between stations
 */
function calculateDistance(origin, destination, route) {
  const originPoint = route.points.find(p => p.label.toLowerCase().includes(origin.toLowerCase()));
  const destPoint = route.points.find(p => p.label.toLowerCase().includes(destination.toLowerCase()));

  if (!originPoint || !destPoint) return 5;

  // Rough distance using lat/lng
  const lat1 = originPoint.lat, lon1 = originPoint.lng;
  const lat2 = destPoint.lat, lon2 = destPoint.lng;

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Get next train arrival time
 */
function getNextTrain(route) {
  const mins = parseInt(route.frequency);
  const nextMins = Math.ceil(Math.random() * mins);
  return `${nextMins} min`;
}

// =========================================================================
// ERROR HANDLING
// =========================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =========================================================================
// SERVER STARTUP
// =========================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     SG METRO SERVER — RUNNING         ║
║                                        ║
║  http://localhost:${PORT}              
║                                        ║
║  API Endpoints:                       ║
║  • GET  /api/routes                   ║
║  • GET  /api/routes/:id               ║
║  • POST /api/plan-route               ║
║  • POST /api/feedback                 ║
║  • POST /api/report                   ║
║  • GET  /api/status                   ║
║  • GET  /api/departures/:stationId    ║
║                                        ║
║  Google Maps API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 20)}...
║  Environment: ${process.env.NODE_ENV || 'development'}
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
