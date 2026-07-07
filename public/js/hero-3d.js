// =========================================================================
// SG Metro — 3D Hero Scene (Three.js)
// Renders animated metro network visualization with trains
// =========================================================================

let scene, camera, renderer, trains = [], stations = [];

function showCanvasFallback(message = 'WebGL is unavailable in this browser.') {
  const canvas = document.getElementById('hero3d');
  const fallback = document.getElementById('canvasFallback');

  if (fallback) {
    fallback.hidden = false;
    fallback.style.display = 'flex';
    fallback.innerHTML = `
      <div class="hero-canvas-fallback-card">
        <svg viewBox="0 0 360 220" class="hero-fallback-svg" aria-hidden="true">
          <rect x="22" y="24" width="316" height="172" rx="24" fill="rgba(3,8,14,0.75)" stroke="rgba(127,214,255,0.2)" />
          <path d="M70 165 C110 130, 150 120, 185 105 S260 70, 290 70" stroke="#3fb6f2" stroke-width="4" fill="none" stroke-linecap="round" />
          <path d="M90 95 C125 80, 160 90, 190 60 S255 35, 290 45" stroke="#5e9bd6" stroke-width="4" fill="none" stroke-linecap="round" />
          <path d="M145 150 C165 130, 180 130, 205 110" stroke="#5fd0c4" stroke-width="4" fill="none" stroke-linecap="round" />
          <circle cx="70" cy="165" r="9" fill="#3fb6f2" />
          <circle cx="185" cy="105" r="9" fill="#3fb6f2" />
          <circle cx="290" cy="70" r="9" fill="#3fb6f2" />
          <circle cx="205" cy="110" r="8" fill="#7fd6ff" />
          <circle cx="190" cy="60" r="7" fill="#7fd6ff" />
          <circle cx="90" cy="95" r="7" fill="#7fd6ff" />
        </svg>
        <span>${message}</span>
      </div>
    `;
  }

  if (canvas) {
    canvas.style.display = 'none';
  }
}

function hideCanvasFallback() {
  const fallback = document.getElementById('canvasFallback');
  if (fallback) {
    fallback.hidden = true;
    fallback.style.display = 'none';
  }
}

function isWebGLSupported() {
  try {
    const testCanvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
  } catch (error) {
    return false;
  }
}

function getCanvasSize(canvas) {
  const width = canvas.clientWidth || 560;
  const height = canvas.clientHeight || 420;
  return { width, height };
}

function init3D() {
  const canvas = document.getElementById('hero3d');
  if (!canvas) return;

  if (!isWebGLSupported()) {
    showCanvasFallback('WebGL is unavailable in this browser. Showing a lightweight network preview instead.');
    return;
  }

  const size = getCanvasSize(canvas);
  if (!size.width || !size.height) {
    setTimeout(init3D, 120);
    return;
  }

  try {
    hideCanvasFallback();
    canvas.style.display = 'block';

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060a);
    scene.fog = new THREE.Fog(0x04060a, 150, 200);

    // Camera
    camera = new THREE.PerspectiveCamera(65, size.width / size.height, 0.1, 1000);
    camera.position.set(0, 8, 35);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(size.width, size.height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x4a8fbf, 0.45);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x7fd6ff, 0.8);
    directionalLight.position.set(40, 60, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x3fb6f2, 0.6, 120);
    pointLight.position.set(-30, 15, 20);
    scene.add(pointLight);

    // Ground
    const groundGeom = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a101c,
      metalness: 0.4,
      roughness: 0.7
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create rail lines (paths)
    createRailLines();

    // Create stations (nodes)
    createStations();

    // Create trains (animated objects)
    createTrains();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Animation loop
    animate();

  } catch (error) {
    console.error('Three.js init error:', error);
    showCanvasFallback('WebGL could not be started. Showing a lightweight network preview instead.');
  }
}

