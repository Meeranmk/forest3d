import * as THREE from 'three';
import vegVert from './shaders/vegetation.vert';
import vegFrag from './shaders/vegetation.frag';

/**
 * Creates instanced vegetation:
 * - Lush alpine evergreen trees (Norway Spruce / Mountain Fir)
 * - Waving meadow grass tufts with dynamic wind sway
 * - Flowering alpine shrubs along woodland borders
 */
export function createVegetation(terrain, uniforms) {
  const group = new THREE.Group();
  group.name = 'vegetation';

  const sharedUniforms = {
    uSunDirection: uniforms.uSunDirection,
    uSunColor: uniforms.uSunColor,
    uAmbientColor: uniforms.uAmbientColor,
    uFogDensity: uniforms.uFogDensity,
    uFogColor: uniforms.uFogColor,
    uTime: uniforms.uTime,
    uWindStrength: uniforms.uWindStrength,
    uWindDirection: uniforms.uWindDirection,
  };

  // 1. Alpine Conifer Forest (450 Trees)
  const trees = createTrees(450, terrain, sharedUniforms);
  group.add(trees.trunk);
  group.add(trees.canopy);

  // 2. Lush Mountain Meadow Grass (8,500 Waving Grass Tufts)
  const grass = createGrass(8500, terrain, sharedUniforms);
  group.add(grass);

  // 3. Alpine Wildflower Shrubs & Bushes (240 Bushes)
  const bushes = createBushes(240, terrain, sharedUniforms);
  group.add(bushes);

  return group;
}

// ────────────────────────────────────────────────────────────
// ALPINE CONIFER TREES (MULTI-TIERED SPRUCE / FIR)
// ────────────────────────────────────────────────────────────
function createTrees(count, terrain, sharedUniforms) {
  // Trunk: sturdy base
  const trunkGeo = new THREE.CylinderGeometry(0.10, 0.20, 1.5, 7, 1);
  trunkGeo.translate(0, 0.75, 0);

  // Full, lush, multi-tiered evergreen needle canopy starting low on trunk
  const mergedCanopy = mergeGeometries([
    makeCone(1.65, 1.8, 8, 0, 1.25),
    makeCone(1.35, 1.6, 8, 0, 2.10),
    makeCone(1.02, 1.4, 8, 0, 2.85),
    makeCone(0.60, 1.2, 8, 0, 3.55),
  ]);

  const trunkMat = createVegMaterial(sharedUniforms);
  const canopyMat = createVegMaterial(sharedUniforms);

  const trunkMesh = new THREE.InstancedMesh(trunkGeo.toNonIndexed(), trunkMat, count);
  const canopyMesh = new THREE.InstancedMesh(mergedCanopy, canopyMat, count);
  trunkMesh.castShadow = true;
  canopyMesh.castShadow = true;

  const trunkColors = new Float32Array(count * 3);
  const canopyColors = new Float32Array(count * 3);
  const dummy = new THREE.Object3D();
  let placed = 0;

  for (let attempts = 0; attempts < count * 8 && placed < count; attempts++) {
    const x = (Math.random() - 0.5) * 115;
    const z = (Math.random() - 0.5) * 115;
    const y = terrain.getHeight(x, z);
    const slope = terrain.getSlope(x, z);

    // Strict water clearance: water level is 2.4, keep trees well above water on dry land (y >= 3.2)
    if (y < 3.2 || y > 17.5 || slope < 0.55) continue;

    // Strict exclusion 1: Waterfall canyon & plunge pool gorge
    if (Math.abs(x) < 10.5 && z < 6.0) continue;

    // Strict exclusion 2: Lake basin and shoreline (center around 12.0, 12.5)
    const distToLake = Math.hypot(x - 12.0, z - 12.5);
    if (distToLake < 14.5) continue;

    // Strict exclusion 3: Outflow stream
    if (Math.hypot(x - 20.0, z - 20.0) < 7.0) continue;

    // Trees naturally cluster on ridges and upper hillsides
    const elevChance = y > 12.0 ? 0.45 : (y > 7.0 ? 0.85 : 0.65);
    if (Math.random() > elevChance) continue;

    const scale = 0.60 + Math.random() * 0.70;
    dummy.position.set(x, y - 0.10, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();

    trunkMesh.setMatrixAt(placed, dummy.matrix);
    canopyMesh.setMatrixAt(placed, dummy.matrix);

    // Warm deep chestnut/pine bark
    const tb = 0.16 + Math.random() * 0.10;
    trunkColors[placed * 3] = tb + 0.09;
    trunkColors[placed * 3 + 1] = tb * 0.55;
    trunkColors[placed * 3 + 2] = tb * 0.28;

    // Rich varied evergreen needle tones (Norway Spruce / Blue-Green Fir)
    const isBlueSpruce = Math.random() > 0.65;
    if (isBlueSpruce) {
      canopyColors[placed * 3] = 0.08 + Math.random() * 0.05;
      canopyColors[placed * 3 + 1] = 0.28 + Math.random() * 0.12;
      canopyColors[placed * 3 + 2] = 0.18 + Math.random() * 0.08;
    } else {
      canopyColors[placed * 3] = 0.06 + Math.random() * 0.05;
      canopyColors[placed * 3 + 1] = 0.30 + Math.random() * 0.12;
      canopyColors[placed * 3 + 2] = 0.06 + Math.random() * 0.05;
    }

    placed++;
  }

  trunkMesh.count = placed;
  canopyMesh.count = placed;

  trunkMesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(trunkColors, 3));
  mergedCanopy.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(canopyColors, 3));

  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.instanceMatrix.needsUpdate = true;

  return { trunk: trunkMesh, canopy: canopyMesh };
}

