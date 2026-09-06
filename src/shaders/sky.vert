varying vec3 vWorldPosition;
varying vec3 vDirection;

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
