uniform vec3 uSunDirection;
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vBeamFactor;

void main() {
  vUv = uv;
  
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;

  // Beam factor: stronger near core and top
  vBeamFactor = pow(1.0 - abs(uv.x - 0.5) * 2.0, 1.5) * (1.0 - uv.y * 0.7);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
