import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../../shared/model-catalog.json';
import {selectVideoVariant,type VideoVariant} from '../../shared/video-options';
const models=catalog.videoOptions as Record<string,{standard:VideoVariant[];loop:VideoVariant[]}>;
test('every model transition selects an allowed combination, including missing controls',()=>{
 for(const from of Object.values(models))for(const to of Object.values(models))for(const mode of ['standard','loop'] as const){
  const before=selectVideoVariant(from[mode],{duration:6,resolution:'768p',aspectRatio:'1:1'});
  const after=selectVideoVariant(to[mode],before);
  assert.ok(to[mode].some(r=>r.resolution===after.resolution && r.aspectRatio===after.aspectRatio && r.durations.includes(after.duration)));
  assert.deepEqual(selectVideoVariant(to[mode],after),after);
 }
});
test('Veo 4K selects eight seconds and a supported aspect ratio',()=>{
 const result=selectVideoVariant(models['veo-3.1'].standard,{duration:6,resolution:'4k',aspectRatio:'1:1'});
 assert.equal(result.duration,8);assert.equal(result.resolution,'4k');assert.equal(result.aspectRatio,'16:9');
});
test('model-controlled outputs never acquire fabricated resolution or aspect choices',()=>{
 const omni=selectVideoVariant(models['gemini-omni-flash-preview'].standard,{duration:5,resolution:'1080p',aspectRatio:'9:16'});
 assert.deepEqual(omni.resolutions,['']);assert.equal(omni.resolution,'');
 const max=selectVideoVariant(models['minimax-h3-max'].standard,{duration:6,resolution:'768p',aspectRatio:'1:1'});
 assert.deepEqual(max.aspects,['']);assert.equal(max.aspectRatio,'');
 assert.deepEqual([...new Set(models['seedance-2.5'].standard.map(r=>r.aspectRatio))],['adaptive']);
});
test('SDK resolutions and wide/portrait aspect ratios are not clipped to the old allowlist',()=>{
 const seed=models['seedance-2.0'].standard;
 assert.ok(seed.some(r=>r.resolution==='480p'));assert.ok(seed.some(r=>r.resolution==='4k'));
 for(const ar of ['4:3','3:4','21:9'])assert.ok(seed.some(r=>r.aspectRatio===ar));
 assert.ok(models['minimax-h3'].standard.some(r=>r.resolution==='2k'));
});
