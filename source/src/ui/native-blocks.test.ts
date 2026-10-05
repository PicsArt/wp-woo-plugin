import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
test('new collection and single media blocks save portable media instead of null',()=>{
 const definitions:Record<string,{save:(props:unknown)=>unknown}>={};const element={createElement:(tag:unknown,props:unknown,...children:unknown[])=>({tag,props,children})};
 const wp={element,components:{},blockEditor:{},i18n:{__:(s:string)=>s},blocks:{registerBlockVariation:()=>{},registerBlockType:(name:string,definition:typeof definitions[string])=>{definitions[name]=definition;}}};
 for(const file of ['collection-editor.js','native.js'])runInNewContext(readFileSync(new URL(`../../plugin/picsart-product-videos/assets/${file}`,import.meta.url),'utf8'),{window:{wp}});
 const collection=definitions['picsart/collection']!.save({attributes:{items:[{id:1,url:'https://shop.example/image.png',alt:'Bottle'},{id:2,url:'https://shop.example/video.mp4',video:true}],heading:'Collection'}});
 const rendered=JSON.stringify(collection);assert.ok(rendered.includes('https://shop.example/image.png'));assert.ok(rendered.includes('https://shop.example/video.mp4'));assert.ok(rendered.includes('video'));
 const single=definitions['picsart/media']!.save({attributes:{id:1,url:'https://shop.example/image.png',alt:'Bottle'}});assert.ok(JSON.stringify(single).includes('Bottle'));
 assert.equal(definitions['picsart/media']!.save({attributes:{id:1,url:'javascript:alert(1)'}}),null);
});
test('visible collection layout actions apply ratio and size and sidebar clears old overrides',()=>{
 let definition:any;const patches:any[]=[];
 const element={createElement:(tag:unknown,props:any,...children:any[])=>({tag,props,children})};
 const components=new Proxy({}, {get:(_target,key)=>String(key)});
 const wp={element,components,blockEditor:{useBlockProps:()=>({}),BlockControls:'BlockControls',InspectorControls:'InspectorControls'},i18n:{__:(s:string)=>s},blocks:{registerBlockType:(_name:string,d:any)=>{definition=d;},registerBlockVariation:()=>{}}};
 runInNewContext(readFileSync(new URL('../../plugin/picsart-product-videos/assets/collection-editor.js',import.meta.url),'utf8'),{window:{wp}});
 const tree=definition.edit({attributes:{items:[],preset:'square-large',ratio:'1 / 1',size:'large'},setAttributes:(patch:any)=>patches.push(JSON.parse(JSON.stringify(patch)))});
 const nodes:any[]=[];function visit(n:any){if(Array.isArray(n)){n.forEach(visit);return;}if(n&&typeof n==='object'){nodes.push(n);visit(n.children);}}visit(tree);
 const menu=nodes.find(n=>n.tag==='DropdownMenu');assert.equal(menu.props.label,'Picsart layouts');assert.equal(menu.props.icon,'admin-customizer');
 menu.props.controls.find((c:any)=>c.title==='Vertical Stories').onClick();assert.deepEqual(patches.pop(),{preset:'stories',ratio:'9 / 16',size:'small'});
 nodes.find(n=>n.tag==='SelectControl'&&n.props.label==='Layout').props.onChange('portrait');assert.deepEqual(patches.pop(),{preset:'portrait',ratio:'',size:''});
});
