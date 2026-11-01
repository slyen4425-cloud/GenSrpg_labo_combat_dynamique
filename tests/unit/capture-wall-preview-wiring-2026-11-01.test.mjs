import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

test("editor preview exposes native canonical visual resolver to BOTH 1v1 and 2v2 wall overlays",()=>{
 const preview=source("examples/dom-demo/capture-editor-v2.js");
 const one=source("src/ui/combat-test-ui.js");
 const two=source("src/ui/combat-2v2-test-ui.js");
 assert.match(preview,/visualAsset\(assetId\)\s*\{\s*return\s+native\.visualAsset\(assetId\)/,
   "Capture preview facade must expose visualAsset, not only asset; 2v2 requires visualAsset");
 assert.match(one,/presentationAssets\?\.visualAsset\?\.\(assetId\)/);
 assert.match(two,/presentationAssets\?\.visualAsset\?\.\(assetId\)/);
});

test("all observed wall attack kinds retain their real spatial kind, never default to projectile",()=>{
 for(const path of ["src/ui/combat-test-ui.js","src/ui/combat-2v2-test-ui.js"]){
  const ui=source(path);
  assert.match(ui,/barrierCollisionRectsFor\(\{sourceActorId,targetActorId,kind\}\)[\s\S]{0,260}?return\s+combatEntityOverlay\.collisionRectsFor\(\{sourceActorId,targetActorId,kind\}\)/,
    path+": beam/contact callbacks must not be silently treated as projectile");
 }
});

test("projectile observer keeps scanning visible barriers even when target opaque-mask model is not ready",()=>{
 const fx=source("src/adapters/renderer/dom-skill-fx.js");
 const start=fx.indexOf("function watchProjectileContact(record)");
 const end=fx.indexOf("function applyPresentationGlow",start);
 assert.ok(start>=0 && end>start);
 const sensor=fx.slice(start,end);
 assert.doesNotMatch(sensor,/if\s*\(\s*!collisionModel\s*\|\|\s*typeof collisionModel\.snapshot/,
   "missing target model must not disable persistent obstacle collision sensor");
 assert.match(sensor,/barrierCollisionRectsFor\?\.\(/);
 assert.match(sensor,/onProjectileContact\(/);
});
