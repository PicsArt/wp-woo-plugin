import test from 'node:test';
import assert from 'node:assert/strict';
import {syncDue,resolveDefault,MODEL_SYNC_INTERVAL} from '../../shared/model-sync';
test('sync on first visit, daily boundary and invalid future timestamps',()=>{
 assert.equal(syncDue(undefined,100),true);
 assert.equal(syncDue(100,100+MODEL_SYNC_INTERVAL-1),false);
 assert.equal(syncDue(100,100+MODEL_SYNC_INTERVAL),true);
 assert.equal(syncDue(200,100),true);
});
test('saved preference wins; unavailable defaults fall back to configured eligible model',()=>{
 assert.equal(resolveDefault('b','a',['a','b']),'b');
 assert.equal(resolveDefault('removed','a',['a','b']),'a');
 assert.equal(resolveDefault(undefined,'removed',['b']),'b');
 assert.equal(resolveDefault('a','a',[]),'');
});

import policy from '../../shared/model-policy.json';
import catalog from '../../shared/model-catalog.json';
test('recommended Seedance model is bundled with usable options',()=>{
 assert.equal(policy.defaultVideoModel,'seedance-2.5');
 assert.equal(resolveDefault(undefined,policy.defaultVideoModel,catalog.video.map(m=>m.id)),'seedance-2.5');
 assert.equal(catalog.video.find(m=>m.id===policy.defaultVideoModel)?.name,'Seedance 2.5');
 assert.ok(catalog.videoOptions['seedance-2.5'].standard.length>0);
});

import {catalogSyncDue,MODEL_CATALOG_REVISION,type SyncedModels} from '../../shared/model-sync';
test('upgrades invalidate recently synced model options without changing saved defaults',()=>{
 const recent={syncedAt:100,revision:MODEL_CATALOG_REVISION,configuredDefault:'seedance-2.5',video:[],schemas:{},videoOptions:{}} as SyncedModels;
 assert.equal(catalogSyncDue(recent,101),false);
 assert.equal(catalogSyncDue({...recent,revision:undefined},101),true);
 assert.equal(catalogSyncDue({...recent,revision:'older-build'},101),true);
 assert.equal(resolveDefault('minimax-h3','seedance-2.5',['seedance-2.5','minimax-h3']),'minimax-h3');
});
