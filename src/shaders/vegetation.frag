uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform float uFogDensity;
uniform vec3 uFogColor;

varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  vec3 norm = normalize(vNormal);

  // Diffuse lighting
  float NdotL = max(dot(norm, normalize(uSunDirection)), 0.0);
  float diffuse = NdotL * 0.7 + 0.3;

  // Subsurface scattering approximation for foliage
  float sss = max(dot(-norm, normalize(uSunDirection)), 0.0) * 0.2;

  vec3 lighting = uAmbientColor * 0.45 + uSunColor * (diffuse * 0.7 + sss);
  vec3 litColor = vColor * lighting;

  // Fog (very subtle)
  float dist = length(vWorldPosition - cameraPosition);
  float fogFactor = 1.0 - exp(-uFogDensity * dist * dist);
  float heightFog = 1.0 - smoothstep(-4.0, 2.0, vWorldPosition.y);
  fogFactor = max(fogFactor, heightFog * 0.1);
  fogFactor = clamp(fogFactor, 0.0, 0.8);

  vec3 finalColor = mix(litColor, uFogColor, fogFactor);

  gl_FragColor = vec4(finalColor, 1.0);
}
