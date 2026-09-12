with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
import re
content = re.sub(r'<script src=".*?instrument\.js\\?.*?></script>', '<script src="/instrument.js"></script>', content)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
