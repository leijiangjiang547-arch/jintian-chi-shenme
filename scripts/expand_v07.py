"""Merge the authored v7 catalog and verified local illustration registry.

Run after refine_v06.py. Existing IDs, step revisions, and image cells stay stable.
Never invent missing sources or replace absent images with unrelated old dishes.
"""
import collections
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

ALIASES = {
    'd01': ['番茄炒蛋', '番茄炒鸡蛋', '西红柿炒蛋'],
    'd03': ['角瓜炒鸡蛋', '西葫芦炒蛋'],
    'd10': ['酸辣马铃薯丝', '酸辣洋芋丝'],
    'd11': ['手撕卷心菜', '手撕圆白菜'],
    'd17': ['清炒菜花', '清炒花椰菜'],
    'd18': ['醋溜大白菜'],
    'd19': ['清炒莴苣笋'],
    'd30': ['青椒炒香干'],
    'd31': ['青椒炒肉丝', '青椒炒猪肉'],
    'd34': ['蒜薹炒肉', '蒜苔炒肉丝'],
    'd37': ['木耳炒肉片'],
    'd40': ['菜花炒肉', '花椰菜炒肉'],
    'd43': ['孜然炒牛肉'],
    'd51': ['鱼香肉丝家常做法'],
    'd52': ['宫爆鸡丁', '宫保鸡'],
    'd56': ['虾仁炒蛋', '滑蛋虾仁'],
    'd58': ['家常豆腐', '家常烧豆腐'],
    'd60': ['鱼香茄条'],
    'd62': ['蒜蓉蒸虾', '蒜蓉虾粉丝'],
    'd63': ['豉汁蒸排骨', '豆豉蒸排骨'],
    'd74': ['猪肉白菜炖粉条', '白菜炖粉条'],
    'd81': ['红烧五花肉', '五花肉红烧'],
    'd82': ['回锅肉', '蒜苗炒回锅肉'],
    'd84': ['蒸鲈鱼'],
    'd86': ['独面筋', '天津独面筋'],
    'd88': ['农家小炒肉', '湖南辣椒炒肉', '小炒肉'],
    'd91': ['糖醋里脊', '糖醋猪里脊'],
    'd95': ['龙井茶虾仁'],
    'd98': ['干丝汤', '煮干丝', '干丝煮虾仁'],
    'd99': ['蚵仔煎', '牡蛎煎'],
    'd101': ['凉拌黄瓜', '拌黄瓜'],
    'd104': ['番茄蛋汤', '番茄鸡蛋汤', '西红柿蛋汤'],
    'b07': ['牛奶燕麦', '奶香燕麦粥'],
    'b09': ['鸡蛋饼', '葱花蛋饼'],
    'b30': ['蒸蛋', '鸡蛋羹', '水蒸蛋'],
    'b33': ['小馄饨', '鲜肉馄饨'],
    'b39': ['韭菜盒子'],
    'b41': ['香蕉鸡蛋卷', '香蕉蛋卷'],
    'b42': ['蓝莓夹心吐司', '蓝莓煎吐司'],
    'b74': ['虾仁肠粉', '鸡蛋肠粉'],
}


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def write(path, value):
    (ROOT / path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    old = [r for r in read('web/recipes.json') if not r['id'].startswith(('v7a', 'v7b'))]
    assert len(old) == 180, 'Rebuild requires the complete v6 baseline'
    legacy_revisions = {r['id']: r['revision'] for r in old}
    added = read('scripts/catalog_v07_a.json') + read('scripts/catalog_v07_b.json')
    assert len(added) == 120, 'Both authored batches must be complete'
    images = read('scripts/catalog_v07_images.json')
    for r in old:
        r['aliases'] = list(dict.fromkeys([*r.get('aliases', []), *ALIASES.get(r['id'], [])]))
    for r in added:
        assert r['id'] in images, 'Missing illustration: ' + r['name']
        r['image'] = images[r['id']]
        r['revision'] = hashlib.sha256(json.dumps(r['steps'], ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]
        r['edition'] = '0.7.0'
        r.setdefault('cuisineNote', '按本菜风味浏览，不代表唯一产地。')
        r['review'] = {'editorial': 'source-read-family-formula', 'kitchen': 'not-tested', 'device': 'pending'}
        r['tokenAmounts'] = True
        names = {i['name'] for i in r['ingredients']}
        for step in r['steps']:
            for name, fraction in re.findall(r'\{\{([^}@]+)(?:@([\d.]+))?\}\}', step['text'] + ' ' + step['check']):
                assert name in names, (r['name'], 'unknown token', name)
                assert not fraction or 0 < float(fraction) <= 1, (r['name'], 'invalid fraction', fraction)
        text = ' '.join(s['text'] for s in r['steps'])
        for ingredient in r['ingredients']:
            assert ingredient['amount'] >= 0
            if ingredient['amount'] > 0:
                assert ingredient['name'] in text, (r['name'], 'missing destination', ingredient['name'])
        assert max(s['seconds'] for s in r['steps']) <= r['minutes'] * 60, (r['name'], 'wait omitted from total time')
        visible = ' '.join([r['difficultyReason'], *r['tips'], *[s['text'] + s['check'] for s in r['steps']]])
        assert not re.search('已阅读|固定版本|本版|原文|不采纳功效|未逐道|核查状态', visible), (r['name'], 'editorial copy leaked')
    recipes = old + added
    assert len({r['id'] for r in recipes}) == 300
    assert len({r['name'] for r in recipes}) == 300
    assert all(r['revision'] == legacy_revisions[r['id']] for r in old), 'Old progress revision changed'
    write('web/recipes.json', recipes)
    (ROOT / 'web/recipes.js').write_text('window.RECIPES = ' + json.dumps(recipes, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    write('docs/v07-content-audit.json', {
        'reviewedOn': '2026-10-01', 'total': 300,
        'countsByCategory': dict(collections.Counter(r['category'] for r in recipes)),
        'countsByCuisine': dict(collections.Counter(r['cuisine'] or '未标注地域' for r in recipes)),
        'addedIds': [r['id'] for r in added], 'legacyRevisions': legacy_revisions,
        'legacyAliasIds': list(ALIASES), 'kitchenValidation': 'not-tested',
        'sourceAudits': ['v07-sources-a.json', 'v07-sources-b.json'],
        'timing': 'two-person estimates including declared preparation and waits, not measured',
    })
    write('docs/v07-candidate-status.json', {
        'reviewedOn': '2026-10-01',
        'historicalFile': 'advanced-candidates.json',
        'publishedCurrentFormulas': {'d87': 'v7a02', 'd89': 'v7a11', 'd90': 'v7a13'},
        'differentMethodAlternative': {'d94': 'v7b22'},
        'stillDeferred': ['d94', 'd96'],
        'note': 'Historical IDs and draft steps are not shipped. The new fried lychee pork is not the old pan-fried draft; red-braised lions head is not clear-braised lions head.',
    })
    print('v0.7:', len(recipes), 'recipes;', dict(collections.Counter(r['category'] for r in recipes)))


if __name__ == '__main__':
    main()
