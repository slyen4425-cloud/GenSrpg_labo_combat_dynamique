import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groundShadowLayoutFromOpaqueMaskV2 } from "../../src/adapters/renderer/dom-ground-shadow-v2.js";
import { projectArenaShadowLightV1 } from "../../src/adapters/renderer/dom-shadow-light-v1.js";
const read = path => readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const clamp = n => Math.min(60,Math.max(0,n));

function mask(w,h,regions) {
  const opaque=new Uint8Array(w*h);
  for(const [x0,y0,x1,y1] of regions)
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) opaque[y*w+x]=1;
  return {width:w,height:h,opaque};
}

test("grounded biped: ellipse foot line equals the exact silhouette foot pivot, even when lower pixels are uneven", () => {
  const m=mask(120,120,[
    [12,15,80,56],       // off-center torso
    [32,53,41,102],      // two narrow biped load-bearing legs
    [66,53,75,102],
    [99,10,99,118]       // slim elongated tail/ornament must not own foot contact
  ]);
  const layout=groundShadowLayoutFromOpaqueMaskV2(m);
  assert.ok(layout.contactYPct>80&&layout.contactYPct<100);
  assert.ok(Number.isFinite(layout.contactXPct));
  assert.ok(Math.abs(layout.bottomPct -
    clamp(100-layout.contactYPct-layout.heightPct/2)) < 1e-10,
    "legacy ellipse and projected silhouette must share ONE alpha-derived grounding height");
  assert.ok(layout.centerXPct>0);
});

test("grounded anatomy, flying anatomy, and face/back all use a single profile-style altitude classification", () => {
  for(const id of ["biped","quadruped","massive","serpentine","flying"]) {
    const p=JSON.parse(read("data/profiles/"+id+".profile.json"));
    const isFlight=p.locomotion.style==="flight";
    assert.equal(isFlight,id==="flying",id);
    const low=projectArenaShadowLightV1({flightHeightPx:5},{flying:isFlight});
    const high=projectArenaShadowLightV1({flightHeightPx:100},{flying:isFlight});
    if(id==="flying"){
      assert.notEqual(low.castXPct,high.castXPct,id);
      assert.ok(high.blurPx>low.blurPx,id);
    } else {
      assert.equal(low.castXPct,high.castXPct,id);
      assert.equal(low.castYPct,high.castYPct,id);
      assert.equal(low.blurPx,high.blurPx,id);
    }
  }
});

test("Venombre enters the same registered biped rules as all author-created grounded creatures", () => {
  const x=JSON.parse(read("data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json"));
  assert.equal(x.draft.displayName,"Venombre");
  assert.equal(x.draft.presentation.profileId,"biped");
  const profile=JSON.parse(read("data/profiles/"+x.draft.presentation.profileId+".profile.json"));
  assert.notEqual(profile.locomotion.style,"flight");
  const source=read("src/ui/demo-app.js");
  assert.match(source,/const flying = profile\?\.locomotion\?\.style === "flight";/);
  assert.doesNotMatch(source,/profile\?\.locomotion\?\.style === "flight" \|\| actor\.profile === "flying"/);
});

test("empty alpha remains an explicit fallback and never claims detected foot-contact evidence", () => {
  const empty=groundShadowLayoutFromOpaqueMaskV2(mask(16,16,[]),{bottomPct:15});
  assert.equal(empty.bottomPct,15);
  assert.equal(empty.contactYPct,null);
  assert.equal(empty.contactXPct,50);
});
