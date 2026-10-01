"""Apply bounded v8 catalog corrections after expand_v07.py.

Only steps determine revision hashes. Metadata-only corrections keep cooking
progress. The audit retains the first before-state on repeated application.
No recipe counts, IDs, ingredient quantities or illustration cells are changed.
"""
from copy import deepcopy
from pathlib import Path
from collections import Counter
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'docs/v08-content-audit.json'


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]


def amend_step(recipe, index, **fields):
    recipe['steps'][index].update(fields)


def apply(recipes):
    by_id = {recipe['id']: recipe for recipe in recipes}
    assert len(recipes) == 300 and len(by_id) == 300, 'Requires the complete v7 catalog'

    # Two slices make one sandwich: count pairs from the actual scaled toast.
    for n in range(17, 23):
        recipe = by_id[f'b{n:02}']
        filling = '夹馅和生菜' if n <= 20 else '酱料和水果'
        amend_step(recipe, 2,
                   text=f'把全部吐司按每两片一组配好。{filling}按实际组数均分，铺在各组的一片上，再盖另一片，轻压后对半切。',
                   check='每组用两片吐司；人数增加时增加组数，夹馅不全堆进一个大三明治。组装后及时食用。')

    # Keep one pancake thin; a scaled amount changes batches, never thickness.
    for n in range(9, 17):
        recipe = by_id[f'b{n:02}']
        amend_step(recipe, 2,
                   text='使用24–26厘米不粘平底锅，每锅取约180–230克面糊，摊到不超过5毫米厚；锅较小时少取。将{{食用油}}按预计锅数分开，每锅刷其中一份，再倒面糊，小火煎约3分钟。',
                   check='厚度优先，余下的面糊留作后续批次；底部浅金黄、表面不再流动时再翻。')
        amend_step(recipe, 4,
                   title='逐锅完成余下面糊',
                   text='剩余面糊逐锅按同样厚度摊开，各取一份预留的油，两面各煎约3分钟并检查中心；最后不足一锅的面糊也薄摊。已经用完面糊时即可结束。',
                   check='每张中心均熟透，没有湿生面糊；人数增加时增加锅数，不能靠加厚来省批次。')

    recipe = by_id['b35']
    amend_step(recipe, 3,
               title='卷起并继续下一张',
               text='番茄酱和生菜按实际手抓饼张数均分。每张熟饼抹一份酱、放一份生菜后卷起；有余下饼皮时重复煎饼和煎蛋，每张配一个蛋，直到材料用完。',
               check='生菜在关火后放，每张蛋的蛋白和蛋黄都已凝固；增加人数时增加饼的张数。')
    recipe['tips'] = ['每张分别煎熟，饼皮大小不变；两人份预计用时包含两张分批煎制，更多张需要更久。']

    recipe = by_id['b39']
    amend_step(recipe, 3,
               text='面团按每份约60–65克分出，馅按面团份数均分。每份擀成约2毫米薄圆片，馅铺在半边，折合后压紧边缘。',
               check='每只馅铺平、成品厚度不超过1.5厘米；总量增加时增加盒子数量，不能加厚。')
    amend_step(recipe, 4,
               text='将余下{{食用油@0.428572}}按实际烙制批次数分开，每批刷一份。盒子平铺留缝，小火每面烙约4分钟，余下批次同样做。',
               check='两面金黄，面皮无湿白层；不要为一次放完而叠放。')
    recipe['tips'] = ['鸡蛋先炒熟、放温后再包；用时包含醒面，多人份增加烙制批次并保持同样厚度。']

    recipe = by_id['b40']
    amend_step(recipe, 2,
               text='用干净饭团模具或食品接触用保鲜膜辅助，将拌好的饭按每团约120–140克压成小饭团，最后少量可做小一号。按总饭量增加饭团数量。',
               check='所有材料用完，去净保鲜膜后及时吃；不另外加盐，也不做成难以入口的大团。')

    recipe = by_id['b42']
    amend_step(recipe, 0,
               text='吐司选约1厘米厚，按每两片一组配好。将{{蓝莓果酱}}按实际组数均分，薄抹在每组的一片上，边缘留1厘米，再盖另一片轻压。',
               check='每组只叠两片，增加人数时增加组数；夹心薄而均匀，边缘不溢酱。')
    amend_step(recipe, 3,
               text='将{{黄油}}按实际煎制批次数分开，每批取一份融化，吐司平铺留缝，每面小火煎约2–3分钟；余下批次同法，不叠着煎。',
               check='每批两面都浅金黄；焦黑说明锅温过高。')

    recipe = by_id['b44']
    amend_step(recipe, 1,
               text='米饭按每团约75克分出，黄瓜、玉米、肉松和沙拉酱按饭团数量均分。铺食品接触用保鲜膜，每份米饭摊成约12厘米圆片。',
               check='饭层约1厘米厚，中间略厚；人数增加时增加饭团数量，保持每团饭量和厚度。')
    recipe['allergens'] = ['可能含蛋']
    recipe['tips'] = ['按熟米饭称量，不是生米。饭偏干时不硬捏，可改装碗。沙拉酱可能含蛋，肉松也可能使用复合调味料；对食物过敏时逐项核对包装。']

    recipe = by_id['b45']
    amend_step(recipe, 1,
               text='拌好芝麻的米饭按每团约80克分出，隔食品接触用保鲜膜捏成厚1.5厘米的小三角或圆饼。米饭增量时增加饭团数量，取掉保鲜膜再下锅。',
               check='边角压紧，大小接近；不能为了少做几只而压成更厚的大团。')
    amend_step(recipe, 3,
               text='将{{食用油}}按实际煎制批次数分开，每批刷一份，饭团平铺留缝，每面先煎约3分钟，底部成形前不要推动。',
               check='能整块铲起，底面浅金黄；锅小分批，不叠放。')
    amend_step(recipe, 4,
               text='每批两面薄刷调好的酱汁，各小火煎约1分钟；余下批次同样做。最后剩余酱汁在锅边煮沸后再蘸食。',
               check='表面棕黄，没有焦黑苦味；糖上色快，刷汁后保持小火。')

    recipe = by_id['b47']
    amend_step(recipe, 3,
               title='分张摊熟蛋皮',
               text='擦净锅，使用约20厘米不粘锅。打散的蛋液按每张约75克分出，余下{{食用油@0.5}}按蛋皮张数分开。每张刷一份油，倒一份蛋液摊薄，小火煎约2分钟，余下蛋液继续分张摊熟。',
               check='蛋皮薄而均匀，表面无流动蛋液；增加人数时增加张数，不把全部蛋液倒成厚蛋饼。')
    amend_step(recipe, 4,
               text='将炒饭按实际蛋皮张数均分，每张的一份放在蛋皮一侧，另一侧折过来盖住。包不住时把熟蛋皮直接盖在这一份饭上。',
               check='全部饭和蛋皮分好；每份饭量与蛋皮大小相配，蛋液不保留流心。')

    recipe = by_id['b48']
    recipe['minutes'] = 310
    recipe['prepMinutes'] = 240
    amend_step(recipe, 0,
               seconds=14400,
               text='将{{糯米}}淘洗，另加饮用水没过米约3厘米，盖住放冰箱浸泡4小时后沥干。先留足这段冷藏泡米时间，再蒸米和包烧卖。',
               check='米粒吸水变大，浸泡水倒掉；浸泡全程冷藏。')
    recipe['tips'] = ['先留出4小时冷藏泡米，再安排蒸米和包制。蒸好后剩余尽快冷藏，次日充分蒸热；不要室温放一夜。']

    recipe = by_id['b52']
    amend_step(recipe, 3,
               title='分份包馅',
               text='面团按每份约100克分出，土豆泥与芝士按面团份数均分。每份擀薄、放入一份馅，收口捏紧后轻压到1厘米厚。增加人数时增加饼的数量。',
               check='收口严密，芝士包在中间；每只厚度相同，不做成更厚的大饼。')
    amend_step(recipe, 4,
               text='将余下{{食用油@0.5}}按实际煎制批次数分开，每批刷一份。饼收口朝下平铺，盖锅盖小火每面煎约5分钟，余下饼同样分批做。',
               check='两面浅金黄，侧边面皮也不发白；饼不叠放。')

    recipe = by_id['b53']
    amend_step(recipe, 3,
               text='稍晾到不烫手，将紫薯泥按每份约35克搓成小球，最后少量可以做小一号；手先洗净或戴食品接触用手套。',
               check='球能成形、不滴水；增加总量时增加小球数量，不能搓成更大的球。')
    amend_step(recipe, 4,
               text='山药泥按紫薯球数量均分，每份压扁包住一个紫薯球，收拢搓圆；太软时直接分层装小杯。',
               check='每只外皮均匀、内芯包住；杯装时也分小份。')

    recipe = by_id['b54']
    recipe['minutes'] = 60
    amend_step(recipe, 1,
               text='烤箱预热到180℃，准备耐烤浅碗。将{{食用油}}分到各碗薄刷；碗的数量按蛋奶糊总量选择，不用一个深碗装完。',
               check='用耐高温烤碗，不用普通玻璃碗；检查烤箱达到180℃后再入炉。')
    amend_step(recipe, 3,
               text='把调好的糊分装浅碗，每碗食物厚度不超过3厘米、只装七分满。静置5分钟让燕麦吸液；人数增加时增加碗数，烤箱放不下就分批烤。',
               check='各碗厚度接近，不用加深或堆厚来减少碗数。')

    recipe = by_id['b57']
    amend_step(recipe, 2,
               text='准备耐热浅碗，底铺蒸纸，将{{食用油}}分碗薄刷侧面。按糊的总量增加碗数，每碗糊厚不超过2.5厘米，撒余下红枣。',
               check='只装七分满，轻震去掉大气泡；多人份增加浅碗或分批蒸，不装深。')
    recipe['tips'] = ['山药黏性和鸡蛋凝固帮助成形；搅打不充分或糊层太厚会影响口感。']

    recipe = by_id['b59']
    amend_step(recipe, 3,
               text='准备耐热浅碗，将{{食用油}}分碗薄刷，蛋糊分装后每碗厚度不超过2厘米；碗上扣耐热小盘防滴水。人数增加时增加浅碗，蒸锅放不下就分批。',
               check='碗只装七分满，不直接泡在蒸锅水中，不把蛋糊堆进深碗。')

    recipe = by_id['b60']
    amend_step(recipe, 2,
               text='准备耐热小杯，将{{食用油}}分杯薄刷，红豆和米浆分装。小杯数量按总量增加，每杯糊深不超过2.5厘米；蒸锅放不下时分批蒸。',
               check='每杯留下约三分之一空间，不用一个深碗装完全部米浆。')
    recipe['tips'] = ['保持每杯糊深不超过2.5厘米，增量时增加小杯或分批蒸；糯米粉不能换成粘米粉。']

    recipe = by_id['b65']
    recipe['equipment'] = '烤箱、同规格耐烤杯模、擀面杖、厨房秤、防烫手套'
    amend_step(recipe, 0,
               text='烤箱预热180℃。按实际吐司片数准备同规格耐烤杯模，每片对应一杯；模具不够时分批烤。将{{食用油}}分到各杯薄刷，吐司用擀面杖轻轻压薄。',
               check='用耐烤金属或硅胶模，不用纸饮料杯；单杯大小保持相同，不改成更深的大杯。')

    recipe = by_id['b70']
    amend_step(recipe, 3,
               text='按准备的鸡蛋数量在番茄汁中挖浅窝，鸡蛋逐个先打到小碗再滑入，彼此留间隔、不叠放。非整数个时先打散，按食材表取相应蛋液重量，再薄薄分入浅窝。锅里放不下时把煮好的番茄底汁分锅或分批，再分别放蛋。',
               check='蛋只铺单层，蛋液不堆厚；各份都要完成下一步加盖煮熟。')

    recipe = by_id['d64']
    amend_step(recipe, 1,
               text='将肉馅分到耐热浅碗，用勺抹成不超过1厘米厚的肉层；总量增加时增加碗数，蒸锅放不下就分批蒸。',
               check='每碗肉层厚度相同，不能用一个深碗叠厚；留出之后加入蛋液的空间。')

    recipe = by_id['b77']
    amend_step(recipe, 3,
               text='面团按每只约50–55克分出，搓圆锥，用拇指从底部掏洞，捏成壁厚约1厘米的小窝头。总量增加时增加只数，不增厚。',
               check='洞不穿顶，壁厚均匀；最后少量也捏成有底洞的小窝头。')

    recipe = by_id['b55']
    amend_step(recipe, 2,
               text='面团按每只约50克分出，压成约8毫米厚小饼，表面轻按熟芝麻。最后少量可做小一号；人数增加时增加饼的数量。',
               check='厚度一致，边缘不裂开，不做成更厚的大饼。')
    amend_step(recipe, 3,
               text='将{{食用油}}按实际煎制批次数分开，每批先刷其中一份的一半。小饼平铺留缝，小火煎约4分钟，不频繁移动。',
               check='底面成形、浅金色；留下一半本批油供翻面后使用。')
    amend_step(recipe, 4,
               text='翻面后沿空隙补入本批余下的一半油，盖盖小火再煎约4分钟。其余小饼用预留的油分批重复，两面都煎熟。',
               check='小饼鼓起、按下有回弹；每一批都检查中心无生粉。')

    recipe = by_id['b79']
    recipe['minutes'] = 45
    amend_step(recipe, 0,
               check='准备耐烤浅碗，按总量选择碗数；预热与切配可同时进行，使用防烫手套。')

    recipe = by_id['d24']
    recipe['allergens'] = ['贝类', '可能含小麦']
    recipe['tips'] = ['蚝油含贝类成分，不同品牌也可能使用小麦；对食物过敏时核对包装。蚝油咸度不同，盐按清单少量加入，不再额外撒盐。']

    # Confirm interpolation keys; name mentions in preparation are not consumption.
    for recipe in recipes:
        names = {ingredient['name'] for ingredient in recipe['ingredients']}
        for step in recipe['steps']:
            for token in re.finditer(r'\{\{([^}@]+)(?:@([\d.]+))?\}\}', step['text'] + ' ' + step['check']):
                assert token[1] in names, (recipe['id'], token[1])
                assert not token[2] or 0 < float(token[2]) <= 1, (recipe['id'], token[2])
    return recipes


