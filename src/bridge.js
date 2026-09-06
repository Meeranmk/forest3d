import * as THREE from 'three';
import { modelLoader } from './modelLoader.js';

/**
 * Creates a rustic wooden observation bridge spanning the river gorge
 * overlooking the waterfall plunge pool.
 */
export async function createBridge(scene, terrain) {
  const bridgePosition = new THREE.Vector3(18.5, 2.65, 18.0);
  const bridgeAngle = -Math.PI / 4; // Angle across river flow

  // Load from GLB if available, or generate high-detail procedural timber model
  const bridge = await modelLoader.load(
    '/models/wooden_bridge.glb',
    {
      position: bridgePosition,
      rotation: new THREE.Euler(0, bridgeAngle, 0),
      castShadow: true,
      receiveShadow: true,
    },
    () => buildProceduralBridge(terrain, bridgePosition, bridgeAngle)
  );

  bridge.name = 'waterfall-bridge';
  scene.add(bridge);
  return bridge;
}

/**
 * High-detail procedural wooden observation bridge with planks,
 * arched stringers, support stilts, and rope handrails.
 */
function buildProceduralBridge(terrain, centerPos, angle) {
  const bridgeGroup = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f, // Rich dark weathered timber
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const plankMat = new THREE.MeshStandardMaterial({
    color: 0x4a3627, // Alternating wood grain tone
    roughness: 0.80,
    metalness: 0.05,
    flatShading: true,
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x6e624d, // Natural hemp rope
    roughness: 0.95,
    metalness: 0.0,
  });

  const length = 13.5;
  const width = 3.0;
  const plankCount = 26;

  // 1. Heavy wooden support beams (arched stringers underneath)
  for (const side of [-width / 2 + 0.3, width / 2 - 0.3]) {
    const beamGeo = new THREE.BoxGeometry(length, 0.35, 0.45);
    const beamMesh = new THREE.Mesh(beamGeo, woodMat);
    beamMesh.position.set(0, -0.18, side);
    beamMesh.castShadow = true;
    beamMesh.receiveShadow = true;
    bridgeGroup.add(beamMesh);
  }

  // 2. Individual wooden deck planks with subtle organic height variations
  for (let i = 0; i < plankCount; i++) {
    const t = i / (plankCount - 1);
    const x = (t - 0.5) * (length - 0.6);
    // Subtle arch in center
    const archY = Math.sin(t * Math.PI) * 0.35;
    const jitter = (Math.sin(i * 4.3) * 0.02);

    const plankGeo = new THREE.BoxGeometry(0.38, 0.12, width);
    const mat = (i % 2 === 0) ? woodMat : plankMat;
    const plank = new THREE.Mesh(plankGeo, mat);
    plank.position.set(x, archY + jitter, 0);
    plank.rotation.z = -Math.cos(t * Math.PI) * 0.04;
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);
  }

  // 3. Handrail vertical posts
  const postCount = 7;
  const postPositions = [];
  for (let i = 0; i < postCount; i++) {
    const t = i / (postCount - 1);
    const x = (t - 0.5) * (length - 0.8);
    const archY = Math.sin(t * Math.PI) * 0.35;

    for (const side of [-width / 2 + 0.1, width / 2 - 0.1]) {
      const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.3, 6);
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(x, archY + 0.65, side);
      post.castShadow = true;
      post.receiveShadow = true;
      bridgeGroup.add(post);

      postPositions.push({ x, y: archY + 1.15, z: side, side: side > 0 ? 'R' : 'L' });
    }
  }

  // 4. Horizontal top railing ropes/timber
  for (const side of [-width / 2 + 0.1, width / 2 - 0.1]) {
    const railCurvePoints = [];
    for (let i = 0; i < 15; i++) {
      const t = i / 14;
      const x = (t - 0.5) * (length - 0.8);
      const archY = Math.sin(t * Math.PI) * 0.35 + 1.18;
      railCurvePoints.push(new THREE.Vector3(x, archY, side));
    }
    const railCurve = new THREE.CatmullRomCurve3(railCurvePoints);
    const railGeo = new THREE.TubeGeometry(railCurve, 20, 0.06, 6, false);
    const railMesh = new THREE.Mesh(railGeo, ropeMat);
    railMesh.castShadow = true;
    bridgeGroup.add(railMesh);
  }

  // 5. Vertical foundation stilts anchoring into terrain bed
  for (const x of [-length / 3, length / 3]) {
    for (const side of [-width / 2 + 0.3, width / 2 - 0.3]) {
      const stiltGeo = new THREE.CylinderGeometry(0.18, 0.22, 3.5, 6);
      const stilt = new THREE.Mesh(stiltGeo, woodMat);
      stilt.position.set(x, -1.6, side);
      stilt.castShadow = true;
      stilt.receiveShadow = true;
      bridgeGroup.add(stilt);
    }
  }

  return bridgeGroup;
}
