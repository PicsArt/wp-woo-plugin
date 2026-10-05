declare global {
  interface Window { picsartStudio: {endpoint:string;nonce:string;userId?:number;hasWooCommerce?:boolean;workspaceView?:"videos"|"images"|"history"|"settings";productId?:string;wpEndpoint?:string;attachmentId?:string|number;postId?:string|number;termId?:string|number;target?:string;view?:string;assetsUrl?:string;navigationNonce?:string} }
}
export function platformEndpoint(path:string) {
  const input=new URL(path,'https://route.invalid');
  const url=new URL(window.picsartStudio.endpoint,window.location.href);
  for(const [key,value] of input.searchParams)url.searchParams.set(key,value);
  url.searchParams.set('route',input.pathname);
  return url.href;
}
export function platformFetch(url:string|URL,init:RequestInit={}) {
  return fetch(url,{...init,credentials:'same-origin',headers:{...init.headers,'X-WP-Nonce':window.picsartStudio.nonce}});
}

export function studioLink(view:string){return `admin.php?page=picsart-studio&view=${encodeURIComponent(view)}&_picsart_context=${encodeURIComponent(window.picsartStudio.navigationNonce??'')}`;}

export function historyLink(jobId:string){return `admin.php?page=picsart-history#job-${encodeURIComponent(jobId)}`;}
export function videoHandoffLink(kind:'reuse'|'source',id:string,changeMedia=false){
 const params=new URLSearchParams({page:'picsart-studio',[kind]:id});
 if(changeMedia)params.set('changeMedia','1');
 return `admin.php?${params}`;
}
