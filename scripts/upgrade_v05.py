"""Apply reviewed v0.5 content changes after v0.3 generation; idempotent.
No runtime guesses for split seasonings. Do not shorten old recipe estimates.
"""
import json, pathlib, re, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
UP=ROOT.parent.parent/'work/HowToCook/dishes'
R=[r for r in json.loads((ROOT/'web/recipes.json').read_text(encoding='utf8')) if r['id'] not in {'d100','d101','d102','d103','d104','d105'}]
audit_path=ROOT/'docs/v05-content-audit.json'
audit=json.loads(audit_path.read_text(encoding='utf8')).get('legacyMigratedIds',[]) if audit_path.exists() else []
for r in R:
    if not r.get('tokenAmounts'):
        names={i['name'] for i in r['ingredients']}
        alltext=' '.join(s['text'] for s in r['steps'])
        # One-time conversion of reviewed legacy templates; stored output is explicit.
        rules=[(r'三分之二的?食用油|三分之二油','食用油',2/3),(r'三分之一的?食用油|三分之一油','食用油',1/3),(r'一半的?食用油|一半油','食用油',.5),(r'剩余的?食用油|剩余油','食用油',1/3 if re.search(r'三分之二.*油',alltext) else 2/3 if '三分之一油' in alltext else .5),(r'一半盐|剩余盐','盐',.5),(r'一半生抽|剩余生抽','生抽',.5),(r'全部食用油','食用油',1),(r'全部盐','盐',1)]
        for step in r['steps']:
            for key in ['text','check']:
                for pattern,name,fraction in rules:
                    if name in names:step[key]=re.sub(pattern,'{{'+name+'@'+str(fraction)+'}}',step[key])
        if r['id']=='d57':
            water=next(i['amount'] for i in r['ingredients'] if i['name']=='清水')
            r['steps'][0]['text']=r['steps'][0]['text'].replace('食材表中20毫升清水','{{清水@'+str(20/water)+'}}')
        if r['id']=='b30':r['steps'][0]['text']=r['steps'][0]['text'].replace('去壳蛋液约150克，打散','将{{鸡蛋}}去壳打散，称实际蛋液重量')
        # Pancake dilution is an incremental adjustment, intentionally fixed at 10ml.
        r['tokenAmounts']=True
        if r['id'] not in audit:audit.append(r['id'])
    if r['category']=='早餐':r['cuisine']=None;r['cuisineNote']='早餐是餐次分类；未核实菜系的配方不强行归属。'

def add(id,name,source,minutes,timing,spec,steps,allergens,cuisine='家常风味',group='凉拌',note=''):
    f=next(UP.rglob(source+'.md'));path=f.relative_to(UP.parent).as_posix()
    ingredients=[dict(name=n,amount=float(a),unit=u) for n,a,u in [p.split('|') for p in spec.split(';')]]
    for n,u in [('食用油','ml'),('盐','g')]:
        if not any(i['name']==n for i in ingredients):ingredients.append(dict(name=n,amount=0,unit=u))
    rows=[dict(title=a,heat=b,seconds=int(c),text=d,check=e) for a,b,c,d,e in [p.split('|') for p in steps.strip().splitlines()]]
    R.append(dict(id=id,name=name,category='家常菜',cuisine=cuisine,cuisineNote='家庭改编，按常见风味归类。',group=group,minutes=minutes,timing=timing,prepMinutes=0,servings=2,emoji='🥣',spicy=False,difficulty=1,difficultyReason='基础切配、煮熟或拌匀；预计用时包含备料，初次操作可能更久。',ingredients=ingredients,steps=rows,tips=[{'d100':'豆腐是否需要加热，以包装说明为准；即食餐具不要接触生肉。','d101':'现拌口感清爽；如想更入味，可适当延长放置，但须另计时间。','d102':'焯菜后沥水再淋汁，避免调味汁被水冲淡。','d103':'需要泡发的紫菜请按包装先处理，不能直接套用免泡版本用时。','d104':'先用清单中的少量盐调味；不要直接大量追加。','d105':'温热拌好即可上桌，不必等待完全冷却。'}[id],'默认两人份配菜；更多人数或灶具升温较慢时，应增加备菜和加热时间。'],allergens=allergens,equipment='厨房秤、量勺、干净刀板、炒锅或小汤锅',pairing='搭配主食与另一道蔬菜或蛋白质食物。',sources=[dict(title='HowToCook · '+source,url='https://github.com/Anduin2017/HowToCook/blob/c2063eb7050bac0cb998779c62fa08c649c9882f/'+path,path=path,sha256=hashlib.sha256(f.read_bytes()).hexdigest(),kind='technique',note='已阅读固定版本。用量、流程及时间按本家庭配方重新编排；不是原文照搬。'+note)],videos=[],editorial='家庭量化改编，时间为两人份估计，尚未真人逐道计时试做。',tokenAmounts=True,edition='0.5.0',review=dict(editorial='reviewed',kitchen='not-tested',device='pending')))

