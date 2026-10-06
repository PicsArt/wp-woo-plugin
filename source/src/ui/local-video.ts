export const LOCAL_VIDEO_MAX_BYTES=100*1024*1024;
export function validateLocalVideoFile(file:{type:string;size:number}){
 if(!['video/mp4','video/webm'].includes(file.type)||!Number.isFinite(file.size)||file.size<=0||file.size>LOCAL_VIDEO_MAX_BYTES)throw new Error('Choose an MP4 or WebM video up to 100 MB.');
}
export function validateLocalVideoMetadata(duration:number,width:number,height:number){
 if(![duration,width,height].every(Number.isFinite)||duration<=0||duration>120||width<=0||height<=0||width*height>1920*1080)throw new Error('Choose a video up to two minutes and Full HD (landscape or portrait).');
}
