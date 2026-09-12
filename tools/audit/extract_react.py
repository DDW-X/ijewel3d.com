import re

def extract_react_components(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # React components usually look like `function ComponentName(props)` or `const ComponentName = (props) =>`
            # In minified code, they might be `function X(e){return React.createElement...` or `jsx(X, ...)`
            # Let's search for strings that look like typical component names or UI labels.
            strings = re.findall(r'"([A-Z][a-zA-Z0-9]+)"', content)
            unique_strings = set(strings)
            print("Potential Components / Capitalized Strings (sample):")
            print(list(unique_strings)[:50])
            
            # Let's also look for interesting URLs or API endpoints
            endpoints = re.findall(r'"(/api/[^"]+)"', content)
            print("\nAPI Endpoints:")
            print(set(endpoints))
            
    except Exception as e:
        print(e)

extract_react_components('assets-seo/index-DlnbDoYP.js')
