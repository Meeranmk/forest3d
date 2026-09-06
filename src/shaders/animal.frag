uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform float uFogDensity;
uniform vec3 uFogColor;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vColor;

void main() {
  vec3 norm = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 sunDir = normalize(uSunDirection);

  // 1. Soft Fur Wrap Lighting (Half-Lambert for organic pelt appearance)
  float wrap = 0.35;
  float NdotL = max(0.0, (dot(norm, sunDir) + wrap) / (1.0 + wrap));
  float diffuse = NdotL * 0.75 + 0.25;

  // 2. Velvet Fur Sheen (grazing angle sunlight scattering through coat fibers)
  float NdotV = max(dot(norm, viewDir), 0.0);
  float fresnel = pow(1.0 - NdotV, 3.2);
  vec3 furSheen = uSunColor * fresnel * 0.4 * (NdotL * 0.6 + 0.4);

  // 3. Ambient lighting with soft ground bounce
  float upFactor = norm.y * 0.5 + 0.5;
  vec3 ambient = uAmbientColor * mix(0.35, 0.65, upFactor);

  // 4. Composite pelt lighting
  vec3 litColor = vColor * (ambient + uSunColor * diffuse) + furSheen;

  // 5. Distance fog (subtle and clear, matching landscape)
  float dist = length(vWorldPosition - cameraPosition);
  float distFog = smoothstep(75.0, 200.0, dist) * 0.7;
  float heightFog = (1.0 - smoothstep(-3.0, 1.0, vWorldPosition.y)) * 0.04;
  float fogFactor = clamp(distFog + heightFog, 0.0, 0.75);

  vec3 finalColor = mix(litColor, uFogColor, fogFactor);

  gl_FragColor = vec4(finalColor, 1.0);
}
