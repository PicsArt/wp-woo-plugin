import {useEffect,useRef,useState} from 'react';
import {exportGif} from './gif-export';
import type {GifSettings} from './gif-settings';
import './email-gif.css';
type Output={gifUrl:string;posterUrl:string;bytes:number;width:number;height:number};
export function EmailGifEditor({url,name='Picsart-video',onDownload}:{url:string;name?:string;onDownload?:()=>void}){
 const [local,setLocal]=useState<File>();
 const [localUrl,setLocalUrl]=useState('');
 const source=localUrl||url;
 const [duration,setDuration]=useState(0);
 const [settings,setSettings]=useState<GifSettings>({start:0,duration:3,width:480,fps:10});
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState('');
 const [output,setOutput]=useState<Output>();
 const controller=useRef<AbortController>();const preview=useRef<HTMLVideoElement>(null);
 useEffect(()=>{if(!local){setLocalUrl('');return;}const value=URL.createObjectURL(local);setLocalUrl(value);return()=>URL.revokeObjectURL(value);},[local]);
 useEffect(()=>{setDuration(0);setOutput(undefined);setError('');return()=>controller.current?.abort();},[source]);
 useEffect(()=>()=>{if(output){URL.revokeObjectURL(output.gifUrl);URL.revokeObjectURL(output.posterUrl);}},[output]);
 function change(next:Partial<GifSettings>){setSettings(value=>({...value,...next}));setOutput(undefined);setError('');if(next.start!==undefined&&preview.current)preview.current.currentTime=next.start;}
 const valid=duration>=1&&settings.start>=0&&settings.duration>=1&&settings.start+settings.duration<=duration+.001;
 async function create(){
  if(busy||!valid)return;
  const c=new AbortController();controller.current=c;setBusy(true);setProgress(0);setError('');setOutput(undefined);
  try{const result=await exportGif(source,settings,c.signal,setProgress);if(!c.signal.aborted)setOutput({gifUrl:URL.createObjectURL(result.gif),posterUrl:URL.createObjectURL(result.poster),bytes:result.gif.size,width:result.width,height:result.height});}
  catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'GIF export failed.');}
  finally{if(controller.current===c)setBusy(false);}
 }
 const filename=name.replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80)||'Picsart-video';
 return <section className="email-gif" aria-label="Create an Email GIF">
  <h3>Create an Email GIF</h3>
  <p>Turn a short part of your video into a silent, looping preview. No generation credits are used.</p>
  <video ref={preview} controls muted playsInline preload="metadata" src={source} aria-label="Choose the GIF first frame" onLoadedMetadata={e=>{const d=e.currentTarget.duration;setDuration(Number.isFinite(d)?d:0);setSettings(s=>({...s,start:0,duration:Math.min(3,Math.floor(d*10)/10)}));}} onError={()=>setError('Could not load the video. You can choose a downloaded copy below.')}/>
  <p>Choose a first frame that works on its own—some email clients show a static image.</p>
  <fieldset disabled={busy}><legend>GIF Settings</legend><div className="email-gif-fields">
   <label>Start (seconds)<input type="number" min={0} max={Math.max(0,duration-settings.duration)} step={.1} value={settings.start} onChange={e=>change({start:Number(e.target.value)})}/></label>
   <label>Length (seconds)<input type="number" min={1} max={Math.min(6,Math.max(1,duration-settings.start))} step={.1} value={settings.duration} onChange={e=>change({duration:Number(e.target.value)})}/></label>
   <label>Maximum Width<select value={settings.width} onChange={e=>change({width:Number(e.target.value)})}><option value={320}>320 px · Smaller File</option><option value={480}>480 px · Recommended</option><option value={600}>600 px · More Detail</option></select></label>
   <label>Frame Rate<select value={settings.fps} onChange={e=>change({fps:Number(e.target.value)})}><option value={5}>5 fps · Smaller File</option><option value={10}>10 fps · Smoother Motion</option></select></label>
  </div></fieldset>
  <details><summary>Use a Downloaded Video</summary><p>If the video host blocks conversion, download your video and choose that file. It stays in your browser.</p><input type="file" accept="video/mp4,video/webm" disabled={busy} aria-label="Local video for GIF export" onChange={e=>{const file=e.target.files?.[0];if(file&&(!file.type.startsWith('video/')||file.size>100*1024*1024)){setError('Choose a video file up to 100 MB.');return;}setLocal(file);}}/></details>
  <div className="email-gif-actions"><button disabled={busy||!valid} onClick={()=>void create()}>{busy?'Creating GIF…':'Create GIF'}</button>{busy&&<button onClick={()=>controller.current?.abort()}>Cancel</button>}</div>
  {busy&&<progress aria-label="GIF export progress" max={1} value={progress}/>}
  {!valid&&duration>0&&<p>Choose a segment of at least one second inside the video.</p>}
  {error&&<p role="alert">{error}</p>}
  {output&&<div className="email-gif-output"><img src={output.gifUrl} alt="Animated email preview"/><p>{output.width} × {output.height} · {(output.bytes/1024/1024).toFixed(2)} MB</p>{output.bytes>2*1024*1024&&<p>A smaller width, shorter segment or lower frame rate will help this email load faster.</p>}<div className="email-gif-actions"><a href={output.gifUrl} onClick={onDownload} download={`${filename}.gif`}>Download GIF</a><a href={output.posterUrl} download={`${filename}-first-frame.png`}>Download First Frame</a></div><h4>Add It to Your Email</h4><ol><li>In the email editor, choose Add Image.</li><li>Upload the GIF and add it to your campaign.</li><li>Add alt text and a link to your product or full video.</li><li>Preview and send yourself a test before sending the campaign.</li></ol><p>The GIF has no sound. Playback depends on the recipient’s email client and settings.</p></div>}
 </section>;
}
