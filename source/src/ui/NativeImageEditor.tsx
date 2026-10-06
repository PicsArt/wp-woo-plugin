import {MarketingExports} from './MarketingExports';
import {useEffect,useRef,useState} from 'react';
import {decodeRaster,exportImage,initialRecipe,renderImage,type ImageRecipe,type Corner} from './native-image-tools';
import './native-image-editor.css';

type Source={attachmentId:number;url:string;width:number;height:number;title?:string;caption?:string;alt?:string};
type Saved={attachmentId:number;url:string;sourceId:number};
type MediaFrame={on:(event:string,fn:()=>void)=>void;open:()=>void;state:()=>{get:(name:string)=>{first:()=>{toJSON:()=>{id:number}}}}};
async function localRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 const config=window.picsartStudio;
 const endpoint=config.wpEndpoint??new URL(config.endpoint,location.href).href.replace(/\/studio(?:\?.*)?$/,'');
 const url=new URL(endpoint.replace(/\/$/,'')+path,location.href);
 if(url.origin!==location.origin)throw new Error('WordPress media requests must stay on this site.');
 const response=await fetch(url,{...init,credentials:'same-origin',headers:{...init.headers,'X-WP-Nonce':config.nonce}});
 const data=await response.json();if(!response.ok)throw new Error(data.message??'WordPress could not complete this action.');return data;
}
export default function NativeImageEditor(){
 const [cloudProcessed,setCloudProcessed]=useState(false);
 const cloudIntent=useRef(crypto.randomUUID());
 const [logoId,setLogoId]=useState(0),[canManageBrand,setCanManageBrand]=useState(false);
 const original=useRef<ImageBitmap>();
 const [bakedMark,setBakedMark]=useState<ImageRecipe['mark']>('none');
 const [source,setSource]=useState<Source>();const [bitmap,setBitmap]=useState<ImageBitmap>();const [logo,setLogo]=useState<ImageBitmap>();
 const [recipe,setRecipe]=useState<ImageRecipe>();const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const [draftTitle,setDraftTitle]=useState('');const [draftUrl,setDraftUrl]=useState('');const draftIntent=useRef(crypto.randomUUID());
 const [saved,setSaved]=useState<Saved>();const [receipt,setReceipt]=useState<string>();const [compare,setCompare]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null);const intent=useRef(crypto.randomUUID());const loadSequence=useRef(0);
 const config=window.picsartStudio;
 useEffect(()=>{void localRequest<{canManage:boolean}>('/brand-defaults').then(p=>setCanManageBrand(p.canManage)).catch(()=>{});},[]);
 const home=new URL('admin.php?page=picsart-studio&_picsart_context='+encodeURIComponent(config.navigationNonce??''),location.href).href;
 useEffect(()=>()=>{if(bitmap!==original.current)bitmap?.close();},[bitmap]);
 useEffect(()=>()=>{original.current?.close();},[]);useEffect(()=>()=>{logo?.close();},[logo]);
 useEffect(()=>{if(config.attachmentId)void load(Number(config.attachmentId));},[]);
 useEffect(()=>{
  if(!canvas.current||!bitmap||!recipe)return;
  try{renderImage(canvas.current,compare?(original.current??bitmap):bitmap,compare?initialRecipe((original.current??bitmap).width,(original.current??bitmap).height):recipe,logo,true);setError('');}catch(e){setError(message(e));}
 },[bitmap,recipe,logo,compare]);
 function message(e:unknown){return e instanceof Error?e.message:'This action could not finish. Your original is unchanged.';}
 function update(patch:Partial<ImageRecipe>){cloudIntent.current=crypto.randomUUID();setRecipe(r=>r?{...r,...patch}:r);setSaved(undefined);setReceipt(undefined);intent.current=crypto.randomUUID();setNotice('');}
 async function load(id:number){
  const sequence=++loadSequence.current;setBusy(true);setError('');setNotice('');
  try{
   const next=await localRequest<Source>(`/media-source?attachmentId=${id}`);
   const bytes=await localRequest<{base64:string;mime:string}>(`/media-bytes?attachmentId=${id}`);
   const decoded=await decodeRaster(new Blob([Uint8Array.from(atob(bytes.base64),c=>c.charCodeAt(0))],{type:bytes.mime}));
   if(sequence!==loadSequence.current){decoded.close();return;}
   original.current?.close();original.current=decoded;setCloudProcessed(false);setBakedMark('none');cloudIntent.current=crypto.randomUUID();setDraftTitle(next.title||'Image story');setDraftUrl('');draftIntent.current=crypto.randomUUID();setBitmap(decoded);setSource(next);setRecipe(initialRecipe(decoded.width,decoded.height));setSaved(undefined);setReceipt(undefined);intent.current=crypto.randomUUID();
   const target=Number(config.termId??config.postId??config.productId);if(target){const list=await localRequest<{receiptId:string}[]>(`/image-restores?targetType=${config.target??'featured'}&targetId=${target}`);if(sequence===loadSequence.current)setReceipt(list[0]?.receiptId);}
  }catch(e){if(sequence===loadSequence.current)setError(message(e));}finally{if(sequence===loadSequence.current)setBusy(false);}
 }
 function pick(){
  const wp=(window as unknown as {wp?:{media?:(options:unknown)=>MediaFrame}}).wp;
  if(!wp?.media){setError('Open Media Library, choose an image, then select Edit with Picsart.');return;}
  const frame=wp.media({title:'Choose your original image',button:{text:'Edit this image'},library:{type:'image'},multiple:false});
  frame.on('select',()=>void load(frame.state().get('selection').first().toJSON().id));frame.open();
 }
 async function chooseLogo(file?:File){
  if(!file)return;setError('');try{setLogo(await decodeRaster(file));setLogoId(0);cloudIntent.current=crypto.randomUUID();setSaved(undefined);intent.current=crypto.randomUUID();}catch(e){setError(message(e));}
 }
 async function libraryLogo(id:number){const data=await localRequest<{base64:string;mime:string}>(`/media-bytes?attachmentId=${id}`);setLogo(await decodeRaster(new Blob([Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0))],{type:data.mime})));setLogoId(id);setSaved(undefined);intent.current=crypto.randomUUID();cloudIntent.current=crypto.randomUUID();}
 function pickLogo(){const wp=(window as unknown as {wp?:{media?:(options:unknown)=>MediaFrame}}).wp;if(!wp?.media)return;const frame=wp.media({title:'Choose a brand logo',button:{text:'Use logo'},library:{type:'image'},multiple:false});frame.on('select',()=>void libraryLogo(frame.state().get('selection').first().toJSON().id).catch(e=>setError(message(e))));frame.open();}
 async function brandDefaults(action:'load'|'save'|'migrate'){if(!recipe)return;setBusy(true);setError('');try{if(action==='save'&&logo&&!logoId)throw Error('Choose a Media Library logo to save reusable site defaults.');const {mark,text,opacity,size,corner,color,radius}=recipe;const response=await localRequest<{settings:Partial<ImageRecipe>&{logoId?:number}}>('/brand-defaults',action==='load'?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action==='migrate'?{migrateLegacy:true}:{logoId,mark,text,opacity,size,corner,color,radius})});if(action!=='save'){const {logoId:id,...settings}=response.settings;update(settings);if(id)await libraryLogo(id);else {setLogo(undefined);setLogoId(0);}}setNotice(action==='save'?'Saved reusable brand settings for this site.':action==='migrate'?'Imported only the legacy logo and corner radius. Old credentials were not copied.':'Loaded saved brand settings. Review the preview before saving.');}catch(e){setError(message(e));}finally{setBusy(false);}}
 async function output(save:boolean){
  if(!bitmap||!recipe||!source)return;setBusy(true);setError('');setNotice('');
  try{
   if(recipe.mark!=='none'&&!logo&&!recipe.text.trim())throw new Error('Choose a logo or enter text for your mark.');
   const blob=await exportImage(bitmap,recipe,logo),ext=blob.type.split('/')[1].replace('jpeg','jpg');
   if(!save){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`picsart-${source.attachmentId}-edited.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Downloaded a new image. Your WordPress original is unchanged.');return;}
   const data=new FormData();data.set('image',blob,`picsart-${source.attachmentId}-edited.${ext}`);data.set('sourceId',String(source.attachmentId));data.set('requestId',intent.current);const mark=recipe.mark!=='none'?recipe.mark:bakedMark;data.set('operation',mark==='none'?'edit':mark==='brand'?'brand-mark':'watermark');data.set('recipe',JSON.stringify(recipe));
   const result=await localRequest<Saved>('/image-save',{method:'POST',body:data});setSaved(result);setDraftUrl('');draftIntent.current=crypto.randomUUID();setNotice('Saved a new image in Media Library. The clean original is unchanged.');
  }catch(e){setError(message(e));}finally{setBusy(false);}
 }
 async function apply(){
  if(!saved||!source)return;const targetId=Number(config.termId??config.postId??config.productId),targetType=config.target??'featured';
  if(!targetId)return;setBusy(true);setError('');
  try{const result=await localRequest<{receiptId:string}>('/image-apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({attachmentId:saved.attachmentId,targetId,targetType,expectedPreviousId:source.attachmentId})});setReceipt(result.receiptId);setNotice('Applied the reviewed copy. You can restore the previous image while this destination is unchanged.');}catch(e){setError(message(e));}finally{setBusy(false);}
 }
 async function restore(){if(!receipt)return;setBusy(true);setError('');try{await localRequest('/image-restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({receiptId:receipt})});setReceipt(undefined);setNotice('Restored the previous image. Both copies remain in Media Library.');}catch(e){setError(message(e));}finally{setBusy(false);}}
 async function createDraft(){if(!saved)return;setBusy(true);setError('');try{const result=await localRequest<{postId:number;editUrl:string}>('/blog-draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({attachmentId:saved.attachmentId,title:draftTitle,content:'',requestId:draftIntent.current})});setDraftUrl(result.editUrl);setNotice('Created a private draft with this image. Nothing has been published.');}catch(e){setError(message(e));}finally{setBusy(false);}}
 const targetId=config.termId??config.postId??config.productId;
 const marked=bakedMark!=='none'||recipe?.mark!=='none';
 return <main className="native-image-editor">
  <header><div><a href={home}>← Picsart Commerce</a><h1>Edit an image</h1><p>Make a new copy. Keep your original.</p><a href={home+'&view=video-tools'}>Local video tools</a></div><span className="native-free">Local edits · 0 credits</span></header>
  <p className="native-privacy">These edits run in your browser. Local adjustments do not send your image to Picsart. Cloud tools below send the current preview only when you choose an operation. Saving uploads the edited copy to this WordPress site.</p>
  <button onClick={pick} disabled={busy}>Choose from Media Library</button>{receipt&&!saved&&<button disabled={busy} onClick={()=>void restore()}>Restore previously applied image</button>}
  {error&&<div role="alert" className="native-error">{error}</div>}{notice&&<div role="status" className="native-notice">{notice}</div>}
  {!recipe&&<section className="native-empty"><h2>A clean photo, ready for its next use</h2><p>Crop, resize, rotate, adjust, compress, or add your own mark. Choose a JPEG, PNG or WebP image to start.</p></section>}
  {recipe&&source&&<div className="native-editor-layout">
   <section className="native-preview" aria-label="Image preview"><div className="native-canvas"><canvas ref={canvas} aria-label={compare?'Original image':'Preview of your edited copy'}/></div><button aria-pressed={compare} onClick={()=>setCompare(v=>!v)}>{compare?'Show edited copy':'Compare with original'}</button><p>{source.title||`Image ${source.attachmentId}`} · output {recipe.width} × {recipe.height}px</p></section>
   <section className="native-controls" aria-label="Image settings"><fieldset disabled={busy}><legend>Size and crop</legend>
    <div className="native-grid">{(['width','height'] as const).map(key=><label key={key}>Output {key}<input type="number" min="1" max="8192" value={recipe[key]} onChange={e=>update({[key]:Number(e.target.value)})}/></label>)}</div>
    <details><summary>Crop area in original pixels</summary><div className="native-grid">{(['x','y','width','height'] as const).map(key=><label key={key}>Crop {key}<input type="number" min={key==='x'||key==='y'?0:1} value={recipe.crop[key]} onChange={e=>update({crop:{...recipe.crop,[key]:Number(e.target.value)}})}/></label>)}</div><button onClick={()=>update({width:recipe.crop.width,height:recipe.crop.height})}>Fit output to crop</button></details>
    <button onClick={()=>update({rotation:((recipe.rotation+90)%360) as ImageRecipe['rotation'],width:recipe.height,height:recipe.width})}>Rotate 90°</button>
   </fieldset><fieldset disabled={busy}><legend>Adjust</legend>{(['brightness','contrast','saturation'] as const).map(key=><label key={key}>{key[0].toUpperCase()+key.slice(1)} · {recipe[key]}%<input type="range" min="0" max="200" value={recipe[key]} onChange={e=>update({[key]:Number(e.target.value)})}/></label>)}</fieldset>
   <fieldset disabled={busy}><legend>Your mark</legend><button onClick={()=>void brandDefaults('load')}>Use saved brand settings</button>{canManageBrand&&<><button onClick={()=>void brandDefaults('save')}>Save site brand defaults</button><button onClick={()=>void brandDefaults('migrate')}>Import legacy logo settings</button></>}<label>Treatment<select value={recipe.mark} onChange={e=>{const mark=e.target.value as ImageRecipe['mark'];update({mark,opacity:mark==='protective'?.18:.7,size:mark==='protective'?.25:.06});}}><option value="none">No mark</option><option value="brand">Brand mark — a quiet corner logo</option><option value="protective">Protective watermark — discourage reuse</option></select></label>
    {recipe.mark!=='none'&&<><button onClick={pickLogo}>Choose logo from Media Library</button><label>Store name or custom text<input maxLength={120} value={recipe.text} onChange={e=>{setLogo(undefined);setLogoId(0);update({text:e.target.value});}}/></label><label>Or choose a logo from your device<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void chooseLogo(e.target.files?.[0])}/></label>{logo&&<label>Logo corner radius<input type="number" min="0" max="100" value={recipe.radius??0} onChange={e=>update({radius:Number(e.target.value)})}/></label>}{logo&&<button onClick={()=>{setLogo(undefined);setLogoId(0);cloudIntent.current=crypto.randomUUID();setSaved(undefined);intent.current=crypto.randomUUID();}}>Remove logo</button>}
    <label>Opacity · {Math.round(recipe.opacity*100)}%<input type="range" min="1" max="100" value={recipe.opacity*100} onChange={e=>update({opacity:Number(e.target.value)/100})}/></label>
    <label>Size · {Math.round(recipe.size*100)}% of width<input type="range" min="1" max="50" value={recipe.size*100} onChange={e=>update({size:Number(e.target.value)/100})}/></label>
    {!logo&&<label>Text color<input type="color" value={recipe.color} onChange={e=>update({color:e.target.value})}/></label>}
    {recipe.mark==='brand'&&<label>Corner<select value={recipe.corner} onChange={e=>update({corner:e.target.value as Corner})}>{(['bottom-right','bottom-left','top-right','top-left'] as const).map(c=><option key={c} value={c}>{c.replace('-',' ')}</option>)}</select></label>}
    {recipe.mark==='protective'&&recipe.opacity<=.08&&<p>At this opacity the mark may be difficult to see. It cannot guarantee protection against reuse.</p>}
    <p>Keep a clean copy for product feeds. This tool does not control what other feed plugins publish.</p></>}
   </fieldset><fieldset disabled={busy}><legend>Export</legend><label>Format<select value={recipe.format} onChange={e=>update({format:e.target.value as ImageRecipe['format']})}><option value="image/png">PNG — preserves transparency</option><option value="image/jpeg">JPEG — white background</option><option value="image/webp">WebP — preserves transparency</option></select></label>{recipe.format!=='image/png'&&<label>Quality · {Math.round(recipe.quality*100)}%<input type="range" min="10" max="100" value={recipe.quality*100} onChange={e=>update({quality:Number(e.target.value)/100})}/></label>}<p>Export may remove embedded color-profile, camera and provenance metadata. Keep the original for archival or metadata-dependent publishing.</p></fieldset>
   <div className="native-actions"><button className="native-primary" disabled={busy} onClick={()=>void output(true)}>{busy?'Working…':'Save as a new image'}</button><button disabled={busy} onClick={()=>void output(false)}>Download copy</button><button disabled={busy} onClick={()=>{if(bitmap)update(initialRecipe(bitmap.width,bitmap.height));setLogo(undefined);}}>Reset edits</button></div>
   {saved&&<div className="native-saved"><MarketingExports attachmentId={saved.attachmentId} image={saved.url} title={source.title}/><a href={new URL(`upload.php?item=${saved.attachmentId}`,location.href).href}>Open saved copy in Media Library</a>{targetId&&!marked&&!receipt&&<><p>Review the preview before replacing the selected {config.target??'featured'} image.</p><button disabled={busy} onClick={()=>void apply()}>Apply reviewed copy</button></>}{targetId&&marked&&<p>Marked copies are saved separately. The original product or listing image has not been replaced.</p>}{receipt&&<button disabled={busy} onClick={()=>void restore()}>Restore previous image</button>}<details><summary>Start a blog draft with this image</summary><label>Draft title<input value={draftTitle} onChange={e=>{setDraftTitle(e.target.value);setDraftUrl('');draftIntent.current=crypto.randomUUID();}}/></label><p>The image is embedded in the draft and becomes its featured image. Write and review your post in WordPress before publishing.</p>{draftUrl?<a href={draftUrl}>Open WordPress draft</a>:<button disabled={busy||!draftTitle.trim()} onClick={()=>void createDraft()}>Create draft</button>}</details></div>}
   </section>
  </div>}
 </main>;
}
