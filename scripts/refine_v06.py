"""Targeted v0.6 content corrections; source review is not a kitchen test.

Run after the catalogue generators and upgrade_v05.py. This script preserves
recipe IDs, images, ingredients and non-target fields. Only changed step arrays
receive a new revision, so saved progress for unaffected recipes remains valid.
"""
from copy import deepcopy
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def steps(text):
    result = []
    for line in text.strip().splitlines():
        title, heat, seconds, body, check = line.split('|', 4)
        result.append({'title': title, 'heat': heat, 'seconds': int(seconds),
                       'text': body, 'check': check})
    return result


REFINEMENTS = {
    'd37': {
        'steps': steps('''
切肉备菜|不开火|0|{{猪里脊}}去筋，横着肉纹切成不超过3毫米厚的片；{{泡发木耳}}去硬根，洗净后放入沸水煮3分钟，捞出沥干。{{胡萝卜}}洗净去皮，切成约1–2毫米薄片；{{姜}}、{{蒜}}切末。|木耳须是冷藏泡发、当天使用的；发黏或有异味时丢弃，不能靠再煮补救。
分料腌肉|冷藏|600|肉片加入{{生抽@0.5}}、{{玉米淀粉}}和{{清水@0.5}}抓匀，盖住冷藏10分钟。余下生抽与水分开放旁边。处理生肉后洗手和刀板。|肉表面有薄浆，不是一碗稀糊；熟食盘与生肉盘分开。
炒熟肉片|中火|240|不粘锅加入{{食用油@0.6666666666666666}}预热约20秒，铺入肉片，约30秒后拨散翻炒，共约3–4分钟。最厚肉片中心达到75℃后盛入干净盘。|多人份分批铺开；温度不足继续加热，不能只看表面变白。
炒软胡萝卜再下木耳|中火|320|同锅加入{{食用油@0.3333333333333333}}，姜蒜炒约20秒；放入胡萝卜与{{清水@0.5}}炒约3分钟，再放已煮木耳翻炒约2分钟。胡萝卜仍硬时少量补热水，继续炒至软。|胡萝卜薄片可被铲边轻压断，木耳热透，锅底有少量汁；木耳若爆跳，减火并保持身体远离锅面。
合炒出锅|中火|90|倒回熟肉，加入{{生抽@0.5}}和{{盐}}，翻炒约1–2分钟后关火装盘。|肉片熟透，胡萝卜熟软、木耳热透，汁能薄薄裹住食材。
'''),
        'tips': ['泡发木耳称的是沥水后的重量；肉片保持薄且大小接近，锅小就分批炒。'],
    },
    'd51': {
        'steps': steps('''
切肉腌好|冷藏|600|{{猪里脊}}切约3毫米细丝，加入{{生抽@0.5}}、{{玉米淀粉@0.5}}和{{清水@0.3333333333333333}}抓匀，盖住冷藏10分钟。其余淀粉与水留作料汁。|处理生肉后洗手和刀板；腌制期间可以准备配菜。
切配并调汁|不开火|0|{{胡萝卜}}、{{青椒}}切细丝；{{泡发木耳}}洗净，沸水煮3分钟后沥干切丝；{{姜}}、{{蒜}}切末。另碗混合{{生抽@0.5}}、{{玉米淀粉@0.5}}、{{清水@0.6666666666666666}}、{{陈醋}}和{{白糖}}。|淀粉没有结块；木耳须冷藏泡发、当天使用，发黏或有异味则丢弃。
炒熟肉丝|中火|240|锅加{{食用油@0.6666666666666666}}，油温热但不冒烟时放肉丝铺开，拨散翻炒约3–4分钟，熟透后盛入干净盘。|最厚肉丝中心达到75℃；肉丝不结成厚团，熟肉不用生肉盘盛放。
炒香配菜|中小火|300|加入{{食用油@0.3333333333333333}}，放姜蒜和{{豆瓣酱}}炒约30秒；加入胡萝卜炒约2分钟，再加青椒和木耳炒约2分钟。|豆瓣有香气而不焦黑；胡萝卜丝变软，锅温过高及时减火。
倒汁合炒|中火|90|肉丝回锅。把料汁从碗底重新搅匀后倒入，翻炒至沸腾，再保持加热约1分钟。|淀粉熟透，汁略浓并能裹住肉丝，不形成白色淀粉块。
关火盛盘|关火|0|关火装盘；本配方不额外加盐。若汁太稠但没有烧焦，沿锅边少量加热水，再加热搅匀。|锅底留少量流动汁，不炒成干黏块。
'''),
    },
    'd52': {
        'steps': steps('''
切丁腌鸡肉|冷藏|600|{{去骨鸡腿肉}}切约1.5厘米丁，加入{{生抽@0.5}}、{{玉米淀粉@0.5}}和{{清水@0.3333333333333333}}抓匀，盖住冷藏10分钟。|鸡肉无冻芯，大小相近；生肉器具和熟食盘分开，处理后洗手。
准备配菜和料汁|不开火|0|{{黄瓜}}切约1厘米丁，{{大葱}}切小段，{{姜}}切片，{{干辣椒}}剪短。另碗混合{{生抽@0.5}}、{{玉米淀粉@0.5}}、{{清水@0.6666666666666666}}、{{陈醋}}和{{白糖}}。|只把余下的淀粉和水调成料汁，不再加一份清单总量；花生须是熟花生。
炒香后下鸡丁|中火|180|锅放{{食用油}}，姜和干辣椒炒约20秒；辣椒不焦时放入鸡丁铺成一层，约2分钟后翻动。|锅温过高就减火；鸡丁不堆厚，锅小或多人份时分批炒。
继续炒熟|中火|240|鸡丁翻炒约3–4分钟，食品温度计检查最大鸡丁的中心达到75℃；不足则继续加热。|鸡丁不结团；颜色只能辅助判断，温度计探头不贴锅底。
配菜收汁|中火|180|加入葱段和黄瓜炒约2分钟。料汁从碗底重新搅匀后倒入，煮沸并翻炒约1分钟。|汁水略浓并裹住鸡丁，锅底不留生淀粉糊。
最后拌熟花生|关火|0|关火后加入{{熟花生米}}拌匀，立即盛到干净盘中，不另加盐。|花生最后放保持脆口；对花生过敏时选其他菜。
'''),
    },
    'b30': {
        'minutes': 25,
        'equipment': '蒸锅、两个浅耐热碗、厨房秤、滤网、耐热小碟',
        'steps': steps('''
打蛋称重|不开火|0|将{{鸡蛋}}去壳打入碗，称实际蛋液重量；搅打到蛋白蛋黄混匀。非整数个鸡蛋先打散，再按食材表取相应蛋液重量。|蛋白挑散，不留大团透明蛋白；蛋壳和生蛋用具及时清洁。
调蛋液|不开火|0|加入{{盐}}和20–30℃温水。温水量按实际蛋液重量的1.5倍调整：例如蛋液100克用水150毫升；食材表的水量是按每个蛋约50克估计。搅匀后过筛。|水温不烫手；不按鸡蛋大小直接套固定水量。
分浅碗备蒸锅|不开火|0|蛋液倒入浅耐热碗，每碗液体深度不超过3厘米；表面浮沫撇掉，盖上耐热小碟。蒸锅加足水，先烧到持续冒汽。|人数增加时增加浅碗或分批蒸，不能把蛋液堆进一个更深的碗。
水开后蒸|中小火|720|水开后放入蛋碗，加盖并保持稳定蒸汽，从入锅开始计时约12分钟。|锅中始终有水和蒸汽；火太大、碗太深都容易使蛋羹粗糙。
焖后检查|关火|120|关火焖约2分钟，戴隔热手套取出，小心揭开碟盖。检查最深处完全凝固且中心达到75℃；未凝固则重新上锅，每次续蒸2分钟再查。|轻晃碗时整体柔软颤动，中心不流动；表面凝固不能代替中心检查。
淋香油上桌|关火|0|确认熟透后均匀淋{{香油}}，放到不烫口再吃。|表面细嫩、中心熟透，端碗注意烫手。
'''),
        'tips': ['蛋液与水的比例按实际重量调整；浅碗比深碗更容易蒸匀，时间以中心状态为准。'],
    },
    'b37': {
        'minutes': 40,
        'equipment': '蒸锅、两个浅耐热碗、压泥工具、厨房秤、耐热小碟',
        'steps': steps('''
切南瓜备水|不开火|0|{{南瓜}}去皮去籽后切约1厘米丁；食材表按可食用部分称量。蒸锅加足水烧开。|块大小接近；锅内水不会直接接触盛南瓜的盘。
先蒸熟南瓜|中大火|600|水开后放南瓜盘，加盖蒸约10分钟；筷子可轻松穿透后取出压细泥。|仍有硬芯就续蒸2分钟再查，不将生硬南瓜直接拌进蛋液。
晾温并拌蛋液|不开火|0|南瓜泥晾到温热、不烫手。{{鸡蛋}}打散，加入{{盐}}与20–30℃的{{温水}}搅匀，再拌入南瓜泥。|南瓜泥无明显硬块；滚烫南瓜泥会把蛋液提前烫成蛋花。
分碗再上锅|不开火|0|拌好的蛋液倒入浅耐热碗，深度不超过3厘米，盖耐热小碟。确认蒸锅水够用并重新烧到持续冒汽。|多人份增加浅碗或分批蒸，保持同样深度。
蒸至凝固|中小火|900|水沸后入锅，加盖保持稳定蒸汽，先蒸约15分钟。揭盖时让蒸汽朝远离自己的方向散开。|中心不流动且达到75℃；未熟每次续蒸2分钟再查，不能只看表层。
取碗上桌|关火|0|用隔热手套取碗，确认中心熟透后放到不烫口再吃。|蛋羹整体凝固、南瓜软烂，不保留湿生蛋液。
'''),
    },
    'd59': {
        'equipment': '煮锅、漏勺、不粘炒锅、刀板、厨房秤',
        'steps': steps('''
切配并烧水|不开火|0|{{四季豆}}去两头和筋，洗净切约1厘米段；{{蒜}}切末。另锅烧足量水，能够完全浸没豆角并留出沸腾空间。|不以生吃试味判断豆角；肉末和蔬菜器具分开。
沸水煮足|中大火|720|水明显沸腾后放豆角，待水重新沸腾再开始计时，保持持续沸腾煮约12分钟，中途轻搅使其均匀受热。|豆角完全熟软、没有生硬芯；水重新开前的时间不计入12分钟，不用低温慢煮替代。
沥水备锅|不开火|0|用漏勺捞出豆角，沥去焯水。炒锅擦干，肉末留在生肉容器中等候下锅。|豆角少带水，避免下油锅飞溅；不把熟豆角放回生肉盘。
炒散肉末|中火|240|锅放{{食用油}}，加入{{猪肉末}}压散翻炒约3分钟，再放蒜末炒约1分钟。|肉末无大团，最厚处中心达到75℃，未达标继续加热。
合炒焖熟|中火|300|加入已煮豆角、{{生抽}}、{{盐}}和{{清水}}拌匀，煮开后加盖轻沸约5分钟，中途翻动一次。|豆角全熟软、锅底有汁；颜色变深不能单独作为熟透依据。
关火装盘|关火|0|打开锅盖检查豆角能被铲边轻松压断，再关火盛盘；仍硬就补少量热水继续焖至软透。|熟透后才盛盘，不以试吃生硬豆角来检查。
'''),
        'tips': ['四季豆先在沸水中煮透再炒，不能省去；多人份分锅煮，保持豆角完全浸入且均匀受热。'],
    },
    'd67': {
        'steps': steps('''
切配|不开火|0|{{去骨鸡腿肉}}完全解冻后切约2厘米块；{{鲜香菇}}去硬蒂、洗净切约5毫米厚片；{{姜}}切细丝。处理生鸡肉后洗手和刀板。|鸡肉无冻芯，大小接近；使用鲜香菇，不把泡发干菇直接套用同样重量。
腌鸡肉|冷藏|600|鸡肉加入姜、{{生抽}}、{{蚝油}}和{{玉米淀粉}}抓匀，再加{{食用油}}，盖住冷藏10分钟。|薄浆裹肉，不成淀粉疙瘩；生抽蚝油已经含盐，不另加盐。
摊浅盘并烧水|不开火|0|鸡肉与香菇拌匀，在耐热浅盘摊成一层，肉块之间留缝。蒸锅加足水烧到持续冒汽。|不用深碗堆满；多人份增加盘或分批蒸，保持肉块大小和层数。
水开后蒸|中大火|1200|水开后放入蒸盘，加盖保持持续蒸汽，从入锅开始计时约20分钟。锅中不能烧干。|水开后才计时；中途补水时用热水并小心蒸汽。
检查鸡肉中心|中小火|0|检查最大鸡块中心达到75℃，探头不贴盘底；不足则加盖续蒸3分钟后再查。香菇也应熟软。|食品温度计是主要检查手段；盘汁变色、肉表面变白不能单独判熟。
翻拌上桌|关火|0|确认熟透后关火，用隔热夹取盘，把已经蒸熟的盘汁轻轻拌匀鸡肉，趁热食用。|生鸡肉用过的筷子先清洗，再用于盛菜；端盘防烫。
'''),
        'tips': ['使用鲜香菇，无须提前泡发；蒸盘保持单层，鸡块更大或堆厚都需要延长并检查中心温度。'],
    },
    'd99': {
        'minutes': 30,
        'equipment': '煮锅、漏勺、20～22厘米不粘锅、宽铲、厨房秤、食品温度计',
        'steps': steps('''
洗净挑壳|不开火|0|选冷藏新鲜{{小海蛎肉}}，轻轻冲洗，逐个挑出碎壳后沥干。另锅烧足量水，处理生海蛎后清洗器具和手。|只用小海蛎肉，避开大颗生蚝；没有食品温度计时优先换一道能可靠检查熟透的菜。
先煮透海蛎|中大火|90|沸水中加入海蛎，保持加热；食品温度计检查最大海蛎中心达到90℃后，再继续加热至少90秒。取一只测温时其余海蛎仍留在热水中。确认后捞出沥干。|90秒从中心达到90℃后开始计时；颜色不透明不能替代这项检查，未达温度继续煮。
拌薄浆|不开火|0|沥干的熟海蛎加入{{生抽}}、{{料酒}}、{{红薯淀粉}}和{{清水}}轻拌。|薄浆附着海蛎；用干净熟食碗，不再接触生海蛎汁。
打蛋切葱|不开火|0|{{鸡蛋}}打散，加入{{盐}}搅匀；{{小葱}}洗净切细。|蛋白挑散，葱末和熟海蛎使用干净器具。
煎海蛎薄浆|中小火|120|不粘锅放{{食用油}}，加入海蛎铺成单层，煎约1分钟后轻翻，再煎约1分钟使粉浆凝固。|海蛎已经煮透，此步只煎熟粉浆；锅小或多人份分批做。
倒蛋液定形|小火|120|均匀倒入蛋液，撒葱末，轻转锅填满空隙，小火煎约2分钟。|蛋液边缘定形、底面浅黄；上色过快及时减火。
分块翻熟|小火|180|用锅铲分成便于翻动的小块，逐块托起翻面，再煎约2～3分钟。|每块都翻到；蛋层中心完全凝固，没有流动生蛋液。
检查后盛盘|关火|0|确认蛋层中心达到75℃且完全凝固后盛盘；不足则继续小火加热再查。测温探头每次使用前后清洁。|海蛎煮透与蛋液凝固都要完成；刚出锅内部很烫。
'''),
        'tips': ['海蛎先煮透再薄煎，口感会更紧实；海蛎的90℃维持90秒检查与最后蛋层检查不能互相替代。'],
    },
}

