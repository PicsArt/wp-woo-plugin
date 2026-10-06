import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cached, preloadQuote, invalidateQuote } from './quote-cache';
import type { Quote } from '../../shared/types';
const quote = (id: string, expiresAt=Date.now()+60000) => ({ id, total: 2, expiresAt }) as Quote;
test('preloaded prices reuse only the exact account and input key', async () => {
 let loads=0;
 const load=async()=>{loads++;return quote('cache-exact');};
 await preloadQuote('accountA:modelA:sourceA',load);
 await preloadQuote('accountA:modelA:sourceA',load);
 assert.equal(loads,1);
 assert.equal(cached('accountB:modelA:sourceA'),undefined);
 assert.equal(cached('accountA:modelB:sourceA'),undefined);
 assert.equal(cached('accountA:modelA:sourceB'),undefined);
});
test('simultaneous selected and background requests share one price lookup', async () => {
 let loads=0;
 const load=async()=>{loads++;return quote('cache-shared');};
 await Promise.all([preloadQuote('shared',load),preloadQuote('shared',load)]);
 assert.equal(loads,1);
});
test('expired and approved quotes cannot be reused for another generation', async () => {
 await preloadQuote('expired',async()=>quote('expired',Date.now()-1));
 assert.equal(cached('expired'),undefined);
 await preloadQuote('approved',async()=>quote('approved'));
 invalidateQuote('approved');
 assert.equal(cached('approved'),undefined);
});

test('saved image prices restore for the exact prompt and account after reload', async () => {
 const {restoreQuotes}=await import('./quote-cache');
 const q={...quote('restored-image'),kind:'image',source:{id:'saved-source'},model:'flare',template:{prompt:'pale blue'}} as Quote;
 restoreQuotes('saved-account',[q]);
 const key=(account:string,prompt:string)=>JSON.stringify([account,{sourceId:'saved-source',prompt,model:'flare',quality:'medium'}]);
 assert.equal(cached(key('saved-account','pale blue'))?.id,q.id);
 assert.equal(cached(key('other-account','pale blue')),undefined);
 assert.equal(cached(key('saved-account','warm cream')),undefined);
 invalidateQuote(q.id);
 assert.equal(cached(key('saved-account','pale blue')),undefined);
});
