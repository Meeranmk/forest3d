uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uTime;
uniform vec3 uSunDirection;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vBeamFactor;

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
  // Animated dust mote and atmospheric mist turbulence
  vec2 noiseCoord1 = vec2(vUv.x * 6.0 + uTime * 0.08, vUv.y * 3.5 - uTime * 0.15);
  vec2 noiseCoord2 = vec2(vUv.x * 12.0 - uTime * 0.05, vUv.y * 7.0 - uTime * 0.22);

  float n1 = noise2D(noiseCoord1);
  float n2 = noise2D(noiseCoord2);
  float turbulence = n1 * 0.7 + n2 * 0.3;

  // Soft edge falloffs
  float edgeFadeX = smoothstep(0.0, 0.28, vUv.x) * smoothstep(1.0, 0.72, vUv.x);
  float edgeFadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.40, vUv.y);
  float beamAlpha = vBeamFactor * edgeFadeX * edgeFadeY * (0.65 + turbulence * 0.35);

  // Soft atmospheric intensity
  float intensity = beamAlpha * uSunIntensity * 0.42;

  // Camera distance fade (prevent clipping in face)
  float distToCam = length(cameraPosition - vWorldPosition);
  float camFade = smoothstep(5.0, 15.0, distToCam);
  intensity *= camFade;

  vec3 rayColor = uSunColor * (1.1 + turbulence * 0.2);

  gl_FragColor = vec4(rayColor, clamp(intensity, 0.0, 0.65));
}
