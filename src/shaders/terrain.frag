uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform float uFogDensity;
uniform vec3 uFogColor;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vElevation;
varying float vSlope;

// Simple hash noise for texture detail
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2D(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  float elev = vElevation;
  float slope = vSlope;

  // --- Procedural textures via noise ---
  vec2 detailUv = vWorldPosition.xz * 0.15;
  float detail = fbm(detailUv);
  float fineDetail = noise2D(vWorldPosition.xz * 0.8);

  // --- Base colors ---
  // Grass: rich vibrant greens
  vec3 grassDark  = vec3(0.12, 0.32, 0.06);
  vec3 grassLight = vec3(0.22, 0.50, 0.12);
  vec3 grassMeadow = vec3(0.30, 0.55, 0.15);
  vec3 grassColor = mix(grassDark, grassLight, detail * 0.7);
  grassColor = mix(grassColor, grassMeadow, fineDetail * 0.3);

  // Rock: dark earthy brown-grey (NOT white)
  vec3 rockDark  = vec3(0.22, 0.20, 0.16);
  vec3 rockLight = vec3(0.35, 0.32, 0.27);
  vec3 rockColor = mix(rockDark, rockLight, detail);
  // Moss/lichen on rocks
  vec3 mossColor = vec3(0.18, 0.30, 0.12);
  rockColor = mix(rockColor, mossColor, smoothstep(0.35, 0.6, fbm(vWorldPosition.xz * 0.25)) * 0.4);

  // Alpine meadow: lighter green-yellow at high elevations  
  vec3 alpineGreen = vec3(0.25, 0.42, 0.14);
  vec3 alpineBrown = vec3(0.30, 0.26, 0.16);

  // Snow: only at very top peaks
  vec3 snowBase = vec3(0.88, 0.92, 0.95);
  vec3 snowShadow = vec3(0.70, 0.78, 0.88);
  vec3 snowColor = mix(snowShadow, snowBase, fineDetail * 0.5 + 0.5);

  // --- Elevation-based blending ---
  // Grass dominates from low up to mid-high elevations  
  // Snow only at the very top (elev > 22)
  float snowFactor = smoothstep(22.0, 28.0, elev);
  // Rock on steep slopes
  float rockFactor = 1.0 - smoothstep(0.45, 0.75, slope);

  // Build color from bottom to top
  vec3 baseColor = grassColor;

  // Transition to alpine meadow at mid elevations
  float alpineFactor = smoothstep(8.0, 16.0, elev) * (1.0 - smoothstep(20.0, 26.0, elev));
  baseColor = mix(baseColor, alpineGreen, alpineFactor * 0.6);
  
  // Mix in some brown at higher alpine zones
  float brownFactor = smoothstep(14.0, 22.0, elev);
  baseColor = mix(baseColor, alpineBrown, brownFactor * 0.35);

  // Snow only at the peaks
  baseColor = mix(baseColor, snowColor, snowFactor);

  // Rock on cliffs (dark, not white)
  baseColor = mix(baseColor, rockColor, rockFactor);

  // Dirt patches in transition zones
  vec3 dirtColor = vec3(0.28, 0.22, 0.13);
  float dirtFactor = smoothstep(0.42, 0.55, fbm(vWorldPosition.xz * 0.25 + 5.0)) * (1.0 - snowFactor) * 0.2;
  baseColor = mix(baseColor, dirtColor, dirtFactor);

  // --- Lighting with Micro-Sculpted Normals ---
  vec3 norm = normalize(vNormal);
  // Sculpted micro-normal striations (simulating high-poly Blender rock sculpts)
  float striation = sin(vWorldPosition.y * 3.2 + fbm(vWorldPosition.xz * 0.4) * 3.5) * 0.18;
  vec3 sculptNormal = normalize(norm + vec3((fineDetail - 0.5) * 0.18, striation * rockFactor, (fineDetail - 0.5) * 0.18));

  vec3 sunDir = normalize(uSunDirection);
  float NdotL = max(dot(sculptNormal, sunDir), 0.0);
  float diffuse = NdotL * 0.8 + 0.2; // min ambient floor

  // Soft ambient from hemisphere
  vec3 lighting = uAmbientColor * 0.45 + uSunColor * diffuse * 0.85;
  vec3 litColor = baseColor * lighting;

  // Wet stone specular reflection along waterfall canyon & lake
  float distToPool = length(vWorldPosition.xz - vec2(12.0, 12.5));
  float wetZone = smoothstep(13.0, 7.5, distToPool) * smoothstep(18.5, 1.5, vWorldPosition.y);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 halfVec = normalize(sunDir + viewDir);
  float wetSpec = pow(max(dot(sculptNormal, halfVec), 0.0), 28.0) * wetZone * rockFactor * 1.6;
  litColor += uSunColor * wetSpec;

  // --- Fog (crisp & clear, subtle only at far horizon) ---
  float dist = length(vWorldPosition - cameraPosition);
  float distFog = smoothstep(75.0, 200.0, dist) * 0.7;
  float heightFog = (1.0 - smoothstep(-3.0, 1.0, vWorldPosition.y)) * 0.04;
  float fogFactor = clamp(distFog + heightFog, 0.0, 0.75);

  vec3 finalColor = mix(litColor, uFogColor, fogFactor);

  gl_FragColor = vec4(finalColor, 1.0);
}
