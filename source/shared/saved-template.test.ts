import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adaptPrompt,savedFromJob,PRODUCT_INFO,normalizeProductPrompt} from './saved-template';
import type {Job,Source} from './types';
const source={id:'photo-old',name:'photo.jpg',productName:'Old cup',sku:'OLD',url:'https://example.com/old.jpg'} as Source;
const job={id:'job',subject:'owner',status:'ACCEPTED',reviewedAt:123,reviewedBy:'owner',quote:{source,model:'model-a',template:{id:'still',prompt:'Gentle light'},output:{duration:10,resolution:'1080p',aspectRatio:'9:16'},total:30,params:{startFrame:source.url}}} as unknown as Job;
test('stores reusable settings but no media, product metadata or price',()=>{const t=savedFromJob(job,'Soft light','template');assert.equal(t.loop,true);assert.equal(t.model,'model-a');assert.equal(t.duration,10);assert.ok(t.promptTemplate.includes(PRODUCT_INFO));assert.doesNotMatch(JSON.stringify(t),/old.jpg|Old cup|OLD|total|startFrame/);});
test('fills the new product each time without mutating the saved prompt',()=>{const t=savedFromJob(job,'Light','id');assert.match(adaptPrompt(t.promptTemplate,{...source,productName:'New vase',sku:'NEW'}),/New vase/);assert.doesNotMatch(adaptPrompt(t.promptTemplate,{...source,productName:'New vase',sku:'NEW'}),/Old cup/);assert.ok(t.promptTemplate.includes(PRODUCT_INFO));});
test('does not save a rejected, unreviewed or foreign-reviewed job',()=>{for(const change of [{status:'REJECTED'},{reviewedAt:undefined},{reviewedBy:'other'}])assert.throws(()=>savedFromJob({...job,...change} as Job,'Name','id'));});
test('retains unexpanded prompt and loop override when resaving',()=>{const t=savedFromJob({...job,quote:{...job.quote,promptTemplate:`A push toward ${PRODUCT_INFO}`,loop:false}},'Name','id');assert.equal(t.loop,false);assert.equal(t.promptTemplate,`A push toward ${PRODUCT_INFO}`);});
test('requires placeholder and treats replacement syntax as literal product data',()=>{assert.throws(()=>adaptPrompt('No placeholder',source));assert.match(adaptPrompt(PRODUCT_INFO,{...source,productName:'$& cup'}),/\$& cup/);});

test('legacy duplicate slots expand product once and omit internal SKU',()=>{
 const prompt=`Animate ${PRODUCT_INFO} gently.\n\n${PRODUCT_INFO}`;
 const result=adaptPrompt(prompt,{...source,productName:'New vase',sku:'INTERNAL-123'});
 assert.equal(result.match(/New vase/g)?.length,1);
 assert.doesNotMatch(result,/sku|INTERNAL-123/i);
 assert.match(result,/gently/);
 assert.equal(normalizeProductPrompt(normalizeProductPrompt(prompt)),normalizeProductPrompt(prompt));
});
test('saving a legacy duplicated template does not change historical prompt',()=>{
 const old={...job,quote:{...job.quote,promptTemplate:`Motion ${PRODUCT_INFO}\n${PRODUCT_INFO}`}};
 const before=JSON.stringify(old);
 assert.equal(savedFromJob(old,'Reuse','id').promptTemplate.split(PRODUCT_INFO).length-1,1);
 assert.equal(JSON.stringify(old),before);
});
