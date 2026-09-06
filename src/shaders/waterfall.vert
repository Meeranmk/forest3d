uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

// Simple wave function for waterfall surface disturbance
float wave(vec2 p) {
  return sin(p.x * 12.0 + uTime * 6.0) * cos(p.y * 15.0 - uTime * 8.0) * 0.04;
}

void main() {
  vUv = uv;
  
  // Turbulent surface jitter along normal
  vec3 displacedPos = position;
  float displacement = wave(uv);
  displacedPos += normal * displacement;

  vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
