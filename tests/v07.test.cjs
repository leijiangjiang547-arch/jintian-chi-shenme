const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const R=require('../web/recipes.json'),C=require('../web/core.js'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/search-index.js'),'utf8'),ctx);
const indexed=R.map(r=>({...r,initials:ctx.window.RECIPE_INITIALS[r.id],pinyin:ctx.window.RECIPE_PINYIN[r.id]}));
test('v7 coverage and legacy revisions survive except documented v8 step corrections',()=>{
 const audit=require('../docs/v07-content-audit.json');assert.equal(R.length,340);assert.equal(R.filter(r=>r.id.startsWith('v7')).length,120);
 for(const c of ['川菜','湘菜','鲁菜','粤菜','苏菜','浙菜','闽菜','徽菜'])assert.ok(R.filter(r=>r.cuisine===c).length>=10,c);
 for(const c of ['京菜','津菜','东北风味','西北风味'])assert.ok(R.some(r=>r.cuisine===c),c);
 const v8=require('../docs/v08-content-audit.json'),changes=new Map(v8.changes.map(c=>[c.id,c]));
 for(const [id,revision] of Object.entries(audit.legacyRevisions)){const change=changes.get(id);if(change?.changedFields.includes('steps')){assert.equal(change.previousRevision,revision);assert.equal(R.find(r=>r.id===id).revision,change.revision);}else assert.equal(R.find(r=>r.id===id).revision,revision);}
 assert.equal(Object.keys(audit.legacyRevisions).length,180);assert.equal(audit.kitchenValidation,'not-tested');
});
test('actual recipe aliases, full pinyin and initials find dry-pot cauliflower without mixing techniques',()=>{
 for(const q of ['干锅菜花','干锅花菜','ganguocaihua','ganguohuacai','ggch','gghc']){
  assert.ok(C.filter(indexed,{query:q}).some(r=>r.id==='v7a01'),q);
 }
 assert.ok(C.filter(indexed,{query:'hongshaorou'}).some(r=>r.id==='d81'));
 assert.ok(C.filter(indexed,{query:'番茄炒蛋'}).some(r=>r.id==='d01'));
 assert.equal(C.rankResults(C.filter(indexed,{query:'干锅花菜'}),'干锅花菜')[0].id,'v7a01');
 assert.ok(C.filter(indexed,{query:'菜花'}).some(r=>r.id==='d17'));
 assert.ok(!C.filter(indexed,{query:'干锅花菜'}).some(r=>r.id==='d17'));
});
test('search corrections are suggestions only and exclusions are never relaxed implicitly',()=>{
 assert.equal(C.filter(indexed,{query:'干锅菜华'}).length,0);
 assert.ok(C.nearbyNames(indexed,'干锅菜华').some(r=>r.id==='v7a01'));
 assert.deepEqual(C.nearbyNames(C.filter(indexed,{exclude:'花菜'}),'干锅菜华'),[]);
 assert.deepEqual(C.nearbyNames(indexed,'不存在的名字123'),[]);
 for(const r of C.filter(indexed,{query:'鸡肉',exclude:'花生',noSpicy:true}))assert.ok(!r.spicy&&!r.ingredients.some(i=>i.name.includes('花生')));
});
test('new recipes contain measurable operations, allocated ingredients and offline images',()=>{
 for(const r of R.filter(r=>r.id.startsWith('v7'))){
  assert.ok(r.steps.length>=7,r.name);assert.ok(r.equipment&&r.pairing&&r.tips.length);
  assert.ok(r.image&&r.review.kitchen==='not-tested');
  const text=r.steps.map(s=>s.text).join(' '),ingredients=new Set(r.ingredients.map(i=>i.name));
  for(const i of r.ingredients.filter(i=>i.amount>0))assert.ok(text.includes(i.name),r.name+' missing '+i.name);
  for(const token of text.matchAll(/\{\{([^}@]+)(?:@([\d.]+))?\}\}/g)){assert.ok(ingredients.has(token[1]),r.name+' unknown '+token[1]);if(token[2])assert.ok(Number(token[2])>0&&Number(token[2])<=1);}
  assert.ok(Math.max(...r.steps.map(s=>s.seconds))<=r.minutes*60,r.name+' missing wait');
  assert.doesNotMatch(text+r.tips.join(' ')+r.difficultyReason,/已阅读|原文|固定版本|本版|未逐道|核查状态/);
  for(let n=1;n<=6;n++)for(const s of r.steps)assert.doesNotMatch(C.stepText(s.text,n,2,r)+C.stepText(s.check,n,2,r),/\{\{|NaN|undefined/);
 }
});
test('frying medium stays at the pot quantity while ingredients and seasoning scale',()=>{
 const r={id:'fried',servings:2,ingredients:[{name:'食用油',amount:500,unit:'ml',scaling:'fixed'},{name:'鱼肉',amount:400,unit:'g'},{name:'盐',amount:2,unit:'g'}]};
 for(const portions of [1,2,6]){const scaled=C.scale(r,portions);assert.equal(scaled[0].amount,500);assert.equal(scaled[1].amount,200*portions);assert.equal(scaled[2].amount,portions);assert.equal(C.stepText('{{食用油}}，{{盐}}',portions,2,r),'食用油 500毫升（锅中用量），盐 '+portions+'克');}
 const stir={id:'stir',servings:2,ingredients:[{name:'食用油',amount:10,unit:'ml'}]};
 const oil=C.shopping([r,stir],['fried','stir'],6).find(i=>i.name==='食用油');
 assert.equal(oil.amount,530);assert.equal(C.amount(oil),'530 毫升');
});

test('long cooking waits use hours while short step timers retain minutes and seconds',()=>{
 assert.equal(C.duration(75),'1分15秒');assert.equal(C.duration(3600),'1小时');assert.equal(C.duration(5415),'1小时30分15秒');assert.equal(C.duration(43200),'12小时');
});
