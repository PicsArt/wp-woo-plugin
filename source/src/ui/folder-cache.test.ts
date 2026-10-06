import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FolderCache} from './folder-cache';
const listing={folders:[],images:[{uid:'photo',name:'Photo',url:'https://example.com/photo.jpg'}],videos:[]};
test('folder cache separates root, children and account instances',()=>{
 const cache=new FolderCache();cache.set(undefined,listing);cache.set('child',{...listing,images:[]});
 assert.equal(cache.get()?.images.length,1);assert.equal(cache.get('child')?.images.length,0);
 assert.equal(new FolderCache().get(),undefined);
});
test('folder entries expire and fresh responses replace cached content',()=>{
 let now=0;const cache=new FolderCache(()=>now,60);
 cache.set('folder',listing);now=59;assert.equal(cache.get('folder'),listing);
 now=60;assert.equal(cache.get('folder'),undefined);
 cache.set('folder',{...listing,images:[]});assert.equal(cache.get('folder')?.images.length,0);
});
test('cache bounds retained folders without evicting a freshly replaced entry',()=>{
 const cache=new FolderCache(Date.now,60000,2);cache.set('a',listing);cache.set('b',listing);cache.set('a',listing);cache.set('c',listing);
 assert.equal(cache.get('b'),undefined);assert.equal(cache.get('a'),listing);assert.equal(cache.get('c'),listing);
});
