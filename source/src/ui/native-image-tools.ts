export type MarkMode = 'none' | 'brand' | 'protective';
export type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export interface ImageRecipe {
  crop: {x:number;y:number;width:number;height:number};
  width:number;height:number;rotation:0|90|180|270;
  brightness:number;contrast:number;saturation:number;
  format:'image/png'|'image/jpeg'|'image/webp';quality:number;
  radius?:number;mark:MarkMode;text:string;opacity:number;size:number;corner:Corner;color:string;
}
export const MAX_PIXELS=24_000_000;
export function initialRecipe(width:number,height:number):ImageRecipe {
  return {crop:{x:0,y:0,width,height},width,height,rotation:0,brightness:100,contrast:100,saturation:100,format:'image/png',quality:.9,mark:'none',text:'',opacity:.7,size:.06,corner:'bottom-right',color:'#ffffff'};
}
export function validateRecipe(r:ImageRecipe,source:{width:number;height:number}) {
  const values=[r.width,r.height,r.crop.x,r.crop.y,r.crop.width,r.crop.height,r.brightness,r.contrast,r.saturation,r.opacity,r.size,r.quality,r.radius??0];
  if(values.some(v=>!Number.isFinite(v)))throw new Error('Enter a number in every image setting.');
  if(!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.width<1||r.height<1||r.width>8192||r.height>8192||r.width*r.height>MAX_PIXELS)throw new Error('Choose dimensions up to 8192 pixels per side and 24 megapixels.');
  if(r.crop.x<0||r.crop.y<0||r.crop.width<1||r.crop.height<1||r.crop.x+r.crop.width>source.width||r.crop.y+r.crop.height>source.height)throw new Error('Keep the crop inside the original image.');
  if(![0,90,180,270].includes(r.rotation)||r.brightness<0||r.brightness>200||r.contrast<0||r.contrast>200||r.saturation<0||r.saturation>200||r.opacity<0||r.opacity>1||r.size<.01||r.size>.5||r.quality<.1||r.quality>1)throw new Error('One of the image settings is outside its supported range.');
  if((r.radius??0)<0||(r.radius??0)>100)throw new Error('Choose a logo corner radius from 0 to 100 pixels.');
  if(!['none','brand','protective'].includes(r.mark)||!['image/png','image/jpeg','image/webp'].includes(r.format)||!/^#[0-9a-f]{6}$/i.test(r.color)||r.text.length>120)throw new Error('Choose a supported format, mark and color.');
}
export function markPosition(corner:Corner,w:number,h:number,mw:number,mh:number,inset:number) {
  return {x:corner.endsWith('right')?w-inset-mw:inset,y:corner.startsWith('bottom')?h-inset-mh:inset};
}
export function fitDimensions(width:number,height:number,max=960) {
  const factor=Math.min(1,max/Math.max(width,height));
  return {width:Math.max(1,Math.round(width*factor)),height:Math.max(1,Math.round(height*factor))};
}
export async function decodeRaster(blob:Blob):Promise<ImageBitmap> {
  if(!['image/jpeg','image/png','image/webp'].includes(blob.type)||blob.size>20*1024*1024)throw new Error('Choose a JPEG, PNG or WebP image up to 20 MB.');
  const bitmap=await createImageBitmap(blob,{imageOrientation:'from-image'});
  if(bitmap.width>8192||bitmap.height>8192||bitmap.width*bitmap.height>MAX_PIXELS){bitmap.close();throw new Error('This image is too large. Use up to 8192 pixels per side and 24 megapixels.');}
  return bitmap;
}
/** Always renders from the clean decoded source, never the previously marked output. */
export function renderImage(canvas:HTMLCanvasElement,source:ImageBitmap,r:ImageRecipe,logo?:ImageBitmap,preview=false) {
  validateRecipe(r,source);
  const output=preview?fitDimensions(r.width,r.height):{width:r.width,height:r.height};
  canvas.width=output.width;canvas.height=output.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('This browser cannot edit images on this page.');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(r.format==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}
  ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(r.rotation*Math.PI/180);
  ctx.filter=`brightness(${r.brightness}%) contrast(${r.contrast}%) saturate(${r.saturation}%)`;
  const quarter=r.rotation===90||r.rotation===270;
  const w=quarter?canvas.height:canvas.width,h=quarter?canvas.width:canvas.height;
  ctx.drawImage(source,r.crop.x,r.crop.y,r.crop.width,r.crop.height,-w/2,-h/2,w,h);ctx.restore();
  if(r.mark==='none')return;
  if(!logo&&!r.text.trim())return;
  ctx.save();ctx.globalAlpha=r.opacity;ctx.fillStyle=r.color;ctx.textBaseline='top';
  const targetWidth=canvas.width*(r.mark==='protective'?Math.max(.15,r.size):r.size);
  const fontSize=Math.max(8,targetWidth/(Math.max(1,r.text.length)*.6));
  ctx.font=`600 ${fontSize}px system-ui, sans-serif`;
  const mw=logo?targetWidth:ctx.measureText(r.text).width;
  const mh=logo?targetWidth*logo.height/logo.width:fontSize*1.3;
  const draw=(x:number,y:number)=>{if(logo){ctx.save();if(r.radius){ctx.beginPath();ctx.roundRect(x,y,mw,mh,Math.min(r.radius*canvas.width/r.width,mw/2,mh/2));ctx.clip();}ctx.drawImage(logo,x,y,mw,mh);ctx.restore();}else ctx.fillText(r.text,x,y);};
  if(r.mark==='brand'){
    const pos=markPosition(r.corner,canvas.width,canvas.height,mw,mh,Math.min(canvas.width,canvas.height)*.035);draw(pos.x,pos.y);
  }else{
    ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/6);
    const span=Math.hypot(canvas.width,canvas.height);
    const stepX=Math.max(mw*1.7,canvas.width*.2),stepY=Math.max(mh*3,canvas.height*.15);
    for(let y=-span;y<span;y+=stepY)for(let x=-span;x<span;x+=stepX)draw(x,y);
  }
  ctx.restore();
}
export async function exportImage(source:ImageBitmap,recipe:ImageRecipe,logo?:ImageBitmap) {
  const canvas=document.createElement('canvas');renderImage(canvas,source,recipe,logo);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image export failed. Try PNG or a smaller size.')),recipe.format,recipe.quality));
  if(blob.type!==recipe.format)throw new Error('This browser cannot export the selected format. Choose PNG or JPEG.');
  return blob;
}
