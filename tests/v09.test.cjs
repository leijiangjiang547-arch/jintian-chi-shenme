const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../web/core.js'),R=JSON.parse(fs.readFileSync(path.join(__dirname,'../web/recipes.json'),'utf8'));
const now=Date.now(),find=id=>R.find(r=>r.id===id);
const backupData={saved:['d01'],basket:['d01'],bought:{},prefs:{category:'家常菜',portions:2,noSpicy:true,exclude:'花生'},recent:[],history:[],theme:'dark',notes:{d01:{text:'少盐',updatedAt:now}},linkMode:'default',progress:{d01:{index:1,checked:[0],updatedAt:now,revision:find('d01').revision}}};

test('fuzzy names are separate suggestions and do not expand the strict/random pool',()=>{
 const query='麻辣豆腐',before=C.filter(R,{query});
 assert.deepEqual(before,[]);assert.ok(C.nearbyNames(R,query).some(r=>r.name==='麻婆豆腐'));assert.ok(C.nearbyNames(R,'麻辣豆付').some(r=>r.name==='麻婆豆腐'));
 assert.deepEqual(C.filter(R,{query}),before);
 const strict=new Set(C.filter(R,{query:'宫爆鸡丁'}).map(r=>r.id));
 assert.ok(C.nearbyNames(R,'宫爆鸡丁').every(r=>!strict.has(r.id)));
 const ctx={window:{}};require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname,'../web/search-index.js'),'utf8'),ctx);const indexed=R.map(r=>({...r,pinyin:ctx.window.RECIPE_PINYIN[r.id],initials:ctx.window.RECIPE_INITIALS[r.id]}));assert.ok(C.nearbyNames(indexed,'hongshaoru').some(r=>r.id==='d81'));
 for(const q of ['', '<img src=x onerror=alert(1)>', '不存在的名字123', 'a'.repeat(1000)])assert.deepEqual(C.nearbyNames(R,q),[]);
});

test('all qualifying near names are returned instead of silently truncating to four',()=>{
 // Synthetic near names isolate candidate truncation from the evolving catalog.
 const names=['麻婆豆腐','麻香豆腐','麻辣豆干','麻辣豆皮','麻辣豆花','麻辣豆泡','麻辣豆卷'];
 const recipes=names.map((name,n)=>({...find('d57'),id:'fuzzy-'+n,name,aliases:[]}));
 const hits=C.nearbyNames(recipes,'麻辣豆腐');
 assert.equal(new Set(hits.map(r=>r.id)).size,names.length);assert.ok(hits.every(r=>names.includes(r.name)));
});

test('fuzzy candidates cannot bypass exclusion, spicy, time, category or difficulty filters',()=>{
 const tofu=find('d57');
 const restrictions=[{exclude:'大豆'},{noSpicy:true},{max:tofu.minutes-1},{category:'早餐'},{difficulty:tofu.difficulty===1?2:1}];
 for(const f of restrictions){const allowed=C.filter(R,{...f,query:''}),allowedIds=new Set(allowed.map(r=>r.id)),hits=C.nearbyNames(allowed,'麻辣豆腐');assert.ok(hits.every(r=>allowedIds.has(r.id)));assert.ok(!hits.some(r=>r.id===tofu.id),JSON.stringify(f));}
});

test('recognized main ingredients keep spelling suggestions from becoming unrelated dish lists',()=>{
 for(const [query,ingredient] of [['韭菜炒旦','韭菜'],['香菇炒肉','香菇'],['丝瓜炒蛋','丝瓜'],['蒜苔抄肉','蒜苔'],['葱爆牛肉','牛肉']]){
  const hits=C.nearbyNames(R,query);assert.ok(hits.every(h=>find(h.id).ingredients.some(i=>ingredient==='牛肉'?/牛肉|牛里脊|牛腩|牛腱|牛柳|肥牛|牛肋|牛排/.test(i.name):C.normalize(i.name).includes(C.normalize(ingredient)))),query+' returned a different main ingredient');
 }
 assert.ok(C.nearbyNames(R,'韭菜炒旦').some(r=>r.name==='韭菜炒鸡蛋'));assert.ok(C.nearbyNames(R,'香菇炒肉').some(r=>r.name.includes('香菇')));
 const wrong=[{name:'葱爆牛奶',ingredient:'牛奶'},{name:'葱爆牛油果',ingredient:'牛油果'}].map((r,n)=>({...find('d57'),id:'not-beef-'+n,name:r.name,aliases:[],ingredients:[{name:r.ingredient,amount:100,unit:'g'}]}));assert.deepEqual(C.nearbyNames(wrong,'葱爆牛肉'),[]);
 assert.ok(!C.nearbyNames(R,'南瓜炒肉').some(r=>r.id==='b37'),'egg must not count as meat');assert.ok(!C.nearbyNames(R,'牛奶炒肉').some(r=>r.id==='b07'),'milk must not count as meat');
 assert.ok(C.nearbyNames(R,'蒜香鸡翅').some(r=>r.id==='d83'),'chicken middle wings retain the chicken-wing anchor');assert.ok(C.nearbyNames(R,'葱爆羊肉').some(r=>r.id==='v7b46'),'lamb hind-leg meat retains the lamb anchor');assert.ok(!C.nearbyNames(R,'白切鸭').some(r=>r.id==='v7a31'),'duck is not substituted by chicken');
 assert.ok(C.nearbyNames(R,'西红柿炒鸡旦').some(r=>r.id==='d01'),'chicken-egg typo does not become a chicken-meat restriction');
 const beefAsPork={...find('d57'),id:'beef-as-pork',name:'青椒牛肉',aliases:[],ingredients:[{name:'牛里脊肉',amount:100,unit:'g'},{name:'青椒',amount:50,unit:'g'}]};assert.deepEqual(C.nearbyNames([beefAsPork],'青椒猪肉'),[],'explicit beef tenderloin is not the generic pork-tenderloin fallback');
});

