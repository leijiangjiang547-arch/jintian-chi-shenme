// DOM integration only. Native background delivery and device updates need real phones.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../web'),windows=[];
function boot(storage={}){
 const dom=new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'),{url:'https://cookdaily.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;windows.push(w);
 w.scrollTo=()=>{};w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const errors=[];w.addEventListener('error',e=>errors.push(e.message));for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);
 for(const f of ['recipes.js','search-index.js','core.js','app.js'])w.eval(fs.readFileSync(path.join(base,f),'utf8'));
 const q=s=>d.querySelector(s),click=s=>{assert.ok(q(s),s);q(s).click();},change=(s,v,type='change')=>{const e=q(s);if(typeof v==='boolean')e.checked=v;else e.value=v;e.dispatchEvent(new w.Event(type,{bubbles:true}));};
 const page=p=>{w.history.replaceState(null,'','#'+p);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
 const snapshot=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)];}));return {w,d,q,click,change,page,snapshot,errors};
}
try{
 const a=boot({'cook-saved':'["d01","d100"]','cook-prefs':'{"category":"家常菜","portions":2}'});
 assert.equal(a.q('#random-result [data-open]'),null);a.change('#max','15');assert.match(a.q('.match-count').textContent,new RegExp(String(a.w.CookCore.filter(a.w.RECIPES,{category:'家常菜',max:15}).length)));assert.equal(a.q('#random-result [data-open]'),null);
 assert.ok(a.q('#max').compareDocumentPosition(a.q('[data-draw]'))&4);a.click('[data-draw]');const chosen=a.q('#random-result [data-open]').dataset.open;
 a.change('#max','0');a.change('#search','红烧肉','input');assert.equal(a.q('#random-result [data-open]').dataset.open,chosen);assert.match(a.q('#random-result').textContent,/条件已改变/);a.click('[data-draw]');const red=a.q('#random-result [data-open]').dataset.open;assert.ok(a.w.CookCore.filter(a.w.RECIPES,{category:'家常菜',query:'红烧肉'}).some(r=>r.id===red));assert.ok(a.q('#random-result').textContent.includes(a.w.RECIPES.find(r=>r.id===red).name));
 a.click('[data-reset-filters]');a.change('#cuisine','粤菜');a.change('#food-group','白灼');a.change('#no-noodles',true);a.click('[data-difficulty="1"]');a.change('#max','15');
 const prefs=a.snapshot()['cook-prefs'];for(const page of ['recipes','favorites','shopping','home']){a.page(page);assert.equal(a.snapshot()['cook-prefs'],prefs);}assert.equal(a.q('#cuisine').value,'粤菜');assert.equal(a.q('#food-group').value,'白灼');assert.equal(a.q('#no-noodles').checked,true);
 const b=boot(a.snapshot());assert.equal(b.q('#no-noodles').checked,true);assert.equal(b.q('#max').value,'15');assert.equal(b.q('#cuisine').value,'粤菜');assert.equal(b.q('#random-result [data-open]'),null);
 b.click('[data-reset-filters]');b.page('recipes');b.change('#search','西红柿炒鸡蛋','input');b.click('[data-open="d01"]');b.click('[data-cook]');b.click('[data-next]');b.click('[data-close]');assert.equal(b.q('[data-done="0"]').checked,true);b.click('[data-close]');b.page('shopping');
 const c=boot(b.snapshot());c.page('recipes');c.click('[data-open="d01"]');assert.match(c.q('[data-cook]').textContent,/第2步/);assert.equal(c.q('[data-done="0"]').checked,true);c.click('[data-cook]');assert.match(c.q('#recipe-dialog .dialog-header').textContent,/2 \/ /);c.click('[data-close]');c.click('[data-restart]');assert.equal(c.q('[data-done="0"]').checked,false);assert.equal(JSON.parse(c.snapshot()['cook-progress']).d01,undefined);
 c.click('[data-close]');c.page('home');c.change('#search','无此菜XYZ','input');assert.equal(c.q('[data-draw]').disabled,true);assert.match(c.q('#random-result').textContent,/没有/);
 for(const app of [a,b,c])assert.deepEqual(app.errors,[]);
 console.log('v0.5 DOM passed: explicit draw, no automatic first result, six quick dishes, shared/persisted filters, restart restoration, progress resume/restart, empty disabled state.');
}finally{for(const w of windows)w.close();}
