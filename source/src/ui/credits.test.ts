import assert from "node:assert/strict";
import test from "node:test";
import { getCreditShortfall } from "./credits";

test("credit shortfall uses available balance after reservations", () => {
  assert.deepEqual(getCreditShortfall(20, 8, 15), {
    available: 12,
    required: 15,
    missing: 3,
  });
  assert.equal(getCreditShortfall(20, 5, 15), null);
});

test("credit shortfall is hidden while balance or price is unavailable", () => {
  assert.equal(getCreditShortfall(null, 0, 10), null);
  assert.equal(getCreditShortfall(10, 0, undefined), null);
});

import {packageUsageThreshold} from './credits';
test('package notices use authoritative usage and exact threshold boundaries',()=>{
 assert.equal(packageUsageThreshold(),null);
 for(const [used,want] of [[49,null],[50,50],[79,50],[80,80],[89,80],[90,90],[100,90]] as const)assert.equal(packageUsageThreshold({used,allowance:100}),want);
 assert.equal(packageUsageThreshold({used:50,allowance:0}),null);
 assert.equal(packageUsageThreshold({used:NaN,allowance:100}),null);
});
