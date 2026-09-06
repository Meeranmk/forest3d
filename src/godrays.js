import * as THREE from 'three';
import godraysVert from './shaders/godrays.vert';
import godraysFrag from './shaders/godrays.frag';

/**
 * Creates atmospheric volumetric sun shafts (crepuscular rays) streaming
 * through the mountain canyon down onto the waterfall plunge pool.
 */
export function createGodrays(scene, sharedUniforms) {
  const godrayGroup = new THREE.Group();
  godrayGroup.name = 'volumetric-godrays';

  const material = new THREE.ShaderMaterial({
    vertexShader: godraysVert,
    fragmentShader: godraysFrag,
    uniforms: {
      uSunColor: sharedUniforms.uSunColor,
      uSunIntensity: { value: 1.0 },
      uSunDirection: sharedUniforms.uSunDirection,
      uTime: sharedUniforms.uTime,
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Fan of angled light shafts streaming through the mountain gap
  const rayConfigs = [
    { pos: new THREE.Vector3(2.5, 16.0, -1.0), rotY: 0.35, rotX: 0.62, scaleX: 7.5, scaleY: 26.0 },
    { pos: new THREE.Vector3(5.0, 15.0, 1.5),  rotY: 0.48, rotX: 0.58, scaleX: 6.0, scaleY: 24.0 },
    { pos: new THREE.Vector3(0.5, 17.0, -3.0), rotY: 0.22, rotX: 0.66, scaleX: 8.0, scaleY: 28.0 },
    { pos: new THREE.Vector3(7.5, 14.0, 4.0),  rotY: 0.55, rotX: 0.54, scaleX: 6.5, scaleY: 22.0 },
  ];

  const planeGeo = new THREE.PlaneGeometry(1, 1, 1, 8);
  // Shift pivot so origin is at the top of the beam
  planeGeo.translate(0, -0.5, 0);

  for (const cfg of rayConfigs) {
    // Cross-quad for 3D volumetric presence from all camera angles
    for (const angle of [0, Math.PI * 0.45]) {
      const rayMesh = new THREE.Mesh(planeGeo, material);
      rayMesh.position.copy(cfg.pos);
      rayMesh.rotation.y = cfg.rotY + angle;
      rayMesh.rotation.x = cfg.rotX;
      rayMesh.scale.set(cfg.scaleX, cfg.scaleY, 1.0);
      godrayGroup.add(rayMesh);
    }
  }

  scene.add(godrayGroup);

  function update(sunIntensity) {
    if (material.uniforms.uSunIntensity && sunIntensity !== undefined) {
      material.uniforms.uSunIntensity.value = sunIntensity;
    }
  }

  return { mesh: godrayGroup, update, material };
}
