import sys, re
path = r'src\components\TacticsBoard\LineupDiagnosticPanel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

app_comp_start = text.find('const LineupDiagnosticPanel: React.FC<LineupDiagnosticPanelProps>')

new_func = '''
const renderIssue = (text: string) => {
  if (!text) return text;
  // Simple regex to split text to bold parts and non-bold parts.
  const parts = text.split(/(\*\*.*?\*\*|\b[A-Z]{3}\b)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#fff' }}>{part.slice(2, -2)}</strong>;
    }
    if (/^[A-Z]{3}$/.test(part)) {
      return <strong key={i} style={{ color: '#faad14' }}>{part}</strong>;
    }
    return part;
  });
};

'''

text = text[:app_comp_start] + new_func + text[app_comp_start:]

text = text.replace('\"{wl.issue}\"', '{renderIssue(wl.issue)}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
