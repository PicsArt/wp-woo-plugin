import {test} from 'node:test';
import assert from 'node:assert/strict';
import {musicWindow} from './music-export';
test('trims the track to the video length',()=>assert.deepEqual(musicWindow(5,60,10,.5),{start:5,length:10,volume:.5}));
test('does not loop a short track',()=>assert.equal(musicWindow(8,12,10,1).length,4));
test('rejects invalid offsets, duration and gain',()=>{for(const a of [[-1,10,10,.5],[10,10,10,.5],[0,10,0,.5],[0,10,10,2],[NaN,10,10,.5]])assert.throws(()=>musicWindow(...a as [number,number,number,number]));});