test('request records are bounded plain data with trimmed name deduplication',()=>{
 assert.deepEqual(C.normalizeRequests(null),[]);assert.deepEqual(C.normalizeRequests({}),[]);
 const normalized=C.normalizeRequests([{name:' 麻婆豆腐 ',note:'想要少油做法',at:now},{name:'麻婆豆腐',note:'同一道',at:now+1},{name:' ',note:'空白',at:now},{name:123,note:'无效',at:now},null,{name:'长'.repeat(100),note:'注'.repeat(1000),at:now}]);
 assert.equal(normalized.filter(r=>r.name==='麻婆豆腐').length,1);
 assert.ok(normalized.every(r=>typeof r.name==='string'&&r.name.trim()&&r.name.length<=40&&typeof r.note==='string'&&r.note.length<=300&&Number.isFinite(r.at)&&r.at>0));
 assert.equal(C.normalizeRequests(Array.from({length:210},(_,n)=>({name:'请求菜'+n,note:'',at:now}))).length,200);
 const plain=C.normalizeRequests([{name:'<img src=x onerror=alert(1)>菜',note:'"<&> 只是文字',at:now}])[0];
 assert.equal(plain.name,'<img src=x onerror=alert(1)>菜');assert.equal(plain.note,'"<&> 只是文字');
});

test('GitHub request URL uses only a fixed public draft destination and encoded explicit request',()=>{
 const request={name:'菜&labels=evil#问',note:'"<&>\n第二行',at:now};
 const url=new URL(C.recipeRequestUrl(request));
 assert.equal(url.origin,'https://github.com');assert.equal(url.pathname,'/leijiangjiang547-arch/jintian-chi-shenme/issues/new');assert.equal(url.hash,'');
 assert.deepEqual([...url.searchParams.keys()].sort(),['body','title']);
 assert.ok(url.searchParams.get('title').includes(request.name));assert.ok(url.searchParams.get('body').includes(request.note));
 assert.equal(url.searchParams.get('labels'),null);assert.doesNotMatch(url.searchParams.get('body'),/收藏|口味偏好|cook-prefs|cook-saved/);
});

test('schema four includes requests while earlier backups keep their existing data semantics',()=>{
 const requests=[{name:'葱烧豆腐',note:'简单热菜',at:now}];
 const current=C.validateBackup({app:'cookdaily',schema:4,data:{...backupData,requests}},R);
 assert.deepEqual(current.requests,requests);assert.deepEqual(current.saved,['d01']);assert.equal(current.progress.d01.index,1);assert.equal(current.notes.d01.text,'少盐');assert.equal(current.linkMode,'default');
 for(const schema of [1,2,3]){const old=C.validateBackup({app:'cookdaily',schema,data:{...backupData,requests}},R);assert.deepEqual(old.saved,['d01']);assert.deepEqual(old.basket,['d01']);if(schema===3)assert.equal(old.notes.d01.text,'少盐');if(schema===1)assert.deepEqual(old.progress,{});}
 assert.throws(()=>C.validateBackup({app:'cookdaily',schema:5,data:backupData},R));
 assert.throws(()=>C.validateBackup({app:'cookdaily',schema:4,data:{...backupData,requests:[{name:'无效建议',note:'',at:'bad'}]}},R));
 const hostile=JSON.parse('{"name":"普通菜","note":"","at":'+now+',"submitted":true,"__proto__":{"polluted":true}}');const cleaned=C.validateBackup({app:'cookdaily',schema:4,data:{...backupData,requests:[hostile]}},R).requests[0];assert.equal(cleaned.submitted,undefined);assert.equal(cleaned.polluted,undefined);assert.equal({}.polluted,undefined);
});

test('migration to schema four preserves unrelated records and rejects future versions',()=>{
 const requests=[{name:'葱烧豆腐',note:'',at:now}],map=new Map(Object.entries({'cook-version':'3','cook-saved':'["d01"]','cook-basket':'["d01"]','cook-notes':JSON.stringify(backupData.notes),'cook-requests':JSON.stringify(requests),'cook-timer':'{"end":123}'}));
 const st={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 assert.equal(C.migrateStorage(st,R).writable,true);assert.equal(map.get('cook-version'),'4');assert.deepEqual(JSON.parse(map.get('cook-requests')),requests);assert.equal(map.get('cook-saved'),'["d01"]');assert.equal(map.get('cook-basket'),'["d01"]');assert.equal(map.get('cook-timer'),'{"end":123}');assert.equal(JSON.parse(map.get('cook-notes')).d01.text,'少盐');
 map.set('cook-version','999');const snapshot=JSON.stringify([...map]);assert.equal(C.migrateStorage(st,R).writable,false);assert.equal(JSON.stringify([...map]),snapshot);
});
