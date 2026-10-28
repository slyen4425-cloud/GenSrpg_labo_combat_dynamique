import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("legacy fireball's left-facing atlas declares its native heading in the single media catalog",async()=>{
  const catalog=JSON.parse(await readFile(new URL("../../data/assets/catalog/global-visual-assets.v1.json",import.meta.url),"utf8"));
  const asset=catalog.assets.find(entry=>entry.id==="pack:capture:sprite-fireball-travel-01");
  assert.ok(asset,"the existing fireball asset ID must stay unchanged");
  assert.equal(asset.resource.file,"capture/sprites/skills/fireball/atlases/sprite_skill_fireball_travel_rl_atlas_01.png");
  // Unlike the newer right-facing atlases, this original fireball PNG has its
  // head on the left and its trail on the right. It MUST NOT be treated as
  // either neutral or right-facing.
  assert.equal(asset.resource.headingRad,Math.PI);
  const other=catalog.assets.find(entry=>entry.id==="pack:capture:sprite-graine-sangsue-projectile-01");
  assert.equal(other.resource.headingRad,0);
});
