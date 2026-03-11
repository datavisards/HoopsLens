import re

path = r'../backend/routers/ai_diagnostics.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# We just inject a quick note about bolding into the output instructions.
new_instruction = r'\"issue\": \"<what capability is missing. Make it VERY concise (1 sentence). Use **bold** markdown for key concepts>\"'
text = re.sub(r'\"issue\": \"<what capability is missing for this tactic>\"', new_instruction, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
