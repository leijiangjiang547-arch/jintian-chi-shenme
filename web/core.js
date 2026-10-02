(function(root){
 'use strict';
 const format = n => Number(n.toFixed(1)).toString();
 const aliasGroups=[['番茄','西红柿','蕃茄'],['土豆','马铃薯','洋芋'],['花菜','菜花','花椰菜'],['西兰花','青花菜'],['包菜','卷心菜','圆白菜','洋白菜','甘蓝'],['红薯','地瓜','番薯'],['玉米','苞米'],['茄子','矮瓜'],['香菜','芫荽'],['生菜','莴苣叶'],['小葱','香葱'],['鸡蛋','鸡子'],['虾仁','虾肉'],['豆腐皮','千张','百叶'],['豇豆','长豆角'],['面粉','小麦粉'],['荸荠','马蹄'],['莴笋','莴苣笋'],['年糕','水磨年糕'],['西葫芦','角瓜'],['软体动物','贝类','软体贝类']];
 function normalize(text){let x=String(text||'').toLowerCase();for(const a of aliasGroups)for(const word of a.slice(1).sort((x,y)=>y.length-x.length))x=x.split(word).join(a[0]);return x;}
 const cuisineAliases={鲁菜:'山东菜',川菜:'四川菜 重庆菜',湘菜:'湖南菜',粤菜:'广东菜',苏菜:'江苏菜 淮扬菜',浙菜:'浙江菜 杭州菜',闽菜:'福建菜',徽菜:'安徽菜 徽州菜',京菜:'北京菜 京味',津菜:'天津菜',东北风味:'东北菜',西北风味:'西北菜'};
 function ingredientKeywords(r){const names=r.ingredients.map(i=>i.name),words=[];for(const [word,pattern] of [['鸡肉',/鸡胸|鸡腿|鸡翅|鸡中翅|鸡肉|鸡块|整鸡|三黄鸡/],['鸭肉',/鸭腿|鸭胸|鸭肉|鸭块|整鸭|鸭子|嫩鸭/],['牛肉',/牛里脊|牛腩|牛腱|牛柳|肥牛|牛腿|牛肋|牛肉/],['羊肉',/羊.*肉|羊排|羊腿/],['猪肉',/猪.*肉|猪里脊|五花肉/],['豆角',/四季豆|芸豆|豇豆|豆角/]])if(names.some(n=>pattern.test(n)&&!/(鸡腿菇|鸡蛋|鸭蛋|奶|乳|油)/.test(n)))words.push(word);return words;}
 const searchCache=new WeakMap();
 function searchText(r){if(!searchCache.has(r))searchCache.set(r,normalize([r.name,cuisineAliases[r.cuisine],r.cuisine,...(r.aliases||[]),r.group,...r.ingredients.map(i=>i.name),...ingredientKeywords(r)].join(' ')));return searchCache.get(r);}
 function matches(r,query){return normalize(query).trim().split(/[，,、\s]+/).filter(Boolean).every(term=>searchText(r).includes(term)||(/^[a-z]{2,}$/.test(term)&&(String(r.initials||'').includes(term)||String(r.pinyin||'').includes(term))));}
 function searchRank(r,query){const q=normalize(query).trim(),names=[r.name,...(r.aliases||[])].map(normalize);if(!q)return 0;if(names[0]===q)return 0;if(names.includes(q))return 1;if(names.some(n=>n.startsWith(q)))return 2;if(names.some(n=>n.includes(q)))return 3;if(/^[a-z]{2,}$/.test(q)&&String(r.initials||'').split(' ').includes(q))return 4;if(/^[a-z]{2,}$/.test(q)&&String(r.pinyin||'').split(' ').includes(q))return 4;return 5;}
 function rankResults(recipes,query){return query.trim()?recipes.map((r,n)=>({r,n,score:searchRank(r,query)})).sort((a,b)=>a.score-b.score||a.n-b.n).map(x=>x.r):recipes;}
 function editDistance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next[j+1]=Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1));row=next;}return row[b.length];}
 function nearbyNames(recipes,query){
   const q=normalize(query).replace(/[，,、\s]+/g,'').replace(/豆付/g,'豆腐').replace(/鸡旦/g,'鸡蛋').replace(/炒旦/g,'炒蛋');
   if(!/^[\u3400-\u9fff]{3,16}$/.test(q)&&!/^[a-z]{3,40}$/.test(q))return [];
   const latin=/^[a-z]+$/.test(q),shared=(a,b)=>[...new Set(a)].filter(c=>b.includes(c)).length;
   const foods=['韭菜','香菇','丝瓜','黄瓜','冬瓜','南瓜','土豆','番茄','茄子','豆角','豇豆','青椒','白菜','包菜','菠菜','芹菜','花菜','西兰花','莴笋','蒜苔','蒜薹','莲藕','藕片','山药','排骨','鸡翅','鸡腿','猪蹄','鸡肉','鸭肉','牛肉','羊肉','猪肉','牛腩','肥肠','虾仁','带鱼','黄花鱼','鲫鱼','鲈鱼','豆腐','粉条','粉丝','木耳','黄豆','豌豆','蚕豆','海带','玉米','板栗','梅菜','腊肉'].filter(t=>q.includes(t));
   const anchors=foods.filter(t=>!foods.some(other=>other!==t&&other.includes(t)));
   const meatTerms=r=>r.ingredients.map(i=>i.name).filter(n=>!/(鸡蛋|鸭蛋|鹌鹑蛋|蛋液|奶|乳|牛油果|鸡精|鸡粉|羊肚菌|鸡腿菇|猪油|牛油|鸭油)/.test(n));
   const speciesMatch=(r,kind)=>meatTerms(r).some(n=>kind==='猪'?(/猪|五花肉|肥肠/.test(n)||(!/牛|羊|鸡|鸭|鱼/.test(n)&&/里脊肉|肉末|肉馅/.test(n))):n.includes(kind));
   const hasMeat=r=>meatTerms(r).some(n=>/肉|里脊|五花|牛腩|肥牛|(?:鸡|鸭).*(?:腿|翅|胸|胗|块)|整鸡|整鸭|三黄鸡|猪蹄|猪肝|猪腰|肥肠|羊排|牛腱|排骨/.test(n));
   const ingredientMatch=(r,t)=>{const terms=r.ingredients.map(i=>normalize(i.name));if(t==='藕片')t='莲藕';if(t==='梅菜')return terms.some(n=>/梅.*菜/.test(n));if(t==='豆角')return terms.some(n=>/四季豆|芸豆|豇豆|豆角/.test(n));if(['蒜苔','蒜薹'].includes(t))return terms.some(n=>/蒜苔|蒜薹/.test(n));if(t==='鸡翅')return terms.some(n=>/鸡.*翅/.test(n));if(t==='鸡腿')return terms.some(n=>/鸡.*腿/.test(n));if(['牛肉','羊肉','鸡肉','鸭肉','猪肉'].includes(t))return speciesMatch(r,t[0]);return terms.some(n=>n.includes(t));};
   const mainMatch=r=>latin||(anchors.every(t=>ingredientMatch(r,t))&&(!q.includes('鱼')||q.includes('鱼香')||r.ingredients.some(i=>/鱼|黄鳝|鳗|鳝|鳕/.test(i.name)))&&(!q.includes('虾')||r.ingredients.some(i=>/虾/.test(i.name)))&&(!q.includes('蛋')||r.ingredients.some(i=>/鸡蛋|鸭蛋|鹌鹑蛋|蛋液|皮蛋|咸蛋/.test(i.name)))&&(!q.includes('肉')||hasMeat(r))&&(!q.includes('鸡')||q.includes('鸡蛋')||speciesMatch(r,'鸡'))&&(!q.includes('鸭')||q.includes('鸭蛋')||speciesMatch(r,'鸭')));
   return recipes.filter(r=>!matches(r,query)&&mainMatch(r)).map((r,index)=>{
     const names=[r.name,...(r.aliases||[])].map(n=>normalize(n).replace(/（[^）]*）|\([^)]*\)/g,''));
     let score=Infinity;
     for(const n of latin?String(r.pinyin||'').split(' ').filter(Boolean):names){
       const d=editDistance(n,q),min=Math.min(n.length,q.length),overlap=shared(n,q);
       if(d<=1||(d<=2&&min>=4&&overlap>=Math.ceil(min*.5)))score=Math.min(score,d*10+Math.abs(n.length-q.length));
       // An unfamiliar cooking name can still suggest dishes with the same main ingredient.
       if(!latin&&min>=4&&overlap>=3&&overlap/Math.max(n.length,q.length)>=.6){
         const main=r.ingredients.filter(i=>!/(油|盐|糖|水|酱|醋|淀粉|葱|姜|蒜|胡椒|香料)/.test(i.name)).some(i=>{const term=normalize(i.name);return term.length>=2&&q.includes(term);});
         if(main)score=Math.min(score,30+d);
       }
     }
     const methods=['炒','烧','炖','焖','蒸','煎','烤','炸','凉拌','干锅','水煮','糖醋'];
     if(Number.isFinite(score))score-=methods.filter(t=>q.includes(t)&&names.some(n=>n.includes(t))).length*4;
     return {id:r.id,name:r.name,score,index};
   }).filter(r=>Number.isFinite(r.score)).sort((a,b)=>a.score-b.score||a.index-b.index).map(({id,name})=>({id,name}));
 }
 const allergenAliases=[['蛋','鸡蛋','鸭蛋','鹌鹑蛋','蛋类'],['乳','奶','牛奶','乳制品'],['软体动物','贝类','软体贝类']];
 function excludes(r,word){if(normalize(r.name+' '+r.ingredients.map(i=>i.name).join(' ')+' '+ingredientKeywords(r).join(' ')+' '+r.allergens.join(' ')).includes(word))return true;const group=allergenAliases.find(g=>g.map(normalize).includes(word));return !!group&&r.allergens.some(label=>group.some(alias=>normalize(label).includes(normalize(alias))));}
 function filter(recipes,f={}){const excluded=normalize(f.exclude).split(/[，,、\s]+/).filter(Boolean);return recipes.filter(r=>(!f.category||r.category===f.category)&&(!f.cuisine||r.cuisine===f.cuisine)&&(!f.difficulty||r.difficulty===Number(f.difficulty))&&(!f.group||r.group===f.group)&&(!f.noNoodles||r.group!=='面条粉类')&&(!f.max||r.minutes<=Number(f.max))&&(!f.noSpicy||!r.spicy)&&matches(r,f.query)&&excluded.every(x=>!excludes(r,x)));}
 function amount(i){const u={g:'克',ml:'毫升'}[i.unit]||i.unit,n=i.amount;
   if(['个','只','片','根','张','朵'].includes(i.unit)&&n>0&&!Number.isInteger(n)){
     if(i.name==='鸡蛋')return format(n)+' 个（打散取约 '+Math.round(n*50)+' 克蛋液）';
     return n<1?'约 '+format(n)+' '+u+'（切分取用）':'约 '+Math.floor(n)+'–'+Math.ceil(n)+' '+u+'（按大小调整）';
   }return format(n)+' '+u+(i.scaling==='fixed'?'（锅中用量）':'');
 }
 function reconcileBought(before,after,bought){const old=new Map(before.map(i=>[i.key,i.amount]));return Object.fromEntries(after.filter(i=>bought[i.key]&&old.has(i.key)&&i.amount<=old.get(i.key)).map(i=>[i.key,true]));}
 function validateBackup(data,recipes){
   if(!data||data.app!=='cookdaily'||![1,2,3,4].includes(data.schema)||!data.data||typeof data.data!=='object'||Array.isArray(data.data))throw new Error('备份格式或版本不支持');
   const d=data.data,valid=new Set(recipes.map(r=>r.id));
   const ids=x=>{if(!Array.isArray(x)||x.length>10000||x.some(id=>typeof id!=='string'))throw new Error('菜谱记录格式不正确');return [...new Set(x.filter(id=>valid.has(id)))];};
   const saved=ids(d.saved),basket=ids(d.basket),recent=ids(d.recent).slice(-10);
   const p=d.prefs;if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('偏好格式不正确');
   const prefs=normalizePrefs(p,recipes);
   if(!d.bought||typeof d.bought!=='object'||Array.isArray(d.bought))throw new Error('清单格式不正确');
   const keys=new Set(shopping(recipes,basket,prefs.portions).map(i=>i.key));
   const bought=Object.fromEntries(Object.entries(d.bought).filter(([k,v])=>keys.has(k)&&v===true));
   if(!Array.isArray(d.history)||d.history.length>10000||d.history.some(h=>!h||typeof h.id!=='string'||!Number.isFinite(h.at)))throw new Error('做菜记录格式不正确');
   const history=d.history.filter(h=>valid.has(h.id)&&h.at>0&&h.at<=Date.now()+86400000).map(h=>({id:h.id,at:h.at})).slice(-200);
   if(data.schema>=4&&(!Array.isArray(d.requests)||d.requests.length>200||d.requests.some(r=>!validRequest(r))))throw new Error('补菜建议格式不正确');
   return {saved,basket,bought,prefs,recent,history,progress:normalizeProgress(data.schema>=2?d.progress:{},recipes),notes:normalizeNotes(data.schema>=3?d.notes:{},recipes),...(data.schema>=4?{requests:normalizeRequests(d.requests)}:{}),linkMode:d.linkMode==='default'?'default':'choose',theme:['auto','light','dark'].includes(d.theme)?d.theme:'auto'};
 }
 function choose(pool,recent=[],random=Math.random,catalog=pool){if(!pool.length)return null;let fresh=pool.filter(r=>!recent.includes(r.id));if(!fresh.length)fresh=pool.filter(r=>r.id!==recent[recent.length-1]);if(!fresh.length)fresh=pool;const key=r=>r.category+'|'+(r.group||r.id),last=catalog.find(r=>r.id===recent[recent.length-1]);const different=last?fresh.filter(r=>key(r)!==key(last)):fresh;if(different.length)fresh=different;const groups=[...new Set(fresh.map(key))];const pick=a=>a[Math.min(a.length-1,Math.floor(random()*a.length))];const group=pick(groups);return pick(fresh.filter(r=>key(r)===group));}
 function scaledAmount(i,servings,base){return i.amount*(i.scaling==='fixed'?1:servings/base);}
 function scale(r,servings){return r.ingredients.map(i=>({...i,amount:Number(scaledAmount(i,servings,r.servings).toFixed(1))}));}
 function duration(seconds){const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);return (hours?hours+'小时':'')+(minutes?minutes+'分':'')+(seconds%60?seconds%60+'秒':'');}
 function stepText(text,servings,base=2,recipe){
  return text.replace(/\{\{([^{}@]+)(?:@([\d.]+))?\}\}/g,(_,name,fraction)=>{const i=recipe?.ingredients.find(x=>x.name===name);if(!i)throw new Error('Unknown ingredient '+name);return name+' '+amount({...i,amount:Number((scaledAmount(i,servings,recipe.servings)*Number(fraction||1)).toFixed(1))}).replace(/ (克|毫升)(?=$|（)/,'$1');});
 }
 function normalizePrefs(p={},recipes=[]){if(!p||typeof p!=='object'||Array.isArray(p))p={};const category=['','早餐','家常菜'].includes(p.category)?p.category:'家常菜',catalog=recipes.filter(r=>!category||r.category===category);
   return {portions:Number.isInteger(p.portions)&&p.portions>=1&&p.portions<=6?p.portions:2,category,max:[15,20,30,45].includes(Number(p.max))?Number(p.max):0,noSpicy:p.noSpicy===true,exclude:typeof p.exclude==='string'?p.exclude.slice(0,300):'',difficulty:[1,2,3].includes(Number(p.difficulty))?Number(p.difficulty):0,noNoodles:p.noNoodles===true,cuisine:category!=='早餐'&&catalog.some(r=>r.cuisine===p.cuisine)?p.cuisine:'',group:catalog.some(r=>r.group===p.group)?p.group:'',query:typeof p.query==='string'?p.query.slice(0,100):''};
 }
 function normalizeProgress(value,recipes){const clean={};if(!value||typeof value!=='object'||Array.isArray(value))return clean;
   for(const r of recipes){const p=value[r.id];if(!p||p.revision!==r.revision||!Number.isInteger(p.index)||p.index<0||p.index>=r.steps.length||!Array.isArray(p.checked)||!Number.isFinite(p.updatedAt))continue;
     clean[r.id]={index:p.index,checked:[...new Set(p.checked.filter(n=>Number.isInteger(n)&&n>=0&&n<r.steps.length))],updatedAt:p.updatedAt,revision:r.revision};
   }return clean;
 }
 function normalizeNotes(value,recipes){const clean={};if(!value||typeof value!=='object'||Array.isArray(value))return clean;for(const r of recipes){const n=value[r.id];if(n&&typeof n.text==='string'&&n.text.trim())clean[r.id]={text:n.text.slice(0,1000),updatedAt:Number.isFinite(n.updatedAt)?n.updatedAt:0};}return clean;}
 function firstUnchecked(checked,length){const set=new Set(checked);for(let i=0;i<length;i++)if(!set.has(i))return i;return length-1;}
 function validRequest(r){return r&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=40&&typeof r.note==='string'&&r.note.length<=300&&Number.isFinite(r.at)&&r.at>0&&r.at<=Date.now()+86400000;}
 function normalizeRequests(value){if(!Array.isArray(value))return [];const seen=new Set();return value.filter(validRequest).map(r=>({name:r.name.trim(),note:r.note.trim(),at:r.at})).filter(r=>{const key=normalize(r.name).replace(/\s/g,'');if(seen.has(key))return false;seen.add(key);return true;}).slice(0,200);}
 function requestText(r){return '想补充的菜：'+r.name+'\n'+(r.note?'口味或做法：'+r.note+'\n':'')+'来自 今天吃什么';}
 function recipeRequestUrl(r){if(!validRequest(r))throw new Error('请填写有效的菜名');const params=new URLSearchParams({title:'补菜建议：'+r.name,body:requestText(r)});return 'https://github.com/leijiangjiang547-arch/jintian-chi-shenme/issues/new?'+params;}
 function migrateStorage(storage,recipes){const get=(k,f)=>{try{return JSON.parse(storage.getItem('cook-'+k))??f;}catch{return f;}};const version=get('version',0);if(!Number.isInteger(version)||version>4)return {writable:false,reason:'本机数据来自更新版本，请升级应用后再修改记录。'};
   const oldProgress=get('progress',{}),prefs=normalizePrefs(get('prefs',{}),recipes),progress=normalizeProgress(oldProgress,recipes),resetIds=Object.keys(oldProgress&&typeof oldProgress==='object'?oldProgress:{}).filter(id=>recipes.some(r=>r.id===id)&&!progress[id]),notes=normalizeNotes(get('notes',{}),recipes);
   // Version is written last; existing IDs and unrelated keys are never deleted.
   try{storage.setItem('cook-prefs',JSON.stringify(prefs));storage.setItem('cook-progress',JSON.stringify(progress));storage.setItem('cook-notes',JSON.stringify(notes));storage.setItem('cook-requests',JSON.stringify(normalizeRequests(get('requests',[]))));storage.setItem('cook-version','4');}catch{return {writable:false,reason:'存储不可用，记录暂时无法保存。'};}
   return {writable:true,prefs,progress,resetProgressIds:resetIds};
 }
 function suggestions(recipes,filters,day){const list=filter(recipes,filters);if(!list.length)return [];let seed=0;for(const c of String(day))seed=(seed*31+c.charCodeAt(0))>>>0;const offset=seed%list.length;return [...list.slice(offset),...list.slice(0,offset)].slice(0,6);}
 function shopping(recipes,selected,servings){const map=new Map();for(const id of selected){const r=recipes.find(x=>x.id===id);if(!r)continue;for(const i of scale(r,servings)){if(i.amount===0)continue;const key=i.name+'|'+i.unit;const old=map.get(key);if(old)old.amount=Number((old.amount+i.amount).toFixed(1));else{const {scaling,...item}=i;map.set(key,{...item,key});}}}return [...map.values()];}
 function shoppingItems(recipes,selected,servings){return shopping(recipes,selected,servings).filter(i=>!['清水','水','温水','开水','凉水','热水','饮用水','温开水','冷水','冰水','纯净水'].includes(i.name));}
 function shoppingText(recipes,selected,servings,bought={},onlyPending=true){const list=shoppingItems(recipes,selected,servings),pending=list.filter(i=>!bought[i.key]),purchased=list.filter(i=>bought[i.key]);if(!list.length||(onlyPending&&!pending.length))return '';const names=selected.map(id=>recipes.find(r=>r.id===id)?.name).filter(Boolean);return ['今天吃什么 · 买菜清单','每道菜 '+servings+' 人份','菜谱：'+names.join('、'),'',...(pending.length?['待购买',...pending.map(i=>'□ '+i.name+' '+amount(i))]:[]),...(!onlyPending&&purchased.length?['','已购买',...purchased.map(i=>'✓ '+i.name+' '+amount(i))]:[])].join('\n');}
 const api={format,duration,filter,choose,scale,stepText,shopping,shoppingItems,shoppingText,amount,normalize,matches,rankResults,nearbyNames,reconcileBought,validateBackup,normalizePrefs,normalizeProgress,normalizeNotes,normalizeRequests,requestText,recipeRequestUrl,firstUnchecked,migrateStorage,suggestions};if(typeof module!=='undefined')module.exports=api;root.CookCore=api;
})(typeof window!=='undefined'?window:globalThis);
