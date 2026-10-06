import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyDeviceStatus,countdown,pendingView} from './device-sign-in';
import type {PendingDevice} from '../../shared/types';
const device:PendingDevice={attemptId:'a1',userCode:'WDJB-MJHT',verificationUri:'https://accounts.picsart.com/device',expiresAt:1,expiresIn:300000,interval:5};
test('the countdown comes from the server’s remaining time, not its clock',()=>{
 const view=pendingView({...device,expiresAt:0},1000);
 assert.equal(view.kind==='pending'&&view.deadline,301000);
 assert.equal(countdown(300000),'5:00');assert.equal(countdown(61001),'1:02');assert.equal(countdown(-5),'0:00');
});
test('panel moves pending → connected, denied or expired and keeps the slower interval',()=>{
 const view=pendingView(device,0);
 const slowed=applyDeviceStatus(view,{status:'pending',...device,interval:10},0);
 assert.equal(slowed!=='connected'&&slowed?.kind==='pending'&&slowed.interval,10);
 assert.equal(applyDeviceStatus(view,{status:'connected',attemptId:'a1'}),'connected');
 assert.deepEqual(applyDeviceStatus(view,{status:'denied',attemptId:'a1',message:'You declined'}),{kind:'ended',status:'denied',message:'You declined',attemptId:'a1'});
 assert.equal((applyDeviceStatus(view,{status:'expired',attemptId:'a1',message:'expired'}) as {status:string}).status,'expired');
});
test('stale answers are dropped',()=>{
 const view=pendingView(device,0);
 assert.equal(applyDeviceStatus(view,{status:'pending',...device,attemptId:'old',expiresAt:0}),view,'an older attempt answering late');
 assert.equal(applyDeviceStatus(view,{status:'denied',attemptId:'old',message:'no'}),view,'an older attempt ending');
 const ended=applyDeviceStatus(view,{status:'denied',attemptId:'a1',message:'no'});
 assert.equal(applyDeviceStatus(ended as never,{status:'pending',...device}),ended,'late pending after the attempt ended');
});
test('an attempt that vanished on the server closes the panel',()=>{
 assert.equal(applyDeviceStatus(pendingView(device,0),{status:'expired',message:'This code is no longer active.'}),undefined);
});
test('a tab follows a newer code from another tab and closes when any attempt connects',()=>{
 const view=pendingView(device,0);
 const newer=applyDeviceStatus(view,{status:'pending',...device,attemptId:'a2',userCode:'NEWC-ODE2',expiresAt:2},0);
 assert.equal(newer!=='connected'&&newer?.kind==='pending'&&newer.userCode,'NEWC-ODE2');
 assert.equal(applyDeviceStatus(view,{status:'connected',attemptId:'a2'}),'connected');
 assert.equal(pendingView({...device,finishing:true},0).kind==='pending'&&(pendingView({...device,finishing:true},0) as {finishing?:boolean}).finishing,true,'a resumed approval shows as finishing');
});