AUDIT_SOURCES = [
    {'title': 'FoodSafety.gov · Safe Minimum Internal Temperatures',
     'url': 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures',
     'supports': '禽肉74℃、蛋类凝固与测温原则；本配方保留更保守的75℃中心检查。'},
    {'title': '香港食物安全中心 · 烹煮',
     'url': 'https://www.cfs.gov.hk/sc_chi/consumer_zone/safefood_all/five_keys_apply_cook.html',
     'supports': '蚝及介贝类中心90℃并维持90秒；测温探头放最厚处、不接触容器。'},
    {'title': '北京市政府 · 如何预防常见植物性食物中毒',
     'url': 'https://www.beijing.gov.cn/hudong/bmwd/jsjbmyyt/2022jmwd/spaq2022/spaqwt2022/202210/t20221027_2845879.html',
     'supports': '四季豆沸水烫煮10分钟以上再炒；本配方选重新沸腾后12分钟作为流程参考。'},
    {'title': '国家市场监督管理总局 · 预防椰酵假单胞菌食物中毒',
     'url': 'https://www.samr.gov.cn/xw/zj/art/2023/art_2f3583581f2c477caeeab0bf74bc6798.html',
     'supports': '木耳泡发后及时加工、冷藏与变质丢弃；耐热毒素不能依靠再加热补救。'},
]


