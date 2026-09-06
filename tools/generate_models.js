import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Node.js FileReader polyfill for GLTFExporter binary export
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../public/models');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const exporter = new GLTFExporter();

function exportGlb(name, object) {
  return new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (gltf) => {
        const filePath = path.join(outputDir, `${name}.glb`);
        fs.writeFileSync(filePath, Buffer.from(gltf));
        console.log(`[GLB Export] Saved ${name}.glb (${gltf.byteLength} bytes) -> ${filePath}`);
        resolve(filePath);
      },
      (err) => {
        console.error(`[GLB Export Error] ${name}:`, err);
        reject(err);
      },
      { binary: true }
    );
  });
}

// ────────────────────────────────────────────────────────────
// 1. RUSTIC TIMBER OBSERVATION BRIDGE
// ────────────────────────────────────────────────────────────
function createWoodenBridgeModel() {
  const bridge = new THREE.Group();
  bridge.name = 'Wooden_Bridge';

  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    roughness: 0.85,
    metalness: 0.05,
    name: 'Weathered_Timber',
  });

  const plankMat = new THREE.MeshStandardMaterial({
    color: 0x4a3627,
    roughness: 0.78,
    metalness: 0.05,
    name: 'Timber_Planks',
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x736752,
    roughness: 0.95,
    metalness: 0.0,
    name: 'Hemp_Rope',
  });

  const length = 13.5;
  const width = 3.2;
  const plankCount = 28;

  // Deck Planks
  for (let i = 0; i < plankCount; i++) {
    const t = i / (plankCount - 1);
    const z = (t - 0.5) * length;
    const archY = Math.sin(t * Math.PI) * 0.42;

    const plankGeo = new THREE.BoxGeometry(width, 0.14, 0.42);
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set(0, archY, z);
    plank.rotation.x = Math.cos(t * Math.PI) * -0.10;
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridge.add(plank);
  }

  // Dual Arched Stringers
  for (const side of [-1, 1]) {
    const stringerPoints = [];
    for (let s = 0; s <= 12; s++) {
      const st = s / 12;
      const sz = (st - 0.5) * (length + 0.4);
      const sy = Math.sin(st * Math.PI) * 0.42 - 0.12;
      stringerPoints.push(new THREE.Vector3(side * (width * 0.5 - 0.15), sy, sz));
    }
    const stringerCurve = new THREE.CatmullRomCurve3(stringerPoints);
    const stringerGeo = new THREE.TubeGeometry(stringerCurve, 16, 0.16, 6, false);
    const stringer = new THREE.Mesh(stringerGeo, timberMat);
    stringer.castShadow = true;
    bridge.add(stringer);
  }

  // Handrail Posts & Rope
  for (const side of [-1, 1]) {
    const postCount = 7;
    const ropePoints = [];

    for (let p = 0; p < postCount; p++) {
      const pt = p / (postCount - 1);
      const pz = (pt - 0.5) * (length - 0.6);
      const py = Math.sin(pt * Math.PI) * 0.42;
      const px = side * (width * 0.5 - 0.12);

      const postGeo = new THREE.CylinderGeometry(0.07, 0.085, 1.15, 6);
      const post = new THREE.Mesh(postGeo, timberMat);
      post.position.set(px, py + 0.58, pz);
      post.castShadow = true;
      bridge.add(post);

      ropePoints.push(new THREE.Vector3(px, py + 1.10, pz));
    }

    const ropeCurve = new THREE.CatmullRomCurve3(ropePoints);
    const ropeGeo = new THREE.TubeGeometry(ropeCurve, 24, 0.045, 6, false);
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.castShadow = true;
    bridge.add(rope);
  }

  // Bedrock Support Stilts
  for (const zOffset of [-3.8, 3.8]) {
    for (const side of [-1, 1]) {
      const stiltGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.2, 6);
      const stilt = new THREE.Mesh(stiltGeo, timberMat);
      stilt.position.set(side * 1.3, -1.2, zOffset);
      stilt.castShadow = true;
      bridge.add(stilt);
    }
  }

  return bridge;
}

