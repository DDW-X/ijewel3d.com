# Chapter 07: The `.pmat` Material Specification & Procedural Shaders
**Target Codebase:** `iJewel3D / WebGI Engine`
**Scope:** `.pmat` JSON Schema, Triplanar Normal Projection without UVs, Screen-Space Beveling (`_ssBevel`), and Browser `CacheStorage` Pipeline.

---

## 1. Formal `.pmat` Schema (`MeshStandardMaterial2`)

The `.pmat` file format is the proprietary physical material specification utilized across the iJewel3D ecosystem. It extends the Three.js serialization standard (`Material.toJSON`, version 4.6001), packaging PBR metallic-roughness uniforms, custom procedural map channels, and proprietary screen-space shader directives into a structured JSON file.

### 1.1 JSON Schema Specification

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MeshStandardMaterial2",
  "type": "object",
  "required": ["metadata", "uuid", "type", "name", "color", "roughness", "metalness"],
  "properties": {
    "metadata": {
      "type": "object",
      "properties": {
        "version": { "type": "number", "const": 4.6001 },
        "type": { "type": "string", "const": "Material" },
        "generator": { "type": "string", "const": "Material.toJSON" }
      }
    },
    "uuid": { "type": "string", "format": "uuid" },
    "type": { "type": "string", "const": "MeshStandardMaterial2" },
    "name": { "type": "string" },
    "color": { "type": "integer", "description": "Hexadecimal RGB color value" },
    "roughness": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
    "metalness": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
    "sheen": { "type": "number", "default": 0 },
    "sheenColor": { "type": "integer", "default": 0 },
    "sheenRoughness": { "type": "number", "default": 1 },
    "emissive": { "type": "integer", "default": 0 },
    "specularIntensity": { "type": "number", "default": 1 },
    "specularColor": { "type": "integer", "default": 16777215 },
    "clearcoat": { "type": "number", "default": 0 },
    "clearcoatRoughness": { "type": "number", "default": 0 },
    "dispersion": { "type": "number", "default": 0 },
    "iridescence": { "type": "number", "default": 0 },
    "iridescenceIOR": { "type": "number", "default": 1.3 },
    "iridescenceThicknessRange": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 2,
      "maxItems": 2
    },
    "anisotropy": { "type": "number", "default": 0 },
    "anisotropyRotation": { "type": "number", "default": 0 },
    "bumpMap": { "type": "string", "format": "uuid" },
    "bumpScale": { "type": "number" },
    "normalMap": { "type": "string", "format": "uuid" },
    "normalMapType": { "type": "integer", "enum": [0, 1] },
    "normalScale": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 2,
      "maxItems": 2
    },
    "roughnessMap": { "type": "string", "format": "uuid" },
    "envMapRotation": {
      "type": "array",
      "items": [{ "type": "number" }, { "type": "number" }, { "type": "number" }, { "type": "string" }]
    },
    "envMapIntensity": { "type": "number", "default": 1.0 },
    "reflectivity": { "type": "number", "default": 0.5 },
    "transmission": { "type": "number", "default": 0 },
    "thickness": { "type": "number", "default": 0 },
    "side": { "type": "integer", "enum": [0, 1, 2] },
    "userData": {
      "type": "object",
      "properties": {
        "_ssBevel": {
          "type": "object",
          "properties": {
            "hasSSBevel": { "type": "boolean" },
            "radius": { "type": "number" }
          }
        },
        "_triplanarMapping": {
          "type": "object",
          "properties": {
            "enable": { "type": "boolean" },
            "scaleFactor": { "type": "number" },
            "blendFactor": { "type": "number" },
            "offsetFactor": { "type": "number" },
            "fixToObject": { "type": "boolean" }
          }
        }
      }
    },
    "textures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "uuid": { "type": "string", "format": "uuid" },
          "name": { "type": "string" },
          "mapping": { "type": "integer" },
          "repeat": { "type": "array", "items": { "type": "number" } },
          "rotation": { "type": "number" },
          "wrap": { "type": "array", "items": { "type": "integer" } },
          "userData": {
            "type": "object",
            "properties": {
              "rootPath": { "type": "string", "format": "uri" }
            }
          }
        }
      }
    }
  }
}
```

---

## 2. Triplanar Procedural Mapping (`_triplanarMapping`)

Industrial CAD jewelry models (exported from Rhino3D or MatrixGold as raw STEP or STL triangle meshes) frequently lack 2D UV texture coordinates. To apply micro-surface textures (brushed finishes, satin grain, hammered facets, carbon weave) to unparameterized meshes, the engine injects a custom Triplanar Shader extension (`TriplanarMappingPlugin`).

### 2.1 GLSL Implementation & Mathematical Derivation

```glsl
struct TriplanarUV {
    vec2 x;
    vec2 y;
    vec2 z;
};

