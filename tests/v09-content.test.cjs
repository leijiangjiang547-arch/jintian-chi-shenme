const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../web/recipes.json'),C=require('../web/core.js');
test('forty hot dishes include the requested staples with complete novice operations',()=>{
 const added=R.filter(r=>r.id.startsWith('v9'));assert.equal(added.length,40);
 for(const name of ['土豆烧排骨','土豆烧牛肉','梅菜扣肉'])assert.ok(C.filter(R,{query:name}).some(r=>r.name===name));
 for(const r of added){assert.equal(r.category,'家常菜');assert.ok(r.steps.length>=7);assert.equal(typeof r.equipment,'string');assert.ok(r.equipment);assert.ok(r.sources.length);assert.ok(r.image);assert.ok(!r.spicy||r.ingredients.some(i=>/椒|辣/.test(i.name)),r.name);
  for(let n=1;n<=6;n++)for(const step of r.steps)assert.doesNotMatch(C.stepText(step.text,n,2,r)+C.stepText(step.check,n,2,r),/\{\{|NaN|undefined/);
  if(r.steps.some(s=>/℃/.test(s.text+s.check)))assert.match(r.equipment,/温度计/,r.name);
 }
});
test('declared waits and measured-food prerequisites cannot appear as quick recipes',()=>{
 const byName=name=>R.find(r=>r.name===name);
 const pork=byName('梅菜扣肉');assert.match(pork.steps[1].text,/梅菜泡好后/);assert.ok(pork.minutes*60>=pork.steps.reduce((a,s)=>a+s.seconds,0)+15*60);
 assert.ok(byName('黄豆焖猪蹄').minutes>=600);assert.match(byName('干锅千页豆腐').tips.join(' '),/解冻等待另计/);
 assert.ok(byName('尖椒炒肥肠').minutes>=45);assert.match(JSON.stringify(byName('尖椒炒肥肠').steps),/全熟/);
 assert.ok(C.filter(R,{max:15}).every(r=>!['梅菜扣肉','黄豆焖猪蹄','土豆烧牛肉'].includes(r.name)));
});
test('search and ingredient exclusions understand meat cuts without treating egg or milk as meat',()=>{
 for(const [query,id] of [['鸡肉','d47'],['牛肉','d41'],['豆角','v9b15']]){assert.ok(C.filter(R,{query}).some(r=>r.id===id));assert.ok(!C.filter(R,{exclude:query}).some(r=>r.id===id));}
 const egg=R.find(r=>r.id==='b30'),milk=R.find(r=>r.id==='b07');assert.ok(!C.matches(egg,'鸡肉'));assert.ok(!C.matches(milk,'牛肉'));
 assert.ok(C.nearbyNames(R,'土豆烧豆角').some(r=>r.id==='v9b15'));
});
