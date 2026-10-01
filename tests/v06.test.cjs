const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../web/core.js'),R=require('../web/recipes.json'),find=id=>R.find(r=>r.id===id);
test('v6 migration preserves prior preferences and personal records, sanitizes private notes',()=>{
 const map=new Map(Object.entries({'cook-version':'2','cook-saved':'["b41"]','cook-bought':'{"鸡蛋|个":true}','cook-prefs':JSON.stringify({category:'早餐',noNoodles:true}),'cook-notes':JSON.stringify({b41:{text:'少放糖',updatedAt:1},unknown:{text:'x'}})}));
 const st={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};C.migrateStorage(st,R);
 assert.equal(map.get('cook-version'),'3');assert.equal(map.get('cook-saved'),'["b41"]');assert.equal(map.get('cook-bought'),'{"鸡蛋|个":true}');assert.equal(JSON.parse(map.get('cook-prefs')).noNoodles,true);assert.deepEqual(JSON.parse(map.get('cook-notes')),{b41:{text:'少放糖',updatedAt:1}});
 const note=C.normalizeNotes({d01:{text:'x'.repeat(2000),updatedAt:'invalid'}},R).d01;assert.equal(note.text.length,1000);assert.equal(note.updatedAt,0);
});
test('progress chooses the earliest undone step without losing separate completed checks',()=>{
 assert.equal(C.firstUnchecked([0,1,2],6),3);assert.equal(C.firstUnchecked([0,2],6),1);assert.equal(C.firstUnchecked([],6),0);assert.equal(C.firstUnchecked([0,1,2],3),2);
});
test('v3 backups include notes and external opening preference while v1/v2 still restore records',()=>{
 const data={saved:['d01'],basket:['d01'],bought:{},prefs:{category:'家常菜',portions:2},recent:[],history:[],theme:'dark',notes:{d01:{text:'少放盐',updatedAt:1}},linkMode:'default',progress:{d01:{index:1,checked:[0],updatedAt:1,revision:find('d01').revision}}};
 const current=C.validateBackup({app:'cookdaily',schema:3,data},R);assert.equal(current.notes.d01.text,'少放盐');assert.equal(current.linkMode,'default');assert.equal(current.progress.d01.index,1);
 assert.deepEqual(C.validateBackup({app:'cookdaily',schema:2,data},R).notes,{});assert.deepEqual(C.validateBackup({app:'cookdaily',schema:1,data},R).progress,{});
});
test('reviewed dishes give every positive ingredient a destination and allocate split seasonings once',()=>{
 for(const id of ['d37','d51','d52','b30','b37','d59','d67','d99']){const r=find(id),text=r.steps.map(s=>s.text).join(' ');for(const i of r.ingredients.filter(i=>i.amount>0))assert.ok(text.includes(i.name),id+' missing '+i.name);}
 for(const id of ['d51','d52'])for(const ingredient of ['玉米淀粉','清水','生抽']){const text=find(id).steps.map(s=>s.text).join(' ');let total=0;for(const m of text.matchAll(/\{\{([^}@]+)(?:@([\d.]+))?\}\}/g))if(m[1]===ingredient)total+=Number(m[2]||1);assert.ok(Math.abs(total-1)<1e-9,id+' '+ingredient+' allocation');}
});
test('copied checks refer to the actual breakfast ingredients and timed safety checkpoints remain explicit',()=>{
 for(let n=9;n<=15;n++)assert.doesNotMatch(find('b'+String(n).padStart(2,'0')).steps[3].check,/土豆/);
 for(const n of [23,24,25,26,27,29])assert.doesNotMatch(find('b'+n).steps[2].check,/虾/);
 assert.doesNotMatch(find('b29').steps[2].check,/蛋液/);assert.match(find('d99').steps[1].text,/中心达到90℃.*至少90秒/);assert.match(find('d59').steps[1].text,/重新沸腾.*12分钟/);assert.equal(find('b58').steps[2].seconds,2400);
});
test('step revisions invalidate changed recipes only; audit retains real before-data and kitchen status',()=>{
 const audit=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/v06-content-audit.json'),'utf8'));assert.equal(audit.kitchenValidation,'not-tested');assert.ok(audit.stepRevisionChangedIds.includes('d52'));
 for(const change of audit.changes){if(!change.changedFields.includes('steps'))continue;assert.notEqual(change.previousRevision,find(change.id).revision);assert.equal(C.normalizeProgress({[change.id]:{index:0,checked:[],updatedAt:1,revision:change.previousRevision}},R)[change.id],undefined);}
 const r=find('d01');assert.ok(C.normalizeProgress({d01:{index:0,checked:[],updatedAt:1,revision:r.revision}},R).d01);
});
