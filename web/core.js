(function(root){
 'use strict';
 const format = n => Number(n.toFixed(1)).toString();
 function filter(recipes,f={}){const excluded=(f.exclude||'').split(/[，,、\s]+/).filter(Boolean);return recipes.filter(r=>(!f.category||r.category===f.category)&&(!f.group||r.group===f.group)&&(!f.newOnly||r.edition==='0.2.0')&&(!f.noNoodles||r.group!=='面条粉类')&&(!f.max||r.minutes<=Number(f.max))&&(!f.noSpicy||!r.spicy)&&(!f.query||(r.name+' '+(r.aliases||[]).join(' ')+' '+r.group+' '+r.ingredients.map(i=>i.name).join(' ')).includes(f.query.trim()))&&excluded.every(x=>!(r.name+' '+r.ingredients.map(i=>i.name).join(' ')+' '+r.allergens.join(' ')).includes(x)));}
 function choose(pool,recent=[],random=Math.random,catalog=pool){if(!pool.length)return null;let fresh=pool.filter(r=>!recent.includes(r.id));if(!fresh.length)fresh=pool.filter(r=>r.id!==recent[recent.length-1]);if(!fresh.length)fresh=pool;const key=r=>r.category+'|'+(r.group||r.id),last=catalog.find(r=>r.id===recent[recent.length-1]);const different=last?fresh.filter(r=>key(r)!==key(last)):fresh;if(different.length)fresh=different;const groups=[...new Set(fresh.map(key))];const pick=a=>a[Math.min(a.length-1,Math.floor(random()*a.length))];const group=pick(groups);return pick(fresh.filter(r=>key(r)===group));}
 function scale(r,servings){return r.ingredients.map(i=>({...i,amount:Number((i.amount*servings/r.servings).toFixed(1))}));}
 function duration(seconds){return (Math.floor(seconds/60)?Math.floor(seconds/60)+'分':'')+(seconds%60?seconds%60+'秒':'');}
 function stepText(text,servings,base=2,recipe){
  if(recipe?.tokenAmounts)return text.replace(/\{\{([^{}@]+)(?:@([\d.]+))?\}\}/g,(_,name,fraction)=>{const i=recipe.ingredients.find(x=>x.name===name);if(!i)throw new Error('Unknown ingredient '+name);return name+' '+format(i.amount*servings/recipe.servings*Number(fraction||1))+(i.unit==='ml'?'毫升':i.unit==='g'?'克':i.unit);});
  text=text.replace(/(\d+(?:\.\d+)?)(毫升|克)/g,(_,n,u)=>format(Number(n)*servings/base)+u);
  if(!recipe)return text;
  const all=recipe.steps.map(s=>s.text).join(' '),scaled=scale(recipe,servings);
  const amount=(name,fraction)=>{const i=scaled.find(i=>i.name===name);return i?name+' '+format(i.amount*fraction)+(i.unit==='ml'?'毫升':i.unit==='g'?'克':i.unit):null;};
  for(const [pattern,name,fraction] of [[/三分之二的?食用油|三分之二油/g,'食用油',2/3],[/三分之一的?食用油|三分之一油/g,'食用油',1/3],[/一半的?食用油|一半油/g,'食用油',.5],[/剩余的?食用油|剩余油/g,'食用油',/三分之二.*油/.test(all)?1/3:/三分之一油/.test(all)?2/3:.5],[/一半盐|剩余盐/g,'盐',.5],[/一半生抽|剩余生抽/g,'生抽',.5],[/全部食用油/g,'食用油',1],[/全部盐/g,'盐',1]]){const replacement=amount(name,fraction);if(replacement)text=text.replace(pattern,replacement);}
  return text;
 }
 function shopping(recipes,selected,servings){const map=new Map();for(const id of selected){const r=recipes.find(x=>x.id===id);if(!r)continue;for(const i of scale(r,servings)){if(i.amount===0)continue;const key=i.name+'|'+i.unit;const old=map.get(key);if(old)old.amount=Number((old.amount+i.amount).toFixed(1));else map.set(key,{...i,key});}}return [...map.values()];}
 const api={format,duration,filter,choose,scale,stepText,shopping};if(typeof module!=='undefined')module.exports=api;root.CookCore=api;
})(typeof window!=='undefined'?window:globalThis);
