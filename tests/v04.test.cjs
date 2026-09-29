const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../web/core.js'),R=require('../web/recipes.json');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../web/search-index.js'),'utf8'),ctx);
R.forEach(r=>r.initials=ctx.window.RECIPE_INITIALS[r.id]);
test('search supports aliases, multi-ingredient AND queries and case-insensitive initials',()=>{
 assert.deepEqual(C.filter(R,{query:'番茄'}).map(r=>r.id),C.filter(R,{query:'西红柿'}).map(r=>r.id));
 assert.ok(C.filter(R,{query:'番茄 鸡蛋'}).some(r=>r.id==='d01'));
 assert.ok(C.filter(R,{query:'HSR'}).some(r=>r.name==='红烧肉'));
 assert.ok(C.filter(R,{query:'马铃薯'}).length);
 assert.equal(Object.keys(ctx.window.RECIPE_INITIALS).length,R.length);
 assert.ok(C.filter(R,{exclude:'洋芋'}).every(r=>!C.normalize(r.ingredients.map(i=>i.name).join()).includes('土豆')));
 assert.equal(C.filter(R,{query:'番茄 不存在的原料'}).length,0);
});
test('counted ingredients are actionable without rounding critical seasoning or egg ratios',()=>{
 assert.equal(C.amount({name:'鸡蛋',unit:'个',amount:1.5}),'1.5 个（打散取约 75 克蛋液）');
 assert.match(C.amount({name:'吐司',unit:'片',amount:4.5}),/4–5 片/);
 assert.match(C.amount({name:'黄瓜',unit:'根',amount:.5}),/切分取用/);
 assert.equal(C.amount({name:'盐',unit:'g',amount:.5}),'0.5 克');
 assert.equal(C.amount({name:'鸡蛋',unit:'个',amount:2}),'2 个');
});
test('shopping preserves bought quantities on decrease and unrelated changes only',()=>{
 const before=[{key:'蛋|个',amount:3},{key:'盐|g',amount:2},{key:'菜|g',amount:200}];
 const after=[{key:'蛋|个',amount:4},{key:'盐|g',amount:2},{key:'菜|g',amount:100},{key:'虾|g',amount:200}];
 assert.deepEqual(C.reconcileBought(before,after,{'蛋|个':true,'盐|g':true,'菜|g':true}),{'盐|g':true,'菜|g':true});
 assert.deepEqual(C.reconcileBought(before,[],{'蛋|个':true}),{});
});
test('backup validates version and shape, whitelists records, excludes unknown fields and timers',()=>{
 const data={app:'cookdaily',schema:1,data:{saved:['d01','unknown','d01'],basket:['d01'],recent:['d01'],bought:{'鸡蛋|个':true,'unknown|g':true},prefs:{portions:2,exclude:'香菜'},history:[{id:'d01',at:Date.now()}],theme:'dark',timer:{end:999},evil:'<script>'}};
 const result=C.validateBackup(data,R);assert.deepEqual(result.saved,['d01']);assert.deepEqual(result.bought,{'鸡蛋|个':true});assert.equal(result.timer,undefined);assert.equal(result.evil,undefined);assert.equal(result.theme,'dark');
 assert.throws(()=>C.validateBackup({...data,schema:9},R));
 assert.throws(()=>C.validateBackup({...data,data:{...data.data,saved:'d01'}},R));
 assert.throws(()=>C.validateBackup({...data,data:{...data.data,history:[{id:'d01',at:'bad'}]}},R));
 assert.equal(C.validateBackup({...data,data:{...data.data,prefs:{portions:999,max:-1}}},R).prefs.portions,2);
});
