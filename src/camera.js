import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Creates the camera controller with OrbitControls and an optional
 * cinematic flyover path.
 */
export function createCameraController(camera, canvas) {
  // ── OrbitControls ──
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;

  // Constrain view
  controls.minDistance = 15;
  controls.maxDistance = 120;
  controls.minPolarAngle = 0.2;           // don't look straight down
  controls.maxPolarAngle = Math.PI / 2.1; // don't go underground

  // Auto rotation
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;

  // Initial target: look at mountain center, slightly elevated
  controls.target.set(0, 6, 0);

  // ── Initial camera position ──
  camera.position.set(40, 25, 45);
  camera.lookAt(controls.target);

  // ── Cinematic path (optional, for future use) ──
  const cinematicPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(50, 30, 50),
    new THREE.Vector3(30, 20, -40),
    new THREE.Vector3(-45, 35, -30),
    new THREE.Vector3(-30, 18, 45),
    new THREE.Vector3(50, 30, 50),
  ], true);

  let cinematicMode = false;
  let cinematicT = 0;
  const cinematicSpeed = 0.008;

  // ── Intro animation state ──
  let introActive = true;
  let introProgress = 0;
  const introDuration = 2.5; // seconds
  const introStartPos = new THREE.Vector3(80, 50, 80);
  const introEndPos = camera.position.clone();

  camera.position.copy(introStartPos);

  /**
   * Update camera each frame.
   */
  function update(dt) {
    // Intro zoom-in
    if (introActive) {
      introProgress += dt / introDuration;
      if (introProgress >= 1.0) {
        introProgress = 1.0;
        introActive = false;
      }
      const t = easeOutCubic(introProgress);
      camera.position.lerpVectors(introStartPos, introEndPos, t);
      camera.lookAt(controls.target);
      controls.update();
      return;
    }

    if (cinematicMode) {
      cinematicT = (cinematicT + cinematicSpeed * dt) % 1;
      const pos = cinematicPath.getPointAt(cinematicT);
      camera.position.copy(pos);
      camera.lookAt(controls.target);
    } else {
      controls.update();
    }
  }

  /**
   * Toggle reduced motion: disable auto-rotation.
   */
  function setReducedMotion(enabled) {
    controls.autoRotate = !enabled;
  }

  function setCinematicMode(enabled) {
    cinematicMode = enabled;
    if (!enabled) {
      controls.update();
    }
  }

  return { controls, update, setReducedMotion, setCinematicMode, camera };
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