uniform float triplanarScale;
uniform float triplanarBlend;
uniform float triplanarOffset;
uniform bool fixToObject;

vec3 _triplanarPosition;
vec3 _triplanarNormal;

// 1. Normalized Normal Weight Distribution
vec3 getTriplanarWeights(in vec3 position, in vec3 normal) {
    vec3 triW = abs(normal);
    // Apply contrast threshold offset
    triW = clamp(triW - vec3(triplanarOffset), vec3(0.0), vec3(1.0));
    // Exponentiate to sharpen transition seams between orthogonal projections
    triW = pow(triW, vec3(triplanarBlend));
    // Normalize weights: w_x + w_y + w_z = 1.0
    return triW / (triW.x + triW.y + triW.z);
}

// 2. Orthogonal Projection Mapping
TriplanarUV getTriplanarUV(in vec3 position, in vec3 normal) {
    TriplanarUV triUV;
    // Project along ZY, XZ, and XY orthogonal planes
    triUV.x = position.zy * triplanarScale;
    triUV.y = position.xz * triplanarScale;
    triUV.z = position.xy * triplanarScale;
    
    // Invert mirrored axes based on negative normal orientations
    if (normal.x < 0.0) { triUV.x.x = -triUV.x.x; }
    if (normal.y < 0.0) { triUV.y.x = -triUV.y.x; }
    if (normal.z >= 0.0) { triUV.z.x = -triUV.z.x; }
    
    return triUV;
}

// 3. Blended Sample Evaluation
vec4 textureTriplanar(in sampler2D tex, in vec3 position, in vec3 normal) {
    TriplanarUV triUV = getTriplanarUV(position, normal);
    
    vec4 texX = texture2D(tex, triUV.x);
    vec4 texY = texture2D(tex, triUV.y);
    vec4 texZ = texture2D(tex, triUV.z);
    
    vec3 triW = getTriplanarWeights(position, normal);
    return texX * triW.x + texY * triW.y + texZ * triW.z;
}

void triPlanarWorldOrLocal() {
    if (fixToObject) {
        _triplanarPosition = vLocalPosition;
        _triplanarNormal = normalize(vLocalNormal);
    } else {
        _triplanarPosition = vWorldPosition;
        _triplanarNormal = normalize(vWorldNormal);
    }
}
```

### 2.2 Bump Map Partial Derivative Rewriting
Standard Three.js bump mapping calculates analytical screen derivatives:
$$\frac{\partial \text{bump}}{\partial s}, \quad \frac{\partial \text{bump}}{\partial t}$$
WebGI rewrites the `#include <bumpmap_pars_fragment>` block, substituting 2D derivative lookups with 3D triplanar evaluations:
```glsl
float Hll = bumpScale * textureTriplanar(bumpMap, _triplanarPosition, _triplanarNormal).x;
float dBx = bumpScale * textureTriplanar(bumpMap, _triplanarPosition + dSTdx, _triplanarNormal).x - Hll;
float dBy = bumpScale * textureTriplanar(bumpMap, _triplanarPosition + dSTdy, _triplanarNormal).x - Hll;
```
This enables micro-bump surface details to wrap cleanly around curved organic geometry (such as wedding bands and prong claws) without texture stretching or visible UV seam tears.

