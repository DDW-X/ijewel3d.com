import re
import json

def extract_apis(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            endpoints = re.findall(r'"(https?://[^"]+|/[a-zA-Z0-9_]+/[a-zA-Z0-9_/-]+)"', content)
            return set(endpoints)
    except Exception as e:
        return set()

endpoints = set()
for file in ['libs/webgi-v0/bundle-0.22.0.js', 'libs/mini-viewer/0.6.19/bundle.nowebgi.iife.js', 'assets-seo/index-DlnbDoYP.js']:
    endpoints.update(extract_apis(file))

print(json.dumps([e for e in endpoints if 'ijewel' in e or 'api' in e or len(e) > 10], indent=2))
