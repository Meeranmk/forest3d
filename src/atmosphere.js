import * as THREE from 'three';
import skyVert from './shaders/sky.vert';
import skyFrag from './shaders/sky.frag';

/**
 * Lighting presets: Day, Golden Hour, Night
 */
const PRESETS = {
  day: {
    sunDirection: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
    sunColor: new THREE.Color(1.0, 0.98, 0.92),
    sunIntensity: 1.0,
    ambientColor: new THREE.Color(0.45, 0.55, 0.65),
    skyTop: new THREE.Color(0.2, 0.4, 0.8),
    skyBottom: new THREE.Color(0.55, 0.7, 0.9),
    fogColor: new THREE.Color(0.6, 0.72, 0.85),
    fogDensity: 0.000025,
    starIntensity: 0.0,
    directionalIntensity: 1.8,
  },
  golden: {
    sunDirection: new THREE.Vector3(0.8, 0.2, 0.4).normalize(),
    sunColor: new THREE.Color(1.0, 0.7, 0.35),
    sunIntensity: 1.2,
    ambientColor: new THREE.Color(0.5, 0.35, 0.25),
    skyTop: new THREE.Color(0.25, 0.2, 0.45),
    skyBottom: new THREE.Color(0.95, 0.55, 0.25),
    fogColor: new THREE.Color(0.75, 0.5, 0.35),
    fogDensity: 0.00003,
    starIntensity: 0.0,
    directionalIntensity: 2.2,
  },
  night: {
    sunDirection: new THREE.Vector3(-0.3, 0.35, -0.5).normalize(),
    sunColor: new THREE.Color(0.4, 0.5, 0.7),
    sunIntensity: 0.25,
    ambientColor: new THREE.Color(0.08, 0.1, 0.18),
    skyTop: new THREE.Color(0.02, 0.03, 0.08),
    skyBottom: new THREE.Color(0.05, 0.08, 0.15),
    fogColor: new THREE.Color(0.04, 0.06, 0.12),
    fogDensity: 0.00005,
    starIntensity: 1.0,
    directionalIntensity: 0.4,
  },
};

/**
 * Creates the atmosphere system: sky dome, directional light, ambient light.
 */
export function createAtmosphere(scene, uniforms) {
  // ── Sky Dome ──
  const skyGeo = new THREE.SphereGeometry(500, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSkyColorTop: { value: PRESETS.day.skyTop.clone() },
      uSkyColorBottom: { value: PRESETS.day.skyBottom.clone() },
      uSunDirection: uniforms.uSunDirection,
      uSunColor: uniforms.uSunColor,
      uSunIntensity: { value: PRESETS.day.sunIntensity },
      uTime: uniforms.uTime,
      uStarIntensity: { value: 0.0 },
    },
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.name = 'sky';
  scene.add(skyMesh);

  // ── Directional Light (Sun/Moon) ──
  const dirLight = new THREE.DirectionalLight(0xffffff, PRESETS.day.directionalIntensity);
  dirLight.position.copy(PRESETS.day.sunDirection).multiplyScalar(100);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 300;
  dirLight.shadow.camera.left = -60;
  dirLight.shadow.camera.right = 60;
  dirLight.shadow.camera.top = 60;
  dirLight.shadow.camera.bottom = -60;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  // ── Hemisphere Ambient Light ──
  const hemiLight = new THREE.HemisphereLight(
    PRESETS.day.skyTop.clone(),
    new THREE.Color(0.15, 0.2, 0.1),
    0.6
  );
  scene.add(hemiLight);

  // ── Transition state ──
  let currentPreset = 'day';
  let targetPreset = 'day';
  let transitionProgress = 1.0;
  const transitionSpeed = 0.5; // complete in ~2 seconds
  let fromSnapshot = snapshotPreset('day');
  let toSnapshot = snapshotPreset('day');

  function snapshotPreset(name) {
    const p = PRESETS[name];
    return {
      sunDirection: p.sunDirection.clone(),
      sunColor: p.sunColor.clone(),
      sunIntensity: p.sunIntensity,
      ambientColor: p.ambientColor.clone(),
      skyTop: p.skyTop.clone(),
      skyBottom: p.skyBottom.clone(),
      fogColor: p.fogColor.clone(),
      fogDensity: p.fogDensity,
      starIntensity: p.starIntensity,
      directionalIntensity: p.directionalIntensity,
    };
  }

  /**
   * Switch to a lighting preset with smooth transition.
   */
  function setPreset(name) {
    if (name === currentPreset && transitionProgress >= 1.0) return;
    fromSnapshot = getCurrentState();
    toSnapshot = snapshotPreset(name);
    targetPreset = name;
    transitionProgress = 0;
  }

  function getCurrentState() {
    return {
      sunDirection: uniforms.uSunDirection.value.clone(),
      sunColor: uniforms.uSunColor.value.clone(),
      sunIntensity: skyMat.uniforms.uSunIntensity.value,
      ambientColor: uniforms.uAmbientColor.value.clone(),
      skyTop: skyMat.uniforms.uSkyColorTop.value.clone(),
      skyBottom: skyMat.uniforms.uSkyColorBottom.value.clone(),
      fogColor: uniforms.uFogColor.value.clone(),
      fogDensity: uniforms.uFogDensity.value,
      starIntensity: skyMat.uniforms.uStarIntensity.value,
      directionalIntensity: dirLight.intensity,
    };
  }

  /**
   * Update atmosphere each frame. Call with delta time.
   */
  function update(dt) {
    if (transitionProgress < 1.0) {
      transitionProgress = Math.min(1.0, transitionProgress + dt * transitionSpeed);
      const t = smoothstep(transitionProgress);

      // Lerp all values
      uniforms.uSunDirection.value.lerpVectors(fromSnapshot.sunDirection, toSnapshot.sunDirection, t).normalize();
      uniforms.uSunColor.value.lerpColors(fromSnapshot.sunColor, toSnapshot.sunColor, t);
      uniforms.uAmbientColor.value.lerpColors(fromSnapshot.ambientColor, toSnapshot.ambientColor, t);
      uniforms.uFogColor.value.lerpColors(fromSnapshot.fogColor, toSnapshot.fogColor, t);
      uniforms.uFogDensity.value = lerp(fromSnapshot.fogDensity, toSnapshot.fogDensity, t);

      skyMat.uniforms.uSkyColorTop.value.lerpColors(fromSnapshot.skyTop, toSnapshot.skyTop, t);
      skyMat.uniforms.uSkyColorBottom.value.lerpColors(fromSnapshot.skyBottom, toSnapshot.skyBottom, t);
      skyMat.uniforms.uSunIntensity.value = lerp(fromSnapshot.sunIntensity, toSnapshot.sunIntensity, t);
      skyMat.uniforms.uStarIntensity.value = lerp(fromSnapshot.starIntensity, toSnapshot.starIntensity, t);

      dirLight.color.copy(uniforms.uSunColor.value);
      dirLight.intensity = lerp(fromSnapshot.directionalIntensity, toSnapshot.directionalIntensity, t);
      dirLight.position.copy(uniforms.uSunDirection.value).multiplyScalar(100);

      hemiLight.color.copy(skyMat.uniforms.uSkyColorTop.value);

      if (transitionProgress >= 1.0) {
        currentPreset = targetPreset;
      }
    }
  }

  return { skyMesh, dirLight, hemiLight, setPreset, update, getSunIntensity: () => skyMat.uniforms.uSunIntensity.value };
}

// Utility functions
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}
