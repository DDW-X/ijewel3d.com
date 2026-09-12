# Chapter 08: Cinematic Macro Optics, Rack Focus & Thin-Film Shaders
**Target Codebase:** `iJewel3D / WebGI Engine`
**Scope:** 3-Pass Depth of Field (DoF), Interactive Rack-Focus Mathematics, and Wave Interference Thin-Film Shaders.

---

## 1. The 3-Pass Depth of Field (DoF) Pipeline

Rendering jewelry requires replicating macro photography characteristics: high magnification, shallow depth of field, and soft bokeh circles. Standard single-pass blur shaders cause **color bleeding**, where sharp foreground diamond facets blur into background colors.

WebGI implements a 3-pass separable Depth of Field pipeline via `DepthOfFieldPass` (`NS`) and `DepthOfFieldPlugin` (`HS`).

```mermaid
flowchart LR
    RGB_Depth[Render Target & NormalDepth] --> Pass1[1. computeCocMaterial]
    Pass1 --> |Signed CoC Buffer| Pass2[2. expandCocMaterial (Horizontal)]
    Pass2 --> |Dilated CoC| Pass3[3. expandCocMaterial (Vertical)]
    Pass3 --> Pass4[4. dofBlurMaterial (Separable Blur Kernel)]
    Pass4 --> Composite[Final Composite with FrameFade Blend]
```

### 1.1 Pass 1: Signed Circle of Confusion (`computeCocMaterial`)
The first pass converts non-linear depth buffer samples into a signed Circle of Confusion (CoC) radius:

```glsl
// Extracted from computeCocMaterial fragment shader
varying vec2 vUv;
uniform vec2 nearFarBlurScale;
uniform vec2 cameraNearFar;
uniform vec2 focalDepthRange; // x: focal distance, y: depth range

float computeCoc() {
    float depth = getDepth(vUv);
    
    // Background / Skybox handling
    if (depth == 1.0) {
        return max(nearFarBlurScale.x, nearFarBlurScale.y);
    }
    
    // Linearize depth between near and far camera planes
    depth = mix(cameraNearFar.x, cameraNearFar.y, depth);
    
    // Calculate signed distance from focal plane normalized by depth range
    float coc = (depth - focalDepthRange.x) / focalDepthRange.y;
    coc = clamp(coc, -1.0, 1.0);
    
    // Scale differently for foreground (near) vs background (far) blur
    return (coc > 0.0 ? coc * nearFarBlurScale.y : coc * nearFarBlurScale.x);
}

void main() {
    vec3 sceneColor = colorTextureTexelToLinear(texture2D(colorTexture, vUv)).rgb;
    // Store linear color in RGB, and encoded CoC in Alpha: [0, 1] mapped from [-1, 1]
    gl_FragColor = vec4(sceneColor, 0.5 * computeCoc() + 0.5);
    #include <colorspace_fragment>
}
```

### 1.2 Pass 2: CoC Dilation (`expandCocMaterial`)
To prevent background pixels from bleeding into foreground silhouettes, the engine executes a **separable 11-tap dilation pass** along the horizontal `(1, 0)` and vertical `(0, 1)` directions:

```glsl
// Extracted from expandCocMaterial
const float MAXIMUM_BLUR_SIZE = 4.0;

float expandNear(const in vec2 offset, const in bool isBackground) {
    float coc = 0.0;
    vec2 sampleOffsets = MAXIMUM_BLUR_SIZE * offset / 5.0;
    
    // Sample 11 symmetric taps around the center pixel
    float coc0 = 2.0 * colorTextureTexelToLinear(texture2D(colorTexture, vUv)).a - 1.0;
    float coc1 = 2.0 * colorTextureTexelToLinear(texture2D(colorTexture, vUv - 5.0 * sampleOffsets)).a - 1.0;
    // ... taps coc2 through coc9 ...
    float coc10 = 2.0 * colorTextureTexelToLinear(texture2D(colorTexture, vUv + 5.0 * sampleOffsets)).a - 1.0;
    
    if (isBackground) {
        // Weighted Gaussian blur for background expansion
        coc = abs(coc0) * 0.095474 
            + (abs(coc1) + abs(coc10)) * 0.084264 
            + (abs(coc2) + abs(coc9)) * 0.088139 
            + (abs(coc3) + abs(coc8)) * 0.091276 
            + (abs(coc4) + abs(coc7)) * 0.093585 
            + (abs(coc5) + abs(coc6)) * 0.094998;
    } else {
        // Morphological dilation for foreground expansion
        coc = min(coc0, 0.0);
        coc = min(coc1 * 0.3, coc);
        coc = min(coc2 * 0.5, coc);
        coc = min(coc3 * 0.75, coc);
        coc = min(coc4 * 0.8, coc);
        coc = min(coc5 * 0.95, coc);
        coc = min(coc6 * 0.95, coc);
        coc = min(coc7 * 0.8, coc);
        coc = min(coc8 * 0.75, coc);
        coc = min(coc9 * 0.5, coc);
        coc = min(coc10 * 0.3, coc);
        if (abs(coc0) > abs(coc)) coc = coc0;
    }
    return coc;
}
```