add('d100','皮蛋豆腐','皮蛋豆腐',10,{'prep':5,'cook':3,'finish':2},'内酯豆腐|300|g;皮蛋|2|个;生抽|8|ml;香醋|6|ml;香油|3|ml;小葱|5|g', '''
核对豆腐|不开火|0|准备{{内酯豆腐}}，核对包装保存和加热要求；生熟刀板分开。豆腐切约2厘米块。|包装完整、在保质期内，不使用有异味或黏液的豆腐。
加热豆腐|中火|180|若非标注可即食的豆腐，放入已烧开的水中，保持轻沸约3分钟至中心热透，轻捞沥水。包装要求更久时按包装加热并增加总用时。|豆腐热透、不捣碎；即食豆腐可按包装直接食用。
剥蛋切块|不开火|0|{{皮蛋}}剥壳，用干净刀切成小瓣，摆到豆腐上；小葱洗净切细。|皮蛋无残留碎壳，餐具未接触生肉。
调拌汁|不开火|0|把{{生抽}}、{{香醋}}和{{香油}}混匀；不额外放盐。|少量酱汁调匀，香油不结成大油圈。
淋汁上桌|不开火|0|均匀淋汁，撒{{小葱}}，轻拌后及时食用。|豆腐基本完整；现做现吃，不长时间放在室温。
''',['蛋','大豆','小麦','芝麻'],note='减量调汁，豆腐根据包装处理；未采纳原文营养功效宣传。')
add('d101','现拌黄瓜','凉拌黄瓜',10,{'prep':7,'cook':0,'finish':3},'黄瓜|300|g;大蒜|6|g;生抽|6|ml;香醋|8|ml;香油|3|ml;白糖|2|g;盐|0.5|g', '''
清洗黄瓜|不开火|0|{{黄瓜}}在流动水下搓洗，去两头；外皮较老时削皮。用只接触即食食材的刀板。|表面无泥沙；异常明显苦味的黄瓜不要食用。
切小块|不开火|0|黄瓜纵向切四条，再切约1厘米小块；不要求拍碎，减少刀背滑手。|小块容易裹汁，不切成大厚段。
准备蒜末|不开火|0|{{大蒜}}去皮切末，放到拌菜碗。|蒜没有整粒大块。
混合调汁|不开火|0|加入{{生抽}}、{{香醋}}、{{香油}}、{{白糖}}和{{盐}}，搅到糖盐基本化开。|调味汁已匀，不另加辣椒油。
现拌现吃|不开火|30|放黄瓜，翻拌约30秒，即可装盘。|表面裹上薄汁；不等待腌透，口感清脆。
''',['大豆','小麦','芝麻'],note='现拌版本省去原文15分钟腌制，风味偏清爽，不能声称与原方腌制效果相同。')
add('d102','蚝油生菜','蚝油生菜',15,{'prep':6,'cook':7,'finish':2},'生菜|300|g;大蒜|6|g;蚝油|8|g;生抽|5|ml;清水|40|ml;食用油|6|ml', '''
择洗生菜|不开火|0|{{生菜}}逐片拆开，去坏叶，流水洗净叶柄缝隙，沥水。另烧一小锅焯菜水。|菜叶无泥沙；烧水与清洗可并行，别离开灶台。
切蒜调汁|不开火|0|{{大蒜}}切末。把{{蚝油}}、{{生抽}}和{{清水}}在碗中混匀。|调味汁备好；不额外放盐。
烫熟菜叶|中大火|60|焯菜水沸后放生菜，翻压使菜叶浸入，烫约30～60秒，叶柄变软后捞出沥水。|菜叶整体热透、略软；不是按时间到了就捞仍生硬的叶柄。
炒蒜|中小火|20|炒锅放{{食用油}}，蒜末下锅炒约20秒，不让油冒烟。|有蒜香，蒜末不焦黑。
煮汁|中火|45|倒入调好的汁，轻搅，煮到持续冒泡，再煮约30秒。|料汁均匀、不会成干糊。
淋汁|关火|0|把料汁淋到沥好水的生菜上，及时上桌。|盘底不过多积水，叶面裹薄汁。
''',['贝类','大豆','小麦'],cuisine='粤菜',group='白灼',note='统一原文前后不一致的生抽、盐和油量，焯水与制汁只使用本清单调味。')
add('d103','紫菜蛋花汤','紫菜蛋花汤',12,{'prep':3,'cook':8,'finish':1},'免泡干紫菜|4|g;鸡蛋|2|个;小葱|4|g;清水|600|ml;盐|1.5|g;香油|2|ml', '''
核对紫菜|不开火|0|选包装注明免泡、可直接入汤的{{免泡干紫菜}}，按包装清理。若产品需要泡发，先按包装完成，泡发时间另计。|不把需泡发产品直接按12分钟操作。
打散蛋液|不开火|0|{{鸡蛋}}打入碗中，搅至蛋白蛋黄混匀；葱洗净切细。|蛋液无大团透明蛋白。
烧汤水|大火|0|小汤锅加入{{清水}}，盖上盖烧至沸腾后开盖，转中火。|明显沸腾；锅不要加水过满。
煮紫菜|中火|120|放紫菜和{{盐}}，轻沸约2分钟，搅开结团。|紫菜舒展开、全都热透。
下蛋液|中小火|60|蛋液沿锅内一圈缓缓淋入，停约10秒再轻推，保持轻沸约1分钟至蛋液完全凝固。|没有透明流动蛋液；不要倒完立即关火。
调香盛出|关火|0|撒{{小葱}}，加{{香油}}，搅匀，用隔热垫端锅盛汤。|汤很烫，稍放再吃。
''',['蛋','芝麻'],group='汤羹',note='明确使用免泡紫菜、600毫升水；不沿用原文15分钟泡发，未加可选虾仁。')
add('d104','西红柿鸡蛋汤','西红柿鸡蛋汤',15,{'prep':5,'cook':9,'finish':1},'西红柿|250|g;鸡蛋|2|个;小葱|5|g;清水|600|ml;盐|1.5|g;食用油|5|ml', '''
洗切番茄|不开火|0|{{西红柿}}洗净去蒂，切约1厘米小块；小葱洗净切葱花。|小块更容易炒出汁，不用去皮以节省操作。
打散鸡蛋|不开火|0|{{鸡蛋}}在干净碗里打散，放灶边备用。|蛋黄蛋白混匀。
炒出番茄汁|中火|120|小汤锅放{{食用油}}，油温热但不冒烟时放番茄，炒约2分钟。|块边变软、底部有番茄汁；若将焦，先减火。
加水煮开|中大火|0|加入{{清水}}，烧开后转中火，再煮约2分钟。|汤持续轻沸，番茄软透。
淋蛋液|中小火|60|把蛋液沿锅中一圈缓缓淋下，稍定形后轻推，再保持轻沸约1分钟至蛋液完全凝固。|没有透明或流动蛋液。
调味盛汤|关火|0|放{{盐}}和{{小葱}}，搅匀后盛出；用干净小勺尝咸淡，避免烫口。|蛋花完全凝固，汤味清淡，葱花分布均匀。
''',['蛋'],group='汤羹',note='原文盐15克和冒烟下料不适合本配方，已改为1.5克盐、温油下番茄；不采纳功效描述。')
add('d105','小葱拌豆腐','凉拌豆腐',15,{'prep':4,'cook':8,'finish':3},'北豆腐|300|g;小葱|8|g;大蒜|4|g;生抽|6|ml;香油|3|ml;香醋|4|ml', '''
切豆腐|不开火|0|{{北豆腐}}切约1.5厘米小块，轻放到碗中。另烧一小锅水，能浸没豆腐即可。|豆腐无异味，切块均匀。
煮透|中火|180|水沸后轻放豆腐，水重新开后小火煮约3分钟，至中心热透。包装要求更久时按包装处理。|保持轻沸，不大力搅碎豆腐。
沥水|不开火|0|用漏勺捞出豆腐，沥约1分钟，放干净浅盘散掉蒸汽。|不浸泡在大量焯水中，不必等到冰凉。
切葱蒜|不开火|0|{{小葱}}洗净切细，{{大蒜}}切末，放到小碗。|刀板和手已清洁，没有生肉污染。
调拌汁|不开火|0|把{{生抽}}、{{香油}}、{{香醋}}加入葱蒜碗搅匀，不额外放盐。|汁少而均匀，葱蒜不结团。
轻拌上桌|不开火|0|汁淋在温热豆腐上，轻推翻匀，及时食用。|保留豆腐方块，不压成泥。
''',['大豆','小麦','芝麻'],note='温拌版本，无需等完全冷却；加热和调味按本页量化，煮透时间依包装。')
# Visually reviewed cell bounds: generated sheets do not have perfectly equal rows.
bounds=[([0,244,474,691,909,1145],[0,215,423,640,866,1083,1330]),([0,237,463,689,916,1145],[0,204,411,613,823,1041,1323]),([0,244,475,700,910,1145],[0,214,421,633,854,1080,1330]),([0,235,459,684,910,1145],[0,214,426,634,849,1063,1310]),([0,229,459,687,916,1145],[0,211,420,634,848,1065,1328]),([0,247,470,691,914,1145],[0,202,408,613,831,1055,1315])]
for n,r in enumerate(R):
    r['revision']=hashlib.sha256(json.dumps(r['steps'],ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:12]
    r['image']={'sheet':f'food-atlas-{n//30+1}.png','cell':n%30,'kind':'ai-illustration','rect':[bounds[n//30][0][n%5],bounds[n//30][1][(n%30)//5],bounds[n//30][0][n%5+1]-bounds[n//30][0][n%5],bounds[n//30][1][(n%30)//5+1]-bounds[n//30][1][(n%30)//5]],'size':[1145,1374],'alt':r['name']+'成品示意，AI生成，非实拍'}
(ROOT/'web/recipes.json').write_text(json.dumps(R,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'web/recipes.js').write_text('window.RECIPES = '+json.dumps(R,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
(ROOT/'docs/v05-content-audit.json').write_text(json.dumps({'total':len(R),'newQuickIds':['d100','d101','d102','d103','d104','d105'],'legacyMigratedIds':audit,'allRecipesUseTokens':all(r.get('tokenAmounts') for r in R),'timeEstimates':'two-person estimates including prep, not kitchen verified','breakfastCuisine':'null unless supported by sources'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('v0.5:',len(R),'recipes; migrated',len(audit),'legacy recipes')
