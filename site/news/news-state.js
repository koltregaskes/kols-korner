// Shared offline status logic for the build and browser; never reads credentials.
(function(root){
 function assessFeed(payload,now=Date.now()){
  const unavailable={kind:'unavailable',message:'Current news feed unavailable. Showing dated archive material where available.'};
  if(!payload || payload.site!=="Kol's Korner" || !Array.isArray(payload.articles))return unavailable;
  const generated=Date.parse(payload.generated),times=payload.articles.map(a=>Date.parse(a.date));
  if(!Number.isFinite(generated)||generated>now+300000||times.some(t=>!Number.isFinite(t)||t>now+300000))return {...unavailable,kind:'invalid'};
  const checked=new Date(generated).toISOString(),newest=times.length?new Date(Math.max(...times)).toISOString():null;
  const stale=now-generated>86400000 || (times.length>0 && now-Math.max(...times)>86400000);
  const prefix=stale?'News is stale. ':'';
  const message=prefix+'Feed checked '+checked+'. '+(newest?'Latest source item: '+newest+'.':'No matching stories in the latest checked feed.')+(stale||!newest?' The dated archive remains available.':'');
  return {kind:stale?'stale':times.length?'fresh':'empty',message,generatedAt:checked,newestItemAt:newest};
 }
 function readStorage(key,fallback,valid){try{const raw=root.localStorage.getItem(key);if(raw===null)return fallback;const value=JSON.parse(raw);return valid(value)?value:fallback}catch{return fallback}}
 function saveStorage(key,value){try{root.localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
 root.KolsNewsState=Object.freeze({assessFeed,readStorage,saveStorage});
})(globalThis);
