uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform float uFogDensity;
uniform vec3 uFogColor;

varying float vAlpha;

void main() {
  // Soft round radial particle
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float softParticle = smoothstep(0.5, 0.0, dist);
  float alpha = vAlpha * softParticle;

  // Mist color lit by sun and ambient
  vec3 mistColor = mix(uAmbientColor * 1.5, uSunColor * 1.2, 0.4);
  mistColor = mix(mistColor, vec3(1.0), 0.5); // white water froth mist

  gl_FragColor = vec4(mistColor, alpha);
}
