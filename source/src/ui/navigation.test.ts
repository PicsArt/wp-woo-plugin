import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historyLink,videoHandoffLink} from './platform';
test('result links open dedicated History and safely encode job identifiers',()=>{
 assert.equal(historyLink('abc'),'admin.php?page=picsart-history#job-abc');
 assert.equal(historyLink('a&b'),'admin.php?page=picsart-history#job-a%26b');
});
test('reuse handoff carries only record reference and media-change intent, never price approval',()=>{
 const url=new URL(videoHandoffLink('reuse','job-id',true),'https://example.test/');
 assert.deepEqual([...url.searchParams], [['page','picsart-studio'],['reuse','job-id'],['changeMedia','1']]);
 assert.equal(new URL(videoHandoffLink('source','edit-id'),'https://example.test/').searchParams.get('source'),'edit-id');
});