// ────────────────────────────────────────────────────────────
// 2. MAJESTIC ROYAL RED DEER STAG
// ────────────────────────────────────────────────────────────
function createDeerModel() {
  const stag = new THREE.Group();
  stag.name = 'Red_Deer_Stag';

  const furDorsalMat = new THREE.MeshStandardMaterial({
    color: 0x6e3b1c, // Deep chestnut dorsal coat
    roughness: 0.85,
    metalness: 0.0,
    name: 'Fur_Chestnut',
  });

  const furFlankMat = new THREE.MeshStandardMaterial({
    color: 0x854a24, // Warm flank coat
    roughness: 0.82,
    metalness: 0.0,
    name: 'Fur_Flank',
  });

  const antlerMat = new THREE.MeshStandardMaterial({
    color: 0xc4b59c, // Weathered antler bone
    roughness: 0.65,
    metalness: 0.02,
    name: 'Antler_Bone',
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x221611,
    roughness: 0.5,
    metalness: 0.1,
    name: 'Dark_Accent',
  });

  // Torso & Chest
  const chestGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.95, 10);
  chestGeo.rotateZ(Math.PI / 2);
  const chest = new THREE.Mesh(chestGeo, furDorsalMat);
  chest.position.set(0.35, 1.45, 0);
  stag.add(chest);

  const flankGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.85, 10);
  flankGeo.rotateZ(Math.PI / 2);
  const flank = new THREE.Mesh(flankGeo, furFlankMat);
  flank.position.set(-0.15, 1.45, 0);
  stag.add(flank);

  const hipGeo = new THREE.SphereGeometry(0.38, 8, 8);
  const hip = new THREE.Mesh(hipGeo, furDorsalMat);
  hip.position.set(-0.62, 1.48, 0);
  stag.add(hip);

  // Neck & Head
  const neckGeo = new THREE.CylinderGeometry(0.18, 0.32, 0.92, 8);
  neckGeo.rotateZ(-Math.PI / 4.2);
  const neck = new THREE.Mesh(neckGeo, furFlankMat);
  neck.position.set(0.72, 1.88, 0);
  stag.add(neck);

  const skullGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const skull = new THREE.Mesh(skullGeo, furDorsalMat);
  skull.position.set(1.10, 2.25, 0);
  stag.add(skull);

  const muzzleGeo = new THREE.ConeGeometry(0.12, 0.42, 8);
  muzzleGeo.rotateZ(-Math.PI / 2.3);
  const muzzle = new THREE.Mesh(muzzleGeo, furFlankMat);
  muzzle.position.set(1.34, 2.20, 0);
  stag.add(muzzle);

  // Magnificent Branching Antlers
  for (const side of [-1, 1]) {
    const beamPoints = [
      new THREE.Vector3(1.08, 2.38, side * 0.08),
      new THREE.Vector3(1.16, 2.66, side * 0.22),
      new THREE.Vector3(1.00, 3.03, side * 0.38),
      new THREE.Vector3(0.73, 3.43, side * 0.42),
      new THREE.Vector3(0.60, 3.70, side * 0.32),
    ];
    const beamCurve = new THREE.CatmullRomCurve3(beamPoints);
    const beamGeo = new THREE.TubeGeometry(beamCurve, 12, 0.038, 5, false);
    const beam = new THREE.Mesh(beamGeo, antlerMat);
    stag.add(beam);

    // Brow tine
    const browPoints = [
      new THREE.Vector3(1.13, 2.62, side * 0.18),
      new THREE.Vector3(1.36, 2.80, side * 0.22),
    ];
    const browCurve = new THREE.CatmullRomCurve3(browPoints);
    const browGeo = new THREE.TubeGeometry(browCurve, 6, 0.026, 4, false);
    const brow = new THREE.Mesh(browGeo, antlerMat);
    stag.add(brow);
  }

  // 4 Legs
  const legCoords = [
    { x: 0.48, z: 0.22 },
    { x: 0.48, z: -0.22 },
    { x: -0.56, z: 0.25 },
    { x: -0.56, z: -0.25 },
  ];

  for (const lc of legCoords) {
    const upperGeo = new THREE.CylinderGeometry(0.09, 0.065, 0.65, 6);
    const upper = new THREE.Mesh(upperGeo, furFlankMat);
    upper.position.set(lc.x, 1.10, lc.z);
    stag.add(upper);

    const lowerGeo = new THREE.CylinderGeometry(0.055, 0.042, 0.68, 6);
    const lower = new THREE.Mesh(lowerGeo, furFlankMat);
    lower.position.set(lc.x, 0.44, lc.z);
    stag.add(lower);

    const hoofGeo = new THREE.BoxGeometry(0.10, 0.10, 0.08);
    const hoof = new THREE.Mesh(hoofGeo, darkMat);
    hoof.position.set(lc.x + 0.02, 0.05, lc.z);
    stag.add(hoof);
  }

  return stag;
}

