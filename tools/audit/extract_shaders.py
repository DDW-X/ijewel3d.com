import re
import json

def extract_shaders(filepath):
    shaders = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Match strings in quotes (single, double, or backticks)
            string_pattern = r'([`\'"])(.*?)\1'
            matches = re.finditer(string_pattern, content, re.DOTALL)
            for m in matches:
                s = m.group(2)
                # Check if it looks like a shader
                if 'void main' in s and ('gl_Position' in s or 'gl_FragColor' in s or 'fragColor' in s or 'vUv' in s):
                    shaders.append(s)
    except Exception as e:
        print(e)
    return shaders

shaders = extract_shaders('libs/webgi-v0/bundle-0.22.0.js')
print(f"Found {len(shaders)} shaders.")
if shaders:
    print("First shader snippet:")
    print(shaders[0][:500])