### 1.3 Pass 3: Separable Blur & Composite (`dofBlurMaterial`)
The dilated CoC buffer modulates the kernel size in `dofBlurMaterial`. The result is composited over the HDR frame buffer, rendering clean macro bokeh without halos.

---

## 2. Interactive Rack-Focus Mathematics

When a user clicks on any gemstone facet or prong claw in the viewer, the camera dynamically shifts its focus plane to that exact point in space, replicating a physical macro-lens focus ring adjustment.

### 2.1 Intersection Vector Tracking (`DepthOfField._update`)

```typescript
// Extracted from DepthOfField._update()
_update(viewer: ViewerApp): boolean {
    const pass = this.pass.passObject;
    const camera = viewer.scene.renderCamera;
    
    // Ensure camera world matrices are synchronized
    camera.cameraObject.updateMatrixWorld(true);
    
    // 1. Calculate Vector from Camera to Target Point
    const cameraPos = camera.cameraObject.getWorldPosition(new Vector3());
    this._tempVec.subVectors(this._focalPointHit, cameraPos);
    
    // 2. Project Distance along Camera Optical Axis (Z-Forward vector)
    const cameraDir = camera.cameraObject.getWorldDirection(new Vector3());
    const distanceToTarget = this._tempVec.length();
    const cosAngle = cameraDir.dot(this._tempVec.normalize());
    
    // Orthogonal Focal Distance: d_focal = |P - C| * (D_cam . N_ray)
    pass.focalDepthRange.x = distanceToTarget * cosAngle;
    
    // 3. Normalized Device Coordinate (NDC) Projection for Center Alignment
    const projectedPoint = this._tempVec
        .copy(this._focalPointHit)
        .project(camera.cameraObject)
        .addScalar(1)
        .divideScalar(2); // Convert to [0, 1] UV space
        
    pass.crossCenter.set(projectedPoint.x, projectedPoint.y);
    pass.computeCocMaterial.uniformsNeedUpdate = true;
    pass.expandCocMaterial.uniformsNeedUpdate = true;
    
    return true;
}
```

### 2.2 Smooth Transition via `FrameFadePlugin`
Rack focusing could cause frame flicker while temporal accumulation (TAA) reconverges. The engine uses `FrameFadePlugin` (`VS`):
- When `_onObjectHit` fires, `FrameFadePlugin.startTransition(fadeDuration)` captures the previous frame's color buffer into `lastFrame`.
- It performs an alpha-blend cross-fade over $200\text{ ms}$, ensuring focus transitions appear photographic and fluid.

---

## 3. Physical Optics: Wave Interference & Thin Film (`ThinFilmPlugin`)

Jewelry surfaces often feature iridescent coatings, oxide tarnish, or pearl nacre. The `ThinFilmPlugin` (`WS`) injects an optical wave interference equation into the PBR fragment stage.

### 3.1 Shader Equations & Voronoise Perturbation

```glsl
// Thin Film Iridescence GLSL Extension
vec3 incident = normalize(vViewPosition.xyz);
// 1. Geometric Grazing Angle (Fresnel weight)
float hWeight = 1.0 - dot(normal, incident);

// 2. Multi-Frequency Voronoi Procedural Noise
vec3 noiseV = voronoise3(
    vUv.xy * thinColorNoiseParams.xy * 60.0,
    thinColorNoiseParams.z,
    thinColorNoiseParams.w
);
float hWeight2 = 1.0 - dot(normalize(noiseV), incident);

// 3. Phase-Shifted Color Generation in HSV Space
// Base Layer Interference
vec3 film = hsv2rgb(vec3(
    fract(hWeight + thinBaseLayerFactors.x), // Hue phase shift
    thinBaseLayerFactors.y,                 // Saturation
    thinBaseLayerFactors.z                  // Brightness
)) * thinBaseLayerFactors.a;

// Noise Perturbed Layer Interference
vec3 film2 = hsv2rgb(vec3(
    fract(hWeight2 + thinNoiseLayerFactors.x),
    thinNoiseLayerFactors.y,
    thinNoiseLayerFactors.z
)) * thinNoiseLayerFactors.a;

// 4. Energy-Normalized Blending
film = (film + film2) / (thinBaseLayerFactors.a + thinNoiseLayerFactors.a);

// 5. Final Composite with Diffuse Base
diffuseColor.rgb = mix(diffuseColor.rgb, film, thinFilmFactor);
```

### 3.2 Uniform Parameters Breakdown

- `thinBaseLayerFactors` (`vec4`): 
  - $x$: Base spectral phase offset (wavelength shift across visual spectrum).
  - $y$: Color saturation of the interference fringes.
  - $z$: Intensity value.
  - $w$: Alpha layer weight.
- `thinNoiseLayerFactors` (`vec4`): Secondary phase and saturation offsets modulated by surface irregularities.
- `thinColorNoiseParams` (`vec4`): UV frequency scaling ($x, y$), Voronoi jitter ($z$), and smoothstep boundary sharpness ($w$).
- `thinFilmFactor` (`float`): Global blend factor controlling interference reflectivity versus base PBR metallic albedo.
