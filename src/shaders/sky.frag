uniform vec3 uSkyColorTop;
uniform vec3 uSkyColorBottom;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uTime;
uniform float uStarIntensity;

varying vec3 vWorldPosition;
varying vec3 vDirection;

// Hash for noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise2D(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vDirection);

  // Elevation factor (0 at horizon, 1 at zenith)
  float y = dir.y * 0.5 + 0.5;
  y = clamp(y, 0.0, 1.0);

  // Sky gradient
  vec3 skyColor = mix(uSkyColorBottom, uSkyColorTop, pow(y, 0.6));

  // Sun disc
  float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
  float sunDisc = pow(sunDot, 800.0) * uSunIntensity * 3.0; // sharp core
  float sunGlow = pow(sunDot, 32.0) * uSunIntensity * 0.6;  // soft halo
  float sunHaze = pow(sunDot, 4.0) * uSunIntensity * 0.12;  // atmospheric scatter
  skyColor += uSunColor * (sunDisc + sunGlow + sunHaze);

  // Horizon glow
  float horizonGlow = pow(1.0 - abs(dir.y), 8.0);
  skyColor += uSunColor * horizonGlow * uSunIntensity * 0.15;

  // Clouds
  vec2 cloudUV = dir.xz / (dir.y + 0.3) * 3.0;
  cloudUV += uTime * 0.02;
  float clouds = fbm(cloudUV * 1.5);
  clouds = smoothstep(0.35, 0.65, clouds);
  float cloudBrightness = 0.5 + sunDot * 0.5;
  vec3 cloudColor = mix(vec3(0.7, 0.72, 0.75), uSunColor * 0.8, sunDot * 0.3) * cloudBrightness;
  float cloudAlpha = clouds * smoothstep(0.0, 0.15, dir.y) * 0.5;
  skyColor = mix(skyColor, cloudColor, cloudAlpha);

  // Stars (night only)
  if (uStarIntensity > 0.01) {
    vec2 starUV = dir.xz / (abs(dir.y) + 0.01) * 80.0;
    float star = hash(floor(starUV));
    star = step(0.985, star) * star;
    // Twinkle
    star *= 0.5 + 0.5 * sin(uTime * 2.0 + star * 100.0);
    skyColor += vec3(star) * uStarIntensity * smoothstep(0.05, 0.3, dir.y);
  }

  gl_FragColor = vec4(skyColor, 1.0);
}
