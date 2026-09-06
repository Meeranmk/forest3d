import * as THREE from 'three';

/**
 * Creates soaring mountain eagles circling in thermal updrafts
 * high above the mountain peaks.
 */
export function createEagles(scene) {
  const group = new THREE.Group();
  group.name = 'eagles-flock';

  const eagleMat = new THREE.MeshStandardMaterial({
    color: 0x2b221a, // Dark golden eagle plumage
    roughness: 0.7,
    metalness: 0.1,
    flatShading: true,
  });

  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xd4a017, // Golden yellow beak & talons
    roughness: 0.4,
    metalness: 0.2,
  });

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xeeece8, // White tail feathers and head crest
    roughness: 0.6,
  });

  const eagles = [];

  // Spawn 3 eagles circling at different altitudes and radii
  const flightPaths = [
    { center: new THREE.Vector3(2.0, 36.0, 2.0), radius: 24.0, speed: 0.28, phase: 0.0, scale: 1.1 },
    { center: new THREE.Vector3(-4.0, 44.0, -2.0), radius: 32.0, speed: -0.22, phase: 2.1, scale: 1.25 },
    { center: new THREE.Vector3(8.0, 52.0, 6.0), radius: 28.0, speed: 0.25, phase: 4.3, scale: 1.0 },
  ];

  for (const path of flightPaths) {
    const eagle = createEagleMesh(eagleMat, beakMat, whiteMat, path.scale);
    group.add(eagle.mesh);
    eagles.push({
      mesh: eagle.mesh,
      leftWing: eagle.leftWing,
      rightWing: eagle.rightWing,
      path,
      time: path.phase,
    });
  }

  scene.add(group);

  return {
    group,
    update: (dt) => {
      for (const e of eagles) {
        e.time += dt * e.path.speed;

        // Circular flight trajectory
        const angle = e.time;
        const x = e.path.center.x + Math.cos(angle) * e.path.radius;
        const z = e.path.center.z + Math.sin(angle) * e.path.radius;
        // Subtle vertical thermal drift
        const y = e.path.center.y + Math.sin(angle * 2.0) * 2.2;

        e.mesh.position.set(x, y, z);

        // Forward flight heading tangent to circle
        const tangentX = -Math.sin(angle) * Math.sign(e.path.speed);
        const tangentZ = Math.cos(angle) * Math.sign(e.path.speed);
        const heading = Math.atan2(tangentX, tangentZ);

        // Banking roll into the turn
        const bankAngle = (e.path.speed > 0 ? 0.32 : -0.32);
        e.mesh.rotation.set(0, heading, bankAngle, 'YXZ');

        // Wing flapping: primarily gliding with periodic flapping bursts
        const flapCycle = Math.sin(e.time * 6.0);
        const flapEnvelope = Math.max(0, Math.sin(e.time * 0.8) - 0.2); // occasional flaps
        const wingFlap = flapCycle * flapEnvelope * 0.45;

        e.leftWing.rotation.z = wingFlap;
        e.rightWing.rotation.z = -wingFlap;
      }
    },
  };
}

/**
 * Builds low-poly stylized eagle geometry with body, wings, tail, and beak.
 */
function createEagleMesh(bodyMat, beakMat, whiteMat, scale = 1.0) {
  const root = new THREE.Group();
  root.scale.setScalar(scale);

  // 1. Torso
  const bodyGeo = new THREE.ConeGeometry(0.35, 1.6, 5);
  bodyGeo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  root.add(body);

  // 2. Head & Neck
  const headGeo = new THREE.SphereGeometry(0.24, 6, 5);
  headGeo.scale(0.9, 1.0, 1.3);
  const head = new THREE.Mesh(headGeo, whiteMat);
  head.position.set(0, 0.12, 0.95);
  head.castShadow = true;
  root.add(head);

  // Beak
  const beakGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
  beakGeo.rotateX(Math.PI / 2);
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, 0.05, 1.32);
  root.add(beak);

  // 3. Tail Feathers
  const tailGeo = new THREE.BoxGeometry(0.7, 0.06, 0.6);
  const tail = new THREE.Mesh(tailGeo, whiteMat);
  tail.position.set(0, 0.08, -0.9);
  root.add(tail);

  // 4. Wings (Left & Right with wingtips)
  const leftWing = new THREE.Group();
  leftWing.position.set(0.28, 0.15, 0.2);
  const lWingGeo = new THREE.BoxGeometry(1.8, 0.05, 0.7);
  lWingGeo.translate(0.9, 0, 0);
  const lWingMesh = new THREE.Mesh(lWingGeo, bodyMat);
  lWingMesh.castShadow = true;
  leftWing.add(lWingMesh);
  root.add(leftWing);

  const rightWing = new THREE.Group();
  rightWing.position.set(-0.28, 0.15, 0.2);
  const rWingGeo = new THREE.BoxGeometry(1.8, 0.05, 0.7);
  rWingGeo.translate(-0.9, 0, 0);
  const rWingMesh = new THREE.Mesh(rWingGeo, bodyMat);
  rWingMesh.castShadow = true;
  rightWing.add(rWingMesh);
  root.add(rightWing);

  return { mesh: root, leftWing, rightWing };
}
