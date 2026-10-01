// DOM integration with a simulated Kitchen bridge, not Android/device validation.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../web'),windows=[];

function boot(storage={}){
 const dom=new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'),{
  url:'https://cookdaily.test',runScripts:'outside-only',pretendToBeVisual:true
 });
 const w=dom.window,d=w.document;windows.push(w);
 const errors=[],external=[],alarms=[];
 let now=Date.now(),exported='',cancels=0;
 let status={exact:true,notifications:true,active:false,token:'',remaining:0};
 w.Date.now=()=>now;
 w.scrollTo=()=>{};w.confirm=()=>true;
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.addEventListener('error',e=>errors.push(e.message));
 w.Kitchen={
  timerStatus:()=>JSON.stringify(status),
  startTimer:(seconds,title,token)=>{alarms.push({seconds,title,token});status={...status,active:true,token,remaining:seconds*1000};return 'native';},
  cancelTimer:()=>{cancels++;status.active=false;},
  openExternal:(url,choose)=>external.push({url,choose}),
  exportBackup:text=>{exported=text;},importBackup:()=>{},
  cooking:()=>{},appearance:()=>{},systemDark:()=>false,landscape:()=>{},
  systemTimer:()=>{},notificationSettings:()=>{},exactSettings:()=>{}
 };
 for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);
 for(const f of ['recipes.js','search-index.js','core.js','app.js'])w.eval(fs.readFileSync(path.join(base,f),'utf8'));
 const q=s=>d.querySelector(s);
 const click=s=>{const el=typeof s==='string'?q(s):s;assert.ok(el,'Missing click target: '+s);el.click();};
 const change=(s,value,type='change')=>{const el=q(s);assert.ok(el,'Missing change target: '+s);if(typeof value==='boolean')el.checked=value;else el.value=value;el.dispatchEvent(new w.Event(type,{bubbles:true}));};
 const page=p=>{w.history.replaceState(null,'','#'+p);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
 const snapshot=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)];}));
 const stored=k=>JSON.parse(w.localStorage.getItem('cook-'+k));
 const open=id=>{
  page('recipes');click('[data-reset-filters]');change('#exclude','','input');change('#no-spicy',false);
  change('#search',w.RECIPES.find(r=>r.id===id).name,'input');click('[data-open="'+id+'"]');
 };
 const exportedBackup=()=>{click('#settings');click('[data-export]');const backup=JSON.parse(exported);click('#close-settings');return backup;};
 return {w,d,q,click,change,page,snapshot,stored,open,exportedBackup,errors,external,alarms,
  advance:milliseconds=>{now+=milliseconds;},get cancels(){return cancels;}
 };
}

