const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../web/core.js'),R=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../web/recipes.json'),'utf8'));
test('exact catalog, unique IDs/names, full quantified ingredients and steps',()=>{assert.equal(R.length,166);assert.equal(new Set(R.map(r=>r.id)).size,166);assert.equal(new Set(R.map(r=>r.name)).size,166);assert.equal(R.filter(r=>r.category==='家常菜').length,86);assert.equal(R.filter(r=>r.category==='早餐').length,80);for(const r of R){assert.equal(r.servings,2);assert.ok(r.minutes>0);assert.ok(r.steps.length>=3,r.name);assert.ok(r.sources.length);for(const s of r.steps){assert.ok(s.title&&s.heat&&s.text&&s.check);assert.ok(s.seconds>=0);}for(const i of r.ingredients){assert.ok(i.name&&i.unit);assert.ok(Number.isFinite(i.amount)&&i.amount>=0);}assert.ok(r.ingredients.some(i=>i.name==='盐'));assert.ok(r.ingredients.some(i=>i.name==='食用油'));assert.equal(new Set(r.ingredients.map(i=>i.name)).size,r.ingredients.length,r.name);}});
test('bundled JS and JSON contain identical catalog',()=>{const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../web/recipes.js'),'utf8'),ctx);assert.equal(JSON.stringify(ctx.window.RECIPES),JSON.stringify(R));});
test('filters intersect and exclusion never selects forbidden ingredient',()=>{const pool=C.filter(R,{category:'早餐',max:20,noSpicy:true,exclude:'牛奶、鸡蛋',query:''});assert.ok(pool.length);assert.ok(pool.every(r=>r.category==='早餐'&&r.minutes<=20&&!r.spicy&&!r.ingredients.some(i=>/牛奶|鸡蛋/.test(i.name))));assert.equal(C.filter(R,{query:'不存在的食材XYZ'}).length,0);assert.equal(C.filter(R,{category:'家常菜'}).length,86);});
test('random avoids repeats until exhaustion, handles empty and singleton pool',()=>{assert.equal(C.choose([]),null);assert.equal(C.choose([R[0]],[R[0].id]).id,R[0].id);const recent=[];for(let i=0;i<8;i++){let r=C.choose(R.slice(0,8),recent,()=>0);assert.ok(!recent.includes(r.id));recent.push(r.id);}assert.notEqual(C.choose(R.slice(0,8),recent,()=>.99).id,recent.at(-1));});
test('servings scale oil, salt and eggs, never mutate source',()=>{const r=R[0],scaled=C.scale(r,1);assert.equal(scaled.find(i=>i.name==='鸡蛋').amount,1.5);assert.equal(scaled.find(i=>i.name==='盐').amount,1);assert.equal(scaled.find(i=>i.name==='食用油').amount,7.5);assert.equal(r.ingredients.find(i=>i.name==='鸡蛋').amount,3);assert.equal(C.stepText('20毫升清水，煮3分钟至75℃，切2厘米',4),'40毫升清水，煮3分钟至75℃，切2厘米');});
test('shopping aggregates matching quantities without combining units',()=>{const list=C.shopping(R,[R[0].id,R[1].id],2);assert.equal(list.find(i=>i.name==='鸡蛋').amount,6);assert.equal(list.find(i=>i.name==='食用油').amount,30);assert.equal(C.shopping(R,['invalid'],2).length,0);});
test('all citations are pinned and videos/searches clearly separated',()=>{for(const r of R){for(const s of r.sources){if(s.kind==='web'){assert.match(s.url,/^https:\/\//);assert.ok(s.note&&s.checked);}else{assert.match(s.url,/https:\/\/github.com\/Anduin2017\/HowToCook\/blob\/[a-f0-9]{40}\//);assert.match(s.sha256,/^[a-f0-9]{64}$/);}}for(const v of r.videos){assert.match(v.url,/^https:\/\//);assert.ok(v.status);}}});
test('food safety critical recipes include doneness requirements',()=>{assert.match(JSON.stringify(R.find(r=>r.name==='肉末四季豆').steps),/煮10分钟/);assert.match(JSON.stringify(R.find(r=>r.name==='蛋炒饭').steps),/室温放过夜.*丢弃/);assert.match(JSON.stringify(R.find(r=>r.name==='宫保鸡丁').steps),/75℃/);assert.match(JSON.stringify(R.find(r=>r.name==='煎饺').steps),/75℃/);});
test('in-step oil and salt are quantified at every portion count',()=>{for(let n=1;n<=6;n++){for(const r of R){for(const s of r.steps){assert.doesNotMatch(C.stepText(s.text,n,2,r),/NaN|undefined/);}}}assert.match(C.stepText(R[0].steps[1].text,2,2,R[0]),/食用油 10毫升/);assert.match(C.stepText(R[0].steps[2].text,2,2,R[0]),/食用油 5毫升/);assert.match(C.stepText(R[0].steps[0].text,1,2,R[0]),/盐 0.5克/);assert.equal(C.duration(75),'1分15秒');});

test('expanded catalog has distinct breakfast forms and the requested staples',()=>{
 for(const name of ['香蕉厚蛋烧','蓝莓西多士','虾滑馄饨面','红烧肉','锅塌豆腐','天津独面筋'])assert.ok(R.some(r=>r.name===name),name);
 assert.equal(R.filter(r=>r.edition==='0.2.0').length,66);
 assert.ok(new Set(R.filter(r=>r.category==='早餐').map(r=>r.group)).size>=9);
 assert.equal(R.filter(r=>r.category==='早餐'&&r.group==='面条粉类').length,10);
 assert.ok(C.filter(R,{query:'红烧肉'}).length);
 assert.ok(C.filter(R,{query:'回锅肉'}).length);
 for(const r of R.filter(r=>r.tokenAmounts)){assert.ok(r.steps.length>=5,r.name);for(let n=1;n<=6;n++){for(const s of r.steps){assert.doesNotMatch(C.stepText(s.text,n,2,r),/\{\{|NaN|undefined/);assert.doesNotMatch(C.stepText(s.check,n,2,r),/\{\{|NaN|undefined/);}}}
});
test('new-only, food form and no-noodles filters intersect correctly',()=>{
 const p=C.filter(R,{category:'早餐',newOnly:true,noNoodles:true});assert.equal(p.length,38);assert.ok(p.every(r=>r.edition==='0.2.0'&&r.group!=='面条粉类'));
 assert.equal(C.filter(R,{group:'面条粉类',noNoodles:true}).length,0);
 assert.ok(C.filter(R,{category:'家常菜',group:'蒸菜',max:35}).every(r=>r.minutes<=35&&r.group==='蒸菜'));
});
test('draw balances food forms and avoids last form where fresh alternatives exist',()=>{
 const pool=R.filter(r=>r.category==='早餐'),recent=[];let previous;
 let seed=42;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<100;i++){const r=C.choose(pool,recent,random,R);assert.ok(r);if(previous)assert.notEqual(r.group,previous.group);assert.ok(!recent.includes(r.id));recent.push(r.id);if(recent.length>10)recent.shift();previous=r;}
 assert.equal(C.choose(C.filter(R,{noNoodles:true}),['b43'],()=>0,R).group==='面条粉类',false);
});
test('new ingredient tokens scale while dimensions, temperature and batch timing stay fixed',()=>{
 const r=R.find(r=>r.name==='香蕉厚蛋烧');const text=C.stepText('用18厘米锅，煎3分钟至75℃，加{{食用油@0.333333}}',4,2,r);
 assert.equal(text,'用18厘米锅，煎3分钟至75℃，加食用油 4毫升');
});
