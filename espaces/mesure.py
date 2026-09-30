"""Compte les espaces en dur dans apps/mobile (app/ et src/), hors tests."""
import re, sys, os, collections, json

ROOT = '/Users/adamjld/orca/workspaces/Take/espaces/apps/mobile'
REM = 14  # NativeWind natif : 1rem = 14 pt
files = []
for base in ('app', 'src'):
    for d, _, fs in os.walk(os.path.join(ROOT, base)):
        for f in fs:
            if f.endswith('.tsx') and '.test.' not in f:
                files.append(os.path.join(d, f))

tw = re.compile(r'(?<![\w-])(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-y|space-x)-(\[[^\]]+\]|[0-9.]+)(?![\w.])')
st = re.compile(r'\b(padding|margin|gap|rowGap|columnGap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*(-?[0-9.]+)\b')
tok = re.compile(r'\b(SPACING|DESIGN_SPACING)\.([a-z]+)')

def tw_pt(v):
    if v.startswith('['):
        m = re.match(r'\[(-?[0-9.]+)(px|rem)?\]', v)
        if not m: return None
        n = float(m.group(1)); return n * REM if m.group(2) == 'rem' else n
    return float(v) * 0.25 * REM

out = collections.defaultdict(list)  # (prop) -> [(pt, file:line)]
tokens = collections.Counter()
for f in files:
    rel = os.path.relpath(f, ROOT)
    for i, line in enumerate(open(f, encoding='utf-8'), 1):
        if 'className' in line or 'class=' in line or '"' in line or "'" in line:
            for m in tw.finditer(line):
                pt = tw_pt(m.group(2))
                if pt is not None:
                    out['tw:' + m.group(1)].append((round(pt, 1), f'{rel}:{i}'))
        for m in st.finditer(line):
            out[m.group(1) + (m.group(2) or '')].append((float(m.group(3)), f'{rel}:{i}'))
        for m in tok.finditer(line):
            tokens[f'{m.group(1)}.{m.group(2)}'] += 1

if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'summary'
    if what == 'summary':
        print('fichiers', len(files))
        for k in sorted(out, key=lambda k: -len(out[k])):
            c = collections.Counter(v for v, _ in out[k])
            print(f'{k:22s} n={len(out[k]):4d} distinctes={len(c):3d}  ', ' '.join(f'{v:g}×{n}' for v, n in c.most_common(14)))
        print('jetons', tokens.most_common())
    else:
        for v, loc in out[what]:
            print(v, loc)
