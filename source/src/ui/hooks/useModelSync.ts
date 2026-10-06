import {useCallback,useEffect,useRef,useState} from 'react';
import {catalogSyncDue,MODEL_CATALOG_REVISION,type ModelSyncReply} from '../../../shared/model-sync';
type Request=<T>(path:string,body?:unknown)=>Promise<T>;
export function useModelSync(subject:string|undefined,request:Request){
 const [reply,setReply]=useState<ModelSyncReply & {subject?:string}>({});
 const [syncing,setSyncing]=useState(false);
 const [error,setError]=useState('');
 const account=useRef(subject);account.current=subject;
 const inFlight=useRef<string>();
 const sync=useCallback(async(force=false)=>{
  if(!subject||inFlight.current===subject)return;
  inFlight.current=subject;setSyncing(true);setError('');
  try{const [catalogReply,defaults]=await Promise.all([request<ModelSyncReply>('/model-catalog'),request<ModelSyncReply>('/model-sync',{subject})]);const next={...catalogReply,defaultModel:defaults.defaultModel};if(account.current===subject){setReply({...next,catalog:next.catalog?.revision===MODEL_CATALOG_REVISION?next.catalog:undefined,subject});setError(next.error?'Using your saved model options. Updates will retry automatically.':'');}}
  catch{if(account.current===subject)setError('Using your saved model options. Updates will retry automatically.');}
  finally{if(inFlight.current===subject)inFlight.current=undefined;if(account.current===subject)setSyncing(false);}
 },[subject,request]);
 useEffect(()=>{setReply({});setError('');setSyncing(false);void sync();},[sync]);
 useEffect(()=>{
  if(!subject)return;
  const check=()=>{if(catalogSyncDue(reply.catalog,Date.now()))void sync();};
  const timer=setInterval(check,60_000);
  const visible=()=>{if(document.visibilityState==='visible')check();};
  document.addEventListener('visibilitychange',visible);
  window.addEventListener('online',check);
  window.addEventListener('focus',check);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',check);window.removeEventListener('focus',check);};
 },[subject,reply.catalog,sync]);
 async function saveDefault(model:string|null){
  const owner=subject;
  try{const saved=await request<{defaultModel?:string}>('/model-default',{model,subject:owner});if(account.current===owner)setReply(r=>({...r,defaultModel:saved.defaultModel}));}
  catch{if(account.current===owner)setError('Could not save your default. Try again.');throw new Error('Default not saved');}
 }
 return {...(reply.subject===subject?reply:{}),syncing,error,sync,saveDefault};
}
