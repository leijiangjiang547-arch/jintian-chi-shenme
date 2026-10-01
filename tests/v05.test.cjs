const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../web/core.js'),R=require('../web/recipes.json');
test('six quick home dishes include explicit preparation budgets without shortening old dishes',()=>{
 const quick=C.filter(R,{category:'家常菜',max:15});assert.equal(quick.length,6);
 for(const r of quick){assert.equal(r.timing.prep+r.timing.cook+r.timing.finish,r.minutes);assert.ok(r.steps.length>=5);assert.ok(r.sources[0].sha256);}
 assert.equal(R.find(r=>r.id==='d01').minutes,20);
});
test('all illustrations have unique local cells and reviewed crop bounds',()=>{
 assert.equal(new Set(R.map(r=>r.image.sheet+'|'+r.image.cell)).size,180);
 for(const r of R){const i=r.image,b=fs.readFileSync(path.join(__dirname,'../web',i.sheet));assert.equal(b.subarray(1,4).toString(),'PNG');const sw=b.readUInt32BE(16),sh=b.readUInt32BE(20);assert.deepEqual(i.size,[sw,sh]);const [x,y,w,h]=i.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=sw&&y+h<=sh);assert.match(i.alt,/AI生成，非实拍/);}
});
test('storage migration preserves v4 personal data and future versions remain untouched',()=>{
 const map=new Map(Object.entries({'cook-prefs':JSON.stringify({category:'早餐',noNoodles:true,max:20,portions:3,cuisine:'早餐'}),'cook-saved':'["b41"]','cook-bought':'{"鸡蛋|个":true}','cook-theme':'"dark"','cook-timer':'{"end":123}'}));
 const st={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};assert.ok(C.migrateStorage(st,R).writable);assert.equal(map.get('cook-version'),'3');const p=JSON.parse(map.get('cook-prefs'));assert.equal(p.cuisine,'');assert.equal(p.noNoodles,true);assert.equal(p.portions,3);assert.equal(map.get('cook-saved'),'["b41"]');assert.equal(map.get('cook-bought'),'{"鸡蛋|个":true}');assert.equal(map.get('cook-timer'),'{"end":123}');
 const before=JSON.stringify([...map]);C.migrateStorage(st,R);assert.equal(JSON.stringify([...map]),before);map.set('cook-version','99');const future=JSON.stringify([...map]);assert.equal(C.migrateStorage(st,R).writable,false);assert.equal(JSON.stringify([...map]),future);
});
test('progress validates step revision and bounds; old backups remain importable',()=>{
 const progress={d01:{index:1,checked:[0,0,-1,999],updatedAt:Date.now(),revision:R[0].revision},d02:{index:0,checked:[],updatedAt:1,revision:'outdated'}};
 assert.deepEqual(C.normalizeProgress(progress,R).d01.checked,[0]);assert.equal(C.normalizeProgress(progress,R).d02,undefined);
 const backup={app:'cookdaily',schema:2,data:{saved:['d01'],basket:[],bought:{},prefs:{category:'早餐',noNoodles:true},recent:[],history:[],theme:'dark',progress}};
 assert.equal(C.validateBackup(backup,R).progress.d01.index,1);assert.deepEqual(C.validateBackup({...backup,schema:1},R).progress,{});
});
test('daily suggestions are filter-bound references and do not consume random selection',()=>{
 const f={category:'家常菜',max:15,exclude:'鸡蛋'};const a=C.suggestions(R,f,'2026-09-30'),b=C.suggestions(R,f,'2026-09-30');assert.deepEqual(a,b);assert.ok(a.length);assert.ok(a.every(r=>C.filter([r],f).length===1));assert.deepEqual(C.suggestions(R,{query:'不存在XYZ'},'day'),[]);
});
