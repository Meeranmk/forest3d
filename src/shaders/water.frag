uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uTime;
uniform vec3 uImpactPoint;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

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

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // 1. Expanding ripples from waterfall impact point
  float distToImpact = length(vWorldPosition.xz - uImpactPoint.xz);
  float rippleWave = sin(distToImpact * 3.5 - uTime * 4.5);
  float rippleDamping = exp(-distToImpact * 0.22);
  float impactRipples = rippleWave * rippleDamping;

  // 2. Churning foam near impact
  float impactFoamNoise = noise2D(vWorldPosition.xz * 1.5 - uTime * 0.8);
  float impactFoam = smoothstep(0.4, 0.8, impactFoamNoise) * smoothstep(5.5, 0.5, distToImpact);

  // 3. Surface wave normals
  vec2 waveUv1 = vWorldPosition.xz * 0.25 + vec2(uTime * 0.06, uTime * 0.04);
  vec2 waveUv2 = vWorldPosition.xz * 0.45 - vec2(uTime * 0.08, -uTime * 0.05);
  float n1 = noise2D(waveUv1);
  float n2 = noise2D(waveUv2);

  vec3 waveNormal = normalize(vec3(
    (n1 - 0.5) * 0.35 + (vWorldPosition.x - uImpactPoint.x) * impactRipples * 0.08,
    1.0,
    (n2 - 0.5) * 0.35 + (vWorldPosition.z - uImpactPoint.z) * impactRipples * 0.08
  ));

  // Alpine water palette
  vec3 deepWater = vec3(0.03, 0.22, 0.30);     // deep glacial blue
  vec3 shallowWater = vec3(0.08, 0.55, 0.58);  // vibrant turquoise
  vec3 foamColor = vec3(0.92, 0.97, 1.0);

  // Edge and impact color blending
  float edgeDist = length(vUv - 0.5) * 2.0;
  vec3 waterColor = mix(deepWater, shallowWater, smoothstep(0.3, 0.9, edgeDist));
  waterColor = mix(waterColor, foamColor, impactFoam * 0.85);

  // Fresnel with physical water index of refraction
  float fresnel = pow(1.0 - max(dot(waveNormal, viewDir), 0.0), 3.5);

  // Animated micro-caustics on the shallow glacial pool floor
  vec2 causticUv1 = vWorldPosition.xz * 1.8 + vec2(uTime * 0.12, uTime * 0.08);
  vec2 causticUv2 = vWorldPosition.xz * 2.6 - vec2(uTime * 0.10, -uTime * 0.14);
  float c1 = noise2D(causticUv1);
  float c2 = noise2D(causticUv2);
  float caustics = pow(c1 * c2, 1.8) * 4.5 * (1.0 - impactFoam);

  // High-frequency sunlight sparkle glints
  vec3 sunDir = normalize(uSunDirection);
  vec3 halfVec = normalize(sunDir + viewDir);
  float NdotH = max(dot(waveNormal, halfVec), 0.0);
  float specular = pow(NdotH, 140.0) * 3.8;
  float microSparkle = pow(max(dot(normalize(waveNormal + vec3(n1 - 0.5, 0.0, n2 - 0.5) * 0.2), halfVec), 0.0), 220.0) * 2.5;

  // Light integration
  vec3 finalColor = uAmbientColor * waterColor * 1.1 + uSunColor * waterColor * 0.65;
  finalColor += uSunColor * (caustics * 0.35 * smoothstep(0.4, 0.95, edgeDist));
  finalColor += uSunColor * (specular + microSparkle + fresnel * 0.75);

  // Distance fog integration (crisp up close, blends at far horizon)
  float dist = length(cameraPosition - vWorldPosition);
  float fogFactor = smoothstep(90.0, 240.0, dist) * 0.65;
  finalColor = mix(finalColor, uFogColor, fogFactor);

  // Pool transparency
  float alpha = clamp(0.86 + impactFoam * 0.14, 0.0, 0.98);

  gl_FragColor = vec4(finalColor, alpha);
}
