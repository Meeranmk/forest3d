uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

// Fast noise hash
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
  vec3 normal = normalize(vNormal);

  // Fast downward flow coordinates (scaled for wide majestic waterfall)
  vec2 flowUV1 = vec2(vUv.x * 14.0, vUv.y * 3.0 - uTime * 3.4);
  vec2 flowUV2 = vec2(vUv.x * 24.0 + 0.5, vUv.y * 5.0 - uTime * 5.0);
  vec2 microUV = vec2(vUv.x * 45.0, vUv.y * 12.0 - uTime * 7.0);

  float n1 = noise2D(flowUV1);
  float n2 = noise2D(flowUV2);
  float nMicro = noise2D(microUV);

  // Combined turbulence
  float flowPattern = n1 * 0.55 + n2 * 0.35 + nMicro * 0.1;

  // Water colors
  vec3 waterDeep = vec3(0.04, 0.32, 0.42);      // Deep rich turquoise
  vec3 waterShallow = vec3(0.12, 0.65, 0.72);   // Vibrant aqua
  vec3 foamColor = vec3(0.95, 0.98, 1.0);       // Aerated white foam

  // Foam accumulation:
  // 1. Edges of the fall
  float edgeDist = abs(vUv.x - 0.5) * 2.0;
  float edgeFoam = smoothstep(0.65, 0.98, edgeDist) * 0.7;

  // 2. High-speed turbulence foam
  float speedFoam = smoothstep(0.48, 0.75, flowPattern);

  // 3. Impact and crest foam
  float crestFoam = smoothstep(0.85, 0.98, vUv.y) * 0.6 + smoothstep(0.15, 0.02, vUv.y) * 0.8;

  float totalFoam = clamp(speedFoam + edgeFoam + crestFoam, 0.0, 1.0);

  // Base water color gradient
  vec3 waterColor = mix(waterDeep, waterShallow, flowPattern);
  vec3 finalColor = mix(waterColor, foamColor, totalFoam);

  // Dynamic normal perturbation for glistening specular highlights
  vec3 perturbedNormal = normalize(normal + vec3((n1 - 0.5) * 0.4, 0.0, (n2 - 0.5) * 0.4));

  // Sun lighting & Specular glint
  vec3 sunDir = normalize(uSunDirection);
  float NdotL = max(dot(perturbedNormal, sunDir), 0.0);
  vec3 halfVec = normalize(sunDir + viewDir);
  float NdotH = max(dot(perturbedNormal, halfVec), 0.0);
  float specular = pow(NdotH, 64.0) * 2.5;

  // Fresnel effect
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

  // Lighting integration
  vec3 diffuse = uAmbientColor * finalColor + uSunColor * finalColor * (NdotL * 0.7 + 0.3);
  vec3 specGlint = uSunColor * specular * (0.4 + 0.6 * (1.0 - totalFoam * 0.5));
  finalColor = diffuse + specGlint + uSunColor * fresnel * 0.35;

  // Opacity: sheer water stream with solid foam
  float alpha = mix(0.78, 0.98, totalFoam);
  alpha *= smoothstep(0.0, 0.04, vUv.y); // Fade gently at top edge

  // Distance fog integration (crisp up close, blends at horizon)
  float dist = length(cameraPosition - vWorldPosition);
  float fogFactor = smoothstep(85.0, 220.0, dist) * 0.7;
  finalColor = mix(finalColor, uFogColor, fogFactor);

  gl_FragColor = vec4(finalColor, alpha);
}
