import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialRecipe,validateRecipe,markPosition,fitDimensions} from './native-image-tools';
test('rejects crops beyond the source, nonfinite transforms and oversized allocations',()=>{
 const source={width:1000,height:800},r=initialRecipe(1000,800);
 assert.doesNotThrow(()=>validateRecipe(r,source));
 assert.throws(()=>validateRecipe({...r,crop:{...r.crop,x:1}},source),/crop/);
 assert.throws(()=>validateRecipe({...r,width:NaN},source),/number/);
 assert.throws(()=>validateRecipe({...r,width:8192,height:8192},source),/megapixels/);
 assert.throws(()=>validateRecipe({...r,opacity:2},source),/range/);
});
test('brand corners preserve inset and preview scaling preserves proportions',()=>{
 assert.deepEqual(markPosition('bottom-right',1000,800,60,30,20),{x:920,y:750});
 assert.deepEqual(markPosition('top-left',1000,800,60,30,20),{x:20,y:20});
 assert.deepEqual(fitDimensions(4000,2000),{width:960,height:480});
 assert.deepEqual(fitDimensions(320,240),{width:320,height:240});
});