ISSUES = [
    {
        'key': 'soak-time-omitted', 'priority': 'P2', 'ids': ['b48'],
        'fields': ['minutes', 'prepMinutes', 'steps[0]', 'tips'],
        'evidence': 'minutes=70；第一步明确冷藏泡米4小时，且写70分钟不含这4小时。',
        'reason': '从清单中的生糯米开始，4小时泡米必须计入全程用时；不能靠页面脚注把等待排除。',
        'resolution': '总用时310分钟=原70分钟活动预算+240分钟冷藏泡米，等待步骤秒数14400、prepMinutes=240。',
        'concurrency': '没有把每个步骤简单相加；保留原活动预算，单独补未计入的冷藏等待。',
    },
    {
        'key': 'bake-time-has-no-preparation-budget', 'priority': 'P2', 'ids': ['b54'],
        'fields': ['minutes'],
        'evidence': '原45分钟；顺序明确水开蒸15分钟，静置5分钟，烤25分钟，定时段已等于45分钟。',
        'reason': '切配、蒸锅升温、压泥散热、混糊和装碗均需要额外时间；红薯泥不能滚烫加入生蛋。',
        'resolution': '改为60分钟，保留原蒸烤检查点，不靠缩短烤制来凑时长。',
        'concurrency': '烤箱预热可与混糊、静置重叠，不重复加算；60分钟仍是两人份估算、没有厨房计时。',
    },
    {
        'key': 'pudding-time-is-tight', 'priority': 'P3', 'ids': ['b79'],
        'fields': ['minutes'],
        'evidence': '原35分钟；浸润5分钟+烤25分钟，另需切配、预热、调蛋奶及放温后入口。',
        'reason': '虽然预热能并行，35分钟仅余5分钟用于全部切配与放温，初次操作预算偏紧。',
        'resolution': '改45分钟，预热与切配可并行，保留25分钟起始烘烤检查。',
        'concurrency': '没有将整段烤箱预热另外串行相加；增加的是切配与安全取碗、放温的余量。',
    },
    {
        'key': 'fixed-sandwich-count', 'priority': 'P2', 'ids': ['b17', 'b18', 'b19', 'b20', 'b21', 'b22', 'b42'],
        'fields': ['steps'],
        'evidence': '食材4片吐司随人数变成1人2片、6人12片，原步骤仍固定在两片上铺馅、另两片盖顶；b42也固定两组。',
        'resolution': '始终每两片一组，按实际吐司配对组数均分夹馅；1/2/6人分别1/2/6组，单组层数和吐司厚度不变。b42按实际批次分黄油。',
    },
    {
        'key': 'fixed-pancake-batches', 'priority': 'P2', 'ids': ['b09', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'],
        'fields': ['steps'],
        'evidence': '原步骤固定面糊两批、每批半油、完成第二张；tips要求多人增加批次但步骤分配仍固定两次。',
        'resolution': '24–26厘米锅每锅约180–230克面糊，以厚度不超过5毫米为准；油按实际锅数分配，剩余面糊逐锅用完。保留每面3分钟及中心检查。',
    },
    {
        'key': 'fixed-piece-count', 'priority': 'P2',
        'ids': ['b35', 'b39', 'b40', 'b44', 'b45', 'b47', 'b52', 'b53', 'b55', 'b77'],
        'fields': ['steps'],
        'evidence': '旧步骤固定第二张、四份/四个、两份或六份。CookCore仅换算ingredient token，普通文字中的固定个数不会随1–6人改变。',
        'resolution': '手抓饼逐张配一蛋；盒子面团每份60–65克；拌饭团每团120–140克；海苔饭团每团75克米饭；脆底饭团每团80克米饭；蛋皮每张75克蛋液；土豆饼面团每份约100克；紫薯内芯每个约35克；南瓜饼面团每只约50克；窝头面团每只50–55克。人数增量增加数量，保留厚度和各自熟透检查。',
        'portionEvidence': 'b47鸡蛋3个/2人，按每个约50克蛋液：1人75克约1张，2人150克约2张，4人300克约4张，6人450克约6张；鸡蛋实际重量不同允许最后少量另摊小蛋皮。',
    },
    {
        'key': 'fixed-shallow-vessel-count', 'priority': 'P2', 'ids': ['d64', 'b54', 'b57', 'b59', 'b79'],
        'fields': ['steps'],
        'evidence': '原步骤写两个浅碗，食材人数增量却仍给固定碗数，与肉层/糊深不超过1/2/2.5/3厘米的要求冲突。',
        'resolution': '按总量增加浅碗或分批，保持每款原有深度上限；保留食品温度检查，不能用加深碗来减少批次。',
    },
    {
        'key': 'fixed-cup-and-egg-well-count', 'priority': 'P3', 'ids': ['b60', 'b65', 'b70'],
        'fields': ['steps', 'equipment', 'tips'],
        'evidence': '仍有四小杯、四连杯模及三个浅窝的两人份固定措辞；人数变化后杯数/窝数与食材不一致。',
        'resolution': '米浆按不超过2.5厘米深选择杯数；吐司每片对应同规格一杯；按鸡蛋数量挖浅窝，非整数先打散按蛋液重量取用，单层分锅/分批。',
    },
    {
        'key': 'oyster-allergen-missing', 'priority': 'P1', 'ids': ['d24'],
        'fields': ['allergens', 'tips'],
        'evidence': '蚝油三鲜菇含蚝油10克，但allergens为空，exclude=贝类仍保留该菜。',
        'resolution': '补贝类标签；小麦仅标可能含并要求核对实际蚝油包装，不把一个品牌配方当作所有品牌。',
        'references': ['https://www.cfs.gov.hk/sc_chi/consumer_zone/safefood_all/food_allergy.html', 'https://china.lkk.com.cn/enterprise/zh-CN/Products/OysterSauce/%E6%9D%8E%E9%94%A6%E8%AE%B0%E8%96%84%E7%9B%90%E8%9A%9D%E6%B2%B9/'],
    },
    {
        'key': 'mayonnaise-package-dependent-allergen', 'priority': 'P2', 'ids': ['b44'],
        'fields': ['allergens', 'tips'],
        'evidence': '沙拉酱15克、肉松30克未指定品牌或无蛋配方，allergens为空；沙拉酱常使用蛋，但并非每种沙拉酱都有蛋。',
        'resolution': '标可能含蛋，提醒逐项核对沙拉酱和肉松包装，保留无蛋制品存在的事实。',
        'references': ['https://www.cfs.gov.hk/sc_chi/consumer_zone/safefood_all/food_allergy.html'],
    },
]


def main():
    path = ROOT / 'web/recipes.json'
    original_bytes = path.read_bytes()
    recipes = json.loads(original_bytes.decode('utf-8'))
    before = deepcopy(recipes)
    apply(recipes)
    changes = []
    changed_steps = []
    for old, new in zip(before, recipes):
        assert old['id'] == new['id'] and old['name'] == new['name']
        assert old['ingredients'] == new['ingredients'], new['id']
        assert old.get('image') == new.get('image'), new['id']
        fields = [key for key in new if key != 'revision' and new[key] != old.get(key)]
        if not fields:
            continue
        if new['steps'] != old['steps']:
            new['revision'] = digest(new['steps'])
            changed_steps.append(new['id'])
        changes.append({'id': new['id'], 'name': new['name'], 'changedFields': fields,
                        'previousRevision': old.get('revision'), 'revision': new.get('revision'),
                        'before': {key: old.get(key) for key in fields},
                        'after': {key: new.get(key) for key in fields}})

    old_audit = json.loads(AUDIT.read_text(encoding='utf-8')) if AUDIT.exists() else None
    if old_audit and old_audit.get('hashNormalization') == 'utf8-lf-no-bom':
        input_sha = old_audit['auditedInputSha256']
    elif old_audit:
        # First audit revision used raw checkout bytes. Recover its original
        # content from retained before-fields, then use UTF-8 with LF only.
        baseline = deepcopy(before)
        baseline_by_id = {r['id']: r for r in baseline}
        for item in old_audit['changes']:
            baseline_by_id[item['id']].update(deepcopy(item['before']))
            baseline_by_id[item['id']]['revision'] = item['previousRevision']
        normalized = json.dumps(baseline, ensure_ascii=False, indent=2) + '\n'
        input_sha = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
    else:
        normalized = original_bytes.decode('utf-8-sig').replace('\r\n', '\n').replace('\r', '\n')
        input_sha = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
    if old_audit:
        previous_changes = {item['id']: item for item in old_audit['changes']}
        for item in changes:
            if item['id'] not in previous_changes:
                previous_changes[item['id']] = item
            else:
                stored = previous_changes[item['id']]
                for field in item['changedFields']:
                    stored['before'].setdefault(field, item['before'][field])
                    stored['after'][field] = item['after'][field]
                stored['changedFields'] = list(dict.fromkeys(stored['changedFields'] + item['changedFields']))
                stored['revision'] = item['revision']
        changes = list(previous_changes.values())
        changed_steps = list(dict.fromkeys(old_audit['stepRevisionChangedIds'] + changed_steps))

    report = {
        'reviewedOn': '2026-10-01', 'version': '0.8.0', 'kitchenValidation': 'not-tested',
        'scope': {
            'catalogScreened': len(recipes), 'legacyCatalogScreened': 180, 'v7AdditionsScreened': 120,
            'methods': ['全目录minutes/prepMinutes/step.seconds与等待关键词筛查', '全部16道不超过15分钟菜的原料状态与操作序列复核', '泡发/醒面/发酵/冷藏腌制/焖炖等待项按可并行关系复核', '正用量食材、分次token与准备提及/实际消耗分开检查', '全部aliases名称范围筛查及过敏原与复合调味料对照'],
            'limits': ['不是300道逐道厨房试做或实测计时', '用时是两人份估算；人数增加、分批、设备差异及额外续煮会更久', '包装配料与交叉接触不能靠菜谱标签保证；以实际购买包装为准'],
        },
        'auditedInputSha256': input_sha, 'hashNormalization': 'utf8-lf-no-bom',
        'countsByCategory': dict(Counter(r['category'] for r in recipes)),
        'issues': ISSUES,
        'changes': changes, 'changedRecipeIds': [item['id'] for item in changes],
        'stepRevisionChangedIds': changed_steps,
        'metadataOnlyIds': [item['id'] for item in changes if item['id'] not in changed_steps],
        'unmodifiedScreeningConclusions': {
            'grok': '主代理确认Grok只有泛化质量担忧，没有具体菜谱ID；本报告只记录可复现的具体问题。',
            'aliases': '未发现用明显不同工艺的名菜别名假充完整覆盖的具体证据。糖醋里脊标题明确香煎版；新红烧狮子头与旧清炖候选未混作同一道。部分旧别名包含川菜/鲁菜/津菜等泛分类，属低优先级清理项。',
            'ingredientTokens': '未确认新增120道有正用量食材完全无去向或严重重复投入。b41/d81称量阶段重复提及总量不是重复加油/糖；d57、b47等余水/余油文字须按语义核查，不能用token和简单判重复。',
            'quickMeals': '即食熟鸡胸、热熟米饭、即食燕麦、熟豆浆和免泡紫菜是菜谱已明确的前提；没有把生米/生鸡/原豆浆直接拿来支持15分钟。b44仍需现成热熟米饭，另从生米煮饭会更久。',
            'longWaits': 'v7b13笋干老鸭煲已包含12小时泡笋；v7b03盐水鸭冷藏腌制、v7b52小米蒸糕发酵、v7b53黄油软化、v7b54放凉冷藏均已在总用时预算。肉夹馍炖肉与醒面、蒸米与炒馅等可并行，不按每步seconds简单求和。',
        },
        'followUp': [
            {'key': 'allergen-exclusion-synonyms', 'priority': 'P1', 'owner': 'root-core', 'status': 'implemented-and-independently-verified',
             'evidence': '原CookCore.filter exclude=贝类仍保留v7a23（蚝油/软体动物），exclude=软体动物则能排除。',
             'recommendation': '主代理已实现仅针对过敏原标签的蛋/鸡蛋、乳/奶/牛奶、软体动物/贝类/软体贝类同义组，较长词先归一；甲壳类独立。已用真实CookCore.filter复核d24贝类、v7a23软体贝类、b44鸡蛋都能排除。该匹配用于提示和筛选，不保证包装或交叉接触安全。'},
            {'key': 'soy-sauce-wheat-package-variation', 'priority': 'P3', 'status': 'packaging-dependent',
             'evidence': '有些旧菜使用未指定品牌生抽/老抽但仅标大豆；一般酱油可含小麦，也存在无小麦配方。',
             'recommendation': '若进一步规范全库复合调料，采用可能含提示或要求具体适配包装，不能把品牌例子扩成所有酱油必含小麦。'},
        ],
        'sourceGenerators': {
            'd24,b09-b22,b35,b40': 'scripts/make_recipes.py；随后upgrade_v05.py迁移旧用量token与revision',
            'b39,b42,b44,b45,b47,b48,b52-b55,b57,b59,b60,b65,b70,b77,b79,d64': 'scripts/expand_catalog.py同名配方会替换旧菜；随后expand_v03.py分类、upgrade_v05.py与refine_v06.py形成180道基线',
            'v7a01-v7a60': 'scripts/catalog_v07_a.json，由expand_v07.py合并',
            'v7b01-v7b60': 'scripts/catalog_v07_b.json，由expand_v07.py合并',
            'recommendedFinalStep': 'scripts/refine_v08.py在expand_v07.py之后运行，保留源版本审计并应用本轮有限修正',
        },
        'validation': {'tokenKeys': 'passed', 'ingredientAmountsChanged': False, 'idsOrImagesChanged': False,
                       'independentChecksRecorded': {'servings': [1, 2, 4, 6], 'stepFieldsRendered': 14760,
                                                     'jsonJsParity': 'passed', 'priorProgressRetained': 266,
                                                     'metadataOnlyD24Progress': 'retained',
                                                     'normalizedAuditedInputMatchedV7HeadAtReview': True},
                       'revisionPolicy': 'only steps change revision; minutes/allergens/tips alone do not reset progress'},
    }
    path.write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    (ROOT / 'web/recipes.js').write_text('window.RECIPES = ' + json.dumps(recipes, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    AUDIT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('v0.8 bounded refinements:', len(changes), 'recipes;', len(changed_steps), 'step revisions')


if __name__ == '__main__':
    main()
