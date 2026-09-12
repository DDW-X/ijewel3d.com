import re
import json

files = [
    'libs/webgi-v0/bundle-0.22.0.js',
    'libs/mini-viewer/0.6.19/bundle.nowebgi.iife.js',
    'assets-seo/index-DlnbDoYP.js'
]

results = {}

keywords = [
    "THREE.",
    "WebGL",
    "draco",
    "geometry",
    "material",
    "shader",
    "Pixotronics",
    "WebGI",
    "SSAO",
    "SSR",
    "Bloom",
    "Raycaster",
    "BVH"
]

for file in files:
    results[file] = {k: 0 for k in keywords}
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            for kw in keywords:
                results[file][kw] = content.count(kw)
    except Exception as e:
        print(e)

print(json.dumps(results, indent=2))
