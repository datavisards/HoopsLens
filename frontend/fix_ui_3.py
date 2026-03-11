import sys, re
path = r'src\components\TacticsBoard\LineupDiagnosticPanel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1/2. Continuous scoring
text = text.replace('rating: \'Excellent\' | \'Good\' | \'Needs Work\' | \'Missing\';', 'score: number;')
score_color_func = '''const getScoreColor = (score: number) => {
  if (score >= 80) return \\'#52c41a\\';
  if (score >= 60) return \\'#1677ff\\';
  if (score >= 30) return \\'#faad14\\';
  return \\'#fa8c16\\';
};'''
score_color_func = score_color_func.replace('\\\'', \"'\")

text = re.sub(r'const RATING_COLOR: Record<DiagnosticDimension\[\'rating\'\], string> = [^\}]*?};\n', score_color_func + '\n', text, flags=re.DOTALL)
text = re.sub(r'const RATING_VALUE: Record<DiagnosticDimension\[\'rating\'\], number> = \{[\s\S]*?\};\n', '', text)

text = text.replace('const val = RATING_VALUE[d.rating] || 0;', 'const val = (d.score || 0) / 100;')
text = text.replace('RATING_COLOR[d.rating]', 'getScoreColor(d.score)')
text = text.replace('d.rating === \'Excellent\'', 'd.score >= 80')
text = text.replace('RATING_VALUE[d.rating]', '(d.score / 100)')
text = text.replace('const supply = Math.round((d.score / 100) * 100);', 'const supply = Math.round(d.score);')
text = text.replace('const scores = (result.dimensions || []).map(d => RATING_VALUE[d.rating]);', 'const scores = (result.dimensions || []).map(d => d.score);')
text = text.replace('const fitScore = scores.length ? Math.round((scores.reduce((sum, val) => sum + val, 0) / scores.length) * 100) : 0;', 'const fitScore = scores.length ? Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length) : 0;')

# 3. Demand Polygon & tooltips
old_target = r'const targetPolygon = Array.from({ length: n }, (_, i) => getPoint(i, 0.88)).map(p => ${p.x},).join(\' \');'
new_target = '''const targetPolygon = dimensions.map((d, i) => {
    const label = toRadarLabel(d.name);
    const demand = demandForLabel(label, currentActions);
    return getPoint(i, demand);
  }).map(p => ${p.x},).join(' ');'''
text = text.replace(old_target, new_target)

old_poly_style = '<polygon points={targetPolygon} fill=\"rgba(255,255,255,0.03)\" stroke=\"rgba(255,255,255,0.15)\" strokeWidth={1} strokeDasharray=\"3 3\"/>'
new_poly_style = '<polygon points={targetPolygon} fill=\"rgba(255,255,255,0.05)\" stroke=\"rgba(255,255,255,0.4)\" strokeWidth={1} strokeDasharray=\"4 4\" />'
text = text.replace(old_poly_style, new_poly_style)

# Tooltips
text = text.replace('const demand = Math.round(demandForLabel(label, currentActions) * 100);', '') 
text = text.replace('const demand = Math.round(demandForLabel(label, currentActions) );', 'const demand = Math.round(demandForLabel(label, currentActions) * 100);')
text = text.replace('const supply = Math.round(RATING_VALUE[d.rating] * 100);', 'const supply = Math.round(d.score);')

# 4. Remove Team Roster
roster_start = text.find('<div style={{ marginBottom: 14, background: \'rgba(255,255,255,0.04)\'')
if roster_start != -1:
    btn_start = text.find('<Button type=\"primary\" block loading={loading}', roster_start)
    if btn_start != -1:
        text = text[:roster_start] + text[btn_start:]

# 5. Fix STB Below Fit Score
old_advice_render = '<Text style={{ color: \'#a8b4cc\', fontSize: 13, lineHeight: 1.4 }}>{advice}</Text>'
new_advice_render = '<Text style={{ color: \'#a8b4cc\', fontSize: 13, lineHeight: 1.4 }}>{result.weak_links?.length > 0 ? \"Top Missing Role: \" : \"\"}{advice}</Text>'
text = text.replace(old_advice_render, new_advice_render)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
