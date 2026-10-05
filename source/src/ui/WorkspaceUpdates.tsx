import {historyLink} from './platform';
import {useEffect,useState,useRef} from 'react';
import type {Job,State} from '../../shared/types';
import {notificationAllowed,type NotificationCategory} from '../../shared/notification-preferences';
export interface WorkspaceUpdate {id:string;jobId?:string;category:NotificationCategory;text:string}
export function workspaceUpdates(state:State):WorkspaceUpdate[]{
 const items:WorkspaceUpdate[]=[];
 if(state.auth.requiresReconnect||state.auth.requiresSessionReset)items.push({id:'connection',category:'setup',text:'Reconnect Picsart to refresh your permissions. Your saved work is still available.'});
 const status=(j:Job):WorkspaceUpdate|undefined=>{
  const name=j.quote.source?.productName??j.quote.source?.name??'Generated image';
  const base={id:`${j.id}:${j.status}`,jobId:j.id};
  if(['QUEUED','SUBMITTING','GENERATING','PERSISTING'].includes(j.status))return {...base,category:'started',text:`${name}: generation is in progress. You can return here to review its status.`};
  if(j.status==='REVIEW')return {...base,category:'ready',text:`${name}: your ${j.quote.kind==='image'?'image':'video'} is ready to review.`};
  if(['IMPORTING','ATTACHING'].includes(j.status))return {...base,category:'delayed',text:`${name}: WordPress is preparing your media. The result is not ready to use yet.`};
  if(j.status==='ATTACHED')return {...base,category:'exports',text:`${name}: video added to the product.`};
  if(j.status==='SAVED')return {...base,category:'exports',text:`${name}: copied to the WordPress Media Library.`};
  if(['STOPPED','UNKNOWN_SUBMISSION','IMPORT_UNKNOWN','ORPHANED_SPEND','RECONCILIATION_REQUIRED'].includes(j.status))return {...base,category:'attention',text:`${name}: an operation needs checking. Open its history card before retrying.`};
 };
 for(const job of state.jobs.filter(j=>!j.archivedAt).slice().sort((a,b)=>b.approvedAt-a.approvedAt)){const item=status(job);if(item)items.push(item);}
 return items.filter(item=>notificationAllowed(state.notificationPreferences,item.category));
}
export function WorkspaceUpdates({state,onOpen}:{state:State;onOpen?:(id:string)=>void}){
 const key=`picsart-updates:${state.auth.subject??'disconnected'}`;
 const [dismissed,setDismissed]=useState<string[]>([]);
 const opened=useRef('');
 useEffect(()=>{const match=location.hash.match(/^#job-([a-zA-Z0-9-]+)$/);const marker=key+location.hash;if(match&&opened.current!==marker&&state.jobs.some(job=>job.id===match[1])){opened.current=marker;onOpen?.(match[1]!);}},[key,state.jobs]);
 useEffect(()=>{try{const data=JSON.parse(sessionStorage.getItem(key)??'[]');setDismissed(Array.isArray(data)?data.filter((v):v is string=>typeof v==='string'):[]);}catch{setDismissed([]);}},[key]);
 const updates=workspaceUpdates(state).filter(item=>!dismissed.includes(item.id)).slice(0,5);
 if(!updates.length)return null;
 return <section className="review-notice" aria-label="Workspace updates"><h2>Workspace updates</h2><p>Preferences control these notices. Status and errors remain visible in each history card.</p><ul>{updates.map(item=><li key={item.id}><span role="status">{item.text}</span>{item.id!=='connection'&&<> <a href={item.jobId?historyLink(item.jobId):'admin.php?page=picsart-history'} onClick={event=>{if(item.jobId&&window.picsartStudio.workspaceView==='history'&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();onOpen?.(item.jobId);}}}>Open result</a></>} <button aria-label={`Dismiss update: ${item.text}`} onClick={()=>{const next=[...dismissed,item.id].slice(-100);setDismissed(next);try{sessionStorage.setItem(key,JSON.stringify(next));}catch{}}}>Dismiss</button></li>)}</ul></section>;
}
