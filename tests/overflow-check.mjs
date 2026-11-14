// Runs in the page realm. Root overflow must never conceal a layout failure.
export function findHorizontalOverflow() {
 const viewport=innerWidth,tolerance=1,issues=[];
 for(const element of document.querySelectorAll('body *')) {
  const rect=element.getBoundingClientRect();
  if(!rect.width||!rect.height||!element.getClientRects().length)continue;
  let invisible=false,clipped=false;
  for(let ancestor=element;ancestor;ancestor=ancestor.parentElement) {
   const style=getComputedStyle(ancestor);
   if(style.visibility==='hidden'||style.visibility==='collapse'||style.display==='none'||Number(style.opacity)===0){invisible=true;break;}
   if(ancestor===element||ancestor===document.body||ancestor===document.documentElement)continue;
   const bounds=ancestor.getBoundingClientRect();
   if(['hidden','clip','auto','scroll'].includes(style.overflowX)&&bounds.width>0&&bounds.left>=-tolerance&&bounds.right<=viewport+tolerance)clipped=true;
  }
  if(!invisible&&!clipped&&(rect.left < -tolerance||rect.right > viewport+tolerance))issues.push({tag:element.tagName,id:element.id,classes:element.getAttribute('class'),left:rect.left,right:rect.right,width:rect.width});
 }
 return issues;
}
