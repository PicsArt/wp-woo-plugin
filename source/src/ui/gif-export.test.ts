import {test} from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error The independent decoder has no TypeScript declarations.
import {GifReader} from 'omggif';
import {createGifEncoder} from './gif-codec';
import {gifPlan} from './gif-settings';
test('clip plan preserves aspect ratio, bounds memory and samples the requested first frame',()=>{
 const plan=gifPlan({start:2,duration:3,width:480,fps:10},{width:1080,height:1920,duration:10});
 assert.equal(plan.width,360);assert.equal(plan.height,640);assert.equal(plan.frames,30);assert.equal(plan.times[0],2);assert.ok(plan.times.at(-1)!<5);assert.equal(plan.delay,100);
 assert.throws(()=>gifPlan({start:9,duration:3,width:480,fps:10},{width:1080,height:1920,duration:10}));
 assert.throws(()=>gifPlan({start:0,duration:7,width:480,fps:10},{width:1080,height:1920,duration:10}));
 assert.throws(()=>gifPlan({start:NaN,duration:3,width:480,fps:10},{width:1080,height:1920,duration:10}));
});
test('actual GIF decodes with distinct frames, duration, loop and first-frame fallback',()=>{
 const encoder=createGifEncoder(2,2,100);
 const red=new Uint8ClampedArray([255,0,0,255,255,0,0,255,255,0,0,255,255,0,0,255]);
 const blue=new Uint8ClampedArray([0,0,255,255,0,0,255,255,0,0,255,255,0,0,255,255]);
 encoder.add(red);encoder.add(blue);const bytes=encoder.finish();
 const gif=new GifReader(bytes);assert.equal(gif.width,2);assert.equal(gif.height,2);assert.equal(gif.numFrames(),2);assert.equal(gif.loopCount(),0);assert.equal(gif.frameInfo(0).delay,10);
 const pixels=new Uint8Array(16);gif.decodeAndBlitFrameRGBA(0,pixels);assert.deepEqual([...pixels],[...red]);gif.decodeAndBlitFrameRGBA(1,pixels);assert.deepEqual([...pixels],[...blue]);
 assert.throws(()=>encoder.add(red));
});
test('oversized and malformed GIF frames fail without producing a misleading result',()=>{
 const encoder=createGifEncoder(2,2,100,20);
 assert.throws(()=>encoder.add(new Uint8ClampedArray(16)),/too large/);
 assert.throws(()=>createGifEncoder(601,2,100));
 assert.throws(()=>createGifEncoder(2,2,100).add(new Uint8ClampedArray(4)));
 assert.throws(()=>createGifEncoder(2,2,100).finish());
});
