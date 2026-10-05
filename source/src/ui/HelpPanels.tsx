import {useState,type ReactNode} from 'react';
const ids=['help','privacy','notifications','updates'];
export function HelpPanels({children}:{children:ReactNode[]}){
 const key=`picsart-hidden-help-v1:${window.picsartStudio.wpEndpoint}:${window.picsartStudio.userId}`;
 const [hidden,setHidden]=useState<string[]>(()=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(id=>ids.includes(id)):[];}catch{return [];}});
 const [error,setError]=useState('');
 function save(next:string[]){setHidden(next);try{localStorage.setItem(key,JSON.stringify(next));setError('');}catch{setError('Your choice applies now, but this browser could not save it for your next visit.');}}
 const labels=['Help and support','Cloud privacy','Notification preferences','Workspace updates'];
 return <section aria-label="Workspace help">
  {hidden.length>0&&<div className="picsart-help-restore"><button type="button" title="Restore all hints, tips and help" aria-label="Restore all hints, tips and help" onClick={()=>save([])}><span aria-hidden="true">↺</span><span>Show all help</span></button></div>}
  {ids.map((id,index)=>hidden.includes(id)?null:<div className="picsart-dismissible-help" key={id}><div>{children[index]}</div><button type="button" className="picsart-hide-help" aria-label={`Hide ${labels[index]}`} title={`Hide ${labels[index]}`} onClick={()=>save([...hidden,id])}>×</button></div>)}
  {error&&<p role="status">{error}</p>}
 </section>;
}
