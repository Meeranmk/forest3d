uniform float uTime;
uniform float uWindStrength;
uniform vec2 uWindDirection;

attribute vec3 instanceColor;

varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  vColor = instanceColor;
  vNormal = normalize(normalMatrix * normal);

  vec4 mvPosition = instanceMatrix * vec4(position, 1.0);
  vec3 worldPos = (modelMatrix * mvPosition).xyz;
  vWorldPosition = worldPos;

  // Wind displacement: supports both low grass blades and tall tree canopies
  float heightFactor = clamp(position.y * 1.5, 0.0, 1.0);
  heightFactor = heightFactor * heightFactor; // quadratic for natural flexible stem bending

  // Combine sine waves at different frequencies for organic motion
  float phase = worldPos.x * 0.3 + worldPos.z * 0.2;
  float sway = sin(uTime * 1.8 + phase) * 0.6
             + sin(uTime * 2.7 + phase * 1.3) * 0.3
             + sin(uTime * 0.5 + phase * 0.7) * 0.4;

  vec3 windOffset = vec3(
    uWindDirection.x * sway * heightFactor * uWindStrength,
    -abs(sway) * heightFactor * uWindStrength * 0.1, // slight droop
    uWindDirection.y * sway * heightFactor * uWindStrength
  );

  mvPosition.xyz += windOffset;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(mvPosition.xyz, 1.0);
}
