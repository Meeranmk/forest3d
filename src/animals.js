import * as THREE from 'three';
import animalVert from './shaders/animal.vert';
import animalFrag from './shaders/animal.frag';

/**
 * Creates realistic alpine wildlife: Noble Red Deer stags, does, and fawns
 * with natural anatomical proportions, fur pelt shading, and lifelike grazing/alert animations.
 */
export function createAnimals(terrain, sharedUniforms) {
  const group = new THREE.Group();
  group.name = 'wildlife';

  const material = new THREE.ShaderMaterial({
    vertexShader: animalVert,
    fragmentShader: animalFrag,
    uniforms: {
      uSunDirection: sharedUniforms.uSunDirection,
      uSunColor: sharedUniforms.uSunColor,
      uAmbientColor: sharedUniforms.uAmbientColor,
      uFogDensity: sharedUniforms.uFogDensity,
      uFogColor: sharedUniforms.uFogColor,
    },
    side: THREE.FrontSide,
  });

  const animatedAnimals = [];

  // Helper to color geometry vertices
  function applyColor(geo, hex) {
    const color = new THREE.Color(hex);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  // ──────────────────────────────────────────────────────────
  // REALISTIC DEER BUILDER (STAG / DOE / FAWN)
  // ──────────────────────────────────────────────────────────
  function createDeer({ scale = 1.0, isBuck = false, isFawn = false }) {
    const deer = new THREE.Group();
    deer.name = isBuck ? 'deer_stag' : (isFawn ? 'deer_fawn' : 'deer_doe');
    deer.scale.setScalar(scale);

    // Realistic Deer Coat Palette
    const coatDorsal = isFawn ? 0x9e5828 : (isBuck ? 0x6e3b1c : 0x7c4522); // Deep chestnut spine
    const coatFlank  = isFawn ? 0xb56c33 : (isBuck ? 0x854a24 : 0x93562a); // Golden-fawn flank
    const coatBelly  = 0xd9c5a7; // Soft cream underbelly & throat
    const coatRump   = 0xf0e6d6; // Creamy white rump patch ("mirror")
    const darkAccent = 0x241812; // Dark muzzle, hooves, eye rim
    const antlerBone = 0xc2b39a; // Antler bone
    const antlerBurr = 0x6e5942; // Dark base burr

    // ── 1. Unified Body Rig (Torso, Neck, Legs move in biological harmony) ──
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, 1.45, 0);

    const torso = new THREE.Group();
    torso.position.set(0, 0, 0);

    // Chest & Ribcage (deep, muscular front)
    const chestGeo = applyColor(new THREE.CylinderGeometry(0.38, 0.44, 0.95, 12), coatDorsal);
    chestGeo.rotateZ(Math.PI / 2);
    const chest = new THREE.Mesh(chestGeo, material);
    chest.position.set(0.35, 0.05, 0);
    chest.scale.set(1.0, 1.15, 0.9);
    chest.castShadow = true;
    torso.add(chest);

    // Withers / Shoulder Arch
    const withersGeo = applyColor(new THREE.SphereGeometry(0.34, 10, 8), coatDorsal);
    withersGeo.scale(1.1, 1.2, 0.85);
    const withers = new THREE.Mesh(withersGeo, material);
    withers.position.set(0.48, 0.22, 0);
    withers.castShadow = true;
    torso.add(withers);

    // Midsection & Flank
    const flankGeo = applyColor(new THREE.CylinderGeometry(0.35, 0.38, 0.85, 12), coatFlank);
    flankGeo.rotateZ(Math.PI / 2);
    const flank = new THREE.Mesh(flankGeo, material);
    flank.position.set(-0.15, 0.02, 0);
    flank.scale.set(0.95, 0.98, 0.82);
    flank.castShadow = true;
    torso.add(flank);

    // Hindquarters & Hips
    const hipGeo = applyColor(new THREE.SphereGeometry(0.38, 10, 8), coatDorsal);
    hipGeo.scale(1.1, 1.05, 0.88);
    const hips = new THREE.Mesh(hipGeo, material);
    hips.position.set(-0.62, 0.08, 0);
    hips.castShadow = true;
    torso.add(hips);

    // Cream Rump Patch
    const rumpGeo = applyColor(new THREE.SphereGeometry(0.24, 8, 6), coatRump);
    rumpGeo.scale(0.8, 0.9, 0.95);
    const rump = new THREE.Mesh(rumpGeo, material);
    rump.position.set(-0.85, 0.12, 0);
    torso.add(rump);

    // Tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-0.92, 0.16, 0);
    const tailGeo = applyColor(new THREE.ConeGeometry(0.08, 0.32, 6), coatDorsal);
    tailGeo.rotateZ(Math.PI / 3);
    const tail = new THREE.Mesh(tailGeo, material);
    tail.position.set(-0.1, -0.08, 0);
    tailPivot.add(tail);
    torso.add(tailPivot);

    bodyGroup.add(torso);

    // ── 2. Neck & Head Pivot (Articulated for Grazing & Alert Watching) ──
    const neckBasePivot = new THREE.Group();
    neckBasePivot.position.set(0.68, 0.17, 0);

    // Arched graceful neck
    const neckGeo = applyColor(new THREE.CylinderGeometry(0.18, 0.32, 0.92, 10), coatFlank);
    neckGeo.rotateZ(-Math.PI / 4.2);
    const neck = new THREE.Mesh(neckGeo, material);
    neck.position.set(0.26, 0.32, 0);
    neck.scale.set(0.88, 1.0, 0.82);
    neck.castShadow = true;
    neckBasePivot.add(neck);

    // Cream throat patch
    const throatGeo = applyColor(new THREE.CylinderGeometry(0.14, 0.22, 0.7, 8), coatBelly);
    throatGeo.rotateZ(-Math.PI / 4.2);
    const throat = new THREE.Mesh(throatGeo, material);
    throat.position.set(0.24, 0.26, 0);
    throat.scale.set(0.82, 0.95, 0.7);
    neckBasePivot.add(throat);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0.55, 0.68, 0);

    // Skull
    const skullGeo = applyColor(new THREE.SphereGeometry(0.18, 8, 8), coatDorsal);
    skullGeo.scale(1.2, 1.0, 0.85);
    const skull = new THREE.Mesh(skullGeo, material);
    skull.position.set(0, 0.05, 0);
    skull.castShadow = true;
    headGroup.add(skull);

    // Tapered Muzzle & Jaw
    const muzzleGeo = applyColor(new THREE.ConeGeometry(0.12, 0.42, 8), coatFlank);
    muzzleGeo.rotateZ(-Math.PI / 2.3);
    const muzzle = new THREE.Mesh(muzzleGeo, material);
    muzzle.position.set(0.24, -0.04, 0);
    muzzle.scale.set(0.8, 1.0, 0.75);
    muzzle.castShadow = true;
    headGroup.add(muzzle);

    // Dark Nose & Lip Tip
    const noseGeo = applyColor(new THREE.SphereGeometry(0.065, 6, 6), darkAccent);
    const nose = new THREE.Mesh(noseGeo, material);
    nose.position.set(0.42, -0.11, 0);
    headGroup.add(nose);

    // Dark Glassy Eyes
    for (const side of [-0.14, 0.14]) {
      const eyeGeo = applyColor(new THREE.SphereGeometry(0.045, 6, 6), darkAccent);
      const eye = new THREE.Mesh(eyeGeo, material);
      eye.position.set(0.08, 0.08, side);
      headGroup.add(eye);
    }

    // Alert Swiveling Ears
    const leftEarPivot = new THREE.Group();
    leftEarPivot.position.set(-0.06, 0.16, 0.12);
    const earGeo = applyColor(new THREE.ConeGeometry(0.07, 0.32, 6), coatFlank);
    earGeo.rotateX(0.45);
    earGeo.scale(0.8, 1.0, 0.35);
    const leftEar = new THREE.Mesh(earGeo, material);
    leftEar.position.set(0, 0.12, 0.06);
    leftEarPivot.add(leftEar);
    headGroup.add(leftEarPivot);

    const rightEarPivot = new THREE.Group();
    rightEarPivot.position.set(-0.06, 0.16, -0.12);
    const rightEar = leftEar.clone();
    rightEar.rotation.x = -0.9;
    rightEarPivot.add(rightEar);
    headGroup.add(rightEarPivot);

    // ── Antlers (Magnificent Branching Crown for Bucks) ──
    if (isBuck) {
      const antlerGroup = new THREE.Group();
      antlerGroup.position.set(-0.02, 0.18, 0);

      for (const side of [-1, 1]) {
        const sideGroup = new THREE.Group();

        // Main sweeping beam curving backward and upward
        const beamPoints = [
          new THREE.Vector3(0, 0, side * 0.08),
          new THREE.Vector3(0.08, 0.28, side * 0.22),
          new THREE.Vector3(-0.08, 0.65, side * 0.38),
          new THREE.Vector3(-0.35, 1.05, side * 0.42),
          new THREE.Vector3(-0.48, 1.32, side * 0.32),
        ];
        const beamCurve = new THREE.CatmullRomCurve3(beamPoints);
        const beamGeo = applyColor(new THREE.TubeGeometry(beamCurve, 16, 0.038, 6, false), antlerBone);
        const beamMesh = new THREE.Mesh(beamGeo, material);
        beamMesh.castShadow = true;
        sideGroup.add(beamMesh);

        // Brow Tine (sharp forward-pointing prong)
        const browPoints = [
          new THREE.Vector3(0.05, 0.24, side * 0.18),
          new THREE.Vector3(0.28, 0.42, side * 0.22),
        ];
        const browCurve = new THREE.CatmullRomCurve3(browPoints);
        const browGeo = applyColor(new THREE.TubeGeometry(browCurve, 6, 0.028, 5, false), antlerBone);
        const browMesh = new THREE.Mesh(browGeo, material);
        sideGroup.add(browMesh);

        // Royal/Crown Tine (branching point near top)
        const royalPoints = [
          new THREE.Vector3(-0.25, 0.95, side * 0.40),
          new THREE.Vector3(-0.18, 1.25, side * 0.52),
        ];
        const royalCurve = new THREE.CatmullRomCurve3(royalPoints);
        const royalGeo = applyColor(new THREE.TubeGeometry(royalCurve, 6, 0.024, 5, false), antlerBone);
        const royalMesh = new THREE.Mesh(royalGeo, material);
        sideGroup.add(royalMesh);

        antlerGroup.add(sideGroup);
      }
      headGroup.add(antlerGroup);
    }

    neckBasePivot.add(headGroup);
    bodyGroup.add(neckBasePivot);

    // ── 3. Slender Articulated Legs & Hooves ──
    const legs = [];
    const legConfigs = [
      { name: 'FL', x: 0.48, z: 0.22, isFront: true },
      { name: 'FR', x: 0.48, z: -0.22, isFront: true },
      { name: 'BL', x: -0.56, z: 0.25, isFront: false },
      { name: 'BR', x: -0.56, z: -0.25, isFront: false },
    ];

    for (const cfg of legConfigs) {
      const legRoot = new THREE.Group();
      legRoot.position.set(cfg.x, -0.03, cfg.z);

      // Thigh / Upper Arm (muscular)
      const upperGeo = applyColor(new THREE.CylinderGeometry(0.10, 0.07, 0.65, 8), coatFlank);
      const upper = new THREE.Mesh(upperGeo, material);
      upper.position.set(0, -0.32, 0);
      upper.castShadow = true;
      legRoot.add(upper);

      // Knee / Hock Joint Pivot
      const jointPivot = new THREE.Group();
      jointPivot.position.set(0, -0.65, 0);

      // Cannon Bone (slender lower leg)
      const lowerGeo = applyColor(new THREE.CylinderGeometry(0.06, 0.045, 0.68, 8), coatFlank);
      const lower = new THREE.Mesh(lowerGeo, material);
      lower.position.set(0, -0.34, 0);
      lower.castShadow = true;
      jointPivot.add(lower);

      // Cleft Hoof
      const hoofGeo = applyColor(new THREE.BoxGeometry(0.11, 0.12, 0.09), darkAccent);
      const hoof = new THREE.Mesh(hoofGeo, material);
      hoof.position.set(0.02, -0.72, 0);
      hoof.castShadow = true;
      jointPivot.add(hoof);

      legRoot.add(jointPivot);
      bodyGroup.add(legRoot);

      legs.push({ name: cfg.name, root: legRoot, joint: jointPivot, isFront: cfg.isFront });
    }

    deer.add(bodyGroup);

    const deerData = {
      group: deer,
      bodyGroup,
      torso,
      neckBasePivot,
      headGroup,
      leftEarPivot,
      rightEarPivot,
      tailPivot,
      legs,
      isBuck,
      isFawn,
      animOffset: Math.random() * 20.0,
      grazeCycle: Math.random() * Math.PI * 2,
      // Fleeing state
      isFleeing: false,
      fleeTimer: 0,
      fleeDuration: 4.8,
      fleeSpeed: 11.5,
      fleeDir: new THREE.Vector3(1, 0, 0),
      runPhase: 0,
      lookBackTimer: 0,
      triggerFlee: function(fromPoint) {
        if (this.isFleeing && this.fleeTimer > this.fleeDuration * 0.75) return; // already in high sprint
        this.isFleeing = true;
        this.fleeTimer = this.fleeDuration;
        this.runPhase = Math.random() * Math.PI;

        // Calculate flee direction away from the touch/camera point
        let dir = new THREE.Vector3();
        if (fromPoint) {
          dir.copy(this.group.position).sub(fromPoint).setY(0);
        }
        if (dir.lengthSq() < 0.1) {
          const angle = Math.random() * Math.PI * 2;
          dir.set(Math.cos(angle), 0, Math.sin(angle));
        } else {
          dir.normalize();
        }

        // Add a natural slight curve / variation
        dir.x += (Math.random() - 0.5) * 0.5;
        dir.z += (Math.random() - 0.5) * 0.5;
        dir.normalize();

        // Keep running within the mountain boundary
        if (this.group.position.x + dir.x * 20 > 45) dir.x = -Math.abs(dir.x);
        if (this.group.position.x + dir.x * 20 < -45) dir.x = Math.abs(dir.x);
        if (this.group.position.z + dir.z * 20 > 45) dir.z = -Math.abs(dir.z);
        if (this.group.position.z + dir.z * 20 < -45) dir.z = Math.abs(dir.z);

        this.fleeDir.copy(dir);

        // Alert nearby herd members within 12 units
        for (const other of animatedAnimals) {
          if (other !== this && !other.isFleeing) {
            const dist = this.group.position.distanceTo(other.group.position);
            if (dist < 12.0) {
              setTimeout(() => {
                other.triggerFlee(fromPoint || this.group.position);
              }, 120 + Math.random() * 220);
            }
          }
        }
      },
    };

    // Attach reference for raycasting on every mesh part
    deer.userData.deerData = deerData;
    deer.traverse((child) => {
      if (child.isMesh) {
        child.userData.deerData = deerData;
      }
    });

    return deerData;
  }

  // ──────────────────────────────────────────────────────────
  // SPAWN REALISTIC ALPINE DEER HERDS
  // ──────────────────────────────────────────────────────────
  const herdConfigs = [
    // Herd 1: Green Valley Meadow near the Stream & Lake Shore
    { x: 18.0, z: 22.0, isBuck: true, scale: 1.15, rot: 2.2 },   // Royal Stag overseeing the meadow
    { x: 15.5, z: 24.5, isBuck: false, scale: 0.98, rot: 1.6 },  // Grazing Doe in the grass
    { x: 20.2, z: 25.0, isBuck: false, scale: 0.94, rot: 2.8 },  // Doe grazing
    { x: 17.5, z: 26.5, isBuck: false, isFawn: true, scale: 0.58, rot: 2.0 }, // Playful Fawn

    // Herd 2: Valley Meadow near the Observation Bridge
    { x: -12.0, z: 24.0, isBuck: false, scale: 1.02, rot: 0.8 },  // Alert Doe
    { x: -14.5, z: 26.5, isBuck: false, scale: 0.96, rot: 1.4 },  // Grazing Doe
    { x: -9.8, z: 27.2, isBuck: true, scale: 1.12, rot: 0.3 },   // Younger Stag

    // Herd 3: Sunny Foothill Slope
    { x: -22.5, z: 16.0, isBuck: true, scale: 1.18, rot: 3.6 },  // Stag watching from the slope
    { x: -20.0, z: 18.5, isBuck: false, scale: 0.95, rot: 4.2 },  // Grazing Doe
    { x: -24.2, z: 19.8, isBuck: false, scale: 0.92, rot: 3.1 }, // Grazing Doe
  ];

  for (const cfg of herdConfigs) {
    const deer = createDeer(cfg);
    const groundY = terrain.getHeight(cfg.x, cfg.z);
    deer.group.position.set(cfg.x, groundY, cfg.z);
    deer.group.rotation.y = cfg.rot;
    group.add(deer.group);
    animatedAnimals.push(deer);
  }

  // ──────────────────────────────────────────────────────────
  // LIFELIKE ANIMAL ANIMATION & HIGH-PERFORMANCE RUNNING
  // ──────────────────────────────────────────────────────────
  function update(dt) {
    const time = (sharedUniforms.uTime ? sharedUniforms.uTime.value : performance.now() * 0.001);

    for (let i = 0; i < animatedAnimals.length; i++) {
      const animal = animatedAnimals[i];

      // ── 1. FLEEING / SPRINTING GALLOP BEHAVIOR ──
      if (animal.isFleeing) {
        animal.fleeTimer -= dt;

        // Acceleration and deceleration curve
        const timeFromStart = animal.fleeDuration - animal.fleeTimer;
        let speedMultiplier = 1.0;
        if (timeFromStart < 0.38) {
          // Explosive initial sprint burst
          speedMultiplier = 0.35 + 0.65 * (timeFromStart / 0.38);
        } else if (animal.fleeTimer < 1.0) {
          // Smooth athletic deceleration into alert halt
          speedMultiplier = Math.pow(Math.max(0, animal.fleeTimer / 1.0), 1.55);
        }

        const currentSpeed = animal.fleeSpeed * speedMultiplier;
        const currentCadence = 13.6 * (0.42 + 0.58 * speedMultiplier);
        animal.runPhase += dt * currentCadence;

        // ── Intelligent Navigation & Obstacle/Lake Avoidance ──
        // Terrain Height Probe 3.8 units ahead
        const probeDist = 3.8;
        const probeX = animal.group.position.x + animal.fleeDir.x * probeDist;
        const probeZ = animal.group.position.z + animal.fleeDir.z * probeDist;
        const probeH = terrain.getHeight(probeX, probeZ);

        // Avoid deep lake water (lake center is roughly at (18, 11))
        if (probeH < 1.35) {
          const toMeadowX = animal.group.position.x - 18.0;
          const toMeadowZ = animal.group.position.z - 11.0;
          const distL = Math.hypot(toMeadowX, toMeadowZ) || 1.0;
          animal.fleeDir.x += (toMeadowX / distL) * 0.16;
          animal.fleeDir.z += (toMeadowZ / distL) * 0.16;
        }

        // Avoid steep mountain cliffs
        if (probeH > 14.5) {
          animal.fleeDir.x -= (probeX / 45.0) * 0.14;
          animal.fleeDir.z -= (probeZ / 45.0) * 0.14;
        }

        // Soft boundary reflection
        const posX = animal.group.position.x;
        const posZ = animal.group.position.z;
        if (posX > 38.0) animal.fleeDir.x -= 0.20;
        if (posX < -38.0) animal.fleeDir.x += 0.20;
        if (posZ > 38.0) animal.fleeDir.z -= 0.20;
        if (posZ < -38.0) animal.fleeDir.z += 0.20;

        // Subtle evasive zig-zag weaving (natural cervid predator evasion)
        const evasiveSide = Math.sin(animal.runPhase * 0.38) * 0.07;
        const perpX = -animal.fleeDir.z;
        const perpZ = animal.fleeDir.x;
        animal.fleeDir.x += perpX * evasiveSide;
        animal.fleeDir.z += perpZ * evasiveSide;
        animal.fleeDir.normalize();

        // Move forward along terrain
        animal.group.position.addScaledVector(animal.fleeDir, currentSpeed * dt);

        // Correct Heading: local +X faces direction (-dz, dx)
        const targetRot = Math.atan2(-animal.fleeDir.z, animal.fleeDir.x);
        let rotDiff = targetRot - animal.group.rotation.y;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        animal.group.rotation.y += rotDiff * 0.18;

        // Dynamic banking lean into turns around local X axis
        const bankTarget = -THREE.MathUtils.clamp(rotDiff * 1.8, -0.42, 0.42) * speedMultiplier;
        animal.bodyGroup.rotation.x = THREE.MathUtils.lerp(animal.bodyGroup.rotation.x, bankTarget, 0.18);

        // ── Whole-Body Ballistic Leaping Bounds ──
        const p = animal.runPhase;
        const groundY = terrain.getHeight(animal.group.position.x, animal.group.position.z);

        // Upward parabolic leap (all 4 hooves leave ground during suspension flight)
        const leapArc = Math.max(0, Math.sin(p));
        const boundY = Math.pow(leapArc, 1.32) * 0.56 * speedMultiplier;
        // Compression upon landing for realistic tendon/muscle shock absorption
        const landingCompression = Math.max(0, -Math.sin(p)) * 0.06 * speedMultiplier;
        animal.group.position.y = groundY + boundY - landingCompression;

        // ── Spine Pitch & Dynamic Stretch/Squash ──
        // Launches upward on hind takeoff (+Z), dips down on fore landing (-Z)
        const spinePitch = Math.cos(p) * 0.24 * speedMultiplier;
        animal.bodyGroup.rotation.z = spinePitch;

        // Muscular contraction during gather phase, elongation during flight
        const spineStretch = Math.sin(p) * 0.085 * speedMultiplier;
        animal.torso.scale.set(1.0 + spineStretch, 1.0 - spineStretch * 0.7, 1.0 - spineStretch * 0.5);

        // Aerodynamic neck & head bobbing
        animal.neckBasePivot.rotation.z = -0.22 + Math.sin(p + 0.35) * 0.12 * speedMultiplier;
        animal.neckBasePivot.rotation.y = THREE.MathUtils.lerp(animal.neckBasePivot.rotation.y, rotDiff * 0.30, 0.15);
        animal.headGroup.rotation.z = 0.14 - Math.sin(p + 0.35) * 0.08 * speedMultiplier;

        // Ears pinned back in the wind
        animal.leftEarPivot.rotation.z = -0.80 * speedMultiplier;
        animal.rightEarPivot.rotation.z = 0.80 * speedMultiplier;

        // Tail flagged high in white-tail alarm
        animal.tailPivot.rotation.z = 1.15 * speedMultiplier;

        // ── 4-Beat Asymmetric Rotary Gallop Leg Articulation ──
        const legFL = animal.legs.find((l) => l.name === 'FL');
        const legFR = animal.legs.find((l) => l.name === 'FR');
        const legBL = animal.legs.find((l) => l.name === 'BL');
        const legBR = animal.legs.find((l) => l.name === 'BR');

        if (legFL && legFR && legBL && legBR) {
          // Front legs: rotary lead (FL leads FR by ~0.40 rad)
          const phiFR = p;
          const phiFL = p - 0.40;

          const fReachR = Math.sin(phiFR);
          const fReachL = Math.sin(phiFL);

          legFR.root.rotation.z = fReachR * 0.90 * speedMultiplier;
          legFL.root.rotation.z = fReachL * 0.90 * speedMultiplier;

          // Knee joints fold backwards (-Z) during rearward sweep/flight, extend on reach
          legFR.joint.rotation.z = -Math.max(0, -Math.sin(phiFR - 0.22)) * 1.50 * speedMultiplier;
          legFL.joint.rotation.z = -Math.max(0, -Math.sin(phiFL - 0.22)) * 1.50 * speedMultiplier;

          // Hind legs: strike sequentially (BR pushes first, then BL)
          const phiBR = p + Math.PI - 0.25;
          const phiBL = p + Math.PI + 0.22;

          const bReachR = -Math.sin(phiBR);
          const bReachL = -Math.sin(phiBL);

          legBR.root.rotation.z = bReachR * 1.08 * speedMultiplier;
          legBL.root.rotation.z = bReachL * 1.08 * speedMultiplier;

          // Hock joints flex forward (+Z) when gathering under belly, straighten on drive
          legBR.joint.rotation.z = Math.max(0, Math.sin(phiBR + 0.32)) * 1.30 * speedMultiplier;
          legBL.joint.rotation.z = Math.max(0, Math.sin(phiBL + 0.32)) * 1.30 * speedMultiplier;

          // Clear transverse roll on leg roots
          legFL.root.rotation.x = 0;
          legFR.root.rotation.x = 0;
          legBL.root.rotation.x = 0;
          legBR.root.rotation.x = 0;
        }

        // Flee completed -> smooth transition to alert stop
        if (animal.fleeTimer <= 0) {
          animal.isFleeing = false;
          animal.lookBackTimer = 3.2; // Stop and look back cautiously
        }
        continue;
      }

      // ── 2. POST-FLEE ALERT LOOK-BACK & SMOOTH SETTLING ──
      if (animal.lookBackTimer > 0) {
        animal.lookBackTimer -= dt;

        // Smoothly settle body group and legs without jarring snaps
        animal.bodyGroup.rotation.z = THREE.MathUtils.lerp(animal.bodyGroup.rotation.z, 0, 0.12);
        animal.bodyGroup.rotation.x = THREE.MathUtils.lerp(animal.bodyGroup.rotation.x, 0, 0.12);
        animal.torso.scale.lerp(new THREE.Vector3(1, 1, 1), 0.12);
        for (const leg of animal.legs) {
          leg.root.rotation.z = THREE.MathUtils.lerp(leg.root.rotation.z, 0, 0.15);
          leg.joint.rotation.z = THREE.MathUtils.lerp(leg.joint.rotation.z, 0, 0.15);
        }

        const groundY = terrain.getHeight(animal.group.position.x, animal.group.position.z);
        animal.group.position.y = THREE.MathUtils.lerp(animal.group.position.y, groundY, 0.15);

        // Tall alert neck
        animal.neckBasePivot.rotation.z = THREE.MathUtils.lerp(animal.neckBasePivot.rotation.z, 0.22, 0.08);
        // Look back over shoulder toward danger point
        animal.neckBasePivot.rotation.y = THREE.MathUtils.lerp(animal.neckBasePivot.rotation.y, Math.PI * 0.65, 0.08);
        animal.headGroup.rotation.z = THREE.MathUtils.lerp(animal.headGroup.rotation.z, 0.06, 0.08);

        // Ears perked forward
        animal.leftEarPivot.rotation.z = THREE.MathUtils.lerp(animal.leftEarPivot.rotation.z, 0.12, 0.1);
        animal.rightEarPivot.rotation.z = THREE.MathUtils.lerp(animal.rightEarPivot.rotation.z, -0.12, 0.1);
        animal.tailPivot.rotation.z = THREE.MathUtils.lerp(animal.tailPivot.rotation.z, 0.25, 0.08);
        continue;
      }

      // ── 3. CALM IDLE / GRAZING BEHAVIOR ──
      const t = time + animal.animOffset;
      const groundY = terrain.getHeight(animal.group.position.x, animal.group.position.z);
      animal.group.position.y = groundY;

      // Natural Breathing Rhythm
      const breath = Math.sin(t * 1.8) * 0.012;
      animal.torso.position.y = breath;
      animal.torso.scale.set(1.0, 1.0 + breath * 1.5, 1.0 + breath * 1.2);
      animal.bodyGroup.position.y = 1.45;
      animal.bodyGroup.rotation.set(0, 0, 0);

      if (animal.isBuck) {
        // Regal alert posture: scans the horizon, slowly rotates head
        const scanCycle = Math.sin(t * 0.35);
        animal.neckBasePivot.rotation.y = scanCycle * 0.42;
        animal.neckBasePivot.rotation.z = THREE.MathUtils.lerp(animal.neckBasePivot.rotation.z, 0.08 + Math.cos(t * 0.4) * 0.04, 0.05);
        animal.headGroup.rotation.z = Math.sin(t * 0.6) * 0.05;

        animal.leftEarPivot.rotation.y = Math.sin(t * 2.2) * 0.18;
        animal.rightEarPivot.rotation.y = Math.cos(t * 1.7) * 0.15;
      } else {
        // Doe / Fawn: smooth grazing cycle (neck lowers around Z down to meadow grass)
        const grazePhase = Math.sin(t * 0.3 + animal.grazeCycle);
        const isGrazing = grazePhase > -0.2;
        const targetNeckPitch = isGrazing ? -0.58 : 0.04;

        animal.neckBasePivot.rotation.z = THREE.MathUtils.lerp(
          animal.neckBasePivot.rotation.z,
          targetNeckPitch,
          0.05
        );

        if (isGrazing) {
          animal.headGroup.rotation.z = 0.18;
          animal.headGroup.rotation.x = Math.sin(t * 5.0) * 0.035; // nibbling
          animal.neckBasePivot.rotation.y = Math.sin(t * 1.2) * 0.08;
        } else {
          animal.neckBasePivot.rotation.y = Math.sin(t * 0.8) * 0.28;
          animal.headGroup.rotation.z = 0.05;
        }

        const earTwitch = Math.sin(t * 4.0) > 0.85 ? Math.sin(t * 25.0) * 0.22 : 0;
        animal.leftEarPivot.rotation.z = earTwitch;
        animal.rightEarPivot.rotation.z = -earTwitch;
      }

      // Tail Flick
      const tailFlick = Math.sin(t * 1.6) > 0.82 ? Math.sin(t * 18.0) * 0.35 : 0;
      animal.tailPivot.rotation.z = tailFlick;

      // Subtle Weight-Shift Between Legs
      const legSway = Math.sin(t * 0.9) * 0.02;
      for (const leg of animal.legs) {
        if (leg.isFront) {
          leg.root.rotation.z = legSway;
        } else {
          leg.root.rotation.z = -legSway;
        }
      }
    }
  }

  // Helper method for interaction raycasting
  function handleTouch(hitPoint, hitObject) {
    let obj = hitObject;
    while (obj && !obj.userData?.deerData) {
      obj = obj.parent;
    }
    if (obj && obj.userData.deerData) {
      obj.userData.deerData.triggerFlee(hitPoint);
      return true;
    }
    return false;
  }

  return { mesh: group, update, animatedAnimals, handleTouch };
}
