"""Report editorial checks that need human judgment; never auto-change quantities."""
import collections
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
recipes = json.loads((ROOT / 'web/recipes.json').read_text(encoding='utf-8'))
added = [r for r in recipes if r['id'].startswith(('v7a', 'v7b'))]
flags = []
for r in added:
    references = collections.defaultdict(list)
    for n, s in enumerate(r['steps']):
        for name, fraction in re.findall(r'\{\{([^}@]+)(?:@([\d.]+))?\}\}', s['text']):
            references[name].append({'step': n + 1, 'fraction': float(fraction or 1)})
    reasons = []
    for ingredient in r['ingredients']:
        if ingredient['amount'] > 0 and not references[ingredient['name']]:
            reasons.append({'type': 'no-amount-token', 'ingredient': ingredient['name']})
        refs = references[ingredient['name']]
        if any(p['fraction'] < 1 for p in refs) and abs(sum(p['fraction'] for p in refs) - 1) > 0.0001:
            reasons.append({'type': 'split-allocation-review', 'ingredient': ingredient['name'], 'references': refs})
        if ingredient['name'] == '盐' and ingredient['amount'] > 6:
            reasons.append({'type': 'salt-method-review', 'amount': ingredient['amount']})
        if ingredient['name'] == '食用油' and ingredient['amount'] > 60:
            reasons.append({'type': 'frying-oil-review', 'amount': ingredient['amount']})
    timers = sum(s['seconds'] for s in r['steps']) / 60
    if timers > r['minutes']:
        reasons.append({'type': 'sequential-timers-exceed-estimate', 'timerMinutes': timers, 'total': r['minutes']})
    if reasons:
        flags.append({'id': r['id'], 'name': r['name'], 'reasons': reasons})
report = {'scope': len(added), 'reviewedOn': '2026-10-01', 'flags': flags,
          'meaning': 'Flags require manual review. Repeated preparation references do not necessarily mean repeated consumption; frying oil is not all ingested. No automated kitchen validation.'}
(ROOT / 'docs/v07-quantity-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'recipes': len(added), 'flagged': len(flags), 'ids': [f['id'] for f in flags]}, ensure_ascii=False))
