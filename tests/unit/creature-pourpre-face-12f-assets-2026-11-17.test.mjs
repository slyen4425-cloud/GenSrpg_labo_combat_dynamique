import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const root="assets/library/capture/creatures/creature_pourpre/animations/";
const catalog=JSON.parse(readFileSync("data/assets/catalog/global-visual-assets.v1.json","utf8"));
const assets=catalog.assets;
const ids=assets.map(a=>a.id);
const read=p=>readFileSync(p);
const sha=b=>createHash("sha256").update(b).digest("hex");

test("pourpre has distinct front animations without overwriting violet or back animations",()=>{
  assert.equal(new Set(ids).size,ids.length,"all catalog asset IDs unique");
  assert.equal(catalog.counts.assets,assets.length);
  assert.equal(catalog.counts.sprites,assets.filter(a=>a.assetType==="sprite").length);
  for(const id of ["pack:capture:creature-pourpre-player-01","pack:capture:creature-pourpre-opponent-01","pack:capture:creature-pourpre-movement-player-8-v1","pack:capture:creature-pourpre-attack-player-8-v1","pack:capture:creature-violette-movement-opponent-8-v1","pack:capture:creature-violette-attack-opponent-8-v1"])
    assert.ok(ids.includes(id),"Existing asset missing: "+id);
  assert.ok(ids.includes("pack:capture:creature-pourpre-movement-opponent-12-v1"));
  assert.ok(ids.includes("pack:capture:creature-pourpre-attack-opponent-12-v1"));
});

for(const [action,playback] of [["movement","loop"],["attack","once"]]){
  test("pourpre face "+action+" has 12 real RGBA 512px frames, preview and atlas",()=>{
    const id="pack:capture:creature-pourpre-"+action+"-opponent-12-v1";
    const rows=assets.filter(a=>a.id===id);
    assert.equal(rows.length,1,"must have exactly one record");
    const asset=rows[0];
    assert.equal(asset.assetType,"sprite");
    assert.equal(asset.category,"creature");
    assert.ok(asset.tags.includes("pourpre")&&asset.tags.includes("opponent")&&asset.tags.includes(action));
    assert.equal(asset.resource.playbackMode,playback);
    assert.equal(asset.resource.frameCount,12);
    assert.equal(asset.resource.frameWidth,512);
    assert.equal(asset.resource.frameHeight,512);
    assert.deepEqual(asset.compatibility.uses,["combat","capture","editor"]);
    assert.equal(asset.resource.format,"sprite-strip");
    assert.equal(asset.resource.mime,"image/webp");
    assert.equal(asset.resource.frameDurationsMs.length,12);
    if(action==="movement"){
      assert.ok(asset.resource.frameDurationsMs.every(n=>n===83));
      assert.equal(asset.resource.frameMs,83);
    } else {
      assert.deepEqual(asset.resource.frameDurationsMs,[110,100,90,90,85,75,110,95,95,110,130,430]);
      assert.equal(asset.resource.frameMs,100);
    }
    const prefix=root+action+"/opponent/";
    const manifest=JSON.parse(read(prefix+action+".manifest.json"));
    assert.equal(manifest.frameCount,12);
    assert.equal(manifest.firstFrameReplacedWithCanonicalMaster,true);
    assert.equal(manifest.otherSourceFramesRepositionedUpPx,20);
    assert.equal(manifest.frameSha256Png.length,12);
    assert.equal(manifest.sourceFrameSha256.length,12);
    assert.equal(manifest.margins.length,12);
    let hashes=[];
    for(let i=1;i<=12;i++){
      const filename=prefix+"frames/creature_pourpre_"+action+"_opponent_"+String(i).padStart(2,"0")+".png";
      const b=read(filename);
      assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
      assert.equal(b.readUInt32BE(16),512);
      assert.equal(b.readUInt32BE(20),512);
      assert.equal(b[25],6,"RGBA PNG");
      assert.equal(sha(b),manifest.frameSha256Png[i-1]);
      assert.ok(Math.min(...manifest.margins[i-1])>=42,"transparent margin");
      hashes.push(sha(b));
    }
    assert.equal(new Set(hashes).size,12,"the 12 frames must be different");
    assert.ok(asset.resource.file.startsWith("capture/creatures/creature_pourpre/animations/"+action+"/opponent/"));
    for(const p of ["assets/library/"+asset.resource.file,prefix+"previews/creature_pourpre_"+action+"_opponent_12_preview.webp"]){
      const b=read(p);
      assert.equal(b.toString("ascii",0,4),"RIFF");
      assert.equal(b.toString("ascii",8,12),"WEBP");
      assert.ok(b.byteLength>10000,"real WebP must be nonempty");
    }
  });
}
