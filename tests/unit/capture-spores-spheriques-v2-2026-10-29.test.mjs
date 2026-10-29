import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const base=resolve(root,"assets/library/capture/sprites/skills/spores_spheriques_v2");
const catalog=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json")));
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const id="pack:capture:sprite-spores-expansives-projectile-sphere-02";

test("Approved original spherical spore cloud V2 is uniquely registered as caster-centered radial skill, not traveling projectile",()=>{
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==="sprite").length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 const matching=catalog.assets.filter(a=>a.id===id);
 assert.equal(matching.length,1);
 const asset=matching[0];
 assert.equal(asset.assetType,"sprite");
 assert.equal(asset.category,"skill");
 assert.ok(["combat","capture","editor"].every(x=>asset.compatibility.uses.includes(x)));
 assert.equal(asset.resource.file,"capture/sprites/skills/spores_spheriques_v2/spores_spheriques_autour_creature_atlas_12f.webp");
 assert.deepEqual([asset.resource.frameCount,asset.resource.frameMs,asset.resource.playbackMode],[12,100,"once"]);
 assert.equal(asset.resource.format,"sprite-strip");
 const source=JSON.parse(readFileSync(resolve(base,"manifest.json")));
 const sequence=JSON.parse(readFileSync(resolve(base,"sprite_skill_spores_spheriques_sequence_v2.json")));
 const prov=JSON.parse(readFileSync(resolve(base,"provenance.json")));
 assert.equal(source.id,id);
 assert.equal(source.presentationType,"radial-caster-cloud");
 assert.equal(source.centerOnCaster,true);
 assert.equal(source.travelsToTarget,false);
 assert.equal(sequence.id,id);
 assert.equal(sequence.centerOnCaster,true);
 assert.equal(sequence.travelsToTarget,false);
 assert.equal(sequence.presentationType,"radial-caster-cloud");
 assert.equal(sequence.playback_mode,"once");
 assert.equal(sequence.frame_ms,100);
 assert.equal(sequence.frames.length,12);
 assert.equal(prov.sourceArchiveSha256,"c7929d95dbbd1d456d81db1d3eb941a4fe0e77569448fd509d7cb7bd5073aa79");
 assert.equal(prov.sourceGitBlobSha,"f9aa7dc0b0668ca3c2d61ef3a65d39ee56960efc");
 assert.deepEqual(sequence.atlas,{file:"spores_spheriques_autour_creature_atlas_12f.webp",format:"sprite-strip",frameCount:12,frameWidth:512,frameHeight:512});
 const atlas=readFileSync(resolve(root,catalog.storage.libraryRoot,asset.resource.file));
 assert.equal(atlas.toString("ascii",0,4),"RIFF");
 assert.equal(atlas.toString("ascii",8,12),"WEBP");
 assert.equal(hash(atlas),prov.sourceFileSha256[sequence.atlas.file]);
 const frameSha=new Set();
 for(let i=1;i<=12;i++){
   const rel="frames/spores_spheriques_autour_creature_"+String(i).padStart(2,"0")+".webp";
   assert.equal(sequence.frames[i-1],rel);
   assert.equal(source.frameFiles[i-1],rel);
   const bytes=readFileSync(resolve(base,rel));
   assert.equal(bytes.toString("ascii",0,4),"RIFF");
   assert.equal(bytes.toString("ascii",8,12),"WEBP");
   assert.equal(hash(bytes),prov.sourceFileSha256[rel]);
   frameSha.add(hash(bytes));
 }
 assert.equal(frameSha.size,12);
 for(const rel of [sequence.preview,"planche_source_spores_spheriques.png","planche_spores_spheriques_12f.png"]){
   assert.ok(existsSync(resolve(base,rel)),rel);
   assert.equal(hash(readFileSync(resolve(base,rel))),prov.sourceFileSha256[rel]);
 }
});
