import test from 'node:test';
import assert from 'node:assert/strict';
import {platformFetch} from './platform';

test('WordPress nonce is never sent to an external origin',async()=>{
 const originalFetch=globalThis.fetch;
 const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 let calls=0;
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{href:'https://store.example/wp-admin/',origin:'https://store.example'},picsartStudio:{nonce:'test-nonce'}}});
 globalThis.fetch=async(input,init)=>{calls++;assert.equal(String(input),'https://store.example/wp-json/picsart/v1/studio');assert.equal(new Headers(init?.headers).get('X-WP-Nonce'),'test-nonce');return Response.json({ok:true});};
 try {
  assert.throws(()=>platformFetch('https://other.example/'),/Unexpected WordPress endpoint/);
  assert.throws(()=>platformFetch('//other.example/'),/Unexpected WordPress endpoint/);
  assert.equal(calls,0);
  await platformFetch('/wp-json/picsart/v1/studio');
  assert.equal(calls,1);
 }finally{globalThis.fetch=originalFetch;if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else Reflect.deleteProperty(globalThis,'window');}
});
