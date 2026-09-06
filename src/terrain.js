import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import terrainVert from './shaders/terrain.vert';
import terrainFrag from './shaders/terrain.frag';

// Seeded PRNG for stable, reproducible mountain architecture
function mulberry32(a) {
  return function() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a procedural mountain terrain with simplex-noise heightmap
 * featuring a carved waterfall gorge, plunge pool basin, and outflow river.
 */
export function createTerrain(uniforms) {
  const size = 120;
  const segments = 200;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const prng = mulberry32(108);
  const noise2D = createNoise2D(prng);
  const positions = geometry.attributes.position;
  const heightData = [];

  // Multi-octave FBM for base mountain slopes
  function fbm(x, z) {
    let value = 0;
    let amplitude = 1;
    let frequency = 0.012;
    const octaves = 7;
    const lacunarity = 2.1;
    const persistence = 0.48;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise2D(x * frequency, z * frequency);
      frequency *= lacunarity;
      amplitude *= persistence;
    }
    return value;
  }

  // Ridge noise for sharp peaks
  function ridgeNoise(x, z) {
    let value = 0;
    let amplitude = 1;
    let frequency = 0.008;
    const octaves = 5;

    for (let i = 0; i < octaves; i++) {
      let n = noise2D(x * frequency, z * frequency);
      n = 1.0 - Math.abs(n);
      value += amplitude * n * n;
      frequency *= 2.2;
      amplitude *= 0.45;
    }
    return value;
  }

  // Waterfall layout coordinates (enlarged majestic scale)
  const waterfallConfig = {
    cliffTop: new THREE.Vector3(0.0, 17.5, 0.5),
    cascadeMid: new THREE.Vector3(4.5, 10.0, 4.8),
    impactPoint: new THREE.Vector3(8.0, 2.4, 8.5),
    poolCenter: new THREE.Vector3(12.0, 2.4, 12.5),
    poolRadius: 9.5,
    waterLevel: 2.4,
  };

  // Displace vertices and carve the waterfall gorge & basin
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    // 1. Natural mountain formula
    const base = fbm(x, z) * 12;
    const ridges = ridgeNoise(x + 200, z + 200) * 16;
    const distFromCenter = Math.sqrt(x * x + z * z) / (size * 0.5);
    const centralMask = Math.max(0, 1.0 - distFromCenter * 0.8);
    const centralBoost = centralMask * centralMask * 8;
    const edgeFalloff = Math.max(0, 1.0 - Math.pow(distFromCenter, 3));

    let height = (base + ridges + centralBoost) * edgeFalloff;

    // Valley meadow baseline
    height = Math.max(height, -1.5);

    // 2. Sculpt Plunge Pool Basin (enlarged alpine lake)
    const poolDist = Math.hypot(x - waterfallConfig.poolCenter.x, z - waterfallConfig.poolCenter.z);
    const poolR = waterfallConfig.poolRadius;

    if (poolDist < poolR) {
      // Concave bowl: deep in center (y=0.8), sloping up to the water level (y=2.4) at rim
      const bowl = 0.8 + Math.pow(poolDist / poolR, 1.8) * 1.6;
      height = Math.min(height, bowl);
    } else if (poolDist < poolR + 3.5) {
      // Gentle blend from pool rim to surrounding meadow
      const t = (poolDist - poolR) / 3.5;
      height = Math.min(height, 2.4 + t * (height - 2.4));
    }

    // 3. Sculpt Waterfall Gorge Channel (wide canyon)
    const p0 = { x: waterfallConfig.cliffTop.x, z: waterfallConfig.cliffTop.z };
    const p1 = { x: waterfallConfig.impactPoint.x, z: waterfallConfig.impactPoint.z };
    const dx = p1.x - p0.x;
    const dz = p1.z - p0.z;
    const lenSq = dx * dx + dz * dz;

    const tGorge = Math.max(0, Math.min(1, ((x - p0.x) * dx + (z - p0.z) * dz) / lenSq));
    const projX = p0.x + tGorge * dx;
    const projZ = p0.z + tGorge * dz;
    const distToGorge = Math.hypot(x - projX, z - projZ);

    const gorgeWidth = 7.2;
    if (distToGorge < gorgeWidth) {
      // Cliff drop along the wide gorge
      const gorgeFloor = 17.5 - tGorge * 15.8;
      const wallRise = Math.pow(distToGorge / gorgeWidth, 2.0) * 6.0;
      const gorgeShape = gorgeFloor + wallRise;
      height = Math.min(height, gorgeShape);
    }

    // 4. Outflow Stream (from pool edge winding into valley)
    const streamDist = Math.hypot(x - 20.0, z - 20.0);
    if (streamDist < 3.5 && x > 17.0 && z > 17.0) {
      height = Math.min(height, 2.15);
    }

    positions.setY(i, height);
    heightData.push({ x, z, y: height });
  }

  geometry.computeVertexNormals();

  // Custom shader material for splat-map texturing
  const material = new THREE.ShaderMaterial({
    vertexShader: terrainVert,
    fragmentShader: terrainFrag,
    uniforms: {
      uSunDirection: uniforms.uSunDirection,
      uSunColor: uniforms.uSunColor,
      uAmbientColor: uniforms.uAmbientColor,
      uFogDensity: uniforms.uFogDensity,
      uFogColor: uniforms.uFogColor,
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  return { mesh, heightData, geometry, getHeight, getSlope, waterfallConfig };

  /**
   * Sample terrain height at any (x, z) world coordinate.
   */
  function getHeight(wx, wz) {
    const halfSize = size / 2;
    const gx = ((wx + halfSize) / size) * segments;
    const gz = ((wz + halfSize) / size) * segments;

    const ix = Math.max(0, Math.min(segments, Math.round(gx)));
    const iz = Math.max(0, Math.min(segments, Math.round(gz)));

    const idx = iz * (segments + 1) + ix;
    if (idx < 0 || idx >= positions.count) return 0;
    return positions.getY(idx);
  }

  /**
   * Estimate slope at (x, z) by sampling nearby heights.
   */
  function getSlope(wx, wz) {
    const d = 0.8;
    const hC = getHeight(wx, wz);
    const hR = getHeight(wx + d, wz);
    const hF = getHeight(wx, wz + d);
    const dx = hR - hC;
    const dz = hF - hC;
    const slopeVec = new THREE.Vector3(-dx, d, -dz).normalize();
    return slopeVec.dot(new THREE.Vector3(0, 1, 0));
  }
}
