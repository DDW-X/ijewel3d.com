# Chapter 09: VTO, Procedural Engraving, and Specialized Engine Plugins

In our final architectural analysis phase, we performed a targeted extraction of five specialized sub-modules embedded deep within the WebGI core (`bundle-0.22.0.js`) and the lightweight `mini-viewer` wrapper. These modules dictate the platform's advanced user-facing features, from Augmented Reality (AR) try-on capabilities to mobile device-orientation shimmer.

---

## 1. Virtual Try-On (VTO) & AR Subsystem

The Virtual Try-On logic is isolated from the main WebGI bundle to keep the initial load lightweight. It is lazily evaluated and fetched dynamically over the network when the user requests an AR session.

### Injection & Hand-Tracking Runtimes
In `libs/mini-viewer/0.6.19/bundle.nowebgi.iife.js`, the platform attempts to read the globally scoped `window.ij_vto` namespace.
```javascript
// libs/mini-viewer/0.6.19/bundle.nowebgi.iife.js : 91686
if (!window.ij_vto || !((We = window.ij_vto) != null && We.RingTryonPlugin)) {
  try {
    await se(); // Lazy-loads the external ij_vto chunk via te(t.tryonPath)
  } catch {
    console.error("Failed to start AR Try-On.");
  }
}
```

Once loaded, `window.ij_vto` exposes three specialized classes:
- **`RingTryonPlugin`:** The standard web-based hand-tracking solver (likely a MediaPipe/TensorFlow.js wrapper).
- **`InstoreRingTryonPlugin`:** A kiosk-optimized version (potentially with higher resolution webcam constraints).
- **`RingTryonUIPlugin`:** Injects HTML overlays (finger-alignment guides, capture buttons) over the WebGL canvas.

The AR plugin registers DOM event listeners (`startError`, `noSupport`, `permissionDenied`) to seamlessly fail-over to the standard 3D viewer if camera permissions are blocked.

---

## 2. Dynamic 3D Text & Procedural Engraving

How does a standard WebGL pipeline map user-typed strings onto curved cylindrical topology (like the inner band of a ring)? WebGI utilizes a brilliant hybrid approach using standard DOM SVG rendering and WebGL texture synthesis, encapsulated in `SimpleTextPlugin`.

### SVG-to-Texture Baking
Instead of utilizing heavy 3D geometry extrusion (like Three.js `TextGeometry`) or complex MSDF font rendering, `SimpleTextPlugin` injects a raw `data:image/svg+xml` string into the browser's native renderer:

```javascript
// libs/webgi-v0/bundle-0.22.0.js : 117961
`\n<svg style="background-color:${g ? "transparent" : t}" width="${r}" height="${s}" ... >
    <defs>
        <style>
        .text-g { overflow:hidden; text-anchor: ${f}; font-size: ${c}px; font-family: ${JSON.stringify(l || "Arial")}; }
        </style>
    </defs>
    <g class="text-g">
       <text style="fill:white; font-size: ${c}px;" x="..." y="..."> ${e} </text>
       ...
```

1. **Dynamic Font Loading:** If a custom font is used, an `@font-face` CSS rule is dynamically appended to the SVG definitions, fetching the `.woff` over HTTP.
2. **Procedural Filters:** To simulate deep engraving, SVG `<filter>` tags with `<feGaussianBlur>` and `<feOffset>` are applied natively to generate an inner drop-shadow.
3. **Texture Synthesis:** The SVG blob is passed to `importer.importSinglePath()` and drawn to a hidden `<canvas>`, returning an `ImageBitmap`.
4. **Material Injection:** This bitmap is then mapped to the active material's slots:
   ```javascript
   this.applyToAlphaMap && (s.alphaMap = a, s.transparent = !0, s.userData.renderToDepth = !0);
   this.applyToBumpMap && (s.bumpMap = a);
   ```

---

## 3. Ultra-HD Tiled Rendering (`BatchExportPlugin`)

To export 4K or 8K print-ready images of jewelry, the engine must circumvent WebGL's maximum viewport limits and GPU timeout crashes (TDR). 

### Frustum Sub-Division
The engine utilizes a classic tiled camera approach, mathematically subdividing the primary camera frustum into smaller contiguous grids.

```javascript
// libs/webgi-v0/bundle-0.22.0.js : 91937
if (m.setViewOffset) {
    m.setViewOffset(
        g.fullWidth,   // e.g., 4096
        g.fullHeight,  // e.g., 4096
        g.offsetX,     // Tile X cursor
        g.offsetY,     // Tile Y cursor
        g.width,       // Tile Width (e.g., 512)
        g.height       // Tile Height (e.g., 512)
    );
}
```
Each tile is rendered sequentially into a tiled render-target accumulation buffer. 

*Note:* This exact same `setViewOffset` API is heavily utilized in the `Progressive` rendering loop for **Temporal Anti-Aliasing (TAA) Jitter** (`libs/webgi-v0/bundle-0.22.0.js : 67793`), shifting the camera projection matrix by sub-pixel offsets (derived from a Halton sequence array `jS`) every frame.

---

## 4. Environment Lighting & IBL Processing

To achieve photo-realistic diamond dispersion and metal anisotropy, lighting relies entirely on Image-Based Lighting (IBL).

### PMREMGenerator
The engine exposes `PMREMGeneratorPlugin` (`libs/webgi-v0/bundle-0.22.0.js : 111657`), a thin wrapper over the standard WebGL Prefiltered Mipmap Radiance Environment Map (PMREM) generator (`class Ul`).

1. **Equirectangular Unpacking:** When an HDRI (in `.ktx2` or `.exr`) is downloaded from the `CacheStorage` CDN, `PMREMGenerator` converts the spherical equirectangular projection into a Cube UV format.
2. **Roughness Convolutions:** The generator mathematically blurs the environment map at successive mipmap levels. Each LOD correlates to a physical material roughness value. 
3. **State Management:** In `<webgi-viewer>` element events (`libs/webgi-v0/bundle-0.22.0.js : 99581`), environment maps can be hot-swapped dynamically without recompiling the monolithic `.pmat` shaders. 

---

## 5. Gyroscope & Inertial Shimmer

To maximize visceral realism on mobile platforms, the jewelry subtly catches specular highlights based on how the user holds their device.

### DeviceOrientationControls2
The engine relies on the native `window.DeviceOrientationEvent`. 
```javascript
// libs/webgi-v0/bundle-0.22.0.js : 122866
if (void 0 !== window.DeviceOrientationEvent && "function" == typeof window.DeviceOrientationEvent.requestPermission) {
    window.DeviceOrientationEvent.requestPermission()
}
```
Because modern browsers (iOS Safari 13+) mandate secure contexts (`https`) and explicit user gestures for gyroscope telemetry, the application spawns an interstitial modal: `"Tap on the screen to allow gyroscope"`. 

Once permission is granted, the orientation vectors stream into `DeviceOrientationControls2`, which applies rotational quaternions as an offset to the virtual camera, generating an elegant "inertial shimmer" on diamond facets as the user's hands naturally shake.
