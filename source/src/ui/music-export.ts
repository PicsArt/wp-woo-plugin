export function musicWindow(start:number,trackDuration:number,videoDuration:number,volume:number){
 if(![start,trackDuration,videoDuration,volume].every(Number.isFinite)||start<0||trackDuration<=start||videoDuration<=0||volume<0||volume>1)throw new Error('Choose a valid music start time and volume.');
 return {start,length:Math.min(trackDuration-start,videoDuration),volume};
}
/** Local, real-time mechanical export; no paid generation or store writes. */
export async function exportMusic(url:string,file:File,start:number,volume:number,signal:AbortSignal,onProgress:(n:number)=>void){
 const ctx=new AudioContext();let video:HTMLVideoElement|undefined,recorder:MediaRecorder|undefined,stream:MediaStream|undefined;let frame=0;
 try{
  await ctx.resume();
  const audio=await ctx.decodeAudioData(await file.arrayBuffer());
  video=document.createElement('video');video.crossOrigin='anonymous';video.playsInline=true;video.muted=true;video.preload='auto';
  const loaded=new Promise<void>((resolve,reject)=>{video!.onloadeddata=()=>resolve();video!.onerror=()=>reject(new Error('Could not load this video for music export. Download it and continue in your editor.'));});
  video.src=url;
  await Promise.race([loaded,new Promise<never>((_,reject)=>{const t=setTimeout(()=>reject(new Error('Video loading timed out. Try again.')),30000);loaded.finally(()=>clearTimeout(t)).catch(()=>{});})]);
  if(signal.aborted)throw new Error('Export cancelled.');
  if(!Number.isFinite(video.duration)||video.duration>120||video.videoWidth*video.videoHeight>1920*1080)throw new Error('Local music export supports videos up to Full HD and two minutes. Use an editor for this video.');
  const settings=musicWindow(start,audio.duration,video.duration,volume);
  const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const draw=canvas.getContext('2d')!;
  draw.drawImage(video,0,0);stream=canvas.captureStream(30);
  const destination=ctx.createMediaStreamDestination(),gain=ctx.createGain(),track=ctx.createBufferSource();track.buffer=audio;gain.gain.value=volume;
  track.connect(gain).connect(destination);destination.stream.getAudioTracks().forEach(t=>stream!.addTrack(t));
  const mime=['video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime)throw new Error('This browser cannot export a music version. Try a current desktop browser.');
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});const chunks:Blob[]=[];
  let failure='';
  const done=new Promise<Blob>((resolve,reject)=>{recorder!.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder!.onerror=()=>reject(new Error('Music export failed.'));recorder!.onstop=()=>signal.aborted||failure?reject(new Error(failure||'Export cancelled.')):resolve(new Blob(chunks,{type:mime}));});
  const stop=()=>{video!.pause();try{track.stop();}catch{}if(recorder?.state==='recording')recorder.stop();};
  signal.addEventListener('abort',stop,{once:true});
  try{
   await video.play();recorder.start(200);track.start(0,settings.start,settings.length);
   const paint=()=>{if(signal.aborted)return;draw.drawImage(video!,0,0);onProgress(video!.currentTime/video!.duration);frame=requestAnimationFrame(paint);};paint();video.onended=stop;
   const hidden=()=>{if(document.hidden){failure='Export paused because this tab was hidden. Keep it visible and try again.';stop();}};document.addEventListener('visibilitychange',hidden);
   const timeout=setTimeout(()=>{failure='Export timed out. Please try again.';stop();},(video.duration+10)*1000);
   try{return await done;}finally{clearTimeout(timeout);document.removeEventListener('visibilitychange',hidden);}
  }finally{signal.removeEventListener('abort',stop);}
 }finally{cancelAnimationFrame(frame);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());video?.pause();if(video){video.removeAttribute('src');video.load();}await ctx.close();}
}
