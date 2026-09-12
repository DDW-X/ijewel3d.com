import re
import sys
import json

def extract_classes(filepath):
    classes = set()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Match "class X {" or "class X extends Y {"
            matches = re.finditer(r'class\s+([A-Za-z0-9_]+)(?:\s+extends\s+[A-Za-z0-9_]+)?\s*\{', content)
            for m in matches:
                classes.add(m.group(1))
            
            # Match assignments like "X.Scene = class" or "t.AssetManager = class"
            matches2 = re.finditer(r'([A-Za-z0-9_]+)\s*=\s*class(?:\s+extends\s+[A-Za-z0-9_]+)?\s*\{', content)
            for m in matches2:
                classes.add(m.group(1))
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return list(classes)

if __name__ == '__main__':
    files = [
        'libs/webgi-v0/bundle-0.22.0.js',
        'libs/mini-viewer/0.6.19/bundle.nowebgi.iife.js',
        'assets-seo/index-DlnbDoYP.js'
    ]
    all_classes = {}
    for file in files:
        cls = extract_classes(file)
        all_classes[file] = cls
    
    with open('extracted_classes.json', 'w') as f:
        json.dump(all_classes, f, indent=2)
    print("Done")
