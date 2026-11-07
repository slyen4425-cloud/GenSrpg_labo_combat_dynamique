import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {composeDomTransform,composeDomShadowTransform} from "../../src/adapters/renderer/dom-keyframes.js";
import {creaturePresentationForViewV2} from "../../src/contracts/creature-presentation-binding-v2.js";

const transfer=JSON.parse(readFileSync(new URL("../../data/capture/showcase/crea-loup.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
const front=creaturePresentationForViewV2(transfer.draft.presentation,"opponent");
const back=creaturePresentationForViewV2(transfer.draft.presentation,"player");
const cssVar="--combat-arena-author-offset-scale";

test("RED: published wolf still owns +60px Y opponent, zero player, same authored display scales",()=>{
  assert.deepEqual(front.position,{x:0,y:60});
  assert.deepEqual(back.position,{x:0,y:0});
  assert.equal(front.displayScale,0.8);
  assert.equal(back.displayScale,1.2);
});

test("RED: the real DOM actor and shadow transform project both authored offsets against one arena factor, but never scale movement transients",()=>{
  const actor={id:"wolf",position:front.position,scale:front.displayScale,positionScaleVar:cssVar};
  const body=composeDomTransform(actor,{translateX:5,translateY:13});
  const shadow=composeDomShadowTransform(actor,{translateX:5,translateY:13});
  for(const value of [body,shadow]){
    assert.match(value,/calc\(0px \* var\(--combat-arena-author-offset-scale, 1\) \+ 5px\)/);
    assert.match(value,/calc\(60px \* var\(--combat-arena-author-offset-scale, 1\) \+ 13px\)/);
    assert.doesNotMatch(value,/73px/, "native approach motion must not be scaled with author placement");
  }
  // The standalone lab keeps its original transform contract untouched.
  assert.match(composeDomTransform({position:front.position,scale:0.8}),/translate3d\(0px, 60px, 0\)/);
  assert.match(composeDomShadowTransform({position:front.position,scale:0.8}),/translate3d\(0px, 60px, 0\)/);
});