// ────────────────────────────────────────────────────────────
// LUSH ALPINE MEADOW GRASS (SWAYING TUFTS)
// ────────────────────────────────────────────────────────────
function createGrass(count, terrain, sharedUniforms) {
  const grassGeo = createGrassTuftGeometry();
  const grassMat = createVegMaterial(sharedUniforms);

  const mesh = new THREE.InstancedMesh(grassGeo, grassMat, count);
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const colors = new Float32Array(count * 3);
  const dummy = new THREE.Object3D();
  let placed = 0;

  for (let attempts = 0; attempts < count * 6 && placed < count; attempts++) {
    const x = (Math.random() - 0.5) * 110;
    const z = (Math.random() - 0.5) * 110;
    const y = terrain.getHeight(x, z);
    const slope = terrain.getSlope(x, z);

    // Grass thrives on grassy slopes and dry valley meadows (well above water level 2.4)
    if (y < 2.6 || y > 11.0 || slope < 0.60) continue;

    // Keep clear of deep water in plunge pool lake and canyon
    if (Math.hypot(x - 12.0, z - 12.5) < 11.5) continue;
    if (Math.abs(x) < 9.5 && z < 4.0) continue; // waterfall gorge
    if (Math.hypot(x - 20.0, z - 20.0) < 5.5) continue; // stream

    const scaleY = 0.70 + Math.random() * 0.65;
    const scaleXZ = 0.85 + Math.random() * 0.65;

    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.set(scaleXZ, scaleY, scaleXZ);
    dummy.updateMatrix();

    mesh.setMatrixAt(placed, dummy.matrix);

    // Natural mountain grass palette: lush emeralds, sunlit chartreuse, soft meadow greens
    const tone = Math.random();
    if (tone < 0.55) {
      // Vibrant meadow green
      colors[placed * 3]     = 0.18 + Math.random() * 0.08;
      colors[placed * 3 + 1] = 0.48 + Math.random() * 0.16;
      colors[placed * 3 + 2] = 0.12 + Math.random() * 0.06;
    } else if (tone < 0.85) {
      // Golden sun-kissed grass
      colors[placed * 3]     = 0.30 + Math.random() * 0.10;
      colors[placed * 3 + 1] = 0.55 + Math.random() * 0.14;
      colors[placed * 3 + 2] = 0.14 + Math.random() * 0.06;
    } else {
      // Deep alpine fescue / wild herbs
      colors[placed * 3]     = 0.14 + Math.random() * 0.06;
      colors[placed * 3 + 1] = 0.40 + Math.random() * 0.12;
      colors[placed * 3 + 2] = 0.15 + Math.random() * 0.07;
    }

    placed++;
  }

  mesh.count = placed;
  grassGeo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
  mesh.instanceMatrix.needsUpdate = true;

  return mesh;
}