function createRailLines() {
  const lines = [
    {
      name: 'Red Line',
      color: 0xe0616e,
      points: [
        [-15, 0, -20], [-10, 0, -10], [-5, 0, 0], [0, 0, 10], [5, 0, 20], [10, 0, 15]
      ]
    },
    {
      name: 'Blue Line',
      color: 0x5e9bd6,
      points: [
        [-25, 0, 10], [-15, 0, 5], [-5, 0, 0], [10, 0, -5], [25, 0, -10]
      ]
    },
    {
      name: 'Teal Line',
      color: 0x5fd0c4,
      points: [
        [0, 0, -25], [0, 0, -10], [0, 0, 0], [0, 0, 15], [0, 0, 25]
      ]
    }
  ];

  lines.forEach(line => {
    const curve = new THREE.CatmullRomCurve3(
      line.points.map(p => new THREE.Vector3(...p))
    );

    const points = curve.getPoints(60);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Main track line (glowing)
    const material = new THREE.LineBasicMaterial({
      color: line.color,
      linewidth: 3,
      emissive: line.color,
      emissiveIntensity: 0.6
    });
    const lineObj = new THREE.Line(geometry, material);
    scene.add(lineObj);

    // Store for train path
    if (!window.railPaths) window.railPaths = [];
    window.railPaths.push({ curve, color: line.color, name: line.name });

    // Rail ties (visual detail)
    for (let i = 0; i < points.length - 1; i += 3) {
      const p = points[i];
      const tieGeom = new THREE.BoxGeometry(8, 0.2, 0.6);
      const tieMat = new THREE.MeshStandardMaterial({
        color: 0x1d2f4d,
        metalness: 0.8,
        roughness: 0.3
      });
      const tie = new THREE.Mesh(tieGeom, tieMat);
      tie.position.copy(p);
      tie.castShadow = true;
      scene.add(tie);
    }
  });
}

function createStations() {
  const stationPositions = [
    { pos: [-15, 0, -20], name: 'Thaltej' },
    { pos: [0, 0, 10], name: 'Central' },
    { pos: [10, 0, 15], name: 'Vastral' },
    { pos: [-25, 0, 10], name: 'Gyaspur' },
    { pos: [25, 0, -10], name: 'Motera' },
    { pos: [0, 0, -25], name: 'North' },
    { pos: [0, 0, 25], name: 'South' }
  ];

  stationPositions.forEach(station => {
    const pos = new THREE.Vector3(...station.pos);

    // Station dome
    const domeGeom = new THREE.IcosahedronGeometry(1.8, 4);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x3fb6f2,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x3fb6f2,
      emissiveIntensity: 0.4
    });
    const dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.copy(pos);
    dome.castShadow = true;
    dome.receiveShadow = true;
    scene.add(dome);

    // Glow sphere
    const glowGeom = new THREE.SphereGeometry(2.4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x3fb6f2,
      transparent: true,
      opacity: 0.08
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.copy(pos);
    scene.add(glow);

    stations.push({ mesh: dome, pos, name: station.name });
  });
}

function createTrains() {
  if (!window.railPaths || window.railPaths.length === 0) return;

  window.railPaths.forEach((path, idx) => {
    for (let i = 0; i < 2; i++) {
      const trainGeom = new THREE.BoxGeometry(1.2, 0.8, 3.2);
      const trainMat = new THREE.MeshStandardMaterial({
        color: path.color,
        metalness: 0.85,
        roughness: 0.2,
        emissive: path.color,
        emissiveIntensity: 0.3
      });
      const train = new THREE.Mesh(trainGeom, trainMat);
      train.castShadow = true;
      train.receiveShadow = true;
      scene.add(train);

      // Window detail
      const windowGeom = new THREE.BoxGeometry(0.8, 0.3, 0.15);
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0x7fd6ff,
        emissive: 0x7fd6ff,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.8
      });
      const window = new THREE.Mesh(windowGeom, windowMat);
      window.position.z = 0.5;
      train.add(window);

      trains.push({
        mesh: train,
        path: path.curve,
        progress: 0.3 * i,
        speed: 0.0008 + Math.random() * 0.0004
      });
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  // Update trains
  trains.forEach(train => {
    train.progress += train.speed;
    if (train.progress > 1) train.progress = 0;

    const point = train.path.getPoint(train.progress);
    train.mesh.position.copy(point);

    // Rotate to face direction
    const nextPoint = train.path.getPoint(
      Math.min(train.progress + 0.01, 1)
    );
    const direction = new THREE.Vector3().subVectors(nextPoint, point).normalize();
    train.mesh.lookAt(
      new THREE.Vector3().addVectors(train.mesh.position, direction)
    );
  });

  // Subtle station pulse
  stations.forEach((s, idx) => {
    s.mesh.rotation.x += 0.002;
    s.mesh.rotation.z += 0.004;
  });

  // Camera subtle orbit
  const t = Date.now() * 0.0001;
  camera.position.x = Math.sin(t) * 35;
  camera.position.z = 35 + Math.cos(t * 0.7) * 8;
  camera.lookAt(0, 4, 0);

  renderer.render(scene, camera);
}

function onWindowResize() {
  const canvas = document.getElementById('hero3d');
  if (!canvas || !camera || !renderer) return;

  const size = getCanvasSize(canvas);
  if (!size.width || !size.height) return;

  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height, false);
}

function startHero3D() {
  showCanvasFallback('Loading the metro network preview…');

  if (typeof THREE === 'undefined') {
    window.setTimeout(startHero3D, 250);
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3D, { once: true });
  } else {
    init3D();
  }
}

window.addEventListener('load', startHero3D, { once: true });
