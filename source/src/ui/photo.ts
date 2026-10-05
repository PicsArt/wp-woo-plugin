/** Decode and orient uploads in the browser; the WordPress backend validates JPEG headers. */
export async function normalizePhoto(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw new Error('Choose a JPEG, PNG or WebP photo up to 15 MB.');
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{
  if(Math.min(bitmap.width,bitmap.height)<640||Math.max(bitmap.width,bitmap.height)>8192)throw new Error('The shortest side must be at least 640 pixels; the longest side must be at most 8192.');
  const scale=Math.min(1,Math.max(2048/Math.max(bitmap.width,bitmap.height),640/Math.min(bitmap.width,bitmap.height)));
  const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Photo processing is unavailable in this browser.');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare this photo.')),'image/jpeg',0.92));
 }finally{bitmap.close();}
}
