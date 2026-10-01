const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../web/core.js'),R=JSON.parse(fs.readFileSync(path.join(__dirname,'../web/recipes.json'),'utf8'));
test('shopping text combines recipes, scales servings and distinguishes pending/purchased',()=>{
 const basket=['d01','d02'],list=C.shoppingItems(R,basket,4),egg=list.find(i=>i.name==='鸡蛋'),bought={[egg.key]:true};
 const pending=C.shoppingText(R,basket,4,bought);assert.match(pending,/每道菜 4 人份/);assert.match(pending,/西红柿炒鸡蛋/);assert.match(pending,/□ 食用油 60 毫升/);assert.doesNotMatch(pending,/□ 鸡蛋|已购买|□ 清水/);
 const complete=C.shoppingText(R,basket,4,bought,false);assert.match(complete,/已购买\n✓ 鸡蛋 12 个/);assert.equal(C.shoppingText(R,basket,4,Object.fromEntries(list.map(i=>[i.key,true]))),'');assert.equal(C.shoppingText(R,[],2),'');
});
test('water variants are consistently absent from visible and exported shopping items',()=>{
 const r={id:'water-test',name:'汤',servings:2,ingredients:[...['水','清水','饮用水','温开水','冰水'].map(name=>({name,amount:100,unit:'ml'})),{name:'牛奶',amount:100,unit:'ml'}]};
 assert.deepEqual(C.shoppingItems([r],[r.id],2).map(i=>i.name),['牛奶']);assert.match(C.shoppingText([r],[r.id],2),/牛奶/);assert.doesNotMatch(C.shoppingText([r],[r.id],2),/水/);
});
test('allergen exclusion recognizes egg/milk and mollusc label variants without merging crustaceans',()=>{
 const make=(id,label)=>({id,name:'测试配方'+id,ingredients:[{name:'复合酱料',amount:1,unit:'g'}],allergens:[label]});
 const examples=[make('e','可能含蛋'),make('m','乳'),make('b','软体贝类'),make('c','甲壳类')];
 assert.ok(!C.filter(examples,{exclude:'鸡蛋'}).some(r=>r.id==='e'));assert.ok(!C.filter(examples,{exclude:'牛奶'}).some(r=>r.id==='m'));
 for(const term of ['贝类','软体动物','软体贝类']){const kept=C.filter(examples,{exclude:term});assert.ok(!kept.some(r=>r.id==='b'));assert.ok(kept.some(r=>r.id==='c'));}
 assert.ok(!C.filter(R,{exclude:'贝类'}).some(r=>r.id==='v7a23'));assert.ok(!C.filter(R,{exclude:'鸡蛋'}).some(r=>r.id==='b44'));
});
test('documented content corrections preserve quantities/images and invalidate only changed steps',()=>{
 const audit=require('../docs/v08-content-audit.json');assert.equal(audit.kitchenValidation,'not-tested');assert.equal(audit.scope.catalogScreened,300);
 for(const c of audit.changes){const r=R.find(r=>r.id===c.id);assert.ok(r);assert.ok(!c.changedFields.includes('ingredients'));assert.ok(!c.changedFields.includes('image'));const old={index:0,checked:[],updatedAt:1,revision:c.previousRevision};if(c.changedFields.includes('steps')){assert.notEqual(c.revision,c.previousRevision);assert.equal(C.normalizeProgress({[c.id]:old},R)[c.id],undefined);}else assert.ok(C.normalizeProgress({[c.id]:old},R)[c.id]);}
 assert.equal(R.find(r=>r.id==='b48').minutes,310);assert.equal(R.find(r=>r.id==='b48').steps[0].seconds,14400);assert.equal(R.find(r=>r.id==='b54').minutes,60);assert.equal(R.find(r=>r.id==='b79').minutes,45);
 for(const id of ['b17','b18','b19','b20','b21','b22','b42']){const r=R.find(r=>r.id===id);assert.match(JSON.stringify(r.steps),/每两片一组/);for(const n of [1,2,4,6])assert.equal(C.scale(r,n).find(i=>i.name.includes('吐司')).amount/2,n);}
 for(const id of ['b09','b10','b11','b12','b13','b14','b15','b16'])assert.match(JSON.stringify(R.find(r=>r.id===id).steps),/厚度.*5毫米|5毫米厚/);
 assert.ok(!C.filter(R,{exclude:'贝类'}).some(r=>r.id==='d24'));
});
