import test from "node:test";
import assert from "node:assert/strict";
import { closestAspectRatio } from "../../shared/video-options";
test("image aspect defaults follow orientation and supported model ratios", () => {
  assert.equal(closestAspectRatio(1600, 900), "16:9");
  assert.equal(closestAspectRatio(900, 1600), "9:16");
  assert.equal(closestAspectRatio(1024, 1024), "1:1");
  assert.equal(closestAspectRatio(900, 1600, ["16:9", "1:1"]), "1:1");
  assert.equal(closestAspectRatio(0, 1024), undefined);
});
