import {createGifEncoder} from './gif-codec';
let encoder:ReturnType<typeof createGifEncoder>|undefined;
self.onmessage=(event:MessageEvent)=>{
 try{
  const data=event.data;
  if(data.type==='start')encoder=createGifEncoder(data.width,data.height,data.delay);
  else if(data.type==='frame'){if(!encoder)throw new Error('Encoder not ready.');encoder.add(new Uint8ClampedArray(data.rgba));}
  else if(data.type==='finish'){if(!encoder)throw new Error('Encoder not ready.');const bytes=encoder.finish();self.postMessage({bytes});encoder=undefined;return;}
  else throw new Error('Unsupported GIF action.');
  self.postMessage({ready:true});
 }catch(e){encoder=undefined;self.postMessage({error:e instanceof Error?e.message:'GIF encoding failed.'});}
};
