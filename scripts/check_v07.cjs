// Content discovery integration; no claims about Android or actual cooking.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../web'),dom=new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'),{url:'https://cookdaily.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document,errors=[];
w.scrollTo=()=>{};w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
w.addEventListener('error',e=>errors.push(e.message));
w.localStorage.setItem('cook-saved','["d01","b41"]');w.localStorage.setItem('cook-notes','{"d01":{"text":"少放盐","updatedAt":1}}');
for(const f of ['recipes.js','search-index.js','core.js','app.js'])w.eval(fs.readFileSync(path.join(base,f),'utf8'));
const q=s=>d.querySelector(s),click=s=>{assert.ok(q(s),s);q(s).click();},input=(s,v)=>{q(s).value=v;q(s).dispatchEvent(new w.Event('input',{bubbles:true}));},page=p=>{w.history.replaceState(null,'','#'+p);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
try{
 page('recipes');click('[data-reset-filters]');assert.equal(d.querySelectorAll('.recipe-card').length,36);assert.match(q('.count').textContent,/340/);
 click('[data-more]');assert.equal(d.querySelectorAll('.recipe-card').length,72);assert.equal(d.activeElement.dataset.open,w.RECIPES[36].id);
 const viewed=w.RECIPES[50].id;click('[data-open=\"'+viewed+'\"]');click('[data-portions=\"1\"]');click('[data-close]');assert.equal(d.querySelectorAll('.recipe-card').length,72);assert.equal(d.activeElement.dataset.open,viewed);
 input('#search','干锅菜花');assert.equal(q('[data-more]'),null);assert.equal(q('.card-open').dataset.open,'v7a01');
 for(const term of ['干锅花菜','ganguohuacai','gghc']){input('#search',term);assert.equal(q('.card-open').dataset.open,'v7a01');}
 input('#search','干锅菜华');assert.equal(q('.card-open'),null);assert.ok(q('.search-suggestions [data-open="v7a01"]'));click('.search-suggestions [data-open="v7a01"]');assert.equal(q('#search').value,'干锅菜华');assert.match(q('#recipe-dialog').textContent,/干锅菜花/);click('[data-close]');
 click('[data-open="v7a01"]');assert.match(q('#recipe-dialog').textContent,/干锅菜花/);assert.ok(q('.tutorial-panel'));assert.doesNotMatch(q('.prep-details').textContent,/含腌制\/醒面/);assert.equal(d.querySelectorAll('#recipe-dialog .step').length,w.RECIPES.find(r=>r.id==='v7a01').steps.length);click('[data-close]');
 input('#search','');click('[data-cuisine="京菜"]');assert.equal(q('#cuisine').value,'京菜');assert.ok(d.querySelectorAll('.recipe-card').length>=5);assert.equal(q('[data-cuisine="京菜"]').getAttribute('aria-pressed'),'true');
 page('home');assert.equal(q('#cuisine').value,'京菜');assert.equal(q('#random-result [data-open]'),null);
 page('recipes');click('[data-reset-filters]');input('#search','红烧肉');assert.equal(q('.card-open').dataset.open,'d81');
 assert.deepEqual(JSON.parse(w.localStorage.getItem('cook-saved')),['d01','b41']);assert.equal(JSON.parse(w.localStorage.getItem('cook-notes')).d01.text,'少放盐');
 assert.deepEqual(errors,[]);console.log('v0.7 DOM passed: 340 recipes in bounded batches, cuisine discovery, name/alias/full-pinyin/initial search, explicit typo recovery, early tutorials, cross-page filters and old personal data.');
}finally{w.close();}