// ────────────────────────────────────────────────────────────
// ALPINE BUSHES & FLOWERING SHRUBS
// ────────────────────────────────────────────────────────────
function createBushes(count, terrain, sharedUniforms) {
  const bushGeo = new THREE.IcosahedronGeometry(0.42, 1).toNonIndexed();
  const pos = bushGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const wobble = 0.82 + Math.random() * 0.38;
    pos.setXYZ(i, x * wobble, y * wobble * 0.72, z * wobble);
  }
  bushGeo.computeVertexNormals();
  bushGeo.translate(0, 0.28, 0);

  const mat = createVegMaterial(sharedUniforms);
  const mesh = new THREE.InstancedMesh(bushGeo, mat, count);
  mesh.castShadow = true;

  const colors = new Float32Array(count * 3);
  const dummy = new THREE.Object3D();
  let placed = 0;

  for (let attempts = 0; attempts < count * 4 && placed < count; attempts++) {
    const x = (Math.random() - 0.5) * 105;
    const z = (Math.random() - 0.5) * 105;
    const y = terrain.getHeight(x, z);
    const slope = terrain.getSlope(x, z);

    // Keep bushes on dry land (y >= 2.9) and out of water
    if (y < 2.9 || y > 14.0 || slope < 0.65) continue;
    if (Math.abs(x) < 9.5 && z < 4.0) continue; // Clear waterfall
    if (Math.hypot(x - 12.0, z - 12.5) < 13.0) continue; // Clear lake basin
    if (Math.hypot(x - 20.0, z - 20.0) < 6.0) continue; // Clear stream

    const scale = 0.40 + Math.random() * 0.55;
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();

    mesh.setMatrixAt(placed, dummy.matrix);

    const isFlowering = Math.random() > 0.75;
    if (isFlowering) {
      colors[placed * 3]     = 0.45 + Math.random() * 0.15; // Golden buttercup bloom
      colors[placed * 3 + 1] = 0.48 + Math.random() * 0.12;
      colors[placed * 3 + 2] = 0.16 + Math.random() * 0.08;
    } else {
      colors[placed * 3]     = 0.12 + Math.random() * 0.08;
      colors[placed * 3 + 1] = 0.38 + Math.random() * 0.15;
      colors[placed * 3 + 2] = 0.08 + Math.random() * 0.06;
    }

    placed++;
  }

  mesh.count = placed;
  bushGeo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
  mesh.instanceMatrix.needsUpdate = true;

  return mesh;
}

// ────────────────────────────────────────────────────────────
// GEOMETRY & SHADER HELPERS
// ────────────────────────────────────────────────────────────
function createGrassTuftGeometry() {
  const geometries = [];
  // 3 intersecting curved blades at 0, 60, 120 degrees
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI) / 3;
    const bladeGeo = new THREE.PlaneGeometry(0.18, 0.68, 1, 2);
    bladeGeo.translate(0, 0.34, 0);

    // Taper tip and curve forward
    const pos = bladeGeo.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const py = pos.getY(j);
      if (py > 0.40) {
        pos.setX(j, pos.getX(j) * 0.30);
        pos.setZ(j, pos.getZ(j) + (py - 0.40) * 0.25);
      }
    }
    bladeGeo.computeVertexNormals();
    bladeGeo.rotateY(angle);
    geometries.push(bladeGeo);
  }
  return mergeGeometries(geometries);
}

function createVegMaterial(sharedUniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: vegVert,
    fragmentShader: vegFrag,
    uniforms: { ...sharedUniforms },
    side: THREE.DoubleSide,
  });
}

function makeCone(radius, height, segments, x, y) {
  const geo = new THREE.ConeGeometry(radius, height, segments, 1);
  geo.translate(x, y, 0);
  return geo;
}

function mergeGeometries(geometries) {
  const merged = new THREE.BufferGeometry();
  // Crucial: convert to non-indexed so vertices form contiguous triangles
  const prepared = geometries.map((g) => (g.index ? g.toNonIndexed() : g.clone()));

  let totalVerts = 0;
  for (const g of prepared) totalVerts += g.attributes.position.count;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  let offset = 0;

  for (const g of prepared) {
    const p = g.attributes.position;
    g.computeVertexNormals();
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      positions[(offset + i) * 3] = p.getX(i);
      positions[(offset + i) * 3 + 1] = p.getY(i);
      positions[(offset + i) * 3 + 2] = p.getZ(i);
      normals[(offset + i) * 3] = n.getX(i);
      normals[(offset + i) * 3 + 1] = n.getY(i);
      normals[(offset + i) * 3 + 2] = n.getZ(i);
    }
    offset += p.count;
  }

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return merged;
}