---

## 3. Screen-Space Beveling (`_ssBevel`)

In production jewelry rendering, razor-sharp polygonal edges shatter realism because real manufactured gold reflects soft highlight fillets along its rounded corners. Modeling these fillets manually inflates geometry by $300\text{--}500\%$.

The `SSBevelPlugin` solves this on the GPU by calculating a **Screen-Space Bevel Pass** that rounds sharp edges in real time.

```mermaid
flowchart TD
    G_Buffer[Scene Normal & Depth Target] --> EdgeDetect[Poisson Disk Edge Discontinuity Detection]
    EdgeDetect --> EdgeMask[Edge Mask Buffer]
    EdgeMask --> BlurFilter[Separable Gaussian Blur (0.5x Downscale)]
    BlurFilter --> NormalBlend[Screen-Space Normal Re-accumulation]
    NormalBlend --> FinalPBR[PBR Lighting with Curvature Highlights]
```

### 3.1 Poisson Sampling Kernel & Discontinuity Filter
The plugin samples the depth and normal buffer in a 16-tap Poisson distribution:
```javascript
// Extracted Poisson Disc offsets (radius scaled by 1/8)
const POISSON_SAMPLES = [
  [-8, 0],  [-6, -4], [-3, -2], [-2, -6],
  [1, -1],  [2, -5],  [6, -7],  [5, -3],
  [4, 1],   [7, 4],   [3, 5],   [0, 7],
  [-1, 3],  [-4, 6],  [-7, 8],  [-5, 2]
];
```

### 3.2 Dynamic Resolution & Camera FOV Scaling
To maintain a constant physical bevel radius regardless of camera distance or screen resolution, the radius uniform is dynamically scaled each frame:
$$f = \frac{H_{\text{canvas}}}{2 \cdot \tan\left(0.5 \cdot \text{FOV} \cdot \frac{\pi}{180}\right)} \cdot 5 \times 10^{-4}$$
$$\text{uniforms.dpr} = \text{displayCanvasScaling} \cdot f$$

During the pass, edge pixels exhibiting normal discontinuities between adjacent faces have their screen-space normals averaged with the neighbor samples, yielding smooth specular highlights across sharp CAD boundaries.

---

## 4. Persistent Asset Caching Architecture (`CacheStorage`)

- **Implementation:** `bundle-0.22.0.js` (Lines 99319, 148168)
- **Target Cache:** `window.caches.open("webgi-cache-storage")`

### 4.1 Comparative Storage Benchmark

| Storage Mechanism | Latency | Maximum Quota | Data Format | Thread Impact |
| :--- | :--- | :--- | :--- | :--- |
| **`localStorage`** | $\sim 5\text{--}15\text{ ms}$ | $5\text{ MB}$ | String only | **Blocking:** Synchronous execution stalls UI. |
| **`IndexedDB`** | $\sim 1\text{--}3\text{ ms}$ | $\sim 50\text{ MB}$ to $1\text{ GB}$ | Structured Objects | **Moderate:** Asynchronous, but requires `ArrayBuffer` serialization/cloning. |
| **`CacheStorage` API (WebGI)** | **$< 0.5\text{ ms}$** | **$10\text{ GB}+$ (Browser Quota)** | **Raw HTTP Response Streams** | **Zero:** Directly feeds `fetch()` streams without main-thread copying. |

### 4.2 How WebGI Streams Assets from CacheStorage
1. When loading an HDR environment map (e.g., `env_metal_001.hdr`) or a multi-megabyte Draco geometry file, the engine checks `webgi-cache-storage`.
2. If present, the raw `Response` stream is piped directly into WebAssembly memory or the WebGL texture unpacker without intermediate JavaScript allocations.
3. This architecture eliminates warm-reload latency: subsequent visits to the 3D configurator display the rendered diamond ring in under **80 milliseconds**.
