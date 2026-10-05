import {useEffect,useRef,useState} from 'react';
import {exportMusic} from './music-export';
export function MusicEditor({url}:{url:string}){
 const [file,setFile]=useState<File>();const [audioUrl,setAudioUrl]=useState('');const [duration,setDuration]=useState(0);const [start,setStart]=useState(0);const [volume,setVolume]=useState(.5);const [rights,setRights]=useState(false);const [busy,setBusy]=useState(false);const [progress,setProgress]=useState(0);const [error,setError]=useState('');const [output,setOutput]=useState('');const [extension,setExtension]=useState('');const controller=useRef<AbortController>();
 useEffect(()=>()=>controller.current?.abort(),[url]);
 useEffect(()=>{if(!file){setAudioUrl('');return;}const u=URL.createObjectURL(file);setAudioUrl(u);return()=>URL.revokeObjectURL(u);},[file]);
 useEffect(()=>()=>{if(output)URL.revokeObjectURL(output);},[output]);
 useEffect(()=>{setOutput('');},[file,start,volume,url]);
 return <details className="review-notice"><summary>Add music for social</summary><p>Create a separate version with your music. Your listing video stays unchanged. No generation credits are used.</p>
 <label>Upload music (MP3, WAV or M4A, up to 20 MB)<input type="file" accept="audio/*" disabled={busy} onChange={e=>{const f=e.target.files?.[0];setError('');setDuration(0);setStart(0);setRights(false);if(f&&(!f.type.startsWith('audio/')||f.size>20*1024*1024)){setError('Choose an audio file up to 20 MB.');setFile(undefined);}else setFile(f);}}/></label>
 {audioUrl&&<><audio controls src={audioUrl} onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onError={()=>{setDuration(0);setError('This audio format could not be read. Try MP3 or WAV.');}}/>
 <label>Start music at (seconds)<input type="number" min={0} max={Math.max(0,duration-.1)} step={.1} value={start} disabled={busy} onChange={e=>setStart(Number(e.target.value))}/></label>
 <label>Music volume {Math.round(volume*100)}%<input type="range" min={0} max={1} step={.05} value={volume} disabled={busy} onChange={e=>setVolume(Number(e.target.value))}/></label><p>Music replaces any original sound, ends with the video, and does not repeat if the track is shorter.</p>
 <label><input type="checkbox" checked={rights} disabled={busy} onChange={e=>setRights(e.target.checked)}/>I have permission to use this music for my intended posts or ads.</label></>}
 <button disabled={busy||!file||!rights||!duration||start<0||start>=duration} onClick={async()=>{if(!file||busy)return;const c=new AbortController();controller.current=c;setBusy(true);setError('');setOutput('');try{const blob=await exportMusic(url,file,start,volume,c.signal,setProgress);if(!c.signal.aborted){setOutput(URL.createObjectURL(blob));setExtension(blob.type.includes('mp4')?'mp4':'webm');}}catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'Export failed.');}finally{if(controller.current===c)setBusy(false);}}}>{busy?'Preparing music version…':'Create music version'}</button>
 {busy&&<><progress max={1} value={progress}/><button onClick={()=>controller.current?.abort()}>Cancel</button><p>Keep this tab visible until the export finishes.</p></>}
 {error&&<p role="alert">{error}</p>}
 {output&&<><video controls src={output}/><p>Review before sharing. Export format: {extension.toUpperCase()}. Browser exports may need conversion for your destination.</p><a href={output} download={`social-video.${extension}`}>Download music version</a></>}

 </details>;
}