def apply(recipes):
    before = deepcopy(recipes)
    by_id = {r['id']: r for r in recipes}
    for recipe_id, fields in REFINEMENTS.items():
        by_id[recipe_id].update(deepcopy(fields))
    # Correct copied completion criteria without inventing extra ingredients.
    for n in range(9, 16):
        r = by_id[f'b{n:02}']
        r['steps'][3]['check'] = '中心完全凝固，没有湿生面糊或流动蛋液；切开最厚处仍湿则继续小火煎。'
        if n in (9, 13, 15):
            r['steps'][0]['check'] = '配料处理好；使用直径24–26厘米的不粘平底锅。'
    for n in (23, 24, 25, 26, 27):
        by_id[f'b{n:02}']['steps'][2]['check'] = '面条无白色硬芯，蛋液完全凝固；汤持续轻沸，不只检查表层。'
    by_id['b28']['steps'][2]['check'] = '面条无白色硬芯，虾仁中心不透明且达到63℃；青菜梗变软。'
    by_id['b29']['steps'][2]['check'] = '面条无白色硬芯，肉丝已炒熟；榨菜加入后汤重新沸腾。'
    # A fermentation checkpoint timer is useful; volume still decides readiness.
    by_id['b58']['steps'][2]['seconds'] = 2400
    by_id['b58']['steps'][2]['text'] = '15厘米耐热深模刷{{食用油}}，倒面糊至不超过一半深。盖住放在温暖处，先计时40分钟检查；未到约两倍体积时继续等候，每10分钟检查一次，通常约40～60分钟。'
    by_id['b58']['steps'][2]['check'] = '体积约两倍、有明显气孔才上锅；倒计时结束不代表已发好，环境较凉时需要更久。'
    practical_tips = {
        'd65': ['冬瓜片约4毫米厚，肉馅约5毫米厚；夹好后单层蒸，过厚容易外软内生。'],
        'b70': ['蛋黄蛋白都凝固后及时关火，避免久煮变硬；番茄汁太干时少量补热水。'],
        'b72': ['时间从干绿豆开始计算；绿豆煮至能轻松压成泥再加牛奶，奶入锅后小火加热、防止扑锅。'],
        'd82': ['五花肉先煮熟再切薄片炒；豆瓣酱有辣味，不能当作不辣菜。'],
        'd80': ['鸡肉用平底锅煎熟后再拌糖醋汁，外皮较柔软；淀粉裹薄，肉丁不要堆厚。'],
    }
    for recipe_id, tips in practical_tips.items():
        by_id[recipe_id]['tips'] = tips
    changed_steps = []
    changes = []
    for old, new in zip(before, recipes):
        fields = [key for key in new if key != 'revision' and old.get(key) != new[key]]
        if not fields:
            continue
        if old['steps'] != new['steps']:
            new['revision'] = hashlib.sha256(json.dumps(new['steps'], ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]
            changed_steps.append(new['id'])
        for step in new['steps']:
            for match in re.finditer(r'\{\{([^}@]+)(?:@[^}]+)?\}\}', step['text'] + step['check']):
                assert any(i['name'] == match[1] for i in new['ingredients']), (new['id'], match[1])
        changes.append({'id': new['id'], 'name': new['name'], 'changedFields': fields,
                        'previousRevision': old.get('revision'), 'revision': new.get('revision'),
                        'before': {key: old.get(key) for key in fields}})
    return {'reviewedOn': '2026-10-01', 'kitchenValidation': 'not-tested',
            'scope': '8 targeted recipe flows, copied completion criteria, one fermentation checkpoint and practical tips',
            'stepRevisionChangedIds': changed_steps, 'changes': changes, 'references': AUDIT_SOURCES}


def main():
    path = ROOT / 'web/recipes.json'
    recipes = json.loads(path.read_text(encoding='utf-8'))
    audit = apply(recipes)
    path.write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'web/recipes.js').write_text('window.RECIPES = ' + json.dumps(recipes, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    # Merge subsequent refinements while retaining the original v0.5 evidence.
    audit_path = ROOT / 'docs/v06-content-audit.json'
    if audit['changes'] and audit_path.exists():
        previous = json.loads(audit_path.read_text(encoding='utf-8'))
        changes_by_id = {item['id']: item for item in previous['changes']}
        for item in audit['changes']:
            if item['id'] in changes_by_id:
                original = changes_by_id[item['id']]
                for key, value in item['before'].items(): original['before'].setdefault(key, value)
                original['changedFields'] = list(dict.fromkeys(original['changedFields'] + item['changedFields']))
                original['revision'] = item['revision']
            else: changes_by_id[item['id']] = item
        audit['changes'] = list(changes_by_id.values())
        audit['stepRevisionChangedIds'] = list(dict.fromkeys(previous['stepRevisionChangedIds'] + audit['stepRevisionChangedIds']))
    if audit['changes'] or not audit_path.exists():
        audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('v0.6 refinements:', len(audit['changes']), 'recipes; step revisions:', ', '.join(audit['stepRevisionChangedIds']))


if __name__ == '__main__':
    main()
