import * as THREE from 'three';
import waterfallVert from './shaders/waterfall.vert';
import waterfallFrag from './shaders/waterfall.frag';
import waterVert from './shaders/water.vert';
import waterFrag from './shaders/water.frag';
import mistVert from './shaders/mist.vert';
import mistFrag from './shaders/mist.frag';

/**
 * Creates an animated waterfall system that fits the carved mountain canyon:
 * 1. Cascading waterfall sheet perfectly hugging the carved cliff face
 * 2. Plunge pool water surface flush with the carved mountain basin
 * 3. Volumetric mist and splash particles at the impact zone
 * 4. Grounded shoreline pebbles/boulders at the pool edge
 */
export function createWaterfall(scene, terrain, sharedUniforms) {
  const group = new THREE.Group();
  group.name = 'waterfall-system';

  const config = (terrain && terrain.waterfallConfig) || {
    cliffTop: new THREE.Vector3(0.0, 17.5, 0.5),
    impactPoint: new THREE.Vector3(8.0, 2.4, 8.5),
    poolCenter: new THREE.Vector3(12.0, 2.4, 12.5),
    poolRadius: 9.5,
    waterLevel: 2.4,
  };

  // ── 1. Cascading Waterfall Ribbon Mesh ──
  // Starts upstream at the mountain ridge and cascades down into the grand pool
  const lengthSegments = 70;
  const widthSegments = 16;
  const waterfallGeo = new THREE.BufferGeometry();

  const vertexCount = (lengthSegments + 1) * (widthSegments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const normals = new Float32Array(vertexCount * 3);
  const indices = [];

  // Stream source point and impact point
  const startX = -1.0, startZ = -0.5;
  const endX = config.impactPoint.x, endZ = config.impactPoint.z;

  // Normalized flow vector in XZ plane
  const flowDir = new THREE.Vector2(endX - startX, endZ - startZ).normalize();
  // Perpendicular side vector across width
  const sideDir = new THREE.Vector2(-flowDir.y, flowDir.x);

  let vIdx = 0;
  let uvIdx = 0;

  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments; // 0 (top) to 1 (pool impact)

    // Centerline coordinates
    const cx = THREE.MathUtils.lerp(startX, endX, t);
    const cz = THREE.MathUtils.lerp(startZ, endZ, t);

    // Height calculation: smoothly follow the carved rock cliff
    const groundY = terrain.getHeight(cx, cz);
    // Smooth parabolic drop for free-falling water over the crest
    const dropCurve = 18.2 - Math.pow(t, 1.22) * 15.7;
    const cy = Math.max(groundY + 0.15, Math.max(dropCurve, config.waterLevel + 0.05));

    // Large roaring waterfall width: 5.2 at crest expanding to 10.5 at base
    const currentWidth = THREE.MathUtils.lerp(5.2, 10.5, Math.pow(t, 0.75));

    for (let j = 0; j <= widthSegments; j++) {
      const u = j / widthSegments; // 0 to 1 across width
      const offset = (u - 0.5) * currentWidth;

      // Volumetric convex arch for deep rushing water appearance
      const arch = Math.sin(u * Math.PI) * 0.42;

      positions[vIdx * 3] = cx + sideDir.x * offset;
      positions[vIdx * 3 + 1] = cy + arch;
      positions[vIdx * 3 + 2] = cz + sideDir.y * offset;

      normals[vIdx * 3] = 0;
      normals[vIdx * 3 + 1] = 1;
      normals[vIdx * 3 + 2] = 0;

      uvs[uvIdx * 2] = u;
      uvs[uvIdx * 2 + 1] = 1.0 - t; // 1 at crest, 0 at impact

      vIdx++;
      uvIdx++;
    }
  }

  // Generate face indices
  for (let i = 0; i < lengthSegments; i++) {
    for (let j = 0; j < widthSegments; j++) {
      const a = i * (widthSegments + 1) + j;
      const b = (i + 1) * (widthSegments + 1) + j;
      const c = (i + 1) * (widthSegments + 1) + (j + 1);
      const d = i * (widthSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  waterfallGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  waterfallGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  waterfallGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  waterfallGeo.setIndex(indices);
  waterfallGeo.computeVertexNormals();

  const waterfallMat = new THREE.ShaderMaterial({
    vertexShader: waterfallVert,
    fragmentShader: waterfallFrag,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTime: sharedUniforms.uTime,
      uSunDirection: sharedUniforms.uSunDirection,
      uSunColor: sharedUniforms.uSunColor,
      uAmbientColor: sharedUniforms.uAmbientColor,
      uFogDensity: sharedUniforms.uFogDensity,
      uFogColor: sharedUniforms.uFogColor,
    },
  });

  const waterfallMesh = new THREE.Mesh(waterfallGeo, waterfallMat);
  waterfallMesh.name = 'waterfall-cascade';
  group.add(waterfallMesh);

  // ── 2. Plunge Pool Water Surface ──
  // Perfectly fills the sculpted circular depression
  const poolGeo = new THREE.CircleGeometry(config.poolRadius, 48);
  poolGeo.rotateX(-Math.PI / 2);

  const poolMat = new THREE.ShaderMaterial({
    vertexShader: waterVert,
    fragmentShader: waterFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: sharedUniforms.uTime,
      uSunDirection: sharedUniforms.uSunDirection,
      uSunColor: sharedUniforms.uSunColor,
      uAmbientColor: sharedUniforms.uAmbientColor,
      uFogDensity: sharedUniforms.uFogDensity,
      uFogColor: sharedUniforms.uFogColor,
      uImpactPoint: { value: config.impactPoint },
    },
  });

  const poolMesh = new THREE.Mesh(poolGeo, poolMat);
  poolMesh.position.set(config.poolCenter.x, config.waterLevel, config.poolCenter.z);
  poolMesh.name = 'waterfall-pool';
  group.add(poolMesh);

  // ── 3. Mist & Spray Particle System ──
  const mistSystem = createMistSystem(config.impactPoint, sharedUniforms);
  group.add(mistSystem);

  scene.add(group);

  return {
    group,
    waterfallMesh,
    poolMesh,
    mistSystem,
    update: () => {
      // Materials automatically update via sharedUniforms.uTime
    },
  };
}

/**
 * Creates billowing mist particles at the splash point.
 */
function createMistSystem(impactPoint, sharedUniforms) {
  const particleCount = 180;
  const geometry = new THREE.BufferGeometry();

  const lifeArray = new Float32Array(particleCount);
  const scaleArray = new Float32Array(particleCount);
  const velocityArray = new Float32Array(particleCount * 3);
  const dummyPositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    dummyPositions[i * 3] = 0;
    dummyPositions[i * 3 + 1] = 0;
    dummyPositions[i * 3 + 2] = 0;

    lifeArray[i] = Math.random();
    scaleArray[i] = 1.8 + Math.random() * 2.8;

    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.6;
    velocityArray[i * 3] = Math.cos(angle) * speed;
    velocityArray[i * 3 + 1] = 1.4 + Math.random() * 2.8; // upward spray
    velocityArray[i * 3 + 2] = Math.sin(angle) * speed;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(dummyPositions, 3));
  geometry.setAttribute('aLife', new THREE.BufferAttribute(lifeArray, 1));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));
  geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocityArray, 3));

  const mistMat = new THREE.ShaderMaterial({
    vertexShader: mistVert,
    fragmentShader: mistFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: sharedUniforms.uTime,
      uSunColor: sharedUniforms.uSunColor,
      uAmbientColor: sharedUniforms.uAmbientColor,
      uFogDensity: sharedUniforms.uFogDensity,
      uFogColor: sharedUniforms.uFogColor,
      uImpactPoint: { value: impactPoint },
    },
  });

  const points = new THREE.Points(geometry, mistMat);
  points.name = 'waterfall-mist';
  return points;
}
