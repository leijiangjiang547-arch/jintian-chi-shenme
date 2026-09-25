// Optional DOM integration QA: npm install --no-save jsdom@26.1.0
// This checks rendered content and events, not browser layout or Android WebView.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const web=path.join(__dirname,'../web');
const dom=new JSDOM(fs.readFileSync(path.join(web,'index.html'),'utf8'),{url:'https://cookdaily.test',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;};
w.localStorage.setItem('cook-saved',JSON.stringify(['d01']));
for(const file of ['recipes.js','core.js','app.js'])w.eval(fs.readFileSync(path.join(web,file),'utf8'));
const click=s=>{assert.ok(d.querySelector(s),s);d.querySelector(s).click();};
const input=(s,value,type='input')=>{const e=d.querySelector(s);if(typeof value==='boolean')e.checked=value;else e.value=value;e.dispatchEvent(new w.Event(type,{bubbles:true}));};
const page=name=>{w.history.replaceState(null,'','#'+name);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
try {
 assert.match(d.querySelector('#main').textContent,/174 道/);
 page('recipes');assert.equal(d.querySelectorAll('.recipe-card').length,174);
 assert.doesNotMatch(d.querySelector('#main').textContent,/新增|验收版|新 ·/);
 click('[data-difficulty="3"]');input('#cuisine','湘菜','change');
 assert.equal(d.querySelectorAll('.recipe-card').length,0);click('[data-difficulty="2"]');assert.ok(d.querySelector('[data-open="d88"]'),'everyday Hunan dish');
 assert.equal(d.querySelectorAll('.recipe-card').length,1);
 click('[data-reset-filters]');assert.equal(d.querySelectorAll('.recipe-card').length,174);
 input('#cuisine','鲁菜','change');assert.equal(d.querySelectorAll('.recipe-card').length,2);
 click('[data-category="早餐"]');assert.equal(d.querySelector('#cuisine'),null);
 assert.equal(d.querySelectorAll('.recipe-card').length,80);
 click('[data-category=""]');
 input('#search','红烧肉');assert.equal(d.querySelectorAll('.recipe-card').length,1);
 input('#search','');click('[data-category="早餐"]');
 input('#no-noodles',true,'change');
 assert.equal(d.querySelectorAll('.recipe-card').length,70);
 input('#no-noodles',false,'change');click('[data-category=""]');
 for(const r of w.RECIPES){
   input('#search',r.name);click('[data-open="'+r.id+'"]');
   const detail=d.querySelector('#recipe-dialog').textContent;
   assert.ok(!/\{\{|\$\{|undefined|NaN/.test(detail),r.name+' unresolved detail');
   assert.equal(d.querySelectorAll('#recipe-dialog .step').length,r.steps.length,r.name);
   click('[data-cook]');click('[data-next]');assert.match(d.querySelector('.dialog-header').textContent,/2 \/ /);
   click('[data-close]');click('[data-close]');
 }
 input('#search','香蕉厚蛋烧');click('[data-open="b41"]');
 click('[data-portions="1"]');assert.match(d.querySelector('.detail').textContent,/3 人份/);
 click('[data-save="b41"]');click('[data-add="b41"]');click('[data-close]');
 assert.deepEqual(JSON.parse(w.localStorage.getItem('cook-saved')),['d01','b41']);
 page('shopping');assert.match(d.querySelector('#main').textContent,/香蕉厚蛋烧/);
 assert.ok(d.querySelectorAll('.shop-item').length>0);
 assert.deepEqual(errors,[]);
 console.log('DOM QA passed: 174 details and cooking navigation; search; 70 filtered breakfasts; servings; existing favorites; shopping. Not visual/device QA.');
} finally {w.close();}
