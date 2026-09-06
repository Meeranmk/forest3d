uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;

  vec3 pos = position;
  // Subtle animated ripple displacement
  float wave = sin(pos.x * 1.5 + uTime * 2.0) * cos(pos.z * 1.5 + uTime * 1.8) * 0.08;
  pos.y += wave;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
