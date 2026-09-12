import os
import sys
import json
try:
    import requests
except ImportError:
    import urllib.request
    requests = None

TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
REPO = "DDW-X/ijewel3d.com"

if not TOKEN:
    print("ERROR: Neither GITHUB_TOKEN nor GH_TOKEN environment variable is set.")
    print("Please set your GitHub Personal Access Token (PAT) with 'repo' scope:")
    print("  PowerShell: $env:GH_TOKEN=\"your_github_token_here\"")
    print("  CMD:        set GH_TOKEN=your_github_token_here")
    print("  Bash:       export GH_TOKEN=\"your_github_token_here\"")
    print("Then re-run this script or run: gh auth login")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

# 1. Update Description and Website
repo_payload = {
    "description": "0-to-1 reverse-engineering and architectural case study of the iJewel3D WebGL engine by DDW-X. 9 deep-dive chapters covering dispersion shaders, WASM geometry decoding, and flat-buffer BVH.",
    "homepage": "https://ddw-x.github.io/ijewel3d.com/"
}

print(f"Updating repository {REPO} description and homepage...")
r1 = requests.patch(f"https://api.github.com/repos/{REPO}", headers=HEADERS, json=repo_payload)
print(f"Repo details update status: {r1.status_code}")
if r1.status_code != 200:
    print(r1.text)

# 2. Update Topics (Tags)
topics_payload = {
    "names": [
        "webgl", "threejs", "webgi", "reverse-engineering", "webassembly", "wasm",
        "glsl-shaders", "computational-geometry", "bvh", "pbr", "post-processing",
        "case-study", "virtual-try-on", "draco", "ffmpeg-wasm", "performance-optimization",
        "screen-space-reflections", "shader-analysis", "cad-optimization", "cachestorage"
    ]
}

print(f"Updating repository {REPO} topics ({len(topics_payload['names'])} topics)...")
r2 = requests.put(f"https://api.github.com/repos/{REPO}/topics", headers=HEADERS, json=topics_payload)
print(f"Topics update status: {r2.status_code}")
if r2.status_code != 200:
    print(r2.text)

if r1.status_code == 200 and r2.status_code == 200:
    print("\nSUCCESS: Repository About section, Homepage URL, and all 20 topics updated successfully!")
