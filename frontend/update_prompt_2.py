import re

path = r'../backend/routers/ai_diagnostics.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_instruction = r'\"issue\": \"<VERY concise 1 sentence issue. Use **bold** markdown for key concepts>\"'
text = re.sub(r'\"issue\": \"<issue>\"', new_instruction, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
