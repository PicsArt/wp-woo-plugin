import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Job} from '../../shared/types';
import {filterHistory} from './history';
const job=(id:string,kind:'image'|'video',status:Job['status'],name:string)=>({id,status,quote:{kind,model:'model',source:{name,productName:name},template:{name:'Hero'}}} as Job);
const jobs=[job('1','video','REVIEW','Blue mug'),job('2','image','GENERATING','Red bowl'),job('3','video','UNKNOWN_SUBMISSION','Plate')];
test('history combines product search with media and status filters',()=>{assert.deepEqual(filterHistory(jobs,' MUG ','video','ready').map(j=>j.id),['1']);assert.deepEqual(filterHistory(jobs,'','image','working').map(j=>j.id),['2']);assert.deepEqual(filterHistory(jobs,'','all','attention').map(j=>j.id),['3']);});
test('empty searches recover all results when filters are cleared',()=>{assert.equal(filterHistory(jobs,'missing','all','all').length,0);assert.deepEqual(filterHistory(jobs,'','all','all'),jobs);});

import {historyWithActive} from './history';
test('active jobs stay visible when completed history filters exclude them',()=>{const active={id:'active',status:'GENERATING',quote:{kind:'video'}} as unknown as Job;assert.deepEqual(historyWithActive([active],'unrelated','image','ready',true),[active]);});