// ────────────────────────────────────────────────────────────
// 3. SOARING GOLDEN EAGLE
// ────────────────────────────────────────────────────────────
function createEagleModel() {
  const eagle = new THREE.Group();
  eagle.name = 'Golden_Eagle';

  const featherDark = new THREE.MeshStandardMaterial({
    color: 0x2b1e16,
    roughness: 0.75,
    name: 'Feathers_Dark',
  });

  const featherGold = new THREE.MeshStandardMaterial({
    color: 0x8a6229,
    roughness: 0.70,
    name: 'Feathers_Golden',
  });

  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xd69929,
    roughness: 0.35,
    name: 'Beak_Gold',
  });

  // Torso
  const bodyGeo = new THREE.ConeGeometry(0.24, 0.82, 8);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, featherDark);
  eagle.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const head = new THREE.Mesh(headGeo, featherGold);
  head.position.set(0, 0.08, 0.48);
  eagle.add(head);

  // Hooked Beak
  const beakGeo = new THREE.ConeGeometry(0.06, 0.16, 6);
  beakGeo.rotateX(Math.PI / 2.2);
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, 0.04, 0.62);
  eagle.add(beak);

  // Broad Soaring Wings
  for (const side of [-1, 1]) {
    const wingGeo = new THREE.BoxGeometry(1.6, 0.04, 0.55);
    const wing = new THREE.Mesh(wingGeo, featherDark);
    wing.position.set(side * 0.95, 0.05, 0.08);
    wing.rotation.z = side * -0.08;
    eagle.add(wing);

    // Primary flight feathers
    const tipGeo = new THREE.BoxGeometry(0.7, 0.03, 0.38);
    const tip = new THREE.Mesh(tipGeo, featherGold);
    tip.position.set(side * 2.05, 0.12, 0.02);
    tip.rotation.z = side * -0.15;
    eagle.add(tip);
  }

  // Fan Tail
  const tailGeo = new THREE.BoxGeometry(0.48, 0.03, 0.52);
  const tail = new THREE.Mesh(tailGeo, featherDark);
  tail.position.set(0, 0.02, -0.58);
  eagle.add(tail);

  return eagle;
}

// ────────────────────────────────────────────────────────────
// 4. ALPINE NORWAY SPRUCE (PINE TREE)
// ────────────────────────────────────────────────────────────
function createAlpinePineModel() {
  const tree = new THREE.Group();
  tree.name = 'Alpine_Norway_Spruce';

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x382417,
    roughness: 0.90,
    name: 'Pine_Bark',
  });

  const needleMat = new THREE.MeshStandardMaterial({
    color: 0x1d4624,
    roughness: 0.75,
    name: 'Pine_Needles',
  });

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.22, 1.8, 8);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.set(0, 0.9, 0);
  tree.add(trunk);

  const tiers = [
    { r: 1.8, h: 2.0, y: 1.5 },
    { r: 1.45, h: 1.8, y: 2.5 },
    { r: 1.10, h: 1.5, y: 3.4 },
    { r: 0.65, h: 1.3, y: 4.2 },
  ];

  for (const t of tiers) {
    const coneGeo = new THREE.ConeGeometry(t.r, t.h, 8);
    const cone = new THREE.Mesh(coneGeo, needleMat);
    cone.position.set(0, t.y, 0);
    tree.add(cone);
  }

  return tree;
}

// ────────────────────────────────────────────────────────────
// RUN EXPORT PIPELINE
// ────────────────────────────────────────────────────────────
async function run() {
  console.log('[GLB Export] Starting WebGL & Blender GLB Asset Generation...');

  await exportGlb('wooden_bridge', createWoodenBridgeModel());
  await exportGlb('red_deer_stag', createDeerModel());
  await exportGlb('golden_eagle', createEagleModel());
  await exportGlb('alpine_pine', createAlpinePineModel());

  console.log('[GLB Export] All 4 production .glb assets successfully compiled and ready!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
