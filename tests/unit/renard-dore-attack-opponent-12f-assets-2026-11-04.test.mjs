import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
const id="pack:capture:creature-renard-magique-dore-attack-opponent-12-v1";
const base="assets/library/capture/creatures/renard_magique_dore/animations/attack/opponent";
const atlas="capture/creatures/renard_magique_dore/animations/attack/opponent/atlases/renard_magique_dore_attaque_adversaire_12f.webp";
const sha=x=>createHash("sha256").update(x).digest("hex");

test("Golden fox attack opponent: 1 canonical asset, attack once not movement",()=>{
  const catalog=JSON.parse(readFileSync("data/assets/catalog/global-visual-assets.v1.json","utf8"));
  assert.equal(catalog.storage.branch,"global-assets");
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
  const matches=catalog.assets.filter(x=>x.id===id);
  assert.equal(matches.length,1);
  const asset=matches[0];
  assert.equal(asset.category,"creature");
  assert.equal(asset.assetType,"sprite");
  assert.equal(asset.resource.file,atlas);
  assert.equal(asset.resource.format,"sprite-strip");
  assert.equal(asset.resource.frameCount,12);
  assert.equal(asset.resource.frameMs,115);
  assert.equal(asset.resource.playbackMode,"once");
  assert.ok(existsSync(resolve("assets/library",asset.resource.file)));
  assert.ok(catalog.assets.some(x=>x.id==="pack:capture:creature-renard-magique-dore-movement-player-12-v1"),
    "approved movement/player must be preserved");
});

test("Golden fox opponent attack: 12 approved PNG frames, correct manifest and 66px margins",()=>{
  const m=JSON.parse(readFileSync(resolve(base,"attack.manifest.json"),"utf8"));
  assert.equal(m.schema,"capture-creature-animation-v1");
  assert.equal(m.assetId,id);
  assert.equal(m.creatureId,"renard_magique_dore");
  assert.equal(m.action,"attack");
  assert.equal(m.view,"opponent");
  assert.equal(m.variant,"ondulation-spirituelle");
  assert.equal(m.direction,"left");
  assert.equal(m.frameCount,12);
  assert.deepEqual(m.frameSize,[512,512]);
  assert.deepEqual(m.frameDurationsMs,Array(12).fill(115));
  assert.equal(m.playbackMode,"once");
  assert.equal(m.returnToIdle,true);
  assert.equal(m.holdLastFrame,false);
  assert.equal(m.safeMarginMinPx,42);
  assert.equal(m.frame01MasterIdentical,false,"never invent master identity");
  assert.equal(m.sourceGitBlob,"3355a2f465d03db5a617de284ef1253a602c16ea");
  assert.equal(m.sourceArchiveSha256,"7106cbcdbd2d97a985dd496d79549cf999702bfae6b88aa322bea4f03a436c3b");
  assert.equal(m.frames.length,12);
  assert.equal(new Set(m.frames.map(x=>x.sha256)).size,12);
  let minMargin=Infinity;
  for(const [i,frame] of m.frames.entries()){
    assert.equal(frame.index,i);
    minMargin=Math.min(minMargin,...frame.marginsLTRB);
    assert.ok(frame.marginsLTRB.every(x=>x>=42));
    const png=readFileSync(resolve(base,frame.file));
    assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16),512);
    assert.equal(png.readUInt32BE(20),512);
    assert.equal(png[25],6);
    assert.equal(sha(png),frame.sha256);
  }
  assert.equal(minMargin,66);
  const webp=readFileSync(resolve(base,m.atlas.file));
  assert.equal(webp.toString("ascii",0,4),"RIFF");
  assert.equal(webp.toString("ascii",8,12),"WEBP");
  assert.equal(sha(webp),m.atlas.sha256);
  for(const rel of Object.values(m.previews))assert.ok(existsSync(resolve(base,rel)));
  assert.equal(sha(readFileSync(resolve(base,m.previews.animatedWebp))),
    "bb915db0f4ce66059e96f9bb293639f0d674e179d05a8245f064144157b73f57");
});
