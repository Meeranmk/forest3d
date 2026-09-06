attribute vec3 color;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vColor;

void main() {
  vColor = color;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
