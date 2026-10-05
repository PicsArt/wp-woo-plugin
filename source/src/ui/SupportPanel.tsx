import {useEffect,useRef,useState} from 'react';
import './support.css';
type ChatAPI={on:(event:string,callback:()=>void)=>void;off:(event:string,callback:()=>void)=>void;widget:{status:()=>{loaded:boolean};load:(options?:{widgetOpen:boolean})=>void;open:()=>void;close:()=>void;remove:()=>void};clear:()=>void};
declare global {interface Window {_hsq?:unknown[][];HubSpotConversations?:ChatAPI;hsConversationsSettings?:Record<string,unknown>;hsConversationsOnReady?:Array<()=>void>;}}
// Same Picsart support portal as the Wix integration. Loaded only after a chat click.
const portal='20853530';
let loading:Promise<void>|undefined;
async function showChat(api:ChatAPI){
 if(api.widget.status().loaded){api.widget.open();return;}
 await new Promise<void>((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);api.off('widgetLoaded',ready);};
  const ready=()=>{cleanup();api.widget.open();resolve();};
  const timer=setTimeout(()=>{cleanup();reject(new Error('Live chat is not available here right now. Email plugins@picsart.com or open Picsart Support below.'));},15000);
  api.on('widgetLoaded',ready);
  try{api.widget.load({widgetOpen:true});}catch(error){cleanup();reject(error);}
 });
}

async function openChat(){
 if(!portal||!/^\d+$/.test(portal))throw new Error('Live chat is not connected yet. You can email support below.');
 if(window.HubSpotConversations){await showChat(window.HubSpotConversations);return;}
 if(!loading)loading=new Promise<void>((resolve,reject)=>{
  window._hsq=window._hsq||[];window._hsq.push(["doNotTrack"]);
  window.hsConversationsSettings={inlineEmbedSelector:"#commerce-support-chat",loadImmediately:false,enableWidgetCookieBanner:true,disableAttachment:true,disableInitialInputFocus:true};
  const timer=setTimeout(()=>{reject(new Error('Chat could not load. Please try again or email support.'));},15000);
  const ready=()=>{clearTimeout(timer);resolve();};
  window.hsConversationsOnReady=[...(window.hsConversationsOnReady??[]),ready];
  const existing=document.getElementById('commerce-hubspot');
  if(!existing){const script=document.createElement('script');script.id='commerce-hubspot';script.async=true;script.src=`https://js.hs-scripts.com/${portal}.js`;script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Chat is unavailable. Please email support.'));};document.head.append(script);}
 }).catch(e=>{loading=undefined;throw e;});
 await loading;const api=window.HubSpotConversations as ChatAPI|undefined;if(!api)throw new Error("Chat could not initialize. Email support below.");await showChat(api);
}
export function SupportPanel({account,problem=false,preview=false}:{account?:string;problem?:boolean;preview?:boolean}){
 const [open,setOpen]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);const prior=useRef(account);
 useEffect(()=>{if(prior.current!==account){window.HubSpotConversations?.widget.remove();window.HubSpotConversations?.clear();setOpen(false);prior.current=account;}},[account]);
 useEffect(()=>{if(open){dialog.current?.showModal();}else dialog.current?.close();},[open]);
 const close=()=>{setOpen(false);window.HubSpotConversations?.widget.close();};
 return <><button type="button" className="commerce-help-launcher" onClick={()=>setOpen(true)}>Picsart Support</button>
 <dialog ref={dialog} className="commerce-support" aria-labelledby="commerce-support-title" onCancel={close} onClose={()=>setOpen(false)}>
 <div className="commerce-support-heading"><h2 id="commerce-support-title">Picsart Commerce Support</h2><button onClick={close} aria-label="Close help">×</button></div>
 <p>Get help from Picsart with this app. Your work stays here.</p>

 <p className="commerce-support-disclosure">Live chat uses HubSpot, Picsart’s support provider. Opening chat connects to HubSpot. We don’t automatically send your photos, prompts or account details.</p>
 <div className="commerce-support-actions"><button disabled={busy||(!account&&!preview)} onClick={async()=>{if(preview){setStatus('Preview: the HubSpot conversation opens here. No message was sent.');return;}setBusy(true);setStatus('');try{await openChat();}catch(e){setStatus(e instanceof Error?e.message:'Chat unavailable');}finally{setBusy(false);}}}>{busy?'Opening chat…':'Chat with Picsart'}</button>
 <a href="mailto:plugins@picsart.com?subject=Picsart%20Commerce%20Support">Email Support</a></div>
 {!account&&!preview&&<p>Connect your Picsart account to use live chat. You can email support at any time.</p>}
 {status&&<p role="status">{status}</p>}
 <div id="commerce-support-chat"/>


 <p><a href="https://support.picsart.com/hc/en-us/requests/new" target="_blank" rel="noopener noreferrer">Submit a support request (new tab)</a></p>
 <p><a href="https://support.picsart.com" target="_blank" rel="noopener noreferrer">Picsart Support Center (new tab)</a></p>
 </dialog></>;
}
