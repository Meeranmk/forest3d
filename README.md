# Forest 3D — Alpine Mountain Landscape & Interactive Wildlife

A high-performance WebGL 3D nature experience built with **Three.js**, **Vite**, and custom **GLSL Shaders**, integrated with a **Blender 3D export pipeline**.

🔗 **Live Demo**: [https://forest3d-eta.vercel.app/](https://forest3d-eta.vercel.app/)

![Three.js](https://img.shields.io/badge/Three.js-r185-black?logo=three.js)
![Vite](https://img.shields.io/badge/Vite-v6-blueviolet?logo=vite)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)
![GLSL](https://img.shields.io/badge/Shaders-GLSL-orange)

---

## Features

### 🏞️ Realistic Alpine Landscape
- **Sculpted Mountain Terrain**: Procedural simplex noise and ridge noise with carved canyon gorge and alpine plunge pool.
- **Dynamic Roaring Waterfall**: Curved ribbon mesh with multi-layered animated water sheets, spray foam, and radial impact ripples.
- **Volumetric Atmospheric Sun Rays (Godrays)**: Crepuscular light beams streaming through the mountain gap with animated dust/mist turbulence.
- **Water Shading**: Custom GLSL fragment shader featuring animated micro-caustics, sunlight sparkle glints, and physical Fresnel reflection.
- **Lush Alpine Vegetation**:
  - Multi-tiered evergreen Norway Spruce and Mountain Fir conifer trees framing the mountain ridges.
  - Over 8,500 instanced grass tufts waving naturally with wind turbulence.
  - Strict water clearance ensuring rivers, plunge pools, and lakes remain 100% clean and free of submerged foliage.

### 🦌 Realistic Wildlife & Interactive Mechanics
- **Red Deer Herds (Stags, Does, and Fawns)**: Anatomically sculpted with natural proportioned limbs, 12-point branching antlers, and fur PBR shading.
- **Touch / Click to Flee**:
  - Touch or click any deer to startle it into an athletic sprint.
  - Herd alarm propagation alerts nearby herd members to flee in unison.
- **Kinematic Rotary Gallop**:
  - Asymmetrical 4-beat rotary stride with articulated shoulder, knee, hip, and hock joints.
  - True whole-body parabolic bounding leaps with suspension flight.
  - Dynamic body banking lean into turns along the local roll axis.
  - Muscular spine squash and stretch.
  - Intelligent predator evasion navigation (zig-zag jinking, lake water and cliff avoidance).
  - Smooth deceleration into an alert look-back posture before resuming grazing.
- **Soaring Golden Eagles**: Dynamic soaring raptors banking on mountain thermals with rhythmic wing flaps.

### 🎨 Lighting & Post-Processing
- **Three Dynamic Presets**: Day, Golden Hour, and Night with smooth atmospheric lerping.
- **Post-Processing Pipeline**:
  - High-Dynamic-Range UnrealBloom for sun glare and waterfall mist.
  - Cinematic Color Grading with S-curve contrast and optical lens vignette.

### 🛠️ Blender & Three.js 3D Pipeline
- Pre-compiled production `.glb` assets in `public/models/` (`wooden_bridge.glb`, `red_deer_stag.glb`, `golden_eagle.glb`, `alpine_pine.glb`).
- Automated Blender Python pipeline script (`tools/blender_export_pipeline.py`) for automated UV unwrapping, Principled BSDF material setup, LOD generation, and GLTF/GLB export.
- Node.js GLB model compiler (`tools/generate_models.js`).

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/Meeranmk/forest3d.git
cd forest3d
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Production Build
```bash
npm run build
```

---

## Controls
- **Left Click + Drag**: Orbit camera around the landscape.
- **Scroll**: Zoom in / out.
- **Click / Tap Deer**: Startle deer to trigger realistic galloping and running behavior.
- **Lighting Buttons**: Switch between Day, Golden Hour, and Night lighting modes.
