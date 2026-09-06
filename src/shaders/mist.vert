uniform float uTime;
uniform vec3 uImpactPoint;

attribute float aLife;
attribute float aScale;
attribute vec3 aVelocity;

varying float vAlpha;

void main() {
  // Loop cycle per particle
  float progress = fract(aLife + uTime * 0.4);

  // Position curves upward and billows out
  vec3 pos = uImpactPoint + aVelocity * progress;
  pos.y += progress * progress * 4.5; // accelerates slightly as mist rises
  pos.x += sin(progress * 4.0 + aLife * 10.0) * 0.8;
  pos.z += cos(progress * 4.0 + aLife * 10.0) * 0.8;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size attenuation with perspective
  float size = aScale * (1.0 + progress * 2.5) * (150.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 2.0, 120.0);

  // Fade in quickly, then gently fade out as it rises and disperses
  float fadeIn = smoothstep(0.0, 0.15, progress);
  float fadeOut = smoothstep(1.0, 0.6, progress);
  vAlpha = fadeIn * fadeOut * 0.28;

  gl_Position = projectionMatrix * mvPosition;
}
