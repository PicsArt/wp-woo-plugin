import {test} from 'node:test';import assert from 'node:assert/strict';
import {recoverActiveImage,imageIsRunning} from './active-image';import type {Job} from '../../shared/types';
const job=(id:string,patch:Partial<Job>={})=>({id,subject:'owner',quote:{kind:'image'},status:'REVIEW',approvedAt:1,...patch}) as Job;
test('restore only current-account unarchived image results, newest pending review when storage is absent',()=>{
 const jobs=[job('old'),job('new',{approvedAt:2}),job('foreign',{subject:'other'}),job('archived',{archivedAt:3}),job('video',{quote:{kind:'video'} as Job['quote']})];
 assert.equal(recoverActiveImage(jobs,'owner','old')?.id,'old');
 for(const id of [undefined,'foreign','archived','video','removed'])assert.equal(recoverActiveImage(jobs,'owner',id)?.id,'new');
 assert.equal(recoverActiveImage(jobs,undefined,'old'),undefined);
});
test('completed or stopped image edits cannot leave video generation blocked',()=>{
 for(const status of ['REVIEW','ACCEPTED','STOPPED','REJECTED','RECONCILIATION_REQUIRED'] as Job['status'][])assert.equal(imageIsRunning(job('edit',{status})),false);
 for(const status of ['QUEUED','SUBMITTING','GENERATING','PERSISTING'] as Job['status'][])assert.equal(imageIsRunning(job('edit',{status})),true);
});

test('restores server-authorized public jobs with redacted subject',()=>{assert.equal(recoverActiveImage([job('public',{subject:undefined})],'owner')?.id,'public');});

test('new native editing context does not inherit a different pending image',()=>{assert.equal(recoverActiveImage([job('old')],'owner',null,false),undefined);assert.equal(recoverActiveImage([job('old')],'owner','old',false)?.id,'old');});
