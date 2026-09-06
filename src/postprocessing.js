import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * WebGL Cinematic Post-Processing Pipeline:
 * RenderPass → UnrealBloomPass → CinematicGradePass → OutputPass
 */
const CinematicGradeShader = {
  name: 'CinematicGradeShader',
  uniforms: {
    tDiffuse: { value: null },
    uVignetteStrength: { value: 0.32 },
    uContrast: { value: 1.06 },
    uSaturation: { value: 1.05 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uVignetteStrength;
    uniform float uContrast;
    uniform float uSaturation;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 color = tex.rgb;

      // S-curve contrast for deep rich shadows and vibrant sunlit snow
      color = (color - 0.5) * uContrast + 0.5;

      // Natural color vibrancy
      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(lum), color, uSaturation);

      // Optical lens vignette focusing center landscape
      vec2 distFromCenter = (vUv - 0.5) * 1.35;
      float vignette = 1.0 - dot(distFromCenter, distFromCenter) * uVignetteStrength;
      color *= clamp(vignette, 0.0, 1.0);

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a);
    }
  `,
};

export function createPostProcessing(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);

  // 1. Scene Render
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 2. High-dynamic-range Bloom for sun glare and waterfall mist
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    0.28,  // strength
    0.85,  // radius
    0.88   // threshold
  );
  composer.addPass(bloomPass);

  // 3. WebGL Cinematic Color Grade & Vignette
  const gradePass = new ShaderPass(CinematicGradeShader);
  composer.addPass(gradePass);

  // 4. Output pass for tone mapping and color space
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  function resize(width, height) {
    composer.setSize(width, height);
  }

  return { composer, bloomPass, gradePass, resize };
}
