import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateLocalVideoFile,validateLocalVideoMetadata,LOCAL_VIDEO_MAX_BYTES} from './local-video';
test('local video rejects unsupported files and bounded file sizes',()=>{validateLocalVideoFile({type:'video/mp4',size:100});assert.throws(()=>validateLocalVideoFile({type:'text/html',size:100}));assert.throws(()=>validateLocalVideoFile({type:'video/mp4',size:LOCAL_VIDEO_MAX_BYTES+1}));assert.throws(()=>validateLocalVideoFile({type:'video/webm',size:0}));});
test('local video supports portrait and landscape Full HD within export duration',()=>{validateLocalVideoMetadata(120,1080,1920);validateLocalVideoMetadata(10,1920,1080);assert.throws(()=>validateLocalVideoMetadata(121,1920,1080));assert.throws(()=>validateLocalVideoMetadata(10,3840,2160));assert.throws(()=>validateLocalVideoMetadata(Infinity,100,100));});
