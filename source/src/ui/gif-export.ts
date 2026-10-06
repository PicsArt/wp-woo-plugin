import {gifPlan,type GifSettings} from './gif-settings';
function aborted(signal:AbortSignal){if(signal.aborted)throw new DOMException('Export cancelled.','AbortError');}
function videoEvent(video:HTMLVideoElement,event:string,signal:AbortSignal,trigger:()=>void){
 return new Promise<void>((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',fail);signal.removeEventListener('abort',cancel);};
  const ok=()=>{cleanup();resolve();};
  const fail=()=>{cleanup();reject(new Error('This video could not be loaded for export. Download it and choose the local file below.'));};
  const cancel=()=>{cleanup();reject(new DOMException('Export cancelled.','AbortError'));};
  const timer=setTimeout(()=>{cleanup();reject(new Error('Video loading timed out. Try again or choose a local video.'));},20000);
  video.addEventListener(event,ok,{once:true});video.addEventListener('error',fail,{once:true});signal.addEventListener('abort',cancel,{once:true});
  if(signal.aborted){cancel();return;}try{trigger();}catch(e){cleanup();reject(e);}
 });
}
/** Mechanical conversion in the customer's browser; no generation, upload or credits. */
export async function exportGif(url:string,settings:GifSettings,signal:AbortSignal,onProgress:(value:number)=>void){
 const video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.playsInline=true;video.preload='auto';
 let worker:Worker|undefined;
 try{
  await videoEvent(video,'loadeddata',signal,()=>{video.src=url;video.load();});aborted(signal);
  const plan=gifPlan(settings,{width:video.videoWidth,height:video.videoHeight,duration:video.duration});
  const canvas=document.createElement('canvas');canvas.width=plan.width;canvas.height=plan.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('This browser cannot prepare GIF frames.');
  worker=new Worker(new URL('gif-encoder.worker.js',window.picsartStudio.assetsUrl ?? window.location.href),{type:'module'});
  const send=(data:object,transfer:Transferable[]=[])=>new Promise<any>((resolve,reject)=>{
   const cleanup=()=>{clearTimeout(timer);worker!.onmessage=null;worker!.onerror=null;signal.removeEventListener('abort',cancel);};
   const cancel=()=>{cleanup();reject(new DOMException('Export cancelled.','AbortError'));};
   const timer=setTimeout(()=>{cleanup();reject(new Error('GIF encoding timed out. Choose a smaller width.'));},20000);
   worker!.onmessage=e=>{cleanup();e.data.error?reject(new Error(e.data.error)):resolve(e.data);};
   worker!.onerror=()=>{cleanup();reject(new Error('GIF encoding could not start in this browser.'));};
   signal.addEventListener('abort',cancel,{once:true});if(signal.aborted){cancel();return;}worker!.postMessage(data,transfer);
  });
  await send({type:'start',width:plan.width,height:plan.height,delay:plan.delay});
  let poster:Blob|undefined;
  for(let i=0;i<plan.times.length;i++){
   aborted(signal);
   if(Math.abs(video.currentTime-plan.times[i])>.00001)await videoEvent(video,'seeked',signal,()=>{video.currentTime=plan.times[i];});
   ctx.drawImage(video,0,0,plan.width,plan.height);
   let pixels:ImageData;try{pixels=ctx.getImageData(0,0,plan.width,plan.height);}catch{throw new Error('The video host does not allow GIF conversion here. Download the video, then choose the local file below.');}
   if(i===0)poster=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not create the first-frame image.')),'image/png'));
   await send({type:'frame',rgba:pixels.data.buffer},[pixels.data.buffer]);onProgress((i+1)/plan.frames);
  }
  const {bytes}=await send({type:'finish'});aborted(signal);
  return {gif:new Blob([bytes],{type:'image/gif'}),poster:poster!,width:plan.width,height:plan.height};
 }finally{worker?.terminate();video.pause();video.removeAttribute('src');video.load();}
}
