import {GIFEncoder,quantize,applyPalette} from 'gifenc/dist/gifenc.esm.js';
import {GIF_MAX_BYTES} from './gif-settings';
/** Bounded streaming encoder: only the current RGBA frame is retained. */
export function createGifEncoder(width:number,height:number,delay:number,maxBytes=GIF_MAX_BYTES){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>600||height>640||!Number.isFinite(delay)||delay<10||delay>1000)throw new Error('Invalid GIF frame settings.');
 const gif=GIFEncoder();let count=0,finished=false;
 function size(){if(gif.bytesView().length>maxBytes)throw new Error('This GIF is too large for email. Choose a shorter clip, smaller width or fewer frames per second.');}
 return {
  add(rgba:Uint8ClampedArray){
   if(finished||count>=60||rgba.length!==width*height*4)throw new Error('Invalid GIF frame.');
   const palette=quantize(rgba,256);gif.writeFrame(applyPalette(rgba,palette),width,height,{palette,delay,repeat:0,dispose:1});count++;size();
  },
  finish(){if(finished||!count)throw new Error('No GIF frames are available.');gif.finish();finished=true;size();return gif.bytes();}
 };
}
