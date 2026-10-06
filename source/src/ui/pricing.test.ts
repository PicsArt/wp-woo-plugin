import test from 'node:test';
import assert from 'node:assert/strict';
import { estimatePrice, type PricingCatalog } from '../../shared/pricing';

const prices: PricingCatalog = {basis:'public-estimate', expiresAt:2000, models:{
  video:{min:2,max:18,unit:'second',tiers:[
    {credits:18,unit:'second',quality:'1080p',audio:false,useCase:'image-to-video'},
    {credits:11,unit:'second',quality:'1080p',audio:false,useCase:'video-to-video'},
    {credits:7,unit:'second',quality:'720p',audio:false,useCase:'image-to-video'},
    {credits:30,unit:'second',quality:'1080p',audio:true,useCase:'image-to-video'},
  ]},
  image:{min:1,max:7,unit:'generation',tiers:[
    {credits:1,unit:'generation',quality:'medium',useCase:'image-to-image'},
    {credits:7,unit:'generation',quality:'max',useCase:'image-to-image'},
  ]},
  tokens:{min:1,max:1,tiers:[{credits:1,unit:'output_text_tokens'}]},
}};
test('video estimates use the selected resolution, silent image-to-video tier and seconds',()=>{
  assert.equal(estimatePrice(prices,'video',{kind:'video',duration:5,resolution:'1080p'},1000),'90');
  assert.equal(estimatePrice(prices,'video',{kind:'video',duration:10,resolution:'720p'},1000),'70');
});
test('medium image estimate needs no prompt and does not include other quality tiers',()=>{
  assert.equal(estimatePrice(prices,'image',{kind:'image'},1000),'1');
});
test('expired, missing and unsupported billing units never become invented totals',()=>{
  assert.equal(estimatePrice(prices,'image',{kind:'image'},2000),undefined);
  assert.equal(estimatePrice(prices,'missing',{kind:'image'},1000),undefined);
  assert.equal(estimatePrice(prices,'tokens',{kind:'image'},1000),undefined);
  assert.equal(estimatePrice(prices,'video',{kind:'video',duration:5,resolution:'4k'},1000),undefined);
});

test('native SDK resolution aliases match displayed quality',()=>{
 const catalog={basis:'public-estimate' as const,expiresAt:Date.now()+60000,models:{flux:{min:6,max:9,tiers:[{credits:6,unit:'second',quality:'hd',audio:false,useCase:'image-to-video'},{credits:9,unit:'second',quality:'fhd',audio:false,useCase:'image-to-video'}]}}};
 assert.equal(estimatePrice(catalog,'flux',{kind:'video',resolution:'720p',duration:5}),'30');
 assert.equal(estimatePrice(catalog,'flux',{kind:'video',resolution:'1080p',duration:5}),'45');
});

 test('unsupported image quality does not display an unrelated estimate',()=>{
 const catalog:PricingCatalog={basis:'public-estimate',expiresAt:2000,models:{gemini:{min:2,max:5,tiers:[
 {credits:2,unit:'generation',quality:'1k',audio:false,useCase:'image-to-image'},
 {credits:5,unit:'generation',quality:'1k',audio:false,useCase:'text-to-image'},
 ]}}};
 assert.equal(estimatePrice(catalog,'gemini',{kind:'image'},1000),undefined);
 });
