export const GIF_MAX_BYTES=6*1024*1024;
export type GifSettings={start:number;duration:number;width:number;fps:number};
export function gifPlan(settings:GifSettings,source:{width:number;height:number;duration:number}){
 const {start,duration,width,fps}=settings;
 if(![start,duration,width,fps,source.width,source.height,source.duration].every(Number.isFinite)||source.width<=0||source.height<=0||source.duration<=0)throw new Error('Choose a video with a known duration and dimensions.');
 if(start<0||duration<1||duration>6||start+duration>source.duration+.001||![320,480,600].includes(width)||![5,10].includes(fps))throw new Error('Choose a 1–6 second segment inside the video.');
 const scale=Math.min(1,width/source.width,640/source.height);
 const outputWidth=Math.max(1,Math.round(source.width*scale)),outputHeight=Math.max(1,Math.round(source.height*scale));
 const frames=Math.ceil(duration*fps),delay=Math.round(duration*100/frames)*10;
 return {width:outputWidth,height:outputHeight,frames,delay,times:Array.from({length:frames},(_,i)=>start+i*duration/frames)};
}
