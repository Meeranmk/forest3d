import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Three.js GLTF/GLB Asset Loader and Model Manager
 * Handles asynchronous asset loading, shadow casting, PBR material adjustments,
 * and fallback geometry generation.
 */
class ModelManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map();
  }

  /**
   * Loads a GLTF / GLB model file with caching and optional fallback.
   * @param {string} path - URL path to the .glb file (e.g. '/models/bridge.glb')
   * @param {object} options - Scaling, position, shadow preferences
   * @param {Function} fallbackGenerator - Optional procedural geometry generator
   * @returns {Promise<THREE.Object3D>}
   */
  async load(path, options = {}, fallbackGenerator = null) {
    if (this.cache.has(path)) {
      const cloned = this.cache.get(path).clone(true);
      this.applyOptions(cloned, options);
      return cloned;
    }

    try {
      const check = await fetch(path, { method: 'HEAD' });
      if (!check.ok || (check.headers.get('content-type') && check.headers.get('content-type').includes('text/html'))) {
        throw new Error(`File not found at ${path}`);
      }

      const gltf = await this.loader.loadAsync(path);
      const root = gltf.scene;

      root.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = options.castShadow !== false;
          node.receiveShadow = options.receiveShadow !== false;

          // Ensure materials respond properly to environment lighting
          if (node.material) {
            node.material.roughness = options.roughness ?? node.material.roughness;
            node.material.metalness = options.metalness ?? node.material.metalness;
            node.material.needsUpdate = true;
          }
        }
      });

      this.cache.set(path, root);
      const instance = root.clone(true);
      this.applyOptions(instance, options);
      return instance;
    } catch (err) {
      console.warn(`[ModelManager] Failed to load "${path}". Using procedural fallback.`, err);
      if (typeof fallbackGenerator === 'function') {
        const fallbackObj = fallbackGenerator();
        this.applyOptions(fallbackObj, options);
        return fallbackObj;
      }
      return new THREE.Group();
    }
  }

  applyOptions(object, options) {
    if (options.scale) {
      if (typeof options.scale === 'number') {
        object.scale.setScalar(options.scale);
      } else if (Array.isArray(options.scale)) {
        object.scale.set(...options.scale);
      }
    }
    if (options.position) {
      object.position.set(options.position.x, options.position.y, options.position.z);
    }
    if (options.rotation) {
      object.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z);
    }
  }
}

export const modelLoader = new ModelManager();
