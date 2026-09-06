varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vElevation;
varying float vSlope;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vElevation = position.y;

  // Compute slope from normal (1.0 = flat, 0.0 = vertical cliff)
  vSlope = dot(normalize(normal), vec3(0.0, 1.0, 0.0));

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
