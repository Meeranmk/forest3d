import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { createVegetation } from './vegetation.js';
import { createWaterfall } from './waterfall.js';
import { createEagles } from './eagles.js';
import { createAnimals } from './animals.js';
import { createAtmosphere } from './atmosphere.js';
import { createGodrays } from './godrays.js';
import { createCameraController } from './camera.js';
import { createPostProcessing } from './postprocessing.js';
import './styles.css';

// ═══════════════════════════════════════════════
// Naturic Greenery Mountain — Main Entry Point
// ═══════════════════════════════════════════════

// ── DOM Elements ──
const canvas = document.getElementById('scene-canvas');
const loadingOverlay = document.getElementById('loading-overlay');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const uiControls = document.getElementById('ui-controls');
const fpsBadge = document.getElementById('fps-badge');
const fpsValue = document.getElementById('fps-value');
const reduceMotionCheckbox = document.getElementById('reduce-motion');

// ── Shared Uniforms (passed to all shader modules) ──
const sharedUniforms = {
  uTime: { value: 0 },
  uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
  uSunColor: { value: new THREE.Color(1.0, 0.98, 0.92) },
  uAmbientColor: { value: new THREE.Color(0.45, 0.55, 0.65) },
  uFogDensity: { value: 0.000025 },
  uFogColor: { value: new THREE.Color(0.6, 0.72, 0.85) },
  uWindStrength: { value: 0.5 },
  uWindDirection: { value: new THREE.Vector2(1.0, 0.5).normalize() },
};

// ── Renderer ──
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── Scene ──
const scene = new THREE.Scene();

// ── Camera ──
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.5,
  1000
);

// ── Loading Simulation ──
// Since we're procedurally generating everything, simulate a meaningful loading progress
let loadProgress = 0;
function setProgress(value) {
  loadProgress = value;
  progressFill.style.width = `${value}%`;
  progressText.textContent = `${Math.round(value)}%`;
}

// ── Build Scene ──
async function initScene() {
  setProgress(10);

  // 1. Terrain
  await nextFrame();
  const terrain = createTerrain(sharedUniforms);
  scene.add(terrain.mesh);
  setProgress(35);

  // 2. Vegetation
  await nextFrame();
  const vegetation = createVegetation(terrain, sharedUniforms);
  scene.add(vegetation);
  setProgress(65);

  // 3. Waterfall
  await nextFrame();
  const waterfall = createWaterfall(scene, terrain, sharedUniforms);
  setProgress(70);

  setProgress(75);

  // 5. Soaring Eagles
  const eagles = createEagles(scene);

  // 6. Wildlife Herds
  await nextFrame();
  const animals = createAnimals(terrain, sharedUniforms);
  scene.add(animals.mesh);
  setProgress(85);

  // 7. Atmosphere & Volumetric Godrays
  await nextFrame();
  const atmosphere = createAtmosphere(scene, sharedUniforms);
  const godrays = createGodrays(scene, sharedUniforms);
  setProgress(90);

  // 4. Camera
  const cameraController = createCameraController(camera, canvas);
  setProgress(90);

  // 5. Post-processing
  const postProcessing = createPostProcessing(renderer, scene, camera);
  postProcessingRef = postProcessing;
  setProgress(100);

  // Wait a moment for the user to see 100%
  await delay(600);

  // Fade out loading screen
  loadingOverlay.classList.add('fade-out');
  uiControls.classList.remove('hidden');
  fpsBadge.classList.remove('hidden');

  // ── Wire UI & Interactions ──
  setupUI(atmosphere, cameraController);
  setupAnimalInteraction(canvas, camera, animals);

  // ── Animation Loop ──
  let lastTime = performance.now();
  let reducedMotion = false;

  // FPS tracking
  let frameCount = 0;
  let fpsTimer = 0;

  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap delta
    lastTime = now;

    // Update time uniform
    if (!reducedMotion) {
      sharedUniforms.uTime.value += dt;
    }

    // Update systems
    atmosphere.update(dt);
    if (godrays && atmosphere.getSunIntensity) {
      godrays.update(atmosphere.getSunIntensity());
    }
    cameraController.update(dt);
    waterfall.update(dt);
    eagles.update(dt);
    animals.update(dt);

    // Render via post-processing composer
    postProcessing.composer.render();

    // FPS counter
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      fpsValue.textContent = Math.round(frameCount / fpsTimer);
      frameCount = 0;
      fpsTimer = 0;
    }
  }

  // Start
  requestAnimationFrame(animate);

  // ── Reduced Motion ──
  reduceMotionCheckbox.addEventListener('change', (e) => {
    reducedMotion = e.target.checked;
    cameraController.setReducedMotion(reducedMotion);
    if (reducedMotion) {
      sharedUniforms.uWindStrength.value = 0;
    } else {
      sharedUniforms.uWindStrength.value = 0.5;
    }
  });

  // Check system preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reduceMotionCheckbox.checked = true;
    reduceMotionCheckbox.dispatchEvent(new Event('change'));
  }
}

// ── UI Setup ──
function setupUI(atmosphere, cameraController) {
  const buttons = document.querySelectorAll('.mode-btn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      atmosphere.setPreset(mode);
    });
  });
}

// ── Deer Touch & Flee Interaction ──
function setupAnimalInteraction(canvas, camera, animals) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let downTime = 0;
  let downPos = { x: 0, y: 0 };

  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  // Detect quick tap or click (distinguishing from orbit camera drag)
  canvas.addEventListener('pointerdown', (e) => {
    downTime = performance.now();
    downPos = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointerup', (e) => {
    const elapsed = performance.now() - downTime;
    const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);

    if (elapsed < 380 && dist < 10) {
      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(animals.mesh.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        animals.handleTouch(hit.point, hit.object);
      }
    }
  });

  // Cursor hover feedback when aiming at a deer
  canvas.addEventListener('pointermove', (e) => {
    updatePointer(e.clientX, e.clientY);
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(animals.mesh.children, true);
    if (intersects.length > 0) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = '';
    }
  });
}

// ── Resize Handler ──
let postProcessingRef = null;
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (postProcessingRef) {
    postProcessingRef.resize(w, h);
  }
});

// ── Utilities ──
function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Start ──
initScene().catch((err) => {
  console.error('Failed to initialize scene:', err);
  progressText.textContent = 'Error loading scene';
});
