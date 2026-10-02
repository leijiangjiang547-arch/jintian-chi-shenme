"""Append forty independently authored hot home dishes to the v8 catalog.

Idempotent: discard only v9 records before merging. Existing IDs, quantities,
image cells and step revisions are preserved byte-for-byte as data.
Full rebuild order ends with expand_v07 -> refine_v08 -> expand_v09.
"""
import collections
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))


def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    old = [r for r in read('web/recipes.json') if not r['id'].startswith(('v9a', 'v9b'))]
    assert len(old) == 300, 'Requires the complete v8 baseline'
    legacy = {r['id']: r['revision'] for r in old}
    before = hashlib.sha256(json.dumps(old, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    added = read('scripts/catalog_v09_a.json') + read('scripts/catalog_v09_b.json')
    assert len(added) == 40 and len({r['id'] for r in added}) == 40
    images = read('scripts/catalog_v09_images.json')
    for r in added:
        assert r['category'] == '家常菜' and r['servings'] == 2
        assert r['id'] in images and len(r['steps']) >= 7
        r['image'] = {**images[r['id']], 'alt': r['name'] + '成品参考，AI生成，非实拍'}
        assert (ROOT / 'web' / r['image']['sheet']).is_file()
        r['revision'] = hashlib.sha256(json.dumps(r['steps'], ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]
        r['edition'] = '0.9.0'
        r['review'] = {'editorial': 'source-read-family-formula', 'kitchen': 'not-tested', 'device': 'pending'}
        r['tokenAmounts'] = True
        assert r['sources'] and r['minutes'] > 0
        assert isinstance(r['equipment'], str) and r['equipment']
        assert isinstance(r['pairing'], str) and r['pairing']
        assert len({i['name'] for i in r['ingredients']}) == len(r['ingredients'])
        names = {i['name'] for i in r['ingredients']}
        assert {'盐', '食用油'} <= names
        text = ' '.join(s['text'] for s in r['steps'])
        for s in r['steps']:
            assert s['title'] and s['heat'] and s['check'] and s['seconds'] >= 0
            for name, fraction in re.findall(r'\{\{([^}@]+)(?:@([\d.]+))?\}\}', s['text'] + s['check']):
                assert name in names, (r['name'], name)
                assert not fraction or 0 < float(fraction) <= 1
        for i in r['ingredients']:
            assert i['amount'] >= 0 and i['unit']
            assert i['amount'] == 0 or '{{' + i['name'] in text, (r['name'], 'ingredient not allocated', i['name'])
        for name in ['盐', '食用油']:
            tokens = re.findall(r'\{\{' + name + r'(?:@([\d.]+))?\}\}', text)
            amount = next(i['amount'] for i in r['ingredients'] if i['name'] == name)
            assert amount == 0 or abs(sum(float(f or 1) for f in tokens) - 1) < 0.001, (r['name'], name, tokens)
        assert max(s['seconds'] for s in r['steps']) <= r['minutes'] * 60
        assert not r.get('timing') or sum(r['timing'].values()) == r['minutes'], (r['name'], 'timing totals')
        assert not re.search('已阅读|固定版本|本版|原文|不采纳功效|未逐道|核查状态', text + ' '.join(r['tips']))
    recipes = old + added
    assert len({r['name'] for r in recipes}) == 340
    assert len({r['id'] for r in recipes}) == 340
    assert all(r['revision'] == legacy[r['id']] for r in old)
    assert hashlib.sha256(json.dumps(old, ensure_ascii=False, sort_keys=True).encode()).hexdigest() == before
    write('web/recipes.json', recipes)
    (ROOT / 'web/recipes.js').write_text('window.RECIPES = ' + json.dumps(recipes, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    write('docs/v09-content-audit.json', {
        'reviewedOn': '2026-10-01', 'total': 340,
        'countsByCategory': dict(collections.Counter(r['category'] for r in recipes)),
        'countsByCuisine': dict(collections.Counter(r['cuisine'] or '未标注地域' for r in recipes)),
        'addedIds': [r['id'] for r in added], 'legacyRevisions': legacy,
        'legacyDataSha256': before, 'sourceAudits': ['v09-sources-a.json', 'v09-sources-b.json'],
        'kitchenValidation': 'not-tested',
        'timing': 'two-person estimates including stated preparation and waits, not measured',
    })
    print('v0.9:', len(recipes), 'recipes;', dict(collections.Counter(r['category'] for r in recipes)))


if __name__ == '__main__':
    main()
