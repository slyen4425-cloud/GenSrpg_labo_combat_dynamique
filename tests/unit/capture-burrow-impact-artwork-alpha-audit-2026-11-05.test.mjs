import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inspectSpritePng} from "../../scripts/validate-sprite-safe-margins.mjs";

const pathOf = i => new URL("../../assets/library/capture/sprites/skills/burrow_terrain/impact/frames/sprite_burrow_impact_"+String(i).padStart(2,"0")+".png",import.meta.url);

test("20 authentic underground impact frames retain margins and no isolated upper ghost strip",()=>{
  for(let i=1;i<=20;i++){
    // Legacy natural dust animation contains some legitimately protruding
    // fragments: 20px is its historical safe edge. This is NOT a blanket
    // cropping mandate for the first 14 frames.
    const r=inspectSpritePng(readFileSync(pathOf(i)),{size:512,margin:20});
    assert.ok(r.visiblePixels>1000,"original eruption disappeared: frame "+i);
    if(i>=15)assert.ok(r.margins[1]>=100,
      "frame "+i+" still contains a detached translucent band at the top");
  }
});
test("public impact WebP atlas remains 20 frames of 384px with correct RIFF header",()=>{
  const bytes=readFileSync(new URL("../../assets/library/capture/sprites/skills/burrow_terrain/impact/sprite_burrow_impact_atlas.webp",import.meta.url));
  assert.equal(bytes.toString("ascii",0,4),"RIFF");
  assert.equal(bytes.toString("ascii",8,12),"WEBP");
  assert.ok(bytes.length>10000,"atlas must not be blank");
  const v=bytes.indexOf(Buffer.from("VP8X"));
  assert.ok(v>0,"alpha-capable VP8X container required");
  const width=1+bytes.readUIntLE(v+12,3);
  const height=1+bytes.readUIntLE(v+15,3);
  assert.equal(width,7680);
  assert.equal(height,384);
});