try{
 // A breakfast collection must remain discoverable after filtering home dishes.
 const a=boot({'cook-saved':'["b41"]','cook-prefs':JSON.stringify({category:'家常菜',max:15,noSpicy:true,exclude:'牛肉',query:'红烧肉'})});
 a.page('favorites');
 assert.equal(a.d.querySelectorAll('.recipe-card').length,0);
 assert.match(a.q('#main').textContent,/收藏.*1|1.*收藏/,'Show the collection total, even when no item matches');
 a.click('[data-show-all-saved]');
 assert.equal(a.d.querySelectorAll('.recipe-card').length,1);
 assert.ok(a.q('[data-open="b41"]'));
 assert.equal(a.stored('prefs').category,'');
 assert.equal(a.stored('prefs').max,0);
 assert.equal(a.stored('prefs').query,'');
 assert.equal(a.stored('prefs').exclude,'牛肉');
 assert.equal(a.stored('prefs').noSpicy,true);
 a.page('home');a.click('[data-category="早餐"]');a.change('#max','15');a.change('#no-noodles',true);
 a.click('[data-reset-filters]');
 assert.equal(a.stored('prefs').category,'');
 assert.equal(a.stored('prefs').noNoodles,false);
 assert.equal(a.stored('prefs').exclude,'牛肉');
 assert.equal(a.stored('prefs').noSpicy,true);
 const empty=boot();empty.page('favorites');
 assert.match(empty.q('#main').textContent,/收藏/);
 assert.ok(empty.q('#main a[href="#recipes"]'),'Empty collection has a discover-recipes action');
 assert.equal(empty.q('[data-show-all-saved]'),null,'Do not offer filter recovery when there are no saved recipes');

 // Manual checkbox progress survives closing/reloading and resumes the first unfinished step.
 const b=boot();b.open('d01');
 for(const i of [0,1,2])b.change('[data-done="'+i+'"]',true);
 assert.equal(b.stored('progress').d01.index,3);
 b.click('[data-close]');
 const resumed=boot(b.snapshot());resumed.open('d01');
 assert.match(resumed.q('[data-cook]').textContent,/第4步/);
 for(const i of [0,1,2])assert.equal(resumed.q('[data-done="'+i+'"]').checked,true);
 resumed.change('[data-done="1"]',false);
 assert.equal(resumed.stored('progress').d01.index,1);
 const recipe=resumed.w.RECIPES.find(r=>r.id==='d01');
 for(let i=0;i<recipe.steps.length;i++)resumed.change('[data-done="'+i+'"]',true);
 assert.ok(resumed.q('[data-finish-recipe]'),'All checked steps expose an explicit finish action');
 resumed.click('[data-finish-recipe]');
 assert.equal(resumed.stored('progress').d01,undefined);
 assert.equal(resumed.stored('history').filter(h=>h.id==='d01').length,1);
 resumed.click('[data-record="d01"]');resumed.click('[data-record="d01"]');
 assert.equal(resumed.stored('history').filter(h=>h.id==='d01').length,1,'Repeated daily record taps are idempotent');

 // Completing a dish cancels its own application timer; another dish's timer survives.
 const timed=boot();timed.open('d01');
 const firstTimer=timed.w.RECIPES.find(r=>r.id==='d01').steps.findIndex(s=>s.seconds>0);
 timed.click('[data-timer="'+firstTimer+'"]');timed.click('[data-cook]');
 for(const step of timed.w.RECIPES.find(r=>r.id==='d01').steps){timed.advance(650);timed.click('[data-next]');}
 assert.equal(timed.stored('timer'),null);
 assert.equal(timed.cancels,1);
 assert.equal(timed.q('#timer-dock').textContent,'');
 assert.equal(timed.stored('progress').d01,undefined);
 timed.click('[data-close]');timed.open('d01');timed.click('[data-timer="'+firstTimer+'"]');
 const otherTimer=timed.stored('timer'),previousCancels=timed.cancels;
 timed.click('[data-close]');timed.open('d02');timed.click('[data-cook]');
 for(const step of timed.w.RECIPES.find(r=>r.id==='d02').steps){timed.advance(650);timed.click('[data-next]');}
 assert.equal(timed.cancels,previousCancels);
 assert.equal(timed.stored('timer').token,otherTimer.token);

 // Tutorials are visible before ingredients/steps, and every external link uses the same bridge.
 const links=boot();links.open('d103');
 const panel=links.q('.tutorial-panel'),ingredients=links.q('.ingredients'),firstStep=links.q('.step');
 assert.ok(panel&&ingredients&&firstStep);
 assert.ok(panel.compareDocumentPosition(ingredients)&4,'Tutorial panel precedes ingredients');
 assert.ok(panel.compareDocumentPosition(firstStep)&4,'Tutorial panel precedes the steps');
 const sourceContainer=links.q('.sources');
 assert.ok(sourceContainer?.closest('details'),'Attribution is available in a disclosure');
 const sourceRecipe=links.w.RECIPES.find(r=>r.id==='d103');
 for(const source of sourceRecipe.sources){if(source.note&&source.note.length>24)assert.ok(!links.q('#recipe-dialog').textContent.includes(source.note),'Raw editorial source notes are not user interface copy');}
 if(sourceRecipe.editorial)assert.ok(!links.q('#recipe-dialog').textContent.includes(sourceRecipe.editorial));
 const externalAnchors=[...links.d.querySelectorAll('a[href]')].filter(el=>/^https?:/i.test(el.getAttribute('href')||''));
 assert.ok(externalAnchors.length>=3);
 for(const anchor of externalAnchors){const before=links.external.length;links.click(anchor);assert.equal(links.external.length,before+1);assert.equal(links.external.at(-1).url,anchor.href);assert.equal(links.external.at(-1).choose,true);}
 links.click('[data-close]');links.click('#settings');
 assert.equal(links.q('#link-mode').value,'choose');links.change('#link-mode','default');links.click('#close-settings');
 links.open('d103');links.click(links.q('.tutorial-panel a[href]'));
 assert.equal(links.external.at(-1).choose,false);
 const linkReload=boot(links.snapshot());linkReload.click('#settings');assert.equal(linkReload.q('#link-mode').value,'default');linkReload.click('#close-settings');

 // Private notes survive navigation/reload and backup v3 without becoming executable markup.
 const journal=boot({'cook-saved':'["d01"]'});journal.open('d01');
 const privateText='私人试做：下次盐少一点 <img src=x onerror="window.noteRan=true">';
 journal.change('#recipe-note',privateText,'input');journal.click('[data-journal-save]');
 assert.ok(JSON.stringify(journal.stored('notes')).includes('私人试做：下次盐少一点'));
 journal.click('[data-done="0"]');
 journal.click('[data-close]');
 const journalReload=boot(journal.snapshot());journalReload.open('d01');
 assert.equal(journalReload.q('#recipe-note').value,privateText);
 assert.equal(journalReload.q('#recipe-dialog img[src="x"]'),null);
 assert.equal(journalReload.w.noteRan,undefined);
 journalReload.click('[data-close]');
 const backup=journalReload.exportedBackup();
 assert.equal(backup.schema,3);
 assert.deepEqual(backup.data.saved,['d01']);
 assert.ok(JSON.stringify(backup.data.notes).includes('私人试做：下次盐少一点'));
 assert.equal(backup.data.progress.d01.index,1);
 const restore=boot();restore.w.receiveBackup(JSON.stringify(backup));restore.open('d01');
 assert.equal(restore.q('#recipe-note').value,privateText);
 assert.equal(restore.q('[data-done="0"]').checked,true);
 assert.deepEqual(restore.stored('saved'),['d01']);
 restore.click('[data-close]');
 const backup2=JSON.parse(JSON.stringify(backup));backup2.schema=2;delete backup2.data.notes;
 restore.w.receiveBackup(JSON.stringify(backup2));
 assert.deepEqual(restore.stored('saved'),['d01']);assert.equal(restore.stored('progress').d01.index,1);
 const backup1=JSON.parse(JSON.stringify(backup2));backup1.schema=1;delete backup1.data.progress;
 restore.w.receiveBackup(JSON.stringify(backup1));assert.deepEqual(restore.stored('saved'),['d01']);
 const beforeInvalid=restore.snapshot();const unsupported={...backup,schema:999};restore.w.receiveBackup(JSON.stringify(unsupported));
 assert.deepEqual(restore.snapshot(),beforeInvalid,'Unsupported backup must not mutate local data');

 for(const app of [a,empty,b,resumed,timed,links,linkReload,journal,journalReload,restore])assert.deepEqual(app.errors,[]);
 console.log('v0.6 DOM passed: collection recovery, reset preserving exclusions, checkbox resume/finish, daily history deduplication, matching timer cancellation, early tutorials, folded clean attribution, browser choice persistence, private notes, backup schemas 1/2/3. Native bridge simulated, not device QA.');
}finally{for(const w of windows)w.close();}
