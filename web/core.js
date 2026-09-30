(function(root){
 'use strict';
 const format = n => Number(n.toFixed(1)).toString();
 const aliasGroups=[['番茄','西红柿'],['土豆','马铃薯','洋芋'],['花菜','菜花','花椰菜'],['西兰花','青花菜'],['包菜','卷心菜','圆白菜','洋白菜','甘蓝'],['红薯','地瓜','番薯'],['玉米','苞米'],['茄子','矮瓜'],['香菜','芫荽'],['生菜','莴苣叶'],['小葱','香葱'],['鸡蛋','鸡子'],['虾仁','虾肉'],['豆腐皮','千张','百叶'],['豇豆','长豆角'],['面粉','小麦粉']];
 function normalize(text){let x=String(text||'').toLowerCase();for(const a of aliasGroups)for(const word of a.slice(1))x=x.split(word).join(a[0]);return x;}
 const cuisineAliases={鲁菜:'山东菜',川菜:'四川菜 重庆菜',湘菜:'湖南菜',粤菜:'广东菜',苏菜:'江苏菜 淮扬菜',浙菜:'浙江菜 杭州菜',闽菜:'福建菜',徽菜:'安徽菜 徽州菜',津菜:'天津菜',东北风味:'东北菜'};
 const searchCache=new WeakMap();
 function searchText(r){if(!searchCache.has(r))searchCache.set(r,normalize([r.name,cuisineAliases[r.cuisine],r.cuisine,...(r.aliases||[]),r.group,...r.ingredients.map(i=>i.name)].join(' ')));return searchCache.get(r);}
 function matches(r,query){return normalize(query).trim().split(/[，,、\s]+/).filter(Boolean).every(term=>searchText(r).includes(term)||(/^[a-z]{2,}$/.test(term)&&String(r.initials||'').includes(term)));}
 function filter(recipes,f={}){const excluded=normalize(f.exclude).split(/[，,、\s]+/).filter(Boolean);return recipes.filter(r=>(!f.category||r.category===f.category)&&(!f.cuisine||r.cuisine===f.cuisine)&&(!f.difficulty||r.difficulty===Number(f.difficulty))&&(!f.group||r.group===f.group)&&(!f.noNoodles||r.group!=='面条粉类')&&(!f.max||r.minutes<=Number(f.max))&&(!f.noSpicy||!r.spicy)&&matches(r,f.query)&&excluded.every(x=>!normalize(r.name+' '+r.ingredients.map(i=>i.name).join(' ')+' '+r.allergens.join(' ')).includes(x)));}
 function amount(i){const u={g:'克',ml:'毫升'}[i.unit]||i.unit,n=i.amount;
   if(['个','只','片','根','张','朵'].includes(i.unit)&&n>0&&!Number.isInteger(n)){
     if(i.name==='鸡蛋')return format(n)+' 个（打散取约 '+Math.round(n*50)+' 克蛋液）';
     return n<1?'约 '+format(n)+' '+u+'（切分取用）':'约 '+Math.floor(n)+'–'+Math.ceil(n)+' '+u+'（按大小调整）';
   }return format(n)+' '+u;
 }
 function reconcileBought(before,after,bought){const old=new Map(before.map(i=>[i.key,i.amount]));return Object.fromEntries(after.filter(i=>bought[i.key]&&old.has(i.key)&&i.amount<=old.get(i.key)).map(i=>[i.key,true]));}
 function validateBackup(data,recipes){
   if(!data||data.app!=='cookdaily'||![1,2].includes(data.schema)||!data.data||typeof data.data!=='object')throw new Error('备份格式或版本不支持');
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
   return {saved,basket,bought,prefs,recent,history,progress:normalizeProgress(data.schema===2?d.progress:{},recipes),theme:['auto','light','dark'].includes(d.theme)?d.theme:'auto'};
 }
 function choose(pool,recent=[],random=Math.random,catalog=pool){if(!pool.length)return null;let fresh=pool.filter(r=>!recent.includes(r.id));if(!fresh.length)fresh=pool.filter(r=>r.id!==recent[recent.length-1]);if(!fresh.length)fresh=pool;const key=r=>r.category+'|'+(r.group||r.id),last=catalog.find(r=>r.id===recent[recent.length-1]);const different=last?fresh.filter(r=>key(r)!==key(last)):fresh;if(different.length)fresh=different;const groups=[...new Set(fresh.map(key))];const pick=a=>a[Math.min(a.length-1,Math.floor(random()*a.length))];const group=pick(groups);return pick(fresh.filter(r=>key(r)===group));}
 function scale(r,servings){return r.ingredients.map(i=>({...i,amount:Number((i.amount*servings/r.servings).toFixed(1))}));}
 function duration(seconds){return (Math.floor(seconds/60)?Math.floor(seconds/60)+'分':'')+(seconds%60?seconds%60+'秒':'');}
 function stepText(text,servings,base=2,recipe){
  return text.replace(/\{\{([^{}@]+)(?:@([\d.]+))?\}\}/g,(_,name,fraction)=>{const i=recipe?.ingredients.find(x=>x.name===name);if(!i)throw new Error('Unknown ingredient '+name);return name+' '+amount({...i,amount:Number((i.amount*servings/recipe.servings*Number(fraction||1)).toFixed(1))}).replace(/ (克|毫升)$/,'$1');});
 }
 function normalizePrefs(p={},recipes=[]){if(!p||typeof p!=='object'||Array.isArray(p))p={};const category=['','早餐','家常菜'].includes(p.category)?p.category:'家常菜',catalog=recipes.filter(r=>!category||r.category===category);
   return {portions:Number.isInteger(p.portions)&&p.portions>=1&&p.portions<=6?p.portions:2,category,max:[15,20,30,45].includes(Number(p.max))?Number(p.max):0,noSpicy:p.noSpicy===true,exclude:typeof p.exclude==='string'?p.exclude.slice(0,300):'',difficulty:[1,2,3].includes(Number(p.difficulty))?Number(p.difficulty):0,noNoodles:p.noNoodles===true,cuisine:category!=='早餐'&&catalog.some(r=>r.cuisine===p.cuisine)?p.cuisine:'',group:catalog.some(r=>r.group===p.group)?p.group:'',query:typeof p.query==='string'?p.query.slice(0,100):''};
 }
 function normalizeProgress(value,recipes){const clean={};if(!value||typeof value!=='object'||Array.isArray(value))return clean;
   for(const r of recipes){const p=value[r.id];if(!p||p.revision!==r.revision||!Number.isInteger(p.index)||p.index<0||p.index>=r.steps.length||!Array.isArray(p.checked)||!Number.isFinite(p.updatedAt))continue;
     clean[r.id]={index:p.index,checked:[...new Set(p.checked.filter(n=>Number.isInteger(n)&&n>=0&&n<r.steps.length))],updatedAt:p.updatedAt,revision:r.revision};
   }return clean;
 }
 function migrateStorage(storage,recipes){const get=(k,f)=>{try{return JSON.parse(storage.getItem('cook-'+k))??f;}catch{return f;}};const version=get('version',0);if(!Number.isInteger(version)||version>2)return {writable:false,reason:'本机数据来自更新版本，请升级应用后再修改记录。'};
   const prefs=normalizePrefs(get('prefs',{}),recipes),progress=normalizeProgress(get('progress',{}),recipes);
   // Version is written last; existing IDs and unrelated keys are never deleted.
   try{storage.setItem('cook-prefs',JSON.stringify(prefs));storage.setItem('cook-progress',JSON.stringify(progress));storage.setItem('cook-version','2');}catch{return {writable:false,reason:'存储不可用，记录暂时无法保存。'};}
   return {writable:true,prefs,progress};
 }
 function suggestions(recipes,filters,day){const list=filter(recipes,filters);if(!list.length)return [];let seed=0;for(const c of String(day))seed=(seed*31+c.charCodeAt(0))>>>0;const offset=seed%list.length;return [...list.slice(offset),...list.slice(0,offset)].slice(0,6);}
 function shopping(recipes,selected,servings){const map=new Map();for(const id of selected){const r=recipes.find(x=>x.id===id);if(!r)continue;for(const i of scale(r,servings)){if(i.amount===0)continue;const key=i.name+'|'+i.unit;const old=map.get(key);if(old)old.amount=Number((old.amount+i.amount).toFixed(1));else map.set(key,{...i,key});}}return [...map.values()];}
 const api={format,duration,filter,choose,scale,stepText,shopping,amount,normalize,matches,reconcileBought,validateBackup,normalizePrefs,normalizeProgress,migrateStorage,suggestions};if(typeof module!=='undefined')module.exports=api;root.CookCore=api;
})(typeof window!=='undefined'?window:globalThis);
