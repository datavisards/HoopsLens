import sys, re
path = r'src\components\TacticsBoard\LineupDiagnosticPanel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_target = r'const targetPolygon = Array\.from\(\{ length: n \}, \(_, i\) => getPoint\(i, 0\.88\)\)\.map\(p => \$\{p\.x\},\$\{p\.y\}\)\.join\(\' \'\);'
new_target = '''const targetPolygon = dimensions.map((d, i) => {
    const label = toRadarLabel(d.name);
    const demand = demandForLabel(label, currentActions);
    return getPoint(i, demand);
  }).map(p => f\"{p.x},{p.y}\").join(' ');'''.replace('f\"', '$\"', '}')
text = re.sub(old_target, new_target, text)

old_poly_style = r'<polygon points=\{targetPolygon\} fill=\"rgba\(255,255,255,0\.03\)\" stroke=\"rgba\(255,255,255,0\.15\)\" strokeWidth=\{1\} strokeDasharray=\"3 3\"/>'
new_poly_style = r'<polygon points={targetPolygon} fill=\"rgba(255,255,255,0.05)\" stroke=\"rgba(255,255,255,0.4)\" strokeWidth={1} strokeDasharray=\"4 4\" />'
text = re.sub(old_poly_style, new_poly_style, text)

text = re.sub(r'const demand = Math\.round\(demandForLabel\(label, currentActions\) \);', r'const demand = Math.round(demandForLabel(label, currentActions) * 100);', text)

roster_start = text.find('<div style={{ marginBottom: 14, background: \'rgba(255,255,255,0.04)\'')
if roster_start != -1:
    btn_start = text.find('<Button type=\"primary\" block loading={loading}', roster_start)
    if btn_start != -1:
        text = text[:roster_start] + text[btn_start:]

old_advice_render = r'<Text style=\{\{ color: \'#a8b4cc\', fontSize: 13, lineHeight: 1\.4 \}\}>\{advice\}</Text>'
new_advice_render = r'<Text style={{ color: \'#a8b4cc\', fontSize: 13, lineHeight: 1.4 }}>{result.weak_links?.length > 0 ? \"Top Missing Role: \" : \"\"}{advice}</Text>'
text = re.sub(old_advice_render, new_advice_render, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
