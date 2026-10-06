import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script=readFileSync(new URL('../../plugin/picsart-product-videos/assets/media-sources.js',import.meta.url),'utf8');
for(const mime of ['video/mp4','audio/mpeg'])test(`generated video picker handles REST file attachment ${mime}`,async()=>{
 let receive:(event:unknown)=>void=()=>{},generate:()=>void=()=>{},selected=0;
 const child={},events:Record<string,Function>={};
 const attachment={fetch:async()=>{}};
 const wp={i18n:{__:(s:string)=>s},apiFetch:async()=>({id:5,media_type:'file',mime_type:mime}),media:{View:{extend:()=>({})},attachment:()=>attachment,view:{MediaFrame:{prototype:{initialize(){}}}}}};
 const window={wp,open:()=>child,addEventListener:(_:string,fn:typeof receive)=>{receive=fn;},removeEventListener(){}};
 runInNewContext(script,{window,URL,URLSearchParams,location:{href:'https://store.example/wp-admin/',origin:'https://store.example'},picsartMediaSources:{tools:'https://store.example/wp-admin/admin.php'},crypto:{randomUUID:()=> 'test-token'},setInterval:()=>1,clearInterval(){}});
 const frame={on:(name:string,fn:Function)=>{events[name]=fn;},once(){},state:()=>({id:'video-playlist',get:(name:string)=>name==='library'?{props:{get:()=> 'video'}}:{multiple:true,add:()=>{selected++;}}}),setState(){},content:{render(){}}};
 wp.media.view.MediaFrame.prototype.initialize.call(frame);
 events['router:render:browse']({set:(_:string,item:{click:()=>void})=>{generate=item.click;}});
 generate();receive({origin:'https://store.example',source:child,data:{type:'picsart-insert',token:'test-token',id:5}});
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(selected,mime.startsWith('video/')?1:0);
});
