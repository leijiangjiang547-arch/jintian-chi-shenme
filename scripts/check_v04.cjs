// Integration tests with a simulated native bridge, NOT Android device validation.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../web');
const dom=new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'),{url:'https://cookdaily.test',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,errors=[];
w.addEventListener('error',e=>errors.push(e.message));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
let now=Date.now(),payload,alarms=[],cancels=0;w.Date.now=()=>now;w.confirm=()=>true;
let status={exact:true,notifications:true,active:false,token:'',remaining:0};
w.Kitchen={timerStatus:()=>JSON.stringify(status),startTimer:(seconds,title,token)=>{alarms.push({seconds,title,token});status={...status,active:true,token,remaining:seconds*1000};return status.exact&&status.notifications?'native':'foreground';},cancelTimer:()=>{cancels++;status.active=false;},exportBackup:x=>payload=x,importBackup:()=>{},cooking:()=>{},appearance:()=>{},systemDark:()=>false,landscape:()=>{},systemTimer:()=>{},notificationSettings:()=>{},exactSettings:()=>{}};
w.localStorage.setItem('cook-saved',JSON.stringify(['d01']));
for(const f of ['recipes.js','search-index.js','core.js','app.js'])w.eval(fs.readFileSync(path.join(base,f),'utf8'));
const click=s=>{assert.ok(d.querySelector(s),s);d.querySelector(s).click();};
const change=(s,v,type='change')=>{const e=d.querySelector(s);if(typeof v==='boolean')e.checked=v;else e.value=v;e.dispatchEvent(new w.Event(type,{bubbles:true}));};
const page=p=>{w.history.replaceState(null,'','#'+p);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
const open=id=>{page('recipes');change('#search',w.RECIPES.find(r=>r.id===id).name,'input');click('[data-open="'+id+'"]');};
try {
 page('recipes');change('#search','HSR','input');assert.match(d.querySelector('#list-results').textContent,/红烧肉/);
 change('#search','西红柿 鸡蛋','input');assert.ok(d.querySelector('[data-open="d01"]'));
 change('#search','','input');click('[data-category="家常菜"]');change('#cuisine','湘菜');change('#max','15');change('#exclude','香菜','input');
 assert.match(d.querySelector('#list-results').textContent,/最快需要/);click('[data-relax-time]');assert.equal(d.querySelector('#exclude').value,'香菜');assert.equal(d.querySelector('#cuisine').value,'湘菜');assert.ok(d.querySelectorAll('.recipe-card').length);
 click('[data-reset-filters]');open('d01');click('[data-add="d01"]');click('[data-close]');page('shopping');change('[data-bought="鸡蛋|个"]',true);change('[data-bought="盐|g"]',true);
 click('[data-portions="-1"]');assert.equal(d.querySelector('[data-bought="鸡蛋|个"]').checked,true);assert.match(d.querySelector('#main').textContent,/75 克蛋液/);
 open('d02');click('[data-add="d02"]');click('[data-close]');page('shopping');assert.equal(d.querySelector('[data-bought="鸡蛋|个"]').checked,false);
 change('[data-bought="鸡蛋|个"]',true);click('[data-remove="d02"]');assert.equal(d.querySelector('[data-bought="鸡蛋|个"]').checked,true);
 open('d01');click('[data-record="d01"]');assert.equal(JSON.parse(w.localStorage.getItem('cook-history')).length,1);
 click('[data-cook]');click('[data-lock]');click('[data-next]');assert.match(d.querySelector('#recipe-dialog .dialog-header').textContent,/1 \/ /);
 click('[data-unlock]');assert.ok(d.querySelector('.touch-lock'));click('[data-unlock]');assert.equal(d.querySelector('.touch-lock'),null);
 click('[data-next]');click('[data-next]');assert.match(d.querySelector('#recipe-dialog .dialog-header').textContent,/2 \/ /);
 const timed=w.RECIPES.find(r=>r.id==='d01').steps.findIndex(s=>s.seconds>0);click('[data-close]');click('[data-timer="'+timed+'"]');assert.equal(alarms.length,1);assert.match(d.querySelector('#timer-dock').textContent,/系统提醒已安排/);
 click('[data-close]');assert.match(d.querySelector('#global-timer').textContent,/系统提醒已安排/);
 status.exact=false;w.nativeResume();assert.match(d.querySelector('#global-timer').textContent,/仅前台/);assert.ok(cancels>0);click('[data-stop-timer]');assert.equal(d.querySelector('#global-timer').textContent,'');
 click('#settings');change('#theme','dark');assert.equal(d.documentElement.dataset.theme,'dark');click('[data-export]');const backup=JSON.parse(payload);assert.deepEqual(backup.data.saved,['d01']);assert.equal(backup.data.history.length,1);assert.equal(backup.data.bought['鸡蛋|个'],true);
 const previous=w.localStorage.getItem('cook-saved');w.receiveBackup('{broken');assert.equal(w.localStorage.getItem('cook-saved'),previous);
 const modified=JSON.parse(payload);modified.data.saved=['b41'];w.receiveBackup(JSON.stringify(modified));assert.deepEqual(JSON.parse(w.localStorage.getItem('cook-saved')),['b41']);assert.equal(JSON.parse(w.localStorage.getItem('cook-bought'))['鸡蛋|个'],true);
 w.receiveBackup(payload);assert.deepEqual(JSON.parse(w.localStorage.getItem('cook-saved')),['d01']);assert.equal(w.appBack(),true);assert.equal(d.querySelector('#settings-dialog').open,false);
 assert.deepEqual(errors,[]);console.log('v0.4 integration passed: aliases/initials, empty guidance with exclusions preserved, selective shopping checks, egg quantity, history, lock/debounce, native bridge permission fallback/cancel, theme, backup export/invalid import/restore. Android bridge simulated, not device QA.');
} finally {w.close();}
